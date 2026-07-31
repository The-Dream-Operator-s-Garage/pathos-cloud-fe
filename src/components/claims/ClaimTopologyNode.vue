<template>
  <!-- One row of the DISAGREEMENT TREE (Thread D stage 2) — a claim
       standing for or against its parent, rendered the way the label
       tree renders: elbow, status, statement, and the edge's provenance
       stamp (who, standing on what, when). A claim node expands with its
       OWN disputers and supporters beneath it — attacking the attacker
       is part of the argument's shape. A visited set stops cycles; a
       locked node is a leaf (the shape shows a private claim exists,
       never who argues with it). -->
  <div class="topo-node">
    <div class="topo-node__row">
      <q-icon
        :name="edge.kind === 'disputes' ? 'gavel' : 'subdirectory_arrow_right'"
        size="12px"
        class="topo-node__elbow"
        :class="edge.kind === 'disputes' ? 'topo-node__elbow--dispute' : 'topo-node__elbow--support'"
      />
      <span class="topo-node__verb" :class="'topo-node__verb--' + edge.kind">
        {{ edge.kind === 'disputes' ? 'disputed by' : 'supported by' }}
      </span>

      <!-- The other end: a claim node (navigable), a locked stub, or —
           for a dispute standing on a non-claim element — its chip. -->
      <template v-if="node && !node.locked">
        <span class="topo-node__status" :class="'status-' + node.status">{{ node.status }}</span>
        <router-link :to="`/skeletons/${node.id}`" class="topo-node__statement">
          {{ node.statement || '(no statement)' }}
        </router-link>
      </template>
      <template v-else-if="node && node.locked">
        <InfoChip :address="node.path" />
        <span class="topo-node__locked-note">locked claim</span>
      </template>
      <template v-else>
        <InfoChip v-if="edge.evidence" :address="edge.evidence" />
        <span v-else class="topo-node__locked-note">(evidence unresolved)</span>
      </template>
    </div>

    <!-- The provenance stamp — every edge carries who put it there and
         when; a dispute edge also links the comment that carries it. -->
    <div class="topo-node__stamp">
      <InfoChip v-if="edge.by?.path" :address="edge.by.path" />
      <router-link
        v-if="edge.via"
        :to="`/skeletons/${edge.via.id}`"
        class="topo-node__via"
        title="the dispute comment — the edge's on-chain carrier"
      >comment</router-link>
      <span v-if="edge.at" class="topo-node__when">{{ when }}</span>
    </div>

    <div v-if="children.length" class="topo-node__children">
      <ClaimTopologyNode
        v-for="(child, i) in children"
        :key="child.kind + '-' + (child.from ?? 'x') + '-' + child.to + '-' + i"
        :edge="child"
        :graph="graph"
        :depth="depth + 1"
        :visited="visitedNext"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'

const MAX_DEPTH = 3

const relTime = (iso) => {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

export default defineComponent({
  name: 'ClaimTopologyNode',
  components: { InfoChip },
  props: {
    // One edge of the topology; the row renders its FROM end.
    edge: { type: Object, required: true },
    // { nodesById: { id → node }, edges: [all edges] } — the whole graph
    // arrives in one read; recursion never refetches.
    graph: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] }
  },
  setup (props) {
    const node = computed(() =>
      props.edge.from != null ? props.graph.nodesById[props.edge.from] || null : null)

    const visitedNext = computed(() =>
      node.value ? [...props.visited, node.value.id] : props.visited)

    // The attacker's own incoming edges — its disputers and supporters.
    const children = computed(() => {
      if (!node.value || node.value.locked) return []
      if (props.depth >= MAX_DEPTH) return []
      if (props.visited.includes(node.value.id)) return []
      return props.graph.edges.filter((e) =>
        e.to === node.value.id && !(e.from != null && props.visited.includes(e.from)))
    })

    const when = computed(() => relTime(props.edge.at))

    return { node, children, visitedNext, when }
  }
})
</script>

<style lang="scss" scoped>
.topo-node__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  min-width: 0;
  flex-wrap: wrap;
}
.topo-node__elbow {
  flex-shrink: 0;
  &--dispute { color: #a03d3d; }
  &--support { color: #2e6a3a; }
}
.topo-node__verb {
  flex-shrink: 0;
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  &--disputes { color: #a03d3d; }
  &--supports { color: #2e6a3a; }
}

// The shared claim STATUS palette (ClaimBand pill, InfoChip pill,
// MicroChip dot) — same tones, chip-scaled.
.topo-node__status {
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

.topo-node__statement {
  min-width: 0;
  font-size: 0.8em;
  color: #1F2A38;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { text-decoration: underline; color: #2C3D4E; }
}
.topo-node__locked-note { font-size: 0.72em; color: #8995a8; }

.topo-node__stamp {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 18px;
  padding-bottom: 2px;
}
.topo-node__via {
  font-size: 0.68em;
  color: #6b7993;
  text-decoration: underline dotted;
}
.topo-node__when { font-size: 0.68em; color: #8995a8; }

.topo-node__children {
  margin-left: 18px;
  border-left: 1px solid #e2e6ed;
  padding-left: 8px;
}
</style>
