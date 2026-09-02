<template>
  <!-- THE EMBEDDABLE MINI TABLE (dashboards phase 2, 2026-08-10) — one
       skeleton readable inside another: MiniPanel chrome around a
       SkeletonTable body. This is the face a skeleton ref wears when
       quoted into a post body, bound into another skeleton's cell, or
       dealt into a dashboard grid cell — ElementMini dispatches every
       non-POST skeleton ref here (GITHUB_PR refs resolve through the same
       walk and bloom into their native card below, bare).

       RECURSION (the ClaimTopologyNode precedent): a cell whose ref is
       itself a skeleton nests another ResourceSkeletonMini. Guards:
       - `visited` — the ancestor REF STRINGS; a cell ref already on the
         list is a CYCLE and renders an inert dense chip, checked before
         any fetch (A↔B costs zero requests past the first table).
       - `depth` — auto-nesting budget 1: the top table (depth 0) expands
         its skeleton cells into tables; deeper skeleton cells render a
         leaf chip with a click-to-expand affordance, so depth is
         user-driven past the first level.

       The panel is NOT a router-link (SkeletonMini is): a recursive panel
       inside a linked panel would nest anchors. The header carries an
       explicit open glyph instead, and the whole head stays inert in
       drag-and-drop hosts.

       bodyFit lifts MiniPanel's 110px excerpt cap — a data table's size is
       its meaning — and the body brings ITS OWN scroll contract in
       exchange: `--resource-mini-max-h`, published by the surface
       (dashboard cells; silence = uncapped, the flyout precedent).

       Re-toning: NodeMini's dial pattern — `--resource-mini-coat/-rule/
       -rule-hover/-head-ink` repaint the CHROME; the table inside listens
       to its own `--skel-table-*` dials, which pass through this
       component untouched. -->
  <div v-if="loading" class="resource-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="addressOf" :label="name" />

  <!-- GITHUB_PR instances keep their native card, bare — the chrome would
       double-frame a card that is already one. -->
  <SkeletonTable v-else-if="isGithubPr" :skeleton="head" :slots="slotRows" />

  <div v-else class="resource-mini">
    <MiniPanel body-fit>
      <template #head>
        <div class="resource-mini__head">
          <q-icon :name="skeletonKind.icon" size="13px" class="resource-mini__icon" />
          <span class="resource-mini__name nasalization">{{ headline }}</span>
          <span v-if="head.is_schema" class="resource-mini__schema">SCHEMA</span>
          <span v-else-if="head.schema" class="resource-mini__of mono" :title="'instance of schema #' + head.schema.id">
            {{ head.schema.name || ('#' + head.schema.id) }}
          </span>
          <q-space />
          <!-- The LOCK (phase 6; every owned instance since 2026-09-01 —
               the RESOURCE badge stopped gating). A locked skeleton
               refuses every field write (403 40303) — flips are versioned
               NOTEs on the element header, receipts. -->
          <button
            v-if="isOwner && !head.is_schema"
            type="button"
            class="resource-mini__lock"
            :class="{ 'is-locked': head.locked }"
            :title="head.locked ? 'Locked — click to unlock' : 'Unlocked — click to lock'"
            :disabled="lockBusy"
            @click.stop.prevent="toggleLock"
          >
            <q-icon :name="head.locked ? 'lock' : 'lock_open'" size="12px" />
          </button>
          <span class="resource-mini__hash mono">{{ shortHash(head.path, 10) }}</span>
          <router-link
            v-if="head.id != null"
            :to="`/skeletons/${head.id}`"
            class="resource-mini__open"
            title="Open"
            @click.stop
          >
            <q-icon name="open_in_full" size="12px" />
          </router-link>
        </div>
      </template>

      <template #body>
        <div v-if="editError" class="resource-mini__error">{{ editError }}</div>
        <div class="resource-mini__scroll">
          <SkeletonTable
            :skeleton="head" :slots="slotRows"
            :editable="editable"
            @edit="onEdit"
          >
            <template #data="{ row, canEdit, beginEdit }">
              <!-- Skeleton-valued cells recurse; everything else restates
                   the table's default cell (text / dense chip / unbound)
                   — including the tap-to-edit wiring, which rides the
                   slot scope's hooks (slot content compiles HERE, so the
                   table's own spans never render in this mode). -->
              <template v-if="row.refKind === 'skeletons'">
                <InfoChip
                  v-if="visited.includes(row.ref)"
                  dense kind="skeletons" :address="row.ref"
                />
                <ResourceSkeletonMini
                  v-else-if="depth < 1 || expanded.includes(row.ref)"
                  :ref-or-id="row.ref"
                  :depth="depth + 1"
                  :visited="visitedNext"
                />
                <span v-else class="resource-mini__leaf">
                  <InfoChip dense kind="skeletons" :address="row.ref" />
                  <button
                    type="button"
                    class="resource-mini__leaf-expand"
                    title="Expand this table"
                    @click.stop.prevent="expand(row.ref)"
                  >
                    <q-icon name="unfold_more" size="13px" />
                  </button>
                </span>
              </template>
              <template v-else>
                <span
                  v-if="row.textValue"
                  class="resource-mini__text"
                  :class="{ 'is-editable': canEdit }"
                  @click="canEdit && beginEdit()"
                >{{ row.textValue }}</span>
                <InfoChip
                  v-else-if="row.ref" dense
                  :kind="row.refKind || 'unknown'" :address="row.ref"
                />
                <span
                  v-else
                  class="resource-mini__empty"
                  :class="{ 'is-editable': canEdit }"
                  @click="canEdit && beginEdit()"
                >{{ canEdit ? 'tap to set' : 'unbound' }}</span>
              </template>
            </template>
          </SkeletonTable>
        </div>
      </template>
    </MiniPanel>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import SkeletonTable from 'src/components/skeletons/SkeletonTable.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { useAuthStore } from 'src/stores/auth'
import { kindFor, shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'ResourceSkeletonMini',
  components: { MiniPanel, InfoChip, SkeletonTable },
  props: {
    // Pre-walked mode (dashboard cells deal batch-walk results out).
    skeleton: { type: Object, default: null },
    slots: { type: Array, default: null },
    // Self-resolving mode: numeric id or 'skeletons/<hash>' address.
    refOrId: { type: [String, Number], default: null },
    // Labels the failure chip.
    name: { type: String, default: '' },
    // Recursion guards (ClaimTopologyNode precedent) — see the template
    // comment. `visited` holds ancestor ref strings, `depth` this panel's
    // nesting level (0 = top).
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] }
  },
  // resolved mirrors SkeletonTable's emit; changed tells a pre-walked
  // host (the dashboard grid) its batch data went stale after an inline
  // write or a lock flip.
  emits: ['resolved', 'changed'],
  setup (props, { emit }) {
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])
    const expanded = ref([])

    const preWalked = computed(() => Array.isArray(props.slots))

    const addressOf = computed(() =>
      typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    )

    const load = async () => {
      if (preWalked.value) {
        emitResolved(props.skeleton)
        return
      }
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
        emitResolved(r.skeleton)
      } catch (_) {
        failed.value = true
        walked.value = null
        walkedSlots.value = []
      }
      loading.value = false
    }

    const emitResolved = (sk) => {
      if (!sk) return
      emit('resolved', { id: sk.id, name: sk.name, path: sk.path, is_schema: sk.is_schema })
    }

    onMounted(load)
    watch(() => props.refOrId, load)

    const head = computed(() => (preWalked.value ? props.skeleton : walked.value) || {})
    const slotRows = computed(() => (preWalked.value ? props.slots : walkedSlots.value) || [])

    const isGithubPr = computed(() =>
      head.value.name === 'GITHUB_PR' && !head.value.is_schema
    )

    const headline = computed(() =>
      props.name || head.value.name || ('Skeleton #' + head.value.id)
    )

    // Own ref joins the ancestors for the nested layer — the cycle check
    // runs on REF STRINGS before any fetch. skeleton.path is the full
    // 'skeletons/<hash>' address.
    const visitedNext = computed(() =>
      head.value.path ? [...props.visited, head.value.path] : props.visited
    )

    const expand = (refStr) => {
      if (!expanded.value.includes(refStr)) expanded.value.push(refStr)
    }

    const skeletonKind = kindFor('skeletons')

    // ── the mutation surface (phase 6; gate widened 2026-09-01) ──────
    // Editable = an unlocked instance the ACTING entity owns. Mutability
    // is the lock's business alone — the RESOURCE classification stopped
    // gating with the skeletons plan (it survives as information on the
    // expense cost tables). The server re-checks on write (40300/40303/
    // 40010 — the UI is a convenience, never the gate).
    const auth = useAuthStore()
    const isOwner = computed(() => head.value.owner_id === auth.entityId)
    const editable = computed(() =>
      !head.value.is_schema && !head.value.locked && isOwner.value
    )

    const editError = ref('')
    const flashError = (m) => {
      editError.value = m || ''
      if (m) setTimeout(() => { editError.value = '' }, 4000)
    }

    // Re-walk after a write: pre-walked hosts get told (reload), the
    // self-resolving mode refreshes itself.
    const refresh = async () => {
      if (preWalked.value) { emit('changed'); return }
      await load()
    }

    const onEdit = async ({ slotName, text }) => {
      try {
        const r = await skeletonService.setSlot(head.value.id, slotName, { text })
        if (!r.success) { flashError(r.error?.message || 'Could not save'); return }
        await refresh()
      } catch (e) {
        flashError(e?.response?.data?.error?.message || 'Could not save')
      }
    }

    const lockBusy = ref(false)
    const toggleLock = async () => {
      lockBusy.value = true
      try {
        const r = head.value.locked
          ? await skeletonService.unlock(head.value.id)
          : await skeletonService.lock(head.value.id)
        if (!r.success) flashError(r.error?.message || 'Lock flip failed')
        await refresh()
      } catch (e) {
        flashError(e?.response?.data?.error?.message || 'Lock flip failed')
      }
      lockBusy.value = false
    }

    return {
      loading,
      failed,
      addressOf,
      head,
      slotRows,
      isGithubPr,
      headline,
      visitedNext,
      expanded,
      expand,
      skeletonKind,
      isOwner,
      editable,
      editError,
      onEdit,
      lockBusy,
      toggleLock,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
.resource-mini__loading {
  padding: 6px 0;
}

.resource-mini {
  // NodeMini's dial pattern: the chrome listens to four dials, consumed
  // with fallbacks (defaults = MiniPanel's stock family chrome).
  :deep(.mini-panel) {
    --panel-chrome: var(--resource-mini-coat, #f4f7fb);
    --panel-body: var(--resource-mini-coat, #ffffff);
    --panel-rule: var(--resource-mini-rule, #e2e6ed);
  }
  :deep(.mini-panel--hover):hover {
    --panel-rule: var(--resource-mini-rule-hover, #e2e6ed);
  }
}

.resource-mini__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--resource-mini-head-ink, #2c3d4e);
}

.resource-mini__icon {
  flex-shrink: 0;
  color: currentColor;
}

.resource-mini__name {
  font-size: 0.82em;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-mini__schema {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 4px;
  background: rgba(0, 130, 156, 0.10);
  border: 1px solid rgba(0, 130, 156, 0.35);
  color: #00687d;
  font-size: 0.66em;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.resource-mini__of {
  flex-shrink: 0;
  font-size: 0.66em;
  color: #8995a8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 30%;
}

.resource-mini__hash {
  flex-shrink: 0;
  font-size: 0.64em;
  color: #8995a8;
}

.resource-mini__open {
  display: inline-flex;
  align-items: center;
  color: #5b6c82;
  &:hover { color: var(--coral-deep, #c05a4e); }
}

.resource-mini__lock {
  display: inline-flex;
  align-items: center;
  padding: 0 2px;
  border: none;
  background: none;
  color: #8995a8;
  cursor: pointer;

  &:hover { color: var(--teal-12, #00b8d4); }
  &.is-locked { color: var(--coral-deep, #c05a4e); }
  &:disabled { opacity: 0.5; cursor: default; }
}

.resource-mini__error {
  padding: 2px 6px;
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}

// The body's OWN scroll contract, in exchange for bodyFit: the surface
// publishes the ceiling (dashboard cells); silence = uncapped.
.resource-mini__scroll {
  max-height: var(--resource-mini-max-h, none);
  overflow: auto;
}

// The table's default cell, restated for the slot's non-skeleton branches
// (the slot replaces the WHOLE default — a scoped slot has no per-row
// fallback). Keep in step with SkeletonTable's own defaults.
.resource-mini__text {
  white-space: pre-wrap;
}

.resource-mini__empty {
  font-style: italic;
  color: var(--skel-table-ink-mute, var(--brown-4));
}

// The tap-to-edit affordance on the slot-restated cells (the table's own
// spans never render under the #data slot — keep in step with its rule).
.resource-mini__text.is-editable,
.resource-mini__empty.is-editable {
  cursor: pointer;
  &:hover { box-shadow: inset 0 -1px 0 var(--teal-12, #00b8d4); }
}

.resource-mini__leaf {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.resource-mini__leaf-expand {
  display: inline-flex;
  align-items: center;
  padding: 0 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: #8995a8;

  &:hover { color: var(--teal-12, #00b8d4); }
}
</style>
