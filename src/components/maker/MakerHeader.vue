<template>
  <div class="maker-header" :class="{ 'is-compact': compact, 'is-dense': dense }">

    <!-- Title (slotted by the surface) + author + LabelPicker on one row
         on wide screens — dense mode drops the picker captions so the row
         stays a single control-height line. -->
    <div class="header-row" :class="{ 'has-title': hasTitle }">
      <div v-if="hasTitle" class="col-title">
        <slot name="title" />
      </div>
      <div class="col-author">
        <AuthorPicker
          v-model="localAuthorId"
          :compact="compact || dense"
          @options-loaded="onAuthorablesLoaded"
        />
      </div>
      <div class="col-label">
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
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.header-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 2fr;
  gap: 12px;
  align-items: end;
}

// With a slotted title the row reads title | author | labels and WRAPS —
// the dock's editor column ranges ~340px (half-screen dock beside the refs
// browser) to full width (maximize), so fixed grid tracks would overflow.
// Narrow, the title takes its own line and the pickers pair up below;
// wide, all three share one control row. Flex-wrap is the whole mechanism.
.header-row.has-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .col-title  { flex: 1 1 220px; min-width: 200px; }
  .col-author { flex: 1 1 150px; min-width: 150px; max-width: 260px; }
  .col-label  { flex: 1 1 160px; min-width: 160px; max-width: 280px; }
}

.maker-header.is-compact {
  gap: 6px;
  margin-bottom: 6px;
  .header-row { gap: 8px; }
}

.maker-header.is-dense {
  gap: 8px;
  margin-bottom: 8px;
  .header-row { gap: 8px; align-items: center; }
}

@media (max-width: 600px) {
  .header-row { grid-template-columns: 1fr; }
}
</style>
