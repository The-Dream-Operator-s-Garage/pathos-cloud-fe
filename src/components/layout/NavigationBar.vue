<template>
  <q-footer class="nav-footer">

    <div class="nav-bar">

      <!-- ── LEFT: the drawer column continued down through the bar — but
           ONLY WHILE THERE IS NO DRAWER (2026-08-02). The drawer runs to the
           window floor now and lies over this bar, carrying the burger in its
           own footer block on exactly these pixels; the button appears HERE
           when the drawer is gone, so the left rail block is never absent and
           never doubled. It is the pin tack's MIRROR TWIN: same 42px slot
           (--dock-rail-w less the hairline that closes it), same darker
           brown-4 coat, same 24px inverted-brown circle floating centred in
           it — the left edge reads as one uninterrupted column whichever
           surface owns it. Identity actions (profile, logout) are GONE from
           the bar: the drawer's own profile block is where the acting
           identity lives now. ── -->
      <div class="nav-left" :class="{ 'nav-left--bare': !showBurger }">
        <div v-if="showBurger" class="burger-slot">
          <q-btn
            round unelevated no-caps
            class="burger-btn"
            @click="$emit('toggle-drawer')"
          >
            <!-- The burger stood on END — a quarter turn of the same glyph
                 the drawer's own chip wears open (`menu_open`), rather than a
                 different icon: the drawer it summons is a vertical column,
                 and the mark states that column's posture. (`view_week`'s
                 three vertical bars were tried first and read as a pause
                 button.) -->
            <q-icon name="menu" size="13px" class="burger-glyph--upright" />
            <q-tooltip>Show the menu</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ── CENTER: deliberately EMPTY (2026-08-02). The back/forward pair,
           the checkpoint trio, the step + current-title readout and the
           checkpoint dropdown all lived here; they are gone. Navigation
           history is reached through the drawer's Back button and the stack
           widget on the right edge, and the current element names itself on
           the page. What is left is the slack that pushes the right cluster
           to its edge. ── -->
      <div class="nav-center" />

      <!-- ── RIGHT: chat · create bundle · pin tack. The tack anchors the far
           corner directly BENEATH the pinned-list side panel (which now docks
           on top of the bar's top edge in both its expanded and rail states),
           so the tack + the pinned column read as one right-edge stack. There
           is no separate pinned-list toggle anymore — the panel is reached via
           its own rail head (it defaults to that rail and is minimize-only).
           The navigation-stack panel likewise has no button here. ── -->
      <div class="nav-right" :class="{ 'nav-right--railed': !showTack }">
        <!-- Chat: the conversation window (distinctive teal treatment —
             chats are where entities meet, not another maker). The UNREAD
             BADGE (Thread A) rides it: the event spine's live unread count
             — messages, polls, invites, grants, comments all land here or
             one click away. Opening the dock marks the queue seen (coarse
             v1 ack; see stores/events.js). -->
<!-- Global search (Thread E, 2026-07-30): one input over
             GET /api/search — self-contained button + dialog. -->
        <GlobalSearch />
        <q-btn
          push no-caps
          class="nav-btn chat-btn"
          :class="{ 'is-active': chatExpanded }"
          title="Chats — private conversations"
          @click="toggleChat"
        >
          <!-- Icon ONLY (2026-08-02): the word "chat" said nothing the forum
               glyph does not, and the bar has to hold this cluster inside a
               375px screen. The title/tooltip carries the name. -->
          <q-icon name="forum" size="14px" />
          <q-badge
            v-if="events.unreadCount > 0"
            floating color="amber-9" text-color="black"
            class="chat-unread-badge"
          >{{ events.unreadCount }}</q-badge>
        </q-btn>

        <div class="nav-divider" />

        <!-- ── DASHBOARD (2026-08-10, user ask) — its OWN section between the
             chat button and the blue create bundle, hairlined on both sides
             so it reads as a third thing rather than as a pale member of
             either group. That is what the position is for: chat is where
             entities meet and the bundle is where elements are made, and this
             opens a box that only LOOKS at the platform.

             GREY on purpose, and the one grey control on this bar: it is the
             tone of the box it opens (the flyout family's `--grey-3` plaque
             with its `--grey-4` lines, the platform's one neutral surface),
             where the chat pebble answers in aqua and the bundle in
             light-blue. A button and the window it summons wearing one
             colorway is the same trick the minitab strip plays with its
             per-dock icon tints.

             `sym_o_` prefixed — Material SYMBOLS, not Material Icons.
             `empty_dashboard` exists only in the symbols font, and a name the
             loaded font has no ligature for renders as the literal WORD at
             full width (see specs/gotchas.md; the feed's cap glyphs hit this
             first). Both fonts are loaded in quasar.config.js's `extras`. -->
        <q-btn
          push no-caps
          class="nav-btn dashboard-btn"
          :class="{ 'is-active': dashboardExpanded }"
          title="Dashboard — the panel rising from this bar"
          @click="toggleDashboard"
        >
          <q-icon name="sym_o_empty_dashboard" size="14px" />
        </q-btn>

        <div class="nav-divider" />

        <!-- Create bundle: post maker + skeleton builder + label maker +
             uploader windows -->
        <q-btn-group push class="nav-bundle create-bundle">
          <q-btn push class="create-btn" @click="$emit('open-maker')">
            <q-icon name="add_circle_outline" size="14px" />
            <q-tooltip>Make post</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-skeleton-builder')">
            <q-icon name="schema" size="14px" />
            <q-tooltip>Build skeletons — define templates, populate and edit instances</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-label-maker')">
            <q-icon name="label_important" size="14px" />
            <q-tooltip>Label maker — grow, fork and reorganize label trees</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-uploader')">
            <q-icon name="upload" size="14px" />
            <q-tooltip>Upload files, links or notes</q-tooltip>
          </q-btn>
        </q-btn-group>

        <div v-if="showTack" class="nav-divider" />

        <!-- Pin tack — THE FALLBACK COPY (2026-08-02, user ask: the tack
             belongs INSIDE the pinned side bar, which now runs to the window
             floor over this bar and carries it in its own footer block —
             PinsDrawer.vue). It renders HERE only when that column is not
             standing, which today means MOBILE (≤600px, where both side
             widgets hide) or a closed pins panel — exactly the arrangement the
             burger has on the left end, where the drawer owns the chip while
             it stands. Never both at once.

             Same block either way: the `.tack-slot` is the pinned column
             (--dock-rail-w minus the hairline that stands in for its left
             border) and the tack itself is a 24px circle floating centred
             inside it, exactly like the parked chips float in their well. Flat
             inverted-brown chip, same skin as the drawer's Back button (NOT
             Quasar's push preset); its floating count badge shows how many
             pins you have. -->
        <div v-if="showTack" class="tack-slot">
          <q-btn
            round unelevated no-caps
            class="tack-btn"
            :class="{ 'is-pinned': isCurrentPinned }"
            :disable="!pinnable"
            @click="onTackClick"
          >
            <q-icon name="push_pin" size="13px" :class="{ 'tack-filled': isCurrentPinned }" />
            <q-badge v-if="pinsCount > 0" floating color="amber-9" text-color="black"
              class="pins-count-badge">{{ pinsCount }}</q-badge>
            <q-tooltip>{{ pinnable ? (isCurrentPinned ? 'Unpin this' : 'Pin this') : 'Open a node, post, label or skeleton to pin it' }}</q-tooltip>
          </q-btn>
        </div>
      </div>

    </div>

    <!-- ── NO FLOOR BAND SINCE 2026-08-12 (user ask: "remove the brown
         frieze header from the top of the screen and also the one from the
         bottom of the screen, below the footer bar"). A FriezeBar in the
         crown strip's pale palette closed the window here from 2026-08-02,
         mounted INSIDE the q-footer so Quasar's page inset grew with it —
         which is why --nav-footer-h was `--nav-bar-h + --frieze-h` and is
         simply --nav-bar-h again now. The drawer and the pinned column each
         repeated the band across their own columns and dropped it with this
         one, so the floor is the bar's row edge to edge. ── -->
  </q-footer>

  <!-- ── There is NO `.nav-top-shadow` box here anymore (2026-08-02, user
       ask: "remove any effects or overlayers on top of the nav bar — its
       color differs from the left drawer color"). The bar and the drawer are
       the same `--brown-1`; what made them read as different materials was
       everything CASTING onto the bar, and that box was one of them. The
       whole family is gone — see the `.nav-footer` z-index note in the style
       block for the one change that stops the rest. ── -->

  <!-- ── Minitab strip: the minimized maker/uploader/builders/chat park here
       as folder tabs standing ON the frieze footer band (2026-07-27). It
       lives OUTSIDE the q-footer for the reason the deleted
       `.nav-top-shadow` box did: the footer WAS a z-2600 stacking context
       and the band is opaque at 3000, so nothing inside the footer could
       ever paint over it — the strip is a lifted sibling instead, fixed at
       the bar's top edge with a z that clears the band AND the expanded
       docks (taskbar semantics: a parked tab stays clickable under an open
       window). The footer outranks the band now (3110), but the strip stays
       lifted: 3045 is what keeps it over every dock and under the drawer. The stack/pins side
       panels narrow to thin icon columns on the right edge instead
       (StackPanel/PinsDrawer `is-parked`). ── -->
  <div class="minitab-strip" :style="{ right: minitabRight }">
    <TransitionGroup name="minitab-pop">
      <button
        v-for="t in parkedTabs"
        :key="t.key"
        type="button"
        class="minitab"
        :title="t.title"
        @click="t.restore"
      >
        <q-spinner v-if="t.busy" size="12px" color="primary" />
        <q-icon v-else :name="t.icon" size="13px" :class="'minitab__icon--' + t.key" />
        <span class="minitab__label">{{ t.label }}</span>
        <span v-if="t.meta" class="minitab__meta mono">{{ t.meta }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWindowsStore } from 'src/stores/windows'
import { useMakerStore, draftLabel } from 'src/stores/maker'
import { useUploaderStore, uploadLabel } from 'src/stores/uploader'
import { useSkeletonBuilderStore, builderLabel } from 'src/stores/skeletonBuilder'
import { useLabelMakerStore } from 'src/stores/labelMaker'
import { useChatStore } from 'src/stores/chat'
import { useDashboardStore } from 'src/stores/dashboard'
import { useEventsStore } from 'src/stores/events'
import { pinService } from 'src/services/pin.service'
import GlobalSearch from 'src/components/shared/GlobalSearch.vue'

export default defineComponent({
  name: 'NavigationBar',
  components: { GlobalSearch },
  emits: ['toggle-drawer', 'open-maker', 'open-uploader', 'open-skeleton-builder', 'open-label-maker', 'pins-changed'],
  props: {
    // Increment to force a pin-state refresh from the parent (e.g. after the
    // PinsDrawer unpins something so the tack indicator updates).
    pinsRefreshKey: { type: Number, default: 0 },
    // Does the LEFT rail block belong to this bar right now? True only when
    // no drawer stands (MainLayout owns the call) — the drawer carries the
    // burger in its own footer block on these same pixels while it is there,
    // so exactly one of the two renders it at any moment.
    showBurger: { type: Boolean, default: false }
  },
  setup (props, { emit }) {
    const route = useRoute()
    const windows = useWindowsStore()
    const makerStore = useMakerStore()
    const uploaderStore = useUploaderStore()
    const skeletonBuilderStore = useSkeletonBuilderStore()
    const labelMakerStore = useLabelMakerStore()
    const chatStore = useChatStore()
    const dashboardStore = useDashboardStore()
    const events = useEventsStore()

    // (There WAS an `underlaid` computed here — `route.path === '/feed'`,
    // 2026-08-02 → 2026-08-12 — that stepped this bar down to z 2999 so the
    // feed column could paint over its plaque. The column stops on the bar's
    // top edge now, so no route gives way any more; see the style block.)

    // ── Chat window toggle (footer-button semantics) ─────────
    const chatExpanded = computed(() => chatStore.isOpen && !chatStore.isMinimized)
    const toggleChat = () => {
      if (!chatStore.isOpen) chatStore.open()
      else if (chatStore.isMinimized) chatStore.restore()
      else chatStore.close()
      // Surfacing the dock is SEEING the queue — the badge's coarse v1
      // semantics (every event kind lands in a chat surface or the polls
      // band one click away). Targeted per-event acks live in ChatDock.
      if (chatStore.isOpen && !chatStore.isMinimized && events.unreadCount > 0) {
        events.ackAll()
      }
    }

    // ── Dashboard window toggle (2026-08-10) ─────────────────
    // Read STRAIGHT off its own store, the way chat is, because the panel
    // became a dock in its second pass: it rises from this bar with the other
    // creative windows and parks as a minitab on it, so the bar is one of the
    // two surfaces that own it and has no business being told about it from
    // above. (Its flyout pass took a `dashboardOpen` prop from MainLayout —
    // that prop and its `toggle-dashboard` emit are gone.) Same three-step
    // toggle the chat button has: closed → open, parked → restore, standing →
    // close.
    const dashboardExpanded = computed(() => dashboardStore.isOpen && !dashboardStore.isMinimized)
    const toggleDashboard = () => {
      if (!dashboardStore.isOpen) dashboardStore.open()
      else if (dashboardStore.isMinimized) dashboardStore.restore()
      else dashboardStore.close()
    }

    // ── PIN state ────────────────────────────────────────────
    // Parse the current route to determine what (if anything) is pinnable.
    // /nodes/:id, /nodes/:id/edit, /posts/:id, /labels/:id, /skeletons/:id
    const currentPinTarget = computed(() => {
      const m = route.path.match(/^\/(nodes|posts|labels|skeletons)\/(\d+)/)
      if (!m) return null
      let type = m[1].slice(0, -1) // strip trailing 's' → node/post/label/skeleton
      if (type === 'post') type = 'skeleton' // posts ARE skeletons (C1 migration)
      return { targetType: type, targetId: parseInt(m[2]) }
    })
    const pinnable = computed(() => !!currentPinTarget.value)
    const isCurrentPinned = ref(false)
    const pinsCount = ref(0)

    const refreshPinState = async () => {
      try {
        const list = await pinService.list()
        if (list.success) pinsCount.value = list.pins.length
        if (currentPinTarget.value) {
          const t = currentPinTarget.value
          const r = await pinService.check(t.targetType, t.targetId)
          isCurrentPinned.value = !!(r.success && r.pinned)
        } else {
          isCurrentPinned.value = false
        }
      } catch (_) { /* unauthenticated or backend down — ignore */ }
    }

    const onTackClick = async () => {
      const t = currentPinTarget.value
      if (!t) return
      try {
        if (isCurrentPinned.value) {
          await pinService.unpin(t.targetType, t.targetId)
        } else {
          await pinService.pin(t.targetType, t.targetId)
        }
        await refreshPinState()
        // Let the pins window/rail reload — MainLayout routes this back
        // down as PinsDrawer's refresh-key.
        emit('pins-changed')
      } catch (_) { /* ignore — surface via tooltip later */ }
    }

    onMounted(refreshPinState)
    // Re-check whenever the route changes (so the tack reflects the new page).
    watch(() => route.path, refreshPinState)
    // Re-check when parent signals a pin-list mutation (e.g. unpin from drawer).
    watch(() => props.pinsRefreshKey, refreshPinState)

    // ── The bar carries NO identity actions since 2026-08-02: profile and
    // logout both moved into the left drawer, whose own profile block states
    // the acting identity (and wears a mask chip while acting as an
    // alter-ego). The whole navigation section — back/forward, checkpoints,
    // the step + current-title readout — went with them; navStore is not
    // read here anymore. ──

    // ── Pins/stack windows live in the windows store and have NO footer
    // button anymore — both dock flush to the top edge and are reached via
    // their own rail chrome + persisted state. The pins panel (expanded or
    // parked) sits ON TOP of the bar and covers no buttons; the bar itself now
    // runs edge to edge with NO side padding, so the tack's 42px slot lands
    // exactly under the parked pinned column. ──

    // The minitab strip hugs the footer's top-right edge — the same band the
    // expanded pins panel (and its rail) occupy. Slide it left by
    // footerPanelInset so parked maker/uploader tabs stay clear of either.
    const minitabRight = computed(() => `${10 + windows.footerPanelInset}px`)

    // ── Minitab strip — one folder tab per minimized dock. Only the maker
    // and uploader park here; the stack/pins side panels narrow into
    // parked icon columns on the right edge instead. ──
    const parkedTabs = computed(() => {
      const tabs = []
      if (makerStore.isOpen && makerStore.isMinimized) {
        tabs.push({
          key: 'maker',
          icon: 'edit_note',
          label: draftLabel(makerStore.activeDraft),
          meta: makerStore.draftCount > 1 ? `+${makerStore.draftCount - 1}` : '',
          busy: false,
          title: 'Restore the post maker',
          restore: () => makerStore.restore()
        })
      }
      if (skeletonBuilderStore.isOpen && skeletonBuilderStore.isMinimized) {
        tabs.push({
          key: 'skeletonBuilder',
          icon: 'schema',
          label: builderLabel(skeletonBuilderStore.activeDraft),
          meta: skeletonBuilderStore.draftCount > 1 ? `+${skeletonBuilderStore.draftCount - 1}` : '',
          busy: false,
          title: 'Restore the skeleton builder',
          restore: () => skeletonBuilderStore.restore()
        })
      }
      if (labelMakerStore.isOpen && labelMakerStore.isMinimized) {
        tabs.push({
          key: 'labelMaker',
          icon: 'label_important',
          label: labelMakerStore.selected?.name || 'labels',
          meta: '',
          busy: false,
          title: 'Restore the label maker',
          restore: () => labelMakerStore.restore()
        })
      }
      if (uploaderStore.isOpen && uploaderStore.isMinimized) {
        tabs.push({
          key: 'uploader',
          icon: 'upload',
          label: uploadLabel(uploaderStore.activeUpload),
          meta: uploaderStore.uploadCount > 1 ? `+${uploaderStore.uploadCount - 1}` : '',
          busy: uploaderStore.busyCount > 0,
          title: 'Restore the uploader',
          restore: () => uploaderStore.restore()
        })
      }
      if (chatStore.isOpen && chatStore.isMinimized) {
        tabs.push({
          key: 'chat',
          icon: 'forum',
          label: 'chats',
          meta: '',
          busy: false,
          title: 'Restore the chat window',
          restore: () => chatStore.restore()
        })
      }
      // The dashboard panel parks HERE (2026-08-10, user ask: "for the
      // dashboard, make it a tab on the bottom nav footer bar"). It costs one
      // entry and nothing else — the strip was already the parking lot for
      // every window that rises from this bar, and the panel joined those
      // windows in the same pass.
      if (dashboardStore.isOpen && dashboardStore.isMinimized) {
        tabs.push({
          key: 'dashboard',
          icon: 'sym_o_empty_dashboard',
          label: 'dashboard',
          meta: '',
          busy: false,
          title: 'Restore the dashboard panel',
          restore: () => dashboardStore.restore()
        })
      }
      return tabs
    })

    // ── Does the TACK belong to this bar right now? ──────────
    // Mirror of `showBurger` at the other end (which MainLayout owns): the
    // pinned column carries the tack in its own footer block while it stands,
    // so the bar renders one only when that column is absent — on mobile,
    // where both side widgets hide, or if the panel is ever closed. Exactly
    // one of the two is on screen at any moment.
    const showTack = computed(() => windows.isMobile || !windows.panels.pins?.open)

    return {
      pinnable,
      isCurrentPinned,
      pinsCount,
      onTackClick,
      showTack,
      minitabRight,
      chatExpanded,
      toggleChat,
      dashboardExpanded,
      toggleDashboard,
      events,
      parkedTabs
    }
  }
})
</script>

<style lang="scss" scoped>
// All colors source from --ink, --paper, --aqua, etc. defined in _tokens.scss.
// The bar is a flat brown-1 plaque — the SAME surface vocabulary as the
// docked windows (.dock-window) so the minitabs parked on its top edge
// read as folder tabs attached to the bar, not floating chips. The ONE
// section painted brown-4 instead is the pin-tack slot at the right end.

.nav-footer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  // ── THE BAR IS THE TOPMOST FIXED CHROME (2026-08-02) ──
  // It sat at 2600 for a year, under everything, and that ONE number is why
  // the bar never looked like the drawer it is painted the same colour as:
  // nothing OVERLAPS the bar's box (the drawer, the frieze band, the pins/
  // stack widgets and the creation docks all stop at `bottom:
  // var(--nav-footer-h)`, which is this bar's top edge) — but every one of
  // them casts a DROP SHADOW that spills across that line, and at z 2600 the
  // bar received all of it: the maker/uploader dock's `0 12px 38px` at 45%
  // black straight down its whole width, the drawer's `6px 0 22px` reaching
  // ~11px below its own bottom, the pins widget's `0 -10px 40px` reaching
  // ~10px. Three overlapping washes on an otherwise flat brown-1 plaque.
  //
  // Raising the bar above all of them is the whole fix, and it is safe
  // precisely BECAUSE nothing overlaps its box — the bar covers no panel, it
  // only stops being painted on. 3110 clears the side widgets (3100), the
  // drawer (3050 then — it is 3120 now and deliberately lies OVER this bar's
  // empty left end, see MainLayout), the minitab strip (3045), every dock (3010+), the feed
  // container (3001) and the frieze bands (3000).
  z-index: 3110;
  background: transparent !important;
  box-shadow: none !important;
}

// ── NO ROUTE STEPS THIS BAR DOWN ANY MORE (2026-08-12) ──
// From 2026-08-02 `/feed` was an exception: `.nav-footer--underlaid` (a class
// bound off `route.path === '/feed'`, inside `min-width: 1024px`, widened to
// `601px` for a few hours on 2026-08-12) dropped the bar to **2999** so the
// feed column — grown to the window's floor by FeedPage's own block — could
// paint over this plaque. The bar gave way rather than the container climbing,
// because anything over 3110 is over EVERYTHING and every right-half dock
// (3010+) would have been sliced by that column on that very page.
//
// The 2026-08-12 ask ("the feed container's lower edge starts drawing from the
// top edge of the footer") ended it: the column stops ON this bar's top edge
// now, so nothing overlaps the bar on any route and the exception had nothing
// left to buy. Both halves are gone — this rule, and the growth block in
// FeedPage. The class and its `underlaid` computed went with them.
//
// WHAT THAT GIVES BACK, and why it is worth keeping: the one cost of 2999 was
// exactly what 3110 had bought — on `/feed` a dock's or the drawer's drop
// shadow could wash this plaque again. It cannot now. And the BURGER is safe
// at every width with no rule of its own: below 1024px the drawer is a closed
// overlay and this bar carries the burger at its left end, which the feed
// column's 2.5% gap sat on top of while the underlay reached those widths
// (specs/gotchas.md). If a surface ever needs to cover the bar again, this is
// still the way to do it — lower the BAR on that route, never raise the
// surface — but check first which controls live under it at every width.
//
// The minitab strip was never part of this: it is a lifted sibling OUTSIDE the
// footer (see its note below), so it keeps its own 3045 regardless.

// ── Minitab strip — ON the frieze footer band itself (2026-07-27; it stood
// on the band's TOP edge from 2026-07-25, back when nothing inside the
// footer could out-paint the opaque z-3000 strip). A lifted FIXED sibling of
// the footer now (see the template comment), so it can: `bottom:
// var(--nav-footer-h)` seats every tab's bottom edge exactly on the bar's
// top edge — the band's own bottom — and the 26px tabs stand over the 27px
// band rather than floating a band-height above it. z 3045: over the band
// (3000), the feed container (3001) and every dock (3010+, so a parked tab
// stays clickable while another window is expanded — taskbar semantics),
// under the drawer (3120) and the side widgets (3100). `right` is bound
// inline (base 10px, shifted left by the pins-widget inset) so parked tabs
// clear that column.
.minitab-strip {
  position: fixed;
  bottom: var(--nav-footer-h);
  right: 10px;
  z-index: 3045;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  transition: right 0.18s ease;
}

.minitab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(var(--ink-rgb-deep), 0.35);
  border-bottom: none;
  border-radius: 9px 9px 0 0;
  // Folder tabs attached to the brown-1 plaque — same flat color, no blur.
  background: var(--brown-1);
  color: var(--ink-1);
  cursor: pointer;
  // NO CAST (2026-08-02, user ask). It wore `0 2px 8px` onto the frieze band
  // it stands over, and that DOWNWARD reach — at the bar's own top edge —
  // is exactly what made a parked tab look like it hovers above the bar
  // instead of being attached to it. A folder tab is stuck to its drawer;
  // the shared brown-1 face and the border are what say so.
  box-shadow: none;
  transition: background 0.12s;

  &:hover {
    background:
      linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.35)),
      var(--brown-1);
  }
}

// Distinctive icon tint per window, mirroring each window's header icon.
.minitab__icon--maker           { color: #00829c; }
.minitab__icon--uploader        { color: #7b52ab; }
.minitab__icon--skeletonBuilder { color: #5b6c82; }
.minitab__icon--labelMaker      { color: #00829c; }
// The dashboard's tab is the only GREY mark in the strip, matching its button
// four pixels above it and the coat of the window it restores — `--grey-9`,
// the same #424242 the pebble letters its glyph in (2026-08-10).
.minitab__icon--dashboard       { color: #424242; }

.minitab__label {
  font-family: var(--font-mono);
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  max-width: 24ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.minitab__meta {
  font-size: 0.64em;
  color: var(--ink-soft);
  background: rgba(var(--ink-rgb), 0.08);
  border-radius: 7px;
  padding: 0 5px;
}

.minitab-pop-enter-active, .minitab-pop-leave-active { transition: transform 0.16s ease, opacity 0.16s ease; }
.minitab-pop-enter-from, .minitab-pop-leave-to { transform: translateY(8px); opacity: 0; }

// The nav-btn base styling lives in src/css/_components.scss (light glass
// pebbles) — only per-variant tweaks remain here.

.nav-bar {
  display: grid;
  // minmax(0, 1fr) for the slack track, NOT a bare 1fr: an `auto` minimum
  // would let the middle claim its content's min-width and squeeze the two
  // edge clusters — the rail blocks at the ends are the last thing on this
  // bar allowed to move (2026-08-02, mobile pass).
  grid-template-columns: auto minmax(0, 1fr) auto;
  // STRETCH, not center — each section fills the bar's full height so its
  // hairline (section border or `.nav-divider`) touches the top and bottom
  // edges with no vertical inset. The sections center their own buttons.
  align-items: stretch;
  // No padding at all: the bar runs edge to edge so the right cluster's last
  // 42px (hairline + tack) lands exactly under the parked pinned column.
  padding: 0;
  // Flat brown-1 plaque — one clean color, no sheen gradients, no blur. The
  // BODY of the bar stays pale: the ONE section wearing the darker brown-4 coat
  // is the pin-tack slot at the right end, which continues the parked pinned
  // column down through the bar (2026-07-24).
  background: var(--brown-1);
  // Top lip BACK to --brown-3 (end of 2026-07-25; it was brown-3, went
  // brown-4 on 2026-07-24, and returns now). FriezeFooter used to park on
  // this edge wearing the crown strip's own brown-3 lip — with the bar in
  // brown-4 the two hairlines bounding the band read as different lines. On
  // brown-3 they were one material, and the bar keeps the tone (2026-08-04:
  // FriezeFooter is gone, retired in favour of the pale floor band, but this
  // edge stays brown-3 — the frieze's lip, the drawer's border-right and this
  // edge all share the raw brown-3 hex regardless). (The brown-4 frame the
  // bar used to keep survives at the tack slot's block.)
  border-top: 1px solid var(--brown-3);
  // NO box-shadow here, and no cast anywhere on this bar anymore
  // (2026-08-02) — see the `.nav-footer` z-index note above.
  // Exact height — the BAR'S OWN ROW. From 2026-08-02 to 2026-08-12 that was
  // a distinction: a --frieze-h floor band stood below this plaque and
  // --nav-footer-h was the pair. The band is gone (user ask) and the two
  // tokens now name the same line, which is still THIS plaque's top edge —
  // where the pinned column, the drawer, every creation dock and the minitab
  // strip all seat their bottom edges.
  height: var(--nav-bar-h);
  position: relative;
  user-select: none;
  // The pinned side panel (expanded panel OR parked column) sits ON TOP of the
  // bar and covers no buttons — the pin tack occupies that same 42px column
  // right beneath it, which is why there is no right inset left here.
}

// ── Three sections ─────────────────────────────────────────
// Each is a full-height grid cell (the bar stretches them) that centers its own
// buttons, so the section borders below run the WHOLE bar height. NEITHER edge
// section carries an outside inset anymore: the tack sits flush against the
// right screen edge under the parked pinned column, and the burger sits flush
// against the left one under the drawer's mini rail.
.nav-left, .nav-right {
  display: flex;
  align-items: center;
}
.nav-left  { gap: 0; padding: 0;         border-right: 1px solid var(--brown-3); }
// Tighter with the shortened bar (2026-08-02: gap 8 → 6, inset 6 → 5) — the
// cluster keeps the same proportion of air around 24px buttons that it had
// around 30px ones.
.nav-right { gap: 6px; padding-left: 5px; border-left:  1px solid var(--brown-3); }

// When the tack is NOT in this bar, the pinned column standing over the bar's
// right end is what holds it — and that column is OPAQUE at z 3120, so the
// cluster has to keep out from under it or the last create button is simply
// covered (2026-08-02: it was, for the length of one screenshot). The reserve
// is exactly `--dock-rail-w`, the same 42px the tack's own slot + hairline
// took, so the cluster does not move when the two arrangements swap. An
// EXPANDED pins panel (300px) still overlays more of the bar — that state is
// a transient hover overlay that parks itself on mouse-leave, and it is the
// same bargain the left drawer strikes with this bar's empty left end.
.nav-right--railed { padding-right: var(--dock-rail-w); }

// While the drawer stands it owns this end of the bar (its own footer block
// draws the rail block + hairline on these very pixels), so the section keeps
// its grid track but renders NOTHING: no block, and no closing hairline either
// — a lone brown-3 line at x=0 under the drawer's shadow reads as a seam in a
// surface that is supposed to be continuous.
.nav-left--bare { border-right: none; }

// The middle is now pure slack — no content, no padding, just the 1fr track
// that holds the two edge clusters apart.
.nav-center { min-width: 0; }

// Every inner hairline on the bar is brown-3 and spans the FULL bar height
// (`align-self: stretch`, no fixed height) — the section borders above and
// these dividers all carry that ONE lighter ink (2026-07-24, a step up from
// brown-4), so the lines drawn INSIDE the bar read softer than the brown-4
// edges that bound it: the bar's own `border-top` and the two rail blocks at
// its ends, where the drawer's mini column and the parked pinned column land.
.nav-divider { width: 1px; align-self: stretch; background: var(--brown-3); flex-shrink: 0; }

// Chat — the conversation window's button. Aqua treatment on purpose:
// this is where entities talk, not another maker pebble.
.nav-bar .chat-btn {
  font-family: var(--font-display);
  font-size: 0.7em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-2);
  flex-shrink: 0;

  :deep(.q-btn__content) { gap: 4px; }

  &:hover, &.is-active {
    background: var(--aqua-3);
    color: var(--ink-1);
    border-color: rgba(var(--ink-rgb-deep), 0.50);
  }
}

// Dashboard — THE ONE GREY CONTROL ON THIS BAR (2026-08-10). `.nav-btn`'s
// base is a light-green-1 pebble (search and chat wear it); this one restates
// face, rim and ink in the flyout family's own neutrals — a `--grey-3` face
// with a `--grey-4` rim, which is exactly the plaque-and-border pair of the
// box it opens, and `--grey-9` ink for the glyph. So the button is a chip of
// the panel, sitting between two coloured groups it belongs to neither of.
//
// The rim is the one departure from the pebble base, whose 40% ink border is
// what makes the green ones read as glass: at `--grey-4` on `--grey-3` the
// edge is the flyout's own 1.06:1 hairline, quiet by construction, and the
// `--brown-3` hairlines on either side of the button are what actually
// bracket it on the bar.
//
// ACTIVE (the panel is standing) steps the face one level down to `--grey-4`
// and the rim one up to `--grey-6` rather than lighting an accent: this
// button's whole statement is that it is the neutral one, and the pressed
// state of a grey object is a darker grey. It is the same shape of answer the
// chat button gives with `is-active`, in the colorway this one owns.
.nav-bar .dashboard-btn {
  background: var(--grey-3);
  border-color: var(--grey-4);
  color: var(--grey-9);
  flex-shrink: 0;

  .q-icon { color: var(--grey-9); }

  &:hover:not(.disabled), &.is-active {
    background: var(--grey-4);
    border-color: var(--grey-6);
    color: var(--grey-10);

    .q-icon { color: var(--grey-10); }
  }
}

// ── Button bundles (Quasar q-btn-group push) — light-blue-1 pebbles.
// Quasar's push preset paints the 3D bottom lip AND the press animation
// natively, so there is NO extra colored ledge shadow here (the old
// surface-4 "blue" ledge is gone) — just the light-blue-1 face color.
.nav-bundle {
  border-radius: var(--radius-sm);
  flex-shrink: 0;

  // 24px on 8px of side padding since the bar was shortened to 2/3
  // (2026-08-02; it was 30px/10px) — the same box `.nav-btn` takes in
  // _components.scss, so the chat pebble, the search pebble and these four
  // read as one row.
  :deep(.q-btn) {
    min-height: 24px;
    height: 24px;
    padding: 0 8px;
    background: #e1f5fe;   // Quasar light-blue-1
    color: var(--ink-1);
    border: 1px solid rgba(var(--ink-rgb-deep), 0.40);

    &:not(:first-child) { border-left: none; }
  }
}

// ── The two RAIL BLOCKS at the bar's ends ───────────────────
// One grammar, mirrored (2026-08-02). Each is its side's column continued
// down through the bar — the drawer's 42px mini rail on the left, the parked
// pinned column on the right — so the window is bounded by two matching
// vertical strips that run from the crown strip to the bottom of the screen.
// Both wear the columns' darker brown-4 coat instead of the bar's brown-1
// plaque, and both are exactly --dock-rail-w wide COUNTING the hairline that
// closes them (hence the `- 1px`) — the left block + `.nav-left`'s
// `border-right` = 42px, the same 42px `q-drawer` gets from `:mini-width`, so
// the drawer's rail and this block share both edges to the pixel.
//
// NEITHER CASTS A SHADOW ANYMORE (2026-08-02). They wore the shared
// `--shadow-side-edge` (the burger's mirrored, x-offset sign flipped) to read
// as raised strips lying on the bar — but an inward cast is ink painted onto
// the plaque right where it meets the block, which both darkened the bar and
// made each 41px block read ~5px wider than the 42px column above it. The
// blocks are flat now and state their edges with tone alone.
.burger-slot, .tack-slot {
  width: calc(var(--dock-rail-w) - 1px);
  flex: 0 0 auto;                          // never compressed, at any width
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;                 // the chip floats centred, padded both sides
  background: var(--brown-4);
}

// ── Pin tack ────────────────────────────────────────────────
// The SLOT is the parked pinned column continued down through the bar: the
// hairline before it + this box add up to exactly `--dock-rail-w` (42px) flush
// against the screen edge, so that hairline lands on the same pixel as the
// parked column's own left border and the two read as one uninterrupted
// right-edge column (the PIXEL still lines up; the ink no longer matches —
// that divider went brown-3 with the bar's other hairlines on 2026-07-24,
// while the column's border above stays brown-4. What carries the edge down
// here is the brown-4 BLOCK, not the line.) It wears the column's DARKER brown-4 coat
// (2026-07-24) instead of the bar's brown-1 plaque, and casts the shared
// `--shadow-side-edge` leftward ON TOP of the bar — the same cast the stack/
// pins widgets throw above it, so the whole right-edge column reads as one
// raised strip. `position: relative` + z-index keep that cast above the bar's
// own plaque and the create bundle beside it.
.tack-slot {
  margin-left: -6px;                       // cancel .nav-right's gap — butt against it
}

// The chip itself is a small CIRCLE with no inner padding, floating in its
// slot. It was 28px — the parked column's own chip box — until the bar went to
// 2/3 height on 2026-08-02: 28px leaves under 2px of air in a 31px content
// box, so the chip is 24px here while the column's chips upstairs keep their
// 28px. The floating rhythm is what the two share, not the diameter. Skin is the drawer's Back button, NOT Quasar's push preset:
// a flat inverted brown chip — solid brown-8 fill, matching brown-8 rim so
// there is no contrasting outline, brown-1 glyph, a hairline inset highlight
// along the top, and a brown-7 lift on hover. The burger wears it too.
.nav-bar .tack-btn,
.nav-bar .burger-btn {
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

  .q-icon { color: var(--brown-1); transition: transform 0.14s ease; }

  &:hover:not(.q-btn--disable) {
    background: #5d4037;                   // Quasar brown-7 — lifts on hover
    border-color: #5d4037;
  }

  // On a pinned element the chip INVERTS — a flat brown-1 face with a brown-8
  // outline + pushpin. Rim and pushpin were brown-4, which went invisible once
  // the SLOT under them was painted brown-4 (2026-07-24); brown-8 restores the
  // outline — the same ink the unpinned chip's own face and rim carry.
  &.is-pinned {
    background: var(--brown-1);
    color: var(--brown-8);
    border-color: var(--brown-8);
    box-shadow: none;                      // no inset highlight on the pale face

    .q-icon { color: var(--brown-8); }
    // 22° rotation to mimic a pushpin pressed in.
    .q-icon.tack-filled { transform: rotate(-22deg); }

    &:hover { background: var(--brown-1); }
  }
}

// The quarter turn that stands the burger on end while the drawer is
// collapsed. The shared chip rule above already transitions `transform` on
// `.q-icon` (it is what tips the pushpin), so toggling the drawer ROTATES
// the mark rather than swapping it — the two icons share the three-bar
// figure, so `menu_open` lands on the same shape mid-turn.
.nav-bar .burger-btn .burger-glyph--upright {
  transform: rotate(90deg);
}

// The burger does NOT invert the way the tack does. The tack's pale face
// states a fact about the PAGE (this element is pinned) that nothing else on
// screen carries; the drawer's own presence states its state already, and a
// permanently pale chip on the left would break the twinning the whole block
// exists for. The glyph alone says which way the toggle goes.

// Create bundle — aqua accent, same grammar as before the bundling.
.create-bundle {
  :deep(.create-btn) {
    color: var(--ink-2);

    &:hover {
      color: var(--ink-1);
      background: var(--aqua-3);
    }
  }
}

.pins-count-badge {
  font-size: 0.62em !important;
  padding: 0 4px !important;
  min-height: 12px !important;
  letter-spacing: 0;
}

// The event spine's unread count on the chat button — same tiny amber
// treatment as the pin tack's counter (they share the bar; one voice).
.chat-unread-badge {
  font-size: 0.62em !important;
  padding: 0 4px !important;
  min-height: 12px !important;
  letter-spacing: 0;
}

// ── The top-edge cast is GONE (2026-08-02) ─────────────────
// `.nav-top-shadow` — the lifted transparent sibling box that traced the bar
// at z 3040 to throw a ~9px cast upward — is deleted along with every other
// effect touching this bar. The bar's `border-top` states the edge on its
// own, and the bar now reads as the same flat material as the left drawer,
// which is the point.

// ── MOBILE (2026-08-02) ────────────────────────────────────
// Kept in sync with the 600px breakpoint in `css/_components.scss` and
// MOBILE_MQ in `stores/windows.js`. The bar has ONE job at 375px: hold both
// rail blocks at their full 42px — they are the ONLY way to reach the drawer
// (burger) and to pin the page (tack) on a phone, since the stack/pins side
// widgets are hidden at this width — and fit the middle cluster beside them
// without a single button riding over another.
//
// The rail blocks are already `flex: 0 0 auto` and the slack track is
// `minmax(0, 1fr)`, so the compression all happens in the right cluster:
// every gap tightens, both hairline dividers drop (the cluster is short
// enough here to read as one group without them), and each button loses its
// side padding down to the icon plus a hair.
@media (max-width: 600px) {
  .nav-right {
    gap: 4px;
    padding-left: 3px;
  }

  // Both `.nav-divider`s live in `.nav-right`; nothing else on the bar uses
  // one anymore.
  .nav-divider { display: none; }

  // Search + chat: square-ish icon pebbles.
  .nav-bar .nav-btn {
    min-width: 30px;
    padding: 0 5px;
  }

  // The four create buttons — the widest thing in the cluster. 10px of side
  // padding each is 80px of the screen spent on air.
  .nav-bundle :deep(.q-btn) {
    min-width: 30px;
    padding: 0 5px;
  }

  // The tack butts against `.nav-right`'s gap, which just shrank.
  .tack-slot { margin-left: -4px; }

  // Parked tabs stand on the same band; a long draft title would otherwise
  // run the strip off the left edge of a 375px screen.
  .minitab { padding: 0 8px; }
  .minitab__label { max-width: 9ch; }
}
</style>
