<template>
  <!-- THE SKELETON MINI (skeletons plan phase 2, 2026-09-01 — born
       ResourceSkeletonMini on 2026-08-10, the embeddable mini table; the
       name is the one the dead 2026-07 SkeletonMini left behind). The face
       a skeleton ref wears when quoted into a post body, dealt into a
       dashboard cell, listed by the reference browser, or previewed in
       the composer: MiniPanel chrome in the web-media mini's grammar —
       NodeMini's header ROW of hairline-split zones (the address chip +
       copy button, the name, the lock, the CORNER BUTTON that spawns the
       skeleton's own flyout window) over a SkeletonTable body and a
       provenance foot (schema · keys · author · lock), the way a YouTube
       mini's foot says PROVIDER :: url.

       The grid inside owns every edit (keys, cells, axis — see
       SkeletonTable); this panel owns the NAME (double-click, owner) and
       the LOCK (owner; a locked skeleton freezes keys and cells, 40303).

       Recursion rides the grid now: a cell bound to another skeleton
       renders that skeleton's grid inline (depth budget 2, cycle chip),
       so this panel no longer nests panels — `depth`/`visited` pass
       through to the grid.

       NOT a router-link (the grid's popovers and nested grids would nest
       anchors); the head carries explicit doors instead.

       bodyFit lifts MiniPanel's 110px excerpt cap — a grid's size is its
       meaning — and the body brings ITS OWN scroll contract in exchange:
       `--skel-mini-max-h`, published by the surface (dashboard cells;
       silence = uncapped).

       Re-toning: NodeMini's dial pattern — `--skel-mini-coat/-rule/
       -rule-hover/-head-ink` repaint the CHROME; the grid inside listens
       to its own `--skel-table-*` dials, which pass through untouched. -->
  <div v-if="loading" class="skel-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="addressOf" :label="name" />

  <!-- GITHUB_PR instances keep their native card, bare — the chrome would
       double-frame a card that is already one. -->
  <SkeletonTable v-else-if="isGithubPr" :skeleton="head" :slots="slotRows" />

  <div v-else class="skel-mini" :class="{ 'is-locked': head.locked, 'is-schema': head.is_schema }">
    <MiniPanel body-fit>
      <template #head>
        <!-- The address chip + its copy button: WHAT IT IS first. -->
        <span class="skel-mini__zone skel-mini__zone--chip">
          <InfoChip dense kind="skeletons" :address="head.path" :label="shortHash(head.path, 8)" />
          <button
            type="button"
            class="skel-mini__copy"
            :class="{ 'is-copied': copied }"
            :title="copied ? 'address copied' : 'copy the full skeleton address'"
            @click.stop.prevent="copyAddress"
          >
            <q-icon :name="copied ? 'check' : 'content_copy'" size="10px" />
          </button>
        </span>

        <!-- The name — the one elastic zone. Double-click renames (owner,
             unlocked): the name is data, `PUT /skeletons/:id/name`. -->
        <span class="skel-mini__zone skel-mini__zone--name" :title="renameHint">
          <input
            v-if="renaming"
            ref="renameInput"
            v-model="renameText"
            type="text"
            class="skel-mini__rename mono"
            @keydown.enter.prevent="commitRename"
            @keydown.esc="renaming = false"
            @blur="commitRename"
            @click.stop
          >
          <span
            v-else
            class="skel-mini__name-text nasalization"
            :class="{ 'is-editable': canRename }"
            @dblclick.stop.prevent="canRename && beginRename()"
          >{{ headline }}</span>
          <span v-if="head.is_schema" class="skel-mini__schema">SCHEMA</span>
        </span>

        <!-- The lock: every owned skeleton since phase 0. A locked one
             refuses every key and cell write (403 40303); flips are
             versioned NOTEs on the element header — receipts. -->
        <button
          v-if="isOwner"
          type="button"
          class="skel-mini__zone skel-mini__lock"
          :class="{ 'is-locked': head.locked }"
          :title="lockTitle"
          :disabled="lockBusy"
          @click.stop.prevent="toggleLock"
        >
          <q-icon :name="head.lock_state === 'unproven' ? 'gpp_maybe' : (head.locked ? 'lock' : 'lock_open')" size="11px" />
        </button>
        <span v-else-if="head.locked" class="skel-mini__zone skel-mini__lock is-locked" :title="lockTitle">
          <q-icon name="lock" size="11px" />
        </span>

        <!-- THE CORNER: this skeleton in its own floating window (the
             `?flyout=` door as a button — NodeMini's corner, verbatim). -->
        <button
          type="button"
          class="skel-mini__zone skel-mini__zone--open"
          title="open in the flyout viewer"
          @click.stop.prevent="openViewer"
        >
          <q-icon name="open_in_full" size="10px" />
        </button>
      </template>

      <template #body>
        <div v-if="editError" class="skel-mini__error">{{ editError }}</div>
        <div class="skel-mini__scroll">
          <SkeletonTable
            :skeleton="head"
            :slots="slotRows"
            :depth="depth"
            :visited="visited"
            @changed="refresh"
          />
        </div>
      </template>

      <!-- The provenance foot: what this skeleton is an instance of, how
           many keys, who owns it, and whether it is frozen. -->
      <template #foot>
        <span class="skel-mini__foot-line" :title="footTitle">
          <q-icon :name="skeletonKind.icon" size="10px" />
          <span class="skel-mini__foot-schema">{{ footSchema }}</span>
          <span class="skel-mini__foot-dot">·</span>
          <span class="skel-mini__foot-keys mono">{{ slotRows.length }} {{ slotRows.length === 1 ? 'key' : 'keys' }}</span>
          <template v-if="author">
            <span class="skel-mini__foot-dot">·</span>
            <span class="skel-mini__foot-author">by {{ author }}</span>
          </template>
          <template v-if="head.locked">
            <span class="skel-mini__foot-dot">·</span>
            <span class="skel-mini__foot-lock">{{ head.lock_state === 'unproven' ? 'lock unproven' : 'locked' }}</span>
          </template>
        </span>
      </template>
    </MiniPanel>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import SkeletonTable from 'src/components/skeletons/SkeletonTable.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { useAuthStore } from 'src/stores/auth'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { kindFor, shortHash } from 'src/utils/kinds'

// One summary per address per session — the foot's author line must not
// cost a dashboard of twelve minis twelve round-trips on every reload.
const summaryCache = new Map()

export default defineComponent({
  name: 'SkeletonMini',
  components: { MiniPanel, InfoChip, SkeletonTable },
  props: {
    // Pre-walked mode (dashboard cells deal batch-walk results out).
    skeleton: { type: Object, default: null },
    slots: { type: Array, default: null },
    // Self-resolving mode: numeric id or 'skeletons/<hash>' address.
    refOrId: { type: [String, Number], default: null },
    // Labels the failure chip.
    name: { type: String, default: '' },
    // Recursion guards, passed through to the grid.
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] }
  },
  // resolved mirrors SkeletonTable's emit; changed tells a pre-walked
  // host (the dashboard grid) its batch data went stale after a write.
  emits: ['resolved', 'changed'],
  setup (props, { emit }) {
    const auth = useAuthStore()
    const flyouts = useFlyoutViewersStore()
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])

    const preWalked = computed(() => Array.isArray(props.slots))
    const addressOf = computed(() =>
      typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    )

    const load = async () => {
      if (preWalked.value) { emitResolved(props.skeleton); return }
      if (props.refOrId == null) { failed.value = true; return }
      loading.value = walked.value == null
      failed.value = false
      try {
        let id = Number(props.refOrId)
        if (!Number.isFinite(id) || String(props.refOrId).includes('/')) {
          const s = await refService.summary(String(props.refOrId))
          id = s.success ? s.summary?.id : null
          if (s.success && s.summary) summaryCache.set(String(props.refOrId).replace(/^pathos:/, ''), s.summary)
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
    const isGithubPr = computed(() => head.value.name === 'GITHUB_PR' && !head.value.is_schema)
    const headline = computed(() => props.name || head.value.name || ('Skeleton #' + head.value.id))
    const skeletonKind = kindFor('skeletons')

    // The foot's author: the summary's `author.username`, fetched once
    // per address and only for top-level minis.
    const author = ref('')
    const loadAuthor = async () => {
      const p = head.value.path
      if (!p || props.depth > 0) return
      let s = summaryCache.get(p)
      if (!s) {
        try {
          const r = await refService.summary(p)
          if (r.success && r.summary) { s = r.summary; summaryCache.set(p, s) }
        } catch (_) { /* nameless foot */ }
      }
      author.value = s?.author?.username || ''
    }
    watch(() => head.value.path, loadAuthor, { immediate: true })

    const footSchema = computed(() => {
      const h = head.value
      if (h.is_schema) return 'schema'
      return h.schema ? ('instance of ' + (h.schema.name || ('#' + h.schema.id))) : 'skeleton'
    })
    const footTitle = computed(() => {
      const h = head.value
      const bits = [h.path]
      if (h.schema) bits.push('schema #' + h.schema.id + (h.schema.locked ? ' (keys locked)' : ''))
      if (h.axis) bits.push('axis ' + h.axis)
      return bits.filter(Boolean).join(' · ')
    })

    // ── the doors ─────────────────────────────────────────────────────
    const openViewer = () => {
      if (head.value.path) flyouts.spawnRef(head.value.path)
    }
    const copied = ref(false)
    const copyAddress = async () => {
      try {
        await navigator.clipboard.writeText(head.value.path || '')
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (_) { /* denied — the mark never flips */ }
    }

    // ── name (data) ───────────────────────────────────────────────────
    const isOwner = computed(() => head.value.owner_id != null && head.value.owner_id === auth.entityId)
    const canRename = computed(() => isOwner.value && !head.value.locked && head.value.id != null && !String(head.value.name || '').startsWith('ELEMENT:'))
    const renameHint = computed(() => canRename.value ? 'double-click to rename' : headline.value)
    const renaming = ref(false)
    const renameText = ref('')
    const renameInput = ref(null)
    const beginRename = () => {
      renaming.value = true
      renameText.value = head.value.name || ''
      nextTick(() => renameInput.value?.focus?.())
    }
    const commitRename = async () => {
      if (!renaming.value) return
      renaming.value = false
      const next = String(renameText.value).trim()
      if (!next || next === head.value.name) return
      try {
        const r = await skeletonService.rename(head.value.id, next)
        if (!r.success) { flashError(r.error?.message || 'Could not rename'); return }
        await refresh()
      } catch (e) { flashError(e?.response?.data?.error?.message || 'Could not rename') }
    }

    // ── the lock ──────────────────────────────────────────────────────
    const editError = ref('')
    const flashError = (m) => {
      editError.value = m || ''
      if (m) setTimeout(() => { editError.value = '' }, 4000)
    }
    const refresh = async () => {
      if (preWalked.value) { emit('changed'); return }
      await load()
    }
    const lockBusy = ref(false)
    const lockTitle = computed(() => {
      if (head.value.lock_state === 'unproven') return 'Lock unproven — the LOCK node is violated; see the integrity incident'
      if (head.value.locked) return isOwner.value ? 'Locked — click to unlock' : 'Locked'
      return 'Unlocked — click to lock (freezes keys and cells)'
    })
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
      skeletonKind,
      author,
      footSchema,
      footTitle,
      openViewer,
      copied,
      copyAddress,
      isOwner,
      canRename,
      renameHint,
      renaming,
      renameText,
      renameInput,
      beginRename,
      commitRename,
      editError,
      refresh,
      lockBusy,
      lockTitle,
      toggleLock,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
.skel-mini__loading {
  padding: 6px 0;
}

.skel-mini {
  // NodeMini's dial pattern: the chrome listens to four dials, consumed
  // with fallbacks (defaults = the grey family the grid also wears).
  --sm-ink: var(--skel-mini-head-ink, var(--brown-8, #4e342e));
  --sm-rule: var(--skel-mini-rule, var(--grey-5, #bdbdbd));

  :deep(.mini-panel) {
    --panel-chrome: var(--skel-mini-coat, var(--grey-3, #eeeeee));
    --panel-body: var(--skel-mini-coat, var(--grey-3, #eeeeee));
    --panel-rule: var(--sm-rule);
  }
  :deep(.mini-panel--hover):hover {
    --panel-rule: var(--skel-mini-rule-hover, var(--grey-7, #757575));
  }
  // The header is one ROW of zones, split by vertical hairlines.
  :deep(.mini-panel__head--own) {
    display: flex;
    align-items: stretch;
    min-width: 0;
    padding: 0;
  }
}

// ── the header zones (NodeMini's grammar) ────────────────────────────
.skel-mini__zone {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 4px;
  color: var(--sm-ink);
  white-space: nowrap;
  overflow: hidden;
  & + & { border-left: 1px solid var(--sm-rule); }
}
.skel-mini__zone--chip {
  flex: 0 1 auto;
  gap: 2px;
}
.skel-mini__zone--name {
  flex: 1 1 auto;
  justify-content: center;
  gap: 6px;
}
.skel-mini__name-text {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.76em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  &.is-editable { cursor: text; }
  &.is-editable:hover { box-shadow: inset 0 -1px 0 var(--teal-12, #00b8d4); }
}
.skel-mini__rename {
  flex: 1 1 auto;
  min-width: 0;
  height: 18px;
  padding: 0 4px;
  border: 1px solid var(--sm-rule);
  border-radius: 3px;
  background: #fff;
  font-size: 0.74em;
  color: var(--sm-ink);
  outline: none;
}
.skel-mini__schema {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid rgba(0, 130, 156, 0.35);
  background: rgba(0, 130, 156, 0.10);
  color: #00687d;
  font-size: 0.6em;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.skel-mini__copy,
.skel-mini__lock,
.skel-mini__zone--open {
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
  color: inherit;
}
.skel-mini__copy {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
  padding: 0;
  opacity: 0.6;
  &:hover, &.is-copied { opacity: 1; }
}
.skel-mini__lock {
  flex: 0 0 auto;
  &:hover { color: var(--teal-12, #00b8d4); }
  &.is-locked { color: var(--coral-deep, #c05a4e); }
  &:disabled { opacity: 0.5; cursor: default; }
}
.skel-mini__zone--open {
  flex: 0 0 auto;
  &:hover { color: var(--coral-deep, #d35f5f); }
}

.skel-mini__error {
  padding: 2px 6px;
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}

// The body's OWN scroll contract, in exchange for bodyFit: the surface
// publishes the ceiling (dashboard cells); silence = uncapped.
.skel-mini__scroll {
  max-height: var(--skel-mini-max-h, none);
  overflow: auto;
}

// ── the provenance foot ──────────────────────────────────────────────
:deep(.mini-panel__foot) .skel-mini__foot-line,
.skel-mini__foot-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.7em;
  color: var(--sm-ink);
}
.skel-mini__foot-schema,
.skel-mini__foot-author { overflow: hidden; text-overflow: ellipsis; }
.skel-mini__foot-dot { opacity: 0.5; }
.skel-mini__foot-lock { color: var(--coral-deep, #c05a4e); }
</style>
