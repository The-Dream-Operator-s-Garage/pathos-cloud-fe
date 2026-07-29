<template>
  <div class="maker-overlay" @click.self="$emit('close')">
    <div class="maker-dialog" :style="dialogStyle">

      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-icon :name="headerIcon" size="20px" class="text-accent q-mr-sm" />
        <div class="nasalization text-accent" style="font-size:1em;">{{ headerTitle }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="$emit('close')" />
      </div>

      <!-- Fork-only source banner -->
      <div v-if="mode === 'fork' && sourceId" class="text-dim q-mb-md" style="font-size:0.8em;">
        Forking <span class="mono" style="color:var(--ink);">#{{ sourceId }}</span>
        — a new owned copy. Comments, sub-forks and attachments come along tagged
        as inherited. Votes start at 0.
      </div>

      <!-- Author + labels (shared across all targetTypes that need attribution) -->
      <MakerHeader
        v-if="targetType !== 'label' && targetType !== 'skeleton'"
        :target-kind="makerHeaderKind"
        :type-id="form.typeId || 1"
        :canonic-labels="canonicLabels"
        @update:author-entity-id="form.authorEntityId = $event"
        @update:label-ids="form.labelIds = $event"
      />

      <!-- Body — one per targetType -->
      <q-form @submit.prevent="onSubmit" class="q-gutter-md">

        <!-- LABEL: name only (v1 scope) -->
        <template v-if="targetType === 'label'">
          <q-input v-model="form.name" label="Label name" :dark="false" outlined dense autofocus
            :readonly="mode === 'fork'"
            :rules="[v => !!v?.trim() || 'Required']" />
          <q-input v-if="mode === 'make'"
            v-model="parentSearch" label="Parent label (optional)" :dark="false" outlined dense
            placeholder="Search for parent…" @update:model-value="searchParents" clearable>
            <template #append><q-icon name="search" /></template>
          </q-input>
          <div v-if="parentResults.length" class="label-scroll-row q-mb-xs">
            <span v-for="l in parentResults" :key="l.id" class="label-chip"
              :class="{ selected: form.ancestorId === l.id }"
              @click="pickParent(l)">{{ l.name }}</span>
          </div>
          <div v-if="selectedParent" class="text-dim" style="font-size:0.8em;">
            Parent: <span class="text-accent">{{ selectedParent.name }}</span>
          </div>
          <div v-if="mode === 'edit' && sourceIsSystemLabel" class="text-warning" style="font-size:0.8em;">
            Default labels cannot be edited.
          </div>
        </template>

        <!-- NODE: typeId picker + content -->
        <template v-else-if="targetType === 'node'">
          <q-select v-model="form.typeId" :options="nodeTypeOptions" label="Type"
            :dark="false" outlined dense emit-value map-options :disable="mode !== 'make'" />
          <NoteEditor v-if="form.typeId === 1"
            v-model="form.content" :show-save="false" initial-mode="split" height="280px"
            :readonly="mode === 'fork'" />
          <q-input v-else v-model="form.content"
            :label="nodeContentLabel" :dark="false" outlined dense autogrow
            :readonly="mode === 'fork'" />
        </template>

        <!-- POST: title + typeId picker + content -->
        <template v-else-if="targetType === 'post'">
          <q-input v-model="form.title" label="Title (optional)" :dark="false" outlined dense
            :readonly="mode === 'fork'" />
          <q-select v-if="mode === 'make'"
            v-model="form.typeId" :options="nodeTypeOptions" label="Type"
            :dark="false" outlined dense emit-value map-options />
          <NoteEditor v-if="form.typeId === 1"
            v-model="form.content" :show-save="false" initial-mode="split" height="320px"
            :readonly="mode === 'fork'" />
          <q-input v-else v-model="form.content"
            :label="nodeContentLabel" :dark="false" outlined dense autogrow
            :readonly="mode === 'fork'" />
        </template>

        <!-- SKELETON: name (v1 minimal) -->
        <template v-else-if="targetType === 'skeleton'">
          <q-input v-model="form.name" label="Skeleton name" :dark="false" outlined dense autofocus
            :rules="[v => !!v?.trim() || 'Required']" />
          <div class="text-dim" style="font-size:0.8em;">
            Skeleton slot bindings are edited inline on the skeleton page after creation.
          </div>
        </template>

        <!-- Edit-mode draft status strip -->
        <div v-if="mode === 'edit' && (targetType === 'node' || targetType === 'post')"
          class="row items-center q-mt-sm" style="font-size:0.78em;">
          <span class="text-dim">{{ draftStatusLine }}</span>
          <q-space />
          <q-btn v-if="hasDraft" flat dense no-caps size="sm" color="negative"
            label="Discard draft" :loading="draftBusy" @click="onDiscardDraft" />
        </div>

        <!-- Footer actions -->
        <div class="row justify-end q-gutter-sm q-mt-md">
          <q-btn flat dense no-caps size="sm" label="Cancel" @click="$emit('close')" />

          <!-- MAKE -->
          <q-btn v-if="mode === 'make'"
            type="submit" unelevated dense no-caps size="sm" color="primary"
            :icon="submitIcon" :label="submitLabel" :loading="loading"
            :disable="!canSubmitMake" />

          <!-- EDIT (only owner gets here; non-owners hit FORK confirm dialog upstream) -->
          <template v-else-if="mode === 'edit'">
            <q-btn v-if="targetType === 'label'"
              type="submit" unelevated dense no-caps size="sm" color="primary"
              icon="save" label="Save" :loading="loading"
              :disable="!form.name?.trim() || sourceIsSystemLabel" />
            <q-btn v-else
              unelevated dense no-caps size="sm" color="primary"
              icon="publish" label="Promote to current"
              :loading="loading" :disable="!hasDraft"
              @click="onPromote" />
          </template>

          <!-- FORK -->
          <q-btn v-else-if="mode === 'fork'"
            type="submit" unelevated dense no-caps size="sm" color="primary"
            icon="call_split" label="Create fork" :loading="loading" />
        </div>
      </q-form>

      <div v-if="successMsg" class="text-positive text-center q-mt-md" style="font-size:0.85em;">{{ successMsg }}</div>
      <div v-if="errorMsg"   class="text-negative text-center q-mt-md" style="font-size:0.85em;">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, watch } from 'vue'
import MakerHeader from './MakerHeader.vue'
import NoteEditor from 'src/components/nodes/NoteEditor.vue'
import { labelService } from 'src/services/label.service'
import { nodeService } from 'src/services/node.service'
import { postService } from 'src/services/post.service'

const TYPE_TO_LABEL_NAME = { 1: 'NOTE', 2: 'FILE', 3: 'LINK', 4: 'LINK' }
const NODE_TYPE_OPTIONS = [
  { label: 'Note', value: 1 },
  { label: 'File', value: 2 },
  { label: 'URL/Link', value: 3 },
  { label: 'Reference', value: 4 }
]

// Debounce util — no lodash dependency.
const debounce = (fn, ms) => {
  let t = null
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

export default defineComponent({
  name: 'ElementMaker',
  components: { MakerHeader, NoteEditor },
  emits: ['close', 'created', 'updated', 'forked'],

  props: {
    targetType: {
      type: String,
      required: true,
      validator: v => ['label', 'node', 'post', 'skeleton'].includes(v)
    },
    mode: {
      type: String,
      default: 'make',
      validator: v => ['make', 'edit', 'fork'].includes(v)
    },
    sourceId: { type: Number, default: null },
    // For edit/fork: caller pre-resolves these so ElementMaker doesn't
    // duplicate per-page fetch logic. For make, they're ignored.
    sourceContent: { type: String, default: '' },
    sourceTitle: { type: String, default: '' },
    sourceTypeId: { type: Number, default: 1 },
    sourceName: { type: String, default: '' },
    sourceIsSystemLabel: { type: Boolean, default: false }
  },

  setup (props, { emit }) {
    const loading = ref(false)
    const draftBusy = ref(false)
    const errorMsg = ref('')
    const successMsg = ref('')
    const hasDraft = ref(false)
    const lastSavedAt = ref(null)

    const form = reactive({
      name: props.sourceName || '',
      title: props.sourceTitle || '',
      content: props.sourceContent || '',
      typeId: props.sourceTypeId || 1,
      ancestorId: null,
      authorEntityId: null,
      labelIds: []
    })

    const dialogStyle = computed(() => {
      if (props.targetType === 'label' || props.targetType === 'skeleton') return 'width: min(520px, 96vw);'
      if (props.targetType === 'node') return 'width: min(720px, 96vw);'
      return 'width: min(880px, 96vw);'
    })

    const headerIcon = computed(() => {
      if (props.mode === 'fork') return 'call_split'
      if (props.mode === 'edit') return 'edit'
      return { label: 'label_important', node: 'article', post: 'article', skeleton: 'view_module' }[props.targetType]
    })

    const headerTitle = computed(() => {
      const action = props.mode === 'make' ? 'Make' : (props.mode === 'edit' ? 'Edit' : 'Fork')
      const typeName = { label: 'label', node: 'node', post: 'post', skeleton: 'skeleton' }[props.targetType]
      return `${action} ${typeName}`
    })

    const makerHeaderKind = computed(() => {
      if (props.mode === 'fork') return 'fork'
      return props.targetType
    })

    const submitIcon = computed(() => ({
      label: 'add', node: 'add', post: 'add', skeleton: 'add'
    }[props.targetType]))

    const submitLabel = computed(() => ({
      label: 'Create label',
      node: 'Post node',
      post: 'Post',
      skeleton: 'Create skeleton'
    }[props.targetType]))

    const nodeTypeOptions = NODE_TYPE_OPTIONS

    const nodeContentLabel = computed(() => ({
      2: 'File path', 3: 'URL', 4: 'Reference path'
    }[form.typeId] || 'Content'))

    // ── Canonic labels (display-only system chips in MakerHeader) ──
    const allLeaves = ref([])
    const canonicLabels = computed(() => {
      if (!allLeaves.value.length) return []
      const out = []
      const typeName = TYPE_TO_LABEL_NAME[form.typeId]
      if (typeName) {
        const typeLeaf = allLeaves.value.find(l => l.name === typeName && l.parent_name === 'NODE')
        if (typeLeaf) out.push(typeLeaf)
      }
      if (props.mode === 'fork') {
        const forkLeaf = allLeaves.value.find(l => l.name === 'FORK' && l.parent_name === 'PROVENANCE')
        if (forkLeaf) out.push(forkLeaf)
      }
      return out
    })

    // ── Label parent picker (make-only) ──
    const parentSearch = ref('')
    const parentResults = ref([])
    const selectedParent = ref(null)
    const searchParents = async (q) => {
      if (!q || q.length < 2) { parentResults.value = []; return }
      const r = await labelService.search(q)
      if (r.success) parentResults.value = r.labels
    }
    const pickParent = (l) => {
      selectedParent.value = l
      form.ancestorId = l.id
      parentResults.value = []
      parentSearch.value = l.name
    }

    onMounted(async () => {
      try {
        const r = await labelService.listLeaves()
        if (r.success) allLeaves.value = r.leaves
      } catch (_) { /* leaves empty */ }

      // Edit mode: load existing draft (if any) so the editor reflects
      // owner's in-progress state.
      if (props.mode === 'edit' && (props.targetType === 'node' || props.targetType === 'post')) {
        const svc = props.targetType === 'node' ? nodeService : postService
        try {
          const r = await svc.getDraft(props.sourceId)
          if (r.success && r.draft) {
            form.content = r.draft.content || form.content
            if (r.draft.type_id) form.typeId = r.draft.type_id
            hasDraft.value = true
          }
        } catch (_) { /* no draft */ }
      }
    })

    // ── Auto-save for edit mode (debounced) ──
    const autoSave = debounce(async () => {
      if (props.mode !== 'edit') return
      if (props.targetType !== 'node' && props.targetType !== 'post') return
      if (!props.sourceId) return
      draftBusy.value = true
      errorMsg.value = ''
      try {
        const svc = props.targetType === 'node' ? nodeService : postService
        const payload = props.targetType === 'node'
          ? { content: form.content, typeId: form.typeId }
          : { content: form.content }
        const r = await svc.saveDraft(props.sourceId, payload)
        if (r.success) {
          hasDraft.value = true
          lastSavedAt.value = new Date()
        } else {
          errorMsg.value = r.error?.message || 'Auto-save failed'
        }
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'Auto-save failed'
      } finally { draftBusy.value = false }
    }, 600)

    watch(() => form.content, () => {
      if (props.mode === 'edit' && (props.targetType === 'node' || props.targetType === 'post')) {
        autoSave()
      }
    })
    watch(() => form.typeId, () => {
      if (props.mode === 'edit' && props.targetType === 'node') {
        autoSave()
      }
    })

    const draftStatusLine = computed(() => {
      if (draftBusy.value) return 'Auto-saving…'
      if (hasDraft.value && lastSavedAt.value) {
        const t = lastSavedAt.value
        const hh = String(t.getHours()).padStart(2, '0')
        const mm = String(t.getMinutes()).padStart(2, '0')
        return `Auto-saved · draft at ${hh}:${mm}`
      }
      if (hasDraft.value) return 'Working draft (unpromoted)'
      return 'Editing — changes auto-save as a draft. Promote to publish.'
    })

    const onDiscardDraft = async () => {
      if (!confirm('Discard your working draft? This cannot be undone.')) return
      draftBusy.value = true
      try {
        const svc = props.targetType === 'node' ? nodeService : postService
        await svc.discardDraft(props.sourceId)
        hasDraft.value = false
        form.content = props.sourceContent || ''
        form.typeId = props.sourceTypeId || 1
        successMsg.value = 'Draft discarded'
        setTimeout(() => (successMsg.value = ''), 1200)
      } catch (e) { fail(e) } finally { draftBusy.value = false }
    }

    const onPromote = async () => {
      if (!hasDraft.value) {
        errorMsg.value = 'Nothing to promote — make some changes first.'
        return
      }
      loading.value = true
      errorMsg.value = ''
      try {
        const svc = props.targetType === 'node' ? nodeService : postService
        const r = await svc.promote(props.sourceId)
        if (r.success) {
          const promoted = props.targetType === 'node' ? (r.promoted || r.node) : r.skeleton
          successMsg.value = 'Promoted to current version'
          emit('updated', promoted)
          setTimeout(() => emit('close'), 900)
        } else {
          errorMsg.value = r.error?.message || 'Promote failed'
        }
      } catch (e) { fail(e) } finally { loading.value = false }
    }

    // ── Submit dispatch ──
    const canSubmitMake = computed(() => {
      if (props.targetType === 'label') return !!form.name?.trim()
      if (props.targetType === 'skeleton') return !!form.name?.trim()
      return !!form.content?.trim()
    })

    const fail = (err) => {
      errorMsg.value = err?.response?.data?.error?.message || err?.message || 'Something went wrong'
    }

    const onSubmit = async () => {
      errorMsg.value = ''
      if (props.mode === 'make') return submitMake()
      if (props.mode === 'fork') return submitFork()
      if (props.mode === 'edit' && props.targetType === 'label') return submitLabelEdit()
      // edit for node/post is handled via [Promote to current] button, not form submit.
    }

    const submitMake = async () => {
      loading.value = true
      try {
        let r
        if (props.targetType === 'label') {
          r = await labelService.create({ name: form.name, ancestorId: form.ancestorId })
          if (r.success) emit('created', r.label)
        } else if (props.targetType === 'node' || props.targetType === 'post') {
          // Creation moved to the dedicated maker family: UploaderDock
          // (files/links/notes) and MakerDock. ElementMaker keeps only the
          // edit/fork lifecycle for these kinds.
          errorMsg.value = 'Use the Upload or Make post buttons to create nodes and posts.'
          loading.value = false
          return
        } else if (props.targetType === 'skeleton') {
          // skeleton make goes through the generic POST /skeletons endpoint
          const api = (await import('src/services/api')).default
          const { data } = await api.post('/skeletons', { name: form.name })
          r = data
          if (r.success) emit('created', r.skeleton)
        }
        if (r?.success) {
          successMsg.value = 'Created!'
          setTimeout(() => emit('close'), 800)
        } else {
          errorMsg.value = r?.error?.message || 'Failed'
        }
      } catch (e) { fail(e) } finally { loading.value = false }
    }

    const submitFork = async () => {
      if (props.targetType !== 'node' && props.targetType !== 'post') {
        errorMsg.value = 'Forking is not supported for this element type.'
        return
      }
      loading.value = true
      try {
        const svc = props.targetType === 'node' ? nodeService : postService
        const r = props.targetType === 'node'
          ? await svc.forkOfNode(props.sourceId, {
            authorEntityId: form.authorEntityId, labelIds: form.labelIds
          })
          : await svc.forkOf(props.sourceId, {
            authorEntityId: form.authorEntityId, labelIds: form.labelIds
          })
        if (r.success) {
          successMsg.value = 'Fork created'
          const forked = props.targetType === 'node' ? r.node : r.skeleton
          emit('forked', forked)
          setTimeout(() => emit('close'), 800)
        } else {
          errorMsg.value = r.error?.message || 'Fork failed'
        }
      } catch (e) { fail(e) } finally { loading.value = false }
    }

    const submitLabelEdit = async () => {
      loading.value = true
      try {
        const r = await labelService.update(props.sourceId, { name: form.name })
        if (r.success) {
          successMsg.value = 'Label updated'
          emit('updated', r.label)
          setTimeout(() => emit('close'), 800)
        } else {
          errorMsg.value = r.error?.message || 'Update failed'
        }
      } catch (e) { fail(e) } finally { loading.value = false }
    }

    return {
      form,
      loading,
      draftBusy,
      errorMsg,
      successMsg,
      hasDraft,
      dialogStyle,
      headerIcon,
      headerTitle,
      makerHeaderKind,
      submitIcon,
      submitLabel,
      canSubmitMake,
      nodeTypeOptions,
      nodeContentLabel,
      canonicLabels,
      parentSearch,
      parentResults,
      selectedParent,
      searchParents,
      pickParent,
      draftStatusLine,
      onDiscardDraft,
      onPromote,
      onSubmit
    }
  }
})
</script>

<style lang="scss" scoped>
.maker-dialog {
  background: var(--canvas);
  padding: 18px 20px;
  border-radius: 6px;
  border: 1px solid var(--rule);
}
.label-scroll-row {
  display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;
}
.label-chip {
  padding: 3px 8px; font-size: 0.78em; border: 1px solid var(--rule);
  border-radius: 12px; cursor: pointer; white-space: nowrap;
  &.selected { border-color: var(--accent); color: var(--accent); }
}
.text-warning { color: #d4a64a; }
</style>
