<template>
  <!-- THE CARD PANEL (2026-10-08, user ask: "a new family of components:
       the X-Card components, like the post cards … cards of all elements …
       taking the post card layout and interaction dynamics as a base …
       consistent with the visual design so they all look sort of the same
       as the post card"). What `MiniPanel` is to the Mini family this is to
       the CARD family: the chrome every XCard wears, lifted from the feed
       card (`posts/FeedStream.vue` `.post-square`) number for number —

         cap │ byline │ pit │ hairline │ foot │ [storey]

       · THE COAT — light-cream square, the grey-3 veil at 75% frosted over
         it (`::before`), a 1px grey-5 rim, 8px corners, the two-layer
         shadow; the hover and the lit (`is-open`) glow are the post card's
         indigo halo generalized to THE KIND's accent (`--card-accent`, off
         kinds.js — a post stays indigo, a node glows teal, a label red);
       · THE DIALS — `--pit-coat` / `--pit-r` / `--card-gutter` /
         `--pit-scale` / `--cap-scale` / `--cap-title-scale`, the very names
         the post card reads, so a host that steps the post card's cap up
         (SideElementView) steps every card up with the same rule;
       · THE PIT — the carved inset the body is read in (the post's
         `.post-square__pit`: grey-1 floor, grey-5 rim, 6.34px corner, the
         card's flexible middle that scrolls in place); `pit-fit` hands the
         whole box to a body that is a viewer of its own (a lane, a grid,
         the label unravel) — no padding, its own scroll;
       · THE SHARE PICKER — one `ConversationPicker` per card, offered to
         the cap's share act through `provide('cardShare')`, so no XCard
         mounts a dialog of its own.
       The zones are SLOTS: `CardCap`, `CardByline`, `CardFoot` fill them
       (shared, one grammar); the pit is the kind's own. -->
  <article
    class="element-card"
    :class="panelClass"
    :style="kindStyle"
    :data-element="address || null"
  >
    <slot name="cap" />
    <slot name="byline" />
    <div
      v-if="$slots.pit"
      class="element-card__pit"
      :class="{ 'element-card__pit--fit': pitFit }"
    >
      <slot name="pit" />
    </div>
    <div class="element-card__hairline" aria-hidden="true" />
    <slot name="foot" />
    <div v-if="$slots.storey" class="element-card__storey">
      <slot name="storey" />
    </div>
    <ConversationPicker v-model="shareOpen" :share-ref="shareRef" />
  </article>
</template>

<script>
import { defineComponent, computed, ref, provide } from 'vue'
import ConversationPicker from 'src/components/chat/ConversationPicker.vue'
import { kindFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'CardPanel',
  components: { ConversationPicker },
  inheritAttrs: false,
  props: {
    // The element kind — a kinds.js prefix ('nodes') or slug ('node').
    kind: { type: String, required: true },
    // The element's address, stamped on the article for hosts + witnesses.
    address: { type: String, default: '' },
    // Lit: this element's window is open (the post card's `is-open`).
    open: { type: Boolean, default: false },
    // The pit is a viewer of its own (lane / grid / unravel): no inset
    // padding, the viewer scrolls itself.
    pitFit: { type: Boolean, default: false },
    // A FILLING card: takes the host's whole height, the pit stretching
    // (the label's unravel viewer in the side viewer — the 2026-10-07 rule).
    fill: { type: Boolean, default: false }
  },
  setup (props) {
    const meta = computed(() => kindFor(props.kind))
    const kindStyle = computed(() => ({ '--card-accent': meta.value.color, '--card-ink': meta.value.ink }))
    const panelClass = computed(() => ({
      ['element-card--' + meta.value.kind]: true,
      'is-open': props.open,
      'is-fill': props.fill
    }))

    // THE SHARE PICKER — the cap's share act asks for it by injection.
    const shareOpen = ref(false)
    const shareRef = ref('')
    const openShare = (address) => {
      if (!address) return
      shareRef.value = String(address)
      shareOpen.value = true
    }
    provide('cardShare', openShare)

    return { kindStyle, panelClass, shareOpen, shareRef }
  }
})
</script>

<style lang="scss" scoped>
// ── THE SQUARE — `.post-square`'s root, restated for every kind ──────────
.element-card {
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 0;
  // The post card's dials, by name (SideElementView re-dials them on
  // `.post-square` and on this root alike).
  --pit-coat: var(--grey-1, #fafafa);
  --pit-r: 6.34px;
  // THE EMBRACE (2026-10-17) — the post card's two dials (its note on
  // `.post-square` has the arithmetic): the air around an embraced mini,
  // and the pit's top corner concentric with that mini's (16.9px).
  --pit-embrace: 4px;
  --pit-r-top: calc(0.85 * var(--font-size-body, 14px) + var(--pit-embrace) + 1px);
  --card-gutter: 4px;
  --pit-scale: 0.88;
  --cap-scale: 0.62;
  --cap-title-scale: 0.8;
  // The halo in the kind's accent, lifted toward white the way indigo-11
  // stands to the posts' indigo-6.
  --card-glow: color-mix(in srgb, var(--card-accent, #3f51b5) 45%, white);
  // A host may cap the card (the feed caps its posts at 60vh); none = the
  // host's own box bounds it (the side viewer's face).
  max-height: var(--element-card-max, none);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 8px;
  background: var(--card-coat, var(--grey-4, #e0e0e0)); // the flyout window's coat since 2026-10-16 (was light-cream under the veil)
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.045),
    0 2px 5px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover {
    border-color: color-mix(in srgb, var(--card-glow) 55%, transparent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--card-glow) 30%, transparent),
      0 0 9px 1px color-mix(in srgb, var(--card-glow) 40%, transparent),
      0 1px 2px rgba(0, 0, 0, 0.045),
      0 2px 5px -2px rgba(0, 0, 0, 0.05);
  }
  &.is-open {
    border-color: var(--card-glow);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--card-glow) 45%, transparent),
      0 0 13px 2px color-mix(in srgb, var(--card-glow) 55%, transparent),
      0 1px 2px rgba(0, 0, 0, 0.045),
      0 2px 5px -2px rgba(0, 0, 0, 0.05);
  }
}

// THE VEIL — the post card's frosted grey-3 sheet under every zone.
.element-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--card-veil, rgba(238, 238, 238, 0.75));
  border: 1px solid var(--grey-1, #fafafa);
  border-radius: 7px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: none;
}
.element-card > * {
  position: relative;
  z-index: 1;
}

// A FILLING card runs the host's length; its pit takes the stretch.
.element-card.is-fill {
  flex: 1 1 auto;
  height: 100%;
}

// ── THE PIT — the carved inset (`.post-square__pit`, verbatim metrics) ───
.element-card__pit {
  // The media budget a quoted picture / player reads (NodeMini, EmbedFrame):
  // the card's cap less the chrome around the pit — the feed card's resting
  // 231 (220 until 2026-10-17, when the byline took the post card's 20px rows
  // and 4px top pad: +11).
  --media-max-h: max(120px, calc(var(--element-card-media, 60vh) - 231px));
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: calc(var(--pit-scale, 0.88) * 1em);
  color: var(--ink, #2C3D4E);
  word-break: break-word;
  line-height: 1.6;
  margin: 3px var(--card-gutter, 4px) 4px;
  --quoted-bleed-x: 10px;
  --pit-pad-y: 8px;
  padding: var(--pit-pad-y) var(--quoted-bleed-x);
  // The top two embrace a mini (2026-10-17, the post card's rule).
  border-radius: var(--pit-r-top) var(--pit-r-top) var(--pit-r, 6.34px) var(--pit-r, 6.34px);
  border: 1px solid var(--grey-5, #bdbdbd);
  background: var(--pit-coat, var(--grey-1, #fafafa));
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.28); border-radius: 3px; }
}
// THE EMBRACED MINI (2026-10-17) — the post card's rule for a pit whose
// body is a MarkdownBody (PostCard's fallback, …): a top-level mini stands
// `--pit-embrace` off the rim, pulled out of the published inset; the child
// chain never reaches a mini nested in another.
.element-card__pit > :deep(.markdown-body > p > .pathos-ref-embed) {
  margin: var(--pit-embrace, 4px) calc(var(--pit-embrace, 4px) - var(--quoted-bleed-x, 10px));
  max-width: calc(100% + 2 * (var(--quoted-bleed-x, 10px) - var(--pit-embrace, 4px)));
}
.element-card__pit > :deep(.markdown-body > p:first-child > .pathos-ref-embed:first-child) {
  margin-top: calc(var(--pit-embrace, 4px) - var(--pit-pad-y, 8px));
}
.element-card__pit > :deep(.markdown-body > p:last-child > .pathos-ref-embed:last-child) {
  margin-bottom: calc(var(--pit-embrace, 4px) - var(--pit-pad-y, 8px));
}

// A viewer-body (lane / grid / unravel / map) meets the pit's rim and
// scrolls itself; the pit keeps its floor and corner.
.element-card__pit--fit {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  > :deep(*) { min-height: 0; }
}
.element-card.is-fill > .element-card__pit {
  flex: 1 1 auto;
}

// THE HAIRLINE that closes the reading area — the card's one line ink.
.element-card__hairline {
  flex: 0 0 auto;
  height: 1px;
  min-width: 0;
  background: var(--grey-5, #bdbdbd);
}

// THE STOREY — the card's last floor (the inline comment maker).
.element-card__storey {
  margin: 0 var(--card-gutter, 4px) var(--card-gutter, 4px);
}
</style>
