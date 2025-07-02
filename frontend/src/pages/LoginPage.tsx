import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

// Importações do MUI
import {
    Container, Box, Typography, TextField, Button, Paper, Avatar,
    Alert, CircularProgress, Tabs, Tab, IconButton, Tooltip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
// CORREÇÃO: Adicionando os ícones que faltavam
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

type FormMode = 'login' | 'register';

export function LoginPage() {
    const { login } = useAuth();
    const { mode, toggleColorMode } = useThemeContext();
    const [formMode, setFormMode] = useState<FormMode>('login');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleApiLogin = async () => {
        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha no login');
            const payload = JSON.parse(atob(data.access_token.split('.')[1]));
            login({ id: payload.sub, name: payload.name }, data.access_token);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleApiRegister = async () => {
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro no registro.');
            alert('Conta criada com sucesso! Por favor, faça o login.');
            setFormMode('login'); 
            setName('');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (formMode === 'register') {
            await handleApiRegister();
        } else {
            await handleApiLogin();
        }
        setIsLoading(false);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <Tooltip title={`Mudar para modo ${mode === 'light' ? 'escuro' : 'claro'}`}>
                    <IconButton onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Paper elevation={6} sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: { xs: 2, sm: 4 },
            }}>
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    {formMode === 'login' ? <LockOutlinedIcon /> : <AppRegistrationIcon />}
                </Avatar>
                <Typography component="h1" variant="h5">
                    {formMode === 'login' ? 'Entrar no WhatsUT' : 'Criar Conta'}
                </Typography>
                <Tabs value={formMode} onChange={(e, newMode) => setFormMode(newMode)} variant="fullWidth" sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Login" value="login" />
                    <Tab label="Registrar" value="register" />
                </Tabs>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    <TextField margin="normal" required fullWidth id="name" label="Nome de Usuário" name="name" autoComplete="username" autoFocus value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                    <TextField margin="normal" required fullWidth name="password" label="Senha" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    {formMode === 'register' && (
                        <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirmar Senha" type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                    )}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : (formMode === 'login' ? 'Entrar' : 'Criar Conta')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}