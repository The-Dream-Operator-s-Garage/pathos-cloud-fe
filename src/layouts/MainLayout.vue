<template>
  <q-layout view="lHh Lpr lff">
    <!-- Mercury frieze crown strip — fixed edge-to-edge over everything but
         the left drawer (z 3000 < the drawer's 3120, which overlaps it from
         the corner); the page container pads down by --frieze-h below. -->
    <FriezeHeader />

    <!-- Floating media viewers + their minimize sliver over the crown
         strip (docs/plans/floating-media-viewer.md) — every child is
         fixed-position, so the mount point only has to exist once. -->
    <MediaViewerHost @pins-changed="pinsRefreshKey++" />

    <!-- mini-width = --dock-rail-w, READ FROM THE TOKEN rather than restated
         (2026-08-02): the collapsed drawer mirrors the stack/pins parked
         column on the opposite edge, AND its own footer block (plus the nav
         bar's, whenever the drawer is gone) continues this exact column down
         through the bar's row — several surfaces on one number, so the number
         is fetched once instead of typed each time. -->
    <q-drawer v-if="!hideDrawer" v-model="drawer" show-if-above :mini="mini" :width="220" :mini-width="drawerRailW"
      bordered class="pathos-drawer" @mouseover="mini = false" @mouseout="mini = true">

      <!-- The drawer starts at the very TOP-LEFT corner, OVER the fixed crown
           strip (z 3120 > the frieze's 3000), so this band REPLACES the strip
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

          <!-- PROFILE — a dense identity block, not a menu word (2026-08-02).
               The nav bar's person/mask button and its logout button are gone;
               this row is where the acting identity lives now, so it states
               WHO you are with the same facts the feed card's author section
               states: the face, the display name, the @handle underneath it.
               Adapted to the drawer's brown plaque rather than the feed's
               indigo card.

               COLLAPSED (the 42px mini rail) Quasar keeps only the avatar
               section, which is exactly the right reduction — the face IS the
               identity at rail scale. Which is also why the mask chip floats
               on the AVATAR and not beside the name: acting as an alter-ego
               has to be visible in both drawer states. -->
          <q-item clickable v-ripple class="drawer-profile-item" @click="goToProfile">
            <q-item-section avatar>
              <span class="drawer-profile-face">
                <EntityAvatar :entity="user" :size="28" />
                <span v-if="isAlterEgo" class="drawer-profile-mask">
                  <q-icon name="theater_comedy" size="10px" />
                  <q-tooltip anchor="center right" self="center left">
                    Wearing a mask — acting as {{ profileName }}
                  </q-tooltip>
                </span>
              </span>
            </q-item-section>
            <q-item-section class="drawer-profile-text">
              <span class="drawer-profile-name">{{ profileName }}</span>
              <span class="drawer-profile-handle mono">{{ profileHandle }}</span>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple :to="'/organizations'" active-class="my-menu-link">
            <q-item-section avatar><q-icon name="reduce_capacity" /></q-item-section>
            <q-item-section>Organizations</q-item-section>
          </q-item>

          <!-- Logout followed the profile button off the nav bar: an action
               belongs with the identity it ends — and it CLOSES the section,
               below the destinations, so it is never something you land on
               while scanning the list. -->
          <q-item clickable v-ripple class="drawer-logout-item" @click="handleLogout">
            <q-item-section avatar><q-icon name="logout" /></q-item-section>
            <q-item-section>Log out</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <!-- THE BURGER LIVES IN THE DRAWER NOW (2026-08-02, user ask). The
           drawer runs to the WINDOW FLOOR and lies over the nav bar, so its
           last --nav-bar-h is the bar's own row: this block IS that row,
           rebuilt from the bar's parts — brown-1 plaque, brown-3 top lip on
           the same pixel as the bar's `border-top`, and the 41px brown-4
           rail block + hairline at its left end holding the 28px inverted
           chip. The column the burger belonged to (drawer rail → bar block)
           is now one uninterrupted strip owned by ONE surface.
           Its job here is only to CLOSE: while the drawer stands there is
           nothing to open, and when it goes the bar grows its own burger
           back in exactly this spot (NavigationBar's `.burger-slot`). -->
      <div class="drawer-footer">
        <div class="drawer-burger-slot">
          <q-btn
            round unelevated no-caps
            class="drawer-burger-btn"
            @click="drawer = false"
          >
            <q-icon name="menu_open" size="15px" />
            <q-tooltip anchor="center right" self="center left">Hide the menu</q-tooltip>
          </q-btn>
        </div>
        <!-- The hairline that closes the rail block: 41px + this = 42px =
             --dock-rail-w. In the mini state the drawer is exactly that wide,
             so this line falls outside the content box and the drawer's own
             brown-3 `border-right` stands in for it (same ink, same pixel). -->
        <div class="drawer-footer-hairline" />
      </div>

      <!-- The floor band, continued across the drawer's column (2026-08-02),
           in the crown strip's pale palette since 2026-08-04 — see
           NavigationBar's `.nav-floor-frieze` for why. The bar under here
           carries the same FriezeBar inside its footer, but the drawer runs
           PAST that footer to the window floor and owns these pixels — so it
           draws the band itself and the line reads unbroken from screen edge
           to screen edge. Un-flipped, exactly like the drawer's own section
           dividers above it; the pinned column at the other end takes
           `flip`, matching ITS siblings. -->
      <FriezeBar class="drawer-floor-frieze" />
    </q-drawer>

    <!-- Page content gives up the width of the parked stack/pins column on the
         right so they never cover it; EXPANDED windows overlap the page as
         they always did. -->
    <q-page-container :style="{ paddingRight: windows.railWidth ? windows.railWidth + 'px' : null, paddingTop: 'calc(var(--frieze-h) + var(--media-tabs-h, 0px))' }">
      <!-- `pins-changed` is bound on the ROUTER-VIEW because a page can pin
           too (the feed card's cap, 2026-08-07) and the pins widget it has to
           reload is a sibling of this container, not of the page. Vue Router
           forwards attrs — listeners included — to the matched component, so
           any page that declares the emit is heard here; the ones that do not
           are unaffected. Same destination as MediaViewerHost's tack and the
           nav bar's. -->
      <router-view @pins-changed="pinsRefreshKey++" />
    </q-page-container>

    <NavigationBar
      :pins-refresh-key="pinsRefreshKey"
      :show-burger="showBurger"
      :dashboard-open="dashboardOpen"
      @toggle-drawer="drawer = !drawer"
      @open-maker="makerStore.open()"
      @open-uploader="uploaderStore.open()"
      @open-skeleton-builder="skeletonBuilderStore.open()"
      @open-label-maker="labelMakerStore.open()"
      @toggle-dashboard="dashboardOpen = !dashboardOpen"
      @pins-changed="pinsRefreshKey++"
    />

    <!-- ── THE DASHBOARD FLYOUT (2026-08-10, user ask) and its SLOT.
         `DashboardFlyout` is the second box in the flyout family (the first
         being the skeleton viewer FeedPage floats beside its column); by that
         family's oldest rule the component draws the box and the HOST places
         it, so the geometry below is this layout's business.

         It hangs HERE rather than on a page because the button that opens it
         is on the nav bar, which outlives every route: a page-owned panel
         would blink out the moment you followed a link out of it. Which is
         also why the state is two plain refs in this file instead of a store
         — a flyout has no drafts, no tabs and nothing to restore, so there is
         nothing for a store to persist.

         The slot restates the feed flyout's rhythm against the WINDOW rather
         than against a page box (`left: 52.5%`, `right: 5%`, the band between
         the two frieze strips), and `--rail-w` is bound inline so the box
         keeps clear of the parked stack/pins column, which is opaque and
         ranks above it. Maximized, it reaches from the drawer's mini rail to
         that same right inset — the whole free width, which is what a
         maximize means for a box that never covers the chrome. ── -->
    <transition name="dashboard-flyout">
      <div
        v-if="dashboardOpen"
        class="dashboard-flyout"
        :class="{ 'is-max': dashboardMax }"
        :style="{ '--rail-w': windows.railWidth + 'px' }"
      >
        <DashboardFlyout
          :maximized="dashboardMax"
          @close="dashboardOpen = false"
          @toggle-max="dashboardMax = !dashboardMax"
        />
      </div>
    </transition>

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
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'
import { useAuthStore } from 'src/stores/auth'
import { useWindowsStore } from 'src/stores/windows'
import MakerDock from 'src/components/maker/MakerDock.vue'
import UploaderDock from 'src/components/maker/UploaderDock.vue'
import SkeletonBuilderDock from 'src/components/maker/SkeletonBuilderDock.vue'
import LabelMakerDock from 'src/components/maker/LabelMakerDock.vue'
import ChatDock from 'src/components/chat/ChatDock.vue'
import DashboardFlyout from 'src/components/dashboard/DashboardFlyout.vue'
import MediaViewerHost from 'src/components/media/MediaViewerHost.vue'
import FriezeHeader from 'src/components/layout/FriezeHeader.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import NavigationBar from 'src/components/layout/NavigationBar.vue'
import PinsDrawer from 'src/components/layout/PinsDrawer.vue'
import StackPanel from 'src/components/layout/StackPanel.vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import { useMakerStore } from 'src/stores/maker'
import { useUploaderStore } from 'src/stores/uploader'
import { useSkeletonBuilderStore } from 'src/stores/skeletonBuilder'
import { useLabelMakerStore } from 'src/stores/labelMaker'
import { useGeoStore } from 'src/stores/geo'
import { useEventsStore } from 'src/stores/events'

export default defineComponent({
  name: 'MainLayout',
  components: { MakerDock, UploaderDock, SkeletonBuilderDock, LabelMakerDock, ChatDock, DashboardFlyout, MediaViewerHost, FriezeHeader, FriezeBar, NavigationBar, PinsDrawer, StackPanel, EntityAvatar },
  setup () {
    const router = useRouter()
    const navStore = useNavStore()
    const authStore = useAuthStore()
    const makerStore = useMakerStore()
    const uploaderStore = useUploaderStore()
    const skeletonBuilderStore = useSkeletonBuilderStore()
    const labelMakerStore = useLabelMakerStore()
    const windows = useWindowsStore()
    // Mobile pass (Thread H): below q-drawer's breakpoint the drawer is an
    // OVERLAY, and a `true` model at boot drops its fullscreen backdrop over
    // the whole page — every tap then dies on `.q-drawer__backdrop`. Start
    // closed on small screens; `show-if-above` still auto-shows it on wide
    // ones, and the nav bar's menu button toggles it as an overlay here.
    const drawer = ref(window.innerWidth > 1023)
    const mini = ref(true)
    // The collapsed drawer's width IS `--dock-rail-w` — the same column the
    // nav bar's `.burger-slot` continues below it and the stack/pins widgets
    // park into on the far edge. Read the token so the two can never drift
    // (a mismatch here shows as a step at the bottom-left corner).
    const drawerRailW = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--dock-rail-w'), 10) || 42
    const hideDrawer = computed(() => !!router.currentRoute.value.meta?.hideDrawer)
    // The burger is ONE button that changes address (2026-08-02): it rides in
    // the drawer's own footer block while the drawer stands, and the nav bar
    // grows it back — same slot, same pixel — only once the drawer is gone.
    // Never both, so the two can never disagree about the column's posture.
    // On a hideDrawer route there is no drawer to summon, so the bar keeps
    // its bare left end rather than a button that would do nothing.
    const showBurger = computed(() => !drawer.value && !hideDrawer.value)
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

    // ── The drawer's identity block ──────────────────────────
    // Same two facts the feed card's author section states: `display_name`
    // is what the USER_PROFILE says to call you, `username` is the handle
    // underneath it — the address you can type back. Either may be missing,
    // so each falls back to the other and finally to the entity id.
    const user = computed(() => authStore.user)
    const isAlterEgo = computed(() => authStore.isActingAsAlterEgo)
    const profileName = computed(() =>
      authStore.user?.display_name || authStore.user?.username || `entity #${authStore.user?.id}`)
    const profileHandle = computed(() =>
      authStore.user?.username ? `@${authStore.user.username}` : `entity #${authStore.user?.id}`)

    // The profile row resolves to the logged-in user's entity view.
    const goToProfile = () => {
      const id = authStore.user?.id
      if (id) router.push('/entities/' + id)
    }

    // Logout moved off the nav bar into the drawer's IDENTITY section.
    const handleLogout = () => {
      authStore.logout()
      router.push('/auth')
    }

    // Back button at the top of the drawer. window.history.state.position
    // is 0 for the first entry — fall back to router.back() and let the
    // browser no-op when there's nowhere to go.
    const canGoBack = computed(() => (window.history.state?.position ?? 0) > 0)
    const goBack = () => { router.back() }

    // ── The dashboard flyout (2026-08-10) ────────────────────
    // Two plain refs, and deliberately not a store: the box has no drafts,
    // no tabs and nothing to restore, so there is nothing to persist and
    // nobody else to tell. It lives HERE because the nav bar opens it and the
    // nav bar outlives every route — a page-owned panel would blink out on
    // the next link. `dashboardMax` is kept ACROSS closes, the way the docks
    // remember their maximized state: reopening a box you left maximized at
    // its small size would read as the button doing something different the
    // second time.
    const dashboardOpen = ref(false)
    const dashboardMax = ref(false)
    // Escape closes it — the same dismissal the feed's flyout has, and the
    // only one a floating box can offer without the pointer finding its red
    // light. It does NOT restore the size: Escape means "put this away".
    const onDashboardKeydown = (e) => {
      if (e.key === 'Escape' && dashboardOpen.value) dashboardOpen.value = false
    }

    onMounted(async () => {
      window.addEventListener('keydown', onDashboardKeydown)
      // Mobile pass (Thread H): keep windows.isMobile live so the rail
      // reserves flip off under 600px (the widgets hide via CSS).
      windows.initViewportWatch()
      await navStore.restore()
      navStore.push(router.currentRoute.value)
      // Entering the platform: offer to anchor new moments to the user's
      // approximate city (one-time consent; see stores/geo.js).
      useGeoStore().maybeAsk()
      // The push spine (Thread A): open the app's ONE SSE connection —
      // no-op when logged out; the store owns reconnection.
      useEventsStore().connect()
    })

    onBeforeUnmount(() => window.removeEventListener('keydown', onDashboardKeydown))

    return { drawer, mini, drawerRailW, hideDrawer, showBurger, makerStore, uploaderStore, skeletonBuilderStore, labelMakerStore, windows, pinsRefreshKey, onPostCreated, onUploaded, user, isAlterEgo, profileName, profileHandle, goToProfile, handleLogout, canGoBack, goBack, dashboardOpen, dashboardMax }
  }
})
</script>

<style lang="scss">
// UNSCOPED on purpose: `class="pathos-drawer"` lands on Quasar's
// .q-drawer__content node, which does NOT carry this component's scope
// attribute — scoped selectors never match it (the old glass skin
// silently didn't either; the drawer was painted by Quasar's --q-dark).

// Kill Quasar's dark paint on the aside; the skin lives on the content.
// The drawer OVERLAPS the crown strip (2026-07-24): it runs from the screen's
// very top-left corner and outranks the fixed FriezeHeader (3000), wearing its
// own frieze band up there instead of hiding under the strip.
//
// SINCE 2026-08-02 IT DOES THE SAME AT THE OTHER END (user ask): `bottom: 0`,
// so the column runs the WHOLE window height and lies OVER the nav bar instead
// of stopping at its top edge. z 3120 clears the bar (3110), which had been
// raised above everything precisely so nothing could paint on it — the drawer
// is now the ONE deliberate exception, and it does not cover any control the
// bar needs: the bar's left cluster is empty while the drawer stands (its
// burger moved INTO the drawer's own footer block, `.drawer-footer` below),
// and even expanded the drawer is 220px, far short of the right cluster.
// The one visible cost is the drawer's `6px 0 22px` shadow washing the bar's
// plaque again for those last 48px — which is correct now: the drawer really
// is lying on top of it there.
aside.q-drawer {
  background: transparent !important;
  z-index: 3120;
  bottom: 0;
  // Steps down with the crown strip while a media viewer is parked
  // (2026-08-05) — this column carries its own FriezeBar in the strip's
  // place, so the two have to start at the same y or the band breaks at
  // the drawer's edge. 0px otherwise.
  top: var(--media-tabs-h, 0px);
}

// MOBILE OVERLAY: below q-drawer's breakpoint the drawer is modal and dims the
// page behind it. Quasar's backdrop ships at 2999 — under the nav bar (3110),
// which mattered little while the drawer stopped at the bar's top edge, but now
// that the drawer LIES OVER the bar an undimmed strip of chrome poking out
// beside a dimmed page reads as a bug (and its buttons stayed live under a
// modal). 3115 dims the bar with everything else and still passes under the
// drawer itself (3120).
.q-drawer__backdrop {
  z-index: 3115;
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

  // The list takes whatever is left between the pinned band and the pinned
  // burger block (min-height:0 lets it actually shrink so the q-scroll-area
  // scrolls instead of overflowing).
  .drawer-scroll {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
  }

  // ── The drawer's own nav-bar row (2026-08-02) ────────────
  // The drawer reaches the window floor now, so its last --nav-footer-h lands
  // exactly on the nav bar underneath. Rather than hide the bar there, this
  // block REBUILDS that row inside the drawer: the same brown-1 plaque, the
  // same brown-3 top lip on the same pixel as the bar's `border-top`, and the
  // same 41px brown-4 rail block at the left end. Whatever the drawer's width,
  // the bar reads as continuous — the drawer just owns those pixels.
  //
  // It takes --nav-bar-h, the bar's ROW, not --nav-footer-h: since the floor
  // band went in (same day) the chrome is that row plus a --frieze-h band, and
  // the drawer rebuilds both — this block, then `.drawer-floor-frieze` under
  // it. Sized to the total instead, the block would swallow the band's pixels
  // and drop the burger chip half a band low.
  .drawer-footer {
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
    height: var(--nav-bar-h);
    background: var(--brown-1);
    border-top: 1px solid var(--brown-3);
    overflow: hidden;               // clips the hairline in the 42px mini state
  }

  // The band that closes the column, on the window floor. `flex: 0 0 auto` so
  // it keeps its own --frieze-h against the scroll area's `flex: 1 1 auto`
  // above it — the component states a height, not a basis.
  .drawer-floor-frieze {
    flex: 0 0 auto;
    // The crown strip's pale palette (2026-08-04) — see NavigationBar's
    // `.nav-floor-frieze`, which this matches tone for tone.
    --frieze-bar-base: var(--brown-1);
    --frieze-bar-wave-one: var(--brown-3);
    --frieze-bar-wave-two: var(--brown-4);
  }

  // The rail block — NavigationBar's `.burger-slot` to the pixel: the column's
  // darker brown-4 coat, `--dock-rail-w` less the hairline that closes it, the
  // chip floating centred with padding on both sides.
  .drawer-burger-slot {
    flex: 0 0 auto;
    width: calc(var(--dock-rail-w) - 1px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brown-4);
  }

  .drawer-footer-hairline {
    flex: 0 0 auto;
    width: 1px;
    background: var(--brown-3);
  }

  // The chip: the same 28px inverted-brown circle the pin tack and the old
  // bar burger wear (flat brown-8 face + rim, brown-1 glyph, inset top
  // highlight, brown-7 on hover — NOT Quasar's push preset).
  // 24px since the bar went to 2/3 height (2026-08-02) — this chip must keep
  // matching NavigationBar's `.burger-slot` chip to the pixel, and 28px no
  // longer fits in a 32px row.
  .drawer-burger-btn {
    width: 24px;
    height: 24px;
    min-width: 24px;
    min-height: 24px;
    padding: 0;
    border-radius: 50%;
    background: var(--brown-8);
    border: 1px solid var(--brown-8);
    color: var(--brown-1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

    .q-icon { color: var(--brown-1) !important; opacity: 1; transition: transform 0.14s ease; }

    &:hover {
      background: #5d4037;          // Quasar brown-7 — lifts on hover
      border-color: #5d4037;
    }
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

  // ── Profile — the identity block (2026-08-02) ────────────
  // The feed card's author section, re-coated for the drawer: the same
  // face-over-two-lines figure, the same "name over @handle" rhythm, but
  // drawn in brown-8 on the brown-1 plaque instead of the card's plum on
  // indigo. It is a row of DATA that happens to be clickable, so it sits
  // a hair taller than the menu rows around it and takes no active-class —
  // there is no route it can be "on".
  .drawer-profile-item {
    min-height: 46px;
  }

  // The face + its mask chip. `position: relative` is the chip's anchor;
  // the avatar's own rounded-square tile does the rest.
  .drawer-profile-face {
    position: relative;
    display: inline-flex;
    line-height: 0;
  }

  // MASK CHIP — floating on the face's bottom-right corner, the same corner
  // a badge takes everywhere else on the platform. Inverted brown (brown-8
  // fill, brown-1 glyph) so it reads at 14px against any generated avatar,
  // with a brown-1 ring separating it from the tile underneath.
  .drawer-profile-mask {
    position: absolute;
    right: -4px;
    bottom: -4px;
    width: 15px;
    height: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--brown-8);
    border: 1.5px solid var(--brown-1);
    .q-icon { color: var(--brown-1) !important; opacity: 1; }
  }

  // Two stacked lines read as ONE stamp at 1.15 leading — any more and they
  // break apart into two separate facts (the same figure the feed card's
  // identity block is set at).
  .drawer-profile-text {
    line-height: 1.15;
    min-width: 0;
  }

  .drawer-profile-name {
    font-size: 0.92em;
    font-weight: 700;
    color: var(--brown-8);
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // The handle is the address you can type back — mono, quieter, never
  // wider than the name above it.
  .drawer-profile-handle {
    font-size: 0.78em;
    color: rgba(78, 52, 46, 0.62);   // brown-8 at reading-quiet strength
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // Logout — an action, not a destination, so it takes the Back button's
  // muted register rather than a navigation row's. No inverted chip: one
  // loud affordance per drawer, and that one is Back.
  .drawer-logout-item {
    color: rgba(78, 52, 46, 0.72);
    .q-icon { opacity: 0.7; }
    &:hover { color: var(--brown-8); .q-icon { opacity: 1; } }
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

// ── THE DASHBOARD FLYOUT'S SLOT (2026-08-10) ─────────────────────────────
// The box is `DashboardFlyout` (`.flyout-window` chrome); this is where it
// stands. FIXED, not absolute: it belongs to the layout, not to whatever page
// happens to be under it, and it has to hold still while a route changes.
//
// VERTICALLY it is FeedPage's flyout law restated — between the two frieze
// bands and clear of both, `--flyout-gap` of daylight off each, so the two
// boxes in the family sit on exactly the same two lines whichever route you
// are on. The bottom names the nav footer as well because this box measures
// from the WINDOW, where the feed's measures from a page whose own box already
// stops at the bar.
//
// HORIZONTALLY it takes the feed flyout's slot — `left: 52.5%`, the container's
// 47.5% plus the 5% box gap — so on /feed it lands exactly where a reader
// expects a flyout, and elsewhere it simply hangs in the right-hand half. The
// right inset adds `--rail-w` (bound inline off `windows.railWidth`): the
// parked stack/pins column is opaque at z 3100 and outranks this box, so the
// percentage alone would slide the panel's edge under it.
//
// z 3060: OVER every dock (3010+ — this box is summoned from the bar, so it
// has to arrive on top of whatever window was already open) and over the feed
// container and its own sibling flyout (3001/3002), UNDER the parked side
// widgets (3100), the nav bar (3110) and the drawer (3120) — the three
// surfaces that overlap everything by design. The minitab strip (3045) is
// below it and never in its box: the strip stands on the bar's top edge and
// this slot stops a whole frieze band above that.
.dashboard-flyout {
  --flyout-gap: 14px;

  position: fixed;
  top: calc(var(--frieze-h) + var(--flyout-gap));
  bottom: calc(var(--nav-footer-h) + var(--frieze-h) + var(--flyout-gap));
  left: 52.5%;
  right: calc(5% + var(--rail-w, 0px));
  z-index: 3060;
}

// MAXIMIZED — the whole free width, and no more. It starts at the drawer's
// mini rail (`--dock-rail-w`, the column the drawer keeps even collapsed) plus
// the same gap it keeps off everything else, and it keeps its right inset, so
// a maximized flyout still never covers a piece of chrome. That is the
// difference between this and a dock's `is-max`: a dock is a window that takes
// the screen, a flyout is a reading surface that takes the page.
.dashboard-flyout.is-max {
  left: calc(var(--dock-rail-w) + var(--flyout-gap));
}

// MOBILE — one surface at a time, exactly the bargain the feed's flyout
// strikes at this width: the box overlays the full width on the same 8px of
// daylight the docks keep, and maximize has nothing left to add (the rule is
// stated for both states so the green light never moves the box a pixel and
// looks broken). The drawer is an OVERLAY down here, so there is no mini rail
// to clear on the left. Kept in step with MOBILE_MQ in stores/windows.js and
// the mobile block in css/_components.scss.
@media (max-width: 600px) {
  .dashboard-flyout,
  .dashboard-flyout.is-max {
    left: 8px;
    right: 8px;
  }
}

// It arrives from the right — the direction it lives in, so the motion says
// where the box came from rather than just that it appeared. Same 0.16s the
// feed's flyout uses; they are one family and should enter alike.
.dashboard-flyout-enter-active,
.dashboard-flyout-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.dashboard-flyout-enter-from,
.dashboard-flyout-leave-to {
  opacity: 0;
  transform: translateX(14px);
}
</style>
