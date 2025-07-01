// Arquivo: frontend/src/pages/ChatPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatPage.module.css';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { Paperclip, X } from 'lucide-react'; // Importe o ícone X para remover o arquivo

// Interfaces para definir a estrutura dos nossos dados
interface User {
  id: string;
  name: string;
  isCurrentUser: boolean;
  isOnline: boolean;
}

interface Group {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string; // Isso espera uma string ISO
  isArquivo?: boolean; // Adicionado para indicar se é um arquivo
}

export function ChatPage() {
    const { user, token, logout } = useAuth();
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Referência para o input de arquivo

    // Estados para gerenciar a UI e os dados
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeChat, setActiveChat] = useState<{ type: 'private' | 'group'; id: string; name: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // NOVO ESTADO para o arquivo selecionado

    // Efeito para buscar os dados da barra lateral (usuários e grupos)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, groupsData] = await Promise.all([
                    api.getUsers(token),
                    api.getMyGroups(token)
                ]);
                setUsers(usersData);
                setGroups(groupsData);
            } catch (err: any) {
                setError('Falha ao carregar dados da barra lateral.');
                console.error(err);
            }
        };
        if (token) {
            fetchData();
        }
    }, [token]);

    // Efeito para buscar as mensagens e iniciar o polling quando um chat é selecionado
    useEffect(() => {
        if (!activeChat) return;

        const fetchMessages = async () => {
            try {
                const messagesData = activeChat.type === 'private'
                    ? await api.getPrivateMessages(activeChat.id, token)
                    : await api.getGroupMessages(activeChat.id, token);
                
                console.log("Mensagens recebidas do backend:", messagesData); 

                setMessages(messagesData);
            } catch (err) {
                console.error("Falha ao buscar mensagens", err);
                setError("Não foi possível carregar as mensagens.");
            }
        };

        fetchMessages(); // Busca as mensagens imediatamente

        // Configura o polling para buscar novas mensagens a cada 3 segundos
        const intervalId = setInterval(fetchMessages, 3000);

        // Função de limpeza que é executada quando o chat ativo muda
        return () => clearInterval(intervalId);

    }, [activeChat, token]);
    
    // Efeito para rolar a janela de chat para a última mensagem
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);


    // Função para mudar o chat ativo ao clicar na barra lateral
    const handleSelectChat = (chat: { type: 'private' | 'group'; id: string; name: string }) => {
        setActiveChat(chat);
        setMessages([]); // Limpa as mensagens antigas para evitar um "flash" de conteúdo
        setError('');
        setSelectedFile(null); // Limpa arquivo selecionado ao mudar de chat
        setNewMessage(''); // Limpa mensagem de texto
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Limpa o input de arquivo nativo
        }
    };

    // Função para lidar com o envio de novas mensagens (texto ou arquivo)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // Se houver um arquivo selecionado, prioriza o envio do arquivo
        if (selectedFile) {
            if (!activeChat || !user || !token) return; // Precisa de token para upload

            const formData = new FormData();
            formData.append('file', selectedFile); // 'file' deve corresponder ao nome do campo no backend (@UploadedFile('file'))

            // Atualização Otimista para arquivo
            const tempFileMessage: ChatMessage = {
                id: `temp-file-${Date.now()}`,
                senderId: user.id,
                content: selectedFile.name, // Exibe o nome do arquivo otimisticamente
                timestamp: new Date().toISOString(),
                isArquivo: true,
            };
            setMessages(prevMessages => [...prevMessages, tempFileMessage]);

            try {
                if (activeChat.type === 'private') {
                    await api.sendPrivateFile(activeChat.id, formData, token); // Chama nova função da API
                } else {
                    // TODO: Implementar upload de arquivo para grupo se necessário no backend
                    console.warn("Envio de arquivo para grupos ainda não implementado no backend.");
                    setError("Envio de arquivo para grupos não suportado.");
                    setMessages(prev => prev.filter(m => m.id !== tempFileMessage.id)); // Remove otimista se não suportado
                    return;
                }
                setSelectedFile(null); // Limpa o estado do arquivo selecionado
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Limpa o input de arquivo nativo
                }
            } catch (err) {
                console.error("Erro ao enviar arquivo:", err);
                setError("Falha no envio do arquivo.");
                setMessages(prev => prev.filter(m => m.id !== tempFileMessage.id)); // Remove otimista em caso de erro
            }
            return; // Sai da função após tentar enviar o arquivo
        }

        // Lógica para enviar mensagem de texto (existente)
        if (!newMessage.trim() || !activeChat || !user) return;

        const messageContent = newMessage;
        setNewMessage(''); // Limpa o input imediatamente

        // Atualização Otimista: mostra a mensagem na tela antes mesmo da confirmação da API
        const tempTextMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            senderId: user.id,
            content: messageContent,
            timestamp: new Date().toISOString(),
        };
        setMessages(prevMessages => [...prevMessages, tempTextMessage]);

        try {
            if (activeChat.type === 'private') {
                await api.sendPrivateMessage(activeChat.id, messageContent, token);
            } else {
                await api.sendGroupMessage(activeChat.id, messageContent, token);
            }
            // O polling vai substituir a mensagem temporária pela mensagem real do servidor.
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            setError("Falha no envio da mensagem.");
            setNewMessage(messageContent); // Devolve o texto para o input em caso de erro
            // Remove a mensagem temporária se o envio falhar
            setMessages(prev => prev.filter(m => m.id !== tempTextMessage.id));
        }
    };

    return (
        <div className={styles.chatLayout}>
            {/* --- Barra Lateral --- */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Bem-vindo, {user?.name}</h3>
                    <button onClick={logout} className={styles.logoutButton}>Sair</button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.contactsList}>
                    <h4 className={styles.listTitle}>Usuários</h4>
                    {users.filter(u => !u.isCurrentUser).map((u) => (
                        <div key={u.id} className={`${styles.contactItem} ${activeChat?.id === u.id ? styles.active : ''}`} onClick={() => handleSelectChat({ type: 'private', id: u.id, name: u.name })}>
                           <span className={u.isOnline ? styles.onlineIndicator : styles.offlineIndicator}></span>
                           {u.name}
                        </div>
                    ))}
                    <h4 className={styles.listTitle}>Grupos</h4>
                    {groups.map((group) => (
                        <div key={group.id} className={`${styles.contactItem} ${activeChat?.id === group.id ? styles.active : ''}`} onClick={() => handleSelectChat({ type: 'group', id: group.id, name: group.name })}>
                            {group.name}
                        </div>
                    ))}
                </div>
            </aside>

            {/* --- Janela Principal do Chat --- */}
            <main className={styles.mainContent}>
                {activeChat ? (
                    <>
                        <header className={styles.chatHeader}>
                            <h2>{activeChat.name}</h2>
                        </header>
                        <div className={styles.chatWindow} ref={chatWindowRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={`${styles.messageBubble} ${msg.senderId === user?.id ? styles.myMessage : styles.theirMessage}`}>
                                    <div className={styles.messageContent}>
                                      {msg.isArquivo ? (
                                        <p>📎 Arquivo: {msg.content.split('/').pop()}</p> // Exibe o nome do arquivo
                                      ) : (
                                        <p>{msg.content}</p>
                                      )}
                                      <span className={styles.messageTimestamp}>
                                        {new Date(msg.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className={styles.messageInputArea}>
                            {selectedFile ? (
                                <div className={styles.selectedFilePreview}>
                                    <span>📎 {selectedFile.name}</span>
                                    <button type="button" onClick={() => setSelectedFile(null)} className={styles.removeFileButton}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className={styles.messageInput}
                                    placeholder="Digite sua mensagem..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                            )}
                            
                            {/* Input de arquivo oculto */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    setSelectedFile(e.target.files ? e.target.files[0] : null);
                                    setNewMessage(''); // Limpa a mensagem de texto ao selecionar arquivo
                                }}
                            />
                            {/* Botão/ícone para acionar o input de arquivo */}
                            <button
                                type="button"
                                className={styles.attachButton} // Estilo CSS a ser adicionado
                                onClick={() => fileInputRef.current?.click()}
                                title="Anexar arquivo"
                            >
                                <Paperclip size={20} />
                            </button>
                            <button type="submit" className={styles.sendButton} disabled={!newMessage.trim() && !selectedFile}>Enviar</button>
                        </form>
                    </>
                ) : (
                    <div className={styles.placeholder}>
                        <p>Selecione um usuário ou grupo para começar a conversar.</p>
                    </div>
                )}
            </main>
        </div>
    );
}