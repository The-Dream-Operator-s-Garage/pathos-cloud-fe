<template>
  <div class="element-actions">
    <q-btn flat dense no-caps size="sm" icon="edit" label="Edit"
      :title="editTooltip"
      @click="onEditClick" />
    <q-btn v-if="canFork && !hideFork"
      flat dense no-caps size="sm" icon="call_split" label="Fork"
      @click="onForkClick" />

    <!-- Non-owner Edit → Fork-to-edit confirm -->
    <q-dialog v-model="confirmForkToEdit" persistent>
      <q-card style="min-width:320px; max-width:480px;">
        <q-card-section>
          <div class="text-h6" style="font-size:1em;">Fork to edit?</div>
        </q-card-section>
        <q-card-section class="q-pt-none" style="font-size:0.85em; line-height:1.5;">
          You don't own this {{ targetType }}, so editing isn't allowed directly.
          Forking creates an owned copy — comments, sub-forks and attachments come
          along tagged as inherited. You can edit your fork freely afterward.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated color="primary" no-caps
            icon="call_split" label="Fork & edit"
            :loading="forkingThenEditing"
            @click="doForkThenEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ElementMaker overlay (mounted on demand) -->
    <ElementMaker
      v-if="makerOpen"
      :target-type="targetType"
      :mode="makerMode"
      :source-id="makerSourceId"
      :source-content="sourceContent"
      :source-title="sourceTitle"
      :source-type-id="sourceTypeId"
      :source-name="sourceName"
      :source-is-system-label="sourceIsSystemLabel"
      @close="makerOpen = false"
      @created="(e) => $emit('created', e)"
      @updated="(e) => $emit('updated', e)"
      @forked="onMakerForked"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import ElementMaker from './ElementMaker.vue'
import { nodeService } from 'src/services/node.service'
import { postService } from 'src/services/post.service'
import { skeletonService } from 'src/services/skeleton.service'
import { useSkeletonBuilderStore } from 'src/stores/skeletonBuilder'

export default defineComponent({
  name: 'ElementActions',
  components: { ElementMaker },
  emits: ['created', 'updated', 'forked'],
  props: {
    targetType: {
      type: String,
      required: true,
      validator: v => ['label', 'node', 'post', 'skeleton'].includes(v)
    },
    sourceId: { type: Number, required: true },
    sourceOwnerId: { type: Number, default: null },
    sourceContent: { type: String, default: '' },
    sourceTitle: { type: String, default: '' },
    sourceTypeId: { type: Number, default: 1 },
    sourceName: { type: String, default: '' },
    sourceIsSystemLabel: { type: Boolean, default: false },
    hideFork: { type: Boolean, default: false }
  },

  setup (props, { emit }) {
    const auth = useAuthStore()
    const router = useRouter()
    const makerOpen = ref(false)
    const makerMode = ref('edit')
    const makerSourceId = ref(props.sourceId)
    const confirmForkToEdit = ref(false)
    const forkingThenEditing = ref(false)

    const isOwner = computed(() =>
      auth.entityId != null && props.sourceOwnerId === auth.entityId
    )

    // Non-POST skeletons split two ways: SCHEMAS (definitional heads) edit
    // in the schema builder dock; INSTANCES are populated on their own
    // /skeletons/:id viewer. POST instances keep the richer post edit flow.
    const usesBuilder = computed(() =>
      props.targetType === 'skeleton' && props.sourceName !== 'POST'
    )

    const canFork = computed(() =>
      props.targetType === 'node' || props.targetType === 'post' || usesBuilder.value
    )

    const editTooltip = computed(() => {
      if (props.sourceIsSystemLabel) return 'Default labels cannot be edited'
      if (!isOwner.value) return 'You don\'t own this — Edit will offer to fork'
      if (usesBuilder.value) return 'Edit its schema / fill its fields'
      return 'Edit (auto-save + promote to current)'
    })

    // Route a skeleton edit: a SCHEMA opens the schema builder dock; an
    // INSTANCE navigates to its viewer (the population surface). Returns
    // true when handled.
    const routeSkeletonEdit = async (skeletonId) => {
      try {
        const w = await skeletonService.walk(skeletonId)
        if (!w.success) return false
        const outcome = useSkeletonBuilderStore().openFromWalk(w, auth.entityId)
        if (outcome === 'instance') {
          router.push('/skeletons/' + skeletonId)
        }
        return true
      } catch (e) {
        console.error('routeSkeletonEdit failed — falling back to the plain maker:', e)
      }
      return false
    }

    const onEditClick = async () => {
      if (props.sourceIsSystemLabel) return
      if (usesBuilder.value) {
        // Schema (any viewer) → dock; own instance → viewer; foreign
        // instance → fork-to-edit confirm.
        const w = await skeletonService.walk(props.sourceId).catch(() => null)
        const isSchema = !!w?.skeleton?.is_schema
        if (isSchema || isOwner.value) {
          if (await routeSkeletonEdit(props.sourceId)) return
        } else {
          confirmForkToEdit.value = true
          return
        }
      }
      if (!isOwner.value) {
        if (!canFork.value) return // labels: non-owner can't edit, no fork path
        confirmForkToEdit.value = true
        return
      }
      makerMode.value = 'edit'
      makerSourceId.value = props.sourceId
      makerOpen.value = true
    }

    const onForkClick = async () => {
      if (usesBuilder.value) {
        // A SCHEMA forks through the builder dock's fork draft (rename +
        // tweak fields; submit records lineage server-side) — the plain
        // fork endpoint refuses origins. An instance forks straight
        // through the API.
        const w = await skeletonService.walk(props.sourceId).catch(() => null)
        if (w?.skeleton?.is_schema) {
          useSkeletonBuilderStore().openForkDraft(w)
          return
        }
        doForkThenEdit()
        return
      }
      makerMode.value = 'fork'
      makerSourceId.value = props.sourceId
      makerOpen.value = true
    }

    const doForkThenEdit = async () => {
      forkingThenEditing.value = true
      try {
        // Generic skeletons fork through the skeleton fork endpoint. A
        // schema fork lands in the dock; an instance fork navigates to the
        // fresh instance's viewer.
        if (usesBuilder.value) {
          const r = await skeletonService.forkOf(props.sourceId, {})
          if (!r.success) { emit('forked', null); return }
          confirmForkToEdit.value = false
          await routeSkeletonEdit(r.skeleton.id)
          emit('forked', r.skeleton)
          return
        }
        const svc = props.targetType === 'node' ? nodeService : postService
        const r = props.targetType === 'node'
          ? await svc.forkOfNode(props.sourceId, {})
          : await svc.forkOf(props.sourceId, {})
        if (!r.success) {
          // surface error via parent; we just close the dialog
          emit('forked', null)
          return
        }
        const forked = props.targetType === 'node' ? r.node : r.skeleton
        confirmForkToEdit.value = false
        // Open the maker in edit mode on the fresh fork.
        makerMode.value = 'edit'
        makerSourceId.value = forked.id
        makerOpen.value = true
        emit('forked', forked)
      } finally {
        forkingThenEditing.value = false
      }
    }

    const onMakerForked = (forked) => {
      // Fork from the explicit Fork button: just notify the page.
      emit('forked', forked)
    }

    return {
      makerOpen,
      makerMode,
      makerSourceId,
      confirmForkToEdit,
      forkingThenEditing,
      isOwner,
      canFork,
      editTooltip,
      onEditClick,
      onForkClick,
      doForkThenEdit,
      onMakerForked
    }
  }
})
</script>

<style lang="scss" scoped>
.element-actions {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  :deep(.q-btn) {
    color: var(--ink);
  }
}
</style>
