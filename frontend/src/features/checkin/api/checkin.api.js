/**
 * features/checkin/api/checkin.api.js
 *
 * NFC / PIN check-in API calls.
 */

import api from '@/shared/httpClient';

export const checkinApi = {
  /**
   * Check in via NFC tag scan.
   */
  nfc: (data) => api.post('/checkin/nfc', data),

  /**
   * Check in via PIN code.
   */
  pin: (data) => api.post('/checkin/pin', data),

  /**
   * Manual admin deploy — check in a personnel member by UUID.
   */
  manual: (data) => api.post('/checkin/manual', data),

  /**
   * Get full check-in log for an incident.
   */
  getLogsForIncident: (incidentId) =>
    api.get(`/checkin/logs?incident_id=${incidentId}`),

  /**
   * Get ALL check-in logs across all incidents (for dashboard stats).
   */
  getAllLogs: () => api.get('/checkin/logs'),

  /**
   * Check out a personnel log entry by its UUID.
   */
  checkout: (logId) => api.post(`/checkin/${logId}/checkout`),
};
