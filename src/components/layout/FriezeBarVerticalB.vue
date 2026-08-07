<template>
  <!-- ── Vertical frieze bar, VARIANT B — FriezeBarVertical (variant A) with
       its wave pattern MIRRORED HORIZONTALLY, so a pair of bars framing a box
       reflect each other across the box's centre line instead of repeating.
       A goes on the left, B on the right (FeedPage's feed container).

       Everything else is A, unchanged and deliberately so:

         thickness  width = --frieze-h
         palette    grey-4 plaque, indigo-4 + indigo-6 waves, grey-4 lip
                    — the same colorway, same tokens (most of it landed on
                    2026-08-05: the plate went neutral, the wave pair walked
                    down and settled TWO levels apart, and the lip came back
                    into the colorway on the dark wave — then walked -6 → -5
                    → -4 → OUT of it on 2026-08-06, the lip taking the
                    plaque's own tone, i.e. no inward line at all; see A)
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
         roll       A's outer-edge bevel verbatim, keyed off the same
                    `--lip-*` class — so on B it lands on the RIGHT, which
                    is B's free side. The two rolls therefore face outward
                    from the box in opposite directions and the pair reads
                    as one plaque turning over at both of its long edges.
                    Unlike the motif this is NOT mirrored art: the gradient
                    direction flips because the EDGE flips, while the light
                    stays where the carve puts it (see A's note).

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
    // Which edge carries the lip — same contract as variant A. (The lip is
    // `--grey-4` since 2026-08-06, i.e. invisible by design; the prop still
    // decides which edge would carry it.)
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
  position: relative; // containing block for the roll; no z-index, as in A
  background: var(--frieze-bar-v-base, var(--grey-4)); // same plaque as A (--grey-4 since 2026-08-05), same dial
}

// `--grey-4` since 2026-08-06 (user ask), in step with A — the PLAQUE's own
// tone, so this bar draws no inward line either: its inner edge is where the
// plate continues into the box. See A's note for the day's four settings and
// for why the lip lost its job rather than its argument (the cards now run lip
// to lip with their own border, and a second line there would double it).
.frieze-bar-v-b--lip-left { border-left: 1px solid var(--frieze-bar-v-lip, var(--grey-4)); }
.frieze-bar-v-b--lip-right { border-right: 1px solid var(--frieze-bar-v-lip, var(--grey-4)); }

// A's OUTER-EDGE ROLL, verbatim — read its note for what the two washes are
// and why neither is opaque. Same rule for placing it: opposite the lip, so
// on B's usual `lip="left"` the roll lands on the box's right-hand outside.
.frieze-bar-v-b::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  pointer-events: none;
  // A's stops verbatim — keep the two in step; A carries the tuning note.
  background-image:
    linear-gradient(to right,
      rgba(255, 255, 255, 0) 2.6px,
      rgba(255, 255, 255, 0.68) 4.6px,
      rgba(255, 255, 255, 0.24) 6.2px,
      rgba(255, 255, 255, 0) 8px),
    linear-gradient(to right,
      rgba(11, 12, 16, 0.9) 0,
      rgba(11, 12, 16, 0.78) 0.9px,
      rgba(11, 12, 16, 0.42) 2px,
      rgba(11, 12, 16, 0.16) 3.2px,
      rgba(11, 12, 16, 0) 4.6px);
}

.frieze-bar-v-b--lip-right::after { left: 0; }

// B's usual placement. `scaleX(-1)` is safe here for the reason A's note
// gives: no drop-shadow on this element, so nothing but the gradients flips.
.frieze-bar-v-b--lip-left::after {
  right: 0;
  transform: scaleX(-1);
}

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
// -4/-6). Read A before changing either: the pair is TWO levels apart on
// purpose now, and that spread is what the carve reads as.
.frieze-bar-v-b__layer--one {
  background-color: var(--frieze-bar-v-wave-one, var(--indigo-4));
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
}

.frieze-bar-v-b__layer--two {
  background-color: var(--frieze-bar-v-wave-two, var(--indigo-6));
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
// And one thing that is NOT in the flat bar's list: THE ROLLED OUTER EDGE IS
// DROPPED. That profile is 8px of a 19px bar, tuned for an edge facing the
// page canvas; at half thickness it would eat the motif, and a slim bar's job
// so far is to stand INSIDE a box where neither of its long edges faces the
// page at all. Same reason the flat bar has never had one.
.frieze-bar-v-b--slim {
  --frieze-bar-v-w: calc(var(--frieze-h) / 2);

  &::after { content: none; }

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
