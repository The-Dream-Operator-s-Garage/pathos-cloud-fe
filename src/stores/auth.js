import { defineStore } from 'pinia'
import { authService } from 'src/services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: authService.getUser(),
    token: localStorage.getItem('pathos_token') || null,
    systemStatus: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    entityId: (state) => state.user?.id || null,
    // The login identity — never changes across identity switches.
    rootEntityId: (state) => state.user?.root_entity_id || state.user?.id || null,
    // True while acting as an alter-ego rather than the root identity.
    isActingAsAlterEgo: (state) =>
      !!state.user?.root_entity_id && state.user.id !== state.user.root_entity_id
  },

  actions: {
    async login (username, password) {
      const result = await authService.login(username, password)
      if (result.success) {
        this.token = result.token
        this.user = result.entity
      }
      return result
    },

    async register (secret, username, password) {
      const result = await authService.register(secret, username, password)
      if (result.success) {
        this.token = result.token
        this.user = result.entity
      }
      return result
    },

    // Password recovery via the invite chain (Thread H): redeem a reset
    // secret minted by your inviter — a success logs this device in.
    async recover (secret, username, newPassword) {
      const result = await authService.resetPassword(secret, username, newPassword)
      if (result.success) {
        this.token = result.token
        this.user = result.entity
      }
      return result
    },

    // Internal log-in: act as an alter-ego (or return to the root identity).
    // The API re-issues the JWT; everything downstream (makers, feeds,
    // profile links) reads the new acting identity from this store.
    async switchIdentity (entityId) {
      const result = await authService.switchIdentity(entityId)
      if (result.success) {
        this.token = result.token
        this.user = result.entity
      }
      return result
    },

    logout () {
      authService.logout()
      this.token = null
      this.user = null
    },

    async fetchStatus () {
      const result = await authService.getStatus()
      this.systemStatus = result.status
      return result
    }
  }
})
