/**
 * features/incidents/api/incidentAssets.api.js
 *
 * API mapping for incident-related assets (dispatch + fleet).
 *
 * Why separate file:
 * - Keeps `incidents.api.js` focused.
 * - Makes cross-entity workflows easier to read in service layer.
 */

import { httpClient } from '@/shared/lib/httpClient';

export const incidentAssetsApi = {
  /**
   * Get dispatch records for one incident.
   * Backend: GET /dispatches?incident_id=:id
   */
  getDispatchesByIncident: (incidentId) =>
    httpClient.get(`/dispatches?incident_id=${incidentId}`),

  /**
   * Update one fleet unit fields, usually `status`.
   * Backend: PATCH /fleets/:id
   */
  updateFleetUnit: (fleetId, payload) =>
    httpClient.patch(`/fleets/${fleetId}`, payload),

  /**
   * Write a movement log entry for one fleet unit.
   * Backend: POST /fleets/:id/log-movement
   */
  logFleetMovement: (fleetId, payload) =>
    httpClient.post(`/fleets/${fleetId}/log-movement`, payload),
};

export default incidentAssetsApi;
