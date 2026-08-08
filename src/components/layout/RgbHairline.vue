<template>
  <!-- ── RGB hairline — a divider drawn as a VERTICAL SANDWICH (2026-08-07,
       user ask): a thick grey rule, a gradient band, a thick grey rule. It
       is the platform's second full-bleed divider, standing beside the
       frieze family rather than inside it — a frieze band is a MOTIF carved
       into a plaque and needs height to read (see FriezeBar's `slim` and the
       "think in motif rows" note in specs/gotchas.md); this one is three
       flat lines and reads at any size, which is what makes it usable where
       a frieze would go mushy.

       The COLOUR is the whole idea. The two bread lines are a flat grey and
       say "this is a rule"; the filling is the only hue in the sandwich, a
       `--cyan-11` → `--indigo-11` ramp running DOWN the band, so the divider
       states a direction as well as a division. The bread defaults to
       `--grey-7` (2026-08-07, user ask, one step UNDER the post card's line
       ink): a compound rule is read as one object, so its own two lines want to
       sit a step off the host's ordinary hairlines rather than to be mistaken
       for two of them — and on the feed it puts this divider on the same plate
       tone as the frieze band above it, which is what makes the card's two very
       different dividers read as one system. Both accents are
       their family's A100 — a mark made of two hues is built from one index
       across two families, or the ramp reads as bright fading to dull.

       Everything is a DIAL, in the frieze family's own idiom (`var(--x,
       default)` inline, never a default declared on this element — a host
       class and a component rule on the SAME element are decided by source
       order, which is not a contract):

         --rgb-hairline-edge     the two rules' ink        (--grey-7)
         --rgb-hairline-edge-h   their weight             (2px)
         --rgb-hairline-fill     the filling's paint      (the cyan→indigo ramp)
         --rgb-hairline-fill-h   the filling's height     (2px)

       A host that wants the ramp the other way up (a mirrored PAIR bracketing
       something, the way the post card's two frieze bands did for a day)
       restates `--rgb-hairline-fill` reversed — CSS cannot read a gradient
       backwards, so there is nothing to flip.

       Decorative: `aria-hidden`, `pointer-events: none`. -->
  <div class="rgb-hairline" aria-hidden="true" />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'RgbHairline'
})
</script>

<style scoped lang="scss">
.rgb-hairline {
  width: 100%;
  // Sized from the parts, not stated: `box-sizing: border-box` is the
  // platform default, so the two rules are cut OUT of this height and the
  // filling is exactly `--rgb-hairline-fill-h` whatever the bread weighs.
  // Dial either and the sandwich stays a sandwich.
  // The filling went 3px → 2px hours after the component shipped (user ask,
  // "make the inner vertical gradient thinner"), which leaves all three stripes
  // at ONE weight — 6px in total. The sandwich reading survives it because the
  // filling was never told apart by thickness: it is the only thing in the rule
  // with a hue, and at 2px the ramp still crosses cyan → indigo (a gradient
  // needs pixels to be read as a RAMP, and two device pixels at 1× — four at 2×
  // — is where that starts; 1px would be a flat mix of the two ends and should
  // be a flat colour instead, not a gradient pretending).
  height: calc(var(--rgb-hairline-edge-h, 2px) * 2 + var(--rgb-hairline-fill-h, 2px));
  box-sizing: border-box;
  // Decorative, and rigid in a flex column — the bar states a height, but
  // `flex-shrink` still defaults to 1, so a card with a ceiling would take its
  // slack out of the divider first. Stated HERE rather than left to each host
  // because it is the same answer everywhere and the failure is silent (the
  // rule survives as a coloured line and nobody reads it as squashed). Ignored
  // outside a flex container, which is why it can live in the component.
  flex: 0 0 auto;
  pointer-events: none;
  border-top: var(--rgb-hairline-edge-h, 2px) solid var(--rgb-hairline-edge, var(--grey-7, #757575));
  border-bottom: var(--rgb-hairline-edge-h, 2px) solid var(--rgb-hairline-edge, var(--grey-7, #757575));
  background: var(
    --rgb-hairline-fill,
    linear-gradient(to bottom, var(--cyan-11, #84ffff), var(--indigo-11, #8c9eff))
  );
  // THE ONE NON-OBVIOUS LINE. A background paints under the BORDER box by
  // default, so the ramp would run over all 7px and the filling would show only
  // its middle slice — a 3px window onto the middle of the gradient, i.e. two
  // muddy blues instead of cyan → indigo. Clipping to the padding box makes the
  // ramp span exactly the filling, so the full range is what you see.
  background-clip: padding-box;
}
</style>
