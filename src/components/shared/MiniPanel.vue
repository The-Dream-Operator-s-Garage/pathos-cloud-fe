<template>
  <!-- Generic chrome for every XMini in the family. Extracted from the
       duplicated styles in PostMini/PathMini so EntityMini, NodeMini,
       LabelMini reuse the same panel surface. Each Mini fills the named
       slots; the panel handles spacing, borders, hover state, and the
       optional router-link wrapper. -->
  <component
    :is="rootTag"
    :to="to"
    class="mini-panel-link"
    :data-nav-focus="typeof to === 'string' ? to : null"
  >
    <article class="mini-panel" :class="{ 'mini-panel--hover': !!to }">
      <!-- The default head is a STACK of zones (title / chips / labels /
           hash), one per line. A Mini that composes its own header ROW
           passes #head instead and takes the whole zone — the panel keeps
           only the head's tone and its divider. NodeMini is the one caller
           (icon | title | chip | open, split by vertical hairlines). -->
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

export default defineComponent({
  name: 'MiniPanel',
  inheritAttrs: false,
  props: {
    to: { type: [String, Object], default: null },
    // The body slot holds something whose SIZE IS ITS MEANING — a picture,
    // a player, an embedded frame — rather than a few lines of excerpt.
    // Drops the 110px cap and the scroller; see the note on the style.
    bodyFit: { type: Boolean, default: false }
  },
  setup (props) {
    const rootTag = computed(() => props.to ? 'router-link' : 'div')
    return { rootTag }
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
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.08s;

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.mini-panel--hover:hover {
  border-color: rgba(var(--coral-rgb), 0.45);
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
