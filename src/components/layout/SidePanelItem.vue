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
    class="side-item__btn side-item__btn--rail"
    :class="{ 'is-current': current, 'is-labelled': lettered }"
    :style="accentVars"
    @click="$emit('activate')"
  >
    <q-icon :name="displayIcon" :size="railIconSize" />
    <!-- THE LETTERED FACE — TWO LINES since 2026-09-06 (user ask: "enrich
         the larger one by displaying the item title/number in one line and
         then the last sub-item of the last action taken on another smaller
         line"). Line one is the stop: title · hash. Line two is its
         SUB-STACK's newest entry — the action's own glyph and past-tense
         label out of `utils/navActions.js` — so the wide tile answers
         "where am I" and "what did I last do here" at once.
         It was ONE line, glyph · title · hash, from 2026-09-03 to that ask.
         A stop with an empty sub-stack renders line one alone and stays
         vertically centred: an absent second line must read as nothing to
         report, never as a blank waiting to be filled. -->
    <span v-if="lettered" class="side-item__rail-lines">
      <span class="side-item__rail-line">
        <span class="side-item__rail-title">{{ title }}</span>
        <span v-if="railHash" class="side-item__rail-hash mono">{{ railHash }}</span>
      </span>
      <span v-if="subLabel" class="side-item__rail-line side-item__rail-line--sub">
        <q-icon v-if="subIcon" :name="subIcon" size="9px" class="side-item__rail-sub-icon" />
        <span class="side-item__rail-sub">{{ subLabel }}</span>
      </span>
    </span>
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
    // The rail face's glyph size — 15px in the stack's 70px tiles; the pins
    // strip's 20×17 pills pass 12px (2026-09-03, "almost circular … making
    // sure the icon looks good, even if it is smaller").
    railIconSize: { type: String, default: '15px' },
    // The stack strip's ask (2026-09-03): the CURRENT item's rail face goes
    // WIDE and lettered — glyph · title · hash — while its siblings stay
    // glyph pills. Off by default (the pins strip keeps every tile a pill).
    wideCurrent: { type: Boolean, default: false },
    // The wide face's SECOND LINE (2026-09-06) — the newest entry in this
    // item's sub-stack, already resolved by the host through
    // `utils/navActions.js` (this component stays a renderer and never
    // learns the action vocabulary). Both empty ⇒ the tile is one line.
    subLabel: { type: String, default: '' },
    subIcon: { type: String, default: '' },
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
    // (A `label` prop lettering the title on the rail face too existed for
    // ONE deploy on 2026-09-02 — the stack's footer tiles — and was removed
    // the same day: "the text overlaps … just display the icon". The rail
    // face is glyph-only, in every host; the width of its seat is the host's.)
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

    const lettered = computed(() => props.collapsed && props.current && props.wideCurrent)
    const railHash = computed(() => props.display || (props.hash ? props.hash.slice(0, 8) : ''))

    return { meta, displayIcon, accentVars, when, lettered, railHash }
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
// `--side-item-face` (2026-09-03) — the tile's FACE as a dial: its fill on
// the plain face, its GLYPH ink once the kind color fills the current tile.
// `--grey-3` unless the host says otherwise; the PARKED stack + pins strips
// point it at `--strip-ink` (light-cream).
// ⭐ `--side-item-rim` (2026-09-06, user ask: "ad a thin grey-6 border to the
// items of both the [pins] and the stack bars. Make sure both item's style and
// color are consistent, being the base color light-cream") — the tile's LINE
// as its own dial, falling back to the kind accent so every host that does not
// set it keeps exactly the face it had. The two parked strips point it at
// `--grey-6`: with the lane back on `--grey-4`, a kind-coloured rim competed
// with the lane's own `--grey-6` line and made the two strips' items differ
// tile by tile. THE KIND COLOUR DID NOT LEAVE — it holds the GLYPH on the
// plain face and the FILL on the current one, which is where it reads
// loudest; what it gave up is the structural line, which is a job for one ink.
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
  border: 1px solid var(--side-item-rim, var(--item-accent, var(--ink)));
  background: var(--side-item-face, var(--grey-3));
  color: var(--item-accent, var(--ink));

  &.is-current,
  &--inverse {
    background: var(--item-accent, var(--ink));
    color: var(--side-item-face, var(--grey-3));
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

  // THE LETTERED FACE (2026-09-03, user ask: "one of them should be a wide
  // version where the current place you're in, the last item information is
  // displayed gracefully (the node title and the hash, for example)"). Quasar
  // CENTRES and WRAPS `.q-btn__content`; both are undone here — the 09-02
  // face that "overlapped" was a title in a 70px glyph tile with the wrap
  // still on. The host sizes the tile; this rule only lays the row.
  &--rail.is-labelled :deep(.q-btn__content) {
    flex-wrap: nowrap;
    justify-content: flex-start;
    min-width: 0;
    gap: 4px;
  }

  // ⚠ The rail face is GLYPH-ONLY. A labelled variant (`.is-labelled` +
  // `.side-item__rail-title`, glyph + ellipsized title) lived here for one
  // deploy on 2026-09-02 for the stack's footer tiles and was removed the
  // same day — "the text overlaps … just display the icon". A host that
  // wants a wider seat states the WIDTH (the stack's strip gives each of
  // its three slots a third of the lane) and the glyph centres in it.
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
// THE TWO-LINE COLUMN (2026-09-06). The rail face is `--side-item-h` tall
// and the strip's is 17px, so the pair has to fit inside it EXACTLY: 9px +
// 1px gap + 7px = 17. Both lines are `line-height: 1` for that reason —
// any leading at all and the second line pushes the first off its centre,
// which reads as the tile having drifted rather than as text having grown.
.side-item__rail-lines {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.side-item__rail-line {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  line-height: 1;

  // The sub line is the QUIETER of the two — same ink, less of it. It is a
  // log entry under a name, and a second line at full strength would read
  // as a second title.
  &--sub { opacity: 0.78; }
}

.side-item__rail-title {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: none;
}

.side-item__rail-hash {
  flex: 0 0 auto;
  font-size: 8px;
  line-height: 1;
  opacity: 0.8;
  text-transform: none;
}

.side-item__rail-sub-icon { flex: 0 0 auto; }

.side-item__rail-sub {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 8px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  text-transform: none;
}
</style>
