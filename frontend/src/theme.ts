import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Começamos com um tema escuro, que é moderno
    primary: {
      main: '#3b82f6', // Um tom de azul vibrante
    },
    secondary: {
      main: '#10b981', // Um verde para ações secundárias ou status online
    },
    background: {
      default: '#111827', // Fundo principal da aplicação
      paper: '#1f2937',   // Fundo para "papéis" como a barra lateral e inputs
    },
    text: {
        primary: '#ffffff',
        secondary: '#9ca3af',
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // Botões com texto normal, não em maiúsculas
                borderRadius: 8,
            }
        }
    }
  }
});

export default theme;