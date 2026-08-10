<!--
  DASHBOARD FLYOUT (2026-08-10) — the second box in the flyout family, and
  for now an EMPTY one.

  WHAT IT IS: the panel the nav bar's `empty_dashboard` button opens, on any
  route. Where the skeleton flyout is opened BY something (a feed card, a
  `?flyout=` address) and is pointed AT something, this one is opened by the
  chrome itself and is pointed at nothing yet — which is the ask: the shell
  first, its contents after. So the well is deliberately empty. Nothing is
  drawn in it, no placeholder prose, no empty-state art: an empty grey floor
  states "there is room here" more honestly than a sentence apologising for
  being unfinished, and whatever lands here later will land in that room.

  ITS AESTHETIC IS NOT A COPY — it is the SAME SHELL. `.flyout-window` in
  `css/_components.scss` carries the plaque, the head (traffic lights pinned
  left, title centred), the frieze band's `--grey-9` base and the sunk,
  bevelled well; it was extracted from SkeletonFlyout the day this component
  was written, precisely so "follow the very same aesthetic" could be a fact
  of the stylesheet rather than a promise two files make to each other. The
  tone argument behind every one of those values is written in
  SkeletonFlyout.vue's style block, which is the family's record.

  GEOMETRY IS NOT HERE either, by the family's oldest rule: MainLayout's
  `.dashboard-flyout` slot places this box and owns whether it is maximized.
  The green light asks; the host performs. That is what lets the same
  component hang in the feed's right-hand slot on one route and over a bare
  page on another without knowing which.
-->
<template>
  <aside class="dashboard-flyout-box flyout-window" role="dialog" aria-label="Dashboard">
    <!-- The head, exactly the skeleton flyout's: red closes, green swaps the
         box between its slot and the whole free width, then the glyph, the
         name and a meta word. No yellow light — a flyout has nowhere to
         park (see SkeletonFlyout for the argument). -->
    <header class="dock-bar">
      <div class="traffic">
        <button
          type="button" class="traffic__dot traffic__dot--red"
          title="Close (Esc)" @click="$emit('close')"
        >
          <q-icon name="close" />
        </button>
        <button
          type="button" class="traffic__dot traffic__dot--green"
          :title="maximized ? 'Restore size' : 'Maximize'"
          @click="$emit('toggle-max')"
        >
          <q-icon :name="maximized ? 'close_fullscreen' : 'open_in_full'" />
        </button>
      </div>
      <!-- The same mark the nav bar's button wears, so the button and the box
           it opens are one object seen twice. Material SYMBOLS (`sym_o_`),
           not Material Icons — `empty_dashboard` exists only in the symbols
           font, and an unmatched ligature renders as the literal word (see
           specs/gotchas.md). -->
      <q-icon name="sym_o_empty_dashboard" size="14px" class="dock-bar__icon" />
      <span class="dock-bar__title nasalization">Dashboard</span>
      <span class="dock-bar__meta mono">empty</span>
    </header>

    <FriezeBar slim class="flyout-window__frieze" />

    <!-- The well, holding nothing. It keeps the family's recess and bevel, so
         the box reads as a finished object with room in it rather than as a
         broken one. -->
    <div class="flyout-window__well" />
  </aside>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

export default defineComponent({
  name: 'DashboardFlyout',
  components: { FriezeBar },
  props: {
    // Is the HOST drawing this box maximized? Read by the green light alone
    // (which glyph, which tooltip) — the size is MainLayout's.
    maximized: { type: Boolean, default: false }
  },
  emits: ['close', 'toggle-max']
})
</script>

<style lang="scss" scoped>
// Deliberately almost empty, and that is the point of the extraction: every
// line this box is drawn with is `.flyout-window`'s (see
// `css/_components.scss`). What belongs here as the panel fills up is what it
// CONTAINS — the way SkeletonFlyout owns its `--node-mini-*` dials and the
// densities that follow from the ceiling it publishes.
//
// The one thing stated here is the class the host binds its slot against, so
// the box has a name of its own to be found by.
.dashboard-flyout-box {
  min-width: 0;
}
</style>
