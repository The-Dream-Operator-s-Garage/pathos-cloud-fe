<template>
  <!-- ── Vertical frieze bar, VARIANT B — FriezeBarVertical (variant A) with
       its wave pattern MIRRORED HORIZONTALLY, so a pair of bars framing a box
       reflect each other across the box's centre line instead of repeating.
       A goes on the left, B on the right (FeedPage's feed container).

       Everything else is A, unchanged and deliberately so:

         thickness  width = --frieze-h
         palette    indigo-1 plaque, indigo-3 + indigo-4 waves,
                    indigo-3 lip — the same colorway, same tokens
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

       The mirror is baked into the ASSETS, not applied as a CSS transform —
       `mercury-wave-{a,b}-rot90-mirror.svg`, the rot90 exports wrapped in one
       more `translate(143 0) scale(-1 1)` group. A `transform: scaleX(-1)` on
       the layer would have flipped the drop-shadow carve along with the mask,
       which is exactly what we do not want here (and is why the repo has a
       `-mirror` pair for the horizontal bar too). -->
  <div class="frieze-bar-v-b" :class="'frieze-bar-v-b--lip-' + lip" aria-hidden="true">
    <div class="frieze-bar-v-b__inner">
      <div class="frieze-bar-v-b__layer frieze-bar-v-b__layer--one" />
      <div class="frieze-bar-v-b__layer frieze-bar-v-b__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeBarVerticalB',
  props: {
    // Which edge carries the 1px indigo-3 lip — same contract as variant A.
    lip: {
      type: String,
      default: 'left',
      validator: v => ['left', 'right'].includes(v)
    }
  }
})
</script>

<style scoped lang="scss">
.frieze-bar-v-b {
  width: var(--frieze-h);
  flex: 0 0 var(--frieze-h);
  height: 100%;
  padding: 0 1px;
  pointer-events: none;
  background: var(--grey-4); // same plaque as A (--grey-4 since 2026-08-05)
}

.frieze-bar-v-b--lip-left { border-left: 1px solid var(--indigo-3); }
.frieze-bar-v-b--lip-right { border-right: 1px solid var(--indigo-3); }

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

.frieze-bar-v-b__layer--one {
  background-color: var(--indigo-3);
  mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-rot90-mirror.svg');
}

.frieze-bar-v-b__layer--two {
  background-color: var(--indigo-4);
  mask-image: url('../../assets/frieze/mercury-wave-b-rot90-mirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-rot90-mirror.svg');
}
</style>
