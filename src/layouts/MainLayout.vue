<template>
  <q-layout view="lHh Lpr lff">
    <!-- ── NO CROWN STRIP HERE SINCE 2026-08-12 (user ask: "remove the brown
         frieze header from the top of the screen and also the one from the
         bottom of the screen, below the footer bar"). The mercury frieze
         plaque stood fixed edge-to-edge across every page's top for months
         and `FriezeHeader.vue` is DELETED with it; the window's top chrome is
         now the media tabs rail alone — the thin silver band below, which
         every top-anchored surface still steps down by (--media-tabs-h).
         The band's PALETTE lives on in the drawer's section dividers and in
         the widgets' own bands, and --frieze-h is still the frieze family's
         thickness — only the two SCREEN-EDGE bands went. ── -->

    <!-- The flyout viewers (element + media faces, fused 2026-08-17) +
         their minimize sliver, hanging from the silver rail — every child
         is fixed-position, so the mount point only has to exist once. -->
    <ElementFlyoutHost @pins-changed="pinsRefreshKey++" />

    <!-- mini-width = --dock-rail-w, READ FROM THE TOKEN rather than restated
         (2026-08-02): the collapsed drawer mirrors the stack/pins parked
         column on the opposite edge, AND its own footer block (plus the nav
         bar's, whenever the drawer is gone) continues this exact column down
         through the bar's row — several surfaces on one number, so the number
         is fetched once instead of typed each time. -->
    <q-drawer v-if="!hideDrawer" v-model="drawer" show-if-above :mini="mini" :width="220" :mini-width="drawerRailW"
      bordered class="pathos-drawer" @mouseover="mini = false" @mouseout="mini = true">

      <!-- The drawer's own top band went with the crown strip (2026-08-12):
           it existed only to REPLACE that strip across this column — same
           --frieze-h box, same brown-3 lip, so the two read as one band —
           and a stub of it standing alone at the top-left corner would be
           the band the ask removed, drawn in one column. The drawer's
           SECTION dividers below are a different job and stay — and since
           2026-08-17 (user ask) one of them stands ABOVE the Back button too.
           That is NOT the deleted band coming back: this one sits INSIDE the
           scroll area, in the list's own padding, wearing the divider rhythm
           and the divider palette. It divides the drawer's top edge from its
           first control instead of continuing a screen-edge band across the
           column, which is exactly the distinction that retired the old one. -->

      <q-scroll-area class="drawer-scroll" :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding class="nasalization" style="font-size:0.82em;">

          <!-- Mirrored frieze bands — the drawer's section dividers (ABOVE
               Back since 2026-08-17, then after Back, before EXPLORE, before
               IDENTITY); full-bleed edge to edge (the q-list pads vertically
               only) so each spans the drawer in both mini and expanded
               states. All four are the SAME element with the same class and
               the SIDE CHROME TRIO's palette (a --grey-8 plate under the
               orange-11/teal-11 weave, rimmed --grey-6 — `_components.scss`,
               shared by name with the stack/pins bands; FriezeBar's default
               browns until 2026-08-17) — the drawer has one divider
               vocabulary, and a band that happens to be first is not a
               different kind of band.
               ⚠ THIS FIRST ONE IS FLUSH WITH THE WINDOW'S TOP EDGE (user ask,
               2026-08-18): the drawer starts at `top: 0` over the media tabs
               rail and the list's top padding + this band's top margin are
               both zeroed for it (see `.q-list--padding` in the styles), so
               its rim is the drawer's top line. Still not a different band —
               same class, same recipe, just no gap above it. -->
          <FriezeBar class="drawer-frieze" />

          <!-- Distinctive Back button — pinned at the very top of the drawer
               so every viewer can reclaim its top bar. Disabled on the very
               first entry of the history stack. Since 2026-08-17 it is
               BRACKETED by friezes, one above and one below, which is what
               makes it read as its own section rather than as the first item
               of the list under it. -->
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
               Adapted to the drawer's cream `--plaque-coat` (and, since
               2026-08-18, its grey ink) rather than the feed's indigo card.

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
           rebuilt from the bar's parts — the shared `--plaque-coat`, a
           --grey-6 top lip on the same pixel as the bar's `border-top`, and
           the 41px rail block + hairline at its left end holding the button.
           (It was a brown-1 plaque with a brown-3 lip and a brown-4 rail
           block under a 24px round chip until the asks of 2026-08-17 (the coat
           went shared) and 2026-08-18 (the edges went grey, the rail block
           went TRANSPARENT and the chip became a rounded square filling it).) The column the
           burger belonged to (drawer rail → bar block) is now one
           uninterrupted strip owned by ONE surface.
           Its job here is only to CLOSE: while the drawer stands there is
           nothing to open, and when it goes the bar grows its own burger
           back in exactly this spot (NavigationBar's `.burger-slot`). -->
      <div class="drawer-footer">
        <div class="drawer-burger-slot">
          <!-- NO `round` SINCE 2026-08-18 (user ask): the chip is a rounded
               SQUARE that fills its slot, so the radius is ours to state in
               the styles (`round` would force 50% and its own square padding
               box). -->
          <q-btn
            unelevated no-caps
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
             --grey-6 `border-right` stands in for it (same ink, same pixel —
             both were brown-3 before 2026-08-18's palette ask, and the pair
             still moves together). -->
        <div class="drawer-footer-hairline" />
      </div>

      <!-- The floor band is gone too (2026-08-12, the same ask): this column
           only carried it because the drawer runs PAST the footer to the
           window floor and owed the line those pixels — NavigationBar's
           `.nav-floor-frieze` was the band itself, PinsDrawer's the other
           end. All three left together; the rebuilt bar ROW above stays,
           and the drawer's last pixels are now that row's, exactly like the
           bar's own. -->
    </q-drawer>

    <!-- Page content gives up the width of the parked stack/pins column on the
         right so they never cover it; EXPANDED windows overlap the page as
         they always did. -->
    <q-page-container :style="{ paddingRight: windows.railWidth ? windows.railWidth + 'px' : null, paddingTop: 'var(--media-tabs-h, 0px)' }">
      <!-- `pins-changed` is bound on the ROUTER-VIEW because a page can pin
           too (the feed card's cap, 2026-08-07) and the pins widget it has to
           reload is a sibling of this container, not of the page. Vue Router
           forwards attrs — listeners included — to the matched component, so
           any page that declares the emit is heard here; the ones that do not
           are unaffected. Same destination as ElementFlyoutHost's tack and
           the nav bar's. -->
      <router-view @pins-changed="pinsRefreshKey++" />
    </q-page-container>

    <NavigationBar
      :pins-refresh-key="pinsRefreshKey"
      :show-burger="showBurger"
      @toggle-drawer="drawer = !drawer"
      @open-maker="makerStore.open()"
      @open-uploader="uploaderStore.open()"
      @open-skeleton-builder="skeletonBuilderStore.open()"
      @open-label-maker="labelMakerStore.open()"
      @pins-changed="pinsRefreshKey++"
    />

    <!-- The eight docked windows (maker, uploader, skeleton builder, label
         maker, chat, DASHBOARD since 2026-08-10, stack, pins) — always
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
    <!-- The dashboard panel — the creation footprint in the flyout family's
         grey coat, empty until we fill it (2026-08-10, second ask: it rises
         from the bar like the other creative windows rather than floating in
         the feed's right-hand slot, which is where its first pass put it). -->
    <DashboardDock />
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
import DashboardDock from 'src/components/dashboard/DashboardDock.vue'
import ElementFlyoutHost from 'src/components/shared/ElementFlyoutHost.vue'
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
  components: { MakerDock, UploaderDock, SkeletonBuilderDock, LabelMakerDock, ChatDock, DashboardDock, ElementFlyoutHost, FriezeBar, NavigationBar, PinsDrawer, StackPanel, EntityAvatar },
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

    // ── The dashboard panel is a DOCK since 2026-08-10 ───────
    // It spent one pass as a floating flyout with its window state in two
    // refs here; the second ask moved it onto the bar with the other creative
    // windows, so its flags live in `stores/dashboard.js` like every other
    // dock's — which is also what lets the nav bar draw its minitab without
    // this layout passing anything down. Nothing left to hold here.

    onMounted(async () => {
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

    return { drawer, mini, drawerRailW, hideDrawer, showBurger, makerStore, uploaderStore, skeletonBuilderStore, labelMakerStore, windows, pinsRefreshKey, onPostCreated, onUploaded, user, isAlterEgo, profileName, profileHandle, goToProfile, handleLogout, canGoBack, goBack }
  }
})
</script>

<style lang="scss">
// UNSCOPED on purpose: `class="pathos-drawer"` lands on Quasar's
// .q-drawer__content node, which does NOT carry this component's scope
// attribute — scoped selectors never match it (the old glass skin
// silently didn't either; the drawer was painted by Quasar's --q-dark).

// Kill Quasar's dark paint on the aside; the skin lives on the content.
// The drawer RUNS TO THE SCREEN'S VERY TOP-LEFT CORNER (2026-07-24) — it did
// that to overlap the fixed crown strip (3000) and wore its own band up there
// instead of hiding under it. The strip and that band are both gone since
// 2026-08-12 (user ask); the corner is still the drawer's, now under the
// silver media-tabs rail alone.
//
// SINCE 2026-08-02 IT DOES THE SAME AT THE OTHER END (user ask): `bottom: 0`,
// so the column runs the WHOLE window height and lies OVER the nav bar instead
// of stopping at its top edge. z 3120 clears the bar (3110), which had been
// raised above everything precisely so nothing could paint on it — the drawer
// is now the ONE deliberate exception, and it does not cover any control the
// bar needs: the bar's left cluster is empty while the drawer stands (its
// burger moved INTO the drawer's own footer block, `.drawer-footer` below),
// and even expanded the drawer is 220px, far short of the right cluster.
// It used to pay for that with a `6px 0 22px` cast washing the bar's plaque
// for those last 48px; since 2026-08-18 (user ask, "no shadow pls") the drawer
// casts NOTHING — see `.pathos-drawer` below.
aside.q-drawer {
  background: transparent !important;
  z-index: 3120;
  bottom: 0;
  // BACK TO THE WINDOW'S VERY TOP EDGE (2026-08-18, user ask: the drawer
  // should "start drawing at the top of the screen"). It stepped down by
  // `--media-tabs-h` from 2026-08-05, when the media tabs rail became the top
  // chrome and every top-anchored surface started on its underside; this
  // column and the stack widget at the other edge are now the two exceptions,
  // each carrying its own FriezeBar at y=0 exactly as they did over the
  // deleted crown strip.
  //
  // ⚠ WHICH ONE PAINTS OVER THE OTHER FLIPPED WITHIN THE HOUR (a second user
  // ask): the first pass left the rail at 3105 and let this drawer (3120)
  // cover it, and the ask that followed was for the rail to draw ON TOP of
  // both columns, "partially covering the frieze bar". The rail is 3125 now,
  // so it lies across the top ~6px of this column's first band (about a third
  // of it). Nothing changed HERE for that — `top: 0` is what both asks wanted;
  // only the rail's z moved. It stays click-through paint, so the pixels it
  // covers keep taking taps.
  top: 0;
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

// Mercury-plaque drawer — deliberately OPAQUE, and since 2026-08-17 (user
// ask) wearing the shared `--plaque-coat`: a --light-cream sheet under a 30%
// --grey-3 veil, the post card's own two-layer construction. It was Quasar's
// brown-1 flat, and the pairing it was chosen for still holds — the nav bar
// below and the stack/pins widgets on the right edge took the identical coat
// in the same session, so the window's four chrome edges remain ONE material.
// (What that pass ended is the drawer matching the CREATION docks, which keep
// brown-1 as `--dock-coat`: a window rising from the chrome is now a different
// material from the chrome it rises out of.) Still no sheen gradients — the
// veil is a flat wash, not a lit face; the complementary SMOKE coat keeps
// items and texts crisp on the pastel.
.pathos-drawer {
  // Column: the pinned top frieze band, then the scrolling list under it.
  // (No padding-top anymore — the drawer sits ON TOP of the crown strip and
  // supplies its own band at y=0, so nothing hides under the plaque.)
  display: flex;
  flex-direction: column;
  background: var(--plaque-coat) !important;
  border-right: 1px solid var(--grey-6) !important;
  // NO CAST AT ALL (2026-08-18, user ask: "remove the shadow it projects on
  // top of the items it is layered above. no shadow pls"). It was
  // `6px 0 22px rgba(0,0,0,0.30)` — a raised-column cue that, now the drawer
  // runs the FULL window height over the nav bar (below) and over the media
  // tabs rail (above), was smearing 22px of black across every surface it
  // passes: the bar's plaque, the rail's underside, the page. The `border-right`
  // above is the only edge it states now, which is enough — the drawer is an
  // opaque plaque against a dark canvas.
  box-shadow: none;

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
  // block REBUILDS that row inside the drawer: the same `--plaque-coat`, a
  // top lip on the same pixel as the bar's `border-top`, and the same 41px
  // rail block at the left end (whose brown-4 coat the same day's ask
  // dropped — see `.drawer-burger-slot`). Whatever the drawer's width, the bar
  // reads as continuous — the drawer just owns those pixels. Both surfaces
  // took the cream-under-veil coat on 2026-08-17, so this block agrees with
  // the drawer it lives in AND the bar it stands on, as it always has. THE LIP
  // SEAM IS CLOSED (2026-08-18, the next day): the note that stood here
  // said the bar's top border had gone `--grey-6` while this one was still
  // `--brown-3` — two inks on one pixel — and named this as the line to walk
  // if the continuity ever read broken. The palette ask walked it: every edge
  // in this block is `--grey-6` now, so the bar's border and the drawer's
  // rebuild of it are one line again.
  //
  // It takes --nav-bar-h, the bar's ROW. That was the two-band era's
  // distinction — the footer was this row PLUS a --frieze-h floor band, and
  // the drawer rebuilt both (this block, then `.drawer-floor-frieze`). The
  // band is gone since 2026-08-12 and --nav-footer-h IS --nav-bar-h now, so
  // the two read the same; the token stays named here because it is the ROW
  // this block rebuilds, and only the row.
  .drawer-footer {
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
    height: var(--nav-bar-h);
    background: var(--plaque-coat);
    border-top: 1px solid var(--grey-6);
    overflow: hidden;               // clips the hairline in the 42px mini state
  }

  // The rail block — NavigationBar's `.burger-slot` geometry to the pixel:
  // `--dock-rail-w` less the hairline that closes it. ⚠ ITS COAT IS GONE
  // (2026-08-18, user ask: "paint the background of this button container
  // transparent so we see the left drawer background color instead"). It was
  // `--brown-4` — the darker rail block the bar's own slots still wear — and
  // dropping it is what lets the button read as a control sitting ON the
  // drawer rather than as a chip inside a second, darker column. The 4px
  // padding is the button's breathing room: the button itself fills whatever
  // is left (`.drawer-burger-btn` below is 100% × 100% of this box).
  .drawer-burger-slot {
    flex: 0 0 auto;
    width: calc(var(--dock-rail-w) - 1px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
  }

  .drawer-footer-hairline {
    flex: 0 0 auto;
    width: 1px;
    background: var(--grey-6);
  }

  // The chip — A ROUNDED SQUARE THAT FILLS ITS SLOT since 2026-08-18 (user
  // ask): it was a 24px circle (the pin tack's figure, matched to
  // NavigationBar's `.burger-slot` chip to the pixel), and it now takes the
  // whole rail block less the slot's 4px pad — 33 × 24 at the current dials —
  // with `--radius-sm` corners, the same radius the drawer's own `.q-item`
  // rows wear. Sizing by PERCENT and not by px is deliberate: the box is
  // whatever `--dock-rail-w` and `--nav-bar-h` say it is, so the button
  // follows both dials for free.
  // Ink: the inverted GREY plaque (grey-9 face + rim, grey-3 glyph, inset top
  // highlight, grey-10 on hover) — brown-8/brown-1/brown-7 until the same
  // day's palette ask took the whole side chrome to the grey family.
  // ⚠ NavigationBar's `.burger-slot` chip is this button's twin and still
  // renders the round 24px figure; the two are never on screen together (the
  // bar grows its own burger back only once the drawer is gone), so this pass
  // deliberately leaves it alone.
  .drawer-burger-btn {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    padding: 0;
    border-radius: var(--radius-sm);
    background: var(--grey-9);
    border: 1px solid var(--grey-9);
    color: var(--grey-3);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

    .q-icon { color: var(--grey-3) !important; opacity: 1; transition: transform 0.14s ease; }

    // A dark plaque LIFTS by going LIGHTER (brown-7 was a step up from
    // brown-8, not down) — `--grey-8` keeps that direction in the new family.
    &:hover {
      background: var(--grey-8);
      border-color: var(--grey-8);
    }
  }

  // Denser than Quasar's defaults (2026-07-31): the collapsed drawer is
  // --dock-rail-w (42px) to mirror the stack/pins column — with 2×5px item
  // margins that leaves a 32px chip, so rows tighten to 40px min-height and
  // the section rhythm shrinks a notch to match.
  .q-item {
    color: var(--grey-9);
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

  // ⚠ THE FIRST BAND IS FLUSH WITH THE DRAWER'S TOP EDGE (2026-08-18, user
  // ask: "no gap between the screen top border and itself"). TWO gaps stood
  // above it and both had to go — Quasar's `padding` prop on the q-list
  // (`.q-list--padding`, 8px top and bottom) and the band's own 6px margin —
  // so this pair of rules is one ask, not two tweaks. The list's BOTTOM
  // padding is deliberately kept: the last row still needs its air above the
  // footer block. And since the drawer itself now starts at `top: 0`, the
  // band's own `--grey-6` top rim IS the window's top-left edge, which is the
  // same job the deleted crown strip's lip used to do at that corner.
  .q-list--padding { padding-top: 0; }
  .drawer-frieze:first-child { margin-top: 0; }
  .q-item:hover {
    background: var(--smoke);
    color: var(--grey-9);
  }
  .q-icon {
    color: var(--grey-9);
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
    color: var(--grey-9) !important;
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
  // a badge takes everywhere else on the platform. Inverted GREY (grey-9 fill,
  // grey-3 glyph, since 2026-08-18's palette ask — brown-8/brown-1 before) so
  // it reads at 14px against any generated avatar, with a grey-3 ring
  // separating it from the tile underneath.
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
    background: var(--grey-9);
    border: 1.5px solid var(--grey-3);
    .q-icon { color: var(--grey-3) !important; opacity: 1; }
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
    color: var(--grey-9);
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // The handle is the address you can type back — mono, quieter, never
  // wider than the name above it.
  .drawer-profile-handle {
    font-size: 0.78em;
    color: rgba(66, 66, 66, 0.62);   // grey-9 at reading-quiet strength
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // Logout — an action, not a destination, so it takes the Back button's
  // muted register rather than a navigation row's. No inverted chip: one
  // loud affordance per drawer, and that one is Back.
  .drawer-logout-item {
    color: rgba(66, 66, 66, 0.72);
    .q-icon { opacity: 0.7; }
    &:hover { color: var(--grey-9); .q-icon { opacity: 1; } }
  }

  // ── Back button — distinctive, pinned-top affordance ─────
  // Inverted GREY chip (solid grey-9 fill, grey-3 ink — brown-8/brown-1 until
  // 2026-08-18's palette ask) so it visually pops out of the grey-9-on-cream
  // navigation list and reads as an action (not a destination), with a small
  // inward arrow shift on hover so the gesture echoes the direction.
  .drawer-back-item {
    background: var(--grey-9);
    border: 1px solid var(--grey-9);
    color: var(--grey-3);
    margin: 4px 5px 5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

    .drawer-back-icon {
      color: var(--grey-3) !important;
      opacity: 1;
      transition: transform 0.12s;
    }
    .drawer-back-label { color: var(--grey-3); }

    &:hover {
      background: var(--grey-8); // one step LIGHTER — a dark chip lifts
      border-color: var(--grey-8);
      .drawer-back-icon { transform: translateX(-2px); }
    }

    &.q-item--disabled {
      background: var(--smoke);
      border-color: rgba(66, 66, 66, 0.20);
      color: rgba(66, 66, 66, 0.40);
      .drawer-back-icon { color: rgba(66, 66, 66, 0.40) !important; }
      .drawer-back-label { color: rgba(66, 66, 66, 0.40); }
    }
  }
}

</style>
