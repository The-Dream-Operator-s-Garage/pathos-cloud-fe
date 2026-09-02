<template>
  <!-- The ONE stack/pins side-bar item — a single element that MUTATES with
       its host bar instead of two separate renders:

       · collapsed rail  → a flat Quasar button, rounded corners, the
         element's system color (kinds.js) on the outline + its system icon
         (inverts to a solid fill when it is the element you are viewing).
       · expanded panel  → an informative block (micro chip · title · created
         "x ago" · minimal author) with the SAME button on the right,
         palette-inverted (solid kind-color fill, grey-3 icon). The row for
         the element you are currently AT wraps block + button together in a
         kind-colored bubble (rounded rectangle, soft fill + colored rim).

       BOTH faces are exactly --side-item-h tall (2026-07-24, 7th pass): the
       row's text was compacted and the rail button grown until they met, so
       item N sits at the SAME vertical level in either presentation and the
       list unravels in place instead of re-flowing. The rail button keeps
       the column's width, so it reads as a rounded vertical key.

       Page-type steps (feed, explorers — no element behind them) fall back
       to a plain type icon in place of the micro chip and ink in place of a
       kind color. -->
  <q-btn
    v-if="collapsed"
    flat
    no-wrap
    class="side-item__btn side-item__btn--rail"
    :class="{ 'is-current': current, 'is-labelled': label }"
    :style="accentVars"
    @click="$emit('activate')"
  >
    <q-icon :name="displayIcon" size="15px" />
    <!-- The LABELLED rail face (2026-09-02, the stack's footer strip): the
         step's title lettered beside the glyph, ellipsized inside whatever
         width the host hands the tile (the stack's lane gives each of its
         three slots a third). Off by default — the pins column's 32px keys
         stay glyph-only. -->
    <span v-if="label" class="side-item__rail-title">{{ title }}</span>
    <q-tooltip anchor="center left" self="center right">{{ tooltip || title }}</q-tooltip>
  </q-btn>

  <div
    v-else
    class="side-item"
    :class="{ 'is-current': current }"
    :style="accentVars"
    @click="$emit('activate')"
  >
    <div class="side-item__info">
      <div class="side-item__head">
        <MicroChip
          v-if="meta.kind !== 'unknown'"
          class="side-item__chip"
          :kind="kind"
          :hash-str="hash"
          :display="display"
          icon-size="10px"
        />
        <q-icon v-else :name="displayIcon" size="12px" class="side-item__icon" />
        <span v-if="title" class="side-item__title">{{ title }}</span>
        <slot name="badges" />
      </div>
      <div v-if="when || author" class="side-item__meta">
        <span v-if="when" class="side-item__when mono">{{ when }}</span>
        <span v-if="author" class="side-item__author">by {{ author }}</span>
      </div>
    </div>

    <slot name="actions" />

    <!-- The collapsed button, still present but palette-inverted. Purely a
         face — the whole row is the click surface. -->
    <span class="side-item__btn side-item__btn--inverse">
      <q-icon :name="displayIcon" size="15px" />
    </span>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor } from 'src/utils/kinds'
import { timeAgo } from 'src/utils/time'
import MicroChip from 'src/components/shared/MicroChip.vue'

// '#9b6cb0' → 'rgba(155, 108, 176, a)' — the bubble's soft fill derives from
// the kind's hex accent without needing per-kind rgb tokens.
const softHex = (hex, alpha) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return null
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export default defineComponent({
  name: 'SidePanelItem',
  components: { MicroChip },
  props: {
    // Kind slug or prefix ('node' / 'nodes') — null/unknown for page steps.
    kind: { type: String, default: null },
    // Icon override for page steps with no element kind (typeIcon).
    icon: { type: String, default: null },
    hash: { type: String, default: '' },
    // Chip text in place of the hash (e.g. '#42' when only an id is known).
    display: { type: String, default: '' },
    title: { type: String, default: '' },
    // Creation timestamp for the "x ago" line (visit time for stack steps,
    // pin time for pins).
    time: { type: [Number, String, Date], default: null },
    // Minimal author line — a username, from the ref summary's `author`.
    author: { type: String, default: null },
    // Is this the element the user is currently viewing? Expanded → the
    // kind-colored bubble; collapsed → the solid inverted chip.
    current: { type: Boolean, default: false },
    // Which face to render: rail button (true) or informative row (false).
    collapsed: { type: Boolean, default: false },
    // Letter the TITLE on the rail face too (2026-09-02, user ask — the
    // footer stack strip "shows up to 3 elements", each a titled tile rather
    // than a bare glyph). Rail-face only; the expanded row always has it.
    label: { type: Boolean, default: false },
    tooltip: { type: String, default: '' }
  },
  emits: ['activate'],

  setup (props) {
    const meta = computed(() => kindFor(props.kind))
    const displayIcon = computed(() => props.icon || meta.value.icon)

    // Kind accent as CSS vars; unknown kinds leave them unset so the CSS
    // falls back to ink (page steps keep their old neutral look).
    const accentVars = computed(() => {
      const m = meta.value
      if (m.kind === 'unknown') return {}
      return {
        '--item-accent': m.color,
        '--item-accent-soft': softHex(m.color, 0.14)
      }
    })

    const when = computed(() => (props.time ? timeAgo(props.time) : null))

    return { meta, displayIcon, accentVars, when }
  }
})
</script>

<style lang="scss" scoped>
// ── The kind button — both faces wear it ──
// Flat Quasar face, rounded corners, system color on outline + icon over the
// grey-3 plaque (brown-1 until 2026-08-18's palette ask — one step lighter
// than the `--grey-4` well it sits in, exactly the lift brown-1 had over
// brown-2). `.is-current` (collapsed rail) and `--inverse` (expanded row)
// flip the palette: solid kind-color fill, grey-3 icon.
.side-item__btn {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  flex: 0 0 auto;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--item-accent, var(--ink));
  background: var(--grey-3);
  color: var(--item-accent, var(--ink));

  &.is-current,
  &--inverse {
    background: var(--item-accent, var(--ink));
    color: var(--grey-3);
  }

  // Collapsed (rail) face: the item IS this button, so it takes the shared
  // item height in full (--side-item-h) — that is what makes a parked chip
  // and the row it unravels into occupy the exact same band. Its width stays
  // narrower than its height: the parked column (--dock-rail-w) only clears
  // ~35px of well, and the chips keep a hair of padding either side of the
  // well's rim (2026-07-24 8th pass: 28 → 32px as the well's own side margins
  // tightened 3 → 2px, so the column reads snug instead of airy).
  &--rail {
    width: 32px;
    height: var(--side-item-h);
    min-width: 32px;
    min-height: var(--side-item-h);
  }

  // The LABELLED rail face (2026-09-02): a TILE, not a key — glyph at the
  // left, the title running right behind it and ellipsizing. Width is the
  // HOST'S to state (the stack's strip hands each of its three slots a third
  // of the lane via a `:deep` rule); this face only unfixes the 32px key
  // width and makes the button's content a nowrap row that can shrink
  // (QBtn's `.q-btn__content` is a flex row of its own — `min-width: 0` on
  // it is what lets the title ellipsize instead of pushing the tile wide).
  // `text-transform: none` because QBtn uppercases its content and a title
  // is a title, not a button label.
  &--rail.is-labelled {
    width: auto;
    min-width: 0;
    padding: 0 4px 0 3px;
    justify-content: flex-start;
    text-transform: none;

    :deep(.q-btn__content) {
      min-width: 0;
      flex-wrap: nowrap;
      justify-content: flex-start;
      gap: 3px;
    }
  }
}

// The tile's lettering: 10px at `line-height: 1`, the one size that reads
// inside a 17px tile and still leaves the glyph its 15px; ellipsis on the
// span itself so the glyph is never the thing that gets truncated (the
// flyout's name rule, one scale down).
.side-item__rail-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0;
}

// ── The expanded informative row ──
// Transparent by default over the `--grey-4` well; the CURRENT element's row
// becomes the kind-colored bubble: soft accent fill + accent rim, rounded
// rectangle wrapping the informative block and the inverted button together.
// Fixed at --side-item-h (the parked chip's height): the two text lines are
// compacted to fit inside it — head 18px + 1px gap + meta 9px = the 28px the
// box clears — so nothing here ever pushes the row off the shared rhythm.
// Spacing between items comes from the list's `gap` (never margins, which
// would collapse in the expanded block flow but not in the parked flex one).
.side-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--side-item-h);
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 3px 6px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  overflow: hidden;
  cursor: pointer;
  color: var(--ink);
  transition: background 0.12s, border-color 0.12s;

  &:hover { background: rgba(var(--ink-rgb), 0.08); }

  &.is-current {
    background: var(--item-accent-soft, rgba(var(--ink-rgb), 0.10));
    border-color: var(--item-accent, var(--ink));
  }
}

.side-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
}

.side-item__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 1;
}

.side-item__chip { flex: 0 0 auto; max-width: 110px; }
.side-item__icon { color: var(--ink); opacity: 0.85; flex-shrink: 0; }

.side-item__title {
  font-weight: 500;
  font-size: 0.82em;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Compacted to a single 9px band so the two lines clear the fixed row height.
.side-item__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.64em;
  line-height: 1;
  color: var(--ink-soft);
}

.side-item__when { white-space: nowrap; }

.side-item__author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
