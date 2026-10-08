<template>
  <!-- THE CARD CAP (2026-10-08, the card family) — the feed card's strip
       (`.post-square__cap`, 2026-08-07 → 2026-09-23 EVE), the same device
       for every kind:

         [kind marks] (origin clause…) [═══ name, centred ═══] │ act │ act │ act

       · the MARKS state what the element IS — the kind's glyph (kinds.js),
         plus whatever the kind adds (a node's type, a system label's
         `verified`, a schema's `schema`);
       · an ORIGIN CLAUSE names what it came out of — a word and the parent
         as its stock nano pill (`Comment on <chip> ::`, `Child of <chip>
         ::`, `Instance of <chip> ::`);
       · the NAME is the pit's own face in bold (the post's 2026-09-23 EVE2
         rule), a pill painted and cornered like the pit; it is a DOOR only
         when the host says so (`title-door`) — the feed's hash lens has no
         meaning off the feed, and an inert name must not look broken, so it
         is `aria-disabled`, never `disabled` (Quasar's global `[disabled]`
         fade);
       · the ACTS are the control lane — each in its own `--cap-cell`
         (32px), closed on both sides by a rule or the card's edge, the
         kind's own set (edit / lock / layout / share / pin / open…), the
         OPEN door last at the card's right edge by the post card's law. -->
  <div class="element-card__cap" :class="{ 'is-on': titleOn }">
    <div class="element-card__cap-main">
      <span class="element-card__cap-icons" :title="iconsTitle || null">
        <q-icon v-for="(ic, i) in shownIcons" :key="ic + i" :name="ic" size="13px" />
      </span>

      <span
        v-for="(o, i) in origins"
        :key="o.word + ':' + i"
        class="element-card__cap-origin"
      >
        <span class="element-card__cap-word">{{ o.word }}</span>
        <MicroChip
          class="element-card__cap-chip"
          :class="{ 'is-named': !!o.display }"
          :kind="o.kind"
          :id="o.id"
          :path="o.path || ''"
          :display="o.display || ''"
        />
        <span class="element-card__cap-sep">::</span>
      </span>

      <span class="element-card__cap-title">
        <button
          type="button"
          class="element-card__cap-title-chip"
          :class="{ 'is-on': titleOn }"
          :aria-disabled="titleDoor ? null : 'true'"
          :title="titleTip || title"
          @click.stop="onTitle"
        >
          <span class="element-card__cap-title-text" :class="titleClass">{{ title }}</span>
        </button>
      </span>
      <slot name="main-end" />
    </div>

    <template v-for="a in shownActs" :key="a.key">
      <span class="element-card__cap-rule" aria-hidden="true" />
      <div class="element-card__cap-cell">
        <button
          type="button"
          class="element-card__cap-act"
          :class="[{ 'is-on': !!a.on, 'is-busy': !!a.disabled }, 'element-card__cap-act--' + a.key, a.cls]"
          :title="a.title"
          :aria-label="a.title"
          :aria-disabled="a.disabled ? 'true' : null"
          @click.stop.prevent="press(a)"
        >
          <q-icon :name="a.icon" size="13px" />
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MicroChip from './MicroChip.vue'
import { kindFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'CardCap',
  components: { MicroChip },
  props: {
    kind: { type: String, required: true },
    // The kind marks; empty = the kind's own glyph.
    icons: { type: Array, default: () => [] },
    iconsTitle: { type: String, default: '' },
    // [{ word, kind, id, path, display }] — "word <chip> ::" clauses.
    origins: { type: Array, default: () => [] },
    title: { type: String, default: '' },
    titleTip: { type: String, default: '' },
    titleOn: { type: Boolean, default: false },
    titleDoor: { type: Boolean, default: false },
    titleClass: { type: [String, Array, Object], default: null },
    // [{ key, icon, title, on, onClick, disabled, hidden, cls }]
    acts: { type: Array, default: () => [] }
  },
  emits: ['title'],
  setup (props, { emit }) {
    const meta = computed(() => kindFor(props.kind))
    const shownIcons = computed(() => (props.icons.length ? props.icons : [meta.value.icon]))
    const shownActs = computed(() => props.acts.filter((a) => a && !a.hidden))
    const onTitle = () => { if (props.titleDoor) emit('title') }
    const press = (a) => { if (!a.disabled && a.onClick) a.onClick() }
    return { shownIcons, shownActs, onTitle, press }
  }
})
</script>

<style lang="scss" scoped>
// `.post-square__cap` and its cells, verbatim (FeedStream, 2026-09-23 PM).
.element-card__cap {
  --cap-cell: 32px;
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: calc(var(--cap-scale, 0.62) * 1em);
  letter-spacing: 0.02em;
  color: var(--grey-9, #424242);
  border-bottom: 2px solid var(--grey-6, #9e9e9e);
}
.element-card__cap-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px 2px 1px var(--card-gutter, 4px);
  overflow: hidden;
  white-space: nowrap;
}
.element-card__cap-cell {
  flex: 0 0 var(--cap-cell);
  width: var(--cap-cell);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 0;
}
.element-card__cap-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--grey-8, #424242);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: rgba(var(--ink-rgb), 0.08);
    color: var(--grey-9, #424242);
  }
  &.is-on { color: var(--accent, #c79a00); }
  &.is-busy { opacity: 0.5; cursor: default; }
}
.element-card__cap-rule {
  flex: 0 0 1px;
  width: 1px;
  background: var(--grey-5, #bdbdbd);
}
.element-card__cap-icons {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: var(--grey-8, #424242);
}
.element-card__cap.is-on .element-card__cap-icons { color: var(--accent, #c79a00); }
.element-card__cap-origin {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}
.element-card__cap-word {
  flex: 0 0 auto;
  opacity: 0.72;
}
.element-card__cap-chip {
  flex: 0 1 auto;
  min-width: 7ch;
  max-width: 13ch;
  &.is-named {
    max-width: 100%;
    :deep(.micro-chip__hash) { min-width: 0; }
  }
}
.element-card__cap-sep {
  flex: 0 0 auto;
  opacity: 0.45;
}
.element-card__cap-title {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
}
// THE NAME PILL — the pit's face, bold, in the pit's paint and corner.
.element-card__cap-title-chip {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 18px;
  margin: 0;
  font: inherit;
  font-family: var(--font-body, 'Inter', 'Helvetica Neue', system-ui, sans-serif);
  font-size: calc(var(--cap-title-scale, 0.8) / var(--cap-scale, 0.62) * 1em);
  font-weight: 700;
  letter-spacing: normal;
  line-height: 16px;
  color: var(--ink, #2C3D4E);
  padding: 0 4px;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--pit-r, 6.34px);
  background: var(--pit-coat, var(--grey-1, #fafafa));
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.12s;
  &:hover:not([aria-disabled='true']) { border-color: var(--grey-7, #757575); }
  &[aria-disabled='true'] { cursor: default; }
}
.element-card__cap-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
