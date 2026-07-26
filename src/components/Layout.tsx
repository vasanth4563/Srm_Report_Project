import React from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { DRAWER_WIDTH, DRAWER_MINI } from './Sidebar.tsx';
import Topbar from './Topbar.tsx';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuClick = () => {
    if (isMobile) setMobileOpen((p) => !p);
    else setSidebarOpen((p) => !p);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      {isMobile ? (
        <Sidebar open={mobileOpen} variant="temporary" onClose={() => setMobileOpen(false)} />
      ) : (
        <Sidebar open={sidebarOpen} variant="permanent" />
      )}

      <Box component="main" sx={{
        flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        <Topbar pageTitle={pageTitle} onMenuClick={handleMenuClick} />
        <Toolbar sx={{ minHeight: { xs: 60, sm: 72 } }} />
        <Box sx={{ flex: 1, p: { xs: 1.5, sm: 3 }, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
