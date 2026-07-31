<template>
  <q-layout view="lHh Lpr lff">
    <!-- Mercury frieze crown strip — fixed edge-to-edge over everything but
         the left drawer (z 3000 < the drawer's 3050, which overlaps it from
         the corner); the page container pads down by --frieze-h below. -->
    <FriezeHeader />

    <!-- mini-width 42 = --dock-rail-w: the collapsed drawer mirrors the
         stack/pins parked column on the opposite edge, one rail each side. -->
    <q-drawer v-if="!hideDrawer" v-model="drawer" show-if-above :mini="mini" :width="220" :mini-width="42"
      bordered class="pathos-drawer" @mouseover="mini = false" @mouseout="mini = true">

      <!-- The drawer starts at the very TOP-LEFT corner, OVER the fixed crown
           strip (z 3050 > the frieze's 3000), so this band REPLACES the strip
           across the drawer's column instead of stacking under it: it is
           pinned (outside the scroll area, never scrolls away) and wears the
           crown strip's exact geometry — same --frieze-h box, same brown-3
           bottom lip — so the two read as one continuous band. -->
      <FriezeBar class="drawer-frieze drawer-frieze--top" />

      <q-scroll-area class="drawer-scroll" :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding class="nasalization" style="font-size:0.82em;">

          <!-- Mirrored frieze bands — the drawer's section dividers (after
               Back, before EXPLORE, before IDENTITY); full-bleed edge to edge
               (the q-list only pads vertically) so each spans the drawer in
               both mini and expanded states. -->

          <!-- Distinctive Back button — pinned at the very top of the drawer
               so every viewer can reclaim its top bar. Disabled on the very
               first entry of the history stack. -->
          <q-item
            clickable
            v-ripple
            class="drawer-back-item"
            :disable="!canGoBack"
            @click="goBack"
          >
            <q-item-section avatar>
              <q-icon name="arrow_back" class="drawer-back-icon" />
            </q-item-section>
            <q-item-section class="drawer-back-label">Back</q-item-section>
          </q-item>

          <FriezeBar class="drawer-frieze" />

          <q-item clickable v-ripple :to="'/feed'" active-class="my-menu-link" exact>
            <q-item-section avatar><q-icon name="dynamic_feed" /></q-item-section>
            <q-item-section>Feed</q-item-section>
          </q-item>

          <FriezeBar class="drawer-frieze" />
          <q-item-label header class="drawer-section-header">EXPLORE</q-item-label>

          <q-item clickable v-ripple :to="'/paths'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="route" /></q-item-section>
            <q-item-section>Paths</q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/nodes'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="adjust" /></q-item-section>
            <q-item-section>Nodes</q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/labels'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="label_important" /></q-item-section>
            <q-item-section>Labels</q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/skeletons'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="schema" /></q-item-section>
            <q-item-section>Skeletons</q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/files'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="folder_open" /></q-item-section>
            <q-item-section>Files</q-item-section>
          </q-item>

          <FriezeBar class="drawer-frieze" />
          <q-item-label header class="drawer-section-header">IDENTITY</q-item-label>

          <q-item clickable v-ripple @click="goToProfile" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="face_5" /></q-item-section>
            <q-item-section>Profile</q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/organizations'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="reduce_capacity" /></q-item-section>
            <q-item-section>Organizations</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Page content gives up the width of the parked stack/pins column on the
         right so they never cover it; EXPANDED windows overlap the page as
         they always did. -->
    <q-page-container :style="{ paddingRight: windows.railWidth ? windows.railWidth + 'px' : null, paddingTop: 'var(--frieze-h)' }">
      <router-view />
    </q-page-container>

    <!-- Frieze footer — the crown strip mirrored vertically and parked on the
         nav bar's top edge, so the window is closed by a band answering the
         one that opens it (2026-07-25). MainLayout only: AuthLayout has a
         strip but no nav bar for this to stand on. It sits at the crown
         strip's OWN z 3000 — under the drawer (3050) and the pinned column
         (3100), whose bottom edges land on the same line and so cover the
         band's two ends, and under the feed container (3001), which hovers
         over it just as it runs up over the strip. -->
    <FriezeFooter />

    <NavigationBar
      :pins-refresh-key="pinsRefreshKey"
      @toggle-drawer="drawer = !drawer"
      @open-maker="makerStore.open()"
      @open-uploader="uploaderStore.open()"
      @open-skeleton-builder="skeletonBuilderStore.open()"
      @open-label-maker="labelMakerStore.open()"
      @pins-changed="pinsRefreshKey++"
    />

    <!-- The seven docked windows (maker, uploader, skeleton builder, label
         maker, chat, stack, pins) — always
         mounted; their stores decide whether each renders open, minimized
         (maker/uploader/chat → minitab on the nav bar, stack/pins → icon
         rail on the right edge) or not at all, and stores/windows.js
         z-orders them so a newly opened window covers the previous one and
         closing/minimizing it brings that one back. In-progress maker/
         uploader/chat work survives close/reload via localStorage (staged
         file bytes are session-only); the stack/pins window flags persist
         there too. -->
    <PinsDrawer :refresh-key="pinsRefreshKey" @changed="pinsRefreshKey++" />
    <StackPanel />
    <MakerDock @created="onPostCreated" />
    <UploaderDock @created="onUploaded" />
    <SkeletonBuilderDock />
    <LabelMakerDock />
    <ChatDock />
  </q-layout>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'
import { useAuthStore } from 'src/stores/auth'
import { useWindowsStore } from 'src/stores/windows'
import MakerDock from 'src/components/maker/MakerDock.vue'
import UploaderDock from 'src/components/maker/UploaderDock.vue'
import SkeletonBuilderDock from 'src/components/maker/SkeletonBuilderDock.vue'
import LabelMakerDock from 'src/components/maker/LabelMakerDock.vue'
import ChatDock from 'src/components/chat/ChatDock.vue'
import FriezeHeader from 'src/components/layout/FriezeHeader.vue'
import FriezeFooter from 'src/components/layout/FriezeFooter.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import NavigationBar from 'src/components/layout/NavigationBar.vue'
import PinsDrawer from 'src/components/layout/PinsDrawer.vue'
import StackPanel from 'src/components/layout/StackPanel.vue'
import { useMakerStore } from 'src/stores/maker'
import { useUploaderStore } from 'src/stores/uploader'
import { useSkeletonBuilderStore } from 'src/stores/skeletonBuilder'
import { useLabelMakerStore } from 'src/stores/labelMaker'
import { useGeoStore } from 'src/stores/geo'
import { useEventsStore } from 'src/stores/events'

export default defineComponent({
  name: 'MainLayout',
  components: { MakerDock, UploaderDock, SkeletonBuilderDock, LabelMakerDock, ChatDock, FriezeHeader, FriezeFooter, FriezeBar, NavigationBar, PinsDrawer, StackPanel },
  setup () {
    const router = useRouter()
    const navStore = useNavStore()
    const authStore = useAuthStore()
    const makerStore = useMakerStore()
    const uploaderStore = useUploaderStore()
    const skeletonBuilderStore = useSkeletonBuilderStore()
    const labelMakerStore = useLabelMakerStore()
    const windows = useWindowsStore()
    const drawer = ref(true)
    const mini = ref(true)
    const hideDrawer = computed(() => !!router.currentRoute.value.meta?.hideDrawer)
    // Bumped by the drawer when it unpins something — NavigationBar watches
    // this to refresh the tack indicator state.
    const pinsRefreshKey = ref(0)

    // When the user finishes "+ Make post", drop them straight into the
    // post they just made — the dock minimizes itself (or closes when no
    // drafts remain), so the new post lands in full view. Exception: when a
    // SkeletonPage is populating an instance, the fresh post joins its
    // "just created" tray instead of navigating (the page stays put so the
    // user can drag it into a slot).
    const onPostCreated = (created) => {
      if (created?.path && skeletonBuilderStore.deliverFresh('posts', created.path, created.title)) return
      if (created?.id) router.push('/posts/' + created.id)
    }

    // Uploader emits an ARRAY of created nodes. Single upload → jump to
    // the node (the dock minimizes itself); batches stay put — the dock's
    // file explorer already shows them at the top. During an instance
    // populate session every fresh node joins the page's tray instead.
    const onUploaded = (nodes) => {
      if (skeletonBuilderStore.populate && nodes?.length) {
        let consumed = false
        for (const n of nodes) {
          if (n?.path && skeletonBuilderStore.deliverFresh('nodes', n.path, n.name)) consumed = true
        }
        if (consumed) return
      }
      if (nodes?.length === 1 && nodes[0]?.id) router.push('/nodes/' + nodes[0].id)
    }

    // "Profile" drawer item resolves to the logged-in user's entity view.
    const goToProfile = () => {
      const id = authStore.user?.id
      if (id) router.push('/entities/' + id)
    }

    // Back button at the top of the drawer. window.history.state.position
    // is 0 for the first entry — fall back to router.back() and let the
    // browser no-op when there's nowhere to go.
    const canGoBack = computed(() => (window.history.state?.position ?? 0) > 0)
    const goBack = () => { router.back() }

    onMounted(async () => {
      await navStore.restore()
      navStore.push(router.currentRoute.value)
      // Entering the platform: offer to anchor new moments to the user's
      // approximate city (one-time consent; see stores/geo.js).
      useGeoStore().maybeAsk()
      // The push spine (Thread A): open the app's ONE SSE connection —
      // no-op when logged out; the store owns reconnection.
      useEventsStore().connect()
    })

    return { drawer, mini, hideDrawer, makerStore, uploaderStore, skeletonBuilderStore, labelMakerStore, windows, pinsRefreshKey, onPostCreated, onUploaded, goToProfile, canGoBack, goBack }
  }
})
</script>

<style lang="scss">
// UNSCOPED on purpose: `class="pathos-drawer"` lands on Quasar's
// .q-drawer__content node, which does NOT carry this component's scope
// attribute — scoped selectors never match it (the old glass skin
// silently didn't either; the drawer was painted by Quasar's --q-dark).

// Kill Quasar's dark paint on the aside; the skin lives on the content.
// The drawer also OVERLAPS the crown strip (2026-07-24): it runs from the
// screen's very top-left corner and outranks the fixed FriezeHeader (3000),
// wearing its own frieze band up there instead of hiding under the strip.
// It stops at the nav footer's top edge in exchange — sitting above 2600 it
// would otherwise paint over the bar's left cluster (menu/profile/logout).
aside.q-drawer {
  background: transparent !important;
  z-index: 3050;
  bottom: var(--nav-footer-h);
}

// Smooth the page's right padding as the parked side column comes and goes.
.q-page-container {
  transition: padding-right 0.18s ease;
}

// Mercury-plaque drawer — deliberately OPAQUE and FLAT: Quasar's brown-1,
// matching the footer and the stack/pins docks. One clean color, no sheen
// gradients; the complementary SMOKE coat keeps items and texts crisp on
// the pastel.
.pathos-drawer {
  // Column: the pinned top frieze band, then the scrolling list under it.
  // (No padding-top anymore — the drawer sits ON TOP of the crown strip and
  // supplies its own band at y=0, so nothing hides under the plaque.)
  display: flex;
  flex-direction: column;
  background: var(--brown-1) !important;
  border-right: 1px solid #BCAAA4 !important; // Quasar brown-3
  box-shadow: 6px 0 22px rgba(0, 0, 0, 0.30);

  // The list takes whatever is left below the pinned band (min-height:0 lets
  // it actually shrink so the q-scroll-area scrolls instead of overflowing).
  .drawer-scroll {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
  }

  // Denser than Quasar's defaults (2026-07-31): the collapsed drawer is
  // --dock-rail-w (42px) to mirror the stack/pins column — with 2×5px item
  // margins that leaves a 32px chip, so rows tighten to 40px min-height and
  // the section rhythm shrinks a notch to match.
  .q-item {
    color: var(--brown-8);
    border-radius: var(--radius-sm);
    margin: 2px 5px;
    min-height: 40px;
    transition: background 0.12s, color 0.12s;
  }

  // The mirrored frieze bands dividing the drawer sections — each takes
  // the spaced-separator vertical rhythm, but NO horizontal margin: they
  // must run the full drawer width edge to edge.
  .drawer-frieze {
    margin: 6px 0;
  }
  // The topmost band REPLACES the crown strip over the drawer's column, so it
  // must match FriezeHeader's box EXACTLY or the band would step at the
  // drawer's right edge: same --frieze-h total height (border-box) and the
  // same 1px brown-3 bottom lip, which also eats the same 1px off the carve
  // area so both motifs are drawn at the identical size. It is pinned outside
  // the scroll area (no q-list padding to cancel — the old -8px hack is gone).
  .drawer-frieze--top {
    flex: 0 0 auto;
    margin: 0;
    height: var(--frieze-h);
    border-bottom: 1px solid #BCAAA4; // Quasar brown-3 — the crown strip's lip
  }
  .q-item:hover {
    background: var(--smoke);
    color: var(--brown-8);
  }
  .q-icon {
    color: var(--brown-8);
    opacity: 0.9;
  }

  // Active route — smoke-carved chip, inverted (cake-lemon text on dark
  // ink fog) so the current destination pops out of the pastel plaque.
  .my-menu-link {
    background: linear-gradient(to bottom, rgba(31, 42, 56, 0.78) 0%, var(--smoke-strong) 100%) !important;
    color: var(--cake-lemon) !important;
    text-shadow: none;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 2px 8px rgba(31, 42, 56, 0.35);
    .q-icon { color: var(--cake-lemon); opacity: 1; }
  }

  .q-separator {
    background: rgba(31, 42, 56, 0.25);
  }

  .drawer-section-header {
    color: var(--brown-8) !important;
    font-size: 0.62em;
    letter-spacing: 0.12em;
    padding: 6px 14px 3px;
    min-height: 0;
    font-family: var(--font-display);
  }

  // ── Back button — distinctive, pinned-top affordance ─────
  // Inverted brown chip (solid brown-8 fill, brown-1 ink) so it visually
  // pops out of the brown-8-on-brown-1 navigation list and reads as an
  // action (not a destination), with a small inward arrow shift on hover so
  // the gesture echoes the direction.
  .drawer-back-item {
    background: var(--brown-8);
    border: 1px solid var(--brown-8);
    color: var(--brown-1);
    margin: 4px 5px 5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

    .drawer-back-icon {
      color: var(--brown-1) !important;
      opacity: 1;
      transition: transform 0.12s;
    }
    .drawer-back-label { color: var(--brown-1); }

    &:hover {
      background: #5D4037; // Quasar brown-7 — lifts on hover
      border-color: #5D4037;
      .drawer-back-icon { transform: translateX(-2px); }
    }

    &.q-item--disabled {
      background: var(--smoke);
      border-color: rgba(78, 52, 46, 0.20);
      color: rgba(78, 52, 46, 0.40);
      .drawer-back-icon { color: rgba(78, 52, 46, 0.40) !important; }
      .drawer-back-label { color: rgba(78, 52, 46, 0.40); }
    }
  }
}
</style>
