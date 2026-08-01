import api from './api'

// Read-only node-side surface for the legacy NodeDetailPage viewer.
// Authoring of new comments and forks is post-centric — see postService.commentOn / forkOf.
export const nodeInteractionService = {
  async getInteractions (nodeId) {
    const { data } = await api.get(`/nodes/${nodeId}/interactions`)
    return data
  },
  async getForks (nodeId) {
    const { data } = await api.get(`/nodes/${nodeId}/forks`)
    return data
  },
  async getOrigin (nodeId) {
    const { data } = await api.get(`/nodes/${nodeId}/origin`)
    return data
  },
  async vote (nodeId, direction) {
    const { data } = await api.post(`/nodes/${nodeId}/vote`, { direction })
    return data
  },
  async unvote (nodeId) {
    const { data } = await api.delete(`/nodes/${nodeId}/vote`)
    return data
  }
}
