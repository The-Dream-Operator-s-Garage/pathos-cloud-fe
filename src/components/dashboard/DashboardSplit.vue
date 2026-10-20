<template>
  <!-- THE RECURSIVE SPLIT (dashboards phase 9, 2026-10-19 — user ask: "split
       the layout in 2, horizontally or vertically, and there should be drawn
       a visible line in the middle that separates them with like a handle in
       the middle that lets me manipulate their width … recursive").

       One node of the LAYOUT tree (`utils/dashboardTree.js`):
         · a SPLIT — two panes on a flex axis ('h' side by side, 'v'
           stacked) with THE DIVIDER between them: a visible line the pane
           ratio rides, and at its midpoint THE GRIP, a pill the pointer
           drags (pointer capture, clamped to the min pane size, dblclick
           evens the ratio). In edit mode, while one pane is an EMPTY leaf,
           the grip grows a JOIN button that collapses the split back into
           the other pane.
         · a LEAF — `DashboardSlot` (the element, the picker, the tools).
       Every structural change and every resize END bubbles `changed` to
       DashboardBoard, which saves (the LAYOUT NOTE versions — arrangements
       are history). The ops MUTATE the shared reactive node by design. -->
  <div
    v-if="isSplit"
    ref="boxEl"
    class="dash-split"
    :class="[node.split === 'v' ? 'dash-split--v' : 'dash-split--h', { 'is-dragging': dragging }]"
    :data-depth="depth"
  >
    <div class="dash-split__pane" :style="paneStyle">
      <DashboardSplit :node="node.children[0]" :editing="editing" :depth="depth + 1" @changed="$emit('changed')" />
    </div>

    <div
      class="dash-divider"
      :class="{ 'is-dragging': dragging }"
      :title="editing ? 'Drag to resize · double-click to even out' : 'Drag to resize'"
      @pointerdown="startDrag"
      @dblclick="resetRatio"
    >
      <span class="dash-divider__line" aria-hidden="true" />
      <span class="dash-divider__grip" aria-hidden="true">
        <q-icon :name="node.split === 'v' ? 'drag_handle' : 'drag_indicator'" size="12px" />
      </span>
      <button
        v-if="editing && joinable"
        type="button"
        class="dash-divider__join"
        :class="node.split === 'v' ? 'dash-divider__join--v' : 'dash-divider__join--h'"
        :title="joinTitle"
        @pointerdown.stop
        @dblclick.stop
        @click.stop="join"
      >
        <q-icon name="join_full" size="12px" />
      </button>
    </div>

    <div class="dash-split__pane dash-split__pane--rest">
      <DashboardSplit :node="node.children[1]" :editing="editing" :depth="depth + 1" @changed="$emit('changed')" />
    </div>
  </div>

  <DashboardSlot
    v-else
    :node="node"
    :editing="editing"
    :depth="depth"
    @split="onSplit"
    @clear="onClear"
    @pick="onPick"
  />
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import DashboardSlot from './DashboardSlot.vue'
import {
  isSplit as isSplitNode, isEmptyLeaf, clampRatio, setRatio,
  splitLeaf, clearLeaf, setLeaf, joinSplit
} from 'src/utils/dashboardTree'

export default defineComponent({
  name: 'DashboardSplit',
  components: { DashboardSlot },
  props: {
    node: { type: Object, required: true },
    editing: { type: Boolean, default: false },
    depth: { type: Number, default: 0 }
  },
  emits: ['changed'],
  setup (props, { emit }) {
    const boxEl = ref(null)
    const dragging = ref(false)
    const isSplit = computed(() => isSplitNode(props.node))

    // ── the divider ────────────────────────────────────────────────
    // Pane 0 takes `ratio` of the axis less its half of the divider; pane
    // 1 fills the rest.
    const paneStyle = computed(() => {
      const pct = Math.round((props.node.ratio ?? 0.5) * 1000) / 10
      return { flex: `0 0 calc(${pct}% - 4px)` }
    })

    const startDrag = (e) => {
      if (!boxEl.value || e.button !== 0) return
      dragging.value = true
      const el = e.currentTarget
      el.setPointerCapture?.(e.pointerId)
      const rect = boxEl.value.getBoundingClientRect()
      const horizontal = props.node.split !== 'v'
      const size = horizontal ? rect.width : rect.height
      const start = horizontal ? rect.left : rect.top
      let moved = false

      const onMove = (ev) => {
        const pos = horizontal ? ev.clientX : ev.clientY
        moved = true
        setRatio(props.node, clampRatio((pos - start) / size, size, horizontal))
      }
      const onUp = () => {
        dragging.value = false
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        if (moved) emit('changed')
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      e.preventDefault()
    }

    const resetRatio = () => {
      setRatio(props.node, 0.5)
      emit('changed')
    }

    // JOIN: while exactly one pane is an empty leaf the split can fold
    // back into the other; both empty → either (the first).
    const emptyIndex = computed(() => {
      if (!isSplit.value) return -1
      const [a, b] = props.node.children
      if (isEmptyLeaf(a) && isEmptyLeaf(b)) return 1
      if (isEmptyLeaf(b)) return 1
      if (isEmptyLeaf(a)) return 0
      return -1
    })
    const joinable = computed(() => emptyIndex.value !== -1)
    const joinTitle = computed(() => (emptyIndex.value === 0
      ? 'Join — fold this split into the second pane'
      : 'Join — fold this split into the first pane'))
    const join = () => {
      if (!joinable.value) return
      joinSplit(props.node, emptyIndex.value === 0 ? 1 : 0)
      emit('changed')
    }

    // ── the leaf's asks ────────────────────────────────────────────
    const onSplit = (dir) => { splitLeaf(props.node, dir); emit('changed') }
    const onClear = () => { clearLeaf(props.node); emit('changed') }
    const onPick = (ref) => { setLeaf(props.node, ref); emit('changed') }

    return { boxEl, dragging, isSplit, paneStyle, startDrag, resetRatio, joinable, joinTitle, join, onSplit, onClear, onPick }
  }
})
</script>

<style lang="scss" scoped>
// The split is a flex box the size of its pane; the panes clip, the leaf
// inside scrolls (DashboardSlot). `min-*: 0` on every box — a wide mini
// must never stretch its pane past the divider (the auto-minimum law).
.dash-split {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;

  &--h { flex-direction: row; }
  &--v { flex-direction: column; }
  &.is-dragging { user-select: none; }
}

.dash-split__pane {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;

  &--rest { flex: 1 1 auto; }

  > * { flex: 1 1 auto; min-width: 0; min-height: 0; }
}

// ── THE DIVIDER — a visible line with a grip at its midpoint ──────────
// 8px of hit area on the axis, the LINE drawn 2px at its centre in the
// family's brown, the GRIP a 28×10 pill riding the line (rotated with the
// axis). Hover and drag lift both to the dashboard accent.
.dash-divider {
  position: relative;
  flex: 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: col-resize;
  z-index: 2;

  .dash-split--v > & { cursor: row-resize; }
}

.dash-divider__line {
  position: absolute;
  background: var(--brown-3, #bcaaa4);
  transition: background 120ms;

  .dash-split--h > .dash-divider > & { top: 0; bottom: 0; left: 3px; width: 2px; }
  .dash-split--v > .dash-divider > & { left: 0; right: 0; top: 3px; height: 2px; }
}

.dash-divider__grip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 28px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid var(--brown-3, #bcaaa4);
  color: var(--brown-5, #8d6e63);
  box-shadow: 0 1px 2px rgba(62, 39, 35, 0.18);
  transition: border-color 120ms, color 120ms, background 120ms;

  .dash-split--v > .dash-divider > & { width: 28px; height: 12px; }
}

.dash-divider:hover,
.dash-divider.is-dragging {
  .dash-divider__line { background: var(--brown-6, #795548); }
  .dash-divider__grip {
    border-color: var(--brown-6, #795548);
    color: var(--brown-8, #4e342e);
    background: var(--brown-1, #efebe9);
  }
}

// The JOIN button sits beside the grip, off the line, so a drag never
// lands on it by accident.
.dash-divider__join {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--brown-3, #bcaaa4);
  background: #fff;
  color: var(--brown-5, #8d6e63);
  cursor: pointer;

  &--h { top: calc(50% + 20px); left: 50%; transform: translateX(-50%); }
  &--v { left: calc(50% + 24px); top: 50%; transform: translateY(-50%); }

  &:hover { color: var(--brown-8, #4e342e); border-color: var(--brown-6, #795548); background: var(--brown-1, #efebe9); }
}
</style>
