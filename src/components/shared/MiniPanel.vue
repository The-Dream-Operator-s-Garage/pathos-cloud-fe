<template>
  <!-- Generic chrome for every XMini in the family. Extracted from the
       duplicated styles in PostMini/PathMini so EntityMini, NodeMini,
       LabelMini reuse the same panel surface. Each Mini fills the named
       slots; the panel handles spacing, borders, hover state, and the
       optional router-link wrapper.

       ⭐ 2026-09-30 — THE FAMILY BASIS (user ask: "take as layout the node
       mini viewer … refactor the whole family … use the nano pills icons and
       coloring … make them all the same background color as the node viewer
       … slightly transparent and blurry"). Three things every Mini used to
       restate now live here:
       · THE GLASS — one translucent `--mini-coat` on the article (+ a
         backdrop blur on the top-level panel), so a panel nested in a panel
         composites one layer darker. The head and foot zones paint NOTHING
         — a zone that also painted the coat would lay the glass twice and
         read two levels deep — and the BODY is the content well (⭐
         2026-10-17): the post card pit's solid grey-1 floor, inset in the
         frame under the head's hairline, 2px on top, `--pit-r` below, a
         darker hairline of its own;
       · THE ROW — `#head` is a ROW of hairline-split zones (`MiniHead`), so
         the row reset every own-head Mini wrote is the default here;
       · THE KIND — `kind` hands the nano pill's two colours to the whole
         panel as `--mini-accent` (the pill's glyph) and `--mini-ink` (its
         text, Material 900), read by the head, the foot and the body. -->
  <!-- ⭐ 2026-10-18 — THE SIDE DOOR (user ask: "if i click on the item (its
       title), it currently takes me to its individual page. Instead, make
       the item be opened on the side viewer. we don't want to use the
       individual page by now"). The wrapper was a router-link to `to`; it
       is a plain box now that, when `to` is set, opens the element in the
       SIDE viewer (a floating window where none is mounted — never the
       page). `to` still marks the panel a door (hover lift, the cursor, the
       nav halo's key); the element is the one the head registered. A press
       on something that is its own door — a chip, a button, a link, a
       nested Mini — is left to it. Being no anchor, the panel may now hold
       anchors (the label strip's). -->
  <div
    class="mini-panel-link"
    :class="{ 'is-door': !!to }"
    :role="to ? 'link' : null"
    :tabindex="to ? 0 : null"
    :data-nav-focus="typeof to === 'string' ? to : null"
    @click="onPress"
    @keydown.enter.self.prevent="openSide"
  >
    <article ref="articleEl" class="mini-panel" :class="panelClass" :style="kindStyle">
      <!-- The default head is a STACK of zones (title / chips / labels /
           hash), one per line. A Mini that composes its own header ROW
           passes #head instead and takes the whole zone — the panel keeps
           only the head's tone and its divider. Every family Mini does, via
           `MiniHead` (chip+copy │ name │ switches │ labels │ pin │ open);
           the stack is kept for the plain list rows that still use it.
           ⭐ 2026-10-18: #head gets the label strip's state as SLOT PROPS
           (`labelCount`, `labelsHidden`, `toggleLabels`) for a head that is
           plain template (SkeletonMini's); `MiniHead`, a component, injects
           the same state (`miniPanel`). -->
      <header v-if="$slots.head" class="mini-panel__head mini-panel__head--own">
        <slot name="head" v-bind="headScope" />
      </header>

      <header v-else class="mini-panel__head">
        <div v-if="$slots.title" class="mini-panel__title nasalization">
          <slot name="title" />
        </div>

        <div v-if="$slots.chips" class="mini-panel__chips">
          <slot name="chips" />
        </div>

        <div v-if="$slots.labels" class="mini-panel__labels">
          <slot name="labels" />
        </div>

        <div v-if="$slots.hash" class="mini-panel__hash">
          <slot name="hash" />
        </div>
      </header>

      <!-- ⭐ 2026-10-18 — THE LABEL STRIP: the element's labels, one dense
           row under the head (MiniLabelStrip). Drawn when there are labels
           and the viewer has not hidden them with the head's switch. -->
      <MiniLabelStrip v-if="stripShown" class="mini-panel__strip" :labels="labelRows" />

      <div
        v-if="$slots.body"
        class="mini-panel__body"
        :class="{ 'mini-panel__body--fit': bodyFit, 'mini-panel__body--bare': bare }"
      >
        <slot name="body" />
      </div>

      <footer v-if="$slots.foot" class="mini-panel__foot">
        <slot name="foot" />
      </footer>
    </article>
  </div>
</template>

<script>
import { defineComponent, computed, ref, shallowRef, reactive, provide, watch } from 'vue'
import { useRouter } from 'vue-router'
import MiniLabelStrip from './MiniLabelStrip.vue'
import { kindFor } from 'src/utils/kinds'
import { elementTarget } from 'src/utils/elementTarget'
import { openInSideViewer } from 'src/stores/flyoutViewers'
import {
  labelAddress, requestLabels, labelsOf, seedLabels, labelsHidden, setLabelsHidden
} from 'src/utils/elementLabels'

// What answers a press itself — the panel's door stands aside for it.
const OWN_DOORS = 'a[href], button, input, textarea, select, summary, label, video, audio, iframe, ' +
  '[role="button"], [role="link"], [contenteditable=""], [contenteditable="true"], .mini-panel'

// A seed is drawn only if it already says who attached each label (the
// rail groups by it) — an unattributed row set would group one way now and
// another once the read lands.
const attributed = (rows) => rows.every((l) => l && (l.system_label || 'added_by' in l))

export default defineComponent({
  name: 'MiniPanel',
  components: { MiniLabelStrip },
  inheritAttrs: false,
  props: {
    // A DOOR: a press on the panel opens its element in the side viewer
    // (2026-10-18; a router-link to this route until then). The value
    // still keys the nav halo (`data-nav-focus`).
    to: { type: [String, Object], default: null },
    // The body slot holds something whose SIZE IS ITS MEANING — a picture,
    // a player, an embedded frame — rather than a few lines of excerpt.
    // Drops the 110px cap and the scroller; see the note on the style.
    bodyFit: { type: Boolean, default: false },
    // ⭐ 2026-10-18 — NO WELL: the body holds ONE thing that is its own
    // object (NodeMini's embedded link, picture, video, audio), so the
    // container vanishes and the item stands alone on the glass, the well's
    // `--mini-well-gap` off the frame. See `.mini-panel__body--bare`.
    bare: { type: Boolean, default: false },
    // The element kind this panel shows ('nodes', 'posts', … — a kinds.js
    // prefix or slug). Its two nano-pill colours ride the article as
    // `--mini-accent` / `--mini-ink`; empty = the panel's slate defaults.
    kind: { type: String, default: '' },
    // ⭐ 2026-10-18 — THE ELEMENT this panel shows, `{ kind, id, path }`:
    // what the side door opens and whose labels the strip reads. A
    // `MiniHead` registers it by itself; a Mini with its own head passes it.
    element: { type: Object, default: null },
    // Label rows the Mini's row already carries (a node read, a feed row)
    // — drawn at once instead of after the batched read.
    labels: { type: Array, default: null }
  },
  setup (props) {
    const router = useRouter()
    const articleEl = ref(null)
    const meta = computed(() => (props.kind ? kindFor(props.kind) : null))
    const kindStyle = computed(() => (meta.value
      ? { '--mini-accent': meta.value.color, '--mini-ink': meta.value.ink }
      : null))
    const panelClass = computed(() => ({
      'mini-panel--hover': !!props.to,
      'mini-panel--family': !!meta.value,
      ['mini-panel--' + (meta.value?.kind || '')]: !!meta.value
    }))

    // ── THE ELEMENT — handed in, or registered by the head ──────────────
    const registered = shallowRef(null)
    const identity = computed(() => props.element || registered.value)

    // ── THE LABEL STRIP ────────────────────────────────────────────────
    // utils/elementLabels batches every panel mounting in a tick into one
    // `GET /refs/labels` and caches per element for the session.
    const address = computed(() => labelAddress(identity.value?.path || ''))
    watch([address, () => props.labels], ([a, given]) => {
      if (!a) return
      if (Array.isArray(given) && attributed(given)) seedLabels(a, given)
      requestLabels(a)
    }, { immediate: true })
    const labelRows = computed(() => {
      const v = address.value ? labelsOf(address.value) : null
      return Array.isArray(v) ? v : []
    })
    const labelCount = computed(() => labelRows.value.length)
    const hidden = computed(() => labelsHidden(address.value))
    const stripShown = computed(() => labelCount.value > 0 && !hidden.value)
    const toggleLabels = () => setLabelsHidden(address.value, !hidden.value)

    // ── THE SIDE DOOR ──────────────────────────────────────────────────
    const openSide = async () => {
      const el = identity.value
      const t = el ? await elementTarget(el) : null
      if (t) openInSideViewer(t)
      else if (props.to) router.push(props.to)
    }
    const onPress = (e) => {
      if (!props.to || e.defaultPrevented) return
      const hit = e.target?.closest?.(OWN_DOORS)
      if (hit && hit !== articleEl.value) return
      // A drag that selected text is a reading, not a press.
      const sel = window.getSelection?.()
      if (sel && !sel.isCollapsed && articleEl.value?.contains(sel.anchorNode)) return
      openSide()
    }

    // What the head reads: MiniHead injects it, a template head takes it as
    // slot props. `register` is MiniHead's — the element it is the head of.
    const state = reactive({
      labelCount,
      labelsHidden: hidden,
      toggleLabels,
      openSide,
      register: (el) => { registered.value = el }
    })
    provide('miniPanel', state)
    const headScope = computed(() => ({
      labelCount: labelCount.value,
      labelsHidden: hidden.value,
      toggleLabels,
      openSide
    }))

    return { articleEl, kindStyle, panelClass, stripShown, labelRows, headScope, onPress, openSide }
  }
})
</script>

<style lang="scss" scoped>
.mini-panel-link {
  display: block;
  text-decoration: none;
  color: inherit;

  // A DOOR panel (`to`) answers the pointer as the router-link it used to be
  // (2026-10-18: it opens the side viewer now), and shows the keyboard where
  // it stands.
  &.is-door { cursor: pointer; }
  &.is-door:focus-visible { outline: none; }
  &.is-door:focus-visible > .mini-panel {
    box-shadow: 0 0 0 2px var(--mini-accent, var(--coral-deep, #d35f5f));
  }

  // Restated on :hover to WIN, not to repeat itself. A Mini quoted into a post
  // body sits inside rendered prose, and every prose surface underlines its
  // links on hover — `.md-rendered a:hover` (css/_components.scss),
  // `.post-square__md :deep(.markdown-body) a:hover` (FeedStream),
  // `.post-md-rendered` (PostViewerPage). The panel IS that anchor, and because
  // the decoration is drawn by the anchor and propagates down its whole box
  // tree, hovering a panel struck a line under every run of text in it at once:
  // title, excerpt, chip, counts. An underline marks a word inside a sentence;
  // a panel is not a word, and its hover affordance is already the border, the
  // shadow and the 1px lift below.
  //
  // `!important` because specificity cannot win this and should not have to.
  // Those prose rules are SCOPED — `.post-square__md[data-v-…] .markdown-body
  // a:hover` scores four classes and an element — so out-selecting them means
  // beating the highest-scoring surface that exists today and losing again to
  // the next one somebody writes. The rule here is not a preference to be
  // weighed against theirs: prose styles inline links, and this is a BLOCK
  // quoted into prose. Stating it absolutely is the only version that holds
  // for every surface, including ones this component has never heard of.
  &:hover { text-decoration: none !important; }
}

.mini-panel {
  // ── THE GLASS (2026-09-30) ──────────────────────────────────────────────
  // ONE coat, on the article, for every kind: `--mini-coat` (_tokens.scss —
  // grey-10 at 8%, the tone and the ratio are argued there). `--panel-coat`
  // is the seam a Mini may re-point; `--panel-chrome` paints the head and
  // foot ZONES and is transparent, because a zone painting the same
  // translucent coat over the article's would double it (reading one nesting
  // level deeper than the panel it belongs to). Before this pass the chrome
  // was `#f4f7fb` and the body white — the two-tone panel NodeMini, PathMini
  // and SkeletonMini each flattened by writing both dials into their own
  // colorway.
  // ⭐ `--panel-body` is the CONTENT WELL's floor since 2026-10-17 — the post
  // card pit's `--pit-coat` (grey-1; inherited inside a card, the fallback
  // everywhere else), SOLID: the body is no longer glass but the reading
  // area set into it (`.mini-panel > .mini-panel__body` below).
  --panel-coat:   var(--mini-coat, rgba(33, 33, 33, 0.08));
  --panel-chrome: transparent;
  --panel-body:   var(--pit-coat, var(--grey-1, #fafafa));
  // THE LINES — the same tone at a fixed share, so a rule is always one step
  // darker than the glass it sits on, at any depth (22% ≈ grey-5 over one
  // layer: NodeMini's resting line; the hover's 58% ≈ grey-7, its hover). The
  // header's zone hairlines (MiniHead) read `--panel-rule` too, so the pointer
  // repaints the WHOLE line system by writing one property — NodeMini's
  // 2026-07-26 rule, now the family's. (Coral 45% was the family hover until
  // this pass; NodeMini had overridden it since July.)
  --panel-rule:   var(--mini-rule, rgba(33, 33, 33, 0.22));
  --panel-rule-hover: var(--mini-rule-hover, rgba(33, 33, 33, 0.58));
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  // Every panel starts its own text world: a family body centres what it
  // shows (below), and `text-align` inherits — a panel nested in that body
  // would otherwise arrive centred.
  text-align: left;
  background: var(--panel-coat);
  // "…and blurry." The frost is for what passes BEHIND a panel; see the
  // nested rule below for why only the top-level panel draws it.
  -webkit-backdrop-filter: blur(var(--mini-blur, 6px));
  backdrop-filter: blur(var(--mini-blur, 6px));
  border: 1px solid var(--panel-rule);
  // ⭐ THE BOTTOM TWO NEARLY SQUARE since 2026-10-17 (user ask: "for all the
  // mini family … making their bottom left and bottom right corners way less
  // rounded … they should remain rounded, but just a little … their
  // roundness should match the bottom corners of the content container"):
  // the post card pit's `--pit-r` (6.34px — inherited inside a card, the
  // fallback everywhere else); the top two keep `--radius-md` (0.85em), the
  // corner the pit's rounder top arcs around (FeedStream `--pit-r-top`).
  // Every Mini's frame is this one rule — the family's inner radii are
  // their own parts' (source panes, pills, rows), not the frame's.
  // ⭐ THE CORNER DIALS (2026-10-20, user ask: "make the corner roundness a
  // modifiable property"): `--mini-r-tl` / `-tr` / `-br` / `-bl`, one per
  // corner, the family's numbers as their fallbacks. A host writes them ON
  // the panel it places (DashboardSlot: the board's container corner where
  // the slot touches one, square elsewhere); they stop at this panel — its
  // children reset them (below), so a Mini nested in this one keeps the
  // family's corners.
  border-radius: var(--mini-r-tl, var(--radius-md)) var(--mini-r-tr, var(--radius-md))
    var(--mini-r-br, var(--pit-r, 6.34px)) var(--mini-r-bl, var(--pit-r, 6.34px));
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;

  & > * + * { border-top: 1px solid var(--panel-rule); }

  // The dials are ONE panel's: `initial` is the guaranteed-invalid value, so
  // every panel below falls back to the family's corners again.
  & > * {
    --mini-r-tl: initial;
    --mini-r-tr: initial;
    --mini-r-br: initial;
    --mini-r-bl: initial;
  }
}

// A NESTED panel draws no blur. In flow, what stands behind it is its host
// panel's own flat glass — a blur of a flat colour is that colour — and every
// `backdrop-filter` is a compositing layer of its own (the path-viewer fixture
// stacks ~90 panels four deep). The coat still composites, which is the whole
// darkening feature; only the no-op frost is skipped.
.mini-panel .mini-panel {
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

.mini-panel--hover:hover {
  --panel-rule: var(--panel-rule-hover);
  border-color: var(--panel-rule-hover);
  box-shadow: 0 4px 14px rgba(var(--ink-rgb), 0.10);
  transform: translateY(-1px);
}

.mini-panel__head {
  padding: 6px 10px 5px;
  background: var(--panel-chrome);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// THE ROW (2026-09-30 — the family default). An own head is a ROW of zones
// divided by FULL-HEIGHT hairlines, so the zones carry the padding and the
// header none (a padded header insets the rules short of both edges);
// `align-items: stretch` runs each rule the band's whole height. The
// `flex-direction` and `gap` are RESETS of the stack above — inheriting them
// stacked the zones into a tower, the gotcha NodeMini paid on 2026-08-23 and
// SkeletonMini again on 09-17, which every own-head Mini then restated.
.mini-panel__head--own {
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  padding: 0;
  min-width: 0;
}

.mini-panel__title {
  font-size: 0.95em;
  line-height: 1.25;
  color: var(--panel-ink-1);
  font-weight: 600;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mini-panel__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.74em;
  color: var(--panel-ink-2);
}

.mini-panel__labels {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding-top: 3px;
  border-top: 1px dashed rgba(var(--ink-rgb), 0.10);
}

.mini-panel__hash {
  display: flex;
  align-items: center;
  padding-top: 4px;
  border-top: 1px dashed rgba(var(--ink-rgb), 0.10);
  min-width: 0;
}

.mini-panel__body {
  padding: 7px 10px;
  background: var(--panel-body);
  min-height: 32px;
  // Scrollable preview slider — Minis cap at a few lines, scroll beyond.
  max-height: 110px;
  overflow-y: auto;
}

// …unless the body IS the content. The cap above is an EXCERPT rule: it
// says "a Mini quotes a few lines and you open it for the rest", which is
// right for text and wrong for a picture or a player, where the preview is
// the whole thing and 110px is simply a crop of it — a 480×270 video came
// out as its top 110px with the play button scrolled out of the panel.
// Media Minis size themselves instead (`--media-max-h`, published by the
// surface), so here the cap and the scroller both come off and the body
// takes exactly the height its content asked for.
.mini-panel__body--fit {
  max-height: none;
  // `clip`, not `visible`, since the well (2026-10-17): the body's bottom
  // corners are round now, and a picture, a player or a grid running to its
  // edge must be cut to them. `clip` and not `hidden`, because `hidden`
  // makes a scroll container — a sticky column inside (SkeletonMini's keys)
  // would stick to this box instead of the surface that really scrolls.
  overflow: clip;
}

// ── ⭐ THE CONTENT WELL (2026-10-17) ─────────────────────────────────────
// User ask: "for all the mini viewer family, help me making their content be
// displayed inside a content container that is the same color as the post
// cards content container. Make the content container have rounded bottom
// left and bottom right corners and make it have square top left and top
// right corners. add to it a darker thin border and put it a little padding
// to separate it a little from the mini viewer outer frame".
// The body IS that container, for every Mini (the nine kinds, SkeletonMini
// included — it declares no `kind`, so this is not a `--family` rule):
// · the FLOOR — `--panel-body`, the pit's `--pit-coat` (above);
// · the AIR — `--mini-well-gap` (4px, the pit's own embrace around a mini)
//   off the frame's two sides and off its bottom — or off the foot, whose
//   divider comes off below: the well's own line already parts them, and a
//   hairline 4px under it would be a second line saying the same thing;
// · the TOP — corners as round as the FRAME's own since 2026-10-18
//   (`--mini-well-r-top` = `--radius-md`, 11.9px at the top level: "round
//   enough to match the … outer frame roundness from inside", then "make
//   them even rounder" — concentric 6.9px stood for the hour between; 2px
//   the evening before — "very subtle" — square in the first cut), under the head's HAIRLINE (or, since 2026-10-18, under the label
//   strip, whose top border is that hairline) (⭐ 2026-10-17 eve,
//   user ask: "keep the thin hairline between the header and the content
//   container"): the full-width `--panel-rule` line the head always had,
//   then the same `--mini-well-gap` of glass, then the well. The line is a
//   1px `box-shadow` under the head rather than a border — a shadow takes
//   no layout, so the head keeps its exact height (the family's 2/2/2 pill
//   inset, the witnesses' head heights) and the well's top margin pays the
//   line's pixel instead (`gap + 1px`). Drawn only when a body follows
//   (`:has(+ …)`): a head over a foot already gets the foot's own divider,
//   and two translucent lines on one pixel would read darker. It repaints
//   with the frame on hover — it IS the frame's line system;
// · the BOTTOM — `--pit-r`, the pit's bottom corner (and the frame's own,
//   so a foot-less Mini's well turns at the same number as the panel around
//   it, 5px further in);
// · the LINE — `--mini-well-rule` (_tokens.scss), a step darker than the
//   frame's 22%. It does not repaint on hover: the pointer's line system is
//   the frame's (`--panel-rule`), the well is the content inside it.
// A CHILD chain, so the rule names this panel's own body only — a nested
// Mini gets its own well from its own panel, never from a host's.
.mini-panel > .mini-panel__body {
  margin: var(--mini-well-gap, 4px);
  border: 1px solid var(--mini-well-rule, rgba(33, 33, 33, 0.40));
  // Top: the frame's own corner since 2026-10-18 (_tokens.scss
  // `--mini-well-r-top`); bottom: the pit's.
  border-radius: var(--mini-well-r-top, 0.85em) var(--mini-well-r-top, 0.85em)
    var(--pit-r, 6.34px) var(--pit-r, 6.34px);
}
.mini-panel > .mini-panel__head:has(+ .mini-panel__body) {
  box-shadow: 0 1px 0 var(--panel-rule);
}
.mini-panel > .mini-panel__head + .mini-panel__body {
  margin-top: calc(var(--mini-well-gap, 4px) + 1px);
}
.mini-panel > .mini-panel__body + .mini-panel__foot {
  border-top: 0;
}

// ── ⭐ THE LABEL STRIP's PLACE (2026-10-18) ──────────────────────────────
// Between the head and the well, on the GLASS (no floor of its own — the
// well is the content; the strip is the element's classification, read in
// passing). Its top edge is the head's hairline: the frame's `* + *` rule
// draws it as a real 1px border, so the head's own 1px shadow line (`:has(+
// body)` above) steps aside and the well's top margin falls back to the
// plain `--mini-well-gap` — a line, the gap, the plates, the gap, the well.
// The plates' row is MiniLabelStrip's (`--mini-strip-row-h`, 14px).
.mini-panel > .mini-panel__strip {
  padding: var(--mini-well-gap, 4px) var(--mini-well-gap, 4px) 0;
}
// No well under it (a body-less Mini): the gap closes the strip instead.
.mini-panel > .mini-panel__strip:not(:has(+ .mini-panel__body)) {
  padding-bottom: var(--mini-well-gap, 4px);
}

// ⭐ NO WELL (2026-10-18, user ask: "for the mini node viewers only, and only
// if they contain a single link, let's just make the container disappear …
// leave the element with a little padding outside, between the node viewer
// edge and itself. Also … for single media files … leave the image only …
// with slightly rounded corners"). The `bare` body keeps the well's PLACE —
// its margins, so the item stands `--mini-well-gap` inside the frame's
// sides and foot and that gap under the head's hairline — and drops
// everything that drew it: floor, line, corners, padding. `overflow`
// comes back to visible: there is no corner left to cut to, and a clip at
// the body's edge would shave the shadow an embed's rim casts into the gap.
// (A well-corner dial that turned the well concentric with its one item
// stood here for an hour the same day; this ask replaced it.)
.mini-panel > .mini-panel__body.mini-panel__body--bare {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  max-height: none;
  overflow: visible;
}

// THE FAMILY BODY (2026-09-30) — a panel that states its `kind` is a member
// of the homogenized family and takes NodeMini's body metrics (the
// 2026-08-23 density ask): no side padding — media meet the border, prose
// brings its own 4px — 2px of air off the divider, and the showcased item
// CENTRED (text bodies opt back out to `justify`). The legacy `7px 10px`
// above stays for panels that declare no kind (SkeletonMini's grid, the
// label-usage list rows). A CHILD chain, so a family panel never re-pads a
// panel nested in its body.
.mini-panel--family > .mini-panel__body {
  // ⭐ 2026-10-18: `--mini-well-pad-y` (4px — "a little inner padding … on
  // the top and bottom", then "the same as the current left and right":
  // the prose's own 4px sides; 2px until then).
  padding: var(--mini-well-pad-y, 4px) 0;
  min-height: 0;
  text-align: center;
}

.mini-panel__foot {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--panel-chrome);
  font-size: 0.74em;
  color: var(--panel-ink-2);
  gap: 8px;
}
</style>
