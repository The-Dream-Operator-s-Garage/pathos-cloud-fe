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
                    FeedPage frames the feed container). Its TONE has left
                    the colorway for good — `--grey-4`, the PLAQUE's own tone,
                    since 2026-08-06 — see the stylesheet for the walk.

       Palette (the one thing that is NOT a rotation) — the header's OWN
       tone mapping in Quasar's INDIGOS, so this really is a colorway of
       FriezeHeader and not a variation on it:

         plaque     indigo-1       ⇔ the header's brown-1
         wave one   indigo-4       (layer--one) — the LIT face; was -3 ⇔ brown-3
         wave two   indigo-6       (layer--two) — the DARK; was -4 ⇔ brown-4
                                    TWO levels apart since 2026-08-05, where
                                    every earlier setting had them one apart.
                                    The SPREAD is the carve — see the
                                    stylesheet before touching either.
                                    The ⇔ browns tie is retired with them —
                                    keep the MAPPING in step, not the indices.
         lip        grey-4         — THE PLAQUE'S OWN TONE, which BREAKS the
                                    header's rule that a lip is a wave tone
                                    (2026-08-06, user ask, the last of four
                                    settings that day: -6 → -5 → -4 → here).
                                    The bar now has no inward line at all —
                                    its inner edge is the plate continuing
                                    into the box. Deliberate: the cards run
                                    lip to lip with no gap since the same ask,
                                    so a line there would have doubled the
                                    card's own. See the stylesheet.

       (It got here via lime and teal in an INVERTED arrangement — deep -8
       plaque, light waves — then blue-grey, earlier on 2026-07-25, before
       2026-08-05's operator ask moved the whole family to indigo.)
       **Re-hueing is a two-file edit**: swap the three Quasar hexes in
       _tokens.scss and the var names here (and in variant B, which shares
       them); nothing else in the app reads them.

       The lip is worth one note: it draws the feed container's SIDE
       BORDERS, which were specified lime-3 when the box was built. The bar
       took those edges over, so they follow its colorway — and the
       container's background joined it on `--indigo-1`, the bar's plaque
       tone at the time, so box and edges read as one material. THE PLAQUE
       LEFT on 2026-08-05 (user ask): it went `--grey-4`, the floating media
       windows' coat — and for the length of that one pass the "one material"
       rule was BROKEN, a neutral band edging an indigo box. THE BOX FOLLOWED
       IT the same day (second ask): the feed's whole field is `--grey-4` now
       (FeedPage's container coat, FeedStream's head band and scroll bed), so
       the rule holds again, one step over in the neutrals. What stayed behind
       in indigo is exactly what was never the plaque: the WAVES — and, until
       2026-08-06, the LIP and the post cards' coat. Both of those went neutral
       that day too (the lip to this very tone, the cards to `--grey-3`), so
       the only indigo left on this surface is the motif and the LINES drawn on
       the cards.

       And the OUTER edge is no longer where the plaque STOPS — it is where
       the plaque TURNS OVER. See the `::after` note in the stylesheet.

       Flows as a normal block like FriezeBar: no fixed positioning, no
       z-index, full height of its parent. Decorative only. -->
  <div class="frieze-bar-v" :class="['frieze-bar-v--lip-' + lip, { 'frieze-bar-v--slim': slim }]" aria-hidden="true">
    <div class="frieze-bar-v__inner">
      <div v-if="!slim" class="frieze-bar-v__layer frieze-bar-v__layer--one" />
      <div class="frieze-bar-v__layer frieze-bar-v__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeBarVertical',
  props: {
    // Which edge carries the lip. 'left' is the strict 90°-CW rotation of the
    // header's bottom lip; 'right' is its mirror, for the other side of a
    // framed box. (Since 2026-08-06 the lip is `--grey-4`, the plaque's own
    // tone, so it draws nothing — the prop still decides which edge would
    // carry a line if one comes back.)
    lip: {
      type: String,
      default: 'left',
      validator: v => ['left', 'right'].includes(v)
    },
    // Half thickness, one wave, no rolled edge — the vertical reading of
    // FriezeBar's `slim` (the media viewer's divider band). See the
    // stylesheet for what the four changes buy.
    slim: { type: Boolean, default: false }
  }
})
</script>

<style scoped lang="scss">
.frieze-bar-v {
  // Thickness is the header's height, unchanged — the same token, now
  // measured across instead of down.
  width: var(--frieze-bar-v-w, var(--frieze-h));
  flex: 0 0 var(--frieze-bar-v-w, var(--frieze-h));
  height: 100%;
  padding: 0 1px; // the header's `1px 0`, turned
  pointer-events: none;
  // The containing block for the outer-edge roll below. Deliberately WITHOUT
  // a z-index: `relative` alone makes no stacking context, so the bar keeps
  // ranking inside .feed-container's 3001 exactly as it did flat.
  position: relative;
  // PLAQUE --grey-4 since 2026-08-05 (user ask: the same tone the floating
  // media windows are coated in). The waves and the lip stay indigo, so the
  // band is the feed's colorway drawn on a NEUTRAL plate — the motif still
  // reads (indigo-3/-4 sit above grey-4 exactly as they sat above indigo-1,
  // and the carve needs only that step), while the plate itself now belongs
  // to the platform's window material rather than to the container it edges.
  // The FEED BOX joined it here the same day (second ask), so plate and field
  // are one material again — see the lip note in the template.
  background: var(--frieze-bar-v-base, var(--grey-4));
}

// The header's `border-bottom` under a 90° CW turn. Both variants exist so a
// pair of bars can frame a box with the lips facing in.
//
// `--grey-4` since 2026-08-06 (user ask) — THE PLAQUE'S OWN TONE, which means
// the bar no longer draws an inward line at all: its inner edge is simply where
// the plate keeps going into the box. That BREAKS the crown strip's rule that a
// lip is a wave tone, and it is worth being honest that it does. What justifies
// it is the same ask's other half: the well's side padding went to 0, so the
// post cards ran lip to lip with their own even `--indigo-4` border, and a
// second line a pixel away from the card's read as a doubled edge. The lip did
// not lose an argument, it lost its JOB. A `3px` sliver came back a moment
// later ("just a little little") and this stayed neutral anyway — the gap does
// the separating now, without a second line.
//
// The route there, in one day: `--indigo-6` → `-5` → `-4` → here, four settings
// (see the tone notes below for what the first three were reaching for). And
// before that, for the bar's whole history, the lip was THE WAVE-ONE TONE —
// lime-3, teal-3, blue-grey-3, then `--indigo-3`. When the plate went neutral
// on 2026-08-05 the lip went neutral with it (`--grey-6`, the floating media
// windows' rim tone), on the argument that a coloured hairline down the inside
// of a piece of metal reads as trim rather than as where the metal stops.
//
// That argument was about a lip left behind at -3 while the plate moved, and
// the wave walk answered it: with the waves at -4/-6, the colorway's dark end
// was a TONE OF THE PLATE'S OWN MOTIF and not a leftover from the old coat, so
// the lip came back inside the mapping keyed to WAVE TWO (`--indigo-6`, that
// evening) — the same rule read at the pair's new spread.
//
// The next day it walked from wave TWO to wave ONE and then out of the
// colorway altogether. What the intermediate settings taught is worth keeping:
// this edge is read AGAINST the field of cards, and at -6 a full-height
// hairline down both sides of the box reads as a frame drawn around the feed,
// at -4 as where the bar's own material stops — the WEIGHT was always the dial,
// not the hue. (The media tabs strip walked to -4 the same day and STAYED
// there, which is the useful contrast: that strip has nothing running up
// against it, so its line still has an edge to state.) If the cards ever take
// side padding beyond the present 3px sliver, this lip wants a tone again, and
// `--indigo-4` is where it should go.
//
// The bar still states its two long edges differently on purpose: the OUTER
// one is a rolled gradient in the plate's own material (it faces the page),
// the INNER one is this line in the colorway (it faces the content).
// (It still draws the feed container's side borders — that job has never
// changed, only its tone.)
.frieze-bar-v--lip-left { border-left: 1px solid var(--frieze-bar-v-lip, var(--grey-4)); }
.frieze-bar-v--lip-right { border-right: 1px solid var(--frieze-bar-v-lip, var(--grey-4)); }

// ── THE OUTER EDGE — A ROLLED PLAQUE, SEEN STRAIGHT FROM ABOVE ──
// (2026-08-05, user ask: "playing with the color, tone and gradient to
// portray a smooth edge, as if the friezed bars were a metallic plaque viewed
// straight from above".)
//
// A plaque with a rolled edge, viewed orthographically from above, does not
// END in a line — the last few pixels of its face are the surface TURNING
// AWAY, and what the eye reads there is a RUN OF TONE. So this draws no
// border at all. Two washes, both measured inward from the silhouette:
//
//   shade      the outermost ~4px, where the normal has tipped past the light
//              and the face falls into its own shadow. Darkest at the very
//              edge, in the same near-black #0b0c10 the carve drop-shadows
//              above already use — one light source, one shadow colour.
//   highlight  a soft crest ~2–7px in: the band of the roll still square to
//              that light. This is the stop that makes the edge read as a
//              CURVE rather than as a dark stripe painted on a flat plate —
//              take it out and the bar just looks dirty down one side.
//
// Both are WASHES (rgba over the plaque), never opaque fills, which is the
// whole tell: the carved waves keep running out through the roll and are
// shaded BY it, so the engraving curves over the edge with the metal instead
// of stopping at a mask. Painted from `::after`, after `__inner` in DOM order
// and positioned like it, so it lands over both wave layers with no z-index.
//
// It goes on the edge OPPOSITE the lip, always — the lip is the inward face
// (the container's side border), so the free side is the one that turns over.
// Keying it off the same `--lip-*` class is what keeps that true wherever the
// bar is placed, without a second prop to keep in step.
// The PROFILE is the part worth reading, because two settings of it were
// wrong before this one and both failed the same way — as a stripe painted on
// a flat plate. What fixes it is the ASYMMETRY of a real bullnose:
//
//   · the fall OUTWARD from the crest is SHORT and STEEP (~4.5px), because
//     past the crest the surface is turning away fast, and
//   · the rise INWARD from the crest is LONG and GENTLE (~6px back to the
//     flat face), because that flank is barely tilted at all.
//
//   · the silhouette runs almost to BLACK (0.88 over the plaque ≈ #2a2a2a).
//     This is what makes the edge SOFT rather than merely shaded: the feed's
//     page canvas is near-black, so a plaque that darkens all the way down
//     dissolves into it, where the 0.46 of the first setting left a hard grey
//     cut against the page no amount of highlight could soften.
//
// A symmetrical bump, or a bright crest over a light silhouette, reads as a
// stripe every time. Metal is not lit evenly on both sides of its own edge.
.frieze-bar-v::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  // 8px of --frieze-h's current 19px. The outer ~3px of that is essentially
  // dark, so what it actually costs the motif is closer to 5px; the crest and
  // the shade still need room to be two separate events, which is the floor
  // below which this collapses back into a border.
  width: 8px;
  pointer-events: none;
  // Tuned against the RENDERED PIXELS, not against the numbers — a browser
  // samples a gradient at pixel CENTRES, so the outermost column reads the
  // stop at 0.5px and not at 0. The first setting asked for 0.88 at 0 and put
  // #474748 on screen, a full 47 levels above the canvas: a visible step,
  // which is the one thing a soft edge may not have. Holding the deep end
  // nearly flat for the first 0.9px is what actually lands it. The measured
  // ramp across the 8px, canvas outward to plaque, is
  //   24 → 40 → 93 → 155 → 214 → 243 → 237 → 230 → 226 → 224
  // i.e. dissolve, climb, crest, settle. Re-tune by reading it back the same
  // way, not by eye: at this width every stop is worth about one pixel.
  background-image:
    // the crest of the roll — the flank still square to the light
    linear-gradient(to right,
      rgba(255, 255, 255, 0) 2.6px,
      rgba(255, 255, 255, 0.68) 4.6px,
      rgba(255, 255, 255, 0.24) 6.2px,
      rgba(255, 255, 255, 0) 8px),
    // the surface turning away, down to the silhouette
    linear-gradient(to right,
      rgba(11, 12, 16, 0.9) 0,
      rgba(11, 12, 16, 0.78) 0.9px,
      rgba(11, 12, 16, 0.42) 2px,
      rgba(11, 12, 16, 0.16) 3.2px,
      rgba(11, 12, 16, 0) 4.6px);
}

// Lip inward-RIGHT ⇒ this bar sits on the box's LEFT ⇒ the roll is on the left,
// which is the direction the gradients above are written in.
.frieze-bar-v--lip-right::after { left: 0; }

// Lip inward-LEFT ⇒ this bar sits on the box's RIGHT ⇒ the roll is on the right.
// MIRRORED WITH A TRANSFORM, and this is the one place in the frieze family
// where that is allowed: the repo's `-mirror` wave assets exist precisely
// because `scaleX(-1)` on a wave layer would flip its drop-shadow carve along
// with the mask, and there is no drop-shadow here — only two gradients, whose
// direction SHOULD flip, because the edge they describe has flipped.
.frieze-bar-v--lip-left::after {
  right: 0;
  transform: scaleX(-1);
}

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

// THE WAVE PAIR IS -4 / -6, and what it went through on 2026-08-05 is worth
// keeping, because the useful lesson is in the third move and not the first
// two. It walked -3/-4 (the 2026-07-25 mapping) → -4/-5 ("stronger by 1") →
// -5/-6 ("one more tone") → **-4/-6** (the light one back up a step). The
// first two moves are the tail of the same day's swap to a NEUTRAL plate:
// these tones were picked to carve a groove on `--indigo-1`, where wave one
// sat at 1.19:1 on its own coat, and `--grey-4` is a whole hue away and reads
// flatter under them, so the motif needed weight the coat had stopped giving.
//
// THE THIRD MOVE IS THE ONE THAT MATTERS. Both waves stepping together kept
// them ONE LEVEL APART the whole way, so all three settings had the same
// internal contrast and only got darker as a block — more ink on the plate,
// not more relief. Lifting the light wave alone opens the pair to TWO levels
// and lets the motif read in DEPTH: -6 is the family's Material 500, its pure
// hue and the darkest thing on the plate short of the ink, while -4 stays
// clearly the lit face. A frieze is two waves interleaved, not one wave in
// two shades — the spread between them IS the carve.
//
// So the dial to reach for is the SPREAD, not the depth. Both deeper again
// hits a wall fast (at -7 the dark wave and the colorway's ink at -8 are
// neighbours, and wave two stops reading as a wave and starts reading as a
// written line); widening or narrowing the gap keeps working. Past that it is
// the PLAQUE that should move, not the waves.
//
// What it costs is the level-for-level tie to the crown strip's browns, which
// stop at -4. That is the right thing to give up: the bar is a colorway of
// FriezeHeader in its TONE MAPPING — plaque / wave one / wave two / lip — and
// three of those four have now left the browns' indices anyway (two neutrals
// and this pair). Keep the MAPPING in step, not the numbers.
.frieze-bar-v__layer--one {
  background-color: var(--frieze-bar-v-wave-one, var(--indigo-4)); // Quasar indigo-4 — the LIGHT wave (see the spread note)
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
}

.frieze-bar-v__layer--two {
  background-color: var(--frieze-bar-v-wave-two, var(--indigo-6)); // Quasar indigo-6 — the DARK wave, the family's pure hue
  mask-image: url('../../assets/frieze/mercury-wave-b-rot90.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-rot90.svg');
}

// ── SLIM (2026-08-06) — the half-thickness variant, the vertical reading of
// `FriezeBar`'s own `slim` (which is what the floating media viewer's divider
// band runs). Four things change together, and three of them are that file's
// reasoning turned 90°:
//
//  1. THICKNESS halves — `--frieze-h / 2`, published through the same
//     `--frieze-bar-v-w` dial the full bar resolves, so nothing else has to
//     know which variant it is holding.
//  2. ONE WAVE. Layer one is `v-if`'d out: `b` alone still tiles as a frieze
//     (it carries the full-width centre rule, the one mark that survives at
//     any size) and two interlocking meanders in ~9.5px read as a texture
//     rather than a pattern. A host that dials only `--frieze-bar-v-wave-one`
//     is dressing a layer that is not drawn.
//  3. MASK FIT. `117% auto` — the rotated form of the flat bar's `auto 117%`.
//     Both masks are a 13-row grid whose first and last rows are EMPTY; at
//     full thickness that margin is breathing room, at half it is a sixth of
//     the band spent on nothing, so the motif is scaled PAST the box and the
//     blank rows fall outside it. Nothing is clipped.
//  4. CARVE. The drop-shadow offsets halve with the box (1.05/0.5 → 0.5/0.3),
//     keeping the rotated signs: dark up-RIGHT, light down-LEFT. Left alone, a
//     groove wider than the stroke it carves turns the band into a smear.
//
// And one thing that is NOT in the flat bar's list: THE ROLLED OUTER EDGE IS
// DROPPED. That profile is 8px of a 19px bar, tuned for an edge facing the
// page canvas; at half thickness it would eat the motif, and a slim bar's job
// so far is to stand INSIDE a box where neither of its long edges faces the
// page at all. Same reason the flat bar has never had one.
.frieze-bar-v--slim {
  --frieze-bar-v-w: calc(var(--frieze-h) / 2);

  &::after { content: none; }

  .frieze-bar-v__layer {
    mask-size: 117% auto;
    -webkit-mask-size: 117% auto;
    filter:
      drop-shadow(0.5px -0.5px 0 #0b0c10)
      drop-shadow(0.3px -0.3px 0 #0b0c10)
      drop-shadow(-0.5px 0.5px 0 #ffffff)
      drop-shadow(-0.3px 0.3px 0 #ffffff);
  }
}
</style>
