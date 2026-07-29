<template>
  <!-- Tall right-hand section of the label explorer. For the selected
       label it pulls every usage across the primal element kinds
       (entity_label / node_label / path_label / skeleton_label) in one
       call and lists them as Mini chips, grouped per kind with totals. -->
  <div class="label-usages pathos-card">
    <div class="label-usages__head">
      <q-icon name="hub" size="16px" class="q-mr-sm text-accent" />
      <div class="col">
        <div class="nasalization text-accent" style="font-size:0.9em;">Usages</div>
        <div v-if="label" class="label-usages__sub">
          <span class="mono">{{ label.name }}</span>
          <span v-if="!loading"> — {{ total }} across the system</span>
        </div>
      </div>
    </div>

    <div v-if="!label" class="label-usages__empty">
      <q-icon name="touch_app" size="28px" style="opacity:.3;" />
      <div class="q-mt-sm">Select a label to see everything that carries it.</div>
    </div>

    <div v-else-if="loading" class="text-center q-py-lg">
      <q-spinner color="primary" size="24px" />
    </div>

    <div v-else-if="total === 0" class="label-usages__empty">
      <q-icon name="label_off" size="28px" style="opacity:.3;" />
      <div class="q-mt-sm">Not attached to anything yet.</div>
    </div>

    <div v-else class="label-usages__scroll">
      <section v-if="usages.entities.length" class="label-usages__group">
        <div class="label-usages__group-head">
          <q-icon name="person" size="12px" style="color:#9b6cb0;" />
          entities <span class="label-usages__total">{{ totals.entities }}</span>
        </div>
        <EntityMini v-for="e in usages.entities" :key="'e' + e.id" :entity="e" class="q-mb-sm" />
      </section>

      <section v-if="usages.nodes.length" class="label-usages__group">
        <div class="label-usages__group-head">
          <q-icon name="adjust" size="12px" style="color:#2C3D4E;" />
          nodes <span class="label-usages__total">{{ totals.nodes }}</span>
        </div>
        <NodeMini v-for="n in usages.nodes" :key="'n' + n.id" :node="shapeNode(n)" class="q-mb-sm" />
        <div v-if="totals.nodes > usages.nodes.length" class="label-usages__more">
          showing {{ usages.nodes.length }} of {{ totals.nodes }}
        </div>
      </section>

      <section v-if="usages.paths.length" class="label-usages__group">
        <div class="label-usages__group-head">
          <q-icon name="route" size="12px" style="color:#4d8a83;" />
          paths <span class="label-usages__total">{{ totals.paths }}</span>
        </div>
        <PathMini v-for="p in usages.paths" :key="'p' + p.id" :path="p" class="q-mb-sm" />
        <div v-if="totals.paths > usages.paths.length" class="label-usages__more">
          showing {{ usages.paths.length }} of {{ totals.paths }}
        </div>
      </section>

      <section v-if="usages.skeletons.length" class="label-usages__group">
        <div class="label-usages__group-head">
          <q-icon name="schema" size="12px" style="color:#5b6c82;" />
          skeletons <span class="label-usages__total">{{ totals.skeletons }}</span>
        </div>
        <MiniPanel
          v-for="s in usages.skeletons"
          :key="'s' + s.id"
          :to="`/skeletons/${s.id}`"
          class="q-mb-sm"
        >
          <template #title>
            <q-icon name="schema" size="13px" class="q-mr-xs" style="color:#5b6c82;" />
            {{ s.name || `Skeleton #${s.id}` }}
          </template>
          <template #hash>
            <MicroChip kind="skeletons" :id="s.id" :path="s.path" :show-type="true" />
          </template>
        </MiniPanel>
        <div v-if="totals.skeletons > usages.skeletons.length" class="label-usages__more">
          showing {{ usages.skeletons.length }} of {{ totals.skeletons }}
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import { labelService } from 'src/services/label.service'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import EntityMini from 'src/components/entities/EntityMini.vue'
import NodeMini from 'src/components/nodes/NodeMini.vue'
import PathMini from 'src/components/paths/PathMini.vue'

const EMPTY = { entities: [], nodes: [], paths: [], skeletons: [] }

export default defineComponent({
  name: 'LabelUsages',
  components: { MiniPanel, MicroChip, EntityMini, NodeMini, PathMini },
  props: {
    label: { type: Object, default: null }
  },
  setup (props) {
    const loading = ref(false)
    const usages = ref({ ...EMPTY })
    const totals = ref({ entities: 0, nodes: 0, paths: 0, skeletons: 0 })
    const total = ref(0)

    const load = async () => {
      usages.value = { ...EMPTY }
      totals.value = { entities: 0, nodes: 0, paths: 0, skeletons: 0 }
      total.value = 0
      if (!props.label?.id) return
      loading.value = true
      try {
        const res = await labelService.getUsages(props.label.id)
        if (res.success) {
          usages.value = { ...EMPTY, ...res.usages }
          totals.value = res.totals
          total.value = res.total
        }
      } catch (_) { /* leave empty state */ } finally {
        loading.value = false
      }
    }

    onMounted(load)
    watch(() => props.label?.id, load)

    // The endpoint returns flat rows; NodeMini expects type nested.
    const shapeNode = (n) => ({
      id: n.id,
      path: n.path,
      content: n.content,
      file: n.file,
      type: n.type_name ? { name: n.type_name } : null,
      created_at: n.created_at
    })

    return { loading, usages, totals, total, shapeNode }
  }
})
</script>

<style lang="scss" scoped>
.label-usages {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 90px);
  min-height: 340px;
  padding: 12px;
  // The translucent card sits on the dark page; ink text needs a more
  // opaque surface to stay legible.
  background: rgba(255, 255, 255, 0.85);
}

.label-usages__head {
  display: flex;
  align-items: flex-start;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.10);
  margin-bottom: 8px;
}

.label-usages__sub {
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.6);
  .mono { text-transform: uppercase; }
}

.label-usages__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.82em;
  padding: 24px 12px;
}

.label-usages__scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.label-usages__group { margin-bottom: 14px; }

.label-usages__group-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.65);
  margin-bottom: 6px;
}

.label-usages__total {
  font-family: 'Space Mono', monospace;
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
}

.label-usages__more {
  font-size: 0.72em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
  margin: 2px 0 4px;
}
</style>
