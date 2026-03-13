/**
 * features/dispatch/api/dispatchAssets.api.js
 *
 * API calls for resources related to dispatch workflows.
 *
 * Why this file exists:
 * - Dispatch page needs data from multiple entities.
 * - We group those calls here for readability.
 */

import { httpClient } from '@/shared/lib/httpClient';

export const dispatchAssetsApi = {
  listResponders: () => httpClient.get('/admin/users'),
  updateResponder: (userId, payload) => httpClient.patch(`/admin/users/${userId}`, payload),
  listPersonnel: () => httpClient.get('/personnel'),
  listEquipment: () => httpClient.get('/equipment'),
  listStations: () => httpClient.get('/stations'),
};

export default dispatchAssetsApi;
