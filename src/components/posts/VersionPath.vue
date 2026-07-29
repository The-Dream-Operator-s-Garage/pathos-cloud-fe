<template>
  <div class="version-path pathos-card q-pa-sm">
    <div class="row items-center q-pa-xs version-path-header" @click="open = !open" style="cursor:pointer;">
      <q-icon name="history" size="14px" class="text-accent q-mr-sm" />
      <span class="nasalization text-accent" style="font-size:0.78em;">Version history</span>
      <q-badge v-if="versions.length" outline color="primary" class="q-ml-sm" style="font-size:0.62em;">
        {{ versions.length }}
      </q-badge>
      <q-space />
      <q-icon :name="open ? 'expand_less' : 'expand_more'" size="16px" class="text-dim" />
    </div>

    <q-slide-transition>
      <div v-show="open">
        <div v-if="loading" class="text-center q-py-md">
          <q-spinner color="primary" size="16px" />
        </div>

        <div v-else-if="versions.length === 0"
          class="text-center text-dim q-py-sm"
          style="font-size:0.78em;">
          No prior versions.
        </div>

        <div v-else class="version-list q-mt-sm">
          <div
            v-for="v in versions"
            :key="v.node.id"
            class="version-item"
            @click="goToVersion(v)"
          >
            <div class="row items-center no-wrap">
              <span class="version-tag mono">v{{ headIndex - v.version_index + 1 }}</span>
              <span class="version-hash mono q-ml-sm">{{ shortHash(v.node.path) }}</span>
              <q-space />
              <span class="text-dim" style="font-size:0.7em;">{{ timeAgo(v.node.createdAt || v.node.created_at) }}</span>
            </div>
            <div v-if="bodyOf(v.node)" class="version-preview">
              {{ truncate(bodyOf(v.node), 120) }}
            </div>
          </div>
        </div>
      </div>
    </q-slide-transition>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { postService } from 'src/services/post.service'
import { bodyOf } from 'src/utils/nodeContent'

export default defineComponent({
  name: 'VersionPath',

  props: {
    postId: { type: Number, required: true },
    // When the parent already knows the head node, supply it so the version
    // numbering displays the current head as v_n+1 above all prior versions.
    headNodeId: { type: Number, default: null }
  },

  setup (props) {
    const router = useRouter()
    const versions = ref([])
    const loading = ref(true)
    const open = ref(false)

    // Head is the post's current target node, so historical versions are
    // numbered v1 (oldest) → v(headIndex - 1). The current head is v(headIndex).
    const headIndex = computed(() => versions.value.length + 1)

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

    const shortHash = (path) => {
      const h = (path || '').split('/').pop()
      return h ? h.slice(0, 12) + (h.length > 12 ? '…' : '') : ''
    }

    const truncate = (s, n) => {
      if (!s) return ''
      const stripped = s.replace(/[#*`_~[\]]/g, '')
      return stripped.length > n ? stripped.slice(0, n) + '…' : stripped
    }

    const timeAgo = (ts) => {
      if (!ts) return ''
      const diff = Date.now() - new Date(ts).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    }

    const goToVersion = (v) => router.push('/nodes/' + v.node.id)

    return { versions, loading, open, headIndex, shortHash, truncate, timeAgo, goToVersion, bodyOf }
  }
})
</script>

<style lang="scss" scoped>
.version-path { background: rgba(255, 255, 255, 0.4); }

.version-path-header {
  border-radius: 6px;
  transition: background 0.1s;
  &:hover { background: rgba(var(--ink-rgb), 0.06); }
}

.version-list {
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.version-item {
  padding: 7px 9px;
  margin-bottom: 6px;
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.10);
  border-radius: 5px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
  &:hover {
    border-color: rgba(var(--ink-rgb), 0.4);
    background: rgba(var(--ink-rgb), 0.10);
  }
}

.version-tag {
  font-size: 0.7em;
  color: var(--coral);
  background: rgba(255,200,0,0.12);
  padding: 1px 5px;
  border-radius: 3px;
}

.version-hash {
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.6);
}

.version-preview {
  margin-top: 4px;
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.65);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
</style>
