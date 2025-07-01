import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// --- Interfaces: Definindo a estrutura dos nossos dados ---
interface User {
  id: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { name: string; password: string }) => Promise<void>;
  logout: () => void;
}

// --- Criação do Contexto ---
// Criamos um "container" global para o nosso estado de autenticação.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Componente Provedor (AuthProvider) ---
// Este componente vai "abraçar" toda a nossa aplicação, 
// fornecendo o estado de autenticação para todos os filhos.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect para verificar se já existe um token salvo quando a app carrega
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { name: string; password: string }) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha no login');
    }

    // A API do NestJS retorna um objeto com 'name' e 'id' (sub) no payload do token
    // Vamos decodificar o token para pegar as informações do usuário
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    const loggedInUser: User = { id: payload.sub, name: payload.name };

    setToken(data.access_token);
    setUser(loggedInUser);

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('authUser', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const value = {
    isAuthenticated: !!token, // Converte a presença do token em um booleano (true/false)
    user,
    token,
    isLoading,
    login,
    logout,
  };

  // Não renderiza nada até que a verificação inicial do token seja concluída
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook Customizado (useAuth) ---
// Um atalho para que os componentes possam acessar o contexto facilmente.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}