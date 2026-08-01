<template>
  <!-- ─────────────────────────────────────────────────────────
       BottomSplitter — overlays the bottom of the .subject-panel
       container. At its minimum expression, only the interaction
       strip (tab buttons + votes) is visible as a footer. The user
       drags the grip on the top edge to expand the pane upward,
       revealing the active comment/fork list above the footer.

       Host markup must place this as a direct child of a
       position:relative container (.subject-panel). The host's
       body should declare padding-bottom equal to the footer
       height so its scrollable content can reach the bottom
       without being permanently hidden behind the strip.
  ───────────────────────────────────────────────────────────── -->
  <div
    ref="rootEl"
    class="bottom-splitter"
    :class="{ 'is-collapsed': isCollapsed, 'is-dragging': dragging }"
    :style="containerStyle"
  >
    <!-- Drag grip — sits above the tab strip. Hover/active states
         keep the affordance obvious without stealing visual weight
         from the tab strip itself. Double-click toggles open/close. -->
    <div
      class="bottom-splitter__grip"
      @mousedown.prevent="startDrag"
      @touchstart.prevent="startDrag"
      @dblclick="toggleCollapsed"
      :title="isCollapsed ? 'Drag up to expand · double-click to expand' : 'Drag to resize · double-click to collapse'"
    >
      <div class="bottom-splitter__grip-bar" />
    </div>

    <!-- Interaction footer — tabs + votes. Always visible; the
         tab strip is itself the footer when the splitter is at
         minimum height. -->
    <div class="bottom-splitter__tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'comment' }"
        @click="onTabClick('comment')"
      >
        <q-icon name="chat_bubble_outline" size="13px" class="q-mr-xs" />
        <span>Comments</span>
        <span class="tab-count">{{ commentCount }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'fork' }"
        @click="onTabClick('fork')"
      >
        <q-icon name="alt_route" size="13px" class="q-mr-xs" />
        <span>Forks</span>
        <span class="tab-count">{{ forkCount }}</span>
      </button>
      <div class="tab-spacer" />
      <button
        class="foot-vote"
        :class="{ active: viewerVote === 'UP' }"
        title="Vote up"
        @click="$emit('vote', 'UP')"
      >
        <q-icon name="thumb_up" size="13px" />
        <span class="foot-vote-count">{{ voteUp }}</span>
      </button>
      <button
        class="foot-vote"
        :class="{ active: viewerVote === 'DOWN' }"
        title="Vote down"
        @click="$emit('vote', 'DOWN')"
      >
        <q-icon name="thumb_down" size="13px" />
        <span class="foot-vote-count">{{ voteDown }}</span>
      </button>
    </div>

    <!-- Pane area — hidden when collapsed so the bottom strip is
         the only visible UI. Otherwise it hosts the active slot
         (comment list / fork list). -->
    <section
      v-show="!isCollapsed && activeTab === 'comment'"
      class="bottom-splitter__pane"
    >
      <slot name="commentPane" />
    </section>

    <section
      v-show="!isCollapsed && activeTab === 'fork'"
      class="bottom-splitter__pane"
    >
      <slot name="forkPane" />
    </section>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onBeforeUnmount } from 'vue'

// Footer-only height: the tab strip (36px) plus the 8px grip.
const FOOTER_H = 44

// Snap threshold — if the user drops the grip within this many px of
// FOOTER_H, collapse to footer-only. Avoids leaving an awkward 50px
// pane visible.
const SNAP_THRESHOLD = 36

// Default open height when expanding from the footer with no stored
// "last open" preference (first ever expand on a fresh session).
const DEFAULT_OPEN_H = 320

const readStored = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    const n = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : fallback
  } catch (_) { return fallback }
}

const writeStored = (key, value) => {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, String(value)) } catch (_) { /* swallow */ }
}

export default defineComponent({
  name: 'BottomSplitter',
  props: {
    modelValue: { type: String, default: 'comment' },
    commentCount: { type: Number, default: 0 },
    forkCount: { type: Number, default: 0 },
    voteUp: { type: Number, default: 0 },
    voteDown: { type: Number, default: 0 },
    viewerVote: { type: String, default: null },
    storageKey: { type: String, default: 'bottom-splitter-h' },
    // When true, ignore any stored height on mount and start at footer
    // height. The user-preferred *open* height (storageKey + ':open')
    // is still honored when the splitter is toggled open afterwards.
    defaultCollapsed: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'vote'],
  setup (props, { emit }) {
    const rootEl = ref(null)

    const activeTab = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    // Initial height — restore from localStorage if previously set,
    // otherwise start collapsed (footer only) so the body is fully
    // visible by default on every viewer. When `defaultCollapsed` is
    // true the host forces footer-only on mount regardless of storage.
    const height = ref(
      props.defaultCollapsed ? FOOTER_H : readStored(props.storageKey, FOOTER_H)
    )

    const isCollapsed = computed(() => height.value <= FOOTER_H + 2)
    const containerStyle = computed(() => ({ height: height.value + 'px' }))

    // ── Drag state ────────────────────────────────────────
    const dragging = ref(false)
    const startY = ref(0)
    const startH = ref(0)

    const clamp = (next) => {
      const panel = rootEl.value?.parentElement
      // Reserve at least 120px for the identity/meta/banner zones
      // above the body — never let the splitter eat the panel head.
      const maxH = panel ? Math.max(FOOTER_H, panel.clientHeight - 120) : 800
      if (next < FOOTER_H) return FOOTER_H
      if (next > maxH) return maxH
      return next
    }

    const onMove = (ev) => {
      if (!dragging.value) return
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const dy = startY.value - clientY
      height.value = clamp(startH.value + dy)
    }

    const stopDrag = () => {
      if (!dragging.value) return
      dragging.value = false
      if (height.value < FOOTER_H + SNAP_THRESHOLD) height.value = FOOTER_H
      writeStored(props.storageKey, height.value)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', stopDrag)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    const startDrag = (ev) => {
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      dragging.value = true
      startY.value = clientY
      startH.value = height.value
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', stopDrag)
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', stopDrag)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'ns-resize'
    }

    const toggleCollapsed = () => {
      if (isCollapsed.value) {
        const stored = readStored(props.storageKey + ':open', DEFAULT_OPEN_H)
        height.value = clamp(stored > FOOTER_H ? stored : DEFAULT_OPEN_H)
      } else {
        writeStored(props.storageKey + ':open', height.value)
        height.value = FOOTER_H
      }
      writeStored(props.storageKey, height.value)
    }

    // Clicking a tab while collapsed should open the panel so users
    // don't have to drag first. Re-clicking the active tab collapses.
    const onTabClick = (tab) => {
      if (activeTab.value === tab) {
        toggleCollapsed()
      } else {
        activeTab.value = tab
        if (isCollapsed.value) toggleCollapsed()
      }
    }

    onBeforeUnmount(() => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', stopDrag)
    })

    // Imperative: grow the splitter to AT LEAST `minPx` if it's
    // currently shorter. Hosts call this when they reveal tall slot
    // content (e.g. opening the comment composer) so the new UI
    // isn't clipped. NOT persisted — the growth is a transient effect
    // of the host's UI, not a height the user chose. releaseMinHeight
    // restores whichever stored preference the user actually picked.
    const ensureMinHeight = (minPx) => {
      if (!Number.isFinite(minPx) || minPx <= height.value) return
      height.value = clamp(minPx)
    }

    // Counterpart to ensureMinHeight: snap back to the user's stored
    // height (footer by default) when the host UI that needed the
    // extra room goes away. We only shrink — if the user dragged the
    // splitter taller while the composer was open, that drag persisted
    // through stopDrag and the stored value reflects it.
    const releaseMinHeight = () => {
      const stored = readStored(props.storageKey, FOOTER_H)
      if (stored < height.value) height.value = clamp(stored)
    }

    return {
      rootEl,
      activeTab,
      height,
      isCollapsed,
      dragging,
      containerStyle,
      startDrag,
      toggleCollapsed,
      onTabClick,
      ensureMinHeight,
      releaseMinHeight
    }
  }
})
</script>

<style lang="scss" scoped>
// ── Bottom splitter — overlays the panel body ───────────
// position:absolute so it floats over .subject-panel__body
// without participating in the panel's flex flow. The host
// must declare position:relative on .subject-panel and add
// padding-bottom on .subject-panel__body equal to the footer
// height so scrollable content can reach the bottom.
.bottom-splitter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome, #f4f7fb);
  border-top: 1px solid var(--panel-rule, #e2e6ed);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.07);
  z-index: 4;
  overflow: hidden;
  transition: height 0.15s ease;
  border-bottom-left-radius:  var(--radius-md, 8px);
  border-bottom-right-radius: var(--radius-md, 8px);

  &.is-dragging {
    // Drop the transition during the drag so the grip tracks
    // the cursor 1:1 — animating per-frame feels laggy.
    transition: none;
  }
}

// ── Drag grip ───────────────────────────────────────────
// 8px tall hit area with a centered bar. Hover lights the bar
// to the coral accent so the affordance reads at a glance.
.bottom-splitter__grip {
  flex-shrink: 0;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  background: var(--panel-chrome, #f4f7fb);
  user-select: none;

  &:hover .bottom-splitter__grip-bar {
    background: var(--coral, #eb5757);
    width: 64px;
  }
}
.bottom-splitter__grip-bar {
  width: 40px;
  height: 3px;
  border-radius: 2px;
  background: #c8d0dc;
  transition: background 0.10s, width 0.10s;
}

// ── Tabs strip (the always-visible footer) ──────────────
// Mirrors the existing .subject-panel__tabs treatment — same
// padding, same alignment, same vote button positioning — so
// the visual idiom doesn't change. Only the parent's overlay
// behavior is new.
.bottom-splitter__tabs {
  display: flex;
  align-items: stretch;
  padding: 0 6px;
  background: var(--panel-chrome, #f4f7fb);
  flex-shrink: 0;
  gap: 2px;
  height: 36px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
  color: var(--panel-ink-2, #5b6c82);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 0.84em;
  font-family: inherit;
  font-weight: 500;
  transition: background 0.10s, color 0.10s, border-color 0.10s;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
    color: var(--panel-ink-1, #1f2a38);
  }
  &.active {
    color: var(--coral-deep, #d35f5f);
    border-bottom-color: var(--coral-deep, #d35f5f);
    background: var(--panel-body, #ffffff);
  }
}
.tab-count {
  font-size: 0.86em;
  padding: 1px 7px;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 9px;
  color: var(--panel-ink-2, #5b6c82);
  margin-left: 4px;
  .tab-btn.active & {
    background: rgba(var(--coral-rgb, 235, 87, 87), 0.14);
    color: var(--coral-deep, #d35f5f);
  }
}
.tab-spacer { flex: 1 1 auto; }

.foot-vote {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--panel-ink, #2c3d4e);
  cursor: pointer;
  padding: 6px 9px;
  margin: 4px 0;
  align-self: center;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.84em;
  font-family: inherit;
  transition: background 0.10s, border-color 0.10s, color 0.10s;

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    border-color: #d8dde6;
  }
  &.active {
    background: rgba(var(--coral-rgb, 235, 87, 87), 0.10);
    border-color: var(--coral, #eb5757);
    color: var(--coral-deep, #d35f5f);
  }
}
.foot-vote-count { font-size: 0.86em; color: var(--panel-ink-2, #5b6c82); }
.foot-vote.active .foot-vote-count { color: var(--coral-deep, #d35f5f); }

// ── Pane area ───────────────────────────────────────────
// Hosts the active slot (comment list / fork list). flex:1 1 0
// + min-height:0 + overflow lets the inner content scroll while
// the tabs/footer stay pinned at the bottom of the splitter.
.bottom-splitter__pane {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body, #ffffff);
  border-top: 1px solid var(--panel-rule, #e2e6ed);
  overflow: hidden;
}
</style>
