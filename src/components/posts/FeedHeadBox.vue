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
      (`.dock-bar`, `ElementFlyout` — the fused viewer window): the header
      moves the box, the body is content and takes its own taps.
    · IT SLIDES UP AND DOWN BETWEEN THE FRIEZE BARS. Vertical only — the box
      spans lip to lip by construction, so there is no horizontal freedom to
      give — clamped so it never passes either end of the container. It left
      the scroller to do that (`position: absolute` against
      `.feed-stream-pane`), which is also what freed it from `sticky`: a
      sticky box is pinned by definition, and this one is placed.
    · ITS CORNERS FLARE INTO THE BARS. All four, through the concave fillets
      the parked-media tabs are cut with (`MediaTabsBar.vue`) — 9px radial
      gradients carrying the rim's own tone along the arc, so one continuous
      `--indigo-6` line runs bar → flare → box edge → flare → bar and the plate
      reads as a piece of the frieze pulled out of it rather than a rectangle
      dropped between the two bars.

  WHAT IT HOLDS — TWO ARRANGEMENTS since 2026-08-21 (user ask: the manual
  toggle; it was three constant bands from the 2026-08-06 compression pass —
  handle · split body line · 19px label lane):

    · FULL TALAVERO, the default: the HANDLE, then ONE band — the talk pit
      (the seat's face and his bubble, carved `--brown-2`) with the talavera
      TOGGLE at the bubble's right. The lens lives in Talavero's STANDING
      TEXT inside the bubble (labels embedded as chips); nothing
      hand-operated shows, and the box is at its shortest.
    · MANUAL: the toggle pulled down adds the WORKBENCH — one `--indigo-8`
      band under the bubble holding the stream's controls (label search +
      lens bundle, `controls` slot) and the old lane's four pieces (active
      tray · broom · trash tray · bin; `labels`/`trash` slots).

  The stream still owns every lens, its sort and its count; the box owns the
  geometry and the mode. Heights differ BY DESIGN between the arrangements —
  the `update:height` observer carries whichever is standing up to the well.

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
         `--indigo-8` plaque under a `--brown-1` motif — the same tone as the
         box's inner walls since 2026-08-07, so post and rule are one mark — a
         MIRRORED PAIR like the
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
        <!-- THE COUNT SLOT (2026-08-07, user ask) — the right end of the
             header line. The stream hands in the number of posts it is
             currently under; the box only says where it goes. It is the third
             thing this bar carries and the only one that changes, which is
             why it sits opposite the grip: a handle at one end, a reading at
             the other, the name centred between them.
             It stays part of the DRAG SURFACE (no `.stop` on the press): it
             is a reading, not a control, and a bar you can only grab in its
             left third is a worse handle than one with a number written on
             it. Nothing here takes a tap, so nothing is being stolen.

             IT IS A CLUSTER OF TWO since the ask after: SORT BY left the lens
             bundle and stands here too. It is the one control on the header
             line, and it earns the place — every other lens narrows WHICH
             posts the board is showing, and this one orders what is left, so
             it belongs beside the number it reorders rather than in a row of
             filters. ⚠ The sort button DOES take its tap: `.stop` on its press
             is `FeedStream`'s to state, since the button is its markup — see
             the note there.

             THE COUNT READS FIRST (2026-08-08, user ask: "put the post count
             on the left of the ordering button"). The pair went in the other
             order for a day, on "before the post count" — which put the VERB
             ahead of the thing it acts on. This way the line reads left to
             right as a sentence: how many posts, then how they are ordered.
             The count also lost its outline in the same ask, so the cluster is
             now a bare number beside a rimmed control — which is the right
             asymmetry, since only one of the two can be pressed. -->
        <span class="feed-head__bar-end">
          <span class="feed-head__count"><slot name="count" /></span>
          <slot name="sort" />
        </span>
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
             `seatTitle` tooltip, so the name is a hover away.

             THE WIRING LANDED (2026-08-07, the Talavero seat): the seat is a
             PROP now — Talavero's identity card from `GET /feed/lens-context`
             — and the field speaks. Typing + Enter (or the filter button)
             emits `ask(text)`; the stream above owns the chat round-trip and
             hands back `thinking` (ring on the face), `live` (the session-
             local liveness dot — lit by any successful lens/♪ round-trip,
             cleared by a timeout: honest wiring, no fake presence) and
             `line` (the transient say/♪/failure line that takes the field's
             place for a few seconds; clicking it opens the chat transcript).
             A NULL seat is the stub install: field stays disabled, tooltip
             says why — the surface still states its shape. -->
        <div class="feed-head__half feed-head__half--talk">
          <!-- THE SEAT COLUMN — pinned to the section's TOP LEFT (2026-08-07,
               user ask). It was centred in a one-line row; the field is two
               lines tall now, and a face floating at the vertical middle of a
               composer reads as an avatar dropped INTO the field rather than
               as the seat the field belongs to. Face and badge stay side by
               side rather than stacking: stacked they are 41px, which would
               make the box taller than the two lines of text need. -->
          <span class="feed-head__seat-col">
            <span class="feed-head__seat-face">
              <span class="feed-head__seat" :class="{ 'is-thinking': thinking }">
                <EntityAvatar :entity="seatEntity" :size="isMobile ? 20 : 28" :title="seatTitle" />
                <span v-if="live" class="feed-head__seat-live" aria-hidden="true" />
              </span>
              <OrgLogoChip v-if="seatCard.org" :org="seatCard.org" :size="15" :link="false" />
            </span>
            <!-- THE HANDLE, UNDER THE FACE (2026-08-08, user ask) — the seat's
                 way back to its own profile. The face has carried the seat
                 alone since the name was trimmed out of this line, with the
                 name only a tooltip away; the handle puts the one piece of it
                 that is also an ADDRESS back on the surface, and makes the
                 seat a place you can go rather than only a face that answers.
                 A `router-link`, not a click handler: it is a destination, so
                 it should middle-click, copy and open in a tab like one.
                 `@tala` is the fallback, not the value — the real username is
                 used the moment the seat has one (locally it is an unrostered
                 alter-ego, so `username` comes back null and the fallback is
                 what shows). On a STUB install there is no id to route to, so
                 the same text renders as a plain span: a legend that reads
                 like a link and goes nowhere is worse than one that does not
                 pretend. And it is NOT RENDERED AT ALL on the phone (user
                 ask): there the seat and its composer share one dense row, and
                 a caption under a 22px face is a second line the row exists to
                 avoid. `v-if`, not `display: none` — a hidden element still
                 holds its line in the column. -->
            <!-- CURVED since 2026-08-21 (user ask: "curve it on the bottom
                 left side of his profile pic"): the handle is an SVG
                 text-on-path now, a 105° arc (r=17 on the 28px face) hugging
                 the avatar's lower-left corner from ~8 o'clock round to
                 ~4:30, glyph tops toward the face — a caption wrapped around
                 the porcelain rather than a line under it. The link box
                 itself stays IN FLOW under the face (28×9px, the same 9px
                 line the straight caption held), so the seat column — and
                 the band whose height it sets — measures exactly as before;
                 the svg reaches up and around from inside it, and nothing
                 here clips (the box's own rule: no overflow:hidden).
                 The curve is drawn by `seatArc`, which is `@tala` when the
                 real handle outruns the arc — the user named the fallback —
                 while the tooltip and the route keep carrying the full
                 seat. -->
            <router-link
              v-if="enabled && !isMobile"
              :to="'/entities/' + seatCard.id"
              class="feed-head__seat-handle"
              :title="seatTitle + ' — open the profile'"
            >
              <svg class="feed-head__seat-arc" viewBox="0 0 28 40" aria-hidden="false">
                <path id="fhead-seat-arc-path" d="M -2.58 23.58 A 19.15 19.15 0 0 0 30.58 23.58" fill="none" />
                <text class="feed-head__seat-arc-text" text-anchor="middle">
                  <textPath href="#fhead-seat-arc-path" startOffset="50%">{{ seatArc }}</textPath>
                </text>
              </svg>
            </router-link>
            <span v-else-if="!isMobile" class="feed-head__seat-handle is-stub">
              <svg class="feed-head__seat-arc" viewBox="0 0 28 40" aria-hidden="false">
                <path id="fhead-seat-arc-path" d="M -2.58 23.58 A 19.15 19.15 0 0 0 30.58 23.58" fill="none" />
                <text class="feed-head__seat-arc-text" text-anchor="middle">
                  <textPath href="#fhead-seat-arc-path" startOffset="50%">{{ seatArc }}</textPath>
                </text>
              </svg>
            </span>
          </span>

          <!-- THE COMPOSER. The field and its button are ONE object now: the
               button is placed at the composer's BOTTOM RIGHT (user ask), over
               the field's own corner, with the field reserving that corner in
               its padding so text never runs under the glyph — the composer
               shape every chat surface on this platform uses. It sits outside
               the `line` / field switch on purpose: the reply line borrows the
               field's slot for ~6s, and a button that vanished with it would
               leave the corner empty and move nothing else. -->
          <div class="feed-head__chat">
            <!-- The transient reply line — the field's slot, borrowed.
                 ⚠ A SAY verdict SKIPS this door in full-talavero mode
                 (2026-08-21): it lands straight in the STANDING line below,
                 where the same words persist with the labels embedded. Songs
                 and failures still pass through here for their ~6s — they
                 change no lens, so they have nothing to stand on. -->
            <button
              v-if="line && (manual || line.kind !== 'say')"
              type="button"
              class="feed-head__chat-line"
              :class="'is-' + line.kind"
              :title="line.text + ' — open the chat for the transcript'"
              @click="$emit('open-chat')"
            >{{ line.text }}</button>
            <!-- TALAVERO'S STANDING TEXT (2026-08-21, user ask) — the whole
                 point of full-talavero mode: the labels the seat set are not
                 chips in a lane, they are part of what Talavero is SAYING,
                 and the sentence stands as long as the lens does. The chips
                 are the stream's own (the `labels` slot — the very buttons
                 the manual tray holds when the workbench is open), embedded
                 inline after his words; closing one drops that clause exactly
                 as it does in the lane. Click anywhere else on the line to
                 get the field back and refine by voice — Escape or an empty
                 blur returns the sentence. The bubble GROWS a little with the
                 lens and past its cap it scrolls INSIDE (user ask): a
                 talkative lens must cost the board a scrollbar, not the
                 stream its space. `@click.stop` on the chip span is what
                 keeps a chip's close from also opening the editor. -->
            <div
              v-else-if="showStanding"
              class="feed-head__chat-standing"
              role="button"
              tabindex="0"
              title="Talavero's lens — click to type a refinement; close a chip to drop that clause"
              @click="beginEdit"
              @keydown.enter.prevent="beginEdit"
            >
              <span v-if="spoken" class="feed-head__chat-standing-say">{{ spoken }}</span>
              <span class="feed-head__chat-standing-chips" @click.stop @keydown.stop>
                <slot name="labels" />
              </span>
            </div>
            <!-- A textarea, ONE LINE by default since 2026-08-21 (user ask:
                 "dense by default, very simple, a single line" — it held two
                 from 2026-08-07). `rows` is not what sizes it — the height is
                 stated in the stylesheet so the band's geometry is one number
                 in one place — but it is still the right value to declare for
                 anything reading the DOM. ENTER SENDS and SHIFT+ENTER breaks
                 the line (the text scrolls, exactly as the phone's one-line
                 field always has): `.exact` is what makes the pair possible,
                 since a plain `.enter` swallows the modified press too. -->
            <textarea
              v-else
              ref="askInput"
              v-model="draft"
              class="feed-head__chat-input"
              rows="1"
              :disabled="!enabled || thinking"
              :placeholder="thinking ? 'Talavero is thinking…' : 'Filter by…'"
              :title="enabled ? 'Ask for a lens in plain words — Enter sends, Shift+Enter breaks the line' : 'The seat isn\'t seeded here'"
              :aria-label="enabled ? 'Ask Talavero to filter the feed' : 'Filter (the seat isn\'t seeded here)'"
              @keydown.enter.exact.prevent="doAsk"
              @keydown.esc="onChatEsc"
              @blur="onChatBlur"
            />
            <button
              type="button"
              class="feed-head__chat-send"
              :disabled="!enabled || thinking"
              :title="enabled ? 'Ask' : 'The seat isn\'t seeded here'"
              :aria-label="enabled ? 'Ask Talavero to filter the feed' : 'Filter (the seat isn\'t seeded here)'"
              @click="doAsk"
            >
              <q-icon name="filter_alt" size="15px" />
            </button>
          </div>
        </div>

        <!-- THE MANUAL TOGGLE (2026-08-21, user ask) — the board's ONE mode
             control, at the right of Talavero's bubble: a talavera 3D
             vertical handle (`TalaveraToggle`, the board posts' own ceramic
             as its rail) with the thin nasalization word `manual` stood
             VERTICALLY at its left, so the caption spends height the band
             already has instead of width the bubble needs (user ask).
             Down = open. It stands OUTSIDE the talk room, on the body's
             `--indigo-8` backdrop beside the right frieze post — a lever
             mounted on the frame, not furniture in the room — and what it
             opens is the MANUAL band directly below, which the pulled-down
             handle then points at. -->
        <TalaveraToggle
          class="feed-head__toggle"
          :model-value="manual"
          title="Manual filters — pull the handle to open the workbench; the lenses, the label search, the broom and the trash live in it"
          @update:model-value="$emit('update:manual', $event)"
        />
      </div>

      <!-- THE MANUAL BAND (2026-08-21, user ask) — the workbench the toggle
           opens, and the board's SECOND arrangement. In full-talavero mode
           (the default) it does not exist: the box is the header and the
           bubble, the labels live in Talavero's own text, and the board is
           at its shortest. Pulled open, everything hand-operated stands on
           ONE row under the bubble: the stream's lens controls (label
           search + the bundle, through the `controls` slot), then the lane's
           old four — active tray · broom · trash tray · bin — in the same
           order they always read ("the labels, then the thing you do to
           them"; the keys' history is in the stylesheet).

           ⚠ THIS RETIRES THE ALWAYS-PRESENT LANE (2026-08-06 → 2026-08-21).
           The lane held its height so the box never resized on a pick; the
           toggle makes resizing the POINT — two arrangements, two heights —
           and the `update:height` ResizeObserver already carries either one
           up to the stream's reserved slot, which is what makes the trade
           legal now when it wasn't then.

           ⚠ The `labels` slot renders HERE or in the bubble's standing line,
           never both: this band is `v-if="manual"` and the standing line is
           gated on `!manual`. -->
      <div v-if="manual" class="feed-head__manual">
        <div class="feed-head__manual-controls">
          <slot name="controls" />
        </div>
        <div class="feed-head__lane-active">
          <slot name="labels" />
        </div>
        <button
          type="button"
          class="feed-head__lane-broom"
          title="Sweep both trays — clear the active labels and empty the trash"
          aria-label="Sweep active and trashed label filters clean"
          @click="$emit('sweep')"
        >
          <q-icon name="cleaning_services" size="11px" />
        </button>
        <!-- THE KEYS STAND OUTSIDE THEIR TRAYS, AND AFTER THEM (2026-08-08,
             two user asks in a row, inherited by the manual band unchanged).
             First the bin left `.feed-head__lane-trash` for the strip itself
             — a key sitting IN a rounded `--brown-1` panel read as a chip
             rather than as the room's name — and then both keys moved from
             the LEFT of their trays to the RIGHT. So each room is "the
             labels, then the thing you do to them", which is the order the
             sentence is read in. Each tray holds nothing but labels. -->
        <div class="feed-head__lane-trash">
          <slot name="trash" />
        </div>
        <!-- 13px since 2026-08-08 (user ask: a little bigger). It had been 11
             to match the broom when that key was shrunk, and 11 is small for
             an OUTLINE glyph — `delete_outline` spends its size on a lid and a
             body drawn in hairlines, where `cleaning_services` is a solid
             shape that survives the same box. So the pair is 13 and 11 now,
             which reads as the same weight even though the numbers differ:
             matching the numbers is what made them look uneven. -->
        <q-icon
          name="delete_outline"
          size="13px"
          class="feed-head__lane-trash-mark"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'
import FriezeBarVerticalB from 'src/components/layout/FriezeBarVerticalB.vue'
import TalaveraToggle from 'src/components/shared/TalaveraToggle.vue'

// The phone breakpoint, stated ONCE and read by both the script and the
// stylesheet's `@media` block at the foot of this file. Two places that must
// agree about which layout is running; a literal in each is a bug waiting for
// the day one of them is edited.
const MOBILE_Q = '(max-width: 600px)'

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

// The stub the box falls back to when the install has no seeded seat (or
// lens-context hasn't answered yet): a faceless Talavero, so the surface
// still states WHO it is for — with the field disabled, which is how the
// box says "not here".
const SEAT_STUB = { id: null, display_name: 'Talavero', username: null, photo: null, org: null }

export default defineComponent({
  name: 'FeedHeadBox',
  components: { EntityAvatar, OrgLogoChip, FriezeBarVertical, FriezeBarVerticalB, TalaveraToggle },
  props: {
    // Where the box stands, in px from the container's top edge. `null` is
    // "nobody has moved it" — the box resolves that to HOME itself, so the
    // holder above never has to know the resting geometry.
    offset: { type: Number, default: null },
    // The seat's identity card (`GET /feed/lens-context` → `seat`): id,
    // display_name, photo, org. Null = stub install — field stays disabled.
    seat: { type: Object, default: null },
    // The stream's round-trip state: thinking ring, session-local liveness
    // dot, and the transient reply line { kind: 'say'|'song'|'fail', text }.
    thinking: { type: Boolean, default: false },
    live: { type: Boolean, default: false },
    line: { type: Object, default: null },
    // ── THE TWO ARRANGEMENTS (2026-08-21, user ask) ─────────────────────
    // `manual` is the toggle's state, OWNED BY THE STREAM (session-local,
    // like every lens): false = full-talavero — header, seat, bubble,
    // nothing hand-operated; true = the workbench band is open below.
    manual: { type: Boolean, default: false },
    // Talavero's STANDING sentence — his last `say`, kept by the stream for
    // as long as it is honest (a hand-edit of the lens clears it, and the
    // chips alone stand). Rendered only in full-talavero mode.
    spoken: { type: String, default: null },
    // Whether ANY lens is live (spoken spec, `?label=` filter, or the local
    // hash expand) — the gate on the standing line, stated by the stream
    // because only it knows all three regimes.
    lensLive: { type: Boolean, default: false }
  },
  emits: ['update:offset', 'update:height', 'ask', 'open-chat', 'sweep', 'update:manual'],
  setup (props, { emit }) {
    const rootEl = ref(null)
    const y = ref(props.offset == null ? HOME : props.offset)
    const dragging = ref(false)

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

    // ── THE PHONE LAYOUT, IN JS (2026-08-08, user ask) ──────────────────
    // Two of the mobile board's changes cannot be made in CSS: the seat's
    // avatar takes its size as a PROP (EntityAvatar writes inline width and
    // height, which no stylesheet can outrank without `!important`), and the
    // handle has to leave the DOM rather than be hidden, or it keeps its line
    // in the column's layout.
    //
    // ⚠ `MOBILE_Q` is the same STRING the stylesheet's `@media` uses, on
    // purpose. Quasar's `$q.screen.lt.sm` was the obvious tool and is off by
    // one here — it fires under 600px where the block below is `max-width:
    // 600px`, i.e. 600 inclusive — so at exactly 600px the JS and the CSS
    // would disagree about which layout is running. One string, one answer.
    const isMobile = ref(false)
    let mq = null
    const syncMq = (e) => { isMobile.value = e.matches }

    onMounted(() => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        mq = window.matchMedia(MOBILE_Q)
        isMobile.value = mq.matches
        mq.addEventListener('change', syncMq)
      }
      remeasure()
      if (typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(remeasure)
      ro.observe(rootEl.value)
      if (rootEl.value.parentElement) ro.observe(rootEl.value.parentElement)
    })

    onBeforeUnmount(() => {
      if (mq) mq.removeEventListener('change', syncMq)
      mq = null
      if (ro) ro.disconnect()
      ro = null
      teardown()
    })

    // ── The ask. The box owns only the draft text; everything that talks
    // to the platform (chat bootstrap, consent gates, events) is the
    // stream's — the box is a face and a field.
    const seatCard = computed(() => props.seat || SEAT_STUB)
    const enabled = computed(() => !!seatCard.value.id)
    const draft = ref('')
    const askInput = ref(null)

    // ── THE STANDING LINE'S EDIT SWITCH (2026-08-21) ────────────────────
    // In full-talavero mode with a live lens the bubble shows Talavero's
    // standing text, not the field — `editing` is the way back in. It is
    // deliberately NOT a mode: it flips true on a click and falls back false
    // the moment it stops being needed (empty blur, Escape, a fresh spoken
    // verdict, the lens dying), so the bubble always rests on the sentence.
    const editing = ref(false)
    const showStanding = computed(() => !props.manual && props.lensLive && !editing.value)

    const beginEdit = () => {
      if (!enabled.value) return
      editing.value = true
      nextTick(() => { if (askInput.value) askInput.value.focus() })
    }

    const onChatBlur = () => {
      if (!draft.value.trim()) editing.value = false
    }

    const onChatEsc = () => {
      if (props.lensLive && !props.manual) {
        editing.value = false
        if (askInput.value) askInput.value.blur()
      }
    }

    // A fresh spoken verdict or a dead lens both end the edit: the first
    // because the new sentence IS the answer to what was being typed, the
    // second because there is nothing left to stand behind the field.
    watch(() => props.spoken, () => { editing.value = false })
    watch(() => props.lensLive, (v) => { if (!v) editing.value = false })

    const doAsk = () => {
      const text = draft.value.trim()
      if (!enabled.value || props.thinking) return
      // The funnel on a standing line is a door, not a send: with nothing
      // typed it opens the field where a bare no-op would read as a broken
      // button.
      if (!text) {
        if (showStanding.value) beginEdit()
        return
      }
      emit('ask', text)
      draft.value = ''
    }

    // EntityAvatar takes whatever the caller already resolved, so the face
    // costs no second request.
    const seatEntity = computed(() => ({
      id: seatCard.value.id,
      display_name: seatCard.value.display_name || 'Talavero',
      photo: seatCard.value.photo
    }))

    // `@tala` is the FALLBACK. The seat is an unrostered alter-ego on this
    // install, so `username` comes back null; anywhere it is seeded with one,
    // the handle under the face is the real address rather than a guess.
    const seatHandle = computed(() => '@' + (seatCard.value.username || 'tala'))

    // What the CURVED caption actually draws (2026-08-21, user ask). The arc
    // hugging the face's lower-left corner is ~31px of path and holds about
    // six characters of the display font; a handle that outruns it — locally
    // the seat is the root account `talavero`, nine — falls back to the short
    // name the user gave the fallback state: `@tala`. Truncation would be the
    // textPath's own behaviour (glyphs past the path's end are simply not
    // rendered) and a name cut mid-letter reads as a bug, not a caption. The
    // tooltip and the profile route keep the full seat either way.
    const seatArc = computed(() => (
      seatHandle.value.length <= 6 ? seatHandle.value : '@tala'
    ))

    const seatTitle = computed(() => {
      const name = seatCard.value.display_name || 'Talavero'
      return seatCard.value.org ? `${name} · ${seatCard.value.org.name}` : name
    })

    return {
      rootEl,
      y,
      dragging,
      seatCard,
      seatHandle,
      seatArc,
      isMobile,
      seatEntity,
      seatTitle,
      enabled,
      draft,
      askInput,
      doAsk,
      editing,
      showStanding,
      beginEdit,
      onChatBlur,
      onChatEsc,
      onBarPointerDown,
      onBarKeydown
    }
  }
})
</script>

<style lang="scss" scoped>
/* ── ⚠ EVERY INDIGO IN THIS FILE STEPPED ONE TONE LIGHTER ON 2026-08-24 ─────
   (user ask: "for all the indigo elements inside of talavero's board, make them
   one tone of indigo lighter"). ONE wholesale pass, 24 references, applied to
   DECLARATIONS ONLY — every comment below still names the tone it was written
   about, deliberately: those notes are the board's design record, and rewriting
   them would falsify the history rather than update it. So read any indigo
   named in prose below as ONE STEP DARKER than what the code now states.

   The whole map, and it is the entire vocabulary this box had:
     --indigo-10 → -9   the two inner frieze posts' plaque   (×1)
     --indigo-9  → -8   THE BOX'S PLATE and its five walls   (×10)
     --indigo-8  → -7   the handle band, control rims        (×5)
     --indigo-7  → -6   the four warm containers' rim ink    (×5)
     --indigo-5  → -4   the talk panel's rim                 (×3)

   TWO THINGS SURVIVED THE SHIFT INTACT, which is why a uniform step was the
   right answer rather than a re-pick:
    · THE LADDER'S SPACING. Each level is one Material stop, so every relation
      inside the box — plate under walls, walls over rims, posts deepest of all
      — holds its exact distance. The box is lighter; it is not rearranged.
    · THE PAIRINGS WITH THE CREAM. The same sitting took the face, the talk
      half and the posts' motif to `--light-cream`, and cream reads against the
      whole indigo family; a step of one leaves those contrasts strong (the
      posts' motif is now 242 on -9 rather than on -10).
   ⚠ `--indigo-6` had been ROLELESS since 2026-08-08 and is load-bearing again;
   `--indigo-10` is out of this file entirely. Check `_tokens.scss` before
   assuming either is free. ── */
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
  // ⚠ `--light-cream` SINCE 2026-08-24 (user ask: "for the grey sections
  // between talavero's board inner friezes and the main feed container friezes,
  // paint them light-cream too"). THIS ONE DIAL *IS* THOSE SECTIONS: the box
  // spans the container lip to lip (measured 92 → 668 at a 1440px window, the
  // two edge bars at 77→92 and 668→683), its posts stand 11px inside each end,
  // and what showed in those two strips — plus the 2–3px slivers above and
  // below the posts — was this face; everything else in the box paints over it.
  // Three things follow it for free, all of them correct: the FOUR CORNER
  // FILLETS (their gradients read this dial, so the box still flows into the
  // container's frieze bars instead of stopping at them), the liveness dot's
  // 1px ring, and the held state further down.
  // ⚠ AND `--indigo-6` AN ASK LATER THE SAME DAY (user ask: "for the sections
  // between the main feed container frieze bars and talavero's board inner
  // friezes, paint it indigo-6 and make sure when the board is hovered, it
  // remains in that color"). The cream lasted one pass. What the indigo does
  // that the cream could not: those strips are the only pixels of the box that
  // touch the container's OWN frieze bars, and those bars inverted to a
  // `--light-cream` plate in the same sitting — so a cream face met a cream
  // plate at the seam and the board's edge stopped existing. At `--indigo-6`
  // (Material 500, the pure hue) the strips read as the box's own material
  // running out to meet the bars, which is what the corner fillets have always
  // been for: they read this dial, so the sweep now carries indigo into cream
  // instead of cream into cream.
  // ⚠ BACK TO `--light-cream` AN ASK LATER (2026-08-24: "for the sections
  // between the main feed container frieze bars and talavero's board inner
  // friezes, paint them light-cream and make sure when the board is hovered, it
  // remains in that color"). The indigo held for one pass, and what makes the
  // cream work THIS time is that the bars it meets moved underneath it: they
  // inverted back to an `--indigo-8` plate in the same message, so the seam the
  // cream failed at an hour ago — cream face against a cream PLATE — is now
  // cream face against a dark bar. What the two still share is the bar's own
  // 3px EDGE, which is `--light-cream` too, so the join reads as the box's face
  // running into the bar's frame and stopping at its dark plate. That is a
  // seam by material rather than by line, and it is the arrangement to keep in
  // mind before re-toning either side.
  --fhead-face: var(--light-cream, #FCF3E0);
  // ── `--indigo-8` SINCE 2026-08-22 (user ask: "pinta el borde curveado de
  // la parte superior del board de talavero indigo-8") ─────────────────────
  // One step deeper, and the walk's second visit to -8 (it ran -4 → -8 → -7
  // across 2026-08-08/21). The CURVED part of the ask is free: the two top
  // fillets read their colour stops from this dial by construction, which is
  // the whole reason the sweeps are derived from the rim rather than painted
  // — "the fillets carry the line around" (below). So the top edge and the
  // two corners it turns through move as ONE mark, as they always have.
  // ⚠ The BOTTOM edge does NOT follow: `--fhead-rim-b` is its own dial at
  // `--indigo-9` and the box has been asymmetric on purpose (2px top / 3px
  // bottom) since 08-08 — weight to the base where the cast falls. The board
  // now steps -8 top, -9 bottom, which deepens that asymmetry by tone as
  // well as by weight.
  --fhead-rim: var(--indigo-7, #3949ab);
  // THE BOTTOM EDGE HAS ITS OWN TONE since 2026-08-07 (user ask): the box's two
  // edges were one line in two thicknesses until then; they are two lines.
  //
  // It splits the same way the WIDTH already did, and for a related reason. The
  // bottom is the heavier edge because the box stands ON the stream — and a
  // heavier edge in the SAME ink reads as more of the same line, where a lighter
  // ink at more weight reads as a base the box rests on.
  //
  // IT WALKED -5 → -6 → **-9** across three asks the same day, and the walk is
  // the argument. -5 was one step ABOVE the pure hue, which made the base the
  // box's brightest edge; -6 was the hue itself, the first setting where the
  // base read as the DEEPER of the two edges rather than the more lit one; and
  // -9 is where the box's own inside lives — its five walls, its two posts,
  // every mark. So the frame is no longer one line in two weights, nor two
  // tones a step apart: it is the -7 LID and the -9 FOOT, and the foot is made
  // of the same ink as everything the box is built out of.
  //
  // Which is the reading the weight was always after. The box stands ON the
  // stream; a base in the frame's own tone said "the underside of a frame",
  // and a base in the interior's tone says "the floor this thing rests on".
  // It is also the deepest step the colorway has short of -10 (the media tabs'
  // ink), so this is the end of that road — further weight is
  // `--fhead-rim-w-b`, not another level.
  //
  // ⚠ THE BOTTOM EDGE IS DRAWN IN THREE PLACES — this border and BOTH bottom
  // fillet gradients (`--bl`, `--br`), whose colour stops carry the line around
  // the corner. They all read this dial, and that is the only reason the sweep
  // does not change colour halfway through (see specs/gotchas.md, the same trap
  // the media tabs strip documents). The TOP pair keeps `--fhead-rim`.
  //
  // ⚠ IT NO LONGER MATCHES THE CONTAINER'S FRIEZE-BAR LIPS. Those took -5 the
  // day this edge was split off, deliberately as ONE MARK with it — the
  // surface's stated tone for the inner line of its chrome. The asks after
  // moved this edge twice and left the lips where they were, so the pairing is
  // BROKEN on purpose and three levels wide now: the lips are still -5
  // (`FriezeBarVertical.vue` / `…B.vue`). Move them here if the two are ever
  // meant to read as one line again.
  --fhead-rim-b: var(--indigo-8, #303f9f);
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
  // The box read in THREE CONSECUTIVE STEPS for a day, one job each: -7 the
  // frame, -8 the two inner posts, -9 the marks. IT IS TWO SINCE 2026-08-07
  // (user ask — the posts were repainted -9 in the pass that thickened the
  // inner rules):
  //   -7  the FRAME — the outer border and the four sweeps that continue it
  //   -9  EVERYTHING INSIDE — the two posts, the five walls between the rooms,
  //       and every mark written in them
  // Same reading, one distinction fewer: light at the outside, deep within.
  // What the middle step was buying was a difference between the posts and the
  // walls they run into, and the ask decided that is a difference the box does
  // not want — a wall and its post are one structure.
  //
  // The HANDLE stands outside both (`--fhead-bar-face`, below): it is the one
  // plated band, and -8 is now spent entirely on it.
  --fhead-ink: var(--indigo-8, #303f9f);
  // THE WALLS WALKED -9 → -8 → `--indigo-6` across three asks, each time
  // following the BODY's floor rather than leading it. On the `--indigo-9`
  // floor they were invisible; on `--indigo-7` they came up a step to keep one
  // step of contrast; and now that the floor is LIGHT again (`--grey-4`) they
  // are down at the colorway's pure hue, which is the deepest a line can be on
  // a pale plate before it stops reading as a line and starts reading as a
  // gap. Same rule read three times: a wall is one step off its floor, and
  // which direction "off" means depends on which side of the floor it is.
  //
  // ── AND BACK TO `--indigo-9` (2026-08-08, user ask: the board's inner
  // borders) ────────────────────────────────────────────────────────────────
  // The fourth setting, and the walk closes where it started. What makes it
  // hold this time is that the FLOORS moved out from under it in the same
  // sitting: the two rooms state their own tones now (`--brown-1` talk,
  // `--indigo-9` lens) and the lane keeps `--grey-4`, so a -9 wall has three
  // pale surfaces to draw on instead of the dark body that made it invisible
  // on the first pass. The rule the walk was testing survives — a wall is one
  // step off its floor — it is just that "off" is now a long way DOWN from
  // three light floors rather than a hair up from one dark one.
  //
  // ⚠ AND THE THREE DIALS ARE ONE AGAIN: `--lens-rim` went -9 on its own an
  // ask earlier and `--fhead-chat-rim` follows this one, so every line inside
  // the board — the five walls AND the three control rims — is a single mark
  // at two gauges (2px walls, 2px control rims, 1px on the smaller slotted
  // chrome). Nothing tells a control from a wall by INK any more; what does
  // it is the face each is drawn on, islands vs floor.
  //
  // ⚠ WHERE IT STOPS DRAWING, by design and worth knowing before hunting for
  // a missing border: against the LENS section (its floor is this tone) and
  // against the lane's two KEYS (their plates are). Those two walls state
  // their division by the meeting of two materials instead of by a line. The
  // handle's FOOT is the third — the header plate landed on this same tone in
  // the same sitting. So three of the five walls state their division by the
  // meeting of two materials instead of by a line. The two that draw outright
  // are the ones with a pale room on at least one side: the talk/lens rule
  // against `--brown-1`, and the lane's top edge against `--grey-4`.
  --fhead-rule: var(--indigo-8, #303f9f);
  // THE INNER HAIRLINES ARE 2px SINCE 2026-08-07 (user ask: "make the inner
  // hairlines … slightly thicker and color them indigo-9" — the tone was
  // already -9 and is restated here as the settled answer, not a change).
  //
  // This dial draws the FIVE lines that divide the board into its rooms: the
  // handle's foot, the rule between the composer and the lens row, the lane's
  // top edge, and the two inside the lane (the broom's key and the trash's
  // left edge). It does NOT draw the control RIMS — the field, the reply line,
  // the send button and the slotted lens plates all keep their 1px, and that
  // is the point of the split: at one weight the box was a grid of equal
  // lines, and you could not tell the walls from the furniture. Two weights
  // and one ink says which is which.
  //
  // 2px is also the box's OUTER top edge's weight. That is deliberate — the
  // frame and the walls are the same gauge in two tones (-7 outside, -9
  // inside), which is the reading the three-step scale below already states.
  --fhead-rule-w: 2px;
  // ── THE BOARD'S ROOM RADIUS (2026-08-08) ────────────────────────────────
  // ONE dial for the box's three `--brown-1` containers — the talk room and
  // the lane's two chip trays — with `FeedStream.vue`'s label bar taking the
  // same `--radius-sm` from the platform scale, so the four curve as one
  // decision across two files.
  //
  // ⚠ THIS IS THE SECOND ATTEMPT, and the first is why it works. Round one
  // (three containers, then the talk room's right corners) was REVERTED on
  // sight: the containers were curving against `--grey-4` — the box's own
  // face, showing through in every corner — so each curve opened a pale notch
  // and the board read as a tray of loose tiles. The user's own rule fixed it:
  // whatever lies BEHIND a rounded container is painted `--indigo-9`, so the
  // corner opens onto the board's structural ink and the curve reads as the
  // container ending rather than as a gap. That took the BODY and the LANE to
  // -9 (below) — the label bar already had the lens section's -9 behind it.
  //
  // It is the platform's SMALL radius, deliberately not the composer's 12px:
  // the bubble is the one object on this surface that is a BUBBLE, and a room
  // curving as hard as the thing standing in it would take that reading away.
  --fhead-room-r: var(--radius-sm, 7px);
  // THE TALK ROOM TAKES A LITTLE MORE (2026-08-08, two user asks a few apart)
  // — `+ 6px`, so 13px against the trays' and the label bar's 7; it spent the
  // asks between them at `+ 3` / 10px. 13 is also where the CONCENTRIC answer
  // lives, which is why it settles well: the bubble inside is 12px and the
  // room holds it off by 2px top and bottom, 3px left and right, so a room
  // curving at 14/15 would be exactly parallel to it — 13 is a hair inside
  // that and reads as parallel, where 10 read as the room cutting across the
  // bubble's own corner. Stated off the same dial
  // rather than as its own number: the four containers are one decision and
  // this is a modifier on it, so a change to the board's corner still moves
  // all four together. The room is the biggest of them by an order of size
  // and the only one holding an object with a corner of its own — the
  // composer's 12px bubble — so a 7px room around a 12px bubble read as the
  // room being the tighter shape, which is backwards.
  --fhead-talk-r: calc(var(--fhead-room-r) + 6px);
  // ── THE ROOM RIM (2026-08-08, user ask: thin `--indigo-7` borders on the
  // brown-1 rounded containers) ─────────────────────────────────────────────
  // One line for all four — the talk room, the lane's two trays and (through
  // the platform token, in `FeedStream.vue`) the label bar. `--indigo-7` is
  // the box's OWN FRAME (`--fhead-rim`), so the containers are outlined in
  // exactly the ink the board's outer edge is drawn in: the same object at two
  // scales, which is why this level and not the -9 everything structural wears.
  // A -9 rim would have made each container read as another wall.
  //
  // 1px, the thinnest the surface draws, because these are OUTLINES on panels
  // that already separate by tone — the rim states the shape's edge and the
  // rounded corner does the rest. ⚠ The composer inside the talk room keeps
  // its own `--indigo-5` 1px rim: container deeper, object lighter, which is
  // the order the box reads in everywhere else.
  --fhead-room-rim: var(--indigo-6, #3f51b5);
  --fhead-room-rim-w: 1px;
  // ── THE POST GUTTER (2026-08-08, user ask: "a little `--indigo-9` padding
  // between the frieze bars and the content") ──────────────────────────────
  // `.feed-head__inner` already gives each side the sweep's reach plus a
  // post's width, so nothing can run UNDER a post; that inset is clearance,
  // and it shows the box's `--grey-4` face. This is the gap the ask asks for
  // on top of it — 3px of the board's own structural ink between each post
  // and the rooms, so the content stops short of the frieze instead of
  // arriving flush against it.
  //
  // ⚠ WHERE IT IS APPLIED, and why not on `.feed-head__inner`: that element's
  // box spans the FULL width — its padding IS the clearance — so painting it
  // would paint the flare and post area too, over the box's face. The two
  // bands that are already `--indigo-9` take it instead (`__body`, `__lane`),
  // where extra padding simply widens ink that is already there. The HEADER
  // needs none: it is a -9 plate spanning the same width, and its own
  // `0 8px` already holds its grip and count off the ends.
  --fhead-gutter: 3px;
  // ── THE LANE'S OWN TOP RULE — and it DRAWS now (2026-08-08, user ask: a
  // thin `--indigo-7` hairline between the lane and the filter section) ─────
  // It left `--fhead-rule-w` (2px, the box's walls) for 4px when it was asked
  // to be thicker, and comes back to **1px in `--indigo-7`** now that it has
  // been asked to be a LINE. Those two asks are one story: at 4px it was still
  // `--indigo-9` between an `--indigo-9` body and an `--indigo-9` lane, so
  // thickness was the only thing it could spend — what you saw was a wider
  // dark band, never a rule. Given an ink that contrasts, a hairline says the
  // same division in a quarter of the space, which is why the width goes back
  // down in the same move.
  //
  // It joins the board's other visible lines exactly: the header's foot rule
  // and the four container rims are `--indigo-7` at 1px too, so every line on
  // this board that can be seen is one ink at one weight, and the `--indigo-9`
  // walls are the ones that state a division by a plate ending instead.
  --fhead-lane-rule-w: 1px;
  --fhead-lane-rule: var(--indigo-6, #3f51b5);
  // The header's foot — see `.feed-head__bar`. It left `--fhead-rule` when it
  // was asked to be painted, since the box's other three walls had no reason
  // to become visible with it.
  --fhead-bar-rule: var(--indigo-6, #3f51b5);
  // 1px, the CONTAINER RIMS' gauge and not the walls' 2px — see the note on
  // `.feed-head__bar`. A visible line in the rims' ink should be at the rims'
  // weight; it is `--fhead-room-rim-w`'s twin in every way but the name (they
  // are kept apart because one is a rule between sections and the other is an
  // outline around a panel, and either could be asked for alone).
  --fhead-bar-rule-w: 1px;
  // ── THE HANDLE IS THE ONE EXCEPTION (2026-08-07, user ask: "the inner header
  // … background indigo-8 and its text grey-3"). Everything else in the box is
  // ink on the plate's own face; the handle is a PLATED band — `--indigo-8`
  // under `--grey-3` writing, which INVERTS the three-step reading above for
  // this one row.
  //
  // -8 was not a new tone when it was asked for: it was exactly what the two
  // inner frieze posts were plated in, and the handle runs BETWEEN them (it
  // sits inside `.feed-head__inner`'s inset, not edge to edge), so the band
  // landed post to post and the three read as one dark cap. The posts went -9
  // in the ask after, which leaves this level to the handle ALONE — the band
  // now sits one step lighter than the posts it lands on and one step deeper
  // than the -7 frame above it, so the cap is a band between two lines rather
  // than a continuation of either.
  //
  // The writing has to leave the colorway for it: -9 marks on an -8 plate are
  // one step apart and would go dark-on-dark. `--grey-3` is the same pale step
  // the box lifts to when it is HELD, so the handle is written in the tone of
  // the box's own lit state — and the grip keeps its 0.75 opacity, which on
  // this plate is what separates a control at the edge from the title.
  //
  // Knock-on kept in step: the FOCUS RING follows the writing (it was
  // `--fhead-ink`, and a -9 ring on an -8 plate is an invisible one — the
  // keyboard's way in has to be visible, which is the whole reason that rule
  // exists). The band's own bottom RULE stays `--fhead-rule`: it draws almost
  // nothing against -8 now, but the plate change states the division on its
  // own, and the rule is one of the three that move together as a set.
  //
  // ── THE PLATE IS `--indigo-9` AND THE WRITING IS `--brown-1` SINCE
  // 2026-08-08 (user ask; one pass at -10 under `--brown-2` came first and
  // the pair moved up together) ────────────────────────────────────────────
  // THE BOX IS DOWN TO TWO MATERIALS. `--indigo-9` is now the header plate,
  // the five walls, the three control rims, the two inner posts, the lens
  // room and the box's own bottom edge — every structural mark on the board
  // is one ink — and `--brown-1` is the warm pale answer to it: this writing,
  // the lens buttons' marks, the lane keys' glyphs, AND the talk room's own
  // floor. Header writing and chat room are the same tone, which is the tie
  // the -10/-2 pass could not make: there the cap was a lid the rest of the
  // box lived under, and here it is the same plate as everything else, laid
  // across the top. Deep indigo plates, warm pale marks, and the neutrals
  // (`--grey-4` lane, `--grey-3` control floors) left to do the rooms.
  //
  // `--grey-3` was chosen as the pale step the box lifts to when HELD — a
  // true argument that this ask retires, since the warm family is now the
  // one thing every mark in the box belongs to.
  //
  // MEASURED 8.8:1, the highest contrast on the surface, and higher than both
  // the -8/-3 band it replaces and the -10/-2 pass between them.
  //
  // ⚠ KNOCK-ON: the handle's own foot rule is `--fhead-rule`, now the same -9
  // as this plate, so it stops drawing entirely. The division under the cap is
  // stated by the plate ending, not by a line — which is what the -8 era's
  // note predicted would happen if the two ever met, and they have.
  //
  // ⚠ ONE DIAL, FOUR PLACES, TWO FILES: the title and grip here, and through
  // the slot the COUNT and the SORT button in `FeedStream.vue` (which keep
  // `--grey-3` fallbacks for anywhere else they might be slotted). The focus
  // ring follows it by reading the same dial, so it stays visible for free.
  --fhead-bar-face: var(--indigo-8, #303f9f);
  --fhead-bar-ink: var(--brown-1, #efebe9);
  // The fillets' sweep radius (`FLARE` in the script) and the width of the two
  // inner posts. Both are read by them below — the first for where they stand,
  // the second for how far the content insets past them — so they are named
  // once here instead of being restated.
  //
  // ── THE POST WIDTH IS A FIXED **13px** SINCE 2026-08-22 (was 15px from
  // 2026-08-21; user ask: the posts "slightly thinner … just make sure the
  // pattern is not deformated … a little denser") ──────────────────────────
  // Both settings answer the SAME complaint from opposite sides — 08-21's
  // "poorly rendered … I do not see the full svg pattern" and 08-07's
  // "thinned horribly … the pattern looks distorted". The 08-07 fix
  // (`0.6 × --frieze-h + 2px`) bought the mask rows back above the ~0.7px
  // legibility floor, but any vh-derived width leaves them FRACTIONAL —
  // ~0.85px a row, every stroke anti-aliased soft and the motif's centre line
  // drowning at some window heights. The cure was the pixel grid, not more
  // width, and it still is: the posts dial `--frieze-bar-v-fit: 13px auto`
  // below — the mask at its NATURAL 1px per column over an **11px layer**,
  // centred so its two EMPTY edge columns overhang exactly (13/11 is slim's
  // own `117%`, in whole pixels), the ink filling the layer edge to edge and
  // the tile landing at a clean 13×21. Nothing squeezes at ANY window size,
  // minimized or maximized — a fixed-px motif no longer follows the viewport,
  // which is the point: the board's posts are drawings, not bands.
  //
  // ⚠ IT GOT THERE IN TWO PASSES THE SAME DAY, AND THE SECOND ONE REVERSED
  // THE FIRST'S TRADE. Both kept the post at 13px; what moved is WHO PAYS.
  //
  //     15px = 1px rim + 1px pad + 11px layer + 1px pad + 1px rim   (08-21)
  //     13px = 1px rim +           11px layer +           1px rim   (08-22 a)
  //     13px = 1px rim + 1px pad +  9px layer + 1px pad + 1px rim   (08-22 b)
  //
  // PASS (a) took the 2px off the CHROME and kept the drawing pixel-exact:
  // at a fixed fit the pad's dark margin is already inside the mask (columns
  // 0 and 12 of `mercury-wave-{a,b}-rot90.svg` carry no white cells), so the
  // pad was a second margin paid twice and `--frieze-bar-v-pad: 0` collected
  // it. Same layer, same mask, same 1px cell — 11/15 of the bar became 11/13.
  //
  // PASS (b) is the user's correction, and it is the one standing: "regresa
  // el poquito de padding que había en los costados … y trata de comprimir
  // los frisos un poco. No importa si se deforman un poco en detalle, como
  // en la barra indigo-cyan debajo del header de las post cards." So the pad
  // comes BACK, the 2px comes out of the LAYER instead, and the motif is
  // SQUEEZED to fit — the fixed `13px auto` fit is gone and slim's own
  // `117%` takes over, which is exactly the device the cited bar uses
  // (`.media-tabs__frieze` states a thickness and lets the percentage fit
  // follow). 117% of a 9px layer is 10.53px over 13 columns = ~0.81px a
  // column, so the strokes are sub-pixel and soft again — DELIBERATELY, and
  // with the ask's blessing. The pixel grid was never the goal; it was the
  // answer to a complaint about legibility, and a different complaint now
  // outranks it.
  //
  // ⚠ SO THE 08-21 ARITHMETIC IS SUSPENDED, NOT WRONG. Everything it says
  // about the 13-column grid still holds and is how to get back: state
  // `--frieze-bar-v-fit: 13px auto` and `--frieze-bar-v-pad: 0` together and
  // the post is pixel-drawn again at this same 13px. Keep BOTH numbers in
  // mind — the fit needs an 11px layer, and only the padless post has one.
  //
  // What the pad buys back is the SIDE BORDERS (user ask, same pass: "ponle
  // un borde delgado a los costados … indigo-8"). The 1px `--indigo-8` rims
  // below have been there since 2026-08-07, but pass (a) left them with the
  // motif's ink running straight into them and they stopped reading as a
  // border at all — a line is only a line if something sits either side of
  // it. The 1px of `--indigo-10` plaque the pad restores is that something.
  //
  // Still stated as its own dial (`--frieze-bar-v-slim-w` on the posts below)
  // rather than as `--frieze-bar-v-w`, which the component's own slim rule
  // also sets on the same element — two scoped rules of equal specificity,
  // decided by bundle order, which is not a contract.
  --fhead-flare: 11px;
  --fhead-post-w: 13px;

  position: absolute;
  left: 0;
  right: 0;
  // Over the well and its cards; the flyout (3002) and every fixed band are
  // in other stacking contexts and unaffected.
  z-index: 2;
  background: var(--fhead-face);
  border-top: var(--fhead-rim-w) solid var(--fhead-rim);
  border-bottom: var(--fhead-rim-w-b) solid var(--fhead-rim-b);
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
// ⚠ THE FACE NO LONGER MOVES WHEN HELD (2026-08-24, user ask: "make sure when
// the board is hovered, it remains in that color"). This state carried a
// `--fhead-face` step for as long as the box has been draggable — `--grey-3`
// off a `--grey-4` face, then `--grey-2` for the hour the face was cream — and
// the ask ends it: the face is `--indigo-6` at rest and at every moment of a
// drag. So the state is stated by DEPTH ALONE now, which the two shadows below
// already did most of the work of; what is gone is the tonal half.
//
// ⚠ ONE CONSEQUENCE WORTH KNOWING BEFORE ANYONE "RESTORES" IT: the four corner
// fillets read `--fhead-face`, so a face that changes while held repaints four
// gradients mid-gesture. Holding the face still is therefore the cheaper
// arrangement as well as the asked-for one — and the note further down that
// explains why `.feed-head__body` STATES its tone rather than reading
// `--fhead-face` (so the lift would not flatten the controls into the plate)
// describes a hazard that no longer exists. Left standing as history.
.feed-head.is-grabbed {
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
    transparent 9.2px, var(--fhead-rim-b) 9.8px,
    var(--fhead-rim-b) 12.2px, var(--fhead-face) 12.8px);
}

.feed-head__flare--br {
  right: 0;
  bottom: -14px;
  height: 14px;
  background: radial-gradient(circle at 0 12.5px,
    transparent 9.2px, var(--fhead-rim-b) 9.8px,
    var(--fhead-rim-b) 12.2px, var(--fhead-face) 12.8px);
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
  // The slim variant's width, dialled — ONE number with the inset math above,
  // which is why it reads `--fhead-post-w` rather than restating the calc.
  --frieze-bar-v-slim-w: var(--fhead-post-w);
  // ── SQUEEZED, NOT PIXEL-DRAWN (2026-08-22's second pass, user ask: "trata
  // de comprimir los frisos un poco. No importa si se deforman un poco en
  // detalle, como en la barra indigo-cyan debajo del header de las post
  // cards") ─────────────────────────────────────────────────────────────────
  // NO `--frieze-bar-v-fit` HERE ANY MORE, and its absence is the setting:
  // slim's own `117% auto` takes the layer, which is the device the cited
  // bar uses (`.media-tabs__frieze` states `--frieze-bar-h` and lets the
  // percentage fit follow). Over the 9px layer the pad leaves, that is
  // 10.53px across 13 columns — ~0.81px a column, sub-pixel and soft. The
  // 08-21 pass spent the whole post on getting those columns onto whole
  // pixels; this ask trades that back for a denser mark and says so.
  // ⚠ The pixel-drawn recipe is one line away and needs the pad gone WITH
  // it: `--frieze-bar-v-fit: 13px auto` + `--frieze-bar-v-pad: 0` (the fit
  // wants an 11px layer). See `--fhead-post-w` for the full arithmetic.
  //
  // The carve STAYS OFF, and now for a stronger reason than in 08-21: its
  // black/white flanks were "poorly rendered" around whole-pixel strokes,
  // and around 0.81px ones they would be most of what you see. The brown-2
  // motif on the -10 plate reads by its own contrast (Material 800 under a
  // 50) and needs no groove.
  --frieze-bar-v-carve: none;
  // `--indigo-9` SINCE 2026-08-07 (user ask, the same pass that thickened the
  // inner rules and stated their ink). The two posts and the five hairlines
  // are now ONE TONE: everything the box draws INSIDE itself is -9, and the
  // frame around it is -7. The three-step scale below collapses to two, on
  // purpose — the posts were the middle step, and a wall and the post it runs
  // into reading as one mark is what makes the inside of the box a single
  // structure rather than a frame within a frame.
  // (The plaque walked -10 → -9 → -8 → here on the way. The lip travels with
  // it by rule — a slim inner bar has content on both sides and nothing to
  // state an edge against, so the lip is dialled to the plaque and draws
  // nothing; leaving it at -8 would have left a line the device exists not to
  // draw.)
  // ── AND `--indigo-10` UNDER `--brown-2` SINCE 2026-08-08 (user ask) ─────
  // The posts leave the box's one structural ink and take the step BELOW it,
  // which makes them the deepest thing on the board — deeper than the header
  // plate, the walls, the lens room and the bottom edge, all -9. That is a
  // real change of role: for one day the posts and the walls were ONE mark
  // (the note above is that argument), and the pair now reads as the FRAME'S
  // material rather than as more of the interior's — which is what they
  // physically are, two columns holding the box's sides.
  //
  // The motif steps with the plaque, `--brown-1` -> `--brown-2`, so the carve
  // keeps its footing: -2 is the warm family's next step down and measures
  // 8.3:1 on this plaque, deep enough to read at 11px. ⚠ BOTH WAVE LAYERS
  // take the same tone, as they have since these posts were built — the motif
  // here is one flat colour and the relief comes from the carve, not from a
  // lit/dark pair. Set only one and the bar grows a second colour it has
  // never had.
  //
  // ⚠ KNOCK-ON, left standing on purpose: the side rims below are `--indigo-8`
  // and were argued as "one step lighter than what it rims". Against -10 they
  // are TWO steps lighter, so they read more strongly than they did — which
  // suits a post that is now the darkest object in the box, and -8 is still
  // the one indigo the interior does not otherwise use. Moving them to -9
  // would put the rim on the body's own tone and it would vanish where the
  // two meet.
  // ⚠ THE MOTIF IS `--light-cream` SINCE 2026-08-24 (user ask: "for the inner
  // frieze bar, paint the brown-2 friezes light-cream"), on the same
  // `--indigo-10` plate. It walked `--brown-1` → `--brown-2` (2026-08-08) and
  // now leaves the brown family altogether for the platform's WARM SHEET — the
  // tone this box's face and its talk half took in the same sitting, so the
  // board's edges are cut from the same material as its rooms rather than from
  // a family of their own. It is also a LIFT: #FCF3E0 (242) against brown-2's
  // 188 on an indigo-10 plate, so the motif reads where it used to be texture.
  --frieze-bar-v-base: var(--indigo-9, #283593);
  --frieze-bar-v-wave-one: var(--light-cream, #FCF3E0);
  --frieze-bar-v-wave-two: var(--light-cream, #FCF3E0);
  // ── BOTH SIDE EDGES, 1px `--indigo-8` (2026-08-07, user ask) ─────────────
  // `slim` cancels the full bar's side rims by default (`--frieze-bar-v-edge-w:
  // 0`) because at 9px every pixel of chrome comes out of the motif; the
  // component names this dial as the way back, and this is the host taking it.
  // The width above pays for it so the pattern does not — and since
  // 2026-08-22's second pass the MOTIF pays for it: the post is 13px, the
  // pad is back at 1px a side, and the 2px came out of the layer (11 → 9),
  // which is why the motif is squeezed rather than pixel-drawn. That is the
  // trade the ask chose, and it is the trade that makes these rims read:
  // the pad puts 1px of `--indigo-10` plaque between each rim and the
  // motif's ink, and without it (the pass before) the ink ran straight into
  // the rim and the border stopped being visible as a border — which is what
  // "ponle un borde delgado a los costados" was asking for. The tone was
  // already `--indigo-8` and stays; only the ground beside it came back.
  //
  // BOTH edges means BOTH DIALS. The component draws the two long edges from
  // `--frieze-bar-v-edge`, then overrides the INWARD one from
  // `--frieze-bar-v-lip` — which has been dialled to the plaque here since the
  // posts were built, precisely so it draws nothing. Setting only the first
  // would have given each post one visible edge and one invisible one, and the
  // pair would have read as two bars leaning outward. So the lip leaves the
  // plaque and takes the rim's tone: it is a real line again, for the first
  // time on these two posts.
  //
  // -8 is the one indigo the box's interior does not already use: the plaque
  // under it is -9 and so are the five walls, so a rim in either of those
  // would be a border you cannot see. One step lighter than what it rims is
  // the smallest mark that still reads — a highlight on a dark post, not a
  // line drawn around it.
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-edge: var(--indigo-7, #3949ab);
  --frieze-bar-v-lip: var(--indigo-7, #3949ab);
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
//
// PLATED since 2026-08-07 (user ask) — see `--fhead-bar-face`/`-ink` above for
// the tones and why the writing leaves the colorway. Note the plate does NOT
// follow `.is-grabbed`: the box's face lights one step while held, the handle
// stays put, so the lift reads across the BODY with the cap holding still.
.feed-head__bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--fhead-bar-face);
  // 18px (was 22) — the compression pass took every band in this box down to
  // what its contents actually need, and a 14px grip in an 18px bar still
  // leaves the 44px-wide grab target a drag handle wants.
  height: 18px;
  // ── FLUSH TO THE POSTS (2026-08-08, user ask) ────────────────────────────
  // 0, from `0 8px`. MEASURED before: the left post ends at x=120 and the bar
  // begins there, but the GRIP began at 128 and the sort button ended at 712
  // against a right post starting at 720 — 8px of ghost space at each end,
  // reading as a misalignment rather than as breathing room, since the bar's
  // own plate runs right up to the frieze on both sides and only its contents
  // stopped short.
  //
  // ⚠ This band is deliberately NOT on `--fhead-gutter` like the body and the
  // lane. Those two hold outlined CONTAINERS, which need a field of daylight
  // around them; this one holds two bare marks on a plate that is itself the
  // full width, and a mark that starts where its plate starts is aligned —
  // the gutter would put the ghost space back under a better name.
  padding: 0;
  // ── THE LINE UNDER THE HEADER IS `--indigo-7` (2026-08-08, user ask) ─────
  // The one wall in the box that now DRAWS. It was `--fhead-rule`
  // (`--indigo-9`) between an `--indigo-9` plate and an `--indigo-9` body, so
  // it drew nothing and the division was stated by the header's plate simply
  // ending — which was true but silent. In `--indigo-7` it is a real rule, and
  // in the same ink as the four container rims below it, so the board's one
  // visible horizontal line belongs to the same hand as its outlines rather
  // than introducing a fifth tone.
  //
  // ⚠ AND 1px SINCE THE ASK AFTER (user: thinner) — it left the walls' 2px
  // gauge the moment it stopped being an invisible wall. Painting it made it
  // the only horizontal rule you can see in the box, and at the walls' weight
  // a visible line reads as heavier than the four container rims it shares its
  // ink with. At 1px it IS one of them: same tone, same weight, one hand for
  // every line drawn against the board's `--indigo-9` field. The width is its
  // own dial now, since it follows the RIMS and not the walls.
  // ⚠ The MANUAL band's rule (the lane's heir since 2026-08-21) is this same
  // 1px `--indigo-7` through `--fhead-lane-rule` — the two visible section
  // rules are a pair on purpose.
  border-bottom: var(--fhead-bar-rule-w) solid var(--fhead-bar-rule);
  cursor: grab;
  user-select: none;
  touch-action: none;

  .feed-head.is-grabbed & { cursor: grabbing; }

  // The keyboard's way in has to be visible — which is why this ring reads the
  // BAR's ink and not the box's: the band is plated now, and the box's -9 mark
  // on an -8 plate would be a ring you cannot see.
  &:focus-visible {
    outline: 2px solid var(--fhead-bar-ink);
    outline-offset: -2px;
  }
}

.feed-head__grip {
  flex: 0 0 auto;
  color: var(--fhead-bar-ink);
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
  color: var(--fhead-bar-ink);
}

// THE BAR'S RIGHT END (2026-08-07, user asks) — the sort control and the count,
// pinned there by an auto margin, which is the only way to pin anything against
// an absolutely centred title: the title is out of the flow, so the flex row is
// grip + this, and `margin-left: auto` eats everything between them.
//
// `position: relative` is NOT tidiness. The title is absolutely positioned and
// therefore paints above every static sibling regardless of order; a cluster
// that ran long would slide UNDER the centred word. Positioned and later in the
// DOM, it paints on top instead. (It cannot be given `z-index` without the same
// change, which is the trap: `z-index` does nothing on a static element.)
//
// The BAR's ink is published from here, so everything slotted in — the sort
// button and the count alike — is written in `--grey-3` against the plate
// without either having to name it.
.feed-head__bar-end {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  // 7px, from 5: the pair is divided by a LINE now (see below), and a rule
  // needs the same air on both sides of it that the two marks used to share
  // between them.
  gap: 7px;
  color: var(--fhead-bar-ink);
}

// ── THE HAIRLINE BETWEEN THE COUNT AND THE SORT (2026-08-08, user ask) ────
// `--indigo-7` at 1px — the board's line ink and its line weight, the same
// mark the four container rims and the rule under this header are drawn in.
// It divides a READING from a CONTROL: the number on the left says how many
// posts the box is under, the glyph on the right orders them, and until now
// the only thing separating them was 5px of plate.
//
// It is declared HERE and not on `.feed-stream__sort`, even though that
// button is the element it lands on, for the reason the rest of this bar is
// the box's: the sort control is SLOTTED IN by FeedStream, so which side of
// it carries a divider is a fact about this HEADER's arrangement, not about
// the button — swap the slot's contents and the line still belongs between
// the two things in the cluster. ⚠ It is a `:deep()` reach into a slotted
// child, which is exactly what that selector is for; `.feed-stream__sort`
// itself states `border: 0` (it lost its outline in an earlier ask) and this
// rule only re-adds the ONE edge that is a divider rather than an outline.
.feed-head__bar-end :deep(.feed-stream__sort) {
  border-left: 1px solid var(--indigo-6, #3f51b5);
  // The glyph would sit 0.5px left of centre inside a box whose left edge is
  // now a border; the padding hands that pixel back so the mark stays on the
  // button's own centreline.
  padding-left: 1px;
}

.feed-head__count {
  display: flex;
  align-items: center;
}

// ── THE BODY, IN TWO HALVES ─────────────────────────────────────────
// Split down the middle by one `--indigo-4` rule — the same ink and the same
// weight as the byline's vertical rule on a post card, since this is the same
// division: two things standing side by side inside one object.
.feed-head__body {
  // ── THE BODY IS PLATED `--indigo-9` (2026-08-07, user ask: "make the chat
  // and filter button section's background color indigo-9") ───────────────
  // Both halves at once — at the time neither half declared a floor of its
  // own, so this one declaration was the whole section (BOTH state one now;
  // see the ⚠ at the foot of this comment) — and the box then read as three
  // BANDS rather than one plate with a plated cap: `--indigo-8` handle,
  // `--indigo-9` body, `--grey-4` lane, deepest in the middle. The controls
  // are the only light things left in it, which is the point of a dark body:
  // the field and the two lens bars keep their `--grey-1` faces, so what the
  // eye lands on is the things you can type into and press.
  //
  // Two knock-ons, both wanted:
  //  · the body's OWN walls stop drawing. `--fhead-rule` is `--indigo-9`, so
  //    the rule between the halves and the one under the handle are now the
  //    floor's own tone. Nothing is lost — the division is stated by the gap
  //    between two 2px `--indigo-8` control blocks, which is a stronger mark
  //    than the hairline was. (They are LEFT in place rather than deleted:
  //    they are the same set of five the lane's keys belong to, and a wall
  //    that draws nothing against its floor is this surface's normal way of
  //    saying "no line here" — the frieze bars' lips do exactly that.)
  //  · the seat's LIVENESS DOT is ringed in `--fhead-face`, the box's grey.
  //    On this floor that ring is now a light halo around a green dot rather
  //    than a cut-out of the plate — which reads correctly, so it stays.
  //
  // `--grey-4` since the last ask — the PLATE'S OWN TONE, which is where this
  // section started before the two dark settings (-9, then -7) that stood for
  // one ask each. So the box is a light plate with ONE plated band across its
  // top: `--indigo-8` handle, `--grey-4` body, `--grey-4` lane. The colorway
  // is spent entirely on lines and marks again, and the controls read as light
  // objects on a light plate separated by their rims — which is the same
  // argument the box's own face makes against the container.
  //
  // ⚠ STATED, not `var(--fhead-face)`, even though they are the same tone
  // today. The face LIFTS one step to `--grey-3` while the box is held, and
  // `--grey-3` is exactly what the composer and the two lens bars are floored
  // in — so a body reading the face would rise to meet its own controls on
  // every drag and flatten them into the plate for as long as the grab lasts.
  // The step between floor and control is worth more here than the lift is.
  //
  // ⚠ AND IT IS `--indigo-9` NOW, WHICH IS A DIFFERENT JOB. Both halves state
  // a floor of their own (`--indigo-9` lens, `--brown-1` talk) and both
  // stretch to the body's full height, so this declaration stopped being the
  // section's floor the moment they landed — it is the BACKDROP the two rooms
  // lie on. What made it matter again is the ROUNDING: the talk room's corners
  // open onto this tone, and at `--grey-4` each corner was a pale notch, which
  // is what made the first rounding pass read as loose tiles. At -9 the
  // corners open onto the board's own structural ink and the curve reads as
  // the room ending.
  //
  // So the reasoning below is HISTORY — it was written when this line was the
  // floor you actually saw, and it is kept because the floor-versus-control
  // argument still governs anything laid on this box. `--grey-4` is what to
  // come back to if the rooms are ever unpainted and the body reads as one
  // plate again; at that point the rounding has to go with it.
  background: var(--indigo-8, #303f9f);
  // The post gutter — see `--fhead-gutter`. It is this band's own ink widened,
  // not a new mark: the two rooms simply stop 3px short of each post.
  //
  // ── AND ON THE TOP EDGE (2026-08-08, user ask) ───────────────────────────
  // The same 3px above both rooms, so the pair sitting in this row has daylight
  // between it and the HEADER. It is one declaration because it is one
  // relation: the chat container and the manual-filter containers share this
  // band, so they should meet the header at the same line — a `padding-top` on
  // either half alone would have made the two rooms start at different heights
  // and turned a gutter into a misalignment.
  //
  // ⚠ AND ON THE BOTTOM SINCE THE LANE'S RULE BECAME A HAIRLINE (2026-08-08,
  // user ask: `--indigo-9` padding up and down the new line). It was TOP ONLY
  // while that rule was a 4px `--indigo-9` band — a gutter beside a gutter
  // would have been two ways of saying the same nothing — but a 1px
  // `--indigo-7` line IS a line, and a line wants daylight on both sides or it
  // reads as an edge of whatever it touches. This is the upper half of that
  // daylight; the MANUAL band's own `padding-top` (the lane's heir) is the
  // lower half when the workbench is open.
  // ⚠ The box pays for both — unlike the header and the manual band, this
  // band has no stated height to absorb it.
  padding: var(--fhead-gutter);
  display: flex;
  align-items: stretch;
  min-width: 0;
}

// THEY ARE NOT HALVES ANY MORE (2026-08-07, user ask: "make the buttons
// section occupy the space they need horizontally, and then let's make the
// chat section occupy the available remaining space"). The class name is kept
// — it is what every rule and the docs call these two — but the split is no
// longer 50/50.
//
// The right side is a row of FIXED objects: five plates and a count, each as
// wide as its glyph and its mark. It has a natural width, and half a box was
// never it — at 45% of the track that row sat in ~150px of space needing ~138,
// scrolling sideways when a lens printed a longer word while the composer next
// to it had the same 150px for a sentence. So the LENS side hugs (`0 1 auto` —
// max-content, no growing) and the TALK side springs (`1 1 0` — a zero basis,
// so it takes every pixel left rather than starting from its content and
// negotiating). The two flex rules are one decision.
//
// MEASURED at 45% of a 1440px track: body 532 = talk 347 + lens 185, and the
// controls row (173 + 12 of padding) no longer scrolls at all. What that costs
// is the narrow end: the talk side is the only flexible one AND it is
// `min-width: 0`, so it absorbs every pixel of shrink and the lens row holds
// its 185 all the way down (at a 900px window: talk 123, lens 185). That is
// the priority the ask states — the buttons get what they need, the chat gets
// what is left — and it is a change from the old 50/50, where a narrow box
// squeezed the controls into their scroller and left the field alone. If it
// ever needs a floor, the dial is a `min-width` on `--talk`, not a flex basis.
//
// TWO LINES TALL, since the composer became a textarea: the half's height is
// its content's now, not a stated row, so the band grows with the field and
// the box's measured height carries that up to the stream on its own.
.feed-head__half {
  min-width: 0;
  display: flex;
  gap: 5px;
  padding: 4px 6px;
}

// TOP-ALIGNED (user ask: the face "well aligned to the top left side of the
// section"). Everything in this half hangs from the top edge — the seat, and
// the composer that fills the rest of the width.
.feed-head__half--talk {
  flex: 1 1 0;
  align-items: flex-start;
  // ── THE CHAT SECTION IS PAINTED `--brown-1` (2026-08-08, user ask) ──────
  // The half states its OWN floor now, the way the lens half beside it has
  // since it went `--indigo-9` — the body's declaration is no longer the whole
  // section, it is the base the two rooms are laid on. And the pair it makes
  // with that neighbour is not a new pairing at all: `--indigo-9` plaque under
  // a `--brown-1` motif is EXACTLY what the box's two inner frieze posts wear,
  // and what its lane keys wear, and what the lens buttons three pixels away
  // are plated and marked in. The body's two rooms now state that same mapping
  // at ROOM scale — deep plaque one side, warm motif the other — so the box is
  // built of its own frieze material rather than of two floors picked apart.
  //
  // It is a WARM PALE bay, one step ABOVE the plate rather than below it:
  // measured 1.11:1 on the `--grey-4` body and lane, differing in HUE as much
  // as in value (R−B 6 against the neutrals' 0). The talk half is the one warm
  // thing in a box otherwise spent entirely on indigo and greys, which is what
  // separates it from the lens block beside it now that neither half needs the
  // wall between them to say where one room ends.
  //
  // ⚠ WHAT IT COSTS, measured: the composer and its reply line are floored in
  // `--grey-3` (#eeeeee) and this room is #efebe9 — 1.02:1, the same lightness
  // in two hues. The bubble no longer reads as an ISLAND on its floor; it is
  // stated by its 2px `--indigo-8` rim and by being cool against warm. That is
  // a real change of language in this half (the lens half is the opposite bet:
  // pale bars on the deepest floor in the box). If the bubble should stand up
  // by TONE again, the dial is `.feed-head__chat`'s own floor — go paler than
  // the room, not darker, since this room is already above the plate.
  //  · the seat's LIVENESS DOT, ringed in `--fhead-face`, is a faint 1.11:1
  //    halo here — better than the nothing it drew on the body's own tone.
  //
  // ⚠ STATED, not `var(--fhead-face)`, for the reason the body states its own:
  // the face LIFTS to `--grey-3` while the box is held, and a room that
  // followed it would go neutral for the length of every drag — the one thing
  // this floor is here to not be.
  // ── THE ROOM IS A CARVED PIT SINCE 2026-08-21 (user ask: the label
  // maker's "ahuevada" texture, brought to Talavero's bubble, profile photo
  // included, "con color brown-2 y sombras un poco más oscuras") ──────────
  // The recipe is `LabelSquares.vue`'s `.label-square__pit` — the label
  // maker's descendance well, the one concave surface on the platform: a
  // darkened floor under an `inset` top shade with a white lip at the foot,
  // which is what makes a box read as dug INTO the plate instead of lying on
  // it. Three changes tune it to this board:
  //  · the floor is `--brown-2` OUTRIGHT (the pit darkens by rgba over its
  //    parent; this room has the body's `--indigo-9` behind it, so the tone
  //    is stated instead) — one warm step below the `--brown-1` the room
  //    wore, the board posts' own motif tone;
  //  · the shadows run DARKER than the maker's (0.30 against its 0.14 base
  //    — "un poco más oscuras"), because this pit is one step deeper in
  //    tone and a shade calibrated for near-white would vanish on it;
  //  · the white lip drops to 0.4 for the same reason.
  // The whole room is the egg: the seat's porcelain face AND the bubble
  // stand INSIDE the carve, which is the ask's "toda la burbuja … incluida
  // su foto de perfil".
  // ── `--brown-1` SINCE 2026-08-22 (user ask: "para la sección con fondo
  // brown-2, píntala brown-1") ────────────────────────────────────────────
  // Back to the tone it wore before the carve arrived — the pit was given
  // `--brown-2` on 2026-08-21 only so its shadows had a deeper floor to bite
  // into. ⚠ THE BUBBLE INSIDE IT IS NOW THE SAME TONE (the same ask paints
  // both `--brown-1`), so floor and object no longer separate by tone AT
  // ALL — 1:1, not the 1.02:1 the note above measured. That is deliberate
  // and it moves the whole job onto two devices: the bubble's `--indigo-5`
  // rim, and its OWN carve, which runs opposite to this one (the room is a
  // pit, the bubble is a pit inside the pit — two concavities at different
  // depths). If the pair ever stops reading, the dial is the bubble's face,
  // and the direction is PALER than this floor, never darker: the room is
  // already the light thing in an `--indigo-9` body.
  //
  // ⚠ `--light-cream` SINCE 2026-08-24 (user ask: "please paint talavero's chat
  // section light-cream"). Every argument above holds unchanged — still the one
  // WARM room in a box spent on indigo and greys, still one step ABOVE the
  // plate rather than below it — and the tone only moves along the axis it was
  // already on: #efebe9 (236, R−B 6) → #FCF3E0 (242, R−B 28), paler and four
  // times as warm in one edit. ⚠ AND IT PAYS OFF THE COST RECORDED ABOVE: the
  // composer's `--grey-3` floor (238) sat at 1.02:1 on brown-1 — the same
  // lightness in two hues, which is why the bubble had to be stated by its rim
  // alone. Against cream it is a real step DOWN and cool against warm, so the
  // composer reads as sunk into the room for the first time.
  background: var(--light-cream, #FCF3E0);
  // ── THE CARVE IS GONE, AND THE RIM IS BACK (2026-08-22, user ask: "remueve
  // el efecto ahuevado de la seccion del chat de talavero, pero conserva el
  // efecto ahuevado de la burbuja del chat. también ponle bordes indigo-5 a
  // la seccion del chat") ────────────────────────────────────────────────────
  // The room held the pit for one day (2026-08-21) and gives it back. What
  // the ask settles is which of the two nested boxes gets to be concave, and
  // the answer is the SMALL one: two carves inside each other read as one
  // soft trough, and the bubble's — the object you actually type into — was
  // the one losing. So the room becomes a PANEL again and the bubble is the
  // only concave surface on the board.
  //
  // Which brings its outline back with it, and this is the 08-21 note below
  // reversing: "a pit is stated by its SHADOW — depth is the edge — and an
  // outline around a carve reads as a panel pretending to be a hole." Take
  // the carve away and that sentence argues the other way — with no shadow
  // to state it, a panel needs its line. `--indigo-5` is the ask's, and it
  // pairs the room with the bubble inside it (`--fhead-chat-rim`, the same
  // tone since the same day's earlier ask), so the two boxes are ONE line
  // system at two sizes. ⚠ That pairing is now a real dependency: move one
  // and the other looks like a mistake.
  border: 1px solid var(--indigo-4, #7986cb);
  // ROUNDED, all four corners (2026-08-08, second attempt — see
  // `--fhead-room-r`). The room is a warm panel in the body's `--indigo-9`
  // field — a PIT in it, since the carve — and the curve is what makes the
  // carve read as a basin rather than a trench.
  // A LITTLE MORE than its siblings (13px vs 7px): see `--fhead-talk-r` for
  // why the biggest container takes the bigger corner.
  border-radius: var(--fhead-talk-r);
  // (HISTORY: the room wore the four containers' 1px `--indigo-7` outline from
  // 2026-08-08, lost it on 2026-08-21 when it became a pit, and has an
  // `--indigo-5` one again since 2026-08-22 — see the border above. The
  // reasoning that took it away is kept there because it is what predicts
  // when it must come back.)
  // ── UNIFORM 3px SINCE 2026-08-22 (user ask: "comprímela alrededor de la
  // foto de perfil de talavero y de la burbuja del chat de manera que el
  // padding interno alrededor de la foto y la burbuja sea muy reducido y
  // uniforme") ────────────────────────────────────────────────────────────
  // ONE number on all four sides, from `4px 5px`. The room is a gasket
  // around its two objects now, not a panel they sit in.
  // ⚠ UNIFORM PADDING IS ONLY HALF OF "UNIFORM" — the other half is that the
  // two objects be the SAME HEIGHT, or the shorter one gets padding on top
  // and slack underneath. That is why the same ask sets `--fhead-chat-h` to
  // the face's 28px and why the seat column had to give up the 11px its
  // handle was adding: 3 + 28 + 3 = a 34px room with a 3px reveal on every
  // side of both objects. Change any one of those three numbers and the
  // other two are wrong.
  // (It was 4px/5px from the carve, 2px/3px before it. The old reason for
  // the extra top px still holds and is now paid by the 3: the inset shade
  // needs a little floor to fall on above the bubble, or the concavity is
  // invisible — the top 2-3px of the pit ARE the texture.)
  padding: 3px;
  // TIGHTER THAN ITS SIBLING (2026-08-08, user ask: less space between the
  // face and the bubble) — 2px against `.feed-head__half`'s 5. The gap was
  // set when the seat was a 36px face with a name beside it and the row
  // needed air to read as three things; it is a 28px face and a handle now,
  // one object, and the composer is the only thing it stands next to. The
  // room's own side padding is what keeps the pair off the walls, so
  // this number only has to say how close the seat and the field are.
  gap: 2px;
}

// ── THE MANUAL TOGGLE'S BERTH (2026-08-21, user ask) ────────────────────
// The lever stands where the LENS HALF stood (that half is gone — its
// controls live in the manual band below now): outside the talk room, on the
// body's `--indigo-9` backdrop, between the pit's right edge and the right
// frieze post. Which is the right ground for it twice over — the porcelain
// knob and `--brown-2` rail read on the structural ink exactly as the posts
// do, and a MODE control mounted on the frame says "this changes the board"
// where one inside the room would say "this asks Talavero something".
// `stretch` is what gives the vertical word its height and the knob its
// travel: the toggle is as tall as the talk band, whatever the bubble grows
// to.
.feed-head__toggle {
  flex: 0 0 auto;
  align-self: stretch;
  margin-left: var(--fhead-gutter);
}

// ── THE MANUAL BAND (2026-08-21, user ask) — the workbench ──────────────
// One row under the bubble holding everything hand-operated: the stream's
// controls (label search + lens bundle, through the slot) and the lane's
// four inherited pieces (active tray · broom · trash tray · bin). It is the
// old lens half and the old lane FUSED, on the lane's own ground: the
// `--indigo-9` band, the `--indigo-7` hairline above it (the lane's rule —
// the daylight argument at `--fhead-gutter` still governs: the body's
// `padding-bottom` is the upper half, this band's `padding-top` the lower),
// and the post gutter at the sides.
//
// `v-if`, so full-talavero mode pays NOTHING for it — the box is header +
// bubble and nothing else, which is the ask's "by default, we just want to
// have talavero". The height jump on toggle is carried by the existing
// `update:height` observer; see the template note for why the constant-
// height doctrine this retires no longer binds.
//
// STRETCH, so the trays, the keys and the slotted bars all take the band's
// one height — the mobile board learned in 2026-08-08 that two control bars
// left to size themselves land at 21 and 23 and nothing makes them agree.
.feed-head__manual {
  display: flex;
  align-items: stretch;
  gap: 4px;
  // STATED, like the lane's height always was, and for one extra reason: the
  // two KEYS are `height: 100%`, and a percentage against an auto-height
  // band resolves to nothing — Quasar's 1em would size the bin again (the
  // exact bug the lane's `height: 100%` rule was written against).
  // The chain: the lens bundle is the band's tallest fixed object at 21
  // (17px buttons + two 2px rims), the lane chain needs 19 for its trays
  // (chip 16.6 → tray 17 inside → +2 of rims), so the content row is 21 —
  // everything stretches to it — plus the gutter above and below (3 + 3) and
  // the hairline: **28**. Redo it after any change to the bundle's density,
  // the tray rims or the chip padding.
  height: 28px;
  background: var(--indigo-8, #303f9f);
  padding: var(--fhead-gutter);
  border-top: var(--fhead-lane-rule-w) solid var(--fhead-lane-rule);
  min-width: 0;
}

// The slot's berth. `0 1 auto` against the active tray's `1 1 auto`: the
// controls take the width their bars need and give ground under pressure
// (the label field inside is the shrinkable part), the chip tray takes the
// rest — the same priority the old body gave its two halves, read sideways.
.feed-head__manual-controls {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: stretch;
}

// ── THE SEAT ────────────────────────────────────────────────────────
// Down to a FACE AND A BADGE (user ask), both fixed-width, both carrying the
// same tooltip. `.feed-head__seat-name` is gone with the last two passes'
// worth of text — the role sub-line went to the compression, the name to
// this — which is the whole reason the input can now be the line: everything
// left of it is a known width, so `1 1 auto` on the field means it takes all
// the space the half has and no arithmetic states how much that is.
//
// The wrap exists for the two live signals (2026-08-07): the THINKING RING —
// a conic sweep spinning just outside the face while an ask is out — and the
// LIVENESS DOT, a small green mark lit only after a real round-trip this
// session (cleared by a timeout; presence is never claimed, only witnessed).
// THE COLUMN THE SEAT STANDS IN (2026-08-07) — face and badge in a row, both
// hanging from the section's top edge. It is `align-items: flex-start` twice
// over: the half pins this column to its top, and this rule pins the 15px
// badge to the 24px face's top rather than letting it centre against it, so
// the two read as one mark starting at the same line.
// A COLUMN since 2026-08-08 (user ask): the face row over the handle. It was
// the face row itself — hence the extra element below, which is the row the
// badge still stands in.
// LEFT-ANCHORED since 2026-08-21 (it was centred while the handle was a
// straight caption — "a handle ragged-left under a round face reads as a
// caption that slipped"): the handle is a curve wrapped AROUND the face now,
// and its geometry is stated in the avatar's own coordinates, so the two must
// share a left edge no matter whether the org badge widens the face row.
// Centring would shift the avatar against the arc by half the badge every
// time the org chip mounts.
.feed-head__seat-col {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // ── NO GAP, AND A POSITIONING CONTEXT, SINCE 2026-08-22 ──────────────────
  // The column IS the face now: its only in-flow child is
  // `.feed-head__seat-face`, because the handle below went absolute in the
  // compressed-room pass (see its rule). The 2px gap went with it — it
  // separated the face from a handle that no longer takes flow space, and
  // left on its own it would have made the column 30px against a 28px face,
  // which is exactly the kind of stray pixel the room's uniform padding
  // renders visible.
  gap: 0;
}

.feed-head__seat-face {
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

// THE HANDLE — CURVED round the face's lower-left corner since 2026-08-21
// (user ask); it was a straight one-line caption under the face from
// 2026-08-08. The ink is unchanged: `--indigo-8`, the deepest mark in the
// body and the tone the box's own header band is plated in — still the only
// WRITING in the section that is not inside a control.
//
// THE GEOMETRY, all in the avatar's 28px coordinates (the col is
// left-anchored exactly so these numbers hold):
//  · the link box stays IN FLOW, 28×9px under the face — the same 9px line
//    the straight caption occupied, so the seat column's height (which sets
//    the whole band's) does not move.
//  · the svg is absolute against it, spanning x −4…30, y 0…34 of the avatar
//    frame (`top: -30px` = 28px of face + the col's 2px gap), and nothing
//    on the way up clips it — the box carries no overflow:hidden by its own
//    rule.
//  · the path is a 105° arc of r=18 about the face's centre (14,14), from
//    ~8 o'clock through 6 to ~4:30 — sweep-flag 0, which is what stands the
//    glyphs upright with their tops toward the face. It was r=17 for the
//    first render and the glyph tops grazed the face's rounded corner (a 40%
//    corner bulges to ~r15.5 on the diagonal); one pixel out is the air. The
//    leftmost ink lands ~3px left of the avatar — the last pixel of the talk
//    room's own padding, inside its rim; the ellipsis the straight caption
//    needed is retired — `seatArc` shortens the TEXT instead, because a
//    textPath drops glyphs past the path's end mid-letter.
// ── IN FLOW, AND IT NOW RESERVES THE CAPTION'S WHOLE INK (2026-08-22) ─────
// 24×11, from 28×9, and the 11 is not a guess: the scaled arc's ink measures
// ~10.7px and ALL of it now falls below the face. That is the ask —
// "do not make tala's name overlay on his face! make sure it fits below the
// profile pic" — and it is a real change of arrangement, not a nudge.
//
// The arc was drawn to hug the face's lower-left curve from OUTSIDE, which
// means it always crossed the face's own box: ink ran +21.7…+34.2 of a 28px
// face, so 6.3px of the caption sat ON the porcelain and 6.15px below it. The
// column got away with 39px for 40.4px of content because of that overlap.
// Take the overlap away and the column wants 28 + 12.4 = 40.4px — TALLER than
// the 39 it replaced, which would have undone the room's compression
// entirely. So the face pays for it: 28 → 24 (the ask's "you can reduce the
// pic's size a little"), the svg scales with it, and the column lands at
// 24 + 11 = 35px against the 47px the room started the day at.
//
// ⚠ THREE NUMBERS MOVE TOGETHER, in two files' worth of places: the avatar's
// `:size` prop in the template, this box, and the svg's scale below. The
// column's height is their sum and the BUBBLE is dialled to that sum
// (`--fhead-chat-h`), because the room's uniform padding only looks uniform
// if its two objects are the same height.
// (It spent one pass ABSOLUTE, overlapping the face on purpose to keep the
// column at 28. That is the arrangement this ask rejected by name.)
.feed-head__seat-handle {
  position: relative;
  display: block;
  width: 28px;
  // 6px, from 11 — the concentric arc is much shallower than the tilted one
  // it replaced: its baseline bottoms out at y=32.45 of the face's frame and
  // the descender reaches ~35.2, i.e. 7.2px below a 28px face. Touching the
  // rim COST nothing and SAVED three pixels, which the column and the bubble
  // both give back.
  height: 8px;
  text-decoration: none;
  cursor: pointer;
  // The stub install's legend: same mark, no destination, and saying so.
  &.is-stub { opacity: 0.5; cursor: default; }
}

.feed-head__seat-arc {
  position: absolute;
  // ── SCALED WITH THE FACE, AND MOVED FULLY BELOW IT (2026-08-22, user ask:
  // "make sure it fits below the profile pic") ────────────────────────────
  // The svg carries `viewBox="0 0 28 40"` — 1:1 with CSS px since 2026-08-22,
  // origin on the FACE's own top-left — so every number in this rule and in
  // the path is in the face's own coordinates and can be re-derived by hand.
  //
  // The offset is derived, not tuned. In the scaled svg the ink runs
  // +18.6…+29.3 from the svg's top, the handle's box begins at the face's
  // bottom edge (the column's gap is 0), and the caption must START there:
  //     top = face_bottom − ink_top_in_svg = 0 − 18.6  → −18.6px
  // measured from the handle's own top, which IS the face's bottom. Ink then
  // runs 0…10.7 below the face, inside the handle's 11px box.
  // ⚠ Re-derive all three if the face's size moves again. The failure mode is
  // silent and it is the one this ask named: the caption creeps back up onto
  // the porcelain, where it reads as a smudge rather than as a handle.
  // ── REBUILT 2026-08-22 AS A TRUE CONCENTRIC ARC (user ask: "quiero que el
  // texto de @tala esté literalmente pegado al borde de la foto de perfil.
  // tocándolo, sin espacio en medio de los dos") ────────────────────────────
  // Three passes of nudging an offset could not do this, and the reason is
  // worth keeping: the caption's topmost ink is at the string's ENDS, while
  // the eye reads the MIDDLE — and the middle of a bowed arc falls away from
  // the face. Any offset that touched at the ends left a gap at the centre;
  // any offset that touched at the centre printed the ends on the porcelain.
  // Flattening the arc (r18 → r34 → r48) only traded one for the other more
  // slowly. There is no offset that solves it, because the two curves were
  // not the same curve.
  //
  // So the baseline is now CONCENTRIC WITH THE FACE, which makes "touching"
  // STRUCTURAL rather than tuned — every glyph is equidistant from the rim by
  // construction, so the string touches everywhere or nowhere:
  //     the face      a circle, centre (14,14), r = 14
  //     the baseline  an arc on the SAME centre, r = 19.15
  //     19.15 − 14  = 5.15 = the MEASURED ascender at 6.2px, so the GLYPH
  //                   TOPS land exactly on the rim
  // ⚠ 5.15, not the 4.45 that "0.72em cap height" predicts: the ink measured
  // 0.7px taller than the rule of thumb in this face, and at r=18.45 the
  // glyphs bit that far INTO the porcelain. Measure, do not assume — the
  // whole point of a concentric arc is that this one number decides whether
  // the string touches or overlaps, along its entire length at once.
  // The path runs 150°→30° (sweep 0, so "up" points at the centre and the
  // text reads upright, as it always has); the string, centred at
  // `startOffset: 50%`, occupies the middle of it.
  // ⚠ If the avatar's `:size` moves, THREE numbers move with it: the centre,
  // r=14, and the baseline radius (= 14 + cap height).
  left: 0;
  top: -28px;
  width: 28px;
  height: 40px;
  overflow: visible;
  // The face and its two live signals stay the pointer's business; the arc is
  // a caption. The LINK's own 28×9 flow box is the click target, exactly the
  // strip the straight caption offered.
  pointer-events: none;
}

.feed-head__seat-arc-text {
  font-family: var(--font-display);
  // 6.2px, 1:1 with CSS px since the viewBox went 1:1 (it was 7.5 user units
  // in a box scaled 28/34 — 6.18px rendered, the same mark stated honestly).
  // ⚠ The arc's radius is DERIVED from this: cap height ≈ 0.72em = 4.45px,
  // and the baseline sits exactly that far outside the face's rim.
  font-size: 6.2px;
  font-weight: 700;
  letter-spacing: 0.02em;
  fill: var(--indigo-7, #3949ab);
}

// The hover answer the underline used to give — an underline on a curve is
// not a thing CSS draws, so the ink LIFTS instead, three steps, the same
// direction every lit mark on this surface moves.
.feed-head__seat-handle:hover .feed-head__seat-arc-text {
  fill: var(--indigo-4, #7986cb);
}

// ROUNDER, HERE ONLY (2026-08-08, user ask). `EntityAvatar` draws every face
// on the platform as a 26% rounded square — the tile the profile-photo pass
// settled on — and that number is the component's, so this board overrides it
// through `:deep()` rather than moving it: the seat is one face in one box,
// and the feed's cards, the chips and every other avatar have no part in this
// ask. 40% is most of the way to a circle without being one; a true 50% would
// make the seat the only round thing in a box built entirely of rounded
// rectangles, and it would fight the `is-thinking` ring, which IS a circle.
// ⚠ The ring and the liveness dot below are positioned against this element,
// not the image, so they need no adjustment — the wrap's own 50% is what the
// ring already follows.
.feed-head__seat :deep(.entity-avatar) {
  border-radius: 40%;
}

.feed-head__seat {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  border-radius: 50%;

  &.is-thinking::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(var(--fhead-ink) 0 70deg, transparent 70deg 360deg);
    // Only the ring's rim survives — the mask carves the middle out.
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
    animation: fhead-think 0.9s linear infinite;
    pointer-events: none;
  }
}

@keyframes fhead-think {
  to { transform: rotate(360deg); }
}

.feed-head__seat-live {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--positive, #21ba45);
  border: 1px solid var(--fhead-face);
  pointer-events: none;
  // Above the curved handle (2026-08-21): the arc's tail ends near this
  // corner, and a liveness signal is never the thing a caption may cover.
  // The handle is a positioned LATER sibling of this dot's own wrap, so DOM
  // order would paint it on top without this.
  z-index: 1;
}

// ── THE COMPOSER ────────────────────────────────────────────────────
// The field, the reply line that borrows its slot, and the send button, as ONE
// object (2026-08-07, user ask). It is the positioning context the button is
// placed in — the button is absolute at the BOTTOM RIGHT, over the field's own
// corner, and the field reserves that corner in its right padding so a typed
// line never runs under the glyph. The height is stated ONCE here and the two
// faces below both read it, which is what stops the band from jumping by a
// pixel when the reply line takes the field's place.
//
// `--fhead-send` is the button's box, and the field's padding is derived from
// it — one dial, two rules, no arithmetic restated in either.
.feed-head__chat {
  // ── ONE LINE SINCE 2026-08-21 (user ask: "dense by default, very simple,
  // a single line") ────────────────────────────────────────────────────────
  // The desktop bubble joins the phone's arithmetic: one line of this field
  // is **12.096px** (font 8.96px, leading 1.35), the padding adds 3 + 3, the
  // 1.5px rim adds 3 — 21.1 → **22**, with 0.9 of slack. Shift+Enter still
  // breaks a line; the text scrolls inside, as the phone's field always has.
  //
  // It was 34 (two lines) from 2026-08-08, and 36 before the rim thinned —
  // the old two-line arithmetic is in git if the bubble ever holds two
  // again: lines × 12.096 + 6 + the rim, always measured INSIDE the border.
  //
  // ⚠ It is a `min-height`, and since the same ask the bubble NO LONGER
  // STRETCHES to the band (the `align-self: stretch` era is over): this is
  // the RESTING height, and the bubble GROWS from it when Talavero's
  // standing text needs more — capped by `--fhead-chat-max`, past which the
  // standing line scrolls inside (user ask: "when it is too much … a
  // navigable inner scroll section"). The BAND's height is the seat column's
  // 39px until the bubble outgrows it; the box's ResizeObserver carries
  // either case up to the well.
  // ── 28px SINCE 2026-08-22 — THE SEAT FACE'S OWN HEIGHT (user ask: "adapta
  // la altura de la burbuja del chat para que la burbuja sea del mismo
  // tamaño que la foto de perfil de talavero … asegúrate de que dos líneas
  // de texto sean mostrables dentro de la burbuja por defecto") ────────────
  // The bubble stops being sized by its text and starts being sized by the
  // OBJECT BESIDE IT — and "the object" is the whole SEAT COLUMN, not the
  // face alone: 35 = the 24px avatar + the 11px box holding its `@tala`
  // caption. It is what makes the room's uniform 3px padding actually look
  // uniform — two equal blocks in a gasket, rather than a tall seat beside a
  // short pill.
  // ⚠ It began this day as the FACE's height (28) and moved when the caption
  // was told to stop overlapping the porcelain and stand below it; the
  // column grew a caption box, the face shrank to pay for it, and this
  // followed the sum. Anything that changes the avatar's `:size` prop or the
  // handle's height changes this number too — there is no CSS link between
  // them, because the avatar is sized by a JS prop.
  //
  // ⚠ THE THREE NUMBERS BELOW ARE ONE SUM WITH THIS ONE. Touch the rim
  // width, the leading or either padding and re-run it, or the second line
  // stops fitting and the bubble silently scrolls instead — the one failure
  // this ask was raised to prevent, and it is invisible until someone types.
  //
  // It was 22 (one line) on 2026-08-21 and 34 (two lines, roomy) from
  // 2026-08-08, so 35 is very nearly the 08-08 box — but it is NOT a return
  // to it. 34 was "whatever two lines need"; 35 is "whatever the seat column
  // is", and the two agreeing to within a pixel is a coincidence worth
  // naming so nobody re-derives this number from the text again.
  --fhead-chat-h: 36px;
  // ── THE REST OF THAT SUM, published for the same reason the face and the
  // rim are: the bubble has THREE faces (the field, the transient say-line,
  // Talavero's standing text) and they must not disagree about how much text
  // fits. Stating the budget here makes it checkable in one place instead of
  // in three rules that happen to have matching numbers.
  //     3 (rim) + 3.5 (top) + 2 (foot) + 2 × 8.96 × 1.35 = 32.7 ≤ 35
  // — 2.3px of slack, which is the difference between this arrangement and
  // the 28px one it replaced. THAT one had 0.14px of slack and only reached
  // two lines by cutting the leading to 1.22; at 35 the type goes back to its
  // own 1.35 and the second line fits with room to spare. Height bought the
  // typography back.
  //
  // ⚠ THE TOP AND FOOT ARE DELIBERATELY UNEQUAL (user ask: "please add a
  // little padding at the top of the contained text inside the chat bubble").
  // 3.5 over 2, and the asymmetry is not only the ask — it is what the carve
  // needs: the inset shade falls from the TOP edge, so a first line set 2px
  // under it reads as text in shadow. The extra 1.5px is the line clearing
  // the groove. Same argument the room makes for its own top padding.
  //
  // ⚠ The LEADING is read by the two 0.64em faces only. The standing text
  // keeps its own 1.5 — it carries inline chips and they need the leading to
  // stand in — and it is also the face allowed to GROW (to
  // `--fhead-chat-max`), so it is not on this budget at all.
  --fhead-chat-pad-t: 3.5px;
  --fhead-chat-pad-b: 2px;
  --fhead-chat-lead: 1.35;
  // The growth cap — a little over three chip rows of standing lens. Past
  // it the bubble stops paying height and starts scrolling: the board must
  // never let a talkative lens push the stream off the screen.
  --fhead-chat-max: 64px;
  // 19px SINCE 2026-08-08 (user ask: a little tinier), from 22, with the glyph
  // 17px → 15px in the template. It is the bubble's own corner furniture and
  // it had grown into the object it sits in: at 22 in a 34px box the button
  // was two thirds of the field's height, which reads as a button with a field
  // beside it. ⚠ The field's right padding is derived from this dial, so the
  // text's stopping point follows for free — that is the whole reason the
  // number lives here and not in two places.
  --fhead-send: 19px;
  // ITS OWN LINE (user ask: "add to it thicker indigo-8 borders"), moved to
  // `--indigo-7` in a later one. It tracks `--lens-rim` in FeedStream — the
  // two lens bars and this field are the body's three control blocks and have
  // been asked for as a set every time, so the two dials are ONE decision in
  // two files. ⚠ Change either and change the other, or the composer and the
  // bars beside it stop being the same kind of object.
  //
  // The level walked -8 → -7 → -6 → -9 → -6 → **`--indigo-5`** across six
  // asks: it tracked `--fhead-rule` up to -9 with the board's inner-borders
  // pass and came back down over the two asks that gave the bubble a FACE of
  // its own (below), settling one step lighter than the pure hue.
  //
  // ⚠ SO THE THREE DIALS ARE APART, AND ON PURPOSE — `--fhead-rule` (the five
  // walls) and `--lens-rim` (the two lens bars) hold `--indigo-9`; this one is
  // four steps lighter. The bubble is the box's PALE object: an `--indigo-1`
  // face with an edge just dark enough to close it (4.1:1 measured, against
  // 5.7:1 at -6 and a line that read as a second box inside the room at -9).
  // Check this dial and `--lens-rim` together anyway — they have been asked
  // for as a set more often than not.
  //
  // It is also the tone the feed CONTAINER's frieze-bar lips wear, the inward
  // edge the reader's side faces — worth knowing but not a pairing: nothing
  // was moved to match, and the two answer different questions.
  //
  // ── `--indigo-7` SINCE 2026-08-21 (user ask: "usa indigo para el borde de
  // la burbuja", with the pit pass) ────────────────────────────────────────
  // Two steps back down the walk, and the room change is why it lands: -5
  // was tuned against a `--brown-1` floor at the bubble's own lightness,
  // where a darker line read as a second box. The room is a `--brown-2`
  // CARVED PIT now — one step deeper and shaded — and on it the -5 rim went
  // faint. -7 is the box's frame ink (`--fhead-rim`, the room rims the other
  // containers still wear), so the bubble's edge is a clearly-indigo line in
  // the family the board already draws — the porcelain object in the pit,
  // outlined in the frame's own hand.
  //
  // ── AND BACK TO `--indigo-5` ON 2026-08-22 (user ask: "pinta sus bordes
  // indigo-5") ─────────────────────────────────────────────────────────────
  // The seventh setting of this dial, and the walk's second visit here. What
  // makes it land THIS time is the same thing that made it fail on 08-21:
  // the FLOOR. -5 went faint when the room dropped to a shaded `--brown-2`
  // pit; the room is `--brown-1` again in this ask AND the bubble is that
  // same tone, so the rim is no longer a line between two tones — it is the
  // ONLY thing drawing the bubble's shape, together with its carve. A lighter
  // indigo is the right choice for that job: at -7 the outline read as a
  // second box inside the room, which is exactly what an object that shares
  // its floor's tone must not do.
  // ⚠ This is the one dial holding the bubble's silhouette now. Do not thin
  // it and do not darken it past -6 without re-checking against the floor.
  --fhead-chat-rim: var(--indigo-4, #7986cb);
  // ── 1px SINCE 2026-08-08 (user ask: thinner) ────────────────────────────
  // It had been 2px since the day the composer was told to read in the same
  // language as the lens bars — but those bars are `--indigo-9` on a deep
  // floor and this rim is `--indigo-5` on a pale one, so it was carrying two
  // steps more contrast at the same weight. At 1px the bubble is drawn rather
  // than framed, which is what a field wants, and the 2px it gives back go
  // straight into the height above.
  // ⚠ Every px here comes out of the TEXT BOX (see `--fhead-chat-h`): thicken
  // it again and the second line stops fitting unless the height follows.
  //
  // 1.5px SINCE 2026-08-08 (user ask: the same `--indigo-5`, "a little little
  // thicker"). A HALF step, because the whole scale either side of it is
  // spoken for — 1px is what the board's four container rims wear and 2px is
  // what its walls and lens bars wear, so a bubble at either would have joined
  // a family it is not part of. At 1.5 it is the one line on the board that is
  // its own weight, which is the right answer for the one object on the board
  // that is its own shape. The height above followed it, per the ⚠: 33 → 34,
  // since the extra pixel comes straight out of the two lines' room.
  // ⚠ AND IT IS DPR-DEPENDENT, which is the price of a half step: Chrome USES
  // 1px for it on a 1× display (measured in the headless driver) and the full
  // 1.5 on a 2× one, where it is three device pixels. On the retina screens
  // this board is designed against it is a real half-step thicker than the
  // container rims; on a 1× monitor it collapses back onto them. There is no
  // integer between 1 and 2, so the alternatives were "no change" and "back to
  // the walls' weight" — this is the one that states the intent.
  --fhead-chat-rim-w: 1.5px;
  // ── THE BUBBLE'S OWN FACE (2026-08-08, user ask) ────────────────────────
  // `--indigo-1`, after one pass at `--indigo-2` — the composer LEAVES THE
  // NEUTRALS. It was `--grey-3`, the tone the two lens bars are still floored
  // in, which was the right answer while the body was one grey plate: an
  // island a step above its floor. The talk room went `--brown-1` an ask
  // earlier and that reading stopped working — measured 1.02:1, a neutral on
  // a warm tone at the same lightness, so the bubble read as a rim drawn on a
  // continuous surface rather than as an object lying on one.
  //
  // ⚠ THE FIX IS HUE, NOT TONE, and the measurement says so plainly: this is
  // 1.01:1 against the room — the SAME lightness again — but the two tints now
  // lean opposite ways (the bubble B−R 14 cool, the room R−B 6 warm) where
  // before one of them was neutral and had no lean at all. So the field is a
  // COOL PANE in a WARM room, stated by hue and by its `--indigo-6` rim, and
  // if it is ever asked to stand up by TONE the dial is here and the direction
  // is down (-2 measured 1.36:1 on the room and is the step already tried).
  //
  // It is the colorway's palest step, so the field reads as the same material
  // as the box's chrome, lightened — the one place on the board where the
  // indigo goes PALE instead of deep. Measured: `--fhead-ink` text at 8.7:1
  // on it, the rim at 5.7:1.
  //
  // ⚠ ONE DIAL, TWO FACES: the field and the reply line that borrows its slot
  // for ~6s both read it, for the same reason they both read `--fhead-chat-h`
  // — the bubble must not change colour when its content is swapped for a
  // sentence from the seat.
  // ── `--brown-1` SINCE 2026-08-22 (user ask: "Pinta la burbuja del chat
  // brown-1 con ese efecto ahuevado") ──────────────────────────────────────
  // The composer LEAVES THE INDIGOS and joins its room's material. Every
  // argument in the note above was about how to separate a pale object from
  // a warm floor — by hue when tone failed — and this ask retires the
  // question by making them the SAME tone and moving the separation onto
  // DEPTH: the bubble is a carve inside a carve (see `--fhead-chat-carve`).
  // That is the platform's oldest device for exactly this — the label
  // maker's pit, the stack wells — and the one thing a shared tone cannot
  // defeat, because a groove reads by its shadow, not by its colour.
  // ⚠ The measured consequence: bubble and room are now 1:1, so if the carve
  // is ever removed the bubble loses its face entirely and only the
  // `--indigo-5` rim is left holding it. Carve and rim are a PAIR here.
  --fhead-chat-face: var(--brown-1, #efebe9);
  // ── THE BUBBLE'S OWN CARVE (2026-08-22, user ask: "para la sección
  // ahuevada con fondo brown-2, ayúdame a poner ese efecto en la burbuja
  // del chat") ─────────────────────────────────────────────────────────────
  // The room's own recipe, one size down. Same two statements — a top inset
  // shade with a white lip at the foot — retuned for a box that is 28px
  // instead of 34 and rimmed rather than open: the shade drops 2px/6px →
  // 1.5px/4px so it stays a lip rather than washing the first line of text,
  // and the white foot keeps its 0.4.
  // ⚠ ONE DIAL, THREE FACES, exactly like the rim and the radius above: the
  // field, the transient say-line and Talavero's standing text all restate
  // it, or the bubble changes DEPTH when its content is swapped — which
  // would read as the box moving.
  // ⚠ An inset shadow paints under a child's background: these three faces
  // each carry it themselves for that reason, rather than it sitting once on
  // `.feed-head__chat` where the field's own face would cover it. (The same
  // trap `TalaveraToggle`'s sleeve documents from the other side.)
  --fhead-chat-carve:
    inset 0 1.5px 4px rgba(var(--ink-rgb-deep), 0.3),
    inset 0 -1px 0 rgba(255, 255, 255, 0.4);
  // ROUNDER AGAIN (2026-08-08, user ask) — 4px → `--radius-sm` → 12px, stated
  // as a dial so the field and the reply line that stands in for it can never
  // disagree about the shape of the same box. It is off the platform's radius
  // scale on purpose: this is the one control on the surface that is a BUBBLE
  // — the thing you say something into — and at 36px tall a 12px corner reads
  // as a soft box where -sm read as a slightly eased rectangle. On mobile the
  // box is 22px, so the same 12 clamps to a pill, which is the right shape for
  // a one-line composer and costs nothing to state twice.
  --fhead-chat-r: 12px;
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  // ⚠ NO STRETCH ANY MORE (2026-08-21, the dense-bubble ask). The 2026-08-08
  // `align-self: stretch` existed to fill the band the LENS HALF set (~47px);
  // that half is gone with the manual toggle, so stretching would blow the
  // one-line bubble up to the 39px seat column for nothing. The bubble is
  // its content's height now — resting at `--fhead-chat-h`, growing with the
  // standing text, scrolling past `--fhead-chat-max` — which is exactly the
  // arrangement the phone board always had, promoted to the whole board.
  align-self: flex-start;
}

// ── THE REPLY LINE ──────────────────────────────────────────────────
// The field's slot, borrowed for ~6 seconds: the seat's `say`, a ♪ verse, or
// the one failure string, each in its own tone. A BUTTON, because the line is
// a door — the transcript behind it lives in the chat dock.
//
// It wears the composer's full height now, with the text at the TOP of the box
// rather than centred in it: the field it stands in for writes from the top
// line down, and a reply centred in a two-line box would sit half a line lower
// than the sentence it replaced. Two lines of it are readable before the
// ellipsis (`-webkit-line-clamp`, the one place on this surface a clamp beats
// `text-overflow` — that only ever trims ONE line).
.feed-head__chat-line {
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: var(--fhead-chat-h);
  padding: var(--fhead-chat-pad-t) calc(var(--fhead-send) + 6px) var(--fhead-chat-pad-b) 6px;
  border: var(--fhead-chat-rim-w) solid var(--fhead-chat-rim);
  border-radius: var(--fhead-chat-r);
  background: var(--fhead-chat-face);
  box-shadow: var(--fhead-chat-carve);
  color: var(--fhead-ink);
  // NASALIZATION (2026-08-08, user ask) — stated, not `inherit`. The whole
  // filtering section beside it went to the display face a day earlier, and
  // this is the surface's other field; `inherit` here resolved to the body
  // face through `.feed-head`, so the two halves of one line were set in two
  // typefaces. It is `--font-display` and not the `.nasalization` class for
  // the reason that file documents: the utility carries a `0.05em` meant for
  // headings with room, and this is a 9px field.
  font-family: var(--font-display);
  font-size: 0.64em;
  line-height: var(--fhead-chat-lead);
  text-align: left;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  cursor: pointer;

  &.is-song { font-style: italic; }
  &.is-fail { opacity: 0.75; }
}

// ── TALAVERO'S STANDING TEXT (2026-08-21, user ask) ─────────────────────
// Full-talavero mode's persistent face of the bubble: the seat's last
// sentence with the lens's chips EMBEDDED in it — the labels he set, shown
// as his own text. Same bubble dials as its two siblings (face, rim, radius,
// the send button's reserved corner), because it is the same object in a
// third state; what is its own:
//  · it GROWS — `min-height` the resting line, height its content's — and
//    past `--fhead-chat-max` it becomes the inner scroller the user asked
//    for ("when it is too much … a navigable inner scroll section");
//  · `cursor: text` + the click handler make the whole line the door back
//    to the field (the chips stop their own clicks);
//  · line-height opens to 1.5 so inline chips have leading to stand in.
.feed-head__chat-standing {
  width: 100%;
  min-width: 0;
  min-height: var(--fhead-chat-h);
  max-height: var(--fhead-chat-max);
  overflow-y: auto;
  scrollbar-width: thin;
  padding: var(--fhead-chat-pad-t) calc(var(--fhead-send) + 6px) var(--fhead-chat-pad-b) 6px;
  border: var(--fhead-chat-rim-w) solid var(--fhead-chat-rim);
  border-radius: var(--fhead-chat-r);
  background: var(--fhead-chat-face);
  box-shadow: var(--fhead-chat-carve);
  color: var(--fhead-ink);
  font-family: var(--font-display);
  font-size: 0.64em;
  line-height: 1.5;
  text-align: left;
  cursor: text;
}

.feed-head__chat-standing-say {
  margin-right: 4px;
}

// The chips run INLINE with the sentence — that is the whole ask ("the
// labels are embedded inside talavero's text"). They are the stream's own
// `.feed-stream__label-chip` buttons through the slot, so removal logic
// lives in one place; what this context restates:
//  · `inline-flex` + `vertical-align`, so a chip sits in the line of text
//    like a word rather than breaking the flow;
//  · the font-size — the chip's own 0.6em is relative to its parent, which
//    in the lane is the band (~14px) and here is the standing line's 9px;
//    unscaled they came out 5.4px. 0.92em of THIS line lands them back at
//    the lane's ~8.3px.
.feed-head__chat-standing-chips :deep(.feed-stream__label-chip) {
  display: inline-flex;
  vertical-align: middle;
  margin: 1px 3px 1px 0;
  font-size: 0.92em;
}

// ── THE CHAT BOX ────────────────────────────────────────────────────
// An input and its one button, standing in the seat's own line rather than in
// a row of their own (user ask). The message log is gone (also a user ask) —
// it was a summary of a conversation that does not exist, the one part of
// this box making a claim rather than holding a place. Still inert: no store,
// no service, no events, and `disabled` on both controls, which greys them by
// construction and states the fact without a label saying so.
//
// A TEXTAREA HOLDING TWO LINES (2026-08-07, user ask). The height is stated,
// not left to `rows`: `rows` counts lines in the browser's default leading and
// this field is set at 0.64em with a 1.35 line-height, so the two numbers
// disagree by a few pixels and the band's geometry would be whatever the
// browser decided. 34px = 2 × ~12px of leading + 6px of padding + the rim.
//
// `resize: none` because the box's height is the box's business — a corner
// grip here would let a drag change the head's height and move the well's
// reserved home slot underneath it. The right padding is the send button's
// own width plus a gap, so the second line stops before the glyph instead of
// running under it.
.feed-head__chat-input {
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: var(--fhead-chat-h);
  padding: var(--fhead-chat-pad-t) calc(var(--fhead-send) + 6px) var(--fhead-chat-pad-b) 6px;
  border: var(--fhead-chat-rim-w) solid var(--fhead-chat-rim);
  border-radius: var(--fhead-chat-r);
  background: var(--fhead-chat-face);
  box-shadow: var(--fhead-chat-carve);
  color: var(--fhead-ink);
  // NASALIZATION (2026-08-08, user ask) — stated, not `inherit`. The whole
  // filtering section beside it went to the display face a day earlier, and
  // this is the surface's other field; `inherit` here resolved to the body
  // face through `.feed-head`, so the two halves of one line were set in two
  // typefaces. It is `--font-display` and not the `.nasalization` class for
  // the reason that file documents: the utility carries a `0.05em` meant for
  // headings with room, and this is a 9px field.
  font-family: var(--font-display);
  font-size: 0.64em;
  line-height: var(--fhead-chat-lead);
  resize: none;
  &:disabled { cursor: not-allowed; }
  &::placeholder { color: rgba(var(--ink-rgb), 0.4); }
}

// The FILTER glyph, deliberately oversized for its box (user ask: "a big
// filter icon"): 17px in a 22px button, so the mark reaches the button's rim
// on both axes and the control reads as one solid glyph rather than an icon
// sitting in a frame. It is the same `filter_alt` the label lens wears —
// which is the point, the two are the same gesture at two scales.
//
// AT THE COMPOSER'S BOTTOM RIGHT since 2026-08-07 (user ask). It was a plate
// standing beside the field; it is now placed IN the field's corner, which is
// the shape of every composer on this platform — and the one place a control
// can sit in a two-line box without either stretching to 34px (a very tall
// button for one glyph) or floating at a height that belongs to neither line.
// It keeps its own rim and floor so it stays a button on the field rather than
// a glyph printed inside it; `3px` off each edge is the field's own rim plus
// two, so the two corners nest.
.feed-head__chat-send {
  position: absolute;
  right: 3px;
  // 2px/18px since the bubble went to ONE line (2026-08-21): the old 3px/20px
  // pair measured 23 in a 22px box. Bottom-anchored, so when the standing
  // text grows the bubble the funnel rides its lower corner the way every
  // composer button on this platform does.
  bottom: 2px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--fhead-send);
  height: 18px;
  // NO OUTLINE since 2026-08-07 (user ask). It kept a rim and a floor of its
  // own while the field's line was a hairline — a button ON the field rather
  // than a glyph printed inside it. At the field's new 2px `--indigo-8` that
  // reading inverts: a second rim 3px inside the first is two boxes nested in
  // 22px, and the corner reads as busy rather than as a control. Bare, the
  // MARK is the button — which is what the oversized glyph was always for.
  border: 0;
  background: transparent;
  color: var(--fhead-ink);
  cursor: pointer;
  &:disabled { cursor: not-allowed; opacity: 0.55; }
}

// ── THE LABEL LANE IS THE MANUAL BAND'S BACK HALF NOW (2026-08-21) ──────
// `.feed-head__lane` — the always-present 23px strip across the box's foot —
// is RETIRED with the manual toggle: its four pieces (active tray, broom,
// trash tray, bin) stand at the end of `.feed-head__manual` above, on the
// same `--indigo-9` band, behind the same `--indigo-7` hairline, in the same
// order. The constant-height argument it was built on (a lane that appears
// with its first chip moves the well's slot on every pick) is deliberately
// traded away: the toggle makes the board TWO arrangements, and the height
// observer carries both. The lane-era chain — chip 16.6 → tray 19 → band
// 19 + rule + daylight — still governs the manual band's stated height.
//
// The pieces keep their `lane-*` names: they ARE the lane's, the stream's
// slots address them by story, and a rename would cut every doc that names
// them. Their rules below are unchanged except where the band's geometry
// (stated height, shared row) is the thing being read.

// ── THE LANE'S TWO KEYS ─────────────────────────────────────────────
// The BROOM (one press, both sections — the sweep itself is the stream's,
// via the `sweep` emit, since the filter change has to actually reload the
// feed) and the TRASH's BIN GLYPH, which is that section's name.
//
// ONE AESTHETIC SINCE 2026-08-07 (user ask: "make the broom and trashcan
// icons look consistent … background indigo-9 and icon color brown-1"). They
// had drifted into two different things — a `--fhead-ink` glyph at 0.7 that
// lit on hover, and a fainter one at 0.35 that did nothing — which read as one
// control and one smudge. They are the same object now: a 24px PLATE at its
// section's left edge, full lane height, `--indigo-9` under `--brown-1`.
//
// That pair is not a new colorway: it is exactly the two INNER FRIEZE POSTS'
// mapping (deep plaque, warm motif), so the lane's two keys are the box's own
// frieze material cut into 24px squares. The lane's rooms are named in the
// same material its walls are built from.
//
// OPACITY IS GONE from both. It was doing the work of a tone — and on a plate
// it does not: a faded warm glyph on a deep plaque loses the contrast that
// makes the mark legible at 11px, and the two ended up at different fades
// anyway, which is the drift the ask names. The BROOM stays the one that
// answers a press (`cursor: pointer`, and its plate lifts a step on hover);
// the bin has no state because it is a label, not a control.
// THE KEY RULE IS ON BOTH (2026-08-07, the ask right after: "the broom icon
// will have an extra border. make both icons have that border"). It was the
// broom's alone — the wall that ruled it off from the lane's chips, the same
// `--fhead-rule` gauge as the box's other four walls. Now each key is closed
// on its right by one, which is what makes them read as a PAIR rather than as
// a control at one end and a label at the other: same plate, same glyph tone,
// same wall between the key and the things it applies to.
// ⚠ `height: 100%` and not `align-self: stretch` alone. Stretch only applies to
// an item whose cross size is `auto`, and Quasar gives every `.q-icon` a
// definite `width/height: 1em` — so the bin came out an 11px tile in a 17px
// lane while the broom, a plain button, stretched correctly. One rule that
// works for both beats two that agree by accident.
.feed-head__lane-broom,
.feed-head__lane-trash-mark {
  flex: 0 0 24px;
  align-self: stretch;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  // ⚠ ZEROED, or the stated width is a lie: a `<button>` carries the UA's
  // `1px 6px`, and with `box-sizing: border-box` that padding plus the glyph
  // exceeds the flex basis, so the key comes out at its min-content width
  // instead (measured 25px against a stated 22). The bin, a `q-icon`, never
  // had the problem — which is exactly how the pair drifted apart in size
  // while both were declared 24.
  padding: 0;
  background: var(--indigo-8, #303f9f);
  color: var(--brown-1, #efebe9);
}

// ⚠ THE ROOM DIVIDER IS THE BROOM'S RIGHT EDGE (2026-08-08, the ask that moved
// both keys to the RIGHT of their trays). It used to be on the shared block —
// each key closed on its own right, back when each key OPENED its room — and
// both of those lines are wrong now: the bin's would fall at the lane's outer
// end where there is nothing to divide, and the broom's happens to land
// exactly on the boundary between the two rooms. So the wall is declared once,
// here, and the bin carries none. It draws nothing against the `--indigo-9`
// lane, as the box's other walls do against their own floors; it is the mark
// that says where the trash begins the moment that band is ever paler.
.feed-head__lane-broom {
  border-right: var(--fhead-rule-w) solid var(--fhead-rule);
  // A LITTLE SMALLER (2026-08-08, user ask) — 24px → 22px, and the glyph 12px
  // → 11px. MEASURED after: 22 total, of which 2 is the wall below, so 20 of
  // plate against the bin's 24 — the broom is now the smaller key by 2px and
  // their marks are 11px each. It had been the LARGER of the two in both
  // dimensions (26 measured, since the wall sat outside a 24px basis, and a
  // 12px glyph), which is how the pair the docs call "one object" drifted
  // apart. If they should be exactly equal again, this is the dial and 24 is
  // the number — the ask was for smaller, and smaller is what this is.
  flex: 0 0 22px;
  cursor: pointer;
  // A step LIGHTER on hover, the same -8 the posts are rimmed in — a plate
  // cannot brighten by losing opacity without showing the lane through it.
  &:hover { background: var(--indigo-7, #3949ab); }
}

// ── IT IS A REAL TRAY NOW (2026-08-08, user ask) ────────────────────────
// `--brown-1`, the board's warm mark ink and the talk room's own floor, so the
// lane's chip strip is a FACE rather than the leftover width between the
// broom's plate and the trash's wall. It had been transparent, showing the
// box's `--grey-4` through — which is why the radius this container was given
// an ask earlier drew nothing at all and came back off (see gotchas.md: a
// curve on a transparent box shapes the clip, not a box).
//
// It reads with the room above it: warm tray, `--indigo-9` key at its left,
// `--indigo-9` chips standing in it — the same three-part sentence the talk
// room makes with its seat and its bubble, one band lower.
//
// ROUNDED, all four corners (2026-08-08, the second attempt): it has a FACE
// now, and a lane painted `--indigo-9` behind it, which is the pair the first
// attempt was missing on both counts — that curve was drawn on a transparent
// box over the `--grey-4` face and had nothing to shape and nowhere to open.
.feed-head__lane-active {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  background: var(--brown-1, #efebe9);
  // Rounded with its twin, same dial, same reasoning.
  border-radius: var(--fhead-room-r);
  // The room rim, 1px `--indigo-7` — see `--fhead-room-rim`. ⚠ On a 17px tray
  // it costs 2px of the strip's height, so the chips inside are worth
  // re-measuring after anything that touches this or the lane's own height.
  border: var(--fhead-room-rim-w) solid var(--fhead-room-rim);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

// THE TRASH — a fixed 30% of the lane, ruled off, where discarded labels
// stand in their disabled aesthetic until restored or swept. The bin glyph is
// the section's name; it stays when the section is empty, so the split reads
// as a place rather than a leftover gap.
//
// THE BIN LEFT THE TRAY (2026-08-08, user ask) and stands beside it in the
// lane, the way the broom stands beside the active tray — so this rule is now
// a TRAY ONLY, holding labels and nothing else. Three consequences, all of
// them the mirror of the broom's side:
//  · SYMMETRIC 6px padding, where it used to have none on the left. The
//    reason for the flush edge left with the bin: the tray's own left edge is
//    a rounded `--brown-1` corner now, and a chip pressed into it would sit
//    inside the curve.
//  · the SECTION WALL moved to the bin (`.feed-head__lane-trash-mark`), since
//    the trash room starts where its key does — the tray is the second thing
//    in that room, not the first.
//  · the 30% is measured on the ROOM, so the tray gives back what the key and
//    its wall take (`calc()` below). Without it the trash side would grow by
//    26px and the active tray, the lane's only flexible item, would pay it.
.feed-head__lane-trash {
  // A STATED BASIS since the band became shared (2026-08-21). The lane-era
  // 40%-minus-key split divided a strip that held nothing but the two rooms;
  // this band also carries the manual controls, so a percentage of it would
  // hand the trash a cut of the label field's width. 130px is roughly what
  // 40% of the old lane's content box came to at the board's common widths,
  // and `0 1` (not `0 0`) lets it give ground before the active tray does —
  // the trash is the archive, the active tray is the working set.
  flex: 0 1 130px;
  // The floor under the shrink: room for one chip's worth of scroller, so a
  // crowded band narrows the archive without ever erasing the place.
  min-width: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  // The room rim, with its twin — see `--fhead-room-rim`.
  border: var(--fhead-room-rim-w) solid var(--fhead-room-rim);
  // THE SAME FACE AS ITS TWIN (2026-08-08, user ask) — `--brown-1`. The two
  // trays are one strip in two rooms, so a floor on one and daylight on the
  // other would have made the lane read as a tray beside a gap. What tells
  // them apart stays what it was: the `--indigo-9` wall between them, the
  // glyph each room is keyed with, and the disabled aesthetic the trashed
  // chips wear.
  background: var(--brown-1, #efebe9);
  // Rounded with its twin, same dial, same reasoning.
  border-radius: var(--fhead-room-r);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

// Everything this glyph used to say for itself — its own flex, its ink and its
// 0.35 — is in the shared block above now. It keeps ONE rule of its own: a
// `q-icon` is inline by default and the shared block turns it into a flex
// plate, so the glyph inside it needs its line box zeroed or the 11px mark
// sits a pixel below the 24px plate's centre.
.feed-head__lane-trash-mark {
  line-height: 1;
  // ⚠ NO WALL. It held the trash room's opening wall for one ask — a room
  // begins at its key, the argument went — and the ask after moved it to the
  // END of its room, where an opening wall would be a line at the lane's outer
  // edge. The divider lives on the broom now (see above).
}

// ── THE MOBILE BOARD (2026-08-07, user ask) ─────────────────────────
// `max-width: 600px` — the same breakpoint `FeedPage` takes the container to
// 95% of the track at, which is the point where this box stops being a wide
// plate with two columns in it and becomes a narrow one with two bands.
//
// THE BODY STACKS. Side by side, at ~330px of usable width, the composer and
// the lens block were splitting a line neither could hold: the bundle needs
// ~150px whatever the window does, and what was left could not carry a
// sentence. Stacked, each gets the WHOLE width — which is the ask, and also
// the only arrangement where the field is worth typing into on a phone.
//
// THE COMPOSER GOES BACK TO ONE LINE. `--fhead-chat-h` is the one dial, so
// the field, the reply line and the button's corner all follow it — and 20px
// is the height it wore before the two-line ask, not a new number. Two lines
// of a field that now spans the board is a lot of vertical for a surface
// where the box already eats a third of the screen; one line across the full
// width holds MORE text than two lines across half of it did.
//
// A rule the stacked body has to restate: the vertical divider between the
// two halves becomes a HORIZONTAL one. `--talk` carried a `border-right`
// because the lens block stood to its right; here it stands underneath, so
// the same wall moves to the bottom edge. Left unmoved it would draw a line
// down the right of a full-width band, which is a wall with nothing on the
// other side of it.
@media (max-width: 600px) {
  // ⚠ THE BODY NO LONGER STACKS (2026-08-21). The column existed because the
  // composer and the LENS BLOCK could not share ~330px; the lens block lives
  // in the manual band now and the body is the talk pit plus a ~33px toggle —
  // a pair that shares the row at any phone width. The toggle stays at the
  // bubble's right on every layout, which is where the ask put it.

  // THE MANUAL BAND WRAPS instead: the controls take a full first row, the
  // four lane pieces the second. Two consequences are paid here:
  //  · the stated height goes back to auto (two rows have no one number),
  //    so the KEYS' `height: 100%` stops resolving — the second row's items
  //    state 21px (the content height the desktop chain derives) instead;
  //  · `row-gap` restates the gutter between the two rows.
  .feed-head__manual {
    flex-wrap: wrap;
    height: auto;
    row-gap: var(--fhead-gutter);
  }

  .feed-head__manual-controls {
    flex: 1 1 100%;
  }

  .feed-head__lane-active,
  .feed-head__lane-trash,
  .feed-head__lane-broom,
  .feed-head__lane-trash-mark {
    height: 21px;
    align-self: center;
  }

  .feed-head__chat {
    // 20px SINCE 2026-08-08 (the rim went 2px → 1px): one line of 18px leading
    // needs 18px of inside, and the rim now costs 1 + 1 instead of 2 + 2. It
    // was 22 for exactly that arithmetic, so it follows the rim down rather
    // than standing as a number of its own.
    // ⚠ The SEAT's size follows this, not the other way round — on this layout
    // the face and the field are the same object tall (the script's mobile
    // branch is 20 now); change one and the row's whole reason goes.
    // (The `align-self: flex-start` this block used to restate is the BASE
    // since 2026-08-21 — the desktop bubble is dense too now, so the phone
    // stopped being the exception and only the height number is its own.)
    --fhead-chat-h: 20px;
  }

  .feed-head__chat-input,
  .feed-head__chat-line {
    height: var(--fhead-chat-h);
  }

  // ONE DENSE ROW (user ask). The face drops 36 → 22px in the script above,
  // which is exactly the one-line composer's height, so the seat and the field
  // are the same object tall and the band is 22px of content instead of 36 —
  // the face was setting the row's height, and it was setting it to something
  // no other item in the row needed. CENTRED rather than top-aligned, because
  // with every item the same height there is no top to align to, and the org
  // badge is 15px and would otherwise hang off the line.
  .feed-head__half--talk {
    align-items: center;
  }

  // Nothing left to stack: the handle is gone from the DOM here, so the column
  // is the face row and only that.
  .feed-head__seat-col {
    gap: 0;
  }

  // One line means one line: the textarea keeps its `rows="2"` in the DOM (it
  // is still a textarea, and Shift+Enter still breaks a line — the text simply
  // scrolls) but the BOX is a single line's worth, so the padding has to come
  // off the top and bottom or the leading has nowhere to sit.
  .feed-head__chat-input,
  .feed-head__chat-line {
    padding-top: 0;
    padding-bottom: 0;
  }

  .feed-head__chat-input {
    // A one-line field whose text starts on the second line reads as broken.
    line-height: 18px;
  }

  .feed-head__chat-line {
    -webkit-line-clamp: 1;
    line-height: 18px;
  }

  // The button fills the line rather than tucking into a corner there is no
  // longer room for: at 20px tall the composer IS the button's height.
  .feed-head__chat-send {
    top: 0;
    right: 0;
    bottom: 0;
    height: auto;
  }
}
</style>
