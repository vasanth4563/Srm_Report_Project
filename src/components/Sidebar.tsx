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
import BrandLogo from './BrandLogo.tsx';

export const DRAWER_WIDTH = 260;
export const DRAWER_MINI = 76;

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
  const isDark = theme.palette.mode === 'dark';

  // Deep Purple #4c248b & Light Blue #38bdf8 Theme:
  const roleTheme = user?.role === 'chairman'
    ? {
        gradient: 'linear-gradient(135deg, #4c248b 0%, #38bdf8 100%)',
        activeColor: '#4c248b',
        shadow: 'rgba(76, 36, 139, 0.45)',
        brandGradient: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
        badgeLabel: '👑 Chairman',
      }
    : user?.role === 'admin'
    ? {
        gradient: 'linear-gradient(135deg, #4c248b 0%, #0284c7 100%)',
        activeColor: '#4c248b',
        shadow: 'rgba(76, 36, 139, 0.45)',
        brandGradient: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
        badgeLabel: '🛡️ Admin',
      }
    : {
        gradient: 'linear-gradient(135deg, #4c248b 0%, #38bdf8 100%)',
        activeColor: '#4c248b',
        shadow: 'rgba(76, 36, 139, 0.45)',
        brandGradient: 'linear-gradient(135deg, #4c248b 0%, #0284c7 50%, #38bdf8 100%)',
        badgeLabel: 'Staff',
      };

  // White transparency & Glassmorphism styles
  const glassBg = isDark
    ? 'rgba(18, 18, 30, 0.75)'
    : '#ffffff';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <Box sx={{
      width: collapsed ? DRAWER_MINI : DRAWER_WIDTH,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: glassBg,
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      borderRight: `1px solid ${borderColor}`,
      boxShadow: isDark
        ? '0 10px 30px rgba(0, 0, 0, 0.3)'
        : '0 8px 32px 0 rgba(31, 38, 135, 0.06)',
    }}>
      {/* Brand Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: collapsed ? 2 : 2.5,
        py: 2.5,
        minHeight: 76,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
          '&:hover': { transform: 'rotate(5deg) scale(1.05)' },
        }}>
          <BrandLogo size={42} />
        </Box>
        {!collapsed && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{
              color: textColor,
              fontWeight: 800,
              lineHeight: 1.2,
              fontSize: 13,
              letterSpacing: '-0.02em',
            }}>
              SRM Group
            </Typography>
            <Typography variant="caption" sx={{
              color: textSecondary,
              fontWeight: 600,
              fontSize: 10.5,
              display: 'block',
              letterSpacing: '0.02em',
            }}>
              Ramapuram & Trichy
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        mx: 2,
        my: 0.5,
      }} />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {navItems
          .filter((item) => !((user?.role === 'admin' || user?.role === 'chairman') && item.path === '/daily-report'))
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: '14px',
                      minHeight: 48,
                      px: collapsed ? 1.75 : 2,
                      background: isActive
                        ? roleTheme.gradient
                        : 'transparent',
                      color: isActive ? '#ffffff !important' : textColor,
                      boxShadow: isActive
                        ? `0 8px 24px ${roleTheme.shadow}`
                        : 'none',
                      border: isActive
                        ? '1px solid rgba(255, 255, 255, 0.3)'
                        : '1px solid transparent',
                      backdropFilter: isActive ? 'blur(10px)' : 'none',
                      '&:hover': {
                        background: isActive
                          ? roleTheme.gradient
                          : isDark
                            ? alpha(roleTheme.activeColor, 0.15)
                            : alpha(roleTheme.activeColor, 0.1),
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ListItemIcon sx={{
                      color: isActive
                        ? '#ffffff !important'
                        : roleTheme.activeColor,
                      minWidth: collapsed ? 0 : 38,
                      transition: 'all 0.25s ease',
                      '& svg': {
                        fontSize: 22,
                        filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'none',
                      },
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isActive ? '#ffffff !important' : textColor,
                            fontSize: 14,
                            fontWeight: isActive ? 800 : 600,
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    )}
                    {isActive && !collapsed && (
                      <Box sx={{
                        width: 6,
                        height: 20,
                        borderRadius: '4px',
                        background: '#ffffff',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                        ml: 1,
                      }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
      </List>

      <Divider sx={{
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        mx: 2,
        my: 0.5,
      }} />

      {/* Logout button */}
      <List sx={{ px: 1.5, py: 1 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: '14px',
                minHeight: 46,
                px: collapsed ? 1.75 : 2,
                color: isDark ? '#ef4444' : '#dc2626',
                border: '1px solid transparent',
                '&:hover': {
                  background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  transform: 'translateX(3px)',
                },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon sx={{
                color: isDark ? '#ef4444' : '#dc2626',
                minWidth: collapsed ? 0 : 38,
                '& svg': { fontSize: 22 },
              }}>
                <LogoutRoundedIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isDark ? '#ef4444' : '#dc2626',
                      fontSize: 14,
                      fontWeight: 700,
                    },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>

      {/* User profile widget at bottom */}
      {!collapsed && user && (
        <Box sx={{
          m: 1.5,
          p: 1.5,
          borderRadius: '16px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.2)'
            : '0 4px 15px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Avatar sx={{
            width: 38,
            height: 38,
            fontSize: 13,
            fontWeight: 800,
            background: roleTheme.brandGradient,
            boxShadow: `0 4px 12px ${roleTheme.shadow}`,
          }}>
            {user.avatar}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{
              color: textColor,
              fontWeight: 800,
              display: 'block',
              fontSize: 12,
              lineHeight: 1.2,
            }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{
              color: textSecondary,
              fontWeight: 600,
              fontSize: 10.5,
              display: 'block',
            }} noWrap>
              {user.designation || user.role}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

interface SidebarProps { open: boolean; variant?: 'permanent' | 'temporary'; onClose?: () => void }

const Sidebar: React.FC<SidebarProps> = ({ open, variant = 'permanent', onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glassBg = isDark
    ? 'rgba(18, 18, 30, 0.75)'
    : 'rgba(255, 255, 255, 0.78)';

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            background: glassBg,
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: 'none',
          },
        }}
      >
        <SidebarContent collapsed={false} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_MINI,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_MINI,
          background: glassBg,
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: 'none',
          overflowX: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      <SidebarContent collapsed={!open} />
    </Drawer>
  );
};

export default Sidebar;

