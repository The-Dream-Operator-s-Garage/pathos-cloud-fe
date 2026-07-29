<template>
  <!-- Squares inside squares. One LabelSquares = one square for one label;
       digging into its descendance carves a darker inset pit inside the
       square, which holds the sons — each of them a LabelSquares again,
       recursively, to any depth. Clicking a square's head selects the
       label (usages panel on the right reacts) and toggles the dig.

       `expand-ids` is a chain of label ids (root → target) recovered via
       the recursive ancestral walk: when a search result or deep link
       needs to be shown, every square on the chain digs itself open. -->
  <div
    class="label-square"
    :class="{ 'is-expanded': expanded, 'is-selected': isSelected, 'is-system': !!label.system_label }"
    :style="`--depth: ${depth};`"
  >
    <div class="label-square__head" @click.stop="onHeadClick">
      <q-icon
        :name="expanded ? 'indeterminate_check_box' : 'add_box'"
        size="14px"
        class="label-square__toggle"
        @click.stop="toggle"
      />
      <span class="label-square__name" :title="label.path">{{ label.name }}</span>
      <q-icon v-if="label.system_label" name="verified" size="11px" class="label-square__sys" title="system label" />
      <q-space />
      <span v-if="childCount !== null" class="label-square__count">{{ childCount }}</span>
      <q-spinner v-if="loadingChildren" size="12px" color="primary" />
    </div>

    <div v-if="expanded" class="label-square__pit">
      <template v-if="children.length">
        <LabelSquares
          v-for="child in children"
          :key="child.id"
          :label="child"
          :depth="depth + 1"
          :selected-id="selectedId"
          :expand-ids="expandIds"
          @select="$emit('select', $event)"
        />
      </template>
      <div v-else-if="!loadingChildren" class="label-square__leaf">
        <q-icon name="label" size="11px" class="q-mr-xs" /> leaf — no sons
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, inject } from 'vue'
import { labelService } from 'src/services/label.service'

export default defineComponent({
  name: 'LabelSquares',
  props: {
    label: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: [Number, String], default: null },
    // Chain of label ids (root → target) that must be dug open.
    expandIds: { type: Array, default: () => [] }
  },
  emits: ['select'],
  setup (props, { emit }) {
    const expanded = ref(false)
    const loaded = ref(false)
    const loadingChildren = ref(false)
    const children = ref([])

    // Explorer-level StateHolder seam — the dig set persists across
    // navigation so a 3-layer exploration survives a post detour.
    const digState = inject('labelDigState', null)

    const isSelected = computed(() => props.selectedId === props.label.id)
    const childCount = computed(() => (loaded.value ? children.value.length : null))

    const loadChildren = async () => {
      if (loaded.value || loadingChildren.value) return
      loadingChildren.value = true
      try {
        const res = await labelService.getChildren(props.label.id)
        if (res.success) children.value = res.children || []
        loaded.value = true
      } catch (_) {
        children.value = []
      } finally {
        loadingChildren.value = false
      }
    }

    const setExpanded = async (open) => {
      if (open) await loadChildren()
      expanded.value = open
      digState?.setExpanded(props.label, open)
    }

    const toggle = () => setExpanded(!expanded.value)

    const onHeadClick = async () => {
      emit('select', props.label)
      if (!expanded.value) await setExpanded(true)
    }

    // Auto-dig when this square sits on a recovered ancestry chain (or in
    // the restored dig set handed back by the explorer's StateHolder).
    const applyExpandChain = async () => {
      if (!props.expandIds?.includes(props.label.id)) return
      await loadChildren()
      expanded.value = true
      // Register in the dig set too (no-op when already there) so a
      // search-driven dig survives navigation like a manual one.
      digState?.setExpanded(props.label, true)
    }

    onMounted(applyExpandChain)
    watch(() => props.expandIds, applyExpandChain)

    return {
      expanded,
      loadingChildren,
      children,
      isSelected,
      childCount,
      toggle,
      onHeadClick
    }
  }
})
</script>

<style lang="scss" scoped>
.label-square {
  --depth: 0;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: 9px;
  background: var(--paper-card, #ffffff);
  box-shadow: 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  overflow: hidden;
  flex: 0 1 auto;
  min-width: 130px;
  max-width: 100%;
  transition: border-color 0.12s, box-shadow 0.12s, flex-basis 0.15s;

  // A dug-open square claims the full row so the carving reads clearly.
  &.is-expanded { flex-basis: 100%; }

  &.is-selected {
    border-color: rgba(0, 130, 156, 0.65);
    box-shadow: 0 0 0 2px rgba(0, 130, 156, 0.18), 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  }
}

.label-square__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  cursor: pointer;
  user-select: none;

  &:hover { background: rgba(0, 130, 156, 0.06); }
}

.label-square__toggle {
  color: rgba(var(--ink-rgb), 0.45);
  cursor: pointer;
  flex-shrink: 0;
  &:hover { color: #00829c; }
}

.label-square__name {
  font-family: 'Space Mono', monospace;
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ink, #2C3D4E);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-selected > .label-square__head .label-square__name { color: #00829c; }

.label-square__sys { color: #00829c; opacity: 0.75; flex-shrink: 0; }

.label-square__count {
  font-family: 'Space Mono', monospace;
  font-size: 0.68em;
  color: rgba(var(--ink-rgb), 0.5);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
  flex-shrink: 0;
}

// The carved pit: every level of descendance digs a visibly deeper,
// darker inset container inside the parent square.
.label-square__pit {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 7px;
  margin: 0 7px 7px;
  padding: 8px;
  border-radius: 7px;
  background: rgba(var(--ink-rgb), calc(0.04 + var(--depth) * 0.022));
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), calc(0.14 + var(--depth) * 0.03)),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);
}

.label-square__leaf {
  display: inline-flex;
  align-items: center;
  font-size: 0.72em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
  padding: 2px 4px;
}
</style>
