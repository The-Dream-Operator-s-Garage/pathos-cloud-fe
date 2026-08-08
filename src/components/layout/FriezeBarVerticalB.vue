<template>
  <!-- ── Vertical frieze bar, VARIANT B — FriezeBarVertical (variant A) with
       its wave pattern MIRRORED HORIZONTALLY, so a pair of bars framing a box
       reflect each other across the box's centre line instead of repeating.
       A goes on the left, B on the right (FeedPage's feed container).

       Everything else is A, unchanged and deliberately so:

         thickness  width = --frieze-h
         palette    indigo-8 plaque, grey-5 + brown-1 waves, indigo-8 OUTER
                    side edge and an indigo-5 LIP — the inner-facing one, a
                    real line again since the last ask of 2026-08-07. It was
                    put here to match the head box's bottom rim; ⚠ that rim has
                    since walked to --indigo-9 and this lip did not follow, so
                    the two no longer rhyme (A carries the note). Same tokens
                    as A, always.
                    The plate went -9 and came back the same day; A carries
                    the note on why -8 is the level that matches.
                    The colorway's own hue now survives only in the PLATE:
                    both waves left it on 2026-08-07 (A carries the note).
                    INVERTED earlier on 2026-08-07
                    (user ask): a deep plate under pale waves, the reverse of
                    everything from 2026-07-25 on (grey-4 plate, indigo-4/-6
                    waves, the lip taking the plaque's own tone on 08-06 and
                    following it here). The spread stayed two levels through
                    the flip — see A, which carries the whole walk.
         tiling     repeat-Y at `99% auto`, `center top`
         padding    1px on the sides
         carve      IDENTICAL to A — dark up-RIGHT, light down-LEFT. The
                    motif mirrors; the LIGHT does not. A scene has one light
                    source, so flipping the carve with the pattern would read
                    as a second sun on the right-hand side of the box. This
                    is the same call FriezeBar makes: it masks with the
                    `-mirror` waves while keeping FriezeHeader's own carve.
         lip        same `lip` prop as A, so the two are drop-in siblings.
                    B's placement wants `lip="left"` (facing inward from the
                    right edge).
         roll       GONE with A's, 2026-08-07 (user ask). It was A's
                    outer-edge bevel verbatim, keyed off the same `--lip-*`
                    class so it landed on B's free side — and the pair of
                    them, one turning over on each side of the box, is
                    precisely what made the bars read as CYLINDERS. Both
                    edges are flat now. A carries the note.

       The mirror is baked into the ASSETS, not applied as a CSS transform —
       `mercury-wave-{a,b}-rot90-mirror.svg`, the rot90 exports wrapped in one
       more `translate(143 0) scale(-1 1)` group. A `transform: scaleX(-1)` on
       the layer would have flipped the drop-shadow carve along with the mask,
       which is exactly what we do not want here (and is why the repo has a
       `-mirror` pair for the horizontal bar too). -->
  <div class="frieze-bar-v-b" :class="['frieze-bar-v-b--lip-' + lip, { 'frieze-bar-v-b--slim': slim }]" aria-hidden="true">
    <div class="frieze-bar-v-b__inner">
      <div v-if="!slim" class="frieze-bar-v-b__layer frieze-bar-v-b__layer--one" />
      <div class="frieze-bar-v-b__layer frieze-bar-v-b__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeBarVerticalB',
  props: {
    // Which edge carries the lip — same contract as variant A. (The lip takes
    // `--indigo-5` since the last ask of 2026-08-07, after a day and a half at
    // the plaque's own tone drawing nothing. It picks the INNER-FACING edge —
    // B's placement wants `lip="left"` — which is the only asymmetry on the
    // bar: outer edge `--indigo-8`, inner `--indigo-5`. A carries the note.)
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
.frieze-bar-v-b {
  width: var(--frieze-bar-v-w, var(--frieze-h));
  flex: 0 0 var(--frieze-bar-v-w, var(--frieze-h));
  height: 100%;
  padding: 0 1px;
  pointer-events: none;
  position: relative; // no z-index, as in A (it held the roll until 2026-08-07)
  // Same plaque as A, same dial — INVERTED to `--indigo-8` on 2026-08-07, taken
  // a level deeper to `--indigo-9` later that day and brought BACK here, this
  // being the tone the feed head box's inner posts actually wear. A carries the
  // note on what the round trip settled.
  background: var(--frieze-bar-v-base, var(--indigo-8));
  // A's SIDE BORDERS, verbatim: 1px of the plaque's own tone down each long
  // edge, drawing no line and reserving a dark margin the `99%` mask cannot
  // reach — which is what keeps the now-pale motif off the silhouette. They come
  // out of the width (`box-sizing: border-box`), not on top of it.
  border-left: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-edge, var(--indigo-8));
  border-right: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-edge, var(--indigo-8));
}

// THE LIP HAS ITS JOB BACK (2026-08-07, last ask that day) — `--indigo-5`, in
// step with A. It had followed the plaque since 2026-08-06 (`--grey-4`, then
// `--indigo-8`) and drawn no inward line at all; it draws one now, and what
// brought it back is the feed head box taking an `--indigo-5` bottom rim in the
// ask before, which gave this surface a stated tone for "the inner line of the
// chrome" — ⚠ a relation that no longer holds: that rim is `--indigo-9` now
// and this lip stayed at -5 (A carries the whole note; do not "restore" either
// to match the other without an ask). These rules restate ONE side after the base rule drew both, so the
// bar comes out asymmetrical: outer `--indigo-8`, inner `--indigo-5`. Source
// order is what lets them win — equal specificity — and it mattered for nothing
// while the two tones were the same. A carries the whole note.
.frieze-bar-v-b--lip-left { border-left: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-lip, var(--indigo-5)); }
.frieze-bar-v-b--lip-right { border-right: var(--frieze-bar-v-edge-w, 1px) solid var(--frieze-bar-v-lip, var(--indigo-5)); }

// A's OUTER-EDGE ROLL used to be repeated here verbatim, placed opposite the
// lip so that on B's usual `lip="left"` it landed on the box's right-hand
// outside. Both are gone (2026-08-07, user ask) — A carries the note, and the
// short version is that a bar turning over at BOTH long edges reads as a rod,
// not as a plaque. B's half of that reading was this block.

.frieze-bar-v-b__inner {
  position: relative;
  width: 100%;
  height: 100%;
}

// A's layer recipe verbatim — only the mask files differ.
.frieze-bar-v-b__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-y;
  mask-size: 99% auto;
  mask-position: center top;
  -webkit-mask-repeat: repeat-y;
  -webkit-mask-size: 99% auto;
  -webkit-mask-position: center top;
  filter:
    drop-shadow(1.05px -1.05px 0 #0b0c10)
    drop-shadow(0.5px -0.5px 0 #0b0c10)
    drop-shadow(-1.05px 1.05px 0 #ffffff)
    drop-shadow(-0.5px 0.5px 0 #ffffff);
}

// In step with A through 2026-08-05's whole walk (-3/-4 → -4/-5 → -5/-6 →
// -4/-6), through 2026-08-07's INVERSION about the plaque (→ -1/-3, pale waves
// on a deep plate) and through the same day's second move, which took the LIT
// wave out of the family altogether (`--grey-4` over `--indigo-3`). Read A
// before changing either: the pair is TWO levels apart on purpose, that spread
// is what the carve reads as, and the headroom is now UPWARD-bound — to open
// the pair, take wave two down.
.frieze-bar-v-b__layer--one {
  // `--grey-5` since the mapping TURNED OVER (2026-08-07, last ask that day):
  // brown-1 is lighter than grey-4, so wave two became the lit face and this
  // one the shadow. A step down restores the spread and matches the names to
  // the facts — A carries the note.
  background-color: var(--frieze-bar-v-wave-one, var(--grey-5));
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
}

// …and out of the family altogether the same evening: `--brown-1`, the last
// indigo thing on the bar. An indigo plate carrying a warm motif — the head
// box's inner posts' arrangement. A carries the note on what that costs (the
// two waves are ~1.1:1 apart and told apart by hue, not value) and on which
// dial to reach for if the interleave ever has to read as two waves again.
.frieze-bar-v-b__layer--two {
  background-color: var(--frieze-bar-v-wave-two, var(--brown-1));
  mask-image: url('../../assets/frieze/mercury-wave-b-rot90-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-rot90-mirror.svg');
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
.frieze-bar-v-b--slim {
  // Diallable half thickness + the side borders CANCELLED, both in step with A
  // (2026-08-07): a 1px rim each side is 21% of a slim bar's motif field and
  // took the head box's posts under the ~0.7px-per-row floor. A carries the
  // arithmetic; the short version is that slim keeps the paint and drops every
  // device that costs width.
  --frieze-bar-v-w: var(--frieze-bar-v-slim-w, calc(var(--frieze-h) / 2));
  --frieze-bar-v-edge-w: 0;

  .frieze-bar-v-b__layer {
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
