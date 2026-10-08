import api from './axios';

export const hospitalApi = {
  getProfile: async () => {
    const res = await api.get('/hospitals/me');
    return res.data;
  },

  createOrUpdateProfile: async (hospitalData) => {
    const res = await api.post('/hospitals/profile', hospitalData);
    return res.data;
  },

  getAllHospitals: async () => {
    const res = await api.get('/hospitals');
    return res.data;
  },

  verifyHospital: async (hospitalId, verified) => {
    const res = await api.patch(`/admin/hospitals/${hospitalId}/verify?verified=${verified}`);
    return res.data;
  },
};
