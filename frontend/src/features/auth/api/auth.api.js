/**
 * features/auth/api/auth.api.js
 *
 * Authentication-specific API calls.
 */

import api from '@/api/client/client';

export const authApi = {
  /** 
   * Login with email and password 
   * @param {string} email
   * @param {string} password
   */
  login: (email, password) => api.post('/auth/login', { email, password }),

  /** 
   * Register a new user account 
   * @param {Object} userData
   */
  register: (userData) => api.post('/auth/register', userData),

  communityRegister: (userData) => api.post('/auth/community/register', userData),

  /** 
   * Get the currently authenticated user's profile 
   */
  me: () => api.get('/auth/me'),

  /** 
   * Update the currently authenticated user's profile 
   * @param {Object} data
   */
  updateMe: (data) => api.patch('/auth/me', data),
};
