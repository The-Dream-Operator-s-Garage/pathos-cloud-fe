<template>
  <!-- THE RECURSIVE SPLITTER (dashboards phase 5, 2026-08-10) — the
       expanded window as a splittable multi-dashboard canvas. The tree it
       renders is the LAYOUT NOTE's `split` member:

         { dir: 'h'|'v', ratio, children: [node, node] } | { leaf: ref|null }

       — a node is either a two-pane split or a leaf holding a DASHBOARD
       ref (null = an empty slot). Every structural change and every
       resize END bubbles `changed` to DashboardGrid, which saves through
       saveLayout — the LAYOUT NOTE versions, so every arrangement ever
       saved is history.

       Resizers ride the BottomSplitter pointer-drag pattern: drag the
       divider, clamp, double-click resets to half. THE MIN SLOT SIZE is
       stated ONCE, here (MIN_W × MIN_H below) — the clamp refuses to
       shrink a pane below it, and a pane that ends up smaller anyway
       (window resize) swaps its content for a name plate. No nonsense
       layouts. (Keep-in-step law: if these constants are ever restated
       elsewhere, that copy owes an fsck --static witness.)

       Leaves render their board through DashboardGrid with `nested` set:
       a nested grid NEVER renders its own split — which is also the cycle
       guard (a board whose split cites itself renders one honest level).

       In edit mode: empty leaves are DROP TARGETS speaking
       application/x-pathos-ref (the dock's tabs and the smart inputs are
       the sources; foreign drags are ignored by the try/catch parse),
       every leaf offers split-h / split-v, filled leaves offer ✕ (clear),
       and a divider whose BOTH panes are empty leaves offers FUSE —
       collapsing the split back into one empty slot. -->
  <div class="split-layout" :class="editing ? 'is-editing' : ''">
    <!-- ── a SPLIT node ─────────────────────────────────────────── -->
    <div
      v-if="node.children"
      ref="boxEl"
      class="split-node"
      :class="node.dir === 'v' ? 'split-node--v' : 'split-node--h'"
    >
      <div class="split-pane" :style="paneStyle">
        <SplitLayout :node="node.children[0]" :editing="editing" :depth="depth + 1" @changed="$emit('changed')" />
      </div>

      <div
        class="split-divider"
        :class="{ 'is-dragging': dragging }"
        title="Drag to resize · double-click to even out"
        @pointerdown="startDrag"
        @dblclick="resetRatio"
      >
        <button
          v-if="editing && bothChildrenEmpty"
          type="button"
          class="split-fuse"
          title="Fuse — collapse this split"
          @pointerdown.stop
          @click.stop="fuse"
        >
          <q-icon name="join_full" size="12px" />
        </button>
      </div>

      <div class="split-pane split-pane--rest">
        <SplitLayout :node="node.children[1]" :editing="editing" :depth="depth + 1" @changed="$emit('changed')" />
      </div>
    </div>

    <!-- ── a LEAF ───────────────────────────────────────────────── -->
    <div
      v-else
      ref="leafEl"
      class="split-leaf"
      :class="{ 'is-empty': !node.leaf, 'is-dragover': dragOver }"
      @dragover.prevent="onDragOver"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div v-if="editing" class="split-leaf__tools">
        <button type="button" class="split-leaf__tool" title="Split side by side" @click.stop="split('h')">
          <q-icon name="splitscreen_left" size="12px" />
        </button>
        <button type="button" class="split-leaf__tool" title="Split top and bottom" @click.stop="split('v')">
          <q-icon name="splitscreen_top" size="12px" />
        </button>
        <button
          v-if="node.leaf" type="button"
          class="split-leaf__tool split-leaf__tool--clear" title="Clear this slot"
          @click.stop="clear"
        >
          <q-icon name="close" size="12px" />
        </button>
      </div>

      <div v-if="!node.leaf" class="split-leaf__empty">
        <q-icon name="sym_o_empty_dashboard" size="16px" />
        <span>drop a dashboard</span>
      </div>

      <template v-else>
        <div class="split-leaf__plate">
          <q-icon name="sym_o_empty_dashboard" size="12px" />
          <span class="split-leaf__name">{{ leafName }}</span>
        </div>
        <div v-if="!tooSmall && leafId != null" class="split-leaf__body">
          <DashboardGrid :dashboard-id="leafId" nested />
        </div>
        <InfoChip
          v-else-if="!tooSmall && failed"
          dense kind="skeletons" :address="node.leaf"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import { refService } from 'src/services/ref.service'
// The tree grammar + THE min slot size live in the util (one statement —
// the keep-in-step law). The ops mutate the shared reactive tree by
// design; see the module for why.
import {
  MIN_PANE_W, MIN_PANE_H, clampRatio, setRatio,
  splitLeaf, clearLeaf, dropOnLeaf, fuseSplit, isEmptyLeaf
} from 'src/utils/splitTree'

export default defineComponent({
  name: 'SplitLayout',
  components: {
    InfoChip,
    // Async on purpose: DashboardGrid mounts SplitLayout and a leaf
    // mounts DashboardGrid — the import-cycle law's seam, same as
    // ElementMini inside the minis.
    DashboardGrid: defineAsyncComponent(() => import('src/components/dashboard/DashboardGrid.vue'))
  },
  props: {
    node: { type: Object, required: true },
    editing: { type: Boolean, default: false },
    depth: { type: Number, default: 0 }
  },
  emits: ['changed'],
  setup (props, { emit }) {
    const boxEl = ref(null)
    const leafEl = ref(null)
    const dragging = ref(false)
    const dragOver = ref(false)

    // ── split-node: the divider drag (BottomSplitter's pattern) ──────
    const paneStyle = computed(() => {
      const pct = Math.round((props.node.ratio ?? 0.5) * 1000) / 10
      return { flex: `0 0 calc(${pct}% - 3px)` }
    })

    const startDrag = (e) => {
      if (!boxEl.value) return
      dragging.value = true
      const el = e.currentTarget
      el.setPointerCapture?.(e.pointerId)
      const rect = boxEl.value.getBoundingClientRect()
      const horizontal = props.node.dir !== 'v'
      const size = horizontal ? rect.width : rect.height
      const start = horizontal ? rect.left : rect.top

      const onMove = (ev) => {
        const pos = horizontal ? ev.clientX : ev.clientY
        setRatio(props.node, clampRatio((pos - start) / size, size, horizontal))
      }
      const onUp = () => {
        dragging.value = false
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        emit('changed')
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
    }

    const resetRatio = () => {
      setRatio(props.node, 0.5)
      emit('changed')
    }

    const bothChildrenEmpty = computed(() =>
      !!props.node.children && props.node.children.every(isEmptyLeaf)
    )

    const fuse = () => {
      fuseSplit(props.node)
      emit('changed')
    }

    // ── leaf: split / clear / drop ───────────────────────────────────
    const split = (dir) => {
      splitLeaf(props.node, dir)
      emit('changed')
    }

    const clear = () => {
      clearLeaf(props.node)
      emit('changed')
    }

    const onDragOver = () => {
      if (props.editing && !props.node.leaf) dragOver.value = true
    }
    const onDrop = (e) => {
      dragOver.value = false
      if (!props.editing || props.node.leaf) return
      try {
        const payload = JSON.parse(e.dataTransfer.getData('application/x-pathos-ref'))
        if (payload?.kind === 'skeletons' && payload.address) {
          dropOnLeaf(props.node, payload.address)
          emit('changed')
        }
      } catch (_) { /* not ours */ }
    }

    // ── leaf resolution (ref → id + name) ────────────────────────────
    const leafId = ref(null)
    const leafName = ref('…')
    const failed = ref(false)
    const resolveLeaf = async () => {
      leafId.value = null
      failed.value = false
      leafName.value = '…'
      if (!props.node.leaf) return
      try {
        const s = await refService.summary(props.node.leaf)
        if (s.success && s.summary?.id != null) {
          leafId.value = s.summary.id
          leafName.value = s.summary.primary || ('#' + s.summary.id)
        } else {
          failed.value = true
          leafName.value = 'unreadable'
        }
      } catch (_) {
        failed.value = true
        leafName.value = 'unreadable'
      }
    }
    watch(() => props.node.leaf, resolveLeaf, { immediate: true })

    // ── the min-size plate swap ──────────────────────────────────────
    const tooSmall = ref(false)
    let ro = null
    onMounted(() => {
      if (!leafEl.value || typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect
        if (r) tooSmall.value = r.width < MIN_PANE_W || r.height < MIN_PANE_H
      })
      ro.observe(leafEl.value)
    })
    onBeforeUnmount(() => { ro?.disconnect() })

    return {
      boxEl,
      leafEl,
      dragging,
      dragOver,
      paneStyle,
      startDrag,
      resetRatio,
      bothChildrenEmpty,
      fuse,
      split,
      clear,
      onDragOver,
      onDrop,
      leafId,
      leafName,
      failed,
      tooSmall
    }
  }
})
</script>

<style lang="scss" scoped>
.split-layout {
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.split-node {
  display: flex;
  height: 100%;
  min-height: 0;
  min-width: 0;

  &--h { flex-direction: row; }
  &--v { flex-direction: column; }
}

.split-pane {
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  &--rest { flex: 1 1 auto; }
}

.split-divider {
  position: relative;
  flex: 0 0 6px;
  background: var(--dock-rule, var(--grey-4));
  cursor: col-resize;
  touch-action: none;

  .split-node--v > & { cursor: row-resize; }

  &:hover,
  &.is-dragging { background: var(--teal-12, #00b8d4); }
}

.split-fuse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  background: #fff;
  color: var(--dock-ink-mute, var(--brown-4));
  cursor: pointer;

  &:hover { color: #00829c; border-color: #00829c; }
}

.split-leaf {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  border: 1px dashed transparent;
  border-radius: 6px;

  &.is-empty {
    align-items: center;
    justify-content: center;
    border-color: var(--dock-rule-strong, var(--grey-5));
  }

  &.is-dragover {
    border-color: var(--teal-12, #00b8d4);
    background: rgba(0, 184, 212, 0.06);
  }
}

.split-leaf__tools {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 5;
  display: flex;
  gap: 3px;
}

.split-leaf__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  background: #fff;
  color: var(--dock-ink-mute, var(--brown-4));
  cursor: pointer;

  &:hover { color: #00829c; border-color: #00829c; }
  &--clear:hover { color: var(--coral-deep); border-color: var(--coral-deep); }
}

.split-leaf__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.72em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
}

.split-leaf__plate {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  flex-shrink: 0;
  font-size: 0.72em;
  font-weight: 600;
  color: var(--dock-ink, var(--brown-8));
  background: var(--dock-coat, var(--grey-3));
  border-bottom: 1px solid var(--dock-rule, var(--grey-4));
}

.split-leaf__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split-leaf__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
}
</style>
