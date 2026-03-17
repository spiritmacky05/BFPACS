import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/client/client';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on mount, then refresh from server
  useEffect(() => {
    const storedUser = localStorage.getItem('bfp_user');
    const storedToken = localStorage.getItem('bfp_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);

      // Fetch fresh user data from the server (role may have changed)
      authApi.me()
        .then((freshUser) => {
          setUser(freshUser);
          localStorage.setItem('bfp_user', JSON.stringify(freshUser));
        })
        .catch(() => {
          // Token might be invalid or expired. 
          // Interceptor usually handles the logout, but we'll clear it here too if needed.
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      // Backend returns { user, token }
      const { user: userData, token: userToken } = response;

      localStorage.setItem('bfp_user', JSON.stringify(userData));
      localStorage.setItem('bfp_token', userToken);

      setUser(userData);
      setToken(userToken);

      return { success: true };
    } catch (error) {
      const errMsg = error?.response?.data?.error || 'An unexpected error occurred during login.';
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      // Registration may return a success message or pending status
      return {
        success: true,
        pending: true,
        message: response?.message || 'Registration successful. Your account is pending approval.',
      };
    } catch (error) {
      const errMsg = error?.response?.data?.error || 'An unexpected error occurred during registration.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('bfp_user');
    localStorage.removeItem('bfp_token');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = user?.role?.toLowerCase() || 'user';

  return (
    <AuthContext.Provider value={{ user, token, role, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
