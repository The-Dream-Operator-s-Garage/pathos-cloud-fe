import api from './api';

export const momentService = {
  async get (id) {
    const { data } = await api.get(`/moments/${id}`);
    return data;
  },

  async getByHash (hash) {
    const { data } = await api.get(`/moments/by-hash/${hash}`);
    return data;
  },

  // Everything minted at this moment, across all tables.
  async items (id) {
    const { data } = await api.get(`/moments/${id}/items`);
    return data;
  }
};
