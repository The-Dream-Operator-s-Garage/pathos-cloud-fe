<!--
  SKELETON VIEWER (2026-07-26) — the feed's detail box, back as a floating
  widget.

  WHAT IT IS reframed on the fifth pass: this is a viewer for a SKELETON, and
  what it is usually pointed at is one post skeleton INSTANTIATION. That is
  why the head reads "Post's Skeleton" and wears the skeleton kind's glyph
  rather than the post one — the box is named for the thing it views, and the
  post is merely the instance in front of it.

  GENERIC since 2026-07-31 (the deferred G8 item, closed): the box now keeps
  the promise its name made. It takes EITHER a `GET /feed` item (a post —
  mounts `FeedPostPanel`, the rich face) OR any bare skeleton reference via
  `skeleton-ref` (a 'skeletons/<hash>' address or a numeric id — mounts
  `SkeletonMini`, the keys+populated-fields face every non-POST skeleton
  already wears in post bodies). The rename/move (`FeedPostFlyout` under
  `components/posts/` → `SkeletonFlyout` under `components/skeletons/`)
  landed with this work, exactly as the fifth pass said it should.

  What it holds is not new: `FeedPostPanel` is the same panel the legacy feed
  laid out in its right-hand column (full excerpt, every bound element as a
  Micro/Info chip, thread provenance, labels, tallies), and it survived
  unrouted when FeedPage's selection machinery was deleted on 2026-07-25. Only
  its FRAME is new. The panel used to be a `position: sticky` column inside the
  page grid; here it is the content of a free-floating plaque, so the two rules
  that pinned it in a column — `sticky` + a `100vh`-derived `max-height` — are
  undone below, along with its own card coat (the shell is the card now).

  The shell is drawn as one of the platform's FLOATING WIDGETS, not as part of
  the feed container: it hovers OVER the page canvas beside that container, the
  same way the stack and pins widgets hover over the right edge, so it is BUILT
  like them rather than like the blue-grey box it stands next to — a plaque, a
  `.dock-bar` info box at the top, a FriezeBar band under it (the pins widget's
  exact arrangement), and the panel inside an inset container.

  It is NOT coloured like them (2026-07-26, second pass): coat and container
  are both the neutral `--grey-3` and every line is `--grey-4`, where the side
  widgets are warm brown throughout. That also makes the box ONE flat tone —
  the rim, not a tonal step, is what states where the container begins. The
  FriezeBar band followed on the third pass — its plaque base is `--grey-9`
  through that component's `--frieze-bar-base` dial, so the only warmth left in
  the box is the band's own wave motif and the brown-8 header ink.

  The box reads in THREE STEPS as of 2026-07-27, and each one is doing a
  different job. The PLAQUE is `--grey-3`. The WELL — the information container
  — is `--grey-4`, sunk one step into it (it was flush for a day, stated by its
  rim alone). The quoted node's PANEL comes back up to `--grey-3`, so it is
  RAISED out of that well and made of the box's outer material: the object the
  box exists to show. And the two boxes a reader looks INTO — the node viewer's
  source pane and its raw title — are `--teal-1`, the NODE's own material, so
  the document separates from its panel by HUE where everything above it
  separates by tone. Lines: `--grey-4` outside the panel, `--teal-2` within it,
  plus the `--teal-13` base the panel sits on.

  Geometry is NOT here: the box is sized and placed by `.feed-flyout` on
  FeedPage, which is the element that knows where the free right half of the
  window slot is. This component just fills what it is given.
-->
<template>
  <aside class="skeleton-flyout" role="dialog" :aria-label="title">
    <!-- Info box — kind glyph + what this is + the id, closing with the
         one control. Same run as the stack/pins headers, minus the park tap:
         this widget is dismissed, not minimized.

         The glyph is the SKELETON kind's, taken from `utils/kinds.js` rather
         than written in (2026-07-26): this box is a skeleton viewer, so it
         wears the glyph of what it VIEWS, not of what it is currently pointed
         at. It was `edit_note` — which is not a generic document icon but
         literally `KINDS.posts.icon`, the platform's post glyph. -->
    <header class="dock-bar skeleton-flyout__bar">
      <q-icon :name="skeletonKind.icon" size="14px" class="dock-bar__icon" />
      <span class="dock-bar__title nasalization">{{ title }}</span>
      <q-space />
      <span class="dock-bar__meta mono">{{ meta }}</span>
      <button type="button" class="dock-bar__action" @click="$emit('close')">
        <q-icon name="close" size="15px" />
        <q-tooltip anchor="bottom middle" self="top middle">Close (Esc)</q-tooltip>
      </button>
    </header>

    <!-- The band between the header and the well — the mirror of the pins
         widget's `.pins-frieze`, and what ties this box to the friezed chrome
         it floats between. `slim`: half height, brown-1 wave only (2026-07-26,
         fourth pass) — the widest band in the smallest box was the one thing
         here shouting.

         ONE TILING, running the whole width (2026-07-27). It was briefly cut
         in half about a centre axis, the left half reflecting the right, on
         the argument that a band INSIDE a box should agree with that box's
         middle rather than march across it. It reads worse than it argues:
         the seam is a visible event in an 11px strip — two motifs meeting
         nose to nose in the one place the eye is drawn — where the band's
         whole job here is to be a quiet rule between the head and the well.
         So the right half won and simply extends: the usual `-mirror` masks
         anchored at the LEFT EDGE again, tiling rightward across the box,
         which is what every other frieze on the platform does. -->
    <FriezeBar slim class="skeleton-flyout__frieze" />

    <!-- The inset well. The panel inside it is the ONE scroller (its own
         `__scroll` track for a post; the generic wrapper for anything else),
         so the well never scrolls and the panel's head stays put at the top
         while its groups run under it. -->
    <div class="skeleton-flyout__well">
      <FeedPostPanel v-if="item" :item="item" />
      <!-- Any other skeleton: the keys+populated-fields face. SkeletonMini
           self-resolves from an address or id, so the flyout needs to know
           nothing about what it was pointed at. -->
      <div v-else class="skeleton-flyout__generic">
        <SkeletonMini
          :id="skeletonId" :address="skeletonAddress"
          @resolved="onResolved"
        />
      </div>
    </div>
  </aside>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import FeedPostPanel from 'src/components/posts/FeedPostPanel.vue'
import SkeletonMini from 'src/components/skeletons/SkeletonMini.vue'
import { kindFor, shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'SkeletonFlyout',
  components: { FriezeBar, FeedPostPanel, SkeletonMini },
  props: {
    // One feed item, exactly as `GET /feed` returns it (a POST — the rich
    // face). Optional since 2026-07-31: give either this or `skeletonRef`.
    item: { type: Object, default: null },
    // ANY skeleton — a 'skeletons/<hash>' address or a numeric id.
    skeletonRef: { type: [String, Number], default: null }
  },
  emits: ['close'],
  setup (props) {
    // The generic face reports what it resolved (name + id) so the header
    // can title the box after the actual instance.
    const resolved = ref(null)
    const onResolved = (info) => { resolved.value = info }

    const skeletonId = computed(() => {
      if (props.skeletonRef == null) return null
      const n = Number(props.skeletonRef)
      return Number.isNaN(n) ? null : n
    })
    const skeletonAddress = computed(() =>
      typeof props.skeletonRef === 'string' && props.skeletonRef.includes('/')
        ? props.skeletonRef
        : ''
    )

    const title = computed(() => {
      if (props.item) return "Post's Skeleton"
      const name = resolved.value?.name
      return name ? `${name} Skeleton` : 'Skeleton'
    })
    const meta = computed(() => {
      if (props.item) return `#${props.item.skeleton_id}`
      if (resolved.value?.id != null) return `#${resolved.value.id}`
      if (skeletonAddress.value) return shortHash(skeletonAddress.value, 10)
      return skeletonId.value != null ? `#${skeletonId.value}` : ''
    })

    // The SKELETON kind, for the header glyph — the same static lookup
    // `SkeletonMini` makes. Through `kinds.js` so that re-glyphing skeletons
    // platform-wide moves this header with everything else, rather than
    // leaving one hand-written icon behind.
    return {
      skeletonKind: kindFor('skeletons'),
      skeletonId,
      skeletonAddress,
      title,
      meta,
      onResolved
    }
  }
})
</script>

<style lang="scss" scoped>
// The plaque — flat `--grey-3` with a 1px `--grey-4` outer border, fully
// rounded (it floats free on all four sides, where the stack and pins widgets
// are anchored to screen edges and round only their inner corners).
//
// The box is NEUTRAL (2026-07-26, second pass) where the side widgets it is
// otherwise built like are warm. The coat went first: `--grey-3` against their
// `--brown-1` is within a hair in lightness (#eeeeee vs #efebe9), so what
// changed is the HUE — same weight, none of the warmth. The LINES followed in
// the same pass, because a warm `--brown-4` edge round a neutral box reads as
// trim borrowed from another surface; `--grey-4` is the neutral standing at
// brown-4's place in its own scale. The frieze band's plaque base followed on
// the third (see `.skeleton-flyout__frieze`), which leaves the brown-8 header ink
// and the band's wave motif as the only warm things on the box.
//
// `overflow: hidden` is load-bearing: the frieze band runs edge to edge and
// would otherwise square off the corners it passes.
.skeleton-flyout {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  // ── The box is the yardstick for what it holds ─────────────────────────
  // `FeedPostPanel` quotes the post's CONTENT node as a `NodeMini` in `raw`
  // mode, whose source pane scrolls at `--node-source-max-h` — published by
  // the SURFACE, the same contract `--media-max-h` uses, because how tall a
  // document may stand is a fact about the box it is being read in.
  //
  // Here that is a FIFTH of this box, and the ceiling is on the whole QUOTED
  // PANEL rather than on the pane inside it (2026-07-27; the pane alone was
  // capped at a third before, which put the panel at 42.5% — measured 327px in
  // a 770px box). A markdown file is the longest thing the panel ever shows and
  // the panel is a list of SECTIONS — identity, thread, labels, tallies, the
  // CTA — so a node past a fifth of the box stops reading as one section among
  // several and becomes the viewer, with everything that says what the post IS
  // pushed below the fold.
  //
  // Container units and not `vh` math on purpose: the box's height lives in
  // FeedPage's `.feed-flyout` (`top`/`bottom` off the frieze bands), and
  // restating that expression here would be a second copy to keep in step —
  // silently wrong the day the geometry moves. `container-type: size` is safe
  // on this element specifically: its height comes from the pinned parent and
  // its width from that parent's box, so neither axis depends on the contents
  // that size containment hides.
  container-type: size;
  // 20% of the box, MINUS the panel's own chrome — because the dial caps the
  // source PANE and the ceiling being asked for is on the panel. The subtracted
  // 34px is everything the panel is made of outside that scroller, MEASURED at
  // the densities set in the `:deep()` block below: the header band (22px —
  // the 18px round pill plus this box's 2px zone padding), the body's inset
  // (9px, one divider + 4px top and bottom) and the panel's outer borders —
  // 1px on top and the 2px mint base. It was 59px until 2026-07-27, when
  // NodeMini's foot band (25px here) came off the component. So the panel
  // measures 20cqh whenever the document is long enough to hit the cap, and
  // less when it is not — a ceiling, not a height.
  //
  // The 34px is the one number here that can go stale, and it fails LOUDLY
  // rather than silently: a band that grows takes the panel past 20% and a
  // measurement catches it — it has already happened twice in a day, the 2px
  // base adding its pixel to a constant written for a 1px one and the foot's
  // seams adding another. It is the price of putting the ceiling where the
  // ask is — the alternative, a `max-height` on the panel with the pane
  // flexing inside it, needs `min-height: 0` plumbing through MiniPanel's body,
  // which every other Mini in the family would then be carrying for this box.
  // Restate it if the header padding, the border weights or the round pill's
  // 18px box move.
  --node-source-max-h: calc(20cqh - 34px);
  // The quoted node's COAT is the host's material, and WHICH step of it says
  // what the panel is doing in the box. All three were worn in one day
  // (2026-07-27) and it is `--grey-3`: the plaque's own tone, and the well's, so
  // the panel is FLUSH — one continuous neutral surface from the box's edge
  // through the well to the panel, with the `--teal-2` border and the mint base
  // the only things stating where the node begins. `--grey-4` was INSET, a plate
  // lying in the well (1.14:1 under it), and `--grey-2` was RAISED, the lightest
  // surface in the box.
  //
  // A surface drawn in the tone it lies on is normally the trap this box has
  // recorded twice, and what makes it work here is that the panel's edges are
  // TINTED where everything they divide is neutral: the boundary is stated by
  // hue and needs no tonal step at all — and since 2026-07-27 it is not flush
  // with what it LIES IN either: the well went `--grey-4`, so this coat now
  // stands one step ABOVE its floor (1.14:1) while still matching the plaque
  // around it. The panel is RAISED out of a sunk container, which is what a
  // viewer's one object should be — the thing the box is showing you, not a
  // block quoted into it — and the flush relation it keeps is with the box's
  // OUTER surface, so the panel reads as the plaque's own material lifted back
  // up through the well. Its two reading panes go the other way again
  // (`--teal-1`, see the `:deep(.node-mini__source)` rule below): the document
  // is the one thing here made of the NODE's material.
  --node-mini-coat: var(--grey-3);
  // Its LINE SYSTEM goes back into the colorway (2026-07-27, last pass):
  // `--teal-2` takes the outer border AND every inner hairline in one value
  // (that is what the dial is for — see the rule at the foot of this block).
  // It walked `--teal-3` → `--grey-5` → `--teal-2` → `--grey-3` → `--grey-5`
  // at 2px → `--grey-4` → here, which makes this the second time -2 has held
  // the job, and the reason it comes back is the reason it went out: it states
  // the divisions QUIETLY and by HUE, which was inaudible while the ink and the
  // ring were the only teal on the panel and is exactly right now the two
  // reading panes are teal too. The panel is the node's material again — coat
  // aside — so its lines belong to the node, and `--grey-4` had them belonging
  // to the box.
  --node-mini-rule: var(--teal-2);
  // Its partner, and NOT optional: NodeMini lights the whole line system from
  // this one value, so a surface that moved the resting lines alone would flash
  // the `--teal-11` default. `--teal-12` is the accent that answers by CHROMA —
  // and against -2 resting lines it is a lift within the family rather than the
  // arrival of hue it was against grey.
  --node-mini-rule-hover: var(--teal-12);
  // The INK — the header row: `--brown-10` (2026-07-27; it was `--grey-10`
  // for one pass, and `--teal-10` before that). The family's 900, so the ink
  // stands at the index it always did and only the HUE moved. Brown because
  // this box is brown wherever it is anything — its own header is `--brown-8`
  // and the frieze band's waves are brown, the two warm marks left on a
  // plaque, a well and a line system drawn entirely in neutrals. Lettering
  // the quoted node in the host's own family makes it part of the box; a
  // neutral could only say "not teal". Two steps darker than that header
  // ink, which is the right order — the box names itself once at the top,
  // and the document it is showing you is the darkest thing in it.
  // (`--node-mini-foot-glyph` went with NodeMini's foot, 2026-07-27 — the
  // panel has no foot band left to letter.)
  --node-mini-head-ink: var(--brown-10);
  background: var(--grey-3);
  border: 1px solid var(--grey-4);
  border-radius: var(--radius-lg);
  overflow: hidden;
  // A real drop, not the widgets' lateral `--shadow-side-edge`: this box is
  // detached from every edge, so it casts all round. The alpha is high for the
  // reason the feed container's is — it falls on the page's near-black canvas,
  // where anything under ~0.4 darkens by too few levels to register.
  box-shadow: 0 12px 38px rgba(0, 0, 0, 0.5);
}

// The shared `.dock-bar` ships a translucent white coat and a bottom hairline.
// Both come off here for the same reason they do on the stack widget: the bar
// IS the plaque's top, so one uniform coat and no rule under it — the frieze
// band below states where the head ends. Keep this in step with the plaque's
// background; two tones here and the head reads as a separate strip laid on.
.skeleton-flyout__bar {
  background: var(--grey-3);
  border-bottom: none;
  flex: 0 0 auto;

  // The info box's ink, matching the stack/pins headers: brown-8 for the glyph
  // and the title (the shared rule paints the icon teal), brown-4 for the meta.
  .dock-bar__icon,
  .dock-bar__title { color: var(--brown-8); }
  .dock-bar__meta { color: var(--brown-4); }
}

// A frieze band states its own height — `--frieze-h`, or half of it under
// `slim`, which is what this one wears (2026-07-26, fourth pass: half height,
// the brown-1 wave alone, the mask refitted and the carve halved to match — the
// recipe is documented in FriezeBar). It must never be squeezed by the flex
// column it sits in, at either size.
//
// Its PLAQUE BASE is the last thing on this box to leave the brown colorway
// (2026-07-26, third pass). FriezeBar draws it from `--frieze-bar-base`,
// defaulting to the `--brown-4` every other placement keeps; here it is
// `--grey-9`, so the band is neutral like the plaque around it. Dark rather
// than pale, which inverts the motif: the brown-1/brown-2 waves are untouched
// and now read as the light ON a dark strip. That leaves the band the one
// carved, one dark thing in a flat `--grey-3` box — and the `--brown-8` header
// ink above it the only warmth left.
.skeleton-flyout__frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-9);
}

// The information container. It is the stack/pins wells' geometry — 8px of
// reveal where it meets the frieze band (a carved wave needs more air than a
// flat plaque edge), 6px elsewhere — and, since 2026-07-27, their RECESS too:
// `--grey-4`, one step under the `--grey-3` plaque, so the container is a floor
// SUNK into the box rather than a region drawn on it.
//
// It was flush with the plaque for a day (2026-07-26 → 27), the `--grey-4` rim
// alone saying where it began — line-drawn where the side widgets are
// tone-stepped, which is the move the feed's post cards make on the other side
// of the window. What it cost is what brings the step back: with plaque, well
// and panel all one tone, the box had no depth to seat the thing it exists to
// show, and every boundary in it was carrying the same 1px hairline. Now the
// ladder reads in three steps — plaque -3, well -4 (sunk), panel back up at -3
// (raised out of the well, the object the box is showing you) — and the panel's
// teal edges are free to state the NODE rather than the container.
//
// Its RIM is a two-tone BEVEL, and that is what draws the recess (2026-07-27):
// `--grey-5` on the TOP and LEFT, `--brown-1` on the BOTTOM and RIGHT, around a
// `--grey-4` floor. One step DARKER than the fill on the two walls a light from
// the top-left cannot reach, one step LIGHTER on the two it strikes as the floor
// climbs back to the plaque — the oldest carve there is, and the only device
// left to a box with no shadows in it (the one drop this widget casts is the
// whole plaque's, onto the page). Four even lines could say a box was drawn
// here; this says it was cut in.
//
// The lit pair is WARM, and that is the point of it. `--brown-1` is the side
// widgets' own plaque coat — the tone this box left in 2026-07-26's second
// pass, when coat and lines went neutral together — and it sits at the plaque's
// own lightness (#efebe9 against `--grey-3`'s #eeeeee, the same value one hue
// over), so the lip changes HUE and nothing else. It reads as warmth CATCHING
// the light on the edges where the floor turns back up, not as a lighter tone:
// a neutral there (`--grey-3`, worn for one pass) draws the same geometry and
// says nothing about the material. It is the third warm thing in the box, with
// the frieze band's waves and the `--brown-8` header ink — all three on edges
// and lettering, none on a surface.
//
// The shadowed pair is `--grey-5`, this box's tone for anything that has to
// read ON the sunk floor (the scrollbar thumb had to leave -4 for the same
// reason).
//
// It was four even `--grey-4` lines for a day, from when the well was flush
// with the plaque and that rim was the ONE thing saying where the container
// began. The step took that job over and left the rim drawn in its own fill,
// invisible on all four sides — which is what made the bevel the obvious use
// for it: an edge that is no longer needed to state WHERE the container is, is
// free to state what KIND of edge it is.
.skeleton-flyout__well {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  margin: 8px 6px 6px;
  padding: 8px;
  background: var(--grey-4);
  border: 1px solid var(--brown-1);
  border-top-color: var(--grey-5);
  border-left-color: var(--grey-5);
  border-radius: var(--radius-md);
  overflow: hidden;
}

// FeedPostPanel, un-columned. It was built as a sticky side column on a page
// that scrolls; in here the WELL is its frame, so:
//   · `position: static` — sticky against a non-scrolling parent would simply
//     offset it 12px down and nothing else.
//   · `max-height: none` + `min-height: 0` — its `calc(100vh - 90px)` ceiling
//     and 340px floor are both stated against the WINDOW, and the well is a
//     fraction of it; left in, a short window would cut the panel off inside a
//     box that had room for it.
//   · no coat — its `pathos-card` white and 12px padding are the well's job now.
// Its own `__scroll` track stays the scroller, which is what keeps the panel's
// head pinned while the groups run.
.skeleton-flyout__well :deep(.feed-post-panel) {
  position: static;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  max-height: none;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

// ── The quoted CONTENT node ──────────────────────────────────────────────
// `FeedPostPanel` mounts a `NodeMini` here, and a node preview is TEAL
// everywhere else on the platform — which is right where it is quoted into a
// post's prose and wrong in this box, whose plaque, lines and frieze base
// were all deliberately taken OUT of the warm colorway. A saturated panel in
// a flat grey box is the only thing on the surface with a hue, so it reads as
// pasted in from another screen.
//
// Repainted through NodeMini's own `--node-mini-coat` dial rather than by
// reaching into its internals: the Mini keeps deciding what its coat MEANS
// (one uniform tone, head to foot) and this surface only says which tone.
//
// `--grey-2` (2026-07-27), one step ABOVE the `--grey-3` plaque and well it
// sits in. The panel is the box's one object and it is now the LIGHTEST
// thing in it, which is the opposite arrangement to the one this started
// with (`--grey-4`, a step under the plaque: a solid block set INTO a pale
// surface). Both are legible; they say different things. Inset said "quoted
// FROM somewhere" — a block of another document dropped into the panel.
// Raised says "the thing this box is showing you", which is what a viewer's
// one object actually is.
//
// The consequence to know about: the `--grey-1` source pane inside it is now
// within a hair of the coat (1.04:1, where on `--grey-4` it stood at 1.26:1
// and read as paper laid IN a frame). The pane is drawn by its RIM now, not
// by its tone — which is consistent with the rest of this panel, everything
// on it being stated in line rather than in fill, but it is a real loss of
// the paper effect and worth naming rather than discovering.
//
// Its LINES follow the coat OUT of the colorway (2026-07-27): `--grey-4`, at
// the component's own 1px, so at rest the quoted node is drawn ENTIRELY in
// neutrals — coat and every line — and the colorway is left where it actually
// says something.
//
// Its HEADER followed on the last pass of the same day
// (`--node-mini-head-ink: --grey-10`): the kind glyph, the title and the open
// glyph, the row that says what this node IS, in the neutral standing at
// `--teal-10`'s own 900 index. So the head changes HUE and nothing else — same
// weight, and better contrast than it had (15.9:1 on the raw title's grey-1 box
// against the teal's 10.8:1). It is the row that reads first in a box whose
// job is to describe ONE post, and a green-black title over the panel's own
// heading was the last mark on the flyout pointing at another colorway.
// The ink dial stops at the header on purpose — see NodeMini, which exposes it
// per zone: the SOURCE pane keeps `--teal-10`, so the colorway still holds
// the panel's body after its head has gone neutral. That leaves it in three
// places, and they are enough: that ink below the header; the `--teal-1`
// ring on the outer edge; and hover.
//
// `--grey-4` is not just a tone that works at 1.21:1 on the `--grey-2` coat.
// It was THE line of this box at the time — the plaque's outer border, the
// well's rim and the panel's scrollbar thumb were all drawn in it (only the
// plaque's border still is: the rim became a `--grey-5`/`--brown-1` bevel and
// the thumb went to -5 when the well sank). So the quoted node's divisions are now the same mark as the frame's
// divisions, and the flyout has ONE line system from its outermost edge to
// the hairline between two zones of a panel three levels inside it. That is a
// stronger reason than any contrast figure: a box that states every edge in
// one tone reads as one object, and the node is a part of it rather than a
// visitor with its own drawing conventions.
//
// The whole panel now sits inside ~1.2:1 of itself — coat to lines 1.21:1,
// coat to ring 1.06:1, coat to source pane 1.04:1. That is the direction this
// box has been going all day, and it holds only because nothing here is asked
// to separate by lightness: the ring separates by hue, the pane by its rim,
// the structure by arrangement and by the INK on it — `--grey-10` on the
// header row, `--teal-10` from the body down. Those two are the only marks in
// the whole box past 10:1, and they are the only ones carrying words.
//
// The tour is worth keeping — every stop failed a different way, and some are
// the same tones read against a coat that moved under them. `--teal-3`
// (NodeMini's default) is drawn for a `--teal-1` coat and was the loudest
// mark in the box. `--teal-2` stated the divisions quietly and by HUE —
// correct, and inaudible once the ring and the ink were already carrying the
// colorway. `--grey-3` was 1.14:1 and LIGHTER than the old `--grey-4` coat,
// then 1.06:1 and darker than the `--grey-2` one: the same tone reading both
// ways round, which is what the coat move did to everything on this panel.
// `--grey-5` was the emphatic neutral (1.42:1 on `--grey-4`, 1.72:1 on
// `--grey-2`) and got thickened to 2px for one pass on top of that, which is
// where this panel found its ceiling: the extra weight put the panel's own
// divisions ahead of everything they divide, in a box where the plaque, the
// well and the frieze band are all stated in single pixels.
//
// HOVER is dialled too, to `--teal-12` (2026-07-27) — the accent mint, taking
// the panel's outer border and every inner hairline at once (NodeMini lights
// its whole line system from this one value: `--panel-rule`, `--node-rule`
// and `border-color` together). Dialling it is mandatory once the resting
// lines move at all, for that same reason — and doubly so now that they are
// grey: the component's own `--teal-11` default would flare a mint on a
// panel with no teal left in its lines at all.
//
// Against a neutral resting line the mint is the panel's ONE moment of hue,
// which is a cleaner job than it had when the lines were teal-2 and hover was
// a shift within the same family. It is also very nearly a pure hue change:
// `--grey-4` sits at 1.21:1 on the `--grey-2` coat and the mint at 1.14:1,
// both DARKER than what they draw on, so the lines hold their weight and
// close to their value and simply arrive in colour. One line weight
// throughout, hue carrying the whole answer, on a box that has spent its
// entire lightness range on being quiet.
//
// It was `--teal-10` for one pass, the panel's own dark ink: emphatic, and
// wrong in the other direction — the lines went nearly black under the
// pointer, so a panel whose whole line system states its divisions QUIETLY
// gained the heaviest marks in the box on the way past it. NodeMini's own
// default `--teal-11` is the family's paler mint, drawn to lift off a
// `--teal-1` coat; -12 is the accent that still reads as one on grey.
//
// ── The panel's ONE MARK OF ITS OWN: a mint BASE (2026-07-27) ─────────────
// The extra edge is gone from all four sides and lives on the BOTTOM alone, as
// a 2px `--teal-13` border: the accent mint at full chroma, on the one side of
// the box where a weighted line means something. It was `--teal-12` (A200) for
// a day — the PALE mint, which reads as a line at 1.08:1 on a light coat and
// says so quietly; `--teal-13` (A400) is that same hue with the chroma up and a
// step of value behind it. A 2px edge on ONE side is a statement, and the tone
// should carry as far as the geometry does. Everything else in this box is a
// hairline drawn in a tone; this is the one line allowed to be a COLOUR. That is NodeMini's own uneven-border device
// (1px box, heavier foot — the feed card's, read at Mini scale) restored after
// the flyout had flattened it, and it is the CHIP's device exactly, one level
// up: a light object seated on a mint base, which is the only tone on that pill
// belonging to nothing else. A base states that the panel is a thing LYING in
// the well; a ring stated that it was a thing set apart from it.
//
// What it replaces is worth keeping, because the whole day's argument ran
// through it. The extra edge was an `outline` — chosen for the geometry, since
// an outline draws outside the border box and takes no part in layout, so the
// panel kept its own box and merely gained a ring — and it walked
// `--grey-6` → `--grey-3` → `--grey-2` → `--teal-1`. The three greys each
// failed differently and together they map the range: -6, two steps under the
// then-coat, shouted beside teal lines; -3 was the well's exact tone and
// vanished outright (the trap of a ring drawn in the surface it sits on); -2, a
// thread of LIGHT, read correctly and said nothing. `--teal-1` was the answer
// for as long as the panel had given its colorway away entirely — the coat
// NodeMini wears everywhere else, restated once on the outermost line, so the
// node was drawn in the HOST's tones and ringed in its OWN, separating by HUE
// where no neutral could. It stopped being needed the moment the two reading
// panes went `--teal-1` themselves: the colorway was back INSIDE the panel,
// and a ring in the same tone was then a third statement of it around the
// outside. The panes went neutral for two passes after that (`--grey-3`, then
// `--grey-4`) and came back to `--teal-1`, and the ring stays gone through all
// of it: what a ring answers is a panel that needs separating from its well by
// something other than a line, and this box now answers that twice over — the
// mint base, and the panel standing a tonal step ABOVE the sunk `--grey-4`
// well it lies in.
//
// The base and the HOVER tone are deliberately different values of the same
// mint — `--teal-13` here, `--teal-12` above. That is the CHIP's own rule
// (its base stays off the hover tone so an object's own mark and the pointer's
// are never the same colour at once), and it was crossed for one day while both
// were -12: the base stopped being the panel's alone whenever the pointer was
// on it. Moving the base up the accent scale rather than moving hover down
// keeps it — the other way out, hover at `--teal-11`, is drawn for a `--teal-1`
// coat and reads weakly on a neutral one. Keep them apart if either moves.
.skeleton-flyout__well :deep(.mini-panel) {
  // 2px on the bottom, 1px on the other three — NodeMini's own proportion, the
  // flyout having spent the day arguing itself out of it: the base was flattened
  // to 1px on the grounds that the ring already seated the panel and a heavy
  // side with a second line a pixel outside it was just an uneven box, and a 2px
  // CAP on top was tried and reverted the same day (a document read top-down
  // wanting a head rather than a base). With the ring gone the argument goes
  // with it — there is no second line outside this one, and the weight is the
  // whole of what makes a base read as a base.
  border-bottom: 2px solid var(--teal-13);
}

// ── DENSITY — the bands get out of the document's way (2026-07-27) ────────
// NodeMini's paddings are drawn for a panel QUOTED INTO a post: a few lines of
// preview in a card that has room, where the bands can afford to breathe. In
// here the same panel is a VIEWER under a hard ceiling (20% of the box, above),
// so every pixel a band spends on air is a pixel of the document nobody reads.
// The type sizes follow for the same reason: this is a reference pane, not
// prose.
//
// Stated HERE and not as more dials on NodeMini, unlike the colour work above.
// Tone is the component's business — the Mini keeps deciding what its coat
// MEANS and the host only says which tone — but density is a fact about the
// BOX: it follows from the ceiling this surface publishes, and no other surface
// mounting a NodeMini has that constraint. It is also the same kind of reach as
// the two rules either side of this one (the even border, the flattened pills),
// which are host opinions about a quoted panel and live with the host.
//
// SPECIFICITY, not `!important`: `.skeleton-flyout__well[data-v] :deep(x)` carries
// two classes and an attribute against NodeMini's own one-class-plus-attribute
// rules, so these win on their own. Anything reaching a MicroChip internal
// would not — see the `!important`s in NodeMini's chip block for why.
//
// Roughly halved all round, and the vertical is where it counts: 5px → 2px on
// the header zones takes 6px off the band, which the ceiling hands straight
// to the pane. The horizontal comes in with it (8px → 6px) so the row still
// reads as a padded band rather than text pushed against a rule.
// (The FOOT rules that lived here — section seams, the shared-out row, the
// chip's 70% allowance — went with NodeMini's foot on 2026-07-27: the chip
// is in the panel's header now and the thumbs ride the embed caption, which
// a raw-mode markdown quote does not have.)
.skeleton-flyout__well {
  :deep(.node-mini__zone) { padding: 2px 6px; }

  // The MIDDLE, on both counts. MiniPanel's body inset and the pane's own
  // padding are stacked — 15px above the first line of the file and 15px below
  // the last — which on a 98px pane is a third of the reading surface spent on
  // margins INSIDE a box that is already inside two others. Trimmed to 4 + 5,
  // the pane keeps a visible inset off its rim and gains a line and a half.
  :deep(.mini-panel__body) { padding: 4px 7px; }
  :deep(.node-mini__source) {
    padding: 5px 7px;
    // 0.78em → 0.72em (≈10.9px → 10.1px). The pane is a REFERENCE — the
    // markdown as written, monospace, scanned for structure rather than read
    // through — and this box is 35% of a window's width. The 1.62 line-height
    // stays untouched: it is what makes aligned source scannable, and it is the
    // last thing to give.
    font-size: 0.72em;
    // ── The READING SURFACES are the NODE's material (2026-07-27) ───────────
    // The two boxes a reader looks INTO — this one and the title box below —
    // are `--teal-1`, NodeMini's own coat, where the component defaults to a
    // `--grey-1` near-white and where this panel's coat is the host's
    // `--grey-3`. So the node is drawn in the BOX's material and the DOCUMENT
    // inside it in the node's: the colorway lands where the reader's eye
    // actually is rather than on a rim.
    //
    // Both neutrals were worn the same day and neither states a document.
    // `--grey-1` (the component's own) measured 1.04:1 on the coat — a step of
    // lightness too small to read as a step, so the pane looked like a mistake
    // rather than a decision. `--grey-4` INSET it a real 1.14:1, correct as
    // depth and wrong as material: the document then belongs to the box, drawn
    // in the tone the plaque's border and the well's floor are drawn in, and
    // the panel stops being the one thing in the box with a material of its
    // own. `--teal-1` is 1.08:1 AND tinted — an inset stated by MATERIAL, which
    // is what the whole box does (the well is sunk by tone, the panel is raised
    // by tone, and hue is what says whose surface a thing is).
    //
    // The INK on it is the BOX's, not the node's: `--brown-10` (`--teal-10`,
    // the component's own pairing for a teal-1 pane, until the same day) at
    // 12.9:1 here. So every WORD on this panel is brown — head row and
    // document — and the reading surface under them is teal: the box
    // letters what it is showing you, the node supplies what it is made of.
    color: var(--brown-10);
    background: var(--teal-1);
  }
  // (The raw TITLE rule that closed this block — teal-1 floor, 0.86em mono —
  // died with the title text itself on 2026-07-27: the header zone now holds
  // NodeMini's address chip, an object with its own face, and the post's
  // human title lives on the zone's tooltip.)
}

// The GENERIC face's frame (2026-07-31): SkeletonMini is a compact panel
// drawn for post bodies, so in here it gets the well's whole width and its
// own scroll track — the same one-scroller rule the post face keeps, just
// owned by this wrapper instead of FeedPostPanel's `__scroll`.
.skeleton-flyout__generic {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;

  :deep(.mini-panel) { width: 100%; }
}

// The panel's scrollbar, one step darker than the floor it runs on: `--grey-5`
// (2026-07-27). It was `--grey-4` — the box's line tone, and quiet at 1.14:1 on
// the `--grey-3` well of the day before — and the well going `--grey-4` itself
// left the thumb drawn in its own track's tone, i.e. drawn nowhere. -5 puts it
// back at 1.34:1, marginally firmer than it ever was on the pale floor, which a
// 4px bar needs. It was brown-4 for exactly as long as the well was brown; a
// warm thumb is the one moving thing on the surface and would be the first
// place the eye caught the old colorway.
.skeleton-flyout__well :deep(.feed-post-panel__scroll) {
  scrollbar-color: var(--grey-5) transparent;

  &::-webkit-scrollbar-thumb { background: var(--grey-5); }
}
</style>
