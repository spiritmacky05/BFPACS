import api from '../client/client';

export const usersApi = {
  /** List all users (SuperAdmin only) */
  list: () => api.get('/admin/users'),

  /** Get a single user by ID */
  getById: (id) => api.get(`/admin/users/${id}`),

  /** Update user fields (role, approval, vehicle info, etc.) */
  update: (id, data) => api.patch(`/admin/users/${id}`, data),

  /** Quick approve/revoke a user */
  quickApprove: (id, approved) => api.patch(`/admin/users/${id}/approve`, { approved }),

  /** Get the currently authenticated user's profile */
  me: () => api.get('/auth/me'),
};
