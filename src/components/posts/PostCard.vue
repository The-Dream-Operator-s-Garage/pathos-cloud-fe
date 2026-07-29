<template>
  <router-link :to="'/posts/' + post.id" class="post-card-link">
    <div class="pathos-card q-pa-md post-card">

      <div class="row items-center no-wrap q-mb-sm">
        <div class="col" style="min-width:0;">
          <div v-if="post.title" class="post-title q-mb-xs">{{ post.title }}</div>
          <HashLink :path="post.path" :id="post.id" :show-icon="false" :truncate="22" />
        </div>
        <q-chip dense size="xs" outline :color="typeColor" class="q-ma-none q-ml-sm" style="flex-shrink:0;">
          <q-icon :name="typeIcon" size="11px" class="q-mr-xs" />{{ typeName }}
        </q-chip>
      </div>

      <!-- Content preview (rendered from the wrapped node) -->
      <div v-if="post.node?.content || post.target_content" class="post-preview">
        <span v-if="isUrl" class="text-secondary" style="word-break:break-all;">{{ contentSource }}</span>
        <span v-else>{{ textPreview }}</span>
      </div>

      <div class="row items-center q-mt-sm">
        <div class="text-dim" style="font-size:0.7em;" :title="absoluteHover">
          <q-icon name="schedule" size="11px" class="q-mr-xs" />{{ timeAgo }}
        </div>
        <q-space />
        <span v-if="post.counts" class="text-dim" style="font-size:0.7em;">
          <q-icon name="thumb_up_alt" size="11px" class="q-mr-xs" />{{ post.counts.votes_up }}
          <q-icon name="comment"      size="11px" class="q-mx-xs" />{{ post.counts.comments }}
          <q-icon name="call_split"   size="11px" class="q-ml-xs q-mr-xs" />{{ post.counts.forks }}
        </span>
        <q-icon name="open_in_new" size="11px" class="text-dim q-ml-xs" />
      </div>

    </div>
  </router-link>
</template>

<script>
import { defineComponent, computed } from 'vue'
import HashLink from 'src/components/shared/HashLink.vue'
import { timeAgo as fmtTimeAgo, absoluteTime } from 'src/utils/time'
import { bodyOf } from 'src/utils/nodeContent'

const POST_TYPES = { 1: 'Post', 2: 'Event', 3: 'Node post', 4: 'Path post', 5: 'Comment', 6: 'Fork' }
const POST_ICONS = { 1: 'edit_note', 2: 'event', 3: 'adjust', 4: 'route', 5: 'comment', 6: 'call_split' }
const POST_COLORS = { 1: 'primary', 2: 'orange', 3: 'indigo', 4: 'teal', 5: 'secondary', 6: 'amber' }

const NODE_TYPE_NAMES = { 1: 'NOTE', 2: 'FILE', 3: 'URL', 4: 'REFERENCE' }

export default defineComponent({
  name: 'PostCard',
  components: { HashLink },
  props: {
    post: { type: Object, required: true }
  },
  setup (props) {
    const typeName = computed(() => POST_TYPES[props.post.type_id] || 'Post')
    const typeIcon = computed(() => POST_ICONS[props.post.type_id] || 'edit_note')
    const typeColor = computed(() => POST_COLORS[props.post.type_id] || 'primary')

    // Two shapes are supported: the rich getPostFull shape (post.node, now
    // possibly file-backed → bodyOf resolves the .md text) and the
    // lightweight feed/list shape (post.target_content / post.node_content).
    const contentSource = computed(() =>
      (props.post.node ? bodyOf(props.post.node) : '') ||
        props.post.target_content ||
        props.post.node_content ||
        ''
    )

    const nodeTypeName = computed(() =>
      NODE_TYPE_NAMES[props.post.node?.type_id ?? props.post.node_type_id] || 'NOTE'
    )

    const isUrl = computed(() => nodeTypeName.value === 'URL')

    const textPreview = computed(() => {
      const raw = contentSource.value || ''
      return raw.replace(/[#*`_~[\]]/g, '').slice(0, 140) + (raw.length > 140 ? '…' : '')
    })

    const timeAgo = computed(() =>
      fmtTimeAgo(props.post.createdAt || props.post.created_at, props.post.moment)
    )
    const absoluteHover = computed(() =>
      absoluteTime(props.post.createdAt || props.post.created_at, props.post.moment)
    )

    return { typeName, typeIcon, typeColor, contentSource, isUrl, textPreview, timeAgo, absoluteHover }
  }
})
</script>

<style lang="scss" scoped>
.post-card-link {
  text-decoration: none;
  display: block;
}

.post-card {
  cursor: pointer;
  transition: border-color 0.15s, transform 0.1s, box-shadow 0.15s;

  &:hover {
    border-color: rgba(var(--ink-rgb), 0.55);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--ink-rgb), 0.1);
  }
}

.post-title {
  font-weight: 600;
  font-size: 0.95em;
  color: var(--ink-1);
  line-height: 1.3;
}

.post-preview {
  font-size: 0.85em;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  color: rgba(var(--ink-rgb), 0.75);
  word-break: break-word;
}
</style>
