<template>
  <!-- THE DASHBOARD GRID (dashboards phase 4, 2026-08-10) — one open
       board's content: a 2×N grid of cells dealt from the ITEMS walk +
       the LAYOUT JSON. Layout cells render first (virtual cells — today
       only the session-activity projection — then referenced items),
       then every ITEMS entry not already placed by the layout. A single
       cell spans both columns.

       ONE READ PER BOARD: GET /dashboards/:id gives card+items+layout,
       then every skeleton ref in the cells goes through ONE
       POST /skeletons/walk-batch — the grid deals pre-walked results
       into ResourceSkeletonMini cells and never fans out a walk per cell
       (walkSkeleton is a hot path; the batch endpoint exists for exactly
       this surface). Node cells mount ElementMini (self-resolving — it
       already owns media/locked/embed dispatch).

       EDIT MODE (the pencil, or arriving from the ghost tab): the two
       smart inputs appear (skeletons + nodes — picks append to ITEMS),
       and every removable cell grows an ✕ riding the pin splice. -->
  <div class="dash-grid-host">
    <div v-if="editing" class="dash-grid__toolbar">
      <SkeletonSearchInput @pick="onPick" />
      <NodeSearchInput @pick="onPick" />
    </div>

    <div v-if="loading" class="dash-grid__loading">
      <q-spinner size="18px" color="primary" />
    </div>

    <div v-else-if="!cells.length" class="dash-grid__empty">
      (empty board<span v-if="!editing"> — the pencil adds tables and nodes</span>)
    </div>

    <div v-else class="dash-grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="dash-cell"
        :class="{ 'dash-cell--wide': cells.length === 1 }"
      >
        <button
          v-if="editing && cell.linkId"
          type="button"
          class="dash-cell__remove"
          title="Remove from this board"
          @click="onRemove(cell)"
        >
          <q-icon name="close" size="12px" />
        </button>

        <SessionActivityCard v-if="cell.type === 'virtual' && cell.virtual === 'session-activity'" />
        <ResourceSkeletonMini
          v-else-if="cell.type === 'skeleton' && cell.walk"
          :skeleton="cell.walk.skeleton"
          :slots="cell.walk.slots"
        />
        <LockedChip v-else-if="cell.type === 'skeleton' && cell.locked" :address="cell.ref" />
        <InfoChip v-else-if="cell.type === 'skeleton'" :kind="'skeletons'" :address="cell.ref" />
        <ElementMini v-else-if="cell.type === 'node'" :address="cell.ref" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import ResourceSkeletonMini from 'src/components/skeletons/ResourceSkeletonMini.vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import LockedChip from 'src/components/shared/LockedChip.vue'
import SessionActivityCard from 'src/components/dashboard/SessionActivityCard.vue'
import SkeletonSearchInput from 'src/components/dashboard/SkeletonSearchInput.vue'
import NodeSearchInput from 'src/components/dashboard/NodeSearchInput.vue'
import { dashboardService } from 'src/services/dashboard.service'
import { skeletonService } from 'src/services/skeleton.service'

export default defineComponent({
  name: 'DashboardGrid',
  components: {
    ResourceSkeletonMini,
    ElementMini,
    InfoChip,
    LockedChip,
    SessionActivityCard,
    SkeletonSearchInput,
    NodeSearchInput
  },
  props: {
    dashboardId: { type: Number, required: true },
    editing: { type: Boolean, default: false }
  },
  // The resolved board (id, name, layout) — the dock names the tab off it.
  emits: ['resolved'],
  setup (props, { emit }) {
    const loading = ref(false)
    const board = ref(null)
    const items = ref([])
    const layout = ref(null)
    const walks = ref({})

    const load = async () => {
      loading.value = true
      try {
        const r = await dashboardService.get(props.dashboardId)
        if (!r.success) throw new Error('gate')
        board.value = r.dashboard
        items.value = r.items || []
        layout.value = r.layout
        emit('resolved', r.dashboard)

        // ONE batch walk for every skeleton ref on the board — ITEMS plus
        // any ref the LAYOUT places directly (a layout can cite an element
        // the items path no longer carries; the cell still renders).
        const layoutRefs = (r.layout?.cells || [])
          .map(c => c?.ref)
          .filter(ref => ref && String(ref).startsWith('skeletons/'))
        const refs = [...new Set([
          ...items.value.filter(i => i.kind === 'skeletons').map(i => i.ref),
          ...layoutRefs
        ])]
        if (refs.length) {
          const b = await skeletonService.walkBatch({ refs })
          walks.value = b.success ? (b.walks || {}) : {}
        } else {
          walks.value = {}
        }
      } catch (_) {
        board.value = null
        items.value = []
        layout.value = null
        walks.value = {}
      }
      loading.value = false
    }

    onMounted(load)
    watch(() => props.dashboardId, load)

    // Layout cells first (in their stated order), then unplaced items.
    const cells = computed(() => {
      const out = []
      const placed = new Set()
      const itemByRef = new Map(items.value.map(i => [i.ref, i]))

      for (const [idx, c] of (layout.value?.cells || []).entries()) {
        if (c?.virtual) {
          out.push({ type: 'virtual', virtual: c.virtual, key: 'v' + idx })
        } else if (c?.ref) {
          placed.add(c.ref)
          out.push(cellFor(itemByRef.get(c.ref) || { ref: c.ref, kind: refKind(c.ref) }, 'l' + idx))
        }
      }
      for (const it of items.value) {
        if (!placed.has(it.ref)) out.push(cellFor(it, 'i' + it.link_id))
      }
      return out
    })

    const refKind = (ref) => (String(ref).split('/')[0] === 'nodes' ? 'nodes' : 'skeletons')

    const cellFor = (item, key) => {
      const kind = item.kind || refKind(item.ref)
      if (kind === 'skeletons') {
        const w = walks.value[item.ref]
        return {
          type: 'skeleton',
          key,
          ref: item.ref,
          linkId: item.link_id || null,
          walk: w?.success ? w : null,
          locked: !!(w && !w.success && w.error?.code !== 40400)
        }
      }
      return { type: 'node', key, ref: item.ref, linkId: item.link_id || null }
    }

    const onPick = async (p) => {
      const r = await dashboardService.addItem(props.dashboardId, p.address)
      if (r.success) await load()
    }

    const onRemove = async (cell) => {
      const r = await dashboardService.removeItem(props.dashboardId, cell.linkId)
      if (r.success) await load()
    }

    return { loading, cells, onPick, onRemove }
  }
})
</script>

<style lang="scss" scoped>
.dash-grid-host {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.dash-grid__toolbar {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.dash-grid__loading { padding: 12px 0; }

.dash-grid__empty {
  padding: 18px 0;
  text-align: center;
  font-size: 0.78em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
}

// The 2×N grid. `minmax(0, 1fr)` tracks — an `auto` minimum would let a
// wide table stretch its column past the well (the gotchas law).
.dash-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: start;

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.dash-cell {
  position: relative;
  min-width: 0;
  // The HOUSE CONTRACTS a cell publishes to what it mounts:
  // - media NodeMinis size against --media-max-h (silence = 180px
  //   thumbnails; a dashboard cell is a tile, so state a tile's worth);
  // - ResourceSkeletonMini's body scrolls at --resource-mini-max-h
  //   (its bodyFit trade — see the component).
  --media-max-h: 240px;
  --resource-mini-max-h: 300px;
}

// A board with ONE thing on it gives that thing the whole width.
.dash-cell--wide {
  grid-column: 1 / -1;
  --media-max-h: 420px;
  --resource-mini-max-h: 60vh;
}

.dash-cell__remove {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  background: #fff;
  color: var(--dock-ink-mute, var(--brown-4));
  cursor: pointer;

  &:hover {
    background: rgba(var(--coral-rgb), 0.12);
    color: var(--coral-deep);
    border-color: var(--coral-deep);
  }
}
</style>
