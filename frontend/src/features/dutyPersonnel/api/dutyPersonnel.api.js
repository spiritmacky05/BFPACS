/**
 * features/dutyPersonnel/api/dutyPersonnel.api.js
 *
 * API layer for Duty Personnel feature.
 *
 * Why this file exists:
 * - Keep endpoint paths out of UI components.
 * - Ensure this feature uses the shared HTTP client only.
 */

import { httpClient } from '@/shared/lib/httpClient';

export const dutyPersonnelApi = {
  list: () => httpClient.get('/personnel'),
  create: (payload) => httpClient.post('/personnel', payload),
  update: (personnelId, payload) => httpClient.put(`/personnel/${personnelId}`, payload),
  remove: (personnelId) => httpClient.delete(`/personnel/${personnelId}`),
  updateDutyStatus: (personnelId, dutyStatus) =>
    httpClient.patch(`/personnel/${personnelId}/duty-status`, { duty_status: dutyStatus }),
  listStations: () => httpClient.get('/stations'),
};

export default dutyPersonnelApi;
