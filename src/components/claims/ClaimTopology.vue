<template>
  <!-- The DISAGREEMENT TOPOLOGY band (Thread D stage 2, docs/concepts/
       claims.md) — the navigable shape of the argument around one claim,
       fed by GET /api/claims/:id/topology in ONE read. Three directions:
       what stands AGAINST this claim (recursive — an attacker expands
       with its own disputers and supporters), what this claim STANDS
       AGAINST (where it is the dispute evidence), and what CITES it as
       support. Every edge wears its provenance: the voter's chip, the
       carrying comment, the moment. Renders nothing when the claim has
       no edges — most claims are not arguments yet. -->
  <div v-if="hasEdges" class="claim-topo">
    <div class="claim-topo__head">
      <q-icon name="hub" size="13px" class="q-mr-xs" />
      Disagreement ({{ graph.edges.length }} {{ graph.edges.length === 1 ? 'edge' : 'edges' }})
    </div>

    <template v-if="disputedBy.length">
      <ClaimTopologyNode
        v-for="(e, i) in disputedBy"
        :key="'in-' + i"
        :edge="e"
        :graph="graph"
        :depth="0"
        :visited="[rootId]"
      />
    </template>

    <div v-if="standsAgainst.length" class="claim-topo__section">
      <div class="claim-topo__section-head">this claim stands against</div>
      <div v-for="(e, i) in standsAgainst" :key="'out-' + i" class="claim-topo__flat-row">
        <q-icon name="gavel" size="12px" class="claim-topo__flat-elbow" />
        <template v-if="nodeOf(e.to) && !nodeOf(e.to).locked">
          <span class="claim-topo__status" :class="'status-' + nodeOf(e.to).status">{{ nodeOf(e.to).status }}</span>
          <router-link :to="`/skeletons/${e.to}`" class="claim-topo__flat-link">
            {{ nodeOf(e.to).statement || '(no statement)' }}
          </router-link>
        </template>
        <InfoChip v-else-if="nodeOf(e.to)" :address="nodeOf(e.to).path" />
      </div>
    </div>

    <div v-if="citedBy.length" class="claim-topo__section">
      <div class="claim-topo__section-head">cited as support by</div>
      <div v-for="(e, i) in citedBy" :key="'sup-' + i" class="claim-topo__flat-row">
        <q-icon name="subdirectory_arrow_right" size="12px" class="claim-topo__flat-elbow claim-topo__flat-elbow--support" />
        <template v-if="nodeOf(e.to) && !nodeOf(e.to).locked">
          <span class="claim-topo__status" :class="'status-' + nodeOf(e.to).status">{{ nodeOf(e.to).status }}</span>
          <router-link :to="`/skeletons/${e.to}`" class="claim-topo__flat-link">
            {{ nodeOf(e.to).statement || '(no statement)' }}
          </router-link>
        </template>
        <InfoChip v-else-if="nodeOf(e.to)" :address="nodeOf(e.to).path" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import ClaimTopologyNode from './ClaimTopologyNode.vue'
import { claimService } from 'src/services/claim.service'

export default defineComponent({
  name: 'ClaimTopology',
  components: { InfoChip, ClaimTopologyNode },
  props: {
    claimId: { type: Number, required: true }
  },
  setup (props) {
    const graph = ref({ nodesById: {}, edges: [] })
    const rootId = ref(null)

    const load = async () => {
      graph.value = { nodesById: {}, edges: [] }
      rootId.value = null
      try {
        const r = await claimService.topology(props.claimId)
        if (!r?.success) return
        const nodesById = {}
        for (const n of r.nodes || []) nodesById[n.id] = n
        graph.value = { nodesById, edges: r.edges || [] }
        rootId.value = r.root
      } catch (_) { /* no topology is a quiet state, not an error */ }
    }
    onMounted(load)
    watch(() => props.claimId, load)

    const hasEdges = computed(() => graph.value.edges.length > 0)
    const disputedBy = computed(() =>
      graph.value.edges.filter((e) => e.kind === 'disputes' && e.to === rootId.value))
    const standsAgainst = computed(() =>
      graph.value.edges.filter((e) => e.kind === 'disputes' && e.from === rootId.value))
    const citedBy = computed(() =>
      graph.value.edges.filter((e) => e.kind === 'supports' && e.from === rootId.value))
    const nodeOf = (id) => graph.value.nodesById[id] || null

    return { graph, rootId, hasEdges, disputedBy, standsAgainst, citedBy, nodeOf, load }
  }
})
</script>

<style lang="scss" scoped>
.claim-topo {
  margin: 0 14px 10px;
  padding: 8px 10px;
  background: #f6f8fb;
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-sm, 7px);
}
.claim-topo__head {
  display: flex;
  align-items: center;
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8995a8;
  font-weight: 700;
  margin-bottom: 6px;
}
.claim-topo__section { margin-top: 6px; }
.claim-topo__section-head {
  font-size: 0.64em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8995a8;
  font-weight: 700;
  margin-bottom: 2px;
}
.claim-topo__flat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  min-width: 0;
}
.claim-topo__flat-elbow {
  flex-shrink: 0;
  color: #a03d3d;
  &--support { color: #2e6a3a; }
}
.claim-topo__flat-link {
  min-width: 0;
  font-size: 0.8em;
  color: #1F2A38;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { text-decoration: underline; color: #2C3D4E; }
}
.claim-topo__status {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  font-size: 0.62em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  &.status-open      { background: #5b6c82; }
  &.status-supported { background: #2e6a3a; }
  &.status-disputed  { background: #a03d3d; }
  &.status-retracted { background: #8995a8; text-decoration: line-through; }
}
</style>
