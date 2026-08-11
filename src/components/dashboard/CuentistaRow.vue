<template>
  <!-- CUENTISTA'S ROW (dashboards phase 7, 2026-08-11) — the agent seat
       under the dashboard strip. Collapsed: one quiet bar. Expanded: the
       pair-chat thread + the ask input.

       CONTEXT IS GRANTS, never blanket reads: every ask goes out with
       shareRefs = the open board's ref + its displayed item refs + any
       elements dragged onto the input (NanoRefChips — inert until send).
       The same refs ride the body as micro chips, which is exactly what
       the listener reads its context from. The seat answers through
       chat; transformations arrive as approval polls whose PollCard face
       carries Approve / No / Modify and, once approved, Apply — the
       change replays under YOUR identity, never the seat's.

       Grey family with the ONE quasar-teal accent as the speaking light. -->
  <div
    class="cuentista-row"
    :class="{ 'is-open': open, 'is-dragover': dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <button type="button" class="cuentista-row__bar" @click="toggle">
      <span class="cuentista-row__light" :class="{ 'is-on': busy }" />
      <EntityAvatar v-if="seat" :entity="seat" :size="18" class="cuentista-row__face" />
      <span class="cuentista-row__name nasalization">Cuentista</span>
      <span class="cuentista-row__hint">{{ open ? 'the counting storyteller' : 'ask about this board…' }}</span>
      <q-space />
      <q-icon :name="open ? 'expand_more' : 'expand_less'" size="14px" class="cuentista-row__fold" />
    </button>

    <div v-if="open" class="cuentista-row__body">
      <div ref="threadEl" class="cuentista-row__thread">
        <div v-if="loading" class="cuentista-row__line"><q-spinner size="12px" /></div>
        <div v-else-if="!items.length" class="cuentista-row__line">
          Nothing yet — ask about the tables on this board.
        </div>
        <template v-for="it in items" :key="it.id + '-' + (it.link_id || 0)">
          <PollCard
            v-if="it.kind === 'poll'"
            :item="it"
            :viewer-ids="viewerIds"
            @modify="onModify"
            @applied="onApplied"
            @voted="loadThread"
          />
          <MessageBubble
            v-else
            :body="it.body || ''"
            :author="it.author"
            :mine="it.author?.id !== seat?.id"
            :when="it.moment"
          />
        </template>
      </div>

      <div v-if="nanoRefs.length" class="cuentista-row__nanos">
        <NanoRefChip
          v-for="r in nanoRefs" :key="r"
          :address="r"
          @remove="nanoRefs = nanoRefs.filter(x => x !== r)"
        />
      </div>

      <div class="cuentista-row__composer">
        <input
          ref="inputEl"
          v-model="ask"
          type="text"
          class="cuentista-row__input"
          placeholder="Ask, or say what to change — drop elements here for context"
          :disabled="sending"
          @keydown.enter.prevent="send"
        >
        <button
          type="button" class="cuentista-row__send"
          :disabled="sending || !ask.trim()"
          title="Ask Cuentista (grants the board's refs to the seat)"
          @click="send"
        >
          <q-spinner v-if="sending" size="12px" />
          <q-icon v-else name="send" size="13px" />
        </button>
      </div>
      <div v-if="gateMsg" class="cuentista-row__gate">{{ gateMsg }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import MessageBubble from 'src/components/chat/MessageBubble.vue'
import PollCard from 'src/components/chat/PollCard.vue'
import NanoRefChip from 'src/components/dashboard/NanoRefChip.vue'
import { chatService } from 'src/services/chat.service'
import { skeletonService } from 'src/services/skeleton.service'
import api from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'
import { useEventsStore } from 'src/stores/events'

export default defineComponent({
  name: 'CuentistaRow',
  components: { EntityAvatar, MessageBubble, PollCard, NanoRefChip },
  props: {
    // The open board's address — the FIRST ref every ask grants.
    dashboardRef: { type: String, default: '' },
    // The refs the grid is currently showing (items) — granted with it.
    itemRefs: { type: Array, default: () => [] }
  },
  // applied: a transformation landed — the host reloads the grid.
  emits: ['applied'],
  setup (props, { emit }) {
    const auth = useAuthStore()
    const events = useEventsStore()

    const open = ref(false)
    const loading = ref(false)
    const sending = ref(false)
    const busy = ref(false)
    const ask = ref('')
    const gateMsg = ref('')
    const items = ref([])
    const nanoRefs = ref([])
    const dragOver = ref(false)
    const seat = ref(null)
    const chatId = ref(null)
    const threadEl = ref(null)
    const inputEl = ref(null)

    const viewerIds = computed(() => [auth.entityId, auth.rootEntityId].filter(Boolean))

    // ── the seat (resolved once per session) ───────────────────────
    const resolveSeat = async () => {
      if (seat.value) return seat.value
      try {
        const { data } = await api.get('/refs/search', { params: { kind: 'entities', q: 'cuentista', limit: 5 } })
        const hit = (data.results || data.items || []).find(
          (r) => String(r.primary || '').toLowerCase() === 'cuentista'
        )
        if (hit?.id != null) seat.value = { id: hit.id, path: 'entities/' + hit.hash, username: 'cuentista', display_name: 'Cuentista' }
      } catch (_) { /* the row stays quiet */ }
      return seat.value
    }

    const ensureChat = async () => {
      if (chatId.value) return chatId.value
      const s = await resolveSeat()
      if (!s) { gateMsg.value = 'Cuentista is not seeded on this world.'; return null }
      const r = await chatService.open([s.id])
      if (r.success) chatId.value = r.chat.id
      return chatId.value
    }

    const scrollToEnd = async () => {
      await nextTick()
      if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
    }

    const loadThread = async () => {
      if (!chatId.value) return
      loading.value = true
      try {
        const r = await chatService.feed(chatId.value, 40)
        if (r.success) {
          items.value = r.items || []
          // The seat is typing while the newest message is OURS.
          const last = items.value[items.value.length - 1]
          busy.value = !!last && last.kind === 'message' && last.author?.id !== seat.value?.id
        }
      } catch (_) { /* keep the old thread */ }
      loading.value = false
      scrollToEnd()
    }

    const toggle = async () => {
      open.value = !open.value
      if (open.value) {
        if (await ensureChat()) await loadThread()
      }
    }

    // ── the ask (grants ride with it) ──────────────────────────────
    const send = async () => {
      const text = ask.value.trim()
      if (!text || sending.value) return
      if (!(await ensureChat())) return
      sending.value = true
      gateMsg.value = ''
      const refs = [...new Set([
        props.dashboardRef,
        ...props.itemRefs,
        ...nanoRefs.value
      ].filter(Boolean))]
      const chips = refs.map((r) => `-[[pathos:${r}]]`).join(' ')
      const body = chips ? `${text}\n\n${chips}` : text
      try {
        const r = await chatService.send(chatId.value, body, refs)
        if (r.success) {
          ask.value = ''
          nanoRefs.value = []
          busy.value = true
          await loadThread()
        } else {
          gateMsg.value = r.error?.message || 'could not send'
        }
      } catch (e) {
        gateMsg.value = e?.response?.data?.error?.message || 'could not send'
      }
      sending.value = false
    }

    // ── drops (NanoRefChip — inert until send) ─────────────────────
    const onDrop = (e) => {
      dragOver.value = false
      try {
        const payload = JSON.parse(e.dataTransfer.getData('application/x-pathos-ref'))
        if (payload?.address && !nanoRefs.value.includes(payload.address)) {
          nanoRefs.value.push(payload.address)
          if (!open.value) open.value = true
        }
      } catch (_) { /* not ours */ }
    }

    // ── the transformation faces ───────────────────────────────────
    // Modify = decline + prefill: the original PROMPT comes off the
    // receipt (granted pair-wise, so the requester can read it).
    const onModify = async ({ receiptId }) => {
      try {
        if (receiptId != null) {
          const w = await skeletonService.walk(receiptId)
          const prompt = (w.slots || []).find((s) => s.slotName === 'PROMPT')?.textValue
          if (prompt) ask.value = prompt
        }
      } catch (_) { /* an empty input is still a fresh proposal */ }
      nextTick(() => inputEl.value?.focus())
    }

    const onApplied = async () => {
      emit('applied')
      await loadThread()
    }

    // ── live: the event spine feeds the open thread ────────────────
    watch(() => events.lastEvent, (ev) => {
      if (!ev || !chatId.value) return
      if ((ev.kind === 'chat.message' || ev.kind?.startsWith('poll.')) &&
          ev.meta?.chat_id === chatId.value) {
        busy.value = false
        if (open.value) loadThread()
      }
    })

    return {
      open,
      loading,
      sending,
      busy,
      ask,
      gateMsg,
      items,
      nanoRefs,
      dragOver,
      seat,
      viewerIds,
      threadEl,
      inputEl,
      toggle,
      loadThread,
      send,
      onDrop,
      onModify,
      onApplied
    }
  }
})
</script>

<style lang="scss" scoped>
.cuentista-row {
  border-bottom: 1px solid var(--dock-rule, var(--grey-4));
  background: var(--dock-coat, var(--grey-3));

  &.is-dragover { box-shadow: inset 0 0 0 2px var(--teal-12, #00b8d4); }
}

.cuentista-row__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 4px 10px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: var(--dock-ink, var(--brown-8));
}

// The speaking light — the row's ONE quasar-teal accent.
.cuentista-row__light {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  background: #fff;
  flex-shrink: 0;

  &.is-on {
    background: var(--teal-12, #00b8d4);
    border-color: var(--teal-12, #00b8d4);
    animation: cuentista-pulse 1.2s ease-in-out infinite;
  }
}

@keyframes cuentista-pulse {
  50% { opacity: 0.35; }
}

.cuentista-row__face { flex-shrink: 0; }

.cuentista-row__name {
  font-size: 0.74em;
  font-weight: 600;
}

.cuentista-row__hint {
  font-size: 0.7em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cuentista-row__fold { color: var(--dock-ink-mute, var(--brown-4)); }

.cuentista-row__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 10px 8px;
}

.cuentista-row__thread {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  background: var(--dock-well, var(--grey-4));
  border-radius: 6px;
}

.cuentista-row__line {
  font-size: 0.72em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
  padding: 4px;
}

.cuentista-row__nanos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cuentista-row__composer {
  display: flex;
  gap: 6px;
}

.cuentista-row__input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 0.76em;
  color: var(--dock-ink, var(--brown-8));
  outline: none;

  &:focus { border-color: var(--teal-12, #00b8d4); }
  &::placeholder { color: var(--dock-ink-mute, var(--brown-4)); }
}

.cuentista-row__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: 6px;
  background: #fff;
  color: var(--dock-ink, var(--brown-8));
  cursor: pointer;

  &:hover:not(:disabled) { color: var(--teal-12, #00b8d4); border-color: var(--teal-12, #00b8d4); }
  &:disabled { opacity: 0.5; cursor: default; }
}

.cuentista-row__gate {
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}
</style>
