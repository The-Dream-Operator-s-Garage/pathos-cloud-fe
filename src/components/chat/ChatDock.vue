<template>
  <!-- The chat window — 7th docked window rising from the nav bar. Since
       2026-08-03 it wears the CREATION FOOTPRINT (`.dock-window--creation`,
       user ask: "make the window occupy the same dimensions as the maker and
       uploader windows when expanded"), so the five docks are one window on
       every screen — right half of the display, daylight off the crown strip
       and the side column, welded to the nav bar's top edge OVER the footer
       frieze band. Its own identity is the GREEN COLORWAY
       (`.dock-window--chat`, opaque — the glass shell and its backdrop blur
       are gone) plus the frieze band under the header.

       Left column: the conversations you're part of + the new-conversation
       entity search. Main area: the open conversation as classic chat —
       others left, you right — with a composer whose [[pathos:…]] refs route
       through the access tree in SHARE mode (grant to the conversation,
       never publish). -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="chat-dock dock-window dock-window--creation dock-window--chat"
      :class="{ 'is-max': store.isMaximized, 'is-faces': facesOnly, 'is-list-open': listOverlay }"
      :style="{ zIndex: windows.zOf('chat'), '--dock-right': windows.dockRight + 'px' }"
    >
      <header class="dock-bar">
        <div class="dock-bar__left">
          <q-icon name="forum" size="15px" class="dock-bar__icon" />
          <span class="dock-bar__title">Chats</span>
          <span v-if="chats.length" class="dock-bar__meta">{{ chats.length }} conversation{{ chats.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="traffic">
          <button class="traffic__dot traffic__dot--red" title="Close" @click="store.close()" />
          <button class="traffic__dot traffic__dot--yellow" title="Minimize to the bar" @click="store.minimize()" />
          <button class="traffic__dot traffic__dot--green" title="Maximize" @click="store.toggleMaximize()" />
        </div>
      </header>

      <!-- The platform's own band, dressed in this window's family (the three
           `--frieze-bar-*` dials — see the style block). It divides the
           header from the conversation the way the crown strip divides the
           chrome from the page. -->
      <FriezeBar class="chat-dock__frieze" />

      <div class="chat-dock__body">
        <!-- ── Conversations column ──
             On a phone this is a FACES RAIL by default (2026-08-03, user ask:
             "display the contacts as images only so we have more space to look
             at the chats"), and the head's one control expands it into a
             full-width overlay where the entity search is usable again. -->
        <aside class="chat-dock__list">
          <div class="chat-dock__list-head">
            <!-- Mobile only: the rail ⇄ overlay handle. It leads the row so it
                 lands under the thumb at the column's own edge, and it is the
                 ONLY thing the head shows while the rail is narrow. -->
            <q-btn
              v-if="windows.isMobile"
              flat dense size="sm" no-caps
              :icon="listOverlay ? 'chevron_left' : 'manage_search'"
              :title="listOverlay ? 'Back to the conversation' : 'Expand contacts — search and pick'"
              class="chat-dock__list-toggle"
              @click="listOverlay = !listOverlay"
            />
            <span v-if="!facesOnly">conversations</span>
            <q-btn
              v-if="!facesOnly"
              flat dense size="sm" icon="add_comment" no-caps
              :class="{ 'is-active': composeOpen }"
              title="Start a conversation"
              @click="composeOpen = !composeOpen"
            />
          </div>

          <div v-if="composeOpen && !facesOnly" class="chat-dock__new">
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

          <!-- A conversation row is the FEED CARD's byline block (2026-08-03,
               user ask: "make the recent chat bubbles on the left side have
               more details, just like the author bubbles on the feed post
               cards … the image and org badges in a dense style"): face, name
               over @handle, org badge. Same components, same 26/15px dense
               sizing — a person reads the same wherever the platform draws
               them. In a group the first seat carries the face and a `+n`
               chip states the rest. -->
          <div class="chat-dock__rows">
            <button
              v-for="c in chats"
              :key="c.id"
              type="button"
              class="chat-row"
              :class="{ 'is-active': c.id === store.activeChatId }"
              :title="othersOf(c)"
              @click="openChat(c.id)"
            >
              <span class="chat-row__who">
                <EntityAvatar :entity="peerOf(c)" :id="peerOf(c) ? null : c.owner_id" :size="26" />
                <span v-if="extraPeers(c)" class="chat-row__more mono">+{{ extraPeers(c) }}</span>
                <span class="chat-row__ident">
                  <span class="chat-row__name">{{ othersOf(c) }}</span>
                  <!-- An AGENT seat has no user_login, so no handle — the line
                       is dropped rather than left as an empty row, which would
                       make the block taller than its neighbour's for nothing. -->
                  <span v-if="peerHandle(c)" class="chat-row__handle mono">{{ peerHandle(c) }}</span>
                </span>
                <!-- `:link="false"` is not a preference — the row IS a
                     <button>, and the chip's default router-link would nest
                     interactive content inside it (invalid, and the anchor
                     swallows the row's own tap). The org's page stays one tap
                     away through the conversation header. -->
                <OrgLogoChip
                  v-if="peerOrg(c)"
                  :org="peerOrg(c)"
                  :size="15"
                  :link="false"
                />
                <span v-if="c.my_status === 'PENDING'" class="chat-row__badge">invitation</span>
                <span v-else-if="c.my_status === 'DECLINED'" class="chat-row__badge is-declined">declined</span>
              </span>
              <span v-if="c.last" class="chat-row__last">{{ c.last.excerpt }}</span>
            </button>
            <div v-if="!loadingChats && !chats.length && !facesOnly" class="chat-dock__hint">
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
              <!-- The channel contract (Thread K): a standing panel derived
                   from actual state — seats + every shared ref's audience. -->
              <q-btn
                flat dense size="sm" icon="policy" no-caps
                class="chat-dock__contract-btn"
                :class="{ 'is-active': contractOpen }"
                title="The contract — who sees what in this conversation"
                @click="contractOpen = !contractOpen"
              />
            </header>

            <ChatContractBand
              v-if="contractOpen && store.activeChatId"
              :chat-id="store.activeChatId"
              :refresh="feedTick"
            />

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
            <!-- The faces rail hides the + (and the names), so on a phone the
                 empty state names the control that IS on screen. -->
            <span v-if="facesOnly">Pick a face on the left — or expand the contacts to start a conversation.</span>
            <span v-else>Pick a conversation — or start one with the + above.</span>
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
import ChatContractBand from './ChatContractBand.vue'
import OrgInviteCard from 'src/components/organizations/OrgInviteCard.vue'
import AccessTreeDialog from 'src/components/maker/AccessTreeDialog.vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

const REF_RE = /[!-]?\[\[pathos:[a-z]+\/[0-9a-f]{4,64}(?:\|[^\]]*)?\]\]/

export default defineComponent({
  name: 'ChatDock',
  components: {
    MessageBubble,
    PollCard,
    ChatContractBand,
    OrgInviteCard,
    AccessTreeDialog,
    EntityAvatar,
    OrgLogoChip,
    FriezeBar
  },

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

    // The contract band (Thread K): open state + a tick the band reloads
    // on — bumped by every successful feed read, so shares and poll
    // grants re-derive the panel without their own event plumbing.
    const contractOpen = ref(false)
    const feedTick = ref(0)

    // Consent gate (2026-07): my seat state + the other side's.
    const myStatus = ref('ACCEPTED')
    const pendingOthers = ref(false)
    const consenting = ref(null)
    const gateMsg = ref('')

    const composeOpen = ref(false)
    const entityQuery = ref('')
    const entityResults = ref([])

    // ── The contacts column on a phone (2026-08-03) ──────────
    // Two presentations of ONE column, the same device the stack/pins side
    // widgets use: a narrow FACES RAIL by default — avatars alone, so the
    // thread gets the screen — and, on the head's one control, a full-width
    // OVERLAY where the entity search and the rows' names are usable again.
    // An overlay rather than a wider grid track: at 375px a column wide enough
    // to type a search into leaves the conversation nothing, and the rail is
    // what the reader came back to.
    const listOverlay = ref(false)
    const facesOnly = computed(() => windows.isMobile && !listOverlay.value)
    // Leaving the phone (rotate, resize) drops the overlay — it is a mobile
    // presentation and would otherwise sit over a desktop conversation.
    watch(() => windows.isMobile, (m) => { if (!m) listOverlay.value = false })

    const shareOpen = ref(false)
    const pendingText = ref('')

    const myIds = computed(() => {
      const u = auth.user || {}
      return [u.entityId, u.rootEntityId, u.id].map((x) => parseInt(x, 10)).filter(Boolean)
    })

    const activeChat = computed(() => chats.value.find((c) => c.id === store.activeChatId) || null)

    const othersOf = (c) => {
      if (!c) return ''
      const others = peersOf(c)
      return others.map((m) => m.display_name || m.username || `#${m.id}`).join(', ') || 'just you'
    }

    // ── The other seats, as identity cards ───────────────────
    // Since 2026-08-03 the API's member cards carry `photo` + `org` (the
    // batched getIdentityCards read the feed uses), so a conversation row can
    // draw the same face-and-badge block a post card's byline does. The FIRST
    // peer carries the row's face and handle and the rest are stated as a
    // count: a 26px avatar per member would make a group row taller than the
    // list it lives in.
    const peersOf = (c) => (c?.members || []).filter((m) => !m.is_me)
    const peerOf = (c) => peersOf(c)[0] || null
    const extraPeers = (c) => Math.max(0, peersOf(c).length - 1)
    const peerHandle = (c) => {
      const p = peerOf(c)
      return p?.username ? `@${p.username}` : ''
    }
    // A MASK's badge — the org it publishes under. `org.self` marks an org
    // acting as itself, where the badge would only repeat the name beside it.
    const peerOrg = (c) => {
      const org = peerOf(c)?.org
      return org && !org.self ? org : null
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
          feedTick.value++
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
      // Picking a conversation IS the overlay's purpose — it closes back to
      // the faces rail so the thread you just chose is what you see.
      listOverlay.value = false
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
      peerOf,
      peerHandle,
      peerOrg,
      extraPeers,
      listOverlay,
      facesOnly,
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
      othersOnline,
      contractOpen,
      feedTick
    }
  }
})
</script>

<style lang="scss" scoped>
// GEOMETRY IS THE CREATION DOCK'S (2026-08-03) — `.dock-window--creation` in
// _components.scss states left/right/top/bottom and `width/height: auto`, and
// `.dock-window--chat` states the tones. What was here before — `74vw × 72vh`,
// an `.is-maximized` pair and a mobile width — had to GO, not be overridden: a
// scoped `.chat-dock[data-v-…]` selector outranks those global rules, so any
// leftover width declaration would have quietly kept the old footprint.
.chat-dock {
  display: flex;
  flex-direction: column;
}

// The band under the header, in this window's family. The recipe (masks, mask
// fit, carve) is FriezeBar's and untouched; only the three tones move, and they
// keep the brown band's exact role mapping — base -4, waves -2 then -1 — so the
// motif reads the same, one hue family over. `flex: 0 0 auto` because the shell
// is a flex column and a decorative band is the first thing it would squash.
.chat-dock__frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--green-4);
  --frieze-bar-wave-one: var(--green-2);
  --frieze-bar-wave-two: var(--green-1);
}

.dock-bar__left { display: flex; align-items: center; gap: 7px; min-width: 0; }
.dock-bar__title { font-weight: 700; font-size: 0.78em; }
.dock-bar__meta { font-size: 0.68em; text-transform: uppercase; letter-spacing: 0.05em; }

.chat-dock__body {
  position: relative;   // the phone's expanded contacts column overlays this
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

// ── Conversations column ──
// A WELL (--green-2) set into the window's --green-1 coat, the same figure/
// ground step the side widgets' scroll wells take out of their brown plaque.
.chat-dock__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--green-3);
  background: var(--green-2);
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
  color: var(--green-8);
  .q-btn { color: var(--green-8); }
  .q-btn.is-active { color: var(--green-8); background: var(--green-1); }
}

.chat-dock__new {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 10px 8px;
  border-bottom: 1px dashed var(--green-4);
}

.chat-dock__entity {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--green-3);
  border-radius: 6px;
  background: var(--paper-card, #ffffff);
  font-family: inherit;
  font-size: 0.78em;
  cursor: pointer;
  text-align: left;
  &:hover { border-color: var(--green-8); color: var(--green-8); }
  .q-icon { color: var(--green-4); }
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

  scrollbar-width: thin;
  scrollbar-color: var(--green-4) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--green-4); border-radius: 2px; }
}

// A row is a --green-1 card on the column's --green-2 floor; the ACTIVE one
// goes to PAPER, which is the same "current = the lightest thing here" device
// the dock tab strip uses, with --green-4 (the colorway's heavy line) closing
// it. Nothing here is translucent: the whole window is opaque now.
.chat-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  border: 1px solid var(--green-3);
  border-radius: 8px;
  background: var(--green-1);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, background 0.12s;

  &:hover { border-color: var(--green-4); }
  &.is-active {
    border-color: var(--green-4);
    background: var(--paper-card, #ffffff);
  }
}

// ── The identity block, dense (⇔ `.post-square__identity` on a feed card) ──
// Same 5px face-to-text gap, same two stacked lines at 1.15 leading, same
// pulled-in badge — a provenance stamp you recognise rather than read.
.chat-row__who {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.chat-row__ident {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.chat-row__name {
  font-size: 0.74em;
  font-weight: 700;
  color: var(--green-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-row__handle {
  font-size: 0.62em;
  color: rgba(var(--ink-rgb), 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The badge belongs to the face beside it, not to the row — pulled in against
// the row's own gap so the pair reads as one unit ("this person, over there").
// The class lands on OrgLogoChip's ROOT, which carries this file's scope
// attribute, so no :deep() is needed.
.chat-row__who .org-logo-chip { margin-left: -2px; flex: 0 0 auto; }

// A group's remaining seats, stated as a count rather than as more faces.
.chat-row__more {
  flex: 0 0 auto;
  font-size: 0.6em;
  font-weight: 700;
  color: var(--green-8);
  background: var(--green-2);
  border: 1px solid var(--green-3);
  border-radius: 7px;
  padding: 0 4px;
}

.chat-row__badge {
  margin-left: auto;
  font-size: 0.62em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 5px;
  border-radius: 7px;
  border: 1px solid var(--green-4);
  color: var(--green-8);
  flex: 0 0 auto;
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
  border-bottom: 1px solid var(--green-3);
  color: var(--green-8);
  .q-icon { color: var(--green-8); }
}

.chat-dock__contract-btn {
  margin-left: auto;
  color: var(--green-4);
  &.is-active { color: var(--green-8); }
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

// The thread lies on the window's own coat (--green-1, inherited from the
// shell) — the bubbles carry the tone difference, so the bed stays quiet.
.chat-dock__msgs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  scrollbar-width: thin;
  scrollbar-color: var(--green-4) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--green-4); border-radius: 2px; }
}

.chat-dock__composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--green-3);

  .q-input { flex: 1; }
  .q-btn { flex-shrink: 0; margin-bottom: 2px; }
}

.chat-dock__consent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.78em;
  border-bottom: 1px dashed var(--green-4);
  background: var(--green-2);
  color: var(--green-8);
  .q-icon { color: var(--green-8); }
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

// ═══════════════════════════════════════════════════════════════════
// PHONE — the contacts column's two presentations (2026-08-03, user ask:
// "on mobile only, display the contacts as images only so we have more space
// to look at the chats. Find a way to expand that section if i want to so i
// can search for a contact there").
//
// ONE column, two states — the stack/pins device, and for the same reason: a
// rail and a panel that are different elements drift apart, where two
// presentations of one element cannot. `facesOnly` (mobile ∧ not expanded)
// narrows the grid track and hides everything in a row except its face;
// `listOverlay` lifts the same column out over the conversation at full width
// so the search field and the names have room. The window's own footprint
// (full width less a --dock-gap, rounded top corners, centred header, traffic
// on the left) is the SHARED mobile chrome in _components.scss — chat gets it
// for free now that it is a `.dock-window--creation`.
// ═══════════════════════════════════════════════════════════════════
@media (max-width: 600px) {
  // 46px = the 26px avatar + the row's 8px side padding + its 1px rims, plus
  // the column's own 6px list padding. Keep in step with `.chat-row` and
  // EntityAvatar's `:size` in the template, or the faces clip.
  .chat-dock.is-faces .chat-dock__body {
    grid-template-columns: 46px minmax(0, 1fr);
  }

  .chat-dock.is-faces {
    .chat-dock__list-head {
      justify-content: center;
      padding: 6px 0 2px;
    }

    .chat-dock__rows { padding: 6px 4px; }

    // The row IS its face: no name, no handle, no preview, no badge text. The
    // active conversation still reads — it keeps the paper fill and the heavy
    // rim, which is all a 26px tile needs to say "this one".
    .chat-row {
      padding: 3px;
      justify-content: center;
      align-items: center;
    }

    .chat-row__ident,
    .chat-row__last,
    .chat-row__more,
    .chat-row__badge { display: none; }

    // The badge survives as a DOT in the corner of the tile — an invitation
    // is the one thing on a collapsed row a reader must not miss.
    .chat-row__who { position: relative; gap: 0; }
    .chat-row__who .org-logo-chip {
      position: absolute;
      right: -3px;
      bottom: -3px;
      margin: 0;
    }
  }

  // Expanded: the same column, lifted over the thread. `position: absolute`
  // inside `.chat-dock__body` (which is `position: relative`), so the grid
  // track it left behind collapses to nothing and the conversation keeps
  // rendering underneath — coming back is one tap, with no reload.
  .chat-dock.is-list-open .chat-dock__list {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-right: none;
  }

  // The handle keeps a touch target of its own in both presentations.
  .chat-dock__list-toggle { min-width: 30px; }
}
</style>
