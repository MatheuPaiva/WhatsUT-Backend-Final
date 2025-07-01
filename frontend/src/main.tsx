import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx'; // Importe o Provedor

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* "Abraçando" o App com o Provedor */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);