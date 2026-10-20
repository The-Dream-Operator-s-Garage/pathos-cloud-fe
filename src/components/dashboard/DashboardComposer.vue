<template>
  <!-- THE COMPOSER (dashboards phase 9, 2026-10-19 — user law: "you must
       have at least one element to create a dashboard"). The ghost tab
       opens this sheet in the dock's well instead of minting an empty
       board: a NAME, a TEMPLATE (DASHBOARD — one slot to fill — or any
       DASHBOARD-descended schema: its components listed, each a picker
       that takes the slot's declared kind), and CREATE, enabled once one
       element is in. A template's layout is drawn as its schematic beside
       the fields so the shape is read before it is filled. -->
  <div class="dash-composer">
    <div class="dash-composer__row">
      <q-icon name="dashboard" size="16px" class="dash-composer__glyph" />
      <input
        v-model="name"
        type="text"
        class="dash-composer__name"
        placeholder="name this board (optional)"
        @keydown.enter.prevent="create"
      >
      <select v-model="templateId" class="dash-composer__select" title="The template — DASHBOARD is one free slot; a template lists its components">
        <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}{{ t.components.length ? ` · ${t.components.length} components` : '' }}</option>
      </select>
    </div>

    <div v-if="!picked" class="dash-composer__fields">
      <div v-for="c in components" :key="c.name" class="dash-composer__field">
        <span class="dash-composer__field-name mono">{{ c.name }}<span v-if="c.kind" class="dash-composer__field-kind"> · {{ c.kind }}</span></span>
        <div v-if="fills[c.name]" class="dash-composer__filled">
          <InfoChip :address="fills[c.name]" dense />
          <button type="button" class="dash-composer__x" title="clear" @click="fills[c.name] = ''"><q-icon name="close" size="11px" /></button>
        </div>
        <SlotPicker v-else compact :kind-hint="c.kind || ''" :placeholder="`find a ${c.kind || 'element'} for ${c.name}`" @pick="(ref) => { fills[c.name] = ref }" />
      </div>
    </div>

    <div v-else class="dash-composer__fields">
      <div class="dash-composer__field">
        <span class="dash-composer__field-name mono">THE FIRST SLOT</span>
        <div v-if="firstRef" class="dash-composer__filled">
          <InfoChip :address="firstRef" dense />
          <button type="button" class="dash-composer__x" title="clear" @click="firstRef = ''"><q-icon name="close" size="11px" /></button>
        </div>
        <SlotPicker v-else autofocus @pick="(ref) => { firstRef = ref }" />
      </div>
    </div>

    <div class="dash-composer__foot">
      <span class="dash-composer__hint">{{ hint }}</span>
      <q-space />
      <button type="button" class="dash-composer__btn" @click="$emit('cancel')">Cancel</button>
      <button type="button" class="dash-composer__btn dash-composer__btn--go" :disabled="!ready || busy" @click="create">
        <q-icon name="dashboard_customize" size="13px" /> Create board
      </button>
    </div>
    <div v-if="error" class="dash-composer__error">{{ error }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, watch } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import SlotPicker from './SlotPicker.vue'
import { dashboardService } from 'src/services/dashboard.service'

export default defineComponent({
  name: 'DashboardComposer',
  components: { InfoChip, SlotPicker },
  emits: ['created', 'cancel'],
  setup (props, { emit }) {
    const name = ref('')
    const templates = ref([])
    const templateId = ref(null)
    const firstRef = ref('')
    const fills = reactive({})
    const busy = ref(false)
    const error = ref('')

    onMounted(async () => {
      try {
        const r = await dashboardService.listTemplates()
        // USER_HOME is the login's own board, minted by the server — not a
        // template to pick from.
        templates.value = (r.success ? r.templates : []).filter(t => t.name !== 'USER_HOME')
        templateId.value = templates.value.find(t => t.name === 'DASHBOARD')?.id ?? templates.value[0]?.id ?? null
      } catch (_) { templates.value = [] }
    })

    const template = computed(() => templates.value.find(t => t.id === templateId.value) || null)
    const components = computed(() => template.value?.components || [])
    // A template without components is the free board: ONE first slot.
    const picked = computed(() => !components.value.length)
    watch(templateId, () => { for (const k of Object.keys(fills)) delete fills[k] })

    const ready = computed(() => (picked.value ? !!firstRef.value : Object.values(fills).some(Boolean)))
    const hint = computed(() => (picked.value
      ? 'a board needs its first element — the root slot; split it once it exists'
      : `fill at least one of the template's ${components.value.length} components`))

    const create = async () => {
      if (!ready.value || busy.value) return
      busy.value = true
      error.value = ''
      try {
        const payload = { name: name.value.trim() || null, templateId: templateId.value }
        if (picked.value) payload.ref = firstRef.value
        else payload.fills = Object.fromEntries(Object.entries(fills).filter(([, v]) => v))
        const r = await dashboardService.create(payload)
        if (!r.success) error.value = r.error?.message || 'the board did not mint'
        else emit('created', r.dashboard)
      } catch (e) {
        error.value = e?.response?.data?.error?.message || 'the board did not mint'
      }
      busy.value = false
    }

    return { name, templates, templateId, firstRef, fills, busy, error, components, picked, ready, hint, create }
  }
})
</script>

<style lang="scss" scoped>
.dash-composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 640px;
  margin: 12px auto;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--brown-2, #d7ccc8);
  border-radius: 8px;
}

.dash-composer__row { display: flex; align-items: center; gap: 8px; }
.dash-composer__glyph { color: var(--brown-6, #795548); }

.dash-composer__name,
.dash-composer__select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--brown-3, #bcaaa4);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 0.8em;
  color: var(--brown-8, #4e342e);

  &:focus { outline: none; border-color: var(--brown-6, #795548); }
}
.dash-composer__name { flex: 1; min-width: 0; font-weight: 600; &::placeholder { font-weight: 400; color: var(--brown-4, #a1887f); } }
.dash-composer__select { flex-shrink: 0; max-width: 46%; }

.dash-composer__fields { display: flex; flex-direction: column; gap: 8px; }
.dash-composer__field { display: flex; flex-direction: column; gap: 4px; }
.dash-composer__field-name { font-size: 0.66em; letter-spacing: 0.05em; color: var(--brown-8, #4e342e); }
.dash-composer__field-kind { color: var(--brown-5, #8d6e63); }
.dash-composer__filled { display: flex; align-items: center; gap: 6px; }
.dash-composer__x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  border: 1px solid var(--brown-3, #bcaaa4); background: #fff; color: var(--brown-5, #8d6e63); cursor: pointer;
  &:hover { color: var(--coral-deep); border-color: var(--coral-deep); }
}

.dash-composer__foot { display: flex; align-items: center; gap: 8px; }
.dash-composer__hint { font-size: 0.7em; font-style: italic; color: var(--brown-5, #8d6e63); }

.dash-composer__btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 28px; padding: 0 10px;
  border: 1px solid var(--brown-3, #bcaaa4); border-radius: 6px;
  background: #fff; color: var(--brown-8, #4e342e);
  font: inherit; font-size: 0.74em; cursor: pointer;
  &:hover { background: var(--brown-1, #efebe9); border-color: var(--brown-6, #795548); }
  &:disabled { opacity: 0.45; cursor: default; }
  &--go { background: var(--brown-6, #795548); border-color: var(--brown-6, #795548); color: #fff; &:hover:not(:disabled) { background: var(--brown-7, #6d4c41); } }
}

.dash-composer__error { font-size: 0.74em; color: #a03d3d; }
</style>
