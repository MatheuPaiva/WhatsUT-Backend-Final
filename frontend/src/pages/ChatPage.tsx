import React from 'react';
import styles from './ChatPage.module.css';
import { useAuth } from '../contexts/AuthContext'; // Usaremos para o logout e pegar o nome

export function ChatPage() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        // O redirecionamento para /login será automático por causa da Rota Protegida
    };

    return (
        <div className={styles.chatLayout}>
            {/* Coluna da Esquerda: Contatos e Grupos */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Bem-vindo, {user?.name}</h3>
                    <button onClick={handleLogout} style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>
                        Sair
                    </button>
                </div>

                <div className={styles.contactsList}>
                    <h4 className={styles.listTitle}>Usuários</h4>
                    {/* Lista de usuários virá aqui */}
                    <div className={styles.contactItem}>Usuário 1</div>
                    <div className={styles.contactItem}>Usuário 2</div>

                    <h4 className={styles.listTitle}>Grupos</h4>
                    {/* Lista de grupos virá aqui */}
                    <div className={styles.contactItem}>Grupo 1</div>
                </div>
            </aside>

            {/* Coluna da Direita: Janela de Chat Ativa */}
            <main className={styles.mainContent}>
                <div className={styles.chatWindow}>
                    {/* Mensagens do chat ativo virão aqui */}
                    <p>Selecione um usuário ou grupo para começar a conversar.</p>
                </div>
                <div className={styles.messageInputArea}>
                    <input type="text" className={styles.messageInput} placeholder="Digite sua mensagem..." />
                    <button className={styles.sendButton}>Enviar</button>
                </div>
            </main>
        </div>
    );
}