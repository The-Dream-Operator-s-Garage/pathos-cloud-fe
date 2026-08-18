<template>
  <!-- The minimize band — a thin strip of the platform's chrome coat
       (`--plaque-coat`), rimmed in 2px of `--grey-6` and lettered in
       `--grey-8`, its tabs cut from the same material (2026-08-17 user asks;
       it was a light-grey `--grey-4` strip rimmed and lettered in indigo,
       `--indigo-4` edges + `--indigo-10` marks, from 2026-08-06),
       ABOVE the crown strip (not on it: `--media-tabs-h` moves the whole
       top chrome down for it, 2026-08-05), carrying one tab per parked
       viewer; clicking a tab restores its window
       (docs/plans/floating-media-viewer.md). ALWAYS MOUNTED — it is the
       rail the viewers hang from, so it stands there empty as readily as
       full, and its space is a constant nothing has to animate.

       The row fills from the RIGHT edge leftward and never passes half
       the screen; `parked` is reversed so the newest tab is the leftmost
       — the growing end — and every older tab keeps the slot it had.

       IT STOPPED BEING ONLY MEDIA'S BAND on 2026-08-10 (user ask: the
       skeleton flyout parked here too) and stopped hosting TWO families on
       2026-08-17, when the fusion made every window one family — the
       flyout viewers, element and media faces alike. The row keeps its
       normalized `{ key, icon, name, restore }` shape from the two-family
       era: the strip never learns what a window holds, which is what let
       the families merge under it without it moving. The posture is why
       this strip is their home: a floating box retreats UPWARD, out of
       the way of the page it was covering, where a docked window folds
       back down into the bar it rose from. -->
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
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { iconFor, titleOf } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaTabsBar',
  setup () {
    const store = useFlyoutViewersStore()

    // One normalized shape per parked window. The strip hosted TWO
    // families from 2026-08-10 (the media viewers + the feed's
    // single-instance skeleton flyout, its tab in a fixed lead slot);
    // the 2026-08-17 FUSION folded them into one — every parker is a
    // flyout viewer now, so the row is simply the store's parked list,
    // NEWEST FIRST: the row grows leftward from the right edge and a
    // tab, once placed, stays where it was put.
    //
    // A tab's name + glyph are what the window mirrored down as its
    // header resolved (`store.describe`) — same seam, so a tab and the
    // window it restores are never called two different things. The
    // mediaKind fallbacks catch a window parked before its first
    // describe landed (node targets only — the others are born named).
    const tabs = computed(() => {
      return [...store.parked].reverse().map((v) => ({
        key: v.id,
        icon: v.icon || iconFor(v.target?.node),
        name: v.label || titleOf(v.target?.node),
        restore: () => store.restore(v.id)
      }))
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
// ── THE TOP OF THE WHOLE Z LADDER: 3125 (2026-08-17, user ask) ──
// The band was 3105 for its whole life — above the stack widget (3100) so the
// tabs stay clickable across the full width, below the nav footer (3110) and
// the left drawer (3120). That last relation is now REVERSED: the ask is that
// the drawer and the stack widget both start drawing at the very top of the
// screen and that this rail draw ON TOP OF BOTH, "partially covering the
// frieze bar" — so both columns run to y=0 with their own FriezeBar there, and
// this ~6px rail lies across the top of those bands (about a third of each).
// Nothing else on the ladder moved; 3121–3124 are left free between the drawer
// and this band.
//
// TWO consequences worth knowing:
//  · The band is still click-through PAINT (`pointer-events: none`), so the
//    drawer's and the stack's top pixels keep taking taps through it. Only a
//    TAB is solid, and tabs fill from the RIGHT edge leftward — they reach the
//    drawer's column only on a narrow window with the row near its 50vw cap,
//    where the tab is meant to win anyway now.
//  · On MOBILE the drawer is modal and its backdrop sits at 3115 — under the
//    drawer (3120) by construction, so it cannot dim a band above them both.
//    This rail therefore stands lit over a dimmed page. It is 6px of chrome
//    with no reachable control on it (the tabs are the only hit targets and
//    they sit at the far right), which is why the ask's ordering wins over the
//    dimming; putting the rail back under the backdrop would put it back under
//    the drawer, which is the thing being undone here.
//
// ── THE FACE: `--plaque-coat` since 2026-08-17 (user ask) ──
// It wore the media window's own `--grey-4` coat from 2026-08-05, on the
// argument that band, tab and window are ONE MATERIAL, which is what lets a
// tab flare out of the band instead of being stuck onto it. This band is the
// whole top chrome of the window (the crown strip was deleted 2026-08-12 and
// the page container pads down by `--media-tabs-h` alone), so the ask that
// took the nav bar, the drawer and both side widgets to the shared
// cream-under-veil coat reaches it too: the window's chrome is now one
// material on ALL FOUR EDGES, top rail included.
//
// THE TABS FOLLOWED IT an ask later the same day, reported off the SKELETON
// FLYOUT's minimize (every flyout and viewer parks on this one strip): face,
// rim weight and rim tone all match the band again, so band → flare → tab is
// one material with one line round it, which is the state this strip was
// built in. The tab takes `--plaque-flat` and not `--plaque-coat` because
// its face is also consumed inside the flares' radial-gradient colour stops,
// where a background LAYER LIST is illegal — that token is the coat's
// measured composite as a flat `<color>`, indistinguishable on an opaque
// surface. What the tab no longer matches is the media WINDOW it restores,
// which keeps `--grey-4`: the handle belongs to the strip it hangs from, the
// same way its rim already did after 2026-08-06.
//
// THE RIM UNDER IT IS 2px OF `--grey-6` SINCE 2026-08-17 (user ask) — see
// the rule below for what that costs at the seam. What follows is the history
// it replaced, and the argument is worth keeping because it is the one the
// tabs still live by: the 1px `--indigo-4` rim was the tabs' own border
// continued across the window (user ask, 2026-08-06: "so it looks smooth and
// metallic") — the band a machined edge with tabs cut out of it, one line
// running the whole way. That line was `--grey-6` until 2026-08-06,
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
// `border-box` + the `+ var(--media-tabs-rim)` in
// `--media-tabs-h` is what keeps the FACE a clean `--media-tabs-band` while
// the rim adds its own pixels to the space the page gives up. The tabs then
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
  height: calc(var(--media-tabs-band) + var(--media-tabs-rim));
  background: var(--plaque-coat);
  // ── THE RIM: 2px of --grey-6 (2026-08-17, user ask) ──
  // It was 1px of `--indigo-4` — the tabs' own border continued across the
  // window, one line running band → flare → tab, walked up the indigo ramp on
  // 2026-08-06 so the strip read as grey metal with the platform's indigo
  // scribed into it. With the face off `--grey-4` and onto the cream coat,
  // the line goes back to stating the EDGE rather than the colorway: --grey-6
  // is the same ink the post cards draw every line in, on the same
  // `--light-cream` sheet, and at 2px on a ~4px face it is no longer a scribe
  // mark — it is the bottom of the rail, which is what a shadow can then hang
  // off. Both pixels are declared, never assumed: `--media-tabs-rim` feeds
  // this border, this element's `height` (border-box) and `--media-tabs-h`,
  // the offset every top-anchored surface in the window starts on.
  //
  // THE TABS' RIM FOLLOWED an ask later (user report off the skeleton
  // flyout): their border and both flare arcs read `--mtab-rim` /
  // `--mtab-rim-ink`, which default to this width and `--grey-6`, so one
  // unbroken line runs band → flare → tab again. `--media-tabs-rim` is
  // therefore FOUR numbers now, not three — this border, the band's height,
  // `--media-tabs-h`, and the tab's own edge.
  border-bottom: var(--media-tabs-rim) solid var(--grey-6, #9e9e9e);
  // A soft downward cast (2026-08-17, user ask) — the rail is a raised edge
  // over the page now, not paint lying flush on it. Deliberately NOT the
  // `--shadow-side-edge` family the right-edge column wears (that one is a
  // horizontal cast at 16%, and this bar is 1440px of it — the same opacity
  // reads as a smear across the whole window); deliberately not `--shadow-soft`
  // either, which at 6% disappears against the page's dark canvas.
  //
  // ⚠ WALKED UP THE SAME DAY (user ask: "make the top header bar project a
  // little shadow on top of the bars behind") — 12% over 8px at +2px became
  // **22% over 10px at +3px**. The first figure was chosen while this rail sat
  // UNDER the drawer at z 3105, where the only thing its cast could land on was
  // the page; now that the rail is the ladder's top it falls across the drawer's
  // and the stack's frieze bands, and 12% of ink over a carved orange/teal
  // meander on a `--grey-8` plate is very nearly invisible — the bands it is
  // meant to be lying on top of were the one surface it could not state itself
  // against. 22% reads as a soft edge on those plates and still stays quiet on
  // the light chrome below (the feed column, a dock) and effectively invisible
  // on the starfield. The `+3px` offset keeps the cast clear of the rim's own
  // 2px so the line and the shadow read as two things, not one thick edge.
  //
  // It falls BEHIND the tabs, not on them — `.media-tabs__row` is a child, so
  // it paints above the parent's cast — which is what keeps a parked tab
  // reading as attached metal rather than as something lying under the bar.
  box-shadow: 0 3px 10px rgba(var(--ink-rgb-deep), 0.22);
  z-index: 3125;                  // the ladder's top — see the note above
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

// A tab is a piece of the band pulled downward: the band's own face
// (`--plaque-flat`, the chrome coat as a flat colour) inside the band's own
// rim (`--media-tabs-rim` of `--grey-6`), so the two are one material with
// one continuous edge — it spent one ask on a `--grey-4` face and a 1px
// `--indigo-4` rim after the band moved without it, and rejoined on
// 2026-08-17; it was the media window's `--grey-6` rim tone until
// 2026-08-06 (user ask), which is the day the handle stopped matching the
// window it opens and started matching the STRIP it hangs from — and
// `--indigo-10` ink in the display face. `--mtab-face` exists so the flares
// can follow the face through hover and press — they are painted by a
// gradient and cannot inherit `background`.
.media-tabs__tab {
  // ── THE TAB REJOINED THE BAND (2026-08-17, user ask, reported off the
  // SKELETON FLYOUT's minimize — every flyout and viewer parks on this same
  // strip, so one rule covers them all) ──
  // `--plaque-flat` is `--plaque-coat` as a flat `<color>`: the coat's
  // measured composite (#f8f2e4), which exists precisely because this face is
  // also consumed inside the flares' gradient stops, where a background layer
  // list is illegal. Tab and band are one material again — the state the
  // strip was built in and lost for the hour the band alone wore the coat.
  --mtab-face: var(--plaque-flat, #f8f2e4);
  // The rim matches the band's, thickness and tone: `--media-tabs-rim` of
  // `--grey-6`, so the line runs band → flare → tab unbroken again. The tab
  // has no top edge (it flows OUT of the band), so what this paints is the
  // bottom sweep and the two sides — one continuous edge with the rail's.
  --mtab-rim: var(--media-tabs-rim, 2px);
  --mtab-rim-ink: var(--grey-6, #9e9e9e);
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
  border: var(--mtab-rim) solid var(--mtab-rim-ink);
  border-top: none; // it flows out of the band, so it has no top edge
  border-radius: 0 0 9px 9px;
  background: var(--mtab-face);
  // Ink --grey-8 (2026-08-17, user ask), from `--indigo-10`. The tab stopped
  // being the one indigo-written thing on a neutral strip when the strip went
  // cream: -8 is the platform's quiet-writing step on a light face, dark
  // enough at 0.62em (5.9:1 on this face) and a whole family away from the
  // rail's own `--grey-6` rim, so mark and edge never read as one weight.
  color: var(--grey-8, #616161);
  font-size: 0.62em;
  cursor: pointer;
  transition: background 0.12s, height 0.12s, transform 0.12s;

  // Hover pulls the tab a little further out of the band — the same
  // "this one will answer" cue the side widgets use, stated as reach —
  // and lights the metal a step. Press: a 1px dip onto a step darker,
  // which is the direction a press reads on a light surface (the dark
  // coat this bar was born on wanted the opposite).
  // The two states had to be re-based when the face went from `--grey-4`
  // (224) to the cream composite (248): `--grey-3` was a step UP from grey-4
  // and is a step DOWN from this, so the old hover would have read as a
  // press. They are stated in the coat's own terms now — hover LIFTS THE VEIL
  // (the bare `--light-cream` sheet, the lightest this surface goes), press
  // lays more of it on (`--grey-3`, the veil's own tone) — which keeps the
  // original direction: lighter reaching out, darker under the finger.
  &:hover { --mtab-face: var(--light-cream, #fcf3e0); height: 25px; }
  &:active { --mtab-face: var(--grey-3, #eeeeee); transform: translateY(1px); }

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
  // Both dimensions and every stop below follow `--mtab-rim` (2026-08-17), so
  // the fillet's half of the line is the same weight as the tab's border and
  // the band's rim. The WIDTH is 9px of sweep plus the rim's own pixels: that
  // overlap lies over the stub of side border which would otherwise cross the
  // sweep, and a 1px overlap stopped covering it the moment the border
  // doubled. The arc thickens INWARD — its outer boundary stays at 8.9/9.1px,
  // where the face begins and the tab's own edge stands — so the sweep still
  // lands exactly where it did and only the line drawn along it got heavier.
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: calc(9px + var(--mtab-rim));
    height: 9px;
    pointer-events: none;
  }

  &::before {
    left: -9px;
    background: radial-gradient(circle at 0 100%,
      transparent calc(9px - var(--mtab-rim) - 0.1px),
      var(--mtab-rim-ink) calc(9px - var(--mtab-rim) + 0.1px),
      var(--mtab-rim-ink) 8.9px, var(--mtab-face) 9.1px);
  }

  &::after {
    right: -9px;
    background: radial-gradient(circle at 100% 100%,
      transparent calc(9px - var(--mtab-rim) - 0.1px),
      var(--mtab-rim-ink) calc(9px - var(--mtab-rim) + 0.1px),
      var(--mtab-rim-ink) 8.9px, var(--mtab-face) 9.1px);
  }
}

.media-tabs__glyph {
  flex: 0 0 auto;
  // ONE ink for glyph and name, which is the rule this line has kept through
  // both repaints (2026-08-06 took the pair to `--indigo-10` from a split
  // where the glyph sat a step under the word at `--grey-8`, because at 12px
  // that step read as a FADED mark rather than a quieter one). 2026-08-17
  // (user ask) takes the pair to `--grey-8` — the old glyph tone, now doing
  // the whole tab — as the strip left the indigo colorway for the platform's
  // cream chrome. Inherit rather than restate: the tab sets `color` and this
  // only has to not override it.
  color: inherit;
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
