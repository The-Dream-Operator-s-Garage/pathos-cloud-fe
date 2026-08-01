<!--
  FEED — new container layout (2026-07-25).

  Geometry: one transparent horizontal scroll track that fills the window slot
  left over by the chrome — from the very TOP of the window (it runs UP OVER
  the frieze crown strip), over the nav bar, right of the drawer, left of the
  stack/pins column — with a single blue-grey container box LEFT-PACKED in it
  at 40% width (2026-07-27, third sizing pass that day: 50% → 30% → 40%),
  full slot height, a sliver of daylight off the drawer's edge.

  The container is no longer empty (2026-07-25): the post stream that was
  parked in FeedPageLegacy.vue now lives inside it as `FeedStream`, refitted
  to the column (one column, detail panel unfolding in place, its own
  scrolling well). FeedPageLegacy stays verbatim and unrouted as the restore
  point for the old full-page surface.
-->
<template>
  <q-page class="feed-page" :style-fn="pageStyleFn">
    <!-- Transparent track: the horizontal scroller. Its box IS the free
         window slot (see .feed-page) and reaches the window's top edge, so
         anything laid inside it scrolls sideways without ever moving the page
         itself, and stands OVER the crown strip. -->
    <div ref="trackEl" class="feed-track" @scroll.passive="onTrackScroll">
      <!-- Feed container — left-packed, 40% of the track's width, window top
           to nav bar. Its two side EDGES are vertical
           frieze bars (the crown strip turned 90° CW, blue-grey colorway),
           lips facing inward. They are a MIRRORED PAIR (2026-07-25): variant
           A on the left, variant B — the same bar with its waves flipped
           horizontally — on the right, so the two edges reflect each other
           across the box instead of repeating. The box wears the bars' own
           plaque tone, so frame and field are one continuous material, and
           casts a soft shadow off each side so it reads as standing above
           the page. -->
      <div class="feed-container">
        <FriezeBarVertical lip="right" />
        <div class="feed-container__body">
          <FeedStream :selected-id="selected?.skeleton_id || null" @select="onSelect" />
        </div>
        <FriezeBarVerticalB lip="left" />
      </div>
    </div>

    <!-- POST INFORMATION FLYOUT (2026-07-26) — the feed's detail box, back.
         It is a sibling of the TRACK, not of the stream: the container clips
         its content (that is what keeps the stream in its column), so a box
         placed inside it could never reach the free half of the window beside
         it. Placed here it is positioned against the page's own box, which IS
         the free window slot — the layout has already carved the drawer off
         its left and the parked stack/pins column off its right — so "the
         right half of the available screen" needs no measurement. -->
    <transition name="feed-flyout">
      <!-- The slot follows the track's horizontal scroll (2026-07-31 — the
           "flyout doesn't follow" G8 limit): its left/right restate the
           47.5%/5% rhythm shifted by scrollLeft, so the box rides WITH the
           container instead of hanging over whatever slides under it. Done
           on left/right, not transform — the enter/leave transition owns
           transform, and an inline one would freeze the animation. -->
      <div
        v-if="selected" class="feed-flyout"
        :style="trackScroll ? {
          left: `calc(47.5% - ${trackScroll}px)`,
          right: `calc(5% + ${trackScroll}px)`
        } : null"
      >
        <FeedPostFlyout :item="selected" @close="clearSelection" />
      </div>
    </transition>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import FeedPostFlyout from 'src/components/posts/FeedPostFlyout.vue'

export default defineComponent({
  name: 'FeedPage',
  components: { FriezeBarVertical, FriezeBarVerticalB, FeedStream, FeedPostFlyout },
  setup () {
    // Quasar's default style-fn stamps an inline `min-height` on the page
    // derived from the layout height — which would make the page taller than
    // the slot and hand the window a vertical scrollbar. This page sizes
    // itself in CSS instead, so hand back nothing.
    const pageStyleFn = () => ({})

    // The post the flyout is reading out. The PAGE owns it rather than the
    // stream, because the box it feeds lives outside the feed container —
    // whoever places the flyout has to hold what goes in it.
    //
    // The whole feed item is kept, not just its id: `GET /feed` already
    // answered with everything the panel shows (author card, moment, content
    // node, provenance, labels, tallies), so opening the box costs no request.
    const selected = ref(null)

    // TOGGLE, not set: the trigger for a post that is already open is the way
    // to close it again. Both triggers (title plate, foot chip) come through
    // here, so either closes what either opened.
    const onSelect = (item) => {
      selected.value =
        selected.value && selected.value.skeleton_id === item.skeleton_id ? null : item
    }

    const clearSelection = () => { selected.value = null }

    // Horizontal scroll-follow (G8 limit closed 2026-07-31): mirror the
    // track's scrollLeft so the flyout's slot shifts with the content. The
    // track only overflows when its content exceeds it, so this is usually 0.
    const trackEl = ref(null)
    const trackScroll = ref(0)
    const onTrackScroll = () => { trackScroll.value = trackEl.value?.scrollLeft || 0 }

    // Escape closes it — the flyout hovers over the page rather than being
    // part of it, and a floating box needs a dismissal that does not require
    // finding its close button.
    const onKeydown = (e) => { if (e.key === 'Escape') clearSelection() }
    onMounted(() => window.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

    return { pageStyleFn, selected, onSelect, clearSelection, trackEl, trackScroll, onTrackScroll }
  }
})
</script>

<style lang="scss" scoped>
// The free window slot. Left and right are already carved by the layout:
// MainLayout's q-page-container pads left by the drawer and right by
// windows.railWidth (the parked stack/pins column). The vertical span is
// ours to state — the nav bar is fixed, so the page subtracts it by hand.
//
// The slot reaches the window's TOP EDGE (2026-07-25): the negative
// margin-top cancels q-page-container's `padding-top: var(--frieze-h)`, so
// the track — and the container in it — start at y=0 and run UP OVER the
// fixed crown strip instead of beginning below it.
.feed-page {
  height: calc(100vh - var(--nav-footer-h));
  margin-top: calc(-1 * var(--frieze-h));
  padding: 0;
  overflow: hidden;
  // The containing block for the flyout (2026-07-26). Deliberately WITHOUT a
  // z-index: `position: relative` alone creates no stacking context, so the
  // flyout's 3002 still competes with the fixed chrome globally (over the
  // frieze bands at 3000 and the feed container at 3001, under the drawer at
  // 3050 and the pinned column at 3100). Give this element a z-index and the
  // whole page becomes one context — the flyout would then rank against the
  // page as a unit and slide under both bands.
  position: relative;
}

.feed-track {
  height: 100%;
  width: 100%;
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: stretch;
  // LEFT-PACKED (2026-07-25 — it centred its single box before). This is
  // also the correct anchoring for a horizontal scroller: with `center`, a
  // content run wider than the track gets clipped at the START, unreachable
  // because scrollLeft can't go negative. Left-packed, growth just extends
  // rightward into scrollable space.
  justify-content: flex-start;
}

// 40% wide overall (2026-07-27 — user ask; the day walked 50% → 30% → 40%,
// having grown to 50% from 40% on 2026-07-25) — the two vertical frieze bars
// are its EDGES, not extras bolted outside it, so the percentage covers the
// whole box. The bars replace the plain side borders it used to draw: each
// bar carries that hairline as its inward-facing lip (lime-3 at first,
// blue-grey-3 since the bar's colorway moved, 2026-07-25).
.feed-container {
  flex: 0 0 40%;
  height: 100%;
  display: flex;
  align-items: stretch;
  // Holds the 40% EXACTLY, now that the box has content in it. A flex item's
  // default `min-width: auto` is a floor at its content's min-content size,
  // and that floor OUTRANKS a percentage flex-basis — the stream's widest
  // nowrap post title measured out to 54.6% of the track before this line.
  // FeedStream zeroes the same floor down its own chain so the title
  // ellipsizes; this is the guarantee at the box itself.
  min-width: 0;
  // A FORTIETH OF THE TRACK of daylight off the drawer's edge (a hairline
  // 8px until 2026-07-25, then a tenth, 5% for most of the range since, and
  // halved to 2.5% on 2026-07-27 with the box at 40%), so the frieze still
  // reads as its own object rather than as trim on the
  // drawer. Carried as the ITEM's margin, not the track's
  // padding — the reason matters more at this width: a percentage flex-basis
  // resolves against the track's CONTENT box, so padding here would quietly
  // make the box 40% of (track − gap) instead of a true 40%. As a
  // margin the two percentages share that basis and simply add: 2.5 + 40 =
  // 42.5% of the track, so the box keeps its exact 40% and nothing overflows.
  margin-left: 2.5%;
  background: var(--blue-grey-1); // Quasar blue-grey-1 — the same plaque coat the frieze bars wear, so box and edges are one material

  // The container is OPAQUE, so overlapping the crown strip is a paint-order
  // question: FriezeHeader is fixed at z 3000, and only a positioned box above
  // that number covers it. The z-index rides the CONTAINER, not the track —
  // the track is transparent, and lifting the whole slot would put an
  // invisible 3001 sheet over every dock (2400+) in the page's area. The left
  // drawer (3050) still outranks the container, as it does the strip itself.
  position: relative;
  z-index: 3001;

  // Slight side shadows — cast off each vertical frieze edge so the box reads
  // as standing above the page rather than being inlaid in it. The negative
  // spread keeps them tight to the edges; the track's `overflow-y: hidden`
  // trims whatever would bleed past the top and bottom, so the effect stays
  // strictly lateral. The alpha is high for a "slight" shadow on purpose: it
  // falls on the page's near-black canvas, where anything under ~0.4 darkens
  // by too few levels to be seen at all.
  box-shadow:
    -8px 0 18px -4px rgba(0, 0, 0, 0.55),
    8px 0 18px -4px rgba(0, 0, 0, 0.55);
}

// The field between the two frieze edges — it holds the feed content
// (FeedStream) and CLIPS it: the stream carries its own scrolling well, so
// nothing here may spill past the container or grow the page.
.feed-container__body {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

// THE FLYOUT'S SLOT (2026-07-26) — where the post information box stands when
// a card's title or foot chip opens it.
//
// VERTICALLY it is BETWEEN THE TWO FRIEZE BANDS, and CLEAR of both. The page's
// own box already runs from the window's top edge (the negative `margin-top`
// above) down to the nav bar, and the two bands sit at those extremes: the
// crown strip takes the first `--frieze-h`, the frieze footer — parked on the
// nav bar — takes the last. Insetting by that token is what puts the box
// INSIDE the friezed chrome rather than under either band; `--flyout-gap` on
// top of it is what makes it FLOAT there (2026-07-26, second pass — it was
// flush against both bands, so a carved wave ran straight into the plaque's
// rounded corner at each end and the box read as wedged between them rather
// than hovering). Written as `top`/`bottom` rather than a height, so the box
// simply follows the window.
//
// HORIZONTALLY it fills the track to the right of the container, laid out on
// the same percentages the container uses so the two boxes share one rhythm
// across the track (restated with each container resize, 2026-07-27):
//
//     2.5% gap │ container 40% │ 5% gap │ FLYOUT 47.5% │ 5% gap
//
// so its left edge sits at 47.5% — the container's own 42.5% (margin +
// width) plus the box gap. The drawer-side gap halved to 2.5% that day; the
// two gaps AROUND the flyout deliberately did not follow, so the flyout
// keeps the same daylight off both of its neighbours. The percentages
// resolve against this page's content box, which is the same box the track
// fills, so the two sets line up exactly.
//
// The track-scroll limit is CLOSED (2026-07-31): the page mirrors the
// track's scrollLeft into an inline left/right override on this slot, so
// when the track overflows and scrolls, the box shifts with the content
// instead of hanging over whatever slides under it. The override rides
// left/right (not transform — the enter/leave transition owns transform).
.feed-flyout {
  // The daylight the box keeps off each band, on top of the band's own height.
  // Deliberately NOT the 5% the horizontal gaps use: that resolves against the
  // slot's WIDTH and would come to ~67px here, which this axis cannot spare —
  // the box is 800px tall in a 1342px-wide slot, so the same figure reads
  // generous sideways and wasteful vertically. A flat px value also keeps the
  // two ends equal at every window height, which a percentage would not.
  --flyout-gap: 14px;

  position: absolute;
  top: calc(var(--frieze-h) + var(--flyout-gap));
  bottom: calc(var(--frieze-h) + var(--flyout-gap));
  left: 47.5%;
  right: 5%;
  // Over the crown strip and the frieze footer (3000) and over the feed
  // container (3001), which it stands beside; under the left drawer (3050)
  // and the pinned stack/pins column (3100), the two surfaces that overlap
  // everything on this page.
  z-index: 3002;
}

// It arrives from the right — the direction it lives in, so the motion says
// where the box came from rather than just that it appeared.
.feed-flyout-enter-active,
.feed-flyout-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.feed-flyout-enter-from,
.feed-flyout-leave-to {
  opacity: 0;
  transform: translateX(14px);
}
</style>
