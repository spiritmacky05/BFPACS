/**
 * features/personnel/api/personnel.api.js
 *
 * API layer for Personnel feature.
 */

import api from '@/shared/httpClient';

export const personnelApi = {
  /** List all personnel. */
  list: () => api.get('/personnel'),

  /** Get a single personnel member by ID. */
  getById: (id) => api.get(`/personnel/${id}`),

  /** 
   * Create a new personnel member.
   * @param {Object} data - { full_name, rank, station_id, nfc_tag_id, pin_code, shift, certification }
   */
  create: (data) => api.post('/personnel', data),

  /** 
   * Update an existing personnel member.
   * @param {string} id
   * @param {Object} data - partial update fields
   */
  update: (id, data) => api.put(`/personnel/${id}`, data),

  /** 
   * Update duty status.
   * @param {string} id
   * @param {'On Duty' | 'Off Duty' | 'On Leave'} status
   */
  updateDutyStatus: (id, status) =>
    api.patch(`/personnel/${id}/duty-status`, { duty_status: status }),

  /** 
   * Delete a personnel member.
   * @param {string} id
   */
  delete: (id) => api.delete(`/personnel/${id}`),
};

export default personnelApi;
