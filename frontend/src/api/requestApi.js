import api from './axios';

export const requestApi = {
  createRequest: async (requestData) => {
    const res = await api.post('/requests', requestData);
    return res.data;
  },

  getMyRequests: async () => {
    const res = await api.get('/requests/hospital/my');
    return res.data;
  },

  getRequestById: async (id) => {
    const res = await api.get(`/requests/${id}`);
    return res.data;
  },

  cancelRequest: async (id) => {
    const res = await api.patch(`/requests/${id}/cancel`);
    return res.data;
  },

  findMatches: async (requestId) => {
    const res = await api.post(`/matching/requests/${requestId}/find`);
    return res.data;
  },

  getRequestMatches: async (requestId) => {
    const res = await api.get(`/matching/requests/${requestId}/matches`);
    return res.data;
  },

  escalateRequest: async (requestId) => {
    const res = await api.post(`/escalation/requests/${requestId}/escalate`);
    return res.data;
  },
};
