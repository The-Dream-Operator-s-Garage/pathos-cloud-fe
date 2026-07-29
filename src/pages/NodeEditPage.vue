<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-11 col-lg-9">

        <div class="row items-center q-mb-md">
          <q-btn flat dense icon="arrow_back" no-caps class="text-dim"
            @click="$router.push('/nodes/' + nodeId)">
            <span class="q-ml-xs" style="font-size:0.82em;">Back to viewer</span>
          </q-btn>
          <q-space />
          <q-chip v-if="node" dense outline color="primary" size="sm" class="q-ma-none">
            <q-icon name="edit" size="11px" class="q-mr-xs" />Editing
          </q-chip>
        </div>

        <div v-if="loading" class="flex flex-center q-py-xl">
          <q-spinner color="primary" size="36px" />
        </div>

        <div v-else-if="!node" class="text-center text-dim q-py-xl">Node not found.</div>

        <div v-else-if="!isOwner" class="text-center text-dim q-py-xl">
          <q-icon name="lock" size="40px" style="opacity:.3;" />
          <div class="q-mt-sm">You can only edit nodes you own.</div>
          <q-btn flat color="primary" label="View node" class="q-mt-md"
            @click="$router.push('/nodes/' + nodeId)" />
        </div>

        <div v-else>
          <div class="text-hash mono q-mb-md" style="font-size:0.72em; opacity:.4;">{{ node.path }}</div>

          <NoteEditor
            v-model="editContent"
            :show-save="true"
            :saving="saving"
            initial-mode="split"
            height="560px"
            @save="saveNote"
          />

          <div v-if="saveMsg" class="q-mt-sm text-right"
            :class="saveMsg.ok ? 'text-positive' : 'text-negative'"
            style="font-size:0.8em;">
            {{ saveMsg.text }}
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useNavStore } from 'src/stores/navigation'
import { nodeService } from 'src/services/node.service'
import NoteEditor from 'src/components/nodes/NoteEditor.vue'
import { bodyOf } from 'src/utils/nodeContent'

export default defineComponent({
  name: 'NodeEditPage',
  components: { NoteEditor },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const navStore = useNavStore()

    const nodeId = computed(() => parseInt(route.params.id))
    const node = ref(null)
    const loading = ref(true)
    const saving = ref(false)
    const saveMsg = ref(null)
    const editContent = ref('')

    const isOwner = computed(() =>
      !!(node.value && authStore.entityId && node.value.owner_id === authStore.entityId)
    )

    const saveNote = async (content) => {
      saving.value = true
      saveMsg.value = null
      try {
        const result = await nodeService.update(node.value.id, { content })
        if (result.success) {
          saveMsg.value = { ok: true, text: 'Saved.' }
          navStore.recordAction('EDIT', {
            targetType: 'node',
            targetId: node.value.id,
            targetRoute: `/nodes/${node.value.id}`,
            targetLabel: `Edited Node #${node.value.id}`,
            targetPath: node.value.path
          })
          setTimeout(() => { router.push('/nodes/' + node.value.id) }, 800)
        } else {
          saveMsg.value = { ok: false, text: result.error?.message || 'Save failed' }
        }
      } catch (e) {
        saveMsg.value = { ok: false, text: e?.response?.data?.error?.message || 'Error' }
      } finally {
        saving.value = false
      }
    }

    const loadFromRoute = async () => {
      loading.value = true
      node.value = null
      editContent.value = ''
      if (!nodeId.value) { loading.value = false; return }
      const result = await nodeService.get(nodeId.value)
      if (result?.success) {
        node.value = result.node
        // File-backed nodes edit their resolved body text, not the address.
        editContent.value = bodyOf(result.node)
      }
      loading.value = false
    }

    onMounted(loadFromRoute)
    watch(nodeId, loadFromRoute)

    return { nodeId, node, loading, saving, saveMsg, editContent, isOwner, saveNote }
  }
})
</script>
