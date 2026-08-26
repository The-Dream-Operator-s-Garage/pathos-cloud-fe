<!--
  TALAVERA TOGGLE (2026-08-21, user ask) — a VERTICAL 3D toggle handle in the
  platform's own ceramic.

  Built for Talavero's board (the feed head box), where it stands at the right
  of the seat's bubble and opens the MANUAL workbench, but written as a shared
  control: v-model Boolean, a caption, a title, nothing feed-shaped in it.

  WHAT IT IS MADE OF, inside out:

    · the BAR is a plain `--indigo-9` channel with STADIUM ends — round top,
      round bottom — and an inset groove shade over it. It carried a real
      `FriezeBarVertical` until 2026-08-22 (the board's own ceramic post,
      mask and all); the ask took the frieze off so the pattern would stop
      competing with the handle at 19px. All the ceramic is in the knob now.
    · the KNOB is a GLAZED TALAVERA BOSS, round, in the indigo family: a
      convex ring lit from the top-left, a concave well sunk in it whose
      gradient runs the OTHER way, a deep centre hole and one specular
      glint — the raised bosses of a cobalt talavera tile, which is the
      reference the ask supplied. It OVERHANGS the bar 2px a side, the way a
      real switch handle grips over its slot, and being a circle its
      diameter IS that overhung width.
    · the WORD is the caption at the toggle's RIGHT (2026-08-22; it stood at
      the LEFT from the day it was built) — rotated 90° so it never robs the
      bubble beside it of width, `writing-mode: vertical-rl`, reading top to
      bottom like a book spine, THIN in the display face: weight 400 on a
      board whose every other mark is 700.

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
      <span class="tala-toggle__sleeve" aria-hidden="true" />
      <span class="tala-toggle__knob" aria-hidden="true" />
    </span>
  </button>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TalaveraToggle',
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
  // ── THE KNOB IS A CIRCLE SINCE 2026-08-22 (user ask: "para el control,
  // házlo redondo, tratando de imitar el efecto de la imágen proveída,
  // usando la familia de colores indigo") ──────────────────────────────────
  // Which makes the geometry one number instead of three: a circle's height
  // IS its width, and its width was already fixed by the rail plus its two
  // overhangs. So `--tala-knob-h` stops being a free dial and becomes the
  // derived diameter — 15 + 2 + 2 = 19px. It is still stated rather than
  // computed inline because the track's `min-height` and both rests read it.
  // ⚠ Change `--tala-rail-w` or `--tala-knob-lap` and this must follow, or
  // the knob stops being round.
  // ── THINNER SINCE 2026-08-22 (user ask: "haz el switch de control manual
  // y su bolita un poquito más delgado") — rail 15 → 12, knob 19 → 16 ──────
  // Both move TOGETHER and they have to: the knob is a circle whose diameter
  // is the rail plus its two overhangs, so thinning the bar without thinning
  // the knob would only fatten the grip. The lap is left at 2px, which is
  // what keeps the handle reading as gripping OVER its slot rather than
  // sitting in it — at 12px of rail that overhang is now a third of the
  // knob's width instead of a quarter, and the grip reads more, not less.
  // ⚠ The rail was 15px because it used to BE a board post (the frieze it
  // carried needed the pixel grid). The frieze is gone, so that constraint
  // is gone with it and the width is free — it answers to the handle now.
  --tala-rail-w: 12px;
  --tala-knob-lap: 2px;
  --tala-knob-h: 16px;
  display: flex;
  // ── THE WORD MOVED TO THE RIGHT (2026-08-22, user ask: "intercambia la
  // posición de la barrita del toggle y del texto para que el texto quede a
  // la derecha y el toggle control a la izquierda") ─────────────────────────
  // `row-reverse` rather than reordering the template: the DOM keeps reading
  // caption-then-control, which is the order the accessible name and the
  // `role="switch"` want, and only the paint order flips.
  flex-direction: row-reverse;
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
  // ⚠ `knob + 10`, NOT `knob × 2 + 6` (2026-08-22). The old floor reserved a
  // full second knob of travel; with the knob now 19px round that came to
  // 44px, and the board's talk band was compressed to ~43 in the same day's
  // asks — so the toggle would have been the one object forcing the row back
  // open. The floor's job is only to guarantee the handle can MOVE, and 10px
  // of travel says that plainly. The real height still comes from the host
  // band via `align-self: stretch`.
  min-height: calc(var(--tala-knob-h) + 10px);
}

// ── THE BAR (2026-08-22, user ask: "En la barra del toggle con frisos, en
// lugar de los frisos, haz la barra indigo-9 y redondea la parte de arriba y
// de abajo de la barra") ────────────────────────────────────────────────────
// The frieze is GONE. The rail used to be a real `FriezeBarVertical` — the
// board's actual ceramic post, mask and all — and the argument for it was
// that the toggle should be made of the platform's material rather than an
// imitation of it. What the ask observes is that at this size the material
// was competing with the handle: a 15px strip of talavera pattern under a
// ceramic knob is two talavera objects in the same 19px, and the one that
// matters is the one you grab. So the bar becomes a plain `--indigo-9`
// channel — the board's own structural ink, the tone its walls and rules are
// drawn in — and ALL of the ceramic moves to the knob.
//
// STADIUM ENDS: `border-radius: 999px` caps the bar with two semicircles of
// its own width. That is the ask's "redondea la parte de arriba y de abajo",
// and it is also what makes the round knob look at home — a circle riding in
// a slot with square ends reads as a peg in a trench; in a stadium it reads
// as a handle in a channel cut to fit it.
//
// The channel shade stays on the `::after` overlay rather than on the sleeve
// itself, and the reason is unchanged and worth keeping: an inset box-shadow
// paints UNDER an element's children, so a groove declared on the sleeve
// would hide beneath anything drawn inside it. (Now that the sleeve is empty
// the two would render alike — but the note is the trap, not the symptom,
// and `FeedHeadBox`'s bubble hit the same one from the other side.)
.tala-toggle__sleeve {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  // ── `--indigo-10`, ONE STEP DARKER (2026-08-22, user ask: "el color de
  // fondo de la barra un tono de indigo más oscuro") ────────────────────────
  // The bar leaves the board's structural ink for the step below it, which is
  // the same move the head box's two frieze posts made on 2026-08-08 and for
  // the same reason: the channel is FRAME, not interior, and the frame is
  // allowed to be the deepest thing on the surface. It also opens the knob's
  // contrast — the ring is `--indigo-6`, now four steps up from its ground
  // instead of three, which is what pays for the cast shadow the asks
  // removed.
  background: var(--indigo-10, #1a237e);
  // ── A RIM INSTEAD OF A GROOVE (2026-08-22, user ask: "arregla el
  // contenedor de la bolita quitándole la sombra interna y poniéndole bordes
  // indigo-5") ─────────────────────────────────────────────────────────────
  // The channel's two inset shadows are GONE and a 1px `--indigo-5` line
  // takes their place. The shadows were painting a groove into a bar that is
  // the same tone as the body behind it, so what they actually read as was a
  // dark smear at each end of the stadium — depth with nothing to be deep
  // against. A line states the bar's shape outright, and at `--indigo-5` it
  // is the SAME tone the talk room and the chat bubble were rimmed in the
  // same day: the board now draws every one of its containers in one hand.
  // ⚠ That makes three rules bound to one tone across two files. Move it in
  // one and the control stops belonging to the board it stands on.
  //
  // ── `--indigo-6`, ONE STEP DARKER, in a follow-up the same day (user ask:
  // "haz los bordes de la barrita del toggle un tono de indigo más oscuro")
  // It landed on `--indigo-5` first, to put the channel in the same hand as
  // the talk room and the chat bubble, which took that tone in the asks just
  // before. ⚠ THAT PAIRING IS DELIBERATELY BROKEN NOW, and the reason is the
  // GROUND: the room and the bubble are rims on WARM `--brown-1` faces, where
  // -5 is a clear line; this rim is on `--indigo-9`, four steps from it, where
  // the same tone shouted. **A rim's tone answers to what it is drawn ON, not
  // to what it is drawn BESIDE.**
  border: 1px solid var(--indigo-6, #3f51b5);
  overflow: hidden;
}

// ── THE KNOB — A GLAZED TALAVERA BOSS (2026-08-22, user ask: "házlo redondo,
// tratando de imitar el efecto de la imágen proveída, usando la familia de
// colores indigo") ──────────────────────────────────────────────────────────
// The reference is a cobalt talavera tile: raised circular bosses, each one a
// glossy annular RING with a recessed well sunk in its middle and a deep hole
// at the centre. That shape is three concentric zones, and the whole knob is
// built as three, one per layer, because the effect is not a texture — it is
// a section through a turned object and every zone has to light differently:
//
//   the element  the RING. Convex, so it lights from the TOP-LEFT: an
//                `--indigo-2` crest rolling down through -5 to `--indigo-10`
//                where the form turns away at the lower right. Rimmed
//                `--indigo-10` and cast below, which is what puts it above
//                the bar rather than printed on it.
//   ::before     the WELL. Concave, so its gradient RUNS THE OTHER WAY —
//                deep at the top, lit at the foot. That inversion is the
//                whole trick: same palette, opposite direction, and the eye
//                reads one surface going in where the other comes out. An
//                inset shadow under the well's top lip finishes the dip.
//   ::after      the HOLE and the GLINT. A 3px `--indigo-10` centre, plus the
//                specular — a small white ellipse up and left, on the ring's
//                crest, which is the one mark that says "glazed" rather than
//                "matte". It is a separate layer from the crest gradient so
//                it can sit ABOVE the well without being clipped by it.
//
// ⚠ THE OLD KNOB WAS WARM AND THIS ONE IS NOT. It was `--brown-1`/`-2`
// porcelain with an indigo dot triplet — the board's ceramic in its warm
// half. The ask moves the whole object into the indigos, which is also what
// lets it stand on the new `--indigo-9` bar: a warm knob on that bar would
// have been the only warm thing left in the control, now that the frieze's
// `--brown-2` motif is gone with the rail.
// ⚠ ROUND MEANS ROUND: `--tala-knob-h` is the DIAMETER and must equal
// `--tala-rail-w + 2 × --tala-knob-lap`. See the dials at the top.
.tala-toggle__knob {
  position: absolute;
  left: calc(-1 * var(--tala-knob-lap));
  width: calc(var(--tala-rail-w) + var(--tala-knob-lap) * 2);
  height: var(--tala-knob-h);
  top: 1px;
  border-radius: 50%;
  // ── THE KNOB'S RIM IS THE BAR'S RIM (2026-08-22, user ask: "haz los bordes
  // de la bolita del mismo tono que el color del borde de la barra, sobre la
  // que está la bolita") ────────────────────────────────────────────────────
  // `--indigo-6`, from -10, so handle and channel are OUTLINED IN ONE TONE —
  // the two halves of one control drawn by one line rather than a pale disc
  // rimmed dark sitting in a bar rimmed light. ⚠ It is also the ring's own
  // fill, so the rim draws nothing where it meets the ring; that is the
  // point, not an oversight — what states the knob now is the tone step
  // against the bar (-6 on -10, four steps) and the well inside it.
  // ⚠ BOUND to the sleeve's `border` below. Move one, move both.
  border: 1px solid var(--indigo-6, #3f51b5);
  // ── FLAT SINCE 2026-08-22 (user ask: "quita el efecto brillante de la
  // bolita del switch. Es más brillante arriba que abajo") ─────────────────
  // The radial gradient is gone and the ring is ONE tone. The note below
  // drew a line between FORM (a gradient) and FINISH (a specular) and kept
  // the form when the gloss went; this ask takes the form too, and names
  // exactly why — the light was directional, so the knob read as brighter at
  // the top, which at 16px is not modelling, it is a smudge. What is left is
  // the reading the reference tile actually has at a distance: flat glazed
  // rings in one blue, told apart by TONE STEP alone.
  // ⚠ So the only depth left on this control is the CAST SHADOW below the
  // knob, which is what still separates handle from channel. Do not remove
  // that as well, or the knob becomes a painted dot.
  background: var(--indigo-6, #3f51b5);
  // ── AND FLAT ON THE BAR: NO CAST SHADOW EITHER (2026-08-22, user ask:
  // "remueve el efecto de sombra de la bolita del switch encima de la
  // barrita del switch") ───────────────────────────────────────────────────
  // The last of the 3D goes. This control was built as three statements —
  // glaze gradient, cast shadow, white top lip — and four asks in one day
  // removed them one at a time, in that order of obviousness: the specular,
  // then the lip, then the ring's own gradient, and now the shadow the knob
  // threw onto its channel. What is left is DRAWING: flat concentric rings
  // in three indigo steps (-6 ring, -8 well, -9 bar) told apart by tone
  // alone, which is how the reference tile actually reads at a distance and
  // how every other mark on this board is made.
  // ⚠ So NOTHING states depth on this control any more. The knob is found by
  // its two tone steps and by the bar's `--indigo-6` rim, and that is the
  // whole budget — if it ever stops reading as a handle, the dial is the
  // ring's tone (away from -9), not a shadow coming back.
  // ⚠ `box-shadow` is out of the transition with it; only `top` animates.
  transition: top 0.18s ease;

  // The WELL — concave, so the light is INVERTED against the ring above.
  &::before {
    content: '';
    position: absolute;
    // 20%, from 26% (2026-08-22, user ask: "para los círculos internos de la
    // bolita, házlos un poquito mas grandes"). The well is now a little over
    // half the boss's diameter, which is nearer the reference tile: on it the
    // ring is a narrow lip around a wide well, not a wide dome with a dimple.
    inset: 20%;
    border-radius: 50%;
    // Flat too, and for the same reason — its gradient was the ring's run
    // BACKWARDS (lit at the foot), which is exactly the "brighter here than
    // there" the ask objects to, just inverted. One step darker than the
    // ring is all the well needs to read as sunk.
    background: var(--indigo-8, #303f9f);
    // The dark lip stays (a recess, not a shine); the white one is gone with
    // the rest of the highlights.
    box-shadow: inset 0 1px 1.5px rgba(0, 0, 0, 0.45);
  }

  // ⚠ NO `::after` — the boss is TWO zones now, not three. It carried the
  // specular glint (removed with the gloss) and then the deep centre hole
  // alone, which this ask removed too ("remueve la bolita más oscura que
  // está en el centro"). Three concentric tones at 16px was one more than
  // the size could hold: ring, well and hole came to ~2px apiece and read as
  // a target rather than as a turned boss. Two zones is the same drawing at
  // a legible scale, and the layer is left documented rather than deleted
  // silently because "add a centre" is the obvious next idea and this is the
  // record of it having been tried at both 1.5px and 2.2px.
}

// Held over: the ring wakes one step toward the light. It USED TO lift on a
// deepened cast shadow — the "loose" statement the head box makes when
// grabbed, at knob scale — but the shadow is gone (see the knob's rule), and
// a hover state that restored it would put back exactly what the ask removed.
// A tone step is the same message in this control's own language.
.tala-toggle:hover .tala-toggle__knob {
  background: var(--indigo-5, #5c6bc0);
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
