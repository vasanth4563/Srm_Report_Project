import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar, Badge, Tooltip, Box, useTheme, alpha } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useColorMode } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface TopbarProps { pageTitle: string; onMenuClick: () => void }

const Topbar: React.FC<TopbarProps> = ({ pageTitle, onMenuClick }) => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { user } = useAuth();

  return (
    <AppBar position="fixed" elevation={0} sx={{
      zIndex: theme.zIndex.drawer + 1,
      background: mode === 'dark' ? alpha('#12121f', 0.85) : alpha('#ffffff', 0.85),
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    }}>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 60, sm: 72 } }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ color: theme.palette.text.primary, borderRadius: '10px', '&:hover': { background: alpha(theme.palette.primary.main, 0.1) } }}>
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, width: 32, height: 32, borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', alignItems: 'center', justifyContent: 'center' }}>
            <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: { xs: 16, sm: 20 } }}>
            {pageTitle}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow>
            <IconButton onClick={toggleColorMode} sx={{ color: theme.palette.text.secondary, borderRadius: '10px', '&:hover': { background: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main } }}>
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications" arrow>
            <IconButton sx={{ color: theme.palette.text.secondary, borderRadius: '10px', '&:hover': { background: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main } }}>
              <Badge badgeContent={4} color="error"><NotificationsRoundedIcon /></Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={user?.name ?? 'Profile'} arrow>
            <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', cursor: 'pointer', ml: 0.5, boxShadow: '0 0 0 2px rgba(99,102,241,0.4)' }}>
              {user?.avatar ?? 'U'}
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
