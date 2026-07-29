<template>
  <div class="ltm">
    <q-input
      v-model="query" :dark="false" outlined dense clearable
      class="ltm__search"
      :placeholder="placeholder"
      @update:model-value="onQueryInput"
    >
      <template #prepend><q-icon name="search" size="15px" /></template>
    </q-input>

    <div class="ltm__body">
      <!-- Search mode: flat matches across the whole system -->
      <template v-if="query && query.trim()">
        <div v-if="searching" class="ltm__state"><q-spinner size="16px" color="primary" /></div>
        <div v-else-if="!results.length" class="ltm__state">No label matches.</div>
        <button
          v-else
          v-for="l in results"
          :key="l.id"
          type="button"
          class="ltm-row"
          :class="{ 'is-selected': l.id === selectedId }"
          @click="$emit('select', l)"
        >
          <q-icon name="label_important" size="13px" class="ltm-row__icon"
            :class="{ 'is-system': l.system_label, 'is-mine': isMine(l) }" />
          <span class="ltm-row__name">{{ l.name }}</span>
          <span v-if="l.system_label" class="ltm-badge ltm-badge--sys">sys</span>
          <span v-else-if="isMine(l)" class="ltm-badge ltm-badge--mine">yours</span>
        </button>
      </template>

      <!-- Tree mode: roots, recursive lazy expansion -->
      <template v-else>
        <div v-if="loadingRoots" class="ltm__state"><q-spinner size="16px" color="primary" /></div>
        <div v-else-if="!roots.length && !appendable" class="ltm__state">No labels yet — create a root.</div>
        <template v-else>
          <LabelTreeMiniNode
            v-for="root in roots"
            :key="root.id"
            :label="root"
            :depth="0"
            :selected-id="selectedId"
            :my-entity-id="myEntityId"
            :refresh-key="refreshKey"
            :appendable="appendable"
            @select="$emit('select', $event)"
            @created="$emit('created', $event)"
            @append-foreign="$emit('append-foreign', $event)"
          />

          <!-- The root layer ends with its add row too: new vocabularies
               are free for anyone. -->
          <div v-if="appendable" class="ltm__add-root">
            <template v-if="addingRoot">
              <q-input
                v-model="newRootName" :dark="false" outlined dense autofocus
                class="ltm__add-input"
                placeholder="New root label…"
                :loading="creatingRoot"
                @keydown.enter.prevent="createRoot"
                @keydown.esc.prevent="addingRoot = false"
              />
              <button type="button" class="ltm__add-go" title="Create"
                :disabled="!newRootName.trim() || creatingRoot" @click="createRoot">
                <q-icon name="check" size="13px" />
              </button>
              <button type="button" class="ltm__add-go" title="Cancel" @click="addingRoot = false">
                <q-icon name="close" size="13px" />
              </button>
            </template>
            <button v-else type="button" class="ltm__add-btn"
              title="Plant a new root vocabulary" @click="addingRoot = true">
              <q-icon name="add" size="12px" /> new root label
            </button>
            <span v-if="rootError" class="ltm__add-err">{{ rootError }}</span>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { labelService } from 'src/services/label.service'
import { useAuthStore } from 'src/stores/auth'
import LabelTreeMiniNode from './LabelTreeMiniNode.vue'

// The mini recursive label viewer/picker: search across every label OR walk
// the forest from its roots, expanding branches lazily. Selection only by
// default — `appendable` (the label maker dock) closes every unraveled
// layer with an add row: inline create on owned layers, suggest/fork
// hand-off on foreign ones.
export default defineComponent({
  name: 'LabelTreeMini',
  components: { LabelTreeMiniNode },
  props: {
    selectedId: { type: Number, default: null },
    placeholder: { type: String, default: 'Search labels — or browse the trees' },
    // Bump to force the roots (and expanded branches) to reload after a
    // mutation in the hosting maker.
    refreshKey: { type: Number, default: 0 },
    appendable: { type: Boolean, default: false }
  },
  emits: ['select', 'created', 'append-foreign'],

  setup (props, { emit }) {
    const auth = useAuthStore()
    const myEntityId = computed(() => auth.user?.id || null)
    const isMine = (l) => l.owner_id === myEntityId.value

    // Root-layer inline create (appendable mode).
    const addingRoot = ref(false)
    const newRootName = ref('')
    const creatingRoot = ref(false)
    const rootError = ref('')
    const createRoot = async () => {
      if (!newRootName.value.trim() || creatingRoot.value) return
      creatingRoot.value = true
      rootError.value = ''
      try {
        const r = await labelService.create({ name: newRootName.value.trim(), ancestorId: null })
        if (r.success) {
          newRootName.value = ''
          await loadRoots()
          emit('created', r.label)
        } else {
          rootError.value = r.error?.message || 'Could not create label'
        }
      } catch (e) {
        rootError.value = e?.response?.data?.error?.message || 'Could not create label'
      } finally {
        creatingRoot.value = false
        if (rootError.value) setTimeout(() => { rootError.value = '' }, 4000)
      }
    }

    const roots = ref([])
    const loadingRoots = ref(false)
    const loadRoots = async () => {
      loadingRoots.value = true
      try {
        const r = await labelService.listRoots({ limit: 200 })
        roots.value = r.success ? r.labels : []
      } catch (_) { roots.value = [] }
      loadingRoots.value = false
    }
    onMounted(loadRoots)
    watch(() => props.refreshKey, loadRoots)

    const query = ref('')
    const results = ref([])
    const searching = ref(false)
    let timer = null
    let seq = 0
    const runSearch = async () => {
      const s = ++seq
      if (!query.value || !query.value.trim()) { results.value = []; return }
      searching.value = true
      try {
        const r = await labelService.search(query.value.trim(), 25)
        if (s === seq) results.value = r.success ? r.labels : []
      } catch (_) {
        if (s === seq) results.value = []
      } finally {
        if (s === seq) searching.value = false
      }
    }
    const onQueryInput = () => {
      clearTimeout(timer)
      timer = setTimeout(runSearch, 250)
    }

    return {
      myEntityId,
      isMine,
      roots,
      loadingRoots,
      query,
      results,
      searching,
      onQueryInput,
      addingRoot,
      newRootName,
      creatingRoot,
      rootError,
      createRoot
    }
  }
})
</script>

<style lang="scss" scoped>
.ltm {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.ltm__search :deep(.q-field__control) { background: #fff; }

.ltm__body {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.ltm__state {
  padding: 16px 8px;
  text-align: center;
  font-size: 0.76em;
  color: var(--ink-mute);
}

// Flat search rows share the tree row grammar (LabelTreeMiniNode).
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
    background: rgba(0, 130, 156, 0.12);
    border-color: rgba(0, 130, 156, 0.4);
  }
}

.ltm-row__icon {
  color: rgba(var(--ink-rgb), 0.4);
  flex-shrink: 0;
  &.is-system { color: #c79a00; }
  &.is-mine   { color: #00829c; }
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
  &--mine { color: #00829c; background: rgba(0, 130, 156, 0.12); }
}

// Root-layer add row — grammar shared with LabelTreeMiniNode's .ltmn__add.
.ltm__add-root {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 1px;
}

.ltm__add-btn {
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

  &:hover { border-color: rgba(0, 130, 156, 0.55); color: #00829c; }
}

.ltm__add-input {
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

.ltm__add-go {
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

  &:hover:not(:disabled) { color: #00829c; border-color: rgba(0, 130, 156, 0.5); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.ltm__add-err {
  font-size: 0.64em;
  color: var(--q-negative, #c10015);
}
</style>
