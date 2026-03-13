/**
 * features/incidentDetail/api/incidentDetailAssets.api.js
 *
 * API client for cross-entity resources used by incident detail.
 *
 * Why this file exists:
 * - Incident detail status transitions touch dispatch + fleet tables.
 * - This keeps those endpoints grouped in one place.
 */

import { httpClient } from '@/shared/lib/httpClient';

export const incidentDetailAssetsApi = {
  /**
   * Fetch dispatch records linked to one incident.
   */
  getDispatchesByIncident: (incidentId) =>
    httpClient.get(`/dispatches?incident_id=${incidentId}`),

  /**
   * Update one fleet unit.
   */
  updateFleetUnit: (fleetId, payload) =>
    httpClient.patch(`/fleets/${fleetId}`, payload),
};

export default incidentDetailAssetsApi;
