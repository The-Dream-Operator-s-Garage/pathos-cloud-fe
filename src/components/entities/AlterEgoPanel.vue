<template>
  <!-- Only rendered when the viewed entity belongs to the viewer's own
       identity tree — this is the sub-entities section of the entity viewer
       plus the internal log-in ("switch identity") controls. -->
  <section v-if="isYours" class="ego-panel side-panel">
    <div class="ego-panel__header">
      <q-icon name="theater_comedy" size="14px" class="q-mr-xs" />
      <span>Alter-egos</span>
    </div>

    <div class="ego-panel__scroll">

      <!-- Who am I right now + the way back to the root identity. -->
      <div class="ego-block">
        <div class="ego-block__label">acting as</div>
        <div class="ego-acting-row">
          <q-icon
            :name="authStore.isActingAsAlterEgo ? 'theater_comedy' : 'person'"
            size="15px"
            class="ego-acting-icon"
          />
          <span class="ego-acting-name">{{ actingName }}</span>
        </div>
        <q-btn
          v-if="authStore.isActingAsAlterEgo"
          class="q-mt-sm full-width"
          color="primary" outline dense size="sm"
          icon="undo" label="Return to root identity"
          :loading="switching"
          @click="switchTo({ id: authStore.rootEntityId, display_name: 'root identity' })"
        />
      </div>

      <!-- The viewed entity's sub-entity tree. -->
      <div class="ego-block">
        <div class="ego-block__label">sub-entities of {{ tree ? tree.display_name : '…' }}</div>
        <div v-if="loading" class="text-center q-py-sm">
          <q-spinner color="primary" size="18px" />
        </div>
        <div v-else-if="!tree || !tree.children.length" class="ego-empty">
          no alter-egos yet
        </div>
        <div v-else class="ego-tree">
          <AlterEgoTreeNode
            v-for="child in tree.children"
            :key="child.id"
            :node="child"
            :acting-id="authStore.entityId"
            @switch="switchTo"
          />
        </div>
      </div>

      <!-- Creation window trigger (2026-07-30: the inline form became a
           DIALOG with inheritance + origin disclosure). -->
      <div class="ego-block">
        <q-btn
          color="primary" unelevated dense size="sm"
          icon="add" label="New alter-ego…"
          class="full-width"
          @click="createOpen = true"
        />
      </div>

    </div>

    <!-- ══ THE CREATION WINDOW ══ A new identity is born here: what it's
         called, what it carries down from the root (face, bio), and
         whether the thread back to you is public or private. -->
    <q-dialog v-model="createOpen">
      <q-card class="ego-create">
        <q-card-section class="ego-create__head">
          <q-icon name="auto_awesome" size="16px" />
          <span>New alter-ego of <strong>{{ tree ? tree.display_name : 'this entity' }}</strong></span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newName"
            dense outlined autofocus
            label="Name"
            maxlength="64"
            class="q-mb-sm ego-input"
            @keyup.enter="create"
          />
          <q-input
            v-model="newBio"
            dense outlined autogrow
            label="Bio (optional)"
            class="q-mb-md ego-input"
          />

          <div class="ego-create__label">inherit from your root identity</div>
          <q-checkbox v-model="inheritPhoto" dense size="sm" label="profile photo (the root's face)" class="ego-create__opt" />
          <q-checkbox v-model="inheritBio" dense size="sm" label="bio (only if none written above)" class="ego-create__opt q-mb-md" />

          <div class="ego-create__label">origin disclosure</div>
          <q-toggle
            v-model="disclose"
            dense color="amber"
            :label="disclose ? 'public — anyone can trace this identity to you' : 'private — others see the thread fade before it reaches you'"
            class="ego-create__toggle"
          />
          <div class="ego-hint q-mt-xs">
            The choice lives as the profile's ORIGIN record — an ordinary
            content-privacy setting you can flip later from the origin
            constellation.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat dense no-caps label="Cancel" @click="createOpen = false" />
          <q-btn
            color="primary" unelevated dense no-caps
            icon="add" label="Mint identity"
            :disable="!newName.trim()"
            :loading="creating"
            @click="create"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { entityService } from 'src/services/entity.service'
import AlterEgoTreeNode from './AlterEgoTreeNode.vue'

export default defineComponent({
  name: 'AlterEgoPanel',
  components: { AlterEgoTreeNode },
  props: {
    // The entity the viewer is currently looking at.
    entityId: { type: Number, required: true }
  },
  setup (props) {
    const $q = useQuasar()
    const authStore = useAuthStore()

    const tree = ref(null)
    const isYours = ref(false)
    const loading = ref(true)
    const creating = ref(false)
    const switching = ref(false)
    const newName = ref('')
    const newBio = ref('')
    const createOpen = ref(false)
    const inheritPhoto = ref(false)
    const inheritBio = ref(false)
    const disclose = ref(false)

    const actingName = computed(() =>
      authStore.user?.display_name || authStore.user?.username || ('entity #' + authStore.entityId))

    const load = async () => {
      loading.value = true
      tree.value = null
      isYours.value = false
      try {
        const r = await entityService.alterEgos(props.entityId)
        if (r.success) {
          tree.value = r.tree
          isYours.value = r.is_yours
        }
      } catch (_) { /* panel stays hidden */ }
      loading.value = false
    }

    const create = async () => {
      if (!newName.value.trim()) return
      creating.value = true
      try {
        const r = await entityService.createAlterEgo(props.entityId, {
          name: newName.value.trim(),
          bio: newBio.value.trim() || undefined,
          inherit: { photo: inheritPhoto.value, bio: inheritBio.value },
          discloseOrigin: disclose.value
        })
        if (r.success) {
          $q.notify({ type: 'positive', message: `Alter-ego "${r.entity.display_name}" created${disclose.value ? ' — origin public' : ' — origin private'}` })
          newName.value = ''
          newBio.value = ''
          inheritPhoto.value = false
          inheritBio.value = false
          disclose.value = false
          createOpen.value = false
          load()
        } else {
          $q.notify({ type: 'negative', message: r.error?.message || 'Creation failed' })
        }
      } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error?.message || e.message })
      }
      creating.value = false
    }

    const switchTo = async (node) => {
      switching.value = true
      try {
        const r = await authStore.switchIdentity(node.id)
        if (r.success) {
          $q.notify({
            type: 'positive',
            icon: 'theater_comedy',
            message: `Now acting as ${r.entity.display_name}`
          })
        } else {
          $q.notify({ type: 'negative', message: r.error?.message || 'Switch failed' })
        }
      } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error?.message || e.message })
      }
      switching.value = false
    }

    onMounted(load)
    watch(() => props.entityId, load)
    // A switch changes the acting JWT but not the subtree; is_yours is
    // root-relative so the panel stays. Only the highlight moves — reactive
    // through authStore, no reload needed.

    return {
      authStore,
      tree,
      isYours,
      loading,
      creating,
      switching,
      newName,
      newBio,
      createOpen,
      inheritPhoto,
      inheritBio,
      disclose,
      actingName,
      create,
      switchTo
    }
  }
})
</script>

<style lang="scss" scoped>
.ego-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}

.ego-panel__header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  font-size: 0.78em;
  font-weight: 500;
  color: var(--panel-ink-1);
  flex-shrink: 0;
}

.ego-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ego-block__label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
  margin-bottom: 5px;
}

.ego-acting-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(155, 108, 176, 0.08);
  border: 1px solid rgba(155, 108, 176, 0.3);
}
.ego-acting-icon { color: #9b6cb0; }
.ego-acting-name {
  font-size: 0.85em;
  color: var(--panel-ink-1);
  font-weight: 500;
}

.ego-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
}

.ego-hint {
  font-size: 0.76em;
  color: rgba(var(--ink-rgb), 0.55);
  margin-bottom: 8px;
}

.ego-input :deep(.q-field__label) { font-size: 0.85em; }

// The creation window — plain platform card; the drama lives in the
// origin toggle's amber and its plain-words consequence line.
.ego-create {
  width: 380px;
  max-width: 92vw;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }
  &__label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.55;
    margin-bottom: 4px;
  }
  &__opt { display: block; font-size: 0.8rem; }
  &__toggle :deep(.q-toggle__label) { font-size: 0.78rem; }
}
</style>
