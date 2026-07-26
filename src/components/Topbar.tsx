import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar, Tooltip, Box, useTheme, alpha, Chip } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useColorMode } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import BrandLogo from './BrandLogo.tsx';

interface TopbarProps { pageTitle: string; onMenuClick: () => void }

const Topbar: React.FC<TopbarProps> = ({ pageTitle, onMenuClick }) => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { user } = useAuth();

  // Deep Purple & Light Blue Navbar gradient styling
  const navGradient = 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)';
  const navShadow = '0 8px 32px rgba(76, 36, 139, 0.35)';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        background: navGradient,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
        color: '#ffffff',
        boxShadow: navShadow,
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 62, sm: 76 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{
            color: '#ffffff',
            borderRadius: '12px',
            p: 1,
            background: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, overflow: 'hidden' }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexShrink: 0 }}>
            <BrandLogo size={36} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              <Typography variant="h6" noWrap sx={{
                fontWeight: 800,
                color: '#ffffff',
                fontSize: { xs: 14, sm: 17 },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                SRM Group of Institutions
              </Typography>
              <Chip
                label="Ramapuram & Trichy"
                size="small"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  height: 20,
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(8px)',
                }}
              />
            </Box>
            <Typography variant="caption" noWrap sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 600,
              fontSize: { xs: 10.5, sm: 11.5 },
              letterSpacing: '0.01em',
            }}>
              {pageTitle} • Dashboard Reports & Reviews
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow>
            <IconButton
              onClick={toggleColorMode}
              sx={{
                color: '#ffffff',
                borderRadius: '12px',
                p: 1,
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'rotate(15deg)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              {mode === 'dark' ? <LightModeRoundedIcon sx={{ color: '#FA8833' }} /> : <DarkModeRoundedIcon sx={{ color: '#ffffff' }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={user?.name ?? 'Profile'} arrow>
            <Box sx={{ position: 'relative', cursor: 'pointer' }}>
              <Avatar sx={{
                width: 38,
                height: 38,
                fontSize: 14,
                fontWeight: 800,
                background: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.25s ease',
                '&:hover': { transform: 'scale(1.08)' },
              }}>
                {user?.avatar ?? 'U'}
              </Avatar>
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#FA8833',
                border: '2px solid #ffffff',
              }} />
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;

