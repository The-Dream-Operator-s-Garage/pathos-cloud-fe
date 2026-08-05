<template>
  <!-- One floating media viewer — a dark-grey rounded box over the arena
       (docs/plans/floating-media-viewer.md). The header is the house
       .dock-bar wearing the docks' traffic lights, coated in the SAME
       `--grey-9` as the box; the band under it is the flyout skeleton
       viewer's black-brown FriezeBar (slim) dropped a step darker still
       (`--frieze-bar-base: var(--grey-10)`, brown-1 wave), which is what
       divides the two now that they share a tone; the well holds the
       media behind a very thin padding. Geometry is inline style off the
       store's rect; `is-max` swaps it for the whole viewport. -->
  <section
    v-if="viewer"
    ref="rootEl"
    class="media-window"
    :class="{
      'is-max': viewer.maximized,
      'is-grabbed': dragging,
      'is-resizing': !!resizing,
      'is-anim-max': animMax
    }"
    :style="styleObj"
    role="dialog"
    :aria-label="fileName"
    @pointerdown="store.focus(viewer.id)"
  >
    <header
      ref="barEl"
      class="dock-bar media-window__bar"
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
          title="Minimize" @click.stop="store.minimize(viewer.id)"
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

      <span class="dock-bar__title media-window__name" :title="fileName">{{ fileName }}</span>

      <button
        type="button" class="dock-bar__action media-window__share"
        :title="shared ? 'Link copied' : 'Copy link'" @click.stop="share"
      >
        <q-icon :name="shared ? 'check' : 'ios_share'" size="13px" />
      </button>
    </header>

    <FriezeBar slim class="media-window__frieze" />

    <div class="media-window__well">
      <MediaViewerBody :viewer="viewer" />
    </div>

    <!-- Resize rims — eight invisible hit strips kept just INSIDE the
         edges (overflow: hidden would eat anything outside the rounded
         box). Edge strips are 6px, corners 13px squares that win the
         meeting points; the bar's button clusters stand one z-step
         higher so the top corners never eat the lights' or the share's
         taps. The thin slice of media edge they do cover is the
         sanctioned cost of grabbable rims. Gone while maximized —
         fullscreen has no size to change. -->
    <template v-if="!viewer.maximized">
      <span
        v-for="h in HANDLES"
        :key="h"
        class="media-window__handle"
        :class="'media-window__handle--' + h"
        aria-hidden="true"
        @pointerdown="onHandlePointerDown($event, h)"
      />
    </template>
  </section>
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import MediaViewerBody from './MediaViewerBody.vue'
import { useMediaViewersStore } from 'src/stores/mediaViewers'
import { useWindowsStore } from 'src/stores/windows'
import { useMediaArena } from 'src/composables/useMediaArena'
import { useMediaWindowGestures } from 'src/composables/useMediaWindowGestures'
import { probeNaturalSize, fitRect, chromeOf, clampRect } from 'src/utils/mediaFit'
import { titleOf } from 'src/utils/mediaKind'

// Fullscreen rides ABOVE the drawer (3120) — a maximized preview is the
// one thing meant to cover everything; normal z comes from windows.order.
const MAX_Z = 3200

export default defineComponent({
  name: 'MediaViewerWindow',
  components: { FriezeBar, MediaViewerBody },
  props: {
    viewerId: { type: String, required: true }
  },
  setup (props) {
    const store = useMediaViewersStore()
    const windows = useWindowsStore()
    // Two regions, two jobs: `arena` places the window at spawn (the
    // docks' half), `roam` is the whole viewport every gesture and the
    // re-clamp are held to. See useMediaArena.
    const { arena, roam, measure, friezeH } = useMediaArena()

    const rootEl = ref(null)
    const barEl = ref(null)
    const shared = ref(false)

    const viewer = computed(() => store.byId(props.viewerId))

    // Drag (bar) + proportional resize (rim handles) — pointer capture,
    // arena clamping and the shrink floor all live in the composable;
    // the shell only lends its classes and the two pointerdown seams.
    const { HANDLES, dragging, resizing, onBarPointerDown, onHandlePointerDown } =
      useMediaWindowGestures({ viewer, store, roam, measure, friezeH })

    // The VIEWPORT moved (resize, phone rotate) — slide a stale rect back
    // inside so no window strands off-screen. Gestures already clamp at
    // their own starts; this covers windows nobody is touching. It
    // watches `roam` and not the arena on purpose: re-clamping to the
    // arena would haul a window the user parked on the left back into the
    // right half every time the rail or the orientation changed, undoing
    // a placement nobody asked to undo. Maximized windows have no rect
    // geometry to protect.
    watch(roam, (a) => {
      const v = viewer.value
      if (!v || !v.rect || v.maximized) return
      const c = clampRect(v.rect, a)
      if (c.x !== v.rect.x || c.y !== v.rect.y || c.w !== v.rect.w || c.h !== v.rect.h) {
        store.setRect(v.id, c)
      }
    })

    // Maximize/restore ease — the geometry transition rides a class the
    // shell wears only ~240ms around the toggle, so the spawn placement
    // never slides in from nowhere and a gesture started right after an
    // un-maximize is not rubber-banded (its classes kill transitions
    // outright regardless).
    const animMax = ref(false)
    let animT = null
    watch(() => viewer.value?.maximized, (nv, ov) => {
      if (nv == null || ov == null || nv === ov) return
      animMax.value = true
      clearTimeout(animT)
      animT = setTimeout(() => { animMax.value = false }, 240)
    })
    onBeforeUnmount(() => clearTimeout(animT))

    // One naming seam (utils/mediaKind#titleOf) for the header and the
    // parked tab, so a window and its tab can never be called two things.
    // Web media reads `PROVIDER :: name` (2026-08-05, user ask).
    const fileName = computed(() => titleOf(viewer.value?.node))

    const styleObj = computed(() => {
      const v = viewer.value
      if (!v) return {}
      if (v.maximized) {
        return { left: '0', top: '0', width: '100vw', height: '100vh', zIndex: MAX_Z }
      }
      // Held at the fullscreen z for the un-maximize ease so the window
      // shrinks back to its spot on top of everything instead of
      // dropping under other chrome mid-flight.
      const zIndex = animMax.value ? MAX_Z : windows.zOf('media:' + v.id)
      // Placed by the fit engine after the first probe; laid out but
      // invisible for that frame so nothing flashes at a wrong size.
      if (!v.rect) return { left: '40%', top: '20%', visibility: 'hidden', zIndex }
      return {
        left: v.rect.x + 'px',
        top: v.rect.y + 'px',
        width: v.rect.w + 'px',
        height: v.rect.h + 'px',
        zIndex
      }
    })

    onMounted(async () => {
      const v = viewer.value
      if (!v || v.rect) return
      const natural = v.natural || await probeNaturalSize(v.node)
      store.setNatural(v.id, natural)
      const index = Math.max(0, store.viewers.findIndex(x => x.id === v.id))
      store.setRect(v.id, fitRect(natural, arena.value, {
        chrome: chromeOf(friezeH.value),
        index
      }))
    })

    const share = async () => {
      const n = viewer.value?.node
      if (!n) return
      const url = window.location.origin + window.location.pathname + '#/nodes/' + n.id
      try {
        await navigator.clipboard.writeText(url)
        shared.value = true
        setTimeout(() => { shared.value = false }, 1600)
      } catch (e) { /* clipboard denied — the tooltip simply never flips */ }
    }

    return {
      store,
      viewer,
      fileName,
      styleObj,
      rootEl,
      barEl,
      shared,
      share,
      HANDLES,
      dragging,
      resizing,
      animMax,
      onBarPointerDown,
      onHandlePointerDown
    }
  }
})
</script>

<style lang="scss" scoped>
// The box: ONE `--grey-4` coat, header included — and the SECOND tone
// move of 2026-08-05 (user ask). The window was dark all day: a
// `--grey-9` field (a `--grey-10` cap over it until that morning) with
// its ink flipped light. `--grey-4` is #e0e0e0, so the box crossed to
// the LIGHT half of the scale and every light-on-dark decision in it had
// to inverse — the name, the share glyph and the embed caption in the
// body are all dark neutrals now (grey-9/-8 on grey-4 rather than
// grey-3/-5/-4 on grey-9). The border flipped one pass later (user ask,
// same day): `--grey-8` was a half-step line while the coat was dark and
// a 3.2:1 black outline on the light one — the darkest mark on the whole
// window, drawn round the outside, where the frieze band is meant to be
// the one dark thing in the box. `--grey-6` sits 1.9:1 off the coat, so
// the rim reads as the EDGE of the material rather than a line painted
// on it (brushed metal has no outline). It can be this quiet because the
// drop shadow is what separates the box from the page — the rim only has
// to say where the metal stops. Floating, so it carries a real
// drop shadow (the docks' up-left cast is a bottom-docked device; this box
// touches no edge). `overflow: hidden` is load-bearing: the frieze band
// and the media would square the rounded corners otherwise (the flyout
// precedent).
.media-window {
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

  // Maximize/restore ease — a short geometry glide scoped to the
  // .is-anim-max class the shell wears ~240ms around the toggle, so the
  // spawn placement appears at size (no slide-in from the hidden frame)
  // and steady-state drags stay transition-free.
  &.is-anim-max {
    transition: left 0.2s ease, top 0.2s ease, width 0.2s ease,
      height 0.2s ease, border-radius 0.2s ease;
  }

  // Grabbed/resizing: the edges ILLUMINATE — the node family's loud
  // teal (the -13 accent NodeMini's base wears) as a ring over the
  // border plus a soft bloom, luminous against the grey-9 coat. The
  // same classes kill any geometry transition, declared AFTER the ease
  // above so they win the tie: a window under the pointer must track it
  // 1:1, never rubber-band after it.
  &.is-grabbed,
  &.is-resizing {
    transition: none;
    border-color: var(--teal-13, #1de9b6);
    box-shadow:
      0 0 0 1px var(--teal-13, #1de9b6),
      0 0 18px 2px rgba(29, 233, 182, 0.35),
      0 12px 34px rgba(0, 0, 0, 0.45);
  }

  // Fullscreen cannot move — the bar keeps its buttons but drops the
  // grab affordance.
  &.is-max .media-window__bar { cursor: default; }
  &.is-grabbed .media-window__bar { cursor: grabbing; }
}

// The house dock-bar, centred-title / left-lights (the creation docks'
// promoted rule restated here — that rule is scoped to
// .dock-window--creation and this window is not one). The share action
// mirrors the lights on the right, so the title's 76px side paddings keep
// it truly centred between them.
.media-window__bar {
  position: relative;
  flex: 0 0 auto;
  justify-content: center;
  padding: 0 76px;
  background: var(--grey-4, #e0e0e0); // the box's own coat — no cap
  border-bottom: none; // the frieze band is the divider
  // The bar is the drag surface: an open hand on its free areas (the
  // buttons keep their own pointer), and no touch scrolling — a finger
  // on the bar is a drag, never a page pan.
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

.media-window__name {
  // Dark on the light coat (7.0:1) — the tone the box itself wore until
  // the grey-4 pass, spent as ink now.
  color: var(--grey-9, #424242);
  font-size: 0.78em;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.media-window__share {
  position: absolute;
  right: 8px;
  top: 0;
  bottom: 0;
  margin: auto 0;
  // Muted → full-strength on hover, the same two-step as before, walked
  // down the scale instead of up: --grey-8 rests a step under the name's
  // --grey-9 and --grey-10 is the press.
  color: var(--grey-8, #616161);
  z-index: 6; // above the NE resize corner, same deal as the lights

  &:hover { color: var(--grey-10, #212121); }
}

// The flyout skeleton viewer's band, on a `--grey-8` plaque under the
// `--brown-1` wave (both stated, not left to the slim variant's default,
// since this band is the box's ONLY line and the tones that draw it
// should be readable here). It is the divider the header stopped being
// when it took the coat: a dark strip across a light field. The plaque
// walked grey-9 → grey-10 → grey-8 on 2026-08-05 as the coat went dark →
// darker-under-light → light; what holds through all three is the
// RELATION the FriezeBar recipe needs — the brown-1 wave sits well above
// its base, so the carve reads as a groove lit from the top left. On the
// light grey-4 coat the band is now the darkest thing in the window and
// the wave the palest, which is what keeps one line doing the work of a
// tone change.
.media-window__frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-8, #616161);
  --frieze-bar-wave-two: var(--brown-1, #efebe9);
}

// The media behind a very thin padding; the one flexible track, and a
// SIZE CONTAINER so the body can convert the well's real box into the
// `--media-max-h` budget EmbedFrame understands.
.media-window__well {
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px;
  container-type: size;
}

// The resize rims: invisible, cursor-only hit areas held INSIDE the box
// (overflow: hidden). 6px edge strips between 13px corner squares —
// thin enough that the header's buttons (13px dots starting ~8px down)
// and the media keep everything but the outermost sliver; the corners
// are bigger because diagonals are the workhorse grab. z 5 floats them
// over the well, one step UNDER the bar's button clusters (z 6).
.media-window__handle {
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
