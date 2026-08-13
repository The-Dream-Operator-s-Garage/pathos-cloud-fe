<!--
  FEED — new container layout (2026-07-25).

  Geometry: one transparent horizontal scroll track that fills the window slot
  left over by the chrome — from the very TOP of the window (it runs UP OVER
  the frieze crown strip), over the nav bar, right of the drawer, left of the
  stack/pins column — with a single indigo container box LEFT-PACKED in it
  at 45% width (2026-08-02 user ask, +5 over the 40% that 2026-07-27's
  three sizing passes settled on: 50% → 30% → 40%),
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
      <!-- Feed container — left-packed, 45% of the track's width, window top
           to nav bar. Its two side EDGES are vertical
           frieze bars (the crown strip turned 90° CW, indigo colorway),
           lips facing inward. They are a MIRRORED PAIR (2026-07-25): variant
           A on the left, variant B — the same bar with its waves flipped
           horizontally — on the right, so the two edges reflect each other
           across the box instead of repeating. The box wears the bars' own
           plaque tone, so frame and field are one continuous material, and
           casts a soft shadow off each side so it reads as standing above
           the page. They are THINNER than the crown strip since 2026-08-07
           (user ask) — see `.feed-container__edge`. -->
      <div class="feed-container">
        <FriezeBarVertical lip="right" class="feed-container__edge" />
        <div class="feed-container__body">
          <!-- `pins-changed` is a PASS-THROUGH, not this page's business: a
               card's cap can pin a post, and the pins widget that has to
               reload lives in MainLayout. The page re-emits so the layout's
               `pinsRefreshKey` hears it through the router-view, which is the
               same route MediaViewerHost's tack takes. -->
          <FeedStream
            :selected-id="selected?.skeleton_id || null"
            :flyout-id="flyoutRef"
            @select="onSelect"
            @open-skeleton="onOpenSkeleton"
            @pins-changed="$emit('pins-changed')"
          />
        </div>
        <FriezeBarVerticalB lip="left" class="feed-container__edge" />
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
           52.5%/5% rhythm shifted by scrollLeft, so the box rides WITH the
           container instead of hanging over whatever slides under it. Done
           on left/right, not transform — the enter/leave transition owns
           transform, and an inline one would freeze the animation. -->
      <!-- `v-show` for the PARKED state, `v-if` for the open one (2026-08-10,
           the minimize ask). Minimize is not a close: the box keeps its DOM,
           so its scroll position survives the round-trip and restoring costs
           no request — `FeedPostPanel` quotes the content node through
           `GET /nodes/by-path`, and a `v-if` would re-fetch it every time the
           tab is clicked. Same reasoning `MediaViewerHost` uses to keep a
           parked video playing. -->
      <div
        v-if="selected || flyoutRef"
        v-show="!flyouts.skeleton.minimized"
        class="feed-flyout"
        :class="{ 'is-max': flyoutMax }"
        :style="trackScroll && !flyoutMax ? {
          left: `calc(52.5% - ${trackScroll}px)`,
          right: `calc(5% + ${trackScroll}px)`
        } : null"
      >
        <!-- The lights ask, THIS PAGE performs: the box knows nothing about
             where it stands (SkeletonFlyout's oldest rule), so the flags go
             down as props and the requests come back as events. Minimize is
             the exception that proves it — the destination is the strip at
             the TOP of the screen, which is neither this page's element nor
             the box's, so it travels through the flyouts store instead. -->
        <SkeletonFlyout
          :item="selected" :skeleton-ref="flyoutRef" :maximized="flyoutMax"
          @close="clearSelection" @toggle-max="flyoutMax = !flyoutMax"
          @minimize="flyouts.minimizeSkeleton()"
        />
      </div>
    </transition>
  </q-page>
</template>

<script>
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useFlyoutsStore } from 'src/stores/flyouts'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import SkeletonFlyout from 'src/components/skeletons/SkeletonFlyout.vue'

export default defineComponent({
  name: 'FeedPage',
  components: { FriezeBarVertical, FriezeBarVerticalB, FeedStream, SkeletonFlyout },
  // Declared so it does NOT fall through to the root element as a DOM
  // listener — MainLayout binds it on the router-view.
  emits: ['pins-changed'],
  setup () {
    // Quasar's default style-fn stamps an inline `min-height` on the page
    // derived from the layout height — which would make the page taller than
    // the slot and hand the window a vertical scrollbar. This page sizes
    // itself in CSS instead, so hand back nothing.
    const pageStyleFn = () => ({})

    // The flyout's WINDOW state (2026-08-10). Minimized/maximized live in a
    // store rather than in this file because the yellow light parks the box
    // into `MediaTabsBar`, the thin band at the top of the screen — a
    // component on the far side of the layout, which props and emits cannot
    // reach. Everything the box SHOWS is still this page's (below).
    const flyouts = useFlyoutsStore()

    // The post the flyout is reading out. The PAGE owns it rather than the
    // stream, because the box it feeds lives outside the feed container —
    // whoever places the flyout has to hold what goes in it.
    //
    // The whole feed item is kept, not just its id: `GET /feed` already
    // answered with everything the panel shows (author card, moment, content
    // node, provenance, labels, tallies), so opening the box costs no request.
    const selected = ref(null)

    // ANY skeleton in the flyout (2026-07-31 — the deferred G8 item, closed):
    // `/#/feed?flyout=skeletons/<hash>` (or a bare id) opens the box on that
    // skeleton's generic face. The query param is read on entry and on
    // in-place route changes; selecting a post card supersedes it.
    const route = useRoute()
    const flyoutRef = ref(null)
    watch(() => route.query.flyout, (v) => {
      if (v) { flyoutRef.value = String(v); selected.value = null; flyouts.restoreSkeleton() }
    }, { immediate: true })

    // TOGGLE, not set: the trigger for a post that is already open is the way
    // to close it again. Both triggers (title plate, foot chip) come through
    // here, so either closes what either opened.
    // (2026-08-10) A PARKED box is un-parked instead of toggled: clicking a
    // card while the flyout sits in the top strip means "show me this", never
    // "close the thing I cannot see". The toggle only answers a box that is
    // actually on screen.
    const onSelect = (item) => {
      flyoutRef.value = null
      if (flyouts.skeleton.minimized) {
        flyouts.restoreSkeleton()
        selected.value = item
        return
      }
      selected.value =
        selected.value && selected.value.skeleton_id === item.skeleton_id ? null : item
    }

    // The cap's `open_in_new` (2026-08-07): the same box, pointed at the post
    // AS A SKELETON rather than at its post face. It reuses the `skeletonRef`
    // door the query param opened — a bare id is one of the two forms
    // SkeletonFlyout accepts — so nothing new had to be taught to the flyout.
    //
    // A TOGGLE, like `onSelect`, and mutually exclusive with it: the box shows
    // one thing, so opening either face closes the other.
    const onOpenSkeleton = (item) => {
      selected.value = null
      const ref = String(item.skeleton_id)
      if (flyouts.skeleton.minimized) {
        flyouts.restoreSkeleton()
        flyoutRef.value = ref
        return
      }
      flyoutRef.value = flyoutRef.value === ref ? null : ref
    }

    // Closing also UN-PARKS, so the store can never hold a tab for a box that
    // is no longer open (the tab bar reads `minimized` alone — see the store).
    const clearSelection = () => {
      selected.value = null
      flyoutRef.value = null
      flyouts.restoreSkeleton()
    }

    // ── The flyout's SIZE (2026-08-10, with the traffic lights) ──────────
    // The box's green light emits; the size is this page's, because the slot
    // is (`.feed-flyout` below). Kept ACROSS closes, the way the docks
    // remember their maximized state: a box you left maximized should come
    // back the way you left it, or the same click means two different things
    // on two different days.
    const flyoutMax = ref(false)

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
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeydown)
      // The box dies with this page, so its parked TAB must too — a handle in
      // the top strip that restores nothing is worse than no handle. (The
      // maximized flag survives on purpose; see the store.)
      flyouts.resetSkeleton()
    })

    return { pageStyleFn, flyouts, selected, flyoutRef, flyoutMax, onSelect, onOpenSkeleton, clearSelection, trackEl, trackScroll, onTrackScroll }
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
//
// ── AND IT STOPS ON THE NAV BAR'S TOP EDGE, EXACTLY (2026-08-12, user ask:
// "the feed container's lower edge starts drawing from the top edge of the
// footer") ── The column is a box STANDING ON the bar: its lower edge — the
// border and both frieze bars' bottom caps — is drawn on the bar's own top
// edge, and the whole bar stays visible and clickable below it. Two things
// this height has to name, and it only named one for months:
//
//  · `--nav-footer-h` — the fixed bar the page must subtract by hand.
//  · `--media-tabs-h` — the PERMANENT band above the crown strip, which
//    `q-page-container` pads DOWN by (MainLayout states both tokens in its
//    `paddingTop`) while the negative margin above cancels only `--frieze-h`.
//    So the page box starts ~5px down and, without this second term, its
//    bottom hung those same ~5px INTO the bar — a hairline of column over
//    the plaque, and `documentElement.scrollHeight` 5px past `innerHeight`
//    (the vertical scrollbar `pageStyleFn` exists to prevent). Subtracting
//    the band lands the edge on the bar's line and squares the page's
//    scroll height with the window at last.
//
// ⚠ THE COLUMN NO LONGER RUNS PAST THE BAR TO THE WINDOW FLOOR. That
// behaviour stood from 2026-08-02 (desktop only, `min-width: 1024px`) and for
// part of 2026-08-12, when a first reading of this ask widened its gate to
// `601px`; the ask turned out to be the opposite one — the bottom edge should
// be DRAWN, not bled off the screen — so the growth block (`height: 100vh` +
// a negative `margin-bottom`), its flyout inset restatement and the bar's
// `.nav-footer--underlaid` step-down all went with it. The bar is the topmost
// fixed chrome again at EVERY width (NavigationBar.vue z 3110), which is also
// what makes the burger safe on a narrow window — see gotchas.md.
.feed-page {
  height: calc(100vh - var(--nav-footer-h) - var(--media-tabs-h, 0px));
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

// 45% wide overall (2026-08-02 — user ask; 2026-07-27 walked 50% → 30% →
// 40%, having grown to 50% from 40% on 2026-07-25) — the two vertical frieze bars
// are its EDGES, not extras bolted outside it, so the percentage covers the
// whole box. The bars replace the plain side borders it used to draw: each
// bar carried that hairline as its inward-facing lip (lime-3 at first,
// blue-grey-3 since the bar's colorway moved on 2026-07-25, indigo-3 from the
// operator's hue-swap ask on 2026-08-05, then -6, -5 and -4 across that day and
// the next) — and since 2026-08-06 it carries NO line: the lip is `--grey-4`,
// the plaque's own tone, because the same ask took the well's side padding to 0
// and the post cards now run lip to lip with their own border. The box's side
// edges are the CARDS' edges now; the bars simply end where the cards begin.
// THE CONTAINER'S TWO EDGES, thinner than the bar's own default since
// 2026-08-07 (user ask, "a little thinner") — `0.8 × --frieze-h`, ~15.1px
// against 18.9px at a 900px viewport. `--frieze-bar-v-w` is the vertical bar's
// published thickness dial and it drives BOTH the `width` and the `flex-basis`
// inside the component, so nothing here has to restate the geometry; the body
// simply takes the ~7.5px the pair gives back, the container's own 45% of the
// track being untouched.
//
// It is dialled on the BARS, not on `.feed-container`, and deliberately: the
// dial inherits, and the head box's two inner posts live inside this box. They
// would survive it (`slim` sets the same property ON the element, which beats
// an inherited value) — but that is a cascade fact to re-derive every time
// rather than a rule to read, and the same nesting already has a gotcha of its
// own about selectors matching four bars where you meant two.
//
// The floor is the motif, as everywhere in this family: the masks are a 13-row
// grid read ACROSS the thickness here, so this lands at ~1.16px a row where the
// full bar gives ~1.45px. Both are above the sub-pixel range that turns the
// meander into a texture (see gotchas.md); `slim` — half the full bar — is
// where these bars stop being a pattern, and it exists for the head box's 9px
// posts, which carry a motif chosen to survive it.
.feed-container__edge {
  --frieze-bar-v-w: calc(var(--frieze-h) * 0.8);
}

.feed-container {
  flex: 0 0 45%;
  height: 100%;
  display: flex;
  align-items: stretch;
  // Holds the 45% EXACTLY, now that the box has content in it. A flex item's
  // default `min-width: auto` is a floor at its content's min-content size,
  // and that floor OUTRANKS a percentage flex-basis — the stream's widest
  // nowrap post title measured out to 54.6% of the track before this line.
  // FeedStream zeroes the same floor down its own chain so the title
  // ellipsizes; this is the guarantee at the box itself.
  min-width: 0;
  // A FORTIETH OF THE TRACK of daylight off the drawer's edge (a hairline
  // 8px until 2026-07-25, then a tenth, 5% for most of the range since, and
  // halved to 2.5% on 2026-07-27), so the frieze still
  // reads as its own object rather than as trim on the
  // drawer. Carried as the ITEM's margin, not the track's
  // padding — the reason matters more at this width: a percentage flex-basis
  // resolves against the track's CONTENT box, so padding here would quietly
  // make the box 45% of (track − gap) instead of a true 45%. As a
  // margin the two percentages share that basis and simply add: 2.5 + 45 =
  // 47.5% of the track, so the box keeps its exact 45% and nothing overflows.
  margin-left: 2.5%;
  // `--grey-2` since 2026-08-07 (user ask, one setting after `--grey-5`). Two
  // things to know before touching this line:
  //
  //  1. IT IS NOT VISIBLE ON ITS OWN. FeedStream's scroll bed covers this box
  //     edge to edge — measured, both are `95,5,571,900`, and the only part of
  //     the container outside that is behind the two opaque frieze bars — so
  //     the container's coat and the bed's must be set TOGETHER or the change
  //     is true here and invisible on screen. That trap cost a pass on
  //     2026-08-05 and again on the first setting of this ask. `.feed-stream__well`
  //     in FeedStream.vue is the other half; it carries the reasoning.
  //  2. THE BOX NO LONGER FOLLOWS ITS EDGES. From 2026-07-25 the container wore
  //     the frieze bars' own plaque tone so box and edges read as one material
  //     (`--indigo-1`, then `--grey-4` from 2026-08-05). That ended on
  //     2026-08-07 when the bars inverted to an `--indigo-8` plaque and the box
  //     did not follow: the bars are a DARK FRAME standing on this field now,
  //     which is the relation the head box's own inner posts have had since
  //     2026-08-06. So this tone is free to move on its own, and does.
  //
  // `--grey-4` again since 2026-08-07 (user ask), after one setting at
  // `--grey-2`. That tone had the field LIGHTER than the post cards (rgb
  // 245,245,245 against their veiled rgb 242,239,234), inverting the
  // figure/ground the surface has used since 2026-08-06: the box read as a
  // PAGE with slightly darker sheets on it rather than a plate with pale sheets
  // lying on it. This tone puts the card back above its bed — the reading its
  // whole tone stack was built for — and takes the step between them from three
  // levels to thirteen. See the scroll bed's note for the walk.
  background: var(--grey-4, #e0e0e0);

  // ── THE BOX'S SIDE BORDERS (2026-08-07, user ask) — 1px `--indigo-4` down
  // each side and NOTHING on the ends, which is the same shape as the bars'
  // own new edges and a different job.
  //
  // The bars' side borders are the PLAQUE's tone and draw no line; they reserve
  // a margin. This one is the opposite: it is the only line on the surface
  // OUTSIDE the dark frame, laid between the `--indigo-9` plate and the page's
  // near-black canvas, and `--indigo-4` (#7986cb) is five levels up from the
  // plate — a lit rim on the outside of the metal.
  //
  // Note where it lands. `.feed-container` is the flex PARENT of the two bars,
  // so its border sits OUTSIDE both — the box is framed on its outer
  // silhouette, not between bar and content. Two consequences worth carrying:
  //  · The border is inside the `box-shadow` cast below (a shadow is thrown
  //    from the border box), so the line sits in the shadow's brightest part
  //    rather than being softened by it.
  //  · `box-sizing: border-box` means it comes out of the 45% rather than
  //    widening the box, so the track's arithmetic (2.5 + 45 = 47.5%) is
  //    untouched.
  border-left: 1px solid var(--indigo-4, #7986cb);
  border-right: 1px solid var(--indigo-4, #7986cb);

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
//     2.5% gap │ container 45% │ 5% gap │ FLYOUT 42.5% │ 5% gap
//
// so its left edge sits at 52.5% — the container's own 47.5% (margin +
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
// Mobile pass (Thread H item 1, 2026-07-31): under 600px the container
// takes the whole track (the stack/pins rail is hidden, so the slot IS the
// screen minus the drawer's mini column) and the flyout overlays it
// full-width — one surface at a time, dismissed by Escape/its close button.
@media (max-width: 600px) {
  .feed-container {
    flex: 0 0 95%;
  }

  // Both states, so the green light never moves the box a pixel and looks
  // broken (2026-08-10): down here the flyout ALREADY overlays the full
  // width, which is what maximize means, and without naming `.is-max` here
  // that rule would win with its desktop 5% right inset — maximizing would
  // visibly SHRINK the box.
  //
  // `.feed-page` is on the second selector for ORDER, not for reach: this
  // media block stands ABOVE the `.feed-flyout` rules in the file (it always
  // has — `!important` is what let it), and two `!important` declarations of
  // equal specificity are settled by which comes LAST, which would be the
  // desktop one. The extra class breaks that tie here rather than moving a
  // block that has read in this order since the mobile pass.
  .feed-flyout,
  .feed-page .feed-flyout.is-max {
    left: 2.5% !important;   // outranks the scroll-follow inline override
    right: 2.5% !important;  // (the track can't meaningfully scroll here)
  }
}

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
  left: 52.5%;
  right: 5%;
  // Over the crown strip and the frieze footer (3000) and over the feed
  // container (3001), which it stands beside; under the left drawer (3050)
  // and the pinned stack/pins column (3100), the two surfaces that overlap
  // everything on this page.
  z-index: 3002;
}

// ── MAXIMIZED (2026-08-10, the green traffic light) ──────────────────────
// The whole free width of the track: from the container's own left gap
// (2.5%) to the flyout's right one (5%), so the box covers the feed column
// and stops exactly where it always stopped on the other side. The vertical
// band does NOT change — the box stays between the two frieze strips, which
// is a law of this slot rather than a size, and a reading surface that
// climbed over the crown strip would be the one thing on this page that does.
//
// `!important` for the reason the mobile rule below has it: the page writes
// the scroll-follow offsets as an INLINE left/right, and inline beats any
// selector. (The binding also stops emitting them while maximized — belt and
// braces, since a maximized box has no container to follow anyway.)
.feed-flyout.is-max {
  left: 2.5% !important;
  right: 5% !important;
}

// ── WHY THERE IS NO GROWTH BLOCK HERE ANY MORE (2026-08-12) ──
// From 2026-08-02 this file ended with a `min-width: 1024px` block that grew
// the page to `height: 100vh` with a matching negative `margin-bottom`, so the
// column ran PAST the bar to the window's floor and the stream scrolled
// through that last strip; NavigationBar carried the other half of it, the bar
// stepping down to z 2999 on this route (`.nav-footer--underlaid`) so the
// grown strip could actually paint over the plaque. A first reading of the
// 2026-08-12 ask widened that gate to `601px` for a few hours. The ask was the
// opposite one — "the feed container's lower edge starts drawing from the top
// edge of the footer" — so BOTH halves are gone and the height at the top of
// this file states the whole vertical span again, at every width.
//
// Three things came back with the bar (all of them worth not re-losing):
//  · The bar is the TOPMOST fixed chrome again everywhere — no route where a
//    dock's or the drawer's drop shadow can wash its plaque.
//  · The burger is safe on a narrow window with no special rule. Below 1024px
//    the drawer is a closed overlay and the BAR carries the burger at its left
//    end; while the gate was at 601 the column's 2.5% gap landed on that chip
//    (x 21 vs the chip's 9…33 at 900px wide) and a `max(2.5%, --dock-rail-w)`
//    floor on `.feed-container` had to be added to clear it. Nothing overlaps
//    the bar now, so the floor went too and the gap is a clean percentage of
//    the track at every width again.
//  · `.feed-flyout` keeps ONE bottom inset (`--frieze-h + --flyout-gap`,
//    stated above): it was restated with `--nav-footer-h` on top only because
//    it resolves against a page box that had grown a bar taller.

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
