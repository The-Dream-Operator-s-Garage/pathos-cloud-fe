<template>
  <div class="label-box" :class="{ 'is-compact': compact }">
    <div v-if="!compact" class="box-header">
      <q-icon name="local_offer" size="12px" class="q-mr-xs" />
      <span>Labels on this {{ targetKind }}</span>
      <q-space />
      <span class="text-dim mono" style="font-size:0.7em;">
        {{ totalCount }} attached
      </span>
    </div>

    <div class="box-content">
      <!-- Empty hint when nothing chosen yet -->
      <span v-if="totalCount === 0" class="text-dim" style="font-size:0.82em; font-style:italic;">
        No labels yet — pick one from the dropdown above.
      </span>

      <!-- ─── Identity chips (author / moment) — not labels, locked ─── -->
      <div v-if="author" class="canonic-chip" :title="'author: ' + author.display_name">
        <q-icon name="person" size="11px" class="canonic-icon" />
        <span class="canonic-name">{{ author.display_name }}</span>
        <q-icon name="lock" size="10px" class="lock-icon" />
      </div>

      <!-- MOMENT (virtual — locks in on submit) -->
      <div class="canonic-chip moment-chip" title="The pathchain moment hash is generated on submit">
        <q-icon name="schedule" size="11px" class="canonic-icon" />
        <span class="canonic-name">moment: on submit</span>
        <q-icon name="lock" size="10px" class="lock-icon" />
      </div>

      <!-- Backend-attached labels (NODE > NOTE etc) — ordinary labels, so
           they render in the inert NanoLabelSlider: no ancestry, no
           navigation, no special chrome. -->
      <NanoLabelSlider v-if="canonicLabels.length" :labels="canonicLabels" />

      <!-- ─── User-chosen labels — red wrapper + delete button ─── -->
      <div v-for="lbl in userLabels" :key="'usr-' + lbl.id" class="removable-wrapper">
        <LabelViewer :label="lbl" />
        <button
          type="button"
          class="remove-btn"
          :title="'Remove ' + lbl.name"
          @click.stop="$emit('remove-label', lbl.id)"
        >
          <q-icon name="close" size="11px" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import LabelViewer from 'src/components/labels/LabelViewer.vue'
import NanoLabelSlider from 'src/components/labels/NanoLabelSlider.vue'

export default defineComponent({
  name: 'LabelBox',
  components: { LabelViewer, NanoLabelSlider },
  emits: ['remove-label'],

  props: {
    // {id, display_name, kind, path}
    author: { type: Object, default: null },
    // Real labels auto-attached by the backend (NODE > NOTE etc.)
    canonicLabels: { type: Array, default: () => [] },
    // Labels the user picked (removable)
    userLabels: { type: Array, default: () => [] },
    // What sort of thing this box is attached to (for the header)
    targetKind: { type: String, default: 'node' },
    // Compact density (smaller chips, no header) for inline reply forms
    compact: { type: Boolean, default: false }
  },

  setup (props) {
    const totalCount = computed(() =>
      props.canonicLabels.length + props.userLabels.length + (props.author ? 1 : 0) + 1 /* moment chip */
    )
    return { totalCount }
  }
})
</script>

<style lang="scss" scoped>
.label-box {
  background: rgba(var(--ink-rgb), 0.08);
  // An inner border of the window (2026-08-26, third user ask).
  border: 1px solid var(--maker-contrast);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-box.is-compact {
  padding: 4px 6px;
  border-radius: 7px;
  gap: 3px;
  .box-content { gap: 3px 5px; min-height: 20px; max-height: 52px; }

  .canonic-chip {
    height: 18px;
    padding: 0 6px;
    font-size: 0.62em;
    .canonic-icon { font-size: 10px; }
    .lock-icon    { font-size: 9px; }
    .canonic-name {
      max-width: 22ch;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .removable-wrapper { padding: 1px; border-radius: 10px; }
  .remove-btn        { width: 13px; height: 13px; margin: 0 1px; }
  :deep(.label-chip) { font-size: 0.64em; padding: 1px 5px; }
}

.box-header {
  display: flex;
  align-items: center;
  font-size: 0.72em;
  // A TITLE — the window's headings letter in its contrast tone.
  color: var(--maker-contrast);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

// Inner scroll (maker retouch, 2026-08-02): the chip rows cap at ~two
// lines and scroll inside — a label-happy draft must never push the
// editor down or collide with the pickers above.
.box-content {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: center;
  min-height: 28px;
  max-height: 68px;
  overflow-y: auto;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

// ── Identity chips (author, moment) — locked ──────────────────
//
// ⚠ BUG FIXED IN PASSING (2026-08-26): this chip painted its NAME in
// `rgba(ink, 0.85)` on a `rgba(ink, 0.85)` fill — the same value twice, so
// the author's name was invisible and the chip read as a blank dark plate
// with two icons on it. It is a leftover from the DARK-SURFACE era, when the
// maker sat on an ink panel and that fill was the hole the light text stood
// in; the dock went to paper on 2026-07-27 and the pair was never re-read.
// Measured before the fix: fill rgba(44,61,78,.85), text rgba(44,61,78,.85).
//
// The chips now wear the window's field aesthetic — `--blue-grey-1` fill,
// `--maker-contrast` rim, ink text — so they are legible AND they read as
// siblings of the three controls above them, which is what the ask asked
// for ("match the title input aesthetic", then "blue-grey instead of the
// remaining brown bits"). They stay ROUNDER than the fields (12px against
// 13px on a 26px box is nearly a pill either way) because these are chips,
// not controls: nothing here can be typed into.
.canonic-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  background: var(--blue-grey-1);
  border: 1px solid var(--maker-contrast);
  border-radius: 12px;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  letter-spacing: 0.03em;
  color: var(--ink);

  .canonic-icon { color: var(--maker-contrast); }
  .canonic-name { white-space: nowrap; }
  // The LOCK was amber (`rgba(255,200,0,.5)`) — one of the warm bits the
  // third ask sent out of this window. It is the deep step, not the contrast:
  // a lock is the one mark on the chip that has to out-read the rim.
  .lock-icon    { color: var(--blue-grey-8); margin-left: 2px; }
}

// The MOMENT chip was the window's most-brown object — a `rgba(45,30,15,.55)`
// ground under amber text, from the same dark era. It keeps its distinction
// from the author chip by TONE within the one family (a step-deeper fill, the
// deep rim) rather than by belonging to another one.
.moment-chip {
  background: var(--blue-grey-4);
  border-color: var(--blue-grey-8);
  color: var(--ink);

  .canonic-icon { color: var(--blue-grey-8); }
}

// ── User-added: red wrapper + delete button ───────────────────
.removable-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  background: rgba(193, 0, 21, 0.18);     // soft red outer
  border: 1px solid rgba(193, 0, 21, 0.5);
  border-radius: 14px;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0 2px;
  border-radius: 50%;
  background: rgba(193, 0, 21, 0.4);
  border: none;
  color: #fff;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: rgba(193, 0, 21, 0.85); }
}
</style>
