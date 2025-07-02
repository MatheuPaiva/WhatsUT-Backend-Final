import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    Modal, Box, Typography, TextField, Button, List, ListItem, ListItemText,
    Checkbox, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, CircularProgress, Alert
} from '@mui/material';

// Estilo para o Box do Modal
const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
};

interface CreateGroupModalProps {
    open: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

export function CreateGroupModal({ open, onClose, onGroupCreated }: CreateGroupModalProps) {
    const { user, token } = useAuth();
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [lastAdminRule, setLastAdminRule] = useState<'promote' | 'delete'>('promote');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && token) {
            const fetchUsers = async () => {
                try {
                    const usersData = await api.getUsers(token);
                    setAllUsers(usersData.filter((u: any) => u.id !== user?.id && !u.banned));
                } catch (err) {
                    setError("Não foi possível carregar a lista de usuários.");
                }
            };
            fetchUsers();
        }
    }, [open, token, user]);

    const handleMemberSelection = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('O nome do grupo não pode ser vazio.');
            return;
        }
        if (!user?.id || !token) return;

        setIsLoading(true);
        setError('');

        try {
            await api.createGroup(token, {
                name: groupName.trim(),
                adminsId: [user.id],
                members: [...selectedMembers, user.id],
                lastAdminRule: lastAdminRule,
            });
            onGroupCreated();
            handleClose();
        } catch (err: any) {
            setError(err.message || "Falha ao criar o grupo.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setGroupName('');
        setSelectedMembers([]);
        setError('');
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Criar Novo Grupo</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                    label="Nome do Grupo"
                    variant="outlined"
                    fullWidth
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    disabled={isLoading}
                />
                <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <List dense>
                        {allUsers.map((u) => (
                            <ListItem key={u.id} secondaryAction={
                                <Checkbox edge="end" onChange={() => handleMemberSelection(u.id)} checked={selectedMembers.includes(u.id)} disabled={isLoading} />
                            }>
                                <ListItemText primary={u.name} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <FormControl component="fieldset">
                    <FormLabel component="legend">Quando o último admin sair:</FormLabel>
                    <RadioGroup row value={lastAdminRule} onChange={(e) => setLastAdminRule(e.target.value as any)}>
                        <FormControlLabel value="promote" control={<Radio />} label="Promover membro" />
                        <FormControlLabel value="delete" control={<Radio />} label="Excluir grupo" />
                    </RadioGroup>
                </FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    <Button onClick={handleClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleCreateGroup} variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Criar Grupo'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}