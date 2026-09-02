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
  <div class="dash-grid-host" :class="{ 'dash-grid-host--canvas': splitTree }">
    <div v-if="editing" class="dash-grid__toolbar">
      <SkeletonSearchInput v-if="!splitTree" @pick="onPick" />
      <NodeSearchInput v-if="!splitTree" @pick="onPick" />
      <button
        v-if="!splitTree"
        type="button"
        class="dash-grid__tool"
        title="Split this board into a multi-dashboard canvas"
        @click="seedSplit"
      >
        <q-icon name="vertical_split" size="13px" /> Split view
      </button>
      <template v-else>
        <span class="dash-grid__canvas-hint">drag tabs into the slots · drag dividers to resize</span>
        <q-space />
        <button
          type="button"
          class="dash-grid__tool"
          title="Mint a NEW dashboard holding this exact arrangement"
          :disabled="exporting"
          @click="exportLayout"
        >
          <q-icon name="dashboard_customize" size="13px" /> Export layout as dashboard
        </button>
      </template>
    </div>

    <!-- THE SPLIT CANVAS (phase 5): when the board's LAYOUT carries a
         split tree, the well becomes the recursively splittable
         multi-dashboard canvas instead of the flat grid. Nested grids
         (leaves) never reach this branch — the cycle guard. -->
    <SplitLayout
      v-if="splitTree && !nested"
      class="dash-grid__canvas"
      :node="splitTree"
      :editing="editing"
      @changed="onSplitChanged"
    />

    <div v-else-if="loading" class="dash-grid__loading">
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

        <!-- Edit mode's second per-cell door (skeletons plan phase 2):
             the cell's skeleton in its own floating window, beside the
             remove cross — a board is a desk, the window is the reading
             copy you drag off it. -->
        <button
          v-if="editing && cell.type === 'skeleton' && cell.ref"
          type="button"
          class="dash-cell__open"
          title="open in the flyout viewer"
          @click="openCell(cell)"
        >
          <q-icon name="open_in_full" size="11px" />
        </button>
        <SessionActivityCard v-if="cell.type === 'virtual' && cell.virtual === 'session-activity'" />
        <SkeletonMini
          v-else-if="cell.type === 'skeleton' && cell.walk"
          :skeleton="cell.walk.skeleton"
          :slots="cell.walk.slots"
          @changed="load"
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
import SkeletonMini from 'src/components/skeletons/SkeletonMini.vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import ElementMini from 'src/components/shared/ElementMini.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import LockedChip from 'src/components/shared/LockedChip.vue'
import SessionActivityCard from 'src/components/dashboard/SessionActivityCard.vue'
import SkeletonSearchInput from 'src/components/dashboard/SkeletonSearchInput.vue'
import NodeSearchInput from 'src/components/dashboard/NodeSearchInput.vue'
import SplitLayout from 'src/components/dashboard/SplitLayout.vue'
import { dashboardService } from 'src/services/dashboard.service'
import { skeletonService } from 'src/services/skeleton.service'
import { leafRefs } from 'src/utils/splitTree'

export default defineComponent({
  name: 'DashboardGrid',
  components: {
    SkeletonMini,
    ElementMini,
    InfoChip,
    LockedChip,
    SessionActivityCard,
    SkeletonSearchInput,
    NodeSearchInput,
    // SplitLayout imports THIS component back asynchronously (leaves are
    // boards) — the one static edge of the pair lives here.
    SplitLayout
  },
  props: {
    dashboardId: { type: Number, required: true },
    editing: { type: Boolean, default: false },
    // A leaf of a split canvas: renders the flat grid ONLY (its own split
    // member is ignored) — the recursion/cycle guard, and what keeps a
    // canvas one honest level deep.
    nested: { type: Boolean, default: false }
  },
  // resolved: the board card (the dock names the tab off it);
  // exported: a fresh board minted from the canvas (the dock opens it);
  // items: the shown item refs (the agent row's grant list).
  emits: ['resolved', 'exported', 'items'],
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
        // The agent row grants what the grid SHOWS — hand the refs up.
        emit('items', items.value.map(i => i.ref))

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

    // ── the split canvas (phase 5) ─────────────────────────────────
    const splitTree = computed(() => (props.nested ? null : layout.value?.split || null))

    const seedSplit = async () => {
      layout.value = { v: 1, cells: layout.value?.cells || [], ...layout.value, split: { dir: 'h', ratio: 0.5, children: [{ leaf: null }, { leaf: null }] } }
      await persistLayout()
    }

    // Every structural change + resize end saves (the LAYOUT NOTE
    // versions — arrangements are history). A canvas fused back to one
    // empty slot drops the split member and the flat grid returns.
    let saveTimer = null
    const onSplitChanged = () => {
      const t = layout.value?.split
      if (t && !t.children && !t.leaf) layout.value.split = null
      clearTimeout(saveTimer)
      saveTimer = setTimeout(persistLayout, 400)
    }

    const persistLayout = async () => {
      const clean = JSON.parse(JSON.stringify(layout.value || { v: 1, cells: [] }))
      if (!clean.split) delete clean.split
      await dashboardService.saveLayout(props.dashboardId, clean)
    }

    // Export: mint a NEW dashboard whose LAYOUT is this exact split tree
    // and whose ITEMS are the boards the leaves cite — the arrangement is
    // thereby itself a dashboard (nesting closes the loop).
    const exporting = ref(false)
    const exportLayout = async () => {
      if (!splitTree.value) return
      exporting.value = true
      try {
        const tree = JSON.parse(JSON.stringify(splitTree.value))
        const refs = leafRefs(tree)
        const r = await dashboardService.create({})
        if (!r.success) return
        for (const ref of [...new Set(refs)]) {
          await dashboardService.addItem(r.dashboard.id, ref)
        }
        await dashboardService.saveLayout(r.dashboard.id, { v: 1, cells: [], split: tree })
        emit('exported', r.dashboard)
      } catch (_) { /* the canvas stays as it was */ }
      exporting.value = false
    }

    const flyouts = useFlyoutViewersStore()
    const openCell = (cell) => { if (cell?.ref) flyouts.spawnRef(cell.ref) }

    return { loading, cells, load, onPick, onRemove, openCell, splitTree, seedSplit, onSplitChanged, exporting, exportLayout }
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

// Canvas mode fills the well exactly — the panes scroll, the well doesn't.
.dash-grid-host--canvas {
  height: 100%;
}

.dash-grid__canvas {
  flex: 1 1 auto;
  min-height: 0;
}

.dash-grid__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dash-grid__tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: 6px;
  background: #fff;
  color: var(--dock-ink, var(--brown-8));
  font: inherit;
  font-size: 0.74em;
  cursor: pointer;
  flex-shrink: 0;

  &:hover { border-color: #00829c; color: #00829c; }
  &:disabled { opacity: 0.5; cursor: default; }
}

.dash-grid__canvas-hint {
  font-size: 0.72em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
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
  // - SkeletonMini's body scrolls at --skel-mini-max-h (its bodyFit
  //   trade — see the component; was --resource-mini-max-h until the
  //   2026-09-01 rename).
  --media-max-h: 240px;
  --skel-mini-max-h: 300px;
}

// A board with ONE thing on it gives that thing the whole width.
.dash-cell--wide {
  grid-column: 1 / -1;
  --media-max-h: 420px;
  --skel-mini-max-h: 60vh;
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

.dash-cell__open {
  position: absolute;
  top: -6px;
  right: 16px;
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
