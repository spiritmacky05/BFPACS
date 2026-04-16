/**
 * api/fleet.js
 *
 * Fleet vehicle API calls. Maps to:
 *   GET    /api/v1/fleets
 *   GET    /api/v1/fleets/:id
 *   POST   /api/v1/fleets
 *   PATCH  /api/v1/fleets/:id/location
 *   POST   /api/v1/fleets/:id/log-movement
 *   GET    /api/v1/fleets/:id/movement-logs
 */

import api from '@/shared/httpClient';

export const fleetApi = {
  list: () => api.get('/fleets'),
  getById: (id) => api.get(`/fleets/${id}`),

  /**
   * @param {{ engine_code: string, plate_number: string, vehicle_type: string, ft_capacity?: string, station_id?: string }} data
   */
  create: (data) => api.post('/fleets', data),

  /**
   * Update fleet fields (e.g. status, current_assignment_status).
   * @param {string} id
   * @param {Object} data
   */
  update: (id, data) => api.patch(`/fleets/${id}`, data),

  /**
   * Update GPS position (called by mobile device or fleet tracker).
   * @param {string} id
   * @param {{ lat: number, lng: number }} data
   */
  updateLocation: (id, data) => api.patch(`/fleets/${id}/location`, data),

  /**
   * Log a BFP status code movement event (e.g. "10-23 Arrived at Scene").
   * @param {string} id
   * @param {{ status_code: string, lat?: number, lng?: number, dispatch_id?: string }} data
   */
  logMovement: (id, data) => api.post(`/fleets/${id}/log-movement`, data),

  /**
   * Fetch movement history for a fleet vehicle.
   * @param {string} id
   */
  getMovementLogs: (id) => api.get(`/fleets/${id}/movement-logs`),
};
