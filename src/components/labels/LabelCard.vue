<template>
  <!-- THE LABEL CARD (2026-10-08, the card family) — a label as a CARD.
       Where LabelMini is the summary (the ancestry slider, three facts),
       this is the full reading: the cap states what it is (the `label`
       glyph, `verified` beside it for the platform's own vocabulary) and
       what it came out of (`Child of <parent chip> ::`); the byline's rail
       is the label's own classification — its TREE drawn as one plate
       (root head, the tail in ruled cells, this label the leaf); the pit is
       THE UNRAVEL VIEWER (LabelUnravel — the /labels/:id squares), which
       fills the host when the host lets it (the 2026-10-07 side-viewer
       rule: a label's face runs the well's length).
       Acts: share · pin (labels take pins) · open; the thread doors offer
       comments and forks (LABEL holds both since 2026-10-07). -->
  <CardPanel kind="labels" :address="label.path" :open="isOpen" :fill="fill" pit-fit>
    <template #cap>
      <CardCap
        kind="labels"
        :icons="icons"
        :icons-title="label.system_label ? 'A label of the platform\'s own vocabulary (verified)' : 'A label'"
        :origins="origins"
        :title="name"
        :title-tip="label.path || name"
        :acts="[shareAct, pinAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="ownChain" />
    </template>

    <template #pit>
      <LabelUnravel :key="'unravel:' + label.id" :label="label" class="label-card__unravel" />
    </template>

    <template #foot>
      <CardFoot kind="labels" :id="label.id" :path="label.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span class="element-card__stat" :title="chainTitle">
            <q-icon name="account_tree" size="11px" />{{ depthWord }}
          </span>
          <span v-if="label.system_label" class="element-card__stat" title="A system label — the platform's own vocabulary">
            <q-icon name="verified" size="11px" />system
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
import LabelUnravel from './LabelUnravel.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { recoverAncestry } from 'src/utils/labelChain'
import { entitySummary } from 'src/utils/entityDisplay'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'LabelCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, LabelUnravel, CommentMaker },
  props: {
    // Label row { id, path, name|text, ancestor_id, author_id|owner_id, system_label, created_at? }
    label: { type: Object, required: true },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const name = computed(() => props.label.name || props.label.text || `label #${props.label.id}`)
    const icons = computed(() => (props.label.system_label ? ['label', 'verified'] : ['label']))

    // The ancestry [root, …, this] — the cap's parent clause, the rail's
    // plate, the foot's depth all read it.
    const chain = ref([])
    const loadChain = async () => { chain.value = await recoverAncestry(props.label) }
    watch(() => props.label?.id, loadChain, { immediate: true })

    const parent = computed(() => (chain.value.length > 1 ? chain.value[chain.value.length - 2] : null))
    const origins = computed(() => (parent.value
      ? [{ word: 'Child of', kind: 'labels', id: parent.value.id, path: parent.value.path || '', display: parent.value.name || '' }]
      : []))
    const depthWord = computed(() => (chain.value.length > 1 ? `depth ${chain.value.length - 1}` : (chain.value.length === 1 ? 'root' : '…')))
    const chainTitle = computed(() => chain.value.map((c) => c.name).join(' › '))

    // The author — resolved by id through the summary cache.
    const authorId = computed(() => props.label.author_id ?? props.label.owner_id ?? null)
    const author = ref(null)
    watch(authorId, async (id) => {
      author.value = null
      if (id == null) return
      const s = await entitySummary({ id })
      author.value = s ? { id, display_name: s.primary || '', pioneer: s.pioneer === true } : { id }
    }, { immediate: true })

    // The rail: this label's own tree as ONE plate — the bundle util reads
    // a row with its chain exactly as the feed's label rows arrive.
    const ownChain = computed(() => (chain.value.length
      ? [{
          id: props.label.id,
          name: name.value,
          chain: chain.value.map((c) => ({ id: c.id, name: c.name })),
          system_label: !!props.label.system_label,
          owner: author.value
        }]
      : []))

    const when = computed(() => {
      const m = props.label.moment
      if (m?.id != null) return { id: m.id, datetime: m.human?.datetime || m.time_utc || '', place: m.human?.place || '' }
      const ts = props.label.created_at || props.label.createdAt
      return ts ? { datetime: absoluteTime(ts) } : null
    })

    const card = useElementCard(props, emit, () => ({
      kind: 'labels',
      address: props.label.path || '',
      id: props.label.id,
      label: name.value,
      ownerId: authorId.value
    }))

    return { name, icons, origins, depthWord, chainTitle, author, ownChain, when, ...card }
  }
})
</script>

<style lang="scss" scoped>
// The unravel viewer fills the pit; it scrolls itself.
.label-card__unravel {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
