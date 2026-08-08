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
                    the colorway for good — it is the PLAQUE's own tone
                    since 2026-08-06, and TRAVELS WITH IT — see the
                    stylesheet for the walk.

       Palette (the one thing that is NOT a rotation) — the header's OWN
       tone mapping in Quasar's INDIGOS, so this really is a colorway of
       FriezeHeader and not a variation on it. **INVERTED since 2026-08-07**
       (user ask): a DEEP plaque under PALE waves, where the header and every
       setting of this bar since 2026-07-25 ran a pale plaque under deeper
       ones. The tone mapping is unchanged — plaque / wave one / wave two /
       lip, wave one still the lit face — only its DIRECTION flipped:

         plaque     indigo-8       — walked -8 → -9 → BACK TO -8 across three
                                    asks on 2026-08-07; was grey-4, and
                                    indigo-1 before that (⇔ the header's
                                    brown-1). The bar is the DARK object now
                                    and the box it edges the light one. The
                                    round trip is not a wasted move: -9 was
                                    reached for so the container's bars would
                                    match the head box's two inner posts, and
                                    those posts are `--indigo-8` — the tone
                                    that lands the four frieze plates on one
                                    level is THIS one. It is also the level
                                    the whole feed colorway calls its ink.
         wave one   grey-5         (layer--one) — the DARK face. Was grey-4,
                                    indigo-1, and -4 before the inversion.
         wave two   brown-1        (layer--two) — the LIT face, and WARM since
                                    2026-08-07 (was indigo-3, the last indigo
                                    on the bar).
                                    THE TWO ROLES SWAPPED in that same ask:
                                    brown-1 (#efebe9) is lighter than any
                                    neutral wave one has worn, so "wave one is
                                    the lit face" — true since the bar was built
                                    — stopped being true, and wave one dropped a
                                    step to grey-5 to make the spread real again
                                    (~1.6:1) rather than leave the pair at ~1.1:1
                                    with its names inverted. The layer names are
                                    MASK FILES, not roles. The spread rule is
                                    unchanged: the gap IS the carve, and the dial
                                    to open it is the DARKER one, downward.
         edges      indigo-8       — 1px down BOTH long edges (2026-08-07,
                                    user ask), the plaque's own tone, drawing
                                    no line: they reserve a dark margin the
                                    99% mask cannot reach, which is what keeps
                                    a pale motif off the silhouette. They
                                    TRAVEL with the plaque, like the lip — a
                                    margin left behind at the old level would
                                    become the line the device exists not to
                                    draw.
         lip        indigo-5       — THE INNER-FACING EDGE, and a REAL LINE
                                    again since the last ask of 2026-08-07. A
                                    stands on the box's left with `lip="right"`
                                    and B on the right with `lip="left"`, so
                                    the lip is whichever edge faces the feed's
                                    content. It came back HERE because the head
                                    box's bottom rim was -5 that hour and the
                                    two were meant as one mark — ⚠ that rim
                                    walked to -6 and then to `--indigo-9` in
                                    the asks after (`FeedHeadBox.vue`), and
                                    this lip did NOT follow, so the pairing is
                                    broken by three levels. The lip is now its
                                    own line, kept at -5 on its own merits: the
                                    reader-facing edge of the container. Move
                                    both if they are ever meant to rhyme again.
                                    The bar is
                                    therefore ASYMMETRICAL: outer edge -8 (the
                                    plaque's, drawing nothing), inner edge -5.
                                    It spent 2026-08-06 → 08-07 at the plaque's
                                    own tone drawing NOTHING (the walk that day:
                                    -6 → -5 → -4 → grey-4, then following the
                                    plate), which BROKE the header's rule that a
                                    lip is a wave tone; it is not a wave tone
                                    now either, and the stylesheet carries why.

       (It got here via lime and teal in an INVERTED arrangement — deep -8
       plaque, light waves — then blue-grey, earlier on 2026-07-25, before
       2026-08-05's operator ask moved the whole family to indigo. The
       inversion 2026-08-07 restored is therefore the bar's FIRST arrangement,
       three hues later.)
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
       IT the same day (second ask): the feed's whole field went `--grey-4`
       (FeedPage's container coat, FeedStream's head band and scroll bed), so
       the rule held again, one step over in the neutrals.

       THE PLAQUE LEFT AGAIN on 2026-08-07 (user ask) and this time the box
       did NOT follow: `--indigo-8` bars around a `--grey-4` field. The "one
       material" rule is RETIRED, not broken — the bar is no longer trim on
       the box's own coat but a DARK FRAME standing on it, the same relation
       the feed head box's two inner frieze posts have had since 2026-08-06
       (indigo-8 plaques on that grey plate). All four posts on this surface
       now read as one family: dark edges, pale field, pale cards.

       And the OUTER edge is where the plaque STOPS — flat, with no bevel.
       It spent 2026-08-05 → 08-07 as a ROLLED edge (a bullnose profile in
       two washes); that came off on the same ask as the inversion. See the
       note where it used to be, in the stylesheet.

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
    // framed box. (Since 2026-08-06 the lip is the PLAQUE'S OWN tone —
    // `--grey-4` then, `--indigo-8` since 2026-08-07 (via -9 and back the
    // same day) — so it draws nothing,
    // and since both long edges took a border in that same pass the prop only
    // decides which side a host could tone differently.)
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
  // Kept `relative` after the roll came off (2026-08-07): it is what holds the
  // bar's own paint together if anything is ever positioned inside it again,
  // and it is deliberately WITHOUT a z-index — `relative` alone makes no
  // stacking context, so the bar keeps ranking inside .feed-container's 3001
  // exactly as it did flat.
  position: relative;
  // PLAQUE --indigo-8 since 2026-08-07 (user ask), INVERTING the bar: a deep
  // plate under pale waves, where -1 (to 2026-08-05) and then --grey-4 were
  // both pale plates under deeper ones. Two things make it work rather than
  // merely darker:
  //   · the waves inverted WITH it (-1/-3, see the layer notes) — a carve is a
  //     groove on any tone, and all it ever needed was a step between plate
  //     and motif. The step is the same size, pointing the other way.
  //   · this is the tone the feed head box's two inner posts have worn since
  //     2026-08-06, so the surface's four frieze edges are finally ONE object
  //     in four places instead of a dark pair inside a neutral pair.
  // The box it edges did NOT follow this time — see the template's lip note
  // for why the "box and edges are one material" rule is retired, not broken.
  //
  // IT WENT DOWN TO `--indigo-9` AND BACK, two more asks the same day, and the
  // round trip is worth keeping because of what it settled. -9 was reached for
  // on the argument stated just above — put the container's bars on the same
  // plate as the feed head box's two inner posts, so all four are one object.
  // The argument was right and the number was wrong: THOSE POSTS ARE
  // `--indigo-8`. So the level that actually lands the four plates together is
  // this one, which is also the feed colorway's own ink, and -9 was a step away
  // from the very thing it was chosen to match. Read this as the pale-motif
  // pass's one loose end rather than as a change of mind: the deeper plate did
  // buy the now-pale waves (`--grey-5` / `--brown-1`) another level of ground,
  // and giving it back costs a little of that contrast for a family that
  // matches. If the motif ever needs the ground more than the family needs the
  // match, -9 is where to go and the head box's posts should go with it.
  background: var(--frieze-bar-v-base, var(--indigo-8));

  // ── THE SIDE BORDERS (2026-08-07, user ask) — thin, and on the LONG edges
  // only (never the ends): 1px of the plaque's own tone down each side.
  //
  // Being plaque-toned they draw no visible LINE — that is the point, and it is
  // the same reasoning the lip has run on since 2026-08-06. What they buy is a
  // guaranteed dark MARGIN. The mask sits at `99% auto`, so the motif reaches to
  // within a hair of both edges, and with the waves now pale (`--grey-5` and
  // `--brown-1`) a wave crest landing on the silhouette would let the bar's edge
  // read as ragged against the near-black canvas. A plate-toned rim is a
  // reserved strip the motif cannot enter.
  //
  // `box-sizing: border-box` is the platform default, so these come OUT of
  // `--frieze-bar-v-w` rather than widening the bar: the motif's field goes from
  // `w - 2` to `w - 4` (~11px of the feed container's 15px bar). That is the
  // real cost, and it is why they are 1px and not 2.
  border-left: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-edge, var(--indigo-8));
  border-right: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-edge, var(--indigo-8));
}

// The header's `border-bottom` under a 90° CW turn. Both variants exist so a
// pair of bars can frame a box with the lips facing in.
//
// THE PLAQUE'S OWN TONE since 2026-08-06 (user ask) — `--grey-4` then,
// `--indigo-8` since 2026-08-07, when the plaque moved and the lip moved with
// it. What the rule buys is unchanged by the hue: the bar draws no inward line
// at all, its inner edge is simply where the plate stops against the box. That
// BREAKS the crown strip's rule that a
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
// against it, so its line still has an edge to state.)
//
// That note used to end "if the cards ever take side padding beyond the 3px
// sliver, this lip wants a tone again". They DID, on 2026-08-07, and for most
// of that day it still did NOT, because the plaque went `--indigo-8` in the
// same pass: a line is only worth drawing where the eye needs help finding the
// edge, and a deep indigo plate stopping against a pale field is the strongest
// edge on the surface.
//
// ── THE LIP HAS ITS JOB BACK (2026-08-07, last ask of the day) ────────────
// `--indigo-5`. It is once more the ONE thing this class is for: A stands on
// the box's left with `lip="right"` and B on the right with `lip="left"`, so
// the lip IS each bar's INNER-FACING edge, and the pair of them is the line
// the feed's content faces. What brought it back is not the old argument (the
// plate is still deep, and still finds its own edge) but a NEW relation: the
// feed head box took an `--indigo-5` bottom rim in the ask before this one, so
// there was a stated tone for "the inner line of this surface's chrome", and
// the bars' inward edges joined it. Two marks at one level, on two different
// objects, saying the same thing about which side the reader is on.
//
// ⚠ THAT RELATION IS GONE (later the same day). The head box's rim was asked
// one tone darker (-6) and then all the way to `--indigo-9`, the tone its own
// interior is built from; this lip stayed. Nothing broke — the lip's own
// argument (a real line facing the reader, a step off the plaque) holds on its
// own — but do not read the two as a pair any more, and do not "restore" one
// to match the other without an ask: they are three levels apart on purpose.
//
// So the bar is no longer symmetrical: OUTER edges `--indigo-8` (the plaque's
// own, drawing nothing, reserving the motif's margin — see the base rule),
// INNER edge `--indigo-5`, a real line. This class is what makes that possible
// — it restates one side after the base rule has drawn both, which is why it
// comes AFTER in source order (equal specificity, so order decides, and it
// decided in favour of nothing at all while the two tones matched).
//
// (It still draws the feed container's side borders — that job has never
// changed, only its tone.)
.frieze-bar-v--lip-left { border-left: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-lip, var(--indigo-5)); }
.frieze-bar-v--lip-right { border-right: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-lip, var(--indigo-5)); }

// ── THE OUTER EDGE — FLAT. THE ROLL IS GONE (2026-08-07, user ask) ──
//
// It lived here from 2026-08-05: an 8px `::after` on the edge opposite the
// lip, two washes over the plaque — a near-black shade running out to the
// silhouette plus a white crest ~4.6px in — the asymmetric bullnose profile of
// a metal plaque seen straight from above. It was tuned by reading the
// RENDERED pixel ramp back (24 → 40 → 93 → 155 → 214 → 243 → 237 → 230 → 226
// → 224, canvas outward to plaque), and as a piece of shading it worked.
//
// What it did NOT survive is being looked at as a whole bar. Both long edges
// turning over, on a strip 19px wide with the motif running between them, does
// not read as a plaque with rounded edges — it reads as a CYLINDER, a rod
// standing beside the feed rather than a band lying on it. The illusion is
// exactly as good as intended and describes the wrong solid.
//
// So the bar ends in a line now: the plaque simply stops. Note what the roll
// was really buying and is no longer needed for — SOFTNESS against the page's
// near-black canvas, which is why its silhouette ran almost to black. The
// `--indigo-8` plaque of the same ask lands close enough to that canvas on its
// own; a pale plate is what needed the dissolve, and there is no pale plate
// here any more.
//
// If a rolled edge is ever wanted again, take it from git (this file,
// 2026-08-05 → 08-07) and put it on ONE edge only — the free one. Two rolls is
// the rod. And re-tune it against the plaque of the day: those stops were
// measured over `--grey-4`.
//
// (The `--lip-*` classes above still choose which side carries the lip — they
// used to place this roll on the other one, which is the only thing that
// changed about them.)

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

// ── THE PAIR INVERTED ON 2026-08-07 (user ask): -1 / -3, PALE WAVES ON A DEEP
// PLAQUE, where every setting below was a deeper pair on a pale one. Read the
// -4/-6 history first — it is all still load-bearing, because the inversion
// kept every relation it established and only turned the mapping over:
//
//   · TWO LEVELS APART, still. -1/-3 is the same spread as -4/-6, reflected.
//     The spread is the carve; that lesson survives the flip intact.
//   · WAVE ONE IS STILL THE LIT FACE — now by being the LIGHTER of the two
//     against a dark plate, where before it was the lighter of two darks on a
//     light plate. The mapping did not change, its direction did.
//     **THIS STOPPED BEING TRUE LATER THE SAME DAY** — brown-1 arrived on wave
//     two and is lighter than anything neutral wave one was wearing, so the two
//     roles SWAPPED. See the note on `--layer--one` for what that settled.
//   · THE HEADROOM MOVED WITH IT. The old pair's wall was downward (at -7 the
//     dark wave met the colorway's ink at -8 and stopped reading as a wave);
//     this pair's wall is UPWARD — -1 is the family's palest step, so wave one
//     has nowhere left to go. To open the pair further, take wave two DOWN
//     (-4 is free) rather than lifting wave one.
//   · THE CARVE'S WHITE FLANK is the thing to watch here and was not a
//     consideration before. The `#ffffff` drop-shadow down-left now falls
//     against a wave that is itself nearly white (#e8eaf6): the lit flank of
//     the groove and the wave it lights are ~2 levels apart, so the relief on
//     that side reads much softer than the dark flank's. That asymmetry is
//     acceptable — it is the same asymmetry real raking light gives — but it
//     is why the pale wave should NOT be pushed any paler even if a step
//     existed: at pure white the groove would have one visible flank.
//
// ── the pale-plaque history, kept verbatim ──
// THE WAVE PAIR WAS -4 / -6, and what it went through on 2026-08-05 is worth
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
// THE LIT WAVE LEFT THE COLORWAY on 2026-08-07 (user ask: "the now indigo-1
// frieze to grey-4", the plaque and the dark wave held where they were). It is
// a DEFAULT change and not a host dial because the feed container — the pair's
// only undialled host — IS what the default is drawn for; the head box's two
// inner posts state their own `--brown-1` waves and do not move. So the bar now
// reads NEUTRAL-lit over INDIGO-dark on an indigo plate, which is the same
// split the feed made everywhere else that day (cards, rail, lines all went
// grey while the container's own edges stayed in the family). What it costs is
// half a level of spread — `--grey-4` sits a touch under `--indigo-1` — and
// what it buys is that the two waves are now told apart by HUE as well as by
// value, so the interleave reads at 9px without leaning on the carve alone.
//
// ── THE MAPPING TURNED OVER (2026-08-07, last ask of the day) ──────────────
// This wave went `--grey-4` → **`--grey-5`**, for the reason the whole spread
// argument above is about — pointing the other way for the first time in this
// file's history.
//
// Quasar's `brown-1` is `#efebe9`; `grey-4` is `#e0e0e0`. The warm motif wave
// two took in the previous ask is therefore the LIGHTER of the two, so the pair
// had not merely narrowed to ~1.1:1, it had SWAPPED: wave two was the lit face
// and wave one — nominally "the lit one" since the bar was built — was the
// shadow. Dropping this layer a step to `--grey-5` (`#bdbdbd`) restores a real
// spread (~1.6:1) and states the arrangement honestly instead of leaving the
// names lying:
//
//   wave TWO (brown-1) is the LIT face now · wave ONE (grey-5) is the DARK one
//
// The layer names are MASK FILES, not roles — `a` and `b` of the mercury pair —
// so nothing needs renaming; what needed correcting was the belief, recorded
// above and below, that wave one is always the lighter. Everything else in the
// spread argument survives intact: two tones on one plate, the gap between them
// IS the carve, and the dial to reach for when it needs opening is the DARKER
// of the two, downward — which is this one again.
.frieze-bar-v__layer--one {
  background-color: var(--frieze-bar-v-wave-one, var(--grey-5)); // Quasar grey-5 — the DARK wave since the mapping turned over (was grey-4, indigo-1 before that)
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90.svg');
}

// THE MOTIF LEFT THE FAMILY ENTIRELY on 2026-08-07 (second ask that day): wave
// two went `--indigo-3` → **`--brown-1`**, which was the LAST indigo thing on
// the bar. So this post is now an INDIGO PLATE CARRYING A WARM MOTIF — exactly
// the arrangement the feed head box's two inner posts have run since
// 2026-08-06, and the reason all four now read as one object.
//
// The two waves are `--grey-4` and `--brown-1`: ~1.1:1 apart, which by the
// spread rule above is NO spread at all. They are told apart by HUE (neutral
// against warm) and by the carve's own flanks, not by value — the same trade
// the lit wave made when it left the colorway hours earlier, taken to its end.
// The motif's reading now rests on the PLAQUE step, which is why the plate went
// a level deeper in the same ask: pale-on-deep is doing all the work.
//
// If the interleave ever needs to read as two waves again, the free dial is
// THIS one downward (a `--brown-2`/`-3` keeps the warm hue and buys back a
// value step) — not wave one, which has nowhere pale left to go.
.frieze-bar-v__layer--two {
  background-color: var(--frieze-bar-v-wave-two, var(--brown-1)); // Quasar brown-1 — the warm motif, on the indigo plate
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
// There used to be a fifth: the rolled outer edge was DROPPED here, because
// that profile was 8px of a 19px bar and at half thickness it ate the motif.
// The slim variant outlived it — the roll came off the full bar too on
// 2026-08-07 — so this block no longer has to cancel anything, and the
// `&::after { content: none; }` that did went with it.
.frieze-bar-v--slim {
  // Half thickness by default, and DIALLABLE (2026-08-07): a host that needs a
  // slim post wider states `--frieze-bar-v-slim-w` rather than fighting this
  // declaration with `--frieze-bar-v-w`, which is the same custom property on
  // the same element and would be decided by source order between two scoped
  // rules of equal specificity. The feed head box's two inner posts are the
  // only caller — see the note below for why they needed it.
  --frieze-bar-v-w: var(--frieze-bar-v-slim-w, calc(var(--frieze-h) / 2));

  // ── A FIFTH THING SLIM CANCELS: THE SIDE BORDERS (2026-08-07) ────────────
  // They were added to the full bar hours earlier — 1px of the plaque's tone
  // down each long edge, reserving a dark margin the 99% mask cannot reach.
  // On a 19px bar that costs 10% of the motif's field; on a 9.5px one it costs
  // 21%, on top of the 2px of padding it is already paying, and the head box's
  // posts went from 7.5px of motif to 5.5px overnight.
  //
  // That is not a small trim, it is the difference between a pattern and a
  // texture, in the terms this file already argues in: the masks are a 13-row
  // grid scaled to 117% of the padded box, so a row went ~0.68px → ~0.50px,
  // well under the ~0.7px floor. "Thinned horribly … the pattern looks
  // distorted" is exactly what that number predicts.
  //
  // So slim keeps the full bar's paint and drops its GEOMETRY, the same trade
  // it makes for layer one and made for the rolled edge: at this size the
  // motif is the only thing the bar has, and every device that costs width
  // costs the motif. A host that wants the rim back states
  // `--frieze-bar-v-edge-w`.
  --frieze-bar-v-edge-w: 0;

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
