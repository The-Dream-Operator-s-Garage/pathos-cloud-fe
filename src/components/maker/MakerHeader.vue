<template>
  <div class="maker-header" :class="{ 'is-compact': compact }">

    <!-- Author + LabelPicker side-by-side on wide screens -->
    <div class="header-row">
      <div class="col-author">
        <AuthorPicker
          v-model="localAuthorId"
          :compact="compact"
          @options-loaded="onAuthorablesLoaded"
        />
      </div>
      <div class="col-label">
        <LabelPicker
          :exclude-ids="userLabelIds"
          :compact="compact"
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
      :compact="compact"
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
    // Restore-state seeds for reopened drafts (MakerDock keys this component
    // by draft id, so a tab switch remounts with the draft's saved values).
    initialAuthorId: { type: Number, default: null },
    initialLabels: { type: Array, default: () => [] }
  },

  emits: ['update:authorEntityId', 'update:labelIds', 'update:userLabels'],

  setup (props, { emit }) {
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

.maker-header.is-compact {
  gap: 6px;
  margin-bottom: 6px;
  .header-row { gap: 8px; }
}

@media (max-width: 600px) {
  .header-row { grid-template-columns: 1fr; }
}
</style>
