<template>
  <div class="ltmn">
    <button
      type="button"
      class="ltm-row"
      :class="{ 'is-selected': label.id === selectedId }"
      :style="{ paddingLeft: (7 + depth * 14) + 'px' }"
      @click="$emit('select', label)"
    >
      <span class="ltmn__caret" @click.stop="toggle">
        <q-spinner v-if="loading" size="10px" />
        <q-icon
          v-else-if="!isLeaf || appendable"
          :name="expanded ? 'expand_more' : 'chevron_right'"
          size="13px"
        />
        <span v-else class="ltmn__leaf-dot" />
      </span>
      <q-icon name="label_important" size="13px" class="ltm-row__icon"
        :class="{ 'is-system': label.system_label, 'is-mine': isMine }" />
      <span class="ltm-row__name">{{ label.name }}</span>
      <span v-if="label.system_label" class="ltm-badge ltm-badge--sys">sys</span>
      <span v-else-if="isMine" class="ltm-badge ltm-badge--mine">yours</span>
    </button>

    <div v-if="expanded && (children.length || appendable)" class="ltmn__children">
      <LabelTreeMiniNode
        v-for="child in children"
        :key="child.id"
        :label="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :my-entity-id="myEntityId"
        :refresh-key="refreshKey"
        :appendable="appendable"
        @select="$emit('select', $event)"
        @created="$emit('created', $event)"
        @append-foreign="$emit('append-foreign', $event)"
      />

      <!-- Layer-end add row: every unraveled layer closes with the seam
           that grows it — a sibling for these children, a son for the
           parent. Owned layers create inline; foreign layers hand off to
           the suggest/fork panel. -->
      <div v-if="appendable" class="ltmn__add" :style="{ paddingLeft: (7 + (depth + 1) * 14) + 'px' }">
        <template v-if="isMine && adding">
          <q-input
            v-model="newName" :dark="false" outlined dense autofocus
            class="ltmn__add-input"
            :placeholder="`New label under ${label.name}…`"
            :loading="creating"
            @keydown.enter.prevent="createHere"
            @keydown.esc.prevent="adding = false"
          />
          <button type="button" class="ltmn__add-go" title="Create"
            :disabled="!newName.trim() || creating" @click="createHere">
            <q-icon name="check" size="13px" />
          </button>
          <button type="button" class="ltmn__add-go" title="Cancel" @click="adding = false">
            <q-icon name="close" size="13px" />
          </button>
        </template>
        <button
          v-else-if="isMine"
          type="button" class="ltmn__add-btn"
          :title="`Append a label under ${label.name}`"
          @click="adding = true"
        >
          <q-icon name="add" size="12px" /> add label
        </button>
        <button
          v-else
          type="button" class="ltmn__add-btn ltmn__add-btn--foreign"
          :title="`You don't own '${label.name}' — suggest a label to the owner, or fork the tree`"
          @click="$emit('append-foreign', label)"
        >
          <q-icon name="add" size="12px" /> suggest / fork…
        </button>
        <span v-if="addError" class="ltmn__add-err">{{ addError }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { labelService } from 'src/services/label.service'

// One row of the mini label tree — recursion happens here. Children load
// lazily on first expand; a node only learns it's a leaf by asking. In
// `appendable` mode every unraveled layer ends with an add row (leaves
// expand too, so a son can be planted anywhere).
export default defineComponent({
  name: 'LabelTreeMiniNode',
  props: {
    label: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: Number, default: null },
    myEntityId: { type: Number, default: null },
    refreshKey: { type: Number, default: 0 },
    // Offer layer-end add rows (label maker dock only — pickers stay
    // select-only).
    appendable: { type: Boolean, default: false }
  },
  emits: ['select', 'created', 'append-foreign'],

  setup (props, { emit }) {
    const expanded = ref(false)
    const loading = ref(false)
    const children = ref([])
    const fetched = ref(false)

    const isMine = computed(() => props.label.owner_id === props.myEntityId)
    const isLeaf = computed(() => fetched.value && children.value.length === 0)

    const loadChildren = async () => {
      loading.value = true
      try {
        const r = await labelService.getChildren(props.label.id)
        children.value = r.success ? r.children : []
      } catch (_) { children.value = [] }
      fetched.value = true
      loading.value = false
    }

    const toggle = async () => {
      if (isLeaf.value && !props.appendable) return
      if (!expanded.value && !fetched.value) await loadChildren()
      expanded.value = !expanded.value
    }

    // A mutation upstream (create/move/fork) may have changed this branch —
    // refetch it if it's showing.
    watch(() => props.refreshKey, async () => {
      if (fetched.value) await loadChildren()
    })

    // Inline create (owned layers): the new label is a sibling of this
    // node's children — a son of this node.
    const adding = ref(false)
    const newName = ref('')
    const creating = ref(false)
    const addError = ref('')
    const createHere = async () => {
      if (!newName.value.trim() || creating.value) return
      creating.value = true
      addError.value = ''
      try {
        const r = await labelService.create({
          name: newName.value.trim(),
          ancestorId: props.label.id
        })
        if (r.success) {
          newName.value = ''
          await loadChildren()
          emit('created', r.label)
        } else {
          addError.value = r.error?.message || 'Could not create label'
        }
      } catch (e) {
        addError.value = e?.response?.data?.error?.message || 'Could not create label'
      } finally {
        creating.value = false
        if (addError.value) setTimeout(() => { addError.value = '' }, 4000)
      }
    }

    return {
      expanded,
      loading,
      children,
      isMine,
      isLeaf,
      toggle,
      adding,
      newName,
      creating,
      addError,
      createHere
    }
  }
})
</script>

<style lang="scss" scoped>
// ⚠ THE ACCENT IS A DIAL (2026-09-04): `--ltm-accent` / `--ltm-accent-rgb`
// with the shared chrome's `#00829c` as fallback — see LabelTreeMini.vue.
// Row grammar shared with LabelTreeMini's flat search rows.
.ltm-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 7px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  text-align: left;

  &:hover { background: rgba(255, 255, 255, 0.75); }
  &.is-selected {
    background: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.12);
    border-color: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.4);
  }
}

.ltmn__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: rgba(var(--ink-rgb), 0.55);
  border-radius: 4px;

  &:hover { background: rgba(var(--ink-rgb), 0.1); }
}

.ltmn__leaf-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(var(--ink-rgb), 0.3);
}

.ltm-row__icon {
  color: rgba(var(--ink-rgb), 0.4);
  flex-shrink: 0;
  &.is-system { color: #c79a00; }
  &.is-mine   { color: var(--ltm-accent, #00829c); }
}

.ltm-row__name {
  font-family: var(--font-mono);
  font-size: 0.74em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ltm-badge {
  margin-left: auto;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.58em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-pill);
  padding: 0 6px;

  &--sys  { color: #8a6200; background: rgba(255, 200, 0, 0.18); }
  &--mine { color: var(--ltm-accent, #00829c); background: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.12); }
}

// Layer-end add rows.
.ltmn__add {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 1px;
  padding-bottom: 1px;
}

.ltmn__add-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px dashed rgba(var(--ink-rgb), 0.28);
  border-radius: var(--radius-pill);
  background: none;
  padding: 1px 9px 1px 6px;
  font-family: var(--font-mono);
  font-size: 0.64em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-rgb), 0.55);
  cursor: pointer;

  &:hover { border-color: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.55); color: var(--ltm-accent, #00829c); }

  &--foreign:hover { border-color: rgba(255, 180, 0, 0.7); color: #8a6200; }
}

.ltmn__add-input {
  flex: 1;
  max-width: 230px;

  :deep(.q-field__control) {
    height: 26px;
    min-height: 26px;
    background: #fff;
    font-size: 0.78em;
  }
  :deep(.q-field__marginal) { height: 26px; }
}

.ltmn__add-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(var(--ink-rgb), 0.2);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  color: var(--ink-soft);
  cursor: pointer;

  &:hover:not(:disabled) { color: var(--ltm-accent, #00829c); border-color: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.5); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.ltmn__add-err {
  font-size: 0.64em;
  color: var(--q-negative, #c10015);
}
</style>
