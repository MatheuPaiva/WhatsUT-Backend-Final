import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomThemeProvider> {/* O ThemeProvider deve vir DEPOIS dos outros para usar seus contextos */}
          <CssBaseline />
          <App />
        </CustomThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);