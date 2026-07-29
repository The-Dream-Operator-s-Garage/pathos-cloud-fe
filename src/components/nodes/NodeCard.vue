<template>
  <router-link :to="'/nodes/' + node.id" class="node-card-link">
    <div class="pathos-card q-pa-md node-card">

      <div class="row items-start q-mb-sm no-wrap">
        <q-icon name="adjust" class="text-accent q-mr-sm" size="16px" style="margin-top:2px; flex-shrink:0;" />
        <div class="col" style="min-width:0; overflow:hidden;">
          <HashLink :path="node.path" :id="node.id" :show-icon="false" :truncate="22" />
        </div>
      </div>

      <!-- Comment-origin descriptor: surfaced only when the list endpoint
           pre-enriched the node with origin info. Hash hyperlinks to the
           root of the comment thread; intermediate comment hops are
           bypassed by the backend walker. -->
      <div
        v-if="originHashLabel"
        class="node-card-origin"
        @click.stop
      >
        Comment from
        <router-link
          v-if="originRoute"
          :to="originRoute"
          class="origin-hash-link mono"
        >{{ originHashLabel }}</router-link>
        <span v-else class="mono origin-hash-fallback">{{ originHashLabel }}</span>
      </div>

      <!-- Content preview (max 3 lines). File-backed nodes show a body
           excerpt (text kinds) or a filetype line — never the address. -->
      <div v-if="node.content" class="node-card-preview">
        <span v-if="isUrl" class="text-secondary" style="word-break:break-all;">{{ node.content }}</span>
        <NodeContentViewer v-else-if="node.file" :node="node" mode="excerpt" />
        <span v-else>{{ textPreview }}</span>
      </div>

      <div class="row items-center q-mt-sm text-dim" style="font-size:0.7em; gap:8px;">
        <span v-if="authorLabel" class="node-card-author">
          <EntityName :entity="node.author" :bold="false" />
        </span>
        <q-icon name="schedule" size="11px" class="q-mr-xs" />
        {{ timeAgo }}
        <q-space />
        <q-icon name="open_in_new" size="11px" style="opacity:.4;" />
      </div>

    </div>
  </router-link>
</template>

<script>
import { defineComponent, computed } from 'vue'
import HashLink from 'src/components/shared/HashLink.vue'
import EntityName from 'src/components/entities/EntityName.vue'
import NodeContentViewer from 'src/components/nodes/NodeContentViewer.vue'

export default defineComponent({
  name: 'NodeCard',
  components: { HashLink, EntityName, NodeContentViewer },
  props: {
    node: { type: Object, required: true }
  },
  setup (props) {
    // Type only drives the URL preview treatment — it is not displayed;
    // type labels render like any other label on the node's viewers.
    const typeName = computed(() => props.node.type?.name || props.node.type_name || 'NOTE')
    const isUrl = computed(() => typeName.value === 'URL')
    const shortPath = computed(() => {
      const h = (props.node.path || '').split('/').pop()
      return h.slice(0, 20) + (h.length > 20 ? '…' : '')
    })

    // Strip markdown for plain text preview
    const textPreview = computed(() => {
      const raw = props.node.content || ''
      return raw.replace(/[#*`_~[\]]/g, '').slice(0, 140) + (raw.length > 140 ? '…' : '')
    })

    const timeAgo = computed(() => {
      const ts = props.node.createdAt || props.node.created_at
      if (!ts) return ''
      const diff = Date.now() - new Date(ts).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    })

    // Author label — only rendered when the list endpoint pre-populates the
    // node row with author info. Quietly absent otherwise so we don't fire
    // N+1 follow-up lookups from a card.
    const authorLabel = computed(() => {
      const a = props.node.author
      if (!a) return ''
      return a.display_name || a.username || ('entity #' + a.id)
    })

    // Comment-origin descriptor mirrors the node viewer: kind/<short-hash>
    // and a hyperlink to the ROOT of the comment thread. The card only
    // renders these when the backend pre-enriched the node with origin info.
    const originHashLabel = computed(() => {
      const o = props.node.origin
      const co = o?.comment_of
      if (!o || o.kind !== 'COMMENT' || !co) return ''
      const root = o.root
      const hash = (co.path || '').split('/').pop() || ''
      let kindLabel
      if (co.kind === 'node') kindLabel = 'node'
      else if (root && root.kind === 'post' && root.id === co.id) kindLabel = 'post'
      else kindLabel = 'comment'
      return `${kindLabel}/${hash.slice(0, 12)}${hash.length > 12 ? '…' : ''}`
    })

    const originRoute = computed(() => {
      const r = props.node.origin?.root
      if (!r) return null
      return r.kind === 'post' ? `/posts/${r.id}` : `/nodes/${r.id}`
    })

    return {
      isUrl,
      shortPath,
      textPreview,
      timeAgo,
      authorLabel,
      originHashLabel,
      originRoute
    }
  }
})
</script>

<style lang="scss" scoped>
.node-card-link {
  text-decoration: none;
  display: block;
}

.node-card {
  cursor: pointer;
  transition: border-color 0.15s, transform 0.1s, box-shadow 0.15s;

  &:hover {
    border-color: rgba(var(--ink-rgb), 0.55);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--ink-rgb), 0.1);
  }
}

.node-card-preview {
  font-size: 0.85em;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  color: rgba(var(--ink-rgb), 0.75);
  word-break: break-word;
}

.node-card-origin {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.7);
  margin-bottom: 6px;
}

.node-card-author {
  display: inline-flex;
  align-items: center;
}

.origin-hash-link {
  color: var(--coral-deep);
  text-decoration: none;
  border-bottom: 1px dashed rgba(211, 95, 95, 0.45);
  padding-bottom: 1px;
  &:hover { border-bottom-color: rgba(211, 95, 95, 0.85); }
}
.origin-hash-fallback {
  opacity: 0.7;
}
</style>
