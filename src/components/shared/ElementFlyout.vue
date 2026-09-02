<!--
  ELEMENT FLYOUT — the platform's ONE floating viewer window (fused
  2026-08-17, user ask).

  Three components' lives converge here:
  · `posts/FeedPostFlyout.vue` (2026-07-26) → `skeletons/SkeletonFlyout.vue`
    (2026-07-31, the generic ref door) → the element/skeleton VIEW SWITCH
    (earlier on 2026-08-17): the feed's detail box, grown into a viewer for
    one element with two faces.
  · `media/MediaViewerWindow.vue` (2026-08-04, docs/plans/
    floating-media-viewer.md): the floating media previews — fit-engine
    spawn placement, bar-drag + eight resize rims, maximize ease, the foot
    with real actions, N simultaneous windows parking into MediaTabsBar.
  · This file, which took the media window's SHELL WHOLE (the user's
    priority list: sizing, initial placement, movement, the action foot,
    the one-window-per-element individuality) and kept the element
    viewer's FACES and view switch.

  WHAT A WINDOW HOLDS — its TARGET, from `stores/flyoutViewers.js`:
  · node (NodeMini's corner, or a resolved nodes/ ref): element view =
    `MediaViewerBody`, the per-kind media faces — embed players and PAGE
    articles (Wikipedia), images, video, audio, markdown docs, text, the
    download card. Skeleton view = the NODE's OWN skeleton, pre-walked
    from `GET /refs/surround` on first switch (lazy — a media preview
    should not cost a walk it may never show).
  · post (the card cap's open_in_new / the foot's references button):
    element view = THE POSTCARD ITSELF through FeedStream's embed mode —
    same markup, same scoped styles, none of the feed's furniture.
    Skeleton view = SkeletonTable on the post's skeleton id.
  · ref (the `?flyout=` door): opens on the skeleton face, self-resolving;
    a ref that RESOLVES to a POST instance fetches its feed item through
    the hash lens and RETARGETS the window into a post; a `nodes/<hash>`
    ref fetches the enriched row and retargets into a node. Same window,
    same rect, new self — title, tab, faces and foot all follow.

  DEFAULT VIEW follows the KIND: posts and nodes open on the ELEMENT, the
  skeleton one header press away; a bare schema IS its skeleton and offers
  no switch.

  GEOMETRY: inline style off the store's rect; the fit engine places a
  fresh window in the arena (the docks' half, cascaded), gestures roam the
  whole viewport, `is-max` swaps everything for the full screen. The
  `rect`/`natural` fields and `setRect` keep their mediaViewers names so
  utils/mediaFit and useMediaWindowGestures run here unchanged.
-->
<template>
  <section
    v-if="viewer"
    ref="rootEl"
    class="element-flyout"
    :class="{
      'is-max': viewer.maximized,
      'is-grabbed': dragging,
      'is-resizing': !!resizing,
      'is-anim-max': animMax
    }"
    :style="styleObj"
    role="dialog"
    :aria-label="title"
    @pointerdown="store.focus(viewer.id)"
  >
    <header
      ref="barEl"
      class="dock-bar element-flyout__bar"
      @pointerdown="onBarPointerDown"
    >
      <div class="traffic">
        <button
          type="button" class="traffic__dot traffic__dot--red"
          title="Close" @click.stop="store.close(viewer.id)"
        >
          <q-icon name="close" />
        </button>
        <button
          type="button" class="traffic__dot traffic__dot--yellow"
          title="Minimize to the top strip" @click.stop="store.minimize(viewer.id)"
        >
          <q-icon name="remove" />
        </button>
        <button
          type="button" class="traffic__dot traffic__dot--green"
          :title="viewer.maximized ? 'Restore size' : 'Full screen'"
          @click.stop="store.toggleMaximize(viewer.id)"
        >
          <q-icon :name="viewer.maximized ? 'close_fullscreen' : 'open_in_full'" />
        </button>
      </div>

      <!-- Kind glyph + name, centred as ONE group — the glyph follows what
           is SHOWING (the element kind's mark on the element face, the
           skeleton kind's `schema` on the skeleton face), the name stays
           the window's stable identity so its parked tab never renames. -->
      <span class="dock-bar__title element-flyout__name" :title="title">
        <q-icon :name="headIcon" size="13px" class="element-flyout__kind" />
        <span class="element-flyout__label">{{ title }}</span>
      </span>

      <!-- THE VIEW SWITCH — the fused window's one new bar control, at the
           right edge where the media bar kept nothing (its actions live in
           the foot). Wears the glyph of the face it OFFERS: `schema` while
           the element is up, the element's own glyph while the skeleton
           is; lit while the skeleton face is out. Only when the target has
           two faces. @pointerdown.stop — the bar is the drag surface, and
           a press on the switch must never start a drag. -->
      <button
        v-if="hasElementFace"
        type="button"
        class="element-flyout__swap"
        :class="{ 'is-on': view === 'skeleton' }"
        :title="swapTitle"
        @pointerdown.stop
        @click.stop="swapView"
      >
        <q-icon :name="swapIcon" size="13px" />
      </button>
    </header>

    <FriezeBar slim class="element-flyout__frieze" />

    <div class="element-flyout__well">
      <!-- ELEMENT FACE, node: the media faces — embeds (player AND page
           articles), image, video, audio, markdown doc, text, download
           card. MediaViewerBody reads { node, natural } — exactly what
           the viewer record carries once retargeted/enriched. -->
      <MediaViewerBody
        v-if="showing === 'node'"
        :viewer="{ id: viewer.id, node: targetNode, natural: viewer.natural }"
      />

      <!-- ELEMENT FACE, post: the postcard as it is on the feed, embedded.
           `select` from inside the card (the references button, the cap's
           open_in_new) closes THIS window — the same toggle that opened
           it; the pin tack's pins-changed rides up to MainLayout. -->
      <div v-else-if="showing === 'post'" class="element-flyout__card">
        <FeedStream
          :key="'embed:' + targetItem.skeleton_id"
          :embed-item="targetItem"
          @select="store.close(viewer.id)"
          @pins-changed="$emit('pins-changed')"
        />
      </div>

      <!-- SKELETON FACE: the dense Field | Type | Data table — pre-walked
           for nodes (the surround read), self-resolving for posts and
           refs (`resolved` reports back so a ref window can title itself
           and a POST instance can step forward to its card). -->
      <div v-else class="element-flyout__generic">
        <SkeletonTable
          v-if="nodeWalk"
          :skeleton="nodeWalk.skeleton"
          :slots="nodeWalk.slots"
        />
        <SkeletonTable
          v-else-if="tableRef != null"
          :ref-or-id="tableRef"
          @resolved="onResolved"
        />
        <InfoChip
          v-else-if="refFailed"
          :kind="'nodes'" :address="refString"
        />
        <div v-else class="element-flyout__loading">
          <q-spinner size="14px" color="primary" />
        </div>
      </div>
    </div>

    <!-- The foot — the media window's ledge, kept whole (user ask): the
         action cluster at the left (the element's page, then share / copy
         the pathchain path / pin), the element's own tally at the right —
         and the votes really VOTE, per element kind (nodes through
         nodeInteractionService, posts through postService, the same
         endpoints and toggle rule their pages use). A ref window that has
         not resolved yet offers the address copy alone. -->
    <footer class="element-flyout__foot">
      <div class="element-flyout__actions">
        <button
          v-if="pageRoute"
          type="button" class="dock-bar__action element-flyout__act"
          :title="'Open this ' + kindWord + '\'s page'" @click.stop="goToPage"
        >
          <q-icon :name="pageGlyph" size="13px" />
        </button>

        <span v-if="pageRoute" class="element-flyout__act-rule" aria-hidden="true" />

        <button
          v-if="pageRoute"
          type="button" class="dock-bar__action element-flyout__act"
          :title="shared ? 'Link copied' : 'Copy link'" @click.stop="share"
        >
          <q-icon :name="shared ? 'check' : 'ios_share'" size="13px" />
        </button>
        <button
          v-if="elementPath"
          type="button" class="dock-bar__action element-flyout__act"
          :title="copied ? 'Path copied' : 'Copy the pathchain path'" @click.stop="copyPath"
        >
          <q-icon :name="copied ? 'check' : 'content_copy'" size="13px" />
        </button>
        <button
          v-if="pinTarget"
          type="button" class="dock-bar__action element-flyout__act"
          :class="{ 'is-on': pinned }"
          :title="pinned ? 'Unpin' : 'Pin this ' + kindWord" @click.stop="togglePin"
        >
          <q-icon name="push_pin" size="13px" />
        </button>
      </div>

      <div v-if="votable" class="element-flyout__votes">
        <button
          type="button" class="element-flyout__vote"
          :class="{ 'is-up': viewerVote === 'UP' }"
          :title="viewerVote === 'UP' ? 'Take back your up vote' : 'Vote up'"
          @click.stop="castVote('UP')"
        >
          <q-icon name="thumb_up" size="10px" />{{ votes.up || 0 }}
        </button>
        <button
          type="button" class="element-flyout__vote"
          :class="{ 'is-down': viewerVote === 'DOWN' }"
          :title="viewerVote === 'DOWN' ? 'Take back your down vote' : 'Vote down'"
          @click.stop="castVote('DOWN')"
        >
          <q-icon name="thumb_down" size="10px" />{{ votes.down || 0 }}
        </button>
      </div>
    </footer>

    <!-- Resize rims — eight invisible hit strips kept just INSIDE the
         edges (overflow: hidden would eat anything outside the rounded
         box). Edge strips are 6px, corners 13px squares that win the
         meeting points; the bar's and foot's clusters stand one z-step
         higher so the corners never eat their taps. Gone while maximized
         — fullscreen has no size to change. -->
    <template v-if="!viewer.maximized">
      <span
        v-for="h in HANDLES"
        :key="h"
        class="element-flyout__handle"
        :class="'element-flyout__handle--' + h"
        aria-hidden="true"
        @pointerdown="onHandlePointerDown($event, h)"
      />
    </template>
  </section>
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import MediaViewerBody from 'src/components/media/MediaViewerBody.vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import SkeletonTable from 'src/components/skeletons/SkeletonTable.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { useWindowsStore } from 'src/stores/windows'
import { useNavStore } from 'src/stores/navigation'
import { pinService } from 'src/services/pin.service'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'
import { postService } from 'src/services/post.service'
import { feedService } from 'src/services/feed.service'
import { nodeService } from 'src/services/node.service'
import { refService } from 'src/services/ref.service'
import { useMediaArena } from 'src/composables/useMediaArena'
import { useMediaWindowGestures } from 'src/composables/useMediaWindowGestures'
import { probeNaturalSize, fitRect, chromeOf, clampRect } from 'src/utils/mediaFit'
import { titleOf, iconFor } from 'src/utils/mediaKind'
import { kindFor } from 'src/utils/kinds'

// Fullscreen rides ABOVE the drawer (3120) — a maximized viewer is the
// one thing meant to cover everything; normal z comes from windows.order.
const MAX_Z = 3200

// Synthetic natural boxes for the non-media targets — the fit engine
// thinks in media ratios, and these are the shapes the two faces settle
// into: a postcard is a hair taller than wide, a skeleton table a
// document. (The node targets get a REAL probe.)
const POST_BOX = { w: 4, h: 5 }
const TABLE_BOX = { w: 3, h: 4 }

export default defineComponent({
  name: 'ElementFlyout',
  components: { FriezeBar, MediaViewerBody, FeedStream, SkeletonTable, InfoChip },
  props: {
    viewerId: { type: String, required: true }
  },
  emits: ['pins-changed'],
  setup (props, { emit }) {
    const store = useFlyoutViewersStore()
    const windows = useWindowsStore()
    const navStore = useNavStore()
    const router = useRouter()
    const { arena, roam, measure, friezeH } = useMediaArena()

    const rootEl = ref(null)
    const barEl = ref(null)

    const viewer = computed(() => store.byId(props.viewerId))
    const target = computed(() => viewer.value?.target || null)
    const targetNode = computed(() => (target.value?.kind === 'node' ? target.value.node : null))
    const targetItem = computed(() => (target.value?.kind === 'post' ? target.value.item : null))
    const refString = computed(() => {
      if (target.value?.kind !== 'ref') return null
      return String(target.value.ref).replace(/^pathos:/, '')
    })
    const isNodeRef = computed(() => !!refString.value && refString.value.startsWith('nodes/'))

    // Drag (bar) + proportional resize (rim handles) — pointer capture,
    // clamping and the shrink floor all live in the composable; the shell
    // only lends its classes and the two pointerdown seams.
    const { HANDLES, dragging, resizing, onBarPointerDown, onHandlePointerDown } =
      useMediaWindowGestures({ viewer, store, roam, measure, friezeH })

    // The VIEWPORT moved (resize, phone rotate) — slide a stale rect back
    // inside so no window strands off-screen. Watches `roam`, not the
    // arena: re-clamping to the arena would haul a window the user parked
    // on the left back into the right half on every viewport change.
    watch(roam, (a) => {
      const v = viewer.value
      if (!v || !v.rect || v.maximized) return
      const c = clampRect(v.rect, a)
      if (c.x !== v.rect.x || c.y !== v.rect.y || c.w !== v.rect.w || c.h !== v.rect.h) {
        store.setRect(v.id, c)
      }
    })

    // Maximize/restore ease — the geometry transition rides a class worn
    // ~240ms around the toggle, so spawn placement never slides in from
    // nowhere and a gesture after un-maximize is not rubber-banded.
    const animMax = ref(false)
    let animT = null
    watch(() => viewer.value?.maximized, (nv, ov) => {
      if (nv == null || ov == null || nv === ov) return
      animMax.value = true
      clearTimeout(animT)
      animT = setTimeout(() => { animMax.value = false }, 240)
    })
    onBeforeUnmount(() => clearTimeout(animT))

    const styleObj = computed(() => {
      const v = viewer.value
      if (!v) return {}
      if (v.maximized) {
        return { left: '0', top: '0', width: '100vw', height: '100vh', zIndex: MAX_Z }
      }
      const zIndex = animMax.value ? MAX_Z : windows.zOf('flyout:' + v.id)
      if (!v.rect) return { left: '40%', top: '20%', visibility: 'hidden', zIndex }
      return {
        left: v.rect.x + 'px',
        top: v.rect.y + 'px',
        width: v.rect.w + 'px',
        height: v.rect.h + 'px',
        zIndex
      }
    })

    // ── THE TWO FACES ───────────────────────────────────────────────────
    // element | skeleton, per window. Posts and nodes OPEN ON THE ELEMENT
    // (user ask) — the skeleton is the head switch away; a bare ref opens
    // on the skeleton, which for a schema is the only face there is.
    const view = ref('element')
    const userToggled = ref(false)

    const resolvedInfo = ref(null) // ref-door walk answer
    const refFailed = ref(false) // nodes/ ref that would not enrich
    const nodeWalk = ref(null) // the node's OWN skeleton { skeleton, slots }
    const nodeWalkFailed = ref(false)

    const targetIdentity = computed(() => {
      const t = target.value
      if (!t) return ''
      if (t.kind === 'node') return 'node:' + t.node.id
      if (t.kind === 'post') return 'post:' + t.item.skeleton_id
      return 'ref:' + t.ref
    })

    // ⚠ Defined BEFORE the immediate reset watch below — that watch runs
    // during setup, and a `const` declared after it is still in TDZ on a
    // fresh mount (the "loadNode is not a function" lesson from this
    // window's single-box era, kept paid-for).
    const resolveRef = async () => {
      const ref0 = refString.value
      if (!ref0) return
      if (isNodeRef.value) {
        // nodes/<hash> → the enriched row, then BECOME a node window.
        try {
          const hash = ref0.split('/').pop()
          const r = await nodeService.getByPath(hash)
          if (refString.value !== ref0 || !viewer.value) return
          if (r?.node) {
            store.retarget(viewer.value.id, { kind: 'node', node: r.node })
            return
          }
          refFailed.value = true
        } catch (_) {
          if (refString.value === ref0) refFailed.value = true
        }
      }
      // skeletons/<hash> or a bare id: the skeleton face self-resolves
      // (SkeletonTable), and `onResolved` below decides whether the ref
      // is secretly a post.
    }

    // A node window's skeleton face — the NODE'S OWN walk, loaded LAZILY
    // on the first switch: a media preview should not cost a surround
    // read it may never show.
    const loadNodeWalk = async () => {
      const n = targetNode.value
      if (!n || nodeWalk.value || nodeWalkFailed.value) return
      try {
        const s = await refService.surround(n.path, 1)
        if (targetNode.value !== n) return
        if (s?.success && s.skeleton) {
          nodeWalk.value = { skeleton: s.skeleton, slots: s.slots || [] }
        } else {
          nodeWalkFailed.value = true
        }
      } catch (_) {
        if (targetNode.value === n) nodeWalkFailed.value = true
      }
    }
    watch(view, (v) => {
      if (v === 'skeleton' && target.value?.kind === 'node') loadNodeWalk()
    })

    const resetFor = () => {
      resolvedInfo.value = null
      refFailed.value = false
      nodeWalk.value = null
      nodeWalkFailed.value = false
      userToggled.value = false
      const k = target.value?.kind
      view.value = (k === 'node' || k === 'post') ? 'element' : 'skeleton'
      if (k === 'ref') resolveRef()
    }
    watch(targetIdentity, resetFor, { immediate: true })

    // The ref door's walk reported back — a POST instance steps forward
    // to its card: fetch the feed item through the hash lens and RETARGET
    // the window (same rect, new self; the target watch above then swaps
    // the default view to the element).
    const onResolved = async (info) => {
      resolvedInfo.value = info
      describeTab()
      if (target.value?.kind !== 'ref') return
      if (!info || info.is_schema || info.name !== 'POST') return
      const key0 = targetIdentity.value
      const hash = String(info.path || refString.value || '').split('/').pop()
      if (!/^[0-9a-f]{8,}$/i.test(hash)) return
      try {
        const r = await feedService.getPublic({ hash, body: 'full', limit: 1 })
        const it = r?.items?.[0]
        if (targetIdentity.value === key0 && it && viewer.value) {
          store.retarget(viewer.value.id, { kind: 'post', item: it })
        }
      } catch (_) { /* it stays a skeleton, which is never wrong */ }
    }

    const showing = computed(() => {
      if (view.value === 'element' && targetNode.value) return 'node'
      if (view.value === 'element' && targetItem.value) return 'post'
      return 'skeleton'
    })
    const hasElementFace = computed(() => !!targetNode.value || !!targetItem.value)
    const swapView = () => {
      userToggled.value = true
      view.value = view.value === 'element' ? 'skeleton' : 'element'
    }

    // What SkeletonTable self-resolves from (posts + bare refs; node
    // targets ride the pre-walked door instead).
    const tableRef = computed(() => {
      if (targetItem.value) return targetItem.value.skeleton_id
      if (target.value?.kind === 'ref' && !isNodeRef.value) return refString.value
      return null
    })

    // ── HEADER IDENTITY ─────────────────────────────────────────────────
    // The NAME is the window's stable self (a parked tab must not rename
    // when the face flips); the GLYPH follows what is showing.
    const skeletonKind = kindFor('skeletons')
    const elementGlyph = computed(() => {
      if (targetNode.value) return iconFor(targetNode.value)
      if (targetItem.value) return 'sym_o_post'
      return skeletonKind.icon
    })
    const headIcon = computed(() =>
      showing.value === 'skeleton' ? skeletonKind.icon : elementGlyph.value
    )
    const title = computed(() => {
      if (targetNode.value) return titleOf(targetNode.value)
      if (targetItem.value) return targetItem.value.title || ('post #' + targetItem.value.skeleton_id)
      const name = resolvedInfo.value?.name
      return name ? `${name} Skeleton` : 'Skeleton'
    })
    const swapIcon = computed(() =>
      view.value === 'element' ? skeletonKind.icon : elementGlyph.value
    )
    const swapTitle = computed(() => {
      if (view.value === 'element') return 'Show the skeleton'
      return targetItem.value ? 'Show the post' : 'Show the element'
    })

    // The parked tab draws label + icon from the store — mirrored as the
    // header settles so a tab and its window are never two names. The
    // ICON mirrored is the ELEMENT's (the tab names what restoring gives
    // you, not which face happened to be up when it parked).
    const describeTab = () => {
      if (viewer.value) store.describe(viewer.value.id, title.value, elementGlyph.value)
    }
    watch([title, elementGlyph], describeTab, { immediate: true })

    // ── FIT: place a fresh window ───────────────────────────────────────
    // Node targets get the real media probe; the other faces get their
    // synthetic boxes. On RETARGET (ref → node/post) the window refits
    // once — resolution lands within moments of the spawn, before any
    // deliberate gesture could have moved it.
    const naturalFor = async () => {
      if (targetNode.value) return probeNaturalSize(targetNode.value)
      if (targetItem.value) return { ...POST_BOX }
      return { ...TABLE_BOX }
    }
    const place = async () => {
      const v = viewer.value
      if (!v) return
      const natural = await naturalFor()
      if (!viewer.value) return
      store.setNatural(v.id, natural)
      const index = Math.max(0, store.viewers.findIndex(x => x.id === v.id))
      store.setRect(v.id, fitRect(natural, arena.value, {
        chrome: chromeOf(friezeH.value),
        index
      }))
    }
    onMounted(() => {
      loadElementState()
      if (viewer.value && !viewer.value.rect) place()
    })
    watch(targetIdentity, (nv, ov) => {
      if (!ov || nv === ov) return
      loadElementState()
      place()
    })

    // ── THE FOOT: the element's own actions ─────────────────────────────
    // Everything below acts on the ELEMENT, not on this window — its page,
    // its address, its pin, its tally. Per kind: nodes as the media window
    // always did, posts through their own endpoints, a bare ref only what
    // an address can offer.
    const shared = ref(false)
    const copied = ref(false)
    const pinned = ref(false)
    const votes = ref({ up: 0, down: 0, viewer_vote: null })
    const voting = ref(false)

    const kindWord = computed(() =>
      targetNode.value ? 'node' : (targetItem.value ? 'post' : 'skeleton')
    )
    const pageGlyph = computed(() =>
      targetNode.value ? 'adjust' : (targetItem.value ? 'sym_o_post' : skeletonKind.icon)
    )
    const pageRoute = computed(() => {
      if (targetNode.value) return '/nodes/' + targetNode.value.id
      if (targetItem.value) return '/posts/' + targetItem.value.skeleton_id
      if (resolvedInfo.value?.id != null) return '/skeletons/' + resolvedInfo.value.id
      return null
    })
    const elementPath = computed(() => {
      if (targetNode.value) return targetNode.value.path || null
      if (targetItem.value) return targetItem.value.skeleton_path || null
      return refString.value
    })
    const pinTarget = computed(() => {
      if (targetNode.value) return { type: 'node', id: targetNode.value.id }
      if (targetItem.value) return { type: 'skeleton', id: targetItem.value.skeleton_id }
      // A bare skeleton window pins its skeleton once the walk has named
      // it (skeletons plan phase 2 — the door used to offer no tack).
      if (resolvedInfo.value?.id != null) return { type: 'skeleton', id: resolvedInfo.value.id }
      return null
    })
    const votable = computed(() => !!targetNode.value || !!targetItem.value)

    const targetMeta = () => {
      const t = pinTarget.value
      if (!t) return {}
      return {
        targetType: t.type,
        targetId: t.id,
        targetRoute: pageRoute.value,
        targetLabel: kindWord.value + ' #' + t.id,
        targetPath: elementPath.value
      }
    }

    const goToPage = () => { if (pageRoute.value) router.push(pageRoute.value) }

    const share = async () => {
      if (!pageRoute.value) return
      const url = window.location.origin + window.location.pathname + '#' + pageRoute.value
      try {
        await navigator.clipboard.writeText(url)
        shared.value = true
        setTimeout(() => { shared.value = false }, 1600)
      } catch (e) { /* clipboard denied — the tooltip simply never flips */ }
    }

    const copyPath = async () => {
      if (!elementPath.value) return
      try {
        await navigator.clipboard.writeText(elementPath.value)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (e) { /* clipboard denied — the tooltip simply never flips */ }
    }

    const refreshPinned = async () => {
      const t = pinTarget.value
      if (!t) { pinned.value = false; return }
      try {
        const r = await pinService.check(t.type, t.id)
        pinned.value = !!(r.success && r.pinned)
      } catch (e) { /* unauthenticated or offline — leave it unpinned */ }
    }

    const togglePin = async () => {
      const t = pinTarget.value
      if (!t) return
      const was = pinned.value
      try {
        if (was) await pinService.unpin(t.type, t.id)
        else await pinService.pin(t.type, t.id)
        pinned.value = !was
        navStore.recordAction(was ? 'UNPIN' : 'PIN', targetMeta())
        emit('pins-changed')
      } catch (e) { /* refuse quietly; the state simply does not flip */ }
    }

    const viewerVote = computed(() => {
      const v = votes.value.viewer_vote
      return v === 1 ? 'UP' : v === -1 ? 'DOWN' : v
    })

    // Seed the tally from what the trigger handed over (both card and
    // NodeMini enrich votes), then let one read fill the viewer's own
    // vote in — the seed never carries it.
    const loadVotes = async () => {
      votes.value = { up: 0, down: 0, viewer_vote: null }
      const seed = targetNode.value?.votes || targetItem.value?.votes
      if (seed) votes.value = { up: 0, down: 0, viewer_vote: null, ...seed }
      try {
        if (targetNode.value) {
          const r = await nodeInteractionService.getInteractions(targetNode.value.id)
          if (r.success && r.votes && targetNode.value) votes.value = r.votes
        } else if (targetItem.value) {
          const r = await postService.getVotes(targetItem.value.skeleton_id)
          if (r.success && r.votes && targetItem.value) votes.value = r.votes
        }
      } catch (e) { /* the tally stays seeded rather than blocking the view */ }
    }

    // Same toggle rule as the pages: clicking the vote you hold takes it
    // back, switching sides moves the count across. Counts move locally
    // first — the request is the truth, but the button has to answer
    // under the finger.
    const castVote = async (direction) => {
      const t = pinTarget.value
      if (!t || voting.value) return
      voting.value = true
      const key = direction === 'UP' ? 'up' : 'down'
      const held = viewerVote.value
      const svc = targetNode.value
        ? { vote: (d) => nodeInteractionService.vote(t.id, d), unvote: () => nodeInteractionService.unvote(t.id) }
        : { vote: (d) => postService.vote(t.id, d), unvote: () => postService.unvote(t.id) }
      try {
        if (held === direction) {
          await svc.unvote()
          votes.value[key] = Math.max(0, (votes.value[key] || 0) - 1)
          votes.value.viewer_vote = null
          navStore.recordAction('UNVOTE', targetMeta())
        } else {
          await svc.vote(direction)
          if (held) {
            const other = held === 'UP' ? 'up' : 'down'
            votes.value[other] = Math.max(0, (votes.value[other] || 0) - 1)
          }
          votes.value[key] = (votes.value[key] || 0) + 1
          votes.value.viewer_vote = direction
          navStore.recordAction(direction === 'UP' ? 'VOTE_UP' : 'VOTE_DOWN', targetMeta())
        }
      } catch (e) { /* refused — counts stay as the server last told us */ }
      voting.value = false
    }

    // Pin + tally follow the ELEMENT — loaded at mount and reloaded on
    // retarget (a ref window becoming a post starts answering for the
    // post).
    const loadElementState = () => {
      refreshPinned()
      loadVotes()
    }

    return {
      store,
      viewer,
      targetNode,
      targetItem,
      refString,
      refFailed,
      nodeWalk,
      view,
      showing,
      hasElementFace,
      swapView,
      swapIcon,
      swapTitle,
      headIcon,
      title,
      tableRef,
      onResolved,
      styleObj,
      rootEl,
      barEl,
      HANDLES,
      dragging,
      resizing,
      animMax,
      onBarPointerDown,
      onHandlePointerDown,
      kindWord,
      pageGlyph,
      pageRoute,
      elementPath,
      pinTarget,
      votable,
      goToPage,
      shared,
      share,
      copied,
      copyPath,
      pinned,
      togglePin,
      votes,
      viewerVote,
      castVote
    }
  }
})
</script>

<style lang="scss" scoped>
// THE SHELL IS THE MEDIA WINDOW'S, kept whole through the fusion
// (2026-08-17): one `--grey-4` coat, header included (2026-08-05 user ask
// — the box crossed to the light half of the scale and every ink in it
// inverted), a `--grey-6` rim that reads as the EDGE of the material
// rather than a line painted on it (brushed metal has no outline; the
// drop shadow is what separates the box from the page), and `overflow:
// hidden` load-bearing — the frieze band and the faces would square the
// rounded corners otherwise. The grey-3/brown flyout-window dress the
// single-instance box wore stays with `css/_components.scss` for the
// dashboard dock; THIS family is the metal one.
.element-flyout {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--grey-4, #e0e0e0);
  border: 1px solid var(--grey-6, #9e9e9e);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);

  &.is-max {
    border-radius: 0;
    border: none;
  }

  // Maximize/restore ease — a short geometry glide scoped to the class
  // the shell wears ~240ms around the toggle, so the spawn placement
  // appears at size and steady-state drags stay transition-free.
  &.is-anim-max {
    transition: left 0.2s ease, top 0.2s ease, width 0.2s ease,
      height 0.2s ease, border-radius 0.2s ease;
  }

  // Grabbed/resizing: the edges ILLUMINATE — the node family's loud teal
  // ring + bloom. Declared AFTER the ease so they win the tie: a window
  // under the pointer must track it 1:1, never rubber-band after it.
  &.is-grabbed,
  &.is-resizing {
    transition: none;
    border-color: var(--teal-13, #1de9b6);
    box-shadow:
      0 0 0 1px var(--teal-13, #1de9b6),
      0 0 18px 2px rgba(29, 233, 182, 0.35),
      0 12px 34px rgba(0, 0, 0, 0.45);
  }

  &.is-max .element-flyout__bar { cursor: default; }
  &.is-grabbed .element-flyout__bar { cursor: grabbing; }
}

// The house dock-bar, left-lights, the bar itself the drag surface (open
// hand on its free areas; the buttons keep their own pointer, and no
// touch scrolling — a finger on the bar is a drag, never a page pan).
// Asymmetric padding: enough left to clear the traffic cluster, and —
// new with the fusion — enough right to clear the VIEW SWITCH standing
// at the other end.
.element-flyout__bar {
  position: relative;
  flex: 0 0 auto;
  justify-content: center;
  padding: 0 40px 0 70px;
  background: var(--grey-4, #e0e0e0); // the box's own coat — no cap
  border-bottom: none; // the frieze band is the divider
  cursor: grab;
  touch-action: none;

  .traffic {
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    z-index: 6; // above the NW resize corner — the lights keep their taps
  }
}

// Glyph + name as one centred group, in the platform's DISPLAY face —
// the same face the parked tabs wear, so a window reads as the tab's
// full-size self. The ellipsis lives on the label so the glyph can never
// be the thing that gets truncated.
.element-flyout__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  color: var(--grey-9, #424242);
  font-family: var(--font-display);
  font-size: 0.72em;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.element-flyout__kind {
  flex: 0 0 auto;
  color: var(--grey-8, #616161); // a step under the ink — glyph, not word
}

.element-flyout__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

// THE VIEW SWITCH — pinned to the bar's right edge, mirroring the
// traffic cluster; the window's inks (grey-8 resting, grey-10 press),
// a hairline + a lift of white while the skeleton face is out.
.element-flyout__swap {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 6; // above the NE resize corner — the switch keeps its taps
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  color: var(--grey-8, #616161);
  cursor: pointer;

  &:hover { color: var(--grey-10, #212121); border-color: var(--grey-6, #9e9e9e); }

  &.is-on {
    color: var(--grey-10, #212121);
    border-color: var(--grey-6, #9e9e9e);
    background: rgba(255, 255, 255, 0.55);
  }
}

// The band between bar and well — dark strip across the light field, the
// box's ONLY line (the fusion keeps the media window's setting).
.element-flyout__frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-8, #616161);
  --frieze-bar-wave-two: var(--brown-1, #efebe9);
}

// The one flexible track, and a SIZE CONTAINER so the faces can convert
// the well's real box into their budgets (`--media-max-h` for embeds; the
// postcard's own container queries measure the embed pane inside).
// The container draws NOTHING of its own — the thin padding is the only
// separation between a face and the window's rim.
.element-flyout__well {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  padding: 4px;
  container-type: size;
}

// ── ELEMENT FACE, POST: the embedded card's frame ────────────────────────
// The postcard arrives wearing its own everything through FeedStream's
// embed dress; this wrapper's whole job is geometry — fill the well, let
// the embed's own well be the one scroller. Deliberately NOT re-dialled:
// "as it is on the feed" means its indigo/cream self on the metal box.
.element-flyout__card {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;

  :deep(.feed-stream-pane) { flex: 1 1 auto; min-width: 0; }
}

// ── SKELETON FACE: the dense table's frame ───────────────────────────────
// The table keeps its own grey-3 coat — one step above the metal well,
// the raised-object rule the single-box era settled — and this wrapper
// owns the scroll.
.element-flyout__generic {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;

  :deep(.skel-table) { width: 100%; }
}

.element-flyout__loading {
  padding: 6px 0;
}

// The foot — the media window's ledge, whole: actions left, tally right,
// chrome coat and display face, `FOOT_H` in utils/mediaFit is what keeps
// the fit engine's arithmetic in step with this height.
.element-flyout__foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 22px;
  padding: 0 8px 1px;
  font-family: var(--font-display);
  font-size: 0.58em;
  position: relative;
  z-index: 6; // over the S/SE/SW resize rims — votes beat resizes
}

.element-flyout__actions {
  display: flex;
  align-items: center;
  gap: 1px;
}

.element-flyout__act {
  color: var(--grey-8, #616161);
  width: 19px;
  height: 19px;

  &:hover { color: var(--grey-10, #212121); }
  // A held pin is a STATE, not a hover.
  &.is-on,
  &.is-on:hover { color: var(--accent); }
}

// The hairline between "go there" and "act on it".
.element-flyout__act-rule {
  flex: 0 0 auto;
  width: 1px;
  height: 12px;
  margin: 0 4px;
  background: var(--grey-6, #9e9e9e);
}

.element-flyout__votes {
  display: flex;
  align-items: center;
  gap: 8px;
}

// FLAT, the way NodeMini writes a tally — until it is YOURS, and then the
// semantic green/red rides in the INK alone.
.element-flyout__vote {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--grey-8, #616161);
  font: inherit;
  letter-spacing: 0.04em;
  cursor: pointer;

  &:hover { color: var(--grey-10, #212121); }
  &.is-up { color: var(--positive); }
  &.is-down { color: var(--negative); }
}

// The resize rims: invisible, cursor-only hit areas held INSIDE the box.
// 6px edge strips between 13px corner squares; z 5 floats them over the
// well, one step UNDER the bar's clusters (z 6).
.element-flyout__handle {
  position: absolute;
  z-index: 5;
  touch-action: none;

  &--n,
  &--s { left: 13px; right: 13px; height: 6px; cursor: ns-resize; }
  &--e,
  &--w { top: 13px; bottom: 13px; width: 6px; cursor: ew-resize; }
  &--n { top: 0; }
  &--s { bottom: 0; }
  &--e { right: 0; }
  &--w { left: 0; }

  &--nw,
  &--ne,
  &--sw,
  &--se { width: 13px; height: 13px; }
  &--nw { top: 0; left: 0; cursor: nwse-resize; }
  &--se { bottom: 0; right: 0; cursor: nwse-resize; }
  &--ne { top: 0; right: 0; cursor: nesw-resize; }
  &--sw { bottom: 0; left: 0; cursor: nesw-resize; }
}
</style>
