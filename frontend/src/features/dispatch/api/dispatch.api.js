/**
 * features/dispatch/api/dispatch.api.js
 *
 * Dispatch feature API calls.
 *
 * Why this file exists:
 * - Keep endpoint paths in one place.
 * - Keep hooks/components free from raw HTTP strings.
 */

import { httpClient } from '@/shared/httpClient';

export const dispatchApi = {
  /**
   * Load only active incidents for the dispatch selector.
   */
  async listActiveIncidents() {
    const incidents = await httpClient.get('/incidents');
    return (incidents ?? []).filter((incident) => incident.incident_status === 'Active');
  },

  /**
   * Get dispatch records tied to one incident.
   */
  listByIncident: (incidentId) => httpClient.get(`/dispatches?incident_id=${incidentId}`),

  /**
   * Create one dispatch record.
   */
  create: (payload) => httpClient.post('/dispatches', payload),

  /**
   * Update dispatch status progression.
   */
  updateStatus: (dispatchId, payload) =>
    httpClient.patch(`/dispatches/${dispatchId}/status`, payload),
};

export default dispatchApi;
