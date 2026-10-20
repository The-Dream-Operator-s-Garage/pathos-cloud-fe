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
    :style="{ '--media-max-h': mediaMaxH + 'px', '--skel-mini-max-h': mediaMaxH + 'px' }"
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
    depth: { type: Number, default: 0 }
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

    return { rootEl, dragOver, isEmpty, slotKind, slotTitle, exclude, asPill, mediaMaxH, onDragOver, onDrop, openWindow }
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
  border-radius: 6px;
  border: 1px solid transparent;

  &.is-editing { border-color: var(--grey-3, #eee); }
  &.is-empty.is-editing { border-style: dashed; border-color: var(--brown-3, #bcaaa4); }
  &.is-dragover { border-color: var(--brown-6, #795548); background: rgba(121, 85, 72, 0.06); }
}

.dash-slot__body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 6px;
  scrollbar-width: thin;

  // A mini in a slot runs the slot's width (ElementMini caps at 480px for
  // post bodies; a board's slot IS the width).
  :deep(.element-mini) { max-width: none; }
}

.dash-slot__pill {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-height: 0;
  background: var(--grey-1, #fafafa);
  border-radius: 5px;
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
