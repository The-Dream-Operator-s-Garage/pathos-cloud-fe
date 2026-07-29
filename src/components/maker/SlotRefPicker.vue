<template>
  <div class="slot-picker">
    <div class="slot-picker__section-label">
      Element search
      <span v-if="hint" class="slot-picker__hint mono">{{ hint }}</span>
    </div>

    <!-- Kind pills — locked to the selected slot's declared kind when set -->
    <div class="ref-kinds">
      <button
        v-for="k in kindTabs"
        :key="k.key"
        type="button"
        class="ref-kind"
        :class="{ 'is-active': kind === k.key, 'is-locked-out': lockedKind && lockedKind !== k.key }"
        :style="kind === k.key ? { '--kind-color': k.color } : {}"
        :disabled="!!lockedKind && lockedKind !== k.key"
        @click="setKind(k.key)"
      >
        <q-icon :name="k.icon" size="13px" />
        <span>{{ k.label }}</span>
      </button>
    </div>

    <q-input
      v-model="query" :dark="false" outlined dense
      class="slot-picker__search"
      :placeholder="`Search ${kindLabel} by title or hash…`"
      clearable
      @update:model-value="onQueryInput"
    >
      <template #prepend><q-icon name="search" size="16px" /></template>
    </q-input>

    <!-- Results: click to assign to the selected slot, or drag onto any slot -->
    <div class="slot-picker__results">
      <div v-if="searching" class="slot-picker__state">
        <q-spinner size="18px" color="primary" />
      </div>
      <div v-else-if="results.length === 0" class="slot-picker__state">
        {{ query ? 'No ' + kindLabel + ' matches.' : 'Newest ' + kindLabel + ' appear here.' }}
      </div>
      <button
        v-else
        v-for="r in results"
        :key="r.address"
        type="button"
        class="ref-result"
        draggable="true"
        :title="'Click to fill the selected slot — or drag onto any slot'"
        @dragstart="onDragStart(r, $event)"
        @click="$emit('pick', r)"
      >
        <q-icon :name="iconFor(r.kind)" size="13px" class="ref-result__icon"
          :style="{ color: colorFor(r.kind) }" />
        <span class="ref-result__lines">
          <span class="ref-result__primary">{{ r.primary }}</span>
          <span v-if="r.secondary" class="ref-result__secondary">{{ r.secondary }}</span>
        </span>
        <q-icon name="drag_indicator" size="14px" class="ref-result__add" />
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { refService } from 'src/services/ref.service'
import { kindFor } from 'src/utils/kinds'

// Every referenceable pathchain kind (mirrors the API's VALID_SLOT_KINDS —
// secrets stay out: their hash is the invite credential).
const KIND_TABS = [
  { key: 'entities', label: 'People', icon: 'person', color: '#9b6cb0' },
  { key: 'posts', label: 'Posts', icon: 'article', color: '#6c4d72' },
  { key: 'nodes', label: 'Nodes', icon: 'adjust', color: '#2C3D4E' },
  { key: 'labels', label: 'Labels', icon: 'label_important', color: '#00829c' },
  { key: 'paths', label: 'Paths', icon: 'route', color: '#4d8a83' },
  { key: 'skeletons', label: 'Skels', icon: 'schema', color: '#5b6c82' },
  { key: 'moments', label: 'Moments', icon: 'schedule', color: '#c79a00' },
  { key: 'links', label: 'Links', icon: 'link', color: '#7d8995' }
]

// The skeleton builder's search column: like the maker's RefBrowser but it
// feeds SLOTS instead of a reference list — results are draggable onto slot
// rows (payload in application/x-pathos-ref) and clickable to fill whichever
// slot is selected. When the selected slot declares a kind the pills lock.
export default defineComponent({
  name: 'SlotRefPicker',

  props: {
    // Declared kind of the selected slot — locks the pills when set.
    lockedKind: { type: String, default: null },
    // Small mono hint next to the section label ("→ TOPIC").
    hint: { type: String, default: '' }
  },
  emits: ['pick'],

  setup (props) {
    const kind = ref(props.lockedKind || 'nodes')
    const query = ref('')
    const results = ref([])
    const searching = ref(false)
    let debounceTimer = null
    let searchSeq = 0

    const kindLabel = computed(() =>
      KIND_TABS.find(t => t.key === kind.value)?.label.toLowerCase() || 'element')

    const runSearch = async () => {
      const seq = ++searchSeq
      searching.value = true
      try {
        const r = await refService.search(kind.value, query.value || '', 8)
        if (seq === searchSeq) results.value = r.success ? r.results : []
      } catch (_) {
        if (seq === searchSeq) results.value = []
      } finally {
        if (seq === searchSeq) searching.value = false
      }
    }

    const onQueryInput = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(runSearch, 300)
    }

    const setKind = (k) => {
      kind.value = k
      runSearch()
    }

    watch(() => props.lockedKind, (k) => {
      if (k && k !== kind.value) setKind(k)
    })

    onMounted(runSearch)

    const onDragStart = (r, e) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({
        kind: r.kind, address: r.address, primary: r.primary || ''
      }))
    }

    const iconFor = (k) => kindFor(k).icon
    const colorFor = (k) => kindFor(k).color

    return {
      kindTabs: KIND_TABS,
      kind,
      kindLabel,
      query,
      results,
      searching,
      onQueryInput,
      setKind,
      onDragStart,
      iconFor,
      colorFor
    }
  }
})
</script>

<style lang="scss" scoped>
.slot-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.slot-picker__section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.slot-picker__hint {
  color: #00829c;
  text-transform: none;
  letter-spacing: 0;
}

// Kind pill row shared grammar with RefBrowser.
.ref-kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ref-kind {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s;

  &:hover:not(:disabled) { border-color: rgba(var(--ink-rgb), 0.4); color: var(--ink); }

  &.is-active {
    --kind-color: #00829c;
    color: #fff;
    background: var(--kind-color);
    border-color: var(--kind-color);
    box-shadow: var(--shadow-carved-pressed);
  }

  &.is-locked-out { opacity: 0.3; cursor: not-allowed; }
}

.slot-picker__search :deep(.q-field__control) { background: #fff; }

.slot-picker__results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 90px;
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

.slot-picker__state {
  padding: 18px 8px;
  text-align: center;
  font-size: 0.76em;
  color: var(--ink-mute);
}

.ref-result {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  cursor: grab;
  text-align: left;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover {
    border-color: rgba(0, 130, 156, 0.5);
    .ref-result__add { color: #00829c; }
  }
}

.ref-result__icon { flex-shrink: 0; }

.ref-result__lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.ref-result__primary {
  font-size: 0.76em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-result__secondary {
  font-size: 0.66em;
  color: var(--ink-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-result__add {
  flex-shrink: 0;
  color: rgba(var(--ink-rgb), 0.35);
}
</style>
