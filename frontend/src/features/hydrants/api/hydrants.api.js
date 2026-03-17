/**
 * features/hydrants/api/hydrants.api.js
 *
 * Hydrant API client.
 */

import api from '@/api/client/client';

export const hydrantsApi = {
  list: () => api.get('/hydrants'),
  getById: (id) => api.get(`/hydrants/${id}`),
  create: (data) => api.post('/hydrants', data),
  update: (id, data) => api.put(`/hydrants/${id}`, data),
  delete: (id) => api.delete(`/hydrants/${id}`),
  /**
   * Get hydrants within radius meters of a GPS point.
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius  Meters, default 500
   */
  nearby: (lat, lng, radius = 500) =>
    api.get(`/hydrants/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};
