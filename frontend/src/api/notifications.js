/**
 * api/notifications.js
 *
 * Notification API calls. Maps to:
 *   GET    /api/v1/notifications?user_id=
 *   PATCH  /api/v1/notifications/:id/read
 *   PATCH  /api/v1/notifications/read-all?user_id=
 */

import api from './client';

export const notificationsApi = {
  /** Get all notifications for a user. */
  getForUser: (userId) => api.get(`/notifications?user_id=${userId}`),

  /** Mark a single notification as read. */
  markRead: (id) => api.patch(`/notifications/${id}/read`),

  /** Mark all notifications as read for a user. */
  markAllRead: (userId) => api.patch(`/notifications/read-all?user_id=${userId}`),
};
