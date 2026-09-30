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
         composites one layer darker. The zones inside (head / body / foot)
         paint NOTHING by default — a zone that also painted the coat would
         lay the glass twice and read two levels deep;
       · THE ROW — `#head` is a ROW of hairline-split zones (`MiniHead`), so
         the row reset every own-head Mini wrote is the default here;
       · THE KIND — `kind` hands the nano pill's two colours to the whole
         panel as `--mini-accent` (the pill's glyph) and `--mini-ink` (its
         text, Material 900), read by the head, the foot and the body. -->
  <component
    :is="rootTag"
    :to="to"
    class="mini-panel-link"
    :data-nav-focus="typeof to === 'string' ? to : null"
  >
    <article class="mini-panel" :class="panelClass" :style="kindStyle">
      <!-- The default head is a STACK of zones (title / chips / labels /
           hash), one per line. A Mini that composes its own header ROW
           passes #head instead and takes the whole zone — the panel keeps
           only the head's tone and its divider. Every family Mini does, via
           `MiniHead` (chip+copy │ name │ switches │ open); the stack is kept
           for the plain list rows that still use it. -->
      <header v-if="$slots.head" class="mini-panel__head mini-panel__head--own">
        <slot name="head" />
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

      <div
        v-if="$slots.body"
        class="mini-panel__body"
        :class="{ 'mini-panel__body--fit': bodyFit }"
      >
        <slot name="body" />
      </div>

      <footer v-if="$slots.foot" class="mini-panel__foot">
        <slot name="foot" />
      </footer>
    </article>
  </component>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'MiniPanel',
  inheritAttrs: false,
  props: {
    to: { type: [String, Object], default: null },
    // The body slot holds something whose SIZE IS ITS MEANING — a picture,
    // a player, an embedded frame — rather than a few lines of excerpt.
    // Drops the 110px cap and the scroller; see the note on the style.
    bodyFit: { type: Boolean, default: false },
    // The element kind this panel shows ('nodes', 'posts', … — a kinds.js
    // prefix or slug). Its two nano-pill colours ride the article as
    // `--mini-accent` / `--mini-ink`; empty = the panel's slate defaults.
    kind: { type: String, default: '' }
  },
  setup (props) {
    const rootTag = computed(() => props.to ? 'router-link' : 'div')
    const meta = computed(() => (props.kind ? kindFor(props.kind) : null))
    const kindStyle = computed(() => (meta.value
      ? { '--mini-accent': meta.value.color, '--mini-ink': meta.value.ink }
      : null))
    const panelClass = computed(() => ({
      'mini-panel--hover': !!props.to,
      'mini-panel--family': !!meta.value,
      ['mini-panel--' + (meta.value?.kind || '')]: !!meta.value
    }))
    return { rootTag, kindStyle, panelClass }
  }
})
</script>

<style lang="scss" scoped>
.mini-panel-link {
  display: block;
  text-decoration: none;
  color: inherit;

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
  // is the seam a Mini may re-point; `--panel-chrome` / `--panel-body` paint
  // the ZONES and are transparent now, because a zone painting the same
  // translucent coat over the article's would double it (head and body
  // reading one nesting level deeper than the panel they belong to). Before
  // this pass the chrome was `#f4f7fb` and the body white — the two-tone
  // panel NodeMini, PathMini and SkeletonMini each flattened by writing both
  // dials into their own colorway.
  --panel-coat:   var(--mini-coat, rgba(33, 33, 33, 0.08));
  --panel-chrome: transparent;
  --panel-body:   transparent;
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
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;

  & > * + * { border-top: 1px solid var(--panel-rule); }
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
  padding: 2px 0;
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
