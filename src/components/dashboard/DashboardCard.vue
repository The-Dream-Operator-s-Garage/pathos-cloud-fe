<template>
  <!-- THE DASHBOARD CARD (phase 9, 2026-10-19) — the board as a CARD, on
       the post card's grammar: the cap states what it is (`dashboard`) and
       what it instantiates (`Instance of <template chip> ::`), the byline
       who owns it, when, its labels; the pit is THE BOARD ITSELF (the live
       DashboardBoard, arrangeable in place by the owner through the EDIT
       act), the foot its slot count and depth with the thread doors.
       Acts: edit (owner) · template (owner) · share · pin · open. The side
       viewer and the flyout window both draw this; it FILLS the host. -->
  <div v-if="loading && !mark" class="dashboard-card__loading"><q-spinner size="14px" color="brown-6" /></div>
  <InfoChip v-else-if="failed" kind="dashboards" :address="address" :label="name" />
  <CardPanel v-else kind="dashboards" :address="address" :open="isOpen" :fill="fill" pit-fit>
    <template #cap>
      <CardCap
        kind="dashboards"
        :icons="['dashboard']"
        icons-title="A dashboard — a board of elements"
        :origins="origins"
        :title="headline"
        :title-tip="address || headline"
        :acts="[editAct, shareAct, pinAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="labels" />
    </template>

    <template #pit>
      <div class="dashboard-card__pit" :class="{ 'is-editing': editing }">
        <DashboardBoard
          ref="boardEl"
          :dashboard-id="mark.id"
          :editing="editing"
          fill
          @resolved="onResolved"
          @cannot-write="editing = false"
        />
      </div>
    </template>

    <template #foot>
      <CardFoot kind="dashboards" :id="mark.id" :path="address" :stats="threadStats" @stat="onStat">
        <template #end>
          <span class="element-card__stat mono" :title="footTitle">
            <q-icon name="dashboard" size="11px" />{{ leaves }} {{ leaves === 1 ? 'slot' : 'slots' }}
          </span>
          <span v-if="depth" class="element-card__stat mono" title="how deep the splits go">
            <q-icon name="account_tree" size="11px" />depth {{ depth }}
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
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import DashboardBoard from './DashboardBoard.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { entitySummary } from 'src/utils/entityDisplay'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'DashboardCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, InfoChip, CommentMaker, DashboardBoard },
  props: {
    // The summary's mark ({ id, name, leaves, depth, template }) when the
    // host already resolved it; else `address` self-resolves.
    dashboard: { type: Object, default: null },
    address: { type: String, default: '' },
    name: { type: String, default: '' },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const loading = ref(false)
    const failed = ref(false)
    const resolvedMark = ref(null)
    const mark = computed(() => props.dashboard || resolvedMark.value)
    const card_ = ref(null) // the board's card, once it loads
    const labels = ref([])

    const load = async () => {
      failed.value = false
      if (props.dashboard) { loadLabels(); return }
      if (!props.address) { failed.value = true; return }
      loading.value = true
      try {
        const s = await refService.summary(props.address)
        if (s?.success && s.summary?.dashboard) resolvedMark.value = s.summary.dashboard
        else failed.value = true
      } catch (_) { failed.value = true }
      loading.value = false
      loadLabels()
    }
    const loadLabels = async () => {
      labels.value = []
      const id = mark.value?.id
      if (id == null) return
      try {
        const r = await skeletonService.labels(id)
        labels.value = r?.labels || []
      } catch (_) { labels.value = [] }
    }
    watch(() => [props.address, props.dashboard?.id], load, { immediate: true })

    const boardEl = ref(null)
    const onResolved = (c) => { card_.value = c }
    const headline = computed(() => props.name || card_.value?.name || mark.value?.name || '(untitled board)')
    const leaves = computed(() => card_.value?.leaves ?? mark.value?.leaves ?? 0)
    const depth = computed(() => mark.value?.depth ?? 0)
    const template = computed(() => card_.value?.template || mark.value?.template || null)
    const origins = computed(() => (template.value && template.value.name !== 'DASHBOARD'
      ? [{ word: 'Instance of', kind: 'skeletons', id: template.value.id, path: template.value.path || '', display: template.value.name || '' }]
      : []))

    const author = ref(null)
    watch(() => card_.value?.owner_id, async (id) => {
      author.value = null
      if (id == null) return
      const s = await entitySummary({ id })
      author.value = s ? { id, display_name: s.primary || '', pioneer: s.pioneer === true } : { id }
    }, { immediate: true })
    const when = computed(() => {
      const ts = card_.value?.created_at
      return ts ? { datetime: absoluteTime(ts) } : null
    })

    const card = useElementCard(props, emit, () => ({
      kind: 'dashboards',
      address: props.address || '',
      id: mark.value?.id,
      label: headline.value,
      ownerId: card_.value?.owner_id ?? null
    }))

    const editing = ref(false)
    const editAct = computed(() => ({
      key: 'edit',
      icon: editing.value ? 'done' : 'edit',
      title: editing.value ? 'Done arranging' : 'Arrange this board — split, resize, fill its slots',
      on: editing.value,
      hidden: !card.isOwner.value,
      onClick: () => { editing.value = !editing.value }
    }))

    const footTitle = computed(() => [props.address, template.value && `instance of ${template.value.name}`].filter(Boolean).join(' · '))

    return { loading, failed, mark, labels, boardEl, onResolved, headline, leaves, depth, origins, author, when, editing, editAct, footTitle, ...card }
  }
})
</script>

<style lang="scss" scoped>
.dashboard-card__loading { padding: 6px 0; }

// The board fills the pit; its slots scroll themselves.
.dashboard-card__pit {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  height: 100%;
  --dash-board-h: 420px;
}
</style>
