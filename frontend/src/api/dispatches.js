/**
 * api/dispatches.js
 *
 * Incident dispatch API calls. Maps to:
 *   GET    /api/v1/dispatches?incident_id=
 *   POST   /api/v1/dispatches
 *   PATCH  /api/v1/dispatches/:id/status
 */

import api from './client';

export const dispatchesApi = {
  /**
   * Get all dispatches for a given incident.
   * @param {string} incidentId
   */
  getByIncident: (incidentId) => api.get(`/dispatches?incident_id=${incidentId}`),

  /**
   * Dispatch a fleet vehicle to an incident (creates "En Route" record).
   * @param {{ incident_id: string, fleet_id: string }} data
   */
  dispatch: (data) => api.post('/dispatches', data),

  /**
   * Update dispatch status with a BFP radio code.
   * @param {string} id
   * @param {{ dispatch_status: string, situational_report?: string }} data
   */
  updateStatus: (id, data) => api.patch(`/dispatches/${id}/status`, data),
};
