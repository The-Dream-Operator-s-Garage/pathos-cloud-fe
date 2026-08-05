<template>
  <!-- ── Vertical frieze bar, VARIANT A — FriezeHeader turned 90° CLOCKWISE,
       in the INDIGO colorway (blue-grey until 2026-08-05's hue-swap ask).
       Everything that made the crown strip is rotated with it, so the two
       are the same object seen on its side:

       (Its sibling FriezeBarVerticalB is this bar with the wave pattern
       mirrored horizontally — same palette, same carve, mirrored masks. A
       goes on a box's LEFT edge, B on its RIGHT, so the pair reflects.)

         thickness  width  = --frieze-h  (the header's height, unchanged)
         motif      the SAME mercury waves, exported pre-rotated
                    (mercury-wave-{a,b}-rot90.svg — 90° CW, canvas
                    swapped 231×143 → 143×231), tiled repeat-Y at
                    `99% auto` (the header's `auto 99%` on its side)
         padding    1px on the SIDES (the header pads 1px top/bottom)
         carve      the light source rotates too: a vector (dx,dy) turned
                    90° CW becomes (-dy,dx), so the header's dark up-left
                    + light down-right read here as dark up-RIGHT +
                    light down-LEFT. The result is pixel-identical to
                    physically rotating the strip.
         lip        the header's 1px `border-bottom` lands on the LEFT
                    edge under a 90° CW turn — that is `lip="left"`, the
                    default. `lip="right"` mirrors it so a PAIR of bars
                    can face their lips inward around a box (which is how
                    FeedPage frames the feed container).

       Palette (the one thing that is NOT a rotation) — the header's OWN
       tone mapping in Quasar's INDIGOS, so this really is a colorway of
       FriezeHeader and not a variation on it:

         plaque     indigo-1       ⇔ the header's brown-1
         wave one   indigo-3       ⇔ brown-3   (layer--one)
         wave two   indigo-4       ⇔ brown-4   (layer--two)
         lip        indigo-3       ⇔ brown-3   — the wave-one tone, exactly
                                    as the header's bottom lip works

       (It got here via lime and teal in an INVERTED arrangement — deep -8
       plaque, light waves — then blue-grey, earlier on 2026-07-25, before
       2026-08-05's operator ask moved the whole family to indigo.)
       **Re-hueing is a two-file edit**: swap the three Quasar hexes in
       _tokens.scss and the var names here (and in variant B, which shares
       them); nothing else in the app reads them.

       The lip is worth one note: it draws the feed container's SIDE
       BORDERS, which were specified lime-3 when the box was built. The bar
       took those edges over, so they follow its colorway — and the
       container's background has since joined it on `--indigo-1`, the
       bar's own plaque tone, so box and edges are one continuous material.

       Flows as a normal block like FriezeBar: no fixed positioning, no
       z-index, full height of its parent. Decorative only. -->
  <div class="frieze-bar-v" :class="'frieze-bar-v--lip-' + lip" aria-hidden="true">
    <div class="frieze-bar-v__inner">
      <div class="frieze-bar-v__layer frieze-bar-v__layer--one" />
      <div class="frieze-bar-v__layer frieze-bar-v__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeBarVertical',
  props: {
    // Which edge carries the 1px indigo-3 lip. 'left' is the strict 90°-CW
    // rotation of the header's bottom lip; 'right' is its mirror, for the
    // other side of a framed box.
    lip: {
      type: String,
      default: 'left',
      validator: v => ['left', 'right'].includes(v)
    }
  }
})
</script>

<style scoped lang="scss">
.frieze-bar-v {
  // Thickness is the header's height, unchanged — the same token, now
  // measured across instead of down.
  width: var(--frieze-h);
  flex: 0 0 var(--frieze-h);
  height: 100%;
  padding: 0 1px; // the header's `1px 0`, turned
  pointer-events: none;
  background: var(--indigo-1); // flat Quasar indigo-1 plaque (⇔ the header's brown-1)
}

// The header's `border-bottom` under a 90° CW turn. Both variants exist so a
// pair of bars can frame a box with the lips facing in.
.frieze-bar-v--lip-left { border-left: 1px solid var(--indigo-3); }
.frieze-bar-v--lip-right { border-right: 1px solid var(--indigo-3); }

.frieze-bar-v__inner {
  position: relative;
  width: 100%;
  height: 100%;
}

// Each layer's backgroundColor shines through its mask's white cells.
// repeat-Y tiles the frieze top-to-bottom and `99% auto` scales the motif to
// the padded strip's WIDTH — the header's `auto 99%` on its side. The carve
// drop-shadows are rotated with everything else: dark up-right, light
// down-left, full + half offset each so the coloured edge reads as a groove.
.frieze-bar-v__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-y;
  mask-size: 99% auto;
  mask-position: center top;
  -webkit-mask-repeat: repeat-y;
  -webkit-mask-size: 99% auto;
  -webkit-mask-position: center top;
  // Stepped 1.5/0.75 → 1.05/0.5 with --frieze-h's 30% cut (2026-08-02), same
  // move as the horizontal bars — only the rotated signs differ.
  filter:
    drop-shadow(1.05px -1.05px 0 #0b0c10)
    drop-shadow(0.5px -0.5px 0 #0b0c10)
    drop-shadow(-1.05px 1.05px 0 #ffffff)
    drop-shadow(-0.5px 0.5px 0 #ffffff);
}

.frieze-bar-v__layer--one {
  background-color: var(--indigo-3); // Quasar indigo-3 (⇔ the header's brown-3)
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
}

.frieze-bar-v__layer--two {
  background-color: var(--indigo-4); // Quasar indigo-4 (⇔ the header's brown-4)
  mask-image: url('../../assets/frieze/mercury-wave-b-rot90.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-rot90.svg');
}
</style>
