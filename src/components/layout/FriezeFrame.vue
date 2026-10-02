<template>
  <!-- ── Frieze frame — FOUR of the feed container's LEFT rail laid as a
       PINWHEEL (2026-10-01, user ask: "draw a frame of indigo friezebars
       inside: first place the first bar on the left, as the pattern of the
       left friezebar of the feed container. Then, take the bar, rotate it
       90° to the right and then place it on top … rotate another one 90°
       … on the right end … close the frame rotating the bar again and
       placing it below, on top of the right bar and below the left bar.
       This will create a spiral effect. Be careful with the borders").

       ONE BAR, FOUR TIMES. Every side is the SAME component with the SAME
       dials — `FriezeBarVertical lip="right" slim`, the feed's left rail
       dial for dial (see `.frieze-frame__bar`, copied from FeedPage's
       `.feed-container__edge`) — and the other three sides are that bar
       physically TURNED: 90° clockwise on top, 180° on the right, 270° at
       the bottom. The motif, the rules and the lip turn with it, which is
       what makes the spiral: each bar's meander starts at the end the
       previous bar covers and runs toward the corner it covers itself.

       ⚠ A REAL `rotate()`, which the frieze family otherwise forbids — its
       three flip props are all asset swaps because a transform turns the
       CARVE's light source with the motif. It is safe HERE and only
       because the feed's recipe runs with `--frieze-bar-v-carve: none`:
       there is no groove to mis-light, the bars are flat plates with a
       flat motif. A host that turns the carve back on must not keep these
       transforms.

       THE OVERLAP IS CYCLIC — left over bottom, top over left, right over
       top, bottom over right — and z-index cannot say that for four
       full-length bars. The BOTTOM bar is the one that gives: it starts
       `--frame-t` in from the left edge instead of running under the left
       bar, so the left bar owns the bottom-left corner on its own, and
       the other three corners are plain stacking (z 1 → 2 → 3 → 4).

       THE BORDERS. The vertical bar draws rules on its LONG edges only
       (`--frieze-bar-v-edge` outside, `--frieze-bar-v-lip` inside) — its
       ends are bare, and at a pinwheel corner a bare end would leave a
       `--frame-t` gap in the frame's outer outline where the covering
       bar's plate crosses the covered bar's rule. So every bar takes a
       1px rule on BOTH ends too, in the edge tone: the covered end's rule
       disappears under the covering bar, the covering end's rule closes
       the outline at the corner. The one exception is the bottom bar's
       LEFT end, which is not covered but CUT (see above): a rule there
       would stand one pixel beside the left bar's lip and read as a
       doubled line, so that end is bare on purpose — it looks exactly as
       a covered end does.

       The sizes are `100cqw` on the turned bars: a bar is `width: t;
       height: 100%` by construction, and a bar that will lie along the
       top needs its HEIGHT to be the frame's WIDTH before it turns. Each
       horizontal side is a size container so the bar inside can read
       that width without a script.

       THE RAILS (2026-10-02, user ask: "add borders using the same style
       as the lips around the feed container friezebars"). Each bar now
       stands in a RAIL, the feed container's `.feed-container__rail`
       restated: `--plaque-coat` showing `--frame-coat` (2px) round the
       band, and a 1px `--grey-6` RIM on the face toward the content.
       The rail, not the bar, is what turns: `lip="right"` already put
       the bar's inner face on its local right, and every turn of the
       pinwheel carries local right onto the well. So the rim is ONE
       `border-right` that reaches the well on all four sides. The feed's
       rails run the full height of the page and never show an end; these
       do. So the coat also wraps the ENDS, and the bar's end rules sit
       `--frame-coat` in, level with its long-edge rules. At a covering
       corner the covering rail's rim is the seam across the covered
       rail's end. The bottom rail's CUT end stays bare (no coat, no
       rule): the plate runs right up to the left rail's rim, which is how
       the covered ends read at the other three corners.

       Decorative only — the bars are `pointer-events: none` by their own
       law; the slot's content stands above them in the well. -->
  <div class="frieze-frame">
    <div class="frieze-frame__side frieze-frame__side--left" aria-hidden="true">
      <div class="frieze-frame__rail">
        <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
      </div>
    </div>
    <div class="frieze-frame__side frieze-frame__side--top" aria-hidden="true">
      <div class="frieze-frame__rail">
        <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
      </div>
    </div>
    <div class="frieze-frame__side frieze-frame__side--right" aria-hidden="true">
      <div class="frieze-frame__rail">
        <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
      </div>
    </div>
    <div class="frieze-frame__side frieze-frame__side--bottom" aria-hidden="true">
      <div class="frieze-frame__rail">
        <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
      </div>
    </div>
    <div class="frieze-frame__well">
      <slot />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'

export default defineComponent({
  name: 'FriezeFrame',
  components: { FriezeBarVertical }
})
</script>

<style scoped lang="scss">
.frieze-frame {
  // The BAR's thickness — the feed container's `--feed-edge-w` (13px: 1px
  // rule + 1px pad + 9px layer + 1px pad + 1px rule, slim's squeezed
  // recipe). A host may restate `--frame-bar-t`.
  --frame-bar-t: var(--frieze-frame-t, 13px);
  // The RAIL round it — the feed's `.feed-container__rail`, number for
  // number: 2px of coat a side, a 1px rim on the inner face.
  --frame-coat: 2px;
  --frame-rim: 1px;
  // The SIDE's thickness, which the four sides and the well read: coat +
  // bar + coat + rim = 18px, the feed rail's own total.
  --frame-t: calc(var(--frame-bar-t) + 2 * var(--frame-coat) + var(--frame-rim));

  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.frieze-frame__side {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}

// The four sides, in stacking order — each covers the end of the one
// before it. The bottom side starts past the left bar (see the template).
.frieze-frame__side--left { left: 0; top: 0; bottom: 0; width: var(--frame-t); z-index: 1; }
.frieze-frame__side--top { left: 0; right: 0; top: 0; height: var(--frame-t); z-index: 2; container-type: size; }
.frieze-frame__side--right { right: 0; top: 0; bottom: 0; width: var(--frame-t); z-index: 3; }
.frieze-frame__side--bottom { left: var(--frame-t); right: 0; bottom: 0; height: var(--frame-t); z-index: 4; container-type: size; }

// ── THE BAR: the feed container's left rail, dial for dial. These are
// FeedPage's `.feed-container__edge` values verbatim (2026-09-26 state:
// plate at the floor of the indigo scale, flat cream motif, grey-6 rules,
// carve off, 1px pad). Two classes so this host beats the component's own
// `.frieze-bar-v--slim` rule (which zeroes the rules' width) regardless of
// injection order — FeedPage rides source order for the same win.
.frieze-frame .frieze-frame__bar {
  --frieze-bar-v-w: var(--frame-bar-t);
  --frieze-bar-v-slim-w: var(--frame-bar-t);
  --frieze-bar-v-base: var(--indigo-10, #1a237e);
  --frieze-bar-v-wave-one: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-wave-two: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-edge: var(--grey-6, #9e9e9e);
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-lip: var(--grey-6, #9e9e9e);
  --frieze-bar-v-carve: none;
  --frieze-bar-v-pad: 1px;

  // The END RULES (template note) — the edge tone, closing each bar's
  // ends the way its long-edge rules close its sides.
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
}

// ── THE RAIL: `.feed-container__rail` restated round each bar (template
// note). A one-item flex box, so the bar's own `flex: 0 0 --frieze-bar-v-w`
// keeps the thickness. The coat is the rail's padding on all four sides,
// because these rails have ends. The rim is `border-right`: the bar's
// inner face, carried onto the well by every turn below.
.frieze-frame__rail {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--frame-t);
  height: 100%;
  display: flex;
  align-items: stretch;
  padding: var(--frame-coat);
  background: var(--plaque-coat);
  border-right: var(--frame-rim) solid var(--grey-6, #9e9e9e);
}

// The two turned-flat rails: height = the side's width, then rotate about
// the top-left corner and slide back into the box. `translateY(-100%)` is
// the rail's own height, i.e. the side's width — so after the 90° turn the
// rail lies exactly along the side, its former TOP end at the right.
.frieze-frame__side--top .frieze-frame__rail,
.frieze-frame__side--bottom .frieze-frame__rail {
  height: 100cqw;
  transform-origin: 0 0;
}

.frieze-frame__side--top .frieze-frame__rail { transform: rotate(90deg) translateY(-100%); }
.frieze-frame__side--right .frieze-frame__rail { transform: rotate(180deg); }
.frieze-frame__side--bottom .frieze-frame__rail {
  transform: rotate(-90deg) translateX(-100%);
  // The CUT end (the former top lands at the left after a 270° turn):
  // bare, with no coat and no rule, the plate meeting the left rail's rim
  // the way a covered end meets its covering rail's rim (see the template).
  padding-top: 0;

  .frieze-frame__bar { border-top: 0; }
}

// ── THE MOTIF MIRRORED ALONG EACH BAR (2026-10-02, user ask: "make the
// inner friezebars of the sideviewer have their inner frieze patterns
// mirrored. Mirror the top and bottom frieze bars horizontally and the left
// and right ones vertically"). Both halves of the ask are ONE move in the
// bar's own frame: flip the motif layer end-for-end (`scaleY(-1)` — the
// bar's Y is its length). Before the side's turn that is a vertical mirror;
// the top and bottom bars then turn ±90°, so the same flip lands on screen
// as a HORIZONTAL one — the reading the ask names for each pair. Only the
// LAYER flips: the rules, the lip, the end rules and the rail round them
// stay where the pinwheel put them. Legal for the
// reason the rotations are — the carve is `none`, there is no groove light
// to turn upside down (gotchas § The frieze frame).
.frieze-frame__bar :deep(.frieze-bar-v__layer) {
  transform: scaleY(-1);
}

// The interior: everything inside the four bars, above them.
.frieze-frame__well {
  position: absolute;
  inset: var(--frame-t);
  z-index: 5;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
