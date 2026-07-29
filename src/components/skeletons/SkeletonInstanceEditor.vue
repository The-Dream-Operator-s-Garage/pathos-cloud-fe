<template>
  <div class="inst-editor">
    <!-- ── LEFT: the field table (label | content [| constraint]) ── -->
    <section class="inst-table-wrap">
      <div class="inst-table__head">
        <q-icon name="table_rows" size="15px" class="q-mr-sm" />
        Fields ({{ slots.length }})
        <q-space />
        <span class="inst-table__hint">click a value to edit — type, or drag / pick an element on the right</span>
      </div>

      <table class="inst-table">
        <thead>
          <tr>
            <th class="col-label">Field</th>
            <th class="col-constraint">Accepts</th>
            <th class="col-value">Content</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in slots"
            :key="s.slotName"
            class="inst-row"
            :class="{ 'is-selected': selectedSlot === s.slotName, 'is-dragover': dragOver === s.slotName }"
            @click="selectSlot(s)"
            @dragover.prevent="dragOver = s.slotName"
            @dragleave="dragOver = null"
            @drop.prevent="onDrop(s, $event)"
          >
            <td class="col-label">
              <span class="mono field-name">{{ s.slotName }}</span>
            </td>
            <td class="col-constraint">
              <span class="kind-chip" :style="kindChipStyle(s.expectedKind)">
                {{ s.expectedKind || 'any' }}
              </span>
            </td>
            <td class="col-value" @click.stop="beginEdit(s)">
              <!-- inline text editor -->
              <div v-if="editing === s.slotName" class="cell-edit" @click.stop>
                <q-input
                  v-model="editText" :dark="false" outlined dense autofocus
                  type="textarea" autogrow
                  class="cell-edit__input"
                  @keydown.enter.exact.prevent="commitText(s)"
                  @keydown.esc="cancelEdit"
                />
                <div class="cell-edit__actions">
                  <button type="button" class="cell-btn cell-btn--ok" title="Save (Enter)" @click="commitText(s)">
                    <q-icon name="check" size="14px" />
                  </button>
                  <button type="button" class="cell-btn" title="Cancel (Esc)" @click="cancelEdit">
                    <q-icon name="close" size="14px" />
                  </button>
                </div>
              </div>

              <!-- bound value — the referenced element as its Mini panel
                   (the Mini routes to the element; edit/clear live beside it) -->
              <template v-else>
                <div v-if="s.ref" class="cell-value" @click.stop>
                  <ElementMini class="cell-mini" :address="s.ref" :label="s.textValue || ''" />
                  <div class="cell-value__tools">
                    <span v-if="saving === s.slotName" class="cell-saving"><q-spinner size="12px" /></span>
                    <button v-if="canText(s)" type="button" class="cell-btn" title="Edit text" @click="beginEdit(s)">
                      <q-icon name="edit" size="13px" />
                    </button>
                    <button type="button" class="cell-btn cell-btn--danger" title="Clear" @click="clearSlot(s)">
                      <q-icon name="close" size="13px" />
                    </button>
                  </div>
                </div>
                <div v-else class="cell-empty">
                  <q-icon name="edit" size="12px" class="q-mr-xs" />
                  <span>{{ canText(s) ? 'click to type — or drop / pick an element' : 'drop or pick a ' + s.expectedKind }}</span>
                  <span v-if="saving === s.slotName" class="cell-saving"><q-spinner size="12px" /></span>
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="errorMsg" class="inst-msg text-negative">{{ errorMsg }}</div>
    </section>

    <!-- ── RIGHT: content searcher + create tools + fresh tray ── -->
    <aside class="inst-populate">
      <div class="populate-head">
        <q-icon name="travel_explore" size="15px" class="q-mr-xs" />
        Populate
        <span v-if="selectedSlot" class="populate-head__slot mono">→ {{ selectedSlot }}</span>
      </div>

      <div class="populate-tools">
        <button type="button" class="populate-tool" title="Upload a file / save a link / write a node"
          @click="openUploader">
          <q-icon name="upload" size="15px" /> Upload
        </button>
        <button type="button" class="populate-tool" title="Write a post"
          @click="openMaker">
          <q-icon name="edit_note" size="15px" /> Build post
        </button>
      </div>

      <!-- Freshly created elements land here (no navigation) -->
      <div v-if="fresh.length" class="fresh-tray">
        <div class="fresh-tray__label">Just created — drag or pick into a field</div>
        <button
          v-for="(f, i) in fresh"
          :key="f.address + i"
          type="button"
          class="ref-result ref-result--fresh"
          draggable="true"
          @dragstart="onFreshDragStart(f, $event)"
          @click="assign({ kind: f.kind, address: f.address, primary: f.primary })"
        >
          <q-icon :name="iconFor(f.kind)" size="13px" :style="{ color: colorFor(f.kind) }" />
          <span class="ref-result__lines">
            <span class="ref-result__primary">{{ f.primary || f.address }}</span>
            <span class="ref-result__secondary">{{ f.kind }}</span>
          </span>
          <q-icon name="drag_indicator" size="14px" class="ref-result__add" />
        </button>
      </div>

      <SlotRefPicker
        :locked-kind="selectedKind"
        :hint="selectedSlot ? '→ ' + selectedSlot : ''"
        @pick="assign"
      />
    </aside>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import SlotRefPicker from 'src/components/maker/SlotRefPicker.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { useSkeletonBuilderStore } from 'src/stores/skeletonBuilder'
import { useMakerStore } from 'src/stores/maker'
import { useUploaderStore } from 'src/stores/uploader'
import { kindFor } from 'src/utils/kinds'

// Kinds a slot can hold as literal typed text (mints a NOTE node): only
// unconstrained fields or ones explicitly constrained to nodes.
const TEXTABLE = (kind) => !kind || kind === 'nodes'

export default defineComponent({
  name: 'SkeletonInstanceEditor',
  components: { ElementMini, SlotRefPicker },
  props: {
    skeletonId: { type: Number, required: true },
    slots: { type: Array, default: () => [] }
  },
  emits: ['changed'],

  setup (props, { emit }) {
    const store = useSkeletonBuilderStore()

    const selectedSlot = ref(null)
    const selectedKind = computed(() =>
      props.slots.find(s => s.slotName === selectedSlot.value)?.expectedKind || null)

    const selectSlot = (s) => { selectedSlot.value = s.slotName }
    const canText = (s) => TEXTABLE(s.expectedKind)

    const dragOver = ref(null)
    const saving = ref(null)
    const errorMsg = ref('')
    const flashErr = (m) => {
      errorMsg.value = m || ''
      if (m) setTimeout(() => { errorMsg.value = '' }, 4000)
    }

    // ── inline text editing ──
    const editing = ref(null)
    const editText = ref('')
    const beginEdit = (s) => {
      if (editing.value === s.slotName) return
      selectedSlot.value = s.slotName
      // Only fields that accept text open the inline editor; constrained
      // ref fields are filled by drag/pick from the right.
      if (!canText(s)) return
      editing.value = s.slotName
      editText.value = s.textValue || ''
    }
    const cancelEdit = () => { editing.value = null; editText.value = '' }
    const commitText = async (s) => {
      const text = editText.value
      editing.value = null
      await bind(s.slotName, { text })
    }

    // ── binding ──
    const bind = async (slotName, value) => {
      saving.value = slotName
      try {
        const r = await skeletonService.setSlot(props.skeletonId, slotName, value)
        if (r.success) emit('changed')
        else flashErr(r.error?.message || 'Could not save')
      } catch (e) {
        flashErr(e?.response?.data?.error?.message || 'Could not save')
      } finally { saving.value = null }
    }

    const clearSlot = (s) => bind(s.slotName, '')

    // Accept a picked / dragged / fresh element. `payload` = { kind, address }.
    const compatible = (slot, payloadKind) => {
      const k = slot.expectedKind
      if (!k) return true
      if (k === payloadKind) return true
      // posts live at skeletons/ addresses and vice-versa
      if (k === 'posts' && payloadKind === 'skeletons') return true
      if (k === 'skeletons' && payloadKind === 'posts') return true
      return false
    }

    const assignTo = (slot, payload) => {
      if (!compatible(slot, payload.kind)) {
        flashErr(`${slot.slotName} accepts ${slot.expectedKind}, not ${payload.kind}`)
        return
      }
      bind(slot.slotName, payload.address)
    }

    // From the search panel / fresh tray "pick" — fill the selected slot,
    // else the first empty compatible one.
    const assign = (payload) => {
      let slot = props.slots.find(s => s.slotName === selectedSlot.value)
      if (!slot) {
        slot = props.slots.find(s => !s.ref && compatible(s, payload.kind))
        if (!slot) { flashErr('Select a field first (click a row)'); return }
      }
      assignTo(slot, payload)
    }

    const onDrop = (slot, e) => {
      dragOver.value = null
      try {
        const payload = JSON.parse(e.dataTransfer.getData('application/x-pathos-ref'))
        if (payload?.address) assignTo(slot, payload)
      } catch (_) { /* not ours */ }
    }

    // ── create tools + fresh tray (populate session) ──
    const fresh = computed(() => store.populate?.fresh || [])
    const openUploader = () => { useUploaderStore().open() }
    const openMaker = () => { useMakerStore().open() }
    const onFreshDragStart = (f, e) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({
        kind: f.kind, address: f.address, primary: f.primary || ''
      }))
    }

    onMounted(() => store.beginPopulate(props.skeletonId))
    onBeforeUnmount(() => store.endPopulate())

    const kindChipStyle = (kind) => ({ '--kind-color': kind ? kindFor(kind).color : 'rgba(90,100,110,0.8)' })
    const iconFor = (k) => kindFor(k).icon
    const colorFor = (k) => kindFor(k).color

    return {
      selectedSlot,
      selectedKind,
      selectSlot,
      canText,
      dragOver,
      saving,
      errorMsg,
      editing,
      editText,
      beginEdit,
      cancelEdit,
      commitText,
      clearSlot,
      assign,
      onDrop,
      fresh,
      openUploader,
      openMaker,
      onFreshDragStart,
      kindChipStyle,
      iconFor,
      colorFor
    }
  }
})
</script>

<style lang="scss" scoped>
.inst-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 18px;
  align-items: start;
}

// ── table ──
.inst-table-wrap {
  background: #ffffff;
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  min-width: 0;
}

.inst-table__head {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #f4f7fb;
  border-bottom: 1px solid #e2e6ed;
  font-size: 0.82em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5b6c82;
}
.inst-table__hint {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.82em;
  color: #8995a8;
}

.inst-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th {
    text-align: left;
    font-size: 0.68em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8995a8;
    padding: 7px 14px;
    border-bottom: 1px solid #eef1f6;
    font-weight: 600;
  }
  .col-label { width: 26%; }
  .col-constraint { width: 16%; }
  .col-value { width: 58%; }
}

.inst-row {
  cursor: pointer;
  border-bottom: 1px solid #eef1f6;
  transition: background 0.1s;

  td { padding: 9px 14px; vertical-align: top; }

  &:hover { background: #f9fbfd; }
  &.is-selected { background: #eef6f9; box-shadow: inset 3px 0 0 #00829c; }
  &.is-dragover td { background: rgba(0, 130, 156, 0.08); }
}

.field-name {
  font-size: 0.82em;
  font-weight: 700;
  color: #1F2A38;
  word-break: break-word;
}

.kind-chip {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 0.6em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--kind-color, #5b6c82);
}

.col-value { cursor: text; }

.cell-value {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: default;
}

.cell-mini {
  flex: 1;
  min-width: 0;
}

.cell-value__tools {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cell-empty {
  display: inline-flex;
  align-items: center;
  font-size: 0.78em;
  color: #8995a8;
}

.cell-saving { display: inline-flex; align-items: center; }

.cell-edit {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.cell-edit__input { flex: 1; min-width: 0; }
.cell-edit__actions { display: flex; flex-direction: column; gap: 4px; }

.cell-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #d0d8e3;
  border-radius: 5px;
  background: #fff;
  color: #5b6c82;
  cursor: pointer;
  &:hover { border-color: #00829c; color: #00829c; }
  &--ok:hover { border-color: #2e8b57; color: #2e8b57; }
  &--danger { border: none; }
  &--danger:hover { background: rgba(var(--coral-rgb), 0.14); color: var(--coral-deep); border-color: transparent; }
}

.inst-msg { font-size: 0.8em; padding: 8px 14px; }

// ── populate panel ──
.inst-populate {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--paper-card, #fff);
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 12px;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

.populate-head {
  display: flex;
  align-items: center;
  font-size: 0.74em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5b6c82;
  font-family: var(--font-mono);
}
.populate-head__slot { margin-left: 6px; color: #00829c; text-transform: none; letter-spacing: 0; }

.populate-tools { display: flex; gap: 8px; }
.populate-tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  justify-content: center;
  height: 30px;
  border: 1px solid #d0d8e3;
  border-radius: var(--radius-sm);
  background: #fff;
  color: #2C3D4E;
  font-size: 0.76em;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
  &:hover { border-color: #00829c; color: #00829c; }
}

.fresh-tray {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: rgba(0, 130, 156, 0.06);
  border: 1px dashed rgba(0, 130, 156, 0.35);
}
.fresh-tray__label {
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #00829c;
  font-family: var(--font-mono);
}

.ref-result {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border: 1px solid #e2e6ed;
  border-radius: 7px;
  background: #fff;
  cursor: grab;
  text-align: left;
  &:hover { border-color: rgba(0, 130, 156, 0.5); .ref-result__add { color: #00829c; } }
}
.ref-result__lines { display: flex; flex-direction: column; min-width: 0; flex: 1; line-height: 1.3; }
.ref-result__primary {
  font-size: 0.76em; font-weight: 600; color: #1F2A38;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ref-result__secondary {
  font-size: 0.64em; color: #8995a8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ref-result__add { flex-shrink: 0; color: #b6c0cf; }

@media (max-width: 1023px) {
  .inst-editor { grid-template-columns: minmax(0, 1fr); }
  .inst-populate { position: static; max-height: none; }
}
</style>
