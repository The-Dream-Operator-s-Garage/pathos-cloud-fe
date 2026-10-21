<template>
  <!-- THE SLOT (dashboards phase 9, 2026-10-19) — a LEAF of the board: one
       element, drawn as its MINI (`ElementMini` — whatever the kind: a
       node's picture, a post's words, a label's unravel, a skeleton's grid,
       ANOTHER BOARD as DashboardMini), the session-activity VIRTUAL cell,
       or, empty, the picker. The slot is the box the mini lives in: it
       scrolls, it publishes the media ceiling off its own height
       (`--media-max-h`, `data-media-budget` stops the nested share walk
       here), and a mini inside it runs the slot's width (ElementMini's
       480px cap lifted).

       EDIT MODE tools (top-right): split side by side │ split stacked │
       open in a window │ clear. The whole slot is a DROP TARGET on
       `application/x-pathos-ref` (the dock's tabs, every chip) and on plain
       text that reads as an address — a drop REPLACES what the slot holds.
       A template slot wears its FIELD tag (`SLOT_1 · nodes`) so a board
       made from a template reads as its schema.

       ⭐ FLUSH (2026-10-20, user ask: "adapt the mini viewers so they
       adjust to their container's size completely, leaving no padding
       around them … make the corner roundness a modifiable property"):
       the slot has no inset — its mini runs to the dividers and the host's
       rim, and STRETCHES to the slot's height (the body grows and scrolls,
       the 110px excerpt cap comes off). The mini's frame corners ride
       MiniPanel's `--mini-r-*` dials: a corner of the slot that sits on
       one of the host container's rounded corners (`corners`, handed down
       the split tree) turns with that container (`--dash-r-*`, the host's
       INNER radius); every other corner is square.

       DEPTH: a leaf whose render budget is spent draws its nano PILL
       (RefMicro) instead of a mini — the dial that keeps a board quoted in
       a board quoted in a post from mounting the world. -->
  <div
    ref="rootEl"
    class="dash-slot"
    :class="{ 'is-empty': isEmpty, 'is-editing': editing, 'is-dragover': dragOver, 'is-pill': asPill, 'is-virtual': !!node.virtual }"
    :data-leaf="node.leaf || null"
    :data-slot="node.slot || null"
    data-media-budget
    :style="slotStyle"
    @dragover.prevent="onDragOver"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <span v-if="node.slot && (editing || isEmpty)" class="dash-slot__field mono" :title="slotTitle">
      {{ node.slot }}<span v-if="slotKind" class="dash-slot__field-kind"> · {{ slotKind }}</span>
    </span>

    <div v-if="editing" class="dash-slot__tools">
      <button type="button" class="dash-slot__tool" title="Split side by side" @click.stop="$emit('split', 'h')">
        <q-icon name="vertical_split" size="12px" />
      </button>
      <button type="button" class="dash-slot__tool" title="Split top and bottom" @click.stop="$emit('split', 'v')">
        <q-icon name="horizontal_split" size="12px" />
      </button>
      <button v-if="node.leaf" type="button" class="dash-slot__tool" title="Open in a window" @click.stop="openWindow">
        <q-icon name="open_in_new" size="12px" />
      </button>
      <button v-if="!isEmpty" type="button" class="dash-slot__tool dash-slot__tool--clear" title="Clear this slot" @click.stop="$emit('clear')">
        <q-icon name="close" size="12px" />
      </button>
    </div>

    <div v-if="node.virtual === 'session-activity'" class="dash-slot__body">
      <SessionActivityCard />
    </div>

    <div v-else-if="node.leaf && asPill" class="dash-slot__pill">
      <RefMicro :address="node.leaf" />
    </div>

    <div v-else-if="node.leaf" class="dash-slot__body">
      <ElementMini :key="'slot:' + node.leaf" :address="node.leaf" />
    </div>

    <div v-else-if="editing" class="dash-slot__picker">
      <SlotPicker :exclude="exclude" :kind-hint="slotKind" @pick="(ref) => $emit('pick', ref)" />
      <span class="dash-slot__hint">or drop an element here</span>
    </div>

    <div v-else class="dash-slot__blank">
      <q-icon name="dashboard" size="14px" />
      <span>{{ node.slot ? node.slot.toLowerCase() + ' — empty' : 'empty slot' }}</span>
    </div>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import RefMicro from 'src/components/shared/RefMicro.vue'
import SessionActivityCard from './SessionActivityCard.vue'
import SlotPicker, { canonicalRef } from './SlotPicker.vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'
import { DASHBOARD_HOST } from './dashboardHost'

export default defineComponent({
  name: 'DashboardSlot',
  components: {
    // Async on purpose — THE IMPORT-CYCLE SEAM: a slot mounts ElementMini,
    // ElementMini mounts DashboardMini, DashboardMini mounts the board that
    // mounts this slot. A static edge here hoists the whole family above
    // MainLayout's own export ("Cannot access __WEBPACK_DEFAULT_EXPORT__
    // before initialization" — the nav bar never rendered); the lazy edge
    // is where phase 5's SplitLayout broke the same ring.
    ElementMini: defineAsyncComponent(() => import('src/components/shared/ElementMini.vue')),
    RefMicro,
    SessionActivityCard,
    SlotPicker
  },
  props: {
    node: { type: Object, required: true },
    editing: { type: Boolean, default: false },
    depth: { type: Number, default: 0 },
    // The host container's rounded corners this leaf touches (DashboardSplit).
    corners: { type: Array, default: () => ['tl', 'tr', 'br', 'bl'] }
  },
  emits: ['split', 'clear', 'pick'],
  setup (props, { emit }) {
    const rootEl = ref(null)
    const dragOver = ref(false)
    const host = inject(DASHBOARD_HOST, null)

    const isEmpty = computed(() => !props.node.leaf && !props.node.virtual)
    const slotKind = computed(() => (props.node.slot ? (host?.slotKinds?.value?.[props.node.slot] || '') : ''))
    const slotTitle = computed(() => (props.node.slot
      ? `template slot ${props.node.slot}${slotKind.value ? ' — takes ' + slotKind.value : ''}`
      : ''))
    const exclude = computed(() => host?.chain?.value || [])

    // The depth dial: past the budget a leaf is its pill.
    const budget = useRenderBudget()
    const asPill = computed(() => budgetExhausted(budget))

    // The media ceiling = the slot's own height less its chrome (floor
    // 120) — a picture in a slot fits the slot.
    const mediaMaxH = ref(240)
    let ro = null
    onMounted(() => {
      if (!rootEl.value || typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver((entries) => {
        const h = entries[0]?.contentRect?.height || 0
        mediaMaxH.value = Math.max(120, Math.round(h - 44))
      })
      ro.observe(rootEl.value)
    })
    onBeforeUnmount(() => { ro?.disconnect() })

    // The corner dials: the host's inner radius where this leaf meets one
    // of its rounded corners, square everywhere else. The slot clips to
    // the same four, and its mini's frame reads them (`--mini-r-*`).
    const slotStyle = computed(() => {
      const style = { '--media-max-h': mediaMaxH.value + 'px', '--skel-mini-max-h': mediaMaxH.value + 'px' }
      for (const c of ['tl', 'tr', 'br', 'bl']) {
        style['--slot-r-' + c] = props.corners.includes(c) ? `var(--dash-r-${c}, 0px)` : '0px'
      }
      return style
    })

    const onDragOver = (e) => {
      if (!props.editing) return
      dragOver.value = true
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const onDrop = (e) => {
      dragOver.value = false
      if (!props.editing) return
      let ref_ = null
      try {
        const payload = JSON.parse(e.dataTransfer.getData('application/x-pathos-ref'))
        ref_ = canonicalRef(payload?.address || payload?.path || '')
      } catch (_) { /* not the house MIME */ }
      if (!ref_) ref_ = canonicalRef(e.dataTransfer.getData('text/plain') || '')
      if (ref_ && !exclude.value.includes(ref_)) emit('pick', ref_)
    }

    const flyouts = useFlyoutViewersStore()
    const openWindow = () => { if (props.node.leaf) flyouts.spawnRef(props.node.leaf) }

    return { rootEl, dragOver, isEmpty, slotKind, slotTitle, exclude, asPill, slotStyle, onDragOver, onDrop, openWindow }
  }
})
</script>

<style lang="scss" scoped>
.dash-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: var(--slot-r-tl) var(--slot-r-tr) var(--slot-r-br) var(--slot-r-bl);
  overflow: hidden;

  // The edit marks are INSET rings, not borders: a border would take a
  // pixel of the flush slot's room (and move the mini when edit toggles).
  &.is-empty.is-editing { box-shadow: inset 0 0 0 1px var(--brown-3, #bcaaa4); }
  &.is-dragover { box-shadow: inset 0 0 0 2px var(--brown-6, #795548); background: rgba(121, 85, 72, 0.06); }
}

.dash-slot__body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  scrollbar-width: thin;

  // THE FLUSH MINI — a CHILD chain from the slot to its own top panel
  // (every Mini's root is MiniPanel's `.mini-panel-link`, or one wrapper
  // around it — SkeletonMini's `.skel-mini`), so a mini nested in this one
  // keeps the family's rules, and a board nested in it re-runs this chain
  // from its own slots. The mini runs the slot's width (ElementMini's 480px
  // prose cap lifted) and height.
  > :deep(.element-mini),
  > :deep(.element-mini > *),
  > :deep(.element-mini > * > .mini-panel-link) {
    flex: 1 1 auto;
    min-height: 0;
    max-width: none;
    display: flex;
    flex-direction: column;
  }
  // The frame: the slot's corners on MiniPanel's dials; no border and no
  // shadow — the board's own lines (the host's rim, the dividers) ARE every
  // slot's frame, so a seam is ONE line, never frame │ divider │ frame. The
  // hover lift is off too: a tile in a wall does not rise out of it.
  > :deep(.element-mini > .mini-panel-link > .mini-panel),
  > :deep(.element-mini > * > .mini-panel-link > .mini-panel) {
    flex: 1 1 auto;
    min-height: 0;
    --mini-r-tl: var(--slot-r-tl);
    --mini-r-tr: var(--slot-r-tr);
    --mini-r-br: var(--slot-r-br);
    --mini-r-bl: var(--slot-r-bl);
    border: 0;
    box-shadow: none;
    transform: none;
  }
  // The well takes the stretch: the excerpt cap comes off and the well
  // scrolls what the slot cannot show.
  > :deep(.element-mini > .mini-panel-link > .mini-panel > .mini-panel__body),
  > :deep(.element-mini > * > .mini-panel-link > .mini-panel > .mini-panel__body) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    overflow: auto;
  }
  // A board in a slot (DashboardMini) fills the well instead of its fixed
  // 360/240 working height — the one inline height this chain must beat.
  > :deep(.element-mini > .mini-panel-link > .mini-panel > .mini-panel__body > .dashboard-mini__board) {
    height: 100% !important;
  }
}

.dash-slot__pill {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: 0;
  background: var(--grey-1, #fafafa);
}

.dash-slot__picker {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  min-height: 0;
}

.dash-slot__hint,
.dash-slot__blank {
  font-size: 0.72em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
}

.dash-slot__blank {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dash-slot__field {
  position: absolute;
  top: 3px;
  left: 6px;
  z-index: 5;
  font-size: 0.62em;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--brown-1, #efebe9);
  color: var(--brown-8, #4e342e);
  border: 1px solid var(--brown-3, #bcaaa4);
}
.dash-slot__field-kind { color: var(--brown-5, #8d6e63); }

.dash-slot__tools {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 5;
  display: flex;
  gap: 3px;
  opacity: 0.55;
  transition: opacity 120ms;

  .dash-slot:hover > & { opacity: 1; }
}

.dash-slot__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--brown-3, #bcaaa4);
  background: #fff;
  color: var(--brown-5, #8d6e63);
  cursor: pointer;

  &:hover { color: var(--brown-8, #4e342e); border-color: var(--brown-6, #795548); background: var(--brown-1, #efebe9); }
  &--clear:hover { color: var(--coral-deep); border-color: var(--coral-deep); background: #fff; }
}
</style>
