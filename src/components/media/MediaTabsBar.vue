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
         in _tokens.scss and the dials in the style block. -->
    <FriezeBar slim class="media-tabs__frieze" />
    <!-- ── THE BACK BUTTON (2026-08-31, user ask: "relocate the back button
         from the left drawer into the top header nav bar") — the drawer is
         hidden the same day, and its pinned-top Back affordance lands HERE,
         at the rail's LEFT end, in the strip's own grammar: a tab hanging
         from the band (the parked tabs' material, rim and flares — a piece
         of the band pulled downward), mirrored to the end the parked row
         never reaches (tabs fill from the RIGHT edge leftward and cap at
         50vw). `pointer-events: auto` because the band itself is
         click-through paint; disabled on the history stack's first entry,
         exactly as the drawer button was. -->
    <button
      type="button"
      class="media-tabs__tab media-tabs__back nasalization"
      :class="{ 'is-disabled': !canGoBack }"
      :disabled="!canGoBack"
      title="Back"
      @click="goBack"
    >
      <q-icon name="arrow_back" size="12px" class="media-tabs__glyph" />
      <span class="media-tabs__name">back</span>
    </button>
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
import { defineComponent, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import { iconFor, titleOf } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaTabsBar',
  components: { FriezeBar },
  setup () {
    const store = useFlyoutViewersStore()
    const route = useRoute()
    const router = useRouter()

    // ── The BACK control (2026-08-31) — relocated from the hidden drawer.
    // `window.history.state.position` is 0 on the stack's first entry, the
    // same test the drawer's button ran; it is not reactive on its own, so
    // the computed reads `route.fullPath` purely as a dependency — every
    // navigation re-evaluates it.
    const canGoBack = computed(() => {
      void route.fullPath
      return (window.history.state?.position ?? 0) > 0
    })
    const goBack = () => { router.back() }
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
    // describe landed (node targets only — the others are born named).
    const tabs = computed(() => {
      return [...store.parked].reverse().map((v) => ({
        key: v.id,
        icon: v.icon || iconFor(v.target?.node),
        name: v.label || titleOf(v.target?.node),
        restore: () => store.restore(v.id)
      }))
    })

    // NOTHING to set at runtime: `--media-tabs-h` is a constant in
    // _tokens.scss and the top chrome is laid out against it from boot.
    // The first pass had this component claim and release the space as it
    // mounted, which worked and made the whole page hop 4px whenever a
    // viewer parked — a band that is permanent has no such moment.
    return { tabs, canGoBack, goBack }
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
  flex: 0 0 auto;
  --frieze-bar-h: var(--media-tabs-frieze-h);
  // ── ⭐ THE SWAP (2026-08-30, the sitting's last ask: "invert the frieze
  // pattern on the top nav bar with the bottom footer nav bar one") ──────
  // The two bands exchanged COLORINGS. The footer's trail had taken this
  // band's pre-recolor dress earlier in the day and preserved it, so the
  // swap is a RESTORATION here — grey-8 plate, teal-11 flat, the cyan→indigo
  // ramp — while the recolor's quiet grey-6-on-coat moved downstairs to
  // `.nav-frieze`. What did NOT come back: the two 1px rules (deleted by the
  // recolor's follow-up ask and absent on the footer too, so the swap has no
  // frame to carry) — the plate is a bare dark stripe on the cream rail now,
  // exactly the presentation the trail had. Geometry untouched: band 13px,
  // layer 13px, `auto 13px` exact fit — the mask's two empty edge rows show
  // plate, which against a grey-8 plate is simply more plate. The recolor's
  // paragraphs below stand as that sitting's record; the dials here are the
  // law.
  --frieze-bar-base: var(--grey-8, #616161);
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
  --frieze-bar-fit: auto 13px;
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
  --frieze-bar-pad: 0;
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
  // ⭐ WAVE ONE'S DIALS LEFT WITH THE PATTERN (2026-08-30): they joined on
  // 2026-08-27 when the exchange brought the second wave, and `slim` v-ifs
  // that layer out of the DOM — dials on a band that isn't drawn are the
  // exact trap FriezeBar's slim notes warn about, so they go rather than
  // stand as dead state. Wave two is the slim pattern's one wave (mask `b`).
  --frieze-bar-wave-two: var(--teal-11, #a7ffeb);
  --frieze-bar-wave-two-paint: linear-gradient(
    to bottom,
    var(--teal-11, #a7ffeb) 0%,
    var(--indigo-11, #8c9eff) 100%
  );
}

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
  position: absolute;
  top: 100%;
  // ── CLEAR OF THE STACK COLUMN (2026-08-24, user ask: "make the first tab on
  // the right appear a little away from the stack sidebar, leave a little
  // space") ──
  // This offset is the row's PADDING box, so the outermost flare paints out to
  // exactly this line and the tab's own edge stands 9px further in. At the old
  // flat `31px` (written as "40px minus the fillet padding", i.e. aimed at the
  // TAB landing 40px in) that flare crossed 11px INTO the parked stack rail,
  // which is what made the first tab read as stuck to that column. Stated
  // against the rail's OWN width now, so a wider rail carries the gap with it:
  // 10px of daylight past `--dock-rail-w`, a little over the row's own 6px
  // between tabs, which is the reading — the stack column is not another tab.
  right: calc(var(--dock-rail-w, 42px) + 10px);
  max-width: 50vw;
  display: flex;
  gap: 6px;
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
.media-tabs__tab {
  // ── THE TAB REJOINED THE BAND (2026-08-17, user ask, reported off the
  // SKELETON FLYOUT's minimize — every flyout and viewer parks on this same
  // strip, so one rule covers them all) ──
  // `--plaque-flat` is `--plaque-coat` as a flat `<color>`: the coat's
  // measured composite (#f8f2e4), which exists precisely because this face is
  // also consumed inside the flares' gradient stops, where a background layer
  // list is illegal. Tab and band are one material again — the state the
  // strip was built in and lost for the hour the band alone wore the coat.
  --mtab-face: var(--plaque-flat, #f8f2e4);
  // The rim matches the band's, thickness and tone: `--media-tabs-rim` of
  // `--grey-6`, so the line runs band → flare → tab unbroken again. The tab
  // has no top edge (it flows OUT of the band), so what this paints is the
  // bottom sweep and the two sides — one continuous edge with the rail's.
  --mtab-rim: var(--media-tabs-rim, 2px);
  --mtab-rim-ink: var(--grey-6, #9e9e9e);
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
  padding: 0 10px 2px;
  line-height: 1;
  border: var(--mtab-rim) solid var(--mtab-rim-ink);
  border-top: none; // it flows out of the band, so it has no top edge
  border-radius: 0 0 9px 9px;
  background: var(--mtab-face);
  // Ink --grey-8 (2026-08-17, user ask), from `--indigo-10`. The tab stopped
  // being the one indigo-written thing on a neutral strip when the strip went
  // cream: -8 is the platform's quiet-writing step on a light face, dark
  // enough at 0.62em (5.9:1 on this face) and a whole family away from the
  // rail's own `--grey-6` rim, so mark and edge never read as one weight.
  color: var(--grey-8, #616161);
  font-size: 0.62em;
  cursor: pointer;
  transition: background 0.12s, padding-bottom 0.12s, transform 0.12s;

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
  &:hover { --mtab-face: var(--light-cream, #fcf3e0); padding-bottom: 5px; }
  &:active { --mtab-face: var(--grey-3, #eeeeee); transform: translateY(1px); }

  // ── THE FLARES ──
  // A concave fillet at each top corner, so the tab does not butt into the
  // band at a right angle but SWEEPS out of it — the bell curve. Each is a
  // 9px square (plus 1px of overlap INTO the tab, which covers the stub of
  // side border that would otherwise cross the sweep) filled with the tab's
  // face except a quarter-disc carved out of the corner nearest the tab.
  // The two extra colour stops draw the rim along that arc IN THE RIM'S OWN
  // TONE — they are the fillet's half of the one continuous line, so they
  // move whenever the border does (grey-6 → indigo-4, 2026-08-06) or the
  // edge changes colour halfway through its sweep — and the arc
  // meets the tab's own border exactly where its tangent turns vertical, so
  // one continuous line runs band → flare → tab.
  //
  // Radial gradients, not borders: an INVERTED radius has no border-radius
  // spelling. `pointer-events: none` keeps the flares out of the hit box —
  // they are 9px of paint hanging over the crown strip.
  // Both dimensions and every stop below follow `--mtab-rim` (2026-08-17), so
  // the fillet's half of the line is the same weight as the tab's border and
  // the band's rim. The WIDTH is 9px of sweep plus the rim's own pixels: that
  // overlap lies over the stub of side border which would otherwise cross the
  // sweep, and a 1px overlap stopped covering it the moment the border
  // doubled. The arc thickens INWARD — its outer boundary stays at 8.9/9.1px,
  // where the face begins and the tab's own edge stands — so the sweep still
  // lands exactly where it did and only the line drawn along it got heavier.
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: calc(9px + var(--mtab-rim));
    height: 9px;
    pointer-events: none;
  }

  &::before {
    left: -9px;
    background: radial-gradient(circle at 0 100%,
      transparent calc(9px - var(--mtab-rim) - 0.1px),
      var(--mtab-rim-ink) calc(9px - var(--mtab-rim) + 0.1px),
      var(--mtab-rim-ink) 8.9px, var(--mtab-face) 9.1px);
  }

  &::after {
    right: -9px;
    background: radial-gradient(circle at 100% 100%,
      transparent calc(9px - var(--mtab-rim) - 0.1px),
      var(--mtab-rim-ink) calc(9px - var(--mtab-rim) + 0.1px),
      var(--mtab-rim-ink) 8.9px, var(--mtab-face) 9.1px);
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

// ── THE BACK TAB (2026-08-31) — the drawer's Back button in this strip's
// grammar. It IS a `.media-tabs__tab` (material, rim, flares — everything
// above applies), so this block states only what differs: its ADDRESS
// (absolute at the rail's left end, hanging from the band's underside the
// way the row's tabs hang at the right — `top: 100%` off the padding box,
// so the rim breaks under it exactly as it does under a parked tab), a
// fixed 10px inset mirroring the row's own edge padding, and the DISABLED
// state the parked tabs never need: on the history stack's first entry the
// tab stays visible — an affordance that vanishes teaches nothing — but
// mutes to the band's own quiet and gives up its hover reach.
.media-tabs__back {
  position: absolute;
  top: 100%;
  left: 10px;
  flex: none;
  min-width: 0;

  &.is-disabled {
    cursor: default;
    color: rgba(97, 97, 97, 0.4);
    &:hover { --mtab-face: var(--plaque-flat, #f8f2e4); padding-bottom: 2px; }
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
