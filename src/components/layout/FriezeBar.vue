<template>
  <!-- ── Frieze bar — the crown strip's box-insertable sibling. Same
       geometry as FriezeHeader (height --frieze-h, 1px vertical pad,
       repeat-x masks at auto 99% with the identical carve filter) but
       it flows as a normal block meant to sit INSIDE other boxes: no
       fixed positioning, no z-index, full width of its parent. The two
       masks are the HORIZONTALLY MIRRORED exports of the header's
       waves (mercury-wave-{a,b}-mirror.svg) and the palette is pushed
       darker/inverted: brown-4 plaque base with brown-2 + brown-1
       waves (the header is brown-1 base / brown-3+4 waves). All three
       tones are DIALS a host box may set on the element it mounts this
       on — `--frieze-bar-base` + `--frieze-bar-wave-{one,two}` — which
       is how the chat window wears the band in green (see the style
       block; the recipe underneath them never moves).
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
  <div class="frieze-bar" :class="{ 'frieze-bar--slim': slim, 'frieze-bar--flip': flip }" aria-hidden="true">
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
    slim: { type: Boolean, default: false },
    // Run the meander the OTHER WAY (2026-08-02, user ask, for the two
    // right-edge side widgets). It swaps the masks for the un-mirrored
    // `mercury-wave-{a,b}.svg` — which by construction ARE this bar's masks
    // flipped horizontally, each `-mirror` file being its original wrapped in
    // `translate(231 0) scale(-1 1)` on the same canvas — so the flip costs no
    // asset and, crucially, is NOT a `transform: scaleX(-1)`: that would
    // mirror the drop-shadow carve along with the motif and light the band
    // from the other side. The carve stays exactly where it is; only the wave
    // turns around.
    flip: { type: Boolean, default: false }
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
  // The base was the band's ONE dial (2026-07-26): a host box that is not in
  // the brown colorway sets `--frieze-bar-base` on the element it mounts this
  // on and the plaque follows. Most placements leave it unset and keep
  // brown-4; the post information flyout feeds it --grey-9.
  //
  // THE WAVES ARE DIALS TOO since 2026-08-03 (`--frieze-bar-wave-one/two`
  // below), which reverses a note that stood here: that re-toning them "would
  // be a different bar, not this one dressed". What settled it is that the
  // platform already HAS a band in a second family — FriezeBarVertical is
  // FriezeHeader's tone mapping (base -1, waves -3/-4) in indigo — so a
  // whole colorway of this band is a thing the design does, not a costume.
  // The chat window asked for the third (lime, was green until 2026-08-05):
  // its band runs `slim` (base --lime-10, one wave --brown-1) — see below.
  // What must NOT move with the tones is the recipe —
  // the two masks, the `auto 99%` fit and the carve's drop-shadow offsets are
  // the band itself. Dial all THREE together or the motif goes flat: the
  // waves have to sit a step or two ABOVE their base, since the carve lights
  // them from the top left and reads as a groove only when the ink is lighter
  // than the plaque it is cut into.
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
    drop-shadow(-1.05px -1.05px 0 #0b0c10)
    drop-shadow(-0.5px -0.5px 0 #0b0c10)
    drop-shadow(1.05px 1.05px 0 #ffffff)
    drop-shadow(0.5px 0.5px 0 #ffffff);
}

.frieze-bar__layer--one {
  background-color: var(--frieze-bar-wave-one, var(--brown-2)); // Quasar brown-2
  mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
}

.frieze-bar__layer--two {
  background-color: var(--frieze-bar-wave-two, var(--brown-1)); // Quasar brown-1
  mask-image: url('../../assets/frieze/mercury-wave-b-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-mirror.svg');
}

// ── FLIP (2026-08-02) — the same band with the meander running the other
// way, for the stack/pins column on the right edge: those bands now mirror the
// ones the left drawer carries, so the two sides of the window reflect each
// other instead of repeating. Masks only — the plaque, the tones and the carve
// are untouched, which is what keeps one light source across the whole page.
// (`-mirror` files ARE the originals flipped, so this swaps back to them.)
.frieze-bar--flip {
  .frieze-bar__layer--one {
    mask-image: url('../../assets/frieze/mercury-wave-a.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-a.svg');
  }

  .frieze-bar__layer--two {
    mask-image: url('../../assets/frieze/mercury-wave-b.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-b.svg');
  }
}

// ── SLIM (2026-07-26) — the band at HALF height, drawn by the brown-1 wave
// alone. Three things move together, because halving the box without them
// leaves the motif sub-pixel and the carve wider than the strokes it carves
// (all three moved again on 2026-08-02, when --frieze-h itself lost 30% —
// every number here is stated relative to the box, so they follow it):
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
//     Net at a 900px viewport (band 9.45px since --frieze-h's 30% cut, inner
//     7.45px): the 13-row file lands at ~8.7px, so ~0.67px per motif row,
//     where a plain `99%` would leave ~0.57px. Both are sub-pixel now — this
//     is the size at which the slim band stops being a pattern and becomes a
//     texture, and the `117%` is what keeps the centre rule (the one mark
//     that survives at any size) reading as a line. A full-height bar gets
//     ~1.3px per row.
//
//  4. CARVE. The drop-shadow offsets halve with the box — 0.5/0.3, half of
//     the full bar's post-2026-08-02 1.05/0.5. Left alone, a 1.5px groove
//     would be wider than the stroke it is supposed to be carving and the
//     band would read as a black-and-white smear with a brown tint.
//
// The TONES are not part of this — those are the three `--frieze-bar-*` dials,
// which are orthogonal to the recipe and set by the host. (One interaction to
// know: slim drops layer one, so a host that dials only `--frieze-bar-wave-one`
// dresses a band that isn't drawn.)
.frieze-bar--slim {
  height: calc(var(--frieze-h) / 2);

  .frieze-bar__layer {
    mask-size: auto 117%;
    -webkit-mask-size: auto 117%;
    filter:
      drop-shadow(-0.5px -0.5px 0 #0b0c10)
      drop-shadow(-0.3px -0.3px 0 #0b0c10)
      drop-shadow(0.5px 0.5px 0 #ffffff)
      drop-shadow(0.3px 0.3px 0 #ffffff);
  }
}
</style>
