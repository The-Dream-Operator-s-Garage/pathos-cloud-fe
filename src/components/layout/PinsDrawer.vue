<template>
  <!-- The pinned list as a docked right side panel that RISES from the nav bar
       and grows upward toward the middle (it mirrored the navigation stack
       across the right edge until 2026-08-30, when the stack moved into the
       footer bar's left run — this column is the right edge's only widget
       now). One mirrored FriezeBar band sits INSIDE it,
       between the header / pin glyph and the scroll well — the same divider
       block the drawer uses between sections, mirroring the band the stack
       carries between its own well and header. Its old bottom-edge band
       (dividing the list from the footer) was removed 2026-07-24: the pinned
       column and the tack in the bar below read as ONE strip, so nothing cuts
       across it there. ONE element with two presentations (2026-07-24,
       third pass): expanded = the 300px panel, parked (win.minimized) = the
       SAME element narrowed to the thin icon column (`is-parked`), each pin
       collapsed to its icon face. The list below is the ONE and only scroller
       — it persists through the park/expand morph, so the scroll position
       carries across (there is no separate rail tree anymore). The header sits
       at the TOP (traffic light at the corner, icon to its right) — parked, the
       tiny head glyph takes its spot — and the list stacks below it ordered
       OLDEST→NEWEST, the newest pin at the bottom nearest the tack. Capped at
       --dock-pins-h (30% of the shared side band) so the two side widgets
       never collide. -->
  <aside
    v-if="win.open"
    class="pins-drawer dock-window"
    :class="{ 'is-parked': win.minimized }"
    :style="{ zIndex: EDGE_Z }"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
  >
    <!-- The traffic light is gone (2026-07-24, 7th pass) — the header bar
         ITSELF parks the widget, which is only a touch-screen affordance
         anyway (hover already parks it on the way out). Minimize-only: the
         pins panel has no nav-bar button and docks as a permanent fixture
         right above the tack, so it parks to the icon column instead of
         closing (a full close would strand it). -->
    <header v-if="!win.minimized" class="dock-bar dock-bar--park"
      title="Park to the icon column" @click="windows.minimizePanel('pins')">
      <q-icon name="push_pin" size="14px" class="dock-bar__icon dock-bar__icon--pins" />
      <span class="dock-bar__title nasalization">Pinned</span>
      <q-space />
      <span class="dock-bar__meta mono">
        {{ pins.length }} pin{{ pins.length === 1 ? '' : 's' }}
      </span>
      <!-- History control at the very right end of the info box: the clock
           glyph standing for "the pinned list's own history". Stops the click
           from reaching the bar (which parks the widget). -->
      <button type="button" class="dock-bar__action" @click.stop="onHistory">
        <q-icon name="history" size="15px" />
        <q-tooltip anchor="top middle" self="bottom middle">Pinned list history</q-tooltip>
      </button>
    </header>

    <!-- Parked replacement for the header: the tiny head glyph at the same
         TOP spot. Hovering anywhere on the column expands the panel; the
         tap stays for touch screens, where hover doesn't exist. -->
    <button v-else type="button" class="dock-side-head pins-side-head"
      @click="windows.restorePanel('pins')">
      <q-icon name="push_pin" size="20px" />
    </button>

    <!-- The widget's ONE mirrored FriezeBar band (2026-07-24): it sits INSIDE,
         between the header / pin glyph above and the scroll well below — the
         mirror of the band the stack carries between its well and its own
         header. The band that used to divide the well from the nav footer at
         the widget's bottom edge is GONE: the pinned column and the tack in
         the bar below read as one continuous strip, so nothing should cut
         across it there. Both presentations. -->
    <FriezeBar flip class="pins-frieze" />

    <div v-if="loading && !win.minimized" class="pins-loading">
      <q-spinner color="red-6" size="22px" />
    </div>

    <div v-else-if="pins.length === 0 && !win.minimized" class="pins-empty">
      <q-icon name="push_pin" size="40px" class="pins-empty-icon" />
      <div class="pins-empty-title">No pins yet</div>
      <div class="pins-empty-hint">Open a node, post, label, or skeleton and tap the tack to pin it here.</div>
    </div>

    <div v-else ref="listEl" class="pins-list" :class="{ 'is-parked': win.minimized }">
      <!-- Each pin is the one mutating side-bar item (SidePanelItem):
           expanded face = micro chip · title · pinned-x-ago · author, the
           kind button palette-inverted on the right, copy/unpin riding the
           actions slot; parked face = the flat kind-colored icon chip. The
           pin you are currently VIEWING wraps in the kind-colored bubble
           (expanded) / inverts to a solid fill (parked). Activating opens
           the element's viewer; an expanded row also parks the panel so the
           destination lands in full view. -->
      <SidePanelItem
        v-for="p in listPins"
        :key="p.pin_link_id"
        :collapsed="win.minimized"
        :kind="kindKeyOf(p)"
        :hash="hashOf(p.target_ref)"
        :title="summaries[p.target_ref]?.primary || ''"
        :time="p.pinned_at"
        :author="summaries[p.target_ref]?.author?.username || null"
        :current="isCurrent(p)"
        :tooltip="railTitle(p)"
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

    <!-- ── THE TACK LIVES HERE NOW (2026-08-02, user ask: "make sure the pin
         button is contained inside [the pinned side bar], and that the
         sidebar is on top of the footer"). The column runs to the WINDOW
         FLOOR and lies over the nav bar, so its last `--nav-bar-h` IS the
         bar's row — and this block rebuilds that row inside the widget,
         exactly as the left drawer's `.drawer-footer` rebuilds it around the
         burger: the shared `--plaque-coat`, a `--grey-6` `border-top` landing
         on the same pixel as the bar's own, and the 41px grey-6 rail slot +
         1px hairline at the end that faces the page, holding the inverted
         grey chip (all four were browns until 2026-08-18's palette ask). The
         two mirror each other across the window — the drawer's slot sits at
         its LEFT end, this one at its RIGHT, both flush to their screen edge.
         The bar keeps a tack of its own for the one case this column is
         absent (mobile, where both side widgets hide) — see NavigationBar. -->
    <div class="pins-footer">
      <div class="pins-footer-hairline" />
      <div class="tack-slot">
        <q-btn
          round unelevated no-caps
          class="tack-btn"
          :class="{ 'is-pinned': isCurrentPinned }"
          :disable="!pinnable"
          @click="onTack"
        >
          <q-icon name="push_pin" size="12px" :class="{ 'tack-filled': isCurrentPinned }" />
          <q-tooltip>{{ pinnable ? (isCurrentPinned ? 'Unpin this' : 'Pin this') : 'Open a node, post, label or skeleton to pin it' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- The floor band that closed this column is gone (2026-08-12, user
         ask): it only existed to continue the nav bar's own band across the
         pixels this column owns past the footer, and the band itself left
         with the crown strip. The rebuilt bar ROW above stays — the widget
         still owns the bar's right end down to the window floor. -->
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
    // Bumped by the parent when pins mutate elsewhere (the nav bar's tack)
    // so the widget stays in sync.
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
    // ordering never rides on the API's response order. This widget rises from
    // the nav bar and grows upward, so BOTH presentations render this order
    // top→bottom: the NEWEST pin lands at the BOTTOM nearest the bar (and the
    // tack right below it), older ones trailing UP toward the middle gap.
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

    // Bottom-anchored list: pin the scroll to the bottom (newest) whenever the
    // pins change, so the latest pin shows first even when the list overflows
    // the half-height cap.
    const listEl = ref(null)
    const scrollToNewest = () => {
      const el = listEl.value
      if (el) el.scrollTop = el.scrollHeight
    }
    watch(
      () => pins.value.length,
      () => { nextTick(scrollToNewest) },
      { immediate: true }
    )

    // ONE scroller across both presentations: the park/expand morph swaps the
    // item faces (different heights), so carry the relative scroll position —
    // not the raw pixel offset — through the flip.
    watch(
      () => win.value.minimized,
      () => {
        const el = listEl.value
        if (!el) return
        const max = el.scrollHeight - el.clientHeight
        const ratio = max > 0 ? el.scrollTop / max : 1
        nextTick(() => {
          const target = listEl.value
          if (target) target.scrollTop = ratio * (target.scrollHeight - target.clientHeight)
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

    // ── The TACK, moved in from the nav bar (2026-08-02) ─────────
    // Everything it needs is already here, so the move cost NO new request:
    // `currentTarget` is the same route parse the bar did, and the pinned
    // state is an O(pins) match against the rows this widget already holds —
    // where the bar had to ask `GET /pins/check` on every route change.
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
    // the destination lands in full view (the list stays one tap away); parked
    // chips keep the presentation as-is. A parked chip with no resolvable
    // route expands the panel instead, so the row face can show what it is.
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
    // parked column expands the panel after a short intent delay (so a
    // pointer flung at the screen edge doesn't pop it open), and leaving
    // parks it back. The head glyph / amber dot keep their taps for touch
    // screens, where hover doesn't exist.
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

    // The widget runs to the WINDOW FLOOR and lies OVER the nav bar since
    // 2026-08-02 (it stopped at the bar's top edge before), so it has to
    // outrank that bar — which went topmost at 3110 the same week. 3120 is the
    // left drawer's own number, the other column that deliberately covers the
    // bar's end; the two never overlap, so they can share it.
    const EDGE_Z = 3120

    return { win, windows, pins, listPins, summaries, loading, copiedId, listEl, kindKeyOf, hashOf, isCurrent, openPin, onHoverEnter, onHoverLeave, railTitle, onUnpin, onCopy, onHistory, pinnable, isCurrentPinned, onTack, EDGE_Z }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and head glyph come from the shared
// .dock-window / .dock-side-head styles in src/css/_components.scss —
// only the drawer's own dimensions and list styling live here.
//
// Anchored to sit directly ON TOP of the nav bar (bottom: --nav-footer-h) so
// the pinned list and the nav bar's pin tack read as one blended right-edge
// column. ONE element with two presentations (2026-07-24, third pass):
// `.is-parked` narrows it to the icon column (--dock-rail-w); both grow UP to
// at most `--dock-pins-h` (27vh — the pinned set's 30% share of the 90vh side
// band, against the stack's 70%) and shrink to fit when there are only a few
// pins. The shared .dock-window width transition animates the
// morph. Only the top (leading edge toward the middle gap) and left (toward
// the page) edges wear a thin classic 1px `--grey-6` border; the bottom (flush
// with the bar) and the right (screen edge) meet bare. Rounded top-left corner
// kept (free corner).
// ── AND SINCE 2026-08-02 IT RUNS TO THE WINDOW FLOOR (user ask) ──
// `bottom: 0`, not the bar's top edge: the column lies OVER the nav bar's
// right end and its last `--nav-footer-h` IS that bar's chrome, rebuilt inside
// the widget by `.pins-footer` (the row, around the tack — the
// `.pins-floor-frieze` band under it left with the crown strip). This is the exact
// arrangement the left drawer took the same day — two columns bounding the
// window, each owning the strip of bar under it. The cap grows by the same
// token so the LIST keeps its `--dock-pins-h` share of the side band: the
// footer is chrome the widget gained, not space taken from the pins.
.pins-drawer {
  top: auto;
  bottom: 0;
  right: 0;
  max-height: calc(var(--dock-pins-h) + var(--nav-footer-h));
  // 1px `--grey-6` edges since 2026-08-18's palette ask (brown-4 before) — the
  // trio's rim ink, the same line the stack widget, the frieze bands and the
  // media tabs rail wear.
  border-top: 1px solid var(--grey-6);
  border-right: none;
  border-bottom: none;
  border-left: 1px solid var(--grey-6);
  border-top-left-radius: var(--radius-lg);
  border-bottom-left-radius: 0;
  // The shared `--plaque-coat` since 2026-08-17 (user ask) — a --light-cream
  // sheet under a 30% --grey-3 veil, the same two layers the nav bar, the left
  // drawer and the stack widget took that session, so the window's chrome
  // edges stay ONE material. It was a flat brown-1 plaque before, and the rest
  // of the recipe is unchanged: no sheen gradients, both presentations, opaque
  // (no backdrop blur). Shadow drops upward (the widget rises from the bottom)
  // PLUS the shared left-edge cast (`--shadow-side-edge`, 2026-07-24) that the
  // stack widget and the nav bar's pin-tack slot also wear — the right-edge
  // column lies on top of the page as one raised strip, in BOTH presentations
  // (this rule is state-agnostic). The panel's borders and its inset well
  // JOINED IT in the grey family on 2026-08-18 (user ask) — `--grey-6` rims,
  // `--grey-4` wells, tone-for-tone with the brown-4/brown-2 pair they
  // replace — so the well still reads as a step sunk under the paler coat.
  background: var(--plaque-coat);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow:
    0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
    var(--shadow-side-edge);

  &:not(.is-parked) {
    width: 300px;
    max-width: 96vw;
  }

  &.is-parked {
    width: var(--dock-rail-w);
  }
}

// Header bar lives at the TOP of the expanded panel; shares the panel's
// `--plaque-coat` with NO bottom border or hairline so it merges seamlessly
// into the list body below (one uniform plaque — it followed the panel out of
// brown-1 on 2026-08-17, and has to: a header row is the one place a coat
// mismatch would draw a line where the whole point is that there is none).
.pins-drawer .dock-bar {
  background: var(--plaque-coat);
  border-top: none;
  border-bottom: none;
}

// Icon + title ink comes from the shared `.dock-bar--park` rule (--grey-9,
// 2026-07-24 8th pass) — the old coral tint on this glyph is gone, the info
// box reads as one consistent piece of chrome.

// Parked head glyph sits at the top, exactly where the header goes when
// expanded and exactly as tall as it (--dock-bar-h, shared chrome) — no extra
// margin, or the list box below it would shift between presentations.
.pins-side-head { margin: 0; }

// The frieze band under the header / pin glyph must keep its full height in
// the flex column (the list below it is the shrinking scroller). Same box as
// the stack's inner band — plain `--frieze-bar-h` (0.96 × `--frieze-h` via
// the trio rule since the same sitting's trim walk), no crown lip of its own: neither
// of them stands in for the crown strip, so the pair reads identically across
// the two widgets. Palette: the SIDE CHROME TRIO rule in `_components.scss`
// since 2026-08-17 (user ask) — three paints and nothing else since
// 2026-08-21's from-scratch ask: `--grey-8` plate, `--grey-2` thick wave,
// `--grey-4` other wave, carve and rims off (an orange↔teal gradient weave
// 08-17 → 08-21, then one rimmed grey pass, before it) — shared by name
// with the stack's pair and the drawer's bands. (The nav bar's trail wore these
// same three paints on the window's FLOOR for half of 2026-08-23 and left the
// rule when a later ask gave it its own palette — a `--grey-6` plate under one
// `--light-cream` tone, by way of an inverted cream-plate hour; it keeps the
// fit and the carve-off argument and states its paints itself.)
.pins-frieze {
  flex-shrink: 0;
  height: var(--frieze-bar-h, var(--frieze-h));
}

// ── The widget's own nav-bar row (2026-08-02) ───────────────
// The column reaches the floor now, so its last --nav-footer-h lands exactly
// on the bar underneath. Rather than hide the bar there, this block REBUILDS
// that row inside the widget — the mirror image of MainLayout's
// `.drawer-footer` at the other end of the window: the same `--plaque-coat`
// (both surfaces took it on 2026-08-17, so this block still agrees with the
// widget it lives in AND the bar it stands on), a top lip on the same pixel as
// the bar's `border-top` — `--grey-6`, THE SAME INK as the bar's since the
// palette ask later that day walked this line (the note here had predicted it:
// for a few hours two different inks landed on one pixel) — and
// the same 41px rail block, here at the RIGHT end (flush to the screen
// edge, under the parked column's own body) with its closing hairline facing
// the page. Whatever the widget's width — 42px parked, 300px expanded — the
// bar reads as continuous; the column just owns those pixels.
//
// --nav-bar-h, the ROW. That was a real distinction in the two-band era
// (2026-08-02 → 08-12): the chrome was this row PLUS a --frieze-h floor band
// and the column rebuilt both. The band is gone and --nav-footer-h IS the row
// now, so the two agree; the row is what this block rebuilds either way.
.pins-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;         // the slot hugs the screen edge
  height: var(--nav-bar-h);
  background: var(--plaque-coat);
  // `--grey-6`, the nav bar's own `border-top` ink, since 2026-08-17's palette
  // ask (brown-3 before): the bar's border and this column's rebuild of it land
  // on the same pixel, so they must be the same line.
  border-top: 1px solid var(--grey-6);
  overflow: hidden;                  // clips the hairline in the 42px parked state
}

.pins-footer-hairline {
  flex: 0 0 auto;
  width: 1px;
  background: var(--grey-6);
}

// NavigationBar's `.tack-slot` to the pixel: the column's darker rail coat
// (`--grey-6` since 2026-08-18's palette ask, brown-4 before — this slot KEEPS
// its coat; only the left drawer's twin went transparent, by its own ask),
// --dock-rail-w less the hairline that closes it, the chip floating centred.
.pins-footer .tack-slot {
  flex: 0 0 auto;
  width: calc(var(--dock-rail-w) - 1px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--grey-6);
}

// The chip: NavigationBar's tack, and since 2026-08-22 (user ask) that is
// NodeMini's ROUND PILL — the rounded button with the kind glyph at the top-left
// corner of a node quoted inside a post card, lifted whole onto the pin button
// with its one coloured line swapped from teal to `--red-13`. `--grey-3` fill,
// a `--grey-5` hairline RING outside the box and SEAM inside its bottom edge,
// a 2px red BASE curving along the bottom arc, `--grey-8` ink with the glyph's
// hairline stroke. PINNED closes that base into a full 2px ring and hands the
// pushpin the same red; hover lifts the pale face to `--grey-1` and never
// borrows the base's colour (--teal-12/-13's rule: an object's own mark and the
// pointer's are never the same at once).
//
// It was a flat inverted circle before — grey-9 face + rim, grey-3 pushpin,
// inset top highlight, one step LIGHTER at grey-8 on hover since a dark chip
// lifts, inverting to a grey-3 face with a grey-9 rim while the element you are
// looking at was pinned; brown-8 / brown-1 / brown-7 before 2026-08-18's palette
// ask. Every one of those states spoke in VALUE, which a pale-throughout pill
// cannot, and that is why the pinned state moved onto the mark.
//
// This block and NavigationBar's are kept identical BY HAND — one of the two
// stands at a time (the bar keeps its copy for mobile and for a closed pins
// panel, this one for every arrangement where the column is up), so a drift here
// shows up as the same corner changing skin when a panel opens.
.pins-footer .tack-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
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

  // A pale chip lifts by going PALER — the mirror of the rule the dark chip
  // that stood here used to follow.
  &:hover:not(.q-btn--disable) { background: var(--grey-1, #fafafa); }

  &.is-pinned {
    border: 2px solid var(--red-13, #ff1744);
    box-shadow: none;                // the ring takes the rim's job; no doubling
    color: var(--red-13, #ff1744);

    .q-icon { color: var(--red-13, #ff1744); }
    // 22° rotation to mimic a pushpin pressed in — the bar's own tack tips
    // the same way, since this is that button moved, not a new one.
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

.pins-list {
  // Inset scroll well: a margin all around keeps a reveal of the plaque, and
  // the rounded corners keep the well's edges soft — the border-radius also
  // clips the scrolling rows, so nothing pokes out square.
  // Floor is **grey-4** and the rim **grey-6**, in BOTH presentations; the rim
  // matches the widget's own outer border. (brown-2 / brown-4 until
  // 2026-08-18's palette ask; the floor went a step lighter than the rim on
  // 2026-07-24 so the well reads as a soft recess under the plaque rather than
  // a dark trough, and that step is what the grey pair preserves.)
  // The rows themselves are SidePanelItems.
  // The well's TOP now meets a frieze band, so that edge gets the wider **8px**
  // reveal the stack uses against its own bands (2026-07-24 — it was 3px when a
  // bare header sat there): a carved wave band needs more air than a flat
  // plaque edge. The bottom keeps 6px — it meets the widget's own edge on the
  // nav bar, not a band. Whatever the numbers, they must be the SAME in BOTH
  // faces, since an asymmetric margin would move the list box between
  // presentations and break the in-place unravel once the pins overflow the cap.
  margin: 8px 6px 6px;
  padding: 4px 6px;
  background: var(--grey-4);
  border: 1px solid var(--grey-6);
  border-radius: var(--radius-md);
  overflow-y: auto;
  overflow-x: hidden; // rows ellipsize — never show a horizontal scrollbar
  min-height: 0; // let the list shrink + scroll once the panel hits its cap
  // Flex column in BOTH presentations (never block flow): the shared
  // --side-item-gap must land between every pair of pins identically, and
  // block-flow margins would collapse where flex gaps do not. The vertical
  // padding above/below matches the parked face exactly, so every pin keeps
  // its level through the morph.
  display: flex;
  flex-direction: column;
  gap: var(--side-item-gap);
  // No scrollbar-width/color here: any non-auto value makes Chrome 121+ ignore
  // the ::-webkit-scrollbar-* styling below (square grey thumb, no radius).
  // Track matches the well floor (`--grey-4` since 2026-08-18, brown-2 before)
  // so only the thumb reads; the thumb keeps the well's rim ink, `--grey-6`.
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: var(--grey-4); border-radius: 999px; }
  &::-webkit-scrollbar-thumb { background: var(--grey-6); border-radius: 999px; }

  // Parked face of the SAME scroller: narrowed to the icon column, chips
  // centered, same vertical padding + gap as above so the pins keep their
  // levels, scrollbar hidden (scrollbar-width: none makes Chrome 121+ skip
  // the ::-webkit-scrollbar styling above and hide it too).
  // Side margins tighten to 2px here so the chips sit closer to the column's
  // edges; the vertical margins stay exactly as above.
  &.is-parked {
    margin: 8px 2px 6px;
    padding: 4px 0;
    align-items: center;
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
