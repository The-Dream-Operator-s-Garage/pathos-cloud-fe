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
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-box.is-compact {
  padding: 5px 8px;
  border-radius: 7px;
  gap: 4px;
  .box-content { gap: 4px 6px; min-height: 22px; }

  .canonic-chip {
    height: 20px;
    padding: 0 7px;
    font-size: 0.66em;
    .canonic-icon { font-size: 10px; }
    .lock-icon    { font-size: 9px; }
  }
  .removable-wrapper { padding: 1px; border-radius: 11px; }
  .remove-btn        { width: 14px; height: 14px; margin: 0 1px; }
  :deep(.label-chip) { font-size: 0.68em; padding: 1px 6px; }
}

.box-header {
  display: flex;
  align-items: center;
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.7);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.box-content {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: center;
  min-height: 28px;
}

// ── Identity chip (author, moment) — locked, dark-gray look ────
.canonic-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  background: rgba(var(--ink-rgb), 0.85);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 12px;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  letter-spacing: 0.03em;
  color: rgba(var(--ink-rgb), 0.85);

  .canonic-icon { color: var(--ink); }
  .canonic-name { white-space: nowrap; }
  .lock-icon    { color: rgba(255, 200, 0, 0.5); margin-left: 2px; }
}

.moment-chip {
  background: rgba(45, 30, 15, 0.55);
  border-color: rgba(255, 180, 0, 0.18);
  color: rgba(255, 220, 150, 0.75);
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
