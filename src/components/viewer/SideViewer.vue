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

       INSIDE: `--side-viewer-pad` of the box's own grey, then the
       FriezeFrame — four of the feed's left rail laid as a pinwheel
       (`components/layout/FriezeFrame.vue`) — and in the frame's well
       the showcase: ONE random post, rendered as THE POSTCARD ITSELF
       through FeedStream's embed mode, exactly as the flyout's post face
       does (`:embed-item`). Random = two reads of `GET /feed`: one for
       the `total`, one for `page = 1 + ⌊random × total⌋` at `limit=1`,
       both `body=full` so the card carries its body (the excerpt trap).

       `select` from inside the card (the references button, the cap's
       open door) spawns the post's flyout — the viewer is a showcase, the
       flyout is where the post is worked on. `pins-changed` rides up to
       MainLayout through FeedPage, the same route the stream's takes. -->
  <section class="side-viewer" aria-label="Viewer">
    <FriezeFrame class="side-viewer__frame">
      <div class="side-viewer__well">
        <div v-if="item" class="side-viewer__card">
          <FeedStream
            :key="'side:' + item.skeleton_id"
            :embed-item="item"
            @select="onSelect"
            @pins-changed="$emit('pins-changed')"
          />
        </div>
        <div v-else class="side-viewer__empty">
          {{ error || 'Looking for a post…' }}
        </div>
      </div>
    </FriezeFrame>
  </section>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import FriezeFrame from 'src/components/layout/FriezeFrame.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import { feedService } from 'src/services/feed.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

export default defineComponent({
  name: 'SideViewer',
  components: { FriezeFrame, FeedStream },
  emits: ['pins-changed'],
  setup () {
    const item = ref(null)
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

    return { item, error, onSelect }
  }
})
</script>

<style scoped lang="scss">
// ── THE WINDOW: the flyout family's coat (`.element-flyout`), standing in
// the track instead of floating over it. `--side-viewer-gap` is the
// daylight between the box and everything around it — the container's
// rail, the header's tabs, the window's right edge and the footer bar —
// and `--side-viewer-pad` the box's own grey between its rim and the
// frieze frame.
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
  // The grey band round the frame, HALVED 14 → 7px on 2026-10-02 (user ask:
  // "for the outer grey border around the frame, make it thinner").
  --side-viewer-pad: 7px;

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
  padding: var(--side-viewer-pad);
  display: flex;
  position: relative;
  background: var(--grey-4, #e0e0e0);
  border: 1px solid var(--grey-6, #9e9e9e);
  // 6px since 2026-10-02 (user ask: "make the side viewer's corners a
  // little less rounded") — the one place it leaves the flyout coat's 10px.
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
}

.side-viewer__frame {
  flex: 1 1 auto;
}

// The frame's interior: one scroller, the card centred in it. The embed
// pane is the flyout's own arrangement (`.element-flyout__card`) — fill
// the well, let the embed's well be the scroller — capped at a reading
// width so a wide window does not stretch the card to the bars.
.side-viewer__well {
  height: 100%;
  padding: 14px;
  display: flex;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}

.side-viewer__card {
  flex: 1 1 auto;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  min-height: 0;
  display: flex;

  :deep(.feed-stream-pane) { flex: 1 1 auto; min-width: 0; }
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
