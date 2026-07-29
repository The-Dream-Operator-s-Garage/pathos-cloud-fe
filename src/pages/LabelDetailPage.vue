<template>
  <q-page class="bg-base label-page">
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner color="primary" size="36px" />
    </div>

    <div v-else-if="!label" class="text-center q-py-xl text-dim">
      <q-icon name="error_outline" size="40px" style="opacity:.3;" />
      <div class="q-mt-sm" style="font-size:0.85em;">Label not found.</div>
    </div>

    <div v-else class="label-grid">

      <!-- ══════════════════════════════════════════════════════════
           LEFT — subject panel (mirrors NodeDetailPage: identity
           header, meta strip, body). The body hosts the same squares
           viewer as /labels, rooted at this label and unravelable
           both ways: dig inward through the sons, or unravel outward
           so each parent carves a square AROUND the current view.
      ══════════════════════════════════════════════════════════ -->
      <main class="subject-panel">

        <header class="subject-panel__ident">
          <div class="subject-panel__titlebar">
            <q-icon name="label_important" size="22px" class="subject-panel__title-icon" />
            <span class="vsep" aria-hidden="true" />
            <div class="subject-panel__title nasalization">
              {{ label.name }} · label #{{ label.id }}
            </div>
            <ElementActions
              target-type="label"
              :source-id="label.id"
              :source-owner-id="label.owner_id"
              :source-name="label.name"
              :source-is-system-label="!!label.system_label"
              @updated="onLabelUpdated"
            />
          </div>

          <div class="subject-panel__chips">
            <span v-if="label.system_label" class="ident-chip ident-chip--system">
              <q-icon name="verified" size="12px" class="q-mr-xs" /> system
            </span>
            <span v-if="label.owner_id != null" class="ident-chip">
              <q-icon name="person" size="12px" class="q-mr-xs" /> owner #{{ label.owner_id }}
            </span>
            <span v-if="chain.length > 1" class="ident-chip" :title="`ancestry depth ${chain.length - 1}`">
              <q-icon name="stairs" size="12px" class="q-mr-xs" />
              generation {{ chain.length }}
            </span>
            <span v-else class="ident-chip ident-chip--root">
              <q-icon name="flag" size="12px" class="q-mr-xs" /> root label
            </span>
          </div>
        </header>

        <!-- Meta strip — id + on-disk path, copyable without leaving. -->
        <div class="subject-panel__meta">
          <q-icon name="label" size="14px" class="meta-icon" />
          <div class="meta-label">
            <strong>label #{{ label.id }}</strong>
            <span class="meta-typename">({{ label.system_label ? 'system' : 'custom' }})</span>
          </div>
          <span v-if="label.created_at" class="meta-created">{{ formatDate(label.created_at) }}</span>
          <q-space />
          <span class="meta-hash mono" :title="label.path">{{ label.path }}</span>
          <q-btn
            flat dense size="sm" icon="content_copy"
            :ripple="false"
            :title="copied ? 'Copied!' : 'Copy path'"
            class="meta-btn"
            @click="copyPath"
          />
          <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
        </div>

        <!-- Body — the diggable/unravelable family view -->
        <div class="subject-panel__body">

          <!-- Unravel bar: step outward through the recovered ancestry.
               Each unravel re-roots the squares one parent up, so the
               previous view ends up carved INSIDE the parent square. -->
          <div class="unravel-bar">
            <button
              v-if="canUnravel"
              class="unravel-btn"
              :title="`Wrap the view inside ${nextParentName}`"
              @click="unravelOut"
            >
              <q-icon name="unfold_more" size="13px" class="q-mr-xs" />
              unravel outside — {{ nextParentName }}
            </button>
            <span v-else class="unravel-root">
              <q-icon name="flag" size="12px" class="q-mr-xs" /> fully unraveled — at the root
            </span>

            <q-space />

            <button
              v-if="outSteps > 0"
              class="unravel-btn unravel-btn--back"
              title="Wrap back down toward this label"
              @click="wrapBack"
            >
              <q-icon name="unfold_less" size="13px" class="q-mr-xs" />
              wrap back
            </button>
          </div>

          <div class="subject-panel__body-card">
            <div class="squares-scroll">
              <LabelSquares
                v-if="displayedRoot"
                :key="displayedRoot.id"
                :label="displayedRoot"
                :depth="0"
                :selected-id="selectedLabel?.id ?? null"
                :expand-ids="expandIds"
                @select="onSelect"
              />
            </div>
          </div>
        </div>
      </main>

      <!-- ══════════════════════════════════════════════════════════
           RIGHT — usages of whichever label is selected in the
           squares (starts as the viewed label itself).
      ══════════════════════════════════════════════════════════ -->
      <aside class="label-side">
        <LabelUsages :label="selectedLabel" />
        <div v-if="surroundSections" class="label-surround q-pa-sm">
          <ElementSurround
            :sections="surroundSections"
            :show-labels="false"
          />
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { labelService } from 'src/services/label.service'
import { recoverAncestry } from 'src/utils/labelChain'
import { useStateHolder } from 'src/composables/useStateHolder'
import { hashOf } from 'src/utils/kinds'
import ElementActions from 'src/components/maker/ElementActions.vue'
import LabelSquares from 'src/components/labels/LabelSquares.vue'
import LabelUsages from 'src/components/labels/LabelUsages.vue'
import ElementSurround from 'src/components/shared/ElementSurround.vue'
import { useElementSurround } from 'src/composables/useElementSurround'

export default defineComponent({
  name: 'LabelDetailPage',
  components: { ElementActions, LabelSquares, LabelUsages, ElementSurround },
  setup () {
    const route = useRoute()

    const label = ref(null)
    const chain = ref([]) // [root, ..., label] via recursive ancestral recovery
    const loading = ref(true)
    const copied = ref(false)

    // How many ancestor levels are unraveled around the label.
    // 0 = the label itself is the outermost square.
    const outSteps = ref(0)

    const selectedLabel = ref(null)

    // Skeleton-grounded surround off the label's ELEMENT skeleton.
    const {
      sections: surroundSections,
      load: loadSurround
    } = useElementSurround(() => {
      const pth = label.value?.path
      return pth ? `labels/${pth.split('/').pop()}` : null
    })

    const formatDate = (ts) => ts ? new Date(ts).toLocaleString() : '—'

    // Index in `chain` of the square currently rendered outermost.
    const rootIdx = computed(() => Math.max(chain.value.length - 1 - outSteps.value, 0))
    const displayedRoot = computed(() => chain.value[rootIdx.value] || label.value)

    // Everything between the displayed root and the viewed label stays
    // dug open, so the label is always visible at the bottom of the pit.
    const expandIds = computed(() => chain.value.slice(rootIdx.value).map(l => l.id))

    const canUnravel = computed(() => rootIdx.value > 0)
    const nextParentName = computed(() =>
      canUnravel.value ? chain.value[rootIdx.value - 1].name : ''
    )

    const unravelOut = () => { if (canUnravel.value) outSteps.value++ }
    const wrapBack = () => { if (outSteps.value > 0) outSteps.value-- }

    const onSelect = (l) => { selectedLabel.value = l }

    const copyPath = () => {
      if (!label.value?.path) return
      navigator.clipboard.writeText(label.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    const onLabelUpdated = (updated) => {
      if (updated?.id) {
        label.value = { ...label.value, ...updated }
        if (selectedLabel.value?.id === updated.id) {
          selectedLabel.value = { ...selectedLabel.value, ...updated }
        }
      }
    }

    // StateHolder — approximate scroll + return halo for usages followed
    // out of this label.
    const holder = useStateHolder({}, { targetType: 'label' })

    const loadFromRoute = async () => {
      loading.value = true
      label.value = null
      chain.value = []
      outSteps.value = 0
      selectedLabel.value = null

      const id = parseInt(route.params.id)
      if (!id) { loading.value = false; return }

      try {
        const res = await labelService.get(id)
        if (res.success) {
          label.value = res.label
          selectedLabel.value = res.label
          chain.value = await recoverAncestry(res.label)
          if (!chain.value.length) chain.value = [res.label]
          holder.describe({
            title: `Label ${res.label.name}`,
            hash: hashOf(res.label.path || ''),
            targetType: 'label',
            targetId: id
          })
        }
      } catch (_) { /* not-found state renders */ }
      loading.value = false
      loadSurround()
      await holder.restore()
    }

    onMounted(loadFromRoute)
    watch(() => route.params.id, loadFromRoute)

    return {
      surroundSections,
      label,
      chain,
      loading,
      copied,
      outSteps,
      displayedRoot,
      expandIds,
      canUnravel,
      nextParentName,
      unravelOut,
      wrapBack,
      selectedLabel,
      onSelect,
      formatDate,
      copyPath,
      onLabelUpdated
    }
  }
})
</script>

<style lang="scss" scoped>
.label-page {
  padding: 16px 10px 0;
}

// Two-column grid — same proportions as the node viewer so the two
// detail pages read as one family.
.label-grid {
  display: grid;
  grid-template-columns: minmax(0, 70fr) minmax(0, 30fr);
  gap: 12px;
  align-items: stretch;
}

.label-side { min-width: 0; }

@media (max-width: 1023px) {
  .label-grid { grid-template-columns: minmax(0, 1fr); }
}

// ── Subject panel — same token palette + zone names as the node viewer ──
.subject-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
  min-width: 0;
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.subject-panel__ident {
  padding: 8px 12px 6px;
  background: var(--panel-chrome);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.subject-panel__titlebar {
  display: flex;
  align-items: stretch;
  gap: 10px;
  border-bottom: 1px solid var(--panel-rule);
  margin: 0 -12px;
  padding: 0 12px 6px;
}

.subject-panel__title-icon {
  color: #00829c;
  flex-shrink: 0;
  align-self: center;
}

.subject-panel__title {
  font-size: 1.25em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  text-transform: uppercase;
}

.vsep {
  flex: 0 0 1px;
  width: 1px;
  background: var(--panel-rule);
  align-self: stretch;
  margin-top: -8px;
  margin-bottom: -6px;
}

.subject-panel__chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ident-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: rgba(var(--ink-rgb), 0.05);
  color: var(--panel-ink-2);
  font-size: 0.78em;

  &--system {
    background: rgba(0, 130, 156, 0.08);
    border-color: rgba(0, 130, 156, 0.3);
    color: #00829c;
  }

  &--root {
    color: #c79a00;
    border-color: rgba(199, 154, 0, 0.35);
    background: rgba(199, 154, 0, 0.07);
  }
}

.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;

  .meta-icon  { color: var(--panel-ink-2); }
  .meta-label {
    color: var(--panel-ink-2);
    white-space: nowrap;
    strong { color: var(--panel-ink-1); }
  }
  .meta-typename { color: var(--panel-ink-mute); margin-left: 4px; }
  .meta-created  { color: var(--panel-ink-mute); font-size: 0.9em; }
  .meta-hash {
    font-size: 0.86em;
    color: var(--panel-ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
  }
  .meta-btn {
    color: var(--panel-ink-2);
    &:hover { color: var(--coral-deep); }
  }
}

.subject-panel__body {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome);
  padding: 8px;
  gap: 8px;
}

// ── Unravel bar — outward navigation through the ancestry ──
.unravel-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.unravel-btn {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 130, 156, 0.35);
  background: rgba(0, 130, 156, 0.07);
  color: #00829c;
  font-family: 'Space Mono', monospace;
  font-size: 0.74em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: rgba(0, 130, 156, 0.14);
    border-color: rgba(0, 130, 156, 0.55);
  }

  &--back {
    border-color: rgba(var(--ink-rgb), 0.25);
    background: rgba(var(--ink-rgb), 0.05);
    color: var(--panel-ink-2);

    &:hover {
      background: rgba(var(--ink-rgb), 0.10);
      border-color: rgba(var(--ink-rgb), 0.4);
    }
  }
}

.unravel-root {
  display: inline-flex;
  align-items: center;
  font-size: 0.74em;
  font-style: italic;
  color: #c79a00;
}

.subject-panel__body-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow: hidden;
}

.squares-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;

  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 3px; }
}
</style>
