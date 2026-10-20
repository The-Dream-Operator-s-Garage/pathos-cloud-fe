<template>
  <!-- THE BOARD (dashboards phase 9, 2026-10-19) — ONE dashboard's canvas:
       the LAYOUT tree (`{ v: 2, root }`, normalized server-side) drawn by
       the recursive DashboardSplit, owned here as ONE reactive object the
       panes hold references into. Every `changed` (a split, a join, a
       pick, a clear, a resize END) debounce-saves through saveLayout — the
       LAYOUT NOTE versions, so every arrangement ever saved is history —
       and the API syncs ITEMS (the index) off the tree.

       ONE READ PER BOARD: `GET /dashboards/:id` gives the card, the tree
       (template slots already resolved), the component slots and
       `can_write`; the leaves self-resolve through ElementMini. The dock,
       the card's pit and the mini's body all mount THIS component —
       parity is the point (the 2026-09-17 law, restated for boards).

       EDIT MODE (the owner, `editing`): the strip above the canvas — the
       board's NAME (a rename on blur, through the skeleton's own name
       seam), the TEMPLATE door (`Save as template`: one component per
       leaf), the hint. The canvas itself grows the slot tools and the
       dividers' join buttons.

       The host record (`DASHBOARD_HOST`) hands every slot below the chain
       of board addresses above it (the cycle guard) and the template's
       slot kinds. -->
  <div
    class="dash-board"
    :class="{ 'is-editing': editing && canWrite, 'is-nested': nested, 'is-fill': fill }"
    :data-dashboard-id="board ? board.id : null"
  >
    <div v-if="editing && canWrite && !nested" class="dash-board__strip">
      <input
        v-model="nameDraft"
        type="text"
        class="dash-board__name"
        placeholder="(untitled board)"
        title="The board's name — data on the skeleton; press Enter or leave the field"
        @keydown.enter.prevent="commitName"
        @blur="commitName"
      >
      <span class="dash-board__hint">split a slot · drag a divider's grip · drop elements in</span>
      <q-space />
      <span v-if="template && template.name !== 'DASHBOARD'" class="dash-board__tmpl mono" :title="'instance of ' + template.name">
        <q-icon name="schema" size="11px" /> {{ template.name }}
      </span>
      <button
        type="button"
        class="dash-board__tool"
        title="Save this arrangement as a template — one component per slot, the tree with slot leaves"
        :disabled="templating"
        @click="saveAsTemplate"
      >
        <q-icon name="dashboard_customize" size="13px" /> Save as template
      </button>
    </div>

    <div v-if="loading && !layout" class="dash-board__loading"><q-spinner size="18px" color="brown-6" /></div>
    <div v-else-if="failed" class="dash-board__failed">
      <q-icon name="lock" size="14px" />
      <span>this board is not readable here</span>
    </div>
    <div v-else-if="layout" class="dash-board__canvas">
      <DashboardSplit :node="layout.root" :editing="editing && canWrite" :depth="0" @changed="onChanged" />
    </div>

    <div v-if="error" class="dash-board__error">{{ error }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, provide, inject, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import DashboardSplit from './DashboardSplit.vue'
import { dashboardService } from 'src/services/dashboard.service'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { leafRefs, plain } from 'src/utils/dashboardTree'
import { DASHBOARD_HOST } from './dashboardHost'

export default defineComponent({
  name: 'DashboardBoard',
  components: { DashboardSplit },
  props: {
    // The board, by id or by address ('skeletons/<hash>' / 'dashboards/<hash>').
    dashboardId: { type: Number, default: null },
    address: { type: String, default: '' },
    editing: { type: Boolean, default: false },
    // Inside a DashboardMini: no strip, the host's chain extended.
    nested: { type: Boolean, default: false },
    // The card's pit / the window: the canvas runs the host's height.
    fill: { type: Boolean, default: false }
  },
  // resolved: the board card (the dock names the tab off it, the mini its
  // foot); items: the leaf refs (the agent row's grant list); changed:
  // a save landed (the card refreshes its counts).
  emits: ['resolved', 'items', 'changed', 'cannot-write'],
  setup (props, { emit, expose }) {
    const $q = useQuasar()
    const loading = ref(false)
    const failed = ref(false)
    const error = ref('')
    const board = ref(null)
    const layout = ref(null)
    const slots = ref([])
    const template = ref(null)
    const canWrite = ref(false)
    const nameDraft = ref('')
    const id = ref(props.dashboardId)

    // ── the host chain (cycle guard) ───────────────────────────────
    const above = inject(DASHBOARD_HOST, null)
    const chain = computed(() => [...(above?.chain?.value || []), ...(board.value?.path ? [board.value.path] : [])])
    const slotKinds = computed(() => Object.fromEntries((slots.value || []).map(s => [s.name, s.kind || ''])))
    provide(DASHBOARD_HOST, { chain, slotKinds })

    const resolveId = async () => {
      if (props.dashboardId != null) return props.dashboardId
      if (!props.address) return null
      const s = await refService.summary(String(props.address).replace(/^pathos:/, ''))
      return s?.success && s.summary?.id != null && !s.summary.locked ? s.summary.id : null
    }

    let seq = 0
    const load = async () => {
      const my = ++seq
      loading.value = true
      failed.value = false
      error.value = ''
      try {
        const rid = await resolveId()
        if (my !== seq) return
        if (rid == null) throw new Error('unresolvable')
        id.value = rid
        const r = await dashboardService.get(rid)
        if (my !== seq) return
        if (!r.success) throw new Error('gate')
        board.value = r.dashboard
        layout.value = r.layout
        slots.value = r.slots || []
        template.value = r.template || null
        canWrite.value = !!r.can_write
        nameDraft.value = r.dashboard?.name || ''
        emit('resolved', { ...r.dashboard, leaves: leafRefs(r.layout.root).length, template: r.template })
        emit('items', leafRefs(r.layout.root))
        if (props.editing && !r.can_write) emit('cannot-write')
      } catch (_) {
        if (my !== seq) return
        failed.value = true
        board.value = null
        layout.value = null
      }
      loading.value = false
    }
    onMounted(load)
    watch(() => [props.dashboardId, props.address], load)

    // ── saving ─────────────────────────────────────────────────────
    let saveTimer = null
    const persist = async () => {
      if (!layout.value || id.value == null || !canWrite.value) return
      try {
        const r = await dashboardService.saveLayout(id.value, plain(layout.value))
        if (!r.success) { error.value = r.error?.message || 'the layout did not save'; return }
        error.value = ''
        emit('items', leafRefs(layout.value.root))
        emit('changed')
      } catch (e) {
        error.value = e?.response?.data?.error?.message || 'the layout did not save'
      }
    }
    const onChanged = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(persist, 350)
    }
    onBeforeUnmount(() => { clearTimeout(saveTimer) })

    const commitName = async () => {
      if (!board.value || !canWrite.value) return
      const next = nameDraft.value.trim()
      if (next === (board.value.name || '')) return
      try {
        const r = await skeletonService.rename(board.value.id, next)
        if (r.success) {
          board.value = { ...board.value, name: next || null }
          emit('resolved', { ...board.value, leaves: leafRefs(layout.value?.root || {}).length, template: template.value })
        } else error.value = r.error?.message || 'rename refused'
      } catch (e) { error.value = e?.response?.data?.error?.message || 'rename refused' }
    }

    const templating = ref(false)
    const saveAsTemplate = () => {
      if (!board.value || templating.value) return
      const suggested = (board.value.name || 'MY_BOARD').toUpperCase().replace(/[^A-Z0-9]+/g, '_')
      $q.dialog({
        title: 'Save as template',
        message: 'The schema\'s name — one component per slot, this arrangement as its layout.',
        prompt: { model: suggested, type: 'text' },
        cancel: true,
        persistent: false
      }).onOk((name) => { if (name) mintTemplate(String(name)) })
    }
    const mintTemplate = async (name) => {
      templating.value = true
      try {
        const r = await dashboardService.saveAsTemplate(board.value.id, name)
        if (!r.success) error.value = r.error?.message || 'the template did not save'
        else error.value = ''
      } catch (e) { error.value = e?.response?.data?.error?.message || 'the template did not save' }
      templating.value = false
    }

    expose({ load })

    return { loading, failed, error, board, layout, template, canWrite, nameDraft, onChanged, commitName, templating, saveAsTemplate }
  }
})
</script>

<style lang="scss" scoped>
.dash-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

// The canvas fills the board; the panes scroll, the board does not. A
// board without a definite height (a post body) takes a working height
// off its own aspect — `--dash-board-h` is the host's dial.
.dash-board__canvas {
  flex: 1 1 auto;
  min-height: var(--dash-board-h, 320px);
  height: 100%;
  display: flex;
  min-width: 0;
}

.dash-board.is-fill .dash-board__canvas { min-height: 0; }

.dash-board__strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 4px 6px;
  border-bottom: 1px solid var(--brown-2, #d7ccc8);
  background: var(--brown-1, #efebe9);
}

.dash-board__name {
  min-width: 0;
  width: 220px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--brown-3, #bcaaa4);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 0.8em;
  font-weight: 600;
  color: var(--brown-8, #4e342e);

  &:focus { outline: none; border-color: var(--brown-6, #795548); }
  &::placeholder { font-weight: 400; color: var(--brown-4, #a1887f); }
}

.dash-board__hint {
  font-size: 0.7em;
  font-style: italic;
  color: var(--brown-5, #8d6e63);
}

.dash-board__tmpl {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68em;
  color: var(--brown-5, #8d6e63);
}

.dash-board__tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--brown-3, #bcaaa4);
  border-radius: 6px;
  background: #fff;
  color: var(--brown-8, #4e342e);
  font: inherit;
  font-size: 0.72em;
  cursor: pointer;
  flex-shrink: 0;

  &:hover { border-color: var(--brown-6, #795548); background: var(--brown-1, #efebe9); }
  &:disabled { opacity: 0.5; cursor: default; }
}

.dash-board__loading { padding: 14px 0; text-align: center; }

.dash-board__failed,
.dash-board__error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  font-size: 0.76em;
  color: var(--brown-5, #8d6e63);
}
.dash-board__error { color: #a03d3d; padding: 4px 8px; }
</style>
