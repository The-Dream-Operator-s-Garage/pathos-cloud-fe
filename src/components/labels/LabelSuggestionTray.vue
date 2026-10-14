<template>
  <!-- TALAVERO'S LABEL SUGGESTIONS (2026-10-14, user ask: "Whenever a node
       is uploaded, prompt the agent suggesting labels, letting them unravel
       them on a tiny unraveler right there when the user decides to accept
       them or not. each must be drawn alongside with an 'x' to discard").
       One row per fresh upload of this sitting: the node's nano chip, then
       Talavero's suggestions — each a TINY UNRAVELER (the leaf as a red
       square; every click wraps it inside one more parent, deeper = darker,
       the LabelUnravel grammar at pill size) + ✓ accept + × discard. -->
  <div v-if="entries.length" class="lsug">
    <div v-for="e in entries" :key="e.id" class="lsug__row">
      <MicroChip kind="nodes" :id="e.id" :path="e.path" :type-icon="e.icon" collapsed />
      <span class="lsug__who" title="Talavero classifies every upload into his public label trees">
        <q-icon name="label" size="11px" /> talavero
      </span>
      <span v-if="e.waiting && !e.items.length" class="lsug__wait">
        <q-spinner-dots size="12px" /> looking…
      </span>
      <span v-else-if="e.failed && !e.items.length" class="lsug__wait lsug__wait--failed">
        <q-icon name="error_outline" size="12px" />
        {{ e.failed === 'timeout' ? 'no answer yet' : 'couldn\'t look' }}
        <button type="button" class="lsug__retry" title="Ask Talavero again" @click.stop="store.retry(e.id)">retry</button>
      </span>
      <span v-else-if="!e.items.length" class="lsug__wait">nothing to suggest</span>
      <span
        v-for="s in e.items"
        :key="s.id"
        class="lsug__item"
        :class="{ 'is-busy': s.busy }"
        :title="s.reason || s.chain.map(c => c.name).join(' › ')"
      >
        <button
          type="button"
          class="lsug__unravel"
          :aria-label="`Unravel ${s.label.name}`"
          @click.stop="step(s)"
        >
          <TinySquares :chain="s.chain" :out="outOf(s)" />
          <q-icon
            :name="outOf(s) >= s.chain.length - 1 ? 'unfold_less' : 'unfold_more'"
            size="11px"
            class="lsug__dial"
          />
        </button>
        <button
          type="button"
          class="lsug__act lsug__act--yes"
          :aria-label="`Accept ${s.label.name}`"
          title="Accept: attach this label"
          :disabled="s.busy"
          @click.stop="store.decide(e.id, s.id, true)"
        >
          <q-icon name="check" size="11px" />
        </button>
        <button
          type="button"
          class="lsug__act lsug__act--no"
          :aria-label="`Discard ${s.label.name}`"
          title="Discard this suggestion"
          :disabled="s.busy"
          @click.stop="store.decide(e.id, s.id, false)"
        >
          <q-icon name="close" size="11px" />
        </button>
      </span>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, reactive, h } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import { useLabelSuggestionsStore } from 'src/stores/labelSuggestions'

// The chain's last `out + 1` names, nested outermost-first: each level a
// square holding the next, the leaf innermost and deepest-coated.
const TinySquares = defineComponent({
  name: 'TinySquares',
  props: {
    chain: { type: Array, required: true }, // [root … leaf] {id,name}
    out: { type: Number, default: 0 }
  },
  setup (props) {
    return () => {
      const shown = props.chain.slice(Math.max(0, props.chain.length - 1 - props.out))
      let inner = null
      for (let i = shown.length - 1; i >= 0; i--) {
        const depth = i
        inner = h('span', { class: ['tsq', `tsq--d${Math.min(depth, 4)}`, { 'tsq--leaf': i === shown.length - 1 }] }, [
          h('span', { class: 'tsq__name' }, shown[i].name),
          inner
        ])
      }
      return inner
    }
  }
})

export default defineComponent({
  name: 'LabelSuggestionTray',
  components: { MicroChip, TinySquares },
  props: {
    // Limit the tray to these node ids (a dock's own uploads); null = all.
    nodeIds: { type: Array, default: null }
  },
  setup (props) {
    const store = useLabelSuggestionsStore()
    store.listen()
    const entries = computed(() => store.entriesFor(props.nodeIds))

    // suggestion id → how many parents are unravelled around the leaf.
    const outs = reactive({})
    const outOf = (s) => outs[s.id] || 0
    const step = (s) => {
      const max = s.chain.length - 1
      outs[s.id] = outOf(s) >= max ? 0 : outOf(s) + 1
    }

    return { store, entries, outOf, step }
  }
})
</script>

<style lang="scss" scoped>
.lsug {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--dock-rule, rgba(var(--ink-rgb), 0.15));
  max-height: 140px;
  overflow-y: auto;
  flex-shrink: 0;
}
.lsug__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
}
.lsug__who {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.62em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--red-7);
}
.lsug__wait {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68em;
  color: var(--dock-ink-mute, rgba(var(--ink-rgb), 0.55));
}
.lsug__wait--failed { color: var(--red-9); }
.lsug__retry {
  border: 1px solid var(--red-3);
  border-radius: 3px;
  background: #fff;
  padding: 0 5px;
  font: inherit;
  color: var(--red-9);
  cursor: pointer;
  &:hover { background: var(--red-1); }
}
.lsug__item {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  border: 1px solid var(--red-3);
  border-radius: 4px;
  background: #fff;
  padding: 1px;
  &.is-busy { opacity: 0.5; }
}
.lsug__unravel {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
}
.lsug__dial { color: var(--red-7); opacity: 0.7; }
.lsug__act {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 3px;
  background: none;
  cursor: pointer;
  color: rgba(var(--ink-rgb), 0.55);
  &:disabled { cursor: default; }
}
.lsug__act--yes:hover:not(:disabled) { background: var(--teal-1); color: var(--teal-9); }
.lsug__act--no:hover:not(:disabled) { background: var(--red-1); color: var(--red-9); }

// The tiny squares: each level a red glass square holding the next —
// one more coat per level, so the leaf sits deepest.
:deep(.tsq) {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 3px;
  min-height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(229, 57, 53, 0.35);
  background: rgba(229, 57, 53, 0.06);
  font-size: 0.62em;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.3;
  color: var(--red-9);
  white-space: nowrap;
}
:deep(.tsq--d1) { background: rgba(229, 57, 53, 0.12); }
:deep(.tsq--d2) { background: rgba(229, 57, 53, 0.18); }
:deep(.tsq--d3), :deep(.tsq--d4) { background: rgba(229, 57, 53, 0.24); }
:deep(.tsq .tsq) { font-size: 1em; }
:deep(.tsq--leaf) { border-color: var(--red-7); }
</style>
