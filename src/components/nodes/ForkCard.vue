<template>
  <router-link :to="'/nodes/' + fork.id" class="fork-card-link">
    <div class="fork-card">

      <!-- Node icon + hash -->
      <div class="row items-center no-wrap q-mb-xs" style="gap:6px;">
        <q-icon name="adjust" size="13px" class="text-accent" style="flex-shrink:0;" />
        <div style="flex:1; min-width:0; overflow:hidden;">
          <HashLink :path="fork.path" :id="fork.id" :show-icon="false" :truncate="18" />
        </div>
      </div>

      <!-- Content preview -->
      <div class="fork-preview">{{ textPreview }}</div>

      <!-- Footer: author + stats -->
      <div class="row items-center q-mt-xs text-dim" style="font-size:0.7em; gap:8px;">
        <span v-if="fork.username" class="text-accent" style="font-size:0.9em;">{{ fork.username }}</span>
        <span>{{ timeAgo }}</span>
        <q-space />
        <span style="display:inline-flex; align-items:center; gap:3px;">
          <q-icon name="thumb_up_alt" size="11px" />{{ fork.votes_up || 0 }}
        </span>
        <span style="display:inline-flex; align-items:center; gap:3px;">
          <q-icon name="comment" size="11px" />{{ fork.comment_count || 0 }}
        </span>
        <span v-if="fork.fork_count > 0" style="display:inline-flex; align-items:center; gap:3px;">
          <q-icon name="call_split" size="11px" />{{ fork.fork_count }}
        </span>
      </div>

    </div>
  </router-link>
</template>

<script>
import { defineComponent, computed } from 'vue'
import HashLink from 'src/components/shared/HashLink.vue'

export default defineComponent({
  name: 'ForkCard',
  components: { HashLink },
  props: {
    fork: { type: Object, required: true }
  },
  setup (props) {
    const shortHash = computed(() => {
      const h = (props.fork.path || '').split('/').pop()
      return h.slice(0, 18) + '…'
    })

    const textPreview = computed(() => {
      const raw = props.fork.content || ''
      return raw.replace(/[#*`_~[\]>]/g, '').replace(/\n+/g, ' ').slice(0, 100) + (raw.length > 100 ? '…' : '')
    })

    const timeAgo = computed(() => {
      const ts = props.fork.created_at
      if (!ts) return ''
      const d = Date.now() - new Date(ts).getTime()
      const m = Math.floor(d / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      return `${Math.floor(h / 24)}d ago`
    })

    return { shortHash, textPreview, timeAgo }
  }
})
</script>

<style lang="scss" scoped>
.fork-card-link {
  display: block;
  text-decoration: none;
}

.fork-card {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(var(--ink-rgb), 0.4);
    background: rgba(var(--ink-rgb), 0.06);
  }
}

.fork-preview {
  font-size: 0.82em;
  color: rgba(var(--ink-rgb), 0.65);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
