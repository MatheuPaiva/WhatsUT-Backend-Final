import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { useThemeContext } from '../contexts/ThemeContext';

// Importações do MUI
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, Divider, IconButton, TextField, Button, Avatar, Badge, Chip, Grid, Paper, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';

import {
    Logout, Send, AttachFile, GroupAdd, People, Message, AddComment, Brightness4, Brightness7,
    AdminPanelSettings, Block, CheckCircle
} from '@mui/icons-material';

// Interfaces
interface User { id: string; name: string; isCurrentUser: boolean; isOnline: boolean; banned?: boolean; }
interface Group { id: string; name: string; adminsId: string[]; members: string[]; pendingRequests: string[]; }
interface ChatMessage { id: string; senderId: string; content: string; timestamp: string; isArquivo?: boolean; }

const drawerWidth = 320;
const SUPER_ADMIN_USERNAME = 'admin';

export function ChatPage() {
    const { user, token, logout } = useAuth();
    const { mode, toggleColorMode } = useThemeContext();
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [privateConversations, setPrivateConversations] = useState<User[]>([]);
    const [activeChat, setActiveChat] = useState<{ type: 'private' | 'group'; id: string; name: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // Estados de UI e Modais
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
    const [error, setError] = useState('');

    const isSuperAdmin = useMemo(() => user?.name === SUPER_ADMIN_USERNAME, [user]);

    // Lógica de busca de dados
    const fetchData = async () => {
        if (!token) return;
        try {
            const [usersData, groupsData] = await Promise.all([api.getUsers(token), api.getMyGroups(token)]);
            setAllUsers(usersData);
            setGroups(groupsData);
        } catch (err) { console.error('Falha ao carregar dados:', err); }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (!activeChat || !token) { setMessages([]); return; }
        const fetchMessages = async () => {
            try {
                const apiCall = activeChat.type === 'private' ? api.getPrivateMessages : api.getGroupMessages;
                const messagesData = await apiCall(activeChat.id, token);
                setMessages(messagesData);
            } catch (err) { console.error("Falha ao buscar mensagens", err); }
        };
        fetchMessages();
        const intervalId = setInterval(fetchMessages, 2000);
        return () => clearInterval(intervalId);
    }, [activeChat, token]);

    useEffect(() => { if (chatWindowRef.current) chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; }, [messages]);
    
    // Handlers
    const handleStartNewConversation = (userToChat: User) => {
        if (!privateConversations.some(c => c.id === userToChat.id)) {
            setPrivateConversations(prev => [...prev, userToChat]);
        }
        setActiveChat({ type: 'private', id: userToChat.id, name: userToChat.name });
        setIsUsersModalOpen(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChat || !token || (!newMessage.trim() && !selectedFile)) return;
        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const apiCall = activeChat.type === 'private' ? api.sendPrivateFile : api.sendGroupFile;
                await apiCall(activeChat.id, formData, token);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                const apiCall = activeChat.type === 'private' ? api.sendPrivateMessage : api.sendGroupMessage;
                await apiCall(activeChat.id, newMessage, token);
                setNewMessage('');
            }
        } catch (err) { console.error('Falha no envio:', err); }
    };

    const handleBanToggle = async (userId: string, currentStatus: boolean | undefined) => {
        if (!token) return;
        const action = currentStatus ? 'desbanir' : 'banir';
        if (!window.confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
        try {
            setError('');
            const apiCall = currentStatus ? api.unbanUser : api.banUser;
            await apiCall(userId, token);
            fetchData(); // Atualiza a lista de usuários após a ação
        } catch (err: any) {
            setError(err.message || `Falha ao ${action} o usuário.`);
        }
    };

    // --- RENDERIZAÇÃO ---

    const drawerContent = (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Toolbar>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.dark' }}>{user?.name.charAt(0)}</Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>{user?.name}</Typography>
            <Tooltip title={`Mudar para modo ${mode === 'light' ? 'escuro' : 'claro'}`}><IconButton onClick={toggleColorMode}>{mode === 'dark' ? <Brightness7 /> : <Brightness4 />}</IconButton></Tooltip>
            <Tooltip title="Sair"><IconButton onClick={logout}><Logout /></IconButton></Tooltip>
        </Toolbar>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button fullWidth variant="contained" startIcon={<AddComment />} onClick={() => setIsUsersModalOpen(true)}>Nova Conversa</Button>
            {isSuperAdmin && (
                <Button fullWidth variant="contained" color="warning" startIcon={<AdminPanelSettings />} onClick={() => setIsUserManagementOpen(true)}>
                    Gerenciar Usuários
                </Button>
            )}
        </Box>
        <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
            <ListItem><Typography variant="overline" color="text.secondary">Conversas Ativas</Typography></ListItem>
            {privateConversations.map((u) => (
                <ListItem key={u.id} disablePadding>
                    <ListItemButton selected={activeChat?.id === u.id} onClick={() => setActiveChat({ type: 'private', id: u.id, name: u.name })}>
                        <ListItemIcon><Badge color={allUsers.find(au => au.id === u.id)?.isOnline ? "success" : "default"} variant="dot"><Avatar sx={{ bgcolor: 'secondary.main' }}>{u.name.charAt(0)}</Avatar></Badge></ListItemIcon>
                        <ListItemText primary={u.name} />
                    </ListItemButton>
                </ListItem>
            ))}
            <Divider sx={{ my: 1 }} /><ListItem><Typography variant="overline" color="text.secondary">Grupos</Typography></ListItem>
            {groups.map((group) => (
                <ListItem key={group.id} disablePadding>
                    <ListItemButton selected={activeChat?.id === group.id} onClick={() => setActiveChat({ type: 'group', id: group.id, name: group.name })}>
                        <ListItemIcon><Avatar><People /></Avatar></ListItemIcon>
                        <ListItemText primary={group.name} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}><Button fullWidth variant="outlined" startIcon={<GroupAdd />} onClick={() => setIsCreateGroupModalOpen(true)}>Criar Novo Grupo</Button></Box>
      </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>{drawerContent}</Drawer>
            
            <Dialog open={isUsersModalOpen} onClose={() => setIsUsersModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Iniciar Nova Conversa</DialogTitle>
                <DialogContent><List>{allUsers.filter(u => !u.isCurrentUser && !u.banned).map(u => (<ListItem key={u.id} disablePadding><ListItemButton onClick={() => handleStartNewConversation(u)}><ListItemIcon><Badge color={u.isOnline ? "success" : "default"} variant="dot"><Avatar>{u.name.charAt(0)}</Avatar></Badge></ListItemIcon><ListItemText primary={u.name} /></ListItemButton></ListItem>))}</List></DialogContent>
                <DialogActions><Button onClick={() => setIsUsersModalOpen(false)}>Cancelar</Button></DialogActions>
            </Dialog>

            <Dialog open={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Gerenciamento de Usuários</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <List>
                        {allUsers.map(u => (
                            <ListItem key={u.id} secondaryAction={
                                u.id !== user?.id && (
                                    u.banned ? (
                                        <Button variant="outlined" color="success" startIcon={<CheckCircle />} onClick={() => handleBanToggle(u.id, u.banned)}>Desbanir</Button>
                                    ) : (
                                        <Button variant="contained" color="error" startIcon={<Block />} onClick={() => handleBanToggle(u.id, u.banned)}>Banir</Button>
                                    )
                                )
                            }>
                                <ListItemIcon><Avatar>{u.name.charAt(0)}</Avatar></ListItemIcon>
                                <ListItemText primary={u.name} secondary={u.banned ? 'Usuário Banido' : (u.isOnline ? 'Online' : 'Offline')} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setIsUserManagementOpen(false)}>Fechar</Button></DialogActions>
            </Dialog>

            <CreateGroupModal open={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} onGroupCreated={fetchData} />

            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                {activeChat ? (
                    <>
                        <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 1, color: 'text.primary' }}>
                            <Toolbar>
                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{activeChat.name.charAt(0)}</Avatar>
                                <Typography variant="h6">{activeChat.name}</Typography>
                            </Toolbar>
                        </AppBar>
                        <Box ref={chatWindowRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === user?.id;
                                const senderName = allUsers.find(u => u.id === msg.senderId)?.name || 'Desconhecido';
                                const fileName = msg.content.split(/[/\\]/).pop() ?? '';
                                const fileUrl = `http://localhost:3000/${msg.content}`;
                                return (
                                    <Grid key={msg.id || index} container justifyContent={isMe ? 'flex-end' : 'flex-start'} sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5 }}>{isMe ? 'Você' : senderName}</Typography>
                                            <Paper elevation={3} sx={{ p: 1.5, borderRadius: isMe ? '20px 5px 20px 20px' : '5px 20px 20px 20px', bgcolor: isMe ? 'primary.main' : 'background.paper', color: 'text.primary' }}>
                                                {msg.isArquivo ? (<Button href={fileUrl} target="_blank" startIcon={<AttachFile />} sx={{ color: 'inherit', textTransform: 'none', fontWeight: 'bold' }}>{fileName}</Button>) : (<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</Typography>)}
                                            </Paper>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1.5, pt: 0.5 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Box>
                        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', gap: 1, borderTop: 1, borderColor: 'divider' }}>
                            <TextField fullWidth variant="outlined" placeholder={selectedFile ? `Arquivo: ${selectedFile.name}` : "Digite sua mensagem..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} size="small" disabled={!!selectedFile} />
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                            <Tooltip title="Anexar Arquivo"><IconButton color="primary" onClick={() => fileInputRef.current?.click()}><AttachFile /></IconButton></Tooltip>
                            <Button type="submit" variant="contained" endIcon={<Send />} disabled={!newMessage.trim() && !selectedFile}>Enviar</Button>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.secondary', textAlign: 'center' }}>
                        <Message sx={{ fontSize: 100, mb: 2, color: 'grey.700' }} /><Typography variant="h4">Bem-vindo ao WhatsUT</Typography><Typography>Clique em "Nova Conversa" para iniciar um chat ou selecione um grupo.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}