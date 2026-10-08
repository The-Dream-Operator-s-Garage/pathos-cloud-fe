<template>
  <!-- THE POST CARD (2026-10-08, the card family) — THE postcard itself.
       The feed card (`posts/FeedStream.vue` `.post-square`) is the family's
       reference and stays its one source: given a feed row (`item`) this
       mounts the stream in EMBED MODE, the very card the feed draws, its
       thread doors and open door re-emitted in the family's dialect
       (`thread(slot)`, `select(target)`).
       Without a feed row — a post the public feed does not list for this
       viewer, or a read that arrived as GET /posts/:id — the FALLBACK is the
       family's own grammar around the post's words: the post marks in the
       cap, the owner and the minting in the byline, the whole body in the
       pit (MarkdownBody, the one pipeline, `auto` refs), the thread doors
       in the foot. ⚠ Until 2026-10-08 this file was the pre-feed list card
       (`.pathos-card`), unused since the 2026-07-25 feed refit. -->
  <FeedStream
    v-if="item"
    :key="'post-card:' + item.skeleton_id"
    class="post-card post-card--feed"
    :embed-item="item"
    :thread-on="threadOn"
    :thread-host="threadHost"
    @select="onSelectItem"
    @thread="(_, slot) => $emit('thread', slot)"
    @pins-changed="$emit('pins-changed')"
  />
  <CardPanel v-else-if="post" kind="posts" :address="post.path" :open="isOpen" :fill="fill" class="post-card post-card--read">
    <template #cap>
      <CardCap
        kind="posts"
        :icons="icons"
        :icons-title="post.forked_from_id != null ? 'A fork of another post' : 'A post'"
        :origins="origins"
        :title="title"
        :title-tip="post.path || title"
        :acts="[shareAct, pinAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="post.labels || []" />
    </template>

    <template #pit>
      <MarkdownBody
        v-if="body"
        class="post-card__md"
        :text="body"
        :breaks="false"
        ref-display="auto"
      />
      <div v-else class="post-card__empty">(no words — open the post)</div>
    </template>

    <template #foot>
      <CardFoot kind="posts" :id="post.id" :path="post.path" :stats="threadStats" @stat="onStat" />
    </template>

    <template v-if="composing && commentParent" #storey>
      <CommentMaker variant="inline" :parent="commentParent" @cancel="closeComposer" @posted="onCommented" />
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import FeedStream from './FeedStream.vue'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { hashOf } from 'src/utils/kinds'
import { entitySummary } from 'src/utils/entityDisplay'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'PostCard',
  components: { FeedStream, CardPanel, CardCap, CardByline, CardFoot, MarkdownBody, CommentMaker },
  props: {
    // A feed row (`GET /feed` item) — the postcard itself.
    item: { type: Object, default: null },
    // Else the read: { id, path, title, body|excerpt, owner_id, created_at,
    // forked_from_id, labels } (utils/elementShape's post shape).
    post: { type: Object, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    // The feed card's open doors say `select(item)`; the family says
    // `select(target)` — a host spawning windows gets the store's target.
    const onSelectItem = (it) => { emit('select', { kind: 'post', item: it }) }

    const title = computed(() => (props.post?.title || `post #${props.post?.id}`))
    const icons = computed(() => (props.post?.forked_from_id != null ? ['sym_o_post', 'sym_o_alt_route'] : ['sym_o_post']))
    const origins = computed(() => (props.post?.forked_from_id != null
      ? [{ word: 'Fork of', kind: 'posts', id: props.post.forked_from_id, path: '', display: `post #${props.post.forked_from_id}` }]
      : []))
    const body = computed(() => String(props.post?.body || props.post?.excerpt || ''))

    const author = ref(null)
    watch(() => props.post?.owner_id, async (id) => {
      author.value = null
      if (id == null) return
      const s = await entitySummary({ id })
      author.value = s ? { id, display_name: s.primary || '', pioneer: s.pioneer === true } : { id }
    }, { immediate: true })
    const when = computed(() => (props.post?.created_at ? { datetime: absoluteTime(props.post.created_at) } : null))

    // A post's address is its SKELETON's (`skeletons/<hash>`); the ref door
    // steps a POST instance forward to its card.
    const card = useElementCard(props, emit, () => ({
      kind: 'posts',
      address: props.post?.path ? `skeletons/${hashOf(props.post.path)}` : '',
      id: props.post?.id,
      label: title.value,
      ownerId: props.post?.owner_id ?? null
    }))

    return { onSelectItem, title, icons, origins, body, author, when, ...card }
  }
})
</script>

<style lang="scss" scoped>
.post-card--feed {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.post-card__md :deep(.markdown-body) { color: inherit; }
.post-card__empty {
  font-size: 0.82em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
}
</style>
