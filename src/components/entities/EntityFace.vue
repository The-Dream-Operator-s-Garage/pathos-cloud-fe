<template>
  <!-- THE ENTITY FACE (2026-09-11, user ask: "a flyout entity viewer …
       designed to hold all the information available when visiting the
       /entities/:id page"). ElementFlyout's element face for an ENTITY
       target: everything the profile page shows, in the window's box —
       the entity card (EntityCard), the origin constellation INLINE
       (OriginSky), the organization panel for an org / the alter-ego
       panel for a person (both self-gating), the anchors column
       (EntityAnchors: minting moment, profile skeleton, and for your own
       profile the wallet / invite / sessions / secrets furniture), then the
       bands: your organizations and polls (own profile only) and the
       contributions (instantiations · posts · content — every list the
       server already filters to what the viewer may read).

       LAYOUT FOLLOWS THE WINDOW, NOT THE VIEWPORT (user ask: "rearranges
       gracefully when changing the flying window size"): the face is a
       size container, and its grid answers the window's width — card and
       side column beside each other past ~700px, stacked under it; the
       contribution band's own container rule does the same for its three
       panels. One scroller for the whole face.

       The `loaded` emit hands the read up to the window so the bar, the
       parked tab and the persisted tray learn the entity's handle, kind
       and address without a second request. -->
  <div class="entity-face" :class="{ 'is-org': isOrg }">
    <div v-if="loading && !entity" class="entity-face__state">
      <q-spinner size="22px" color="primary" />
    </div>

    <div v-else-if="!entity" class="entity-face__state entity-face__state--missing">
      <q-icon name="error_outline" size="34px" />
      <div>Entity not found.</div>
      <div v-if="seed?.display_name" class="entity-face__state-sub">{{ seed.display_name }}</div>
    </div>

    <template v-else>
      <div class="entity-face__grid">
        <div class="entity-face__main">
          <EntityCard
            :entity="entity"
            :moment="moment"
            :labels="labels"
            :decoded="decoded"
            :organization="organization"
            :org-access="orgAccess"
            :seat="isSeat"
          />
        </div>

        <aside class="entity-face__side">
          <!-- The lineage sky, inline — the page keeps it behind a
               button; the window has the room to keep it in view. -->
          <OriginSky inline :entity-id="entity.id" />

          <!-- An org's inner life, or a person's masks (each panel gates
               itself: the org on the server's access verdict, the
               alter-ego panel on the viewer's identity tree). -->
          <EntityOrgPanel
            v-if="isOrg"
            :organization="organization"
            :access="orgAccess"
            @switched="load"
          />
          <AlterEgoPanel v-else :entity-id="entity.id" />

          <EntityAnchors :entity="entity" :moment="moment" />
        </aside>
      </div>

      <!-- Own profile only: memberships with their masks, and the polls
           the viewer decides / raised. -->
      <EntityOrganizations v-if="isSelf" class="entity-face__band" />
      <EntityPolls v-if="isSelf" class="entity-face__band" />

      <!-- What this entity has put into the chain. -->
      <EntityContributions :entity-id="entity.id" class="entity-face__band" />
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { entityService } from 'src/services/entity.service'
import { seatEntityId } from 'src/utils/entityDisplay'

import EntityCard from 'src/components/entities/EntityCard.vue'
import EntityAnchors from 'src/components/entities/EntityAnchors.vue'
import EntityOrgPanel from 'src/components/entities/EntityOrgPanel.vue'
import OriginSky from 'src/components/entities/OriginSky.vue'
import AlterEgoPanel from 'src/components/entities/AlterEgoPanel.vue'
import EntityOrganizations from 'src/components/entities/EntityOrganizations.vue'
import EntityContributions from 'src/components/entities/EntityContributions.vue'
import EntityPolls from 'src/components/entities/EntityPolls.vue'

export default defineComponent({
  name: 'EntityFace',
  components: {
    EntityCard,
    EntityAnchors,
    EntityOrgPanel,
    OriginSky,
    AlterEgoPanel,
    EntityOrganizations,
    EntityContributions,
    EntityPolls
  },
  props: {
    entityId: { type: Number, required: true },
    // What the trigger already knew ({ id, display_name, username, photo }
    // off a feed author, the identity chip's user) — names the not-found
    // state; the card itself waits for the read.
    seed: { type: Object, default: null }
  },
  emits: ['loaded'],
  setup (props, { emit }) {
    const authStore = useAuthStore()

    const entity = ref(null)
    const moment = ref(null)
    const labels = ref([])
    const decoded = ref(null)
    const organization = ref(null)
    const orgAccess = ref(null)
    const loading = ref(true)
    const isSeat = ref(false)

    const isOrg = computed(() => entity.value?.type_id === 3)
    const isSelf = computed(() => !!entity.value && !!authStore.user && authStore.user.id === entity.value.id)

    const load = async () => {
      const id = props.entityId
      loading.value = true
      try {
        const r = await entityService.get(id)
        if (props.entityId !== id) return
        if (r.success) {
          entity.value = r.entity
          moment.value = r.moment || null
          labels.value = r.labels || []
          decoded.value = r.decoded || null
          organization.value = r.organization || null
          orgAccess.value = r.org_access || null
          emit('loaded', {
            entity: r.entity,
            moment: moment.value,
            labels: labels.value,
            decoded: decoded.value,
            organization: organization.value,
            org_access: orgAccess.value
          })
        } else {
          entity.value = null
        }
      } catch (_) {
        if (props.entityId === id) entity.value = null
      }
      loading.value = false
      // The install's Talavero seat — resolved once per session, so the
      // card can name him as the non-human he is.
      seatEntityId().then((sid) => {
        isSeat.value = sid != null && entity.value != null && sid === entity.value.id
      })
    }

    onMounted(load)
    watch(() => props.entityId, () => {
      entity.value = null
      organization.value = null
      orgAccess.value = null
      load()
    })

    return { entity, moment, labels, decoded, organization, orgAccess, loading, isSeat, isOrg, isSelf, load }
  }
})
</script>

<style lang="scss" scoped>
// The face is the window's one scroller and a SIZE CONTAINER named for
// its own rules below. The fact-key column and the two-column grid are
// the two things that answer the width; everything else flows.
.entity-face {
  container-type: inline-size;
  container-name: entity-face;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }
}

.entity-face__state {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 10px;
  font-size: 0.85em;
  color: var(--grey-8, #616161);
  .q-icon { opacity: 0.35; }
}
.entity-face__state-sub { font-size: 0.85em; opacity: 0.7; }

// ONE column by default (a narrow window); the card and the side column
// stand beside each other once the window is wide enough for both — the
// page's 75/25 leaning toward the side column, which carries the sky.
.entity-face__grid {
  --entity-fact-key-w: 104px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.entity-face__main,
.entity-face__side { min-width: 0; }
.entity-face__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@container entity-face (min-width: 700px) {
  .entity-face__grid {
    --entity-fact-key-w: 150px;
    grid-template-columns: minmax(0, 60fr) minmax(0, 40fr);
  }
}

// The alter-ego panel's chrome — the class the page lends it (a scoped
// rule reaches a child component's root), restated for the window.
.side-panel,
:deep(.ego-panel) {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body, #ffffff);
  border: 1px solid var(--panel-rule, #e2e6ed);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 0 0 auto;
}

.entity-face__band { flex: 0 0 auto; }
</style>
