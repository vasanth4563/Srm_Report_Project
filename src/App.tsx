import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import DailyReportPage from './pages/DailyReportPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
      <Route path="/daily-report" element={<PrivateRoute element={(user?.role === 'admin' || user?.role === 'chairman') ? <Navigate to="/dashboard" replace /> : <DailyReportPage />} />} />
      <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} />} />
      <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
};

export default App;
