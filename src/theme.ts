import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    sidebar: { bg: string; text: string; active: string; hover: string };
  }
  interface PaletteOptions {
    sidebar?: { bg?: string; text?: string; active?: string; hover?: string };
  }
}

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#4c248b', light: '#7c53c3', dark: '#331662', contrastText: '#fff' },
      secondary: { main: '#38bdf8', light: '#7dd3fc', dark: '#0284c7' },
      warning: { main: '#FA8833', light: '#ffb763', dark: '#c45a00' },
      error: { main: '#CE4200', light: '#f06222', dark: '#962e00' },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      sidebar: {
        bg: mode === 'dark' ? '#120a1f' : '#1e1136',
        text: '#ffffff',
        active: '#38bdf8',
        hover: alpha('#38bdf8', 0.15),
      },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(76,36,139,0.08)',
      text: {
        primary: mode === 'dark' ? '#f3f0f7' : '#1a0d30',
        secondary: mode === 'dark' ? '#b3a5c9' : '#645480',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      fontSize: 16,
      h4: { fontWeight: 700, fontSize: '1.65rem' },
      h5: { fontWeight: 700, fontSize: '1.45rem' },
      h6: { fontWeight: 600, fontSize: '1.25rem' },
      subtitle1: { fontWeight: 500, fontSize: '1.1rem' },
      subtitle2: { fontSize: '1rem' },
      body1: { fontSize: '1.05rem', lineHeight: 1.6 },
      body2: { fontSize: '0.95rem', lineHeight: 1.5 },
      button: { fontSize: '0.95rem' },
      caption: { fontSize: '0.85rem' }
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
            boxShadow: '0 4px 15px rgba(76, 36, 139, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6233ab 0%, #38bdf8 100%)',
              boxShadow: '0 6px 20px rgba(56, 189, 248, 0.45)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 4px 24px rgba(0,0,0,0.45)'
              : '0 4px 24px rgba(81, 40, 136, 0.08)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
        },
      },
    },
  });

