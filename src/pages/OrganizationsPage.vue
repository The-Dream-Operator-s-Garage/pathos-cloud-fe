<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-lg-10 orgs-page">
        <div class="orgs-page__head">
          <div class="nasalization text-accent orgs-page__title">Organizations</div>
          <q-btn
            flat dense no-caps icon="add_business" label="Found an organization"
            :class="{ 'is-active': createOpen }"
            @click="createOpen = !createOpen"
          />
        </div>

        <!-- ── Found a new organization ── -->
        <section v-if="createOpen" class="org-panel org-panel--form">
          <div class="org-panel__head"><q-icon name="add_business" size="15px" /><span>new organization</span></div>
          <q-input v-model="createForm.name" dense outlined :dark="false" label="Name" maxlength="255" />
          <q-input v-model="createForm.ceoTitle" dense outlined :dark="false" label="Your role title" placeholder="CEO" />
          <q-input v-model="createForm.bio" dense outlined :dark="false" type="textarea" autogrow label="About (optional)" />
          <div class="org-panel__actions">
            <q-btn
              unelevated dense no-caps color="primary" icon="add_business" label="Found it"
              :loading="creating" :disable="!createForm.name.trim()"
              @click="createOrg"
            />
          </div>
          <div v-if="createError" class="org-panel__err">{{ createError }}</div>
        </section>

        <!-- ── Pending invitations ── -->
        <section v-if="invites.length" class="org-panel">
          <div class="org-panel__head"><q-icon name="mail" size="15px" /><span>invitations</span></div>
          <div v-for="inv in invites" :key="inv.id" class="org-invite-row">
            <q-icon name="reduce_capacity" size="15px" />
            <router-link v-if="inv.organization" :to="`/organizations/${inv.organization.id}`" class="org-invite-row__name">
              {{ inv.organization.name }}
            </router-link>
            <span v-if="inv.role_title" class="org-invite-row__role">as “{{ inv.role_title }}”</span>
            <span v-if="inv.inviter" class="org-invite-row__inviter">from {{ inv.inviter.display_name }}</span>
            <span class="org-invite-row__spacer" />
            <q-btn
              unelevated dense no-caps size="sm" color="positive" icon="theater_comedy" label="Accept"
              :loading="answering === inv.id" @click="acceptInvite(inv)"
            />
            <q-btn
              outline dense no-caps size="sm" color="negative" label="Decline"
              :disable="answering === inv.id" @click="declineInvite(inv)"
            />
          </div>
        </section>

        <!-- ── My organizations ── -->
        <section class="org-panel">
          <div class="org-panel__head">
            <q-icon name="reduce_capacity" size="15px" /><span>my organizations</span>
            <q-btn flat dense round size="sm" icon="refresh" class="org-panel__refresh" @click="loadAll" />
          </div>
          <div v-if="!loading && !mine.length" class="org-panel__hint">
            You belong to no organization yet — found one above, or redeem a join secret below.
          </div>
          <div v-for="o in mine" :key="o.member_id" class="org-row">
            <q-icon :name="o.parent ? 'account_tree' : 'reduce_capacity'" size="17px" class="org-row__icon" />
            <div class="org-row__main">
              <router-link :to="`/organizations/${o.id}`" class="org-row__name">{{ o.name }}</router-link>
              <div class="org-row__meta">
                <span v-if="o.parent">sub-org of {{ o.parent.name }} · </span>
                <span v-if="o.role_title" class="org-row__title-txt">{{ o.role_title }}</span>
                <span v-if="o.is_admin" class="org-row__admin">admin</span>
              </div>
            </div>
            <div v-if="o.mask" class="org-row__mask">
              <q-icon name="theater_comedy" size="14px" />
              <span>{{ o.mask.display_name }}</span>
              <q-chip v-if="o.mask.acting" dense size="sm" color="accent" text-color="white">acting</q-chip>
              <q-btn
                v-else
                unelevated dense no-caps size="sm" color="primary" icon="login" label="Put on the mask"
                :loading="switching === o.mask.id"
                @click="wearMask(o.mask)"
              />
            </div>
          </div>
        </section>

        <!-- ── Join with a secret ── -->
        <section class="org-panel org-panel--form">
          <div class="org-panel__head"><q-icon name="key" size="15px" /><span>join with a secret</span></div>
          <div class="org-panel__hint">
            Someone shared an organization join secret with you? Redeem it here — your mask is minted on the spot.
          </div>
          <div class="org-join">
            <q-input v-model="joinSecret" dense outlined :dark="false" class="mono" label="Join secret (hash)" />
            <q-btn
              unelevated dense no-caps color="primary" icon="key" label="Join"
              :loading="joining" :disable="!joinSecret.trim()"
              @click="joinWithSecret"
            />
          </div>
          <div v-if="joinError" class="org-panel__err">{{ joinError }}</div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { orgService } from 'src/services/org.service'

export default defineComponent({
  name: 'OrganizationsPage',
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const auth = useAuthStore()

    const loading = ref(false)
    const mine = ref([])
    const invites = ref([])

    const createOpen = ref(false)
    const creating = ref(false)
    const createError = ref('')
    const createForm = ref({ name: '', ceoTitle: '', bio: '' })

    const joinSecret = ref('')
    const joining = ref(false)
    const joinError = ref('')

    const answering = ref(null)
    const switching = ref(null)

    const loadAll = async () => {
      loading.value = true
      try {
        const [m, i] = await Promise.all([orgService.mine(), orgService.myInvites()])
        if (m.success) mine.value = m.organizations
        if (i.success) invites.value = i.invites
      } catch (_) { /* empty lists */ }
      loading.value = false
    }

    const createOrg = async () => {
      creating.value = true
      createError.value = ''
      try {
        const r = await orgService.create({
          name: createForm.value.name.trim(),
          ceoTitle: createForm.value.ceoTitle.trim() || undefined,
          bio: createForm.value.bio.trim() || undefined
        })
        if (r.success) {
          createOpen.value = false
          createForm.value = { name: '', ceoTitle: '', bio: '' }
          await loadAll()
          router.push(`/organizations/${r.organization.id}`)
        } else {
          createError.value = r.error?.message || 'creation failed'
        }
      } catch (e) {
        createError.value = e?.response?.data?.error?.message || e?.message || 'creation failed'
      } finally { creating.value = false }
    }

    const acceptInvite = async (inv) => {
      answering.value = inv.id
      try {
        const r = await orgService.acceptInvite(inv.id)
        if (r.success) {
          $q.notify({ type: 'positive', message: 'Welcome in — your mask is ready.' })
          await loadAll()
        } else {
          $q.notify({ type: 'negative', message: r.error?.message || 'accept failed' })
        }
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'accept failed' })
      } finally { answering.value = null }
    }

    const declineInvite = async (inv) => {
      answering.value = inv.id
      try {
        await orgService.declineInvite(inv.id)
        await loadAll()
      } catch (_) { /* row stays */ }
      answering.value = null
    }

    const joinWithSecret = async () => {
      joining.value = true
      joinError.value = ''
      try {
        const r = await orgService.join({ secret: joinSecret.value.trim() })
        if (r.success) {
          joinSecret.value = ''
          $q.notify({ type: 'positive', message: 'Joined — your mask is ready.' })
          await loadAll()
        } else {
          joinError.value = r.error?.message || 'join failed'
        }
      } catch (e) {
        joinError.value = e?.response?.data?.error?.message || e?.message || 'join failed'
      } finally { joining.value = false }
    }

    const wearMask = async (mask) => {
      switching.value = mask.id
      try {
        await auth.switchIdentity(mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${mask.display_name}`, icon: 'theater_comedy' })
        await loadAll()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    onMounted(loadAll)

    return {
      loading,
      mine,
      invites,
      createOpen,
      creating,
      createError,
      createForm,
      createOrg,
      joinSecret,
      joining,
      joinError,
      joinWithSecret,
      answering,
      acceptInvite,
      declineInvite,
      switching,
      wearMask,
      loadAll
    }
  }
})
</script>

<style lang="scss" scoped>
.orgs-page { display: flex; flex-direction: column; gap: 14px; }

.orgs-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .q-btn.is-active { color: #00829c; }
}
.orgs-page__title { font-size: 1.1em; }

.org-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: var(--radius-md, 8px);
  background: var(--paper-card, #ffffff);
}
.org-panel--form { gap: 10px; }

.org-panel__head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-mute, #8995a8);
  .q-icon { color: #0b7a8a; }
}
.org-panel__refresh { margin-left: auto; }
.org-panel__hint { font-size: 0.78em; color: var(--ink-mute, #8995a8); line-height: 1.4; }
.org-panel__actions { display: flex; justify-content: flex-end; }
.org-panel__err { font-size: 0.72em; color: var(--q-negative, #c10015); text-align: right; }

.org-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: 8px;
}
.org-row__icon { color: #0b7a8a; }
.org-row__main { min-width: 0; flex: 1; }
.org-row__name {
  font-weight: 700;
  font-size: 0.9em;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { color: #0b7a8a; }
}
.org-row__meta { font-size: 0.72em; color: var(--ink-mute, #8995a8); display: flex; gap: 6px; align-items: baseline; }
.org-row__title-txt { font-style: italic; color: var(--coral-deep, #b25e49); }
.org-row__admin {
  font-size: 0.85em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 6px;
  border-radius: 7px;
  border: 1px solid rgba(#9b6cb0, 0.5);
  color: #9b6cb0;
}
.org-row__mask {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78em;
  .q-icon { color: #9b6cb0; }
}

.org-invite-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px dashed rgba(#0b7a8a, 0.45);
  border-radius: 8px;
  background: rgba(#0b7a8a, 0.04);
  font-size: 0.84em;
  .q-icon { color: #0b7a8a; }
}
.org-invite-row__name { font-weight: 700; color: var(--ink, #1f2a38); text-decoration: none; &:hover { color: #0b7a8a; } }
.org-invite-row__role { font-style: italic; color: var(--coral-deep, #b25e49); font-size: 0.85em; }
.org-invite-row__inviter { font-size: 0.78em; color: var(--ink-mute, #8995a8); }
.org-invite-row__spacer { flex: 1; }

.org-join {
  display: flex;
  gap: 8px;
  align-items: center;
  .q-input { flex: 1; }
}
</style>
