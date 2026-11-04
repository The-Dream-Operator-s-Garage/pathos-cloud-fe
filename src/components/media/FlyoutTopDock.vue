<template>
  <!-- ── THE TOP DOCK'S BUTTONS (2026-11-03, user ask: "it has like a button
       of the same color as the flyout window with the same title you would
       put on the minimized flyout tab, but also with a drag icon that lets
       me drag the item across the top nav bar horizontally … When
       minimized, we see the draggable button on the top header bar instead
       of the tab below") ─────────────────────────────────────────────────
       One button per window DOCKED to the rail (stores/flyoutViewers
       `dockedViewers`, composables/useTopDock), standing ON the rail's face
       over its window's centre. It wears the window's coat (`--grey-4`, its
       `--grey-6` rim) and the parked tab's lettering — the same glyph and
       name the tab row would draw (`describe`'s label/icon, the mediaKind
       fallbacks) — led by a drag grip.
       · PRESS (no travel) toggles the window: expanded ⇄ parked. Parked,
         the button IS the window's tab — the row below never draws one.
       · DRAG (past 3px, from anywhere on the button; the grip says so)
         slides it along the rail — horizontally only — carrying the window.
       · ←/→ walk it 8px (40 with Shift); Enter / Space toggle.
       Two postures, read off the window: PARKED, a plate on the bar (all
       four corners round, its foot above the rail's rim); OPEN, a tab that
       opens INTO its window — its foot reaches through the rim to the
       window's top, no bottom rim, top corners round only — so button and
       window read as one shape hung from the bar.
       z 3135: over the rail (3125) and the parked stack strip (3130), under
       every flyout (3140+) — a free window dragged across the bar covers
       these buttons as it covers the bar. Desktop only (nothing docks on a
       phone). -->
  <div v-if="docks.length" class="flyout-top-dock" role="toolbar" aria-label="windows attached to the top bar">
    <button
      v-for="d in docks"
      :key="d.id"
      type="button"
      class="flyout-top-dock__btn nasalization"
      :class="{ 'is-open': d.open, 'is-dragging': dragId === d.id }"
      :style="{ left: d.cx + 'px' }"
      :title="(d.open ? 'Park ' : 'Open ') + d.name + ' — drag to move it along the bar'"
      :aria-expanded="d.open ? 'true' : 'false'"
      @pointerdown="down($event, d)"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="cancel"
      @keydown="key($event, d)"
    >
      <q-icon name="drag_indicator" size="13px" class="flyout-top-dock__grip" />
      <q-icon :name="d.icon" size="12px" class="flyout-top-dock__glyph" />
      <span class="flyout-top-dock__name">{{ d.name }}</span>
    </button>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { iconForTarget, titleOfTarget } from 'src/utils/mediaKind'
import { dockedRectOf, clampDockX, measureDock } from 'src/composables/useTopDock'

// Travel before a press becomes a drag — under it, the press is a toggle.
const DRAG_PX = 3

export default defineComponent({
  name: 'FlyoutTopDock',
  setup () {
    const store = useFlyoutViewersStore()

    const docks = computed(() => store.dockedViewers.map((v) => {
      const r = dockedRectOf(v)
      return {
        id: v.id,
        open: !v.minimized,
        cx: r.x + r.w / 2,
        w: r.w,
        x: r.x,
        icon: v.icon || iconForTarget(v.target),
        name: v.label || titleOfTarget(v.target)
      }
    }))

    // A window just attached (or a reload brought one back docked) — the
    // rail and the side viewer may have moved since the last measure.
    watch(() => docks.value.length, () => nextTick(() => measureDock()))

    // ── the press: toggle or slide ──────────────────────────────────
    const dragId = ref(null)
    let g = null // { id, pid, x0, base, w, moved }

    const down = (e, d) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      g = { id: d.id, pid: e.pointerId, x0: e.clientX, base: d.x, w: d.w, moved: false }
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* best-effort */ }
      if (d.open) store.focus(d.id)
      e.preventDefault()
    }
    const move = (e) => {
      if (!g || e.pointerId !== g.pid) return
      const dx = e.clientX - g.x0
      if (!g.moved && Math.abs(dx) <= DRAG_PX) return
      if (!g.moved) {
        g.moved = true
        dragId.value = g.id
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
      }
      const v = store.byId(g.id)
      if (!v || !v.rect) return
      store.setRect(v.id, { ...v.rect, x: clampDockX(g.base + dx, g.w) })
    }
    const finish = () => {
      g = null
      dragId.value = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    const toggle = (id) => {
      const v = store.byId(id)
      if (!v) return
      if (v.minimized) store.restore(id)
      else store.minimize(id)
    }
    const up = (e) => {
      if (!g || e.pointerId !== g.pid) return
      const { id, moved } = g
      finish()
      if (!moved) toggle(id)
    }
    const cancel = (e) => {
      if (!g || e.pointerId !== g.pid) return
      finish()
    }
    onBeforeUnmount(finish)

    const key = (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle(d.id)
        return
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const v = store.byId(d.id)
      if (!v || !v.rect) return
      const step = (e.shiftKey ? 40 : 8) * (e.key === 'ArrowLeft' ? -1 : 1)
      store.setRect(v.id, { ...v.rect, x: clampDockX(d.x + step, d.w) })
    }

    return { docks, dragId, down, move, up, cancel, key }
  }
})
</script>

<style lang="scss" scoped>
// No box of its own — every button is position: fixed on the rail.
.flyout-top-dock {
  display: contents;
}

.flyout-top-dock__btn {
  // The rail's face: from its lead (2px under the rail's top, which slides
  // with `--header-y`) down to just above its 1px rim.
  --dock-btn-top: calc(var(--header-y, 0px) + var(--media-tabs-lead, 2px));
  --dock-btn-r: 5px;
  position: fixed;
  z-index: 3135; // over the rail (3125) + the parked stack strip (3130), under every flyout (3140+)
  top: var(--dock-btn-top);
  height: calc(var(--media-tabs-h, 22px) - var(--media-tabs-lead, 2px) - var(--media-tabs-rim, 1px));
  transform: translateX(-50%); // `left` is the window's centre
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 200px;
  padding: 0 9px 0 3px;
  border: 1px solid var(--grey-6, #9e9e9e); // the window's own rim
  border-radius: var(--dock-btn-r);
  background: var(--grey-4, #e0e0e0); // the window's own coat
  color: var(--grey-8, #616161);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  touch-action: none; // a finger on the button is a slide, never a page pan
  user-select: none;
  box-shadow: 0 1px 3px rgba(var(--ink-rgb-deep, 0, 0, 0), 0.25);
  transition: background 0.12s, box-shadow 0.12s;

  &:hover { background: var(--grey-3, #eeeeee); }
  &:focus-visible { outline: 2px solid var(--teal-7, #00897b); outline-offset: 1px; }

  // OPEN: the button is the window's tab — its foot passes through the
  // rail's rim to the window's top (the rail's bottom edge), no bottom rim,
  // only the top corners round, no cast below it (the window is there).
  &.is-open {
    height: calc(var(--media-tabs-h, 22px) - var(--media-tabs-lead, 2px));
    border-bottom: none;
    border-radius: var(--dock-btn-r) var(--dock-btn-r) 0 0;
    box-shadow: none;
  }

  // Sliding: the window under it lights teal (`.is-grabbed` is the shell's
  // own gesture class); the button wears the same ring.
  &.is-dragging {
    cursor: grabbing;
    border-color: var(--teal-13, #1de9b6);
  }
}

.flyout-top-dock__grip {
  flex: 0 0 auto;
  color: var(--grey-7, #757575);
  cursor: grab;
}
.flyout-top-dock__btn.is-dragging .flyout-top-dock__grip { cursor: grabbing; }

.flyout-top-dock__glyph {
  flex: 0 0 auto;
}

.flyout-top-dock__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
