import { defineStore } from 'pinia'
import { useWindowsStore } from 'src/stores/windows'

// The chat dock's state: window flags (maker-pattern — flags live here,
// z-order in stores/windows.js), the open conversation, and one in-flight
// composer draft per conversation (session + localStorage persisted so a
// half-typed message survives minimize/reload).

const STORAGE_KEY = 'pathos_chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    activeChatId: null,
    // chatId → composer text
    drafts: {},
    loaded: false
  }),

  actions: {
    load () {
      if (this.loaded) return
      this.loaded = true
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (saved && typeof saved === 'object') {
          this.activeChatId = saved.activeChatId ?? null
          this.drafts = saved.drafts && typeof saved.drafts === 'object' ? saved.drafts : {}
        }
      } catch (_) { /* fresh state */ }
    },

    persist () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          activeChatId: this.activeChatId,
          drafts: this.drafts
        }))
      } catch (_) { /* storage blocked */ }
    },

    open () {
      this.load()
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('chat')
    },

    close () {
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('chat')
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('chat')
    },

    restore () {
      this.isMinimized = false
      useWindowsStore().focus('chat')
    },

    toggleMaximize () { this.isMaximized = !this.isMaximized },

    setActive (chatId) {
      this.activeChatId = chatId
      this.persist()
    },

    draftFor (chatId) {
      return this.drafts[chatId] || ''
    },

    setDraft (chatId, text) {
      this.drafts[chatId] = text
      this.persist()
    },

    clearDraft (chatId) {
      delete this.drafts[chatId]
      this.persist()
    }
  }
})
