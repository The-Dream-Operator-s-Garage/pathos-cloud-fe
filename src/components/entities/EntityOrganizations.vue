<template>
  <!-- "My organizations" — own-profile band: each membership with its
       MASK (the org alter-ego the entity operates) and the put-on-the-
       mask identity switch. Masks live in the ORG's entity folder, so
       they never appear in the personal alter-ego tree — this band is
       where they surface. -->
  <section v-if="loaded && organizations.length" class="entity-orgs">
    <div class="entity-orgs__head">
      <q-icon name="reduce_capacity" size="15px" />
      <span>My organizations</span>
      <span class="entity-orgs__count">{{ organizations.length }}</span>
      <q-btn flat dense round size="sm" icon="refresh" class="entity-orgs__refresh" @click="load" />
    </div>

    <div class="entity-orgs__grid">
      <div v-for="o in organizations" :key="o.member_id" class="entity-orgs__cell">
        <div class="entity-orgs__org">
          <q-icon :name="o.parent ? 'account_tree' : 'reduce_capacity'" size="15px" />
          <router-link :to="`/organizations/${o.id}`" class="entity-orgs__name">{{ o.name }}</router-link>
          <span v-if="o.is_admin" class="entity-orgs__admin">admin</span>
        </div>
        <div class="entity-orgs__meta">
          <span v-if="o.parent">sub-org of {{ o.parent.name }} · </span>
          <span v-if="o.role_title" class="entity-orgs__title">{{ o.role_title }}</span>
        </div>
        <div v-if="o.mask" class="entity-orgs__mask">
          <q-icon name="theater_comedy" size="14px" />
          <router-link :to="`/entities/${o.mask.id}`" class="entity-orgs__mask-name">
            {{ o.mask.display_name }}
          </router-link>
          <q-chip v-if="o.mask.acting" dense size="sm" color="accent" text-color="white">acting</q-chip>
          <q-btn
            v-else
            unelevated dense no-caps size="sm" color="primary" icon="login" label="Put on the mask"
            :loading="switching === o.mask.id"
            @click="wearMask(o.mask)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { orgService } from 'src/services/org.service'

export default defineComponent({
  name: 'EntityOrganizations',
  setup () {
    const $q = useQuasar()
    const auth = useAuthStore()
    const organizations = ref([])
    const loaded = ref(false)
    const switching = ref(null)

    const load = async () => {
      try {
        const r = await orgService.mine()
        if (r.success) organizations.value = r.organizations
      } catch (_) { /* band hides itself */ }
      loaded.value = true
    }

    const wearMask = async (mask) => {
      switching.value = mask.id
      try {
        await auth.switchIdentity(mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${mask.display_name}`, icon: 'theater_comedy' })
        await load()
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    onMounted(load)
    return { organizations, loaded, switching, load, wearMask }
  }
})
</script>

<style lang="scss" scoped>
.entity-orgs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: var(--radius-md, 8px);
  background: var(--paper-card, #ffffff);
}

.entity-orgs__head {
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
.entity-orgs__count {
  font-size: 0.9em;
  padding: 0 7px;
  border-radius: 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.2);
}
.entity-orgs__refresh { margin-left: auto; }

.entity-orgs__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.entity-orgs__cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  border-radius: 8px;
}
.entity-orgs__org { display: flex; align-items: center; gap: 7px; .q-icon { color: #0b7a8a; } }
.entity-orgs__name {
  font-weight: 700;
  font-size: 0.88em;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { color: #0b7a8a; }
}
.entity-orgs__admin {
  font-size: 0.6em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid rgba(#9b6cb0, 0.5);
  color: #9b6cb0;
}
.entity-orgs__meta { font-size: 0.72em; color: var(--ink-mute, #8995a8); }
.entity-orgs__title { font-style: italic; color: var(--coral-deep, #b25e49); }

.entity-orgs__mask {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78em;
  padding-top: 5px;
  border-top: 1px dashed rgba(var(--ink-rgb), 0.12);
  .q-icon { color: #9b6cb0; }
}
.entity-orgs__mask-name {
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { color: #9b6cb0; }
}
</style>
