import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, Tooltip, useTheme, alpha,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

export const DRAWER_WIDTH = 260;
export const DRAWER_MINI = 72;

const navItems = [
  { label: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/dashboard' },
  { label: 'Reports', icon: <DescriptionRoundedIcon />, path: '/daily-report' },
  { label: 'Profile', icon: <PersonRoundedIcon />, path: '/profile' },
  { label: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
];

const SidebarContent: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const bg = theme.palette.sidebar?.bg ?? '#1e1b4b';
  const txt = '#ffffff';
  const active = '#6366f1';
  const hover = alpha('#6366f1', 0.18);

  return (
    <Box sx={{ width: collapsed ? DRAWER_MINI : DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', background: bg, transition: 'width 0.3s ease', overflow: 'hidden' }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: collapsed ? 1.5 : 2.5, py: 2.5, minHeight: 72 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 15px rgba(99,102,241,0.5)' }}>
          <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>ReportSync</Typography>
            <Typography variant="caption" sx={{ color: txt, opacity: 0.7 }}>v2.0 Pro</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 1.5 }} />

      <List sx={{ px: 1, py: 1.5, flex: 1 }}>
        {navItems
          .filter((item) => !(user?.role === 'admin' && item.path === '/daily-report'))
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton onClick={() => navigate(item.path)} sx={{
                    borderRadius: '10px', minHeight: 46, px: collapsed ? 1.5 : 2,
                    background: isActive ? alpha(active, 0.2) : 'transparent',
                    border: isActive ? `1px solid ${alpha(active, 0.4)}` : '1px solid transparent',
                    '&:hover': { background: hover }, transition: 'all 0.2s',
                  }}>
                    <ListItemIcon sx={{ color: isActive ? '#ffffff' : '#a5b4fc', minWidth: collapsed ? 0 : 36, '& svg': { fontSize: 22 } }}>
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: '#ffffff !important',
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 500,
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    )}
                    {isActive && !collapsed && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: active, boxShadow: `0 0 8px ${active}` }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mx: 1.5 }} />

      <List sx={{ px: 1, py: 1 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItem disablePadding>
            <ListItemButton onClick={logout} sx={{ borderRadius: '10px', minHeight: 46, px: collapsed ? 1.5 : 2, '&:hover': { background: alpha('#ffffff', 0.1) }, transition: 'all 0.2s' }}>
              <ListItemIcon sx={{ color: '#ffffff', minWidth: collapsed ? 0 : 36, '& svg': { fontSize: 22 } }}>
                <LogoutRoundedIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: '#ffffff !important',
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: 1,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>

      {!collapsed && user && (
        <Box sx={{ m: 1.5, p: 1.5, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid rgba(255,255,255,0.07)' }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}>
            {user.avatar}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, display: 'block' }} noWrap>{user.name}</Typography>
            <Typography variant="caption" sx={{ color: txt, opacity: 0.7 }} noWrap>{user.designation}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

interface SidebarProps { open: boolean; variant?: 'permanent' | 'temporary'; onClose?: () => void }

const Sidebar: React.FC<SidebarProps> = ({ open, variant = 'permanent', onClose }) => {
  const theme = useTheme();
  const bg = theme.palette.sidebar?.bg ?? '#1e1b4b';

  if (variant === 'temporary') {
    return (
      <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, background: bg, border: 'none' } }}>
        <SidebarContent collapsed={false} />
      </Drawer>
    );
  }

  return (
    <Drawer variant="permanent" sx={{
      width: open ? DRAWER_WIDTH : DRAWER_MINI, flexShrink: 0,
      transition: 'width 0.3s ease',
      '& .MuiDrawer-paper': { width: open ? DRAWER_WIDTH : DRAWER_MINI, background: bg, border: 'none', overflowX: 'hidden', transition: 'width 0.3s ease' },
    }}>
      <SidebarContent collapsed={!open} />
    </Drawer>
  );
};

export default Sidebar;
