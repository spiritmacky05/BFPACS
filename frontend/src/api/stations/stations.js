import api from '../client/client';

export const stationsApi = {
  list: () => api.get('/stations'),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post('/stations', data),
};
