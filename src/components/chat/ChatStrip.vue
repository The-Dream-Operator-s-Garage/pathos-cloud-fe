<template>
  <div
    class="chat-strip"
    :class="{ 'is-active': active }"
    @click="$emit('toggle')"
  >
    <!-- ── ⭐ THE CHAT STRIP (2026-10-31, user ask: "modify the chats button
         on the bottom by making its style match the same as the pinned
         elements window. On desktop mode, make the chat section be the same
         height as the pinned one and also make it an inner bubble scroll but
         with profile pics of the most recent chats that must have tiny chip
         floating labels with the number of messages"). The footer's chat
         chip became the PINS STRIP's construction (PinsDrawer `.is-parked`):
         the bar's full content row (31px), the bar's coat, brown-3 verticals,
         the strip handle, a head glyph and the night-well BUBBLE — read left
         to right the way the slider chips read (handle first), with the
         faces where the pins' pills stand.

         ⚠ THE ROOT IS THIS DIV AND NOTHING COMES BEFORE IT. NavigationBar
         registers it as the slider's `chat` body through `inst.$el`, and a
         template opening with a comment hands back a fragment anchor in a
         dev build (NavHub's trap) — keep every note inside.

         · The handle walks the strip along the bar (NavigationBar's
           `startChipDrag('chat')`, the trail slider); it swallows its clicks.
         · The head (`.chat-btn` — the name every witness opens chat by)
           toggles the window, as the chip's body did; so does any bare part
           of the strip. It carries the event spine's amber unread badge.
         · A FACE opens the window on THAT conversation (`open-chat`); the
           conversation already showing closes it again.
         · On a phone the strip is the head alone — the bar's ≤600px block
           seats it against the identity section (NavigationBar). -->
    <span class="strip-grip" @pointerdown="$emit('grip-down', $event)" @click.stop>
      <q-icon name="drag_indicator" size="11px" />
    </span>
    <span class="strip-grip-rule" />
    <button
      type="button"
      class="chat-strip__head chat-btn"
      title="Chats — private conversations"
      @click.stop="$emit('toggle')"
    >
      <q-icon name="forum" class="chat-strip__glyph" />
      <q-badge
        v-if="events.unreadCount > 0"
        floating color="amber-9" text-color="black"
        class="chat-unread-badge"
      >{{ events.unreadCount }}</q-badge>
    </button>
    <!-- THE BUBBLE — the most recent conversations, newest at the left, one
         face each (the first OTHER seat's, ChatDock's row law: a group shows
         its first peer). Each face wears a count chip: AMBER with the unread
         count when the other side wrote past this seat's watermark, else a
         cream chip with the conversation's message count (nothing for an
         empty chat). The lane scrolls sideways past three. -->
    <div ref="laneEl" class="chat-strip__lane" @wheel="onWheel">
      <button
        v-for="c in recent"
        :key="c.id"
        type="button"
        class="chat-strip__face"
        :class="{ 'is-current': active && c.id === chat.activeChatId }"
        :title="faceTitle(c)"
        @click.stop="$emit('open-chat', c.id)"
      >
        <EntityAvatar :entity="peerOf(c)" :id="peerOf(c) ? null : c.owner_id" :size="21" />
        <span
          v-if="countOf(c)"
          class="chat-strip__count mono"
          :class="{ 'is-new': unreadOf(c) > 0 }"
        >{{ countOf(c) }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted } from 'vue'
import { useChatStore } from 'src/stores/chat'
import { useEventsStore } from 'src/stores/events'
import { useAuthStore } from 'src/stores/auth'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'

// How many conversations the bubble holds (three in view, the rest a scroll).
const RECENT = 12
// The pushes that change a conversation's last line or counts (ChatDock's
// own list).
const CHAT_KINDS = ['chat.message', 'poll.minted', 'poll.decided', 'org.invite']

export default defineComponent({
  name: 'ChatStrip',
  components: { EntityAvatar },
  props: {
    // The chat window is up (NavigationBar's `chatExpanded`).
    active: { type: Boolean, default: false }
  },
  emits: ['toggle', 'open-chat', 'grip-down'],
  setup (props) {
    const chat = useChatStore()
    const events = useEventsStore()
    const auth = useAuthStore()
    const laneEl = ref(null)

    const recent = computed(() => chat.chats.slice(0, RECENT))
    const peerOf = (c) => (c?.members || []).find((m) => !m.is_me) || null
    // The conversation on screen has nothing unread, whatever the list says.
    const unreadOf = (c) => (props.active && c.id === chat.activeChatId ? 0 : c.unread || 0)
    const cap = (n) => (n > 99 ? '99+' : String(n))
    const countOf = (c) => {
      const u = unreadOf(c)
      if (u > 0) return cap(u)
      return c.message_count ? cap(c.message_count) : ''
    }
    const faceTitle = (c) => {
      const others = (c.members || []).filter((m) => !m.is_me)
      const who = others.map((m) => m.display_name || m.username || `#${m.id}`).join(', ') || 'just you'
      const n = c.message_count || 0
      const u = unreadOf(c)
      return `${who} — ${n} message${n === 1 ? '' : 's'}${u ? ` · ${u} new` : ''}`
    }

    // A vertical wheel over the bubble scrolls it sideways — a mouse has no
    // other way along a lane with a hidden scrollbar.
    const onWheel = (e) => {
      const el = laneEl.value
      if (!el || el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    // The list: on mount, on every chat push while the window is shut (the
    // window refreshes it itself while up), when the window goes down (the
    // server's watermark has landed by then), and when the acting seat
    // changes (seat-strict — another identity, other chats).
    const refresh = () => { if (auth.entityId) chat.loadChats() }
    onMounted(refresh)
    watch(() => events.lastEvent, (e) => {
      if (e && CHAT_KINDS.includes(e.kind) && !props.active) refresh()
    })
    watch(() => props.active, (up, was) => { if (was && !up) refresh() })
    watch(() => auth.entityId, refresh)

    return { chat, events, laneEl, recent, peerOf, unreadOf, countOf, faceTitle, onWheel }
  }
})
</script>

<style lang="scss" scoped>
.chat-strip {
  // The bar's unread voice — the q-badge's `color="amber-9"` (Quasar
  // #ff8f00), shared by the head's badge and the faces' new-count chips.
  --chat-strip-new: #ff8f00;

  // The pins strip's parked box (PinsDrawer `.pins-window.is-parked`), as a
  // flex item of `.nav-right` rather than a fixed overlay: the bar's content
  // row by `align-self: stretch` (31px), the bar's own coat, brown-3 on the
  // verticals only, square, no cast.
  flex: 0 0 var(--chat-strip-w);
  width: var(--chat-strip-w);
  align-self: stretch;
  display: flex;
  align-items: center;
  background: var(--strip-coat);
  border: 1px solid var(--brown-3);
  border-top-width: 0;
  border-bottom-width: 0;
  cursor: pointer;
}

// The head glyph's seat — the pins' 20px `.pins-side-head`, a button here.
// Pressed state = the chip's (grey-4 face, grey-10 ink), on the head alone:
// the well beside it is already grey-4.
.chat-strip__head {
  position: relative;
  flex: 0 0 20px;
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink-1);
  cursor: pointer;

  &:hover { background: var(--grey-3); }
}
.chat-strip.is-active .chat-strip__head {
  background: var(--grey-4);
  color: var(--grey-10);
}
.chat-strip__glyph { font-size: 15px; }

// The event spine's unread count — the tiny amber treatment the pin tack's
// counter wears (moved here with the badge; NavigationBar's scoped rule
// cannot reach into this component).
.chat-unread-badge {
  font-size: 0.62em !important;
  padding: 0 4px !important;
  min-height: 12px !important;
  letter-spacing: 0;
}

// THE BUBBLE — PinsDrawer's `.pins-list.is-parked`, number for number: the
// `--strip-well` floor under its `--strip-rule` rim, `--strip-shoulder` of
// coat on all four sides, all four corners at `--strip-lane-radius`, the
// 31px row zero-sum (2 shoulder + 1 rim + 2 pad + 21 face + 2 pad + 1 rim +
// 2 shoulder). Only the horizontal rhythm differs — 5px gaps and a 4px
// right pad where the pins' are 2 / 1, the room each count chip hangs into
// (`--chat-strip-w` carries the sum).
.chat-strip__lane {
  flex: 1 1 auto;
  min-width: 0;
  align-self: center;
  display: flex;
  align-items: center;
  gap: 5px;
  height: calc(21px + 2 * 2px + 2px);
  margin: var(--strip-shoulder);
  padding: 2px 4px 2px 2px;
  background: var(--strip-well);
  border: 1px solid var(--strip-rule);
  border-radius: var(--strip-lane-radius);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

// One conversation: its face at the pins' tile size (21px), in the lane's
// ONE curve — the tile and the well round alike (2026-09-06's law).
.chat-strip__face {
  position: relative;
  flex: 0 0 21px;
  width: 21px;
  height: 21px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  :deep(.entity-avatar) {
    border-radius: var(--strip-lane-radius);
    border-color: var(--strip-rule);
  }
  &:hover :deep(.entity-avatar) { border-color: var(--grey-8); }
  // The conversation on screen — the pins' current tile inverts; a face
  // cannot, so it takes the ink's ring.
  &.is-current :deep(.entity-avatar) {
    border-color: var(--ink-1);
    box-shadow: 0 0 0 1px var(--ink-1);
  }
}

// The count chip, floating off the face's top-right corner: 2px up into the
// lane's pad (the well's top edge, never past it — the lane clips there)
// and 4px out into the gap. Cream with a grey rim for the total; the bar's
// amber with black ink for what is new.
.chat-strip__count {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 11px;
  height: 10px;
  padding: 0 2px;
  border-radius: 999px;
  border: 1px solid var(--grey-6);
  background: var(--light-cream);
  color: var(--grey-9);
  font-size: 7px;
  font-weight: 700;
  line-height: 8px;
  letter-spacing: 0;
  text-align: center;
  pointer-events: none;

  &.is-new {
    background: var(--chat-strip-new);
    border-color: rgba(0, 0, 0, 0.35);
    color: #000;
  }
}

// ── THE PHONE (2026-10-31, user ask: "attach the chat button to the left,
// next to the entity section, making it like stick to it (preserve the
// visible border, but make the button the same height as the entity
// section)"). The head alone, the identity section's full 31px: no handle
// (no slider on a phone), no bubble. Its LEFT edge is the identity
// section's own brown-3 hairline — a second line there would draw the seam
// twice — and its right vertical stays, so the button keeps its border.
@media (max-width: 600px) {
  .chat-strip {
    flex: 0 0 auto;
    width: auto;
    border-left-width: 0;
  }
  .strip-grip,
  .strip-grip-rule,
  .chat-strip__lane { display: none; }
  .chat-strip__head { flex: 0 0 31px; }
  .chat-strip__glyph { font-size: 17px; }
}
</style>
