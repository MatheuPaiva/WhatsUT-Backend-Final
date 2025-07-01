// Arquivo: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Importe o BrowserRouter
import App from './App'; // 2. Remova a extensão .tsx
import './index.css';
import { AuthProvider } from './contexts/AuthContext'; // 3. Remova a extensão .tsx


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* 4. Mova o BrowserRouter para cá */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);