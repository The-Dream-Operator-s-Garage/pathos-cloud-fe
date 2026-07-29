<template>
  <div class="versions-section">
    <div class="versions-header row items-center q-mb-sm">
      <q-icon name="history" size="14px" class="text-accent q-mr-xs" />
      <span class="nasalization text-accent" style="font-size:0.82em;">Versions</span>
      <q-badge v-if="totalCount > 1" color="primary" outline class="q-ml-sm" style="font-size:0.68em;">
        {{ totalCount }}
      </q-badge>
      <q-space />
    </div>

    <div v-if="loading" class="text-center q-py-md">
      <q-spinner color="primary" size="18px" />
    </div>

    <div v-else-if="totalCount === 0"
      class="text-center text-dim q-py-md"
      style="font-size:0.8em; border:1px dashed rgba(var(--ink-rgb), 0.15); border-radius:8px;">
      <q-icon name="history" size="22px" style="opacity:.2; display:block; margin:0 auto 5px;" />
      No versions yet
    </div>

    <div v-else class="versions-scroll">
      <div class="version-chain">

        <!-- CURRENT head (always at top, marked as newest) -->
        <div
          class="version-item is-current"
          @click="goToCurrent"
        >
          <div class="row items-center no-wrap">
            <span class="version-tag mono is-current-tag">v{{ headIndex }}</span>
            <span class="version-current-badge q-ml-sm">newest</span>
            <q-space />
            <span class="text-dim" style="font-size:0.7em;"
              :title="absoluteTime(headTimestamp, headNode?.moment)">{{ timeAgo(headTimestamp, headNode?.moment) }}</span>
          </div>
          <div v-if="headContent" class="version-preview">
            {{ truncate(headContent, 130) }}
          </div>
          <div class="version-hash mono">{{ shortHash(headPath) }}</div>
        </div>

        <!-- Historical versions, newest-first under current -->
        <div
          v-for="v in versions"
          :key="v.node.id"
          class="version-item is-historical"
          @click="goToVersion(v)"
        >
          <div class="row items-center no-wrap">
            <span class="version-tag mono">v{{ headIndex - v.version_index }}</span>
            <span class="version-deprecated-badge q-ml-sm">deprecated</span>
            <q-space />
            <span class="text-dim" style="font-size:0.7em;"
              :title="absoluteTime(v.node.createdAt || v.node.created_at, v.moment)">{{ timeAgo(v.node.createdAt || v.node.created_at, v.moment) }}</span>
          </div>
          <div v-if="bodyOf(v.node)" class="version-preview">
            {{ truncate(bodyOf(v.node), 130) }}
          </div>
          <div class="version-hash mono">{{ shortHash(v.node.path) }}</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { postService } from 'src/services/post.service'
import { timeAgo as fmtTimeAgo, absoluteTime } from 'src/utils/time'
import { bodyOf } from 'src/utils/nodeContent'

export default defineComponent({
  name: 'VersionsSection',

  props: {
    // Post we're showing the version chain for.
    postId: { type: Number, required: true },
    // The current head node (what the post is showing right now).
    // Passed in by the parent so we don't need a separate fetch.
    headNode: { type: Object, default: null }
  },

  setup (props) {
    const router = useRouter()
    const versions = ref([])
    const loading = ref(true)

    // Historical count + 1 (the current head). Used for v{N} labels.
    const headIndex = computed(() => versions.value.length + 1)
    const totalCount = computed(() => versions.value.length + (props.headNode ? 1 : 0))
    const headPath = computed(() => props.headNode?.path || '')
    const headContent = computed(() => bodyOf(props.headNode))
    const headTimestamp = computed(() =>
      props.headNode?.createdAt || props.headNode?.created_at || null
    )

    const load = async () => {
      loading.value = true
      try {
        const r = await postService.getVersions(props.postId)
        if (r.success) versions.value = r.versions || []
      } catch (_) { versions.value = [] }
      loading.value = false
    }

    onMounted(load)
    watch(() => props.postId, load)
    // Reload when the head node identity changes (e.g. after a successful edit
    // the parent passes the new head; we need to refetch the historical chain).
    watch(() => props.headNode?.id, load)

    const shortHash = (path) => {
      const h = (path || '').split('/').pop()
      return h ? h.slice(0, 14) + (h.length > 14 ? '…' : '') : ''
    }

    const truncate = (s, n) => {
      if (!s) return ''
      const stripped = s.replace(/[#*`_~[\]]/g, '')
      return stripped.length > n ? stripped.slice(0, n) + '…' : stripped
    }

    const timeAgo = (ts, moment) => fmtTimeAgo(ts, moment)

    const goToCurrent = () => {
      if (props.headNode?.id) router.push('/nodes/' + props.headNode.id)
    }

    const goToVersion = (v) => {
      if (v.node?.id) router.push('/nodes/' + v.node.id)
    }

    return {
      versions,
      loading,
      headIndex,
      totalCount,
      headPath,
      headContent,
      headTimestamp,
      shortHash,
      truncate,
      timeAgo,
      absoluteTime,
      bodyOf,
      goToCurrent,
      goToVersion
    }
  }
})
</script>

<style lang="scss" scoped>
.versions-header {
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
}

.versions-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

// Visually wire each version item like a node on a vertical chain — a thin
// rail on the left + a dot per version. The current head gets a brighter dot.
.version-chain {
  position: relative;
  padding-left: 16px;
  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: rgba(var(--ink-rgb), 0.16);
  }
}

.version-item {
  position: relative;
  padding: 9px 11px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, transform 0.08s;

  // The dot on the rail
  &::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 14px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #ececf2;
    background: rgba(var(--ink-rgb), 0.5);
  }

  &:hover {
    border-color: rgba(var(--ink-rgb), 0.45);
    transform: translateX(1px);
  }

  &.is-current {
    background: rgba(var(--ink-rgb), 0.10);
    border-color: rgba(var(--ink-rgb), 0.4);
    &::before {
      background: var(--ink);
      box-shadow: 0 0 6px rgba(var(--ink-rgb), 0.7);
    }
  }

  &.is-historical {
    opacity: 0.85;
    &::before { background: rgba(255,200,0,0.55); }
  }
}

.version-tag {
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.85);
  background: rgba(var(--ink-rgb), 0.14);
  padding: 1px 6px;
  border-radius: 3px;

  &.is-current-tag {
    color: var(--ink-1);
    background: rgba(var(--ink-rgb), 0.25);
    font-weight: 600;
  }
}

.version-current-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink);
  background: rgba(var(--ink-rgb), 0.18);
  border: 1px solid rgba(var(--ink-rgb), 0.35);
  padding: 1px 5px;
  border-radius: 3px;
}

.version-deprecated-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,200,0,0.7);
  background: rgba(255,180,0,0.08);
  border: 1px solid rgba(255,180,0,0.18);
  padding: 1px 5px;
  border-radius: 3px;
}

.version-preview {
  margin-top: 5px;
  font-size: 0.8em;
  line-height: 1.45;
  color: rgba(var(--ink-rgb), 0.7);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.version-hash {
  margin-top: 4px;
  font-size: 0.66em;
  color: rgba(var(--ink-rgb), 0.4);
}
</style>
