<!--
  THE DASHBOARD DOCK (2026-08-10) — the 6th window rising from the nav bar.
  Phase 4 of the dashboards plan filled the well: the empty shell became the
  DASHBOARD SURFACE — tabs across the top, a 2×N grid of cells inside.

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

  TABS (phase 4): one `.dock-tab` per open dashboard (the maker's strip,
  persisted in stores/dashboard.js under pathos_dashboard_tabs) plus the
  GHOST tab (`.dock-tab--new`, `sym_o_dashboard_customize` — Material
  SYMBOLS: an unmatched ligature renders as the literal word) which MINTS an
  empty dashboard (POST /api/dashboards) and opens it in edit mode. The boot
  read is `GET /api/dashboards?ensure=1` — the default USER_HOME exists by
  the time the list answers, and a tabless window opens it.

  EDIT MODE: the pencil at the strip's right end (or arriving from the ghost
  tab) flips `isEditing` → the window EXPANDS via `.is-edit`
  (css/_components.scss): the full span between the crown strip, the nav bar
  and the side column — a board being arranged wants the whole desk. z is
  UNCHANGED (dock band 3010+, under minitabs/rails/bar — never raise a
  surface over the bar).
-->
<template>
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="dashboard-dock dock-window dock-window--creation dock-window--dashboard"
      :class="{ 'is-max': store.isMaximized, 'is-edit': store.isEditing }"
      :style="{ zIndex: windows.zOf('dashboard'), '--dock-right': windows.dockRight + 'px' }"
    >
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
             (`sym_o_`) — see specs/gotchas.md on unmatched ligatures. -->
        <q-icon name="sym_o_empty_dashboard" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Dashboard</span>
        <span class="dock-bar__meta mono">{{ meta }}</span>
      </header>

      <!-- The flyout family's band, on its `--grey-9` base: dark where the
           bar's default plate is light, so the motif inverts and the brown
           waves read as the light ON a dark strip. -->
      <FriezeBar slim class="flyout-window__frieze" />

      <!-- The tab strip: one tab per open board, the ghost mints a new one,
           the pencil flips edit mode for the open board. -->
      <nav class="dock-tabs dashboard-dock__tabs">
        <!-- In edit mode every tab is ALSO a drag source (phase 5): drop
             one onto a canvas slot and that board fills the pane. The
             payload is the house MIME, the board's own address. -->
        <button
          v-for="t in store.tabs"
          :key="t.id"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': t.id === store.activeId }"
          :draggable="store.isEditing && !!t.path"
          @dragstart="onTabDragStart(t, $event)"
          @click="store.select(t.id)"
        >
          <q-icon name="sym_o_empty_dashboard" size="12px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ t.name || '(untitled)' }}</span>
          <span class="dock-tab__x" title="Close tab" @click.stop="store.closeTab(t.id)">
            <q-icon name="close" size="10px" />
          </span>
        </button>
        <button
          type="button"
          class="dock-tab dock-tab--new"
          title="New dashboard"
          :disabled="creating"
          @click="createBoard"
        >
          <q-icon name="sym_o_dashboard_customize" size="14px" />
        </button>
        <q-space />
        <button
          v-if="store.activeTab && store.activeTab.path"
          type="button"
          class="dashboard-dock__edit"
          title="Share this board to a conversation"
          @click="shareOpen = true"
        >
          <q-icon name="ios_share" size="13px" />
        </button>
        <button
          v-if="store.activeTab"
          type="button"
          class="dashboard-dock__edit"
          :class="{ 'is-on': store.isEditing }"
          :title="store.isEditing ? 'Done arranging' : 'Arrange this board'"
          @click="store.setEditing(!store.isEditing)"
        >
          <q-icon :name="store.isEditing ? 'done' : 'edit'" size="13px" />
        </button>
      </nav>

      <div class="flyout-window__well dashboard-dock__well">
        <DashboardGrid
          v-if="store.activeTab"
          :dashboard-id="store.activeTab.skeletonId"
          :editing="store.isEditing"
          @resolved="onResolved"
          @exported="onExported"
        />
      </div>

      <!-- Share = grant + send, through the chat's own machinery (the
           picker owns the whole flow — see ConversationPicker). -->
      <ConversationPicker v-model="shareOpen" :share-ref="store.activeTab?.path || ''" />
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import DashboardGrid from 'src/components/dashboard/DashboardGrid.vue'
import ConversationPicker from 'src/components/chat/ConversationPicker.vue'
import { useDashboardStore } from 'src/stores/dashboard'
import { useWindowsStore } from 'src/stores/windows'
import { dashboardService } from 'src/services/dashboard.service'

export default defineComponent({
  name: 'DashboardDock',
  components: { FriezeBar, DashboardGrid, ConversationPicker },
  setup () {
    const store = useDashboardStore()
    const windows = useWindowsStore()
    const creating = ref(false)
    const shareOpen = ref(false)

    // Boot: the ensure=1 list mints the default USER_HOME server-side; a
    // window with no tabs opens the first board. Fired every time the
    // window OPENS with nothing to show, not just on mount — the tabs are
    // persisted, so this normally runs once per fresh browser.
    const boot = async () => {
      if (store.tabs.length) return
      try {
        const r = await dashboardService.listMine({ ensure: true })
        if (!r.success || !r.dashboards?.length) return
        // The HOME board fronts a fresh window; newest-first otherwise.
        const first = r.dashboards.find(d => d.template?.name === 'USER_HOME') || r.dashboards[0]
        store.openTab({ skeletonId: first.id, name: first.name, path: first.path })
      } catch (_) { /* the empty well states it honestly */ }
    }
    watch(() => store.isOpen && !store.isMinimized, (v) => { if (v) boot() }, { immediate: true })

    // The ghost tab: mint an EMPTY dashboard and arrive in edit mode —
    // a fresh board exists to be arranged.
    const createBoard = async () => {
      creating.value = true
      try {
        const r = await dashboardService.create({})
        if (r.success) {
          store.openTab({ skeletonId: r.dashboard.id, name: r.dashboard.name, path: r.dashboard.path })
          store.setEditing(true)
        }
      } catch (_) { /* leave the strip as it was */ }
      creating.value = false
    }

    // The grid resolved the board — name the tab after it (covers renames
    // landing server-side and the boot tab's stale copy) and teach it its
    // address (the drag payload).
    const onResolved = (d) => {
      if (store.activeTab && d?.id === store.activeTab.skeletonId) {
        store.nameTab(store.activeTab.id, d.name, d.path || null)
      }
    }

    // A canvas exported itself as a fresh board — open it (phase 5: the
    // arrangement is itself a dashboard now).
    const onExported = (d) => {
      store.openTab({ skeletonId: d.id, name: d.name, path: d.path })
    }

    // The dock's tabs are canvas drag sources in edit mode.
    const onTabDragStart = (t, e) => {
      if (!store.isEditing || !t.path) return
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({
        kind: 'skeletons', address: t.path, primary: t.name || ''
      }))
    }

    const meta = computed(() => {
      if (!store.activeTab) return 'empty'
      return '#' + store.activeTab.skeletonId
    })

    return { store, windows, creating, shareOpen, createBoard, onResolved, onExported, onTabDragStart, meta }
  }
})
</script>

<style lang="scss" scoped>
// The shell, the weld and the maximize are `.dock-window--creation`'s, the
// coat is `.dock-window--dashboard`'s six dials, and the band and well are
// the flyout family's two named pieces — all in css/_components.scss (the
// `.is-edit` expansion lives there too, beside the geometry it overrides).
// What belongs HERE is what the window CONTAINS: the strip's grey skin and
// the well's interior contract.

// The well is the dock's body: it takes the whole box under the strip and
// scrolls as ONE surface (the grid inside publishes per-cell ceilings, so
// cells stay tiles and the board is the thing that scrolls).
.dashboard-dock__well {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;

  // The family well is a flex ROW (`.flyout-window__well`), so its one
  // child must GROW or it sizes to content — the same contract
  // `.skeleton-flyout__generic` states in the sibling box. Without it the
  // split canvas measured 393px inside a 1382px well.
  :deep(.dash-grid-host) {
    flex: 1 1 auto;
    min-width: 0;
  }
}

// The strip sits on the plaque between the frieze band and the well — the
// mobile dock-tab skin (well-toned tabs in rule-colored rims) is right for
// this window on every screen, its dials being the grey family already.
.dashboard-dock__tabs {
  border-bottom: 1px solid var(--dock-rule);
  align-items: center;

  .dock-tab {
    background: var(--dock-well, var(--grey-4));
    border-color: var(--dock-rule);
    color: var(--dock-ink, var(--brown-8));

    &:hover { background: var(--dock-coat); }
    &.is-active {
      background: var(--paper-card);
      border-color: var(--dock-rule-strong, var(--grey-5));
    }
  }
}

.dashboard-dock__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-bottom: 3px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: 6px;
  background: none;
  color: var(--dock-ink-mute, var(--brown-4));
  cursor: pointer;
  flex-shrink: 0;

  &:hover { color: var(--dock-ink, var(--brown-8)); border-color: var(--dock-ink-mute, var(--brown-4)); }
  &.is-on {
    background: var(--paper-card);
    color: #00829c;
    border-color: #00829c;
  }
}
</style>
