<template>
  <!-- THE SKELETON CARD (2026-10-08, the card family) — a non-POST skeleton
       (a schema, or a populated instance) as a CARD: the post card's
       grammar around THE GRID. Where SkeletonMini is the embeddable table
       (a chip row over the grid), this is the full reading surface: the cap
       states what it is (`schema` for a schema, the `sym_o_mitre` for a
       populated skeleton) and what it is an instance of (`Instance of
       <schema chip> ::`), the byline who owns it, when it was minted and
       the labels attached to it (`GET /skeletons/:id/labels`), the pit the
       grid itself (SkeletonTable, enriched — nested skeletons as minis), the
       foot its key count and lock.
       Acts: lock (owner) · layout · share · pin (skeletons take pins) ·
       open; comments and forks offered (the holder rule, 2026-10-07).
       Self-resolving like the Mini: a walked head + slots, or `refOrId`. -->
  <div v-if="loading && !head.id" class="skeleton-card__loading"><q-spinner size="14px" color="primary" /></div>
  <InfoChip v-else-if="failed" kind="skeletons" :address="addressOf" :label="name" />
  <CardPanel v-else kind="skeletons" :address="head.path" :open="isOpen" :fill="fill" pit-fit>
    <template #cap>
      <CardCap
        kind="skeletons"
        :icons="[head.is_schema ? 'schema' : 'sym_o_mitre']"
        :icons-title="head.is_schema ? 'A schema — a shape other skeletons instantiate' : 'A populated skeleton'"
        :origins="origins"
        :title="headline"
        :title-tip="head.path || headline"
        :acts="[lockAct, layoutAct, shareAct, pinAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="labels" />
    </template>

    <template #pit>
      <div v-if="editError" class="skeleton-card__error">{{ editError }}</div>
      <div
        v-if="withheld"
        class="skeleton-card__withheld"
        role="button"
        :title="integrityTitle || 'keys withheld — integrity check failed'"
        @click.stop.prevent="openIntegrityReport"
      >
        <q-icon name="report" size="12px" />
        <span>keys withheld — integrity check failed{{ integrityReport ? ' · open Talavero\'s report' : '' }}</span>
      </div>
      <div v-else class="skeleton-card__scroll">
        <SkeletonTable
          :skeleton="head"
          :slots="slotRows"
          :depth="0"
          :visited="[head.path]"
          :layout="effectiveLayout"
          :enriched="true"
          @changed="refresh"
          @update:layout="setLayout"
        />
      </div>
    </template>

    <template #foot>
      <CardFoot kind="skeletons" :id="head.id" :path="head.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span class="element-card__stat mono" :title="footTitle">
            <q-icon :name="head.is_schema ? 'schema' : 'sym_o_mitre'" size="11px" />{{ withheld ? 'keys withheld' : (slotRows.length + ' ' + (slotRows.length === 1 ? 'key' : 'keys')) }}
          </span>
          <span v-if="head.locked" class="element-card__stat" :title="lockTitle">
            <q-icon :name="lockGlyph" size="11px" />{{ head.lock_state === 'unproven' ? 'unproven' : (sealed ? 'sealed' : 'locked') }}
          </span>
        </template>
      </CardFoot>
    </template>

    <template v-if="composing && commentParent" #storey>
      <CommentMaker variant="inline" :parent="commentParent" @cancel="closeComposer" @posted="onCommented" />
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import SkeletonTable from './SkeletonTable.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { entitySummary } from 'src/utils/entityDisplay'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

// The flyout's / the Mini's layout key — one setting, every surface.
const LAYOUT_KEY = 'pathos_skeleton_layout'

export default defineComponent({
  name: 'SkeletonCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, InfoChip, SkeletonTable, CommentMaker },
  props: {
    // Pre-walked: the head + its slot rows.
    skeleton: { type: Object, default: null },
    slots: { type: Array, default: null },
    // Self-resolving: a numeric id or 'skeletons/<hash>'.
    refOrId: { type: [String, Number], default: null },
    name: { type: String, default: '' },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const router = useRouter()
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])
    const labels = ref([])

    const preWalked = computed(() => Array.isArray(props.slots))
    const addressOf = computed(() => (typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''))
    const head = computed(() => (preWalked.value ? props.skeleton : walked.value) || {})
    const slotRows = computed(() => (preWalked.value ? props.slots : walkedSlots.value) || [])

    const loadLabels = async () => {
      labels.value = []
      if (head.value.id == null) return
      try {
        const r = await skeletonService.labels(head.value.id)
        labels.value = r?.labels || []
      } catch (_) { labels.value = [] }
    }
    const load = async () => {
      if (preWalked.value) { loadLabels(); return }
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
        loadLabels()
      } catch (_) {
        failed.value = true
        walked.value = null
        walkedSlots.value = []
      }
      loading.value = false
    }
    watch(() => [props.refOrId, props.skeleton?.id], load, { immediate: true })
    const refresh = async () => { if (!preWalked.value) await load() }

    const headline = computed(() => props.name || head.value.name || ('Skeleton #' + head.value.id))
    const origins = computed(() => (head.value.schema && !head.value.is_schema
      ? [{ word: 'Instance of', kind: 'skeletons', id: head.value.schema.id, path: head.value.schema.path || '', display: head.value.schema.name || '' }]
      : []))

    // WHO — the owner through the summary cache.
    const author = ref(null)
    watch(() => head.value.owner_id, async (id) => {
      author.value = null
      if (id == null) return
      const s = await entitySummary({ id })
      author.value = s ? { id, display_name: s.primary || '', pioneer: s.pioneer === true } : { id }
    }, { immediate: true })
    const when = computed(() => {
      const ts = head.value.created_at || head.value.createdAt
      return ts ? { datetime: absoluteTime(ts) } : null
    })

    // ── the verdict (the Mini's) ───────────────────────────────────────
    const integrityReport = computed(() => head.value.integrity?.report || null)
    const withheld = computed(() => head.value.slots_withheld === true)
    const integrityTitle = computed(() => {
      const s = head.value.integrity?.status
      if (s === 'ok') return 'proof verified — the spine and every live key link'
      if (s !== 'violated') return null
      const i = head.value.integrity || {}
      return integrityReport.value ? `integrity violated: ${i.check || 'integrity'} — click for Talavero's report` : `integrity violated: ${i.check || 'integrity'}`
    })
    const openIntegrityReport = () => {
      if (integrityReport.value) router.push({ path: '/feed', query: { flyout: integrityReport.value } })
    }

    // ── the layout, as an act ─────────────────────────────────────────
    const loadLayout = () => {
      try {
        const v = localStorage.getItem(LAYOUT_KEY)
        return v === 'horizontal' || v === 'vertical' ? v : null
      } catch (_) { return null }
    }
    const localLayout = ref(loadLayout())
    const effectiveLayout = computed(() => localLayout.value)
    const shownLayout = computed(() => effectiveLayout.value || (head.value.axis === 'row' ? 'horizontal' : 'vertical'))
    const setLayout = (v) => {
      localLayout.value = v === 'horizontal' ? 'horizontal' : 'vertical'
      try { localStorage.setItem(LAYOUT_KEY, localLayout.value) } catch (_) { /* preference only */ }
    }
    const layoutAct = computed(() => ({
      key: 'layout',
      icon: shownLayout.value === 'horizontal' ? 'swap_vert' : 'swap_horiz',
      title: shownLayout.value === 'horizontal'
        ? 'Lay the skeleton out vertically — keys down the first column'
        : 'Lay the skeleton out horizontally — keys across the top',
      on: shownLayout.value === 'horizontal',
      hidden: withheld.value,
      onClick: () => setLayout(shownLayout.value === 'horizontal' ? 'vertical' : 'horizontal')
    }))

    // ── the lock, as an act (the Mini's rules) ────────────────────────
    const card = useElementCard(props, emit, () => ({
      kind: 'skeletons',
      address: head.value.path || '',
      id: head.value.id,
      label: headline.value,
      ownerId: head.value.owner_id ?? null
    }))
    const canWrite = computed(() => card.isOwner.value || !!head.value.can_write)
    const editError = ref('')
    const flashError = (m) => {
      editError.value = m || ''
      if (m) setTimeout(() => { editError.value = '' }, 4000)
    }
    const lockBusy = ref(false)
    const sealed = computed(() => head.value.lock_state === 'sealed')
    const lockGlyph = computed(() => {
      if (head.value.lock_state === 'unproven') return 'gpp_maybe'
      if (sealed.value) return 'verified'
      return head.value.locked ? 'lock' : 'lock_open'
    })
    const lockTitle = computed(() => {
      if (head.value.lock_state === 'unproven') return 'Lock unproven — the LOCK node is violated; see the integrity incident'
      if (sealed.value) return 'A sealed version — seals never open; fork it to work on a copy'
      if (head.value.locked) return canWrite.value ? 'Locked — click to unlock' : 'Locked'
      return 'Unlocked — click to lock (freezes keys and cells)'
    })
    const toggleLock = async () => {
      if (sealed.value || !canWrite.value || lockBusy.value) return
      lockBusy.value = true
      try {
        const r = head.value.locked ? await skeletonService.unlock(head.value.id) : await skeletonService.lock(head.value.id)
        if (!r.success) flashError(r.error?.message || 'Lock flip failed')
        else if (r.pending) flashError('Asked your manager — the flip lands once the poll is approved; click again then.')
        await refresh()
      } catch (e) {
        flashError(e?.response?.data?.error?.message || 'Lock flip failed')
      }
      lockBusy.value = false
    }
    const lockAct = computed(() => ({
      key: 'lock',
      icon: lockGlyph.value,
      title: lockTitle.value,
      on: !!head.value.locked,
      hidden: !canWrite.value && !head.value.locked,
      disabled: lockBusy.value || sealed.value || !canWrite.value,
      onClick: toggleLock
    }))

    const footTitle = computed(() => {
      const h = head.value
      const bits = [h.path]
      if (h.schema) bits.push('schema #' + h.schema.id)
      if (h.axis) bits.push('axis ' + h.axis)
      return bits.filter(Boolean).join(' · ')
    })

    return {
      loading,
      failed,
      addressOf,
      head,
      slotRows,
      labels,
      headline,
      origins,
      author,
      when,
      integrityReport,
      integrityTitle,
      withheld,
      openIntegrityReport,
      effectiveLayout,
      setLayout,
      layoutAct,
      editError,
      refresh,
      sealed,
      lockGlyph,
      lockTitle,
      lockAct,
      footTitle,
      ...card
    }
  }
})
</script>

<style lang="scss" scoped>
.skeleton-card__loading { padding: 6px 0; }
.skeleton-card__scroll {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 6px;
  scrollbar-width: thin;
}
.skeleton-card__error {
  padding: 4px 8px;
  font-size: 0.78em;
  color: #a03d3d;
}
.skeleton-card__withheld {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  font-size: 0.78em;
  color: #a03d3d;
  cursor: pointer;
}
</style>
