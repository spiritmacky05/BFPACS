/**
 * api/checkin.js
 *
 * NFC / PIN check-in API calls. Maps to:
 *   POST   /api/v1/checkin/nfc
 *   POST   /api/v1/checkin/pin
 *   POST   /api/v1/checkin/manual
 *   GET    /api/v1/checkin/logs?incident_id= (incident_id optional)
 *   POST   /api/v1/checkin/:id/checkout
 */

import api from '../client/client';

export const checkinApi = {
  /**
   * Check in via NFC tag scan.
   * Returns 409 if already checked in.
   * @param {{ nfc_tag_id: string, incident_id: string }} data
   */
  nfc: (data) => api.post('/checkin/nfc', data),

  /**
   * Check in via PIN code.
   * Returns 409 if already checked in.
   * @param {{ pin_code: string, incident_id: string }} data
   */
  pin: (data) => api.post('/checkin/pin', data),

  /**
   * Manual admin deploy — check in a personnel member by UUID.
   * Returns 409 if already deployed to this incident.
   * @param {{ personnel_id: string, incident_id: string }} data
   */
  manual: (data) => api.post('/checkin/manual', data),

  /**
   * Get full check-in log for an incident.
   * @param {string} incidentId
   */
  getLogsForIncident: (incidentId) =>
    api.get(`/checkin/logs?incident_id=${incidentId}`),

  /**
   * Get ALL check-in logs across all incidents (for dashboard stats).
   */
  getAllLogs: () => api.get('/checkin/logs'),

  /**
   * Check out a personnel log entry by its UUID.
   * Sets check_out_time to now.
   * @param {string} logId
   */
  checkout: (logId) => api.post(`/checkin/${logId}/checkout`),
};
