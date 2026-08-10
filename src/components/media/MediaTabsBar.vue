<template>
  <!-- The minimize band — a thin light-grey strip rimmed and lettered in
       indigo (`--indigo-4` edges, `--indigo-10` marks, 2026-08-06),
       ABOVE the crown strip (not on it: `--media-tabs-h` moves the whole
       top chrome down for it, 2026-08-05), carrying one tab per parked
       viewer; clicking a tab restores its window
       (docs/plans/floating-media-viewer.md). ALWAYS MOUNTED — it is the
       rail the viewers hang from, so it stands there empty as readily as
       full, and its space is a constant nothing has to animate.

       The row fills from the RIGHT edge leftward and never passes half
       the screen; `parked` is reversed so the newest tab is the leftmost
       — the growing end — and every older tab keeps the slot it had.

       IT IS NOT ONLY THE VIEWERS' BAND since 2026-08-10 (user ask: "for the
       skeleton flyout, make it retreat into the thin header on the top of
       the screen, where the media viewers retreat too"). The feed's skeleton
       flyout parks here as well, so the row is built from a NORMALIZED list
       — `{ key, icon, name, restore }` — rather than straight off the media
       store, and this component stopped being about media the moment a
       second kind of window hung from it. What both parkers have in common
       is the posture, and it is the reason this strip is the right home for
       both: a floating box retreats UPWARD, out of the way of the page it
       was covering, where a docked window folds back down into the bar it
       rose from. -->
  <div class="media-tabs" role="toolbar" aria-label="minimized windows">
    <TransitionGroup ref="rowEl" tag="div" name="mtab" class="media-tabs__row nasalization" appear>
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="media-tabs__tab"
        :title="'restore ' + t.name"
        @click="t.restore()"
      >
        <q-icon :name="t.icon" size="12px" class="media-tabs__glyph" />
        <span class="media-tabs__name">{{ t.name }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useMediaViewersStore } from 'src/stores/mediaViewers'
import { useFlyoutsStore } from 'src/stores/flyouts'
import { iconFor, titleOf } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaTabsBar',
  setup () {
    const store = useMediaViewersStore()
    const flyouts = useFlyoutsStore()

    // One normalized shape for every parker (2026-08-10): media viewers, and
    // the feed's skeleton flyout when it is parked. Each tab carries its own
    // `restore`, so the strip never learns what kind of window it is holding
    // — which is what let a second family join it for six lines.
    //
    // Media viewers NEWEST FIRST, so the row grows leftward from the right
    // edge and a tab, once placed, stays where it was put. The flyout leads
    // the row: there is at most one of it, so a fixed slot at the growing end
    // costs the viewers nothing and gives the one tab that can appear on any
    // route a place that does not move under the pointer.
    const tabs = computed(() => {
      const out = []
      if (flyouts.skeleton.minimized) {
        out.push({
          key: 'flyout:skeleton',
          icon: flyouts.skeleton.icon,
          name: flyouts.skeleton.label,
          restore: () => flyouts.restoreSkeleton()
        })
      }
      for (const v of [...store.parked].reverse()) {
        out.push({
          key: v.id,
          icon: iconFor(v.node),
          // The window's own name, verbatim — same seam, so a tab and the
          // window it restores are never called two different things.
          name: titleOf(v.node),
          restore: () => store.restore(v.id)
        })
      }
      return out
    })

    // NOTHING to set at runtime: `--media-tabs-h` is a constant in
    // _tokens.scss and the top chrome is laid out against it from boot.
    // The first pass had this component claim and release the space as it
    // mounted, which worked and made the whole page hop 4px whenever a
    // viewer parked — a band that is permanent has no such moment.
    return { tabs }
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
//
// The 1px `--indigo-4` rim under it is the tabs' own border continued across
// the window (user ask, same day: "so it looks smooth and metallic") — the
// band is a machined edge with tabs cut out of it, and one line has to run
// the whole way for that to read. That line was `--grey-6` until 2026-08-06,
// when the user moved every EDGE on this strip into the feed colorway and
// every MARK on it to `--indigo-10`: the face stays the window's own neutral
// coat, so the strip reads as grey metal with the platform's indigo scribed
// into it. The edge WALKED UP in one sitting — asked for at `--indigo-6`
// (the feed container's lip), then -5, then here — and the walk is the note
// worth keeping: this is 1px of hue laid the full width of a light band at
// the very top of the screen, where the lip is a short edge read against the
// feed's own coat. At -6 that line RULES the page; at -4, the motif's LIT
// wave, it states the colorway and lets the strip stay a light thing. Depth
// on this edge went the opposite way from the ink beside it, which took the
// family's deepest step — the contrast between the two IS the strip.
// `border-box` + the `+ 1px` in
// `--media-tabs-h` is what keeps the FACE a clean `--media-tabs-band` while
// the rim adds its own pixel to the space the page gives up. The tabs then
// hang from `top: 100%` — the padding box, i.e. the face's underside — so
// each one and its flares PAINT OVER the rim for their own width: the line
// breaks where metal attaches to metal, which is exactly where a rim should
// stop.
.media-tabs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  height: calc(var(--media-tabs-band) + 1px);
  background: var(--grey-4, #e0e0e0);
  border-bottom: 1px solid var(--indigo-4, #7986cb);
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
// thin `--indigo-4` rim — the band's own line, so the two are still one
// continuous edge; it was the media window's `--grey-6` rim tone until
// 2026-08-06 (user ask), which is the day the handle stopped matching the
// window it opens and started matching the STRIP it hangs from — and
// `--indigo-10` ink in the display face. `--mtab-face` exists so the flares
// can follow the face through hover and press — they are painted by a
// gradient and cannot inherit `background`.
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
  border: 1px solid var(--indigo-4, #7986cb);
  border-top: none; // it flows out of the band, so it has no top edge
  border-radius: 0 0 9px 9px;
  background: var(--mtab-face);
  color: var(--indigo-10, #1a237e);
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
  // The two extra colour stops draw the rim along that arc IN THE RIM'S OWN
  // TONE — they are the fillet's half of the one continuous line, so they
  // move whenever the border does (grey-6 → indigo-4, 2026-08-06) or the
  // edge changes colour halfway through its sweep — and the arc
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
      transparent 7.9px, var(--indigo-4, #7986cb) 8.1px,
      var(--indigo-4, #7986cb) 8.9px, var(--mtab-face) 9.1px);
  }

  &::after {
    right: -9px;
    background: radial-gradient(circle at 100% 100%,
      transparent 7.9px, var(--indigo-4, #7986cb) 8.1px,
      var(--indigo-4, #7986cb) 8.9px, var(--mtab-face) 9.1px);
  }
}

.media-tabs__glyph {
  flex: 0 0 auto;
  // The SAME tone as the name (2026-08-06, user ask: "text and icons to
  // indigo-10"), where it used to sit a step under it at `--grey-8` —
  // glyph, not word. At 12px on a light face the step was reading as a
  // faded mark rather than a quieter one, and one ink for both makes the
  // tab a single written thing.
  color: var(--indigo-10, #1a237e);
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
