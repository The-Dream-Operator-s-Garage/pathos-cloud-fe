<template>
  <q-page class="bg-base entity-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="!entity" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Entity not found.</div>
      </div>

      <div v-else class="entity-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — the entity card. Same .subject-panel chrome as the
             node/path/moment/secret/link viewers so an entity reads as
             a member of the same family of primal types. The card is a
             component since 2026-09-11 (EntityCard) — the entity WINDOW
             mounts the same one; this page pins it to the viewport.
        ══════════════════════════════════════════════════════════ -->
        <div class="entity-main">
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

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — the origin door, the org / alter-ego panel, the
             anchors (+ the self-only account furniture), log out.
        ══════════════════════════════════════════════════════════ -->
        <aside class="entity-side">
          <!-- Origin constellation (2026-07-30): the lineage sky — unravel
               through alter-egos to the root, then down the invitation
               chain to the pioneer. Disclosure-gated server-side; owners
               flip the switch inside the dialog. -->
          <q-btn
            outline no-caps
            icon="hub" label="Origin constellation"
            class="full-width q-mb-sm"
            @click="originOpen = true"
          />
          <OriginTree v-model="originOpen" :entity-id="entity.id" />

          <!-- An org's inner life (member-gated by the server) or the
               sub-entities tree + creation module + internal log-in (the
               alter-ego panel renders itself only when this entity is in
               the viewer's identity tree; org entities skip it — masks are
               managed on the org surfaces, never minted here). -->
          <EntityOrgPanel
            v-if="entity.type_id === 3"
            :organization="organization"
            :access="orgAccess"
            @switched="load"
          />
          <AlterEgoPanel v-else :entity-id="entity.id" />

          <EntityAnchors :entity="entity" :moment="moment" />

          <q-btn
            v-if="isSelf"
            class="logout-btn"
            color="negative"
            unelevated
            size="lg"
            icon="logout"
            label="Log out"
            @click="logout"
          />
        </aside>
      </div>

      <!-- ══ My organizations — own profile only: memberships with their
           masks and the put-on-the-mask switch (orgs feature, 2026-07). ══ -->
      <EntityOrganizations v-if="entity && isSelf" class="entity-orgs-band" />

      <!-- ══ My polls — own profile only: the access asks the viewer
           decides (with reversal) and the ones they raised. ══ -->
      <EntityPolls v-if="entity && isSelf" class="entity-polls" />

      <!-- ══ Bottom band — what this entity has put into the chain:
           its skeleton instantiations, its posts, its uploaded content. ══ -->
      <EntityContributions v-if="entity" :entity-id="entity.id" class="entity-contrib" />

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { entityService } from 'src/services/entity.service'
import { seatEntityId } from 'src/utils/entityDisplay'

import EntityCard from 'src/components/entities/EntityCard.vue'
import EntityAnchors from 'src/components/entities/EntityAnchors.vue'
import EntityOrgPanel from 'src/components/entities/EntityOrgPanel.vue'
import AlterEgoPanel from 'src/components/entities/AlterEgoPanel.vue'
import OriginTree from 'src/components/entities/OriginTree.vue'
import EntityOrganizations from 'src/components/entities/EntityOrganizations.vue'
import EntityContributions from 'src/components/entities/EntityContributions.vue'
import EntityPolls from 'src/components/entities/EntityPolls.vue'

// The entity PAGE — since 2026-09-11 the thin host of the same parts the
// entity WINDOW composes (EntityFace): the card, the anchors, the org /
// alter-ego panel, the bands. The page keeps what only a page has — the
// viewport-tall 75/25 grid, the origin dialog's button, log out — and the
// route. Every entity LINK on the platform now opens the window
// (utils/entityDoor); this page is reached by typed URL, by the trail, and
// by the window's own "open the page" foot button.
export default defineComponent({
  name: 'EntityProfilePage',
  components: {
    EntityCard,
    EntityAnchors,
    EntityOrgPanel,
    AlterEgoPanel,
    OriginTree,
    EntityOrganizations,
    EntityContributions,
    EntityPolls
  },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const entity = ref(null)
    const moment = ref(null)
    const labels = ref([])
    const decoded = ref(null)
    const organization = ref(null)
    const orgAccess = ref(null)
    const loading = ref(true)
    const isSeat = ref(false)
    const originOpen = ref(false)

    const id = computed(() => parseInt(route.params.id))
    const isSelf = computed(() => entity.value && authStore.user && authStore.user.id === entity.value.id)

    const load = async () => {
      loading.value = true
      entity.value = null
      moment.value = null
      labels.value = []
      decoded.value = null
      organization.value = null
      orgAccess.value = null
      try {
        const r = await entityService.get(id.value)
        if (r.success) {
          entity.value = r.entity
          moment.value = r.moment || null
          labels.value = r.labels || []
          decoded.value = r.decoded || null
          organization.value = r.organization || null
          orgAccess.value = r.org_access || null
        }
      } catch (_) { /* leave null */ }
      loading.value = false
      seatEntityId().then((sid) => {
        isSeat.value = sid != null && entity.value != null && sid === entity.value.id
      })
    }

    const logout = () => {
      authStore.logout()
      router.push('/auth')
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      entity,
      moment,
      labels,
      decoded,
      organization,
      orgAccess,
      loading,
      isSelf,
      isSeat,
      originOpen,
      load,
      logout
    }
  }
})
</script>

<style lang="scss" scoped>
// Same layout skeleton as the sibling primal viewers — 75/25 grid +
// subject-panel chrome. The card's height is the page's call: pinned to
// the viewport through the dial EntityCard reads.
.entity-page {
  padding: 16px 10px 0;
}

.entity-contrib {
  margin: 12px 0 16px;
}
.entity-polls {
  margin: 12px 0 0;
}

.entity-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.entity-main {
  min-width: 0;
  --entity-card-h: calc(100vh - 16px - var(--nav-footer-h));
}

.entity-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
}
// The alter-ego panel's chrome (a scoped rule reaches a child
// component's root — AlterEgoPanel wears `side-panel` for exactly this).
.side-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body, #ffffff);
  border: 1px solid var(--panel-rule, #e2e6ed);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 1 1 0;
}

@media (max-width: 1023px) {
  .entity-grid { grid-template-columns: minmax(0, 1fr); }
  .entity-main { --entity-card-h: auto; }
  .entity-side { height: auto; max-height: none; }
  .side-panel { flex: 0 0 auto; }
}

// ── Log out — big, unmissable, below the anchors panel ──
.logout-btn {
  flex: 0 0 auto;
  width: 100%;
}
</style>
