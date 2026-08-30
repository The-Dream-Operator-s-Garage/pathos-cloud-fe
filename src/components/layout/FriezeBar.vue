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
       block; the recipe underneath them never moves). Since 2026-08-07
       each wave dial also has an IMAGE form —
       `--frieze-bar-wave-{one,two}-paint` — for a motif that is not one
       flat tone (the post card's pair runs a teal→indigo gradient down
       the wave while the plaque stays flat).
       Decorative only — pointer-events none.

       `slim` (2026-07-26) is the HALF-HEIGHT variant — see the style
       block; it drops the brown-2 layer, so only the brown-1 wave is
       drawn and layer one is not even rendered.

       `flip` (2026-08-02) turns the meander round the VERTICAL axis and
       `vflip` (2026-08-07) round the HORIZONTAL one — both by swapping
       masks, never by a transform (see the props). `vflip` is NOT the
       `mirrored` variant described below, which was a different idea
       with a similar name: that one cut ONE band in half about its
       centre, this one turns a WHOLE band upside down so two of them
       can bracket something as a reflected pair.

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
  <div
    class="frieze-bar"
    :class="{ 'frieze-bar--slim': slim, 'frieze-bar--flip': flip, 'frieze-bar--vflip': vflip }"
    aria-hidden="true"
  >
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
    flip: { type: Boolean, default: false },
    // Turn the meander UPSIDE DOWN (2026-08-07, user ask, for the post card's
    // pair of bars: one under the byline, one under the label rail, "vertically
    // mirrored" so the two bracket the lane between them as a reflection).
    //
    // Masks only, exactly like `flip` and for the same reason: a
    // `transform: scaleY(-1)` would take the CARVE with it and light this band
    // from below while every other frieze on the page is lit from the top left.
    // A mirrored PAIR is two reflections of a motif under ONE light, not two
    // light sources. So the flip is an asset swap — the `-mirror-vmirror` files
    // are the default masks (`-mirror`) reflected about the horizontal axis,
    // which on the same canvas is the original turned 180°
    // (`translate(231 143) scale(-1 -1)`), and `flip` + `vflip` together land
    // on the plain `-vmirror` pair, the fourth corner of that square.
    vflip: { type: Boolean, default: false }
  }
})
</script>

<style scoped lang="scss">
.frieze-bar {
  width: 100%;
  // THE HEIGHT IS A DIAL since 2026-08-07 (`--frieze-bar-h`, user ask: the post
  // card's pair "slightly thinner" than `slim`) — a TRIM, not a third variant.
  // What follows the box for free is the mask: `auto 99%` (and slim's `117%`)
  // are fractions OF IT, so the motif scales with whatever height is set. What
  // does NOT follow is the carve, whose drop-shadow offsets are absolute px —
  // and that is deliberate, a groove being a fixed physical width rather than a
  // proportion of the plate it is cut into. It is also the limit on this dial
  // DOWNWARD: trim far enough and the 0.5px groove is wider than the strokes it
  // carves, which is the mush `slim` exists to avoid. Upward it only helps.
  //
  // The number to think in is ONE MOTIF ROW, not the band: both masks are a
  // 13-row grid, so a `slim` bar at a 900px viewport gives each row ~0.67px and
  // is already sub-pixel. The post card's pair walked this dial in both
  // directions on the day it was born and settled ABOVE slim at `0.65 ×
  // --frieze-h` (~0.87px a row) — thinner reads as a texture, which is what
  // "I cannot see the friezes" means in numbers. Going far the other way is a
  // different question: past `--frieze-h` the band wants the full recipe (two
  // waves, the wider carve) rather than a stretched slim one.
  height: var(--frieze-bar-h, var(--frieze-h));
  // ── THE PAD IS A DIAL since 2026-08-27 (`--frieze-bar-pad`) — the
  // horizontal reading of the vertical family's `--frieze-bar-v-pad`
  // (2026-08-22), published for the same kind of host: the top rail's band
  // went pixel-drawn at `auto 13px` and was asked to lose "the inner padding
  // between the svg and the top and bottom borders" — on a fixed-px fit the
  // mask's own empty edge rows already reserve the margin, so this 1px is a
  // second margin paid twice, and zeroing it (with the band sized so the
  // mask overhangs, layer = ink) puts the ink against the rules without
  // touching the drawing. Unset, nothing changes anywhere.
  // ⚠ Only safe to zero ALONGSIDE a fixed fit — under `auto 99%`/`117%` the
  // mask follows the padded box and the motif would land on the band's edge.
  padding: var(--frieze-bar-pad, 1px) 0;
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
//
// THE CARVE IS A DIAL since 2026-08-21 (`--frieze-bar-carve`, user ask): the
// side-chrome trio wanted its bands FLAT — plain grey waves on a grey plate,
// no groove — and at band scale the carve's black/white flanks around
// low-contrast waves read as noise rather than relief. A host states
// `--frieze-bar-carve: none` on the element it mounts the bar on; unset, the
// default below IS the recipe, unchanged. (`slim` reads BOTH dials too since
// 2026-08-30 — with its own values as the defaults, so a host that sets
// neither gets the variant exactly as it always was; see the slim block.)
// THE MASK FIT IS A DIAL TOO (`--frieze-bar-fit`, same ask): `auto 99%`
// scales the motif to whatever box the band has, which is right for every
// viewport-relative band and guarantees sub-pixel rows — 99% of a vh-derived
// height never lands the 13-row grid on the pixel grid. A host that wants
// the frieze PIXEL-DRAWN states a fixed fit instead (the side-chrome trio:
// `auto 13px` in a 15px band — 1px per row, the 231×143 file tiling at
// exactly 21×13). Unset, nothing changes.
.frieze-bar__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-x;
  mask-size: var(--frieze-bar-fit, auto 99%);
  mask-position: left center;
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-size: var(--frieze-bar-fit, auto 99%);
  -webkit-mask-position: left center;
  filter: var(
    --frieze-bar-carve,
    drop-shadow(-1.05px -1.05px 0 #0b0c10)
    drop-shadow(-0.5px -0.5px 0 #0b0c10)
    drop-shadow(1.05px 1.05px 0 #ffffff)
    drop-shadow(0.5px 0.5px 0 #ffffff)
  );
}

// ── THE WAVES' PAINT (2026-08-07) — each wave dial has a second form, an
// IMAGE laid over its flat tone: `--frieze-bar-wave-{one,two}-paint`. Unset it
// is `none` and the layer is the flat plate it has always been; set, the host
// hands the motif a gradient (the post card's pair runs `--teal-11` →
// `--indigo-11` down the band, reversed on the mirrored one).
//
// It is one declaration and no new machinery because of what these layers
// already are: a MASK over a painted box. The mask decides the SHAPE, the
// background decides what fills it, and a gradient fills it exactly as a colour
// does — so the paint reaches the motif and nothing else. The plaque underneath
// is a different element's background and is untouched, which is the whole
// point: gradient on the wave, flat tone on the plate.
//
// Two properties of the fill worth stating, since both are the default and both
// are load-bearing. It spans the WHOLE BAR, once: a gradient has no intrinsic
// size, so it fills the background positioning area — the box, not the mask's
// tile — and the mask repeating every 231px does not repeat the ramp with it.
// And the `filter` carve reads the layer's ALPHA, which the paint does not
// touch, so a gradient-filled wave is grooved identically to a flat one.
.frieze-bar__layer--one {
  background-color: var(--frieze-bar-wave-one, var(--brown-2)); // Quasar brown-2
  background-image: var(--frieze-bar-wave-one-paint, none);
  mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-mirror.svg');
}

.frieze-bar__layer--two {
  background-color: var(--frieze-bar-wave-two, var(--brown-1)); // Quasar brown-1
  background-image: var(--frieze-bar-wave-two-paint, none);
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

// ── VFLIP (2026-08-07) — the same band UPSIDE DOWN, for a PAIR of bars that
// bracket something between them (the post card's byline│rail│pit sandwich).
// Same mechanism as `flip` one axis over — an asset swap, never a transform, so
// the carve keeps lighting every band on the page from the top left and the two
// bars read as one motif reflected rather than as two differently-lit strips.
//
// The four masks are the four corners of one square: plain (`flip`), `-mirror`
// (the default, plain reflected horizontally), `-vmirror` (plain reflected
// vertically) and `-mirror-vmirror` (both, i.e. plain turned 180°). This rule
// takes the DEFAULT's vertical reflection; the compound rule under it takes
// `flip`'s, and it must stay more specific than this one or the cascade would
// answer a `flip vflip` bar with whichever of the two rules was written last.
.frieze-bar--vflip {
  .frieze-bar__layer--one {
    mask-image: url('../../assets/frieze/mercury-wave-a-mirror-vmirror.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-mirror-vmirror.svg');
  }

  .frieze-bar__layer--two {
    mask-image: url('../../assets/frieze/mercury-wave-b-mirror-vmirror.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-mirror-vmirror.svg');
  }
}

.frieze-bar--flip.frieze-bar--vflip {
  .frieze-bar__layer--one {
    mask-image: url('../../assets/frieze/mercury-wave-a-vmirror.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-vmirror.svg');
  }

  .frieze-bar__layer--two {
    mask-image: url('../../assets/frieze/mercury-wave-b-vmirror.svg');
    -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-vmirror.svg');
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
// ⭐ SLIM READS THE FIT AND CARVE DIALS SINCE 2026-08-30 (the top rail's ask:
// its band went back to slim while keeping the pixel-drawn `auto 13px` fit
// and `carve: none` the 08-27 height was paid for — hardcoded values here
// would have squeezed the mask back to 117% and grimed the band the moment
// `slim` returned). The variant's own numbers are the DEFAULTS, so the
// hosts that dial neither (auth page, chat dock, the flyouts) render to the
// pixel as before; a host that sets the dials gets them under slim exactly
// as it would on a full bar. The height already worked this way
// (`--frieze-bar-h` since 2026-08-07).
.frieze-bar--slim {
  height: var(--frieze-bar-h, calc(var(--frieze-h) / 2));

  .frieze-bar__layer {
    mask-size: var(--frieze-bar-fit, auto 117%);
    -webkit-mask-size: var(--frieze-bar-fit, auto 117%);
    filter: var(
      --frieze-bar-carve,
      drop-shadow(-0.5px -0.5px 0 #0b0c10)
      drop-shadow(-0.3px -0.3px 0 #0b0c10)
      drop-shadow(0.5px 0.5px 0 #ffffff)
      drop-shadow(0.3px 0.3px 0 #ffffff)
    );
  }
}
</style>
