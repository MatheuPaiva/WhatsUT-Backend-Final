import React, { useState } from 'react';
import styles from './LoginPage.module.css';
// 1. Importa os hooks necessários
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

// 2. Importa os ícones que vamos usar
import { MessageSquare, Users, Shield, Zap, Lock, User } from 'lucide-react';

type FormMode = 'login' | 'register';

export function LoginPage() {
    // 3. Pega as funções do contexto e do roteador
    const navigate = useNavigate();
    const { login } = useAuth(); // Usaremos a função de login do contexto

    const [mode, setMode] = useState<FormMode>('login');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Função de envio de formulário simplificada
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setIsLoading(false);
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
                setMode('login');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Usa a função de login do contexto
            try {
                await login({ name, password });
                navigate('/chat'); // Navega para o chat em caso de sucesso
            } catch (err: any) {
                setError(err.message || 'Credenciais inválidas.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const toggleMode = () => {
        setMode(prev => (prev === 'login' ? 'register' : 'login'));
        setName('');
        setPassword('');
        setConfirmPassword('');
        setError('');
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                <div className={styles.infoSide}>
                    <h1 className={styles.title}>Bem-vindo ao <span>WhatsUT</span></h1>
                    <p className={styles.description}>
                        Sistema moderno de comunicação interpessoal desenvolvido para conectar pessoas de forma segura e eficiente.
                    </p>
                    <div className={styles.featuresGrid}>
                        <div className={styles.feature}>
                            <div className={styles.iconWrapper} style={{backgroundColor: '#e0f2fe'}}>
                                <MessageSquare size={20} style={{color: '#0284c7'}} />
                            </div>
                            <h3>Chat Privado</h3>
                            <p>Conversas 1:1 seguras</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.iconWrapper} style={{backgroundColor: '#dcfce7'}}>
                                <Users size={20} style={{color: '#16a34a'}} />
                            </div>
                            <h3>Grupos</h3>
                            <p>Conversas em grupo</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.iconWrapper} style={{backgroundColor: '#f3e8ff'}}>
                                <Shield size={20} style={{color: '#7e22ce'}} />
                            </div>
                            <h3>Segurança</h3>
                            <p>Criptografia JWT</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.iconWrapper} style={{backgroundColor: '#fff7ed'}}>
                                <Zap size={20} style={{color: '#ea580c'}} />
                            </div>
                            <h3>Tempo Real</h3>
                            <p>WebSocket</p>
                        </div>
                    </div>
                </div>
                <div className={styles.formContainer}>
                    <div className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.formHeader}>
                                <div className={styles.formIcon}>
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <h2 className={styles.formTitle}>{mode === 'login' ? 'Entrar' : 'Criar nova conta'}</h2>
                                    <p className={styles.formDescription}>{mode === 'login' ? 'Acesse sua conta para continuar' : 'Crie sua conta para começar'}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                {error && <p className={styles.error}>{error}</p>}
                                <div className={styles.inputGroup}>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={styles.input}
                                        placeholder="Digite seu nome"
                                        required
                                        disabled={isLoading}
                                    />
                                    <User size={16} className={styles.inputIcon} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={styles.input}
                                        placeholder="Digite sua senha"
                                        required
                                        disabled={isLoading}
                                    />
                                    <Lock size={16} className={styles.inputIcon} />
                                </div>
                                {mode === 'register' && (
                                    <div className={styles.inputGroup}>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={styles.input}
                                            placeholder="Confirme sua senha"
                                            required
                                            disabled={isLoading}
                                        />
                                        <Lock size={16} className={styles.inputIcon} />
                                    </div>
                                )}
                                <button type="submit" disabled={isLoading} className={styles.button}>
                                    {isLoading ? 'Carregando...' : (mode === 'login' ? 'Entrar' : 'Criar conta')}
                                </button>
                            </form>
                            <div className={styles.toggleContainer}>
                                {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                <button type="button" onClick={toggleMode} disabled={isLoading} className={styles.toggleButton}>
                                    {mode === 'login' ? 'Criar nova conta' : 'Entrar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}