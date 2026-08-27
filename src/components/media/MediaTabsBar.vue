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
         ⭐ FULL PATTERN SINCE 2026-08-27 (user ask: "exchange the frieze
         patterns between the top header bar and the main feed container
         frieze bars … the thick one on the header. Do not exchange the
         coloring style") — `slim` came OFF: both waves draw now, the dense
         two-wave interleave the feed's bars carried, while those bars took
         the one-wave slim pattern this band gives up. The COLORING stayed
         exactly where it was, per the ask: grey-8 plaque, the cyan→indigo
         ramp — now on BOTH waves, since one gradient across the whole
         meander IS this band's coloring style and a second tone would have
         been a new style, not the old one on more ink. The full pattern was
         squeezed into the old 12px band for one pass ("very distorted") and
         the ask after paid HEIGHT for a clean drawing instead: the band is
         15px now, pixel-drawn at `auto 13px`, the rail 18px total — the
         arithmetic lives on `--media-tabs-band` in _tokens.scss and the two
         dials in the style block. -->
    <FriezeBar class="media-tabs__frieze" />
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
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import { iconFor, titleOf } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaTabsBar',
  components: { FriezeBar },
  setup () {
    const store = useFlyoutViewersStore()
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
    return { tabs }
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
// Everything here except the two rules is the POST CARD'S recipe carried over
// letter for letter, and that is the point of the move: the ask was to take
// THAT band and set it into this bar, not to draw a second one in the same
// family. So the plaque, the paint and the height all read exactly as they did
// on `.post-square__frieze`, and the notes that earned those numbers live in
// _tokens.scss (the height) and in FeedStream's tombstone (the walk).
//
// THE PLAQUE, `--grey-8`: two steps under this bar's line ink, which is the
// same relation it had to the card's. It is not a tone chosen for cream — it
// is chosen for the CARVE. The waves are two very light accents and a groove
// only reads as a groove when the plate is well under what is cut into it
// (3.5:1 here, against 1.7:1 at the ink's own level). On this surface it also
// does a second job the card's did not need: it is the only DARK thing on a
// light-cream rail, so the band states itself without a frame around it.
//
// THE PAINT, indigo→cyan down the wave: `--frieze-bar-wave-two-paint`, the two
// families' A100 accents. It reaches the MOTIF and nothing else — the layer is
// a mask over a painted box, so a gradient fills the meander exactly as a flat
// colour would and the plaque under it stays flat. It spans the BAND, once: a
// gradient has no intrinsic size, so one ramp runs the full 1440px however
// many times the 231px mask repeats across it. ⚠ Give the layer a
// `background-size` and you get one ramp per tile, which reads as banding.
// ⚠ IT RUNS CYAN DOWN TO INDIGO SINCE 2026-08-24 (user ask: "invert the inner
// color gradient from the top header's bar inner frieze. instead of goin indigo
// to cyan, make it cyan to indigo"). The other direction — indigo at the top —
// is what the POST CARD's pair settled on 2026-08-10 and still runs, so the two
// surfaces now ramp OPPOSITE ways, and that is the thing to know before
// touching either: this band was built as the card's device moved onto chrome,
// and the shared part is the recipe (one ramp per band, the paint reaching the
// motif alone, the two A100 accents) rather than the direction. `--teal-11`
// leading also puts the LIGHTER accent (#a7ffeb) at the top, where the carve
// lights every frieze on the platform from the top left — so the ramp and the
// light now agree, which the old direction had backwards.
//
// THE TWO RULES are the one thing restated: `--grey-6`, this bar's own ink —
// the same the rim under them is drawn in — where the card ran them in its
// `--grey-5`. Same argument either way: two greys under its host's line ink
// the plate is its own dark object laid across the surface, and framing it in
// the surface's ink BINDS it rather than leaving it a stripe floating on the
// sheet. Inner weight, 1px, matching the rim exactly, so the bar's three
// horizontal lines are one ink at one weight.
// ⚠ THE HEIGHT DIAL PAYS FOR THEM — `border-box` means a border eats the
// plate, and `--media-tabs-frieze-h` carries a `+ 2px` for exactly this. Move
// these rules and move that term.
//
// `flex: 0 0 auto` is load-bearing: the bar states a height, and in a flex
// column an item that MAY shrink will.
.media-tabs__frieze {
  flex: 0 0 auto;
  --frieze-bar-h: var(--media-tabs-frieze-h);
  --frieze-bar-base: var(--grey-8, #616161);
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
  // ── ⭐ THE FULL PATTERN IS PIXEL-DRAWN (2026-08-27, the ask after the
  // exchange: "the frieze pattern on the header bar looks very distorted …
  // adjust the header's height so we can fit a clean svg pattern inside,
  // while keeping the bar as thin as possible") ─────────────────────────
  // The exchange's first cut kept the 12px band and squeezed the two-wave
  // motif into it at `auto 117%` under a halved carve — ~0.72px a row, which
  // held for a SLIM band and smears for a full one (twice the ink at the
  // same row size; "very distorted" is that number seen). The cure is the
  // one the side trio and the feed's bands already use, and the HEIGHT paid
  // for it (`--media-tabs-band` walked 14 → 17px face, total 15 → 18px —
  // the arithmetic and the floor argument live on that token):
  //  · FIT `auto 13px` — the 231×143 file at its natural grid, 1px per row,
  //    tiling at exactly 21×13. The band's inner is 11px (13 − 2 rules since
  //    the pad-removal ask; it was 15 − 2 rules − 2 pads for one pass), so
  //    the mask overhangs 1px each side and the file's two EMPTY edge rows
  //    fall outside — trimmed to its ink, nothing squeezed.
  //  · CARVE OFF — the pixel-drawn law (side trio 2026-08-21, feed bands
  //    08-24): black/white flanks around 1px strokes read as grime, not
  //    relief. The gradient does the modelling on this band.
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
  // in plate paint. At 13 the mask overhangs and the ink meets the rules.
  --frieze-bar-pad: 0;
  // The two lips cast onto the band (same ask, second half: "a grey-6 shadow
  // from the top lip onto the frieze section and also from the bottom lip").
  // Drawn by the ::after overlay below, NOT here: an inset box-shadow on
  // this element would paint UNDER the wave layers (background level), and a
  // cast that stops at every meander stroke reads as a stencil, not a shadow.
  position: relative;
  // The flat tone under the paint — never seen while the gradient draws, and
  // stated anyway so a fallback lands in the same family rather than on the
  // component's default brown. ⚠ IT FOLLOWS THE RAMP'S TOP END, so it moved
  // with the inversion: teal now, indigo before 2026-08-24. Keep the two in
  // step or a paint-less fallback lands on the wrong end of the ramp.
  // ⭐ WAVE ONE JOINED ON 2026-08-27 (the exchange brought the second wave):
  // SAME ramp, SAME flat fallback — one gradient across the whole meander is
  // this band's coloring style, and the ask was explicit that the style does
  // not move with the pattern. Two waves at two tones would be the vertical
  // family's OLD device, not this band dressed thicker.
  --frieze-bar-wave-one: var(--teal-11, #a7ffeb);
  --frieze-bar-wave-one-paint: linear-gradient(
    to bottom,
    var(--teal-11, #a7ffeb) 0%,
    var(--indigo-11, #8c9eff) 100%
  );
  --frieze-bar-wave-two: var(--teal-11, #a7ffeb);
  --frieze-bar-wave-two-paint: linear-gradient(
    to bottom,
    var(--teal-11, #a7ffeb) 0%,
    var(--indigo-11, #8c9eff) 100%
  );
}

// ── ⭐ THE LIPS' CAST (2026-08-27, with the pad removal above) ─────────────
// A pseudo-element OVER the band, not a shadow on it: `inset:0` + the two
// inset box-shadows, so the wash falls across plate and motif alike — the
// lips reading as raised edges the frieze is set below. Spelled as an rgba
// because a box-shadow color wants a <color> and the wash needs its own
// alpha. ⚠ THE TONE WALKED SEVEN ASKS IN ONE SITTING AND LANDED WHERE IT
// STARTED — `--grey-6` ("a grey-6 shadow from the top lip") → `--grey-8` →
// `--grey-4` → `--grey-9` → `--grey-7` → `--grey-5` → **`--grey-6`**
// (rgba(158,158,158,…), settled "ok no, grey-6") — so the whole scale was
// seen before the first pick held, and the map the walk drew is the note
// worth keeping: tones LIGHTER than the `--grey-8` plate render as the
// lips' pale material blooming onto the dark band, stronger the lighter
// the tone; tones AT or UNDER it (-8, -9) are invisible on the plate and
// read only where they cross the MOTIF — a true dark shadow. -6 is the
// bloom side at the RULES' OWN INK: the cast reads as the two grey-6 rules
// softening into the band, one ink doing line and shade, which is likely
// why the eye kept coming back to it. (The settled pass runs 0.75 alpha —
// the walk's constant — where the first -6 pass ran 0.6; the comparison was
// made at 0.75, so 0.75 is what "grey-6" means here.)
// `pointer-events` is moot (the whole rail is `none`) and the overlay needs
// no z-index: it paints after `.frieze-bar__inner` in tree order, which is
// exactly "over the frieze section".
.media-tabs__frieze::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 2px 3px rgba(158, 158, 158, 0.75),
    inset 0 -2px 3px rgba(158, 158, 158, 0.75);
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
