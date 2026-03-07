/**
 * api/personnel.js
 *
 * Duty personnel API calls. Maps to:
 *   GET    /api/v1/personnel
 *   GET    /api/v1/personnel/:id
 *   POST   /api/v1/personnel
 *   PATCH  /api/v1/personnel/:id/duty-status
 */

import api from '../client/client';

export const personnelApi = {
  list: () => api.get('/personnel'),
  getById: (id) => api.get(`/personnel/${id}`),

  /**
   * @param {{ full_name: string, rank: string, station_id?: string, nfc_tag_id?: string, pin_code?: string, shift?: string }} data
   */
  create: (data) => api.post('/personnel', data),

  /**
   * @param {string} id
   * @param {object} data — partial update fields
   */
  update: (id, data) => api.put(`/personnel/${id}`, data),

  /**
   * @param {string} id
   * @param {'On Duty' | 'Off Duty' | 'On Leave'} status
   */
  updateDutyStatus: (id, status) =>
    api.patch(`/personnel/${id}/duty-status`, { duty_status: status }),
};
