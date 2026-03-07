import api from '../client/client';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export const stationsApi = {
  list: () => api.get('/stations'),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post('/stations', data),

  /** Public list — no auth required (for registration dropdown) */
  listPublic: async () => {
    const res = await fetch(`${BASE_URL}/stations/public`);
    if (!res.ok) throw new Error('Failed to fetch stations');
    return res.json();
  },
};
