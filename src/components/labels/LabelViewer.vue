<template>
  <div
    class="label-viewer"
    :class="{ expanded: isExpanded, loading: loading }"
  >
    <!-- Left arrow: expand → step-up-ancestry -->
    <button
      v-if="showLeftBtn"
      class="lv-arrow lv-arrow-left"
      :title="leftTitle"
      @click.stop="onLeftClick"
    >
      <q-icon name="chevron_left" size="11px" />
    </button>

    <!-- OUTER box (visible when expanded) shows the ancestor (cursor + 1) -->
    <span
      v-if="isExpanded && outerLabel"
      class="lv-outer-label"
      :title="outerLabel.path"
      @click.stop="navigateTo(outerLabel)"
    >{{ outerLabel.name }}</span>

    <!-- INNER box (always visible) shows the current label at cursor position -->
    <span
      v-if="innerLabel"
      class="lv-inner"
      :title="innerLabel.path"
      @click.stop="navigateTo(innerLabel)"
    >{{ innerLabel.name }}</span>

    <span v-else class="lv-inner lv-inner-empty">…</span>

    <!-- Right arrow: step-down-ancestry → contract (only when expanded) -->
    <button
      v-if="showRightBtn"
      class="lv-arrow lv-arrow-right"
      :title="rightTitle"
      @click.stop="onRightClick"
    >
      <q-icon name="chevron_right" size="11px" />
    </button>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { recoverAncestry } from 'src/utils/labelChain'

export default defineComponent({
  name: 'LabelViewer',
  props: {
    // Either pass `label` (full object) or `labelId` (number to fetch)
    label: { type: Object, default: null },
    labelId: { type: [Number, String], default: null }
  },

  setup (props) {
    const router = useRouter()

    // The full ancestry chain [root, ..., original]
    // We index BACKWARDS through this: index 0 = original, 1 = parent, ...
    // So we keep it reversed internally as `chain`.
    const chain = ref([]) // chain[0] = original label, chain[1] = parent, ...
    const cursor = ref(0) // position in chain shown in INNER box
    const isExpanded = ref(false) // outer box visible?
    const loading = ref(true)

    // Resolve which label to load
    const targetId = computed(() => props.labelId ?? props.label?.id ?? null)

    const innerLabel = computed(() => chain.value[cursor.value] || null)
    const outerLabel = computed(() => chain.value[cursor.value + 1] || null)
    const hasParent = computed(() => !!chain.value[cursor.value + 1])

    // Left button: visible whenever there's a parent to expand into / step up to
    const showLeftBtn = computed(() => hasParent.value)

    // Right button visibility:
    //  - hidden when not expanded (nothing to collapse back to)
    //  - visible when expanded (so user can collapse or step back down)
    const showRightBtn = computed(() => isExpanded.value)

    const leftTitle = computed(() => {
      if (!isExpanded.value) return 'Show ancestor'
      const next = chain.value[cursor.value + 2]
      return next ? `Step up to: ${next.name}` : 'Already at root'
    })
    const rightTitle = computed(() =>
      cursor.value === 0 ? 'Contract' : 'Step back down'
    )

    // Preload the full ancestor chain once via the shared recursive
    // ancestral recovery ([root, ..., target], reversed so chain[0] = original)
    const loadChain = async () => {
      loading.value = true
      const id = targetId.value
      if (!id) { loading.value = false; return }

      const recovered = await recoverAncestry(props.label || id)
      chain.value = [...recovered].reverse()
      loading.value = false
    }

    // Load on mount + whenever the target changes
    onMounted(loadChain)
    watch(targetId, loadChain)

    // ── Click handlers ──────────────────────────────────────
    const onLeftClick = () => {
      if (!isExpanded.value) {
        isExpanded.value = true
      } else {
        // Step up one level if there's a deeper ancestor
        if (chain.value[cursor.value + 2]) cursor.value++
      }
    }

    const onRightClick = () => {
      if (cursor.value > 0) {
        cursor.value--
      } else {
        // cursor === 0 and expanded → collapse
        isExpanded.value = false
      }
    }

    const navigateTo = (label) => {
      if (!label) return
      router.push(`/labels/${label.id}`)
    }

    return {
      loading,
      isExpanded,
      innerLabel,
      outerLabel,
      showLeftBtn,
      showRightBtn,
      leftTitle,
      rightTitle,
      onLeftClick,
      onRightClick,
      navigateTo
    }
  }
})
</script>

<style lang="scss" scoped>
.label-viewer {
  display: inline-flex;
  align-items: stretch;
  background: rgba(var(--ink-rgb), 0.85);        // outer dark-gray
  border-radius: 11px;
  padding: 1px;
  font-size: 0.72em;
  height: 21px;
  transition: padding-left 0.2s ease, padding-right 0.2s ease;
  user-select: none;
  flex-shrink: 0;

  &.expanded {
    padding-left:  4px;
    padding-right: 3px;
  }

  &.loading {
    opacity: 0.4;
  }
}

// Outer-box label (ancestor)
.lv-outer-label {
  display: inline-flex;
  align-items: center;
  padding: 0 7px 0 3px;
  color: rgba(var(--ink-rgb), 0.65);
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.76em;
  white-space: nowrap;
  cursor: pointer;

  &:hover { color: var(--ink-1); }
}

// Inner box (light-gray)
.lv-inner {
  display: inline-flex;
  align-items: center;
  padding: 0 7px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 9px;
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.82em;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.95); }

  &-empty { opacity: 0.5; cursor: default; }
}

// Arrow buttons
.lv-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 17px;
  margin: 0 1px;
  border-radius: 5px;
  background: rgba(var(--ink-rgb), 0.18);
  border: none;
  color: var(--paper);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: rgba(var(--ink-rgb), 0.32);
    color: #fff;
  }

  &-left  { order: -1; }
  &-right { order:  1; }
}
</style>
