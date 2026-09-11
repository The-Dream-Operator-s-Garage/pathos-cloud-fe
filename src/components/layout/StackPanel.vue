<template>
  <!-- The navigation stack, STANDING THE FOOTER BAR'S WHOLE ROW at its very
       LEFT — ⭐ OUT OF THE INNER FRIEZE BAR AGAIN SINCE 2026-09-05 (user
       ask: "make the stack and pin bars inside the frieze bar be outside the
       friezebar, like the author and dashboard buttons on the footer nav
       bar. We want them to occupy all the available height. Also, please
       make their background color the same as the footer bar"). The strip
       is a BAR CELL now — the identity section's and the dashboard block's
       sibling, 31px of content row in the bar's own `--plaque-coat`, its two
       verticals in the bar's `--brown-3` hairline ink — and the trail band
       simply runs behind it, interrupted at this end exactly as it is by
       those two cells. Everything INSIDE the strip is untouched: the same
       19px lane, the same two pills and wide current tile, now floating on a
       6px shoulder of coat top and bottom the way the identity chip's badges
       do. It rode INSIDE the band from 2026-08-30 to this ask; that dress is
       in git and its arguments are kept in the style block below.
       The band-riding record (2026-08-30, three user asks one sitting — "place it on the
       bottom footer bar, at the very left … items at the left, icon at the
       right" → "*inside* the footer bar … occupy the whole available
       height" → "remove the top and bottom padding … place the whole thing
       inside the footer nav bar's inner frieze bar. Make the tiny item
       elements way denser"; it hung from the top-right corner from
       2026-07-24 until then). ONE element with two presentations
       (2026-07-24, third pass), and the RELOCATION ROTATED THE PARKED AXIS:
       · parked (win.minimized) = a row of UP TO THREE GLYPH TILES (2026-09-02;
         a dense shrink-fit chip row before — and a lettered title rode
         each tile for ONE deploy that day, until "the text overlaps … just display the icon") ON THE
         BAR'S OWN ROW — the strip stands OUTSIDE `.nav-frieze` since
         2026-09-05 (`--nav-bar-h - 1px` at `bottom: 0`; it was the band's
         interior, `--nav-chip-h`, from 2026-08-30 until then), wearing the
         bar's own coat with a night-well item lane inset in it (the fourth
         ask; it rode the band bare-transparent for one ask) — beside the
         burger's — never covered), chips ordered OLDEST→NEWEST
         left-to-right with the stack's head glyph at the strip's RIGHT END —
         the newest step lands beside the glyph exactly as it landed beside
         the header before;
       · expanded = the `--stack-w` panel (240px since 2026-09-02 — the strip's
         own width, so the morph is height alone; 300px before) RISING from
         that same seat to the window
         floor (the pins column's posture mirrored leftward — its bottom
         --nav-bar-h lies over the bar strip it owns), header/controls box at
         the BOTTOM with the list above it ordered OLDEST→NEWEST top-to-bottom.
       The list is the ONE and only scroller in both faces — it persists
       through the park/expand morph and the scroll position carries across as
       a ratio, horizontal axis parked, vertical expanded. The TWO mirrored
       FriezeBar bands that bracket the well render in the expanded panel only
       now: they are horizontal wave blocks, and the parked strip is itself a
       horizontal sliver with no room to stack them (the top band's old
       crown-strip stand-in role died with the top-right anchor). Both
       presentations hold ONE width (`--stack-w`, 2026-09-02): the expanded
       list scrolls past its cap, the parked strip shows the newest three
       steps (sliding back only to keep the current one in view) and never
       scrolls. -->
  <section
    v-if="win.open"
    class="stack-window dock-window"
    :class="{ 'is-parked': win.minimized, 'is-max': win.maximized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
    <!-- THE THIN HEADER (2026-09-06 PM, user ask: "add them a thin header
         with traffic light buttons, title and add a button on the right that
         opens up a flyout skeleton view of the stacks of items they carry").
         Shared chrome: `.side-head` in _components.scss carries the
         arguments. Red and yellow both PARK (the widget has no closed state
         — its strip is always on the bar), green flips the height cap to the
         full window (`is-max`), and the door at the right opens the user's
         NAVIGATION skeleton in the flyout viewer: PATH_REF's list is this
         very ledger, one NAV_STOP per stop, each stop's SUBSTACK its
         sub-stack (navSkeletonService § THE STOP STORY). -->
    <header v-if="!win.minimized" class="side-head stack-head">
      <div class="traffic">
        <button type="button" class="traffic__dot traffic__dot--red"
          title="Close — the stack parks to its strip" @click.stop="windows.minimizePanel('stack')">
          <q-icon name="close" />
        </button>
        <button type="button" class="traffic__dot traffic__dot--yellow"
          title="Park to the strip" @click.stop="windows.minimizePanel('stack')">
          <q-icon name="remove" />
        </button>
        <button type="button" class="traffic__dot traffic__dot--green"
          :title="win.maximized ? 'Restore height' : 'Full height'" @click.stop="toggleMax">
          <q-icon :name="win.maximized ? 'close_fullscreen' : 'open_in_full'" />
        </button>
      </div>
      <span class="side-head__title nasalization">
        <q-icon name="layers" size="12px" class="side-head__glyph" />
        <span class="side-head__label">Navigation stack</span>
      </span>
      <button type="button" class="side-head__open" :disabled="skeletonOpening"
        title="Open the stack as a skeleton — every stop and its sub-stack, in the flyout viewer"
        @click.stop="openSkeleton">
        <q-icon name="schema" size="13px" />
      </button>
    </header>

    <!-- Frieze band at the expanded panel's top edge — THE FLYOUT'S BAND since
         2026-09-02 (user ask: "change the friezebar [to] match the thin
         friezebars on the node flyout viewers"): `slim`, no `flip`, dialled
         in the style block exactly as `ElementFlyout.vue` dials its own.
         (Full-height, flipped, in the side-chrome trio's three greys from
         2026-08-21 until then.) EXPANDED ONLY since the bottom-left move
         (2026-08-30): the parked face is a horizontal strip now, and a
         horizontal wave band has no place inside a band-height row. (It
         stood in for the crown strip while the widget owned the top-right
         corner; that role is over.) The shared shell's `overflow: hidden`
         clips this band INTO the panel's two rounded top corners, the same
         load-bearing rule the flyout leans on. -->
    <FriezeBar v-if="!win.minimized" slim class="stack-frieze" />

    <div v-if="trail.length === 0 && !win.minimized" class="stack-empty">No visits yet.</div>

    <div v-else ref="listEl" class="stack-list" :class="{ 'is-parked': win.minimized }">
      <!-- Ordered OLDEST→NEWEST along the flow axis (the natural history
           order): top-to-bottom expanded, LEFT-TO-RIGHT parked — either way
           the NEWEST step lands at the end nearest the header / head glyph,
           so the list reads most-recent-nearest-the-controls in BOTH
           presentations. The natural index `i` IS the
           real history index. Each row is the one mutating side-bar item
           (SidePanelItem): expanded face = micro chip · title · visited-x-ago
           · author with the kind button palette-inverted on the right; parked
           face = the flat kind-colored icon chip. The step you are AT wraps
           in the kind-colored bubble (expanded) / inverts to a solid fill
           (parked). -->
      <!-- `rows` is the WHOLE TRAIL expanded and its LAST THREE stops parked
           (2026-09-02, "shows up to 3 elements"). ⭐ The window now always
           ENDS at the newest stop, so the arrangement is fixed — TWO TINY
           PILLS THEN THE WIDE TILE (2026-09-06 ask) — instead of the wide
           seat following a cursor around the row. Each row carries its REAL
           ledger index `i`, so nothing downstream sees the slice.
           The tiny tiles are the GLYPH ALONE (a title rode each of them for
           one deploy on 2026-09-02 and overlapped its neighbours: "the text
           overlaps … just display the icon"); the wide one letters TWO
           LINES, the stop on top and its sub-stack's newest act beneath.
           A stop opened in a FLOATING WINDOW (surface: 'window') is the same
           stop as the page for that element — the trail records how you got
           there, and the tile does not draw two different things for it. -->
      <SidePanelItem
        v-for="{ entry, i } in rows"
        :key="entry.key + ':' + i"
        class="stack-item"
        :class="{
          'is-checkpoint': checkpointIndices.includes(i),
          'is-past':       i < currentIndex,
          'is-window':     entry.surface === 'window'
        }"
        :collapsed="win.minimized"
        :kind="entry.id ? chipKind(entry.type) : null"
        :icon="entry.id ? null : typeIcon(entry.type)"
        :hash="entry.hash || ''"
        :display="entry.hash ? '' : (entry.id ? '#' + entry.id : '')"
        :title="entry.title"
        :sub-label="lastActionOf(entry).label"
        :sub-icon="lastActionOf(entry).icon"
        :time="entry.lastAt || entry.timestamp"
        :author="authorOf(entry)"
        :current="i === currentIndex"
        :tooltip="entry.title
          + (entry.actions.length ? ' — ' + lastActionOf(entry).label : '')
          + (i === currentIndex ? ' — you are here' : '')"
        rail-icon-size="12px"
        wide-current
        @activate="jumpToIndex(i)"
      >
        <template v-if="entry.isCheckpoint || entry.actions.length" #badges>
          <q-icon v-if="entry.isCheckpoint" name="flag" size="11px" class="text-amber" />
          <!-- The SUB-STACK's depth, as a count beside the title: the
               expanded row already letters the newest act on the wide face,
               and this says how much else is under it. -->
          <span v-if="entry.actions.length" class="stack-item__subcount mono">
            {{ entry.actions.length }}
          </span>
        </template>
      </SidePanelItem>
    </div>

    <!-- Second frieze band, INSIDE the widget (2026-07-24): the same block at
         the same size, dividing the scroll well from the header below it —
         so the well sits between two identical bands and the stack icon
         reads as its own strip of chrome. This one is the flyout's band in
         the flyout's own POSITION too: the one line between a box's bar and
         its well (the stack's bar is at the bottom, so the band is above it).
         Expanded only since the bottom-left move (2026-08-30), same reason
         as its twin above. -->
    <FriezeBar v-if="!win.minimized" slim class="stack-frieze stack-frieze--inner" />

    <!-- Header/controls box at the BOTTOM of the expanded panel (below the
         list), so it sits right beside the newest step. The traffic light is
         gone (2026-07-24, 7th pass) — the bar ITSELF parks the widget, which
         is only a touch-screen affordance anyway (hover already parks it on
         the way out). Minimize-only: the stack has no nav-bar button and
         docks as a permanent top-edge fixture, so it parks to the icon
         column instead of closing (a full close would strand it). -->
    <header v-if="!win.minimized" class="dock-bar dock-bar--park"
      title="Park to the icon column" @click="windows.minimizePanel('stack')">
      <q-icon name="layers" size="14px" class="dock-bar__icon dock-bar__icon--stack" />
      <span class="dock-bar__title nasalization">Navigation stack</span>
      <q-space />
      <span class="dock-bar__meta mono">
        {{ trail.length }} stop{{ trail.length === 1 ? '' : 's' }}
      </span>
      <!-- History control at the very right end of the info box: the clock
           glyph standing for "the stack's own history". Stops the click from
           reaching the bar (which parks the widget). -->
      <button type="button" class="dock-bar__action" @click.stop="onHistory">
        <q-icon name="history" size="15px" />
        <q-tooltip anchor="top middle" self="bottom middle">Navigation stack history</q-tooltip>
      </button>
    </header>

    <!-- Parked replacement for the header: the tiny head glyph at the strip's
         RIGHT END (the flex row puts the DOM's last child there — the same
         list-then-controls order that put it at the column's bottom before).
         Hovering anywhere on the strip expands the panel; the tap stays for
         touch screens, where hover doesn't exist. -->
    <!-- 15px, not the side widgets' 20px: the glyph rides inside the 21px
         trail band now (third ask), the same glyph-in-band chain the nav
         buttons obey. -->
    <button v-else type="button" class="dock-side-head stack-side-head"
      @click="windows.restorePanel('stack')">
      <q-icon name="layers" size="15px" />
    </button>
  </section>
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'
import { useWindowsStore } from 'src/stores/windows'
import { typeIcon, chipKind } from './navTypeIcons'
import { actionIcon, actionLabel } from 'src/utils/navActions'
import { kindFor, prefixFor } from 'src/utils/kinds'
import { refService } from 'src/services/ref.service'
import { navService } from 'src/services/nav.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import SidePanelItem from './SidePanelItem.vue'
import FriezeBar from './FriezeBar.vue'

export default defineComponent({
  name: 'StackPanel',
  components: { SidePanelItem, FriezeBar },

  setup () {
    const router = useRouter()
    const navStore = useNavStore()
    const windows = useWindowsStore()

    const win = computed(() => windows.panels.stack)

    // ⭐ THE WIDGET READS THE TRAIL, NOT THE CURSOR (2026-09-06, user ask:
    // "the history should be preserved … a huge skeleton of items I've been
    // on"). `navStore.history` is the BACK/FORWARD stack and it is allowed
    // to forget — a visit made after a Back drops the forward branch, which
    // is right for two arrows and wrong for a history. `navStore.trail` is
    // the append-only ledger; on this seat the swap took the widget from 66
    // surviving steps to 254 real ones, with the sub-stacks attached.
    // Order is unchanged: NATURAL (oldest→newest) along the flow axis, so
    // the newest stop still lands nearest the header / head glyph.
    const trail = computed(() => navStore.trail)
    // The stop you are IN is the newest one, always — a ledger has no
    // cursor. (`historyIndex` still drives the bar's Back/Forward arrows;
    // this widget stopped needing it.)
    const currentIndex = computed(() => trail.value.length - 1)
    const checkpointIndices = computed(() => navStore.checkpointIndices)

    // ── THE SUB-STACK, RESOLVED FOR DISPLAY ─────────────────────
    // The wide tile's second line: the newest act performed in that stop,
    // as a past-tense label + glyph from the action registry. The registry
    // is consulted HERE and never inside SidePanelItem — the tile is a
    // renderer, and teaching it the vocabulary would put the verb list in
    // two places.
    const lastActionOf = (stop) => {
      const a = stop?.actions?.length ? stop.actions[stop.actions.length - 1] : null
      if (!a) return { label: '', icon: '' }
      return { label: actionLabel(a.code), icon: actionIcon(a.code) }
    }

    // ── THE PARKED STRIP SHOWS UP TO THREE STEPS (2026-09-02, user ask) ──
    // A sliding window over the history, three wide, that ENDS AT THE
    // NEWEST step — the strip's standing law ("the newest step lands beside
    // the head glyph") kept — and slides back only as far as it must to keep
    // the step you are AT inside it: walk Back past the last three and the
    // window follows you, the current step taking the left slot with the
    // two steps ahead of it (the Forward ones) beside it. Rows carry their
    // REAL index so nothing downstream (tints, `current`, jumpToIndex)
    // knows about the slice. Expanded, `rows` is the whole history — the
    // panel's list is still the ONE scroller for every step.
    // ⭐ TWO TINY, THEN THE WIDE ONE (2026-09-06, user ask: "I have like a
    // large item and a tiny one. Put 2 tiny ones on the left and then the
    // large one on the right"). The window is the last THREE stops of the
    // ledger and it always ENDS at the newest — the wide tile is the last
    // slot by construction, so the arrangement is fixed rather than
    // depending on where a cursor happens to be. That is the change from
    // the 09-03 dress, where the wide seat followed the current index and
    // could land in the middle or at the left with tiny tiles after it.
    const PARKED_SLOTS = 3
    const parkedRows = computed(() => {
      const t = trail.value
      const start = Math.max(0, t.length - PARKED_SLOTS)
      return t.slice(start).map((entry, k) => ({ entry, i: start + k }))
    })
    const rows = computed(() => (
      win.value.minimized
        ? parkedRows.value
        : trail.value.map((entry, i) => ({ entry, i }))
    ))

    // End-anchored list: pin the scroll to the NEWEST end whenever a new step
    // is pushed — the bottom expanded, the RIGHT end parked (the strip flows
    // left-to-right since the bottom-left move) — so the latest activity stays
    // visible even when history overflows the cap. Setting both axes is
    // cheaper than branching: each face has exactly one live scroll axis and
    // the other assignment is a no-op.
    const listEl = ref(null)
    const scrollToNewest = () => {
      const el = listEl.value
      if (!el) return
      el.scrollTop = el.scrollHeight
      el.scrollLeft = el.scrollWidth
    }
    watch(
      () => trail.value.length,
      () => { nextTick(scrollToNewest) },
      { immediate: true }
    )

    // ONE scroller across both presentations — and since the bottom-left move
    // the morph is an AXIS ROTATION, not just a face swap: expanded scrolls
    // vertically, parked horizontally. Carry the relative position through the
    // flip by reading the OLD face's axis (the watcher runs pre-flush, so the
    // DOM still holds the old geometry) and applying the ratio to the NEW
    // face's axis after the patch.
    watch(
      () => win.value.minimized,
      (parked) => {
        const el = listEl.value
        if (!el) return
        const oldMax = parked
          ? el.scrollHeight - el.clientHeight // was expanded: vertical
          : el.scrollWidth - el.clientWidth //  was parked:   horizontal
        const oldPos = parked ? el.scrollTop : el.scrollLeft
        const ratio = oldMax > 0 ? oldPos / oldMax : 1
        nextTick(() => {
          if (parked) el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth)
          else el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
        })
      }
    )

    // Click-to-jump routes through the store so return-marking (the yellow
    // halo) and persistence both fire. Expanded rows park the panel so the
    // destination lands in full view (the stack stays one tap away for
    // history-hopping); parked chips jump without changing the presentation.
    // A trail stop is not an index into the Back/Forward stack — most are
    // not on it at all — so the store resolves it: on the cursor, go
    // through `jumpTo` and keep the return halo; otherwise it is an
    // ordinary navigation.
    const jumpToIndex = (idx) => {
      const stop = trail.value[idx]
      if (stop && idx !== currentIndex.value) navStore.jumpToStop(stop, router)
      if (!win.value.minimized) windows.minimizePanel('stack')
    }

    // Hover-driven presentation (2026-07-24): resting the pointer on the
    // parked column expands the panel after a short intent delay (so a
    // pointer flung at the screen edge doesn't pop it open), and leaving
    // parks it back. The head glyph / amber dot keep their taps for touch
    // screens, where hover doesn't exist.
    let hoverTimer = null
    const onHoverEnter = () => {
      if (!win.value.minimized) return
      hoverTimer = setTimeout(() => { windows.restorePanel('stack') }, 150)
    }
    // ⚠ A HEIGHT TOGGLE CAN LEAVE THE POINTER OUTSIDE (2026-09-06 PM): the
    // green light restores the cap, the panel SHRINKS under the pointer
    // resting on the header at its top, and the `mouseleave` that fires
    // is the panel leaving the pointer, not the reverse — parking it the
    // instant the user asked for a smaller one. A short settle window after
    // a toggle ignores that one leave (found by the witness: the door was
    // unreachable a click after the green dot).
    let settleUntil = 0
    const toggleMax = () => {
      settleUntil = Date.now() + 600
      windows.toggleMaximizePanel('stack')
    }
    const onHoverLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }
      if (Date.now() < settleUntil) return
      if (!win.value.minimized) windows.minimizePanel('stack')
    }

    // ── Author line for the expanded rows ────────────────────────
    // History entries are client-side (no author on them) — resolve each
    // element step's ref summary once, keyed '<prefix>/<id>', only while the
    // panel is expanded (the parked face needs nothing but the kind).
    const summaries = reactive({})
    const summaryKeyOf = (entry) => {
      if (!entry.id) return null
      const prefix = prefixFor(chipKind(entry.type))
      return kindFor(prefix).kind === 'unknown' ? null : `${prefix}/${entry.id}`
    }
    const loadAuthors = () => {
      const wanted = new Set()
      for (const e of trail.value) {
        const key = summaryKeyOf(e)
        if (key && !(key in summaries)) wanted.add(key)
      }
      wanted.forEach(async (key) => {
        summaries[key] = null // mark in-flight so re-runs don't refetch
        try {
          const [prefix, id] = key.split('/')
          const r = await refService.summaryById(prefix, id)
          if (r.success) summaries[key] = r.summary
        } catch (_) { /* author line is cosmetic — row still renders */ }
      })
    }
    watch(
      () => [win.value.open, win.value.minimized, trail.value.length],
      () => { if (win.value.open && !win.value.minimized) loadAuthors() },
      { immediate: true }
    )
    const authorOf = (entry) => {
      const key = summaryKeyOf(entry)
      return key ? (summaries[key]?.author?.username || null) : null
    }

    // History control in the info box (2026-07-24, 8th pass; destination
    // landed 2026-07-31, Thread H): the clock opens the user's NAVIGATION
    // skeleton viewer — the stack's history IS that on-chain element
    // (navService records every visit onto its PATH_REF path).
    const onHistory = async () => {
      try {
        const r = await navService.getNavigationSkeleton()
        if (r.success && r.skeleton?.id) router.push(`/skeletons/${r.skeleton.id}`)
      } catch (_) { /* leave the stack as is */ }
    }

    // ── THE SKELETON DOOR (2026-09-06 PM) ────────────────────────
    // The thin header's right control: the same NAVIGATION skeleton the
    // clock routes to, opened IN THE FLYOUT VIEWER instead — the stack as a
    // skeleton (PATH_REF = the ledger, one NAV_STOP per stop) with every
    // stop's SUBSTACK one unfold in, and the flyout's layout toggle to lay
    // it out vertically or horizontally. Spawning is a window opening, so
    // it records itself the way any flyout does.
    const flyouts = useFlyoutViewersStore()
    const skeletonOpening = ref(false)
    const openSkeleton = async () => {
      if (skeletonOpening.value) return
      skeletonOpening.value = true
      try {
        const r = await navService.getNavigationSkeleton()
        if (r.success && r.skeleton?.path) flyouts.spawnRef(r.skeleton.path)
      } catch (_) { /* the panel stays as it is */ }
      skeletonOpening.value = false
    }

    // The widget stands inside the footer bar's left run (2026-08-30). 3130
    // clears the LEFT DRAWER's 3120 — the two contest this corner, and at
    // the widget's old 3100 the open drawer's rail buried its leftmost chips
    // (caught on the relocation day's first screenshot) — plus everything
    // under it: the pins widget (3120), the nav bar (3110), the docks
    // (3010+) and the minitab strip (3045). The bar's left flank — the
    // IDENTITY SECTION since 2026-08-31 (the burger's 42px slot before the
    // drawer was hidden) — is never covered: the widget starts BESIDE it at
    // left: var(--nav-id-w).
    const EDGE_Z = 3130

    return {
      EDGE_Z,
      onHistory,
      openSkeleton,
      skeletonOpening,
      win,
      windows,
      trail,
      rows,
      currentIndex,
      lastActionOf,
      checkpointIndices,
      listEl,
      jumpToIndex,
      onHoverEnter,
      onHoverLeave,
      toggleMax,
      authorOf,
      typeIcon,
      chipKind
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and head glyph come from the shared
// .dock-window / .dock-side-head styles in src/css/_components.scss —
// only the stack's own dimensions and list styling live here.
//
// Riding the footer bar's inner frieze bar at its very left since
// 2026-08-30 (three user asks one sitting: bottom-left seated ON the bar's
// top edge, then sunk onto the bar's own rows at its full height, then —
// "inside the footer nav bar's inner frieze bar … way denser" — onto the
// TRAIL's very box; top-right from 2026-07-24 until then). ONE element with
// two presentations (2026-07-24, third pass), the parked axis ROTATED by
// the move: `.is-parked` flattens it to a dense horizontal chip row at the
// band's --nav-chip-h, items left, head glyph at the right end.
// ⭐ ONE WIDTH, BOTH FACES — `--stack-w` (240px, _tokens.scss) SINCE
// 2026-09-02 (user ask: "make the window thinner and the bar wider so
// they're the same width on the bar and when the window is extended"): the
// expanded panel came down from 300px, the parked strip stopped shrink-
// fitting its chips (it ran to 48vw at most, 20px a chip), and the two meet
// at the dial — same left edge, same right edge, the panel rises straight
// out of the strip's footprint, so the morph is HEIGHT ALONE. Expanded still
// shrink-fits VERTICALLY (2026-07-24, 7th pass): only as tall as its steps
// need, up to its cap, where the list starts scrolling. The strip holds UP
// TO THREE steps (same ask), each a GLYPH-ONLY tile a third of the lane wide
// (a lettered title rode them for one deploy — "the text overlaps … just display the icon"). The shared .dock-window width/height
// transition still animates what it can; the park⇄expand morph is an axis
// rotation now, so it snaps where auto-sizes meet. The chrome is per face
// (see the two blocks below): the parked strip is the bar's own
// `--plaque-coat` plate with a `--grey-4` item lane rimmed in `--grey-6`
// (2026-08-31), framed on its own two verticals
// by the trail chips' 1px `--grey-5` rim (2026-08-30's
// borders-on-all-sides ask, less the horizontals its gap-closing ask took
// back off; the band's own rule ink — see `.nav-btn`'s
// ink note in _components.scss) and still castless, while the expanded panel
// wears the same coat plus 1px `--grey-6` rims on its three exposed edges
// and the rounded top-right free corner.
.stack-window {
  // INSIDE the footer bar (the sitting's second ask — the first pass seated
  // the widget ON the bar's top edge): `bottom: 0` puts the parked strip on
  // the bar's own rows, filling its whole `--nav-bar-h`. It starts at
  // `left: var(--nav-id-w)` — BESIDE the IDENTITY SECTION since 2026-08-31
  // (user ask: the drawer's profile/organizations block took the bar's left
  // end, "before the stack bar"; the flank was the burger's 42px
  // `--dock-rail-w` slot until the drawer was hidden the same day). Chrome
  // that must stay reachable, so the strip owns the bar's left run from
  // that section's closing hairline on. The expanded panel rises from the
  // same seat and its bottom `--nav-bar-h` lies over the bar strip beneath
  // it — the header bar at its bottom IS this widget's bar row, the pins
  // column's own-the-strip arrangement without the rebuild.
  top: auto;
  bottom: 0;
  left: var(--nav-id-w, var(--dock-rail-w));
  right: auto;
  border-bottom: none;
  // The shared `--plaque-coat` since 2026-08-17 (user ask) — a --light-cream
  // sheet under a 30% --grey-3 veil, the same two layers the nav bar, the left
  // drawer and the pins widget took that session, so the window's chrome edges
  // The chrome is PER FACE since the strip moved into the trail (the
  // sitting's third ask): the EXPANDED panel keeps the shared
  // `--plaque-coat` (2026-08-17 — a --light-cream sheet under a 30% --grey-3
  // veil, the coat the nav bar, drawer and pins widget wear, so the chrome
  // edges stay ONE material; no sheen gradients, opaque), its `--grey-6`
  // rims and its raised casts; the PARKED strip wears that same coat with
  // no lines and no cast (the fourth ask — "the same as the footer nav
  // bar"; it was fully transparent for one ask, the band's pattern showing
  // between the chips), its grey-4 item lane inset in the plate. Both faces
  // stay blur-free.
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  // Shrink-to-fit in BOTH presentations — the widget hugs its item bundle and
  // only starts scrolling once the bundle would pass its cap. Expanded that
  // cap is still the stack's --dock-stack-h (63vh — the 70% share struck when
  // the two side widgets split the right-edge band; the pins widget keeps its
  // 27vh and nothing collides now that the stack lives at the other corner).
  // Parked, the cap is horizontal: 48vw, stopping short of the creation
  // docks' 50vw half (see the note at the top of this block).
  &:not(.is-parked) {
    width: var(--stack-w);
    max-width: 96vw;
    height: auto;
    bottom: 0;
    // The cap grows by the bar's own height, exactly as the pins column's
    // did when it took `bottom: 0`: the last --nav-footer-h is bar chrome
    // the widget lies over, not space taken from the list.
    max-height: calc(var(--dock-stack-h) + var(--nav-footer-h));
    background: var(--plaque-coat);
    // Rims on the three exposed edges (the floor stays bare); BOTH top
    // corners rounded since 2026-09-02 (user ask: "make sure the top edges
    // of the window are rounded" — the left one was square from the days
    // the strip abutted the burger's slot; it stands free beside the
    // identity section now). The shared `.dock-window` shell's `overflow:
    // hidden` clips the top frieze band into the curve — the flyout's own
    // load-bearing rule. Shadow rises (the widget grows from the bar) plus
    // a RIGHT-edge cast — `--shadow-side-edge` with the x-offset sign
    // flipped, the same mirroring the burger slot once did with that token
    // at this corner.
    border-top: 1px solid var(--grey-6);
    border-right: 1px solid var(--grey-6);
    border-left: 1px solid var(--grey-6);
    border-top-left-radius: var(--radius-lg);
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--radius-lg);
    box-shadow:
      0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
      5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
  }

  // THE GREEN LIGHT (2026-09-06 PM): the cap flips to the whole window under
  // the top tabs band — the room a ledger of hundreds of stops wants. The
  // panel still shrink-fits below it; only the ceiling moves.
  &:not(.is-parked).is-max {
    max-height: calc(100vh - var(--media-tabs-h, 0px));
  }

    // THE COAT'S NEGATIVE (2026-09-03, user ask: "invert the color palette
    // for the stack bar and the pin bar inside the frieze bar so they look
    // darker … a dark gray as main background and the light-cream as main
    // contrasting color"): the parked strip alone leaves `--plaque-coat` for
    // the `--strip-*` dials (_tokens.scss § THE FOOTER STRIPS' NIGHT COAT) —
    // grey-8 plaque, grey-9 lane under a grey-7 rim, light-cream head glyph
    // and tile faces. The verticals stay the band's grey-5: the trail's frame
    // law, unchanged. The expanded panel above keeps the coat.
  &.is-parked {
    // INSIDE THE TRAIL (the sitting's third ask: "place the whole thing
    // inside the footer nav bar's inner frieze bar"): the strip sits on the
    // band — height is `--nav-chip-h`, the band's INTERIOR (it WAS the
    // band's very box, `--nav-trail-h`, until 2026-08-30's closing ask), and the
    // bottom offset is `.nav-frieze`'s centring formula mirrored (the band
    // is centred in the bar's 31px padding box, so its gap below equals its
    // `top` above — the odd-parity note on both declarations is why the
    // arithmetic lands on whole pixels). The strip wears THE BAR'S OWN COAT
    // (`--plaque-coat`, the fourth ask — it was a bare transparent box for
    // one ask, the trail's pattern running between the chips): a cream
    // plate standing on the band exactly as the nav bar's own buttons do,
    // with the grey-4 item lane inset in it (on `.stack-list` below).
    // FRAMED since 2026-08-30's borders-on-all-sides ask: the same 1px
    // `--grey-5` rim the trail chips wear (the band's own rule ink — the
    // follow-up ask's alignment fix, see `.nav-btn` in _components.scss),
    // on all four edges — the strip was
    // paint-only for a pass (the seam against the band was the coat's bare
    // edge), and once the chips beside it closed their boxes the strip had
    // to close its own or read as the one unbounded object on the band.
    // Still no cast. `border-box` pays the two horizontal rims out of the
    // band-height box, so the item lane's vertical arithmetic moved inside
    // with it (see `.stack-list.is-parked`).
    // The row shrink-fits its chips + head glyph up to the
    // cap (48vw less the rail-slot offset — the creation docks' half starts
    // at 50vw and this widget's z outranks theirs).
    flex-direction: row;
    align-items: center;
    // ⭐ THE BAR'S WHOLE ROW SINCE 2026-09-05 (user ask: "make the stack and
    // pin bars inside the frieze bar be outside the friezebar, like the
    // author and dashboard buttons on the footer nav bar. We want them to
    // occupy all the available height"). The strip is no longer an object
    // ON the trail — it is a bar CELL, `.nav-left`'s and `.nav-end`'s
    // sibling, and it takes their box: `bottom: 0` with `--nav-bar-h - 1px`
    // of height, which is the bar's CONTENT ROW (31px — the 1px `--grey-6`
    // lip is chrome above it, and every centring formula on this bar
    // subtracts it for the same reason). The band now runs BEHIND the
    // strip and is interrupted by it exactly as it is by the identity
    // section and the dashboard block, which is what "outside the frieze
    // bar" means on a bar whose band is a full-width absolute stripe.
    //
    // ⚠ IT NO LONGER READS `--nav-chip-h`, and that is the point — the two
    // numbers it read from 2026-08-30 to today (the band's interior, and
    // `.nav-frieze`'s centring formula mirrored for `bottom`) were what tied
    // it to the trail. `--nav-chip-h` is the NAV CHIPS' dial now and nothing
    // else in this file; moving the band no longer moves this strip.
    // 31 is ODD ON PURPOSE — the lane inside is 19px (1px rim + 17px tile +
    // 1px rim) and `align-items: center` splits the remaining 12 into whole
    // 6px shoulders of coat. Any future lane height must stay odd or the
    // rim lands on a half pixel.
    height: calc(var(--nav-bar-h) - 1px);
    bottom: 0;
    // FIXED at the widget's one width since 2026-09-02 (`width: auto` —
    // shrink-to-fit — from the relocation until then): the strip is exactly
    // as wide as the panel that rises out of it. The 48vw cap below stays
    // as the guard it always was.
    width: var(--stack-w);
    // The cap subtracts the LEFT FLANK's width — the identity section's
    // `--nav-id-w` since 2026-08-31 (the burger's `--dock-rail-w` before) —
    // so the strip's right edge still stops at 48vw, short of the creation
    // docks' 50vw half.
    max-width: calc(48vw - var(--nav-id-w, var(--dock-rail-w)));
    // THE BAR'S OWN COAT AGAIN (2026-09-05, the same ask's second half:
    // "make their background color the same as the footer bar"). The dial
    // is unchanged — `--strip-coat` points at `--plaque-coat` now
    // (_tokens.scss § THE FOOTER STRIPS' NIGHT COAT) — so the strip wears
    // the identity chip's and the dashboard button's sheet, and the run
    // identity › stack › trail › pins › dashboard is one material. Only the
    // items LANE keeps the night coat, where it now reads as the expanded
    // panel's `--grey-4` well does: a recess sunk into cream, two steps
    // deeper.
    background: var(--strip-coat);
    // ⚠ SIDES ONLY STILL, but in the BAR'S INK NOW (2026-09-05): `--brown-3`,
    // which is what `.nav-left`'s `border-right` and `.nav-end`'s
    // `border-left` draw — the bar's inner-hairline doctrine. It was
    // `--grey-5`, the TRAIL's frame law, for as long as the strip stood on
    // the band and had to read as one more chip in it; a full-height cell
    // is bounded by the bar's own lines instead. No horizontals: the bar's
    // `--grey-6` lip closes the row above and the window floor closes it
    // below, exactly as they do for the other two end cells.
    border: 1px solid var(--brown-3);
    border-top-width: 0;
    border-bottom-width: 0;
    border-radius: 0;
    box-shadow: none;
  }
}

// Header bar lives at the BOTTOM of this panel (below the list, beside the
// newest step); shares the panel's `--plaque-coat` with NO top or bottom
// border/hairline so it merges seamlessly into the list body above it (one
// uniform plaque — it followed the panel out of brown-1 on 2026-08-17, and
// has to: a header row is the one place a coat mismatch would draw a line
// where the whole point is that there is none).
.stack-window .dock-bar {
  background: var(--plaque-coat);
  border-top: none;
  border-bottom: none;
}

// Icon + title ink comes from the shared `.dock-bar--park` rule (--grey-9,
// 2026-07-24 8th pass) — the old ink-2 tint on this glyph is gone, the info
// box reads as one consistent piece of chrome.

// Parked head glyph stands at the strip's RIGHT END (last flex child of the
// row), riding the band at its full height like the nav bar's own bare
// "looker" glyphs — a narrow 20px seat, dense to match the chips beside it
// (the shared .dock-side-head's --dock-bar-h box is overridden here: a 30px
// box cannot stand inside a 19px strip).
.stack-side-head {
  margin: 0;
  align-self: stretch;
  width: 20px;
  height: 100%;
  // ⭐ THE BAR'S INK SINCE 2026-09-05 — the glyph stands on the PLATE, and
  // the plate is `--plaque-coat` again, so `--strip-ink` (light-cream) would
  // draw nothing. `--ink-1` is what the dashboard button two cells over
  // inks its own glyph with. `--strip-ink` still faces the TILES, which
  // stand in the lane's night well and need the cream.
  color: var(--ink-1);
}

// THE THREE TILES (2026-09-02, user ask: "shows up to 3 elements") — each
// parked item is SidePanelItem's rail face, THE GLYPH ALONE, centred in a
// seat that takes exactly A THIRD of the lane's content box, gaps paid
// first (a title was lettered beside the glyph for ONE deploy that day and
// overlapped — "the text overlaps … just display the icon" — so the seats are wide and the mark is small, by
// choice; the width law is the strip's, not the tile's):
// `(100% − 2 gaps) / 3`, flex-basis percentages resolving against the lane.
// At `--stack-w` 240: 240 − 2 strip rims − 20 glyph − 2 lane rims − 2 lane
// pad = 214 of lane, less 2 × 2px gaps = 210 → 70px a tile. Fixed thirds,
// not `flex: 1` — one step alone takes one slot, not the whole lane, so the
// strip reads as three seats whatever the count. Height still comes from
// the strip-scoped `--side-item-h: 17px` the rail face reads. (20px glyph-
// only chips, shrink-fit, from 2026-08-30 until this.)
// TWO PILLS + ONE WIDE (2026-09-03, user ask: "make its inner buttons less
// wide too, and displaying up to 3 on the footer bar, except 2 should look
// like tiny icon buttons and one of them should be a wide version where the
// current place you're in, the last item information is displayed
// gracefully (the node title and the hash, for example)"): every parked step
// is a `--strip-tile-w` 20×17 capsule with a 12px glyph — the pins strip's
// pill — EXCEPT the current one, which takes the rest of the lane (214 − 2×20
// − 2×2 = 170px at `--stack-w`) as the LETTERED face (SidePanelItem
// `wide-current`: glyph · title · hash). Three equal thirds (~70px) from
// 2026-09-02 until this ask.
.stack-list.is-parked :deep(.side-item__btn--rail) {
  flex: 0 0 var(--strip-tile-w);
  width: var(--strip-tile-w);
  min-width: var(--strip-tile-w);
  // ⭐ ONE CURVE WITH THE LANE (2026-09-06, user ask: "make the item's corner
  // roundness match the roundness of their container") — `--strip-lane-radius`
  // paints the tile and the well it stands in, so they cannot drift. The
  // capsule (999px) is over: at 20×21 it drew a stadium inside a 7px-cornered
  // box, two different ideas of "rounded" at 2px of separation.
  border-radius: var(--strip-lane-radius);
}
// THE WIDE TILE — the last slot, always (2026-09-06: "2 tiny ones on the
// left and then the large one on the right"). It takes whatever the two
// pills leave, which is ~170px of the 240px lane, and its two text lines
// ellipsize inside that. `.is-current` IS the newest stop now that the
// widget reads the ledger rather than the cursor, so this rule can no
// longer land in the middle of the row.
.stack-list.is-parked :deep(.side-item__btn--rail.is-current) {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  padding: 0 7px 0 4px;
  border-radius: var(--strip-lane-radius); // the lane's own curve (2026-09-06); a bespoke 10px until then
}

// The glyph does not stretch with the tile: it stays a fixed 12px mark at
// the capsule's left, and the two lines take the rest.
.stack-list.is-parked :deep(.side-item__btn--rail.is-current .q-icon) {
  flex: 0 0 auto;
}

// The sub-stack depth, expanded face only — a tiny count beside the title
// saying how much is under the act the row names.
.stack-item__subcount {
  font-size: 8px;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 999px;
  color: var(--side-item-face, var(--grey-3));
  background: var(--item-accent, var(--ink));
  opacity: 0.85;
}

// ── THE BANDS ARE THE FLYOUT'S SINCE 2026-09-02 (user ask: "change the
// friezebar [to] match the thin friezebars on the node flyout viewers") —
// `FriezeBar slim` with `ElementFlyout.vue`'s `.element-flyout__frieze`
// dials VERBATIM: a `--grey-8` plate under the one `--brown-1` wave, and
// NOTHING ELSE. No scoped height (slim's own `calc(--frieze-h / 2)` IS the
// flyout's box), no fixed fit (`auto 117%`, slim's), the carve ON (slim's
// half-offsets — the flyout's band is grooved), no `flip` (the flyout's
// band runs the default way, and the widget stands at the LEFT now, where
// the drawer's un-flipped bands stood; the flip was minted for the RIGHT
// edge). Both bands wear it: the top edge's and the inner one between the
// well and the header — the inner one being the flyout's band in the
// flyout's own POSITION, the one line between a box's bar and its well.
// For this `.stack-frieze` LEFT the side-chrome trio rule in
// `_components.scss` (drawer + pins keep it — a duo now): that rule's
// `--frieze-bar-h: 15px` / `auto 13px` / carve-off / grey-2+grey-4 waves were
// the 2026-08-21 → 09-02 dress.
// ⚠ DO NOT RESTATE `height:` HERE. What stood on this rule from 2026-07-24
// until today — `height: var(--frieze-bar-h, var(--frieze-h))` — silently
// DEFEATS `slim`, whose half height lives in the component's own
// `.frieze-bar--slim` rule: a host-side height with a full-`--frieze-h`
// fallback wins the cascade and the "slim" band renders at full height with
// the slim mask fit, i.e. a stretched motif. The flyout states `flex` and the
// two paint dials and lets the component size itself; so does this.
.stack-frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-8, #616161);
  --frieze-bar-wave-two: var(--brown-1, #efebe9);
}

.stack-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 0.85em;
}

.stack-list {
  min-height: 0; // let the list shrink + scroll once the panel hits its cap
  overflow-y: auto;
  overflow-x: hidden; // rows ellipsize — never show a horizontal scrollbar
  // Inset scroll well: a margin all around keeps a reveal of the plaque, and
  // the rounded corners keep the well's edges soft — the border-radius also
  // clips the scrolling rows, so nothing pokes out square.
  // Floor is **grey-4** and the rim **grey-6**, in BOTH presentations; the rim
  // matches the widget's own outer border. (brown-2 / brown-4 until
  // 2026-08-18's palette ask; the floor went a step lighter than the rim on
  // 2026-07-24 so the well reads as a soft recess under the plaque rather than
  // a dark trough, and that step is what the grey pair preserves.)
  // The well is BRACKETED BY TWO FRIEZE BANDS (expanded), so it gets a wider
  // **8px** reveal top and bottom (2026-07-24 — the bottom was 3px when a bare
  // header sat under it): a carved wave band needs more air than a flat plaque
  // edge, and equal gaps keep the well centred between its two bands. (The old
  // same-in-both-faces margin law is retired with the 2026-08-30 axis
  // rotation — the parked face is a horizontal strip now and states its own
  // arithmetic below.)
  margin: 8px 6px;
  padding: 4px 6px;
  background: var(--grey-4);
  border: 1px solid var(--grey-6);
  border-radius: var(--radius-md);
  // Flex column in BOTH presentations (never block flow): the shared
  // --side-item-gap must land between every pair of items identically, and
  // block-flow margins would collapse where flex gaps do not. The vertical
  // padding above/below matches the parked face exactly, so the first item
  // starts at the same offset under the frieze band either way.
  display: flex;
  flex-direction: column;
  gap: var(--side-item-gap);
  // No scrollbar-width/color here: any non-auto value makes Chrome 121+ ignore
  // the ::-webkit-scrollbar-* styling below (square grey thumb, no radius).
  // Track matches the well floor (`--grey-4` since 2026-08-18, brown-2 before)
  // so only the thumb reads; the thumb keeps the well's rim ink, `--grey-6`.
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: var(--grey-4); border-radius: 999px; }
  &::-webkit-scrollbar-thumb { background: var(--grey-6); border-radius: 999px; }

  // Parked face of the SAME scroller, ROTATED (2026-08-30) and RIDING THE
  // TRAIL since the sitting's third ask: a horizontal row of chips inside
  // the footer's 21px inner frieze band, scrolling on the x axis (the one
  // live axis of this face — the y overflow is hidden, and scrollbar-width:
  // none makes Chrome 121+ skip the ::-webkit-scrollbar styling above and
  // hide the bar too). NO vertical margin; the lane
  // has a FLOOR since the fourth ask ("grey-4 for the items scroll
  // container") and a RIM since 2026-08-31: the expanded well's own
  // `--grey-4` under its own `--grey-6` line, sunk into the strip's
  // `--plaque-coat` plate exactly as the expanded well sinks into the
  // panel's — the widget's two faces state one material story at two
  // scales, and since the rim came back that story is COMPLETE (it was
  // floor-only, the law's half-stated half, from the fourth ask until
  // then). TRULY full-bleed since the fifth ask ("remove that padding …
  // add a little to the inner top and bottom"): `align-self: stretch`
  // overrides the strip's own `align-items: center`, which was sizing this
  // lane to its 17px content and leaving 2px of COAT showing above and
  // below it — that air lives INSIDE the container now, so the grey-4 spans
  // the strip's full content height. The chips don't move: since the
  // strip's 2026-08-30 frame, border-box hands this lane a 19px stretch, so
  // 1px rim + 17px chip (`--side-item-h`, which SidePanelItem's rail
  // face reads) + 1px = the strip's full 19px, because the strip has no
  // horizontal rims to pay for any more — the band's own rules are its top
  // and bottom edges, and this lane runs straight up to them.
  // ⚠ THAT LAST CLAUSE IS TWICE HISTORY: this strip stopped riding the band
  // on 2026-09-05 (it is a full-height bar CELL now — see `.is-parked`), and
  // the band's two rules were deleted on 2026-09-10 when the trail took the
  // header rail's frameless dress. The 19px arithmetic below is unaffected —
  // it is the strip's own lane, bounded by the bar's lip and the window
  // floor. ⚠ The chip
  // took a 17 → 15 → 17px round trip across 2026-08-30's closing asks,
  // purely as arithmetic: 15px while the strip still spent 2px of its 19px
  // on rims of its own, 17px again once those came off — and the 2026-08-31
  // rim did NOT restart that walk, because it was paid for out of the
  // PADDING rather than out of the chip. The air over a chip is this lane's
  // own 1px LINE now, and nothing else. Chips narrowed to 20px wide by the :deep rule
  // below, 2px gaps. The old
  // faces' matched-margins invariant (Δtop = 0 through the morph) is
  // retired — the morph is an axis rotation now, so items trade a vertical
  // level for a horizontal one by design. min-width lets the row shrink
  // under its cap and hand the rest to the scroll.
  // The lane's RIGHT END alone is rounded (sixth ask, 2026-08-30: "rounded
  // corners on the right side only"): the left edge stays square against the
  // strip's own left edge, and the right corners curve into the coat before
  // the head glyph — 7px, the bar's own small-chip radius (the minitab meta
  // chip's), a visible round on a 19px strip without capping it into a pill.
  // The radius also clips the scrolling chips at that end (overflow is
  // auto), the same soft-clip the expanded well's radius performs.
  &.is-parked {
    --side-item-face: var(--strip-ink); // the tiles' cream face (2026-09-03)
    // ⭐⭐ THE SHOULDERS WENT THIN, 2026-09-06 (user ask: "make the light-cream
    // top and bottom borders of the pin and stack bars thinner so the inner
    // scrolls can occupy more space"). Tile 19 → 23px, lane 21 → 25, shoulder
    // 5 → 3px — the lane takes 19% more of the row and the coat keeps just
    // enough to read as a plate the lane is inset IN rather than a lane
    // running edge to edge (which is what `align-self: stretch` did before
    // 2026-09-05, and it is why the lane's own rim could not be seen).
    // ⚠ THE ARITHMETIC IS THE POINT, NOT THE NUMBER — the bar's content row
    // is 31px, the LANE is the tile plus its two 1px rims, and the shoulder is
    // what is left, HALVED. Only tile heights leaving an EVEN remainder land
    // on whole pixels: 23 → lane 25 → 3px ✓; 22 → lane 24 → 3.5px and the
    // lane's rim fuzzes. ⚠ AND BOTH STRIPS SHARE THE NUMBER — the pins lane
    // had been left at 17px when the stack went to 19 on 09-06's first pass,
    // so the two bars sat at different heights on the same row; the same ask
    // that thinned them ("make sure both item's style and color are
    // consistent") is what put them back in step. Move them together.
    --side-item-h: 21px;
    // The tile's LINE, one structural ink in both strips (SidePanelItem's
    // dial). The kind colour keeps the glyph and the current tile's fill.
    --side-item-rim: var(--grey-6);
    // The two text lines still have to fit: title 9px + 1px gap + sub 8px =
    // 18 in the 23, every `line-height` exactly 1 (see SidePanelItem — any
    // leading at all and line one loses its centre). 17 → 19 was this same
    // day's earlier pass, when the second line arrived.
    --side-item-gap: 2px;
    flex-direction: row;
    align-items: center;
    // ⭐ NO `align-self: stretch` SINCE 2026-09-05. It was there to spend the
    // last 2px of a 19px strip on the lane rather than leave coat showing
    // above and below it — a rule that only made sense while the strip WAS
    // the lane's height. The strip is the bar's 31px row now, so the lane
    // sizes to its own content (1px rim + 17px tile + 1px rim = 19px) and
    // the strip's `align-items: center` seats it with a 6px shoulder of coat
    // each side — the identity chip's construction exactly, whose 17px badge
    // pills float the same way in the same row. The tiles do not move a
    // pixel; what changed is what is around them.
    // A SIDE EFFECT WORTH NAMING: the lane's rim no longer DOUBLES on its
    // top and bottom edges (it used to sit under the band's own two grey-6
    // rules). Those two edges stand free in the coat now, so the lane reads
    // as one outlined box for the first time.
    // The lane FILLS the strip since the strip stopped shrink-fitting
    // (2026-09-02): it grows to everything left of the head glyph, and the
    // three tiles take their thirds of that.
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    // ⚠ THE 1px OF AIR BECAME THE RIM (2026-08-31, user ask: "add a thin
    // border to the inner rounded border of the inner scroll"). The lane was
    // the ONE place the widget's own two-face law — floor `--grey-4`, rim
    // `--grey-6`, stated at `.stack-list` above — was false: the expanded well
    // has worn that pair since 2026-08-18 and the parked face was paint only,
    // so its rounded right end read as a tone change rather than as a
    // container. Same ink, same floor, one scale down.
    // The strip is ZERO-SUM in 19px, so this is a SUBSTITUTION, not an
    // addition: `border-box` would have taken the rim out of the chip (17 →
    // 15px, the round trip this lane already made once), so the padding pays
    // for it instead — 1px pad → 1px rim top and bottom, 2px pad → 1px rim +
    // 1px pad left and right. Every chip stays at 20×17 on the same pixel, the
    // lane still runs edge to edge of the strip, and the air over a chip is the
    // rim now rather than the padding.
    // The rim DOUBLES on the three flush edges by construction — grey-6 under
    // the band's own grey-6 rules top and bottom, grey-6 beside the strip's
    // grey-5 rim at the left — because the lane is flush on all three. That is
    // the cost of stating the container at this size and it is deliberate:
    // the RIGHT end, the only edge standing free in the coat, is where the
    // line has to draw, and a rounded box cannot be outlined on one edge alone.
    // ⭐ THE ITEMS BREATHE, 2026-09-06 (user ask: "add a little padding at the
    // top and bottom of the bar's items"). 2px of well shows above and below
    // every tile — they sat flush against the lane's rim before, which read
    // as a tile jammed into a slot rather than one resting in a well.
    // ⚠ THE 31px ROW PAYS FOR IT, AND THE SPLIT IS DELIBERATE: shoulder
    // 3 → 2px (the coat gives up half, continuing the same sitting's "make
    // the … borders thinner" ask) and tile 23 → 21px (the item gives the
    // other half). Full stack, and it must total 31 in whole pixels:
    //   2 shoulder + 1 rim + 2 pad + 21 tile + 2 pad + 1 rim + 2 shoulder
    // The two text lines still fit — title 9 + 1 gap + sub 8 = 18 of the 21.
    padding: 2px 1px;
    background: var(--strip-well);
    border: 1px solid var(--strip-rule);
    border-radius: 0 var(--strip-lane-radius) var(--strip-lane-radius) 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
}

// Stack-flavored tints layered ON the shared fused item (SidePanelItem), both
// faces: steps behind you fade, steps ahead read italic-soft, checkpoint
// titles carve coral (expanded only — the parked chip has no title). The "you
// are here" kind-colored bubble / solid inverted chip + the row anatomy live
// in the item itself.
.stack-item.is-past   { opacity: 0.55; }
// A stop reached through a FLOATING WINDOW rather than a page. Marked, not
// recoloured: it is the same element and the same kind tone, and the only
// thing that differs is the door. A dashed rim says "door" without
// inventing a second palette.
.stack-item.is-window :deep(.side-item__btn--rail) { border-style: dashed; }
.stack-item.is-future { color: var(--ink-soft); font-style: italic; }
.stack-item.is-checkpoint :deep(.side-item__title) { color: var(--coral-deep); }
</style>
