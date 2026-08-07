<!--
  FEED HEAD BOX (2026-08-06, user ask) — the public feed's head band, turned
  into a BOX YOU CAN MOVE.

  It was `.feed-stream__head`: a sticky plate at the top of the scrolling well,
  the container showing through the stream. Three things change and the rest of
  its job is unchanged (it is still the surface's one chrome plate, still opaque
  so the cards hide behind it rather than showing through):

    · IT IS GRABBED BY ITS OWN HEADER. The box now opens with a bar — grip
      glyph, centred title — and that bar is the only drag surface, the same
      division of labour every floating window on this platform already makes
      (`.dock-bar`, `MediaViewerWindow`): the header moves the box, the body
      is content and takes its own taps.
    · IT SLIDES UP AND DOWN BETWEEN THE FRIEZE BARS. Vertical only — the box
      spans lip to lip by construction, so there is no horizontal freedom to
      give — clamped so it never passes either end of the container. It left
      the scroller to do that (`position: absolute` against
      `.feed-stream-pane`), which is also what freed it from `sticky`: a
      sticky box is pinned by definition, and this one is placed.
    · ITS CORNERS FLARE INTO THE BARS. All four, through the concave fillets
      the parked-media tabs are cut with (`MediaTabsBar.vue`) — 9px radial
      gradients carrying the rim's own tone along the arc, so one continuous
      `--indigo-4` line runs bar → flare → box edge → flare → bar and the plate
      reads as a piece of the frieze pulled out of it rather than a rectangle
      dropped between the two bars.

  The FIRST HALF of its body is new (same ask): a seat card + a chat box.
  Neither talks to anything yet — the composer is inert on purpose, this is
  the surface being placed before the wiring behind it exists. The seat
  CURRENTLY references claude in the Dream Operator's Garage; "currently" is
  the whole point, so the reference is one constant pair at the top of the
  script rather than a hardcoded entity id (ids differ per install), resolved
  through the platform's own entity search.

  The SECOND HALF is the feed's own controls, handed down through the
  `controls` slot: the stream still owns its trust lens, its label lens and
  its count, exactly as it did when they lived in the band.
-->
<template>
  <section
    ref="rootEl"
    class="feed-head"
    :class="{ 'is-grabbed': dragging }"
    :style="{ top: y + 'px' }"
  >
    <!-- The four fillets. Paint only — see the stylesheet for the geometry. -->
    <span class="feed-head__flare feed-head__flare--tl" aria-hidden="true" />
    <span class="feed-head__flare feed-head__flare--tr" aria-hidden="true" />
    <span class="feed-head__flare feed-head__flare--bl" aria-hidden="true" />
    <span class="feed-head__flare feed-head__flare--br" aria-hidden="true" />

    <!-- THE INNER HEADER — the handle. `tabindex` + the arrow keys are not
         decoration: a box that can only be placed by dragging it cannot be
         placed without a pointer, and the whole affordance would be missing
         on a keyboard. -->
    <header
      class="feed-head__bar"
      tabindex="0"
      role="toolbar"
      aria-label="Feed head — drag, or use the arrow keys, to move it"
      title="Drag me up or down"
      @pointerdown="onBarPointerDown"
      @keydown="onBarKeydown"
    >
      <q-icon name="drag_indicator" size="14px" class="feed-head__grip" />
      <span class="feed-head__title nasalization">Public Feed</span>
    </header>

    <div class="feed-head__body">
      <!-- FIRST HALF — the seat and the chat box. -->
      <div class="feed-head__half feed-head__half--talk">
        <div class="feed-head__seat" :title="seatTitle">
          <EntityAvatar :entity="seatEntity" :size="24" />
          <div class="feed-head__seat-lines">
            <span class="feed-head__seat-name">{{ seat.name }}</span>
            <span class="feed-head__seat-sub">{{ seat.sub }}</span>
          </div>
          <OrgLogoChip v-if="seat.org" :org="seat.org" :size="16" :link="false" />
        </div>

        <!-- The chat box — a surface with nothing behind it yet. Both
             controls are `disabled`, which is the honest way to say so:
             the shape is here, the conversation is not. -->
        <div class="feed-head__chat">
          <div class="feed-head__chat-log">No messages yet.</div>
          <div class="feed-head__chat-compose">
            <input
              class="feed-head__chat-input"
              type="text"
              disabled
              placeholder="Say something…"
              aria-label="Message (not wired up yet)"
            >
            <button
              type="button"
              class="feed-head__chat-send"
              disabled
              title="Not wired up yet"
              aria-label="Send (not wired up yet)"
            >
              <q-icon name="send" size="12px" />
            </button>
          </div>
        </div>
      </div>

      <!-- SECOND HALF — whatever the stream puts there (its lenses). -->
      <div class="feed-head__half feed-head__half--lens">
        <slot name="controls" />
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { refService } from 'src/services/ref.service'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'

// ── Geometry ────────────────────────────────────────────────────────
// FLARE is how far a corner sweep reaches beyond the box — the fillets' R,
// which must match the radius the stylesheet derives its gradients from (it
// went 9 → 11 when the edge was thickened to 2px: a heavier line wants a
// longer arc, or the sweep reads as a blunt notch). EDGE is the daylight the
// box keeps off each end of the container, and has to CLEAR that reach or the
// sweep is cut off by `.feed-container__body`'s `overflow: hidden`. HOME is
// where the box rests before anyone has moved it — the old band sat flush on
// the container's top edge, which is exactly the one position a filleted
// corner cannot have — and the well's `padding-top` restates it, so the two
// move together. STEP is the keyboard nudge.
const FLARE = 11
const EDGE = FLARE + 1
const HOME = EDGE
const STEP = 12

// ── The seat this box currently references ──────────────────────────
// One person, in one organization, named the way a reader would name them
// rather than by id: entity ids are per-install (claude's garage mask is 23
// here and something else on the server), and this box is a placeholder for
// "a user" — so it looks its user up the way the pickers do.
const SEAT_NAME = 'claude'
const SEAT_ORG = /garage|dream operator/i

// The stub the card falls back to, so the box always states WHO it is for
// even with the API unreachable or the seat not seeded.
const SEAT_STUB = { id: null, route: null, name: SEAT_NAME, sub: 'Dream Operator\'s Garage', photo: null, org: null }

// Resolved once per page load: the box is remounted on every visit to /feed
// and the answer cannot change between them. The PROMISE is cached, not the
// value, so two mounts in the same tick share one request.
let seatPromise = null

// A MASK's display name is "<person> @ <org>" — the one string the identity
// card seam exists to take apart. The badge beside it already says the org,
// so the name says the person.
const personOf = (row) => String(row?.primary || '').split(' @ ')[0].trim()

const loadSeat = () => {
  if (seatPromise) return seatPromise
  seatPromise = (async () => {
    try {
      const r = await refService.search('entities', SEAT_NAME, 8)
      const rows = (r && r.results) || []
      // The seat is the MASK — the identity that carries the org. The
      // ROOT person (no org) is what the face and the @handle come from,
      // since a mask has neither: it is the same recomposition
      // `entityProfileService.getIdentityCards` does for the feed.
      const mask = rows.find((x) => x.org && SEAT_ORG.test(`${x.org.name || ''} ${x.org.handle || ''}`))
      const person = rows.find((x) => !x.org) || null
      if (!mask && !person) return SEAT_STUB
      const org = mask ? mask.org : null
      return {
        id: (person || mask).id,
        route: (mask || person).route,
        name: personOf(person || mask) || SEAT_NAME,
        sub: (org && (org.role_title || `@${org.handle}`)) || (person && person.secondary) || '',
        photo: (person && person.photo) || (mask && mask.photo) || null,
        org
      }
    } catch (_) {
      return SEAT_STUB
    }
  })()
  return seatPromise
}

export default defineComponent({
  name: 'FeedHeadBox',
  components: { EntityAvatar, OrgLogoChip },
  props: {
    // Where the box stands, in px from the container's top edge. `null` is
    // "nobody has moved it" — the box resolves that to HOME itself, so the
    // holder above never has to know the resting geometry.
    offset: { type: Number, default: null }
  },
  emits: ['update:offset', 'update:height'],
  setup (props, { emit }) {
    const rootEl = ref(null)
    const y = ref(props.offset == null ? HOME : props.offset)
    const dragging = ref(false)
    const seat = ref(SEAT_STUB)

    // The travel limits, measured rather than assumed: the container is a
    // percentage of a scroll track and the box's own height follows its
    // content, so both ends move with the window.
    const bounds = () => {
      const el = rootEl.value
      const parent = el && el.parentElement
      if (!el || !parent) return { min: EDGE, max: EDGE }
      const max = parent.clientHeight - el.offsetHeight - EDGE
      return { min: EDGE, max: Math.max(EDGE, max) }
    }

    const clamp = (v) => {
      const b = bounds()
      return Math.round(Math.min(Math.max(v, b.min), b.max))
    }

    // Moving is one seam: it clamps, it writes, it reports. The parent hears
    // about it on RELEASE, not per frame — the offset is persisted through
    // the StateHolder up there, and a pointer drag would otherwise write a
    // nav_state row sixty times a second.
    const moveTo = (v) => { y.value = clamp(v) }

    watch(() => props.offset, (v) => {
      if (dragging.value || v == null) return
      y.value = clamp(v)
    })

    // ── The drag. Pointer Events, one gesture at a time, and the same
    // hygiene the media windows keep: capture on the bar so the pointer may
    // outrun it, body userSelect/cursor parked for the gesture and restored
    // after, and one teardown that release, cancel and unmount all reach.
    let pid = null
    let capEl = null
    let originY = 0
    let baseY = 0

    const onMove = (e) => {
      if (e.pointerId !== pid) return
      moveTo(baseY + (e.clientY - originY))
    }

    const teardown = () => {
      if (capEl) {
        capEl.removeEventListener('pointermove', onMove)
        capEl.removeEventListener('pointerup', end)
        capEl.removeEventListener('pointercancel', end)
        try { capEl.releasePointerCapture(pid) } catch (err) { /* pointer already gone */ }
      }
      if (dragging.value) emit('update:offset', y.value)
      capEl = null
      pid = null
      dragging.value = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    function end (e) {
      if (e && pid != null && e.pointerId !== pid) return
      teardown()
    }

    const onBarPointerDown = (e) => {
      if (pid != null) return // one gesture (second touch)
      if (e.button != null && e.button !== 0) return // primary only
      if (e.target.closest('button, input, a')) return
      baseY = y.value
      originY = e.clientY
      pid = e.pointerId
      capEl = e.currentTarget
      try { capEl.setPointerCapture(pid) } catch (err) { /* capture is best-effort */ }
      capEl.addEventListener('pointermove', onMove)
      capEl.addEventListener('pointerup', end)
      capEl.addEventListener('pointercancel', end)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      dragging.value = true
      e.preventDefault()
    }

    const onBarKeydown = (e) => {
      const step = e.key === 'ArrowUp' ? -STEP : e.key === 'ArrowDown' ? STEP : 0
      if (!step) {
        if (e.key !== 'Home' && e.key !== 'End') return
        moveTo(e.key === 'Home' ? HOME : Number.MAX_SAFE_INTEGER)
      } else {
        moveTo(y.value + step)
      }
      emit('update:offset', y.value)
      e.preventDefault()
    }

    // ── Height + re-clamp. The well above reserves this box's home slot, so
    // its height is published upward; the same observer keeps a restored (or
    // simply stale) position legal when the window or the content changes
    // shape under it.
    let ro = null
    const remeasure = () => {
      const el = rootEl.value
      if (!el) return
      emit('update:height', el.offsetHeight)
      const c = clamp(y.value)
      if (c !== y.value) y.value = c
    }

    onMounted(() => {
      remeasure()
      loadSeat().then((s) => { seat.value = s })
      if (typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(remeasure)
      ro.observe(rootEl.value)
      if (rootEl.value.parentElement) ro.observe(rootEl.value.parentElement)
    })

    onBeforeUnmount(() => {
      if (ro) ro.disconnect()
      ro = null
      teardown()
    })

    // EntityAvatar takes whatever the caller already resolved, so the face
    // costs no second request.
    const seatEntity = computed(() => ({
      id: seat.value.id,
      display_name: seat.value.name,
      photo: seat.value.photo
    }))

    const seatTitle = computed(() =>
      seat.value.org ? `${seat.value.name} · ${seat.value.org.name}` : seat.value.name)

    return {
      rootEl,
      y,
      dragging,
      seat,
      seatEntity,
      seatTitle,
      onBarPointerDown,
      onBarKeydown
    }
  }
})
</script>

<style lang="scss" scoped>
// ── THE BOX ─────────────────────────────────────────────────────────
// Absolute against `.feed-stream-pane` (which is the container's field
// between the two frieze bars), spanning it lip to lip: `left/right: 0` is
// what the old band's `margin: 0 -3px` had to buy by hand, the well's side
// padding being no longer in the way now that the box is out of the well.
//
// ITS FACE IS THE PLATE'S — `--grey-4` (2026-08-06, second ask of the day; it
// spent the first ask on the post card's `--grey-3`). Which puts the box back
// on the tone the band wore, and the reasoning that took it off — *a thing you
// can pick up cannot be the same material as the plate it moves over* — is
// answered a better way here: the box is separated by DEPTH now, not by tone.
// A heavier edge and a shadow say "this is above the plate"; a lighter coat
// only said "this is a different plate". The gain is at the CORNERS, which is
// what the fillets are for: face and plate being one tone, the carved quarter
// and the filled quarter are indistinguishable and only the swept LINE states
// the shape — the box does not so much sit between the frieze bars as flow out
// of them, which a `--grey-3` patch could never do.
//
// TWO edges, not four. The box touches a frieze bar on either side, so its
// sides have no line to draw — the fillets carry the line around instead. They
// are `--fhead-rim-w` THICK (2px, user ask: "thicker and smoother"), and the
// thickness is a variable because the fillet geometry below is derived from it
// — an arc drawn for a 1px line does not fit a 2px one.
.feed-head {
  --fhead-face: var(--grey-4, #e0e0e0);
  --fhead-rim: var(--indigo-4, #7986cb);
  --fhead-rim-w: 2px;

  position: absolute;
  left: 0;
  right: 0;
  // Over the well and its cards; the flyout (3002) and every fixed band are
  // in other stacking contexts and unaffected.
  z-index: 2;
  background: var(--fhead-face);
  border-top: var(--fhead-rim-w) solid var(--fhead-rim);
  border-bottom: var(--fhead-rim-w) solid var(--fhead-rim);
  // THE CAST (user ask: "a little discrete shadow over the content"). Mostly
  // DOWN, the direction this platform's light comes from, with a hint upward
  // because the stream passes on both sides of a box that can be parked in the
  // middle of it. Both spreads are negative by exactly half the blur, which is
  // what buys ZERO LATERAL reach (`S + B/2` = 0): the box's two side edges ARE
  // the frieze bars, and a shadow with any sideways travel would smear onto
  // their motif instead of falling on the cards. Reach is 7px down, 3px up —
  // enough to lift the box off a plate it now shares a tone with, not enough
  // to read as a drop shadow on a surface that has none anywhere else.
  box-shadow:
    0 7px 14px -7px rgba(0, 0, 0, 0.45),
    0 -5px 12px -8px rgba(0, 0, 0, 0.28);
  // NO `overflow: hidden` — the four fillets live outside this box.
  transition: box-shadow 0.12s, background 0.12s;
}

// Held: the plate lifts further off the bed and lights ONE step (which the
// fillets follow through `--fhead-face`), so the box says it is loose. One
// step, not three: `--grey-1` was the right lift off a `--grey-3` face and
// reads as a different object off this one.
.feed-head.is-grabbed {
  --fhead-face: var(--grey-3, #eeeeee);
  box-shadow:
    0 12px 24px -10px rgba(0, 0, 0, 0.55),
    0 -8px 18px -10px rgba(0, 0, 0, 0.35);
}

// ── THE FILLETS ─────────────────────────────────────────────────────
// One at each corner: the box's face sweeping into the frieze bar through a
// concave quarter-round, with the box's own edge line carried along the sweep,
// so one continuous 2px `--indigo-4` runs bar → flare → edge → flare → bar.
// Radial gradients rather than borders, for the reason `MediaTabsBar` gives:
// an INVERTED radius has no border-radius spelling.
//
// THE GEOMETRY IS DERIVED, NOT COPIED (2026-08-06, "thicker and smoother").
// `MediaTabsBar`'s numbers are for a 1px line on a borderless edge and they do
// not survive being thickened — the arc lands beside its own line instead of
// continuing it. Take the box's top-left corner, with the top border's OUTER
// edge at y=0 and the box's left edge at x=0, R = the sweep radius (11) and
// T = `--fhead-rim-w` (2):
//
//   · the drawn line is a STROKE of width T centred on a circle of radius R,
//     so the gradient's ring runs R−T/2 → R+T/2 (10 → 12);
//   · that circle's centre is (R, T/2 − R) = (11, −10). Both coordinates are
//     forced: its BOTTOM-most point must land on the border's centre line
//     (y = T/2) for the arc to continue the border rather than touch it, and
//     its LEFT-most point must land on x = 0 so the line dies at the bar's
//     face — half the stroke falls on the bar and is clipped, which is what a
//     line disappearing behind an edge looks like;
//   · so the element spans x ∈ [0, R] and y ∈ [−R, T]: `width: R`,
//     `height: R + T`, and `top: -(R + T)` — an absolutely positioned child is
//     placed against the PADDING box, so the offset has to name the border it
//     is reaching over (see gotchas.md; this is why 1px→2px moved it by two).
//   · the centre in the element's own coordinates is therefore (R, T/2) at the
//     top corners and (R, height − T/2) at the bottom ones.
//
// Verify by measuring, not by eye: at x = R the ring must cover exactly
// y ∈ [0, T] — the box's border — and at x = 0 exactly half the stroke.
//
// SMOOTHNESS is the stop RAMPS. The tabs step from transparent to rim in
// 0.2px, which on any display is a hard edge: the arc stair-steps, and at the
// ends — where it runs nearly parallel to the pixel grid — it breaks up into
// dashes. The ramps here are 0.6px, wide enough that the compositor has a real
// gradient to resolve and the curve antialiases, narrow enough that the line
// keeps its ~2px weight (mid-ramp to mid-ramp = 9.9 → 12.1).
.feed-head__flare {
  position: absolute;
  width: 11px;
  height: 13px; // R + T
  pointer-events: none;
}

.feed-head__flare--tl {
  left: 0;
  top: -13px; // -(R + T)
  background: radial-gradient(circle at 11px 1px,
    transparent 9.6px, var(--fhead-rim) 10.2px,
    var(--fhead-rim) 11.8px, var(--fhead-face) 12.4px);
}

.feed-head__flare--tr {
  right: 0;
  top: -13px;
  background: radial-gradient(circle at 0 1px,
    transparent 9.6px, var(--fhead-rim) 10.2px,
    var(--fhead-rim) 11.8px, var(--fhead-face) 12.4px);
}

.feed-head__flare--bl {
  left: 0;
  bottom: -13px;
  background: radial-gradient(circle at 11px 12px,
    transparent 9.6px, var(--fhead-rim) 10.2px,
    var(--fhead-rim) 11.8px, var(--fhead-face) 12.4px);
}

.feed-head__flare--br {
  right: 0;
  bottom: -13px;
  background: radial-gradient(circle at 0 12px,
    transparent 9.6px, var(--fhead-rim) 10.2px,
    var(--fhead-rim) 11.8px, var(--fhead-face) 12.4px);
}

// ── THE HANDLE ──────────────────────────────────────────────────────
// The house window bar, in the feed's colorway: grip at the left, title
// centred, one rule under it. `touch-action: none` is load-bearing on a
// phone — without it the browser claims the vertical gesture for a scroll
// and the pointer stream dies mid-drag.
.feed-head__bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border-bottom: 1px solid var(--fhead-rim);
  cursor: grab;
  user-select: none;
  touch-action: none;

  .feed-head.is-grabbed & { cursor: grabbing; }

  // The keyboard's way in has to be visible, and the platform's default
  // focus ring is drawn for dark chrome.
  &:focus-visible {
    outline: 2px solid var(--indigo-8, #303f9f);
    outline-offset: -2px;
  }
}

.feed-head__grip {
  flex: 0 0 auto;
  color: var(--indigo-10, #1a237e);
  opacity: 0.75;
}

// Centred in the bar, not after the grip: the title belongs to the box, the
// grip is a control at its edge. Same trick the dock bars use — absolute
// centring, so the glyph beside it cannot push it off centre.
.feed-head__title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  font-size: 0.68em;
  letter-spacing: 0.06em;
  color: var(--indigo-10, #1a237e);
}

// ── THE BODY, IN TWO HALVES ─────────────────────────────────────────
// Split down the middle by one `--indigo-4` rule — the same ink and the same
// weight as the byline's vertical rule on a post card, since this is the same
// division: two things standing side by side inside one object.
.feed-head__body {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.feed-head__half {
  flex: 1 1 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 8px;
}

.feed-head__half--talk {
  border-right: 1px solid var(--fhead-rim);
}

.feed-head__half--lens {
  justify-content: space-between;
}

// ── THE SEAT ────────────────────────────────────────────────────────
// The feed card's identity block at chip scale: face, name over its second
// line, org badge at the end.
.feed-head__seat {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.feed-head__seat-lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.feed-head__seat-name {
  font-size: 0.74em;
  font-weight: 700;
  color: var(--indigo-8, #303f9f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-head__seat-sub {
  font-size: 0.62em;
  color: rgba(var(--ink-rgb), 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── THE CHAT BOX ────────────────────────────────────────────────────
// A sunk well with a composer under it. Inert: no store, no service, no
// events — the two controls are `disabled`, which greys them by construction
// and states the fact without a label saying so.
.feed-head__chat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

// The log's floor followed the box's face off `--grey-3`: it was `--grey-4`,
// which IS the face now, so the well would have drawn nothing. It takes the
// composer's `--grey-1` instead — log and input are one pale surface in two
// parts, read from and written to, told apart by their rims rather than by a
// tone. (`--grey-3` would collide with the held state.)
.feed-head__chat-log {
  min-height: 26px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  border: 1px solid var(--fhead-rim);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  font-size: 0.62em;
  color: rgba(var(--ink-rgb), 0.45);
}

.feed-head__chat-compose {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.feed-head__chat-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--fhead-rim);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  color: var(--indigo-8, #303f9f);
  font-family: inherit;
  font-size: 0.64em;
  &:disabled { cursor: not-allowed; }
  &::placeholder { color: rgba(var(--ink-rgb), 0.4); }
}

.feed-head__chat-send {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--fhead-rim);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  color: var(--indigo-8, #303f9f);
  &:disabled { cursor: not-allowed; opacity: 0.55; }
}
</style>
