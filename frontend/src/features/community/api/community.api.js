import { httpClient } from '@/shared/httpClient';

export const communityApi = {
  register: (payload) => httpClient.post('/auth/community/register', payload),
  login: (email, password) => httpClient.post('/auth/community/login', { email, password }),
  submitReport: (payload) => httpClient.post('/community/reports', payload),
  listReportsByIncident: (incidentId) => httpClient.get(`/community/reports?incident_id=${incidentId}`),
};

export default communityApi;
