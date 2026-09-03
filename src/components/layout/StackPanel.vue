<template>
  <!-- The navigation stack, RIDING THE FOOTER BAR'S INNER FRIEZE BAR at its
       very LEFT (2026-08-30, three user asks one sitting — "place it on the
       bottom footer bar, at the very left … items at the left, icon at the
       right" → "*inside* the footer bar … occupy the whole available
       height" → "remove the top and bottom padding … place the whole thing
       inside the footer nav bar's inner frieze bar. Make the tiny item
       elements way denser"; it hung from the top-right corner from
       2026-07-24 until then). ONE element with two presentations
       (2026-07-24, third pass), and the RELOCATION ROTATED THE PARKED AXIS:
       · parked (win.minimized) = a row of UP TO THREE GLYPH TILES (2026-09-02;
         a dense shrink-fit chip row before — and a lettered title rode
         each tile for ONE deploy that day, until "the text overlaps … just display the icon") INSIDE THE
         TRAIL — the strip stands INSIDE `.nav-frieze`'s box (--nav-chip-h,
         promoted to :root for this), wearing the bar's own coat with a
         grey-4 item lane inset in it (the fourth ask; it rode the band
         bare-transparent for one ask) — beside the 42px left rail slot (the
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
    :class="{ 'is-parked': win.minimized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
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

    <div v-if="history.length === 0 && !win.minimized" class="stack-empty">No visits yet.</div>

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
      <!-- `rows` is the WHOLE history expanded and a THREE-SLOT WINDOW of it
           parked (2026-09-02, user ask: "shows up to 3 elements") — each
           row carries its REAL history index `i`, so the tints, the
           current-step mark and click-to-jump never see the slice. The
           parked tile is the GLYPH ALONE — a title was lettered beside it
           for one deploy (2026-09-02) and overlapped its neighbours; the
           same day's next ask: "the text overlaps … just display the icon". -->
      <SidePanelItem
        v-for="{ entry, i } in rows"
        :key="i"
        class="stack-item"
        :class="{
          'is-checkpoint': checkpointIndices.includes(i),
          'is-past':       i <  historyIndex,
          'is-future':     i >  historyIndex
        }"
        :collapsed="win.minimized"
        :kind="entry.id ? chipKind(entry.type) : null"
        :icon="entry.id ? null : typeIcon(entry.type)"
        :hash="entry.hash || ''"
        :display="entry.hash ? '' : (entry.id ? '#' + entry.id : '')"
        :title="entry.title"
        :time="entry.timestamp"
        :author="authorOf(entry)"
        :current="i === historyIndex"
        :tooltip="entry.title + (i === historyIndex ? ' — you are here' : '')"
        rail-icon-size="12px"
        wide-current
        @activate="jumpToIndex(i)"
      >
        <template v-if="entry.isCheckpoint" #badges>
          <q-icon name="flag" size="11px" class="text-amber" />
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
        {{ history.length }} step{{ history.length === 1 ? '' : 's' }}
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
import { kindFor, prefixFor } from 'src/utils/kinds'
import { refService } from 'src/services/ref.service'
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

    // Both faces render history in its NATURAL order (oldest→newest) top-to-
    // bottom, so the newest step lands at the bottom right beside the header /
    // head glyph. The loop index IS the real history index — no reversal needed.
    const history = computed(() => navStore.history)
    const historyIndex = computed(() => navStore.historyIndex)
    const checkpointIndices = computed(() => navStore.checkpointIndices)

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
    const PARKED_SLOTS = 3
    const parkedRows = computed(() => {
      const h = history.value
      let end = h.length
      let start = Math.max(0, end - PARKED_SLOTS)
      if (historyIndex.value < start) {
        start = Math.max(0, historyIndex.value)
        end = Math.min(h.length, start + PARKED_SLOTS)
      }
      return h.slice(start, end).map((entry, k) => ({ entry, i: start + k }))
    })
    const rows = computed(() => (
      win.value.minimized
        ? parkedRows.value
        : history.value.map((entry, i) => ({ entry, i }))
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
      () => history.value.length,
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
    const jumpToIndex = (idx) => {
      if (idx !== historyIndex.value) navStore.jumpTo(idx, router)
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
    const onHoverLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }
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
      for (const e of history.value) {
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
      () => [win.value.open, win.value.minimized, history.value.length],
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
        const { navService } = await import('src/services/nav.service')
        const r = await navService.getNavigationSkeleton()
        if (r.success && r.skeleton?.id) router.push(`/skeletons/${r.skeleton.id}`)
      } catch (_) { /* leave the stack as is */ }
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
      win,
      windows,
      history,
      rows,
      historyIndex,
      checkpointIndices,
      listEl,
      jumpToIndex,
      onHoverEnter,
      onHoverLeave,
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
    // ⚠ `--nav-chip-h`, NOT `--nav-trail-h`, SINCE 2026-08-30's closing ask
    // ("the buttons and the bar … don't look like they're inside the frieze
    // bar section", then "the buttons touching the very frieze bar borders
    // from inside"): the strip is the "bar" in that sentence and it took the
    // same correction the chips beside it did. It COVERED the band's two
    // rules before, so nothing of the band was left around it; now it is the
    // band's interior — one row in at each end, touching both rules from
    // inside, level with every chip to the pixel. Both numbers still come
    // off ONE authored dial — `--nav-chip-h` is `calc(--nav-trail-h - 2px)`
    // at `:root` — so the strip still moves with the band.
    height: var(--nav-chip-h);
    bottom: calc((var(--nav-bar-h) - 1px - var(--nav-chip-h)) / 2);
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
    background: var(--strip-coat);
    // ⚠ SIDES ONLY, like the trail chips beside it (2026-08-30, the ask
    // after the flush fit: "there is still a gap on the top … Close it").
    // A grey-5 rim under the band's grey-6 rule read as a pale seam rather
    // than as the strip's edge; the band's rules are the strip's top and
    // bottom edges now, and its `--grey-4` items lane runs straight up to
    // them (`.stack-list.is-parked` stretches into the 19px the rims freed,
    // which is why its chips went back to 17px).
    border: 1px solid var(--grey-5, #bdbdbd);
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
  color: var(--strip-ink); // the head glyph on the dark strip (2026-09-03)
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
  border-radius: 999px;
}
.stack-list.is-parked :deep(.side-item__btn--rail.is-current) {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  padding: 0 7px 0 4px;
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
  // and bottom edges, and this lane runs straight up to them. ⚠ The chip
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
    --side-item-h: 17px;
    --side-item-gap: 2px;
    flex-direction: row;
    align-items: center;
    align-self: stretch;
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
    padding: 0 1px;
    background: var(--strip-well);
    border: 1px solid var(--strip-rule);
    border-radius: 0 7px 7px 0;
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
.stack-item.is-future { color: var(--ink-soft); font-style: italic; }
.stack-item.is-checkpoint :deep(.side-item__title) { color: var(--coral-deep); }
</style>
