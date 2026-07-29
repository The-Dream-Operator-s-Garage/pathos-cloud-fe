<template>
  <!-- Label Micro with horizontal ancestry navigation — the same slider
       gesture as LabelViewer (node viewer label chips), shrunk to Micro
       scale. Collapsed it's the plain `icon / label / hash` chip. The left
       chevron recovers the ancestry chain (recursive walk, lazy on first
       click) and steps UP toward the root; the right chevron steps back
       down and finally collapses. The chip always shows the label at the
       cursor, so its hash, route, and tooltip all swap as you slide. -->
  <span v-if="nav" class="label-micro-nav" :class="{ expanded }">
    <button
      v-if="showLeft"
      class="lmn-arrow"
      :title="leftTitle"
      @click.prevent.stop="onLeft"
    >
      <q-icon name="chevron_left" size="10px" />
    </button>

    <span v-if="expanded && current" class="lmn-name" :title="current.path">
      {{ current.name }}
    </span>

    <MicroChip
      kind="labels"
      :id="currentId"
      :path="currentPath"
      :hash-str="expanded ? '' : hashStr"
      :show-type="showType"
      :icon-size="iconSize"
      :full-address="fullAddress"
    />

    <button
      v-if="expanded"
      class="lmn-arrow"
      :title="rightTitle"
      @click.prevent.stop="onRight"
    >
      <q-icon name="chevron_right" size="10px" />
    </button>
  </span>

  <MicroChip
    v-else
    kind="labels"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :full-address="fullAddress"
  />
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import { recoverAncestry } from 'src/utils/labelChain'

export default defineComponent({
  name: 'LabelMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    fullAddress: { type: String, default: '' },
    // Horizontal ancestry navigation (chevrons). Off where a static chip
    // is wanted (e.g. inside LabelMini, which carries its own slider).
    nav: { type: Boolean, default: true }
  },
  setup (props) {
    // chain[0] = this label, chain[1] = parent, ... (reversed server order)
    const chain = ref([])
    const cursor = ref(0)
    const expanded = ref(false)
    const loaded = ref(false)

    const current = computed(() => chain.value[cursor.value] || null)
    const currentId = computed(() =>
      expanded.value && current.value ? current.value.id : props.id
    )
    const currentPath = computed(() =>
      expanded.value && current.value ? current.value.path : props.path
    )

    const hasDeeper = computed(() => !!chain.value[cursor.value + 1])

    // Before the chain is recovered we can't know whether an ancestor
    // exists, so the left chevron stays visible until proven root.
    const showLeft = computed(() => !loaded.value || hasDeeper.value)

    const leftTitle = computed(() => {
      if (!expanded.value) return 'Show ancestry'
      const next = chain.value[cursor.value + 1]
      return next ? `Step up to: ${next.name}` : 'Already at root'
    })
    const rightTitle = computed(() =>
      cursor.value === 0 ? 'Contract' : 'Step back down'
    )

    const onLeft = async () => {
      if (!loaded.value) {
        const recovered = await recoverAncestry(props.id)
        chain.value = [...recovered].reverse()
        loaded.value = true
        if (chain.value.length <= 1) return // root — nothing to slide to
        expanded.value = true
        return
      }
      if (!expanded.value) { expanded.value = true; return }
      if (hasDeeper.value) cursor.value++
    }

    const onRight = () => {
      if (cursor.value > 0) cursor.value--
      else expanded.value = false
    }

    return {
      expanded,
      current,
      currentId,
      currentPath,
      showLeft,
      leftTitle,
      rightTitle,
      onLeft,
      onRight
    }
  }
})
</script>

<style lang="scss" scoped>
.label-micro-nav {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  vertical-align: middle;

  &.expanded {
    background: rgba(0, 130, 156, 0.07);
    border-radius: 6px;
    padding: 1px 2px;
  }
}

.lmn-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 15px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.10);
  color: rgba(var(--ink-rgb), 0.65);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: rgba(0, 130, 156, 0.22);
    color: #00829c;
  }
}

.lmn-name {
  font-family: 'Space Mono', monospace;
  font-size: 0.68em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #00829c;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
