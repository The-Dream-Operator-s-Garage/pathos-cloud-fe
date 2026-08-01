import api from './api'

export const pinService = {
  async list () {
    const { data } = await api.get('/pins')
    return data
  },
  async pin (targetType, targetId) {
    const { data } = await api.post('/pins', { targetType, targetId })
    return data
  },
  async unpin (targetType, targetId) {
    const { data } = await api.delete('/pins', { data: { targetType, targetId } })
    return data
  },
  async check (targetType, targetId) {
    const { data } = await api.get('/pins/check', { params: { targetType, targetId } })
    return data
  },
  // The caller's PINS skeleton as a routable element — the pins widget's
  // history clock opens its viewer (unpinned pairs survive as history).
  async skeleton () {
    const { data } = await api.get('/pins/skeleton')
    return data
  }
}
