<template>
  <div class="origin-panel">

    <div class="origin-header">
      <q-icon name="account_tree" size="13px" class="text-accent q-mr-xs" />
      <span class="nasalization text-accent" style="font-size:0.8em;">Origin</span>
      <q-space />
      <span v-if="origin" :class="'kind-chip kind-' + origin.kind">
        {{ origin.kind }}
      </span>
    </div>

    <div v-if="loading" class="text-center q-py-sm">
      <q-spinner color="primary" size="16px" />
    </div>

    <!-- ORIGINAL — node was created from scratch -->
    <div v-else-if="!origin || origin.kind === 'ORIGINAL'" class="origin-empty">
      <q-icon name="circle" size="14px" style="opacity:.3;" />
      Created from scratch
    </div>

    <!-- FORK — show the source node -->
    <router-link
      v-else-if="origin.kind === 'FORK' && origin.fork_of"
      :to="'/nodes/' + origin.fork_of.id"
      class="origin-card"
      title="Open the source node"
    >
      <div class="row items-center q-mb-xs no-wrap" style="gap:6px;">
        <q-icon name="call_split" size="13px" class="text-orange" />
        <span class="origin-label">forked from</span>
        <q-space />
        <q-icon name="chevron_right" size="13px" class="text-dim" />
      </div>
      <div class="origin-id">node #{{ origin.fork_of.id }}</div>
      <div class="origin-hash mono" :title="origin.fork_of.path">
        {{ shortHash(origin.fork_of.path) }}
      </div>
      <div v-if="origin.fork_of.content" class="origin-preview">
        {{ contentPreview(origin.fork_of.content) }}
      </div>
    </router-link>

    <!-- COMMENT — show the element this comments on. The parent can be a
         node (legacy or node-side comments) or a post (skeleton-based
         comments), distinguished by comment_of.kind. -->
    <router-link
      v-else-if="origin.kind === 'COMMENT' && origin.comment_of"
      :to="commentOfRoute"
      class="origin-card"
      :title="commentOfTitle"
    >
      <div class="row items-center q-mb-xs no-wrap" style="gap:6px;">
        <q-icon name="comment" size="13px" class="text-cyan" />
        <span class="origin-label">comment on</span>
        <q-space />
        <q-icon name="chevron_right" size="13px" class="text-dim" />
      </div>
      <div class="origin-id">{{ commentOfKindLabel }} #{{ origin.comment_of.id }}</div>
      <div class="origin-hash mono" :title="origin.comment_of.path">
        {{ shortHash(origin.comment_of.path) }}
      </div>
      <div v-if="origin.comment_of.owner_username" class="origin-by">
        by <span class="text-accent">{{ origin.comment_of.owner_username }}</span>
      </div>
      <div v-if="origin.comment_of.content" class="origin-preview">
        {{ contentPreview(origin.comment_of.content) }}
      </div>
    </router-link>

  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'

export default defineComponent({
  name: 'OriginPanel',
  props: {
    nodeId: { type: Number, default: null }
  },
  setup (props) {
    const origin  = ref(null)
    const loading = ref(true)

    // Backend now reports comment_of.kind ('node' | 'post'). Route + label
    // pick the matching dashboard surface so a comment-on-post jumps to
    // /posts/:id and a comment-on-node jumps to /nodes/:id.
    const commentOfRoute = computed(() => {
      const co = origin.value?.comment_of
      if (!co) return ''
      return co.kind === 'post' ? `/posts/${co.id}` : `/nodes/${co.id}`
    })
    const commentOfKindLabel = computed(() => {
      const co = origin.value?.comment_of
      return co?.kind === 'post' ? 'post' : 'node'
    })
    const commentOfTitle = computed(() =>
      commentOfKindLabel.value === 'post'
        ? 'Open the commented-on post'
        : 'Open the commented-on node'
    )

    const load = async () => {
      if (!props.nodeId) return
      loading.value = true
      try {
        const r = await nodeInteractionService.getOrigin(props.nodeId)
        if (r.success) origin.value = r
      } catch (_) { /* leave null */ }
      loading.value = false
    }

    onMounted(load)
    watch(() => props.nodeId, load)

    const shortHash = (path) => {
      const h = (path || '').split('/').pop()
      return h.slice(0, 14) + (h.length > 14 ? '…' : '')
    }

    const contentPreview = (raw) => {
      const stripped = (raw || '').replace(/[#*`_~\[\]>]/g, '').replace(/\n+/g, ' ').trim()
      return stripped.slice(0, 80) + (stripped.length > 80 ? '…' : '')
    }

    return {
      origin, loading, shortHash, contentPreview,
      commentOfRoute, commentOfKindLabel, commentOfTitle
    }
  }
})
</script>

<style lang="scss" scoped>
.origin-panel {
  margin-bottom: 12px;
}

.origin-header {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
  margin-bottom: 10px;
}

.kind-chip {
  font-family: 'Space Mono', monospace;
  font-size: 0.62em;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 3px;

  &.kind-ORIGINAL { background: rgba(var(--ink-rgb), 0.15); color: var(--ink); }
  &.kind-FORK     { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
  &.kind-COMMENT  { background: rgba(0, 188, 212, 0.15); color: #00BCD4; }
}

.origin-empty {
  font-size: 0.82em;
  color: rgba(255,255,255,0.4);
  text-align: center;
  padding: 12px 0;
  border: 1px dashed rgba(var(--ink-rgb), 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.origin-card {
  display: block;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  padding: 10px 12px;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;

  &:hover {
    border-color: rgba(var(--ink-rgb), 0.4);
    background: rgba(var(--ink-rgb), 0.06);
  }
}

.origin-label {
  font-size: 0.72em;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.origin-id {
  font-family: 'Space Mono', monospace;
  font-size: 0.82em;
  color: var(--ink-1);
}

.origin-hash {
  font-size: 0.68em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-top: 2px;
}

.origin-by {
  font-size: 0.72em;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
}

.origin-preview {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.6);
  margin-top: 6px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
