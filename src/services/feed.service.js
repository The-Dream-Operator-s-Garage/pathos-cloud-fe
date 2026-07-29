import api from './api';

export const feedService = {
  // Public global feed — every POST instance platform-wide, newest first.
  async getPublic (params = {}) {
    const { data } = await api.get('/feed', { params });
    return data;
  },
  // Legacy per-entity feed kept around for callers that still want their
  // own activity stream.
  async getMyFeed (params = {}) {
    const { data } = await api.get('/feed/me', { params });
    return data;
  }
};
