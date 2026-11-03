<template>
  <!-- ── THE CHECKER FRIEZE (2026-11-02, user ask: "a new frieze bar pattern
       that is a checkered square pattern … a 3-square height one and a
       2-square height one") — a frieze band whose motif is a board of
       square cells instead of the mercury waves, in TWO tones only:

         ink   the element's KIND — its deep rung (kinds.js `ink` in the side
               viewer, a dock's `--dock-frieze`), the tone the wave friezes
               this replaces spent on their plate (`--frieze-check-ink`)
         lip   the cream of the frieze bars' LIPS (`--plaque-flat`, the
               `--plaque-coat` lips as one flat colour), worn by the other
               half of the squares (`--frieze-check-lip`)

       `rows` is the board's height in squares: 3 for the side viewer's
       divider (which keeps its own 2px coat lips round it), 2 for the
       windows the footer's elements open, which get a THIN OUTER LIP —
       1px of the lip cream above and below, the 2-row variant's default
       `--frieze-check-lip-w`.

       Pixel-crisp by construction: the cell is a whole-px dial
       (`--frieze-check-cell`, 4px), the height is `rows × cell` (never the
       waves' vh share), and the ink squares are a 2×2 `crispEdges` SVG
       MASK over a flat fill — FriezeBar's own mask-over-colour device, so
       the tone stays a live CSS dial (a data-URI fill cannot read a var).
       The cream squares are no paint at all: the root's lip-toned floor
       showing through the mask's open half. Decorative only. -->
  <div class="frieze-check" :class="'frieze-check--rows-' + rows" aria-hidden="true" />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FriezeChecker',
  props: {
    // The board's height in squares — the two variants the ask named.
    rows: {
      type: Number,
      default: 3,
      validator: v => [2, 3].includes(v)
    }
  }
})
</script>

<style scoped lang="scss">
// `--fc-*` are private: the variant picks a default, a host's public
// `--frieze-check-*` dial (on the element or any ancestor) still wins.
.frieze-check {
  --fc-rows: 3;
  --fc-cell: var(--frieze-check-cell, 4px);
  --fc-lip-w: var(--frieze-check-lip-w, 0px);
  position: relative;
  flex: 0 0 auto;
  box-sizing: content-box;                 // the lips are ADDED to the board, never taken out of a square
  height: calc(var(--fc-rows) * var(--fc-cell));
  padding: var(--fc-lip-w) 0;
  background-color: var(--frieze-check-lip, var(--plaque-flat, #f8f2e4));
  pointer-events: none;
}

// The ink squares: one flat fill cut by the 2×2 tile, phase 0 at the board's
// own top-left (an INK square), inside the lips.
.frieze-check::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: var(--fc-lip-w);
  bottom: var(--fc-lip-w);
  background-color: var(--frieze-check-ink, var(--grey-9, #424242));
  mask-image: url('../../assets/frieze/checker-2x2.svg');
  mask-size: calc(2 * var(--fc-cell)) calc(2 * var(--fc-cell));
  mask-repeat: repeat;
  mask-position: 0 0;
  -webkit-mask-image: url('../../assets/frieze/checker-2x2.svg');
  -webkit-mask-size: calc(2 * var(--fc-cell)) calc(2 * var(--fc-cell));
  -webkit-mask-repeat: repeat;
  -webkit-mask-position: 0 0;
}

// Two squares tall, and the thin outer lip comes with it.
.frieze-check--rows-2 {
  --fc-rows: 2;
  --fc-lip-w: var(--frieze-check-lip-w, 1px);
}
</style>
