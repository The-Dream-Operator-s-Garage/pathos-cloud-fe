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
      `--indigo-7` line runs bar → flare → box edge → flare → bar and the plate
      reads as a piece of the frieze pulled out of it rather than a rectangle
      dropped between the two bars.

  WHAT IT HOLDS, after the same day's compression asks — three thin bands,
  71px all in (it was 119):

    · the HANDLE, 18px;
    · one BODY LINE, split in half by a rule. Left: the seat (face, name, org
      badge) and an inert filter field — an input and one button wearing an
      oversized `filter_alt`. Neither talks to anything yet; this is the
      surface placed before the wiring, and `disabled` is how it says so. The
      seat CURRENTLY references claude in the Dream Operator's Garage;
      "currently" is the whole point, so it is a name and an org pattern at
      the top of the script rather than a hardcoded entity id (ids differ per
      install), resolved through the platform's own entity search. Right: the
      stream's controls through the `controls` slot — the stream still owns
      its trust lens, its label funnel, its sort placeholder and its count.
    · the LABEL LANE, 19px, a constant-height scroller for the labels being
      filtered on (`labels` slot).

  And two INNER FRIEZE POSTS standing where the corner sweeps flatten out,
  which is what makes the box a framed span rather than a slab between bars.
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

    <!-- THE INNER FRIEZE BARS (user ask) — the box's own vertical edges,
         standing where each corner sweep FLATTENS OUT: their outer face is at
         `FLARE` from the box's side, which is exactly the x where the fillet's
         tangent turns horizontal and the top and bottom borders become
         straight. So the sweep comes off the container's big bar and lands on
         a post, and the box reads as a framed span rather than a slab wedged
         between two bars.
         They are the media viewer's THIN bar turned 90° (`slim`) and painted
         `--indigo-8` plaque under a `--brown-1` motif, a MIRRORED PAIR like the
         container's own: variant A on the left, B — the same waves flipped
         horizontally — on the right, so the two edges reflect each other
         across the box instead of repeating. Absolute, so they can span the
         whole inner height (handle, body and lane alike) while the three rows
         inset past them; `pointer-events: none` rides along from the
         component, so neither one takes a press off the drag bar. -->
    <FriezeBarVertical slim lip="right" class="feed-head__post feed-head__post--l" />
    <FriezeBarVerticalB slim lip="left" class="feed-head__post feed-head__post--r" />

    <div class="feed-head__inner">
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
        <!-- FIRST HALF — ONE LINE (user ask): the face, its org badge, the
             input and its button, all in a row. The seat was a row of its own
             over a second row holding the input; stacking them was the last
             thing making this box two lines tall.
             THE NAME IS GONE (later ask) and the face grew 20 → 24px to carry
             the seat on its own; the badge stays, because it is the only
             visible thing left saying WHICH org this seat belongs to, which
             was the point of putting a seat here. Both wear the same
             `seatTitle` tooltip, so the name is a hover away. -->
        <div class="feed-head__half feed-head__half--talk">
          <EntityAvatar :entity="seatEntity" :size="24" :title="seatTitle" />
          <OrgLogoChip v-if="seat.org" :org="seat.org" :size="15" :link="false" />
          <!-- The chat box: an input and its one button. The message log is
               GONE (user ask) — a summary of a conversation that does not
               exist yet was the one part of this box making a claim. Still
               inert, still `disabled`, and the button wears a FILTER glyph
               rather than a send arrow (user ask), which is what the field
               will do before it ever says anything. -->
          <input
            class="feed-head__chat-input"
            type="text"
            disabled
            placeholder="Filter by…"
            aria-label="Filter by (not wired up yet)"
          >
          <button
            type="button"
            class="feed-head__chat-send"
            disabled
            title="Not wired up yet"
            aria-label="Filter (not wired up yet)"
          >
            <q-icon name="filter_alt" size="17px" />
          </button>
        </div>

        <!-- SECOND HALF — whatever the stream puts there (its lenses), also
             one line now that the caption under them is gone. -->
        <div class="feed-head__half feed-head__half--lens">
          <slot name="controls" />
        </div>
      </div>

      <!-- THE LABEL LANE (user ask) — the one strip the compression pass was
           told to LEAVE: a scroller across the box's foot where the labels
           being filtered on stand. Empty is its normal state and it keeps its
           height anyway; a lane that appeared with the first chip would
           resize the box — and move the stream's reserved home slot — every
           time someone picked or cleared a label. -->
      <div class="feed-head__lane">
        <slot name="labels" />
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { refService } from 'src/services/ref.service'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'

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
  components: { EntityAvatar, OrgLogoChip, FriezeBarVertical, FriezeBarVerticalB },
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
  --fhead-rim: var(--indigo-7, #3949ab);
  // TOP THINNER THAN BOTTOM (user ask). Not by taking the top back down — the
  // 2px is the thickening asked for two passes ago — but by giving the BOTTOM
  // the extra pixel, which is where the weight belongs anyway: the box's cast
  // falls downward and the bottom edge is the one the stream runs up against,
  // so a heavier base reads as the box standing ON the plate. (The post cards
  // wore exactly this asymmetry — a hairline box on a 2px foot — until the bed
  // went lighter than the card and a weighted base had nothing to sit on.)
  //
  // Both are DIALS because the corner sweeps are derived from them: each
  // fillet's height, offset and gradient centre are functions of its own
  // edge's width, so the top pair and the bottom pair no longer share numbers.
  --fhead-rim-w: 2px;
  --fhead-rim-w-b: 3px;
  // EVERYTHING INSIDE THE BOX IS ONE TONE (2026-08-06, user ask: "the text and
  // inner borders of the whole sliding bar"): `--indigo-9`, the same step its
  // two inner frieze posts are plated in, for every mark and every rule the
  // box draws in its own field — the handle's glyph and title, the seat's
  // name, the field and its button, the row of lenses handed in through the
  // slot, the count, and the three rules that divide the bands.
  //
  // What it does NOT touch is the box's OUTER edge — `--fhead-rim` — which
  // walked `--indigo-4` (the frieze motif's lit wave, from the day the box was
  // built) → -8 → **-7** across two later asks. That line and its four corner
  // sweeps join the box to the container's frieze bars, so they answer to the
  // surface outside the box rather than to its contents.
  //
  // The box therefore reads in THREE CONSECUTIVE STEPS, one job each:
  //   -7  the frame (outer border + the sweeps that continue it)
  //   -8  the two inner frieze posts it stands between
  //   -9  everything written in the field they enclose
  // Lightest at the outside, deepest at the marks — so the eye lands on what
  // the box SAYS, and the structure holding it stays structure.
  --fhead-ink: var(--indigo-9, #283593);
  --fhead-rule: var(--indigo-9, #283593);
  // The fillets' sweep radius (`FLARE` in the script) and the width a slim
  // vertical frieze bar resolves to. Both are read by the inner posts below —
  // the first for where they stand, the second for how far the content insets
  // past them — so they are named once here instead of being restated.
  --fhead-flare: 11px;
  --fhead-post-w: calc(var(--frieze-h) / 2);

  position: absolute;
  left: 0;
  right: 0;
  // Over the well and its cards; the flyout (3002) and every fixed band are
  // in other stacking contexts and unaffected.
  z-index: 2;
  background: var(--fhead-face);
  border-top: var(--fhead-rim-w) solid var(--fhead-rim);
  border-bottom: var(--fhead-rim-w-b) solid var(--fhead-rim);
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

// The BOTTOM pair carries a 3px edge, so every number in the derivation moves
// with it: height `R + T` = 14, offset `-(R + T)`, centre at `height − T/2`
// = 12.5, ring `R ± T/2` = 9.5 → 12.5. Same 0.6px ramps. This is exactly why
// the derivation is written out above rather than the numbers being copied —
// one edge changing thickness re-solves its own two corners and leaves the
// other two alone.
.feed-head__flare--bl {
  left: 0;
  bottom: -14px;
  height: 14px;
  background: radial-gradient(circle at 11px 12.5px,
    transparent 9.2px, var(--fhead-rim) 9.8px,
    var(--fhead-rim) 12.2px, var(--fhead-face) 12.8px);
}

.feed-head__flare--br {
  right: 0;
  bottom: -14px;
  height: 14px;
  background: radial-gradient(circle at 0 12.5px,
    transparent 9.2px, var(--fhead-rim) 9.8px,
    var(--fhead-rim) 12.2px, var(--fhead-face) 12.8px);
}

// ── THE INNER FRIEZE BARS ───────────────────────────────────────────
// Two slim vertical bars, absolute so they can span the WHOLE inner height —
// handle, body and lane — while the rows themselves inset past them. `top`
// and `bottom: 0` land on the padding box, i.e. just inside the box's own two
// borders, which is exactly where the frame should stop.
//
// The offset is `FLARE`: the corner sweep's tangent turns horizontal at that
// x, so the bar's outer face stands precisely where the curved border ends
// and the flat one begins. Keep the two numbers in step — this is the one
// place the fillet radius is read by something other than the fillets.
//
// The colorway is dialled through the bar's own custom properties (added the
// same day, mirroring `FriezeBar`'s): a DARK plaque with a LIGHT motif above
// it, the inverse of every other frieze on the platform, which is what lets
// these read at all inside a light box standing on a light plate. The pair is
// `--indigo-8` under `--brown-1` — the FEED colorway's ink carrying the CROWN
// STRIP's own plaque tone as its wave, so these edges are the platform's two
// frieze families stacked rather than a third palette invented for them. (It
// walked there in one sitting: a teal pair, then -10/brown-4, then -9, then
// here — one step inside the frame at -7 and one step outside the marks at
// -9, which is the arrangement the box settled into.) The spread
// is enormous by frieze standards, Material 800 under a 50, and it has to
// be: the bar is ~9px wide with no lip and no rolled edge, so the motif is
// the only thing separating plate from wave. The lip is dialled to the plaque
// so it draws nothing — these bars have content on both sides and nothing to
// state an inward edge against.
.feed-head__post {
  position: absolute;
  top: 0;
  bottom: 0;
  --frieze-bar-v-base: var(--indigo-8, #303f9f);
  --frieze-bar-v-wave-one: var(--brown-1, #efebe9);
  --frieze-bar-v-wave-two: var(--brown-1, #efebe9);
  --frieze-bar-v-lip: var(--indigo-8, #303f9f);
}

.feed-head__post--l { left: var(--fhead-flare); }
.feed-head__post--r { right: var(--fhead-flare); }

// The three rows live inside the frame: each side gives up the sweep's reach
// plus a bar's width, so nothing can run under a post. Stated once here
// rather than added to all three rows' own padding.
.feed-head__inner {
  padding: 0 calc(var(--fhead-flare) + var(--fhead-post-w));
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
  // 18px (was 22) — the compression pass took every band in this box down to
  // what its contents actually need, and a 14px grip in an 18px bar still
  // leaves the 44px-wide grab target a drag handle wants.
  height: 18px;
  padding: 0 8px;
  border-bottom: 1px solid var(--fhead-rule);
  cursor: grab;
  user-select: none;
  touch-action: none;

  .feed-head.is-grabbed & { cursor: grabbing; }

  // The keyboard's way in has to be visible, and the platform's default
  // focus ring is drawn for dark chrome.
  &:focus-visible {
    outline: 2px solid var(--fhead-ink);
    outline-offset: -2px;
  }
}

.feed-head__grip {
  flex: 0 0 auto;
  color: var(--fhead-ink);
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
  color: var(--fhead-ink);
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

// ONE LINE EACH (user ask). Both halves are a single row of items now — the
// left one stopped stacking a seat row over an input row, the right one lost
// the caption above its controls — so the body is exactly one 20px row tall
// and the box is three thin bands: handle, this, lane.
.feed-head__half {
  flex: 1 1 50%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
}

.feed-head__half--talk {
  border-right: 1px solid var(--fhead-rule);
}

.feed-head__half--lens {
  gap: 4px;
}

// ── THE SEAT ────────────────────────────────────────────────────────
// Down to a FACE AND A BADGE (user ask), both fixed-width, both carrying the
// same tooltip. `.feed-head__seat-name` is gone with the last two passes'
// worth of text — the role sub-line went to the compression, the name to
// this — which is the whole reason the input can now be the line: everything
// left of it is a known width, so `1 1 auto` on the field means it takes all
// the space the half has and no arithmetic states how much that is.

// ── THE CHAT BOX ────────────────────────────────────────────────────
// An input and its one button, standing in the seat's own line rather than in
// a row of their own (user ask). The message log is gone (also a user ask) —
// it was a summary of a conversation that does not exist, the one part of
// this box making a claim rather than holding a place. Still inert: no store,
// no service, no events, and `disabled` on both controls, which greys them by
// construction and states the fact without a label saying so.
//
// The input is the line's SPRING (`1 1 auto`, min-width 0, no basis): the
// face, the badge and the button are all fixed, the name yields first, and
// whatever the half has left over is the field.
.feed-head__chat-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--fhead-rule);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  color: var(--fhead-ink);
  font-family: inherit;
  font-size: 0.64em;
  &:disabled { cursor: not-allowed; }
  &::placeholder { color: rgba(var(--ink-rgb), 0.4); }
}

// The FILTER glyph, deliberately oversized for its box (user ask: "a big
// filter icon"): 17px in a 20px button, so the mark reaches the button's rim
// on both axes and the control reads as one solid glyph rather than an icon
// sitting in a frame. It is the same `filter_alt` the label lens wears —
// which is the point, the two are the same gesture at two scales.
.feed-head__chat-send {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  border: 1px solid var(--fhead-rule);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  color: var(--fhead-ink);
  &:disabled { cursor: not-allowed; opacity: 0.55; }
}

// ── THE LABEL LANE ──────────────────────────────────────────────────
// A full-width strip across the box's foot, under both halves, holding the
// labels the stream is being filtered on. It is ALWAYS THERE at a constant
// 19px: it is the one thing the compression pass was told to leave, and a
// lane that appeared with its first chip would change the box's height —
// which moves the well's reserved home slot — every time someone picked or
// cleared a label.
//
// It SCROLLS sideways rather than wrapping or ellipsing: label names are
// long, the box is half a feed column wide, and a filter you cannot read the
// name of is not a filter you can trust. Hidden scrollbar, the same call
// `MediaTabsBar` makes — a scrollbar under a 19px strip is all noise.
.feed-head__lane {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 19px;
  padding: 0 6px;
  border-top: 1px solid var(--fhead-rule);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
</style>
