/**
 * features/auth/hooks/useAuth.js
 *
 * Extracted logic for managing login, registration, and user state.
 * Wraps AuthContext while providing feature-specific workflows.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext as useGlobalAuth } from '../context/AuthContext';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const globalAuth = useGlobalAuth();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    
    setError('');
    setIsLoading(true);
    try {
      const result = await globalAuth.login(email, password);
      if (result.success) {
        navigate('/');
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch {
      const msg = 'An unexpected error occurred. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await globalAuth.register(userData);
      if (result.success) {
        return { success: true, pending: result.pending, message: result.message };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch {
      const msg = 'An unexpected error occurred. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommunityRegister = async (userData) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await globalAuth.registerCommunity(userData);
      if (result.success) {
        return { success: true, message: result.message };
      }
      setError(result.error);
      return { success: false, error: result.error };
    } catch {
      const msg = 'An unexpected error occurred. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...globalAuth, // Spread original context (user, token, role, logout, etc.)
    isLoading,
    error,
    setError,
    handleLogin,
    handleRegister,
    handleCommunityRegister,
  };
};
