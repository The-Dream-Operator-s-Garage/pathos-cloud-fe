import api from './api'

export const navService = {
  // Returns the persistent (lazily-created) nav session for this user.
  async startSession () {
    const { data } = await api.post('/nav/session')
    return data
  },

  // Returns the persistent session + every event in chronological order,
  // for replaying the user's full navigation history.
  async restoreSession () {
    const { data } = await api.get('/nav/restore')
    return data
  },

  // Fire-and-forget — never blocks navigation on persistence.
  recordEvent (payload) {
    api.post('/nav/event', payload).catch(() => {})
  },

  async getCheckpoints () {
    const { data } = await api.get('/nav/checkpoints')
    return data
  },

  // StateHolder — persist one visited element's viewer state. An optional
  // `interaction` also extends the element's pathchain interaction path.
  // Fire-and-forget by design: state saving never blocks the UI.
  saveState (payload) {
    api.post('/nav/state', payload).catch(() => {})
  },

  // All StateHolders for the logged-in entity, keyed by element key.
  async getStates () {
    const { data } = await api.get('/nav/state')
    return data
  },

  // The caller's NAVIGATION skeleton as a routable element — the stack
  // widget's history clock opens its viewer.
  async getNavigationSkeleton () {
    const { data } = await api.get('/nav/skeleton')
    return data
  }
}
