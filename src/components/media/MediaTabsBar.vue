<template>
  <!-- The minimize band — a thin light-grey strip ABOVE the crown strip
       (not on it: it claims `--media-tabs-h` and the whole top chrome
       steps down, 2026-08-05), carrying one tab per parked viewer;
       clicking a tab restores its window
       (docs/plans/floating-media-viewer.md). Rendered only while ≥1
       viewer is minimized (the host gates it), which is also what makes
       the reserved band appear and disappear with the tabs.

       The row fills from the RIGHT edge leftward and never passes half
       the screen; `parked` is reversed so the newest tab is the leftmost
       — the growing end — and every older tab keeps the slot it had. -->
  <div class="media-tabs" role="toolbar" aria-label="minimized media viewers">
    <TransitionGroup ref="rowEl" tag="div" name="mtab" class="media-tabs__row nasalization" appear>
      <button
        v-for="v in tabs"
        :key="v.id"
        type="button"
        class="media-tabs__tab"
        :title="'restore ' + nameOf(v)"
        @click="store.restore(v.id)"
      >
        <q-icon :name="iconFor(v.node)" size="12px" class="media-tabs__glyph" />
        <span class="media-tabs__name">{{ nameOf(v) }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMediaViewersStore } from 'src/stores/mediaViewers'
import { useMediaArena } from 'src/composables/useMediaArena'
import { iconFor } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaTabsBar',
  setup () {
    const store = useMediaViewersStore()
    const { measure } = useMediaArena()

    // Newest FIRST, so the row grows leftward from the right edge and a
    // tab, once placed, stays where it was put. It also puts the tab you
    // just made at the row's start, which is the end that stays visible
    // when the strip overflows into its scroller.
    const tabs = computed(() => [...store.parked].reverse())

    const nameOf = (v) =>
      v.node.file?.name ||
      v.node.embed?.title || v.node.embed?.provider ||
      v.node.title || ('node #' + v.node.id)

    // THE BAND IS SPACE, NOT PAINT (2026-08-05, user ask). While this
    // component is mounted the top chrome — crown strip, both page
    // containers, drawer, stack widget, creation docks — steps down by
    // `--media-tabs-h`, so this strip stands ABOVE the frieze instead of
    // covering its top fifth and cutting the motif off. Set on the root
    // element because the consumers are spread across layouts and
    // components; cleared on unmount, which is when the last viewer was
    // restored. The arena is re-measured after the shift lands so the
    // NEXT window spawns against the strip's real bottom edge.
    onMounted(async () => {
      document.documentElement.style.setProperty('--media-tabs-h', 'var(--media-tabs-band)')
      await nextTick()
      measure()
    })
    onBeforeUnmount(() => {
      document.documentElement.style.removeProperty('--media-tabs-h')
      nextTick().then(measure)
    })

    return { store, tabs, nameOf, iconFor }
  }
})
</script>

<style lang="scss" scoped>
// Above the stack widget (3100) so the tabs stay clickable across the full
// width, below the nav footer (3110) and drawer (3120). The band itself is
// PAINT — pointer-events pass through it; only the tabs take taps. It wears
// the media window's own `--grey-4` coat (2026-08-05, user ask): band, tab
// and window are one material, which is what lets a tab flare out of the
// band instead of being stuck onto it.
.media-tabs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--media-tabs-band);
  background: var(--grey-4, #e0e0e0);
  z-index: 3105;
  pointer-events: none;
}

// Tabs hang DOWN from the band, minitab-style (rounded bottoms — the nav
// strip's device mirrored to the top edge), and the row is pinned to the
// RIGHT: it starts at the right edge and grows leftward, capped at half
// the screen. Three things carry that cap, in order:
//
//  1. each tab SHRINKS (`flex: 0 1 auto` down to a 46px icon-and-a-sliver
//     floor, the name ellipsing as it goes),
//  2. then the row SCROLLS sideways,
//  3. and the pinning is `margin-left: auto` on the first tab, NOT
//     `justify-content: flex-end` — with flex-end, overflowing content
//     spills past the scroll container's start and cannot be scrolled back
//     to (see specs/gotchas.md). The auto margin simply collapses to 0 the
//     moment the row is full, and the strip scrolls like any other.
//
// The side padding is what the outermost tab's flare needs to live in
// (the fillets reach 9px beyond the tab), and the bottom padding leaves
// room for the hover's extra 3px and the press's 1px dip, so neither can
// raise a stray scrollbar.
.media-tabs__row {
  position: absolute;
  top: 100%;
  right: 31px; // 40px minus the fillet padding — the group still lands at 40
  max-width: 50vw;
  display: flex;
  gap: 6px;
  padding: 0 9px 5px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; // a scrollbar under a 22px tab strip is all noise
  &::-webkit-scrollbar { display: none; }

  > .media-tabs__tab:first-child { margin-left: auto; }
}

// A tab is a piece of the band pulled downward: same `--grey-4` face, a
// thin `--grey-6` rim (the media window's own rim tone — this is the
// window's handle, so it is drawn in the window's line), dark `--grey-9`
// ink in the display face. `--mtab-face` exists so the flares can follow
// the face through hover and press — they are painted by a gradient and
// cannot inherit `background`.
.media-tabs__tab {
  --mtab-face: var(--grey-4, #e0e0e0);
  pointer-events: auto; // the one clickable thing on a click-through band
  position: relative; // the two flares are absolute to this box
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 1 auto;
  height: 22px;
  min-width: 46px; // the shrink floor: glyph + a sliver of name
  max-width: 180px;
  padding: 0 10px;
  border: 1px solid var(--grey-6, #9e9e9e);
  border-top: none; // it flows out of the band, so it has no top edge
  border-radius: 0 0 9px 9px;
  background: var(--mtab-face);
  color: var(--grey-9, #424242);
  font-size: 0.62em;
  cursor: pointer;
  transition: background 0.12s, height 0.12s, transform 0.12s;

  // Hover pulls the tab a little further out of the band — the same
  // "this one will answer" cue the side widgets use, stated as reach —
  // and lights the metal a step. Press: a 1px dip onto a step darker,
  // which is the direction a press reads on a light surface (the dark
  // coat this bar was born on wanted the opposite).
  &:hover { --mtab-face: var(--grey-3, #eeeeee); height: 25px; }
  &:active { --mtab-face: var(--grey-5, #bdbdbd); transform: translateY(1px); }

  // ── THE FLARES ──
  // A concave fillet at each top corner, so the tab does not butt into the
  // band at a right angle but SWEEPS out of it — the bell curve. Each is a
  // 9px square (plus 1px of overlap INTO the tab, which covers the stub of
  // side border that would otherwise cross the sweep) filled with the tab's
  // face except a quarter-disc carved out of the corner nearest the tab.
  // The two extra colour stops draw the rim along that arc, and the arc
  // meets the tab's own border exactly where its tangent turns vertical, so
  // one continuous line runs band → flare → tab.
  //
  // Radial gradients, not borders: an INVERTED radius has no border-radius
  // spelling. `pointer-events: none` keeps the flares out of the hit box —
  // they are 9px of paint hanging over the crown strip.
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 10px;
    height: 9px;
    pointer-events: none;
  }

  &::before {
    left: -9px;
    background: radial-gradient(circle at 0 100%,
      transparent 7.9px, var(--grey-6, #9e9e9e) 8.1px,
      var(--grey-6, #9e9e9e) 8.9px, var(--mtab-face) 9.1px);
  }

  &::after {
    right: -9px;
    background: radial-gradient(circle at 100% 100%,
      transparent 7.9px, var(--grey-6, #9e9e9e) 8.1px,
      var(--grey-6, #9e9e9e) 8.9px, var(--mtab-face) 9.1px);
  }
}

.media-tabs__glyph {
  flex: 0 0 auto;
  color: var(--grey-8, #616161); // a step under the ink — glyph, not word
}

.media-tabs__name {
  min-width: 0; // or the flex floor cannot bite and the name never ellipses
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Park/restore choreography: a tab slides down out of the band when a
// window minimizes (appear covers the bar's own first mount) and lifts
// back into it when restored; .mtab-move eases the row closing ranks. A
// leaving tab keeps its flex slot for its 120ms — absolute repositioning
// would snap it to the row's start, a worse artifact than the brief hold.
.mtab-enter-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.mtab-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.mtab-enter-from,
.mtab-leave-to { opacity: 0; transform: translateY(-100%); }
.mtab-move { transition: transform 0.18s ease; }
</style>
