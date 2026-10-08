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
       Talavero's search board since 2026-10-07 eve (SideSearchBoard) —
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

       ⭐ 2026-10-07 eve — IT NAVIGATES: a reference clicked inside opens
       HERE as a new stop of the viewer's own history (back / forward studs
       on the bar), the bar wears the shown element's kind (script notes).

       `select` from inside the card (the references button, the cap's
       open door) spawns the post's flyout — the viewer is a showcase, the
       flyout is where the post is worked on. `pins-changed` rides up to
       MainLayout through FeedPage, the same route the stream's takes. -->
  <section
    ref="rootEl"
    class="side-viewer"
    aria-label="Viewer"
    :style="toneStyle"
  >
    <!-- THE HEAD = TALAVERO'S SEARCH BOARD (2026-10-07 eve) — see
         SideSearchBoard.vue. A hit opens HERE (a new stop on the viewer's
         history) or, by its WHERE pill, as a floating window. -->
    <header class="side-viewer__head">
      <SideSearchBoard :recent="recent" @open="onSearchOpen" @open-window="onSearchWindow" />
    </header>
    <div class="side-viewer__divider">
      <div class="side-viewer__rail" aria-hidden="true">
        <FriezeBarVertical lip="right" slim class="side-viewer__bar" />
      </div>
      <!-- BACK / FORWARD RIDE THE BAR (2026-10-07 eve, user ask: "back and
           forward buttons inside the friezebar, using the lip color of the
           frieze bar") — two lip-tone studs at the bar's left end, walking
           the viewer's OWN history (never the router's). -->
      <nav class="side-viewer__nav" aria-label="Viewer history">
        <button
          type="button"
          class="side-viewer__step"
          :disabled="cursor <= 0"
          :title="cursor > 0 ? 'Back to ' + (stops[cursor - 1].label || 'the previous item') : 'Nothing behind'"
          aria-label="Back"
          @click="go(-1)"
        >
          <q-icon name="arrow_back_ios_new" size="9px" />
        </button>
        <button
          type="button"
          class="side-viewer__step"
          :disabled="cursor >= stops.length - 1"
          :title="cursor < stops.length - 1 ? 'Forward to ' + (stops[cursor + 1].label || 'the next item') : 'Nothing ahead'"
          aria-label="Forward"
          @click="go(1)"
        >
          <q-icon name="arrow_forward_ios" size="9px" />
        </button>
      </nav>
    </div>
    <div class="side-viewer__well">
      <!-- SideElementView since 2026-10-07: the element's face (a post =
           its postcard, extended to the well; anything else its kind's Mini)
           over its THREAD band — comments by default, forks on the fork door.
           Keyed per stop so back/forward lands on a fresh face. -->
      <SideElementView
        v-if="current"
        :key="current.key"
        :item="current.item"
        :address="current.item ? '' : current.address"
        :initial-section="current.section"
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
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import SideElementView from 'src/components/viewer/SideElementView.vue'
import SideSearchBoard from 'src/components/viewer/SideSearchBoard.vue'
import { feedService } from 'src/services/feed.service'
import { refService } from 'src/services/ref.service'
import { useFlyoutViewersStore, installSideViewerSink, consumeSideArm } from 'src/stores/flyoutViewers'
import { kindFor, isHash } from 'src/utils/kinds'

const MAX_STOPS = 60
// Element pages a plain link inside the viewer may name — the router guard
// turns them into stops instead of leaving the feed.
const ROUTE_RE = /^\/(posts|skeletons|nodes|labels|paths|links|secrets|moments|entities)\/([0-9a-zA-Z]+)\/?$/
let stopSeq = 0

export default defineComponent({
  name: 'SideViewer',
  components: { FriezeBarVertical, SideElementView, SideSearchBoard },
  emits: ['pins-changed'],
  setup () {
    const rootEl = ref(null)
    const error = ref('')
    const flyouts = useFlyoutViewersStore()
    const router = useRouter()

    // ── THE VIEWER'S HISTORY (2026-10-07 eve): every element it showed, a
    // stop `{ key, item | address, kind, label, section }`, and a cursor.
    // A new stop drops whatever stood ahead of the cursor — a browser's
    // back stack, kept to this window.
    const stops = ref([])
    const cursor = ref(-1)
    const current = computed(() => stops.value[cursor.value] || null)

    const push = (stop) => {
      const here = current.value
      if (here && here.address && here.address === stop.address) {
        // Same element: only the section moves (a second tally press).
        if (stop.section && stop.section !== here.section) {
          stops.value.splice(cursor.value, 1, { ...here, section: stop.section, key: 's' + (++stopSeq) })
        }
        return
      }
      const kept = stops.value.slice(0, cursor.value + 1)
      kept.push({ section: 'comments', ...stop, key: 's' + (++stopSeq) })
      while (kept.length > MAX_STOPS) kept.shift()
      stops.value = kept
      cursor.value = kept.length - 1
      error.value = ''
    }
    const go = (d) => {
      const n = cursor.value + d
      if (n >= 0 && n < stops.value.length) cursor.value = n
    }

    const stopOfItem = (it, section = 'comments') => ({
      item: it,
      address: it.skeleton_path || ('skeletons/' + it.skeleton_id),
      kind: 'posts',
      label: it.title || ('Post #' + it.skeleton_id),
      section
    })

    // An ADDRESS → its stop. A skeleton that is a POST instance steps
    // forward to its postcard (the flyout's rule — the feed's hash lens);
    // anything else is its kind's Mini.
    const stopOfAddress = async (address, label = '') => {
      const addr = String(address || '').replace(/^pathos:/, '').replace(/^posts\//, 'skeletons/')
      const parts = addr.split('/').filter(Boolean)
      const prefix = parts[parts.length - 2]
      const hash = parts[parts.length - 1]
      if (!prefix || !hash) return null
      if (prefix === 'skeletons') {
        try {
          const r = await feedService.getPublic({ hash, body: 'full', limit: 1 })
          const it = r?.items?.[0]
          if (it && String(it.skeleton_path || '').endsWith(hash)) return stopOfItem(it)
        } catch (_) { /* a skeleton face is never wrong */ }
      }
      return { item: null, address: `${prefix}/${hash}`, kind: prefix, label }
    }

    // A KIND + an id (or a hash) → its stop: one summary read for an id.
    const stopOfKey = async (kind, key, label = '') => {
      const prefix = kind === 'posts' ? 'skeletons' : kind
      if (isHash(String(key))) return stopOfAddress(`${prefix}/${key}`, label)
      try {
        const r = await refService.summaryById(kind, parseInt(key, 10))
        const sum = r?.summary
        if (!sum?.hash || sum.locked) return null
        return stopOfAddress(`${prefix}/${sum.hash}`, label || sum.primary || '')
      } catch (_) { return null }
    }

    // THE NAVIGATOR: any flyout target the store's sink diverts here.
    const openTarget = async (t) => {
      if (!t) return
      let stop = null
      if (t.kind === 'post' && t.item) stop = stopOfItem(t.item)
      else if (t.kind === 'node' && t.node) stop = t.node.path ? await stopOfAddress(t.node.path, t.node.title || '') : await stopOfKey('nodes', t.node.id)
      else if (t.kind === 'entity' && t.entity) {
        stop = t.entity.path
          ? await stopOfAddress(t.entity.path, t.entity.display_name || '')
          : await stopOfKey('entities', t.entity.id, t.entity.display_name || '')
      } else if (t.kind === 'element') stop = await stopOfAddress(t.address, t.summary?.primary || '')
      else if (t.kind === 'ref') {
        const ref0 = String(t.ref).replace(/^pathos:/, '')
        stop = ref0.includes('/') ? await stopOfAddress(ref0) : await stopOfKey('skeletons', ref0)
      }
      if (stop) push(stop)
      // A target the viewer cannot hold still opens — as a window.
      else if (t.kind === 'ref') flyouts.spawn(t, { flyout: true })
    }

    // The card's own "open" doors (the cap's flyout button, the references
    // button) keep their meaning: the post as a WINDOW.
    // ⭐ 2026-10-08: the family's cards say the STORE's target (`{ kind:
    // 'ref' | 'node' | 'entity' | 'post', … }`); the feed card says its item.
    const onSelect = (sel) => {
      if (!sel) return
      if (sel.skeleton_id != null) { flyouts.spawnPost(sel, { flyout: true }); return }
      if (sel.kind) flyouts.spawn(sel, { flyout: true })
    }

    const onSearchOpen = async ({ address, label }) => {
      const stop = await stopOfAddress(address, label)
      if (stop) push(stop)
    }
    const onSearchWindow = ({ address }) => {
      flyouts.spawn({ kind: 'ref', ref: address }, { flyout: true })
    }

    // Recently viewed, newest first, one row per element — the board's
    // empty-field list.
    const recent = computed(() => {
      const seen = new Set()
      const out = []
      for (let i = stops.value.length - 1; i >= 0; i--) {
        const s = stops.value[i]
        if (!s.address || seen.has(s.address)) continue
        seen.add(s.address)
        out.push({ address: s.address, kind: s.kind, label: s.label })
        if (out.length >= 8) break
      }
      return out
    })

    // ── THE BAR WEARS THE ELEMENT'S KIND (2026-10-07 eve, user ask: "make
    // the friezebar match the color of the represented item"): the plate in
    // the kind's deep INK, the lip — and the two studs riding it — in the
    // kind's own colour (kinds.js, the one table every chip draws from). A
    // post keeps the bar it always had: posts' ink IS `--indigo-10`.
    const toneStyle = computed(() => {
      const k = kindFor(current.value?.kind || 'posts')
      return { '--side-viewer-plate': k.ink, '--side-viewer-lip': k.color }
    })

    // A random post off the public feed — the viewer's first stop, its own
    // GET /feed, seat-strict like every read on this surface.
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
        const it = (r?.success && r.items?.[0]) || first.items[0]
        if (!stops.value.length) push(stopOfItem(it))
      } catch (_) {
        if (!stops.value.length) error.value = 'The feed is not answering.'
      }
    }

    // ── NAVIGATING INSIDE (2026-10-07 eve, user ask): a reference clicked
    // inside the viewer opens HERE. Two seams catch every door:
    //   · the window store's SINK — chips, minis, the entity / moment link
    //     doors all end in `flyouts.spawn`, which hands the target over;
    //   · a ROUTER GUARD — plain links to element pages (`/labels/12`,
    //     `/posts/7` …) that would have left the feed become stops.
    let removeSink = null
    let removeGuard = null
    onMounted(() => {
      pick()
      removeSink = installSideViewerSink(rootEl.value, openTarget)
      removeGuard = router.beforeEach((to) => {
        const m = ROUTE_RE.exec(to.path || '')
        if (!m || !consumeSideArm()) return true
        stopOfKey(m[1], m[2]).then((stop) => { if (stop) push(stop) })
        return false
      })
    })
    onBeforeUnmount(() => {
      if (removeSink) removeSink()
      if (removeGuard) removeGuard()
    })

    // FeedPage's door: a feed card's comment / fork tally → that post, here,
    // with that section open.
    const show = (it, slot = 'comments') => {
      if (!it) return
      push(stopOfItem(it, slot === 'forks' ? 'forks' : 'comments'))
    }

    return {
      rootEl,
      error,
      stops,
      cursor,
      current,
      go,
      recent,
      toneStyle,
      onSelect,
      onSearchOpen,
      onSearchWindow,
      show
    }
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
  // reserved for the viewer's header (2026-10-02 eve) — Talavero's search
  // board since 2026-10-07 eve.
  // 40px since 2026-10-07 eve: it holds Talavero's search board now.
  --side-viewer-head-h: 40px;
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

// The head carries the search board, whose drop hangs OVER the divider and
// the well — so it stands above them in the stack.
.side-viewer__head {
  flex: 0 0 var(--side-viewer-head-h);
  min-width: 0;
  position: relative;
  z-index: 3;
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
  // The plate + lip follow the shown element's kind (`toneStyle`).
  --frieze-bar-v-base: var(--side-viewer-plate, var(--indigo-10, #1a237e));
  --frieze-bar-v-wave-one: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-wave-two: var(--plaque-flat, #f8f2e4);
  --frieze-bar-v-edge: var(--grey-6, #9e9e9e);
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-lip: var(--side-viewer-lip, var(--grey-6, #9e9e9e));
  --frieze-bar-v-carve: none;
  --frieze-bar-v-pad: 1px;
}

// The motif MIRRORED end-for-end (2026-10-02 ask, kept from the frame):
// `scaleY(-1)` along the bar's length, which the turn lands on screen as a
// horizontal mirror. Only the layer flips; the rules and the rim stay put.
.side-viewer__bar :deep(.frieze-bar-v__layer) {
  transform: scaleY(-1);
}

// ── THE STUDS: back / forward riding the bar's left end, filled in the
// LIP's tone (the kind's colour), cream glyphs, a `--plaque-coat` ring so
// they read as set INTO the bar. The divider takes no presses; only these do.
.side-viewer__nav {
  position: absolute;
  top: 0;
  left: 8px;
  height: calc(100% - var(--side-viewer-rim));
  display: flex;
  align-items: center;
  gap: 3px;
  pointer-events: auto;
  z-index: 1;
}
.side-viewer__step {
  width: 22px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--plaque-coat, #f8f2e4);
  border-radius: 999px;
  background: var(--side-viewer-lip, var(--indigo-6));
  color: var(--plaque-flat, #f8f2e4);
  box-shadow: 0 0 0 1px var(--side-viewer-plate, var(--indigo-10));
  cursor: pointer;
  transition: filter 0.15s, transform 0.15s, background 0.25s;
  &:hover:not(:disabled) { filter: brightness(1.15); transform: scale(1.08); }
  &:disabled { cursor: default; opacity: 0.45; }
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
// ── ⭐ ON A PHONE THE VIEWER STANDS ABOVE THE RAIL (2026-10-08, user ask:
// "for the mobile version, we want to take advantage of this new behavior
// so that the header bar starts like 1/3 slid down vertically so that in the
// remaining space we can fit the side viewer there. Figure out the right
// proportion so both the feed container and the side viewer are usable on a
// portrait mobile version") ──────────────────────────────────────────────
// It was `display: none` under 600px from its birth (2026-10-01): the track
// has no second column on a phone. Now the top rail SLIDES (`--header-y`,
// composables/useHeaderSlide — a phone starts it 34% of the way down) and
// the strip that frees at the top of the screen is this viewer's phone
// home: FIXED from the screen's top to the rail's top, full width,
// square-cornered and unmargined — the rail's own cast is its bottom edge,
// and the rail's shadow falls on the feed below it, not on this. It is
// still FeedPage's child and still the thread host there (`sideHome`), so a
// card's comment door opens here on a phone exactly as it does beside the
// feed on a desktop; the page sends the threads to the flyouts only while
// the rail stands too high for the strip to hold a card. The height is
// the slide itself, so dragging the rail resizes the viewer live; at 0 it
// is a closed strip (`overflow: hidden` above). z: under the rail (3125)
// and the floating windows, over the page.
@media (max-width: 600px) {
  .side-viewer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-y, 0px);
    margin: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
    z-index: 3000;
  }
}
</style>
