<template>
  <!-- One square per origin skeleton (template / directory / collection) —
       the skeleton mirror of LabelSquares. Digging carves an inset pit, but
       unlike labels the pit doesn't recurse into more name-squares: every
       instance inherits its template's name, so squares would all read the
       same. The pit holds a SkeletonInstanceList instead — one identifying
       row per instantiation, extendable ("+ N more…") and diggable per row.

       Clicking the head selects the skeleton (the Structure panel on the
       right reacts) and opens the dig. -->
  <div
    class="skeleton-square"
    :class="{ 'is-expanded': expanded, 'is-selected': isSelected, 'is-template': isTemplate }"
    :style="`--depth: ${depth};`"
  >
    <div class="skeleton-square__head" @click.stop="onHeadClick">
      <q-icon
        :name="expanded ? 'indeterminate_check_box' : 'add_box'"
        size="14px"
        class="skeleton-square__toggle"
        @click.stop="toggle"
      />
      <q-icon :name="iconName" size="12px" class="skeleton-square__kind" />
      <span class="skeleton-square__name" :title="skeleton.path">{{ displayName }}</span>
      <q-icon v-if="isTemplate" name="verified" size="11px" class="skeleton-square__sys" title="template / origin" />
      <q-space />
      <span v-if="childTotal !== null" class="skeleton-square__count">{{ childTotal }}</span>
    </div>

    <div v-if="expanded" class="skeleton-square__pit">
      <SkeletonInstanceList
        :parent-id="skeleton.id"
        :depth="depth + 1"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @total="childTotal = $event"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import SkeletonInstanceList from 'src/components/skeletons/SkeletonInstanceList.vue'

const ICONS = {
  PATHOS_DOCS: 'folder',
  POST: 'article',
  PIN: 'push_pin',
  PINS: 'push_pin',
  USER_PROFILE: 'person',
  PATH_VIEW: 'route',
  ELEMENT: 'crop_free',
  // Per-kind element schemas (forks of ELEMENT) — icons match kinds.js.
  NODE: 'adjust',
  LABEL: 'label_important',
  MOMENT: 'schedule',
  SECRET: 'key',
  LINK: 'link',
  PATH: 'route'
}

export default defineComponent({
  name: 'SkeletonSquares',
  components: { SkeletonInstanceList },
  props: {
    skeleton: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: [Number, String], default: null }
  },
  emits: ['select'],
  setup (props, { emit }) {
    const expanded = ref(false)
    const childTotal = ref(null)

    const isSelected = computed(() => props.selectedId === props.skeleton.id)
    // Origins self-reference their ancestor (or have none).
    const isTemplate = computed(() => {
      const s = props.skeleton
      return s.ancestor_id == null || s.ancestor_id === s.id
    })

    // ELEMENT instances are named 'ELEMENT:<kind>/<hash>' — compact that
    // to 'ELEMENT:<kind>/<8 chars>' so the square stays scannable.
    const displayName = computed(() => {
      const n = props.skeleton.name || `skeleton #${props.skeleton.id}`
      const m = n.match(/^ELEMENT:([a-z]+)\/([a-f0-9]{12,})$/)
      return m ? `ELEMENT:${m[1]}/${m[2].slice(0, 8)}…` : n
    })

    const iconName = computed(() => {
      const base = (props.skeleton.name || '').split(':')[0]
      return ICONS[base] || 'schema'
    })

    const toggle = () => { expanded.value = !expanded.value }

    const onHeadClick = () => {
      emit('select', props.skeleton)
      expanded.value = true
    }

    return {
      expanded,
      childTotal,
      isSelected,
      isTemplate,
      displayName,
      iconName,
      toggle,
      onHeadClick
    }
  }
})
</script>

<style lang="scss" scoped>
// Same carve-the-pit language as LabelSquares, tinted to the skeleton
// family color (#5b6c82) instead of the label teal.
.skeleton-square {
  --depth: 0;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: 9px;
  background: var(--paper-card, #ffffff);
  box-shadow: 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  overflow: hidden;
  flex: 0 1 auto;
  min-width: 150px;
  max-width: 100%;
  transition: border-color 0.12s, box-shadow 0.12s, flex-basis 0.15s;

  &.is-expanded { flex-basis: 100%; }

  &.is-selected {
    border-color: rgba(91, 108, 130, 0.85);
    box-shadow: 0 0 0 2px rgba(91, 108, 130, 0.22), 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  }
}

.skeleton-square__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  cursor: pointer;
  user-select: none;

  &:hover { background: rgba(91, 108, 130, 0.08); }
}

.skeleton-square__toggle {
  color: rgba(var(--ink-rgb), 0.45);
  cursor: pointer;
  flex-shrink: 0;
  &:hover { color: #5b6c82; }
}

.skeleton-square__kind {
  color: #5b6c82;
  flex-shrink: 0;
}

.skeleton-square__name {
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

.is-selected > .skeleton-square__head .skeleton-square__name { color: #5b6c82; }

.skeleton-square__sys { color: #5b6c82; opacity: 0.75; flex-shrink: 0; }

.skeleton-square__count {
  font-family: 'Space Mono', monospace;
  font-size: 0.68em;
  color: rgba(var(--ink-rgb), 0.5);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
  flex-shrink: 0;
}

.skeleton-square__pit {
  margin: 0 7px 7px;
  padding: 8px;
  border-radius: 7px;
  background: rgba(var(--ink-rgb), calc(0.04 + var(--depth) * 0.022));
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), calc(0.14 + var(--depth) * 0.03)),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);
}
</style>
