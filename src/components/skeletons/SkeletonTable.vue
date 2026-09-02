<template>
  <!-- THE GRID — a skeleton as its two axes (skeletons plan phase 2,
       2026-09-01; born the dense Field | Type | Data table of dashboards
       phase 1). The LABEL AXIS is the K links (the keys — labels, and only
       labels), the CONTENT AXIS is the V links (the cells — a text NOTE,
       any reference, or unbound). `axis` decides which way they read:
       'col' = keys down the first column (a record), 'row' = keys across
       the top. Same data, one <table>, laid out from one `cells` matrix so
       each cell kind is drawn exactly once.

       The Type column is GONE with the phase: a key's kind constraint
       (and its unit, when the expense backend declared one) is the key
       cell's hover title. Units left every generic surface (D6).

       EDITS ARE THE GRID'S OWN (the flyout has no host to own them, and
       three hosts restating the same seams was the phase-1 lesson): cells
       tap-to-edit (text, or a pasted `[[pathos:…]]` / dropped ref binds
       the reference), keys click into the label picker (rename = the
       head's K rebind), the ghost `+` key appends, `×` removes (with a 6s
       undo that re-appends), keys drag to reorder (ORDER), the corner flips
       the axis (AXIS). Every write is one skeleton.service call and the
       server re-gates it (40300/40303/40010/40902); `changed` tells a
       pre-walked host to reload its batch.

       NESTING (the ClaimTopologyNode precedent, now inside the grid): a
       cell bound to another skeleton renders that skeleton's whole grid
       INLINE, bare; `visited` (ancestor REF STRINGS, checked before any
       fetch — a cycle renders an inert chip) + `depth` (auto-nest budget
       2, then a strip with click-to-unfold). -->
  <div v-if="loading" class="skel-table__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="addressOf" :label="name" />

  <!-- GITHUB_PR instances bloom into their native card here — the one
       schema whose "table" is a card. -->
  <GithubPrCard v-else-if="isGithubPr" :slots="rows" />

  <div
    v-else
    class="skel-table"
    :class="['is-' + axis, { 'is-nested': depth > 0, 'is-editable': canEditCells, 'is-keys-editable': canEditKeys }]"
  >
    <div v-if="error" class="skel-table__error">{{ error }}</div>

    <table class="skel-table__grid">
      <colgroup v-if="axis === 'col'">
        <col class="skel-table__col-key">
        <col class="skel-table__col-cell">
      </colgroup>
      <tbody>
        <tr v-if="!rows.length && !canEditKeys">
          <td :colspan="axis === 'col' ? 2 : 1" class="skel-table__none">(no keys)</td>
        </tr>
        <tr v-for="(line, li) in matrix" :key="li" class="skel-table__line" :class="'skel-table__line--' + line.kind">
          <component
            :is="c.kind === 'key' || c.kind === 'ghost-key' ? 'th' : 'td'"
            v-for="c in line.cells"
            :key="c.kind + ':' + (c.row ? (c.row.slotLabelId || c.row.slotName) : '+')"
            :scope="c.kind === 'key' ? (axis === 'col' ? 'row' : 'col') : null"
            class="skel-table__c"
            :class="{
              'skel-table__key': c.kind === 'key',
              'skel-table__key--ghost': c.kind === 'ghost-key',
              'skel-table__cell': c.kind === 'cell',
              'skel-table__cell--ghost': c.kind === 'ghost-cell',
              'is-dragover': c.kind === 'key' && dragOver === keyId(c.row)
            }"
            :style="c.kind === 'key' ? keyStyle(c.row) : null"
            :draggable="c.kind === 'key' && canEditKeys && !picker ? 'true' : null"
            @dragstart="c.kind === 'key' && canEditKeys && onKeyDragStart(c.row, $event)"
            @dragover="c.kind === 'key' && canEditKeys && onKeyDragOver(c.row, $event)"
            @dragleave="c.kind === 'key' && (dragOver = null)"
            @drop="c.kind === 'key' ? onKeyDrop(c.row, $event) : (c.kind === 'cell' && onCellDrop(c.row, $event))"
            @dragenter="c.kind === 'cell' && canEditCells && $event.preventDefault()"
          >
            <!-- ── A KEY ─────────────────────────────────────────────── -->
            <template v-if="c.kind === 'key'">
              <span
                class="skel-table__key-name mono"
                :class="{ 'is-editable': canEditKeys }"
                :title="keyTitle(c.row)"
                @click.stop="canEditKeys && openPicker(c.row)"
              >{{ c.row.slotName }}</span>
              <span class="skel-table__key-tools">
                <button
                  v-if="canEditKeys"
                  type="button"
                  class="skel-table__key-x"
                  :title="'remove key ' + c.row.slotName"
                  @click.stop.prevent="removeKey(c.row)"
                ><q-icon name="close" size="10px" /></button>
                <button
                  v-if="head.id != null"
                  type="button"
                  class="skel-table__hist"
                  :title="c.row.slotName + ' — history'"
                  @click.stop.prevent="toggleHistory(c.row.slotName)"
                ><q-icon name="history" size="10px" /></button>
              </span>

              <!-- The label picker: a key is a label, and only ever
                   becomes another existing label. -->
              <div v-if="picker && picker.for === keyId(c.row)" class="skel-table__picker" @click.stop>
                <div class="skel-table__picker-head">
                  <span>rename <b class="mono">{{ c.row.slotName }}</b> to an existing label</span>
                  <button type="button" class="skel-table__picker-x" title="cancel" @click.stop.prevent="picker = null">
                    <q-icon name="close" size="11px" />
                  </button>
                </div>
                <LabelPicker compact :exclude-ids="usedLabelIds" @picked="onPicked" />
              </div>

              <!-- History popover: the cell's rebind chain AND the key's
                   own rename chain, one pane. -->
              <div v-if="historyOpen === c.row.slotName" class="skel-table__hist-pop" @click.stop>
                <div v-if="historyLoading" class="skel-table__hist-line"><q-spinner size="10px" /></div>
                <template v-else>
                  <div class="skel-table__hist-title">values</div>
                  <div v-if="!historyRows.length" class="skel-table__hist-line">(no versions)</div>
                  <div v-for="v in historyRows" :key="'v' + v.valueLinkId" class="skel-table__hist-line" :class="{ 'is-dead': v.deleted }">
                    <span class="skel-table__hist-actor">{{ v.actor?.username || '?' }}</span>
                    <span class="skel-table__hist-val">{{ v.textValue != null ? v.textValue : (v.ref ? v.ref.slice(0, 18) + '…' : '(unbound)') }}</span>
                    <span class="skel-table__hist-when">{{ histWhen(v) }}</span>
                  </div>
                  <template v-if="historyKeys.length > 1">
                    <div class="skel-table__hist-title">key</div>
                    <div v-for="k in historyKeys" :key="'k' + k.keyLinkId" class="skel-table__hist-line" :class="{ 'is-dead': k.deleted }">
                      <span class="skel-table__hist-actor">{{ k.actor?.username || '?' }}</span>
                      <span class="skel-table__hist-val mono">{{ k.name }}</span>
                      <span class="skel-table__hist-when">{{ histWhen(k) }}</span>
                    </div>
                  </template>
                </template>
              </div>
            </template>

            <!-- ── THE GHOST KEY — append through the picker ─────────── -->
            <template v-else-if="c.kind === 'ghost-key'">
              <button type="button" class="skel-table__ghost-btn" title="add a key (an existing label)" @click.stop.prevent="openPicker(null)">
                <q-icon name="add" size="11px" /><span>key</span>
              </button>
              <div v-if="picker && picker.for === '+'" class="skel-table__picker" @click.stop>
                <div class="skel-table__picker-head">
                  <span>add a key — pick an existing label</span>
                  <button type="button" class="skel-table__picker-x" title="cancel" @click.stop.prevent="picker = null">
                    <q-icon name="close" size="11px" />
                  </button>
                </div>
                <LabelPicker compact :exclude-ids="usedLabelIds" @picked="onPicked" />
              </div>
            </template>

            <!-- ── A CELL ────────────────────────────────────────────── -->
            <template v-else-if="c.kind === 'cell'">
              <div v-if="editing === c.row.slotName" class="skel-table__edit" @click.stop>
                <input
                  ref="editInput"
                  v-model="editText"
                  type="text"
                  class="skel-table__input mono"
                  placeholder="text, or paste a [[pathos:…]] reference"
                  @keydown.enter.prevent="commitEdit(c.row)"
                  @keydown.esc="cancelEdit"
                  @click.stop
                >
                <button type="button" class="skel-table__ok" title="Save (Enter)" @click.stop.prevent="commitEdit(c.row)">
                  <q-icon name="check" size="12px" />
                </button>
                <button type="button" class="skel-table__cancel" title="Cancel (Esc)" @click.stop.prevent="cancelEdit">
                  <q-icon name="close" size="12px" />
                </button>
              </div>

              <!-- A skeleton in a cell: its whole grid, inline. -->
              <template v-else-if="c.row.refKind === 'skeletons'">
                <InfoChip
                  v-if="visited.includes(c.row.ref)"
                  dense kind="skeletons" :address="c.row.ref"
                  title="already open above — a cycle"
                />
                <div v-else-if="depth < 2 || expanded.includes(c.row.ref)" class="skel-table__nest">
                  <SkeletonTable
                    :ref-or-id="c.row.ref"
                    :depth="depth + 1"
                    :visited="visitedNext"
                    :readonly="readonly"
                  />
                  <button
                    v-if="canEditCells"
                    type="button"
                    class="skel-table__nest-unbind"
                    title="replace this reference"
                    @click.stop.prevent="beginEdit(c.row)"
                  ><q-icon name="edit" size="10px" /></button>
                </div>
                <span v-else class="skel-table__strip">
                  <InfoChip dense kind="skeletons" :address="c.row.ref" />
                  <button
                    type="button"
                    class="skel-table__unfold"
                    title="unfold this skeleton"
                    @click.stop.prevent="expand(c.row.ref)"
                  ><q-icon name="unfold_more" size="12px" /></button>
                </span>
              </template>

              <span
                v-else-if="c.row.textValue"
                class="skel-table__text"
                :class="{ 'is-editable': canEditCells }"
                @click="canEditCells && beginEdit(c.row)"
              >{{ c.row.textValue }}</span>
              <span v-else-if="c.row.ref" class="skel-table__refcell">
                <InfoChip dense :kind="c.row.refKind || 'unknown'" :address="c.row.ref" />
                <button
                  v-if="canEditCells"
                  type="button"
                  class="skel-table__nest-unbind"
                  title="replace this reference"
                  @click.stop.prevent="beginEdit(c.row)"
                ><q-icon name="edit" size="10px" /></button>
              </span>
              <span
                v-else
                class="skel-table__empty"
                :class="{ 'is-editable': canEditCells }"
                @click="canEditCells && beginEdit(c.row)"
              >{{ c.row.value_withheld ? 'withheld' : (canEditCells ? 'tap to set' : 'unbound') }}</span>
            </template>

            <!-- ── THE GHOST CELL under/after the ghost key ──────────── -->
            <template v-else />
          </component>
        </tr>
      </tbody>
    </table>

    <!-- The corner: axis flip + the undo pill for a just-removed key. -->
    <div v-if="depth === 0 && (rows.length || canEditKeys)" class="skel-table__corner">
      <button
        type="button"
        class="skel-table__axis"
        :title="axis === 'col' ? 'keys down the first column — flip to a top row' : 'keys across the top row — flip to a first column'"
        @click.stop.prevent="flipAxis"
      >
        <q-icon :name="axis === 'col' ? 'view_column' : 'table_rows'" size="11px" />
        <span class="mono">{{ axis }}</span>
      </button>
      <span class="skel-table__count mono">{{ rows.length }} {{ rows.length === 1 ? 'key' : 'keys' }}</span>
      <button
        v-if="undo"
        type="button"
        class="skel-table__undo"
        :title="'put ' + undo.name + ' back'"
        @click.stop.prevent="undoRemove"
      >
        <q-icon name="undo" size="11px" /><span>undo remove {{ undo.name }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import GithubPrCard from 'src/components/dev/GithubPrCard.vue'
import LabelPicker from 'src/components/maker/LabelPicker.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { useAuthStore } from 'src/stores/auth'
import { kindFor } from 'src/utils/kinds'

// Schemas whose instances are platform plumbing: their cells are written
// by their own seams (posting, chatting, pinning, navigating), never by
// hand in a grid. Element headers (`ELEMENT:*`) likewise.
const PLUMBING = new Set(['POST', 'CHAT', 'MESSAGE', 'POLL', 'PINS', 'NAVIGATION', 'PATH_VIEW', 'DASHBOARD', 'USER_HOME', 'PATHOS_DOCS'])

// A pasted reference in a cell binds the element instead of minting a
// NOTE that says `[[pathos:…]]`. Both dresses: the chip grammar (with or
// without a sigil / label) and a bare `<kind>/<hash>`.
const REF_IN_TEXT = /^\s*[!-]?\[\[pathos:([a-z]+\/[0-9a-f]{16,})(?:\|[^\]]*)?\]\]\s*$/i
const BARE_REF = /^\s*([a-z]+\/[0-9a-f]{16,})\s*$/i

export default defineComponent({
  name: 'SkeletonTable',
  components: { InfoChip, GithubPrCard, LabelPicker },
  props: {
    // Pre-walked mode: the walk's `skeleton` head + `slots` array, handed
    // down by a host that already batched the read.
    skeleton: { type: Object, default: null },
    slots: { type: Array, default: null },
    // Self-resolving mode: a numeric skeleton id or a 'skeletons/<hash>'
    // address (pathos: dress tolerated).
    refOrId: { type: [String, Number], default: null },
    // Labels the failure chip when resolution dies.
    name: { type: String, default: '' },
    // Recursion guards for nested grids: `visited` = ancestor ref strings,
    // `depth` = this grid's nesting level (0 = top).
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] },
    // A host that shows a grid as evidence only (never as a desk).
    readonly: { type: Boolean, default: false }
  },
  // resolved: what the walk found ({ id, name, path, is_schema }) — hosts
  // that frame this grid title themselves after it.
  // changed: a write landed; a pre-walked host reloads its batch and hands
  // fresh `slots` down (the self-resolving mode re-walks on its own).
  emits: ['resolved', 'changed'],
  setup (props, { emit }) {
    const auth = useAuthStore()
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])
    const error = ref('')
    const flash = (m) => {
      error.value = m || ''
      if (m) setTimeout(() => { error.value = '' }, 4500)
    }
    const errOf = (r, e, fallback) => r?.error?.message || e?.response?.data?.error?.message || fallback

    const preWalked = computed(() => Array.isArray(props.slots))
    const addressOf = computed(() =>
      typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    )

    const load = async () => {
      if (preWalked.value) return
      if (props.refOrId == null) { failed.value = true; return }
      loading.value = walked.value == null
      failed.value = false
      try {
        let id = Number(props.refOrId)
        if (!Number.isFinite(id) || String(props.refOrId).includes('/')) {
          const s = await refService.summary(String(props.refOrId))
          id = s.success ? s.summary?.id : null
        }
        if (id == null) throw new Error('unresolvable')
        const r = await skeletonService.walk(id)
        if (!r.success) throw new Error('walk failed')
        walked.value = r.skeleton
        walkedSlots.value = r.slots || []
        emit('resolved', { id: r.skeleton.id, name: r.skeleton.name, path: r.skeleton.path, is_schema: r.skeleton.is_schema, owner_id: r.skeleton.owner_id, locked: r.skeleton.locked, lock_state: r.skeleton.lock_state })
      } catch (_) {
        failed.value = true
        walked.value = null
        walkedSlots.value = []
      }
      loading.value = false
    }
    onMounted(load)
    watch(() => props.refOrId, load)

    const head = computed(() => (preWalked.value ? props.skeleton : walked.value) || {})
    // Declaration order as the walk serves it — ORDER-sorted server-side.
    const rows = computed(() => (preWalked.value ? props.slots : walkedSlots.value) || [])
    const isGithubPr = computed(() => head.value.name === 'GITHUB_PR' && !head.value.is_schema)

    // After a write: pre-walked hosts get told (they reload and hand new
    // slots down); the self-resolving mode refreshes itself.
    const refresh = async () => {
      if (preWalked.value) { emit('changed'); return }
      await load()
    }

    // ── who may do what ──────────────────────────────────────────────
    const isPlumbing = computed(() => {
      const n = String(head.value.name || '')
      return n.startsWith('ELEMENT:') || PLUMBING.has(n)
    })
    // Who may write (skeletons plan phase 5): the owner, or — for a
    // skeleton on an organization's RESOURCES path — any current member
    // MASK; the walk says so in `can_write` (viewer-dependent, attached
    // by the controller). Keys follow the HEAD's own grant.
    const ownsHead = computed(() => {
      const h = head.value
      if (h.is_schema) return h.owner_id === auth.entityId || !!h.can_write
      return (h.schema?.owner_id != null && h.schema.owner_id === auth.entityId) || !!h.schema?.can_write
    })
    const headLocked = computed(() => {
      const h = head.value
      return h.is_schema ? !!h.locked : !!h.schema?.locked
    })
    // Keys need the HEAD (they are the head's) AND this skeleton unlocked:
    // a locked record changes nothing, keys included, even for the head's
    // owner — rename the keys from the head, or unlock first.
    const canEditKeys = computed(() =>
      !props.readonly && !isPlumbing.value && head.value.id != null &&
      ownsHead.value && !headLocked.value && !head.value.locked
    )
    const canWrite = computed(() => head.value.owner_id === auth.entityId || !!head.value.can_write)
    const canEditCells = computed(() =>
      !props.readonly && !isPlumbing.value && head.value.id != null &&
      !head.value.is_schema && !head.value.locked && canWrite.value
    )
    const headId = computed(() => head.value.is_schema ? head.value.id : head.value.schema?.id)

    // ── the axes ─────────────────────────────────────────────────────
    const axisLocal = ref(null)
    const axis = computed(() => axisLocal.value || head.value.axis || 'col')
    watch(head, () => { axisLocal.value = null })
    const flipAxis = async () => {
      const next = axis.value === 'col' ? 'row' : 'col'
      axisLocal.value = next
      if (props.readonly || !canWrite.value || head.value.locked || head.value.id == null) return
      try {
        const r = await skeletonService.setAxis(head.value.id, next)
        if (!r.success) flash(errOf(r, null, 'Could not save the axis'))
        else await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not save the axis')) }
    }

    // The one matrix both layouts draw from: lines of typed cells.
    const keyId = (row) => row.slotLabelId || row.slotName
    const matrix = computed(() => {
      const keys = rows.value.map(row => ({ kind: 'key', row }))
      const cells = rows.value.map(row => ({ kind: 'cell', row }))
      if (axis.value === 'row') {
        const kline = { kind: 'keys', cells: canEditKeys.value ? [...keys, { kind: 'ghost-key' }] : keys }
        const cline = { kind: 'cells', cells: canEditKeys.value ? [...cells, { kind: 'ghost-cell' }] : cells }
        return [kline, cline]
      }
      const lines = rows.value.map((row, i) => ({ kind: 'pair', cells: [keys[i], cells[i]] }))
      if (canEditKeys.value) lines.push({ kind: 'ghost', cells: [{ kind: 'ghost-key' }, { kind: 'ghost-cell' }] })
      return lines
    })

    const keyStyle = (row) => ({
      '--skel-table-kind': row.expectedKind ? kindFor(row.expectedKind).color : 'transparent'
    })
    const keyTitle = (row) => {
      const parts = [row.expectedKind ? 'accepts ' + row.expectedKind : 'any content']
      if (row.unit) parts.push(row.unit.symbol || row.unit.label)
      if (canEditKeys.value) parts.push('click to rename (pick a label) · drag to reorder')
      return parts.join(' · ')
    }
    const usedLabelIds = computed(() => rows.value.map(r => r.slotLabelId).filter(Boolean))

    // ── keys: rename / add / remove / reorder ────────────────────────
    const picker = ref(null) // { for: keyId | '+' }
    const openPicker = (row) => {
      picker.value = { for: row ? keyId(row) : '+' }
      historyOpen.value = null
      editing.value = null
    }
    const onPicked = async (leaf) => {
      const p = picker.value
      picker.value = null
      if (!p || !leaf?.id || headId.value == null) return
      try {
        const r = p.for === '+'
          ? await skeletonService.addSlots(headId.value, [{ labelId: leaf.id }])
          : await skeletonService.renameSlot(headId.value, rows.value.find(x => keyId(x) === p.for)?.slotName, leaf.id)
        if (!r.success) { flash(errOf(r, null, 'Could not change the key')); return }
        await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not change the key')) }
    }

    const undo = ref(null)
    let undoTimer = null
    const removeKey = async (row) => {
      if (headId.value == null) return
      try {
        const r = await skeletonService.removeSlot(headId.value, row.slotName)
        if (!r.success) { flash(errOf(r, null, 'Could not remove the key')); return }
        undo.value = { labelId: row.slotLabelId, name: row.slotName }
        clearTimeout(undoTimer)
        undoTimer = setTimeout(() => { undo.value = null }, 6000)
        await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not remove the key')) }
    }
    const undoRemove = async () => {
      const u = undo.value
      undo.value = null
      clearTimeout(undoTimer)
      if (!u || headId.value == null) return
      try {
        const r = await skeletonService.addSlots(headId.value, [{ labelId: u.labelId }])
        if (!r.success) { flash(errOf(r, null, 'Could not put the key back')); return }
        await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not put the key back')) }
    }

    const dragKey = ref(null)
    const dragOver = ref(null)
    const onKeyDragStart = (row, ev) => {
      dragKey.value = keyId(row)
      try { ev.dataTransfer.setData('text/plain', row.slotName); ev.dataTransfer.effectAllowed = 'move' } catch (_) { /* fine */ }
    }
    const onKeyDragOver = (row, ev) => {
      if (dragKey.value == null || keyId(row) === dragKey.value) return
      ev.preventDefault()
      dragOver.value = keyId(row)
    }
    const onKeyDrop = async (row, ev) => {
      ev.preventDefault()
      const from = dragKey.value
      dragKey.value = null
      dragOver.value = null
      if (from == null || keyId(row) === from || !canEditKeys.value) return
      const ids = rows.value.map(keyId)
      const fi = ids.indexOf(from)
      const ti = ids.indexOf(keyId(row))
      if (fi < 0 || ti < 0) return
      ids.splice(ti, 0, ids.splice(fi, 1)[0])
      const labelIds = ids.map(id => rows.value.find(r => keyId(r) === id)?.slotLabelId).filter(Boolean)
      try {
        const r = await skeletonService.setOrder(head.value.id, labelIds)
        if (!r.success) { flash(errOf(r, null, 'Could not reorder')); return }
        await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not reorder')) }
    }

    // ── cells ────────────────────────────────────────────────────────
    const editing = ref(null)
    const editText = ref('')
    const editInput = ref(null)
    const beginEdit = (row) => {
      editing.value = row.slotName
      editText.value = row.textValue || (row.ref ? `[[pathos:${row.ref}]]` : '')
      historyOpen.value = null
      picker.value = null
      nextTick(() => {
        const el = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value
        el?.focus?.()
      })
    }
    const cancelEdit = () => { editing.value = null; editText.value = '' }
    const bind = async (row, value) => {
      try {
        const r = await skeletonService.setSlot(head.value.id, row.slotName, value)
        if (!r.success) { flash(errOf(r, null, 'Could not save')); return }
        await refresh()
      } catch (e) { flash(errOf(null, e, 'Could not save')) }
    }
    const commitEdit = async (row) => {
      const text = String(editText.value).trim()
      editing.value = null
      const m = text.match(REF_IN_TEXT) || text.match(BARE_REF)
      await bind(row, m ? m[1].toLowerCase() : { text })
    }
    const onCellDrop = async (row, ev) => {
      if (!canEditCells.value) return
      let ref = ''
      try {
        const raw = ev.dataTransfer.getData('application/x-pathos-ref')
        if (raw) { const j = JSON.parse(raw); ref = j.address || j.ref || '' }
        if (!ref) {
          const t = ev.dataTransfer.getData('text/plain') || ''
          const m = t.match(REF_IN_TEXT) || t.match(BARE_REF)
          if (m) ref = m[1]
        }
      } catch (_) { /* foreign drag */ }
      if (!ref) return
      ev.preventDefault()
      await bind(row, String(ref).replace(/^pathos:/, '').toLowerCase())
    }

    // ── nesting ──────────────────────────────────────────────────────
    const expanded = ref([])
    const expand = (r) => { if (!expanded.value.includes(r)) expanded.value.push(r) }
    const visitedNext = computed(() =>
      head.value.path ? [...props.visited, head.value.path] : props.visited
    )

    // ── history popover ──────────────────────────────────────────────
    const historyOpen = ref(null)
    const historyLoading = ref(false)
    const historyRows = ref([])
    const historyKeys = ref([])
    const toggleHistory = async (slotName) => {
      if (historyOpen.value === slotName) { historyOpen.value = null; return }
      historyOpen.value = slotName
      picker.value = null
      historyLoading.value = true
      historyRows.value = []
      historyKeys.value = []
      try {
        const r = await skeletonService.history(head.value.id, { slot: slotName })
        if (r.success) {
          historyRows.value = (r.slots?.[0]?.versions || []).slice(0, 20)
          historyKeys.value = (r.slots?.[0]?.keys || []).slice(0, 20)
        }
      } catch (_) { /* the empty line stands */ }
      historyLoading.value = false
    }
    const histWhen = (v) => {
      const iso = v.moment?.time_utc
      if (!iso) return ''
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return {
      loading,
      failed,
      addressOf,
      error,
      head,
      rows,
      isGithubPr,
      canEditKeys,
      canEditCells,
      axis,
      flipAxis,
      matrix,
      keyId,
      keyStyle,
      keyTitle,
      usedLabelIds,
      picker,
      openPicker,
      onPicked,
      undo,
      removeKey,
      undoRemove,
      dragOver,
      onKeyDragStart,
      onKeyDragOver,
      onKeyDrop,
      editing,
      editText,
      editInput,
      beginEdit,
      cancelEdit,
      commitEdit,
      onCellDrop,
      expanded,
      expand,
      visitedNext,
      historyOpen,
      historyLoading,
      historyRows,
      historyKeys,
      toggleHistory,
      histWhen
    }
  }
})
</script>

<style lang="scss" scoped>
.skel-table__loading {
  padding: 6px 0;
}

.skel-table {
  // The dial set — hosts re-tone the whole grid by WRITING these on any
  // ancestor (NodeMini's dial pattern at grid scale). CONSUMED with
  // fallbacks, never self-defined. Defaults are the flyout grey family.
  --st-rule: var(--skel-table-rule, var(--grey-4));
  --st-ink-mute: var(--skel-table-ink-mute, var(--brown-4));
  --st-ink: var(--skel-table-ink, var(--brown-8));
  --st-hover: var(--skel-table-hover, var(--teal-12));

  position: relative;
  background: var(--skel-table-coat, var(--grey-3));
  border: 1px solid var(--st-rule);
  border-radius: 6px;
  overflow: visible;

  &.is-nested {
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.35);
  }
}

.skel-table__error {
  padding: 2px 6px;
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}

.skel-table__grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

// The record's split: keys take a third, cells the rest.
.skel-table__col-key { width: 34%; }
.skel-table__col-cell { width: 66%; }

.skel-table__c {
  padding: 3px 6px;
  vertical-align: top;
  border-bottom: 1px solid var(--st-rule);
  position: relative;
  min-width: 0;
  text-align: left;
}
.skel-table__line:last-child .skel-table__c { border-bottom: none; }
// Across the top row the keys sit on a rule and the cells split by
// vertical hairlines instead.
.is-row .skel-table__c + .skel-table__c { border-left: 1px solid var(--st-rule); }
.is-row .skel-table__line--keys .skel-table__c { border-bottom: 1px solid var(--skel-table-rule-strong, var(--grey-5)); }

// ── THE KEYS — the label axis, drawn as an axis ─────────────────────
.skel-table__key {
  background: var(--skel-table-key-coat, var(--grey-4));
  // The kind constraint colours the key's leading rule (transparent when
  // the key takes anything).
  box-shadow: inset 3px 0 0 var(--skel-table-kind, transparent);
  font-weight: 600;

  &.is-dragover { outline: 2px dashed var(--st-hover); outline-offset: -2px; }
}
.is-col .skel-table__key { border-right: 1px solid var(--st-rule); }

.skel-table__key-name {
  display: inline-block;
  max-width: 100%;
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--st-ink);
  word-break: break-word;
  vertical-align: middle;

  &.is-editable { cursor: pointer; }
  &.is-editable:hover { box-shadow: inset 0 -1px 0 var(--st-hover); }
}

.skel-table__key-tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  vertical-align: middle;
  opacity: 0.55;
  .skel-table__key:hover & { opacity: 1; }
}

.skel-table__key-x,
.skel-table__hist,
.skel-table__unfold,
.skel-table__nest-unbind,
.skel-table__picker-x,
.skel-table__axis,
.skel-table__undo,
.skel-table__ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 2px;
  border: none;
  background: none;
  color: var(--st-ink-mute);
  cursor: pointer;
  font: inherit;
  &:hover { color: var(--st-hover); }
}
.skel-table__key-x:hover { color: var(--coral-deep, #c05a4e); }

.skel-table__key--ghost,
.skel-table__cell--ghost {
  background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(0, 0, 0, 0.03) 6px 12px);
}
.skel-table__ghost-btn {
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}

// ── THE CELLS — the content axis ────────────────────────────────────
.skel-table__cell {
  font-size: 0.78em;
  color: var(--st-ink);
  word-break: break-word;
  &:hover { background: rgba(255, 255, 255, 0.35); }
}

.skel-table__text { white-space: pre-wrap; }
.skel-table__empty { font-style: italic; color: var(--st-ink-mute); }
.skel-table__text.is-editable,
.skel-table__empty.is-editable {
  cursor: pointer;
  &:hover { box-shadow: inset 0 -1px 0 var(--st-hover); }
}
.skel-table__refcell,
.skel-table__strip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}
.skel-table__nest {
  position: relative;
  margin: 1px 0;
  .skel-table__nest-unbind { position: absolute; top: 2px; right: 2px; opacity: 0.5; }
  &:hover .skel-table__nest-unbind { opacity: 1; }
}

.skel-table__none {
  padding: 8px;
  font-size: 0.74em;
  font-style: italic;
  color: var(--st-ink-mute);
}

// ── the corner ───────────────────────────────────────────────────────
.skel-table__corner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  border-top: 1px solid var(--st-rule);
  font-size: 0.62em;
  color: var(--st-ink-mute);
}
.skel-table__axis .mono { font-size: 1em; letter-spacing: 0.06em; text-transform: uppercase; }
.skel-table__count { margin-left: auto; }
.skel-table__undo { color: var(--coral-deep, #c05a4e); font-size: 1em; }

// ── editors + popovers, in the same grey family ─────────────────────
.skel-table__edit {
  display: flex;
  align-items: center;
  gap: 4px;
}
.skel-table__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--skel-table-rule-strong, var(--grey-5));
  border-radius: 4px;
  background: #fff;
  font-size: 0.9em;
  color: var(--st-ink);
  outline: none;
  &:focus { border-color: var(--st-hover); }
}
.skel-table__ok,
.skel-table__cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--skel-table-rule-strong, var(--grey-5));
  border-radius: 4px;
  background: #fff;
  color: var(--st-ink-mute);
  cursor: pointer;
  font-size: 0.8em;
  flex-shrink: 0;
  &:hover { color: var(--st-ink); border-color: var(--st-ink-mute); }
}
.skel-table__ok:hover { color: #2e8b57; border-color: #2e8b57; }
.skel-table__cancel:hover { color: var(--coral-deep); border-color: var(--coral-deep); }

.skel-table__picker,
.skel-table__hist-pop {
  position: absolute;
  z-index: 5;
  left: 0;
  top: 100%;
  min-width: 240px;
  max-width: 360px;
  padding: 6px;
  border: 1px solid var(--skel-table-rule-strong, var(--grey-5));
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}
.skel-table__picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 0.66em;
  color: var(--st-ink-mute);
  b { color: var(--st-ink); }
}
.skel-table__hist-title {
  font-size: 0.6em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--st-ink-mute);
  margin: 2px 0;
}
.skel-table__hist-line {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: 0.68em;
  padding: 1px 0;
  &.is-dead { opacity: 0.55; text-decoration: line-through; }
}
.skel-table__hist-actor { color: var(--st-ink-mute); flex: 0 0 auto; }
.skel-table__hist-val { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--st-ink); }
.skel-table__hist-when { color: var(--st-ink-mute); flex: 0 0 auto; }
</style>
