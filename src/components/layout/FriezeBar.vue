<template>
  <!-- ── Frieze bar — the crown strip's box-insertable sibling. Same
       geometry as FriezeHeader (height --frieze-h, 1px vertical pad,
       repeat-x masks at auto 99% with the identical carve filter) but
       it flows as a normal block meant to sit INSIDE other boxes: no
       fixed positioning, no z-index, full width of its parent. The two
       masks are the HORIZONTALLY MIRRORED exports of the header's
       waves (mercury-wave-{a,b}-mirror.svg) and the palette is pushed
       darker/inverted: brown-4 plaque base with brown-2 + brown-1
       waves (the header is brown-1 base / brown-3+4 waves).
       Decorative only — pointer-events none.

       `slim` (2026-07-26) is the HALF-HEIGHT variant — see the style
       block; it drops the brown-2 layer, so only the brown-1 wave is
       drawn and layer one is not even rendered.

       ONE TILING, always (2026-07-27): the layers span the box and the
       masks anchor at its LEFT edge, so the motif runs one way across
       the whole band. A `mirrored` variant lived here for a day — the
       band cut in half about its centre, each half tiling outward from
       the seam — for the flyout's inner band; it was removed because
       the seam reads as an event in a strip whose job is to be quiet.
       If a centred band is ever wanted again, the recipe was: two
       absolutely-positioned halves, the left wearing the UN-mirrored
       `mercury-wave-{a,b}.svg` at `mask-position: right`, and never
       `scaleX(-1)` (it mirrors the drop-shadow carve with the motif). -->
  <div class="frieze-bar" :class="{ 'frieze-bar--slim': slim }" aria-hidden="true">
    <div class="frieze-bar__inner">
      <div v-if="!slim" class="frieze-bar__layer frieze-bar__layer--one" />
      <div class="frieze-bar__layer frieze-bar__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeBar',
  props: {
    // Half height, one wave. A whole recipe rather than a knob: at
    // `--frieze-h / 2` the tone, the mask fit and the carve all have to move
    // together or the motif turns to mush, so they move as one named variant.
    slim: { type: Boolean, default: false }
  }
})
</script>

<style scoped lang="scss">
.frieze-bar {
  width: 100%;
  height: var(--frieze-h);
  padding: 1px 0;
  pointer-events: none;
  // flat Quasar brown-4 plaque — darker inversion of the header's brown-1.
  // The base is the band's ONE dial (2026-07-26): a host box that is not in
  // the brown colorway sets `--frieze-bar-base` on the element it mounts this
  // on and the plaque follows, waves untouched. Every existing placement
  // leaves it unset and keeps brown-4; the post information flyout feeds it
  // --grey-9. Only the BASE is a variable — the two wave layers are the motif
  // itself and re-toning them would be a different bar, not this one dressed.
  background: var(--frieze-bar-base, var(--brown-4));
}

.frieze-bar__inner {
  position: relative;
  height: 100%;
}

// Same carve recipe as FriezeHeader: dark up-left, light down-right,
// full + half offset each so the coloured edge reads as a groove.
.frieze-bar__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-x;
  mask-size: auto 99%;
  mask-position: left center;
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-size: auto 99%;
  -webkit-mask-position: left center;
  filter:
    drop-shadow(-1.5px -1.5px 0 #0b0c10)
    drop-shadow(-0.75px -0.75px 0 #0b0c10)
    drop-shadow(1.5px 1.5px 0 #ffffff)
    drop-shadow(0.75px 0.75px 0 #ffffff);
}

.frieze-bar__layer--one {
  background-color: var(--brown-2); // Quasar brown-2
  mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
}

.frieze-bar__layer--two {
  background-color: var(--brown-1); // Quasar brown-1
  mask-image: url('../../assets/frieze/mercury-wave-b-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-mirror.svg');
}

// ── SLIM (2026-07-26) — the band at HALF height, drawn by the brown-1 wave
// alone. Three things move together, because halving the box without them
// leaves the motif sub-pixel and the carve wider than the strokes it carves:
//
//  1. HEIGHT. `--frieze-h / 2`. The 1px vertical pad stays — at this size it
//     is what keeps the wave off the plaque's own edges, and it is the only
//     margin the band has left.
//
//  2. ONE WAVE. `mercury-wave-{a,b}-mirror.svg` are the SAME meander offset by
//     half a tile: `a` (brown-2) carries an upper spiral and a lower one, `b`
//     (brown-1) carries the other pair PLUS the full-width centre rule. So `b`
//     alone still tiles as a frieze — the spirals simply alternate at half the
//     density, and the rule runs unbroken through the middle, which is the one
//     mark that survives at any size. Dropping `a` is also what makes the
//     slimmed motif legible: two interlocking waves in 11px would have read as
//     a texture, not a pattern. Layer one is `v-if`'d out, not hidden.
//
//  3. MASK FIT. Both masks are a 13-row grid (231×143, 11px cells) whose TOP
//     AND BOTTOM ROWS ARE EMPTY — the ink runs y 11→132, i.e. 11/13 = 84.6% of
//     the file. At full height that dead margin costs ~2px a side and reads as
//     breathing room; at half height it is a sixth of the band spent on
//     nothing. So the slim bar scales the mask PAST the box (`auto 117%`) and
//     lets the blank rows fall outside it: 0.846 × 117% ≈ 99%, so the INK now
//     fills 99% of the inner height, exactly the fraction the full bar gives
//     the whole FILE. Same 1% breathing, moved to where it can be seen. Nothing
//     is clipped — only the empty rows leave the box.
//     Net at a 900px viewport (band 13.5px, inner 11.5px): the 13-row file
//     lands at 13.46px, so ~1.04px per motif row, where a plain `99%` would
//     leave ~0.88px — sub-pixel, and the difference between a pattern and a
//     grey haze. A full-height bar gets ~1.9px per row.
//
//  4. CARVE. The drop-shadow offsets halve with the box (1.5/0.75 → 0.75/0.4).
//     Left alone, a 1.5px groove would be wider than the ~1.2px stroke it is
//     supposed to be carving and the band would read as a black-and-white
//     smear with a brown tint.
//
// The plaque tone is NOT part of this — that is `--frieze-bar-base`, which is
// orthogonal and set by the host.
.frieze-bar--slim {
  height: calc(var(--frieze-h) / 2);

  .frieze-bar__layer {
    mask-size: auto 117%;
    -webkit-mask-size: auto 117%;
    filter:
      drop-shadow(-0.75px -0.75px 0 #0b0c10)
      drop-shadow(-0.4px -0.4px 0 #0b0c10)
      drop-shadow(0.75px 0.75px 0 #ffffff)
      drop-shadow(0.4px 0.4px 0 #ffffff);
  }
}
</style>
