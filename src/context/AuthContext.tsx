import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { apiRequest } from '../utils/api.ts';
import { Url } from '../config/urls.ts';

export type Employee = {
  id: string; title: string; name: string;
  designation: string; institution: string;
  email: string; avatar: string;
  branch: string; mobile: string;
  role?: 'admin' | 'user';
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Employee | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Employee | null>(null);

  const fetchProfile = async () => {
    try {
      const profile = await apiRequest<Employee>('/api/auth/me');
      setUser(profile);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      if (!localStorage.getItem('access_token')) {
        localStorage.setItem('access_token', token);
      }
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ access_token: string; role: string; user_id: string }>('/api/auth/login', {
        method: 'POST',
        bodyData: { email, password },
      });

      if (response && response.access_token) {
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("role", response.role || "");
        localStorage.setItem("user_id", response.user_id || "");

        console.log("Login Successful, Token:", response.access_token);
        console.log("User ID:", response.user_id);

        await fetchProfile();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
