<template>
  <q-footer class="nav-footer">

    <div class="nav-bar">

      <!-- ── THE TRAIL (2026-08-23, two user asks the same sitting) — the LEFT
           DRAWER'S OWN SECTION-DIVIDER BAND, laid across this bar at its
           vertical middle with the whole button row standing on it. It is
           literally that element: an unflipped `FriezeBar` wearing the SIDE
           CHROME TRIO's flat greys, and `.nav-frieze` joins that palette rule
           BY NAME in `_components.scss` (a quartet now, not a trio) rather
           than copying three paints into this file.

           It differs from the drawer's four in ONE number, and that number is
           the second ask ("place them over the new frieze bar, like the frieze
           bar is a trail for the buttons … or make the frieze bar a little
           higher if needed"): the band stands at the family's NEXT PIXEL-DRAWN
           STEP UP — 28px on an `auto 26px` fit, 2px a motif row where the
           drawer's 15px band gives 1px — so the buttons ride INSIDE the trail
           instead of straddling it. 28px is arithmetic, not taste: the masks
           are a 13-row grid and only `13n` of mask + the component's own 2px
           of pad lands on the pixel grid, so this family's sizes are 15 → 28
           → 41 and there is nothing between them.

           ABSOLUTE, and the reason that is safe is the trap this file already
           records one block down: `.nav-bar`'s children are UNPOSITIONED grid
           cells, so anything positioned paints OVER them (which is why the
           plaque's veil is a background layer and not a `::before`). The band
           takes `z-index: 0` and the two edge sections are lifted to 1 — the
           only z-pair on this bar, and the whole reason the buttons read as
           standing ON the trail. The empty middle is deliberately NOT lifted:
           the trail crosses it.

           ⭐ 2026-08-30 WALKED THIS BAND THREE TIMES IN ONE DAY: it wore the
           HEADER BAND first ("put the same inner friezebar of the top header
           bar on the footer bar inner friezebar" — `slim`, one wave, the
           cyan→indigo ramp on the grey-8 plate), the SWAP then traded it the
           header's recolor (the bar's own coat as plate, flat grey-6 wave),
           and the day's LAST ask brought THE DRAWER'S OWN PATTERN BACK
           ("changing the svg-pattern to the one on the inner friezebars from
           the left drawer, with the 2 svgs well drawn instead of the single
           tiny one") — `slim` OFF, exactly the route the style block always
           named for the second depth's return: BOTH waves draw again, mask
           `a` + mask `b`, inked grey-5 (wave one) and grey-6 (wave two) on
           the coat under a 60% grey-4 veil (the walk: grey-8/grey-6 one
           pass, inverted to grey-6/grey-7, then the veil ask stepped both
           lighter and greyed the plate — the style block has each stage).
           The trail is
           literally the drawer's element again for the first time since the
           morning — same two masks, same fit — differing in its height and
           in wearing its bar's own coat under darker inks. ── -->
      <FriezeBar class="nav-frieze" />

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
      <div class="nav-left">
        <!-- ⚠ THE BURGER IS DORMANT (2026-08-31, user ask: hide the left
             drawer — "we may resucitate it later"). MainLayout's showBurger
             is pinned false while the drawer is disabled, so this block
             never renders; it stays in the template because the drawer's
             resurrection is one flag away and the button belongs with it. -->
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
        <!-- ── THE IDENTITY SECTION (2026-08-31, user ask) — the drawer's
             profile/organizations block relocated to the bar's very left
             end, BEFORE the stack strip, standing the bar's WHOLE height
             (the stack strip rides the 21px trail; this section owns the
             full row the way the burger/tack slots do). The chip is the
             identity window's opener and parked face at once; the stack
             strip starts BESIDE it at `left: var(--nav-id-w)` — the
             never-covered bargain the burger's 42px slot used to strike
             with it. -->
        <div class="identity-slot">
          <IdentityChip />
        </div>
      </div>

      <!-- ── CENTER: deliberately EMPTY (2026-08-02). The back/forward pair,
           the checkpoint trio, the step + current-title readout and the
           checkpoint dropdown all lived here; they are gone. Navigation
           history is reached through the drawer's Back button and the stack
           widget — inside this bar's own left run since 2026-08-30 (its
           parked strip stands OVER this bar's left region from z 3130,
           beside the burger slot) — and the current element names itself on
           the page. What is left is the slack that pushes the right cluster
           to its edge. ── -->
      <div class="nav-center" />

      <!-- ── RIGHT: the five trail chips (four makers · chat) — and, on
           MOBILE only, the fallback pin tack. ⭐ SINCE 2026-09-02 (user ask)
           THIS CLUSTER ENDS `--pins-strip-w` (90px since 2026-09-03 — three
           pills; `--stack-w` before) SHORT OF THE DASHBOARD BLOCK: the
           PINS STRIP rides the trail there (PinsDrawer — the stack strip's
           mirror, a fixed overlay at z 3120), so the cell pads right by the
           strip's own width the way the trail stops at the stack strip's
           edge on the left; the trail drag's right flank is that strip's
           left edge. The DASHBOARD BUTTON LEFT this cluster the same day
           for its own full-height end cell (`.nav-end`, below). Neither
           the pins nor the stack panel has a toggle here — each is reached
           through its strip (hover / head-glyph tap). ── -->
      <div class="nav-right">
        <!-- Chat: the conversation window (distinctive teal treatment —
             chats are where entities meet, not another maker). The UNREAD
             BADGE (Thread A) rides it: the event spine's live unread count
             — messages, polls, invites, grants, comments all land here or
             one click away. Opening the dock marks the queue seen (coarse
             v1 ack; see stores/events.js). -->
        <!-- ── The four creation windows: post maker · skeleton builder ·
             label maker · uploader. FOUR SEPARATE BUTTONS SINCE 2026-08-23
             (user ask: "separate each button so that each one of them is an
             individual button"). They were a Quasar `q-btn-group` from
             2026-07-24 — one slab, `border-left: none` on all but the first so
             the four shared three lines instead of drawing six — and the group
             element is GONE, not just unstyled: it was the thing fusing them.
             Each now closes its own box and takes `.nav-right`'s own 6px gap
             from its neighbours, exactly like the chat and dashboard chips, so
             the bar holds SIX buttons of one kind rather than two singles and
             a slab.

             They carry `.nav-btn` now — the bar's one button rule — and
             `.create-btn` is kept purely as a NAME: no rule reads it (the aqua
             hover it used to carry went when the bar took one shared hover),
             but the witness flow and the docs address these four by it. ── -->

        <!-- ── ⭐ THE TRAIL IS A SLIDER (2026-08-30, user ask: "transform the
             frieze bar … into a horizontal sliding bar … I want to grab a
             button and move it horizontally across the footer. When I'm
             blocked by another button, then I shouldn't be able to move
             forward"). Every trail chip now leads with a GRIP — a
             `drag_indicator` handle behind a hairline (`.nav-btn__grip` /
             `__grip-rule`, in `.nav-btn`'s block in _components.scss) — and
             dragging that grip walks the chip along the band via a
             `translate` offset (windows.trailOffsets, persisted). The drag
             clamps ONCE at pointer-down against the other five chips and the
             trail's two fixed flanks (the parked stack strip / burger slot on
             the left, the tack divider or the railed reserve on the right),
             so a chip STOPS at whatever it meets — no pushing, no tunneling,
             no reordering. The grip swallows its own clicks (a handle is not
             an opener); the chip's body keeps the window toggle, and the
             window each chip opens rides the same offset live — see
             `--trail-shift` in `.dock-window--creation`. Layout never moves:
             `translate` paints the chip off its flow seat, so the grid
             equalisation, gaps and section tracks underneath are untouched.
             Desktop-only: mobile hides the grips (the mobile block below) and
             `trailShiftOf` reads 0 there. ── -->
        <div class="create-row">
        <q-btn unelevated class="nav-btn create-btn" :ref="setChip('maker')" :style="chipStyle('maker')" @click="$emit('open-maker')">
          <span class="nav-btn__grip" @pointerdown="startChipDrag('maker', $event)" @click.stop>
            <q-icon name="drag_indicator" size="11px" />
          </span>
          <span class="nav-btn__grip-rule" />
          <q-icon name="add_circle_outline" size="15px" />
          <span class="nav-btn__label">POST</span>
          <q-tooltip>Make post</q-tooltip>
        </q-btn>
        <q-btn unelevated class="nav-btn create-btn" :ref="setChip('skeletonBuilder')" :style="chipStyle('skeletonBuilder')" @click="$emit('open-skeleton-builder')">
          <span class="nav-btn__grip" @pointerdown="startChipDrag('skeletonBuilder', $event)" @click.stop>
            <q-icon name="drag_indicator" size="11px" />
          </span>
          <span class="nav-btn__grip-rule" />
          <q-icon name="schema" size="15px" />
          <span class="nav-btn__label">SKELETONS</span>
          <q-tooltip>Build skeletons — define templates, populate and edit instances</q-tooltip>
        </q-btn>
        <q-btn unelevated class="nav-btn create-btn" :ref="setChip('labelMaker')" :style="chipStyle('labelMaker')" @click="$emit('open-label-maker')">
          <span class="nav-btn__grip" @pointerdown="startChipDrag('labelMaker', $event)" @click.stop>
            <q-icon name="drag_indicator" size="11px" />
          </span>
          <span class="nav-btn__grip-rule" />
          <q-icon name="label_important" size="15px" />
          <span class="nav-btn__label">LABELS</span>
          <q-tooltip>Label maker — grow, fork and reorganize label trees</q-tooltip>
        </q-btn>
        <q-btn unelevated class="nav-btn create-btn" :ref="setChip('uploader')" :style="chipStyle('uploader')" @click="$emit('open-uploader')">
          <span class="nav-btn__grip" @pointerdown="startChipDrag('uploader', $event)" @click.stop>
            <q-icon name="drag_indicator" size="11px" />
          </span>
          <span class="nav-btn__grip-rule" />
          <q-icon name="upload" size="15px" />
          <span class="nav-btn__label">UPLOADS</span>
          <q-tooltip>Upload files, links or notes</q-tooltip>
        </q-btn>
        </div>

        <!-- ── ORDER: THE FOUR CREATION CHIPS FIRST, THEN THE TWO
             WINDOW BUTTONS AT THE FAR RIGHT (2026-08-24, user ask:
             "re-arrange the buttons so that the messages and dashboard ones
             are sticking to the right end of the bar"). Chat led this cluster
             from the day the bar was built and dashboard was wedged beside it
             in 2026-08-10; both now sit AFTER the makers, so the row reads
             make · make · make · make | look · look, with the two
             window-openers hard against the bar's right end (or against
             the PINS STRIP's left edge — `.nav-right`'s `--pins-strip-w` reserve
             (`--stack-w` until 2026-09-03)
             since 2026-09-02; `.nav-right--railed`'s 42px was the pinned
             COLUMN's, gone with it).
             They are also the two chips with NO WORD — see their notes. ── -->

<!-- ── NO SEARCH BUTTON SINCE 2026-08-23 (user ask: "remove the
             search button and its functionalities"). `GlobalSearch.vue` — the
             magnifier chip plus the top-anchored dialog it opened over
             GET /api/search, Thread E's whole face since 2026-07-30 — is
             DELETED, not hidden, and this bar was its only mount. The
             ENDPOINT lives on: `NodeSearchInput.vue` (the dashboard's node
             picker) rides the same FULLTEXT shadow, so the ask took the face
             and left the spine. ── -->
        <q-btn
          unelevated no-caps
          class="nav-btn chat-btn"
          :class="{ 'is-active': chatExpanded }"
          :ref="setChip('chat')"
          :style="chipStyle('chat')"
          title="Chats — private conversations"
          @click="toggleChat"
        >
          <!-- ⭐ THE WORD IS BACK — AND ON DESKTOP ONLY (2026-08-23, user ask
               naming all six: chat → "MESSAGES"). It went icon-only on
               2026-08-02 for a reason that still holds and is exactly why the
               media query is here: the word "chat" said nothing the forum
               glyph does not, and the bar has to hold this cluster inside a
               375px screen. What changed is that the ask names a DIFFERENT
               word — MESSAGES, the thing the unread badge counts, not the
               window's name — and gates it to the width that can spend the
               pixels. Below the gate the title/tooltip still carries it. -->
          <!-- ⚠ GLYPH ONLY AGAIN, AND AS BIG AS THE CHIP ALLOWS (2026-08-24,
               user ask: "only from messages and dashboard ones, remove their
               inner text and leave the big icons only. make the icons as big
               as possible inside their containeres, removing inner padding on
               top and bottom"). MESSAGES lasted a day. The size is not a
               taste pick — it is the chip's whole CONTENT height: 21px while
               the top and bottom rims were gone, 19px again since 2026-08-30
               put the full frame back (`.nav-btn` in _components.scss;
               border-box pays the two rims out of the 21px box), so the glyph
               still fills the chip corner to corner with nothing left to
               remove. The four MAKERS keep their words; these two are the
               LOOKERS, and the row now says four labelled makers, two bare
               windows. -->
          <span class="nav-btn__grip" @pointerdown="startChipDrag('chat', $event)" @click.stop>
            <q-icon name="drag_indicator" size="11px" />
          </span>
          <span class="nav-btn__grip-rule" />
          <q-icon name="forum" size="17px" />
          <q-badge
            v-if="events.unreadCount > 0"
            floating color="amber-9" text-color="black"
            class="chat-unread-badge"
          >{{ events.unreadCount }}</q-badge>
        </q-btn>

        <!-- ── NO DIVIDER HERE ANYMORE (2026-08-24, user ask: "there are
             weird hairlines in between the buttons … make sure each button is
             separated individually and that they all hold the same style and
             then remove those hairlines"). TWO `.nav-divider`s stood inside
             this cluster — after chat and after dashboard — bracketing the
             dashboard button into "its OWN section" (2026-08-10's ask) back
             when the row was two single pebbles and a fused four-button slab
             and the lines were the only thing saying which was which. Both
             premises are gone: the group was dissolved into six identical
             chips, and the chips' own rims (side rims then; full frames
             since 2026-08-30) now state every edge. What
             was left was a full-bar-height brown-3 line cutting across the
             band and its cream margins between two of the six pairs and not
             the other three — a section marker with no sections to mark.
             `.nav-divider` survives for the TACK alone; see below. ── -->

        <!-- ── THE DASHBOARD CHIP LEFT THIS CLUSTER ON 2026-09-02 (user ask:
             "remove the draggable properties from the dashboard button and
             make the button occupy the whole height like the identity section
             on the left. Then, place the dashboards section on the right end
             of the footer nav bar") — it is the `.nav-end` cell after this
             cluster now, the identity section's mirror. Its record as a trail
             chip (2026-08-10 → 09-02: the grey looker, hairlined into "its own
             section" for a fortnight, glyph-only and chip-height since
             08-24, a slider chip with a grip since 08-30) is in git. ── -->

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

      <!-- ── ⭐ THE DASHBOARD BLOCK — the bar's RIGHT END (2026-09-02, user
           ask). The IDENTITY SECTION'S MIRROR: a fourth grid cell standing
           the bar's WHOLE content height, `--nav-dash-w` wide (42px, the
           rail-slot width), its `border-left` the closing hairline the pins
           strip stops against (`right: var(--nav-dash-w)` — the same
           never-covered bargain `.nav-left`'s `border-right` strikes with the
           stack strip). The button fills the cell: NO grip, NO hairline, NO
           `translate` — it left the trail's slider; a window that opens at
           the bar's end has nothing to ride. Coat = the bar's own
           `--plaque-coat` like the identity chip; the pressed state keeps
           the grey argument the chip carried (`--grey-4` face, `--grey-10`
           ink — the board's lines-and-well family). `sym_o_` = Material
           SYMBOLS (see the gotchas note on missing ligatures). ── -->
      <div class="nav-end">
        <q-btn
          unelevated no-caps
          class="dashboard-btn"
          :class="{ 'is-active': dashboardExpanded }"
          title="Dashboard — the panel rising from this bar"
          @click="toggleDashboard"
        >
          <q-icon name="sym_o_empty_dashboard" size="21px" />
        </q-btn>
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
       color differs from the left drawer color"). The bar and the drawer were
       the same `--brown-1` then; what made them read as different materials
       was everything CASTING onto the bar, and that box was one of them. The
       whole family is gone — see the `.nav-footer` z-index note in the style
       block for the one change that stops the rest. The pair STILL shares
       its tone: both left `--brown-1` for `--plaque-coat` on 2026-08-17 (user
       asks — the bar first, the drawer and the two right-edge widgets an hour
       later), so the observation that made this box go away holds exactly as
       written, one coat later. ── -->

  <!-- ── Minitab strip: the minimized maker/uploader/builders/chat park here
       as folder tabs standing ON the frieze footer band (2026-07-27). It
       lives OUTSIDE the q-footer for the reason the deleted
       `.nav-top-shadow` box did: the footer WAS a z-2600 stacking context
       and the band is opaque at 3000, so nothing inside the footer could
       ever paint over it — the strip is a lifted sibling instead, fixed at
       the bar's top edge with a z that clears the band AND the expanded
       docks (taskbar semantics: a parked tab stays clickable under an open
       window). The footer outranks the band now (3110), but the strip stays
       lifted: 3045 is what keeps it over every dock and under the drawer.
       The stack/pins side panels park to thin icon rails instead — pins a
       column on the right edge, the stack a chip strip inside this bar's
       left run since 2026-08-30 (StackPanel/PinsDrawer `is-parked`). ── -->
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
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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
import FriezeBar from './FriezeBar.vue'
import IdentityChip from 'src/components/identity/IdentityChip.vue'

export default defineComponent({
  name: 'NavigationBar',
  components: { FriezeBar, IdentityChip },
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

    // ── NO ROUTE THE BAR GIVES WAY TO ANY MORE (2026-08-24, user ask: "make
    // the main public feed container be drawn behind the top navigation header
    // and the footer navigation bar"). `underlaid` — a `route.path === '/feed'`
    // computed feeding `.nav-footer--underlaid`, which dropped this bar to
    // z 2999 on desktop so the feed column's 3001 could paint over the plaque
    // — is DELETED, and with it the THIRD era of that mechanism (2026-08-02 →
    // 08-12, then 08-21 → today). The column still runs y=0 to the window
    // floor; what changed is which one wins where they cross, and the ask says
    // the chrome does. So the bar is the topmost fixed chrome at every width
    // and on every route again, which is the arrangement gotchas.md prefers on
    // its own merits: no page where a dock's or the drawer's drop shadow can
    // wash this plaque, and no special rule needed to keep the burger reachable
    // on a narrow window.

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

    // ── THE TRAIL IS A SLIDER (2026-08-30) — the drag machinery ──────────
    // FIVE draggable chips (six until 2026-09-02, when the dashboard chip
    // became the bar's full-height end block); state (one px offset each)
    // lives in the windows store so the docks can ride it. This component
    // owns everything geometric: measuring, clamping, reconciling. See the
    // template note.
    const TRAIL_CHIPS = ['maker', 'skeletonBuilder', 'labelMaker', 'uploader', 'chat']
    const chipEls = {}
    const setChip = (key) => (inst) => {
      chipEls[key] = inst ? (inst.$el || inst) : null
    }
    // `translate`, not `transform`: it never collides with a transition class,
    // and it does not disturb the flex/grid layout the chips are seated in.
    const chipStyle = (key) => ({ translate: windows.trailShiftOf(key) + 'px 0' })

    // The slider's two fixed flanks. LEFT: the identity section at the bar's
    // left end (2026-08-31 — it replaced the burger's 42px rail slot when
    // the drawer was hidden; measured live rather than read off --nav-id-w
    // so the media override follows for free) — or the parked stack strip
    // riding the band beside it, whose z 3130 would bury any chip dragged
    // beneath it. RIGHT (mirrored since 2026-09-02): the parked PINS strip
    // riding the band before the dashboard block, opaque at z 3120 for the
    // same reason — else the cluster's content edge (its `--stack-w`
    // padding is that strip's reserve), or the tack's divider on mobile.
    const trailBounds = () => {
      let left = 42
      const idSection = document.querySelector('.nav-bar .nav-left')
      if (idSection) {
        const r = idSection.getBoundingClientRect()
        if (r.width > 0) left = Math.max(left, r.right)
      }
      const strip = document.querySelector('.stack-window.is-parked')
      if (strip) {
        const r = strip.getBoundingClientRect()
        if (r.width > 0) left = Math.max(left, r.right)
      }
      let right = window.innerWidth
      const divider = document.querySelector('.nav-bar .nav-divider')
      if (divider) {
        right = divider.getBoundingClientRect().left
      } else {
        const nr = document.querySelector('.nav-bar .nav-right')
        if (nr) right = nr.getBoundingClientRect().right - parseFloat(getComputedStyle(nr).paddingRight || '0')
      }
      const pinsStrip = document.querySelector('.pins-window.is-parked')
      if (pinsStrip) {
        const r = pinsStrip.getBoundingClientRect()
        if (r.width > 0) right = Math.min(right, r.left)
      }
      return { left, right }
    }

    const startChipDrag = (key, e) => {
      if (windows.isMobile) return
      e.preventDefault()
      e.stopPropagation()
      const el = chipEls[key]
      if (!el) return
      const grip = e.currentTarget
      // Capture retargets every later pointer event — and the trailing
      // click — onto the grip, whose @click.stop swallows it: releasing a
      // drag over the chip's own body must not toggle its window.
      try { grip.setPointerCapture(e.pointerId) } catch (_) { /* older engines — window listeners still work */ }
      const startX = e.clientX
      const startOffset = windows.trailShiftOf(key)
      const rect = el.getBoundingClientRect()
      const bounds = trailBounds()
      // Clamp the WHOLE GESTURE once, at pointer-down: the other five chips
      // and the two flanks are walls that do not move during this drag, so a
      // min/max pair per direction blocks at contact and a fast pointer
      // cannot tunnel through a chip between two move events.
      let minD = bounds.left - rect.left
      let maxD = bounds.right - rect.right
      for (const k of TRAIL_CHIPS) {
        if (k === key || !chipEls[k]) continue
        const o = chipEls[k].getBoundingClientRect()
        if (!o.width) continue
        if (o.left >= rect.right) maxD = Math.min(maxD, o.left - rect.right)
        else if (o.right <= rect.left) minD = Math.max(minD, o.right - rect.left)
        // A chip already overlapping (a stale persisted state) is no wall —
        // the drag is exactly how the user frees it.
      }
      const move = (ev) => {
        const d = Math.min(Math.max(ev.clientX - startX, minD), maxD)
        windows.setTrailOffset(key, startOffset + d)
      }
      const up = () => {
        grip.removeEventListener('pointermove', move)
        grip.removeEventListener('pointerup', up)
        grip.removeEventListener('pointercancel', up)
        windows.persistTrail()
      }
      grip.addEventListener('pointermove', move)
      grip.addEventListener('pointerup', up)
      grip.addEventListener('pointercancel', up)
    }

    // Persisted offsets were measured against SOME OTHER layout — another
    // viewport width, another word gate, a longer stack strip. Reconcile
    // walks the chips in visual order and shoves any that landed out of
    // bounds or into each other back to legality: one left-to-right pass off
    // the left flank, one right-to-left pass off the right. Runs after
    // mount, on resize, and whenever the parked strip grows a step.
    let reconcileTimer = null
    let stripObserver = null
    const reconcileTrail = () => {
      if (windows.isMobile) return
      const bounds = trailBounds()
      const entries = TRAIL_CHIPS
        .filter((k) => chipEls[k])
        .map((k) => {
          const r = chipEls[k].getBoundingClientRect()
          return { k, left: r.left, right: r.right, w: r.width }
        })
        .filter((x) => x.w > 0)
        .sort((a, b) => a.left - b.left)
      let moved = false
      let edge = bounds.left
      for (const it of entries) {
        if (it.left < edge - 0.5) {
          const d = edge - it.left
          windows.setTrailOffset(it.k, windows.trailShiftOf(it.k) + d)
          it.left += d
          it.right += d
          moved = true
        }
        edge = it.right
      }
      edge = bounds.right
      for (let i = entries.length - 1; i >= 0; i--) {
        const it = entries[i]
        if (it.right > edge + 0.5) {
          const d = it.right - edge
          windows.setTrailOffset(it.k, windows.trailShiftOf(it.k) - d)
          it.left -= d
          it.right -= d
          moved = true
        }
        edge = it.left
      }
      if (moved) windows.persistTrail()
    }
    const queueReconcile = () => {
      clearTimeout(reconcileTimer)
      reconcileTimer = setTimeout(reconcileTrail, 150)
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

    onMounted(() => {
      refreshPinState()
      // The slider's housekeeping: re-clamp restored offsets once the bar
      // (and the two strips flanking the trail) have painted, again on
      // every resize, and again whenever a PARKED strip changes size (both
      // are fixed `--stack-w` since 2026-09-02, so this fires only when the
      // dial moves; the is-parked guard keeps a hover-EXPANDED panel, a
      // transient, from shoving chips around).
      window.addEventListener('resize', queueReconcile)
      setTimeout(reconcileTrail, 400)
      if (window.ResizeObserver) {
        setTimeout(() => {
          const strips = [...document.querySelectorAll('.stack-window, .pins-window')]
          if (strips.length) {
            stripObserver = new ResizeObserver((entries) => {
              if (entries.some((e) => e.target.classList.contains('is-parked'))) queueReconcile()
            })
            strips.forEach((el) => stripObserver.observe(el))
          }
        }, 600)
      }
    })
    onBeforeUnmount(() => {
      window.removeEventListener('resize', queueReconcile)
      if (stripObserver) stripObserver.disconnect()
      clearTimeout(reconcileTimer)
    })
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
    // button anymore — both ride this bar's trail as strips (stack at the
    // left run since 2026-08-30, pins at the right run beside the dashboard
    // block since 2026-09-02) and are reached through them. ──

    // The minitab strip hugs the footer's top-right edge. `footerPanelInset`
    // reads 0 since 2026-09-02 (no side widget stands at the right edge any
    // more); the seam is kept so a future right-edge widget insets it again.
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
    // pins widget carries the tack in its EXPANDED HEADER while it stands
    // (in its rebuilt bar row until 2026-09-02, when its column became the
    // trail strip), so the bar renders one only when that widget is absent
    // — on mobile, where both strips hide, or if the panel is ever closed.
    // Exactly one of the two is on screen at any moment.
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
      parkedTabs,
      setChip,
      chipStyle,
      startChipDrag
    }
  }
})
</script>

<style lang="scss" scoped>
// All colors source from --ink, --paper, --aqua, etc. defined in _tokens.scss.
// The bar's plaque is `--plaque-coat` — a --light-cream sheet under a
// --grey-3 veil at 30%, shared with the left drawer and the two right-edge
// widgets since 2026-08-17. It was --brown-1 for a year (flat --grey-4 for one
// earlier ask the same day), and brown-1 is still the CREATION docks' coat, so
// the surface vocabulary this bar shares has changed hands: it reads with the
// fixed chrome now, not with the windows that rise from it. The minitabs
// parked on its top edge read as folder tabs attached to the bar by SHARING
// its face, and they no longer do — they keep --brown-1, so what says
// "attached" is the tab's border and its seat on the edge, not the material.
// The ONE section painted brown-4 instead is the pin-tack slot at the right
// end, and the top lip is --grey-6 — the bar's hardest line and the one piece
// of its brown frame that left with this pass.

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
  // ~10px. Three overlapping washes on an otherwise flat plaque (brown-1 then;
  // a --light-cream sheet under a --grey-3 veil since 2026-08-17 — the
  // argument is about ink cast ON the coat and holds at any tone, and holds
  // HARDER on a two-layer one: a drop shadow landing on the bar would read as
  // a third layer in a stack that already has two).
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

// ── …EXCEPT ON /feed, WHERE THE FEED COLUMN STANDS ON IT AGAIN (2026-08-21,
// user ask: the container "drawn on top of the header and footer bars. From
// the very top to the very bottom") ──────────────────────────────────────
// THIRD ERA of this exception. It ran 2026-08-02 → 08-12 (the column grew to
// the window floor and this bar stepped to 2999 under the container's 3001),
// was retired on 08-12 when the ask reversed ("the container's lower edge
// starts drawing from the top edge of the footer"), and is back by the same
// mechanism it always used: the BAR gives way on this one route, the
// container never climbs. The reasoning has not aged — anything over this
// bar's 3110 is over EVERYTHING, and every right-half dock and flyout viewer
// (3010+) would open BEHIND the feed column on the very page they are most
// used on.
//
// The cost is the one it always had: on `/feed` a dock's or the drawer's
// drop shadow can wash this plaque again, and the container's own lateral
// cast now falls across it. The BURGER stays safe with no rule of its own:
// desktop-gated at the same 1024px as FeedPage's growth block, and below
// that the drawer is a closed overlay, this bar carries the burger at its
// left end, and the bar stays the topmost chrome (specs/gotchas.md).
//
// The media tabs rail makes the same move at the other edge — see
// `.media-tabs--underlaid` in MediaTabsBar.vue, born with this era: the
// container runs to y=0 now, not just to the floor.
//
// The minitab strip is not part of this: it is a lifted sibling OUTSIDE the
// footer (see its note below), so it keeps its own 3045 — parked tabs stay
// clickable over the column even when it is dragged wide (taskbar
// semantics).
// ⚠ THE RULE THAT STOOD HERE IS DELETED (2026-08-24, user ask: "make the main
// public feed container be drawn behind the top navigation header and the
// footer navigation bar"). It was
// `@media (min-width: 1024px) { .nav-footer--underlaid { z-index: 2999 } }` —
// the THIRD era of a step-down that let /feed's full-window column cross this
// plaque. The column is unchanged and still runs y=0 to the floor; the ask
// settles which one wins at the crossing, and it is the chrome. The doctrine
// the eras were negotiating is untouched and still the reason no one should
// simply raise the container instead: anything over this bar's 3110 is over
// every dock too, and the maker/chat/flyout windows (3010+) would open BEHIND
// the feed on the page they are most used on. LOWER THE BAR ON THE ROUTE or
// leave the container underneath — never raise the surface.

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
  // Folder tabs on the bar's top edge, flat, no blur. This face WAS the
  // plaque's own — same tone, which is what said "attached". The bar's coat
  // became a --light-cream sheet under a --grey-3 veil on 2026-08-17 and the
  // tabs did NOT follow (the ask was the bar's background), so the strip is
  // brown-1 on a paler, warmer plaque now and the border + the seated bottom
  // edge carry the attachment alone. Rejoining is one line, not one token, if
  // the strip should read attached by material again: the tab would take the
  // bar's whole two-layer background, sheet and veil together.
  background: var(--brown-1);
  color: var(--ink-1);
  cursor: pointer;
  // NO CAST (2026-08-02, user ask). It wore `0 2px 8px` onto the frieze band
  // it stands over, and that DOWNWARD reach — at the bar's own top edge —
  // is exactly what made a parked tab look like it hovers above the bar
  // instead of being attached to it. A folder tab is stuck to its drawer; the
  // border is what says so (the shared brown-1 face said it too until the bar
  // took its cream-under-veil plaque — see the background note above).
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

// The nav-btn base styling lives in src/css/_components.scss — CREAM CHIPS ON
// THE TRAIL since 2026-08-23 (they were light glass pebbles, a light-green-1
// face under a 40% ink rim, from the day this bar was built). Only per-variant
// tweaks remain here, and there is far less of that than there was: the whole
// bar wears ONE face now, so what is left per button is its ACTIVE state.

.nav-bar {
  display: grid;
  // minmax(0, 1fr) for the slack track, NOT a bare 1fr: an `auto` minimum
  // would let the middle claim its content's min-width and squeeze the two
  // edge clusters — the rail blocks at the ends are the last thing on this
  // bar allowed to move (2026-08-02, mobile pass).
  // FOUR tracks since 2026-09-02: identity · slack · the trail cluster ·
  // the DASHBOARD BLOCK (`.nav-end`, the identity section's mirror at the
  // bar's right end — user ask). ⚠ Where the long note below says the right
  // cluster's "last 42px (hairline + tack) lands under the parked pinned
  // column", read: the cluster ends `--stack-w` short of the dashboard
  // block, and the PINS STRIP rides the trail in that reserve.
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  // STRETCH, not center — each section fills the bar's full height so its
  // hairline (section border or `.nav-divider`) touches the top and bottom
  // edges with no vertical inset. The sections center their own buttons.
  align-items: stretch;
  // No padding at all: the bar runs edge to edge so the right cluster's last
  // 42px (hairline + tack) lands exactly under the parked pinned column.
  padding: 0;
  // ── THE PLAQUE: --light-cream UNDER A --grey-3 VEIL AT 30% ──
  // (2026-08-17, user asks: "make it light-cream and put a 60% transparented
  // grey-3 layer on top of it", then "make the veil 30%". The bar spent that
  // same session at flat --grey-4 — the ask before those — and --brown-1 for
  // every day before that.) TWO LAYERS, not one flat coat, which is the POST
  // CARD's own construction moved onto a bar: a warm sheet with a cool neutral
  // wash laid over it (`.post-square::before`, FeedStream.vue). The wash is
  // what keeps the cream from reading as a yellow bar — it pulls the sheet's
  // warmth back toward the platform's neutrals without ever leaving the light
  // half of the scale. HALVING it (60% → 30%) is a move along that one line:
  // composited the pair goes rgb(243,240,232) → rgb(247, 241, 228) (sampled off the rendered bar), so the
  // plaque lightens a touch and its warmth roughly doubles (R−B 11 → 19,
  // against the 6 that --brown-1 held for a year here). At 30% the cream is
  // the material you read and the grey is a tint on it; at 60% they met in
  // the middle. Either way the plaque stays PALER than the brown-1 it
  // replaced — this bar got lighter and warmer at once.
  //
  // The layer is a flat two-stop gradient over the fill rather than a
  // `::before` — the same idiom `.minitab:hover` uses above, and the reason is
  // structural: `.nav-bar`'s children are unpositioned grid cells, so a
  // positioned pseudo-element with `inset: 0` would paint OVER the buttons
  // instead of under them. As a background layer the veil is between the
  // sheet and the content by construction, with no z-index to keep straight.
  //
  // The bar's FRAME stays brown — brown-3 inner hairlines, brown-4 rail blocks
  // at both ends, brown-8 chips floating in them — and the top lip is the ONE
  // piece of it that left (--grey-6 now, see below). THE DRAWER AND BOTH
  // RIGHT-EDGE WIDGETS TOOK THIS COAT the same session (`--plaque-coat`), so
  // the window's four chrome edges are one material again, as they were in
  // brown-1. The MINITAB STRIP parked on this bar's top edge is the one
  // surface that did not follow: it is still --brown-1, and what says a parked
  // tab belongs to the bar is its border and its seat on the edge, not the
  // face. One line closes that if it should — the tab takes both layers.
  //
  // The BODY of the bar stays pale: the ONE section wearing the darker brown-4
  // coat is the pin-tack slot at the right end, which continues the parked
  // pinned column down through the bar (2026-07-24).
  // Both layers ride in ONE token, `--plaque-coat` (_tokens.scss) — a
  // background LAYER LIST, not a colour. It was spelled out here for the hour
  // this bar was the only surface wearing it; the drawer and the two
  // right-edge widgets took the same coat the same session, so the veil's
  // strength is one edit for all four now.
  // ⭐ THE TRAIL'S HEIGHT IS ONE NUMBER — `--nav-trail-h` — FOR THREE OBJECTS
  // NOW, AND IT MOVED TO `:root` (_tokens.scss) ON 2026-08-30: it was
  // declared HERE, on the bar (2026-08-23, "touch the bar, but within the
  // frieze bar"), because its two consumers — `.nav-frieze`, which takes it
  // as `--frieze-bar-h` two rules down, and `.nav-btn` in `_components.scss`
  // — both live in this bar's subtree and custom properties inherit.
  // ⚠ THE CHIPS READ IT THROUGH `--nav-chip-h` NOW (trail − 2px, declared
  // beside it), not directly: since the day's closing ask they fill the
  // band's INTERIOR — touching its two rules from inside — instead of
  // covering the rules themselves. Still ONE authored number; the derived
  // dial keeps the fit from drifting.
  // The
  // STACK WIDGET'S PARKED STRIP became the third consumer when it moved
  // inside this band (its height AND its bottom-centring formula both read
  // the dial), and it is a `position: fixed` element OUTSIDE this subtree —
  // the one place a bar-scoped declaration cannot reach. Same law, wider
  // scope: there is still only one number, and moving it moves the band,
  // every chip in it and the stack strip together. The odd-parity warning
  // travelled with the declaration.
  background: var(--plaque-coat);
  // ── Top lip --grey-6 (2026-08-17, user ask) ──
  // It was --brown-3 from the end of 2026-07-25 (brown-4 for one day before
  // that), and the argument for brown-3 was a JOINT that no longer exists:
  // FriezeFooter parked on this edge wearing the crown strip's own brown-3
  // lip, and two hairlines bounding that band had to be one material. The band
  // was retired on 2026-08-04 and the lip kept the tone out of family loyalty
  // — this edge, the frieze's lip and the drawer's border-right all carried
  // the same raw hex. With the plaque now a cream sheet under a cool wash,
  // that loyalty was the last thing holding a warm line at the bar's most
  // structural edge, and --grey-6 (#9e9e9e) states it as a LINE instead: 2.4:1
  // on the composited face, where brown-3 on the old brown-1 plaque sat at
  // 1.9:1 — the bar's top edge is drawn now rather than implied, and the
  // veil setting barely moves it (2.36:1 at 60%, 2.38:1 at 30%). NOTE the lip is the only piece of the
  // frame that moved: the inner hairlines (`.nav-left`/`.nav-right` borders
  // and `.nav-divider`) are still brown-3, which INVERTS the old relation —
  // the lines drawn inside the bar used to be the softer ones, and the edge
  // that closes it is now the hardest line on the bar by a wide margin. That
  // is the ask, and it is worth knowing before touching either half.
  border-top: 1px solid var(--grey-6);
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

// ── THE TRAIL (2026-08-23) ──────────────────────────────────
// The band the buttons stand on — see the template note for what it is and
// why it is absolute. Only its BOX lives here; its three paints come from the
// side-chrome frieze rule in `_components.scss`, which `.nav-frieze` joins by
// name, exactly as StackPanel and PinsDrawer keep their own heights beside
// that same shared palette.
//
// ⚠ CENTRED BY ARITHMETIC, NOT BY `top: 50%` — and the formula PAIRS WITH THE
// HEIGHT'S PARITY (2026-08-23; the first half was caught by the witness flow,
// not by eye). An absolutely positioned box lays out against its ancestor's
// PADDING box, and this bar is 32px INCLUDING a 1px `border-top` lip — so that
// box is 31px, an ODD number, and a plain `top: 50%` + half-height translate
// put the band on HALF PIXELS, which is exactly the fuzz this band's row
// arithmetic exists to prevent. Two formulas land on whole pixels, one per
// parity, and they differ by exactly the lip:
//
//   ODD  height → `(--nav-bar-h - 1px - --frieze-bar-h) / 2`   ← today's, 21px
//        centres the band in the bar's FIELD: equal cream above and below,
//        with the lip drawn on top of the upper margin. An odd band fits an
//        odd box exactly; it cannot centre on the 32px outer box at all.
//   EVEN height → `(--nav-bar-h - --frieze-bar-h) / 2 - 1px`
//        centres on the OUTER box and borrows the lip's pixel to do it (the
//        24px band's rule for the hour it stood).
//
// SWAP THE FORMULA IF THE HEIGHT CHANGES PARITY, or the band goes fuzzy for a
// reason nothing on screen explains.
.nav-frieze {
  position: absolute;
  left: 0;
  right: 0;
  top: calc((var(--nav-bar-h) - 1px - var(--frieze-bar-h)) / 2);
  // Under the button row, over the empty middle. THE one z-pair on this bar.
  z-index: 0;

  // ── 21px ON `auto 19px` — THE BAND THAT CONTAINS ITS BUTTONS (⚠ THE FIT
  // IS FROM 2026-08-30's CLOSING ASK, the height is the block below's own;
  // that ask moved the CHIP, not the band — `--nav-chip-h` = band − 2px,
  // the interior, so the rung arithmetic here is untouched and the cream
  // margins are still 5px a side. A 25px pass was tried and rejected the
  // same sitting.) 2026-08-23,
  // two asks: "considerably more padding … between the top and bottom edges of
  // the footer bar and the frieze bar. Also inside the frieze bar, between the
  // top and bottom edges and the friezes … kind of the same height as the left
  // drawer inner friezes, without deformating the frieze pattern" took it from
  // 24px to 17px; "make the frieze bar slightly thicker … and then adjust the
  // inner buttons height so they fit well inside the frieze bar" brought it
  // here). Everything on this bar is ZERO-SUM in 32px and the arithmetic says
  // so exactly: at 1px a row the ink is 11px (11 inked rows of 13), so
  // `band + 2×cream = 31` and every 2px of band converts 1px of cream into 1px
  // of plate. Crisp rungs, all odd: 15 (2px plate / 8px cream — the drawer's
  // literal recipe) → 17 (3 / 7) → **21 (5 / 5)** → 23 (6 / 4) → 25 (7 / 3).
  //
  // WHY 21 AND NOT 19, when the ask said "slightly": the second half of it —
  // buttons INSIDE the band, with "very tiny" padding "so we can have big
  // icons" — sets the floor. A chip needs a 2px shoulder of band above and
  // below to read as contained, and its glyph gets the chip less its two 1px
  // rims, so the chain is band − 4 = chip, chip − 2 = icon. At 19px that lands
  // a 13px glyph, SMALLER than the 14px this bar already had; at 21px it lands
  // 15px, which is the first rung where "fit inside" and "big icons" are both
  // true. Going further is a straight trade of cream for glyph: 23px gives a
  // 17px icon on 4px of cream, 25px a 19px icon on 3px.
  //
  // ⚠ THE ROWS ARE 1px NOW, NOT 2px, AND THAT IS THE POINT, NOT A COST — it is
  // the drawer's exact fit (`auto 13px`: the 231×143 file tiling at 21×13), so
  // the two surfaces draw ONE pattern at ONE scale, which is precisely what
  // "the same height as the left drawer inner friezes, without deformating"
  // asks for. 2px rows cannot survive at this thickness at all: their ink alone
  // is 22px, so a 2px-row band is 24px at its very thinnest and there is no
  // cream left to give. The trimmed-to-ink trick the 24px band used (mask
  // overflowing the box so the empty rows fall outside) is the OPPOSITE move
  // and went with it — the whole file sits inside the box again, plus room.
  //
  // ⭐ SO THE FIT IS NOT STATED HERE ANYMORE: it comes from the shared chrome
  // frieze rule in `_components.scss` along with the three paints, exactly as
  // it does for the drawer's four bands and the stack/pins' three. This band
  // now differs from those seven in ONE number — its height, 17px against
  // their 15px — which is the least a fourth wearer has ever differed by, and
  // the right amount for a rule that exists so a shared treatment is shared by
  // NAME. (It restated `auto 26px` for the hour it ran 2px rows; that override
  // is deleted, not merely equal to the inherited value.)
  --frieze-bar-h: var(--nav-trail-h);

  // ── ITS OWN COLORWAY — GREY-8 PLATE, CREAM MOTIF (⚠ BOTH halves are
  // HISTORY since 2026-08-30 — the cream motif went in the morning, the
  // grey-8 plate with the evening's SWAP; the band wears the bar's own coat
  // under a flat grey-6 meander now — see the ⭐ block at the dials)
  // (2026-08-23, three asks:
  // "make the frieze bar's from the footer bar background color light-cream
  // and paint the inner friezes grey-3 and grey-4", then "make the footer
  // bar's inner frieze bar's background grey-6 and the inner friezes
  // light-cream" — the same two families, swapped — then "try grey-8 on the
  // background", two steps deeper on the plate alone). THIS IS WHY `.nav-frieze`
  // IS NOT IN `_components.scss`'s GROUPED RULE: that rule is one PALETTE
  // shared by name, and a band stating its own three paints has nothing left
  // to take from it. The trio was a quartet for half a day and is a trio again.
  //
  // The swap put the band back in the family's NORMAL orientation — a LIGHT
  // motif on a DARK plate, like the side chrome's grey-2/-4 on grey-8 and the
  // component's own brown-2/-1 on brown-4 — after one hour inverted, which is
  // the only inverted frieze the platform has ever drawn. Two consequences of
  // coming back, both worth knowing:
  //  · THE CARVE IS LEGAL AGAIN. FriezeBar's groove reads only when the ink is
  //    lighter than the plate it is cut into, so the inverted hour forbade it
  //    outright; it is still OFF below, but now for the trio's reason alone (at
  //    band scale the black/white flanks read as grime) rather than by law.
  //  · THE BAND IS LOUD NOW, where the cream-on-cream hour made it a
  //    watermark: `--light-cream` on `--grey-8` is about **4.4:1**, the
  //    strongest this band has read — cream on `--grey-6` gave 2.4:1 for the
  //    hour between, and that pairing had a tie this one gives up (grey-6 is
  //    the bar's own top lip and the side chrome's line ink, so the plate was
  //    drawn in the ink the bar's structural lines already use, with the chips'
  //    `--grey-6` rims matching the plate exactly).
  //  · WHAT THE DEEPER PLATE BUYS INSTEAD is a tie to the OTHER bands:
  //    `--grey-8` is the side chrome trio's own plate ("keep the dark
  //    background", `_components.scss`), so the drawer's dividers, the
  //    stack/pins bands and this trail all stand on ONE plate again and differ
  //    only in the motif's hue — cool greys up the sides, warm cream along the
  //    floor. That is a closer relation to the rule this band left than it had
  //    at grey-6, and it is the reason this pick is not just "darker".
  //  · AND THE CHIPS' RIMS INVERT THEIR ROLE: `--grey-6` on `--grey-8` is a
  //    LIGHTER hairline on a darker plate, where at grey-6 the rim and plate
  //    were one tone and the chip's edge fell entirely to its cream face. Each
  //    chip is now outlined rather than merely cut out.
  //
  // ⚠ BOTH WAVES TOOK ONE TONE for the cream era (2026-08-23 → 08-30), which
  // was new for this component then. Everywhere else the two masks are told
  // apart by VALUE as well as by shape; the ask named one colour for "the
  // inner friezes", so the interleave read as a SINGLE meander — flatter, and
  // the right answer for a band this size.
  // ⭐ THE TOP RAIL'S BAND, FOR PART OF 2026-08-30 (user ask: "put the same
  // inner friezebar of the top header bar on the footer bar inner
  // friezebar"; ⚠ SUPERSEDED the same day by the SWAP — the ⭐ block at the
  // dials below) —
  // the same sitting that took the header back to `slim` put this trail in
  // the same dress: ONE wave (mask `b`, the template's `slim`), `--teal-11`
  // flat fallback, and the header's own cyan→indigo `-paint` ramp down the
  // wave. What moves is the BAND'S LOOK; what deliberately does not is this
  // bar's ARCHITECTURE: the 21px trail height (buttons ride inside it — the
  // header band is 13px between two rules, a composition this bar has no
  // room for), the `auto 13px` fit and the carve staying off. Wave ONE's
  // dial LEFT with the layer (slim v-ifs it out — the dressed-but-undrawn
  // trap); if the second depth ever comes back, it starts by taking `slim`
  // off the template, not by re-dialling here. One ramp spans the layer box
  // (19px inner against the header's 11px), so the 11px of ink samples the
  // ramp's middle rather than its full run — the shared thing is the recipe
  // and the two A100 accents, exactly the relation the header band already
  // has with the post card's pair.
  // ── ⭐ THE SWAP (2026-08-30, the sitting's last ask: "invert the frieze
  // pattern on the top nav bar with the bottom footer nav bar one") ──────
  // This trail had preserved the header's OLD dress (the ⭐ block above);
  // the swap hands it back upstairs and takes the header's recolor in
  // trade: plate = THE BAR'S OWN `--plaque-coat` (the very layer list
  // `.nav-bar` paints — legal in this dial because FriezeBar spends it in a
  // `background:` shorthand, the one slot a layer list may fill), wave =
  // flat `--grey-6`, the ramp deleted with its `-paint` dial. The plate
  // composites to the bar's exact rgb, so the band VANISHES into the bar
  // and the buttons ride a bare meander — no plate stripe, no frame, the
  // bar's top lip its one structural line, exactly the presentation the
  // header wore between the recolor and this ask.
  // ⚠ VALUE-INVERTED AGAIN (ink darker than plate) — the second time this
  // band has drawn that relation (the cream hour was the first) — so THE
  // CARVE IS FORBIDDEN BY LAW AGAIN, not just by the trio's grime reason:
  // FriezeBar's groove reads only when the ink is lighter than its plate.
  // ⚠ The grey-8 plate-ties argument in the colorway block above (one plate
  // with the side trio) is SUPERSEDED with the plate; the block stands as
  // the record of how the band got here. (The swap's ONE-wave half lasted
  // one ask — the block below returns the pattern to the drawer's two.)
  // ── ⭐ THE BAND TOOK A GREY VEIL AND STEPPED ITS INKS LIGHTER (2026-08-30,
  // the ask after the thickening: "add to its background a grey-4 60% veil
  // for a grey effect and for the svg patterns use grey-5 and grey-6") ───
  // The plate is the coat UNDER a 60% `--grey-4` wash now — one more
  // gradient layer stacked over `--plaque-coat` (var substitution splices
  // the coat's own two layers in after it, all in `background:` where a
  // layer list is legal; the rgba is grey-4's literal, the same way the
  // coat states its grey-3 veil). Composite ≈ rgb(234,231,226): the band
  // READS AGAIN — a soft grey stripe on the cream bar, the "grey effect" —
  // ending the vanished-plate hour (the swap's "band and bar composite to
  // the same rgb" below is that hour's record). The waves stepped one
  // lighter with it, grey-5/grey-6 over grey-6/grey-7, keeping the one-step
  // interleave; both still darker than the veiled plate, so the
  // value-inverted relation and the carve ban hold.
  --frieze-bar-base:
    linear-gradient(rgba(224, 224, 224, 0.6), rgba(224, 224, 224, 0.6)),
    var(--plaque-coat);
  // ── ⭐ AND TWO RULES FRAME IT (2026-08-30, two asks: "put a thin grey-4
  // border on the top and bottom borders of this inner friezebar", then
  // "pls make the new borders grey-5"): 1px each, the platform's line
  // weight. Grey-4, the veil's own tone, held one pass — at ~10 levels off
  // the veiled plate it barely drew — and grey-5 stood for the hour after,
  // WAVE ONE's ink, matching the chips that shared these very rows.
  // ⚠ `--grey-6` SINCE THE CLOSING ASK ("they don't look like they're
  // inside the frieze bar section"), and the tone change is half of that
  // fix: the chips gave up a row at each end (--nav-chip-h, _tokens.scss),
  // so these two rows are the band's ALONE now — no longer shared, no
  // longer obliged to match the chips' ink, and free to be the STRONGER
  // line, which is what makes the band read as the thing the chips sit in.
  // Grey-6 is this bar's own top-lip ink, so the bar's three structural
  // lines are one tone, and it is already wave two's, so the band still
  // adds no ink of its own. ~2.4:1 on the veiled plate, the same reading
  // the lip gets on the coat. ⚠ THESE TWO ROWS ARE THE ONLY HORIZONTAL
  // LINES ON THE BAND, and the chips depend on it: since the gap-closing
  // ask they draw no horizontal rims of their own, so this rule IS every
  // chip's top and bottom edge and it has to stay a uniform 1px end to
  // end. Giving the chips their rims back (in any ink) re-opens the seam
  // the ask closed.
  // ⚠ `border-box` pays them out of the 21px band: the layer (padless —
  // `--frieze-bar-pad: 0` below) is 19px, exactly what the `auto 19px` mask
  // fills and exactly the chip height — nothing clips, nothing else moves
  // (the centring formula reads the band's OUTER box).
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
  // ── ⭐ THE SECOND DEPTH CAME BACK (2026-08-30, the day's last ask:
  // "changing the svg-pattern to the one on the inner friezebars from the
  // left drawer, with the 2 svgs well drawn instead of the single tiny
  // one. For the first SVG, use grey-8 and for the other grey-6") ───────
  // `slim` came OFF the mount — the exact route the note below always
  // named — so layer ONE renders again and takes its first dial here.
  // The asked-for grey-8/grey-6 pair held one pass; the follow-up ask
  // ("invert the colors on each svg and use grey-7 instead of grey-8")
  // settled it: wave one (mask `a`) grey-6, wave two (mask `b`) grey-7 —
  // the LIGHTER ink on the thick wave, one step apart instead of two,
  // and both greys still DARKER than the coat plate, so the
  // value-inverted relation holds for both waves and the carve stays
  // forbidden by law.
  // "Well drawn instead of the single tiny one": the fixed fit below
  // draws both masks whole — nothing is squeezed. (It sat at the drawer's
  // own `auto 13px` for one pass; the thickening ask below took it to
  // `auto 17px` on a padless band.)
  // (grey-6/grey-7 held from the inversion ask until the veil ask stepped
  // both one lighter — the walk lives on the veil note above.)
  --frieze-bar-wave-one: var(--grey-5, #bdbdbd);
  --frieze-bar-wave-two: var(--grey-6, #9e9e9e);
  // The carve stays off — for the grime reason above AND, since the swap
  // re-inverted the band, by the lighter-ink law again.
  // ── ⭐ THE PATTERN GREW OFF THE PIXEL GRID (2026-08-30, the ask after the
  // two waves landed: "make the pattern slightly thicker by reducing
  // padding and size of outer components from the frieze bar") ──────────
  // Two moves, exactly the levers the ask names: the component's 1px pads
  // go to 0 through `--frieze-bar-pad` (the dial published for the header's
  // identical ask), opening the layer from 19px to the band's full 21px,
  // and the fit rises `auto 13px` → `auto 17px` — the masks draw ~1.31px a
  // row, centered by the component's own `mask-position: center`. ⚠ This
  // knowingly leaves the trio's 1px-per-row pixel grid: an upscale
  // antialiases stroke edges (soft, not the sub-pixel mush the squeezes
  // made — thickening is the ask, softness is its price). The crisp rungs
  // remain 13n: `auto 13px` to return, `auto 26px` if the band ever has
  // ~28px to spend. (The last line of this note used to read "the band
  // itself did NOT grow, because `--nav-trail-h` is also every chip's
  // height, so growing the band grows the buttons" — that constraint is
  // GONE: the chip height split off into the derived `--nav-chip-h` on
  // 2026-08-30's closing ask, and the band grew to 25px the same edit.)
  //
  // ⭐ `auto 17px` → `auto 19px` WITH THE CLOSING ASK, and the number is not
  // free-hand: the padless layer is the band less its two rules, 19px, and
  // that is EXACTLY the chip height too — so the mask fills its layer edge
  // to edge and the meander running through the 6px gaps starts and stops
  // on the very rows the chips do. The motif and the chips read as one row
  // of objects lying in the band rather than two things of different sizes.
  // (Same ~1.31px-a-row upscale as before, same softness, same escape hatch
  // at 13n.)
  --frieze-bar-pad: 0;
  --frieze-bar-fit: auto 19px;
  --frieze-bar-carve: none;
}

// ── Three sections ─────────────────────────────────────────
// Each is a full-height grid cell (the bar stretches them) that centers its own
// buttons, so the section borders below run the WHOLE bar height. NEITHER edge
// section carries an outside inset anymore: the tack sits flush against the
// right screen edge under the parked pinned column, and the burger sits flush
// against the left one under the drawer's mini rail.
.nav-left, .nav-right, .nav-end {
  display: flex;
  align-items: center;
  // ON the trail (2026-08-23). These are unpositioned grid cells by default,
  // and a positioned sibling paints over unpositioned content no matter what
  // order it is written in — so without this pair the band would swallow the
  // whole button row. `.nav-center` is deliberately left flat: it is empty,
  // and the trail is supposed to cross it.
  position: relative;
  z-index: 1;
}
// ── SINCE 2026-08-31 THIS CELL IS THE IDENTITY SECTION (user ask: the
// drawer's profile/organizations block moved "inside the footer nav bar, on
// its left end, before the stack bar", full bar height) — sized by the
// `--nav-id-w` dial (:root, _tokens.scss; 34px avatar-only below 1024px),
// with the same closing-hairline arithmetic the burger's slot used: content
// + 1px border = the dial, so the stack strip's `left: var(--nav-id-w)`
// lands exactly on this line. The `border-right` is that arithmetic, not a
// section marker — it is one of the two flanks the chip drag clamps against.
.nav-left  { gap: 0; padding: 0; width: var(--nav-id-w); border-right: 1px solid var(--brown-3); }

// The chip's seat: whatever the (dormant) burger leaves, the whole cell today.
.identity-slot {
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: stretch;
}
// Tighter with the shortened bar (2026-08-02: gap 8 → 6, inset 6 → 5) — the
// cluster keeps the same proportion of air around 24px buttons that it had
// around 30px ones.
// ⚠ NO `border-left` SINCE THE SLIDER PASS (2026-08-30): the section's
// closing hairline stood exactly where the first chip began, and the chips
// ROVE now — one drag and the line is a full-height brown-3 stroke cutting
// the trail in the middle of nowhere, the very reading that deleted the
// cluster's two `.nav-divider`s on 08-24 (a section marker with no section
// to mark). `.nav-left`'s survives: it is the burger rail's closing edge —
// arithmetic (41px block + 1px line = --dock-rail-w), not sectioning — and
// it is one of the two flanks the drag clamps against.
// ⭐ `padding-right: var(--stack-w)` SINCE 2026-09-02: the PINS STRIP rides
// the trail at this cluster's end (PinsDrawer, `right: var(--nav-dash-w)`,
// `--stack-w` wide, opaque at z 3120), so the cluster keeps its chips out
// from under it by exactly the strip's width — the chat chip, dragged all the
// way right, stops ON the strip's left rim, as POST dragged left stops on the
// stack strip's right one. It replaces `.nav-right--railed`'s 42px reserve
// for the parked pins COLUMN (2026-08-02 → 09-02; a covered create button
// was what minted it). The mobile block zeroes it — both strips hide there.
.nav-right { gap: 6px; padding-left: 5px; padding-right: var(--pins-strip-w); } // the pins strip's own width since 2026-09-03 (--stack-w before)

// ── ⭐ THE DASHBOARD BLOCK (2026-09-02, user ask) — `.nav-left`'s MIRROR at
// the bar's right end: a full-height grid cell `--nav-dash-w` wide whose
// `border-left` is the closing hairline the pins strip stops against
// (content + 1px = the dial, the identity section's arithmetic reflected),
// in the bar's inner-hairline ink. Lifted to z 1 with the other two edge
// cells (the trail crosses only the empty middle).
.nav-end {
  width: var(--nav-dash-w);
  padding: 0;
  gap: 0;
  align-items: stretch;
  border-left: 1px solid var(--brown-3);
}

// ⚠ `.nav-left--bare` IS DELETED (2026-08-31): it existed for the drawer
// standing over this end of the bar — the section kept its grid track but
// rendered nothing, hairline included. The drawer is hidden now (user ask)
// and the identity section owns this cell at every width, so there is no
// bare state left to draw.

// The middle is still pure slack — no content, no padding, just the 1fr track
// that holds the two edge clusters apart. Since 2026-08-23 it is also the one
// stretch of the trail nothing stands on: the band runs behind this cell
// (unpositioned and transparent, so it simply shows through) and the frieze is
// the only thing drawn in the middle of the bar.
.nav-center { min-width: 0; }

// ⚠ ONE WEARER LEFT (2026-08-24): the hairline before the TACK SLOT, and it is
// there for ARITHMETIC rather than for grouping — that line plus the 41px slot
// make exactly `--dock-rail-w` (42px), so it lands on the same pixel as the
// parked pinned column's own left border and the two read as one right-edge
// column. It is the pinned column's edge continued down through the bar, not a
// separator, which is why it survived the ask that deleted the other two.
//
// The two that went stood INSIDE the button cluster (after chat, after
// dashboard) and carried the bar's oldest line doctrine: every inner hairline
// brown-3 and spanning the FULL bar height (`align-self: stretch`), a step
// lighter than the brown-4 edges bounding the bar, so lines drawn inside read
// softer than the ones closing it. That doctrine now lives on in the section
// borders (`.nav-left`/`.nav-right`) alone.
.nav-divider { width: 1px; align-self: stretch; background: var(--brown-3); flex-shrink: 0; }

// ── THE SIX WORDS — DESKTOP ONLY (2026-08-23, user ask naming each one:
// MESSAGES · DASHBOARDS · POST · SKELETONS · LABELS · UPLOADS) ──────────────
// NASALIZATION comes for free: `.nav-btn` has carried `font-family:
// var(--font-display)` since the bar was built, and that token IS Nasalization
// (`_tokens.scss`; the `.nasalization` utility is the same declaration under a
// class). So the ask needed no font wiring — only a size that survives the
// chip, and a gate.
//
// THE SIZE IS SET BY THE CHIP, not chosen: the box is 17px with two 1px rims,
// so the glyph beside these words is 15px and the words have to sit inside the
// same 15px. 9px with the display face's own tracking is the largest that
// leaves the cap-line clear of both rims — nasalization is a wide face, and at
// 10px the row stopped fitting a 1024px screen before it stopped fitting the
// chip.
//
// THE GATE IS `min-width: 1024px` and it is the same line the bar already
// draws for `.nav-footer--underlaid`: the width at which the drawer stands
// open beside the page rather than over it, i.e. this platform's own
// definition of "desktop". Below it the six words are simply not rendered
// wide — `display: none`, so they cost no layout — and every button falls back
// to the glyph plus its title/tooltip, which is exactly the arrangement the
// cluster had from 2026-08-02 until this ask. The mobile block at the bottom
// of this file therefore needs no new rule: at ≤600px it is already tightening
// a cluster of six icons.
// ── THE FOUR CREATION CHIPS AS ONE MEASURE (2026-08-24, user ask: "for the
// creative ones, help me making them all have the same width on desktop") ────
// A grid whose columns are `1fr`, which in a shrink-to-fit container resolves
// to "every column as wide as the WIDEST one's content" — so SKELETONS sets the
// measure and POST, LABELS and UPLOADS take it, with no number written down.
// That is the whole reason for a grid rather than a `width` on `.create-btn`:
// the words are content, and a hard-coded box rots the day one of them changes.
//
// ⚠ THIS IS NOT A RETURN TO THE `q-btn-group` deleted two hours earlier. That
// element FUSED the four — one slab, `border-left: none` on all but the first,
// three shared lines instead of eight — and the ask against it was that each
// button be individual. This wrapper draws nothing, fuses nothing and inherits
// nothing to its children: every chip keeps its own rims, its own hover and its
// own 6px of trail either side. It equalises a MEASURE, which is the opposite
// of grouping — four chips of one size read as four peers, where four chips of
// four sizes read as a list.
//
// ONE PROPERTY switches the two states, and the gap is stated in both blocks to
// match `.nav-right`'s own (6px, 4px at ≤600px).
.create-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: auto;      // natural widths — the sub-1024px state
  gap: 6px;
  align-items: center;
}

// ── ⭐ AND THE EQUAL-WIDTH OVERRIDE IS GONE (2026-08-31, user ask: "the post
// button has an ugly gap between the icon and the text. Homogenize the inner
// spacing of the post/skeletons/labels/uploads buttons so they have the same
// spacing between text and icon and also on the sides") ─────────────────────
// `.create-row { grid-auto-columns: 1fr }` stood here from 2026-08-24 ("help
// me making them all have the same width on desktop") and it is the direct
// cause of the gap the ask names. THE TWO PROPERTIES CANNOT BOTH HOLD, and
// the arithmetic is short enough to settle it: a chip is
// `pad + grip + gap + rule + gap + glyph + gap + WORD + pad`, and the four
// words measure 26.5 · 61.4 · 40 · 48.3px. Fix every gap and both pads and
// the four widths MUST differ by exactly the word widths; force the four
// widths equal instead and that difference has to be dumped somewhere inside
// the chip. There is no third option, only a choice of where the slack goes,
// and the row has now tried all three places:
//   · split around the whole run (08-24 → 08-31 morning) — pushed the DRAG
//     HANDLE off the left rim by half the slack, which was that ask.
//   · handed to the label, word centred in it (08-31 morning → this ask) —
//     handle flush, but the slack reappeared as a hole between glyph and
//     word, worst on the shortest word. That is the "ugly gap" on POST.
//   · trailing after the word — never shipped; it just moves the same hole
//     to the right rim, where "the same spacing on the sides" forbids it.
// So the ask is really "stop equalising", and the chips size to their content
// now: identical inner spacing on all four, four different outer widths.
// ⚠ `.create-row` STAYS — it still owns the 6px gap and `align-items`, and
// `grid-auto-columns: auto` is what shrink-to-fit already meant below 1024px.
// If the equal measure is ever wanted back, it comes back WITH a decision
// about where the slack lives, not instead of one.

.nav-btn__label { display: none; }

@media (min-width: 1024px) {
  .nav-btn__label {
    display: inline;
    font-size: 9px;
    line-height: 1;
    letter-spacing: 0.05em;   // the `.nasalization` utility's own tracking
    // The words are the chip's ink, not a second colour on the bar: they take
    // whatever `color` the button states. (Until 2026-08-31 that sentence had
    // two exceptions worth naming — the dashboard chip's `--grey-9` and the
    // chat chip's `--ink-2` reached their glyphs through this same seam; both
    // chips are wordless, and both now rest in the bar's one ink anyway.)
    color: inherit;
    white-space: nowrap;

    // ⚠ THE WORD DOES NOT STRETCH. It carried `flex: 1 1 auto; text-align:
    // center` for one pass this same day — the way the `1fr` grid's slack was
    // kept off the drag handle — and the very next ask was about what that
    // did: a stretched label centres its word in a run wider than the word,
    // so POST showed ~35px of daylight between its glyph and its letters. The
    // grid stopped equalising instead (see `.create-row` below), which leaves
    // no slack for anyone to absorb and lets this element be what it reads
    // as: a word, sized by its own letters, sitting one 2px gap from the
    // glyph like every other item in the chip's content row.

    // ── ⭐ THE WORDS ARE CARVED INTO THE CHIP (2026-08-31, user ask: "add to
    // the font a subtle shadow that makes the font (not the button) look like
    // it's been carved on a surface … a very subtle depth effect") ──────────
    // LETTERPRESS, the two-lip form: a light lip BELOW the glyph and a faint
    // dark one ABOVE. That order is the whole illusion and it is not
    // interchangeable — this platform lights everything from the top-left
    // (the post flyout's well bevel is built on the same assumption), so a
    // groove cut into the plaque has its FAR wall catching the light at the
    // bottom of each stroke and its NEAR wall in shadow at the top. Flip the
    // two offsets and the same declaration reads as RAISED type instead.
    //
    // ⚠ THE SHADOW IS ON THE WORD, NOT THE CHIP — which is the ask's own
    // parenthesis ("the font (not the button)"). No `box-shadow` went near
    // `.nav-btn`: the chip stays the flat cream tile the bar's doctrine wants,
    // and the depth lives entirely inside the letterforms.
    //
    // BOTH OFFSETS ARE 1px BECAUSE 1px IS ALL THERE IS. The word sets at 9px,
    // so a lip is already a ninth of the cap height — there is no smaller step
    // available, and no blur either: at this size a blurred lip spreads across
    // two or three rows and silts up Nasalization's already-tight counters.
    //
    // ⚠ THE ALPHAS ARE MEASURED, NOT PICKED, AND THE FIRST PAIR WAS A NO-OP.
    // This shipped for one pass at white 0.75 / ink 0.08 — the numbers a
    // letterpress wants on a WHITE page — and rendering it beside a plain
    // `text-shadow: none` at 3× showed the two were indistinguishable. The
    // reason is the surface: `--plaque-flat` is #f8f2e4, so the brightest
    // possible light lip is +7 red, +13 green, +27 blue over the chip's own
    // face. There is no headroom to spend, which means the light lip must run
    // at FULL white to register at all, and the depth cue that actually does
    // the work here is the DARK one. Hence 1.0 / 0.25, and the whole reason
    // the second number looks unsubtle written down: on a cream plaque an ink
    // lip at 0.25 lands about where a white lip at 0.75 would on paper.
    // (Two variants that DID carve harder were rejected for how: both bleached
    // the word to rgba(ink, .70–.78) so the groove could show through it. That
    // buys depth with legibility at 9px, and it would re-break the one-ink row
    // this same sitting just closed — the four words are `color: inherit` off
    // `.nav-btn` precisely so they cannot drift.)
    //
    // ⚠ MAKERS ONLY, for free: chat and dashboard have no label element, so
    // this rule cannot reach them. And it lives inside the 1024px gate with
    // the words themselves — below that there is nothing to carve.
    // The value itself now lives on `.create-btn` as `--chip-carve`, so the
    // word and the glyph beside it cannot drift apart (they are one surface,
    // and their two rules sit either side of the 1024px gate).
    text-shadow: var(--chip-carve);

    // ── ⭐ SLIGHTLY BOLDER, AND NOT VIA `font-weight` (2026-08-31, same ask:
    // "the font of these buttons slightly bolder") ─────────────────────────
    // Nasalization ships as ONE WEIGHT — a single `.otf` declared
    // `font-weight: normal` in app.scss — so there is no bold face to switch
    // to. `font-weight: 500` therefore renders identical to 400 (verified: it
    // still maps to the normal face), and 600/700 make the browser SYNTHESISE
    // bold, which on a geometric display face means smearing each glyph
    // horizontally. Rendered side by side at 3× the faux weights are visibly
    // wider and softer than the stroked ones.
    //
    // ⚠ AND FAUX BOLD WOULD NOW MOVE LAYOUT. Since the equal-width grid went
    // (see `.create-row`), these words SET their chips' widths — synthetic
    // bold changes each glyph's advance, so "make it bolder" would silently
    // re-measure all four chips and the trail's clamp arithmetic with them.
    // `-webkit-text-stroke` thickens the outline symmetrically and touches no
    // metric at all: same advance, same chip, heavier stroke.
    //
    // 0.3px is the "slightly": 0.2 was indistinguishable from plain at this
    // size and 0.4 lands on 600-faux's weight, which is past what was asked.
    // `currentColor` keeps it on the chip's own ink, so this cannot become a
    // second colour on a bar that just went to one.
    -webkit-text-stroke: 0.3px currentColor;
  }
}

// Chat — the conversation window's button. Aqua treatment on purpose:
// this is where entities talk, not another maker pebble.
.nav-bar .chat-btn {
  flex-shrink: 0;

  // ── ⭐ THE LAST THREE THINGS THAT MADE THIS CHIP ITS OWN OBJECT ARE GONE
  // (2026-08-31, "homogenize their look"). All three were the ghost of the
  // WORD this button carried until 2026-08-24:
  //
  //  · `gap: 4px` on its content row — the ONE chip on the bar not on the
  //    shared 2px rhythm, and the reason its hairline stood at x=19 on five
  //    chips and x=21 on this one. Two pixels, but they landed inside the
  //    "drag icon section" the ask is about: the six handles now measure
  //    identically (grip 6, rule 19, glyph 22) and the row reads as one part
  //    repeated, which is the whole point of a slider's grips.
  //  · `font-size: 0.7em` + `letter-spacing` + `text-transform` — typography
  //    for text that no longer exists. Harmless today ONLY because the glyph
  //    states its own `size="17px"` inline; put a label back on this chip and
  //    it would have set in 9.8px against the makers' authored 9px, which is
  //    exactly the kind of silent drift this bar keeps getting caught by.
  //    `font-family: var(--font-display)` went with them — `.nav-btn` has
  //    carried it since the bar was built, so the line was a restatement.
  //  · `color: var(--ink-2)` — the resting ink. It was the visible one: at
  //    #3f506a against the makers' #1f2a38 this glyph read a step PALER than
  //    the four beside it, on a bar whose own doctrine is that every chip is
  //    one flat cream face answering the pointer in one grey. The bar's ink
  //    is `.nav-btn`'s `--ink-1` and this chip takes it like the rest.
  //
  // WHAT SURVIVES IS THE ONLY THING THAT WAS EVER LOAD-BEARING: the aqua
  // `is-active` below. Homogenising the REST state is what makes that accent
  // legible — six identical chips and one of them lit says "the chat dock is
  // standing" far louder than it could from a row of six different inks.

  // THE HOVER LEFT THE ACCENT ON 2026-08-23 and the ACTIVE STATE KEPT IT —
  // one rule split in two, which is the whole shape of that day's repaint.
  // Hover is now the bar's shared neutral step (`.nav-btn`'s own, in
  // _components.scss): every chip on the trail answers the pointer the same
  // way, because a row that reads as one material has to feel like one too.
  // What aqua still says is the one thing it alone can say — THE CHAT DOCK IS
  // STANDING — and a single accent on an otherwise cream bar states that
  // louder than it ever did while the button was coloured at rest.
  &.is-active {
    background: var(--aqua-3);
    color: var(--ink-1);
    border-color: rgba(var(--ink-rgb-deep), 0.50);
  }
}

// Dashboard — IT WAS "THE ONE GREY CONTROL ON THIS BAR" (2026-08-10) and that
// distinction ENDED ON 2026-08-23, when the user's ask took every button on
// this bar to one flat cream face: a chip cannot be the neutral one on a bar
// where neutral is the only thing there is. What that pass DELETED here is the
// resting face and rim (a `--grey-3` plate with a `--grey-4` hairline, the
// plaque-and-border pair of the box this button opens, worn so the control
// read as a chip of its own panel); what it KEPT is the ink and the pressed
// state. So the argument survives one level down: the glyph is still the
// flyout family's `--grey-9`, and the panel-is-standing state is still a
// DARKER GREY rather than an accent — the pressed state of a grey object.
// That reading is if anything cleaner now, because the darker grey it steps to
// is the trail's own family showing through the chip.
.nav-bar .dashboard-btn {
  // THE BLOCK'S BUTTON (2026-09-02): fills the `.nav-end` cell — the whole
  // 31px content row, like the identity chip beside the stack strip — in
  // the bar's own `--plaque-coat`, no rim (the cell's hairline is its edge),
  // no radius, no grip, no translate. It wore `.nav-btn` as a trail chip
  // from 2026-08-23 to 09-02; every chip declaration is gone with the class.
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--plaque-coat);
  color: var(--ink-1);

  .q-icon { color: var(--ink-1); }

  // The bar's one shared hover, `.nav-btn`'s.
  &:hover { background: var(--grey-3); }

  // ── THE PRESSED STATE KEEPS THE GREY ARGUMENT the chip carried since
  // 2026-08-10: this is the one control whose standing state is a DARKER
  // GREY rather than an accent — the board's own `--grey-4` lines-and-well
  // family showing through. If it is ever re-toned, `--grey-4` is the tone
  // to walk to; the bar's own cream never is (a button in its bar's coat
  // disappears).
  &.is-active {
    background: var(--grey-4);
    color: var(--grey-10);

    .q-icon { color: var(--grey-10); }
  }
}

// ── NO BUTTON BUNDLE ANYMORE (2026-08-23, user ask: "separate each button so
// that each one of them is an individual button"). `.nav-bundle` +
// `.create-bundle` are DELETED with the `q-btn-group` they dressed — every
// declaration in them (24px box, square corners, `--plaque-flat` face,
// `--grey-6` rim, the shared hover) is `.nav-btn`'s in `_components.scss`, so
// the four create buttons simply took that class and the two rules had nothing
// left to say. Two things the group did are gone WITH it and are worth naming,
// because they were the point of grouping: `border-left: none` on all but the
// first — the four shared three lines, so the slab read as one object cut into
// quarters — and the aqua `.create-bundle` hover, the last per-family hover on
// a bar that now answers the pointer in one grey everywhere. What separates
// them today is `.nav-right`'s own 6px gap, which is what separates every
// other chip on the bar.

// ── The two RAIL BLOCKS at the bar's ends ───────────────────
// One grammar, mirrored (2026-08-02). Each is its side's column continued
// down through the bar — the drawer's 42px mini rail on the left, the parked
// pinned column on the right — so the window is bounded by two matching
// vertical strips that run from the crown strip to the bottom of the screen.
// Both wear the columns' darker brown-4 coat instead of the bar's own plaque
// (--brown-1 when that pairing was struck; a --light-cream sheet under a
// --grey-3 veil since 2026-08-17 — the plaque got PALER, so the step that
// states these blocks reads deeper than it did, not shallower), and both are
// exactly --dock-rail-w wide COUNTING the hairline that
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
// (2026-07-24) instead of the bar's own plaque (a --light-cream sheet under a
// --grey-3 veil since 2026-08-17, --brown-1 before), and casts the shared
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
// 28px. The floating rhythm is what the two share, not the diameter.
//
// And since 2026-08-22 (user ask) the BOX is ALL they share. The two chips wore
// ONE skin — the drawer's Back button — from the day this block was twinned; the
// tack left it for the node panel's round pill and the burger kept it, so the
// rule split in three: the box both still share, then a skin each.
.nav-bar .tack-btn,
.nav-bar .burger-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
  border-radius: 50%;

  // The glide that tips the pushpin and stands the burger on end — shared,
  // because it belongs to the BOX's behaviour and to neither skin.
  .q-icon { transition: transform 0.14s ease; }
}

// ── BURGER: the drawer's Back button, NOT Quasar's push preset ──────────────
// A flat inverted brown chip — solid brown-8 fill, matching brown-8 rim so there
// is no contrasting outline, brown-1 glyph, a hairline inset highlight along the
// top, and a brown-7 lift on hover. The tack wore this too until 2026-08-22.
.nav-bar .burger-btn {
  background: var(--brown-8);
  border: 1px solid var(--brown-8);
  color: var(--brown-1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

  .q-icon { color: var(--brown-1); }

  &:hover:not(.q-btn--disable) {
    background: #5d4037;                   // Quasar brown-7 — lifts on hover
    border-color: #5d4037;
  }
}

// ── TACK: NodeMini's ROUND PILL, moved here (2026-08-22, user ask: take "the
// rounded one with the node icon inside" from the top-left corner of the node
// viewer quoted in the post cards and "use it on the bottom right's pin button",
// "instead of teal-13, use red-13") ─────────────────────────────────────────
// The material arrives whole from `.node-mini__round-pill`: a `--grey-3` fill, a
// `--grey-5` hairline RING outside the box and SEAM inside its bottom edge (both
// box-shadows, for the pill's own reason — the one border is spent on the base,
// and a shadow follows `border-radius` where an outline may not), a 2px coloured
// BASE curving along the bottom arc, `--grey-8` ink, and the hairline stroke that
// thickens a small glyph without enlarging it. ONE line differs: the base is
// `--red-13` where the pill's is teal, and that is the whole distance between the
// two objects — same material, different thing. The DIAMETER stays this chip's
// 24px rather than the pill's 18px: the slot was built around 24, and 18 is a
// fact about a header row, not about the material.
//
// What this REPLACES is an inverted brown chip whose entire grammar was VALUE —
// a dark face going pale to say pinned. The pill is a pale object in both states,
// so the state moved onto the MARK: the base closes into a full 2px ring and the
// pushpin takes the same red as ink. Hover deliberately stays off that colour
// (the face lifts to `--grey-1` instead) — the rule recorded on --teal-12/-13 is
// that an object's own mark and the pointer's are never the same at once.
.nav-bar .tack-btn {
  background: var(--grey-3, #eeeeee);
  border: 0;
  border-bottom: 2px solid var(--red-13, #ff1744);
  box-shadow:
    0 0 0 1px var(--grey-5, #bdbdbd),
    inset 0 -1px 0 var(--grey-5, #bdbdbd);
  color: var(--grey-8, #616161);

  .q-icon {
    color: var(--grey-8, #616161);
    -webkit-text-stroke: 0.35px currentColor;
  }

  // A pale chip lifts by going PALER — the mirror of the dark chip's rule in the
  // pinned column, and the reason hover has no business borrowing the base.
  &:hover:not(.q-btn--disable) { background: var(--grey-1, #fafafa); }

  // Pinned: the base closes into a ring and takes the rim's job with it, so the
  // grey hairlines stand down (`box-shadow: none`) instead of doubling it.
  &.is-pinned {
    border: 2px solid var(--red-13, #ff1744);
    box-shadow: none;
    color: var(--red-13, #ff1744);

    .q-icon { color: var(--red-13, #ff1744); }
    // 22° rotation to mimic a pushpin pressed in.
    .q-icon.tack-filled { transform: rotate(-22deg); }

    &:hover { background: var(--grey-1, #fafafa); }
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

// ── ⭐ `.create-btn` HAS A RULE AGAIN (2026-08-31, user ask: "please make the
// icons carved-looking too and the font of these buttons slightly bolder") ──
// It had been a NAME with nothing behind it since 2026-08-23, when its aqua
// hover went and the four chips took `.nav-btn` whole (see the note where
// `.nav-bundle` was). It earns a rule now because this is the first thing in
// months that is true of these FOUR and not of the six: the two lookers are
// wordless, so "carve the glyph the way the word is carved" has no meaning on
// them, and their 17px glyph is the whole chip where these are 15px marks
// beside a word.
//
// `--chip-carve` IS THE DIAL AND IT IS DECLARED ONCE. The word's carve and the
// glyph's have to move together or the chip stops reading as one surface, and
// the two live in different blocks (the word's is inside the 1024px gate with
// the words themselves; the glyph's is not, because the glyph is there at
// every width). A shared custom property is the only way to keep one number
// in one place across that split — the same trick `--nav-trail-h` plays for
// the band and its chips. Anything nested in a `.create-btn` inherits it, so
// the label rule below just reads `var(--chip-carve)`.
//
// ⚠ THE `>` IS LOAD-BEARING: the grip's handle is a `.q-icon` too, one level
// deeper inside `.nav-btn__grip`. The direct-child combinator reaches the
// BODY glyph and misses the handle, which is exactly right — the handle is
// chrome shared with chat and dashboard, and carving it on four chips only
// would break the one-part-repeated row the previous ask just bought. (The
// witness reads its glyphs the same structural way, for the same reason.)
.nav-bar .create-btn {
  --chip-carve:
    0 1px 0 rgba(255, 255, 255, 1),
    0 -1px 0 rgba(var(--ink-rgb-deep), 0.25);

  :deep(.q-btn__content) > .q-icon { text-shadow: var(--chip-carve); }
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

// ⚠ IT FLOATS AT EVERY WIDTH AGAIN (2026-08-24) — and the round trip is worth
// keeping, because it is the same rule read twice. Quasar's `floating` pins the
// count to the button's top-right and half-hangs it off the corner, which is
// right whenever that corner holds nothing. For the one day the chip wore the
// word MESSAGES, the corner belonged to the word's last letter and the count
// sat on top of it, so a `min-width: 1024px` block dropped `position: static`
// on it and the count read AFTER the word — "MESSAGES 3". The ask that took the
// word away took the collision with it, and the override is DELETED rather than
// left standing: a static badge on a glyph-only chip would widen a box whose
// whole point is that the glyph fills it.

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
    // No pins strip on a phone (both footer strips hide ≤600px), so no
    // `--stack-w` reserve either — the fallback tack takes the cluster's end.
    padding-right: 0;
  }

  // The ONE remaining `.nav-divider` is the tack slot's, and mobile is exactly
  // where the tack renders in this bar — so this rule and `.tack-slot`'s
  // `margin-left: -4px` below are a pair: drop the line, close the gap it
  // occupied. (It hid two more until 2026-08-24, when the cluster's own
  // dividers were deleted outright.)
  .nav-divider { display: none; }

  // ⚠ THE PHONE GOES WIDER THAN THE DESKTOP, DELIBERATELY (2026-08-23). The
  // base chip is 24px on 2px of padding — "very tiny", so a 17px glyph fits a
  // 19px box — and this rule OVERRIDES it upward, which reads backwards in a
  // block whose whole job is tightening. It is the one dimension where the two
  // arguments differ: on the desktop these numbers buy the glyph its size in a
  // row full of words; here there are no words (the six are gated at 1024px)
  // and the number that matters is the TAP TARGET, where 22px is under any
  // reasonable floor. So the chips keep 28px of width and 4px of side padding
  // on a phone and the row still fits 375px with the rails at their full 42px.
  .nav-bar .nav-btn {
    min-width: 28px;
    padding: 0 4px;
  }

  // No grips on a phone (2026-08-30, the slider pass): six handles+hairlines
  // cost ~90px this bar does not have at 375px, the docks run edge to edge
  // here (`translate: none` in the ≤900px block — there is no half-width
  // window left to align with a button), and `trailShiftOf` reads 0 on
  // mobile so the chips sit on their flow seats regardless of what a desktop
  // session persisted.
  .nav-bar .nav-btn .nav-btn__grip,
  .nav-bar .nav-btn .nav-btn__grip-rule { display: none; }

  // ── AND THE ROW RE-CENTRES WHEN THE HANDLE GOES (2026-08-31, the
  // homogenize ask). `.q-btn__content` packs from the start edge on the
  // desktop so the six grips line up at the left rim — but with the grips
  // hidden here, a phone chip is a lone 17px glyph in the 18px content box
  // that `min-width: 28px` floors it to, and start-packing leaves that 1px of
  // slack all on the right (measured: 5px left, 6px right). Nothing to anchor
  // to and no word to absorb it, so the glyph goes back to the middle. It is
  // the same argument as upstairs read from the other side: pack left when a
  // handle starts the run, centre when the chip is only its glyph.
  .nav-bar .nav-btn :deep(.q-btn__content) { justify-content: center; }

  // (The four create buttons were the widest thing in the cluster and took
  // their own mobile rule through `.nav-bundle` until 2026-08-23 — they wear
  // `.nav-btn` now, so the rule above already tightens all six.)

  // The creation row's own gap follows `.nav-right`'s down.
  .create-row { gap: 4px; }

  // The tack butts against `.nav-right`'s gap, which just shrank.
  .tack-slot { margin-left: -4px; }

  // Parked tabs stand on the same band; a long draft title would otherwise
  // run the strip off the left edge of a 375px screen.
  .minitab { padding: 0 8px; }
  .minitab__label { max-width: 9ch; }
}
</style>
