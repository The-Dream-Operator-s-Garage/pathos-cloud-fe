<template>
  <div class="attached-section">
    <div class="attached-header row items-center q-mb-sm">
      <q-icon name="attach_file" size="14px" class="text-accent q-mr-xs" />
      <span class="nasalization text-accent" style="font-size:0.82em;">Attached</span>
      <q-badge v-if="attachments.length" color="primary" outline class="q-ml-sm" style="font-size:0.68em;">
        {{ attachments.length }}
      </q-badge>
      <q-space />
    </div>

    <div v-if="loading" class="text-center q-py-md">
      <q-spinner color="primary" size="18px" />
    </div>

    <div v-else-if="attachments.length === 0"
      class="text-center text-dim q-py-md"
      style="font-size:0.8em; border:1px dashed rgba(var(--ink-rgb), 0.15); border-radius:8px;">
      <q-icon name="attach_file" size="22px" style="opacity:.2; display:block; margin:0 auto 5px;" />
      Nothing attached
    </div>

    <div v-else class="attached-scroll q-gutter-sm">
      <template v-for="att in attachments" :key="att.target_type + '-' + att.target_id">

        <!-- The version-history path is shown in the dedicated Versions section
             below — skip it here to avoid duplication. -->
        <template v-if="att.target_type === 'path' && isVersionPath(att)" />

        <!-- Generic path attachment (non-version). Routes to the primal
             path viewer for that specific path row. -->
        <router-link
          v-else-if="att.target_type === 'path'"
          :to="'/paths/' + att.target_id"
          class="att-card-link"
        >
          <div class="att-card pathos-card q-pa-sm">
            <div class="row items-center no-wrap">
              <q-icon name="route" size="14px" class="text-secondary q-mr-sm" />
              <span class="att-label">{{ att.label || 'Path' }}</span>
              <span v-if="att.inherited" class="inherited-badge" title="Attached before the current version">inherited</span>
              <q-space />
              <q-icon name="open_in_new" size="11px" class="text-dim" />
            </div>
            <div v-if="att.target?.path" class="att-hash mono">{{ shortHash(att.target.path) }}</div>
          </div>
        </router-link>

        <!-- Node attachment -->
        <router-link
          v-else-if="att.target_type === 'node'"
          :to="'/nodes/' + att.target_id"
          class="att-card-link"
        >
          <div class="att-card pathos-card q-pa-sm">
            <div class="row items-center no-wrap">
              <q-icon name="adjust" size="14px" class="text-accent q-mr-sm" />
              <span class="att-label">{{ att.label || 'Node' }}</span>
              <span v-if="att.inherited" class="inherited-badge" title="Attached before the current version">inherited</span>
              <q-space />
              <q-icon name="open_in_new" size="11px" class="text-dim" />
            </div>
            <div v-if="att.target?.content" class="att-preview">
              {{ truncate(att.target.content, 100) }}
            </div>
          </div>
        </router-link>

        <!-- Label attachment -->
        <router-link
          v-else-if="att.target_type === 'label'"
          :to="'/labels/' + att.target_id"
          class="att-card-link"
        >
          <div class="att-card pathos-card q-pa-sm">
            <div class="row items-center no-wrap">
              <q-icon name="label_important" size="14px" class="text-teal q-mr-sm" />
              <span class="att-label">{{ att.label || att.target?.name || 'Label' }}</span>
              <span v-if="att.inherited" class="inherited-badge" title="Attached before the current version">inherited</span>
              <q-space />
              <q-icon name="open_in_new" size="11px" class="text-dim" />
            </div>
          </div>
        </router-link>

        <!-- Link attachment (raw pathchain link — display the target it points to) -->
        <div v-else-if="att.target_type === 'link'" class="att-card pathos-card q-pa-sm">
          <div class="row items-center no-wrap">
            <q-icon name="link" size="14px" class="text-dim q-mr-sm" />
            <span class="att-label">{{ att.label || 'Link' }}</span>
            <span v-if="att.inherited" class="inherited-badge" title="Attached before the current version">inherited</span>
            <q-space />
            <span class="text-dim mono" style="font-size:0.68em;">
              → {{ att.target?.target_type || '?' }} #{{ att.target?.target_id || '—' }}
            </span>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { postService } from 'src/services/post.service'

export default defineComponent({
  name: 'AttachedSection',

  props: {
    postId: { type: Number, required: true },
    // The post's versions_path_id, if known — lets us detect *which* path
    // attachment is the canonical version history (vs. a user-added one).
    versionsPathId: { type: Number, default: null }
  },

  setup (props) {
    const attachments = ref([])
    const loading = ref(true)

    const load = async () => {
      loading.value = true
      try {
        const r = await postService.getAttachments(props.postId)
        if (r.success) attachments.value = r.attachments || []
      } catch (_) { attachments.value = [] }
      loading.value = false
    }

    onMounted(load)
    watch(() => props.postId, load)

    // Identify the version-history attachment: matches by target_id when
    // versionsPathId is known, otherwise falls back to the label string.
    const isVersionPath = (att) => {
      if (att.target_type !== 'path') return false
      if (props.versionsPathId != null) return att.target_id === props.versionsPathId
      return att.label === 'Version history'
    }

    const shortHash = (path) => {
      const h = (path || '').split('/').pop()
      return h ? h.slice(0, 14) + (h.length > 14 ? '…' : '') : ''
    }

    const truncate = (s, n) => {
      if (!s) return ''
      const stripped = s.replace(/[#*`_~[\]]/g, '')
      return stripped.length > n ? stripped.slice(0, n) + '…' : stripped
    }

    return { attachments, loading, isVersionPath, shortHash, truncate, reload: load }
  }
})
</script>

<style lang="scss" scoped>
.attached-header {
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
}

.attached-scroll {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.att-card-link {
  display: block;
  text-decoration: none;
  &:hover .att-card {
    border-color: rgba(var(--ink-rgb), 0.45);
    transform: translateY(-1px);
  }
}

.att-card {
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: border-color 0.12s, transform 0.08s;
}

.att-label {
  font-size: 0.83em;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.att-hash {
  margin-top: 3px;
  font-size: 0.7em;
  color: rgba(var(--ink-rgb), 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.att-preview {
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

.inherited-badge {
  font-family: 'Space Mono', monospace;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,200,0,0.72);
  background: rgba(255,180,0,0.08);
  border: 1px solid rgba(255,180,0,0.20);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 6px;
}
</style>
