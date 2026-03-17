/**
 * features/incidentDetail/api/incidentDetail.api.js
 *
 * Thin API client for incident-detail feature.
 *
 * Why this file exists:
 * - Keep endpoint paths centralized.
 * - Keep hooks/components free from raw HTTP paths.
 */

import { httpClient } from '@/shared/httpClient';

/**
 * API contract for incident-detail workflows.
 */
export const incidentDetailApi = {
  /**
   * Get one incident by its UUID.
   */
  getById: (incidentId) => httpClient.get(`/incidents/${incidentId}`),

  /**
   * Update incident status fields.
   */
  updateStatus: (incidentId, payload) =>
    httpClient.patch(`/incidents/${incidentId}/status`, payload),
};

export default incidentDetailApi;
