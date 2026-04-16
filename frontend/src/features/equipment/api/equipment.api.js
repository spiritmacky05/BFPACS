/**
 * api/equipment.js
 *
 * Logistical equipment API calls. Maps to:
 *   GET    /api/v1/equipment?station_id=
 *   POST   /api/v1/equipment
 *   PATCH  /api/v1/equipment/:id/borrow
 *   PATCH  /api/v1/equipment/:id/return
 */

import api from '@/shared/httpClient';

export const equipmentApi = {
  /** List all equipment. Pass stationId to filter by station. */
  list: (stationId) =>
    api.get(stationId ? `/equipment?station_id=${stationId}` : '/equipment'),

  /** @param {{ equipment_name: string, quantity: number, station_id?: string }} data */
  create: (data) => api.post('/equipment', data),

  /** @param {string} id  @param {{ borrower_name: string, borrower_contact?: string }} data */
  borrow: (id, data) => api.patch(`/equipment/${id}/borrow`, data),

  /** @param {string} id */
  return: (id) => api.patch(`/equipment/${id}/return`),

  /** @param {string} id @param {{ equipment_name: string, quantity: number, status: string, borrower_name?: string }} data */
  update: (id, data) => api.put(`/equipment/${id}`, data),

  /** @param {string} id */
  delete: (id) => api.delete(`/equipment/${id}`),
};
