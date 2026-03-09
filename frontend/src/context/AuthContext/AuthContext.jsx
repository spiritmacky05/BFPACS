import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../lib/axios/axios';
import { usersApi } from '../../api/users/users';

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
      usersApi.me()
        .then((freshUser) => {
          setUser(freshUser);
          localStorage.setItem('bfp_user', JSON.stringify(freshUser));
        })
        .catch(() => { /* token expired, handled by 401 interceptor */ });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('bfp_user', JSON.stringify(user));
      localStorage.setItem('bfp_token', token);

      setUser(user);
      setToken(token);

      return { success: true };
    } catch (error) {
      if (error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Registration no longer returns a token — account is pending approval
      return {
        success: true,
        pending: true,
        message: response.data?.message || 'Registration successful. Your account is pending approval.',
      };
    } catch (error) {
      if (error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: 'An unexpected error occurred during registration.' };
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
