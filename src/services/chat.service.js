import api from './api'

// Conversations (chat feature, 2026-07): CHAT skeletons + MESSAGE
// instances, access-doctrine native. See docs/concepts/chat.md.
export const chatService = {
  // → { chats: [{ id, path, members[], last }] } — latest activity first.
  async list () {
    const { data } = await api.get('/chats')
    return data
  },

  // Find-or-create the conversation with these other entities.
  async open (memberIds) {
    const { data } = await api.post('/chats', { memberIds })
    return data
  },

  // → { chat, members[], items[] } oldest → newest.
  async feed (chatId, limit = 100) {
    const { data } = await api.get(`/chats/${chatId}/feed`, { params: { limit } })
    return data
  },

  // → { chat, members[], shares[] } — the channel contract (Thread K):
  // who-sees-what derived from recorded state, never prose.
  async contract (chatId) {
    const { data } = await api.get(`/chats/${chatId}/contract`)
    return data
  },

  // Send; `shareRefs` = refs the sender shares with the conversation.
  async send (chatId, content, shareRefs = []) {
    const { data } = await api.post(`/chats/${chatId}/messages`, { content, shareRefs })
    return data
  },

  // Attention receipts (Thread G stage 2, 2026-07-31): consent states +
  // (only while EVERY seat consents) who attended each shared ref since
  // the mutual window opened. Symmetric, per-chat, revocable.
  async attention (chatId) {
    const { data } = await api.get(`/chats/${chatId}/attention`)
    return data
  },

  async setAttention (chatId, enabled) {
    const { data } = await api.post(`/chats/${chatId}/attention`, { enabled })
    return data
  },

  // Consent gate (2026-07): answer your own seat. A reply also accepts.
  async accept (chatId) {
    const { data } = await api.post(`/chats/${chatId}/accept`)
    return data
  },

  async decline (chatId) {
    const { data } = await api.post(`/chats/${chatId}/decline`)
    return data
  }
}
