<template>
  <!-- ── THE SIDE VIEWER (2026-10-01, user ask: "a new section that should
       be a persistent floating window the same grey color as the flyout
       windows … a big rectangle with rounded borders centered and expanded
       on the remaining space to the right of the feed container. This
       section is an independent viewer. By now, please showcase inside of
       it a random single post card").

       WHERE IT STANDS. A flex sibling of `.feed-container` inside the
       feed track, taking whatever the container leaves — so it follows
       the rails' resize drag for free and never has to read the seam.
       PERSISTENT means it is always there on the feed page: not spawned,
       not closable, not a member of the floating-viewer family
       (`stores/flyoutViewers.js`), whose windows are fixed-position and
       float ABOVE this one. It wears that family's coat so the two read
       as one material: `--grey-4` box, `--grey-6` rim, 10px corners (6px since
       2026-10-02), the
       same drop shadow (`ElementFlyout.vue`, `.element-flyout`).

       INSIDE, A COLUMN (2026-10-02 eve, user ask: "remove all friezebars
       from the side viewer and then leave the top one only, but remove its
       side cream borders and adapt it so that it touches the grey plaque
       sides and leaves some space to have a header above. the remaining
       frieze bar separates the header from the content now"): the HEAD —
       a band of the box's own grey reserved for a header, empty for now —
       then the DIVIDER, the pinwheel's old top bar alone (the feed rail's
       bar turned 90°, cream coat above and below, `--grey-6` rim toward
       the content) running wall to wall with bare ends, then the WELL with
       the showcase: ONE random post, rendered as THE POSTCARD ITSELF
       through FeedStream's embed mode, exactly as the flyout's post face
       does (`:embed-item`). Random = two reads of `GET /feed`: one for
       the `total`, one for `page = 1 + ⌊random × total⌋` at `limit=1`,
       both `body=full` so the card carries its body (the excerpt trap).

       ⭐ 2026-10-07: the well holds a SideElementView (any element's face
       over its comments / forks band — see that file), and `show(item,
       section)` lets FeedPage put a feed card's post here when its foot
       comment / fork door is clicked.

       `select` from inside the card (the references button, the cap's
       open door) spawns the post's flyout — the viewer is a showcase, the
       flyout is where the post is worked on. `pins-changed` rides up to
       MainLayout through FeedPage, the same route the stream's takes. -->
  <section class="side-viewer" aria-label="Viewer">
    <header class="side-viewer__head" />
    <div class="side-viewer__divider" aria-hidden="true">
      <div class="side-viewer__rail">
        <FriezeBarVertical lip="right" slim class="side-viewer__bar" />
      </div>
    </div>
    <div class="side-viewer__well">
      <!-- SideElementView since 2026-10-07: the element's face (a post =
           its postcard, extended to the well) over its THREAD band —
           comments by default, forks on the fork door. -->
      <SideElementView
        v-if="item"
        :item="item"
        :initial-section="section"
        @select="onSelect"
        @pins-changed="$emit('pins-changed')"
      />
      <div v-else class="side-viewer__empty">
        {{ error || 'Looking for a post…' }}
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import SideElementView from 'src/components/viewer/SideElementView.vue'
import { feedService } from 'src/services/feed.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

export default defineComponent({
  name: 'SideViewer',
  components: { FriezeBarVertical, SideElementView },
  emits: ['pins-changed'],
  setup () {
    const item = ref(null)
    const section = ref('comments')
    const error = ref('')
    const flyouts = useFlyoutViewersStore()

    const onSelect = (it) => { flyouts.spawnPost(it) }

    // A random post off the public feed — the viewer's own GET /feed,
    // seat-strict like every read on this surface.
    const pick = async () => {
      try {
        const first = await feedService.getPublic({ limit: 1, body: 'full' })
        if (!first?.success || !first.items?.length) {
          error.value = 'No posts to show yet.'
          return
        }
        const total = Math.max(parseInt(first.total, 10) || 1, 1)
        const page = 1 + Math.floor(Math.random() * total)
        const r = page === 1
          ? first
          : await feedService.getPublic({ limit: 1, page, body: 'full' })
        item.value = (r?.success && r.items?.[0]) || first.items[0]
      } catch (_) {
        error.value = 'The feed is not answering.'
      }
    }

    onMounted(pick)

    // FeedPage's door: a feed card's comment / fork tally → that post, here,
    // with that section open.
    const show = (it, slot = 'comments') => {
      if (!it) return
      section.value = slot === 'forks' ? 'forks' : 'comments'
      item.value = it
    }

    return { item, section, error, onSelect, show }
  }
})
</script>

<style scoped lang="scss">
// ── THE WINDOW: the flyout family's coat (`.element-flyout`), standing in
// the track instead of floating over it. `--side-viewer-gap` is the
// daylight between the box and everything around it — the container's
// rail, the header's tabs, the window's right edge and the footer bar —
// and `--side-viewer-head-h` the header band above the divider.
//
// ONE GAP ON ALL FOUR SIDES, TAKEN FROM WHAT IS ACTUALLY DRAWN (2026-10-02,
// user ask: "leave a little space between its top border and the tabs
// hanging off the header nav bar … the same padding … to all the 4
// borders"). The track starts at the RAIL's underside, but the rail's
// parked tabs hang `--media-tabs-park-h` below it (`.media-tabs__row` is
// absolute at `top: 100%`) — so a plain top margin was daylight measured
// from the wrong line: at 10px the box's top sat at y=32 and a parked tab's
// bottom at y=36, the tab lying 4px over the window. The top margin pays
// the hang first, then the same gap as the other three sides — the docks'
// rule (`_components.scss`, "DAYLIGHT OFF THE TOP CHROME"), and like theirs
// ALWAYS reserved, whether or not a tab is parked. 14px = the docks'
// `--dock-gap`, so every window on the page stands the same distance off.
.side-viewer {
  --side-viewer-gap: 14px;
  // THE HEAD's height — the band of the box's own grey above the divider,
  // reserved for the viewer's header (2026-10-02 eve; empty until it has one).
  --side-viewer-head-h: 30px;
  // THE DIVIDER — the old frame's top RAIL, number for number: 2px of
  // `--plaque-coat` each long face round the feed rail's 13px bar, a 1px
  // `--grey-6` rim on the face toward the content = 18px. (Its 7px grey
  // band round the old frame, `--side-viewer-pad`, left with the frame: the
  // divider runs wall to wall.)
  --side-viewer-bar-t: 13px;
  --side-viewer-coat: 2px;
  --side-viewer-rim: 1px;
  --side-viewer-rail-t: calc(var(--side-viewer-bar-t) + 2 * var(--side-viewer-coat) + var(--side-viewer-rim));

  // THE WIDTH IS WHATEVER THE CONTAINER LEAVES (user ask, same day: "occupy
  // most of available remaining surface … adapt … depending on the feed
  // container's position and extension. we do not want them to overlap.
  // instead adjust the new window's width"). `flex: 1 1 auto` with NO
  // minimum: the container's own clamp (its drag may run to GAP short of
  // the track's end) is the only law, and this box shrinks to nothing
  // rather than push past it. A 260px floor stood here for an hour and
  // was wrong — it made the track scroll instead of the box yield.
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  margin: var(--side-viewer-gap);
  margin-top: calc(var(--side-viewer-gap) + var(--media-tabs-park-h, 0px));
  // No padding: head, divider and well each pay their own, so the divider
  // can touch the box's sides.
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--grey-4, #e0e0e0);
  border: 1px solid var(--grey-6, #9e9e9e);
  // 6px since 2026-10-02 (user ask: "make the side viewer's corners a
  // little less rounded") — the one place it leaves the flyout coat's 10px.
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
}

.side-viewer__head {
  flex: 0 0 var(--side-viewer-head-h);
  min-width: 0;
}

// ── THE DIVIDER: the pinwheel's top side, kept alone (template note). The
// bar is still the feed's VERTICAL rail bar TURNED 90° — the motif, its
// mirroring and the rim all as the frame drew them — so the side is a size
// container and the rail's HEIGHT is `100cqw` (the box's inner width)
// before the turn (gotchas § The side viewer's divider). ⚠ The real
// `rotate()` is legal only because the carve is `none`.
.side-viewer__divider {
  position: relative;
  flex: 0 0 var(--side-viewer-rail-t);
  overflow: hidden;
  pointer-events: none;
  container-type: size;
}

// The rail, upright: coat on its two LONG faces only — its ends are bare
// (the ask's "remove its side cream borders"), so after the turn the plate
// runs into the box's rim on both sides. `border-right` is the rim: `lip=
// "right"` put the bar's inner face on local right, and a 90° clockwise turn
// carries local right DOWN, onto the content.
.side-viewer__rail {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--side-viewer-rail-t);
  height: 100cqw;
  display: flex;
  align-items: stretch;
  padding: 0 var(--side-viewer-coat);
  background: var(--plaque-coat);
  border-right: var(--side-viewer-rim) solid var(--grey-6, #9e9e9e);
  transform-origin: 0 0;
  transform: rotate(90deg) translateY(-100%);
}

// The bar: FeedPage's `.feed-container__edge` dials verbatim (indigo-10
// plate, flat cream motif, grey-6 rules, carve off, 1px pad, slim's own
// `117% auto` fit). Two classes so this host beats the component's own
// `.frieze-bar-v--slim` rule (which zeroes the rules' width). No END rules
// any more: the frame needed them to close its corners; a wall-to-wall bar
// meets the box's own rim instead.
.side-viewer .side-viewer__bar {
  --frieze-bar-v-w: var(--side-viewer-bar-t);
  --frieze-bar-v-slim-w: var(--side-viewer-bar-t);
  --frieze-bar-v-base: var(--indigo-10, #1a237e);
  --frieze-bar-v-wave-one: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-wave-two: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-edge: var(--grey-6, #9e9e9e);
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-lip: var(--grey-6, #9e9e9e);
  --frieze-bar-v-carve: none;
  --frieze-bar-v-pad: 1px;
}

// The motif MIRRORED end-for-end (2026-10-02 ask, kept from the frame):
// `scaleY(-1)` along the bar's length, which the turn lands on screen as a
// horizontal mirror. Only the layer flips; the rules and the rim stay put.
.side-viewer__bar :deep(.frieze-bar-v__layer) {
  transform: scaleY(-1);
}

// The content under the divider. Since 2026-10-07 the well holds ONE
// SideElementView filling it wall to wall (the ask: the card "extending
// inside its container below the side viewer's friezebar") — the 640px
// reading cap that centred the card is gone; the view lays out its face
// and its thread band itself.
.side-viewer__well {
  flex: 1 1 auto;
  padding: 14px;
  display: flex;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}

.side-viewer__empty {
  align-self: center;
  color: var(--grey-8, #616161);
  font-size: 0.82em;
}

// A phone gives the whole track to the container (FeedPage's 95% rule);
// there is no "remaining space" to stand in.
@media (max-width: 600px) {
  .side-viewer { display: none; }
}
</style>
