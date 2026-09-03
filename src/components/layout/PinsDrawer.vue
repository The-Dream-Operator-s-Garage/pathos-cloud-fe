<template>
  <!-- The pinned list, RIDING THE FOOTER BAR'S INNER FRIEZE BAR at its RIGHT
       RUN since 2026-09-02 — THE STACK STRIP'S MIRROR (user ask: "help me
       taking the pin side bar on the right of the screen and help me making
       its style the same as the stack bar on the footer nav bar, except the
       pin bar should be now inserted into the footer friezebar, with the
       scroll directed from right to left and placed to the left of the
       dashboard button. For the extended version of the pin bar, copy the
       style that the stack bar already has"). It was the right edge's
       vertical column from 2026-07-24 (running to the window floor over the
       bar's right end since 2026-08-02, the tack in a rebuilt bar row at its
       foot) until then; that column's record is in git.
       ONE element with two presentations — StackPanel's, REFLECTED:
       · parked (win.minimized) = a `--stack-w` strip standing INSIDE the
         trail band at `right: var(--nav-dash-w)` — beside the full-height
         DASHBOARD BLOCK at the bar's right end, never covering it (the
         identity section's bargain with the stack strip, mirrored) — the
         head glyph at the strip's LEFT END and the items lane to its right,
         both ROW-REVERSED: the NEWEST pin lands beside the glyph and older
         pins flow rightward, scrolling off past the strip's end ("the
         scroll directed from right to left"). Three glyph seats a third of
         the lane each — the stack's own tiles.
       · expanded = the `--stack-w` panel rising from that same seat to the
         window floor — the stack's expanded face reflected: rims on its
         three exposed edges, both top corners round, the cast thrown
         LEFTWARD, the flyout's slim band at its top edge and again between
         the well and the header; the header at the BOTTOM holding the
         count, THE TACK and the history control; the list above it
         OLDEST→NEWEST top-to-bottom.
       The list is the ONE scroller in both faces; its position carries
       through the morph as a ratio — x parked (negative: row-reverse's own
       coordinate, see scrollToNewest), y expanded.
       ⚠ THE TACK LIVES IN THE EXPANDED HEADER NOW: the `.pins-footer` row the
       column rebuilt around it (2026-08-02) went with the column. The bar
       keeps its fallback tack for mobile (NavigationBar `showTack`), where
       both strips hide. -->
  <aside
    v-if="win.open"
    class="pins-window dock-window"
    :class="{ 'is-parked': win.minimized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
    <!-- The flyout's band at the panel's top edge — StackPanel's, verbatim
         (`slim`, unflipped, the grey-8 plate under the brown-1 wave; see the
         style block). EXPANDED ONLY: the parked face is a band-height strip
         with no seat for a horizontal wave. The shared shell's `overflow:
         hidden` clips it into the two rounded top corners. -->
    <FriezeBar v-if="!win.minimized" slim class="pins-frieze" />

    <div v-if="loading && !win.minimized" class="pins-loading">
      <q-spinner color="red-6" size="22px" />
    </div>

    <div v-else-if="pins.length === 0 && !win.minimized" class="pins-empty">
      <q-icon name="push_pin" size="40px" class="pins-empty-icon" />
      <div class="pins-empty-title">No pins yet</div>
      <div class="pins-empty-hint">Open a node, post, label, or skeleton and tap the tack to pin it here.</div>
    </div>

    <div v-else ref="listEl" class="pins-list" :class="{ 'is-parked': win.minimized }">
      <!-- Ordered OLDEST→NEWEST in the DOM (the spine's append order), which
           the two faces read differently by construction: the expanded
           column runs it top-to-bottom, the newest pin at the bottom beside
           the header; the parked lane is `row-reverse`, so the DOM's last
           item — the newest — is the one that lands at the LEFT beside the
           head glyph. Each pin is the one mutating side-bar item
           (SidePanelItem): expanded face = micro chip · title · pinned-x-ago
           · author, the kind button palette-inverted on the right, copy/unpin
           riding the actions slot; parked face = the flat kind-colored glyph
           tile. The pin you are currently VIEWING wraps in the kind-colored
           bubble (expanded) / inverts to a solid fill (parked). Activating
           opens the element's viewer; an expanded row also parks the panel so
           the destination lands in full view. -->
      <SidePanelItem
        v-for="p in listPins"
        :key="p.pin_link_id"
        class="pins-item"
        :collapsed="win.minimized"
        :kind="kindKeyOf(p)"
        :hash="hashOf(p.target_ref)"
        :title="summaries[p.target_ref]?.primary || ''"
        :time="p.pinned_at"
        :author="summaries[p.target_ref]?.author?.username || null"
        :current="isCurrent(p)"
        :tooltip="railTitle(p)"
        rail-icon-size="12px"
        @activate="openPin(p)"
      >
        <template #actions>
          <button
            class="pin-copy"
            :class="{ 'is-copied': copiedId === p.pin_link_id }"
            :title="copiedId === p.pin_link_id ? 'Copied!' : 'Copy [[pathos:…]] reference for the maker'"
            @click.stop="onCopy(p)"
          >
            <q-icon :name="copiedId === p.pin_link_id ? 'check' : 'content_copy'" size="11px" />
          </button>
          <button class="pin-unpin" title="Unpin" @click.stop="onUnpin(p)">
            <q-icon name="close" size="11px" />
          </button>
        </template>
      </SidePanelItem>
    </div>

    <!-- The second band, INSIDE the panel between the well and the header —
         the flyout's band in the flyout's own position (the one line between
         a box's bar and its well; this box's bar is at the bottom). Expanded
         only, like its twin above. -->
    <FriezeBar v-if="!win.minimized" slim class="pins-frieze pins-frieze--inner" />

    <!-- Header/controls box at the BOTTOM of the expanded panel (the stack's
         arrangement): the bar ITSELF parks the widget (a touch affordance —
         hover already parks it on the way out). Minimize-only: the pins
         panel has no nav-bar button, so it parks to the strip instead of
         closing (a full close would strand it). Holds, right to left: the
         history control, THE TACK (moved in from the column's rebuilt bar
         row, 2026-09-02 — its skin unchanged), the count. -->
    <header v-if="!win.minimized" class="dock-bar dock-bar--park"
      title="Park to the strip" @click="windows.minimizePanel('pins')">
      <q-icon name="push_pin" size="14px" class="dock-bar__icon dock-bar__icon--pins" />
      <span class="dock-bar__title nasalization">Pinned</span>
      <q-space />
      <span class="dock-bar__meta mono">
        {{ pins.length }} pin{{ pins.length === 1 ? '' : 's' }}
      </span>
      <!-- The tack's seat swallows the click even when the pill is disabled
           (a disabled q-btn is pointer-transparent — without this seat the
           tap would fall through to the bar and park the widget). -->
      <span class="pins-tack-seat" @click.stop>
        <q-btn
          round unelevated no-caps
          class="tack-btn pins-tack"
          :class="{ 'is-pinned': isCurrentPinned }"
          :disable="!pinnable"
          @click.stop="onTack"
        >
          <q-icon name="push_pin" size="12px" :class="{ 'tack-filled': isCurrentPinned }" />
          <q-tooltip anchor="top middle" self="bottom middle">{{ pinnable ? (isCurrentPinned ? 'Unpin this' : 'Pin this') : 'Open a node, post, label or skeleton to pin it' }}</q-tooltip>
        </q-btn>
      </span>
      <button type="button" class="dock-bar__action" @click.stop="onHistory">
        <q-icon name="history" size="15px" />
        <q-tooltip anchor="top middle" self="bottom middle">Pinned list history</q-tooltip>
      </button>
    </header>

    <!-- Parked replacement for the header: the head glyph — the DOM's last
         child, which `row-reverse` puts at the strip's LEFT END (the stack's
         glyph stands at its strip's right end; the two strips reflect each
         other across the bar). Hovering anywhere on the strip expands the
         panel; the tap stays for touch screens. 15px: the glyph rides inside
         the 21px trail band, the nav buttons' own glyph-in-band chain. -->
    <button v-else type="button" class="dock-side-head pins-side-head"
      @click="windows.restorePanel('pins')">
      <q-icon name="push_pin" size="15px" />
    </button>
  </aside>
</template>

<script>
import { defineComponent, ref, reactive, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWindowsStore } from 'src/stores/windows'
import { pinService } from 'src/services/pin.service'
import { refService } from 'src/services/ref.service'
import { timeAgo as fmtTimeAgo } from 'src/utils/time'
import { kindFor, hashOf } from 'src/utils/kinds'
import SidePanelItem from './SidePanelItem.vue'
import FriezeBar from './FriezeBar.vue'

export default defineComponent({
  name: 'PinsDrawer',
  components: { SidePanelItem, FriezeBar },
  props: {
    // Bumped by the parent when pins mutate elsewhere (the nav bar's fallback
    // tack, a page's own cap) so the widget stays in sync.
    refreshKey: { type: Number, default: 0 }
  },
  emits: ['changed'],

  setup (props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const windows = useWindowsStore()
    const win = computed(() => windows.panels.pins)

    const pins = ref([])
    const loading = ref(false)
    // Order explicitly oldest→newest by pin_skeleton_id (append order) so the
    // ordering never rides on the API's response order. ONE order for both
    // faces: the expanded column reads it top→bottom (newest at the bottom
    // beside the header), the parked lane is row-reversed and reads it
    // right→left (newest at the left beside the head glyph).
    const listPins = computed(() =>
      [...pins.value].sort((a, b) => (a.pin_skeleton_id || 0) - (b.pin_skeleton_id || 0)))
    // target_ref → refs summary ({ primary, route, … }): real titles for the
    // parked tooltips and the real viewer route for taps (a pinned post's
    // target_type is 'skeleton', but its summary routes to /posts/:id).
    const summaries = reactive({})
    // pin_link_id of the pin whose reference was just copied (drives the brief
    // checkmark + tooltip swap). Reset after a short timeout.
    const copiedId = ref(null)
    let copyResetTimer = null

    const loadSummaries = async (rows) => {
      const missing = rows.filter(p => p.target_ref && !summaries[p.target_ref])
      await Promise.all(missing.map(async (p) => {
        try {
          const r = await refService.summary(p.target_ref)
          if (r.success) summaries[p.target_ref] = r.summary
        } catch (_) { /* summary is cosmetic — the kind fallback still works */ }
      }))
    }

    const load = async () => {
      loading.value = true
      try {
        const r = await pinService.list()
        if (r.success) pins.value = r.pins
      } catch (_) { pins.value = [] }
      loading.value = false
      loadSummaries(pins.value)
    }

    // Both presentations need the pin rows — reload whenever the widget is
    // visible and whenever the parent signals a mutation.
    watch(
      () => [win.value.open, props.refreshKey],
      () => { if (win.value.open) load() },
      { immediate: true }
    )

    // End-anchored list: pin the scroll to the NEWEST end whenever the pins
    // change — the bottom expanded, the LEFT end parked. ⚠ ROW-REVERSE'S
    // COORDINATE: a `flex-direction: row-reverse` scroller puts its origin at
    // the RIGHT edge (main-start) and counts scrollLeft NEGATIVE leftward, so
    // "the left end" is the most negative value, and assigning a number past
    // the range simply clamps to it. Setting both axes is cheaper than
    // branching: each face has one live axis and the other is a no-op.
    const listEl = ref(null)
    const scrollToNewest = () => {
      const el = listEl.value
      if (!el) return
      el.scrollTop = el.scrollHeight
      el.scrollLeft = -el.scrollWidth
    }
    watch(
      () => pins.value.length,
      () => { nextTick(scrollToNewest) },
      { immediate: true }
    )

    // ONE scroller across both presentations, and the morph is an AXIS
    // ROTATION (the stack's own law since 2026-08-30): expanded scrolls
    // vertically, parked horizontally — in the negative coordinate, so the
    // ratio is taken on magnitudes. Read the OLD face's axis pre-flush (the
    // watcher runs before the DOM patches) and apply the ratio to the NEW
    // face's axis after.
    watch(
      () => win.value.minimized,
      (parked) => {
        const el = listEl.value
        if (!el) return
        const oldMax = parked
          ? el.scrollHeight - el.clientHeight // was expanded: vertical
          : el.scrollWidth - el.clientWidth //  was parked:   horizontal
        const oldPos = parked ? el.scrollTop : Math.abs(el.scrollLeft)
        const ratio = oldMax > 0 ? oldPos / oldMax : 1
        nextTick(() => {
          const t = listEl.value
          if (!t) return
          if (parked) t.scrollLeft = -(ratio * (t.scrollWidth - t.clientWidth))
          else t.scrollTop = ratio * (t.scrollHeight - t.clientHeight)
        })
      }
    )

    // target_ref is '<kind>/<hash>' — the prefix picks the kind metadata.
    const kindOf = (p) => kindFor((p.target_ref || '').split('/')[0])
    // Kind key handed to SidePanelItem (it resolves icon/color itself);
    // falls back to the SQL target_type when the ref is missing.
    const kindKeyOf = (p) => (p.target_ref || '').split('/')[0] || p.target_type

    // ── "Am I looking at a pinned element right now?" ────────────
    // The current viewer's pin target, derived from the route once (same shape
    // the nav-bar tack computes). Reactive to route changes; no request.
    const currentTarget = computed(() => {
      const m = route.path.match(/^\/(nodes|posts|labels|skeletons)\/(\d+)/)
      if (!m) return null
      let type = m[1].slice(0, -1) // nodes→node, posts→post, …
      if (type === 'post') type = 'skeleton' // posts ARE skeletons (pins store the skeleton)
      return { targetType: type, targetId: parseInt(m[2]) }
    })
    // Cheap O(pins) match against the already-loaded rows — drives each item's
    // "you are here" state in both faces, no extra API call.
    const isCurrent = (p) => {
      const t = currentTarget.value
      return !!(t && p.target_type === t.targetType && Number(p.target_id) === t.targetId)
    }

    // ── The TACK (in the bar until 2026-08-02, in the column's rebuilt bar
    // row until 2026-09-02, in the expanded header since) ─────────
    // Everything it needs is already here, so it costs NO request:
    // `currentTarget` is the same route parse the bar does, and the pinned
    // state is an O(pins) match against the rows this widget already holds.
    const pinnable = computed(() => !!currentTarget.value)
    const isCurrentPinned = computed(() => pins.value.some(isCurrent))

    const onTack = async () => {
      const t = currentTarget.value
      if (!t) return
      try {
        if (isCurrentPinned.value) await pinService.unpin(t.targetType, t.targetId)
        else await pinService.pin(t.targetType, t.targetId)
        await load()
        // The bar still carries a fallback tack (mobile) whose count rides on
        // this signal, and MainLayout routes it back down as `refreshKey`.
        emit('changed')
      } catch (_) { /* ignore — surface via tooltip later */ }
    }

    // The element's real viewer route: summary route when resolved (a pinned
    // post's target_type is 'skeleton', but its summary routes to /posts/:id),
    // kind route as fallback.
    const routeOf = (p) =>
      summaries[p.target_ref]?.route ||
      (p.target_id ? kindFor(p.target_type).route?.(p.target_id) : null)

    // Opens the pinned element's viewer. Expanded rows also park the widget so
    // the destination lands in full view (the list stays one hover away);
    // parked tiles keep the presentation as-is. A parked tile with no
    // resolvable route expands the panel instead, so the row face can show
    // what it is.
    const openPin = (p) => {
      const target = routeOf(p)
      if (!target) {
        if (win.value.minimized) windows.restorePanel('pins')
        return
      }
      router.push(target)
      if (!win.value.minimized) windows.minimizePanel('pins')
    }

    // Hover-driven presentation (2026-07-24): resting the pointer on the
    // parked strip expands the panel after a short intent delay (so a
    // pointer crossing the bar doesn't pop it open), and leaving parks it
    // back. The head glyph keeps its tap for touch screens.
    let hoverTimer = null
    const onHoverEnter = () => {
      if (!win.value.minimized) return
      hoverTimer = setTimeout(() => { windows.restorePanel('pins') }, 150)
    }
    const onHoverLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }
      if (!win.value.minimized) windows.minimizePanel('pins')
    }

    const railTitle = (p) =>
      summaries[p.target_ref]?.primary || `${kindOf(p).kind} · pinned ${fmtTimeAgo(p.pinned_at)}`

    const onUnpin = async (p) => {
      if (!p.target_type || !p.target_id) return
      await pinService.unpin(p.target_type, p.target_id)
      await load()
      emit('changed')
    }

    // Copies the inline reference form ('[[pathos:<kind>/<hash>]]') so the
    // user can paste it straight into a maker body and get a live chip.
    const onCopy = async (p) => {
      if (!p.target_ref) return
      try {
        await navigator.clipboard.writeText(`[[pathos:${p.target_ref}]]`)
      } catch (_) { /* clipboard blocked — silently ignore for now */ }
      copiedId.value = p.pin_link_id
      if (copyResetTimer) clearTimeout(copyResetTimer)
      copyResetTimer = setTimeout(() => { copiedId.value = null }, 1400)
    }

    // History control in the info box (2026-07-24, 8th pass; destination
    // landed 2026-07-31, Thread H): the clock opens the user's PINS skeleton
    // viewer — unpin splices keep their pairs on the spine, so that element
    // IS the pinned list's own history.
    const onHistory = async () => {
      try {
        const r = await pinService.skeleton()
        if (r.success && r.skeleton?.id) router.push(`/skeletons/${r.skeleton.id}`)
      } catch (_) { /* leave the pins as is */ }
    }

    // The widget stands inside the footer bar's right run (2026-09-02): 3120
    // clears the bar's own 3110 and every dock under it, and stays under the
    // stack strip's 3130 at the other end — the two never overlap, so the
    // order between them is moot. (3120 was the number it took on 2026-08-02
    // to lie over the bar's right end as a column; nothing changed.)
    const EDGE_Z = 3120

    return { win, windows, pins, listPins, summaries, loading, copiedId, listEl, kindKeyOf, hashOf, isCurrent, openPin, onHoverEnter, onHoverLeave, railTitle, onUnpin, onCopy, onHistory, pinnable, isCurrentPinned, onTack, EDGE_Z }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar and head glyph come from the shared .dock-window /
// .dock-side-head styles in src/css/_components.scss — only the pins
// widget's own dimensions and list styling live here, and since 2026-09-02
// they are STACKPANEL'S, REFLECTED (user ask: "the same style as the stack
// bar … the extended version … copy the style that the stack bar already
// has"). Read StackPanel.vue's style block for the arguments behind each
// number; this file states only where the mirror differs: `right` for
// `left`, `row-reverse` for `row`, the lane's LEFT end rounded, the cast
// thrown leftward, the head glyph at the left. The right-edge column's own
// styles (2026-07-24 → 09-02: the `--dock-rail-w` parked column, the
// `.pins-footer` rebuilt bar row around the tack, the top-left free corner)
// are in git.
.pins-window {
  // The mirror seat: INSIDE the footer bar, `right: var(--nav-dash-w)` —
  // BESIDE the dashboard block at the bar's right end (never covered, as
  // the stack strip never covers the identity section at `left:
  // var(--nav-id-w)`). The expanded panel rises from the same seat; the
  // header at its bottom IS this widget's bar row.
  top: auto;
  bottom: 0;
  left: auto;
  right: var(--nav-dash-w);
  border-bottom: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  // ONE WIDTH, BOTH FACES — `--stack-w`, the stack's own dial (the two
  // strips and the two panels are one number apart from nothing). Expanded
  // shrink-fits vertically up to the stack's cap; the last --nav-footer-h is
  // bar chrome the widget lies over, not space taken from the list.
  &:not(.is-parked) {
    width: var(--stack-w);
    max-width: 96vw;
    height: auto;
    bottom: 0;
    max-height: calc(var(--dock-stack-h) + var(--nav-footer-h));
    background: var(--plaque-coat);
    // Rims on the three exposed edges (the floor stays bare), BOTH top
    // corners rounded; the shared shell's `overflow: hidden` clips the top
    // band into the curve. Shadow rises plus a LEFT-edge cast — the stack's
    // rightward `5px 0 12px` with its x-offset sign flipped, which is
    // `--shadow-side-edge` itself: the token this widget wore as a column.
    border-top: 1px solid var(--grey-6);
    border-right: 1px solid var(--grey-6);
    border-left: 1px solid var(--grey-6);
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    border-bottom-left-radius: 0;
    box-shadow:
      0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
      -5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
  }

    // THE COAT'S NEGATIVE (2026-09-03, user ask: "invert the color palette
    // for the stack bar and the pin bar inside the frieze bar so they look
    // darker … a dark gray as main background and the light-cream as main
    // contrasting color"): the parked strip alone leaves `--plaque-coat` for
    // the `--strip-*` dials (_tokens.scss § THE FOOTER STRIPS' NIGHT COAT) —
    // grey-8 plaque, grey-9 lane under a grey-7 rim, light-cream head glyph
    // and tile faces. The verticals stay the band's grey-5: the trail's frame
    // law, unchanged. The expanded panel above keeps the coat.
  &.is-parked {
    // INSIDE THE TRAIL: the band's interior (`--nav-chip-h`, one row in from
    // each of its rules), the bar's odd-parity centring formula mirrored for
    // `bottom`, the bar's own coat, the trail chips' grey-5 rim on the
    // VERTICALS ONLY (the band's rules are the strip's top and bottom
    // edges), no radius, no cast — StackPanel's `.is-parked`, to the pixel.
    // ROW-REVERSE is the one line that differs: the DOM's last child (the
    // head glyph) stands at the LEFT END and the lane fills rightward from
    // it, so the two strips reflect each other across the bar.
    flex-direction: row-reverse;
    align-items: center;
    height: var(--nav-chip-h);
    bottom: calc((var(--nav-bar-h) - 1px - var(--nav-chip-h)) / 2);
    width: var(--pins-strip-w); // three pills + glyph (2026-09-03; --stack-w until then)
    // The guard the stack's 48vw cap is, mirrored: never into the docks'
    // left half — moot at `--stack-w` 240px, stated for the day the dial
    // moves.
    max-width: calc(48vw - var(--nav-dash-w));
    background: var(--strip-coat);
    border: 1px solid var(--grey-5, #bdbdbd);
    border-top-width: 0;
    border-bottom-width: 0;
    border-radius: 0;
    box-shadow: none;
  }
}

// Header bar at the BOTTOM of the expanded panel, sharing the plaque with no
// top or bottom line so it merges into the list body above it (the stack's
// own header rule).
.pins-window .dock-bar {
  background: var(--plaque-coat);
  border-top: none;
  border-bottom: none;
  gap: 6px;
}

// Parked head glyph at the strip's LEFT END (the DOM's last flex child under
// `row-reverse`), riding the band at its full height — the stack's 20px
// seat, the shared .dock-side-head's --dock-bar-h box overridden (a 30px box
// cannot stand inside a 19px strip).
.pins-side-head {
  margin: 0;
  align-self: stretch;
  width: 20px;
  height: 100%;
  color: var(--strip-ink); // the head glyph on the dark strip (2026-09-03)
}

// THE THREE TILES — the stack's: each parked pin is SidePanelItem's rail
// face, the glyph alone, in a seat exactly a third of the lane's content box
// (gaps paid first; 70px at `--stack-w` 240). More than three pins scroll
// the lane, newest first from the left.
// THREE PILLS (2026-09-03, user ask: "less wide, almost circular … making sure
// the icon looks good, even if it is smaller … up to three under its
// constrained space"): each parked pin is a `--strip-tile-w` 20×17 capsule —
// `border-radius` 999px on a 17px-tall face reads as a circle a hair wide —
// around a 12px glyph (`rail-icon-size`, the template). Three of them + the
// two 2px gaps ARE the lane's 64px content box at `--pins-strip-w`; every
// pin past the third still scrolls in (row-reverse, the newest by the glyph).
// A third of the lane each (70px at `--stack-w`) until this ask.
.pins-list.is-parked :deep(.side-item__btn--rail) {
  flex: 0 0 var(--strip-tile-w);
  width: var(--strip-tile-w);
  min-width: var(--strip-tile-w);
  border-radius: 999px;
}

// ── THE BANDS ARE THE FLYOUT'S (2026-09-02) — StackPanel's `.stack-frieze`
// rule verbatim: `FriezeBar slim` with `ElementFlyout.vue`'s two paint dials
// and NOTHING ELSE — no scoped height (slim's own `calc(--frieze-h / 2)` is
// the flyout's box), no fixed fit, the carve on, no `flip` (the flip was
// minted for THIS widget's right-edge days; it stands on the bar now, where
// the un-flipped bands stood). `.pins-frieze` LEFT the side-chrome rule in
// `_components.scss` for it (the drawer's alone now).
// ⚠ DO NOT RESTATE `height:` HERE — a host-side height with a full
// `--frieze-h` fallback defeats `slim` (specs/gotchas.md, 2026-09-02).
.pins-frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-8, #616161);
  --frieze-bar-wave-two: var(--brown-1, #efebe9);
}

// ── THE TACK, in the header (2026-09-02) ───────────────────
// The seat is a plain inline box so its `@click.stop` (template) keeps a
// tap on a DISABLED pill from falling through to the bar underneath, which
// would park the widget.
.pins-tack-seat {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

// The pill: NodeMini's ROUND PILL on the pin button (2026-08-22, user ask),
// its skin unchanged by the move — `--grey-3` fill, a `--grey-5` hairline
// RING outside the box and SEAM inside its bottom edge, a 2px `--red-13`
// BASE curving along the bottom arc, `--grey-8` ink with the glyph's
// hairline stroke. PINNED closes that base into a full 2px ring and hands
// the pushpin the same red; hover lifts the pale face to `--grey-1` and
// never borrows the base's colour. 22px here (24 in the bar's slot): the
// header is a 30px row and the pill wants air above and below its ring.
// This block and NavigationBar's `.tack-btn` are kept identical BY HAND but
// for the diameter — one of the two stands at a time (the bar's on mobile).
.pins-window .tack-btn {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  padding: 0;
  border-radius: 50%;
  background: var(--grey-3, #eeeeee);
  border: 0;
  border-bottom: 2px solid var(--red-13, #ff1744);
  box-shadow:
    0 0 0 1px var(--grey-5, #bdbdbd),
    inset 0 -1px 0 var(--grey-5, #bdbdbd);
  color: var(--grey-8, #616161);

  .q-icon {
    color: var(--grey-8, #616161);
    -webkit-text-stroke: 0.35px currentColor;
    transition: transform 0.14s ease;
  }

  &:hover:not(.q-btn--disable) { background: var(--grey-1, #fafafa); }

  &.is-pinned {
    border: 2px solid var(--red-13, #ff1744);
    box-shadow: none;
    color: var(--red-13, #ff1744);

    .q-icon { color: var(--red-13, #ff1744); }
    .q-icon.tack-filled { transform: rotate(-22deg); }

    &:hover { background: var(--grey-1, #fafafa); }
  }

  &.q-btn--disable { opacity: 0.45; }
}

.pins-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.pins-empty {
  padding: 40px 24px;
  text-align: center;
  color: var(--ink-soft);

  .pins-empty-icon  { opacity: 0.25; color: var(--ink); }
  .pins-empty-title { margin-top: 10px; font-size: 0.95em; color: var(--ink); }
  .pins-empty-hint  { margin-top: 6px; font-size: 0.78em; line-height: 1.4; }
}

// The list — StackPanel's `.stack-list` reflected. Expanded: the inset
// `--grey-4` well under a `--grey-6` rim, 8px of reveal all round (it meets a
// band above AND below now — the two-band bracket the stack has), a flex
// column with the shared gap, the one scroller. Parked: the SAME scroller
// rotated onto the x axis and REVERSED.
.pins-list {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 8px 6px;
  padding: 4px 6px;
  background: var(--grey-4);
  border: 1px solid var(--grey-6);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--side-item-gap);
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: var(--grey-4); border-radius: 999px; }
  &::-webkit-scrollbar-thumb { background: var(--grey-6); border-radius: 999px; }

  // Parked face: the stack's lane, reflected — full-bleed `--grey-4` under
  // its `--grey-6` rim, zero margin, the 1px horizontal pad that pays for the
  // rim (17px tiles on the same pixel as the stack's), `flex: 1 1 auto` to
  // fill the fixed strip up to the head glyph, `row-reverse` so the newest
  // pin (DOM-last) lands at the LEFT beside the glyph and older ones flow
  // right and scroll off, and the LEFT end alone rounded — 7px curving into
  // the coat before the glyph, the right edge square against the strip's
  // own edge (the stack rounds its right end; same radius, other side).
  &.is-parked {
    --side-item-face: var(--strip-ink); // the tiles' cream face (2026-09-03)
    --side-item-h: 17px;
    --side-item-gap: 2px;
    flex-direction: row-reverse;
    align-items: center;
    align-self: stretch;
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0 1px;
    background: var(--strip-well);
    border: 1px solid var(--strip-rule);
    border-radius: 7px 0 0 7px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
}

// The copy/unpin micro-buttons ride the fused item's actions slot (compiled in
// this scope, so these styles still apply). Collapsed out of the row until it
// is hovered so the informative block keeps the width for its title (the
// just-copied checkmark stays put while its confirmation shows).
.pin-copy,
.pin-unpin {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.1s, color 0.1s, transform 0.1s;
}
.side-item:hover .pin-copy,
.side-item:hover .pin-unpin,
.pin-copy.is-copied { display: inline-flex; }

.pin-copy:hover {
  background: rgba(var(--ink-rgb), 0.12);
  color: var(--ink);
}
.pin-copy.is-copied {
  background: rgba(33, 186, 69, 0.18);
  color: #1a8a3a;
  transform: scale(1.08);
}

.pin-unpin:hover {
  background: rgba(193, 0, 21, 0.12);
  color: #b30418;
}
</style>
