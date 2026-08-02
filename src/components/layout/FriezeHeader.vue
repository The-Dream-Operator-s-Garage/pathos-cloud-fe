<template>
  <!-- ── Frieze header — the platform's crown strip. A thin band fixed
       edge-to-edge across the very top of EVERY page (both layouts
       mount it). Two white-on-transparent SVG masks (the mercury board
       waves) stack as independently-painted layers that repeat
       side-to-side; a carve filter makes the motif read as needle-cut
       into the plaque. Flat brown-1 (#EFEBE9) base — no sheen, no
       glass overlay — with a thin darker lip on the bottom edge only
       (matching the left drawer's border-right) so the strip reads as
       a slightly thick plaque. Values: layer1 brown-3 #BCAAA4 · layer2
       brown-4 #A1887F · frieze
       size 99% · pad 1px · carve 1.05px #ffffff/#0b0c10. Height rides
       --frieze-h (2.1vh — 3vh until 2026-08-02, when the whole frieze
       family went 30% thinner) so it scales with the device instead of a
       fixed pixel count; the page containers pad down by the same token.
       Decorative only — pointer-events none, so it never steals a
       click. -->
  <div class="frieze-header" aria-hidden="true">
    <div class="frieze-header__inner">
      <div class="frieze-header__layer frieze-header__layer--one" />
      <div class="frieze-header__layer frieze-header__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({ name: 'FriezeHeader' })
</script>

<style scoped lang="scss">
// Above everything: footer taskbar is 2600, maker dialog 2590, docked
// windows 2400+ — the frieze outranks them all (visibility priority).
.frieze-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: var(--frieze-h);
  z-index: 3000;
  padding: 1px 0;
  pointer-events: none;
  // flat Quasar brown-1 plaque — no sheen, no lips, no outer shadow
  background: #EFEBE9;
  // thin brown-3 lip on the bottom edge only — matches the left drawer's
  // border-right and the footer's border-top, so the crown strip reads as
  // a slightly thick plaque
  border-bottom: 1px solid #BCAAA4; // Quasar brown-3
}

.frieze-header__inner {
  position: relative;
  height: 100%;
}

// Each layer's backgroundColor shines through its mask's white cells;
// repeat-x tiles the frieze side-to-side, mask-size auto 99% scales the
// motif to the padded strip height. The stacked drop-shadows are the
// carve: dark up-left, light down-right (full + half offset each so the
// coloured edge reads as a groove, not a hairline).
.frieze-header__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-x;
  mask-size: auto 99%;
  mask-position: left center;
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-size: auto 99%;
  -webkit-mask-position: left center;
  // 1.05/0.5 since 2026-08-02, stepped down with --frieze-h's 30% cut from
  // the original 1.5/0.75 — the groove has to stay narrower than the stroke.
  filter:
    drop-shadow(-1.05px -1.05px 0 #0b0c10)
    drop-shadow(-0.5px -0.5px 0 #0b0c10)
    drop-shadow(1.05px 1.05px 0 #ffffff)
    drop-shadow(0.5px 0.5px 0 #ffffff);
}

.frieze-header__layer--one {
  background-color: #BCAAA4; // Quasar brown-3
  mask-image: url('../../assets/frieze/mercury-wave-a.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a.svg');
}

.frieze-header__layer--two {
  background-color: #A1887F; // Quasar brown-4
  mask-image: url('../../assets/frieze/mercury-wave-b.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b.svg');
}
</style>
