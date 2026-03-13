/**
 * features/incidents/api/incidents.api.js
 *
 * Thin API layer for incident endpoints.
 *
 * Rule for this layer:
 * - No UI logic.
 * - No cross-entity workflow logic.
 * - Only endpoint mapping + payload shape.
 */

import { httpClient } from '@/shared/lib/httpClient';

export const incidentsApi = {
  /**
   * Fetch all incidents.
   * Backend: GET /incidents
   */
  list: () => httpClient.get('/incidents'),

  /**
   * Fetch one incident by ID.
   * Backend: GET /incidents/:id
   */
  getById: (incidentId) => httpClient.get(`/incidents/${incidentId}`),

  /**
   * Create a new incident.
   * Backend: POST /incidents
   */
  create: (payload) => httpClient.post('/incidents', payload),

  /**
   * Update incident status-related fields.
   * Backend: PATCH /incidents/:id/status
   */
  updateStatus: (incidentId, payload) => httpClient.patch(`/incidents/${incidentId}/status`, payload),

  /**
   * Permanently delete incident.
   * Backend: DELETE /incidents/:id
   */
  delete: (incidentId) => httpClient.delete(`/incidents/${incidentId}`),
};

export default incidentsApi;
