/**
 * api/hydrants.js
 * api/equipment.js
 * api/notifications.js
 * api/stations.js
 * api/index.js — barrel export for clean imports
 */

// --- hydrants.js ---
import api from '../client/client';

export const hydrantsApi = {
  list: () => api.get('/hydrants'),
  getById: (id) => api.get(`/hydrants/${id}`),
  create: (data) => api.post('/hydrants', data),
  /**
   * Get hydrants within radius meters of a GPS point.
   * @param {number} lat
   * @param {number} lng
   * @param {number} radius  Meters, default 500
   */
  nearby: (lat, lng, radius = 500) =>
    api.get(`/hydrants/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};
