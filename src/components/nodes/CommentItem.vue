<template>
  <div class="comment-item">

    <!-- Header — clickable to open the comment's node viewer -->
    <div
      class="comment-header"
      :class="{ 'is-link': !!comment.comment_node_id }"
      :title="comment.comment_node_id ? 'Open comment node #' + comment.comment_node_id : ''"
      @click="openCommentNode"
    >
      <q-avatar size="22px" color="primary" text-color="white"
        style="font-size:11px; flex-shrink:0; font-family:monospace;">
        {{ (comment.username || '?')[0].toUpperCase() }}
      </q-avatar>
      <span class="comment-author">{{ comment.username || 'anon' }}</span>
      <span class="comment-time">{{ timeAgo }}</span>
      <q-space />
      <HashLink
        v-if="comment.comment_node_id"
        :path="comment.comment_node_path"
        :id="comment.comment_node_id"
        kind-override="nodes"
        :truncate="10"
      />
    </div>

    <!-- Markdown content -->
    <MarkdownBody class="comment-md md-rendered q-mb-sm" :text="comment.content || ''" />

    <!-- Action bar -->
    <div class="comment-actions">
      <!-- Vote up -->
      <q-btn flat dense round size="xs" class="ca-btn"
        :icon="localVote === 'UP' ? 'thumb_up' : 'thumb_up_alt'"
        :color="localVote === 'UP' ? 'positive' : ''"
        @click.stop="castVote('UP')" />
      <span class="ca-count">{{ localUp }}</span>

      <!-- Vote down -->
      <q-btn flat dense round size="xs" class="ca-btn"
        :icon="localVote === 'DOWN' ? 'thumb_down' : 'thumb_down_alt'"
        :color="localVote === 'DOWN' ? 'negative' : ''"
        @click.stop="castVote('DOWN')" />
      <span class="ca-count">{{ localDown }}</span>

      <div class="ca-sep" />

      <!-- Open this comment node in the viewer -->
      <router-link
        v-if="comment.comment_node_id"
        :to="'/nodes/' + comment.comment_node_id"
        class="ca-link"
        @click.stop
      >
        <q-icon name="open_in_new" size="12px" class="q-mr-xs" />Open
      </router-link>
    </div>

  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import HashLink from 'src/components/shared/HashLink.vue'

export default defineComponent({
  name: 'CommentItem',
  components: { HashLink, MarkdownBody },
  props: {
    comment: { type: Object, required: true }
  },
  setup (props) {
    const router = useRouter()
    const navStore = useNavStore()

    const localUp = ref(parseInt(props.comment.votes_up) || 0)
    const localDown = ref(parseInt(props.comment.votes_down) || 0)
    const localVote = ref(props.comment.viewer_vote || null)

    const timeAgo = computed(() => {
      const ts = props.comment.created_at
      if (!ts) return ''
      const d = Date.now() - new Date(ts).getTime()
      const m = Math.floor(d / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    })

    const shortHash = (path) => {
      const h = (path || '').split('/').pop()
      return h.slice(0, 10) + '…'
    }

    // Programmatic navigation — avoids quirks with <component :is="router-link">
    const openCommentNode = () => {
      const id = props.comment.comment_node_id
      if (!id) return
      router.push('/nodes/' + id)
    }

    const castVote = async (direction) => {
      const nodeId = props.comment.comment_node_id
      if (!nodeId) return
      const targetMeta = {
        targetType: 'node',
        targetId: nodeId,
        targetRoute: `/nodes/${nodeId}`,
        targetLabel: `Comment #${props.comment.id}`,
        targetPath: props.comment.comment_node_path
      }
      if (localVote.value === direction) {
        await nodeInteractionService.unvote(nodeId)
        localVote.value = null
        direction === 'UP' ? localUp.value-- : localDown.value--
        navStore.recordAction('UNVOTE', targetMeta)
      } else {
        if (localVote.value) {
          localVote.value === 'UP' ? localUp.value-- : localDown.value--
        }
        await nodeInteractionService.vote(nodeId, direction)
        localVote.value = direction
        direction === 'UP' ? localUp.value++ : localDown.value++
        navStore.recordAction(direction === 'UP' ? 'VOTE_UP' : 'VOTE_DOWN', targetMeta)
      }
    }

    return { localUp, localDown, localVote, timeAgo, shortHash, openCommentNode, castVote }
  }
})
</script>

<style lang="scss" scoped>
.comment-item {
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 8px;
  padding: 12px 14px;
}

// Header (avatar + author + time + hash) — fully clickable
.comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 4px 6px;
  margin: -4px -6px 6px -6px;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.12s;

  &.is-link {
    cursor: pointer;
    &:hover {
      background: rgba(var(--ink-rgb), 0.08);
      .comment-author { color: var(--ink-1); }
      .hash-arrow     { opacity: 1; }
    }
  }
}

.comment-author {
  color: var(--ink);
  font-size: 0.82em;
  font-weight: 600;
  transition: color 0.12s;
}

.comment-time {
  color: rgba(255,255,255,0.4);
  font-size: 0.72em;
}

.comment-hash {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(var(--ink-rgb), 0.5);
  font-family: 'Space Mono', monospace;
  font-size: 0.7em;

  .hash-arrow {
    opacity: 0.4;
    transition: opacity 0.12s;
  }
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-top: 6px;
  border-top: 1px solid rgba(var(--ink-rgb), 0.08);
  margin-top: 6px;
}

.ca-btn       { color: rgba(255,255,255,0.35) !important; }
.ca-btn-text  { color: rgba(255,255,255,0.4) !important; font-size: 0.76em; }
.ca-count     { font-size: 0.76em; color: rgba(255,255,255,0.4); min-width: 14px; padding: 0 2px; }
.ca-sep       { width: 1px; height: 12px; background: rgba(255,255,255,0.08); margin: 0 4px; }
.ca-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.76em;
  color: rgba(255,255,255,0.4);
  text-decoration: none;
  &:hover { color: rgba(var(--ink-rgb), 0.7); }
}

// Markdown rendered inside comment (compact)
.comment-md {
  :deep(p)  { margin: 0.25em 0 !important; }
  :deep(h1), :deep(h2), :deep(h3) { font-size: 1em !important; margin: 0.4em 0 0.2em !important; }
  :deep(pre) { padding: 8px 10px !important; }
}

.md-rendered {
  color: #d0d0e0;
  font-size: 0.88em;
  line-height: 1.65;
  :deep(a)    { color: #00BCD4; text-decoration: none; }
  :deep(code) {
    background: rgba(var(--ink-rgb), 0.15); color: var(--ink);
    padding: 1px 4px; border-radius: 3px;
    font-family: 'Space Mono', monospace; font-size: 0.86em;
  }
  :deep(pre) {
    background: rgba(0,0,0,0.3); border: 1px solid rgba(var(--ink-rgb), 0.18);
    border-radius: 5px; padding: 8px 12px; overflow-x: auto;
    code { background: transparent; padding: 0; color: var(--ink-1); }
  }
  :deep(blockquote) {
    border-left: 3px solid rgba(var(--ink-rgb), 0.4);
    margin: 0.5em 0; padding: 2px 10px;
    color: rgba(208,208,224,0.6); font-style: italic;
  }
  :deep(ul), :deep(ol) { padding-left: 1.2em; margin: 0.3em 0; }
}
</style>
