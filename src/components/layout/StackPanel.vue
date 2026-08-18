<template>
  <!-- The navigation stack as a docked right side panel that hangs from the
       screen's very TOP-RIGHT corner (top: 0, 2026-07-24 — it now overlays
       the frieze header rather than starting below it) and grows downward
       toward the middle (mirror of the pinned list, which rises from the nav
       bar). TWO mirrored FriezeBar bands bracket the scroll well — the same
       divider block the drawer uses between sections, at the same size: one at
       the widget's top edge, which REPLACES the crown strip across this column
       instead of dividing the list from it, and one between the well and the
       header / stack glyph at the bottom (2026-07-24). ONE
       element with two presentations
       (2026-07-24, third pass): expanded = the 300px panel, parked
       (win.minimized) = the SAME element narrowed to the thin icon column
       (`is-parked`), each item collapsed to its icon face. The list below is
       the ONE and only scroller — it persists through the park/expand morph,
       so the scroll position carries across (there is no separate rail tree
       anymore). The header/controls box sits at the BOTTOM, with the list
       above it ordered OLDEST→NEWEST top-to-bottom so the newest step lands
       at the bottom right beside it. Both presentations shrink to fit the
       steps they hold (the list scrolls once they would pass --dock-stack-h,
       the stack's 70% share of the side band), so unravelling covers exactly
       the band the parked chips sat on. -->
  <section
    v-if="win.open"
    class="stack-window dock-window"
    :class="{ 'is-parked': win.minimized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
    <!-- Mirrored frieze band at the top edge — same block as the drawer's
         section dividers. The widget sits ON TOP of the crown strip, so this
         band STANDS IN for it across the stack's column (matched to
         FriezeHeader's exact box in the styles below). Rendered in both
         presentations (at rail width it shows a small wave slice). -->
    <FriezeBar flip class="stack-frieze" />

    <div v-if="history.length === 0 && !win.minimized" class="stack-empty">No visits yet.</div>

    <div v-else ref="listEl" class="stack-list" :class="{ 'is-parked': win.minimized }">
      <!-- Ordered OLDEST→NEWEST top-to-bottom (the natural history order): the
           oldest step sits at the top and the NEWEST lands at the bottom just
           above the header/head glyph, so the list reads most-recent-nearest-
           the-controls in BOTH presentations. The natural index `i` IS the
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
         block at the same size, dividing the scroll well from the header /
         head glyph below it — so the well sits between two identical bands and
         the stack icon reads as its own strip of chrome. Both presentations. -->
    <FriezeBar flip class="stack-frieze stack-frieze--inner" />

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

    <!-- Parked replacement for the header: the tiny head glyph at the same
         BOTTOM spot. Hovering anywhere on the column expands the panel; the
         tap stays for touch screens, where hover doesn't exist. -->
    <button v-else type="button" class="dock-side-head stack-side-head"
      @click="windows.restorePanel('stack')">
      <q-icon name="layers" size="20px" />
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

    // Bottom-anchored list: pin the scroll to the BOTTOM (newest) whenever a
    // new step is pushed, so the latest activity — at the bottom — stays
    // visible even when history overflows the half-height cap.
    const listEl = ref(null)
    const scrollToNewest = () => {
      const el = listEl.value
      if (el) el.scrollTop = el.scrollHeight
    }
    watch(
      () => history.value.length,
      () => { nextTick(scrollToNewest) },
      { immediate: true }
    )

    // ONE scroller across both presentations: the park/expand morph swaps the
    // item faces (different heights), so carry the relative scroll position —
    // not the raw pixel offset — through the flip.
    watch(
      () => win.value.minimized,
      () => {
        const el = listEl.value
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        const ratio = max > 0 ? el.scrollTop / max : 1
        nextTick(() => {
          el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
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

    // The widget hangs from the screen's top-right corner (top: 0); z 3100
    // keeps it above the crown strip (3000) it now overlays, and above the
    // rest of the chrome.
    const EDGE_Z = 3100

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
// Anchored at the screen's TOP-RIGHT corner (top: 0, 2026-07-24) ON TOP of the
// crown strip, whose place its own mirrored FriezeBar band (`.stack-frieze`)
// takes across this column. ONE element with two presentations
// (2026-07-24, third pass): `.is-parked` narrows it to the icon column
// (--dock-rail-w). BOTH presentations SHRINK TO FIT their item bundle
// (2026-07-24, 7th pass — expanded used to take its full cap with the steps
// bottom-aligned, which left a dead field between the frieze band and the
// items): the panel is only as tall as its steps need and stops growing at
// --dock-stack-h, where the list starts scrolling instead. The
// shared .dock-window width/height transition animates the morph. The top,
// left (toward the page) and bottom (leading edge toward the middle gap) edges
// wear a thin classic 1px `--grey-6` border (brown-4 until 2026-08-17's
// palette ask — the trio's rim ink now, the same line the frieze bands and the
// media tabs rail wear); the right sits bare at the screen edge. Rounded
// bottom-left corner kept.
.stack-window {
  // THE WINDOW'S VERY TOP EDGE (2026-08-17, user ask: the left drawer and this
  // column both "start drawing at the very top of the screen", and the thin
  // header bar draws on top of both, partially covering the frieze bar). It
  // stepped down by `--media-tabs-h` from 2026-08-05, when the media tabs rail
  // became the top chrome. Now the two columns bounding the window run to y=0
  // and each carries its own FriezeBar there — this band standing in for the
  // deleted crown strip at this corner exactly as it always did — while the
  // rail lies ACROSS the top of both bands from z 3125 (it was 3105, under
  // this widget's 3100 sibling ordering and under the drawer; see
  // MediaTabsBar). Nothing here reserves space for the rail any more: it
  // OVERLAPS this column rather than sitting above it.
  top: 0;
  bottom: auto;
  right: 0;
  // NO top border: the widget starts at the screen's top-right corner ON TOP
  // of the crown strip (z 3100 > the frieze's 3000), so its own frieze band —
  // not a hairline — is what meets that edge, exactly as the strip does
  // everywhere else.
  border-top: none;
  border-right: none;
  border-bottom: 1px solid var(--grey-6);
  border-left: 1px solid var(--grey-6);
  border-top-left-radius: 0;
  border-bottom-left-radius: var(--radius-lg);
  // The shared `--plaque-coat` since 2026-08-17 (user ask) — a --light-cream
  // sheet under a 30% --grey-3 veil, the same two layers the nav bar, the left
  // drawer and the pins widget took that session, so the window's chrome edges
  // stay ONE material. It was a flat brown-1 plaque before, and the rest of
  // the recipe is unchanged: no sheen gradients, both presentations, opaque
  // (no backdrop blur). Shadow drops downward (the widget hangs from the top)
  // PLUS the shared left-edge cast (`--shadow-side-edge`, 2026-07-24) that the
  // pins widget and the nav bar's pin-tack slot also wear — the right-edge
  // column lies on top of the page as one raised strip, in BOTH presentations
  // (this rule is state-agnostic). The panel's borders and its inset well
  // JOINED IT in the grey family on 2026-08-17 (user ask) — `--grey-6` rims,
  // `--grey-4` wells, tone-for-tone with the brown-4/brown-2 pair they
  // replace — so the well still reads as a step sunk under the paler coat.
  background: var(--plaque-coat);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow:
    0 10px 40px rgba(var(--ink-rgb-deep), 0.18),
    var(--shadow-side-edge);

  // Height is shrink-to-fit in BOTH presentations — the panel hugs its item
  // bundle and only starts scrolling once the bundle would pass its cap. That
  // cap is the STACK's 70% share of the 90vh side band (--dock-stack-h, 63vh)
  // — the history is the long list of the pair, so it takes the lion's share
  // and the pinned widget keeps 30% (2026-07-24; both were an even 45vh).
  height: auto;
  max-height: var(--dock-stack-h);

  &:not(.is-parked) {
    width: 300px;
    max-width: 96vw;
  }

  &.is-parked {
    width: var(--dock-rail-w);
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

// Parked head glyph sits at the bottom, exactly where the header goes when
// expanded and exactly as tall as it (--dock-bar-h, shared chrome) — no extra
// margin, or the list box above it would shift between presentations.
.stack-side-head { margin: 0; }

// The top-edge frieze band must keep its full height in the flex column (the
// list below it is the shrinking scroller). Since the widget now overlaps the
// crown strip, this band REPLACES it across the stack's column, so it wears
// FriezeHeader's EXACT box: the same height (now the trio's `--frieze-bar-h`
// = 0.96 × `--frieze-h` since the same sitting's trim walk — this scoped
// height reads that dial) plus a 1px bottom
// lip (the strip's own brown-3 until 2026-08-17's rim ask took it to
// `--grey-6`, the trio's rim ink) — which, border-box, also trims the same
// 1px off the carve area, so both motifs are drawn at an identical size and
// the band doesn't step at the widget's left edge. Only the palette differs — and since
// 2026-08-17 (user ask) it is not FriezeBar's default brown-4 but the SIDE
// CHROME TRIO rule in `_components.scss`: a `--grey-8` plate under the
// orange-11/teal-11 wave weave, shared by name with `.pins-frieze` and the
// drawer's `.drawer-frieze` bands. ⚠ The bottom lip below stayed brown-3
// through the re-coat and joined the trio's rims in the same sitting's rim
// ask (every trio band wears 1px `--grey-6` top+bottom now) — the walk the
// earlier note here predicted. The scoped declaration stays, in the trio's
// ink: it records that THIS band's lip predates the trio and is the crown
// strip's edge, whatever ink that edge wears.
.stack-frieze {
  flex-shrink: 0;
  height: var(--frieze-bar-h, var(--frieze-h));
  border-bottom: 1px solid var(--grey-6);
}

// The INNER band (2026-07-24) — same block, same total size, sitting between
// the scroll well and the header / head glyph. It is not standing in for the
// crown strip, so it carried no lip of its own until the trio rule rimmed
// every band 1px `--grey-6` top+bottom (2026-08-17); border-box means the
// band above resolves to the very same `--frieze-bar-h` box, and the two read as a
// matched pair bracketing the well. Full bleed like its twin: the band spans
// the widget's width while the well inside keeps its margins. (The
// `border-bottom: none` that once cancelled the top band's lip here is gone —
// it would now cancel the trio's rim, this scoped rule outranking it.)
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
  // 2026-08-17's palette ask; the floor went a step lighter than the rim on
  // 2026-07-24 so the well reads as a soft recess under the plaque rather than
  // a dark trough, and that step is what the grey pair preserves.)
  // The well is BRACKETED BY TWO FRIEZE BANDS now, so it gets a wider **8px**
  // reveal top and bottom (2026-07-24 — the bottom was 3px when a bare header
  // sat under it): a carved wave band needs more air than a flat plaque edge,
  // and equal gaps keep the well centred between its two bands. Whatever the
  // number, it must be the SAME in BOTH faces — an asymmetric margin would
  // move the list box between presentations and break the in-place unravel
  // once the history overflows the cap.
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
  // Track matches the well floor (`--grey-4` since 2026-08-17, brown-2 before)
  // so only the thumb reads; the thumb keeps the well's rim ink, `--grey-6`.
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: var(--grey-4); border-radius: 999px; }
  &::-webkit-scrollbar-thumb { background: var(--grey-6); border-radius: 999px; }

  // Parked face of the SAME scroller: narrowed to the icon column, chips
  // centered, same vertical padding + gap as above so the items keep their
  // levels, scrollbar hidden (scrollbar-width: none makes Chrome 121+ skip
  // the ::-webkit-scrollbar styling above and hide it too).
  // Side margins tighten to 2px here so the chips sit closer to the column's
  // edges; the vertical margins stay exactly as above.
  &.is-parked {
    margin: 8px 2px;
    padding: 4px 0;
    align-items: center;
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
