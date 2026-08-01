<template>
  <!-- The pinned list as a docked right side panel that RISES from the nav bar
       and grows upward toward the middle (mirror of the navigation stack, which
       hangs from below the frieze). One mirrored FriezeBar band sits INSIDE it,
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
    <FriezeBar class="pins-frieze" />

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

    // The widget sits just ABOVE the nav footer (bottom: --nav-footer-h),
    // seamed to it; z 3100 keeps it above the footer/minitab chrome.
    const EDGE_Z = 3100

    return { win, windows, pins, listPins, summaries, loading, copiedId, listEl, kindKeyOf, hashOf, isCurrent, openPin, onHoverEnter, onHoverLeave, railTitle, onUnpin, onCopy, onHistory, EDGE_Z }
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
// the page) edges wear a thin classic 1px brown-4 border; the bottom (flush
// with the bar) and the right (screen edge) meet bare. Rounded top-left corner
// kept (free corner).
.pins-drawer {
  top: auto;
  bottom: var(--nav-footer-h);
  right: 0;
  max-height: var(--dock-pins-h);
  border-top: 1px solid var(--brown-4);
  border-right: none;
  border-bottom: none;
  border-left: 1px solid var(--brown-4);
  border-top-left-radius: var(--radius-lg);
  border-bottom-left-radius: 0;
  // Flat brown-1 plaque — one clean color, no sheen gradients, both
  // presentations. Opaque — no backdrop blur. Shadow drops upward (the widget
  // rises from the bottom) PLUS the shared left-edge cast
  // (`--shadow-side-edge`, 2026-07-24) that the stack widget and the nav bar's
  // pin-tack slot also wear — the right-edge column lies on top of the page as
  // one raised strip, in BOTH presentations (this rule is state-agnostic).
  background: var(--brown-1);
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

// Header bar lives at the TOP of the expanded panel; shares the panel's flat
// brown-1 coat with NO bottom border or hairline so it merges seamlessly into
// the list body below (one uniform brown-1 plaque).
.pins-drawer .dock-bar {
  background: var(--brown-1);
  border-top: none;
  border-bottom: none;
}

// Icon + title ink comes from the shared `.dock-bar--park` rule (--brown-8,
// 2026-07-24 8th pass) — the old coral tint on this glyph is gone, the info
// box reads as one consistent piece of chrome.

// Parked head glyph sits at the top, exactly where the header goes when
// expanded and exactly as tall as it (--dock-bar-h, shared chrome) — no extra
// margin, or the list box below it would shift between presentations.
.pins-side-head { margin: 0; }

// The frieze band under the header / pin glyph must keep its full height in
// the flex column (the list below it is the shrinking scroller). Same box as
// the stack's inner band — plain --frieze-h, no brown-3 lip: neither of them
// stands in for the crown strip, so the pair reads identically across the two
// widgets.
.pins-frieze {
  flex-shrink: 0;
  height: var(--frieze-h);
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
  // Inset scroll well: a margin all around keeps a brown-1 reveal of the
  // plaque, and the rounded corners keep the well's edges soft — the
  // border-radius also clips the scrolling rows, so nothing pokes out square.
  // Floor is **brown-2** (2026-07-24 — back a step lighter, so the well reads
  // as a soft recess under the brown-1 plaque rather than a dark trough) and
  // the rim **brown-4**, in BOTH presentations; the rim matches the widget's
  // own outer border. The rows themselves are SidePanelItems.
  // The well's TOP now meets a frieze band, so that edge gets the wider **8px**
  // reveal the stack uses against its own bands (2026-07-24 — it was 3px when a
  // bare header sat there): a carved wave band needs more air than a flat
  // plaque edge. The bottom keeps 6px — it meets the widget's own edge on the
  // nav bar, not a band. Whatever the numbers, they must be the SAME in BOTH
  // faces, since an asymmetric margin would move the list box between
  // presentations and break the in-place unravel once the pins overflow the cap.
  margin: 8px 6px 6px;
  padding: 4px 6px;
  background: var(--brown-2);
  border: 1px solid var(--brown-4);
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
  // Track matches the (now brown-2) well floor so only the thumb reads; the
  // thumb keeps brown-4, the same ink as the well's rim.
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: var(--brown-2); border-radius: 999px; }
  &::-webkit-scrollbar-thumb { background: var(--brown-4); border-radius: 999px; }

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
