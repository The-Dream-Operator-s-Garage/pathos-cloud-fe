<template>
  <!-- THE LABEL MINI — the face a label wears wherever it is quoted. The
       body is a HORIZONTAL ancestry slider (the LabelSlider / LabelViewer
       gesture): the chain recovered on mount, root › … › this, one step per
       ancestor, scrolling sideways when it overflows; every step routes to
       that label's viewer and the current one is lit.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "take as layout
       the node mini viewer … use the nano pills icons and coloring to
       re-color all the other ones"). It was the default STACK head (icon +
       name / author # + system / the chip, 66px) and its slider was still
       drawn in `#00829c` — the teal the label CHIPS left on 2026-09-21 for
       the labels button's red. NodeMini's grammar now, in the label pill's
       red:
         HEAD  chip+copy │ label name │ open        (MiniHead)
         BODY  the ancestry slider, lit in red-7 / lettered in red-10
         FOOT  🏷 by allegue · system · depth 3      (MiniFoot)
       ⭐ 2026-10-07 — `unravel` (the flyout + side viewer faces, via
       ElementMini `fill`): the body is the UNRAVEL VIEWER (LabelUnravel —
       the /labels/:id page's squares, in glass) at the host's full height,
       and the panel is no link: a click inside digs, it does not leave. -->
  <MiniPanel kind="labels" :to="unravel ? null : targetRoute">
    <template #head>
      <MiniHead
        kind="labels"
        :id="label.id"
        :path="label.path"
        :integrity="label.integrity || null"
        :name="effectiveTitle"
      />
    </template>

    <template #body>
      <LabelUnravel v-if="unravel" :label="label" />

      <div v-else-if="loadingChain" class="label-mini__loading">
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

    <template v-if="footFacts.length" #foot>
      <MiniFoot kind="labels" :facts="footFacts" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import LabelUnravel from 'src/components/labels/LabelUnravel.vue'
import { recoverAncestry } from 'src/utils/labelChain'
import { entitySummary } from 'src/utils/entityDisplay'

export default defineComponent({
  name: 'LabelMini',
  components: { MiniPanel, MiniHead, MiniFoot, LabelUnravel },
  props: {
    // Label shape: { id, path, name|text, ancestor_id, author_id, system_label }
    label: { type: Object, required: true },
    to: { type: String, default: null },
    // The unravel viewer as the body, filling the host (see the note above).
    unravel: { type: Boolean, default: false }
  },
  setup (props) {
    const router = useRouter()

    const targetRoute = computed(() => props.to || `/labels/${props.label.id}`)

    const effectiveTitle = computed(() =>
      props.label.name || props.label.text || `label #${props.label.id}`
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

    // ── the foot: who made it, whether the platform owns it, how deep ────
    const author = ref('')
    watchEffect(() => {
      const id = props.label.author_id
      if (id == null) { author.value = ''; return }
      entitySummary({ id }).then((s) => { author.value = s?.primary || `#${id}` })
    })
    const footFacts = computed(() => [
      author.value && `by ${author.value}`,
      props.label.system_label && 'system',
      chain.value.length > 1 ? `depth ${chain.value.length - 1}` : (chain.value.length === 1 ? 'root' : '')
    ].filter(Boolean))

    return { targetRoute, effectiveTitle, chain, loadingChain, goTo, footFacts }
  }
})
</script>

<style lang="scss" scoped>
// The slider in the LABEL PILL's colours: `--mini-accent` (red-7, the pill's
// glyph) washes the lit step and the pointer's, `--mini-ink` (red-10, the
// pill's text) letters them. `color-mix` keeps the washes one declaration
// each off the two panel tones (was a hard `rgba(0, 130, 156, …)` teal).
.label-mini__slider {
  display: flex;
  align-items: center;
  // Centred like every family body — but SAFE: a plain `center` on an
  // overflowing row pushes the root off the scrollable start, where no
  // scroll can reach it. Engines without `safe` keep the old flush start.
  justify-content: flex-start;
  justify-content: safe center;
  gap: 3px;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;
  padding: 2px 4px;
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
  background: rgba(255, 255, 255, 0.45);
  color: #5b6c82;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s, border-color 0.12s;

  &:hover {
    background: color-mix(in srgb, var(--mini-accent, #e53935) 10%, transparent);
    border-color: color-mix(in srgb, var(--mini-accent, #e53935) 40%, transparent);
    color: var(--mini-ink, #b71c1c);
  }

  &.is-current {
    background: color-mix(in srgb, var(--mini-accent, #e53935) 14%, transparent);
    border-color: color-mix(in srgb, var(--mini-accent, #e53935) 50%, transparent);
    color: var(--mini-ink, #b71c1c);
    font-weight: 700;
  }

  // The root keeps its flag in the carved gold — the chain's origin mark.
  &.is-root .q-icon { color: #c79a00; }
}

.label-mini__sep {
  color: rgba(var(--ink-rgb), 0.35);
  flex-shrink: 0;
}

.label-mini__loading {
  font-size: 0.78em;
  color: #5b6c82;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-mini__root {
  font-size: 0.78em;
  color: var(--mini-ink, #b71c1c);
  display: inline-flex;
  align-items: center;
  font-style: italic;
}
</style>
