// Arquivo: frontend/src/pages/ChatPage.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './ChatPage.module.css';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { Paperclip, X, Settings, Users as UsersIcon } from 'lucide-react'; // Adicionado UsersIcon
import { CreateGroupModal } from '../components/CreateGroupModal';

interface User {
  id: string;
  name: string;
  isCurrentUser: boolean;
  isOnline: boolean;
  banned?: boolean; // NOVO: Propriedade 'banned'
}

interface Group {
  id: string;
  name: string;
  adminsId: string[];
  members: string[];
  pendingRequests: string[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isArquivo?: boolean;
}

// Para o propósito de demonstração, vamos assumir que o primeiro usuário criado é um "super-admin"
// Em uma aplicação real, você teria um sistema de roles mais robusto.
const SUPER_ADMIN_USERNAME = 'admin'; // Substitua pelo nome de usuário do seu "super-admin" ou pelo ID.


export function ChatPage() {
    const { user, token, logout } = useAuth();
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeChat, setActiveChat] = useState<{ type: 'private' | 'group'; id: string; name: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [showGroupManagement, setShowGroupManagement] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    // NOVO ESTADO: Para controlar a visibilidade do gerenciamento de usuários
    const [showUserManagement, setShowUserManagement] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Atualizado: Obter a lista de usuários com o status de banimento
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

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 3000);
        return () => clearInterval(intervalId);

    }, [activeChat, token]);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);


    const handleSelectChat = (chat: { type: 'private' | 'group'; id: string; name: string }) => {
        setActiveChat(chat);
        setMessages([]);
        setError('');
        setSelectedFile(null);
        setNewMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setShowGroupManagement(false);
        setShowUserManagement(false); // Fechar gerenciamento de usuário ao mudar de chat
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedFile) {
            if (!activeChat || !user || !token) return;

            const formData = new FormData();
            formData.append('file', selectedFile);

            const tempFileMessage: ChatMessage = {
                id: `temp-file-${Date.now()}`,
                senderId: user.id,
                content: selectedFile.name,
                timestamp: new Date().toISOString(),
                isArquivo: true,
            };
            setMessages(prevMessages => [...prevMessages, tempFileMessage]);

            try {
                if (activeChat.type === 'private') {
                    await api.sendPrivateFile(activeChat.id, formData, token);
                } else {
                    await api.sendGroupFile(activeChat.id, formData, token);
                }
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } catch (err) {
                console.error("Erro ao enviar arquivo:", err);
                setError("Falha no envio do arquivo.");
                setMessages(prev => prev.filter(m => m.id !== tempFileMessage.id));
            }
            return;
        }

        if (!newMessage.trim() || !activeChat || !user) return;

        const messageContent = newMessage;
        setNewMessage('');

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
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            setError("Falha no envio da mensagem.");
            setNewMessage(messageContent);
            setMessages(prev => prev.filter(m => m.id !== tempTextMessage.id));
        }
    };

    const activeGroupDetails = useMemo(() => {
        if (activeChat?.type === 'group') {
            return groups.find(g => g.id === activeChat.id);
        }
        return null;
    }, [activeChat, groups]);

    const isCurrentUserAdmin = useMemo(() => {
        if (!user || !activeGroupDetails) return false;
        return activeGroupDetails.adminsId.includes(user.id);
    }, [user, activeGroupDetails]);

    // NOVO: Verifica se o usuário logado é o "super-admin" para gerenciar usuários
    const isSuperAdmin = useMemo(() => {
        return user?.name === SUPER_ADMIN_USERNAME;
    }, [user]);

    const handleApproveRequest = async (memberId: string) => {
        if (!token || !activeGroupDetails) return;
        try {
            await api.approveMember(activeGroupDetails.id, memberId, token);
            const updatedGroups = await api.getMyGroups(token);
            setGroups(updatedGroups);
            setError('');
        } catch (err: any) {
            console.error("Erro ao aprovar membro:", err);
            setError(err.message || "Falha ao aprovar membro.");
        }
    };

    const handleRejectRequest = async (memberId: string) => {
        if (!token || !activeGroupDetails) return;
        try {
            await api.rejectMember(activeGroupDetails.id, memberId, token);
            const updatedGroups = await api.getMyGroups(token);
            setGroups(updatedGroups);
            setError('');
        } catch (err: any) {
            console.error("Erro ao rejeitar membro:", err);
            setError(err.message || "Falha ao rejeitar membro.");
        }
    };

    const handleBanMember = async (memberId: string) => {
        if (!token || !activeGroupDetails || memberId === user?.id) {
            setError("Não é possível banir a si mesmo.");
            return;
        }
        if (!window.confirm(`Tem certeza que deseja banir este membro do grupo?`)) return;

        try {
            await api.banMember(activeGroupDetails.id, memberId, token);
            const updatedGroups = await api.getMyGroups(token);
            setGroups(updatedGroups);
            if (activeChat?.id === memberId) {
                setActiveChat(null);
                setMessages([]);
            }
            setError('');
        } catch (err: any) {
            console.error("Erro ao banir membro:", err);
            setError(err.message || "Falha ao banir membro.");
        }
    };

    const handleDeleteGroup = async () => {
        if (!token || !activeGroupDetails) return;
        if (!window.confirm(`ATENÇÃO: Tem certeza que deseja excluir o grupo "${activeGroupDetails.name}"? Esta ação é irreversível!`)) {
            return;
        }

        try {
            await api.deleteGroup(activeGroupDetails.id, token);
            setActiveChat(null);
            setMessages([]);
            const updatedGroups = await api.getMyGroups(token);
            setGroups(updatedGroups);
            setError('');
            setShowGroupManagement(false);
        } catch (err: any) {
            console.error("Erro ao excluir grupo:", err);
            setError(err.message || "Falha ao excluir o grupo.");
        }
    };

    // NOVAS FUNÇÕES: Banir e Desbanir usuário da aplicação
    const handleBanUserClick = async (userId: string, userName: string) => {
        if (!token || userId === user?.id) {
            setError("Não é possível banir a si mesmo.");
            return;
        }
        if (!window.confirm(`Tem certeza que deseja BANIR o usuário "${userName}" da aplicação? Ele não poderá mais fazer login.`)) return;

        try {
            await api.banUser(userId, token);
            // Re-fetch users to update their banned status in the list
            const updatedUsers = await api.getUsers(token);
            setUsers(updatedUsers);
            setError('');
        } catch (err: any) {
            console.error("Erro ao banir usuário:", err);
            setError(err.message || "Falha ao banir usuário.");
        }
    };

    const handleUnbanUserClick = async (userId: string, userName: string) => {
        if (!token) return;
        if (!window.confirm(`Tem certeza que deseja DESBANIR o usuário "${userName}" da aplicação? Ele poderá fazer login novamente.`)) return;

        try {
            await api.unbanUser(userId, token);
            const updatedUsers = await api.getUsers(token);
            setUsers(updatedUsers);
            setError('');
        } catch (err: any) {
            console.error("Erro ao desbanir usuário:", err);
            setError(err.message || "Falha ao desbanir usuário.");
        }
    };


    const handleGroupCreatedOrClosed = async () => {
        setIsCreateGroupModalOpen(false);
        if (token) {
            try {
                const groupsData = await api.getMyGroups(token);
                setGroups(groupsData);
            } catch (err) {
                console.error("Erro ao recarregar grupos após criação:", err);
            }
        }
    };


    return (
        <div className={styles.chatLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Bem-vindo, {user?.name}</h3>
                    <button onClick={logout} className={styles.logoutButton}>Sair</button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.contactsList}>
                    <h4 className={styles.listTitle}>Usuários</h4>
                    {/* NOVO: Botão para gerenciar usuários (visível para super-admin) */}
                    {isSuperAdmin && (
                        <button
                            className={styles.manageUsersButton} // Adicionar este estilo
                            onClick={() => setShowUserManagement(prev => !prev)}
                        >
                            <UsersIcon size={16} style={{ marginRight: '5px' }} /> Gerenciar Usuários
                        </button>
                    )}
                    {users.filter(u => !u.isCurrentUser).map((u) => (
                        <div key={u.id} className={`${styles.contactItem} ${activeChat?.id === u.id ? styles.active : ''}`} onClick={() => handleSelectChat({ type: 'private', id: u.id, name: u.name })}>
                           <span className={u.isOnline ? styles.onlineIndicator : styles.offlineIndicator}></span>
                           {u.name}
                           {u.banned && <span className={styles.bannedIndicator}>BANIDO</span>} {/* NOVO: Indicador de banido */}
                        </div>
                    ))}
                    <h4 className={styles.listTitle}>Grupos</h4>
                    <button
                        className={styles.createGroupButton}
                        onClick={() => setIsCreateGroupModalOpen(true)}
                    >
                        + Criar Novo Grupo
                    </button>
                    {groups.map((group) => (
                        <div key={group.id} className={`${styles.contactItem} ${activeChat?.id === group.id ? styles.active : ''}`} onClick={() => handleSelectChat({ type: 'group', id: group.id, name: group.name })}>
                            {group.name}
                            {group.pendingRequests && group.pendingRequests.length > 0 && isCurrentUserAdmin && (
                                <span className={styles.pendingRequestsBadge}>({group.pendingRequests.length} pendentes)</span>
                            )}
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
                            {activeChat.type === 'group' && isCurrentUserAdmin && (
                                <button
                                    className={styles.manageGroupButton}
                                    onClick={() => setShowGroupManagement(prev => !prev)}
                                    title="Gerenciar Grupo"
                                >
                                    <Settings size={20} />
                                </button>
                            )}
                        </header>

                        {/* Seção de Gerenciamento de Grupo */}
                        {activeChat.type === 'group' && isCurrentUserAdmin && showGroupManagement && activeGroupDetails && (
                            <div className={styles.groupManagementSection}>
                                <h3>Gerenciar Grupo: {activeGroupDetails.name}</h3>

                                <div className={styles.managementCategory}>
                                    <h4>Solicitações Pendentes ({activeGroupDetails.pendingRequests?.length || 0})</h4>
                                    {activeGroupDetails.pendingRequests && activeGroupDetails.pendingRequests.length > 0 ? (
                                        <ul className={styles.managementList}>
                                            {activeGroupDetails.pendingRequests.map(reqId => {
                                                const requestingUser = users.find(u => u.id === reqId);
                                                return (
                                                    <li key={reqId} className={styles.managementItem}>
                                                        {requestingUser?.name || 'Usuário desconhecido'}
                                                        <div className={styles.managementActions}>
                                                            <button onClick={() => handleApproveRequest(reqId)} className={styles.actionButton + ' ' + styles.approveButton}>Aprovar</button>
                                                            <button onClick={() => handleRejectRequest(reqId)} className={styles.actionButton + ' ' + styles.rejectButton}>Rejeitar</button>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>Nenhuma solicitação pendente.</p>
                                    )}
                                </div>

                                <div className={styles.managementCategory}>
                                    <h4>Membros do Grupo ({activeGroupDetails.members?.length || 0})</h4>
                                    <ul className={styles.managementList}>
                                        {activeGroupDetails.members.map(memberId => {
                                            const memberUser = users.find(u => u.id === memberId);
                                            return (
                                                <li key={memberId} className={styles.managementItem}>
                                                    {memberUser?.name || 'Usuário desconhecido'} {memberId === user?.id ? '(Você)' : ''}
                                                    {isCurrentUserAdmin && memberId !== user?.id && (
                                                        <button onClick={() => handleBanMember(memberId)} className={styles.actionButton + ' ' + styles.banButton}>Banir</button>
                                                    )}
                                                    {activeGroupDetails.adminsId.includes(memberId) && <span className={styles.adminBadge}>Admin</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div className={styles.managementCategory}>
                                    <h4>Ações do Grupo</h4>
                                    <button
                                        onClick={handleDeleteGroup}
                                        className={styles.deleteGroupButton + ' ' + styles.actionButton}
                                    >
                                        Excluir Grupo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOVO: Seção de Gerenciamento de Usuários (visível apenas para o super-admin) */}
                        {isSuperAdmin && showUserManagement && (
                            <div className={styles.userManagementSection}>
                                <h3>Gerenciamento de Usuários da Aplicação</h3>
                                <div className={styles.managementCategory}>
                                    <h4>Todos os Usuários ({users.length})</h4>
                                    <ul className={styles.managementList}>
                                        {users.map(u => (
                                            <li key={u.id} className={styles.managementItem}>
                                                {u.name} {u.isCurrentUser ? '(Você)' : ''}
                                                {u.banned && <span className={styles.bannedIndicator}>BANIDO</span>}
                                                <div className={styles.managementActions}>
                                                    {u.id !== user?.id && !u.banned && ( // Não pode banir a si mesmo ou já banidos
                                                        <button
                                                            onClick={() => handleBanUserClick(u.id, u.name)}
                                                            className={styles.actionButton + ' ' + styles.banButton}
                                                        >
                                                            Banir
                                                        </button>
                                                    )}
                                                    {u.id !== user?.id && u.banned && ( // Não pode desbanir a si mesmo ou não banidos
                                                        <button
                                                            onClick={() => handleUnbanUserClick(u.id, u.name)}
                                                            className={styles.actionButton + ' ' + styles.approveButton} // Usar estilo verde para desbanir
                                                        >
                                                            Desbanir
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className={styles.chatWindow} ref={chatWindowRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={`${styles.messageBubble} ${msg.senderId === user?.id ? styles.myMessage : styles.theirMessage}`}>
                                    <div className={styles.messageContent}>
                                      {msg.isArquivo ? (
                                        <p>📎 Arquivo: <a
                                            href={`http://localhost:3000/${msg.content}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'lightblue', textDecoration: 'underline', cursor: 'pointer' }}
                                          >
                                            {msg.content.split(/[/\\]/).pop()}
                                          </a>
                                        </p>
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

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    setSelectedFile(e.target.files ? e.target.files[0] : null);
                                    setNewMessage('');
                                }}
                            />
                            <button
                                type="button"
                                className={styles.attachButton}
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

            {isCreateGroupModalOpen && (
                <CreateGroupModal
                    onClose={handleGroupCreatedOrClosed}
                    onGroupCreated={handleGroupCreatedOrClosed}
                />
            )}
        </div>
    );
}