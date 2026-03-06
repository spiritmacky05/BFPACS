/**
 * api/incidents.js
 *
 * All fire incident API calls. Maps to:
 *   GET    /api/v1/incidents
 *   GET    /api/v1/incidents/:id
 *   POST   /api/v1/incidents
 *   PATCH  /api/v1/incidents/:id/status
 */

import api from '../client/client';

export const incidentsApi = {
  /**
   * List all incidents sorted newest first.
   * @returns {Promise<import('@/types').FireIncident[]>}
   */
  list: () => api.get('/incidents'),

  /**
   * Get a single incident by UUID.
   * @param {string} id
   */
  getById: (id) => api.get(`/incidents/${id}`),

  /**
   * Report a new fire incident (10-70).
   * DB trigger auto-notifies all Station Commanders.
   * @param {{ location_text: string, lat?: number, lng?: number, occupancy_type?: string, alarm_status?: string, response_type?: string }} data
   */
  create: (data) => api.post('/incidents', data),

  /**
   * Update incident alarm/operational status.
   * Use COALESCE — only fields provided will be updated.
   * @param {string} id
   * @param {{ incident_status?: string, alarm_status?: string, ground_commander?: string, total_injured?: number, total_rescued?: number }} data
   */
  updateStatus: (id, data) => api.patch(`/incidents/${id}/status`, data),
};
