import { defineStore } from 'pinia'
import { useWindowsStore } from 'src/stores/windows'
import { chatService } from 'src/services/chat.service'

// The chat dock's state: window flags (maker-pattern — flags live here,
// z-order in stores/windows.js), the open conversation, and one in-flight
// composer draft per conversation (session + localStorage persisted so a
// half-typed message survives minimize/reload).
//
// ⭐ AND THE CONVERSATION LIST (2026-10-31) — `GET /chats`, latest first,
// with each chat's `message_count` + `unread`. It lived in ChatDock alone
// until the footer's chat strip (components/chat/ChatStrip.vue) began
// drawing the most recent faces with their counts while the window is shut,
// so the two surfaces read ONE list and a read in the window clears the
// strip's chip at once (`markRead`).

const STORAGE_KEY = 'pathos_chat'

// `loadChats`' one flight + whether a call landed during it.
let chatsFlight = null
let chatsAgain = false

export const useChatStore = defineStore('chat', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    activeChatId: null,
    // chatId → composer text
    drafts: {},
    loaded: false,
    // GET /chats, latest activity first (see the note above).
    chats: [],
    chatsLoaded: false
  }),

  getters: {
    // The window is up and showing a conversation — the one chat whose
    // unread can never be anything but 0, whatever the last list said
    // (the server's watermark write lands just after the feed read).
    standing: (s) => s.isOpen && !s.isMinimized
  },

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

    // ONE flight at a time: a call landing mid-flight asks for exactly one
    // more pass after it, so the dock's refresh and the strip's never stack
    // up requests and the last word is always the newest list.
    async loadChats () {
      if (chatsFlight) { chatsAgain = true; return chatsFlight }
      chatsFlight = (async () => {
        do {
          chatsAgain = false
          try {
            const r = await chatService.list()
            if (r.success) {
              this.chats = (r.chats || []).map((c) => (
                this.standing && c.id === this.activeChatId ? { ...c, unread: 0 } : c))
            }
          } catch (_) { /* keep the last list */ }
        } while (chatsAgain)
        this.chatsLoaded = true
        chatsFlight = null
      })()
      return chatsFlight
    },

    // A conversation just read in the window — its chip clears now, not on
    // the next list.
    markRead (chatId) {
      const c = this.chats.find((x) => x.id === chatId)
      if (c && c.unread) c.unread = 0
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
