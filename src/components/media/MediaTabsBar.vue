<template>
  <!-- The minimize band — a strip of the platform's chrome coat
       (`--plaque-coat`) at the side bands' own 15px (2026-08-21 user ask:
       same height as the drawer's top frieze bar), rimmed in 1px of
       `--grey-6` and lettered in `--grey-8`, its tabs cut from the same
       material (2026-08-17 user asks; the rim walked 2px → 3px over the
       next day and back to 1px with the 08-21 height;
       it was a light-grey `--grey-4` strip rimmed and lettered in indigo,
       `--indigo-4` edges + `--indigo-10` marks, from 2026-08-06),
       ABOVE the crown strip (not on it: `--media-tabs-h` moves the whole
       top chrome down for it, 2026-08-05), carrying one tab per parked
       viewer; clicking a tab restores its window
       (docs/plans/floating-media-viewer.md). ALWAYS MOUNTED — it is the
       rail the viewers hang from, so it stands there empty as readily as
       full, and its space is a constant nothing has to animate.

       The row fills from the RIGHT edge leftward and never passes half
       the screen; `parked` is reversed so the newest tab is the leftmost
       — the growing end — and every older tab keeps the slot it had.

       IT STOPPED BEING ONLY MEDIA'S BAND on 2026-08-10 (user ask: the
       skeleton flyout parked here too) and stopped hosting TWO families on
       2026-08-17, when the fusion made every window one family — the
       flyout viewers, element and media faces alike. The row keeps its
       normalized `{ key, icon, name, restore }` shape from the two-family
       era: the strip never learns what a window holds, which is what let
       the families merge under it without it moving. The posture is why
       this strip is their home: a floating box retreats UPWARD, out of
       the way of the page it was covering, where a docked window folds
       back down into the bar it rose from. -->
  <div class="media-tabs" role="toolbar" aria-label="minimized windows">
    <!-- ── THE INLAID FRIEZE BAND (2026-08-22, user ask: "take the cyan-indigo
         frieze bar from the post cards and incrust it on the top navigation
         header of the whole screen") ──────────────────────────────────────
         THE POST CARD'S BAND, moved here whole. It stood on the feed's cards
         from 2026-08-07 — born as a mirrored pair bracketing the label lane,
         down to one survivor, up to the card's first seam — and this is where
         it ends up: ONE motif for the whole window instead of one per card,
         which is what a thirty-card column had been asking for all along (a
         figure repeated thirty times down a scroll is a texture; the same
         figure once, at the top of the screen, is a crown).
         It is INLAID, not laid on: the rail's face is `lead + band + pad`, so
         cream shows above it and a little cream shows beneath it, and the band
         never touches either of the rail's own edges. Everything about the band
         itself came across unchanged — `slim`, the `--grey-8` plaque, the
         indigo→cyan paint on the wave, the `0.55 × --frieze-h + 2px` dial —
         and only the two 1px rules were restated, in this bar's ink rather
         than the card's (see the style block).
         Decorative: `pointer-events: none` from the component, on a parent
         that is already `none`.
         ⭐ SINGLE WAVE AGAIN SINCE 2026-08-30 (user ask: "change the double
         svg pattern to the single-SVG one. You can copy the friezes on the
         main feed container") — `slim` is BACK ON, which UNDOES the
         2026-08-27 exchange's header half: that pass took `slim` off so
         both waves drew (the dense interleave the feed's bars had carried)
         while the feed's bands took the one-wave pattern in trade. Both
         surfaces now run the SAME single-wave pattern — layer two alone,
         mask `b`, the wave with the full-width centre rule, exactly what
         `.feed-container__edge` draws — so the exchange is superseded, not
         half-reverted: nothing went back to the feed. The COLORING held
         through every pattern move — grey-8 plaque, the one cyan→indigo
         ramp — until the SAME DAY'S LATER ASK finally moved it ("making
         its background color the same as the bar, and re-painting the
         gradient part with grey-4", then "pls try grey-6 and remove the
         top and bottom borders"): that pass coated the plate, greyed the
         wave and deleted the band's two 1px rules — and the SITTING'S LAST
         ASK ("invert the frieze pattern on the top nav bar with the bottom
         footer nav bar one") swapped colorings with the footer trail, which
         had preserved this band's old dress: grey-8 plate, teal-11 flat,
         the cyan→indigo ramp — BACK, unframed (the rules stayed gone), the
         quiet grey-6-on-coat moving downstairs (see the style block). The
         pixel-drawn geometry the
         exchange paid height for survives too — band 13px, `auto 13px`, 1px
         a row, rail 18px total — because `slim` reads the fit/carve dials
         since this same ask (it hardcoded `auto 117%` + its halved carve
         before, which would have squeezed the mask and grimed the band; see
         FriezeBar's slim block). The arithmetic lives on `--media-tabs-band`
         in _tokens.scss and the dials in the style block.
         ⭐ TWO WAVES AGAIN SINCE 2026-09-07, AND THEY RUN AT EACH OTHER (user
         ask: "changing the frieze pattern of the top nav bar by adding
         another frieze but that is horizontally mirrored … we want the waves
         to encounter each other. Use the complementary pattern from the
         bottom footer nav bar friezes"). `slim` came OFF and `counter` went
         on — the second depth's return by exactly the route the style block
         has named since 2026-08-30 ("if the second depth ever comes back, it
         starts by taking `slim` off the template, not by re-dialling"), and
         the pattern it returns with is the FOOTER TRAIL'S complement: mask
         `a`, the wave the trail draws beside this one's mask `b`, which is
         the only pattern the platform HAS that is complementary to what was
         already here. What `counter` adds on top of the plain pair is the
         ask's own word — mask `a` arrives HORIZONTALLY MIRRORED
         (`mercury-wave-a.svg`, the existing mirror partner of the default
         `-mirror` corner; no new asset), so its spirals open against `b`'s
         instead of trailing them and the two meanders meet down the band.
         ⚠ THE GEOMETRY DID NOT MOVE, which is the whole reason this is a
         one-line template edit: every default `slim` was carrying here is
         already stated as a dial below — `--frieze-bar-h`, `auto 13px`,
         `carve: none`, `pad: 0` — so the band is the same 13px at 1px a row
         it has been since 2026-08-27; only the second layer appears.
         ⭐ ONE WAVE AGAIN SINCE 2026-09-26 (user ask: "the top nav header
         bar's inner frieze looks weird doubled out like that. Let it be a
         single HD thin svg tire" — read as *tira*, a strip). `counter` came
         OFF and `slim` went back ON, the second time this band has walked
         that way (2026-08-30: "change the double svg pattern to the
         single-SVG one"). What "doubled out" names is the −11px phase
         itself: the offset that FINISHED `counter` is the one where the
         tile is SYMMETRIC about the centre rule, and at ONE ink a symmetric
         pair does not read as two waves meeting — it reads as one motif and
         its reflection, a chain of closed medallions, each 21-column tile a
         diamond bracketing two mirrored spirals. The device that made the
         pair legible is what made it look doubled. So the ask is answered
         by the variant the platform already names for it — `slim` IS the
         single thin wave (one layer, mask `b`, the wave with the centre
         rule, the same pattern the feed's bands draw) — and "HD" is the
         pixel-drawn fit `slim` reads through the dials since 08-30:
         `auto 13px` in the 13px band, one motif cell per CSS pixel,
         crispEdges, two tones and not one blended pixel in the band (the
         witness samples the paint to say so). Nothing in the geometry
         moved: band 13px, rail 18px, pad 0, carve none. Wave one's dials
         LEFT WITH THE LAYER again — the tone and the −11px shift — since
         `slim` v-ifs the layer out and a dial on an undrawn band is the
         trap FriezeBar's slim notes name; the 09-07 record stands in the
         style block as tombstones. ⚠ THIS WAS `counter`'s LAST HOST (the
         footer trail's band went 2026-09-23), so the variant is unhosted
         now; its recipe and the −11px lesson stay in FriezeBar for the next
         band that wants the opposed pair. -->
    <!-- ── ⭐ THE AURORA (2026-09-26, user ask: "take a good pastel color
         palette from all the -11 quasar tones of our color palette and then
         build a gradient that slowly twists in a pretty loop of random smooth
         slow gradients of those colors transmutating into another. like a
         sunrise-sunset endless thing … apply it onto the friezebar svg inside
         the top header nav bar pls. make it move smooth to my eyes") ─────
         The band's WAVE IS PAINTED BY A LIVE GRADIENT now: `ref="frieze"`
         hands this element to `useAurora` (setup), which writes
         `--aurora-paint` inline at ≤30fps, and the style block's dial hands
         it to FriezeBar's `-paint` seam (⭐ 2026-09-28: the mount is
         `ref="band"`, the ROW both friezes stand in, and it writes the
         mirror property beside it — the next note). Nine pastel stops off a WHEEL of the
         palette's -11 accents in hue order, an arc of ~3 tones across the
         width drifting right, breathing and bending, the wheel turning once
         every ~4 min — the composable's header has the whole construction.
         Nothing geometric moved: still `slim`, one wave, mask `b`, 13px,
         `auto 13px`, pad 0, carve none; the plate stays `--grey-8`, which is
         what makes pastels read as ink. Reduced motion holds one frame. -->
    <!-- ── ⭐ THE BAND IS TWO FRIEZES AND A SLIDING SEAM (2026-09-28, user
         ask: "split it internally in two parts separated by a slidable
         section incrusted in the middle by default … place [the logo]
         inside the slidable section … frame it inside of a cream colored
         hexagonal frame i can slide across the top nav bar … split the
         inner friezebar with color animation into two frieze bars, except
         the second one, on the right side must have its inner svg pattern
         and animation mirrored vertically so both frieze bars converge to
         the middle … if i slide the new logo frame, the friezes expand or
         contract horizontally accordingly"; then, the same sitting: "add to
         it a bottom tab, just like the top nav bar tabs that attach to the
         bottom, but just make it read in bold nasalization 'pathos.cloud'
         and let the image logo framed above") ─────────────────────────
         `.media-tabs__band` is a flex ROW at the band's 13px — LEFT frieze │
         SEAM │ RIGHT frieze — standing where the one band stood. The left
         one is the band as it was (slim, mask b-mirror, the sky at 90deg)
         with its mask ANCHORED AT ITS RIGHT EDGE (`--frieze-bar-wave-two-
         shift: 100%`); the right one wears `flip` — mask b PLAIN, which by
         construction is b-mirror reflected — anchored at its left edge, and
         reads the sky's MIRROR (`--aurora-paint-mirror`: the same nine stops
         at the same instant under 270deg, written beside `--aurora-paint`
         by the ONE `useAurora` mount, on this row now). Both tiles meet at
         the seam as a motif and its reflection, and both skies drift TOWARD
         the seam. A mask swap and a second angle — never a `scaleX(-1)`,
         FriezeBar's law (a transform mirrors the carve's light with the
         motif).
         THE SEAM sits at `--logo-frac` of the band's travel (0 = the left
         end, 1 = the right, 0.5 = the middle and the default): the left
         frieze's basis is `(100% − seam) × frac`, the right takes the rest,
         so dragging the badge grows one band by the pixels it takes from
         the other. Drag = pointer capture on the seam; arrow keys walk it
         2% (10% with shift), Home/End to the ends; the fraction is
         remembered under `pathos_header_logo_x` and CLAMPED so the hexagon
         never rides under the Back/Forward plates (their boxes measured, so
         the phone's 33px pair clamps differently from the desktop's 59/76).
         THE BADGE: a flat-top HEXAGON WITH ROUNDED CORNERS — a cream frame
         (`--plaque-flat` — THE RAIL'S OWN LIPS wrapped round: 2px of
         coat, the 1px grey-6 rule, the 1px grey-8 pad, exactly the feed
         rails' recipe the rail itself wears now, under a thin cast)
         around a face of THE DARKEST INDIGO (`--indigo-10`; for an hour
         the page's own starfield layers) with the cream planet mark over
         it, centred by measurement — INSIDE THE BAR: the rail's face, 48
         × 21, top edge to rim, the face the band's own 37.6 × 13 (user asks: "constraint the pathos.cloud icon frame to be
         inside the top navigation bar … crop it all around and reduce
         padding so it can be distinguished"; then "use this logo instead
         [a transparent PNG] … make the background match how the stars of
         the main background look … make the frame bolder/thicker and also
         make its corners be rounded. make sure it is sticking to the very
         top. it has a slight gap from the top right now" — ⚠ the "gap"
         was the 1px GREY-6 RIM the frame wore outside the cream: measured,
         the badge's row 0 was the rim and the cream began at row 1, and
         against the rail's cream top a grey line above a cream frame reads
         as a gap. The rim is GONE; the frame is the top row).
         The walk that got here, all 2026-09-28: a 38px regular hexagon
         BELOW the rail with a name plate 20px under it ("why is it
         floating?") → 40 × 18 inside the bar with a plate that WAS a parked
         tab reading "pathos.cloud" → the plate's text removed and its 14px
         given to a 38 × 32 hexagon ("so the icon looks bigger") → back
         inside the bar, cropped and thinned. The name lives in the seam's
         `title`. The seam's gap is NARROWER than the hexagon — 24 against
         40 — so the friezes' ends run under its wedges at every row of the
         band and the badge reads as set INTO the band. -->
    <div ref="band" class="media-tabs__band" :style="{ '--logo-frac': logoFrac }">
      <FriezeBar slim class="media-tabs__frieze media-tabs__frieze--left" />
      <div
        ref="logo"
        class="media-tabs__logo"
        :class="{ 'is-anchored': anchored }"
        role="slider"
        aria-label="pathos.cloud — slide the logo along the bar"
        aria-orientation="horizontal"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="logoPct"
        tabindex="0"
        :title="anchored ? 'pathos.cloud — drag to resize the feed with its rail' : 'pathos.cloud — drag along the bar'"
        @pointerdown="logoDown"
        @pointermove="logoMove"
        @pointerup="logoUp"
        @pointercancel="logoUp"
        @keydown="logoKey"
      >
        <div class="media-tabs__badge">
          <div class="media-tabs__hex"><div class="media-tabs__hex-face" /></div>
        </div>
      </div>
      <FriezeBar slim flip class="media-tabs__frieze media-tabs__frieze--right" />
    </div>
    <!-- ── THE BACK BUTTON (2026-08-31, user ask: "relocate the back button
         from the left drawer into the top header nav bar"; the drawer is
         hidden the same day) — INSIDE the rail since the follow-up ask
         ("place the back button inside the header, not like a tab. Make it
         occupy all the available height of the bar"): a full-height block
         at the rail's LEFT end, seated on the bar's own box the way the
         identity section seats on the footer — an opaque plate over the
         inlaid band (paint cannot carry a control), closed by the rail's
         own rim ink on its right edge, the bar's bottom rim running
         unbroken beneath it. It spent its first hour as a `.media-tabs__tab`
         hanging BELOW the band at this end. `pointer-events: auto` because
         the band itself is click-through paint; disabled on the history
         stack's first entry it stays visible but mutes — an affordance
         that vanishes teaches nothing. -->
    <!-- ── ⭐ ON A PHONE THE PAIR IS TWO ARROWS AND NO WORDS (2026-09-26,
         user ask: "on the mobile versions only, make the top nav bar not
         display the 'back' or 'forward' labels since they take up a lot of
         space. Also use different signs for back and forward. find bigger
         material arrows"). ≤600px (`MOBILE_Q` = the style block's query):
         the words hide (`display: none`, style block), the glyph becomes the
         LONG arrow of Material Symbols — `sym_o_arrow_left_alt` here,
         `sym_o_arrow_right_alt` on Forward — which spans the full em box
         where `arrow_back`'s head-heavy arrow uses two thirds of it, drawn
         at 15px in the 17px face instead of the desktop's 12px; the blocks
         close to glyph + pads (~33px) and the parked-tab row's right inset
         follows Forward down (90 → 40px). The desktop pair is untouched:
         `arrow_back` / `arrow_forward` at 12px beside their words. -->
    <button
      ref="backEl"
      type="button"
      class="media-tabs__back nasalization"
      :class="{ 'is-disabled': !canGoBack }"
      :disabled="!canGoBack"
      title="Back"
      @click="goBack"
    >
      <q-icon :name="isPhone ? 'sym_o_arrow_left_alt' : 'arrow_back'" :size="isPhone ? '15px' : '12px'" class="media-tabs__glyph" />
      <span class="media-tabs__name">back</span>
    </button>
    <!-- FORWARD — the pair's other half at the rail's RIGHT end (the ask
         that followed the in-bar move: "add a forward one at the right end
         of the header too"). Mirrored composition: the word leads, the
         glyph closes, so each button's arrow points at the screen edge it
         walks toward. Forward regains a surface here for the first time
         since the bar's console was emptied on 2026-08-02 — enablement is
         the pair's OWN traversal ledger (`forwardDepth`; the script's note
         walks the three ready-made truths that each failed first). -->
    <button
      ref="forwardEl"
      type="button"
      class="media-tabs__forward nasalization"
      :class="{ 'is-disabled': !canGoForward }"
      :disabled="!canGoForward"
      title="Forward"
      @click="goForward"
    >
      <span class="media-tabs__name">forward</span>
      <q-icon :name="isPhone ? 'sym_o_arrow_right_alt' : 'arrow_forward'" :size="isPhone ? '15px' : '12px'" class="media-tabs__glyph" />
    </button>
    <!-- ── ⭐ THE WALL (2026-09-29, user ask, phones only: "rearrange the
         tabs by rotating them 90 degrees to the right and adding a thin grey
         bar on the right of the screen where they're gonna be sticking") ──
         On a phone the parked tabs do not hang under the rail: the row
         below is turned a quarter-turn clockwise and stood along the
         screen's RIGHT edge, and this is the strip it sticks to — a thin
         grey bar from the rail's rim down to the footer's lip, the tabs'
         own face (`--grey-4`) with a 1px `--grey-6` rim on its page side,
         the rail's doctrine in a second orientation: ALWAYS MOUNTED, so
         the tabs' home stands there empty as readily as full. Decorative
         (`aria-hidden`, click-through) and `display: none` above 600px —
         the phone block in the style block is the only place it draws. -->
    <div class="media-tabs__wall" aria-hidden="true" />
    <TransitionGroup ref="rowEl" tag="div" name="mtab" class="media-tabs__row nasalization" appear>
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="media-tabs__tab"
        :title="'restore ' + t.name"
        @click="t.restore()"
      >
        <q-icon :name="t.icon" size="12px" class="media-tabs__glyph" />
        <span class="media-tabs__name">{{ t.name }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import { useAurora } from 'src/composables/useAurora'
import { seamAnchor, gripSeam, nudgeSeam } from 'src/composables/useSeamAnchor'
import { iconForTarget, titleOfTarget } from 'src/utils/mediaKind'

// ── THE PHONE QUERY (2026-09-26, user ask: on mobile the Back/Forward pair
// drops its words and wears bigger arrows). The SAME STRING the style block's
// `@media` uses, on purpose — FeedHeadBox's lesson: `$q.screen.lt.sm` fires
// UNDER 600px where `max-width: 600px` is 600 inclusive, so at exactly 600px
// the JS and the CSS would disagree about which pair is standing. One string,
// one answer.
const MOBILE_Q = '(max-width: 600px)'

export default defineComponent({
  name: 'MediaTabsBar',
  components: { FriezeBar },
  setup () {
    const store = useFlyoutViewersStore()
    const route = useRoute()
    const router = useRouter()

    // ── THE AURORA (2026-09-26) — the sky painted into the rail's frieze
    // wave. The composable writes `--aurora-paint` inline on its host and
    // the style block wires the dial. ⭐ 2026-09-28: the host is `band`, the
    // ROW the two friezes stand in (a custom property inherits DOWN, and
    // both bands must read one sky), and `mirror` asks for the second
    // property — the same stops at 270deg — the right frieze reads. See the
    // template note and composables/useAurora.js.
    const band = ref(null)
    useAurora(band, { mirror: '--aurora-paint-mirror' })

    // ── THE SEAM (2026-09-28, user ask: a slidable logo section splitting
    // the band, "the friezes expand or contract horizontally accordingly").
    // `logoFrac` ∈ [0, 1] is where the seam stands along the band's TRAVEL
    // (band width − seam width); the style block turns it into the left
    // frieze's flex-basis and the right one takes the rest. Remembered in
    // localStorage; 0.5 — the middle — when nothing is remembered.
    //
    // The legal range is measured, not stated: the hexagon overhangs the
    // seam on both sides (`over`), and it must never ride under the
    // Back/Forward plates, whose widths differ by viewport (59/76 on the
    // desktop, 33 each on a phone). `travel()` reads all four boxes at the
    // start of a drag (and once at mount, to clamp a remembered fraction
    // to this viewport's plates).
    const logo = ref(null)
    const backEl = ref(null)
    const forwardEl = ref(null)
    const LOGO_KEY = 'pathos_header_logo_x'
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
    const recall = () => {
      try {
        const v = parseFloat(localStorage.getItem(LOGO_KEY))
        return Number.isFinite(v) ? clamp(v, 0, 1) : 0.5
      } catch { return 0.5 }
    }
    const logoFrac = ref(recall())
    const logoPct = computed(() => Math.round(logoFrac.value * 100))
    const remember = () => {
      try { localStorage.setItem(LOGO_KEY, String(logoFrac.value)) } catch { /* private mode: the seam still slides */ }
    }
    const travel = () => {
      const row = band.value ? band.value.getBoundingClientRect() : { left: 0, width: 0 }
      const seam = logo.value ? logo.value.getBoundingClientRect() : { width: 0 }
      const hex = logo.value && logo.value.querySelector('.media-tabs__hex')
      const over = hex ? Math.max(0, (hex.getBoundingClientRect().width - seam.width) / 2) : 0
      const span = Math.max(1, row.width - seam.width)
      const backW = backEl.value ? backEl.value.getBoundingClientRect().width : 0
      const fwdW = forwardEl.value ? forwardEl.value.getBoundingClientRect().width : 0
      return {
        left: row.left,
        span,
        min: clamp((backW + over) / span, 0, 1),
        max: clamp((row.width - fwdW - over - seam.width) / span, 0, 1)
      }
    }
    // Pointer capture: the seam keeps receiving moves once grabbed, wherever
    // the pointer wanders (off the 13px row is where it wanders first).
    // `dx` is the grab's offset from the seam's left edge, so the badge does
    // not jump to the pointer on the first move.
    let drag = null
    const logoDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      // Anchored: the press belongs to the feed's right rail (THE GRIP) —
      // the rail resizes, publishes, and `follow` carries the badge along.
      if (anchored.value) { gripSeam(e); return }
      const t = travel()
      drag = { id: e.pointerId, t, dx: e.clientX - (t.left + logoFrac.value * t.span) }
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()
    }
    const logoMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      logoFrac.value = clamp((e.clientX - drag.dx - drag.t.left) / drag.t.span, drag.t.min, drag.t.max)
    }
    const logoUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      drag = null
      remember()
    }
    const logoKey = (e) => {
      if (anchored.value) {
        const px = e.shiftKey ? 40 : 8
        const dx = e.key === 'ArrowLeft' ? -px : e.key === 'ArrowRight' ? px : 0
        if (dx && nudgeSeam(dx)) e.preventDefault()
        return
      }
      const step = e.shiftKey ? 0.1 : 0.02
      const t = travel()
      let next = null
      if (e.key === 'ArrowLeft') next = logoFrac.value - step
      else if (e.key === 'ArrowRight') next = logoFrac.value + step
      else if (e.key === 'Home') next = t.min
      else if (e.key === 'End') next = t.max
      if (next === null) return
      e.preventDefault()
      logoFrac.value = clamp(next, t.min, t.max)
      remember()
    }
    // ── ⭐ THE SEAM IS ANCHORED WHILE THE FEED STANDS (2026-09-29, user ask:
    // the hexagon "sticking to the frieze bar below, both aligned and
    // centered horizontally") ──────────────────────────────────────────────
    // `seamAnchor` (composables/useSeamAnchor) is the viewport x where the
    // feed page's RIGHT rail is centred, or null when no page claims the
    // seam. While a value stands the seam FOLLOWS it — the fraction that
    // puts the hexagon's centre on that x, clamped to the plates exactly as
    // a drag is. ⭐ PM: its drag and arrow keys are no longer refused —
    // they are HANDED to the rail (`gripSeam` / `nudgeSeam`, THE GRIP), so
    // badge and rail move as one piece. The remembered fraction is
    // untouched by the follow: released, the seam goes back to it. On a
    // phone the rail's centre sits under the Forward plate (the container
    // is 95% wide there), so the clamp holds the badge at the plate's edge
    // — as close as it can get without covering the arrow.
    const anchored = computed(() => seamAnchor.value != null)
    const follow = () => {
      const x = seamAnchor.value
      if (x == null) return
      const t = travel()
      const seamW = logo.value ? logo.value.getBoundingClientRect().width : 24
      logoFrac.value = clamp((x - seamW / 2 - t.left) / t.span, t.min, t.max)
    }
    watch(seamAnchor, (x) => {
      if (x == null) {
        const t = travel()
        logoFrac.value = clamp(recall(), t.min, t.max)
      } else follow()
    })
    onMounted(() => {
      const t = travel()
      logoFrac.value = clamp(logoFrac.value, t.min, t.max)
      follow()
    })

    // ── THE PAIR ON A PHONE (2026-09-26, user ask: "on the mobile versions
    // only, make the top nav bar not display the 'back' or 'forward' labels
    // since they take up a lot of space. Also use different signs for back
    // and forward. find bigger material arrows") — `isPhone` picks the
    // GLYPH (a name is not a style, so CSS cannot swap it): the long arrows
    // `sym_o_arrow_left_alt` / `sym_o_arrow_right_alt` at 15px, Material
    // Symbols' full-width arrows, where the desktop keeps `arrow_back` /
    // `arrow_forward` at 12px beside their words. The WORDS hide in the style
    // block's `@media` (same query, `MOBILE_Q` above).
    const isPhone = ref(false)
    let phoneMq = null
    const syncPhone = (e) => { isPhone.value = e.matches }
    onMounted(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return
      phoneMq = window.matchMedia(MOBILE_Q)
      isPhone.value = phoneMq.matches
      phoneMq.addEventListener('change', syncPhone)
    })
    onBeforeUnmount(() => { if (phoneMq) phoneMq.removeEventListener('change', syncPhone) })

    // ── The BACK + FORWARD pair (2026-08-31) — Back relocated from the
    // hidden drawer, Forward re-surfaced with it (its last surface was the
    // nav bar's console, emptied 2026-08-02).
    // BACK keeps the drawer button's own test: `history.state.position` is
    // 0 on the tab stack's first entry (not reactive on its own, so the
    // computed takes `route.fullPath` as a dependency).
    //
    // FORWARD'S TRUTH IS THE PAIR'S OWN LEDGER — `forwardDepth`, a counter
    // of browser entries THIS pair left ahead: goBack arms an expectation
    // and the route change it causes increments the depth, goForward
    // decrements it, and ANY navigation these buttons did not cause resets
    // it to zero (a push truncates the browser's forward run; a traversal
    // from browser chrome leaves one we simply do not claim to know
    // about). The button therefore arms exactly when a forward entry is
    // GUARANTEED, and never no-ops.
    //
    // ⚠ Three sources of ready-made truth were tried first, each
    // witness-caught the hour it shipped, and the failures are the spec:
    //  · `history.state.forward` — stamped only on the router's OWN
    //    pushes, null after backing across an absorbed hash navigation
    //    (address bar, `location.hash` from a script): Forward stayed dead.
    //  · bare `position < history.length − 1` — a reload GROWS
    //    `history.length` without moving position (measured: pos 1 / len 2
    //    → reload → pos 1 / len 3), so a fresh landing false-armed.
    //  · `navStore.canGoForward` — the platform's history is SEMANTIC and
    //    restored across sessions: with allegue's server-side stack ending
    //    […feed, labels], a fresh hash walk TO feed matched the entry
    //    behind and read as "back detected", arming Forward while the
    //    browser had nothing ahead. That model is the stack widget's, not
    //    the browser's.
    // The browser deliberately hides its stack index, so certainty only
    // exists about traversals we perform ourselves — hence the ledger.
    const canGoBack = computed(() => {
      void route.fullPath
      return (window.history.state?.position ?? 0) > 0
    })
    const forwardDepth = ref(0)
    // 'back' | 'forward' | null — set just before router.back()/forward()
    // and consumed by the route change it causes. The timer clears a stale
    // expectation if the traversal silently no-ops (a boundary click), so
    // the NEXT unrelated navigation cannot be mis-read as ours.
    let expecting = null
    let expectTimer = null
    const arm = (dir) => {
      expecting = dir
      clearTimeout(expectTimer)
      expectTimer = setTimeout(() => { expecting = null }, 800)
    }
    watch(() => route.fullPath, () => {
      if (expecting === 'back') forwardDepth.value++
      else if (expecting === 'forward') forwardDepth.value = Math.max(0, forwardDepth.value - 1)
      else forwardDepth.value = 0
      expecting = null
      clearTimeout(expectTimer)
    })
    const goBack = () => { arm('back'); router.back() }
    const canGoForward = computed(() => forwardDepth.value > 0)
    const goForward = () => { arm('forward'); router.forward() }
    // ── NO ROUTE THE RAIL GIVES WAY TO ANY MORE (2026-08-24, user ask: "make
    // the main public feed container be drawn behind the top navigation header
    // and the footer navigation bar"). `underlaid` and
    // `.media-tabs--underlaid` — the 2026-08-21 twin of the nav bar's
    // step-down, dropping this rail to 2999 on /feed so the column's 3001 could
    // cross it — are DELETED with that bar's. The rail is the ladder's top
    // again on every route, which also restores the 2026-08-18 reading in full:
    // it draws on top of BOTH side columns, their frieze bands included, with
    // no route where the corners take it back.
    // One normalized shape per parked window. The strip hosted TWO
    // families from 2026-08-10 (the media viewers + the feed's
    // single-instance skeleton flyout, its tab in a fixed lead slot);
    // the 2026-08-17 FUSION folded them into one — every parker is a
    // flyout viewer now, so the row is simply the store's parked list,
    // NEWEST FIRST: the row grows leftward from the right edge and a
    // tab, once placed, stays where it was put.
    //
    // A tab's name + glyph are what the window mirrored down as its
    // header resolved (`store.describe`) — same seam, so a tab and the
    // window it restores are never called two different things. The
    // mediaKind fallbacks catch a window parked before its first
    // describe landed — kind-aware since 2026-09-01 (a ref window used to
    // park as a blank paperclip).
    const tabs = computed(() => {
      return [...store.parked].reverse().map((v) => ({
        key: v.id,
        icon: v.icon || iconForTarget(v.target),
        name: v.label || titleOfTarget(v.target),
        restore: () => store.restore(v.id)
      }))
    })

    // NOTHING to set at runtime: `--media-tabs-h` is a constant in
    // _tokens.scss and the top chrome is laid out against it from boot.
    // The first pass had this component claim and release the space as it
    // mounted, which worked and made the whole page hop 4px whenever a
    // viewer parked — a band that is permanent has no such moment.
    return {
      tabs,
      isPhone,
      canGoBack,
      goBack,
      canGoForward,
      goForward,
      band,
      logo,
      backEl,
      forwardEl,
      logoFrac,
      logoPct,
      anchored,
      logoDown,
      logoMove,
      logoUp,
      logoKey
    }
  }
})
</script>

<style lang="scss" scoped>
// ── THE TOP OF THE WHOLE Z LADDER: 3125 (2026-08-18, user ask) ──
// The band was 3105 for its whole life — above the stack widget (3100) so the
// tabs stay clickable across the full width, below the nav footer (3110) and
// the left drawer (3120). That last relation is now REVERSED: the ask is that
// the drawer and the stack widget both start drawing at the very top of the
// screen and that this rail draw ON TOP OF BOTH, "partially covering the
// frieze bar" — so both columns run to y=0 with their own FriezeBar there, and
// this rail lies across the top of those bands (about a third of each when the
// rail was ~6px; since 2026-08-21 it stands at their own 15px and covers them
// edge to edge — the "partial" is now the /feed exception's, see below).
// Nothing else on the ladder moved; 3121–3124 are left free between the drawer
// and this band.
//
// TWO consequences worth knowing:
//  · The band is still click-through PAINT (`pointer-events: none`), so the
//    drawer's and the stack's top pixels keep taking taps through it. Only a
//    TAB is solid, and tabs fill from the RIGHT edge leftward — they reach the
//    drawer's column only on a narrow window with the row near its 50vw cap,
//    where the tab is meant to win anyway now.
//  · On MOBILE the drawer is modal and its backdrop sits at 3115 — under the
//    drawer (3120) by construction, so it cannot dim a band above them both.
//    This rail therefore stands lit over a dimmed page. It is 15px of chrome
//    with no reachable control on it (the tabs are the only hit targets and
//    they sit at the far right), which is why the ask's ordering wins over the
//    dimming; putting the rail back under the backdrop would put it back under
//    the drawer, which is the thing being undone here.
//
// ── THE FACE: `--plaque-coat` since 2026-08-17 (user ask) ──
// It wore the media window's own `--grey-4` coat from 2026-08-05, on the
// argument that band, tab and window are ONE MATERIAL, which is what lets a
// tab flare out of the band instead of being stuck onto it. This band is the
// whole top chrome of the window (the crown strip was deleted 2026-08-12 and
// the page container pads down by `--media-tabs-h` alone), so the ask that
// took the nav bar, the drawer and both side widgets to the shared
// cream-under-veil coat reaches it too: the window's chrome is now one
// material on ALL FOUR EDGES, top rail included.
//
// THE TABS FOLLOWED IT an ask later the same day, reported off the SKELETON
// FLYOUT's minimize (every flyout and viewer parks on this one strip): face,
// rim weight and rim tone all match the band again, so band → flare → tab is
// one material with one line round it, which is the state this strip was
// built in. The tab takes `--plaque-flat` and not `--plaque-coat` because
// its face is also consumed inside the flares' radial-gradient colour stops,
// where a background LAYER LIST is illegal — that token is the coat's
// measured composite as a flat `<color>`, indistinguishable on an opaque
// surface. What the tab no longer matches is the media WINDOW it restores,
// which keeps `--grey-4`: the handle belongs to the strip it hangs from, the
// same way its rim already did after 2026-08-06.
//
// THE RIM UNDER IT IS 1px OF `--grey-6` — 1px → 2px on 2026-08-17 (user ask,
// with the grey-6 repaint) → 3px on 2026-08-18 (user ask: "make the top header
// bar bottom border slightly thicker") → 1px on 2026-08-21 (user ask, with the
// height above: "make its bottom border (and the floating tabs) thinner") — see
// the rule below for what that costs at the seam. What follows is the history
// it replaced, and the argument is worth keeping because it is the one the
// tabs still live by: the 1px `--indigo-4` rim was the tabs' own border
// continued across the window (user ask, 2026-08-06: "so it looks smooth and
// metallic") — the band a machined edge with tabs cut out of it, one line
// running the whole way. That line was `--grey-6` until 2026-08-06,
// when the user moved every EDGE on this strip into the feed colorway and
// every MARK on it to `--indigo-10`: the face stays the window's own neutral
// coat, so the strip reads as grey metal with the platform's indigo scribed
// into it. The edge WALKED UP in one sitting — asked for at `--indigo-6`
// (the feed container's lip), then -5, then here — and the walk is the note
// worth keeping: this is 1px of hue laid the full width of a light band at
// the very top of the screen, where the lip is a short edge read against the
// feed's own coat. At -6 that line RULES the page; at -4, the motif's LIT
// wave, it states the colorway and lets the strip stay a light thing. Depth
// on this edge went the opposite way from the ink beside it, which took the
// family's deepest step — the contrast between the two IS the strip.
// `border-box` + the `+ var(--media-tabs-rim)` in
// `--media-tabs-h` is what keeps the FACE a clean `--media-tabs-band` while
// the rim adds its own pixels to the space the page gives up. The tabs then
// hang from `top: 100%` — the padding box, i.e. the face's underside — so
// each one and its flares PAINT OVER the rim for their own width: the line
// breaks where metal attaches to metal, which is exactly where a rim should
// stop.
.media-tabs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  // ⚠ ONE SOURCE FOR THE HEIGHT SINCE 2026-08-22: `--media-tabs-h` IS
  // `band + rim`, and the face is now a sum of three dials rather than a
  // constant — restating the arithmetic here would be a third place to keep in
  // step for no gain. (It used to be written out because both terms mattered at
  // a glance; now the terms live in _tokens.scss, where the lead, the band and
  // the pad are declared together.)
  height: var(--media-tabs-h);
  // THE BAND IS THE FACE, LESS A HAIRLINE EACH SIDE (2026-08-22, two asks).
  // It was placed at the bottom of a taller bar first (`justify-content:
  // flex-end` over a 3px `padding-bottom`, 5px of coat above it); the second ask
  // — "reduce the padding … so the whole nav bar matches the height of the left
  // drawer frieze bar" — took the face back to its pinned `15px − rim` and left
  // the band whatever the paddings do not use.
  //
  // ⚠ BOTH PADDINGS ARE LOAD-BEARING ARITHMETIC, not spacing: they are
  // subtracted in `--media-tabs-frieze-h`, so a pixel added here is a pixel off
  // the motif, which is already at its legibility floor (~0.72px a row — see the
  // token). `justify-content: flex-end` is kept for what it STATES rather than
  // what it does: with the band sized to the remainder there is no free space to
  // distribute, and the rule is there so a future trim to the band's height
  // drops it onto the bar's floor rather than floating it in the middle.
  //
  // The tabs are untouched by any of it: `.media-tabs__row` is
  // `position: absolute`, out of this flow entirely, and hangs from `top: 100%`
  // — the PADDING box's underside, which padding does not move. So the strip
  // still attaches to the face's floor and paints over the rim for its own
  // width, exactly as before.
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--media-tabs-lead) 0 var(--media-tabs-frieze-pad);
  background: var(--plaque-coat);
  // ── THE RIM: 1px of --grey-6 (1px → 2px 2026-08-17 → 3px 2026-08-18 →
  // 1px 2026-08-21, thinned in the same ask that grew the face to 14px) ──
  // It was 1px of `--indigo-4` — the tabs' own border continued across the
  // window, one line running band → flare → tab, walked up the indigo ramp on
  // 2026-08-06 so the strip read as grey metal with the platform's indigo
  // scribed into it. With the face off `--grey-4` and onto the cream coat,
  // the line goes back to stating the EDGE rather than the colorway: --grey-6
  // is the same ink the post cards draw every line in, on the same
  // `--light-cream` sheet. (The 2px/3px years ran a heavier line because the
  // face was ~4px and the BORDER had to be the bottom of the rail; at the side
  // bands' full height the face does that stating itself, and a thick line
  // under it read as a ledge — so the rim rejoined the platform's 1px ink
  // weight.) Both pixels are declared, never assumed: `--media-tabs-rim` feeds
  // this border, this element's `height` (border-box) and `--media-tabs-h`,
  // the offset every top-anchored surface in the window starts on.
  //
  // THE TABS' RIM FOLLOWED an ask later (user report off the skeleton
  // flyout): their border and both flare arcs read `--mtab-rim` /
  // `--mtab-rim-ink`, which default to this width and `--grey-6`, so one
  // unbroken line runs band → flare → tab again. `--media-tabs-rim` is
  // therefore FOUR numbers now, not three — this border, the band's height,
  // `--media-tabs-h`, and the tab's own edge.
  border-bottom: var(--media-tabs-rim) solid var(--grey-6, #9e9e9e);
  // A soft downward cast (2026-08-17, user ask) — the rail is a raised edge
  // over the page now, not paint lying flush on it. Deliberately NOT the
  // `--shadow-side-edge` family the right-edge column wears (that one is a
  // horizontal cast at 16%, and this bar is 1440px of it — the same opacity
  // reads as a smear across the whole window); deliberately not `--shadow-soft`
  // either, which at 6% disappears against the page's dark canvas.
  //
  // ⚠ WALKED UP ON 2026-08-18 (user ask: "make the top header bar project a
  // little shadow on top of the bars behind") — 12% over 8px at +2px became
  // **22% over 10px at +3px**. The first figure was chosen while this rail sat
  // UNDER the drawer at z 3105, where the only thing its cast could land on was
  // the page; now that the rail is the ladder's top it falls across the drawer's
  // and the stack's frieze bands, and 12% of ink over a carved orange/teal
  // meander on a `--grey-8` plate is very nearly invisible — the bands it is
  // meant to be lying on top of were the one surface it could not state itself
  // against. 22% reads as a soft edge on those plates and still stays quiet on
  // the light chrome below (the feed column, a dock) and effectively invisible
  // on the starfield. The `+3px` offset keeps the cast clear of the rim so the
  // line and the shadow read as two things, not one thick edge. (Since
  // 2026-08-21 the rail covers the side bands entirely, so the cast lands
  // BELOW them — on the drawer's plaque and the stack's well — where 22% still
  // reads and never smears.)
  //
  // It falls BEHIND the tabs, not on them — `.media-tabs__row` is a child, so
  // it paints above the parent's cast — which is what keeps a parked tab
  // reading as attached metal rather than as something lying under the bar.
  box-shadow: 0 3px 10px rgba(var(--ink-rgb-deep), 0.22);
  z-index: 3125;                  // the ladder's top — see the note above
  pointer-events: none;
}

// ── THE INLAID BAND'S DIALS (2026-08-22, user ask) ────────────────────────
// Everything here except the two rules ARRIVED as the POST CARD'S recipe
// carried over letter for letter, and that was the point of the move: the ask
// was to take THAT band and set it into this bar, not to draw a second one in
// the same family. The notes that earned the height live in _tokens.scss and
// in FeedStream's tombstone (the walk). ⚠ THE COLORING PARTED WAYS 2026-08-30
// (the recolor ask, below): plaque and ink are the rail's own now, and what
// this band still shares with the card's is the recipe, not one pixel of
// paint.
//
// THE PLAQUE — THE RAIL'S OWN COAT SINCE 2026-08-30 (the day's later ask:
// "making its background color the same as the bar"): `--frieze-bar-base:
// var(--plaque-coat)`, the very layer list `.media-tabs` itself paints —
// legal in this dial because FriezeBar spends it in a `background:`
// shorthand, the token's ONE permitted slot (_tokens.scss's own warning:
// a layer list is not a `<color>`). Plate and rail composite to the same
// rgb, so the plate VANISHES into the bar and the band stops being a dark
// object laid on the chrome: what states it now is its ink, nothing else
// (the two rules went in the follow-up ask — their tombstone below).
// It was `--grey-8` from the card era to this ask — two steps under the
// line ink, a tone chosen for the CARVE (a groove only reads when the
// plate is well under what is cut into it) and, on this surface, for being
// the only DARK thing on a light-cream rail. Neither job survives the ask:
// the carve has been `none` since the band went pixel-drawn, and no dark
// thing is exactly what the ask wants.
//
// THE MOTIF — FLAT SINCE 2026-08-30 (the recolor ask: "re-painting the
// gradient part with grey-4"; `--grey-4` held one pass and the follow-up —
// "pls try grey-6" — settled it on the rail's own line ink, so meander and
// rim are ONE tone and the deleted rules' "one ink at one weight" reading
// survives them in the motif itself): the wave is a `background-color` again and
// the `-paint` dial is DELETED, not blanked — FriezeBar's
// `background-image: var(--frieze-bar-wave-two-paint, none)` falls back to
// `none`, so the flat dial is the drawn ink itself rather than the
// never-seen fallback it had been since 2026-08-22.
// What ended here: the cyan→indigo ramp the band brought from the post
// cards — the two families' A100 accents, one gradient spanning the full
// 1440px however many times the mask tiled (indigo-led on 08-22, inverted
// 08-24 so the lighter accent sat where the carve's light comes from). The
// POST CARD's pair still runs its own indigo-led ramp, so what the two
// surfaces share now is only the band recipe, not any of the coloring.
// ⚠ Note the VALUE INVERSION the new pair makes: `--grey-6` (#9e9e9e) is
// well DARKER than the coat it sits on (#f8f2e4 composite) — dark ink cut
// into a light plate, the direction the footer's cream hour proved a carve
// can never wear (the groove reads only when the ink is lighter than its
// plate). Harmless today because the carve is off under the pixel-drawn
// law; it is the constraint to check before ever turning the carve back on.
//
// THE TWO RULES — DELETED 2026-08-30 (the recolor's follow-up ask; the note
// at their old declaration below has the geometry). They came with the band
// from the card (`--grey-6` here where the card ran `--grey-5`, framing the
// dark plate in its host's line ink so it read as BOUND rather than as a
// stripe floating on the sheet), and the recolor had already changed their
// job: with the plate vanished into the coat they were the band's only
// drawn edges. The follow-up ask deleted exactly that — the bar's chrome is
// down to ONE horizontal line, the rim, and the meander floats free. The
// `+ 2px` the band's height dial once carried for their border-box cost now
// buys the mask's two empty edge rows instead; the arithmetic never moved.
//
// `flex: 0 0 auto` is load-bearing: the bar states a height, and in a flex
// column an item that MAY shrink will.
.media-tabs__frieze {
  // (`flex: 0 0 auto` stood here while the band was the rail's flex item;
  // since 2026-09-28 the ROW `.media-tabs__band` is that item and each
  // frieze's width is the row's business — the `--left`/`--right` rules.)
  --frieze-bar-h: var(--media-tabs-frieze-h);
  // ── ⭐ THE SWAP (2026-08-30, the sitting's last ask: "invert the frieze
  // pattern on the top nav bar with the bottom footer nav bar one") ──────
  // The two bands exchanged COLORINGS. The footer's trail had taken this
  // band's pre-recolor dress earlier in the day and preserved it, so the
  // swap is a RESTORATION here — grey-8 plate, teal-11 flat, the cyan→indigo
  // ramp — while the recolor's quiet grey-6-on-coat moved downstairs to
  // `.nav-frieze` (deleted outright 2026-09-23 — user ask — so this rail's band
  // is the window's ONLY horizontal frieze now). What did NOT come back: the two 1px rules (deleted by the
  // recolor's follow-up ask and absent on the footer too, so the swap has no
  // frame to carry) — the plate is a bare dark stripe on the cream rail now,
  // exactly the presentation the trail had. Geometry untouched: band 13px,
  // layer 13px, `auto 13px` exact fit — the mask's two empty edge rows show
  // plate, which against a grey-8 plate is simply more plate. The recolor's
  // paragraphs below stand as that sitting's record; the dials here are the
  // law.
  --frieze-bar-base: var(--grey-8, #616161);
  // ── ⭐ THE RULES ARE BACK — THE FEED RAILS' LIPS, TURNED VERTICAL (2026-
  // 09-28, user ask: "the nav lips are way too thick now. Try using the
  // same proportions as the feed container friezebars, but adapt them to
  // the verticalness of the top header bar. … use gray instead of the
  // indigo color pallette of the feed frieze bars and also we're still
  // using the gradient animated frieze bars as they are"). The feed's
  // vertical band (`.feed-container__edge`, FeedPage) is rule 1 · pad 1 ·
  // layer 9 · pad 1 · rule 1 on an `--indigo-10` plate inside a 2px coat
  // rail; this band is the same anatomy on ITS plate — `--grey-8`, the
  // grey the ask names — round ITS drawing: the two 1px `--grey-6` rules
  // below (deleted 08-30, back by this ask), `--frieze-bar-pad: 1px` (the
  // dial's own default, zeroed since 08-27, restored), the 13px pixel-drawn
  // aurora band between them untouched. The element is 17px border-box
  // (`--media-tabs-frieze-h` = the 21px face less the 2px lips), the
  // drawing 13 of it: 1 + 1 + 13 + 1 + 1. The glass pane (`::after`, inset
  // 0) covers the padding box — pads and drawing — inside the rules, so
  // its light edge lines fall on the pads: a bevel inside the rule.
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
  // ── ⭐ THE TWO RULES ARE GONE (2026-08-30, the recolor's follow-up ask:
  // "remove the top and bottom borders of the inner frieze bar") ─────────
  // The 1px grey-6 border-top/-bottom pair stood here from the band's card
  // days. With the plate already vanished into the coat they had become the
  // band's only drawn edges — and the ask deletes exactly that: the band is
  // a bare meander floating on the rail now, no plate, no frame. ⚠ The
  // GEOMETRY deliberately did not move: band stays 13px, so the layer is
  // 13px (border-box no longer loses 2px) and the `auto 13px` mask fits it
  // EXACTLY — the file's two empty edge rows render INSIDE the layer, in
  // plate paint that IS the coat, so they read as 1px more lip on each side
  // and the ink stays 11px, centered. The old "no third state" warning
  // (13-with-overhang or 15-with-pads) was about a DARK plate gapping
  // between ink and rules; with plate = coat and no rules, a plate-painted
  // row is indistinguishable from the lip, and the state is legal.
  // ── ⭐ THE BAND IS PIXEL-DRAWN (2026-08-27, the ask after the exchange:
  // "the frieze pattern on the header bar looks very distorted … adjust the
  // header's height so we can fit a clean svg pattern inside, while keeping
  // the bar as thin as possible" — earned by the FULL pattern, KEPT by the
  // slim one when 2026-08-30 took the band back to a single wave: these two
  // dials reach through `slim` since that day, see FriezeBar) ───────────
  // The exchange's first cut kept the 12px band and squeezed the two-wave
  // motif into it at `auto 117%` under a halved carve — ~0.72px a row, which
  // held for a SLIM band and smears for a full one (twice the ink at the
  // same row size; "very distorted" is that number seen). The cure is the
  // one the side trio and the feed's bands already use, and the HEIGHT paid
  // for it (`--media-tabs-band` walked 14 → 17px face, total 15 → 18px —
  // the arithmetic and the floor argument live on that token):
  //  ⭐⭐ 2026-09-28, LATER — THE BAND IS 13 AGAIN AND THE LIPS ARE 4 (user
  //    ask: "make the frieze bars … go back to their original thickness,
  //    they're huge now. to adapt the logo frame, just make the top and
  //    bottom lips of the top nav bar thicker"): `--media-tabs-lead` and
  //    `--media-tabs-frieze-pad` are 4px each (_tokens.scss), the rail
  //    keeps its 22, and the dial below — `auto var(--media-tabs-frieze-h)`
  //    — resolves to `auto 13px` once more: pixel-drawn, one motif cell per
  //    CSS pixel, the 08-27 law back in force. The 17px hour is recorded in
  //    the block that follows; the dial's FORM stays (it follows the band),
  //    only the band it follows is 13 again.
  //  ⭐ 2026-09-28 — THE BAND IS 17px AND THE DRAWING FILLS IT (user asks:
  //    "make the frieze bars from the top nav bar a little thicker/taller
  //    too. Make sure the SVG pattern adjusts well", then — the first cut
  //    kept the motif at `auto 13px` centred with two rows of plate above
  //    and below — "make sure the svg pattern covers the full height of its
  //    container. it is currently centered but there is extra space above
  //    and below"): `--media-tabs-band` grew 18 → 22 total (band 13 → 17)
  //    and the fit FOLLOWS THE BAND — `auto var(--media-tabs-frieze-h)`,
  //    the 13-row mask drawn at 17px, 1.31px a row. ⚠ NOT PIXEL-DRAWN ANY
  //    MORE: the masks carry `shape-rendering="crispEdges"`, so the rows
  //    snap to whole pixels rather than blur — heights 1,2,1,1,2,1,1,1,2,1,
  //    1,2,1 (four rows doubled; the centre rule, mask row 6, lands on
  //    band row 8 as a single pixel). Crisp but not uniform: the price of a
  //    band that is neither 13 nor 26 (a 13-row mask's only uniform fits
  //    are 1px and 2px a row). If the unevenness ever reads, the clean move
  //    is 26 in a 31px rail, which doubles the drawing — the ask called 26
  //    more than "a little".
  //  · FIT `auto 13px` — the 231×143 file at its natural grid, 1px per row,
  //    tiling at exactly 21×13. The band's inner is the full 13px since the
  //    rules left (2026-08-30; it was 11px between the pad-removal ask and
  //    that one, 15 − 2 rules − 2 pads for one pass before), so the mask
  //    fits EXACTLY — the file's two empty edge rows render inside the
  //    layer in coat paint, invisible lip — and nothing is squeezed.
  //  · CARVE OFF — the pixel-drawn law (side trio 2026-08-21, feed bands
  //    08-24): black/white flanks around 1px strokes read as grime, not
  //    relief. (The gradient did the modelling here until 2026-08-30's
  //    recolor; the band draws flat now, like the feed's.)
  // ⚠ The three numbers move together or not at all: this fit, the 11px
  // inner, and the band height that yields it. The next clean step is
  // `auto 26px` (2px a row) in a 30px band.
  --frieze-bar-fit: auto 13px; // ⭐ 09-28: the DRAWING's 13 — a literal again, since the band element is 17 with its rules and pads (it followed the band for the 17px-band hour; `auto 13px` from 08-27 until then)
  --frieze-bar-carve: none;
  // ── ⭐ THE PAD IS GONE AND THE INK STANDS ON THE RULES (2026-08-27, user
  // ask: "removing the inner padding between the svg and the top and bottom
  // borders of the friezebar") ──────────────────────────────────────────
  // `--frieze-bar-pad: 0` through the dial FriezeBar published for exactly
  // this ask, WITH the band at 13px — the pair is one edit: at 15px a zeroed
  // pad leaves a 13px inner the 13px mask fits exactly, which puts the
  // file's empty edge rows back INSIDE the layer and redraws the removed gap
  // in plate paint. At 13 the mask overhung and the ink met the rules —
  // until the rules left (2026-08-30): the inner is 13px now, the mask fits
  // exactly, and the redrawn-gap objection is void with plate = coat (see
  // the rules' tombstone above).
  --frieze-bar-pad: 1px; // ⭐ 09-28: the feed rails' pad, restored (0 from 08-27 until the rules came back)
  // ── ⭐ THE LIPS' CAST IS GONE (2026-08-30, user ask: "there is a grey veil
  // on top of the inner frieze bar … removing it") ──────────────────────────
  // An `::after` overlay stood here from 2026-08-27 — `inset: 0` + an inset
  // box-shadow PAIR, grey-6 at 0.75 (a tone a seven-ask walk settled on),
  // washing the lips' edges onto plate and motif alike — and the veil the
  // ask names IS that wash: on the `--grey-8` plate a lighter tone renders
  // as bloom across the whole band, not as two edge shadows. DELETED, with
  // the `position: relative` that existed only to anchor it. If a cast over
  // the band is ever wanted again, the recipe that matters is the overlay
  // itself: an inset shadow on THIS element paints under the wave layers
  // (background level) and stencils at every meander stroke.
  //
  // The wave's INK, drawn flat since 2026-08-30's recolor. This dial spent
  // 2026-08-22 → 08-30 as the ramp's never-seen fallback (tracking the
  // ramp's top end so a paint-less render landed on the right accent); with
  // the `-paint` dial deleted it is the ink itself — see THE MOTIF above.
  // `--grey-4` for one pass, then `--grey-6` in the follow-up ask ("pls try
  // grey-6") — then the SWAP (the sitting's last ask, the ⭐ note at the
  // plaque dial) took the greys downstairs and brought the ramp back: teal
  // flat under the cyan→indigo `-paint`, the flat dial a never-seen fallback
  // again, tracking the ramp's TOP end as it did 08-22 → 08-30.
  // ⭐ WAVE ONE'S DIALS LEFT WITH THE PATTERN (2026-08-30) AND CAME BACK WITH
  // IT (2026-09-07): they joined on 2026-08-27 when the exchange brought the
  // second wave, went when `slim` returned — `slim` v-ifs that layer out of
  // the DOM, and dials on a band that isn't drawn are the exact trap
  // FriezeBar's slim notes warn about — and are real again now that `counter`
  // has taken `slim` off the mount and layer one renders. Wave two is still
  // the mask the band never lost (`b`, the wave carrying the full-width
  // centre rule); wave one is the FOOTER TRAIL'S complement (`a`), arriving
  // horizontally mirrored so the two meet.
  // ── ⭐ BOTH WAVES ARE THE BAR'S OWN CREAM SINCE 2026-09-07 (user ask:
  // "color both frieze svgs the same color as the header bar light-cream
  // color") — AND THE RAMPS ARE DELETED WITH THEM ────────────────────────
  // `--plaque-flat`, which is `--plaque-coat`'s composite measured as a flat
  // `<color>` (#f8f2e4). It has to be that token and not the coat itself: a
  // wave fill is a `background-color`, and the coat is a background LAYER
  // LIST, legal only in a `background:` shorthand (the plaque dial one block
  // up can spend it; these cannot). This is the token's second frieze role —
  // the feed container's bands took it on 2026-08-27 for the same sentence,
  // "the light-cream with a veil from the header's background color" as the
  // motif — so the two surfaces draw their meanders in the same ink again.
  //
  // The ramps are DELETED, not blanked: FriezeBar's
  // `background-image: var(--frieze-bar-wave-{one,two}-paint, none)` falls
  // back to `none`, so the flat dial IS the drawn ink. What ends here is the
  // cyan→indigo pair the band had worn since the post cards handed it over
  // (08-22, inverted 08-24, downstairs and back through 08-30's swap) and the
  // REVERSED counterpart wave one took when `counter` landed this morning.
  //
  // ⚠ ONE TONE FOR BOTH MASKS, which the platform has drawn once before —
  // `.nav-frieze`'s cream era (2026-08-23 → 08-30), where an ask naming one
  // colour for "the inner friezes" made the interleave read as a SINGLE
  // meander. Here that is the point rather than the price: the pair is
  // OPPOSED and, at the -11px phase below, collision-free, so one ink makes
  // the two waves read as one continuous key running the width of the window
  // instead of two motifs sharing a strip. What tells them apart now is
  // DIRECTION and PHASE alone — the mask swap and the shift, not colour.
  //
  // ⚠ AND THE VALUE RELATION FLIPS BACK, which retires a standing warning:
  // cream ink on the `--grey-8` plate is LIGHTER than its plate for the first
  // time since 2026-08-30's recolor, so the "value-inverted → the carve is
  // forbidden by law" note that has ridden these dials through the recolor,
  // the swap and this morning's pattern change is VOID. The carve is still
  // `none`, but now only by the pixel-drawn law (1px strokes + black/white
  // flanks = grime), which is a reason that could be argued with rather than
  // a geometric impossibility.
  --frieze-bar-wave-two: var(--plaque-flat, #f8f2e4);
  // ── ⭐ THE AURORA (2026-09-26, user ask: "take a good pastel color palette
  // from all the -11 quasar tones of our color palette and then build a
  // gradient that slowly twists in a pretty loop of random smooth slow
  // gradients of those colors transmutating into another. like a
  // sunrise-sunset endless thing … apply it onto the friezebar svg inside the
  // top header nav bar") ────────────────────────────────────────────────────
  // The wave's PAINT is alive. `composables/useAurora.js`, mounted on this
  // element from setup (`ref="frieze"` → `$el`), writes `--aurora-paint`
  // inline — a nine-stop `linear-gradient(90deg, …)` re-drawn at ≤30fps, its
  // colours sampled off a WHEEL of the palette's nine A100s in hue order (red
  // → deep-orange → orange → yellow → lime → teal → cyan → indigo →
  // deep-purple; five of them minted for it, see `$red-11`) — and this dial
  // hands the paint to FriezeBar's `-paint` seam, where it fills the motif
  // and nothing else (the note there: a gradient fills the background
  // positioning area once, the mask decides the shape, the plate is another
  // element's background). What moves: the wheel turns once every ~4 min
  // (speed wobbling ±40% on smooth noise, never backwards), the visible ARC
  // breathes around three tones across the width, and a small bend
  // stretches and squeezes the bands as they drift right. Wall-time driven
  // (no integration), so a background tab comes back to where the sky would
  // be. NOTHING GEOMETRIC MOVED: 13px band, `auto 13px`, pad 0, carve none,
  // one wave, mask `b` — the witness's HD law now reads "every pixel is the
  // plate or its column's ink", which is the same law with a moving ink.
  // ⚠ The cream dial above is the never-seen FALLBACK again (its 08-22 →
  // 08-30 role): `var(--aurora-paint, none)` is `none` until the first frame
  // and under a script-less render, and the flat cream is what shows then.
  // ⚠ Reduced motion: the composable paints ONE frame and holds it — the sky
  // stands, it does not vanish.
  // ⭐ 2026-09-28: THE WIRE MOVED TO THE TWO SIDES — `.media-tabs__frieze--left`
  // reads `var(--aurora-paint, none)` exactly as this rule did, and
  // `--right` reads the sky's mirror, `var(--aurora-paint-mirror, none)`.
  // Both properties are written inline on the ROW the friezes stand in.
  // ── ⭐ THE OPPOSED WAVE'S INK — THE SAME RAMP, RUN THE OTHER WAY
  // (2026-09-07; ⚠ SUPERSEDED THE SAME SITTING by the cream ask — the ⭐
  // block at wave two's dial. This paragraph is the record of the hour the
  // band spent as a two-accent reflection, and of the one argument in it
  // that OUTLIVED the ramp: a mirrored pair wants its halves distinguishable,
  // and when the colour stopped doing that job the DIRECTION and the -11px
  // PHASE were already carrying it) ────────────────────────────────────────
  // The PATTERN came from the footer trail; the COLORING deliberately did
  // not. The trail's greys are a quiet band under a row of buttons; this rail
  // has one motif for the whole window and it has worn the two A100 accents —
  // teal-11 → indigo-11 — since the post cards handed the band over. Two
  // greys arriving on top of that would make the band read as two objects in
  // two palettes rather than one motif that turned back on itself.
  //
  // So wave one takes wave two's ramp REVERSED — indigo-11 at the top, teal-11
  // at the foot — which is the device the post card's own mirrored PAIR
  // already used (FriezeBar's `-paint` note: "the post card's pair runs
  // teal-11 → indigo-11 down the band, reversed on the mirrored one"). Here
  // the reflection happens inside ONE band instead of across two, and the
  // reversal is what makes the mirroring legible: where the two meanders
  // meet, the light accent of one lies against the dark accent of the other,
  // so the encounter is a colour event as well as a shape one. Told apart by
  // VALUE as well as by shape — the law `.nav-frieze` records for every band
  // whose two masks draw at once.
  //
  // The flat dial is a NEVER-SEEN FALLBACK, tracking its ramp's TOP end
  // exactly as wave two's does, so a paint-less render lands on the right
  // accent rather than a stray one.
  //
  // ⚠ Both waves are LIGHTER than the `--grey-8` plate, which is the relation
  // this band has always drawn and the only one a carve could ever be turned
  // back on over. (It stays `none` under the pixel-drawn law regardless.)
  // ⭐ NOW `--plaque-flat` LIKE ITS TWIN (the cream ask) — the reversal above
  // is history and the two waves are ONE ink; see wave two's block.
  // ⭐ AND GONE WITH THE LAYER, 2026-09-26 (the "doubled out" ask — the
  // template comment has it): `slim` is back on the mount, layer one is
  // v-if'd out of the DOM, and a dial on a band that isn't drawn is the
  // exact trap FriezeBar's slim notes name — the same reason these dials
  // left on 2026-08-30. The declaration was `var(--plaque-flat, #f8f2e4)`.
  // If the second wave ever returns it comes back WITH the layer, as it did
  // on 09-07, never ahead of it. (The witness reads the host's own rules for
  // this property and fails if a dial dresses the undrawn layer.)
  // ── ⭐ AND THE OPPOSED WAVE IS PULLED 11px LEFT (2026-09-07, the ask right
  // after the pattern landed: "move the new line a little to the left so that
  // it fills up the space in between that the other svg left … well
  // distributed") ─────────────────────────────────────────────────────────
  // THIS IS WHAT FINISHES `counter`, not a nudge. The two masks interleave
  // because they are one meander offset by HALF A TILE; mirroring layer one
  // threw that offset away, so both motifs came to rest on nearly the same
  // columns — 20 of the tile's 21 columns collided, the two ramps painting
  // each other out, which is the clotted single wave the ask is looking at.
  //
  // 11 IS MEASURED, NOT PICKED. The masks are a 21 × 13 cell grid; walking
  // layer one left one column at a time and counting cells that land on layer
  // two's gives a clean minimum: 20 collisions at 0, dropping through 7 at
  // −7px, and **exactly 0 at −11px** — the only offset in the tile with none
  // at all (−10 and −12 both leave 4). And what lands there is better than
  // merely non-colliding: at −11 the tile is SYMMETRIC about the centre rule,
  // rows 1–5 mirroring rows 7–11 with the two layers exchanged, so the band
  // reads as one motif reflected rather than two motifs sharing a strip.
  //
  // ⚠ THE UNIT IS A MOTIF COLUMN AND IT IS ONLY 1px HERE BECAUSE OF THE FIT.
  // `auto 13px` renders the 231 × 143 file at 21 × 13, so one column is
  // exactly 1px and 11 columns is 11px. Move `--frieze-bar-fit` and this
  // number MUST move with it — `shift = columns × N / 13` for a fit of
  // `auto Npx` (the next crisp step, `auto 26px`, would want 22px). The
  // COLUMN COUNT is the constant; the pixels are a reading of it.
  // ⭐ TOMBSTONE, 2026-09-26: `--frieze-bar-wave-one-shift: -11px` left with
  // the layer it phased (the wave-one tombstone above). The measurement
  // stands — −11 columns is still the one collision-free phase of the
  // opposed pair at `auto 13px` — and so does its other property, which is
  // what retired the pair: −11 is also the SYMMETRIC phase, and at one ink a
  // reflection reads as a doubled motif rather than as two waves meeting.
}

// ── ⭐ THE BAND IS A ROW (2026-09-28, user ask: two friezes converging on a
// slidable logo seam — the template note carries the ask in full) ─────────
// `.media-tabs__band` is the flex item the band used to be — `flex: 0 0
// auto` in the rail's column, the band's own 13px tall — and INSIDE it a
// flex row: left frieze │ seam │ right frieze. The friezes' dials are
// unchanged and shared (`.media-tabs__frieze` above); what the row adds is
// WIDTH — the left band's basis is the seam's fraction of the travel, the
// right band the remainder — and which way each one faces.
// `--logo-frac` is written inline on this row by the component (the drag).
// `--media-tabs-seam-w` is the gap the row leaves for the badge, NARROWER
// than the hexagon (`--media-tabs-hex-w`) so the friezes' ends tuck under
// its diagonal edges and the badge reads as set INTO the band
// ("incrusted"), not laid across it.
.media-tabs__band {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  height: var(--media-tabs-frieze-h);
  // 24 × 48 × 21: the hexagon's upper diagonals run from its left vertex
  // (y=10.5) to its top-left vertex (x=12), so at the band's top row (y=2)
  // the wedge stands 9.7px in from the box (the rounded corner adds nothing
  // there); a gap of 24 leaves 12px of overhang each side, and every
  // frieze end is under opaque badge at every row of the band. (52 × 25 on
  // the 26px rail for an hour; 46 × 21 before; 44 × 18 before the rail
  // grew; 40 with a 1px rim before that; 6 × 38 × 32 for the hour the
  // hexagon hung to the tabs' floor.)
  --media-tabs-seam-w: 24px;
  --media-tabs-hex-w: 48px;
  // THE RAIL'S FACE — `--media-tabs-band` (21: lead + band + pad), NOT
  // `--media-tabs-h` (22, which counts the rim): the badge stands on the
  // bar's edge line and never over or past it (user ask, the sitting's
  // last word on it: "constrained to the top nav header bar's height (not
  // the friezebar height!) … renders exactly within the header height and
  // not like overlapped and slipped to the bottom"). Top at the bar's top
  // edge, bottom on the rim, the rim running UNBROKEN beneath it — unlike
  // a parked tab, which hangs through the line.
  --media-tabs-hex-h: var(--media-tabs-band);
}

// THE LEFT FRIEZE — the band as it was (mask b-mirror, the sky at 90deg)
// with ONE change: its mask is anchored at its RIGHT edge — `100%` through
// the shift dial, which is a `mask-position` length; a percentage is legal
// there and reads "the tile's right edge on the box's right edge", tiling
// leftward from it. Anchored at the SEAM the motif stays glued to the badge
// as it slides and feeds in from the screen's left edge; anchored at the
// screen edge the two halves would phase against each other at the seam
// and the reflection would hold at exactly one width.
.media-tabs__frieze--left {
  flex: 0 0 calc((100% - var(--media-tabs-seam-w)) * var(--logo-frac, 0.5));
  --frieze-bar-wave-two-shift: 100%;
  --frieze-bar-wave-two-paint: var(--aurora-paint, none);
}

// THE RIGHT FRIEZE — `flip` on the mount (mask b PLAIN, the `-mirror` file's
// own reflection: an asset swap and never a transform, FriezeBar's law),
// anchored at ITS left edge, which is the seam, and painted with the sky's
// MIRROR — `--aurora-paint-mirror`, the same nine stops at the same instant
// under `270deg`, so its colours drift LEFT toward the seam as the left
// band's drift right toward it. Two reflections about one seam: the motif
// and the sky both converge on the badge.
.media-tabs__frieze--right {
  flex: 1 1 0;
  --frieze-bar-wave-two-paint: var(--aurora-paint-mirror, none);
}

// ── THE GLASS (2026-09-28, user ask: "on top of the frieze bars, add a thin
// very light gray layer on top, with thin clearer borders. This new layer
// must be very translucid and also have a little blurring factor, so it
// looks like a thin subtle light glass cover on top of the gradient-animated
// friezebars") ───────────────────────────────────────────────────────────
// An OVERLAY on each frieze — `::after`, `inset: 0`, the band's full 13px —
// and not an inset shadow on the element (the 08-27 lesson, restated at the
// lips' tombstone above: an element-level inset shadow paints UNDER the wave
// layers). Three things make it glass: a wash of grey-3 at 16% (#eeeeee,
// stated as rgba because a token is a `<color>`, not a channel triple), two
// 1px rules of white at 34% on its top and bottom edges — the "clearer
// borders", lighter than the wash, landing on the mask's two empty edge
// rows — and a `backdrop-filter` blur, the "little blurring factor":
// enough to soften the meander's pixel stairs under the pane, not enough
// to lose a 1px stroke. Plate and sky beneath are untouched. ⚠ The first
// cut ran 16% / 42% / 0.7px and was walked DOWN the same sitting, twice
// ("less blurry and also less opaque" → wash 8%, rules 34%, blur 0.35px;
// then "even slightly less opaque and less blurry" → wash 5%, blur 0.2px,
// the rules held at 34% so the pane keeps its edges).
// ⚠ This RETIRES the witness's pixel-exact "HD" law (every pixel the plate
// or its column's ink): under a blurred, tinted pane no pixel is either
// exactly. The witness now measures the pane and the band's unchanged
// dials under it — the drawing is still `auto 13px` on the grid.
// ⚠ `position: relative` is BACK on the band for the overlay — the same
// anchor the lips' cast had and lost (08-30). This is a wash the ask wants
// across the whole band, so the bloom that retired the cast is the point.
.media-tabs__frieze {
  position: relative;
  min-width: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    pointer-events: none;
    background: rgba(238, 238, 238, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.34);
    border-bottom: 1px solid rgba(255, 255, 255, 0.34);
    backdrop-filter: blur(0.2px);
    -webkit-backdrop-filter: blur(0.2px);
  }
}

// ── THE SEAM AND THE BADGE (2026-09-28) ─────────────────────────────────
// `.media-tabs__logo` is the row's middle item — the seam's width of band
// left EMPTY (the rail's coat shows through: no plate, no sky) — and the
// one thing on this click-through rail that can be GRABBED. It is 13px tall
// like its neighbours; the badge hangs from it ABSOLUTELY, up to the rail's
// top edge and down past the rim, so the row's height never learns the
// badge's. `z-index: 1` puts it over the RIGHT frieze, which follows it in
// the DOM and would otherwise paint across the hexagon's right shoulder.
// `touch-action: none` so a finger drags the seam instead of the page.
.media-tabs__logo {
  flex: 0 0 var(--media-tabs-seam-w);
  position: relative;
  z-index: 1;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  user-select: none;
  outline: none;

  &:active { cursor: grabbing; }
  &:focus-visible .media-tabs__hex { --hex-rule: var(--indigo-6, #3f51b5); }
  // ⭐ 2026-09-29: ANCHORED — the feed page's right rail holds the seam
  // (composables/useSeamAnchor; the script's `follow`). PM: grabbing the
  // badge grabs the RAIL (THE GRIP), so it wears the rail's cursor.
  &.is-anchored,
  &.is-anchored:active { cursor: col-resize; }
}

// The badge — centred on the seam, its top on the rail's top edge (`-lead`
// lifts it out of the band by the lead's 2px), its bottom on the rim: the
// hexagon is the rail's face and lives inside it. ⭐ A THIN CAST OVER THE
// FRIEZES (2026-09-28, user asks: "make the logo project a thin shadow over
// the friezes", then "add to it a little shadow on top of the bar"):
// `drop-shadow` on THIS box, never on the hexagon —
// `clip-path` clips a box-shadow with the box, a filter on the parent
// follows the clipped silhouette — 1px down, 2px soft, the deep ink at
// 40%: on the grey-8 plate under the pane it reads as a hairline of
// shade along the badge's lower edges, and it vanishes into the rail's
// cream lips above and below (the badge stands over the friezes at z 1,
// so the cast lands on the band, not under it). It wore no cast from the
// plate's hour to this ask — the parked tabs wear none.
.media-tabs__badge {
  position: absolute;
  top: calc(-1 * var(--media-tabs-lead));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 1px 2px rgba(var(--ink-rgb-deep), 0.4));
}

// THE HEXAGON — flat-top, `--media-tabs-hex-w` (48) wide and the RAIL'S
// FACE (`--media-tabs-hex-h` = `--media-tabs-band`, 21: the bar's height
// above its rim) tall — stretched, not regular: the bar is the height it
// has and the badge lives inside it (user asks: "fits inside the top nav
// bar"; "constrained to the top nav header bar's height … not like
// overlapped and slipped to the bottom"). FOUR nested clip-paths — all
// `path()`s in PIXELS with six quadratic corners (a `polygon()` has no
// curves; the numbers are generated from the vertices, each corner cut
// along both edges and joined through the vertex; a px path is drawn for
// THIS box, the price of the curves) — and ⭐ THEY ARE THE LIPS' OWN
// LAYERS (the sitting's last ask on the badge: "for the frame, adapt it to
// look exactly like the lips of the friezebars so it matches the
// aesthetic"): reading inward exactly as the rail reads down from its top
// edge — the COAT, 2px of cream `--plaque-flat` (the element); the RULE,
// 1px of `--grey-6` (`::before`, inset 2px / 2.6px — the sides' inset is
// 1.3× the top's, the diagonals' run over their rise on this box, so the
// ring reads one thickness round); the PAD, 1px of the band's `--grey-8`
// plate (`.media-tabs__hex-face`, the element, inset 3px / 3.9px); and
// the FACE (its `::before`, inset 4px / 5.2px → 37.6 × 13 on the band's
// own rows). The badge's cross-section IS the rail's: coat · rule · pad ·
// drawing · pad · rule · coat, 21px, its face rows the band's drawing
// rows. (The morning walked outline → none → outline; this is neither: the
// grey line is the RULE, inside the coat, where the band's own rule is.)
.media-tabs__hex {
  --hex-coat: var(--plaque-flat, #f8f2e4);
  --hex-rule: var(--grey-6, #9e9e9e);
  position: relative;
  width: var(--media-tabs-hex-w);
  height: var(--media-tabs-hex-h);
  clip-path: path('M 9.366 2.305 Q 12 0 15.5 0 L 32.5 0 Q 36 0 38.634 2.305 L 45.366 8.195 Q 48 10.5 45.366 12.805 L 38.634 18.695 Q 36 21 32.5 21 L 15.5 21 Q 12 21 9.366 18.695 L 2.634 12.805 Q 0 10.5 2.634 8.195 Z');
  background: var(--hex-coat);

  &::before {
    content: '';
    position: absolute;
    inset: 2px 2.6px;
    clip-path: path('M 8.351 1.866 Q 10.7 0 13.7 0 L 29.1 0 Q 32.1 0 34.449 1.866 L 40.451 6.634 Q 42.8 8.5 40.451 10.366 L 34.449 15.134 Q 32.1 17 29.1 17 L 13.7 17 Q 10.7 17 8.351 15.134 L 2.349 10.366 Q 0 8.5 2.349 6.634 Z');
    background: var(--hex-rule);
    transition: background 0.12s;
  }
}

// THE PAD AND THE FACE — this element is the 1px pad ring in the band's
// own plate (`--grey-8`, the grey the ask names in place of the feed
// rail's `--indigo-10`), and its `::before` is the face: `--grey-9`,
// Quasar's grey-9 (user asks, the sitting's last on the face: "make the
// background color of the hexagonal logo on the headbar a dark tone of
// grey instead of indigo", then "make the grey less dark" — grey-10 for a
// minute; grey-9 is one step under the pad's grey-8, so the pad ring
// still reads as a line; `--indigo-10` for the hour before, the page's
// starfield layers for the hour before that — the tile's base rect is
// opaque black, a colour cannot sit under it), with the mark over it —
// `assets/logo/pathos-planet-cream.png` (354², the cream planet on a
// TRANSPARENT ground, the second supplied file), CROPPED ALL AROUND to the
// planet ("make sure the icon is perfectly visible"): `auto 215%` of the
// face's 13px draws the file 28px tall — the planet ~12.2px tall and
// ~19.7 wide, half a row of indigo above and below, the ring's tips 2px
// inside the slants — and CENTRED BY MEASUREMENT: the PNG's opaque box is
// x 53–301, y 109–262, its centre 8.5 file px BELOW the file's centre
// (which `center` alone had honoured, so the mark hung low); at this
// scale that is 0.67px, and the position lifts the image by exactly that.
.media-tabs__hex-face {
  position: absolute;
  inset: 3px 3.9px;
  clip-path: path('M 7.886 1.615 Q 10.05 0 12.75 0 L 27.45 0 Q 30.15 0 32.314 1.615 L 38.036 5.885 Q 40.2 7.5 38.036 9.115 L 32.314 13.385 Q 30.15 15 27.45 15 L 12.75 15 Q 10.05 15 7.886 13.385 L 2.164 9.115 Q 0 7.5 2.164 5.885 Z');
  background: var(--grey-8, #616161);

  &::before {
    content: '';
    position: absolute;
    inset: 1px 1.3px;
    clip-path: path('M 7.344 1.422 Q 9.4 0 11.9 0 L 25.7 0 Q 28.2 0 30.256 1.422 L 35.544 5.078 Q 37.6 6.5 35.544 7.922 L 30.256 11.578 Q 28.2 13 25.7 13 L 11.9 13 Q 9.4 13 7.344 11.578 L 2.056 7.922 Q 0 6.5 2.056 5.078 Z');
    background:
      url('../../assets/logo/pathos-planet-cream.png') 50% calc(50% - 0.67px) / auto 215% no-repeat,
      var(--grey-9, #424242);
  }
}

// ⭐ TOMBSTONE — THE NAME PLATE (2026-09-28, one hour). Under the 18px
// hexagon hung a plate that WAS a parked tab (`.media-tabs__tab` on the
// element, so face / rim / 9px corners / both flares / hover / press came
// by construction; `.media-tabs__tab.media-tabs__plate { margin-top: -1px;
// min-height: 15px; min-width: 0; max-width: none; flex: none; font-weight:
// 700; cursor: inherit }`), seated at y=17 — the rail's padding-box
// underside, the parked tabs' own line — reading "pathos.cloud" in bold
// Nasalization. The sitting's last ask took the text and gave the plate's
// 14px to the hexagon ("so the icon looks bigger"); the name lives in the
// seam's `title`. Two lessons stay: a tab that must match the tabs wears
// their CLASS, and the theme is border-box (a 12px "content floor"
// measured 12, not 15).

// ── …ON EVERY ROUTE, /feed INCLUDED AGAIN (2026-08-24, user ask: "make the
// main public feed container be drawn behind the top navigation header and the
// footer navigation bar") ─────────────────────────────────────────────────
// A `.media-tabs--underlaid` rule stood here from 2026-08-21 to today, dropping
// this rail to z 2999 on /feed at desktop widths so the feed column (3001,
// running y=0 to the window floor) could paint across its span. The column has
// not moved; the ask reverses which one wins where they cross, so the rule is
// DELETED along with the nav bar's twin.
//
// What comes back with it is worth naming, because it was the honest cost of
// the era: on /feed the drawer's and the stack's frieze bands (3120 / 3100)
// covered this rail's far ends — the pre-08-18 corner look — since one element
// holds one z and the container's claim on the middle outranked the corners'
// claim on the rail. That is gone: the 2026-08-18 reading ("the rail draws on
// top of BOTH columns") now holds on every route without exception.

// Tabs hang DOWN from the band, minitab-style (rounded bottoms — the nav
// strip's device mirrored to the top edge), and the row is pinned to the
// RIGHT: it starts at the right edge and grows leftward, capped at half
// the screen. Three things carry that cap, in order:
//
//  1. each tab SHRINKS (`flex: 0 1 auto` down to a 46px icon-and-a-sliver
//     floor, the name ellipsing as it goes),
//  2. then the row SCROLLS sideways,
//  3. and the pinning is `margin-left: auto` on the first tab, NOT
//     `justify-content: flex-end` — with flex-end, overflowing content
//     spills past the scroll container's start and cannot be scrolled back
//     to (see specs/gotchas.md). The auto margin simply collapses to 0 the
//     moment the row is full, and the strip scrolls like any other.
//
// The side padding is what the outermost tab's flare needs to live in
// (the fillets reach 9px beyond the tab), and the bottom padding leaves
// room for the hover's extra 3px and the press's 1px dip, so neither can
// raise a stray scrollbar.
.media-tabs__row {
  --mtab-gap: 6px; // the slot between tabs — the web (in the tab rule) spans exactly this
  position: absolute;
  top: 100%;
  // ── CLEAR OF THE FORWARD BUTTON (2026-08-31 — the pair moved INTO the
  // bar and Forward took the right end, so the corner this offset clears
  // changed hands again) ──
  // This offset is the row's PADDING box, so the outermost flare paints out
  // to exactly this line and the tab's own edge stands 9px further in.
  // History of the corner: a flat `31px` aimed at the parked STACK rail
  // (2026-08-24, "a little away from the stack sidebar"), restated against
  // `--dock-rail-w + 10px` the same day — and the stack left the top-right
  // corner on 2026-08-30, which made that formula a reservation for
  // nothing. It now clears `.media-tabs__forward`: 90px = the block's
  // measured ~76px (word + glyph + pads at 0.62em) plus daylight a little
  // over the row's own 6px tab gap — the same "not another tab" reading the
  // stack got. ⚠ A static number because CSS cannot measure a sibling:
  // if the Forward block ever grows (a longer word, a bigger glyph), this
  // moves with it or the rightmost tab slides underneath.
  right: 90px;
  max-width: 50vw;
  display: flex;
  gap: var(--mtab-gap);
  padding: 0 9px 5px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; // a scrollbar under a 15px tab strip is all noise
  &::-webkit-scrollbar { display: none; }

  > .media-tabs__tab:first-child { margin-left: auto; }
}

// A tab is a piece of the band pulled downward: the band's own face
// (`--plaque-flat`, the chrome coat as a flat colour) inside the band's own
// rim (`--media-tabs-rim` of `--grey-6`), so the two are one material with
// one continuous edge — it spent one ask on a `--grey-4` face and a 1px
// `--indigo-4` rim after the band moved without it, and rejoined on
// 2026-08-17; it was the media window's `--grey-6` rim tone until
// 2026-08-06 (user ask), which is the day the handle stopped matching the
// window it opens and started matching the STRIP it hangs from — and
// `--indigo-10` ink in the display face. `--mtab-face` exists so the flares
// can follow the face through hover and press — they are painted by a
// gradient and cannot inherit `background`.
// ── ⭐ THE TABS WEAR THE WINDOW THEY RESTORE (2026-09-28, user ask: "for
// all the tabs that hang off the header nav bar, they open flyout windows
// that are grey. Help me make the tabs match the flyout's background
// color. Also help me slightly reducing the padding around their text and
// making their text slightly bigger. then, also add to the tabs a thin
// border on the top so they look separated from the header bar") ───────
// Four moves on the rule below, each marked ⭐ 09-28 on its line. (1) THE
// FACE is `--grey-4` — the coat `.element-flyout` paints — so a tab and the
// window it restores are one material again (they parted on 2026-08-17,
// when the strip took the rail's cream; the `--grey-4` token's note has
// that walk); hover lifts one rung to `--grey-3`, press lays `--grey-5`.
// (2) PADDING `0 8px 1px` and (3) TYPE `0.7em` — the text a step larger in
// a box a step tighter. (4) A TOP EDGE: the rim runs on all four sides,
// and since the tab hangs from the rail's padding-box underside its top
// border lands ON the rail's rim row in the rail's own ink — the line runs
// unbroken across the tab and the tab reads as hung from it, separated,
// not grown out of it. ⚠ THE FLARES ARE RETIRED WITH IT: the two concave
// fillets curved the tab's shoulders up INTO the bar, painting the joint
// in the face colour over the rim — a joint and a separating line cannot
// both be true, and the ask is the line (tombstone inside the rule; the
// row's 9px side padding they needed is untouched).
.media-tabs__tab {
  // ── THE TAB REJOINED THE BAND (2026-08-17, user ask, reported off the
  // SKELETON FLYOUT's minimize — every flyout and viewer parks on this same
  // strip, so one rule covers them all) ──
  // `--plaque-flat` is `--plaque-coat` as a flat `<color>`: the coat's
  // measured composite (#f8f2e4), which exists precisely because this face is
  // also consumed inside the flares' gradient stops, where a background layer
  // list is illegal. Tab and band are one material again — the state the
  // strip was built in and lost for the hour the band alone wore the coat.
  --mtab-face: var(--grey-4, #e0e0e0); // ⭐ 09-28: the flyout window's own coat (ElementFlyout.vue) — `--plaque-flat` from 08-17 until then
  // The rim matches the band's, thickness and tone: `--media-tabs-rim` of
  // `--grey-6`, so the line runs band → flare → tab unbroken again. The tab
  // has no top edge (it flows OUT of the band), so what this paints is the
  // bottom sweep and the two sides — one continuous edge with the rail's.
  --mtab-rim: var(--media-tabs-rim, 2px);
  --mtab-rim-ink: var(--grey-6, #9e9e9e);
  --mtab-r: 9px; // the two free corners' radius — the web's geometry below is derived from it and the gap
  --mtab-web-r: 6px; // THE WEB'S ARC: the one radius tangent to both neighbours' corners — sqrt((gap/2 + r)² + r²) − r = sqrt(12² + 9²) − 9 = 6 for gap 6, r 9. Change the gap or the radius and this must be re-derived
  pointer-events: auto; // the one clickable thing on a click-through band
  position: relative; // the two flares are absolute to this box
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 1 auto;
  // ── THE TAB IS AS TALL AS WHAT IS WRITTEN ON IT (2026-08-24, user ask: "a
  // lot denser, removing top inner padding and making bottom padding very
  // thin") ──
  // It was a flat `height: 22px` with the row centred inside it, which spelled
  // ~5px of dead face above the glyph and ~5px below — a fixed box that had to
  // be re-cut by hand every time the writing on it changed size. The height is
  // CONTENT now: the 12px kind glyph sets the line (the name's own 0.62em line
  // box is smaller), `line-height: 1` stops the inherited leading from padding
  // it back out, and the ONLY vertical space declared anywhere is the 2px
  // under the writing. Total 12 + 2 + the rim = 15px — the band's own height,
  // so the tab hangs exactly as far below the rail as the rail is tall.
  //
  // NO TOP PADDING IS THE POINT, not a saving. The tab has no top BORDER
  // either (it flows out of the band), and with nothing above the glyph the
  // writing starts on the band's underside — metal continuing into metal,
  // which is the same argument the flares make at the two corners.
  //
  // ⚠ THE TWO NUMBERS THAT MAKE THAT HEIGHT ARE ALSO A TOKEN (2026-08-24) —
  // `--media-tabs-park-h` in _tokens.scss is how far a parked tab hangs below
  // the rail, and it is `glyph + pad` (the tab's own rim cancels against the
  // one it paints over the rail's, since the row hangs off the PADDING box).
  // The four creation docks now start their daylight from that line rather
  // than from `--media-tabs-h`, because their top border was landing on this
  // element's bottom edge. Because the tab is deliberately CONTENT-tall there
  // is no height declaration to read the number out of, so the tie is prose —
  // and `fsck --static`'s `tab-hang` witness is what makes it hold: it sums
  // the `size=` prop on `.media-tabs__glyph` above and this rule's
  // `padding-bottom`, and fails if they no longer equal the token. Change
  // either one and move `--media-tabs-park-h` in the same commit.
  min-width: 46px; // the shrink floor: glyph + a sliver of name
  max-width: 180px;
  padding: 0 8px 1px; // ⭐ 09-28: a step tighter (0 10px 2px until then)
  line-height: 1;
  border: var(--mtab-rim) solid var(--mtab-rim-ink); // ⭐ 09-28: ALL FOUR SIDES — the top edge lands on the rail's rim row in the rail's ink (`border-top: none`, "it flows out of the band", until then)
  border-radius: 0 0 var(--mtab-r) var(--mtab-r);
  background: var(--mtab-face);
  // Ink --grey-8 (2026-08-17, user ask), from `--indigo-10`. The tab stopped
  // being the one indigo-written thing on a neutral strip when the strip went
  // cream: -8 is the platform's quiet-writing step on a light face, dark
  // enough at 0.62em (5.9:1 on this face) and a whole family away from the
  // rail's own `--grey-6` rim, so mark and edge never read as one weight.
  color: var(--grey-8, #616161);
  font-size: 0.7em; // ⭐ 09-28: a step larger (0.62em until then)
  cursor: pointer;
  transition: background 0.12s, transform 0.12s;

  // Hover pulls the tab a little further out of the band — the same
  // "this one will answer" cue the side widgets use, stated as reach —
  // and lights the metal a step. Press: a 1px dip onto a step darker,
  // which is the direction a press reads on a light surface (the dark
  // coat this bar was born on wanted the opposite).
  // The two states had to be re-based when the face went from `--grey-4`
  // (224) to the cream composite (248): `--grey-3` was a step UP from grey-4
  // and is a step DOWN from this, so the old hover would have read as a
  // press. They are stated in the coat's own terms now — hover LIFTS THE VEIL
  // (the bare `--light-cream` sheet, the lightest this surface goes), press
  // lays more of it on (`--grey-3`, the veil's own tone) — which keeps the
  // original direction: lighter reaching out, darker under the finger.
  // The reach is spelled in the PAD since 2026-08-24, not in a height: with
  // the box content-sized there is no height to grow, and growing the pad
  // grows the same edge by the same +3px the `height: 22px → 25px` did.
  &:hover { --mtab-face: var(--grey-3, #eeeeee); } // ⭐ 09-28: one rung lighter than the face (light-cream on the cream face until then). ⚠ 09-29: the hover DROP (`padding-bottom: 4px`, the tab reaching 3px lower) is RETIRED — a tab webbed to its neighbours cannot sink alone: the webs are laid to its corners at rest, and a lowered corner tears both tangencies
  &:active { --mtab-face: var(--grey-5, #bdbdbd); transform: translateY(1px); } // ⭐ 09-28: one rung darker (grey-3 until then)

  // ⭐ TOMBSTONE — THE FLARES (2026-08-17 → 2026-09-28). Two 9px concave
  // fillets, `::before` at `left: -9px` and `::after` at `right: -9px`,
  // `top: 0`, `width: calc(9px + var(--mtab-rim))`, `height: 9px`, each a
  // `radial-gradient(circle at <corner>, transparent calc(9px − rim −
  // .1px), var(--mtab-rim-ink) calc(9px − rim + .1px), var(--mtab-rim-ink)
  // 8.9px, var(--mtab-face) 9.1px)` — the arc's half of the rim line and
  // the joint's inside in the face colour, curving the tab's shoulders up
  // into the bar so one line ran band → flare → tab. Retired when the tab
  // took a TOP EDGE (the note above the rule): a fillet paints the joint
  // over the rim, a separating line paints the rim over the joint.

  // ── ⭐ THE WEB (2026-09-29, user ask: "adding a curve effect on the bottom
  // part of the tabs so that this curve touches the next tab on the right.
  // This way they look like they all belong together") ──────────────────
  // Between every tab and the one to its right, the gap is FILLED — the
  // tabs' own face, from the rail's rim row down — and its foot is a
  // concave arc TANGENT to both tabs' rounded corners, so the row's bottom
  // edge is one smooth line: corner ⌣ web ⌢ corner ⌣ … the way a row of
  // hanging tiles reads when a hem joins their feet. The rim runs the whole
  // way — the tab's own around its corner, the web's 1px along its arc,
  // and a top row of ink where the web meets the rail's rim, so that line
  // is not broken across the gap either. The two vertical rims between
  // neighbours stay: they are what still says "two tabs" inside one strip.
  // GEOMETRY (box coordinates, the box being gap + 2r wide and the tab's
  // full outer height, its top on the tab's outer top, its foot on the
  // tab's outer bottom): the left tab's corner circle is centred at
  // (0, H − r), the right tab's at (W, H − r), the arc's at (W/2, H) with
  // radius --mtab-web-r; tangency needs (W/2)² + r² = (r + ρ)² — see the
  // dial above. The DRAWING is two layers: the background is the arc's
  // rim (a radial ring 1px outside ρ) then the face; the MASK cuts out the
  // three discs — the two corners (which the tabs draw themselves) and the
  // air under the arc — with `intersect`, so the web never paints a pixel
  // that belongs to a tab. Half-pixel fades on every edge for
  // anti-aliasing. Prefixed twins for WebKit's older composite keywords.
  // ── ⭐ THE WEB FITS THE TABS (2026-09-29 PM, user ask: "the membrane behind
  // the flyout window tabs … doesn't match the tab's shape. there is like a
  // square edge … smoothing out the edges with the tab edges. Also … a thin
  // border on the top border that touches the top nav bar") ──────────────
  // The box-minus-three-discs web above painted face into the box's two
  // bottom corners — the AIR under each tab's rounded corner, outside both
  // the corner disc and the arc disc — so every webbed corner read square;
  // and the neighbours' inner side rims showed through as a square channel
  // (the next tab, a later sibling, painted its left rim over the web). The
  // true fillet between three tangent circles is the TRIANGLE of their
  // centres — (0, H−r), (W, H−r), (W/2, H) — minus the discs; its two slant
  // sides pass exactly through the tangent points, so the tab's rim hands
  // off to the web's arc ring there and nowhere else. So: (1) `clip-path`
  // = that triangle ∪ the strip above it, the strip only rim-to-rim wide
  // (x ∈ [r − rim, W − r + rim]) so the web never sits on a tab's face or
  // writing; (2) the corner discs shrink to `r − rim − 0.8` (the extra 0.8 swallows the rim's anti-aliased inner edge, which otherwise ghosts as a faint arc) — the tabs' inner
  // rims (the straight side and the corner arc down to the tangent point)
  // are INSIDE the membrane now and get painted over in face; (3) `z-index:
  // 1` so the web paints over the right-hand tab too. (4) THE TOP LINE is
  // the web's own `border-top` in the rail's ink, on the rail's rim row
  // (the row hangs off the padding box, so it lands on it — measured
  // `9e` across the whole gap), clipped with the strip to the rims so it
  // joins the two tabs' top borders edge to edge.
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    z-index: 1;
    top: calc(-1 * var(--mtab-rim));
    bottom: calc(-1 * var(--mtab-rim));
    left: calc(100% + var(--mtab-rim) - var(--mtab-r));
    width: calc(var(--mtab-gap) + 2 * var(--mtab-r));
    box-sizing: border-box;
    pointer-events: none;
    border-top: var(--mtab-rim) solid var(--mtab-rim-ink);
    background:
      radial-gradient(circle at 50% 100%, var(--mtab-rim-ink) calc(var(--mtab-web-r) + var(--mtab-rim) - 0.4px), var(--mtab-face) calc(var(--mtab-web-r) + var(--mtab-rim) + 0.4px));
    clip-path: polygon(
      calc(var(--mtab-r) - var(--mtab-rim)) 0,
      calc(100% - var(--mtab-r) + var(--mtab-rim)) 0,
      calc(100% - var(--mtab-r) + var(--mtab-rim)) calc(100% - var(--mtab-r)),
      100% calc(100% - var(--mtab-r)),
      50% 100%,
      0 calc(100% - var(--mtab-r)),
      calc(var(--mtab-r) - var(--mtab-rim)) calc(100% - var(--mtab-r))
    );
    -webkit-mask-image:
      radial-gradient(circle at 0 calc(100% - var(--mtab-r)), transparent calc(var(--mtab-r) - var(--mtab-rim) - 1.2px), #000 calc(var(--mtab-r) - var(--mtab-rim) - 0.4px)),
      radial-gradient(circle at 100% calc(100% - var(--mtab-r)), transparent calc(var(--mtab-r) - var(--mtab-rim) - 1.2px), #000 calc(var(--mtab-r) - var(--mtab-rim) - 0.4px)),
      radial-gradient(circle at 50% 100%, transparent calc(var(--mtab-web-r) - 0.4px), #000 calc(var(--mtab-web-r) + 0.4px));
    -webkit-mask-composite: source-in;
    mask-image:
      radial-gradient(circle at 0 calc(100% - var(--mtab-r)), transparent calc(var(--mtab-r) - var(--mtab-rim) - 1.2px), #000 calc(var(--mtab-r) - var(--mtab-rim) - 0.4px)),
      radial-gradient(circle at 100% calc(100% - var(--mtab-r)), transparent calc(var(--mtab-r) - var(--mtab-rim) - 1.2px), #000 calc(var(--mtab-r) - var(--mtab-rim) - 0.4px)),
      radial-gradient(circle at 50% 100%, transparent calc(var(--mtab-web-r) - 0.4px), #000 calc(var(--mtab-web-r) + 0.4px));
    mask-composite: intersect;
  }
}

.media-tabs__glyph {
  flex: 0 0 auto;
  // ONE ink for glyph and name, which is the rule this line has kept through
  // both repaints (2026-08-06 took the pair to `--indigo-10` from a split
  // where the glyph sat a step under the word at `--grey-8`, because at 12px
  // that step read as a FADED mark rather than a quieter one). 2026-08-17
  // (user ask) takes the pair to `--grey-8` — the old glyph tone, now doing
  // the whole tab — as the strip left the indigo colorway for the platform's
  // cream chrome. Inherit rather than restate: the tab sets `color` and this
  // only has to not override it.
  color: inherit;
}

.media-tabs__name {
  min-width: 0; // or the flex floor cannot bite and the name never ellipses
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── THE BACK BUTTON, IN THE BAR (2026-08-31; the follow-up ask the same
// sitting: "place the back button inside the header, not like a tab. Make
// it occupy all the available height of the bar" — it hung below the band
// as a `.media-tabs__tab` for its first hour). Anatomy is the identity
// section's argument at the window's other edge:
//  · FULL AVAILABLE HEIGHT: absolute `top: 0; bottom: 0` against the
//    rail's PADDING box, i.e. the whole face above the rim — the bar's
//    `border-bottom` is its closing edge and runs UNBROKEN beneath this
//    block (the tab form deliberately broke it; a control inside the bar
//    must not).
//  · AN OPAQUE PLATE at `left: 0`: the inlaid frieze band runs the rail's
//    full width under every child, and a control cannot read on a meander
//    — same reason the identity chip and the stack strip wear the footer
//    bar's coat. `--plaque-flat`, the rail's own coat as a flat colour
//    (the composite exists as a token precisely for places like this).
//  · CLOSED by the rail's own line ink: a 1px `--grey-6` right edge — the
//    rim's tone, so the bar's two drawn lines are one ink — separating the
//    plate from the band it interrupts.
//  · Absolute children paint over unpositioned flex content, so no
//    z-index is needed over the band; `pointer-events: auto` re-arms the
//    block on a click-through bar.
// Hover lifts the veil (bare `--light-cream`), press lays more on
// (`--grey-3`) — the parked tabs' own two moves on this coat. DISABLED
// (history's first entry) stays visible but mutes and gives up both.
// FORWARD shares every declaration but its ADDRESS and its closing edge:
// each button stands at its own end of the bar, closed toward the band by
// ONE vertical line in the rail's rim ink — so the bar's drawn lines stay
// one tone, and each block's outer edge is the screen's.
.media-tabs__back,
.media-tabs__forward {
  pointer-events: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 9px;
  border: none;
  background: var(--plaque-flat, #f8f2e4);
  color: var(--grey-8, #616161);
  font-size: 0.62em;
  line-height: 1;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: var(--light-cream, #fcf3e0); }
  &:active { background: var(--grey-3, #eeeeee); }

  &.is-disabled {
    cursor: default;
    color: rgba(97, 97, 97, 0.4);
    &:hover { background: var(--plaque-flat, #f8f2e4); }
    &:active { background: var(--plaque-flat, #f8f2e4); }
  }
}

.media-tabs__back {
  left: 0;
  border-right: 1px solid var(--grey-6, #9e9e9e);
}

.media-tabs__forward {
  right: 0;
  border-left: 1px solid var(--grey-6, #9e9e9e);
}

// ── ⭐ THE PAIR ON A PHONE (2026-09-26, user ask: no "back"/"forward" words
// on mobile — "they take up a lot of space" — and bigger, different arrows).
// The WORDS leave here; the GLYPH swap is the template's (`isPhone`, the same
// `MOBILE_Q` string — a name is not a style). With the word gone the gap
// goes with it and each block is glyph + pads: 9 + 15 + 9 = 33px, where the
// desktop's Forward measures ~76. The parked-tab row cleared Forward with a
// static `right: 90px` (its note: "if the Forward block ever grows … this
// moves with it") — it shrinks with it too: 40px = the 33px block + the
// same daylight-over-the-tab-gap reading the desktop number has.
.media-tabs__wall { display: none; } // phones only — the block below draws it; this rule must stay ABOVE it (equal specificity, source order decides)

@media (max-width: 600px) {
  .media-tabs__back,
  .media-tabs__forward {
    gap: 0;
  }

  .media-tabs__back .media-tabs__name,
  .media-tabs__forward .media-tabs__name {
    display: none;
  }

  // ── ⭐ THE TABS STAND ON THE RIGHT EDGE (2026-09-29, user ask: "rotate
  // them 90 degrees to the right and add a thin grey bar on the right of
  // the screen where they're gonna be sticking") ──────────────────────────
  // THE WALL: a strip from the rail's rim to the footer's lip down the
  // screen's right edge — the tabs' face with their rim on its page side.
  // THE ROW: the same row, turned a quarter-turn CLOCKWISE by a transform
  // about its top-left corner, so its top edge (where the tabs' top rims
  // are) runs DOWN the wall and its tabs hang LEFT into the page with
  // their rounded ends and their webs, and the names read top-to-bottom
  // like a spine. Layout never learns of the turn: the row is laid out
  // flat (`left` puts its corner one rim in from the wall's edge, so the
  // tabs' top rim is the wall's rim; `max-width` is the wall's height),
  // scrolls on its own x — a finger dragging up the wall — and every
  // desktop law inside it (the gap, the webs, the enter slide from the
  // rail = from the wall here) turns with it for free. (`right: 40px`,
  // the phone's Forward plate, was the row's only phone rule until then.)
  .media-tabs__wall {
    display: block;
    position: fixed;
    top: var(--media-tabs-h);
    right: 0;
    bottom: var(--nav-footer-h);
    width: var(--media-tabs-wall-w);
    box-sizing: border-box;
    background: var(--grey-4, #e0e0e0);
    border-left: var(--media-tabs-rim) solid var(--grey-6, #9e9e9e);
    pointer-events: none;
  }
  .media-tabs__row {
    position: fixed;
    top: var(--media-tabs-h);
    right: auto;
    left: calc(100vw - var(--media-tabs-wall-w) + var(--media-tabs-rim));
    max-width: calc(100vh - var(--media-tabs-h) - var(--nav-footer-h));
    transform-origin: 0 0;
    transform: rotate(90deg);
  }
}

// Park/restore choreography: a tab slides down out of the band when a
// window minimizes (appear covers the bar's own first mount) and lifts
// back into it when restored; .mtab-move eases the row closing ranks. A
// leaving tab keeps its flex slot for its 120ms — absolute repositioning
// would snap it to the row's start, a worse artifact than the brief hold.

.mtab-enter-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.mtab-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.mtab-enter-from,
.mtab-leave-to { opacity: 0; transform: translateY(-100%); }
.mtab-move { transition: transform 0.18s ease; }
</style>
