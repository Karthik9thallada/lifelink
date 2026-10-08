import api from './axios';

export const donorApi = {
  getProfile: async () => {
    const res = await api.get('/donors/me');
    return res.data;
  },

  createOrUpdateProfile: async (profileData) => {
    const res = await api.post('/donors/profile', profileData);
    return res.data;
  },

  updateAvailability: async (available) => {
    const res = await api.patch('/donors/availability', { available });
    return res.data;
  },

  updateLocation: async (latitude, longitude, address) => {
    const res = await api.patch('/donors/location', { latitude, longitude, address });
    return res.data;
  },

  getMyMatches: async () => {
    const res = await api.get('/matching/donors/me/matches');
    return res.data;
  },

  acceptRequest: async (requestId) => {
    const res = await api.post(`/matching/requests/${requestId}/accept`);
    return res.data;
  },
};
