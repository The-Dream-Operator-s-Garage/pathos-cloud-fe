import api from './api'

export const fileService = {
  async getTree () {
    const { data } = await api.get('/files/tree')
    return data
  },
  async getTreeOf (ownerHash) {
    const { data } = await api.get(`/files/tree/${ownerHash}`)
    return data
  },
  // One page of leaves for a kind folder. `params`: { owner?, kind,
  // offset?, limit?, until? } — `until` loads from the top through the
  // batch containing that hash (reveal navigation).
  async listFolder (params) {
    const { data } = await api.get('/files/folder', { params })
    return data
  },
  // Which subtree holds an element → { found, owner|null, kind, hash }.
  async locate (address) {
    const { data } = await api.get('/files/locate', { params: { address } })
    return data
  },
  async getGlobals () {
    const { data } = await api.get('/files/globals')
    return data
  },
  async decode (address) {
    const { data } = await api.get('/files/decode', { params: { address } })
    return data
  },
  async getProto (kind) {
    const { data } = await api.get(`/files/proto/${kind}`)
    return data
  }
}
