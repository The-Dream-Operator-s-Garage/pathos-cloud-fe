<!--
  TALAVERA TOGGLE (2026-08-21, user ask) — a VERTICAL 3D toggle handle in the
  platform's own ceramic.

  Built for Talavero's board (the feed head box), where it stands at the right
  of the seat's bubble and opens the MANUAL workbench, but written as a shared
  control: v-model Boolean, a caption, a title, nothing feed-shaped in it.

  WHAT IT IS MADE OF, inside out:

    · the RAIL is a real `FriezeBarVertical` — the same 15px pixel-drawn
      talavera post the board's frame stands on (`--indigo-10` plaque under a
      `--brown-2` motif, mask at its natural 1px/column via
      `--frieze-bar-v-fit: 13px auto`, carve off), so the toggle's "talavera
      border" is the platform's actual ceramic material rather than an
      imitation of it. The rail is clipped by a rounded sleeve that also draws
      an inset channel shadow over it — the groove the handle rides in.
    · the KNOB is the porcelain: a warm glaze gradient over `--brown-1`, an
      `--indigo-9` rim (the indigo talavera border of the ask), a dot triplet
      painted in two indigos — the smallest talavera mark that survives 13px —
      and a cast shadow + top highlight, which is where the 3D lives. It
      OVERHANGS the rail 2px a side, the way a real switch handle grips over
      its slot.
    · the WORD is the caption at the toggle's LEFT (user ask: rotated 90°, a
      vertical display, so it never robs the bubble beside it of width) —
      `writing-mode: vertical-rl`, reading top to bottom like a book spine,
      THIN in the display face: weight 400 on a board whose every other mark
      is 700.

  THE GESTURE: down is ON. The knob rests at the TOP; pulling it down opens
  whatever the host mounts underneath (on the feed board, the manual band that
  appears directly below), so the handle ends up pointing at the thing it
  opened. The travel is a `top` transition between two lengths — the track
  stretches with its host band, so the distance is not a stated number.

  A `role="switch"` button: Space/Enter toggle it natively, `aria-checked`
  states it, and the caption is aria-hidden because the accessible name
  carries the same word.
-->
<template>
  <button
    type="button"
    class="tala-toggle"
    :class="{ 'is-on': modelValue }"
    role="switch"
    :aria-checked="modelValue ? 'true' : 'false'"
    :aria-label="label + (modelValue ? ' — on' : ' — off')"
    :title="title || label"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="tala-toggle__word" aria-hidden="true">{{ label }}</span>
    <span class="tala-toggle__track">
      <span class="tala-toggle__sleeve" aria-hidden="true">
        <FriezeBarVertical slim lip="right" class="tala-toggle__rail" />
      </span>
      <span class="tala-toggle__knob" aria-hidden="true" />
    </span>
  </button>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeBarVertical from 'src/components/layout/FriezeBarVertical.vue'

export default defineComponent({
  name: 'TalaveraToggle',
  components: { FriezeBarVertical },
  props: {
    modelValue: { type: Boolean, default: false },
    // The vertical caption. One short word — the track is exactly one word
    // tall on the bands this control is built for.
    label: { type: String, default: 'manual' },
    title: { type: String, default: '' }
  },
  emits: ['update:modelValue']
})
</script>

<style lang="scss" scoped>
.tala-toggle {
  // The knob's geometry, dialled once: the rail is the board posts' 15px
  // (1px border + 1px pad a side over an 11px mask layer — see
  // `FeedHeadBox.vue`'s `--fhead-post-w` for the pixel-grid argument), and
  // the knob overhangs it by `--tala-knob-lap` each side.
  --tala-rail-w: 15px;
  --tala-knob-lap: 2px;
  --tala-knob-h: 13px;
  display: flex;
  align-items: stretch;
  gap: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--indigo-5, #5c6bc0);
    outline-offset: 1px;
    border-radius: 3px;
  }
}

// THE WORD — thin nasalization, stood on end (user ask: rotated 90°, at the
// toggle's LEFT, so the caption spends HEIGHT the band already has instead of
// width the bubble needs). `vertical-rl` reads top-to-bottom with the glyph
// tops toward the rail, the book-spine direction. Weight 400 is the "thin":
// every other mark on the board this was built for is 700, so the caption
// reads as a whisper beside the handle.
//
// ⚠ THE INK IS THE WARM MARK, NOT THE LEGEND'S. The first pass wore the
// @tala arc's `--indigo-8` — and the toggle stands on the body's
// `--indigo-9` backdrop, where -8 is one step of nothing (measured
// invisible in the first screenshot). `--brown-1` is the board's stated
// answer for marks on its structural ink — the lane keys' glyphs, the
// header's writing — so the caption joins that family; hover and ON answer
// by waking to full strength, not by changing colour.
.tala-toggle__word {
  writing-mode: vertical-rl;
  align-self: center;
  font-family: var(--font-display);
  font-size: 7px;
  font-weight: 400;
  letter-spacing: 0.14em;
  line-height: 1;
  color: var(--brown-1, #efebe9);
  opacity: 0.75;
  user-select: none;
}

.tala-toggle:hover .tala-toggle__word,
.tala-toggle.is-on .tala-toggle__word {
  opacity: 1;
}

// THE TRACK — the positioning context. It stretches to whatever band the
// host puts the toggle in, which is what makes the knob's travel a pair of
// `top` values rather than a stated distance.
.tala-toggle__track {
  position: relative;
  flex: 0 0 var(--tala-rail-w);
  width: var(--tala-rail-w);
  align-self: stretch;
  min-height: calc(var(--tala-knob-h) * 2 + 6px); // room for two rests + air
}

// THE SLEEVE — clips the rail to the track's rounded corners and draws the
// channel over it. The inset shadow lives on an overlay (`::after`) rather
// than on the sleeve itself because an inset box-shadow paints UNDER
// children: the groove has to darken the ceramic, not hide beneath it.
.tala-toggle__sleeve {
  position: absolute;
  inset: 0;
  border-radius: 3px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }
}

// The rail — the board posts' exact recipe (see `.feed-head__post` in
// `FeedHeadBox.vue` for why each dial is what it is): the mask at its natural
// 1px/column so the full svg pattern draws stroke for stroke, the deep plaque
// under the warm motif, both wave layers ONE tone, and `--indigo-8` side rims
// the width pays for. The component brings `pointer-events: none` of its own,
// so the press always lands on the button.
.tala-toggle__rail {
  position: absolute;
  inset: 0;
  height: 100%;
  --frieze-bar-v-slim-w: var(--tala-rail-w);
  --frieze-bar-v-fit: 13px auto;
  --frieze-bar-v-carve: none;
  --frieze-bar-v-base: var(--indigo-10, #1a237e);
  --frieze-bar-v-wave-one: var(--brown-2, #d7ccc8);
  --frieze-bar-v-wave-two: var(--brown-2, #d7ccc8);
  --frieze-bar-v-edge-w: 1px;
  --frieze-bar-v-edge: var(--indigo-8, #303f9f);
  --frieze-bar-v-lip: var(--indigo-8, #303f9f);
}

// THE KNOB — the porcelain handle. Glaze: a top highlight rolling into
// `--brown-1` and settling on `--brown-2` at the foot, which is the light
// falling from above that every shadow on this platform already claims. The
// rim is `--indigo-9` — the indigo talavera border — and the face wears the
// dot triplet: a `--indigo-7` centre with two `--indigo-5` companions, the
// talavera motif at the smallest size that still reads as one.
// 3D is three statements together: the glaze gradient, the cast shadow
// below, and the hairline of white inset at the top edge.
.tala-toggle__knob {
  position: absolute;
  left: calc(-1 * var(--tala-knob-lap));
  width: calc(var(--tala-rail-w) + var(--tala-knob-lap) * 2);
  height: var(--tala-knob-h);
  top: 1px;
  border: 1px solid var(--indigo-9, #283593);
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    #fff 0%,
    var(--brown-1, #efebe9) 55%,
    var(--brown-2, #d7ccc8) 100%
  );
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  transition: top 0.18s ease, box-shadow 0.12s;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle 1.7px at 50% 50%, var(--indigo-7, #3949ab) 98%, transparent),
      radial-gradient(circle 1.1px at calc(50% - 5px) 50%, var(--indigo-5, #5c6bc0) 98%, transparent),
      radial-gradient(circle 1.1px at calc(50% + 5px) 50%, var(--indigo-5, #5c6bc0) 98%, transparent);
  }
}

// Held over: the handle lifts a little further off the rail — the same
// "loose" statement the head box makes when grabbed, at knob scale.
.tala-toggle:hover .tala-toggle__knob {
  box-shadow:
    0 3px 5px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

// ON = pulled DOWN, toward the thing it opened. Both rests are 1px off the
// track's end so the knob's rim never sits on the sleeve's curve.
.tala-toggle.is-on .tala-toggle__knob {
  top: calc(100% - var(--tala-knob-h) - 1px);
}

// The phone's board is a 20px-dense band — a 42px vertical word cannot stand
// in it, so the caption goes the way the seat's @tala handle goes there: out
// of the DOM's way entirely. The title still carries the name.
@media (max-width: 600px) {
  .tala-toggle__word {
    display: none;
  }
}
</style>
