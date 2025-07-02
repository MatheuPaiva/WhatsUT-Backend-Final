import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'dark',
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const storedMode = localStorage.getItem('themeMode');
    return (storedMode === 'light' || storedMode === 'dark') ? storedMode : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    mode,
  }), [mode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? { // Tema Claro
            primary: { main: '#1976d2' },
            secondary: { main: '#4caf50' },
            background: { default: '#f4f6f8', paper: '#ffffff' },
            text: { primary: '#000000', secondary: '#666666' }, // CORREÇÃO AQUI
          }
        : { // Tema Escuro
            primary: { main: '#3b82f6' },
            secondary: { main: '#10b981' },
            background: { default: '#111827', paper: '#1f2937' },
            text: { primary: '#ffffff', secondary: '#9ca3af' }, // CORREÇÃO AQUI
          }),
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
    },
    components: {
        MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    }
  }), [mode]);

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};