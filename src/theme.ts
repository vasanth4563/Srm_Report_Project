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
      primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#fff' },
      secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
      background: {
        default: mode === 'dark' ? '#0f0f17' : '#f4f6fc',
        paper: mode === 'dark' ? '#1a1a2e' : '#ffffff',
      },
      sidebar: {
        bg: mode === 'dark' ? '#12121f' : '#1e1b4b',
        text: '#ffffff',
        active: '#6366f1',
        hover: alpha('#6366f1', 0.15),
      },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
      text: {
        primary: mode === 'dark' ? '#e2e8f0' : '#1e293b',
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              boxShadow: '0 6px 20px rgba(99,102,241,0.5)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 4px 24px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(99,102,241,0.08)',
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
