<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-xl-10">
        <div class="row items-center q-mb-md">
          <div class="nasalization text-accent" style="font-size:1.1em;">Labels</div>
          <q-space />
          <q-input v-model="searchQuery" placeholder="Search labels..." dense outlined dark
            style="width:220px;" clearable @update:model-value="handleSearch">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>

        <div v-if="searchResults.length > 0" class="q-mb-md">
          <div class="text-dim q-mb-sm" style="font-size:0.8em;">Search results — click to dig to it</div>
          <div class="label-scroll-row">
            <LabelChip v-for="label in searchResults" :key="label.id" :label="label"
              @click="digToLabel(label)" />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Big viewer: squares inside squares, one per primal label -->
          <div class="col-12 col-md-7">
            <div class="text-dim q-mb-sm" style="font-size:0.8em; text-transform:uppercase; letter-spacing:.05em;">
              System labels — dig into a square to carve out its descendance
            </div>

            <div v-if="loading" class="text-center q-py-lg">
              <q-spinner color="primary" />
            </div>

            <div v-else-if="loadError" class="text-dim text-center q-py-lg" style="font-size:0.82em;">
              <q-icon name="cloud_off" size="32px" style="opacity:.3;" />
              <div class="q-mt-sm">Could not load labels: {{ loadError }}</div>
            </div>

            <div v-else-if="rootLabels.length === 0" class="text-dim text-center q-py-lg" style="font-size:0.82em;">
              <q-icon name="label_off" size="32px" style="opacity:.3;" />
              <div class="q-mt-sm">No system labels yet. Run the seeder:</div>
              <code style="font-size:.9em; color:var(--ink);">node scripts/seed-labels.js</code>
            </div>

            <div v-else class="label-explorer__roots">
              <LabelSquares
                v-for="root in rootLabels"
                :key="root.id"
                :label="root"
                :depth="0"
                :selected-id="selectedLabel?.id ?? null"
                :expand-ids="expandIds"
                @select="selectLabel"
              />
            </div>
          </div>

          <!-- Tall usages section -->
          <div class="col-12 col-md-5">
            <LabelUsages :label="selectedLabel" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, provide } from 'vue'
import { labelService } from 'src/services/label.service'
import { recoverAncestry } from 'src/utils/labelChain'
import { useStateHolder } from 'src/composables/useStateHolder'
import LabelChip from 'src/components/labels/LabelChip.vue'
import LabelSquares from 'src/components/labels/LabelSquares.vue'
import LabelUsages from 'src/components/labels/LabelUsages.vue'

export default defineComponent({
  name: 'LabelExplorerPage',
  components: { LabelChip, LabelSquares, LabelUsages },
  setup () {
    const rootLabels = ref([])
    const selectedLabel = ref(null)
    const expandIds = ref([])
    const searchQuery = ref('')
    const searchResults = ref([])
    const loading = ref(true)
    const loadError = ref('')

    // StateHolder — the dug-open square set + selected label survive
    // leaving for a post and coming back (and full reloads).
    const holder = useStateHolder({
      expanded: [], // every label id currently dug open
      selectedId: null,
      selected: null, // the label object (so restore needs no refetch)
      query: ''
    })

    // Squares report their dig state through this seam (provide/inject —
    // the tree is recursive, prop-drilling a callback would touch every
    // level). The expanded set IS holder state, so it persists.
    provide('labelDigState', {
      isExpanded: (id) => holder.state.expanded.includes(id),
      setExpanded: (label, open) => {
        const has = holder.state.expanded.includes(label.id)
        if (open && !has) {
          holder.state.expanded = [...holder.state.expanded, label.id]
          holder.recordInteraction({
            targetType: 'label',
            targetId: label.id,
            label: `dug into ${label.name}`
          })
        } else if (!open && has) {
          holder.state.expanded = holder.state.expanded.filter(i => i !== label.id)
        }
      }
    })

    const selectLabel = (label) => {
      selectedLabel.value = label
      holder.state.selectedId = label?.id ?? null
      holder.state.selected = label ? { id: label.id, name: label.name, path: label.path } : null
    }

    // Recursive ancestral recovery drives the deep-dig: recover the chain
    // root → target, then hand the id trail to the squares so every square
    // on the way carves itself open down to the target.
    const digToLabel = async (label) => {
      selectLabel(label)
      const chain = await recoverAncestry(label)
      expandIds.value = chain.map(l => l.id)
    }

    const handleSearch = async (q) => {
      holder.state.query = q || ''
      if (!q || q.length < 2) { searchResults.value = []; return }
      try {
        const result = await labelService.search(q)
        if (result.success) searchResults.value = result.labels
      } catch (_) { searchResults.value = [] }
    }

    onMounted(async () => {
      try {
        const result = await labelService.listRoots({ limit: 100 })
        if (result.success) rootLabels.value = result.labels
        else loadError.value = result.error?.message || 'unknown error'
      } catch (err) {
        loadError.value = err?.response?.data?.error?.message || err.message
      }
      loading.value = false

      // Re-carve the remembered exploration: the persisted expanded set
      // feeds the squares directly (expand-ids accepts any id set, not
      // just one ancestry chain), selection + search box come back too.
      if (holder.state.expanded.length) expandIds.value = [...holder.state.expanded]
      if (holder.state.selected) selectedLabel.value = holder.state.selected
      if (holder.state.query) { searchQuery.value = holder.state.query; handleSearch(holder.state.query) }
      await holder.restore()
    })

    return {
      rootLabels,
      selectedLabel,
      expandIds,
      searchQuery,
      searchResults,
      loading,
      loadError,
      selectLabel,
      digToLabel,
      handleSearch
    }
  }
})
</script>

<style lang="scss" scoped>
.label-explorer__roots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
