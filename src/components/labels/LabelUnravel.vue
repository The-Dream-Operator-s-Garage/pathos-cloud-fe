<template>
  <!-- THE UNRAVEL VIEWER (2026-10-07, user ask: "take that recursive
       unraveling viewer [the /labels/:id page's] and … implement it onto the
       mini viewers for labels … at the flyout viewers or the side viewer").
       LabelDetailPage's body, lifted out whole: the ancestry recovered on
       mount, an UNRAVEL bar that re-roots the squares one parent up (the
       previous view lands carved INSIDE the parent square) or wraps back
       down, and `LabelSquares` in its GLASS form — every square and every
       pit a translucent coat, so each level dug inward stacks one more coat
       and the background darkens with depth.
       The page itself stays (not deleted, the ask) but nothing new routes
       to it from here: this viewer is where a label is unravelled now. -->
  <div class="label-unravel">
    <div class="label-unravel__bar">
      <button
        v-if="canUnravel"
        type="button"
        class="label-unravel__btn"
        :title="`Wrap the view inside ${nextParentName}`"
        @click.stop.prevent="unravelOut"
      >
        <q-icon name="unfold_more" size="13px" />
        <span class="label-unravel__btn-word">unravel</span>
        <span class="label-unravel__btn-name">{{ nextParentName }}</span>
      </button>
      <span v-else-if="chain.length" class="label-unravel__root">
        <q-icon name="flag" size="12px" /> at the root
      </span>
      <q-space />
      <button
        v-if="outSteps > 0"
        type="button"
        class="label-unravel__btn label-unravel__btn--back"
        title="Wrap back down toward this label"
        @click.stop.prevent="wrapBack"
      >
        <q-icon name="unfold_less" size="13px" />
        <span class="label-unravel__btn-word">wrap back</span>
      </button>
    </div>

    <div ref="well" class="label-unravel__well">
      <div v-if="loading" class="label-unravel__loading">
        <q-spinner-dots size="14px" /> recovering ancestry…
      </div>
      <LabelSquares
        v-else-if="displayedRoot"
        :key="displayedRoot.id"
        :label="displayedRoot"
        :depth="0"
        :selected-id="selectedId"
        :expand-ids="expandIds"
        glass
        @select="onSelect"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { recoverAncestry } from 'src/utils/labelChain'
import LabelSquares from 'src/components/labels/LabelSquares.vue'

export default defineComponent({
  name: 'LabelUnravel',
  components: { LabelSquares },
  props: {
    // { id, path, name, ancestor_id, … } — the label being viewed.
    label: { type: Object, required: true }
  },
  setup (props) {
    const chain = ref([]) // [root, …, label]
    const loading = ref(true)
    // How many ancestor levels are unravelled around the label (0 = the
    // label itself is the outermost square) — LabelDetailPage's dial.
    const outSteps = ref(0)
    const selectedId = ref(props.label.id)

    const load = async () => {
      loading.value = true
      outSteps.value = 0
      selectedId.value = props.label.id
      const c = await recoverAncestry(props.label)
      chain.value = c.length ? c : [props.label]
      loading.value = false
    }
    onMounted(load)
    watch(() => props.label.id, load)

    const rootIdx = computed(() => Math.max(chain.value.length - 1 - outSteps.value, 0))
    const displayedRoot = computed(() => chain.value[rootIdx.value] || null)
    // Everything between the displayed root and the label stays dug open,
    // so the label is always visible at the bottom of the pit.
    const expandIds = computed(() => chain.value.slice(rootIdx.value).map(l => l.id))

    const canUnravel = computed(() => rootIdx.value > 0)
    const nextParentName = computed(() =>
      canUnravel.value ? chain.value[rootIdx.value - 1].name : '')

    // Keep the label in sight: a re-root digs the new outer square's sons
    // open asynchronously (one children read per level), and a broad parent
    // — SLOT holds ~180 — pushes the label far below the fold. Wait for the
    // lit square to mount, then bring it to the well's view.
    const well = ref(null)
    let seek = null
    const reveal = () => {
      clearInterval(seek)
      let tries = 0
      seek = setInterval(() => {
        const lit = well.value?.querySelector('.label-square.is-selected')
        if (lit || ++tries > 20) {
          clearInterval(seek)
          if (lit) setTimeout(() => lit.scrollIntoView({ block: 'nearest' }), 250)
        }
      }, 150)
    }
    onBeforeUnmount(() => clearInterval(seek))

    const unravelOut = () => { if (canUnravel.value) { outSteps.value++; reveal() } }
    const wrapBack = () => { if (outSteps.value > 0) { outSteps.value--; reveal() } }
    const onSelect = (l) => { selectedId.value = l?.id ?? null }

    return {
      well,
      chain,
      loading,
      outSteps,
      selectedId,
      displayedRoot,
      expandIds,
      canUnravel,
      nextParentName,
      unravelOut,
      wrapBack,
      onSelect
    }
  }
})
</script>

<style lang="scss" scoped>
// Fills whatever height its host hands it (the label Mini's body in a
// window / the side viewer); the well below the bar is the one scroller.
.label-unravel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  text-align: left;
}

.label-unravel__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--panel-rule, rgba(33, 33, 33, 0.22));
}

// The bar in the label pill's two tones (`--mini-accent` red-7 / `--mini-ink`
// red-10), like the Mini's old slider — the page's teal does not travel.
.label-unravel__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 2px 9px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--mini-accent, #e53935) 40%, transparent);
  background: color-mix(in srgb, var(--mini-accent, #e53935) 8%, transparent);
  color: var(--mini-ink, #b71c1c);
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: color-mix(in srgb, var(--mini-accent, #e53935) 16%, transparent);
    border-color: color-mix(in srgb, var(--mini-accent, #e53935) 60%, transparent);
  }

  &--back {
    border-color: rgba(var(--ink-rgb), 0.25);
    background: rgba(var(--ink-rgb), 0.05);
    color: rgba(var(--ink-rgb), 0.7);
    &:hover {
      background: rgba(var(--ink-rgb), 0.1);
      border-color: rgba(var(--ink-rgb), 0.4);
    }
  }
}

.label-unravel__btn-word { opacity: 0.7; flex-shrink: 0; }
.label-unravel__btn-name {
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// The root keeps its flag in the carved gold — the chain's origin mark.
.label-unravel__root {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72em;
  font-style: italic;
  color: #c79a00;
}

.label-unravel__well {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px;
  scrollbar-width: thin;
}

.label-unravel__loading {
  font-size: 0.78em;
  color: #5b6c82;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
