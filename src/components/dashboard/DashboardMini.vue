<template>
  <!-- THE DASHBOARD MINI (phase 9, 2026-10-19 — user ask: "dashboards
       should have their own mini, nano and card representation … be
       careful on the mini one to represent few layers of depth so we don't
       overload the component"). The board as the family's panel, in the
       `dashboards` kind (Quasar brown):
         HEAD  chip+copy │ name │ labels │ pin │ open     (MiniHead)
         BODY  THE BOARD — DashboardBoard, read-only, one layer down
         FOOT  ◫ 4 slots · depth 2 · by claude · 3h ago  (MiniFoot)

       DEPTH — the dial (useRenderDepth): ElementMini already consumed a
       layer to mount this, so the slots inside draw their minis one layer
       down (their own refs as pills) and a board INSIDE one of them is the
       floor: a mini whose budget is already spent does not load its board
       at all — it draws THE SCHEMATIC, the count line in a brown well.
       Card (2) → the board's minis → a nested board's minis → schematic. A board in the chain above (a board
       quoting itself, a cycle) draws the schematic too, whatever the
       budget: the cycle guard is the host chain, never a fetch. -->
  <MiniPanel kind="dashboards" body-fit :element="panelElement" :labels="labels">
    <template #head>
      <MiniHead
        kind="dashboards"
        block="dashboard-mini"
        :id="dashboard.id"
        :path="address"
        :integrity="integrity"
        :name="name"
        :name-title="address"
      />
    </template>

    <template #body>
      <div v-if="schematic" class="dashboard-mini__schematic" :title="schematicTitle">
        <q-icon name="dashboard" size="14px" />
        <span class="mono">{{ facts.leaves }} {{ facts.leaves === 1 ? 'slot' : 'slots' }} · depth {{ facts.depth }}</span>
        <span v-if="inChain" class="dashboard-mini__cycle">this board, again</span>
      </div>
      <div v-else class="dashboard-mini__board" :style="{ height: boardH + 'px' }">
        <DashboardBoard :dashboard-id="dashboard.id" nested @resolved="onResolved" />
      </div>
    </template>

    <template #foot>
      <MiniFoot kind="dashboards" :facts="footFacts" :title="footTitle" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, inject, watchEffect } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import DashboardBoard from './DashboardBoard.vue'
import { entitySummary } from 'src/utils/entityDisplay'
import { timeAgo } from 'src/utils/time'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'
import { DASHBOARD_HOST } from './dashboardHost'

export default defineComponent({
  name: 'DashboardMini',
  components: { MiniPanel, MiniHead, MiniFoot, DashboardBoard },
  props: {
    // The summary's mark: { id, name, leaves, depth, template }.
    dashboard: { type: Object, required: true },
    // 'skeletons/<hash>' — the canonical address (the alias is read, not kept).
    address: { type: String, default: '' },
    summary: { type: Object, default: null },
    labels: { type: Array, default: null }
  },
  setup (props) {
    const budget = useRenderBudget()
    const host = inject(DASHBOARD_HOST, null)
    const inChain = computed(() => !!props.address && (host?.chain?.value || []).includes(props.address))
    const schematic = computed(() => inChain.value || budgetExhausted(budget))

    const resolved = ref(null)
    const onResolved = (card) => { resolved.value = card }
    const facts = computed(() => ({
      leaves: resolved.value?.leaves ?? props.dashboard.leaves ?? 0,
      depth: props.dashboard.depth ?? 0,
      template: resolved.value?.template?.name || props.dashboard.template?.name || null
    }))

    const name = computed(() => resolved.value?.name || props.dashboard.name || props.summary?.primary || '(untitled board)')
    const integrity = computed(() => props.summary?.integrity || null)
    const panelElement = computed(() => ({ path: props.address }))

    // A nested board's working height — DEFINITE, so the splits' percent
    // panes resolve (a column flex with an auto height lets a stacked
    // pane collapse to its content): a post-wide board gets 360px, a board
    // one layer further down 240.
    const boardH = computed(() => (budget != null && budget.value != null && budget.value <= 1 ? 240 : 360))

    const owner = ref('')
    watchEffect(() => {
      const id = resolved.value?.owner_id ?? props.summary?.author?.id
      const named = props.summary?.author?.username
      if (named) { owner.value = named; return }
      if (id == null) { owner.value = ''; return }
      entitySummary({ id }).then((s) => { owner.value = s?.primary || '' })
    })
    const when = computed(() => timeAgo(resolved.value?.created_at || null) || '')

    const footFacts = computed(() => [
      { text: `${facts.value.leaves} ${facts.value.leaves === 1 ? 'slot' : 'slots'}`, mono: true },
      facts.value.depth ? { text: `depth ${facts.value.depth}`, mono: true } : null,
      facts.value.template && !['DASHBOARD', 'USER_HOME'].includes(facts.value.template) && { text: facts.value.template, mono: true, title: 'the template this board instantiates' },
      owner.value && `by ${owner.value}`,
      when.value && { text: when.value, title: resolved.value?.created_at || '' }
    ].filter(Boolean))
    const footTitle = computed(() => [props.address, owner.value && `by ${owner.value}`].filter(Boolean).join(' · '))
    const schematicTitle = computed(() => (inChain.value
      ? 'this board stands above — a cycle draws no deeper'
      : 'the depth dial is spent here — open the board to read it'))

    return { schematic, inChain, facts, name, integrity, panelElement, boardH, onResolved, footFacts, footTitle, schematicTitle }
  }
})
</script>

<style lang="scss" scoped>
// ⭐ 2026-10-20 — THE BOARD RUNS TO THE WELL'S RIM (user ask: no ghost
// space round the minis): this panel's own well loses the family body's
// 4px top and bottom pad (a CHILD chain from this root, so no panel nested
// in the board is touched), and the board wrapper states the well's rim
// for the board — `--mini-well-rule`, 1px, is every divider's colour and
// width; the well's INNER corners (its top `--mini-well-r-top`, its bottom
// `--pit-r`, less the line) are the corners a corner slot's mini turns with.
.mini-panel-link > :deep(.mini-panel > .mini-panel__body) {
  padding: 0;
}

.dashboard-mini__board {
  width: 100%;
  min-width: 0;
  display: flex;
  --dash-rule: var(--mini-well-rule, rgba(33, 33, 33, 0.40));
  --dash-rule-w: 1px;
  --dash-r-tl: calc(var(--mini-well-r-top, 0.85em) - 1px);
  --dash-r-tr: calc(var(--mini-well-r-top, 0.85em) - 1px);
  --dash-r-br: calc(var(--pit-r, 6.34px) - 1px);
  --dash-r-bl: calc(var(--pit-r, 6.34px) - 1px);

  > :deep(.dash-board) { flex: 1 1 auto; min-width: 0; }
}

.dashboard-mini__schematic {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 10px;
  font-size: 0.78em;
  color: var(--brown-8, #4e342e);
  background: var(--brown-1, #efebe9);
  border-radius: 5px;
}

.dashboard-mini__cycle {
  font-size: 0.86em;
  font-style: italic;
  color: var(--brown-5, #8d6e63);
}
</style>
