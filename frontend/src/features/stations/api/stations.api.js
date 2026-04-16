/**
 * features/stations/api/stations.api.js
 *
 * API layer for Stations feature.
 */

import api from '@/shared/httpClient';
import { API_BASE } from '@/config/api';

export const stationsApi = {
  /** List all stations. */
  list: () => api.get('/stations'),


  /** Get a single station by ID. */
  getById: (id) => api.get(`/stations/${id}`),

  /** Create a new station. */
  create: (data) => api.post('/stations', data),

  /** Update an existing station. */
  update: (id, data) => api.put(`/stations/${id}`, data),

  /** Delete a station. */
  delete: (id) => api.delete(`/stations/${id}`),

  /** Public list — no auth required (useful for registration dropdowns). */
  listPublic: async () => {
    // using fetch for no-auth calls if 'api' (axios) has an auth interceptor
    const res = await fetch(`${API_BASE}/stations/public`);
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },
};

export default stationsApi;
