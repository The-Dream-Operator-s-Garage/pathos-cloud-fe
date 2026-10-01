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

       Decorative only — the bars are `pointer-events: none` by their own
       law; the slot's content stands above them in the well. -->
  <div class="frieze-frame">
    <div class="frieze-frame__side frieze-frame__side--left" aria-hidden="true">
      <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
    </div>
    <div class="frieze-frame__side frieze-frame__side--top" aria-hidden="true">
      <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
    </div>
    <div class="frieze-frame__side frieze-frame__side--right" aria-hidden="true">
      <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
    </div>
    <div class="frieze-frame__side frieze-frame__side--bottom" aria-hidden="true">
      <FriezeBarVertical lip="right" slim class="frieze-frame__bar" />
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
  // The bar's thickness — the feed container's `--feed-edge-w` (13px: 1px
  // rule + 1px pad + 9px layer + 1px pad + 1px rule, slim's squeezed
  // recipe). A host may restate `--frame-t`; the four sides and the well
  // all read it.
  --frame-t: var(--frieze-frame-t, 13px);

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
  --frieze-bar-v-w: var(--frame-t);
  --frieze-bar-v-slim-w: var(--frame-t);
  --frieze-bar-v-base: var(--indigo-10, #1a237e);
  --frieze-bar-v-wave-one: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-wave-two: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-edge: var(--grey-6, #9e9e9e);
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-lip: var(--grey-6, #9e9e9e);
  --frieze-bar-v-carve: none;
  --frieze-bar-v-pad: 1px;

  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  // The END RULES (template note) — the edge tone, closing the frame's
  // outline at the corners the pinwheel leaves open.
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
}

// The two turned-flat bars: height = the side's width, then rotate about
// the top-left corner and slide back into the box. `translateY(-100%)` is
// the bar's own height, i.e. the side's width — so after the 90° turn the
// bar lies exactly along the side, its former TOP end at the right.
.frieze-frame__side--top .frieze-frame__bar,
.frieze-frame__side--bottom .frieze-frame__bar {
  height: 100cqw;
  transform-origin: 0 0;
}

.frieze-frame__side--top .frieze-frame__bar { transform: rotate(90deg) translateY(-100%); }
.frieze-frame__side--right .frieze-frame__bar { transform: rotate(180deg); }
.frieze-frame__side--bottom .frieze-frame__bar {
  transform: rotate(-90deg) translateX(-100%);
  // The CUT end (the bar's former top lands at the left after a 270°
  // turn): bare, like a covered end — see the template.
  border-top: 0;
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
