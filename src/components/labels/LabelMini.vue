<template>
  <!-- LabelMini. Same MiniPanel chrome as the rest of the family; the body
       is a HORIZONTAL ancestry slider (the same gesture as the LabelSlider /
       LabelViewer chips on the node viewer): the full chain is recovered
       recursively on mount and rendered root › … › this, one chip per
       ancestor, scrolling sideways when it overflows. Every chip routes to
       that label's viewer; the current label is highlighted. -->
  <MiniPanel :to="targetRoute">
    <template #title>
      <q-icon name="label_important" size="13px" class="q-mr-xs label-mini__icon" />
      {{ effectiveTitle }}
    </template>

    <template #chips>
      <span v-if="label.author_id != null" class="mini-chip-fact">
        <q-icon name="person" size="11px" class="q-mr-xs" />
        author #{{ label.author_id }}
      </span>
      <span v-if="label.system_label" class="mini-chip-kind">
        <q-icon name="verified" size="11px" class="q-mr-xs" />
        system
      </span>
    </template>

    <template #hash>
      <LabelMicro :id="label.id" :path="label.path" :show-type="true" :nav="false" />
    </template>

    <template #body>
      <div v-if="loadingChain" class="label-mini__loading">
        <q-spinner-dots size="14px" /> recovering ancestry…
      </div>

      <div v-else-if="chain.length" class="label-mini__slider">
        <template v-for="(step, i) in chain" :key="step.id">
          <q-icon v-if="i > 0" name="chevron_right" size="11px" class="label-mini__sep" />
          <span
            class="label-mini__step"
            :class="{ 'is-current': step.id === label.id, 'is-root': i === 0 }"
            :title="step.path"
            @click.prevent.stop="goTo(step)"
          >
            <q-icon v-if="i === 0" name="flag" size="10px" class="q-mr-xs" />
            {{ step.name }}
          </span>
        </template>
      </div>

      <div v-else class="label-mini__root">
        <q-icon name="flag" size="11px" class="q-mr-xs" /> root label
      </div>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import LabelMicro from './LabelMicro.vue'
import { recoverAncestry } from 'src/utils/labelChain'

export default defineComponent({
  name: 'LabelMini',
  components: { MiniPanel, LabelMicro },
  props: {
    // Label shape: { id, path, name|text, ancestor_id, author_id, system_label }
    label: { type: Object, required: true },
    to: { type: String, default: null }
  },
  setup (props) {
    const router = useRouter()

    const targetRoute = computed(() => props.to || `/labels/${props.label.id}`)

    const effectiveTitle = computed(() =>
      props.label.name || props.label.text || `Label #${props.label.id}`
    )

    const chain = ref([]) // [root, ..., this label]
    const loadingChain = ref(false)

    const loadChain = async () => {
      loadingChain.value = true
      chain.value = await recoverAncestry(props.label)
      loadingChain.value = false
    }

    onMounted(loadChain)
    watch(() => props.label.id, loadChain)

    const goTo = (step) => { if (step?.id) router.push(`/labels/${step.id}`) }

    return { targetRoute, effectiveTitle, chain, loadingChain, goTo }
  }
})
</script>

<style lang="scss" scoped>
.label-mini__icon { color: #00829c; vertical-align: middle; }

.label-mini__slider {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;
  padding: 2px 1px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.label-mini__step {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 9px;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  background: rgba(var(--ink-rgb), 0.05);
  color: #5b6c82;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s, border-color 0.12s;

  &:hover {
    background: rgba(0, 130, 156, 0.10);
    border-color: rgba(0, 130, 156, 0.35);
    color: #00829c;
  }

  &.is-current {
    background: rgba(0, 130, 156, 0.12);
    border-color: rgba(0, 130, 156, 0.45);
    color: #00829c;
    font-weight: 700;
  }

  &.is-root .q-icon { color: #c79a00; }
}

.label-mini__sep {
  color: rgba(var(--ink-rgb), 0.35);
  flex-shrink: 0;
}

.label-mini__loading {
  font-size: 0.78em;
  color: #8995a8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-mini__root {
  font-size: 0.78em;
  color: #00829c;
  display: inline-flex;
  align-items: center;
  font-style: italic;
}

.mini-chip-fact, .mini-chip-kind {
  display: inline-flex;
  align-items: center;
}

.mini-chip-kind {
  background: rgba(0, 130, 156, 0.08);
  border: 1px solid rgba(0, 130, 156, 0.25);
  color: #00829c;
  padding: 1px 7px;
  border-radius: 9px;
}
</style>
