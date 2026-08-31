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
       · parked (win.minimized) = a dense horizontal chip row INSIDE THE
         TRAIL — the strip sits on `.nav-frieze`'s very box (--nav-trail-h,
         promoted to :root for this), wearing the bar's own coat with a
         grey-4 item lane inset in it (the fourth ask; it rode the band
         bare-transparent for one ask) — beside the 42px left rail slot (the
         burger's — never covered), chips ordered OLDEST→NEWEST
         left-to-right with the stack's head glyph at the strip's RIGHT END —
         the newest step lands beside the glyph exactly as it landed beside
         the header before;
       · expanded = the 300px panel RISING from that same seat to the window
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
       presentations shrink to fit the steps they hold — the expanded list
       scrolls past its cap, the parked strip past its share of the bar (the
       docks' half starts at 50vw and the strip outranks their z, so it must
       stop short of them). -->
  <section
    v-if="win.open"
    class="stack-window dock-window"
    :class="{ 'is-parked': win.minimized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
    <!-- Mirrored frieze band at the expanded panel's top edge — same block as
         the drawer's section dividers, the panel's free edge toward the middle
         of the screen. EXPANDED ONLY since the bottom-left move (2026-08-30):
         the parked face is a horizontal strip now, and a horizontal wave band
         has no place inside a 42px-tall row. (It stood in for the crown strip
         while the widget owned the top-right corner; that role is over.) -->
    <FriezeBar v-if="!win.minimized" flip class="stack-frieze" />

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
      <SidePanelItem
        v-for="(entry, i) in history"
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
        @activate="jumpToIndex(i)"
      >
        <template v-if="entry.isCheckpoint" #badges>
          <q-icon name="flag" size="11px" class="text-amber" />
        </template>
      </SidePanelItem>
    </div>

    <!-- Second mirrored frieze band, INSIDE the widget (2026-07-24): the same
         block at the same size, dividing the scroll well from the header below
         it — so the well sits between two identical bands and the stack icon
         reads as its own strip of chrome. Expanded only since the bottom-left
         move (2026-08-30), same reason as its twin above. -->
    <FriezeBar v-if="!win.minimized" flip class="stack-frieze stack-frieze--inner" />

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
    // (3010+) and the minitab strip (3045). The bar's 42px left rail slot —
    // the burger's, whichever surface owns it — is never covered: the widget
    // starts BESIDE it at left: var(--dock-rail-w).
    const EDGE_Z = 3130

    return {
      EDGE_Z,
      onHistory,
      win,
      windows,
      history,
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
// band's --nav-trail-h, items left, head glyph at the right end.
// BOTH presentations SHRINK TO FIT their item bundle (2026-07-24, 7th
// pass): the expanded panel is only as tall as its steps need and stops
// growing at its cap, where the list starts scrolling; the parked strip is
// only as wide as its chips need and stops short of the creation docks'
// 50vw half (this widget's z outranks their 3010+ — the strip must run out
// of road before it runs over them). The shared .dock-window width/height
// transition still animates what it can; the park⇄expand morph is an axis
// rotation now, so it snaps where auto-sizes meet. The chrome is per face
// (see the two blocks below): the parked strip is the bar's own
// `--plaque-coat` plate with a `--grey-4` item lane, framed on all four
// sides by the trail chips' own 1px `--grey-5` rim (2026-08-30's
// borders-on-all-sides ask; the band's own rule ink — see `.nav-btn`'s
// ink note in _components.scss) and still castless, while the expanded panel
// wears the same coat plus 1px `--grey-6` rims on its three exposed edges
// and the rounded top-right free corner.
.stack-window {
  // INSIDE the footer bar (the sitting's second ask — the first pass seated
  // the widget ON the bar's top edge): `bottom: 0` puts the parked strip on
  // the bar's own rows, filling its whole `--nav-bar-h`. It starts at
  // `left: var(--dock-rail-w)`, BESIDE the bar's 42px left rail slot rather
  // than over it — that slot is the burger's (the drawer toggle when the
  // drawer is closed, the drawer's own footer block when open), chrome that
  // must stay reachable, so the strip owns the bar's left run from the
  // slot's edge on. The expanded panel rises from the same seat and its
  // bottom `--nav-bar-h` lies over the bar strip beneath it — the header
  // bar at its bottom IS this widget's bar row, the pins column's
  // own-the-strip arrangement without the rebuild.
  top: auto;
  bottom: 0;
  left: var(--dock-rail-w);
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
    width: 300px;
    max-width: 96vw;
    height: auto;
    bottom: 0;
    // The cap grows by the bar's own height, exactly as the pins column's
    // did when it took `bottom: 0`: the last --nav-footer-h is bar chrome
    // the widget lies over, not space taken from the list.
    max-height: calc(var(--dock-stack-h) + var(--nav-footer-h));
    background: var(--plaque-coat);
    // Rims on the three exposed edges (the floor stays bare); the free
    // top-right corner keeps the panel's rounding. Shadow rises (the widget
    // grows from the bar) plus a RIGHT-edge cast — `--shadow-side-edge`
    // with the x-offset sign flipped, the same mirroring the burger slot
    // once did with that token at this corner.
    border-top: 1px solid var(--grey-6);
    border-right: 1px solid var(--grey-6);
    border-left: 1px solid var(--grey-6);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--radius-lg);
    box-shadow:
      0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
      5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
  }

  &.is-parked {
    // INSIDE THE TRAIL (the sitting's third ask: "place the whole thing
    // inside the footer nav bar's inner frieze bar"): the strip sits on the
    // band's VERY BOX — height is the band's own `--nav-trail-h` and the
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
    height: var(--nav-trail-h);
    bottom: calc((var(--nav-bar-h) - 1px - var(--nav-trail-h)) / 2);
    width: auto;
    max-width: calc(48vw - var(--dock-rail-w));
    background: var(--plaque-coat);
    border: 1px solid var(--grey-5, #bdbdbd);
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
// box cannot stand inside a 21px band).
.stack-side-head {
  margin: 0;
  align-self: stretch;
  width: 20px;
  height: 100%;
}

// The parked chips narrowed to match the trail's density (the third ask:
// "way denser, with minimum padding and smaller") — SidePanelItem's rail
// face takes its height from the strip-scoped --side-item-h above; the
// width is stated here because the component fixes it at 32px for the pins
// column's geometry, which this strip no longer shares.
.stack-list.is-parked :deep(.side-item__btn--rail) {
  width: 20px;
  min-width: 20px;
}

// The top-edge frieze band must keep its full height in the flex column (the
// list below it is the shrinking scroller). EXPANDED ONLY since 2026-08-30's
// bottom-left move (a horizontal band has no seat in the parked strip), and
// no longer a crown-strip stand-in — the panel's free top edge wears a
// `--grey-6` rim above it now, like the pins widget's. The box stays
// FriezeHeader's at the trio's `--frieze-bar-h` (= 0.96 × `--frieze-h`
// since 2026-08-17's trim walk — this scoped height reads that dial). Only
// the palette differs — and since 2026-08-17 (user ask) it is not
// FriezeBar's default brown-4 but the SIDE CHROME TRIO rule in
// `_components.scss`: `--grey-8` plate, `--grey-2` thick wave, `--grey-4`
// other wave, carve off — three paints and nothing else since 2026-08-21's
// from-scratch ask; an orange↔teal gradient weave 08-17 → 08-21, a rimmed
// grey pass for part of that last sitting. (The rule was a QUARTET for half
// of 2026-08-23: the nav bar's trail wore these three paints and this
// `auto 13px` fit on the window's floor at its own 21px box, then left when a
// later ask gave it its own palette — a `--grey-6` plate under one
// `--light-cream` tone, after an inverted cream-plate hour. The fit and the
// carve-off argument went with it; the paints did not.)
// ⚠ THE 1px BOTTOM LIP IS GONE with the trio's rims (same ask): it was the
// crown strip's own edge, brown-3 from birth, `--grey-6` after the rim ask —
// the last line standing on any trio band, and "three paints" ended it. Its
// history stays in git; do not re-add it without re-adding the trio's rims,
// or this one band steps at the widget's left edge again.
.stack-frieze {
  flex-shrink: 0;
  height: var(--frieze-bar-h, var(--frieze-h));
}

// The INNER band (2026-07-24) — same block, same total size, sitting between
// the scroll well and the header / head glyph. It never stood in for the
// crown strip and never carried a lip of its own (it wore the trio's rims
// for the 2026-08-17 → 08-21 window like every band; all lines are off
// since the three-paints ask, so the pair bracketing the well is matched by
// construction again). Full bleed like its twin: the band spans
// the widget's width while the well inside keeps its margins.
.stack-frieze--inner {
  flex-shrink: 0;
  height: var(--frieze-bar-h, var(--frieze-h));
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
  // hide the bar too). NO vertical margin and no rim — the lane
  // has a FLOOR since the fourth ask ("grey-4 for the items scroll
  // container"): the expanded well's own `--grey-4`, sunk into the strip's
  // `--plaque-coat` plate exactly as the expanded well sinks into the
  // panel's — the widget's two faces state one material story at two
  // scales. TRULY full-bleed since the fifth ask ("remove that padding …
  // add a little to the inner top and bottom"): `align-self: stretch`
  // overrides the strip's own `align-items: center`, which was sizing this
  // lane to its 17px content and leaving 2px of COAT showing above and
  // below it — that air lives INSIDE the container now, so the grey-4 spans
  // the strip's full content height. The chips don't move: since the
  // strip's 2026-08-30 frame, border-box hands this lane a 19px stretch, so
  // 1px padding + 17px chip (`--side-item-h`, which SidePanelItem's rail
  // face reads) + 1px = the 19px box between the strip's two rims — rim +
  // pad still reads as 2px of air over each chip, the band's shoulders now
  // half line, half coat. Chips narrowed to 20px wide by the :deep rule
  // below, 2px gaps. The old
  // faces' matched-margins invariant (Δtop = 0 through the morph) is
  // retired — the morph is an axis rotation now, so items trade a vertical
  // level for a horizontal one by design. min-width lets the row shrink
  // under its cap and hand the rest to the scroll.
  // The lane's RIGHT END alone is rounded (sixth ask, 2026-08-30: "rounded
  // corners on the right side only"): the left edge stays square against the
  // strip's own left edge, and the right corners curve into the coat before
  // the head glyph — 7px, the bar's own small-chip radius (the minitab meta
  // chip's), a visible round on a 21px band without capping it into a pill.
  // The radius also clips the scrolling chips at that end (overflow is
  // auto), the same soft-clip the expanded well's radius performs.
  &.is-parked {
    --side-item-h: 17px;
    --side-item-gap: 2px;
    flex-direction: row;
    align-items: center;
    align-self: stretch;
    min-width: 0;
    margin: 0;
    padding: 1px 2px;
    background: var(--grey-4);
    border: none;
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
