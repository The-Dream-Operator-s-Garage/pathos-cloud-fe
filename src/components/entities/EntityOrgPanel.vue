<template>
  <!-- THE ORGANIZATION PANEL (2026-09-11, user ask: the entity window
       "properly arranged to represent organizations"). An org ENTITY read
       through the entity door carries its organization card; this panel
       is the org's inner life beside it — the decision-making tree and the
       sub-organizations — exactly what OrgDetailPage shows a member, and
       exactly what it refuses an outsider: `access` is the server's word
       (GET /organizations/:id), and a locked org shows the lock line the
       org page shows, never a redacted tree. Mounted by EntityFace (the
       window) and EntityProfilePage (the page) for type-3 entities. -->
  <section v-if="organization" class="org-panel">
    <div class="org-panel__header">
      <q-icon name="corporate_fare" size="14px" class="q-mr-xs" />
      <span>Organization</span>
      <span v-if="access === 'member'" class="org-panel__count mono">{{ memberTotal }}</span>
      <q-space />
      <router-link :to="`/organizations/${organization.id}`" class="org-panel__door" title="Open the organization page">
        <q-icon name="open_in_new" size="13px" />
      </router-link>
    </div>

    <div class="org-panel__scroll">
      <!-- ══ Outsider state ══ -->
      <div v-if="access !== 'member'" class="org-panel__locked">
        <q-icon name="lock" size="20px" />
        <div>
          <div class="org-panel__locked-line">The inner life of {{ organization.name }} belongs to its members.</div>
          <div class="org-panel__locked-hint">Membership travels by invitation — a member can send you one through chat, or share a join secret.</div>
        </div>
      </div>

      <template v-else>
        <div v-if="loading" class="text-center q-py-sm">
          <q-spinner color="primary" size="18px" />
        </div>
        <template v-else>
          <!-- ══ Decision-making tree ══ -->
          <div class="org-block">
            <div class="org-block__label">
              <q-icon name="account_tree" size="12px" /> decision-making tree
            </div>
            <div v-if="!memberTree.length" class="org-block__hint">No seats yet.</div>
            <div v-else class="org-panel__tree">
              <OrgMemberTreeNode
                v-for="root in memberTree"
                :key="root.member_id"
                :node="root"
                :acting-id="actingId"
                @switch="wearMaskOf"
              />
            </div>
          </div>

          <!-- ══ Sub-organizations ══ -->
          <div class="org-block">
            <div class="org-block__label">
              <q-icon name="lan" size="12px" /> sub-organizations
              <span class="org-panel__count mono">{{ subOrgs.length }}</span>
            </div>
            <div v-if="!subOrgs.length" class="org-block__hint">No sub-organizations yet.</div>
            <router-link
              v-for="s in subOrgs" :key="s.id"
              :to="`/organizations/${s.id}`"
              class="org-sub-row"
            >
              <q-icon name="account_tree" size="14px" />
              <span class="org-sub-row__name">{{ s.name }}</span>
              <span class="org-sub-row__count">{{ s.member_count }} member{{ s.member_count === 1 ? '' : 's' }}</span>
            </router-link>
          </div>
        </template>
      </template>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { orgService } from 'src/services/org.service'
import OrgMemberTreeNode from 'src/components/organizations/OrgMemberTreeNode.vue'

export default defineComponent({
  name: 'EntityOrgPanel',
  components: { OrgMemberTreeNode },
  props: {
    // GET /entities/:id → `organization` for a type-3 row
    organization: { type: Object, default: null },
    // 'member' | 'locked' — the server's verdict for the viewer
    access: { type: String, default: 'locked' }
  },
  emits: ['switched'],
  setup (props, { emit }) {
    const $q = useQuasar()
    const auth = useAuthStore()

    const loading = ref(false)
    const memberTree = ref([])
    const memberTotal = ref(0)
    const subOrgs = ref([])

    const actingId = computed(() => parseInt(auth.user?.entityId ?? auth.user?.id, 10) || null)

    const load = async () => {
      const org = props.organization
      memberTree.value = []
      memberTotal.value = 0
      subOrgs.value = []
      if (!org || props.access !== 'member') return
      loading.value = true
      try {
        const [m, s] = await Promise.all([
          orgService.members(org.id),
          orgService.structure(org.id)
        ])
        if (props.organization?.id !== org.id) return
        if (m.success) { memberTree.value = m.tree; memberTotal.value = m.total }
        if (s.success) subOrgs.value = s.sub_organizations || []
      } catch (_) { /* the panel shows what it could read */ }
      loading.value = false
    }

    // The put-on-the-mask switch — OrgDetailPage's seam, worn here.
    const wearMaskOf = async (node) => {
      if (!node.mask) return
      try {
        await auth.switchIdentity(node.mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${node.mask.display_name}`, icon: 'theater_comedy' })
        emit('switched')
        await load()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      }
    }

    onMounted(load)
    watch(() => [props.organization?.id, props.access], load)

    return { loading, memberTree, memberTotal, subOrgs, actingId, wearMaskOf }
  }
})
</script>

<style lang="scss" scoped>
.org-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;

  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 0 0 auto;
}
.org-panel__header {
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
.org-panel__count {
  margin-left: 8px;
  font-size: 0.82em;
  color: var(--panel-ink-2);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: var(--radius-pill);
  padding: 0 7px;
}
.org-panel__door {
  display: inline-flex;
  color: var(--panel-ink-2);
  &:hover { color: #3f51b5; }
}
.org-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: var(--entity-org-max-h, 360px);
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.org-panel__locked {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 2px;
  color: var(--panel-ink-2);
  .q-icon { flex: 0 0 auto; opacity: 0.6; margin-top: 2px; }
}
.org-panel__locked-line { font-size: 0.82em; color: var(--panel-ink-1); }
.org-panel__locked-hint { font-size: 0.72em; margin-top: 3px; }

.org-block__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
  margin-bottom: 5px;
}
.org-block__hint {
  font-size: 0.78em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
}
.org-panel__tree { font-size: 0.9em; }

.org-sub-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  margin-top: 4px;
  border: 1px solid #eef1f6;
  border-radius: 7px;
  text-decoration: none;
  color: var(--panel-ink-1);
  min-width: 0;
  font-size: 0.8em;
  .q-icon { color: var(--panel-ink-2); }
  &:hover { border-color: rgba(63, 81, 181, 0.45); background: #f9fafd; }
}
.org-sub-row__name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.org-sub-row__count { font-size: 0.86em; color: var(--panel-ink-2); white-space: nowrap; }
</style>
