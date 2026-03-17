/**
 * features/auth/index.js
 *
 * Barrel export for Auth feature
 */

export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { useAuth } from './hooks/useAuth';
export { AuthProvider } from './context/AuthContext';
