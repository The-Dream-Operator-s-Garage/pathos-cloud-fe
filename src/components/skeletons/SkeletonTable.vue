<template>
  <!-- THE DENSE TABLE (dashboards phase 1, 2026-08-10) — one skeleton as a
       real data table: Field | Type | Data. A skeleton already IS these
       three columns (walk gives slotName / expectedKind / textValue-or-ref
       per slot), so this component is one read drawn at table density and
       mounted at three scales: the flyout's generic face (max detail),
       ResourceSkeletonMini's body (phase 2), and dashboard grid cells
       (phase 4).

       Column semantics are SkeletonInstanceEditor's 26/16/58 — the editor
       is this table's read-write sibling and the two must agree on where a
       reader's eye finds a field. Tones are NOT the editor's white/blue:
       this table lives in the FLYOUT GREY FAMILY (plaque --grey-3, rules
       --grey-4/5, ink --brown-8/4) with teal ONLY on hover — the
       NodeMini-in-flyout precedent: a panel quoted into a grey box wears
       the box's neutrals and answers the pointer in colour.

       The tones are DIALS (NodeMini's dial pattern, the chat dock's
       six-name seam) so a host re-tones the whole table without a
       repainting modifier: --skel-table-coat / -rule / -rule-strong /
       -ink / -ink-mute / -hover.

       Two mounting modes:
       - pre-walked: `skeleton` + `slots` (the dashboard grid batch-walks
         once and deals the results out — never one walk per cell);
       - self-resolving: `refOrId` (a numeric id or 'skeletons/<hash>'
         address) — one GET /skeletons/:id/walk, `resolved` emitted so a
         host (ElementFlyout) can title itself after the instance.

       GITHUB_PR instances keep their native card (the SkeletonMini
       precedent): a PR ref pointed at this table blooms into GithubPrCard,
       not a generic field table. -->
  <div v-if="loading" class="skel-table__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="addressOf" :label="name" />

  <GithubPrCard v-else-if="isGithubPr" :slots="rows" />

  <div v-else class="skel-table">
    <table class="skel-table__grid">
      <colgroup>
        <col class="skel-table__col-field">
        <col class="skel-table__col-type">
        <col class="skel-table__col-data">
      </colgroup>
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="3" class="skel-table__none">(no fields)</td>
        </tr>
        <tr v-for="row in rows" :key="row.slotName" class="skel-table__row">
          <td class="skel-table__key">
            <span class="mono">{{ row.slotName }}</span>
            <!-- The per-row history glyph (phase 6): the slot's rebind
                 chain — actor, value, moment — off ?slot=, loaded when
                 the popover opens. Editable tables only: history is the
                 mutation surface's receipt trail. -->
            <button
              v-if="editable && head.id != null"
              type="button"
              class="skel-table__hist"
              title="This field's history"
              @click.stop.prevent="toggleHistory(row.slotName)"
            >
              <q-icon name="history" size="11px" />
            </button>
          </td>
          <td class="skel-table__type">
            <!-- The kind pill shows for BOTH bound and unbound rows — a
                 data table states its column types; the compact Mini only
                 hints them on empties. (The unit symbol stood beside it
                 from phase 6 until 2026-09-01 — units left every generic
                 skeleton surface; they remain the expense/receipt backend.) -->
            <span class="skel-table__kind" :style="kindStyle(row.expectedKind)">
              {{ row.expectedKind || 'any' }}
            </span>
          </td>
          <td class="skel-table__data">
            <!-- History popover (one open at a time, anchored to the row) -->
            <div v-if="historyOpen === row.slotName" class="skel-table__hist-pop" @click.stop>
              <div v-if="historyLoading" class="skel-table__hist-line"><q-spinner size="10px" /></div>
              <div v-else-if="!historyRows.length" class="skel-table__hist-line">(no versions)</div>
              <div v-for="v in historyRows" :key="v.valueLinkId" class="skel-table__hist-line" :class="{ 'is-dead': v.deleted }">
                <span class="skel-table__hist-actor">{{ v.actor?.username || '?' }}</span>
                <span class="skel-table__hist-val">{{ v.textValue != null ? v.textValue : (v.ref ? v.ref.slice(0, 18) + '…' : '(unbound)') }}</span>
                <span class="skel-table__hist-when">{{ histWhen(v) }}</span>
              </div>
            </div>

            <!-- Inline editor (phase 6): tap-to-edit on editable tables —
                 a bare text input for every textable cell (the STEP
                 steppers and number-typed input left with the units on
                 2026-09-01; a unit-declared slot still refuses off-STEP
                 text server-side and the host shows the 40010 message).
                 Enter/✓ commits (the host owns the setSlot), Esc cancels. -->
            <div v-if="editing === row.slotName" class="skel-table__edit" @click.stop>
              <input
                ref="editInput"
                v-model="editText"
                type="text"
                class="skel-table__input mono"
                @keydown.enter.prevent="commitEdit(row)"
                @keydown.esc="cancelEdit"
                @click.stop
              >
              <button type="button" class="skel-table__ok" title="Save (Enter)" @click.stop.prevent="commitEdit(row)">
                <q-icon name="check" size="12px" />
              </button>
              <button type="button" class="skel-table__cancel" title="Cancel (Esc)" @click.stop.prevent="cancelEdit">
                <q-icon name="close" size="12px" />
              </button>
            </div>

            <!-- The one cell slot: phase-2+ hosts (recursive minis, edit
                 cells) replace the default rendering per row. The scope
                 carries the edit hooks — slot content compiles in the
                 HOST's scope, so a host restating the text/empty branches
                 wires tap-to-edit through these, not through this file's
                 spans. -->
            <slot v-else name="data" :row="row" :can-edit="canEdit(row)" :begin-edit="() => beginEdit(row)">
              <span
                v-if="row.textValue"
                class="skel-table__text"
                :class="{ 'is-editable': canEdit(row) }"
                @click="canEdit(row) && beginEdit(row, $event)"
              >{{ row.textValue }}</span>
              <InfoChip
                v-else-if="row.ref" dense
                :kind="row.refKind || 'unknown'" :address="row.ref"
              />
              <span
                v-else
                class="skel-table__empty"
                :class="{ 'is-editable': canEdit(row) }"
                @click="canEdit(row) && beginEdit(row, $event)"
              >{{ canEdit(row) ? 'tap to set' : 'unbound' }}</span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import GithubPrCard from 'src/components/dev/GithubPrCard.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { kindFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'SkeletonTable',
  components: { InfoChip, GithubPrCard },
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
    // Phase 6 — the mutation surface: textable cells (unconstrained /
    // nodes) become tap-to-edit and rows grow the history glyph. The HOST
    // decides (unlocked + owner-viewed since 2026-09-01 — the RESOURCE
    // badge no longer gates) and owns the actual setSlot on `edit`.
    editable: { type: Boolean, default: false }
  },
  // resolved: what the walk found ({ id, name, path, is_schema }) — hosts
  // that frame this table title themselves after it.
  // edit: { slotName, text } — an inline commit; the host binds + reloads.
  emits: ['resolved', 'edit'],
  setup (props, { emit }) {
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])

    const preWalked = computed(() => Array.isArray(props.slots))

    const addressOf = computed(() =>
      typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    )

    const load = async () => {
      if (preWalked.value) return
      if (props.refOrId == null) { failed.value = true; return }
      loading.value = true
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
        emit('resolved', {
          id: r.skeleton.id,
          name: r.skeleton.name,
          path: r.skeleton.path,
          is_schema: r.skeleton.is_schema
        })
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
    // Declaration order preserved — a table reads as the schema's shape,
    // not re-sorted bound-first the way the glanceable Mini is.
    const rows = computed(() => (preWalked.value ? props.slots : walkedSlots.value) || [])

    const isGithubPr = computed(() =>
      head.value.name === 'GITHUB_PR' && !head.value.is_schema
    )

    const kindStyle = (kind) => ({
      '--skel-table-kind': kind ? kindFor(kind).color : 'var(--st-ink-mute)'
    })

    // ── inline editing (phase 6) ───────────────────────────────────
    const TEXTABLE = (kind) => !kind || kind === 'nodes'
    const canEdit = (row) => props.editable && TEXTABLE(row.expectedKind)

    const editing = ref(null)
    const editText = ref('')
    const beginEdit = (row) => {
      editing.value = row.slotName
      editText.value = row.textValue || ''
      historyOpen.value = null
    }
    const cancelEdit = () => { editing.value = null; editText.value = '' }
    const commitEdit = (row) => {
      const text = String(editText.value).trim()
      editing.value = null
      emit('edit', { slotName: row.slotName, text })
    }

    // ── per-slot history popover (phase 6) ─────────────────────────
    const historyOpen = ref(null)
    const historyLoading = ref(false)
    const historyRows = ref([])
    const toggleHistory = async (slotName) => {
      if (historyOpen.value === slotName) { historyOpen.value = null; return }
      historyOpen.value = slotName
      historyLoading.value = true
      historyRows.value = []
      try {
        const r = await skeletonService.history(head.value.id, { slot: slotName })
        if (r.success) {
          historyRows.value = (r.slots?.[0]?.versions || []).slice(0, 20)
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
      head,
      rows,
      isGithubPr,
      kindStyle,
      canEdit,
      editing,
      editText,
      beginEdit,
      cancelEdit,
      commitEdit,
      historyOpen,
      historyLoading,
      historyRows,
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
  // The dial set — hosts re-tone the whole table by WRITING these on any
  // ancestor (NodeMini's dial pattern at table scale; names follow the
  // dock's six-dial seam). CONSUMED with fallbacks, never self-defined —
  // a component that defined them on its own root would override the
  // host's inherited value. Defaults are the flyout grey family. The two
  // derived tones below are one seam each so the internal rules never
  // restate a fallback chain.
  --st-rule: var(--skel-table-rule, var(--grey-4));
  --st-ink-mute: var(--skel-table-ink-mute, var(--brown-4));

  background: var(--skel-table-coat, var(--grey-3));
  border: 1px solid var(--st-rule);
  border-radius: 6px;
  overflow: hidden;
}

.skel-table__grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th {
    text-align: left;
    font-size: 0.6em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    color: var(--st-ink-mute);
    padding: 4px 8px;
    border-bottom: 1px solid var(--skel-table-rule-strong, var(--grey-5));
  }
}

// The editor's 26/16/58, restated: this is the same table read-only.
.skel-table__col-field { width: 26%; }
.skel-table__col-type { width: 16%; }
.skel-table__col-data { width: 58%; }

.skel-table__row {
  td {
    padding: 4px 8px;
    vertical-align: top;
    border-bottom: 1px solid var(--st-rule);
  }
  &:last-child td { border-bottom: none; }

  // Teal answers the pointer and nothing else — the row marks with the
  // accent's inset bar, the neutrals hold everything at rest.
  &:hover td { background: rgba(255, 255, 255, 0.35); }
  &:hover td:first-child { box-shadow: inset 2px 0 0 var(--skel-table-hover, var(--teal-12)); }
}

.skel-table__key .mono {
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--skel-table-ink, var(--brown-8));
  word-break: break-word;
}

.skel-table__kind {
  display: inline-block;
  height: 16px;
  line-height: 16px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 0.58em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--skel-table-kind, var(--st-ink-mute));
  // A nested table's type column can shrink under 50px — the pill clips
  // to its first letters instead of wrapping into a dot.
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skel-table__data {
  min-width: 0;
  font-size: 0.78em;
  color: var(--skel-table-ink, var(--brown-8));
  word-break: break-word;
}

.skel-table__text {
  white-space: pre-wrap;
}

.skel-table__empty {
  font-style: italic;
  color: var(--st-ink-mute);
}

.skel-table__none {
  padding: 8px;
  font-size: 0.74em;
  font-style: italic;
  color: var(--st-ink-mute);
}

// ── phase 6: the mutation surface, in the same grey family ──────────
.skel-table__hist {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--st-ink-mute);
  cursor: pointer;
  vertical-align: middle;

  &:hover { color: var(--skel-table-hover, var(--teal-12)); }
}

.skel-table__hist-pop {
  margin-bottom: 4px;
  padding: 4px 6px;
  background: #fff;
  border: 1px solid var(--st-rule);
  border-radius: 5px;
  font-size: 0.7em;
}

.skel-table__hist-line {
  display: flex;
  gap: 6px;
  align-items: baseline;
  padding: 1px 0;

  &.is-dead { opacity: 0.55; }
  & + & { border-top: 1px dashed var(--st-rule); }
}

.skel-table__hist-actor {
  font-weight: 600;
  color: var(--skel-table-ink, var(--brown-8));
  flex-shrink: 0;
}

.skel-table__hist-val {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skel-table__hist-when {
  flex-shrink: 0;
  color: var(--st-ink-mute);
  font-size: 0.92em;
}

.is-editable {
  cursor: text;
  &:hover { box-shadow: inset 0 -1px 0 var(--skel-table-hover, var(--teal-12)); }
}

.skel-table__empty.is-editable {
  cursor: pointer;
}

.skel-table__edit {
  display: flex;
  align-items: center;
  gap: 3px;
}

.skel-table__input {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--skel-table-hover, var(--teal-12));
  border-radius: 4px;
  background: #fff;
  font-size: 0.76em;
  color: var(--skel-table-ink, var(--brown-8));
  outline: none;

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

  &:hover { color: var(--skel-table-ink, var(--brown-8)); border-color: var(--st-ink-mute); }
}

.skel-table__ok:hover { color: #2e8b57; border-color: #2e8b57; }
.skel-table__cancel:hover { color: var(--coral-deep); border-color: var(--coral-deep); }
</style>
