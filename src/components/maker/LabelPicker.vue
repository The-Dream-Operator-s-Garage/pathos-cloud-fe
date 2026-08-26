<template>
  <div class="label-picker" :class="{ 'is-compact': compact }">
    <div v-if="!compact" class="picker-label">
      <q-icon name="label" size="13px" class="q-mr-xs" />
      <span>Add label</span>
      <span v-if="loading" class="text-dim q-ml-sm" style="font-size:.92em;">loading…</span>
    </div>

    <q-select
      ref="selectRef"
      v-model="searchValue"
      :options="filteredLeaves"
      :option-label="leafLabel"
      :option-value="leafValue"
      use-input
      input-debounce="0"
      hide-selected
      fill-input
      dense outlined :dark="false"
      :loading="loading"
      placeholder="Search labels…"
      class="picker-select"
      popup-content-class="picker-popup-light"
      :hide-dropdown-icon="false"
      @filter="onFilter"
      @update:model-value="onSelect"
    >
      <template #option="{ opt, itemProps }">
        <q-item v-bind="itemProps" dense class="leaf-option">
          <q-item-section avatar>
            <q-icon name="label_important" size="13px" />
          </q-item-section>
          <q-item-section>
            <q-item-label style="font-size:0.85em;">
              <span class="parent-name" v-if="opt.parent_name">[{{ opt.parent_name }}]</span>
              <span class="sep">&nbsp;&gt;&nbsp;</span>
              <span class="leaf-name">{{ opt.name }}</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #no-option>
        <q-item dense>
          <q-item-section class="text-dim" style="font-size:0.82em;">
            No matching labels
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { labelService } from 'src/services/label.service'

export default defineComponent({
  name: 'LabelPicker',
  props: {
    // Already-picked label ids (so we can hide them from the dropdown)
    excludeIds: { type: Array, default: () => [] },
    compact: { type: Boolean, default: false }
  },
  emits: ['picked'],

  setup (props, { emit }) {
    const allLeaves = ref([]) // master list of {id, name, parent_name, ...}
    const filteredLeaves = ref([])
    const loading = ref(true)
    const searchValue = ref(null)
    const selectRef = ref(null)

    const leafLabel = (l) => l ? `[${l.parent_name || ''}] > ${l.name}` : ''
    const leafValue = (l) => l?.id

    const visibleLeaves = () =>
      allLeaves.value.filter(l => !props.excludeIds.includes(l.id))

    const onFilter = (needle, update) => {
      update(() => {
        const q = (needle || '').toLowerCase().trim()
        const base = visibleLeaves()
        filteredLeaves.value = !q
          ? base
          : base.filter(l => {
            const haystack = `${l.parent_name || ''} ${l.name}`.toLowerCase()
            return haystack.includes(q)
          })
      })
    }

    const onSelect = (leaf) => {
      if (!leaf) return
      emit('picked', leaf)
      // Reset input so the user can pick another without retyping
      searchValue.value = null
      if (selectRef.value) selectRef.value.blur()
    }

    onMounted(async () => {
      try {
        const result = await labelService.listLeaves()
        if (result.success) {
          allLeaves.value = result.leaves
          filteredLeaves.value = visibleLeaves()
        }
      } catch (_) { /* leave empty */ }
      loading.value = false
    })

    return {
      selectRef,
      searchValue,
      filteredLeaves,
      loading,
      leafLabel,
      leafValue,
      onFilter,
      onSelect
    }
  }
})
</script>

<style lang="scss" scoped>
.label-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.picker-label {
  display: flex;
  align-items: center;
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.7);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding-left: 2px;
}

.picker-select { font-size: 0.88em; }

.label-picker.is-compact {
  gap: 0;
  .picker-select { font-size: 0.78em; }
  // ⚠ THE CONTROL'S BOX IS NOT STATED HERE ANY MORE (2026-08-26, user ask).
  // It carried `height/min-height: 30px` on the dense control and a matching
  // `.q-field__marginal`, from the pass that squeezed the pickers into a
  // shared row. The field aesthetic — 26px box, 13px corners, `--blue-grey-1`
  // fill, 2px `--maker-contrast` rim, thick icons — is stated ONCE in
  // `MakerHeader.vue` (`.row-field :deep(.q-field--outlined)`), for the title
  // input and both pickers together. Restating a height here would win on
  // specificity (four classes against three) and silently undo it.

}

.leaf-option {
  .parent-name { color: rgba(var(--ink-rgb), 0.6); font-family: 'Space Mono', monospace; }
  .sep         { color: rgba(255,255,255,0.3); }
  .leaf-name   { color: #e8e6ff; font-weight: 500; }
}
</style>
