/**
 * features/superadmin/api/superadmin.api.js
 *
 * API layer for SuperAdmin (administrative management).
 */

import api from '@/shared/httpClient';

export const superadminApi = {
  /** List all users (Admin/SuperAdmin) */
  listUsers: () => api.get('/admin/users'),

  /** Get a single user by ID */
  getUserById: (id) => api.get(`/admin/users/${id}`),

  /** Update user fields (role, approval, vehicle info, etc.) — Admin/SuperAdmin */
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),

  /** Quick approve/revoke a user */
  quickApproveUser: (id, approved) => api.patch(`/admin/users/${id}/approve`, { approved }),

  /** Get system health status */
  getSystemHealth: () => api.get('/health'),
};

export default superadminApi;
