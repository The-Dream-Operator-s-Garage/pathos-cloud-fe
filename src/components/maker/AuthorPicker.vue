<template>
  <div class="author-picker" :class="{ 'is-compact': compact }">
    <div v-if="!compact" class="picker-label">
      <q-icon name="person" size="13px" class="q-mr-xs" />
      <span>Authoring as</span>
    </div>

    <q-select
      :model-value="modelValue"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :loading="loading"
      dense outlined :dark="false"
      emit-value map-options
      :hide-dropdown-icon="options.length <= 1"
      :readonly="options.length <= 1"
      class="picker-select"
      popup-content-class="picker-popup-light"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #selected-item="{ opt }">
        <div v-if="opt && opt.display_name" class="selected-row row items-center no-wrap"
          :title="opt.display_name">
          <!-- 15px, not 13 (2026-08-26, user ask: thick icons) — an inline
               size beats MakerHeader's 18px field rule, so this glyph is the
               one in the row that has to be stepped up here. -->
          <q-icon :name="iconFor(opt.kind)" size="15px" class="kind-icon" />
          <span class="display-name">{{ opt.display_name }}</span>
          <q-chip dense outline size="xs" :color="colorFor(opt.kind)"
            class="q-ma-none q-ml-xs kind-chip">
            {{ opt.kind }}
          </q-chip>
        </div>
        <!-- Value that couldn't be mapped to an option (authorables fetch
             failed): show the raw entity id, never a bare "unknown". -->
        <span v-else-if="opt != null" class="display-name">entity #{{ opt.id ?? opt }}</span>
      </template>

      <template #option="{ opt, itemProps }">
        <!-- The identity tree, indented by depth (alter-egos nest under
             their parent identity, at any depth). -->
        <q-item v-bind="itemProps" dense :style="{ paddingLeft: (12 + (opt.depth || 0) * 14) + 'px' }">
          <q-item-section avatar>
            <q-icon :name="iconFor(opt.kind)" size="14px" />
          </q-item-section>
          <q-item-section>
            <q-item-label style="font-size:0.85em;">{{ opt.display_name }}</q-item-label>
            <q-item-label caption style="font-size:0.7em;">
              {{ opt.kind }}<span v-if="opt.acting"> · acting</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { authService } from 'src/services/auth.service'

const ICON = { USER: 'person', ORGANIZATION: 'reduce_capacity', ALTER_EGO: 'theater_comedy', ORG_ALTER_EGO: 'theater_comedy', BOT: 'smart_toy' }
const COLOR = { USER: 'primary', ORGANIZATION: 'teal', ALTER_EGO: 'purple', ORG_ALTER_EGO: 'teal', BOT: 'grey' }

export default defineComponent({
  name: 'AuthorPicker',
  props: {
    // v-model: the selected entity id
    modelValue: { type: Number, default: null },
    compact: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'options-loaded'],

  setup (props, { emit }) {
    const options = ref([])
    const loading = ref(true)

    const optionLabel = (opt) => opt?.display_name || ''
    const optionValue = (opt) => opt?.id

    const iconFor = (k) => ICON[k] || 'person'
    const colorFor = (k) => COLOR[k] || 'primary'

    onMounted(async () => {
      try {
        const result = await authService.getAuthorables()
        if (result.success) {
          // Org rows carry `switchable` (2026-07): MEMBER seats list their
          // MASK but cannot author as the org entity itself — drop those
          // rows here (resolveAuthorId would 403 them anyway).
          options.value = result.authorables.filter(o => o.switchable !== false)
          // Default selection: the identity the user is logged in as right
          // now (`acting`, which may be an alter-ego), falling back to the
          // root USER row. A parent-restored value (e.g. a reopened draft)
          // is kept only if it still exists in the identity tree — a stale
          // id (author deleted, or a pre-reseed draft) would render as an
          // unmappable raw number and, with a single option, readonly-lock
          // the field.
          const acting = result.authorables.find(o => o.acting) ||
            result.authorables.find(o => o.kind === 'USER')
          const known = result.authorables.some(o => o.id === props.modelValue)
          if (acting && !known) emit('update:modelValue', acting.id)
          emit('options-loaded', result.authorables)
        }
      } catch (_) { /* leave empty */ }
      loading.value = false
    })

    return { options, loading, optionLabel, optionValue, iconFor, colorFor }
  }
})
</script>

<style lang="scss" scoped>
.author-picker {
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

.picker-select {
  font-size: 0.88em;
}

.author-picker.is-compact {
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

  // The NAME wins the narrow control — a long kind chip (ORG_ALTER_EGO)
  // was crushing it to nothing. The kind still reads in the dropdown rows.
  .kind-chip { display: none; }
}

// The selected value must NEVER escape its 30px control — a long mask
// name ("Dream Operator's Garage") wrapped out of the box and over the
// label box below (maker retouch, 2026-08-02). One line, ellipsized; the
// full name rides the title tooltip.
.selected-row {
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.picker-select :deep(.q-field__native) {
  flex-wrap: nowrap;
  overflow: hidden;
}

.kind-icon  { color: var(--ink); flex-shrink: 0; }
// Ink, not the old dark-surface gray — the pickers sit on the light dock
// plaque and #d8d8e8 rendered the selected author nearly invisible (#675).
.display-name {
  color: var(--ink);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kind-chip  { font-size: 0.6em; flex-shrink: 0; }
</style>
