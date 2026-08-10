<!--
  THE DASHBOARD DOCK (2026-08-10) — the 6th window rising from the nav bar,
  and still an EMPTY one.

  IT WAS A FLYOUT FOR ONE PASS. The first ask was for a panel "following the
  very same aesthetic as the current flyout skeleton viewer", and it was built
  as a second floating box in the feed's right-hand slot; the second ask moved
  it: "make it rise from the bottom, like the other creative expanded versions
  to create stuff that are attached to the footer nav bar". So the two halves
  come from two places, which is exactly what the dock chrome's dials are for:

    · the FOOTPRINT and the BEHAVIOUR are `.dock-window--creation`'s — right
      half of the screen, daylight off the crown strip and the side column,
      bottom edge WELDED to the nav bar's top edge, both top corners rounded,
      maximize to the screen's left edge, full width under 600px, and a
      minitab on the footer strip to park on;
    · the COAT is the FLYOUT FAMILY's — `.dock-window--dashboard` points the
      six `--dock-*` dials at the greys that box is drawn in (`--grey-3`
      plaque, `--grey-4` lines and well, brown-8/brown-4 head ink), the same
      seam chat used to go lime. Inside it, the family's own two pieces:
      a `slim` FriezeBar on a `--grey-9` base and the sunk, bevelled
      `.flyout-window__well`.

  So it reads as the skeleton viewer's sibling while behaving as the maker's.

  THE WELL IS EMPTY, deliberately, and that is the ask: the shell first, its
  contents after. No placeholder prose and no empty-state art — an empty grey
  floor states "there is room here" more honestly than a sentence apologising
  for being unfinished, and whatever lands here later lands in that room.
-->
<template>
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="dashboard-dock dock-window dock-window--creation dock-window--dashboard"
      :class="{ 'is-max': store.isMaximized }"
      :style="{ zIndex: windows.zOf('dashboard'), '--dock-right': windows.dockRight + 'px' }"
    >
      <!-- THREE lights now (the minimize ask): red closes, yellow parks the
           panel as a minitab on the footer strip, green maximizes — the docks'
           own red-yellow-green order, which this window is entitled to
           precisely because it has somewhere to park. (Its flyout pass had two:
           a floating box with no tab of its own cannot honestly offer a
           minimize.) Layout — lights pinned left, title centred — is the
           shared creation-dock header. -->
      <header class="dock-bar">
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close" @click="store.close()">
            <q-icon name="close" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize to the nav bar" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
        </div>
        <!-- The same mark the nav bar's button wears, so the button and the
             window it opens are one object seen twice. Material SYMBOLS
             (`sym_o_`), not Material Icons — `empty_dashboard` exists only in
             the symbols font, and an unmatched ligature renders as the literal
             word (see specs/gotchas.md). -->
        <q-icon name="sym_o_empty_dashboard" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Dashboard</span>
        <span class="dock-bar__meta mono">empty</span>
      </header>

      <!-- The flyout family's band, on its `--grey-9` base: dark where the
           bar's default plate is light, so the motif inverts and the brown
           waves read as the light ON a dark strip. It is what ties this
           window's head to its well the way it does in the skeleton viewer —
           the one carved, one dark thing in a flat grey box. -->
      <FriezeBar slim class="flyout-window__frieze" />

      <!-- The well, holding nothing. It keeps the family's recess and bevel,
           so the window reads as a finished object with room in it rather than
           as a broken one. -->
      <div class="flyout-window__well dashboard-dock__well" />
    </section>
  </transition>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import { useDashboardStore } from 'src/stores/dashboard'
import { useWindowsStore } from 'src/stores/windows'

export default defineComponent({
  name: 'DashboardDock',
  components: { FriezeBar },
  setup () {
    return {
      store: useDashboardStore(),
      windows: useWindowsStore()
    }
  }
})
</script>

<style lang="scss" scoped>
// Deliberately almost empty, and that is the point of both borrowings: the
// shell, the weld and the maximize are `.dock-window--creation`'s, the coat is
// `.dock-window--dashboard`'s six dials, and the band and well are the flyout
// family's two named pieces — all in css/_components.scss. What belongs HERE
// is what the window comes to CONTAIN, the way MakerDock owns its editor and
// SkeletonFlyout owns the densities its quoted node is read at.
//
// The one rule: the well is the dock's body, so it takes the whole box under
// the band. `min-height: 0` is what lets it actually shrink inside the flex
// column rather than pushing the window taller than its footprint.
.dashboard-dock__well {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
