import { createTheme } from '@mui/material/styles';

// Palette SANTÉ-CI : vert ivoirien + orange (couleurs drapeau CI)
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1B6B2F',       // Vert forêt (drapeau CI)
      light: '#4CAF50',
      dark: '#0D4A1F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F57C00',       // Orange CI
      light: '#FFB74D',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    success: { main: '#2E7D32' },
    error: { main: '#C62828' },
    warning: { main: '#F9A825' },
    background: {
      default: '#F5F7F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h4: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } },
    },
  },
  shape: { borderRadius: 8 },
});
