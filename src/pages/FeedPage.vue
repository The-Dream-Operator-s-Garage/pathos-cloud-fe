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

  THE FLYOUT LEFT THIS PAGE with the 2026-08-17 FUSION. From 2026-07-26 the
  page owned a single detail box in a computed `.feed-flyout` slot beside
  the column — selection state, Escape, maximize, a scroll-follow mirror,
  park flags in `stores/flyouts.js`. All of it died when the box joined the
  floating-viewer family: a card trigger now SPAWNS a free window
  (`stores/flyoutViewers.js` → ElementFlyoutHost in MainLayout), placed by
  the fit engine, dragged anywhere, N at a time. What the page still owns
  is the two doors — `select` from the cards, and the `?flyout=<ref>`
  query — and the lit marks the store answers back.
-->
<template>
  <q-page class="feed-page" :style-fn="pageStyleFn">
    <!-- Transparent track: the horizontal scroller. Its box IS the free
         window slot (see .feed-page) and reaches the window's top edge, so
         anything laid inside it scrolls sideways without ever moving the page
         itself, and stands OVER the crown strip. -->
    <div class="feed-track">
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
               same route ElementFlyoutHost's tack takes.
               `select` (the foot's references button AND the cap's
               open_in_new, merged 2026-08-17) SPAWNS the post's flyout
               viewer — one window per element, re-triggering fronts it —
               and `open-ids` lights the pressed triggers on every card
               whose window is open. -->
          <FeedStream
            :open-ids="flyouts.openPostIds"
            @select="onSelect"
            @pins-changed="$emit('pins-changed')"
          />
        </div>
        <FriezeBarVerticalB lip="left" class="feed-container__edge" />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'

export default defineComponent({
  name: 'FeedPage',
  components: { FriezeBarVertical, FriezeBarVerticalB, FeedStream },
  // Declared so it does NOT fall through to the root element as a DOM
  // listener — MainLayout binds it on the router-view.
  emits: ['pins-changed'],
  setup () {
    // Quasar's default style-fn stamps an inline `min-height` on the page
    // derived from the layout height — which would make the page taller than
    // the slot and hand the window a vertical scrollbar. This page sizes
    // itself in CSS instead, so hand back nothing.
    const pageStyleFn = () => ({})

    // The flyout viewers (the fused window family, 2026-08-17). The page
    // holds NO viewer state of its own any more — a trigger spawns, the
    // store dedupes per element and fronts an existing window, and the
    // windows live in MainLayout's host across every route.
    const flyouts = useFlyoutViewersStore()

    const onSelect = (item) => { flyouts.spawnPost(item) }

    // The REF DOOR (2026-07-31 as the deferred G8 item, skeletons only;
    // nodes/ refs since 2026-08-17): `/#/feed?flyout=skeletons/<hash>`,
    // `?flyout=nodes/<hash>` or a bare skeleton id spawns a viewer on that
    // element — the window picks the face per kind, and a ref that
    // resolves to a post steps forward to its card. Read on entry and on
    // in-place route changes.
    const route = useRoute()
    watch(() => route.query.flyout, (v) => {
      if (v) flyouts.spawnRef(String(v))
    }, { immediate: true })

    return { pageStyleFn, flyouts, onSelect }
  }
})
</script>

<style lang="scss" scoped>
// The free window slot. Left and right are already carved by the layout:
// MainLayout's q-page-container pads left by the drawer and right by
// windows.railWidth (the parked stack/pins column). The vertical span is
// ours to state — the nav bar is fixed, so the page subtracts it by hand.
//
// The slot starts UNDER THE SILVER RAIL and nothing above it (2026-08-12).
// It used to reach y=0 with a negative `margin-top` cancelling
// q-page-container's `padding-top: var(--frieze-h)`, so the track ran UP OVER
// the fixed crown strip. That strip is deleted (user ask) and the container
// pads down by `--media-tabs-h` alone, which is the same line the column's top
// edge already sat on — so the cancel came off with the strip. ⚠ It is why the
// height below subtracts --media-tabs-h and NOT --frieze-h: one band up there,
// and the page box starts under it.
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
// a negative `margin-bottom`) and the bar's `.nav-footer--underlaid`
// step-down all went with it. The bar is the topmost fixed chrome again at
// EVERY width (NavigationBar.vue z 3110), which is also what makes the
// burger safe on a narrow window — see gotchas.md.
//
// (The `position: relative` + no-z-index note that closed this comment for
// months — the flyout slot's containing block — left with the flyout: the
// page positions nothing over itself now. The container's own 3001 is
// against the fixed chrome and needs no positioned ancestor.)
.feed-page {
  height: calc(100vh - var(--nav-footer-h) - var(--media-tabs-h, 0px));
  padding: 0;
  overflow: hidden;
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

// Mobile pass (Thread H item 1, 2026-07-31): under 600px the container
// takes the whole track — the stack/pins rail is hidden, so the slot IS
// the screen minus the drawer's mini column. (The flyout rules that used
// to share this block left with the flyout: the viewers place themselves
// through the fit engine's arena, which has its own mobile answer.)
@media (max-width: 600px) {
  .feed-container {
    flex: 0 0 95%;
  }
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
//  · (The `.feed-flyout` inset bullet that closed this list belonged to the
//    single-box era and left with it, 2026-08-17.)
</style>
