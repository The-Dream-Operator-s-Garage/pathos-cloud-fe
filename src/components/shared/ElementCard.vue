<template>
  <!-- THE ELEMENT CARD (2026-10-08, user ask: "a new family of components:
       the X-Card components, like the post cards … a family extension so we
       can have cards of all elements … use this card on the side viewer
       instead of the mini components. The Cards should be more enriched and
       full, while mini components are meant for quick visualization, like a
       vivid summary").

       The "any element as a Card" dispatcher — `ElementMini`'s twin one
       tier up. Give it an address ('<kind>/<hash>', the `posts/` and
       `files/` aliases included), a pre-resolved target ({ kind, node |
       label | path | skeleton | entity | moment | link | secret }) or a feed
       row (`item`), and it renders the matching XCard:

         node → NodeCard · path → PathCard · post → PostCard (THE postcard,
         FeedStream's embed, when the feed lists it; the read otherwise) ·
         label → LabelCard · entity → EntityCard · moment → MomentCard ·
         link → LinkCard · secret → SecretCard · skeleton → SkeletonCard

       Both families resolve through ONE table (`utils/elementShape.js`), so
       a kind the Mini reaches the Card reaches. Unresolvable refs degrade to
       an InfoChip, locked ones to the LockedChip — the Mini's rule.

       THE DIALECT every card speaks (useElementCard): `select(target)` for
       the open doors when the host spawns windows (`window-host`),
       `thread(slot)` for the foot's comment / fork doors when the host shows
       threads (`thread-host`, the totals handed in as `thread`),
       `pins-changed` up the same route the feed's takes, and `resolved({
       kind, fills })` once the kind is known — a FILLING kind (the label's
       unravel viewer) asks its host for the whole height. -->
  <div class="element-card-host" :class="{ 'element-card-host--fill': fill && fills }">
    <div v-if="loading" class="element-card-host__loading">
      <q-spinner size="16px" color="primary" />
    </div>

    <PostCard
      v-else-if="shape.kind === 'post'"
      :key="'card:post:' + (feedItem?.skeleton_id ?? shape.post?.id)"
      :item="feedItem"
      :post="shape.post"
      v-bind="dialect"
      v-on="listeners"
    />
    <NodeCard v-else-if="shape.kind === 'node' && shape.node" :key="'card:node:' + shape.node.id" :node="shape.node" v-bind="dialect" v-on="listeners" />
    <PathCard v-else-if="shape.kind === 'path' && shape.path" :key="'card:path:' + shape.path.id" :path="shape.path" :steps="shape.steps" v-bind="dialect" v-on="listeners" />
    <LabelCard v-else-if="shape.kind === 'label' && shape.label" :key="'card:label:' + shape.label.id" :label="shape.label" v-bind="dialect" v-on="listeners" />
    <EntityCard
      v-else-if="shape.kind === 'entity' && shape.entity"
      :key="'card:entity:' + shape.entity.id"
      :entity="shape.entity"
      :moment="shape.moment"
      :labels="shape.labels"
      :organization="shape.organization"
      v-bind="dialect"
      v-on="listeners"
    />
    <MomentCard v-else-if="shape.kind === 'moment' && shape.moment" :key="'card:moment:' + shape.moment.id" :moment="shape.moment" :human="shape.human" v-bind="dialect" v-on="listeners" />
    <LinkCard
      v-else-if="shape.kind === 'link' && shape.link"
      :key="'card:link:' + shape.link.id"
      :link="shape.link"
      :target="shape.target"
      :parent-path="shape.parentPath"
      :prev="shape.prev"
      :next="shape.next"
      :owner="shape.owner"
      :moment="shape.moment"
      v-bind="dialect"
      v-on="listeners"
    />
    <SecretCard v-else-if="shape.kind === 'secret' && shape.secret" :key="'card:secret:' + shape.secret.id" :secret="shape.secret" :owner="shape.owner" :receiver="shape.receiver" v-bind="dialect" v-on="listeners" />
    <SkeletonCard
      v-else-if="shape.kind === 'skeleton'"
      :key="'card:skeleton:' + shape.skeletonId"
      :ref-or-id="shape.skeletonId"
      :name="label || shape.skeletonName"
      v-bind="dialect"
      v-on="listeners"
    />

    <LockedChip v-else-if="shape.kind === 'locked'" :address="chipAddress" />
    <InfoChip v-else :address="chipAddress" :label="label" />
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import PostCard from 'src/components/posts/PostCard.vue'
import NodeCard from 'src/components/nodes/NodeCard.vue'
import PathCard from 'src/components/paths/PathCard.vue'
import LabelCard from 'src/components/labels/LabelCard.vue'
import EntityCard from 'src/components/entities/EntityCard.vue'
import MomentCard from 'src/components/moments/MomentCard.vue'
import LinkCard from 'src/components/links/LinkCard.vue'
import SecretCard from 'src/components/secrets/SecretCard.vue'
import SkeletonCard from 'src/components/skeletons/SkeletonCard.vue'
import InfoChip from './InfoChip.vue'
import LockedChip from './LockedChip.vue'
import { feedService } from 'src/services/feed.service'
import { resolveElementShape } from 'src/utils/elementShape'
import { hashOf } from 'src/utils/kinds'
import { provideRenderDepth, DEPTH_DEFAULT } from 'src/composables/useRenderDepth'
import { CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

// The kinds whose card is a full-height viewer (the pit scrolls itself and
// wants the host's length): the label's unravel.
const FILLING = new Set(['label'])

export default defineComponent({
  name: 'ElementCard',
  components: { PostCard, NodeCard, PathCard, LabelCard, EntityCard, MomentCard, LinkCard, SecretCard, SkeletonCard, InfoChip, LockedChip },
  props: {
    // '<kind>/<hash>' reference — self-resolves.
    address: { type: String, default: '' },
    // Pre-resolved target ({ kind, node|label|path|… }) — skips the read.
    element: { type: Object, default: null },
    // A feed row — the post as its postcard, no read at all.
    item: { type: Object, default: null },
    // The InfoChip fallback's headline / a skeleton card's name.
    label: { type: String, default: '' },
    ...CARD_PROPS
  },
  emits: [...CARD_EMITS, 'resolved'],
  setup (props, { emit }) {
    // A card is a reading surface: the quoted references inside its pit
    // bloom as minis down to the feed's default depth.
    provideRenderDepth(ref(DEPTH_DEFAULT))

    const loading = ref(false)
    const shape = ref({ kind: null })
    const feedItem = ref(null)

    const chipAddress = computed(() => {
      if (props.address) return props.address
      const el = props.element
      if (!el) return ''
      const row = el.node || el.label || el.path || el.skeleton || el.entity || el.moment || el.link || el.secret
      return row?.path || ''
    })

    // A POST's card is the FEED CARD when the feed lists it for this viewer
    // (`GET /feed?hash=…&body=full`, the side viewer's own rule); the read's
    // fallback card otherwise.
    const feedRowFor = async (post) => {
      const hash = hashOf(post?.path || '')
      if (!hash) return null
      try {
        const r = await feedService.getPublic({ hash, body: 'full', limit: 1 })
        const it = r?.items?.[0]
        return it && String(it.skeleton_path || '').endsWith(hash) ? it : null
      } catch (_) { return null }
    }

    let seq = 0
    const load = async () => {
      const my = ++seq
      if (props.item) {
        shape.value = { kind: 'post', post: null }
        feedItem.value = props.item
        loading.value = false
        emit('resolved', { kind: 'post', fills: false })
        return
      }
      loading.value = true
      feedItem.value = null
      const next = await resolveElementShape({ address: props.address, element: props.element })
      if (my !== seq) return
      if (next.kind === 'post') feedItem.value = await feedRowFor(next.post)
      if (my !== seq) return
      shape.value = next
      loading.value = false
      emit('resolved', { kind: next.kind, fills: FILLING.has(next.kind) })
    }
    watch(() => [props.address, props.element, props.item], load, { immediate: true })

    const fills = computed(() => FILLING.has(shape.value.kind))

    // What every XCard receives and what it says back.
    const dialect = computed(() => ({
      threadOn: props.threadOn,
      threadHost: props.threadHost,
      thread: props.thread,
      windowHost: props.windowHost,
      fill: props.fill && fills.value
    }))
    const listeners = {
      select: (t) => emit('select', t),
      thread: (slot) => emit('thread', slot),
      'pins-changed': () => emit('pins-changed')
    }

    return { loading, shape, feedItem, chipAddress, fills, dialect, listeners }
  }
})
</script>

<style lang="scss" scoped>
.element-card-host {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
// A filling kind runs the host's height; the card inside stretches.
.element-card-host--fill {
  flex: 1 1 auto;
  height: 100%;
  > :deep(.element-card) { flex: 1 1 auto; }
}
.element-card-host__loading { padding: 8px 0; }
</style>
