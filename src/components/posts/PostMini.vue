<template>
  <!-- A read-only miniature mirror of PostViewerPage's .subject-panel.
       Renders the post's identity header (title, author chip, file path,
       time, hash) and a tiny content viewport. Footer shows the votes
       row — no replies, fork CTAs, composer, or attachment forms.
       Refactored onto shared/MiniPanel chrome so it stays in sync with
       the rest of the XMini family. -->
  <MiniPanel :to="targetRoute">
    <template #title>
      {{ effectiveTitle || '(untitled)' }}
    </template>

    <template #chips>
      <span v-if="authorDisplayName" class="mini-author-chip" :title="post.author?.path">
        <EntityName :entity="post.author" />
        <span class="mini-sep">|</span>
        <span class="mini-hash mono">entity/{{ shortHash(post.author?.path, 8) }}</span>
      </span>

      <span v-if="post.provenance" class="mini-chip-fact">
        <q-icon name="verified" size="11px" class="q-mr-xs" />
        {{ post.provenance }}
      </span>

      <span v-if="post.created_at" class="mini-chip-fact" :title="post.created_at">
        <q-icon name="schedule" size="11px" class="q-mr-xs" />
        {{ timeAgo }}
      </span>
    </template>

    <template v-if="labels && labels.length" #labels>
      <span v-for="(l, i) in displayLabels" :key="l.id || i" class="mini-label-chip">
        {{ l.name }}
      </span>
      <span v-if="labels.length > displayLabels.length" class="mini-label-more">
        +{{ labels.length - displayLabels.length }}
      </span>
    </template>

    <template #hash>
      <PostMicro :id="post.id" :path="targetHashPath" :show-type="true" />
    </template>

    <template #body>
      <div v-if="!excerpt" class="post-mini__empty">(no content)</div>
      <div v-else class="post-mini__excerpt">{{ excerpt }}</div>
    </template>

    <template #foot>
      <span class="vote-pill" :class="{ 'is-up': votes.viewer_vote === 1 }">
        <q-icon name="arrow_upward" size="11px" /> {{ votes.up || 0 }}
      </span>
      <span class="vote-pill" :class="{ 'is-down': votes.viewer_vote === -1 }">
        <q-icon name="arrow_downward" size="11px" /> {{ votes.down || 0 }}
      </span>
      <q-space />
      <span class="post-mini__open">open <q-icon name="open_in_new" size="11px" /></span>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import PostMicro from './PostMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'

export default defineComponent({
  name: 'PostMini',
  components: { MiniPanel, PostMicro, EntityName },
  props: {
    // Enriched post shape from pathService._enrichSkeletonTarget:
    //   { id, path, title, excerpt, author, provenance,
    //     moment_id, created_at, forked_from_id, votes }
    post: { type: Object, required: true },
    labels: { type: Array, default: () => [] },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/posts/${props.post.id}`)

    // HashLink/Micro kind inference reads the prefix. PostMicro takes
    // either a path or an id; we pass `posts/<hash>` so the tooltip is
    // accurate and routing falls back if id is absent.
    const targetHashPath = computed(() => {
      const raw = props.post.path || ''
      const hash = raw.includes('/') ? raw.split('/').pop() : raw
      return `posts/${hash}`
    })

    const authorDisplayName = computed(() => {
      const a = props.post.author
      if (!a) return ''
      return a.display_name || a.username || ('entity #' + a.id)
    })

    // Title only. A post with no TITLE reads '(untitled)' — it never
    // borrows its CONTENT node's source path, which is seed provenance
    // rather than a name the author gave the post.
    const effectiveTitle = computed(() => props.post.title || '')

    const excerpt = computed(() => {
      const raw = props.post.excerpt || ''
      return raw.replace(/[#*`_~[\]]/g, '').trim()
    })

    const displayLabels = computed(() => (props.labels || []).slice(0, 3))

    const votes = computed(() => props.post.votes || {})

    const shortHash = (p, len = 12) => {
      const h = (p || '').includes('/') ? (p || '').split('/').pop() : p
      return h ? h.slice(0, len) : ''
    }

    const timeAgo = computed(() => {
      const iso = props.post.created_at
      if (!iso) return ''
      const d = Date.now() - new Date(iso).getTime()
      if (d < 0) return ''
      const s = Math.floor(d / 1000)
      if (s < 60) return `${s}s ago`
      const m = Math.floor(s / 60)
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      const days = Math.floor(h / 24)
      if (days < 30) return `${days}d ago`
      try { return new Date(iso).toLocaleDateString() } catch (_) { return iso }
    })

    return {
      targetRoute,
      targetHashPath,
      authorDisplayName,
      effectiveTitle,
      excerpt,
      displayLabels,
      votes,
      shortHash,
      timeAgo
    }
  }
})
</script>

<style lang="scss" scoped>
.post-mini__empty {
  font-size: 0.78em;
  color: #8995a8;
  font-style: italic;
}

.post-mini__excerpt {
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
}

.mini-author-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: #f0ecfb;
  border: 1px solid #c1b8e6;
  border-radius: 10px;
  color: #4f3e98;
  font-size: 0.92em;
  .mini-sep  { opacity: 0.4; margin: 0 1px; }
  .mini-hash { font-size: 0.82em; opacity: 0.75; }
}

.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}

.mini-label-chip {
  font-size: 0.68em;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(var(--ink-rgb), 0.08);
  color: rgba(var(--ink-rgb), 0.78);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  white-space: nowrap;
}

.mini-label-more {
  font-size: 0.68em;
  color: #8995a8;
}

.vote-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  color: #5b6c82;
  font-size: 0.84em;

  &.is-up {
    background: rgba(126, 187, 105, 0.15);
    border-color: rgba(126, 187, 105, 0.45);
    color: #3d7a2a;
  }
  &.is-down {
    background: rgba(211, 95, 95, 0.12);
    border-color: rgba(211, 95, 95, 0.4);
    color: #b14848;
  }
}

.post-mini__open {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #5b6c82;
  font-size: 0.92em;
}
</style>
