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
         host (SkeletonFlyout) can title itself after the instance.

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
          </td>
          <td class="skel-table__type">
            <!-- The kind pill shows for BOTH bound and unbound rows — a
                 data table states its column types; the compact Mini only
                 hints them on empties. -->
            <span class="skel-table__kind" :style="kindStyle(row.expectedKind)">
              {{ row.expectedKind || 'any' }}
            </span>
          </td>
          <td class="skel-table__data">
            <!-- The one cell slot: phase-2+ hosts (recursive minis, edit
                 cells) replace the default rendering per row. -->
            <slot name="data" :row="row">
              <span v-if="row.textValue" class="skel-table__text">{{ row.textValue }}</span>
              <InfoChip
                v-else-if="row.ref" dense
                :kind="row.refKind || 'unknown'" :address="row.ref"
              />
              <span v-else class="skel-table__empty">unbound</span>
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
    name: { type: String, default: '' }
  },
  // What the walk resolved ({ id, name, path, is_schema }) — hosts that
  // frame this table (SkeletonFlyout) title themselves after it.
  emits: ['resolved'],
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
      '--skel-table-kind': kind ? kindFor(kind).color : 'var(--skel-table-ink-mute)'
    })

    return { loading, failed, addressOf, rows, isGithubPr, kindStyle }
  }
})
</script>

<style lang="scss" scoped>
.skel-table__loading {
  padding: 6px 0;
}

.skel-table {
  // The dial set — hosts re-tone the whole table by writing these
  // (NodeMini's dial pattern at table scale; names follow the dock's
  // six-dial seam). Defaults are the flyout grey family.
  --skel-table-coat: var(--grey-3);
  --skel-table-rule: var(--grey-4);
  --skel-table-rule-strong: var(--grey-5);
  --skel-table-ink: var(--brown-8);
  --skel-table-ink-mute: var(--brown-4);
  --skel-table-hover: var(--teal-12);

  background: var(--skel-table-coat);
  border: 1px solid var(--skel-table-rule);
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
    color: var(--skel-table-ink-mute);
    padding: 4px 8px;
    border-bottom: 1px solid var(--skel-table-rule-strong);
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
    border-bottom: 1px solid var(--skel-table-rule);
  }
  &:last-child td { border-bottom: none; }

  // Teal answers the pointer and nothing else — the row marks with the
  // accent's inset bar, the neutrals hold everything at rest.
  &:hover td { background: rgba(255, 255, 255, 0.35); }
  &:hover td:first-child { box-shadow: inset 2px 0 0 var(--skel-table-hover); }
}

.skel-table__key .mono {
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--skel-table-ink);
  word-break: break-word;
}

.skel-table__kind {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 7px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 0.58em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--skel-table-kind, var(--skel-table-ink-mute));
}

.skel-table__data {
  min-width: 0;
  font-size: 0.78em;
  color: var(--skel-table-ink);
  word-break: break-word;
}

.skel-table__text {
  white-space: pre-wrap;
}

.skel-table__empty {
  font-style: italic;
  color: var(--skel-table-ink-mute);
}

.skel-table__none {
  padding: 8px;
  font-size: 0.74em;
  font-style: italic;
  color: var(--skel-table-ink-mute);
}
</style>
