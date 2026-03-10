import api from '../client/client';

export const usersApi = {
  /** List all users (Admin/SuperAdmin) */
  list: () => api.get('/admin/users'),

  /** Get a single user by ID */
  getById: (id) => api.get(`/admin/users/${id}`),

  /** Update user fields (role, approval, vehicle info, etc.) — Admin/SuperAdmin */
  update: (id, data) => api.patch(`/admin/users/${id}`, data),

  /** Quick approve/revoke a user */
  quickApprove: (id, approved) => api.patch(`/admin/users/${id}/approve`, { approved }),

  /** Get the currently authenticated user's profile */
  me: () => api.get('/auth/me'),

  /** Update the currently authenticated user's own profile */
  updateMe: (data) => api.patch('/auth/me', data),
};
