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
    <div ref="trackEl" class="feed-track">
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
      <div
        ref="boxEl"
        class="feed-container"
        :class="[
          { 'is-sizing': !!sizing },
          sizing ? 'is-sizing--' + sizing : null
        ]"
        :style="boxStyle"
      >
        <!-- ── THE TWO RAILS (2026-08-18, user ask; BARE since 2026-08-21) ──
             Each frieze bar is wrapped, because the bar itself opts out
             of the pointer entirely (`FriezeBarVertical`'s `pointer-events:
             none` — it is decoration and says so). The wrapper is what
             hovers and what takes the resize drag; the bar
             inside it is untouched, still purely a plate with a motif on it.
             That split is deliberate: the day this surface wants a bar with
             no grip on it, the grip comes off here and the frieze family
             never learns about resizing.

             ⚠ NOTHING STANDS ON THE BARS ANY MORE (2026-08-21, user ask:
             "keep the frieze bars clean … their pattern fully displayed").
             The rails carried two keys each for three days — a fold key
             riding Talavero's board and a ↔ grip at mid height, both plates
             the bar's full width — and every one of them was a blank tablet
             laid OVER the meander. The keys went, and the FOLD went with
             them: the keys were its only door (the stub deliberately took no
             press of its own), so the container no longer folds shut. The
             resize drag survives — it lives on the rail's strip of space and
             costs the motif nothing: a cursor, a title, and a silhouette
             glow that never covers a single wave. -->
        <div
          class="feed-container__rail feed-container__rail--l"
          :title="railTitle"
          @pointerdown="onRailDown($event, 'l')"
        >
          <FriezeBarVertical lip="right" class="feed-container__edge" />
        </div>
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
        <div
          class="feed-container__rail feed-container__rail--r"
          :title="railTitle"
          @pointerdown="onRailDown($event, 'r')"
        >
          <FriezeBarVerticalB lip="left" class="feed-container__edge" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'

// ── THE CONTAINER'S GEOMETRY (2026-08-18, user ask) ──────────────────────
// Three numbers and one flag are all this surface's new sizing needs, and
// every one of them is a CLAMP rather than a size: the box keeps deciding its
// own width from a percentage, and these only say where it may not go.
//
// GAP — the daylight the box must keep at each end of the track, which is what
// "never touch the left drawer" and "never touch the stack and pin sidebars"
// actually reduce to. ⚠ THE TRACK ALREADY IS THAT SLOT: MainLayout's
// `q-page-container` pads left by the drawer and right by `windows.railWidth`
// (the parked stack/pins column), so a box clamped INSIDE the track's client
// box cannot reach either of them by construction. Nothing here reads a
// drawer width or a rail width, and nothing here should start to — the day a
// third piece of chrome carves the slot, this file is already correct.
//
// MIN_VW — the floor the user set for a horizontal collapse: **25% of the
// SCREEN** (15% until 2026-08-18's last ask), not of the track, so it does not
// shrink along with the slot when a dock opens. Restated as `min-width: 25vw`
// in the stylesheet, which is the guarantee; this is the copy the drag reads
// so the gesture STOPS at the floor instead of running past a wall it cannot
// see.
//
// (A FOLD lived beside this ramp for three days — 2026-08-18 → 08-21, the box
// collapsing to its two bars behind a pair of keys that stood ON them. It
// went with the keys: see the rails' template note.)
const GAP = 8
const MIN_VW = 0.25
const STORE_KEY = 'pathos_feed_geometry'

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

    // ── THE TWO RAILS (2026-08-18, user ask; the FOLD they carried is GONE
    // since 2026-08-21 — see the template note) ─────────────────────────
    // The container's arrangement lives HERE and nowhere else, because this
    // file is the only one that owns the container: the rails are this
    // page's own markup and nothing below this page holds a copy.
    const trackEl = ref(null)
    const boxEl = ref(null)

    // FRACTIONS OF THE TRACK, never pixels — `null` until someone drags,
    // which is what leaves the stylesheet's 45%/2.5% in charge until then.
    // The unit matters: a percentage follows the slot when a dock opens, the
    // drawer swings or the window resizes, exactly as the two defaults it
    // replaces always have. Pixels would need a handler for every one of
    // those and would still read as a box that forgot its proportion.
    const widthPct = ref(null)
    const leftPct = ref(null)

    // Which rail is being dragged ('l' | 'r' | null) — the class it drives
    // keeps the hovered rail lit while the pointer is outside
    // it, which it will be for most of any real drag.
    const sizing = ref(null)

    // ── PERSISTED, and for the same reason the head box's own offset is:
    // where you put the walls of a room is an ARRANGEMENT, not a lens you
    // look through, and coming back from a post to find the feed re-widened
    // would read as the drag having been undone. It rides `localStorage`
    // rather than the StateHolder that carries `headY`, deliberately: a
    // holder is keyed by route, this page and `FeedStream` are the SAME
    // route, and two holders on one key are two hands on one dial — each
    // `saveState` writes its own snapshot over the other's. The dock stores
    // (`stores/dashboard.js`, `stores/chat.js`) are the house pattern for a
    // per-browser arrangement, and this is one of those.
    const persist = () => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          w: widthPct.value, l: leftPct.value
        }))
      } catch (_) { /* private mode — the arrangement is simply not remembered */ }
    }

    const restore = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
        if (!raw) return
        if (typeof raw.w === 'number') widthPct.value = raw.w
        if (typeof raw.l === 'number') leftPct.value = raw.l
        // A snapshot from the fold's three days (2026-08-18 → 08-21) may
        // still carry `c` (folded) and `k` (the board's line). Both are
        // simply ignored: a browser that was left folded comes back OPEN,
        // which is the only state the container has now.
      } catch (_) { /* unreadable = never arranged */ }
    }

    // The box's inline arrangement — a margin and a flex-basis, both
    // fractions of the track, both absent until the first drag.
    const boxStyle = computed(() => {
      const st = {}
      if (leftPct.value != null) st.marginLeft = (leftPct.value * 100).toFixed(3) + '%'
      if (widthPct.value != null) {
        st.flex = '0 0 ' + (widthPct.value * 100).toFixed(3) + '%'
      }
      return st
    })

    const railTitle = 'Drag to resize the feed — the bar is the handle'

    // ── The drag. Pointer Events with capture on the rail, the same hygiene
    // the head box and the media windows keep: one gesture at a time, the
    // pointer may outrun the element, the body's selection and cursor are
    // parked for the gesture, and ONE teardown that release, cancel and
    // unmount all reach.
    let pid = null
    let capEl = null
    let originX = 0
    let baseLeft = 0
    let baseW = 0
    let trackW = 0

    // The floor, in px against the current window — the user's 25vw.
    const minWidth = () => window.innerWidth * MIN_VW

    // ── ONE PLACE DECIDES WHERE THE BOX MAY STAND, and it does it PER
    // ANCHOR, because the two rails are not the same gesture mirrored:
    //
    //  · LEFT rail — the box's RIGHT edge is fixed. The wall you are holding
    //    is the one that moves; the far side staying put is what makes the
    //    gesture read as moving THAT bar rather than sliding the container.
    //    So the free variable is `l`, bounded by GAP below (the drawer),
    //    `right - room` below as well (a box may not be wider than the slot),
    //    and `right - minW` above (the 25vw floor).
    //  · RIGHT rail — the LEFT edge is fixed and `w` is the free variable,
    //    capped so the right edge stops GAP short of the rail column.
    //
    // ⚠ THEY WERE ONE FUNCTION FIRST AND IT WAS WRONG in both directions:
    // clamping `l` after `w` let a right-rail drag shove the LEFT edge over
    // (measured: the box's x went 75.8 → 50 on a drag that should not have
    // touched it), and re-pinning the right edge after a shared clamp let a
    // left-rail drag past its floor escape the track entirely (measured: x
    // = −1070, a box 1112px left of the drawer). Anchor first, clamp second.
    const limits = () => ({ minW: minWidth(), room: Math.max(minWidth(), trackW - 2 * GAP) })

    const onMove = (e) => {
      if (e.pointerId !== pid) return
      const dx = e.clientX - originX
      const { minW, room } = limits()
      let l = baseLeft
      let w = baseW
      if (sizing.value === 'l') {
        const right = baseLeft + baseW
        l = Math.max(baseLeft + dx, GAP, right - room)
        l = Math.min(l, right - minW)
        w = right - l
      } else {
        w = Math.max(baseW + dx, minW)
        w = Math.min(w, Math.max(minW, trackW - GAP - baseLeft))
      }
      leftPct.value = l / trackW
      widthPct.value = w / trackW
    }

    const teardown = () => {
      if (capEl) {
        capEl.removeEventListener('pointermove', onMove)
        capEl.removeEventListener('pointerup', end)
        capEl.removeEventListener('pointercancel', end)
        if (pid != null && capEl.hasPointerCapture?.(pid)) capEl.releasePointerCapture(pid)
      }
      capEl = null
      pid = null
      sizing.value = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    const end = (e) => {
      if (e && e.pointerId !== pid) return
      teardown()
      persist()
    }

    const onRailDown = (e, side) => {
      if (pid != null || e.button !== 0) return
      const track = trackEl.value
      const box = boxEl.value
      if (!track || !box) return
      const tr = track.getBoundingClientRect()
      const br = box.getBoundingClientRect()
      // `+ scrollLeft` because the track is a horizontal scroller. It should
      // never be scrolled — the clamp keeps the box inside the slot, which is
      // the whole point of it — but reading the offset in the track's own
      // coordinates rather than the viewport's costs one term and survives
      // the day something else puts content in there.
      baseLeft = br.left - tr.left + track.scrollLeft
      baseW = br.width
      trackW = track.clientWidth
      originX = e.clientX
      pid = e.pointerId
      capEl = e.currentTarget
      sizing.value = side
      e.preventDefault()
      capEl.setPointerCapture?.(pid)
      capEl.addEventListener('pointermove', onMove)
      capEl.addEventListener('pointerup', end)
      capEl.addEventListener('pointercancel', end)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    }

    // ── RE-CLAMP WHEN THE SLOT CHANGES. Percentages follow the track on
    // their own, so this is not about the SIZE — it is about the two floors
    // that are not percentages: `GAP` is px and `MIN_VW` is a share of the
    // window. Open a dock (the track narrows without a window resize, which
    // is why this is a ResizeObserver and not a `resize` listener) or shrink
    // the window and a stored fraction can fall under 25vw or push the box
    // into the rail.
    let ro = null
    const reclamp = () => {
      const track = trackEl.value
      if (!track) return
      if (widthPct.value == null && leftPct.value == null) return
      trackW = track.clientWidth
      if (!trackW) return
      // LEFT-ANCHORED, like the right rail: a slot that narrowed takes it out
      // of the box's WIDTH and leaves its left edge where the user put it.
      const { minW } = limits()
      const l0 = Math.min(Math.max((leftPct.value ?? 0.025) * trackW, GAP), Math.max(GAP, trackW - GAP - minW))
      const w0 = Math.min(Math.max((widthPct.value ?? 0.45) * trackW, minW), Math.max(minW, trackW - GAP - l0))
      const l = l0 / trackW
      const w = w0 / trackW
      if (Math.abs(l - (leftPct.value ?? 0)) > 0.0005 || Math.abs(w - (widthPct.value ?? 0)) > 0.0005) {
        leftPct.value = l
        widthPct.value = w
        persist()
      }
    }

    onMounted(() => {
      restore()
      if (typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(reclamp)
      if (trackEl.value) ro.observe(trackEl.value)
    })

    onBeforeUnmount(() => {
      if (ro) ro.disconnect()
      ro = null
      teardown()
    })

    return {
      pageStyleFn,
      flyouts,
      onSelect,
      trackEl,
      boxEl,
      boxStyle,
      sizing,
      railTitle,
      onRailDown
    }
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

// ── DESKTOP: THE COLUMN RUNS THE WHOLE WINDOW (2026-08-21, user ask: "drawn
// on top of the header and footer bars. From the very top to the very
// bottom") ────────────────────────────────────────────────────────────────
// The page grows to the full viewport and pulls itself up over
// `q-page-container`'s top padding, so the container — and both its frieze
// bars with it — starts at y=0 and ends on the window floor. The two bars of
// chrome it now crosses do not move; they STEP UNDER it on this route
// (`.nav-footer--underlaid` in NavigationBar.vue, `.media-tabs--underlaid` in
// MediaTabsBar.vue, both z 2999 under the container's 3001). The bar gives
// way rather than the container climbing, and it is the SECOND time this
// surface learns that lesson (2026-08-02 → 08-12, the first run of this exact
// block): anything over the nav bar's 3110 is over every dock too, and the
// maker/chat/flyout windows (3010+) would open BEHIND the feed on the one
// page they are most used on.
//
// The two negative margins are the scroll arithmetic, not decoration: the
// page container pads top by `--media-tabs-h` and bottom by the footer, so a
// 100vh page without them hands the window a scrollbar exactly that tall.
//
// Desktop only, same gate as the first run: below 1024px the drawer is modal,
// the burger lives in the bar's left cluster, and a container over the bar
// would bury it (see gotchas).
@media (min-width: 1024px) {
  .feed-page {
    height: 100vh;
    margin-top: calc(-1 * var(--media-tabs-h, 0px));
    margin-bottom: calc(-1 * var(--nav-footer-h));
  }
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
  --frieze-bar-v-w: var(--feed-edge-w);
}

// ── THE RAILS (2026-08-18, user ask) ─────────────────────────────────────
// A wrapper round each frieze bar, and the wrapper is the whole of what is
// new: `FriezeBarVertical` sets `pointer-events: none` on itself because it
// is decoration, so a bar can never be a handle — but the STRIP OF SPACE it
// occupies can, and that is this element. The bar inside is untouched.
//
// It is a flex box of one item so the bar's own `flex: 0 0 --frieze-bar-v-w`
// still decides the thickness; the rail simply takes whatever that comes to
// (`flex: 0 0 auto`) and the container's arithmetic is unchanged — the two
// rails together are exactly the two bars, as they were when the bars were
// the container's direct children.
//
// `position: relative` held the two keys while they existed (2026-08-18 →
// 08-21) and stays as an unstacked relative for whatever ever needs a frame
// here — it changes nothing about how the bars rank inside `.feed-container`'s
// 3001, the same note the bar's own `position: relative` carries.
.feed-container__rail {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  position: relative;
  cursor: col-resize;
  // The glow is a box-shadow rather than a filter: a `drop-shadow` would
  // follow the bar's own alpha mask (the motif is cut out of the plate) and
  // light every wave crest individually instead of the bar's silhouette.
  transition: box-shadow 0.14s;
  touch-action: none; // or a phone claims the drag for a pan and the stream dies mid-gesture
}

// LIT — hovered, or held while the pointer has run off it (which it will for
// most of any real drag). `rgba(140, 158, 255, …)` is `--indigo-11`, and it is
// not a new mark: it is the exact ink the post cards' hover and open glows
// use, so "this thing is lit" says the same thing everywhere on this surface.
// The reach is generous where a card's is not — a card must not touch its
// neighbour, a rail has the page's near-black canvas on one side and its own
// container on the other.
.feed-container__rail:hover,
.feed-container.is-sizing .feed-container__rail--l,
.feed-container.is-sizing .feed-container__rail--r {
  box-shadow:
    0 0 0 1px rgba(140, 158, 255, 0.45),
    0 0 12px 2px rgba(140, 158, 255, 0.55);
}

// ⚠ While a drag is live only the DRAGGED rail is lit — the rule above lights
// both, and this takes the other one back. Two lit walls would say the box is
// being scaled from its centre, which is not what either gesture does.
.feed-container.is-sizing--l .feed-container__rail--r,
.feed-container.is-sizing--r .feed-container__rail--l {
  box-shadow: none;
}

// ── THE KEYS ARE GONE (2026-08-21, user ask: "keep the frieze bars clean …
// their pattern fully displayed and not distorted") ───────────────────────
// Two controls lived ON the bars for three days (2026-08-18 → 08-21): a FOLD
// key riding Talavero's board and a ↔ GRIP at mid height — `--indigo-10`
// tablets the rail's full width, each one a blank plate laid over the
// meander. They, the fold state they doored, and their whole aesthetic walk
// (marbles → channel → flush tablets; the 0.8px inset-shadow rim; the
// board-riding `top`) are in git under this date if a control ever needs to
// stand on this chrome again — and the lesson to take from the removal is
// the one to re-read first: a frieze this narrow has no room to carry
// anything but its own motif.

.feed-container {
  // ── THE EDGE DIAL (2026-08-18) — ONE number, TWO readers: the bars'
  // thickness (`.feed-container__edge` maps it onto `--frieze-bar-v-w`) and
  // the FOLDED width, which is exactly two of them plus this box's own two
  // 1px side borders. They were one number before too, by both being spelled
  // `calc(var(--frieze-h) * 0.8)`; now they are one number by construction,
  // and a fold that stopped matching its bars is a class of bug that cannot
  // happen. See the paragraph below for why it is safe HERE and
  // `--frieze-bar-v-w` was not: this name is read by nothing but the two
  // rails, so inheriting it into the head box's own posts changes nothing.
  // **BACK TO `0.8` ON 2026-08-21** (user ask: "thinner … not so thin they
  // lose detail") — ~15.1px at a 900px viewport, the exact width 2026-08-07's
  // "a little thinner" ask settled and the one the user named the clean look.
  // It spent 2026-08-18 → 08-21 at `0.95` ("a little thicker", ~17.9px) and
  // came back with the keys' removal: what actually mangled the bars was the
  // pair of tablets standing ON the motif, but the thicker bar read heavier
  // beside the board's slim posts too. The floor arithmetic: the masks are a
  // 13-row grid read across the thickness, so a row is ~1.16px here — above
  // the ~0.7px line where the meander stops being a pattern (0.95 gave
  // ~1.38px; the detail survives the trim with room to spare).
  --feed-edge-w: calc(var(--frieze-h) * 0.8);

  flex: 0 0 45%;
  height: 100%;
  display: flex;
  align-items: stretch;

  // ── THE FLOOR, 25% OF THE SCREEN (2026-08-18, user asks — 15% for the
  // first few hours of the same day) ─────────────────────────────────────
  // The stated minimum for a horizontal collapse, and it is the GUARANTEE:
  // the drag clamps to the same number in JS so the gesture stops rather than
  // pushing against an invisible wall, but a stored fraction, a media query
  // or a future percentage cannot get under this.
  //
  // ⚠ IT ALSO KEEPS THE JOB `min-width: 0` HELD — see the note under it. An
  // explicit `min-width` of ANY value overrides a flex item's automatic
  // min-content floor, so 25vw suppresses the "widest nowrap title" floor
  // exactly as 0 did. Do not read the 0 below as having been deleted; it has
  // been raised, and it is still the line holding the percentage exact.
  min-width: 25vw;

  // The drag is this property moving, and the box CANCELS the easing while a
  // rail is held, because a width that eases toward the pointer instead of
  // tracking it reads as lag, not as smoothness.
  transition: flex-basis 0.18s ease, margin-left 0.18s ease, box-shadow 0.14s;
  // Holds the 45% EXACTLY, now that the box has content in it. A flex item's
  // default `min-width: auto` is a floor at its content's min-content size,
  // and that floor OUTRANKS a percentage flex-basis — the stream's widest
  // nowrap post title measured out to 54.6% of the track before this line.
  // FeedStream zeroes the same floor down its own chain so the title
  // ellipsizes; this is the guarantee at the box itself.
  //
  // ⚠ RAISED TO `25vw` ABOVE (2026-08-18) — the declaration that wins is the
  // later one, and it does this job as well as `0` did: what suppresses the
  // automatic min-content floor is min-width being EXPLICIT, not its being
  // zero. This line stays as the reasoning, and as the value to come back to
  // if the 15% floor is ever dropped.
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

// (THE FOLD lived here 2026-08-18 → 08-21 — `.is-collapsed` shrank the box to
// its two bars behind the keys that stood on them. It left with the keys; the
// state blocks are in git under the removal date.)

// HELD — the drag must track the pointer exactly, so the easing above comes
// off for the length of the gesture.
.feed-container.is-sizing { transition: none; }

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
