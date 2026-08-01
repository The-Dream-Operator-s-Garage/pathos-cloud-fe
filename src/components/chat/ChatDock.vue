<template>
  <!-- The chat window — 7th docked window rising from the nav bar (same
       chrome as the maker). Left column: the conversations you're part of
       + the new-conversation entity search. Main area: the open
       conversation as classic chat — others left, you right — with a
       composer whose [[pathos:…]] refs route through the access tree in
       SHARE mode (grant to the conversation, never publish). -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="chat-dock dock-window"
      :class="{ 'is-maximized': store.isMaximized }"
      :style="{ zIndex: windows.zOf('chat'), '--dock-right': windows.dockRight + 'px' }"
    >
      <header class="dock-bar">
        <div class="dock-bar__left">
          <q-icon name="forum" size="15px" class="chat-dock__bar-icon" />
          <span class="dock-bar__title">Chats</span>
          <span v-if="chats.length" class="dock-bar__meta">{{ chats.length }} conversation{{ chats.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="traffic">
          <button class="traffic__dot traffic__dot--green" title="Maximize" @click="store.toggleMaximize()" />
          <button class="traffic__dot traffic__dot--yellow" title="Minimize to the bar" @click="store.minimize()" />
          <button class="traffic__dot traffic__dot--red" title="Close" @click="store.close()" />
        </div>
      </header>

      <div class="chat-dock__body">
        <!-- ── Conversations column ── -->
        <aside class="chat-dock__list">
          <div class="chat-dock__list-head">
            <span>conversations</span>
            <q-btn
              flat dense size="sm" icon="add_comment" no-caps
              :class="{ 'is-active': composeOpen }"
              title="Start a conversation"
              @click="composeOpen = !composeOpen"
            />
          </div>

          <div v-if="composeOpen" class="chat-dock__new">
            <q-input
              v-model="entityQuery"
              dense outlined :dark="false"
              placeholder="Find an entity…"
              @update:model-value="searchEntities"
            >
              <template #prepend><q-icon name="search" size="14px" /></template>
            </q-input>
            <button
              v-for="e in entityResults"
              :key="e.id"
              type="button"
              class="chat-dock__entity"
              @click="startChat(e)"
            >
              <q-icon name="person" size="13px" />
              <span>{{ e.primary }}</span>
              <span class="mono chat-dock__entity-hash">{{ (e.hash || '').slice(0, 8) }}</span>
            </button>
          </div>

          <div class="chat-dock__rows">
            <button
              v-for="c in chats"
              :key="c.id"
              type="button"
              class="chat-row"
              :class="{ 'is-active': c.id === store.activeChatId }"
              @click="openChat(c.id)"
            >
              <div class="chat-row__names">
                {{ othersOf(c) }}
                <span v-if="c.my_status === 'PENDING'" class="chat-row__badge">invitation</span>
                <span v-else-if="c.my_status === 'DECLINED'" class="chat-row__badge is-declined">declined</span>
              </div>
              <div v-if="c.last" class="chat-row__last">{{ c.last.excerpt }}</div>
            </button>
            <div v-if="!loadingChats && !chats.length" class="chat-dock__hint">
              No conversations yet — find an entity above and say hi.
            </div>
          </div>
        </aside>

        <!-- ── Conversation ── -->
        <main class="chat-dock__conv">
          <template v-if="activeChat">
            <header class="chat-dock__conv-head">
              <q-icon name="forum" size="14px" />
              <strong>{{ othersOf(activeChat) }}</strong>
              <!-- Presence IS the SSE connection (Thread G): the dot means
                   the other side holds a live stream right now. -->
              <span
                v-if="othersOnline"
                class="chat-dock__presence"
                title="connected now"
              />
            </header>

            <!-- Consent gate (2026-07): a pending seat gets the accept /
                 decline banner — replying also accepts. -->
            <div v-if="myStatus === 'PENDING'" class="chat-dock__consent">
              <q-icon name="waving_hand" size="15px" />
              <span>{{ othersOf(activeChat) }} wants to chat with you.</span>
              <q-btn
                unelevated dense no-caps size="sm" color="positive" label="Accept"
                :loading="consenting === 'accept'" @click="consent('accept')"
              />
              <q-btn
                outline dense no-caps size="sm" color="negative" label="Decline"
                :loading="consenting === 'decline'" @click="consent('decline')"
              />
            </div>

            <!-- Agent availability (2026-07-31): a free-tier agent whose
                 quota bundle says the daily pool is empty announces WHEN
                 it is back — read from the AGENT_PROFILE skeleton's stored
                 state, never by spending a provider request. -->
            <div v-if="agentAway" class="chat-dock__agent-away">
              <q-icon name="hourglass_bottom" size="15px" />
              <span>
                {{ agentAway.name || 'This agent' }} is not available —
                free-tier quota resets in {{ agentAwayIn }}
              </span>
            </div>

            <div ref="scrollRef" class="chat-dock__msgs">
              <template v-for="item in items" :key="item.id">
                <!-- Access polls: the decider gets the Yes/No card. -->
                <PollCard
                  v-if="item.kind === 'poll'"
                  :item="item"
                  :viewer-ids="myIds"
                  @voted="loadFeed({ silent: true })"
                />
                <!-- Organization invites: the invitee gets Accept/Decline. -->
                <OrgInviteCard
                  v-else-if="item.kind === 'org_invite'"
                  :item="item"
                  :viewer-ids="myIds"
                  @answered="loadFeed({ silent: true })"
                />
                <MessageBubble
                  v-else
                  :body="item.body"
                  :author="item.author"
                  :mine="isMine(item)"
                  :when="item.moment"
                />
                <!-- The quiet seen line (Thread G): under the newest of MY
                     messages the other side's watermark covers. -->
                <div
                  v-if="seenMarker && seenMarker.afterId === item.id"
                  class="chat-dock__seen"
                  :title="seenMarker.at || undefined"
                >{{ seenMarker.text }}</div>
              </template>
              <div v-if="!loadingFeed && !items.length" class="chat-dock__hint">
                No messages yet — the conversation starts with you.
              </div>
            </div>

            <footer class="chat-dock__composer">
              <q-input
                v-model="draftText"
                type="textarea" outlined dense autogrow :dark="false"
                :input-style="{ maxHeight: '110px' }"
                :disable="composerLocked"
                :placeholder="composerHint"
                @keydown.enter.exact.prevent="beginSend"
              />
              <q-btn
                unelevated dense no-caps color="primary" icon="send"
                :loading="sending" :disable="composerLocked || !draftText.trim()"
                title="Send (Enter)"
                @click="beginSend"
              />
            </footer>
            <div v-if="gateMsg" class="chat-dock__gate">{{ gateMsg }}</div>
          </template>

          <div v-else class="chat-dock__empty">
            <q-icon name="forum" size="28px" />
            <span>Pick a conversation — or start one with the + above.</span>
          </div>
        </main>
      </div>

      <!-- Refs in the outgoing message route through the access tree in
           SHARE mode: the message always reaches the members; the tree
           decides which of the sender's referenced elements open to them. -->
      <AccessTreeDialog
        v-model="shareOpen"
        mode="share"
        :content="pendingText"
        :title="othersOf(activeChat)"
        @confirm="doSend"
        @cancel="sending = false"
      />
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useChatStore } from 'src/stores/chat'
import { useWindowsStore } from 'src/stores/windows'
import { useAuthStore } from 'src/stores/auth'
import { useEventsStore } from 'src/stores/events'
import { chatService } from 'src/services/chat.service'
import { refService } from 'src/services/ref.service'
import MessageBubble from './MessageBubble.vue'
import PollCard from './PollCard.vue'
import OrgInviteCard from 'src/components/organizations/OrgInviteCard.vue'
import AccessTreeDialog from 'src/components/maker/AccessTreeDialog.vue'

const REF_RE = /[!-]?\[\[pathos:[a-z]+\/[0-9a-f]{4,64}(?:\|[^\]]*)?\]\]/

export default defineComponent({
  name: 'ChatDock',
  components: { MessageBubble, PollCard, OrgInviteCard, AccessTreeDialog },

  setup () {
    const store = useChatStore()
    const windows = useWindowsStore()
    const auth = useAuthStore()

    const chats = ref([])
    const loadingChats = ref(false)
    const items = ref([])
    const members = ref([])
    const loadingFeed = ref(false)
    const sending = ref(false)
    const scrollRef = ref(null)

    // Consent gate (2026-07): my seat state + the other side's.
    const myStatus = ref('ACCEPTED')
    const pendingOthers = ref(false)
    const consenting = ref(null)
    const gateMsg = ref('')

    const composeOpen = ref(false)
    const entityQuery = ref('')
    const entityResults = ref([])

    const shareOpen = ref(false)
    const pendingText = ref('')

    const myIds = computed(() => {
      const u = auth.user || {}
      return [u.entityId, u.rootEntityId, u.id].map((x) => parseInt(x, 10)).filter(Boolean)
    })

    const activeChat = computed(() => chats.value.find((c) => c.id === store.activeChatId) || null)

    const othersOf = (c) => {
      if (!c) return ''
      const others = (c.members || []).filter((m) => !m.is_me)
      return others.map((m) => m.display_name || m.username || `#${m.id}`).join(', ') || 'just you'
    }

    const isMine = (item) => myIds.value.includes(item.author?.id)

    const draftText = computed({
      get: () => store.activeChatId != null ? store.draftFor(store.activeChatId) : '',
      set: (v) => { if (store.activeChatId != null) store.setDraft(store.activeChatId, v) }
    })

    const scrollToEnd = async () => {
      await nextTick()
      const el = scrollRef.value
      if (el) el.scrollTop = el.scrollHeight
    }

    const loadChats = async () => {
      loadingChats.value = true
      try {
        const r = await chatService.list()
        if (r.success) {
          chats.value = r.chats
          if (store.activeChatId && !chats.value.find((c) => c.id === store.activeChatId)) {
            store.setActive(chats.value[0]?.id ?? null)
          }
        }
      } catch (_) { /* bar shows empty list */ }
      loadingChats.value = false
    }

    const loadFeed = async ({ silent = false } = {}) => {
      if (!store.activeChatId) { items.value = []; return }
      if (!silent) loadingFeed.value = true
      try {
        const r = await chatService.feed(store.activeChatId)
        if (r.success) {
          const grew = r.items.length !== items.value.length
          items.value = r.items
          members.value = r.members
          myStatus.value = r.my_status || 'ACCEPTED'
          pendingOthers.value = !!r.pending_others
          gateMsg.value = ''
          if (grew) scrollToEnd()
        }
      } catch (_) { /* conversation may have been left/denied */ }
      loadingFeed.value = false
    }

    // The composer freezes once the opener is out and the other side has
    // not consented yet (the server enforces 40311/40313 regardless).
    const iOpened = computed(() =>
      items.value.some((i) => i.kind === 'message' && myIds.value.includes(i.author?.id)))
    const otherDeclined = computed(() =>
      (members.value || []).some((m) => !m.is_me && m.status === 'DECLINED'))
    const composerLocked = computed(() =>
      myStatus.value === 'DECLINED' || otherDeclined.value ||
      (pendingOthers.value && iOpened.value))
    const composerHint = computed(() => {
      if (myStatus.value === 'DECLINED') return 'You declined this conversation'
      if (otherDeclined.value) return 'They declined this conversation'
      if (pendingOthers.value && iOpened.value) return 'Waiting for them to accept…'
      return 'Message — [[pathos:kind/hash]] refs render as minis'
    })

    // ── Agent availability (2026-07-31) ─────────────────────
    // A free-tier agent member whose quota bundle says the pool is empty:
    // the band tells the human WHEN it is back. `resets_at` comes from the
    // AGENT_PROFILE skeleton's QUOTA_RESET moment; the countdown just
    // reads the clock — no request is ever spent asking "are you up".
    const nowTick = ref(Date.now())
    const tickTimer = setInterval(() => { nowTick.value = Date.now() }, 30000)
    onBeforeUnmount(() => clearInterval(tickTimer))
    const agentAway = computed(() => {
      const m = (members.value || []).find((mm) =>
        !mm.is_me && mm.agent && mm.agent.free_tier && !mm.agent.available)
      return m ? m.agent : null
    })
    const agentAwayIn = computed(() => {
      if (!agentAway.value?.resets_at) return 'a while'
      const s = Math.max(0,
        Math.round((new Date(agentAway.value.resets_at).getTime() - nowTick.value) / 1000))
      const mins = Math.ceil(s / 60)
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    })

    // ── Delivery semantics (Thread G) ───────────────────────
    // The server advances each member's watermark (last_read_link_id) when
    // they read the feed; the seen line sits under the newest of MY
    // messages that some other member's watermark covers — anything after
    // it is implicitly un-seen. Group chats name who has seen it.
    const seenMarker = computed(() => {
      const others = (members.value || []).filter((m) => !m.is_me)
      if (!others.length) return null
      const mineSeen = [...items.value].reverse().find((i) =>
        i.kind === 'message' && i.link_id && isMine(i) &&
        others.some((m) => (m.last_read_link_id || 0) >= i.link_id))
      if (!mineSeen) return null
      const seers = others.filter((m) => (m.last_read_link_id || 0) >= mineSeen.link_id)
      const at = seers
        .map((m) => m.last_read_at).filter(Boolean).sort().pop() || null
      return {
        afterId: mineSeen.id,
        at: at ? new Date(at).toLocaleString() : null,
        text: others.length === 1
          ? 'seen'
          : 'seen by ' + seers.map((m) => m.display_name || m.username || `#${m.id}`).join(', ')
      }
    })

    // Presence: the feed's member roster carries `online` (a live SSE
    // stream exists for that entity right now).
    const othersOnline = computed(() =>
      (members.value || []).some((m) => !m.is_me && m.online))

    const consent = async (verb) => {
      if (!store.activeChatId) return
      consenting.value = verb
      try {
        const r = verb === 'accept'
          ? await chatService.accept(store.activeChatId)
          : await chatService.decline(store.activeChatId)
        if (r.success) {
          myStatus.value = r.status
          await loadChats()
          await loadFeed({ silent: true })
        }
      } catch (_) { /* seat unchanged */ }
      consenting.value = null
    }

    const openChat = (id) => {
      store.setActive(id)
      composeOpen.value = false
      loadFeed()
    }

    // ── New conversation ────────────────────────────────────
    let searchTimer = null
    const searchEntities = () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(async () => {
        const q = entityQuery.value.trim()
        if (!q) { entityResults.value = []; return }
        try {
          const r = await refService.search('entities', q, 6)
          entityResults.value = (r.results || []).filter((e) => !myIds.value.includes(e.id))
        } catch (_) { entityResults.value = [] }
      }, 250)
    }

    const startChat = async (entity) => {
      try {
        const r = await chatService.open([entity.id])
        if (r.success) {
          composeOpen.value = false
          entityQuery.value = ''
          entityResults.value = []
          await loadChats()
          openChat(r.chat.id)
        }
      } catch (_) { /* stays on the list */ }
    }

    // ── Send (through the share tree when refs are present) ──
    const beginSend = () => {
      const text = draftText.value.trim()
      if (!text || sending.value || !store.activeChatId) return
      sending.value = true
      pendingText.value = text
      if (REF_RE.test(text)) {
        shareOpen.value = true // doSend fires on confirm
      } else {
        doSend({ publish: [] })
      }
    }

    const doSend = async (access) => {
      const chatId = store.activeChatId
      try {
        const r = await chatService.send(chatId, pendingText.value, access?.publish || [])
        if (r.success) {
          store.clearDraft(chatId)
          items.value.push(r.message)
          myStatus.value = 'ACCEPTED' // a reply is an acceptance
          gateMsg.value = ''
          scrollToEnd()
          loadChats() // refresh the last-message previews
        }
      } catch (e) {
        // Consent-gate rejections (40311/40312/40313) explain themselves.
        gateMsg.value = e?.response?.data?.error?.message || ''
        if (gateMsg.value) loadFeed({ silent: true })
      }
      sending.value = false
    }

    // ── Live append (Thread A): the event spine is the primary refresh.
    // A pushed chat.message / poll.* / org.invite for the OPEN conversation
    // reloads its feed inside the same second and acks that event (it was
    // seen where it lives); anything for another conversation refreshes
    // the previews so the list's last-line + order stay honest.
    const events = useEventsStore()
    const CHAT_KINDS = ['chat.message', 'poll.minted', 'poll.decided', 'org.invite']
    watch(() => events.lastEvent, (e) => {
      if (!e) return
      if (!store.isOpen || store.isMinimized) return
      // chat.read is SILENT (arrives pre-read, no ack): the other side's
      // watermark moved — refresh the open conversation's seen line only.
      if (e.kind === 'chat.read') {
        if (e.meta?.chat_id != null && e.meta.chat_id === store.activeChatId) {
          loadFeed({ silent: true })
        }
        return
      }
      if (!CHAT_KINDS.includes(e.kind)) return
      if (e.meta?.chat_id != null && e.meta.chat_id === store.activeChatId) {
        loadFeed({ silent: true })
        events.ack([e.id])
      }
      loadChats()
    })

    // ── Lifecycle: load on open + a slow poll as the SSE fallback (the
    // spine does the live work; this catches a dropped stream).
    let pollTimer = null
    watch(() => [store.isOpen, store.isMinimized], async ([open, min]) => {
      clearInterval(pollTimer)
      if (open && !min) {
        await loadChats()
        await loadFeed()
        scrollToEnd()
        pollTimer = setInterval(() => {
          if (store.activeChatId) loadFeed({ silent: true })
        }, 60000)
      }
    }, { immediate: true })

    onBeforeUnmount(() => clearInterval(pollTimer))

    return {
      store,
      windows,
      chats,
      loadingChats,
      items,
      members,
      loadingFeed,
      sending,
      scrollRef,
      composeOpen,
      entityQuery,
      entityResults,
      shareOpen,
      pendingText,
      activeChat,
      othersOf,
      isMine,
      myIds,
      loadFeed,
      draftText,
      openChat,
      searchEntities,
      startChat,
      beginSend,
      doSend,
      myStatus,
      pendingOthers,
      consenting,
      consent,
      gateMsg,
      composerLocked,
      composerHint,
      agentAway,
      agentAwayIn,
      seenMarker,
      othersOnline
    }
  }
})
</script>

<style lang="scss" scoped>
.chat-dock {
  width: 74vw;
  height: 72vh;
  display: flex;
  flex-direction: column;

  &.is-maximized {
    width: calc(100vw - var(--dock-right, 0px));
    height: calc(100vh - var(--dock-bottom));
  }

  // Mobile pass (Thread H): the whole width (the rail reserve is 0 here).
  // Stated in the SCOPED block — the base 74vw above outranks any global
  // override (scoped selectors carry the data-v attribute's specificity).
  @media (max-width: 600px) {
    width: 100vw;
    height: calc(100vh - var(--dock-bottom));
  }
}

.chat-dock__bar-icon { color: #00829c; }
.dock-bar__left { display: flex; align-items: center; gap: 7px; min-width: 0; }
.dock-bar__title { font-weight: 700; font-size: 0.78em; }
.dock-bar__meta { font-size: 0.68em; color: var(--ink-mute, #8995a8); text-transform: uppercase; letter-spacing: 0.05em; }

.chat-dock__body {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;

  // Mobile pass (Thread H): the conversations column gives the thread most
  // of a 375px screen (the dock itself goes full-width in _components.scss).
  @media (max-width: 600px) {
    grid-template-columns: minmax(110px, 34%) minmax(0, 1fr);
  }
}

// ── Conversations column ──
.chat-dock__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid rgba(var(--ink-rgb), 0.14);
  background: rgba(var(--ink-rgb), 0.025);
}

.chat-dock__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 4px;
  font-size: 0.66em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-mute, #8995a8);
  .q-btn.is-active { color: #00829c; }
}

.chat-dock__new {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 10px 8px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.16);
}

.chat-dock__entity {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 6px;
  background: var(--paper-card, #ffffff);
  font-family: inherit;
  font-size: 0.78em;
  cursor: pointer;
  text-align: left;
  &:hover { border-color: #00829c; color: #00829c; }
  .q-icon { color: #9b6cb0; }
}
.chat-dock__entity-hash { margin-left: auto; opacity: 0.45; font-size: 0.85em; }

.chat-dock__rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 8px;
  background: var(--paper-card, #ffffff);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, background 0.12s;

  &:hover { border-color: rgba(#00829c, 0.5); }
  &.is-active {
    border-color: #00829c;
    background: rgba(#00829c, 0.07);
  }
}
.chat-row__names { font-size: 0.8em; font-weight: 700; color: var(--ink, #1f2a38); }
.chat-row__badge {
  margin-left: 6px;
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 6px;
  border-radius: 7px;
  border: 1px solid rgba(#0b7a8a, 0.55);
  color: #0b7a8a;
  &.is-declined { border-color: rgba(#c10015, 0.45); color: #a5121f; }
}
.chat-row__last {
  font-size: 0.7em;
  color: var(--ink-mute, #8995a8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-dock__hint {
  font-size: 0.74em;
  color: var(--ink-mute, #8995a8);
  padding: 10px;
  line-height: 1.4;
}

// ── Conversation ──
.chat-dock__conv {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.chat-dock__conv-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.82em;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
  .q-icon { color: #00829c; }
}

.chat-dock__presence {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #21ba45;
  box-shadow: 0 0 0 2px rgba(#21ba45, 0.22);
  flex-shrink: 0;
}

.chat-dock__seen {
  font-size: 0.62em;
  color: var(--ink-mute, #8995a8);
  text-align: right;
  padding: 0 6px;
  margin-top: -2px;
}

.chat-dock__msgs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.chat-dock__composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(var(--ink-rgb), 0.12);

  .q-input { flex: 1; }
  .q-btn { flex-shrink: 0; margin-bottom: 2px; }
}

.chat-dock__consent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.78em;
  border-bottom: 1px dashed rgba(#0b7a8a, 0.45);
  background: rgba(#0b7a8a, 0.05);
  .q-icon { color: #0b7a8a; }
  span { flex: 1; }
}
.chat-dock__gate {
  font-size: 0.7em;
  color: var(--coral-deep, #b25e49);
  text-align: right;
  padding: 0 14px 8px;
}
.chat-dock__agent-away {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.78em;
  border-bottom: 1px dashed rgba(#b25e49, 0.45);
  background: rgba(#b25e49, 0.06);
  .q-icon { color: #b25e49; }
  span { flex: 1; }
}

.chat-dock__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--ink-mute, #8995a8);
  font-size: 0.82em;
}
</style>
