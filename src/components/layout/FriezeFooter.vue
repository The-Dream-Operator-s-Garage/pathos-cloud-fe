<template>
  <!-- ── Frieze footer — the crown strip's bookend at the bottom of the
       window (2026-07-25). FriezeHeader with the wave pattern MIRRORED
       VERTICALLY, parked directly ON TOP OF the navigation bar, so the page
       is closed by a band that answers the one that opens it.

       Everything is FriezeHeader's, unchanged:

         box      fixed, full width, height --frieze-h, padding `1px 0`
         palette  brown-1 plaque, brown-3 (layer one) + brown-4 (layer two)
                  waves — the raw hexes, exactly as the header writes them
         tiling   repeat-x at `auto 99%`, `left center`
         carve    IDENTICAL to the header — dark up-left, light down-right.
                  The motif mirrors; the LIGHT does not. One light source per
                  scene: flip the carve with the pattern and the bottom band
                  reads as lit from a second sun. Same call FriezeBar and
                  FriezeBarVerticalB make.

       Two things DO turn over, because they are the mirror:

         masks    mercury-wave-{a,b}-vmirror.svg — the originals wrapped in
                  `translate(0 143) scale(1 -1)`. Baked into the assets, not
                  a CSS `scaleY(-1)`: the transform would take the layer's
                  RENDERED result and mirror the drop-shadow carve with it.
         lip      the header's 1px brown-3 `border-bottom` becomes a
                  `border-top` here — the plaque thickens toward the page,
                  and the nav bar keeps its own brown-4 top edge underneath,
                  so the two hairlines stack as the band's floor and lid.

       Placement: `bottom: var(--nav-footer-h)` — it rides the bar's top edge
       rather than the window's, so bar + band read as one piece of footer
       chrome. MainLayout only: AuthLayout has a crown strip but no nav bar,
       so there is nothing there for this to sit on.

       Z-ORDER — 3000, the crown strip's OWN number, so the band inherits the
       whole stack the strip already sits in rather than inventing one:
         3100  the pinned side column (stack/pins) — covers the band's RIGHT
               end, since it too runs down to `bottom: var(--nav-footer-h)`
         3050  the left drawer — same, at the LEFT end
         3001  the feed container — HOVERS OVER the band, exactly as it runs
               up over the crown strip; the container's bottom edge lands on
               this band's box, so on /feed it overlays both ends of the page
       and above the nav bar (2600) and the docked windows (2400+).

       That last one stopped biting the docks on 2026-07-27: the docked
       windows moved above the feed container (z 3010+, stores/windows.js),
       so the CREATION docks anchor straight to the bar's top edge and paint
       their bottom --frieze-h OVER this band, and the parked minitabs stand
       ON it too (a lifted z-3045 sibling of the footer — see
       NavigationBar.vue). Only chat still stands on the band's top via
       `--dock-bottom` (_tokens.scss), keeping the old shell. The pinned
       column and the drawer never needed any of it — they are what covers
       the ends.

       Decorative only — pointer-events none, so it never eats a click. -->
  <div class="frieze-footer" aria-hidden="true">
    <div class="frieze-footer__inner">
      <div class="frieze-footer__layer frieze-footer__layer--one" />
      <div class="frieze-footer__layer frieze-footer__layer--two" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({ name: 'FriezeFooter' })
</script>

<style scoped lang="scss">
.frieze-footer {
  position: fixed;
  bottom: var(--nav-footer-h); // sits ON the nav bar, not on the window's edge
  left: 0;
  width: 100vw;
  height: var(--frieze-h);
  z-index: 3000; // the crown strip's own number — see the header comment
  padding: 1px 0;
  pointer-events: none;
  background: #EFEBE9; // flat Quasar brown-1 plaque — the header's own base
  // The header's bottom lip, turned over with the waves.
  border-top: 1px solid #BCAAA4; // Quasar brown-3
  // A VERY subtle shadow off that top border, so the footer assembly reads as
  // a raised plaque the page slides under. Tight and pale — 6px of reach at
  // 0.10 — because the page canvas behind it is near-black and anything
  // heavier stops reading as a shadow and starts reading as a second band.
  // The nav bar's top edge underneath carries a matching cast of its own,
  // which lands ON this band: it cannot be written on `.nav-bar` (that footer
  // is a z-2600 stacking context, and this strip is opaque at 3000), so it
  // lives in `.nav-top-shadow`, a lifted sibling box at z 3040 — see
  // NavigationBar.vue.
  box-shadow: 0 -2px 6px rgba(var(--ink-rgb-deep), 0.10);
}

.frieze-footer__inner {
  position: relative;
  height: 100%;
}

// FriezeHeader's layer recipe verbatim — only the mask files differ.
.frieze-footer__layer {
  position: absolute;
  inset: 0;
  mask-repeat: repeat-x;
  mask-size: auto 99%;
  mask-position: left center;
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-size: auto 99%;
  -webkit-mask-position: left center;
  filter:
    drop-shadow(-1.5px -1.5px 0 #0b0c10)
    drop-shadow(-0.75px -0.75px 0 #0b0c10)
    drop-shadow(1.5px 1.5px 0 #ffffff)
    drop-shadow(0.75px 0.75px 0 #ffffff);
}

.frieze-footer__layer--one {
  background-color: #BCAAA4; // Quasar brown-3
  mask-image: url('../../assets/frieze/mercury-wave-a-vmirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-a-vmirror.svg');
}

.frieze-footer__layer--two {
  background-color: #A1887F; // Quasar brown-4
  mask-image: url('../../assets/frieze/mercury-wave-b-vmirror.svg');
  -webkit-mask-image: url('../../assets/frieze/mercury-wave-b-vmirror.svg');
}
</style>
