<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-lg-10 org-detail" v-if="org">
        <!-- ══ Header — public: the org is an entity, its profile is open ══ -->
        <header class="org-detail__head">
          <div class="org-detail__ident">
            <q-icon :name="org.parent ? 'account_tree' : 'reduce_capacity'" size="26px" />
            <div class="org-detail__names">
              <h1 class="org-detail__name nasalization">{{ org.name }}</h1>
              <div class="org-detail__meta">
                <router-link :to="`/entities/${org.entity_id}`" class="org-detail__entity mono">
                  {{ (org.path || '').split('/').pop().slice(0, 12) }}…
                </router-link>
                <span>· {{ org.member_count }} member{{ org.member_count === 1 ? '' : 's' }}</span>
                <router-link v-if="org.parent" :to="`/organizations/${org.parent.id}`" class="org-detail__parent">
                  · sub-org of {{ org.parent.name }}
                </router-link>
              </div>
            </div>
          </div>
          <div v-if="org.profile?.bio" class="org-detail__bio">{{ org.profile.bio }}</div>

          <!-- My seat -->
          <div v-if="myMembership" class="org-detail__seat">
            <q-icon name="theater_comedy" size="15px" />
            <span v-if="myMembership.role_title" class="org-detail__seat-title">{{ myMembership.role_title }}</span>
            <span v-if="myMembership.mask">— {{ myMembership.mask.display_name }}</span>
            <q-chip v-if="myMembership.mask?.acting" dense size="sm" color="accent" text-color="white">acting</q-chip>
            <q-btn
              v-else-if="myMembership.mask"
              unelevated dense no-caps size="sm" color="primary" icon="login" label="Put on the mask"
              :loading="switching" @click="wearMask"
            />
          </div>
        </header>

        <!-- ══ Outsider state ══ -->
        <section v-if="access === 'locked'" class="org-locked">
          <q-icon name="lock" size="22px" />
          <div>
            <div class="org-locked__line">The inner life of {{ org.name }} belongs to its members.</div>
            <div class="org-locked__hint">Membership travels by invitation — a member can send you one through chat, or share a join secret.</div>
          </div>
        </section>

        <template v-else>
          <!-- ══ Decision-making tree ══ -->
          <section class="org-band">
            <div class="org-band__head">
              <q-icon name="account_tree" size="15px" /><span>decision-making tree</span>
              <span class="org-band__count">{{ memberTotal }}</span>
            </div>
            <div class="org-band__tree">
              <OrgMemberTreeNode
                v-for="root in memberTree"
                :key="root.member_id"
                :node="root"
                :acting-id="actingId"
                @switch="wearMaskOf"
              />
            </div>
          </section>

          <div class="org-detail__grid">
            <!-- ══ Sub-organizations ══ -->
            <section class="org-band">
              <div class="org-band__head">
                <q-icon name="lan" size="15px" /><span>sub-organizations</span>
                <span class="org-band__count">{{ subOrgs.length }}</span>
                <q-btn
                  v-if="isAdmin" flat dense size="sm" icon="add" no-caps class="org-band__action"
                  :class="{ 'is-active': subOpen }" title="New sub-organization"
                  @click="subOpen = !subOpen"
                />
              </div>
              <div v-if="subOpen" class="org-form">
                <q-input v-model="subForm.name" dense outlined :dark="false" label="Sub-organization name" />
                <q-select
                  v-model="subForm.leadMaskId" dense outlined :dark="false" emit-value map-options
                  :options="maskOptions" label="Led by (mask)" clearable
                />
                <q-btn
                  unelevated dense no-caps color="primary" icon="lan" label="Create"
                  :loading="subCreating" :disable="!subForm.name.trim()"
                  @click="createSub"
                />
              </div>
              <div v-if="!subOrgs.length" class="org-band__hint">No sub-organizations yet.</div>
              <router-link
                v-for="s in subOrgs" :key="s.id"
                :to="`/organizations/${s.id}`"
                class="org-sub-row"
              >
                <q-icon name="account_tree" size="14px" />
                <span class="org-sub-row__name">{{ s.name }}</span>
                <span class="org-sub-row__count">{{ s.member_count }} member{{ s.member_count === 1 ? '' : 's' }}</span>
              </router-link>
            </section>

            <!-- ══ Rules ══ -->
            <section class="org-band">
              <div class="org-band__head">
                <q-icon name="gavel" size="15px" /><span>rules</span>
                <span class="org-band__count">{{ rules.length }}</span>
              </div>
              <div v-if="!rules.length" class="org-band__hint">No rules chained yet — publish as the org, then chain the post here.</div>
              <!-- Keyed by acting identity too: wearing the mask must
                   REMOUNT the minis (readability changes with the JWT). -->
              <ElementMini v-for="r in rules" :key="actingId + '-' + r" :address="r" />
            </section>
          </div>

          <!-- ══ Resource tree — what members shared to the org ══ -->
          <section class="org-band">
            <div class="org-band__head">
              <q-icon name="inventory_2" size="15px" /><span>resource tree</span>
              <span class="org-band__count">{{ resources.length }}</span>
              <q-btn
                flat dense size="sm" icon="ios_share" no-caps class="org-band__action"
                :class="{ 'is-active': shareOpen }" label="share something"
                @click="shareOpen = !shareOpen"
              />
            </div>
            <div v-if="shareOpen" class="org-form org-form--share">
              <div class="org-band__hint">
                Pick an element you own — it is granted to the organization and every member mask, and lands on the resource tree.
              </div>
              <SlotRefPicker @pick="shareRef" />
              <div v-if="shareMsg" class="org-form__msg">{{ shareMsg }}</div>
            </div>
            <div v-if="!resources.length" class="org-band__hint">Nothing shared yet.</div>
            <ElementMini v-for="r in resources" :key="actingId + '-' + r" :address="r" />
          </section>

          <!-- ══ Invite (admins) ══ -->
          <section v-if="isAdmin" class="org-band">
            <div class="org-band__head">
              <q-icon name="person_add" size="15px" /><span>invite an entity</span>
            </div>
            <div class="org-form org-form--invite">
              <q-input
                v-model="inviteQuery" dense outlined :dark="false" label="Find an entity…"
                @update:model-value="searchInvitees"
              >
                <template #prepend><q-icon name="search" size="14px" /></template>
              </q-input>
              <div v-if="inviteResults.length" class="org-invitees">
                <button
                  v-for="e in inviteResults" :key="e.id" type="button"
                  class="org-invitee" :class="{ 'is-picked': inviteForm.entityId === e.id }"
                  @click="inviteForm.entityId = e.id; invitePicked = e"
                >
                  <q-icon name="person" size="13px" />
                  <span>{{ e.primary }}</span>
                </button>
              </div>
              <q-input v-model="inviteForm.roleTitle" dense outlined :dark="false" label="Role title (data, e.g. “VP of Witchcraft and Propaganda”)" />
              <q-select
                v-model="inviteForm.reportsToMaskId" dense outlined :dark="false" emit-value map-options
                :options="maskOptions" label="Reports to (mask)" clearable
              />
              <q-toggle v-model="inviteForm.admin" dense label="Admin seat" />
              <q-input v-model="inviteForm.message" dense outlined :dark="false" label="Message (rides the invite chat)" />
              <div class="org-panel__actions">
                <q-btn
                  unelevated dense no-caps color="primary" icon="send" label="Send invitation"
                  :loading="inviting" :disable="!inviteForm.entityId"
                  @click="sendInvite"
                />
              </div>
              <div v-if="inviteMsg" class="org-form__msg">{{ inviteMsg }}</div>
            </div>
          </section>
        </template>
      </div>

      <div v-else-if="notFound" class="col-12 col-lg-10">
        <div class="org-locked"><q-icon name="search_off" size="22px" /><div>No such organization.</div></div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { orgService } from 'src/services/org.service'
import { refService } from 'src/services/ref.service'
import OrgMemberTreeNode from 'src/components/organizations/OrgMemberTreeNode.vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import SlotRefPicker from 'src/components/maker/SlotRefPicker.vue'

export default defineComponent({
  name: 'OrgDetailPage',
  components: { OrgMemberTreeNode, ElementMini, SlotRefPicker },
  setup () {
    const $q = useQuasar()
    const route = useRoute()
    const auth = useAuthStore()

    const org = ref(null)
    const access = ref('locked')
    const myMembership = ref(null)
    const notFound = ref(false)

    const memberTree = ref([])
    const memberTotal = ref(0)
    const rules = ref([])
    const resources = ref([])
    const subOrgs = ref([])

    const switching = ref(false)

    const subOpen = ref(false)
    const subCreating = ref(false)
    const subForm = ref({ name: '', leadMaskId: null })

    const shareOpen = ref(false)
    const shareMsg = ref('')

    const inviteQuery = ref('')
    const inviteResults = ref([])
    const invitePicked = ref(null)
    const inviting = ref(false)
    const inviteMsg = ref('')
    const inviteForm = ref({ entityId: null, roleTitle: '', reportsToMaskId: null, admin: false, message: '' })

    const actingId = computed(() => parseInt(auth.user?.entityId ?? auth.user?.id, 10) || null)
    const isAdmin = computed(() => !!myMembership.value?.is_admin)

    // Flat mask list for the reports-to / lead selects.
    const maskOptions = computed(() => {
      const out = []
      const walk = (nodes) => {
        for (const n of nodes || []) {
          if (n.mask) out.push({ label: `${n.mask.display_name}${n.role_title ? ' — ' + n.role_title : ''}`, value: n.mask.id })
          walk(n.children)
        }
      }
      walk(memberTree.value)
      return out
    })

    const load = async () => {
      notFound.value = false
      try {
        const r = await orgService.get(route.params.id)
        if (!r.success) { notFound.value = true; org.value = null; return }
        org.value = r.organization
        access.value = r.access
        myMembership.value = r.my_membership || null
        if (r.access === 'member') {
          const [m, s] = await Promise.all([
            orgService.members(route.params.id),
            orgService.structure(route.params.id)
          ])
          if (m.success) { memberTree.value = m.tree; memberTotal.value = m.total }
          if (s.success) {
            rules.value = s.rules
            resources.value = s.resources
            subOrgs.value = s.sub_organizations
          }
        } else {
          memberTree.value = []
          rules.value = []
          resources.value = []
          subOrgs.value = []
        }
      } catch (_) {
        notFound.value = true
        org.value = null
      }
    }

    const wearMaskOf = async (node) => {
      if (!node.mask) return
      switching.value = true
      try {
        await auth.switchIdentity(node.mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${node.mask.display_name}`, icon: 'theater_comedy' })
        await load()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = false }
    }

    const wearMask = () => wearMaskOf({ mask: myMembership.value?.mask })

    const createSub = async () => {
      subCreating.value = true
      try {
        const r = await orgService.createSubOrganization(route.params.id, {
          name: subForm.value.name.trim(),
          leadMaskId: subForm.value.leadMaskId || undefined
        })
        if (r.success) {
          subOpen.value = false
          subForm.value = { name: '', leadMaskId: null }
          await load()
        } else {
          $q.notify({ type: 'negative', message: r.error?.message || 'creation failed' })
        }
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'creation failed' })
      } finally { subCreating.value = false }
    }

    const shareRef = async (picked) => {
      shareMsg.value = ''
      try {
        const r = await orgService.share(route.params.id, picked.address)
        if (r.success) {
          shareMsg.value = `Shared — granted to ${r.granted_masks.length} mask${r.granted_masks.length === 1 ? '' : 's'}.`
          await load()
        } else {
          shareMsg.value = r.error?.message || 'share failed'
        }
      } catch (e) {
        shareMsg.value = e?.response?.data?.error?.message || e?.message || 'share failed'
      }
    }

    let searchTimer = null
    const searchInvitees = () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(async () => {
        const q = inviteQuery.value.trim()
        if (!q) { inviteResults.value = []; return }
        try {
          const r = await refService.search('entities', q, 6)
          inviteResults.value = r.results || []
        } catch (_) { inviteResults.value = [] }
      }, 250)
    }

    const sendInvite = async () => {
      inviting.value = true
      inviteMsg.value = ''
      try {
        const r = await orgService.invite(route.params.id, {
          entityId: inviteForm.value.entityId,
          role: inviteForm.value.admin ? 'ADMIN' : 'MEMBER',
          roleTitle: inviteForm.value.roleTitle.trim() || undefined,
          reportsToMaskId: inviteForm.value.reportsToMaskId || undefined,
          message: inviteForm.value.message.trim() || undefined
        })
        if (r.success) {
          inviteMsg.value = `Invitation sent${invitePicked.value ? ' to ' + invitePicked.value.primary : ''} — it rides their chat.`
          inviteForm.value = { entityId: null, roleTitle: '', reportsToMaskId: null, admin: false, message: '' }
          inviteQuery.value = ''
          inviteResults.value = []
        } else {
          inviteMsg.value = r.error?.message || 'invite failed'
        }
      } catch (e) {
        inviteMsg.value = e?.response?.data?.error?.message || e?.message || 'invite failed'
      } finally { inviting.value = false }
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      org,
      access,
      myMembership,
      notFound,
      memberTree,
      memberTotal,
      rules,
      resources,
      subOrgs,
      actingId,
      isAdmin,
      maskOptions,
      switching,
      wearMask,
      wearMaskOf,
      subOpen,
      subCreating,
      subForm,
      createSub,
      shareOpen,
      shareMsg,
      shareRef,
      inviteQuery,
      inviteResults,
      invitePicked,
      searchInvitees,
      inviting,
      inviteMsg,
      inviteForm,
      sendInvite
    }
  }
})
</script>

<style lang="scss" scoped>
.org-detail { display: flex; flex-direction: column; gap: 14px; }

.org-detail__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: var(--radius-md, 8px);
  background: var(--paper-card, #ffffff);
}
.org-detail__ident { display: flex; align-items: center; gap: 12px; .q-icon { color: #0b7a8a; } }
.org-detail__name { font-size: 1.25em; margin: 0; color: var(--ink, #1f2a38); }
.org-detail__meta { display: flex; gap: 6px; font-size: 0.74em; color: var(--ink-mute, #8995a8); align-items: baseline; }
.org-detail__entity, .org-detail__parent { color: inherit; text-decoration: none; &:hover { color: #0b7a8a; } }
.org-detail__bio { font-size: 0.84em; color: var(--ink-soft, #45566b); }

.org-detail__seat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8em;
  padding-top: 6px;
  border-top: 1px dashed rgba(var(--ink-rgb), 0.14);
  .q-icon { color: #9b6cb0; }
}
.org-detail__seat-title { font-style: italic; color: var(--coral-deep, #b25e49); }

.org-locked {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px dashed rgba(var(--ink-rgb), 0.25);
  border-radius: var(--radius-md, 8px);
  color: var(--ink-soft, #45566b);
  font-size: 0.88em;
  .q-icon { color: var(--ink-mute, #8995a8); }
}
.org-locked__hint { font-size: 0.82em; color: var(--ink-mute, #8995a8); margin-top: 2px; }

.org-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
}

.org-band {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: var(--radius-md, 8px);
  background: var(--paper-card, #ffffff);
}
.org-band__head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-mute, #8995a8);
  .q-icon { color: #0b7a8a; }
  .org-band__action { margin-left: auto; text-transform: none; letter-spacing: 0; &.is-active { color: #00829c; } }
}
.org-band__count {
  font-size: 0.9em;
  padding: 0 7px;
  border-radius: 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.2);
}
.org-band__hint { font-size: 0.76em; color: var(--ink-mute, #8995a8); line-height: 1.4; }
.org-band__tree { display: flex; flex-direction: column; gap: 2px; }

.org-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: 8px;
  font-size: 0.82em;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { border-color: rgba(#0b7a8a, 0.5); color: #0b7a8a; }
  .q-icon { color: #0b7a8a; }
}
.org-sub-row__name { font-weight: 700; }
.org-sub-row__count { margin-left: auto; font-size: 0.85em; color: var(--ink-mute, #8995a8); }

.org-form { display: flex; flex-direction: column; gap: 8px; }
.org-form__msg { font-size: 0.74em; color: #0b7a8a; text-align: right; }
.org-panel__actions { display: flex; justify-content: flex-end; }

.org-invitees { display: flex; flex-wrap: wrap; gap: 6px; }
.org-invitee {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card, #ffffff);
  font-family: inherit;
  font-size: 0.78em;
  cursor: pointer;
  &:hover { border-color: #0b7a8a; color: #0b7a8a; }
  &.is-picked { border-color: #0b7a8a; background: rgba(#0b7a8a, 0.08); color: #0b7a8a; }
}
</style>
