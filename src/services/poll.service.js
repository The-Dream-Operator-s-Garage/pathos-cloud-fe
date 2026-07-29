import api from './api'

// Polls — the decision tool (2026-07). Two kinds ride chats: access
// polls (yes mutates the target's ACCESS path — docs/concepts/access.md)
// and label suggestions (yes plants the proposed label in the decider's
// tree — docs/concepts/labels.md).
export const pollService = {
  // answer ∈ 'yes' | 'no' — decider-only; vote once (409 once answered).
  // Access polls settle granted|denied, label suggestions accepted|declined.
  async vote (pollId, answer) {
    const { data } = await api.post(`/polls/${pollId}/vote`, { answer })
    return data
  },

  // Decider-only, decided ACCESS polls only: granted ⇄ denied. Reversing
  // a grant revokes the grantee's access; reversing a denial grants it.
  // Label suggestions refuse (prune the branch instead).
  async reverse (pollId) {
    const { data } = await api.post(`/polls/${pollId}/reverse`)
    return data
  },

  // Every poll the caller sits in (role ∈ decider|requester), newest
  // first — chat-feed item shape, so PollCard renders rows directly.
  async mine () {
    const { data } = await api.get('/polls/mine')
    return data
  }
}
