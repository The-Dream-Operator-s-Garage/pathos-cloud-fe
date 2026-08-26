<template>
  <div class="maker-header" :class="{ 'is-compact': compact, 'is-dense': dense }">

    <!-- ⭐ THREE LABELLED ROWS, ONE CONTROL EACH (2026-08-26, user ask:
         "put them tiny labels and make them be both in their own row instead
         of having entity and label input together").

         It was ONE flex-WRAP row — `title | author | labels` side by side,
         breaking to two lines when the editor column squeezed — and the two
         pickers shared it captionless, because three captions on one line
         cost more height than the controls did. Each control owning a row
         pays that back: the caption goes to the LEFT, in the width the
         stacking just freed, so the meta block reads as a form (label ┃
         field, three times) instead of as a toolbar, and every field is now
         full-width no matter how narrow the dock gets. The wrap logic goes
         with it — there is nothing left to wrap.

         The captions are the header's own, NOT the pickers' (`compact` still
         suppresses those): one column, one type register, one alignment for
         all three, which a caption living inside each child cannot give. -->
    <div v-if="hasTitle" class="header-row">
      <span class="row-label">Title</span>
      <div class="row-field"><slot name="title" /></div>
    </div>

    <div class="header-row">
      <span class="row-label">Publishing as</span>
      <div class="row-field">
        <AuthorPicker
          v-model="localAuthorId"
          :compact="compact || dense"
          @options-loaded="onAuthorablesLoaded"
        />
      </div>
    </div>

    <div class="header-row">
      <span class="row-label">Labels</span>
      <div class="row-field">
        <LabelPicker
          :exclude-ids="userLabelIds"
          :compact="compact || dense"
          @picked="onLabelPicked"
        />
      </div>
    </div>

    <!-- Label box below -->
    <LabelBox
      :author="selectedAuthor"
      :canonic-labels="canonicLabels"
      :user-labels="userLabels"
      :target-kind="targetKind"
      :compact="compact || dense"
      @remove-label="removeLabel"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import AuthorPicker from './AuthorPicker.vue'
import LabelPicker from './LabelPicker.vue'
import LabelBox from './LabelBox.vue'

export default defineComponent({
  name: 'MakerHeader',
  components: { AuthorPicker, LabelPicker, LabelBox },

  props: {
    // The maker's selected node type id (used to derive the canonic NODE > {type} chip)
    typeId: { type: Number, default: 1 },
    // Which kind of thing this is for (for the LabelBox header text)
    targetKind: { type: String, default: 'node' },
    // Canonic labels the backend will auto-attach (display-only).
    // Shape: [{ id, name, ancestor_id, ancestorName, ... }]
    canonicLabels: { type: Array, default: () => [] },
    // Compact density (smaller fonts, tighter gaps) for inline reply forms
    compact: { type: Boolean, default: false },
    // Dense dock density (change request #675): captionless pickers +
    // compact label box on a single control row, without the embed's
    // shrunken type — the dock keeps readable controls, just less chrome.
    dense: { type: Boolean, default: false },
    // Restore-state seeds for reopened drafts (MakerDock keys this component
    // by draft id, so a tab switch remounts with the draft's saved values).
    initialAuthorId: { type: Number, default: null },
    initialLabels: { type: Array, default: () => [] }
  },

  emits: ['update:authorEntityId', 'update:labelIds', 'update:userLabels'],

  setup (props, { emit, slots }) {
    const hasTitle = computed(() => !!slots.title)
    const localAuthorId = ref(props.initialAuthorId)
    const authorables = ref([])
    const userLabels = ref([...props.initialLabels]) // [{ id, name, parent_name, path, ... }]
    const userLabelIds = computed(() => userLabels.value.map(l => l.id))

    const selectedAuthor = computed(() =>
      authorables.value.find(a => a.id === localAuthorId.value) || null
    )

    const onAuthorablesLoaded = (opts) => { authorables.value = opts }

    const onLabelPicked = (leaf) => {
      if (userLabelIds.value.includes(leaf.id)) return
      userLabels.value.push(leaf)
    }

    const removeLabel = (id) => {
      userLabels.value = userLabels.value.filter(l => l.id !== id)
    }

    watch(localAuthorId, (v) => emit('update:authorEntityId', v), { immediate: true })
    watch(userLabelIds, (ids) => {
      emit('update:labelIds', ids)
      emit('update:userLabels', [...userLabels.value])
    })

    return {
      hasTitle,
      localAuthorId,
      userLabels,
      userLabelIds,
      selectedAuthor,
      onAuthorablesLoaded,
      onLabelPicked,
      removeLabel
    }
  }
})
</script>

<style lang="scss" scoped>
.maker-header {
  // The label column's width, as a dial: three captions have to share ONE
  // left edge or the fields below each other stop lining up, and the widest
  // caption ("Publishing as") is what sets it.
  --row-label-w: 78px;

  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

// ── One row: tiny caption ┃ full-width field ──
.header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

// TINY (2026-08-26, user ask) — one register under the platform's section
// label (`.ref-browser__section-label`, 0.7em/0.06em) and lettered in the
// FIELD'S OWN RIM TONE rather than in ink: the caption belongs to the box it
// names, and at this size a full-ink word out-weighs the value inside the
// field. Right-aligned so the three captions end on the fields' shared left
// edge — a ragged right between a label and its box reads as a gap.
.row-label {
  flex: 0 0 var(--row-label-w);
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.6em;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--maker-contrast);
  user-select: none;
}

.row-field {
  flex: 1 1 auto;
  min-width: 0;
}

// ── THE FIELD AESTHETIC (2026-08-26, user ask) ──────────────────────────
//
// "More rounded, way denser, blue-grey-1 background, thick blue-grey-6
// borders and icons" — asked of the title input, then of the other two so
// all three match. Stated ONCE here rather than three times in three
// components, and it reaches all three for a reason worth writing down:
// `:deep()` anchors on THIS component's own element (`.row-field`), so it
// applies to the pickers' q-selects (child components) AND to the title
// input (SLOTTED content, which carries PostMakerSurface's scope id, not
// ours — the anchor is what makes that work).
//
// The four Quasar dials being turned, each of which fights back if missed:
//   · `.q-field__control` — the box. Quasar's dense outlined control is 40px
//     because a floating label has to have somewhere to float; the title
//     input dropped its label for a placeholder in the same ask, so 26px is
//     free. `border-radius` here does NOT reach the border: the outline is
//     drawn by `:before`, which needs `border-radius: inherit` or the box
//     rounds and its rim stays square.
//   · `:before` — the RIM. 2px solid `--blue-grey-6` ("thick"), replacing
//     Quasar's 1px `rgba(0,0,0,.24)`.
//   · `:after` — the FOCUS ring, `--q-primary` (the window's
//     `--blue-grey-8`). Same `inherit`, same reason.
//   · `.q-field__marginal` — the append/prepend cell, 40px tall in dense and
//     the thing that silently keeps a 26px control 40px tall if it is left
//     alone.
.row-field :deep(.q-field--outlined) {
  .q-field__control {
    height: 26px;
    min-height: 26px;
    padding: 0 4px 0 10px;
    border-radius: 13px;
    // `--maker-pale`, not `--blue-grey-1` (2026-08-26, the uploader repaint):
    // this header is worn by two colorways now, and a shared component reads
    // DIALS — the maker leaves the default, `.uploader-dock` turns it teal.
    background: var(--maker-pale);

    &::before {
      border: 2px solid var(--maker-contrast);
      border-radius: inherit;
    }
    &::after { border-radius: inherit; }
  }

  &:hover .q-field__control::before { border-color: var(--maker-deep); }  // the deep step: a hover has to read as MORE than the resting rim (a dial since the uploader repaint, same reason as the fill)

  // ⚠ `min-height: 0` COLLAPSES A `use-input` FIELD TO NOTHING. Quasar sizes
  // these two off `min-height` (24px in dense), and the LabelPicker's real
  // `<input>` — the one carrying the "Search labels…" placeholder — has no
  // intrinsic height to fall back on inside a content-sized flex row: zeroing
  // it measured `height: 0` and the labels row rendered as an empty box. The
  // number is the control's INTERIOR: 26px less the 2px rims, top and bottom.
  .q-field__native,
  .q-field__input {
    padding: 0;
    min-height: 22px;
    line-height: 1.2;
    color: var(--ink);
  }

  .q-field__marginal { height: 26px; }

  // THICK ICONS — the dropdown arrows and the pickers' kind glyph.
  //
  // Two mechanisms, because this row draws from two icon fonts and only one
  // of them has a weight axis. `font-variation-settings: 'wght'` is real on
  // Material SYMBOLS and inert on the Material ICONS ligatures (`person`,
  // `arrow_drop_down`) these controls actually use — so the thickening that
  // does the work here is `-webkit-text-stroke`, which strokes the glyph
  // outline in its own colour and fattens ANY icon font, variable or not.
  // 0.4px is the step that reads heavier without closing the counters in
  // `arrow_drop_down`.
  //
  // ⚠ The size is NOT a dial for every icon in the row: `q-icon` writes its
  // `size` prop as an INLINE font-size, which beats this rule. 18px lands on
  // the dropdown arrows (Quasar renders those unsized, 24px by default);
  // AuthorPicker's kind glyph carries `size="15px"` in its own template and
  // has to be changed there.
  .q-icon {
    color: var(--maker-contrast);
    font-size: 18px;
    font-variation-settings: 'wght' 700;
    -webkit-text-stroke: 0.4px currentColor;
  }
}

// The value's own type, one step down with the box.
.row-field :deep(.q-field__native > span),
.row-field :deep(.display-name) { font-size: 0.95em; }

// Placeholders sit in the rim's tone at half strength — present, never
// competing with a real value in ink.
.row-field :deep(input::placeholder) {
  color: var(--maker-contrast);
  opacity: 0.75;
}

// Embedded comment panes keep the row grammar and give back the air.
.maker-header.is-compact {
  --row-label-w: 66px;
  gap: 4px;
  margin-bottom: 6px;
  .header-row { gap: 6px; }
  .row-label { font-size: 0.56em; }
}

.maker-header.is-dense {
  gap: 6px;
  margin-bottom: 8px;
}

// Phones: the caption goes ABOVE its field — a 78px column out of 375px is a
// quarter of the row spent on a word.
@media (max-width: 600px) {
  .header-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
  .row-label { flex: 0 0 auto; text-align: left; padding-left: 10px; }
  .row-field { align-self: stretch; }
}
</style>
