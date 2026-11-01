<!--
  THE IDENTITY WINDOW (2026-08-31, user ask) — the left drawer's
  profile/organizations features, bundled into an expandable window rising
  from the footer bar's LEFT end, exactly over the IdentityChip that opens
  it (the platform's a-window-rides-its-button doctrine, mirrored to the
  bar's other corner: the creation docks rise over their chips at the right
  half, this one rises over the identity section's seat).

  CHROME: the dock family's — the shared `--plaque-coat` sheet (NO coat of
  its own: a colorway is its lines, wells and ink, never its sheet — the
  dock-coat witness's law), the `.dock-bar` header row with a traffic
  light, a rising cast, a rounded free corner.

  ⭐ 2026-09-11 (user ask: "apply to it the same aesthetic and inner frieze
  bar as the dashboard window so they look consistent instead of the
  identity window being orange") — THE ORANGE MAP IS RETIRED. For eleven
  days this window was the one QUASAR ORANGE surface on the platform
  (orange-3 hairlines, orange-1/-2 wells, orange-10 ink, orange-8
  contrast); it now wears the FLYOUT FAMILY's chrome, the same five
  `--dock-*` values `.dock-window--dashboard` declares — `--grey-4` lines
  and wells, `--grey-5` strong edge, brown-8 / brown-4 head ink — plus the
  family's two named pieces the board also carries: the `slim` FriezeBar on
  its `--grey-9` base (`.flyout-window__frieze`) between the head and the
  body, and the two-tone BEVEL on the wells (grey-5 on the lit walls,
  brown-1 where the floor climbs back). The dials are the seam, not a
  repaint: the same one chat used to go lime and the board used to go grey,
  so the two windows the footer bar's two ends open are now one family seen
  twice. The COAT never moved — it was `--plaque-coat` before and after,
  which is why this is a colorway change and not a coat one.

  ⚠ The `--orange-*` ramp itself STAYS MINTED in _tokens.scss (§ THE
  IDENTITY WINDOW'S ORANGE MAP): nothing else reads it today, but it is a
  hand-declared family (the file never imports Quasar's palette) and
  deleting it is a separate, reversible decision from wearing it.

  CONTENT, top to bottom:
    · the PROFILE CARD — face, name, @handle (the drawer block's facts at
      window scale) + the two actions that lived with them: Profile and
      Log out.
    · the ACTING band — while wearing a mask: which org, which title, and
      the way back to yourself.
    · ORGANIZATIONS — every membership with its role title, admin state and
      the put-on-the-mask identity switch (EntityOrganizations' seam, worn
      here); the All-organizations link is the drawer item's successor.
    · DELEGATED READS (2026-10-31, docs/plans/entity-storage.md S3 /
      docs/concepts/access.md § Delegated reads) — between ORGANIZATIONS
      and BADGES, where the plan seats the Storage well: the acting seat's
      live `entity_delegation` records. GIVEN = who may read everything
      this seat may read (an alter-ego lists its root from its mint; a
      mask lists its org, LOCKED with the org's name while the policy
      mandates it) each with a revoke; RECEIVED = whose reads this seat
      holds (a root lists its alter-egos) each with a drop. SEAT-STRICT
      like the API: put on a mask and both lists change.
    · BADGES — the wardrobe: each org-given role title with a visibility
      toggle; shown badges ride the bar chip so the authority an org
      granted can be pointed at.
-->
<template>
  <transition name="dock-slide">
    <section
      v-if="identity.isOpen"
      class="identity-dock dock-window"
      :data-dock-key="'identity'"
      :style="{ zIndex: windows.zOf('identity'), ...windows.winDragStyle('identity') }"
    >
      <header class="dock-bar">
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close" @click="identity.close()">
            <q-icon name="close" />
          </button>
        </div>
        <q-icon name="person" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Identity</span>
        <q-space />
        <span class="dock-bar__meta mono">{{ handle }}</span>
      </header>

      <!-- THE FLYOUT FAMILY'S BAND (2026-09-11) — the dashboard window's
           piece, mounted at the same station: between the head and what the
           window holds. `slim` (half height, one wave) on the family's
           `--grey-9` base through `.flyout-window__frieze`, so the motif
           inverts and the brown waves read as the light ON a dark strip —
           the one carved, one dark thing in the box, at both ends of the
           bar now. -->
      <FriezeBar slim class="flyout-window__frieze" />

      <div class="identity-dock__body">
        <!-- ── The profile card ─────────────────────────────── -->
        <div class="identity-dock__card">
          <EntityAvatar :entity="user" :size="40" />
          <div class="identity-dock__who">
            <span class="identity-dock__name">{{ name }}</span>
            <span class="identity-dock__handle mono">{{ handle }}</span>
          </div>
          <div class="identity-dock__actions">
            <button type="button" class="identity-dock__btn" title="Open your profile" @click="goToProfile">
              <q-icon name="badge" size="13px" />
              <span>Profile</span>
            </button>
            <button type="button" class="identity-dock__btn identity-dock__btn--quiet" title="Log out" @click="handleLogout">
              <q-icon name="logout" size="13px" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        <!-- ── Acting-as — only while a mask is on ──────────── -->
        <div v-if="isAlterEgo" class="identity-dock__acting">
          <q-icon name="theater_comedy" size="15px" />
          <div class="identity-dock__acting-text">
            <span class="identity-dock__acting-line">
              Wearing a mask
              <template v-if="identity.actingOrg"> — in <b>{{ identity.actingOrg.name }}</b></template>
            </span>
            <span v-if="identity.actingOrg?.role_title" class="identity-dock__acting-title">
              {{ identity.actingOrg.role_title }}
            </span>
          </div>
          <button type="button" class="identity-dock__btn" :disabled="switching !== null" @click="takeOffMask">
            <q-icon name="logout" size="13px" />
            <span>Take it off</span>
          </button>
        </div>

        <!-- ── Organizations ────────────────────────────────── -->
        <div class="identity-dock__well">
          <div class="identity-dock__well-head nasalization">
            <q-icon name="reduce_capacity" size="13px" />
            <span>Organizations</span>
            <span v-if="identity.organizations.length" class="identity-dock__count mono">{{ identity.organizations.length }}</span>
            <button type="button" class="identity-dock__refresh" title="Refresh" @click="identity.load(true)">
              <q-icon name="refresh" size="12px" />
            </button>
          </div>

          <div v-if="identity.loading && !identity.organizations.length" class="identity-dock__empty">
            <q-spinner size="14px" />
          </div>
          <div v-else-if="!identity.organizations.length" class="identity-dock__empty">
            No organizations yet.
          </div>

          <div v-for="o in identity.organizations" :key="o.member_id" class="identity-dock__org">
            <div class="identity-dock__org-head">
              <OrgLogoChip :org="{ id: o.id, name: o.name, logo: o.logo }" :size="16" :link="false" />
              <a class="identity-dock__org-name" href="#" @click.prevent="goToOrg(o)">{{ o.name }}</a>
              <span v-if="o.is_admin" class="identity-dock__admin">admin</span>
              <span v-if="o.role_title" class="identity-dock__role">{{ o.role_title }}</span>
            </div>
            <div v-if="o.mask" class="identity-dock__org-mask">
              <q-icon name="theater_comedy" size="12px" />
              <span class="identity-dock__mask-name">{{ o.mask.display_name }}</span>
              <span v-if="o.mask.acting" class="identity-dock__acting-chip">acting</span>
              <button
                v-else
                type="button"
                class="identity-dock__btn identity-dock__btn--tiny"
                :disabled="switching !== null"
                @click="wearMask(o.mask)"
              >
                <q-spinner v-if="switching === o.mask.id" size="10px" />
                <q-icon v-else name="login" size="11px" />
                <span>Put on the mask</span>
              </button>
            </div>
          </div>

          <button type="button" class="identity-dock__all" @click="goToOrgs">
            All organizations
            <q-icon name="arrow_forward" size="12px" />
          </button>
        </div>

        <!-- ── Storage — where this identity's bytes live, and who reads them ──
             THE STORAGE WELL (plan S4, 2026-11-01 — docs/concepts/storage.md
             § Who stores): the S3 Delegated reads well GROWN, not a fourth
             well (the handoff's instruction). Top: the backend line (this
             server / Google Drive + mode + the linked account), the
             inherited-from line while an identity stores where its root
             stores, the usage line (elements · segments · bytes, Drive's
             quota when linked), the org lock when ORG_STORAGE_POLICY says
             BACKEND_LOCKED, and the acts — Link Google Drive / Sync now ·
             Unlink. Below, under its own sub-head: the delegated reads
             exactly as S3 drew them. `data-testid="identity-delegations"`
             stays on the whole well (flow-delegation reads its text). -->
        <div class="identity-dock__well identity-dock__well--storage" data-testid="identity-delegations">
          <div class="identity-dock__well-head nasalization">
            <q-icon :name="storage?.google?.linked ? 'cloud' : 'dns'" size="13px" />
            <span>Storage</span>
            <span v-if="storage" class="identity-dock__count mono" data-testid="identity-storage-backend">{{ storage.google?.linked ? 'drive · ' + storage.mode : 'this server' }}</span>
            <button type="button" class="identity-dock__refresh" title="Refresh" @click="identity.loadStorage(); identity.loadDelegations()">
              <q-icon name="refresh" size="12px" />
            </button>
          </div>

          <div class="identity-dock__storage" data-testid="identity-storage">
            <div v-if="!storage" class="identity-dock__empty">Reading where your bytes live…</div>
            <template v-else>
              <div class="identity-dock__storage-row">
                <q-icon :name="storage.google.linked ? 'add_to_drive' : 'dns'" size="18px" class="identity-dock__storage-glyph" />
                <div class="identity-dock__storage-text">
                  <span class="identity-dock__storage-line" data-testid="identity-storage-line">
                    <template v-if="storage.google.linked">
                      Stored on <b>Google Drive</b> · {{ storage.mode }}<template v-if="storage.google.email"> · <span class="mono">{{ storage.google.email }}</span></template>
                    </template>
                    <template v-else>
                      Stored on <b>this server</b><template v-if="storage.packed"> · packed</template>
                    </template>
                  </span>
                  <span v-if="storage.source === 'inherited' && storage.inherited_from" class="identity-dock__storage-meta" data-testid="identity-storage-inherited">
                    stored where <b>{{ whoName(storage.inherited_from) }}</b> stores<template v-if="storage.can_link"> — link below to choose for this identity</template>
                  </span>
                  <span v-else-if="storage.google.linked && storage.google.own" class="identity-dock__storage-meta mono">
                    {{ storage.google.state === 'ok' ? 'mirror' : storage.google.state }}<template v-if="storage.google.last_sync_at"> · synced {{ ago(storage.google.last_sync_at) }}</template><template v-else> · not synced yet</template>
                  </span>
                </div>
              </div>

              <!-- the quota line: what this tree weighs here, and on Drive when linked -->
              <div class="identity-dock__storage-usage mono" data-testid="identity-storage-usage">
                {{ fmtInt(storage.usage.elements) }} elements · {{ storage.usage.segments }} segment{{ storage.usage.segments === 1 ? '' : 's' }} · {{ fmtBytes(storage.usage.pack_bytes) }} on this server<template v-if="storage.usage.plain_files"> · {{ fmtInt(storage.usage.plain_files) }} plain files</template>
                <template v-if="storage.google.quota?.reachable"> · Drive {{ fmtBytes(storage.google.quota.usage) }}<template v-if="storage.google.quota.limit"> of {{ fmtBytes(storage.google.quota.limit) }}</template></template>
                <template v-else-if="storage.google.linked && storage.google.own && storage.google.quota"> · Drive unreachable</template>
              </div>
              <div v-if="quotaPct !== null" class="identity-dock__bar" :title="quotaPct + '% of the Google account used'">
                <div class="identity-dock__bar-fill" :style="{ width: quotaPct + '%' }" />
              </div>

              <div v-if="storage.policy?.BACKEND_LOCKED === 'yes'" class="identity-dock__storage-lock" data-testid="identity-storage-lock">
                <q-icon name="lock" size="11px" />
                <span>{{ storage.policy.org?.name || 'the organization' }} chooses where its masks store</span>
              </div>

              <div class="identity-dock__storage-acts">
                <button
                  v-if="!storage.google.own && storage.can_link"
                  type="button"
                  class="identity-dock__btn"
                  data-testid="identity-storage-link"
                  :disabled="storageBusy !== null"
                  title="Link a Google account: your tree mirrors to one folder in its Drive, and you may sign in with it"
                  @click="linkGoogle"
                >
                  <q-spinner v-if="storageBusy === 'link'" size="11px" />
                  <q-icon v-else name="add_to_drive" size="13px" />
                  <span>Link Google Drive</span>
                </button>
                <template v-else-if="storage.google.own">
                  <button type="button" class="identity-dock__btn identity-dock__btn--tiny" data-testid="identity-storage-sync" :disabled="storageBusy !== null" title="Upload every changed segment to your Drive now" @click="syncStorage">
                    <q-spinner v-if="storageBusy === 'sync'" size="10px" />
                    <q-icon v-else name="sync" size="11px" />
                    <span>Sync now</span>
                  </button>
                  <button
                    v-if="storage.policy?.BACKEND_LOCKED !== 'yes'"
                    type="button"
                    class="identity-dock__btn identity-dock__btn--tiny identity-dock__btn--quiet"
                    data-testid="identity-storage-unlink"
                    :disabled="storageBusy !== null"
                    title="Unlink: revoke our access at Google, store on this server again, close the Google sign-in door"
                    @click="unlinkGoogle"
                  >
                    <q-spinner v-if="storageBusy === 'unlink'" size="10px" />
                    <q-icon v-else name="link_off" size="11px" />
                    <span>Unlink</span>
                  </button>
                </template>
                <span v-else-if="!storage.configured" class="identity-dock__storage-meta" data-testid="identity-storage-unconfigured">Google sign-in is not configured on this server</span>
              </div>

              <div v-if="storage.login?.google_linked" class="identity-dock__storage-meta" data-testid="identity-storage-login">
                <q-icon name="login" size="11px" /> You can also sign in with Google<template v-if="storage.login.google_email"> as <span class="mono">{{ storage.login.google_email }}</span></template>.
              </div>

              <div class="identity-dock__hint">
                Your tree is sealed per record; a linked Drive holds the same
                segments as this server (mirror). Recently read segments may be
                cached on the server for up to an hour.
              </div>
            </template>
          </div>

          <!-- ── Delegated reads — who reads everything I own (S3) ──── -->
          <div class="identity-dock__deleg-head nasalization" data-testid="identity-delegations-head">
            <q-icon name="key" size="12px" />
            <span>Delegated reads</span>
            <span v-if="identity.delegations.given.length" class="identity-dock__count mono">{{ identity.delegations.given.length }}</span>
          </div>

          <div class="identity-dock__deleg-sub">Who can read everything you own</div>
          <div v-if="!identity.delegations.given.length" class="identity-dock__empty">
            Nobody — your reads are yours alone.
          </div>
          <div
            v-for="d in identity.delegations.given"
            :key="'g' + d.id"
            class="identity-dock__deleg identity-dock__deleg--given"
            :class="{ 'is-mandated': !d.revocable }"
          >
            <EntityAvatar :entity="d.grantee" :size="22" />
            <div class="identity-dock__deleg-who">
              <span class="identity-dock__deleg-name">{{ whoName(d.grantee) }}</span>
              <span class="identity-dock__deleg-meta mono">
                {{ d.kinds || 'everything' }}<template v-if="d.moment?.human"> · since {{ d.moment.human }}</template>
              </span>
            </div>
            <span
              v-if="!d.revocable"
              class="identity-dock__deleg-lock"
              :title="'Mandated by ' + (d.mandated_by_org?.name || 'the organization') + ' — not revocable while you are a member'"
            >
              <q-icon name="lock" size="11px" />
              <span>{{ d.mandated_by_org?.name || 'mandated' }}</span>
            </span>
            <button
              v-else
              type="button"
              class="identity-dock__btn identity-dock__btn--tiny identity-dock__deleg-revoke"
              :disabled="revoking !== null"
              title="Stop this entity reading what you own"
              @click="revokeDelegation(d)"
            >
              <q-spinner v-if="revoking === d.id" size="10px" />
              <q-icon v-else name="key_off" size="11px" />
              <span>Revoke</span>
            </button>
          </div>

          <template v-if="identity.delegations.received.length">
            <div class="identity-dock__deleg-sub">Reads you hold</div>
            <div
              v-for="d in identity.delegations.received"
              :key="'r' + d.id"
              class="identity-dock__deleg identity-dock__deleg--received"
            >
              <EntityAvatar :entity="d.grantor" :size="22" />
              <div class="identity-dock__deleg-who">
                <span class="identity-dock__deleg-name">{{ whoName(d.grantor) }}</span>
                <span class="identity-dock__deleg-meta mono">
                  {{ d.kinds || 'everything' }}<template v-if="d.moment?.human"> · since {{ d.moment.human }}</template>
                </span>
              </div>
              <button
                type="button"
                class="identity-dock__btn identity-dock__btn--tiny identity-dock__deleg-drop"
                :disabled="revoking !== null"
                title="Stop reading through this delegation"
                @click="revokeDelegation(d)"
              >
                <q-spinner v-if="revoking === d.id" size="10px" />
                <q-icon v-else name="key_off" size="11px" />
                <span>Drop</span>
              </button>
            </div>
          </template>

          <div class="identity-dock__hint">
            A delegation is one revocable record, never a copy: whoever holds
            it reads what you may read, and nothing else — they cannot post,
            grant or edit as you.
          </div>
        </div>

        <!-- ── Badges — the wardrobe ────────────────────────── -->
        <div class="identity-dock__well">
          <div class="identity-dock__well-head nasalization">
            <q-icon name="military_tech" size="13px" />
            <span>Badges</span>
            <span v-if="identity.badges.length" class="identity-dock__count mono">{{ identity.badges.length }}</span>
          </div>

          <div v-if="!identity.badges.length" class="identity-dock__empty">
            No badges yet — organizations grant them as role titles.
          </div>

          <div v-for="b in identity.badges" :key="b.id" class="identity-dock__badge-row">
            <span class="identity-dock__badge" :class="{ 'is-shown': b.shown }">
              <OrgLogoChip :org="b.org" :size="12" :link="false" />
              <!-- An untitled seat still names its role (2026-09-22 PM: every
                   seat is a badge now — the glyph on the chip says which). -->
              <span class="identity-dock__badge-title">{{ b.title || (b.is_admin ? 'Admin' : 'Member') }}</span>
              <span class="identity-dock__badge-org">· {{ b.org.name }}</span>
            </span>
            <button
              type="button"
              class="identity-dock__eye"
              :class="{ 'is-on': b.shown }"
              :title="b.shown ? 'Worn on your identity chip — click to hide' : 'Hidden — click to wear it on your identity chip'"
              @click="identity.toggleBadge(b.id)"
            >
              <q-icon :name="b.shown ? 'visibility' : 'visibility_off'" size="13px" />
            </button>
          </div>

          <div v-if="identity.badges.length" class="identity-dock__hint">
            Shown badges ride your identity chip on the bar (desktop) — the
            seats your organizations gave you, worn unless you hide them.
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useIdentityStore } from 'src/stores/identity'
import { useWindowsStore } from 'src/stores/windows'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

export default defineComponent({
  name: 'IdentityDock',
  components: { EntityAvatar, OrgLogoChip, FriezeBar },
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const auth = useAuthStore()
    const identity = useIdentityStore()
    const windows = useWindowsStore()
    const flyouts = useFlyoutViewersStore()
    const switching = ref(null)
    const revoking = ref(null)

    const storageBusy = ref(null)

    const user = computed(() => auth.user)
    const isAlterEgo = computed(() => auth.isActingAsAlterEgo)
    // STORAGE (S4): the well reads the store's facts; the acts below move
    // them on the server's word.
    const storage = computed(() => identity.storage)
    const quotaPct = computed(() => {
      const q = storage.value?.google?.quota
      if (!q || !q.reachable || !q.limit || q.usage == null) return null
      return Math.min(100, Math.round((q.usage / q.limit) * 1000) / 10)
    })
    const fmtInt = (n) => (Number(n) || 0).toLocaleString('en-US')
    const fmtBytes = (n) => {
      const b = Number(n) || 0
      if (b < 1024) return b + ' B'
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
      if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB'
      return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    }
    const ago = (iso) => {
      const ms = Date.now() - new Date(iso).getTime()
      if (!Number.isFinite(ms) || ms < 0) return 'just now'
      const m = Math.round(ms / 60000)
      if (m < 1) return 'just now'
      if (m < 60) return m + ' min ago'
      const h = Math.round(m / 60)
      if (h < 48) return h + ' h ago'
      return Math.round(h / 24) + ' d ago'
    }
    const name = computed(() =>
      auth.user?.display_name || auth.user?.username || `entity #${auth.user?.id}`)
    const handle = computed(() =>
      auth.user?.username ? `@${auth.user.username}` : `entity #${auth.user?.id}`)

    // Navigations close the window first so the destination lands in full
    // view — the same row-activate-parks bargain the side widgets strike.
    // PROFILE opens the entity WINDOW since 2026-09-11 (user ask: the
    // entity flyout "whenever we click on an entity … from the entity
    // window"): the one entity door on the platform that was a
    // programmatic push rather than a link, hand-wired to the same store
    // the link door feeds — seeded with the user the chip already draws,
    // so the window opens lettered.
    const goToProfile = () => {
      const u = auth.user
      identity.close()
      if (u?.id) flyouts.spawnEntity({ id: u.id, username: u.username, display_name: u.display_name, photo: u.photo })
    }
    const goToOrg = (o) => {
      identity.close()
      router.push('/organizations/' + o.id)
    }
    const goToOrgs = () => {
      identity.close()
      router.push('/organizations')
    }

    // Logout followed the section out of the drawer: an action belongs with
    // the identity it ends.
    const handleLogout = () => {
      identity.close()
      auth.logout()
      router.push('/auth')
    }

    // The put-on-the-mask switch — EntityOrganizations' seam, worn here.
    // A switch re-issues the JWT; the store reload moves the acting flag.
    const wearMask = async (mask) => {
      switching.value = mask.id
      try {
        await auth.switchIdentity(mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${mask.display_name}`, icon: 'theater_comedy' })
        await identity.load(true)
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    const takeOffMask = async () => {
      switching.value = 'root'
      try {
        await auth.switchIdentity(auth.rootEntityId)
        $q.notify({ type: 'positive', message: 'Back to yourself', icon: 'person' })
        await identity.load(true)
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    // THE GOOGLE LINK (S4): the consent page is a navigation away — the
    // dance returns to /#/feed?gticket=…, which MainLayout redeems and then
    // reopens this window on the new facts.
    const linkGoogle = async () => {
      storageBusy.value = 'link'
      try {
        const r = await identity.linkGoogle()
        if (!r.success) $q.notify({ type: 'negative', message: r.error?.message || 'could not start the Google link' })
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'could not start the Google link' })
      } finally { storageBusy.value = null }
    }
    const unlinkGoogle = async () => {
      storageBusy.value = 'unlink'
      try {
        const r = await identity.unlinkGoogle()
        if (r.success) $q.notify({ type: 'positive', message: 'Google Drive unlinked — stored on this server again', icon: 'link_off' })
        else $q.notify({ type: 'negative', message: r.error?.message || 'unlink failed' })
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'unlink failed' })
      } finally { storageBusy.value = null }
    }
    const syncStorage = async () => {
      storageBusy.value = 'sync'
      try {
        const r = await identity.syncStorage()
        if (r.success) $q.notify({ type: 'positive', message: `Synced: ${r.uploaded} uploaded · ${r.updated} updated · ${r.unchanged} unchanged${r.failed?.length ? ' · ' + r.failed.length + ' failed' : ''}`, icon: 'sync' })
        else $q.notify({ type: 'negative', message: r.error?.message || 'sync failed' })
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'sync failed' })
      } finally { storageBusy.value = null }
    }

    // DELEGATED READS (S3): the row leaves on the server's word; a mandated
    // record answers 403 code 40330 and the window says whose rule it is.
    const whoName = (c) => c?.display_name || c?.username || ('entity #' + (c?.id ?? '?'))
    const revokeDelegation = async (d) => {
      revoking.value = d.id
      try {
        const r = await identity.revokeDelegation(d.id)
        if (r.success) $q.notify({ type: 'positive', message: 'Delegation revoked', icon: 'key_off' })
        else $q.notify({ type: 'negative', message: r.error?.message || 'revoke failed' })
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'revoke failed' })
      } finally { revoking.value = null }
    }

    return {
      identity,
      windows,
      switching,
      revoking,
      storageBusy,
      storage,
      quotaPct,
      fmtInt,
      fmtBytes,
      ago,
      linkGoogle,
      unlinkGoogle,
      syncStorage,
      whoName,
      revokeDelegation,
      user,
      isAlterEgo,
      name,
      handle,
      goToProfile,
      goToOrg,
      goToOrgs,
      handleLogout,
      wearMask,
      takeOffMask
    }
  }
})
</script>

<style lang="scss" scoped>
// The window's own geometry: rising from the identity section's seat at the
// bar's LEFT end (the .dock-window base supplies position: fixed + the flex
// column). Bottom welded to the bar, left flush at the screen edge — so the
// one free corner is the top-RIGHT, which takes the dock radius; casts rise
// and reach RIGHT (the stack panel's mirrored-at-this-corner pair). The
// shared coat, the FLYOUT FAMILY's lines.
.identity-dock {
  // ⭐ THE COLORWAY (2026-09-11, user ask: "the same aesthetic … as the
  // dashboard window … instead of the identity window being orange") — the
  // five values `.dock-window--dashboard` declares, restated here rather than
  // shared through that class because that class is also a GEOMETRY (right-
  // edge join, edit mode, the maximize footprint) and this window rises at
  // the opposite corner. The dials are the house seam for exactly this: chat
  // went lime through them, the board went grey, the post window blue-grey —
  // a window in another colorway is a handful of properties on its root and
  // nothing else.
  // ⚠ `--dock-coat` IS NOT AMONG THEM and must not be added: the sheet comes
  // from `--plaque-coat` below (`background`), and `fsck --static`'s
  // `dock-coat` witness fails on an unsanctioned second declaration. A
  // colorway is its lines, wells and ink — never its sheet.
  --dock-well: var(--grey-4);
  --dock-rule: var(--grey-4);
  --dock-rule-strong: var(--grey-5);
  --dock-ink: var(--brown-8);
  --dock-ink-mute: var(--brown-4);

  left: 0;
  right: auto;
  bottom: var(--nav-footer-h);
  width: min(420px, 100vw);
  height: auto;
  max-height: calc(100vh - var(--top-chrome-h, var(--media-tabs-h, 0px)) - var(--nav-footer-h) - 14px);
  // ⭐ THE VEIL (2026-09-22 PM4, user ask: the labels window's "red veil over
  // the cream color" applied here) — `--identity-coat`: the same light-cream
  // sheet the bar and the docks wear, under the ENTITY family's pale
  // (blue-grey-1) at 40% instead of the bar's grey-3 — the creation docks'
  // recipe (`--labels-coat`, `--maker-coat`…) in this window's family. A
  // layer list, legal only in `background`; the sheet underneath is still
  // `--light-cream`, so "colorway is lines/wells/ink, never the sheet"
  // holds — the veil is a wash on the sheet, not another sheet. (Was
  // `--plaque-coat`, the bar's own list, 2026-09-11 → this pass.)
  background: var(--plaque-coat); // ⭐ 2026-10-12: the dashboard's sheet (was `--identity-coat`)
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid var(--dock-rule-strong);
  border-left: none;
  border-bottom: none;
  border-top-left-radius: 0;
  border-top-right-radius: var(--radius-md);
  // ⭐ the head-bar drag (2026-10-12, utils/dockDrag.js; sideways only 10-31)
  translate: var(--win-dx, 0px) 0;
  box-shadow:
    0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
    5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
}

// The header row on the shared coat, ruled and inked in the family's dials —
// `--dock-rule` under it, `--dock-ink` on the glyph and title, `--dock-ink-mute`
// on the meta. The same three the board's head wears at the bar's other end.
// ⭐ THE HEAD IS THE BODY'S COAT (2026-09-22 PM4d, user ask: "paint the
// header with the same color as the body of the window"; PM4c had it
// blue-grey-9 for one commit): `--identity-head` = `--identity-coat`, the
// veil over the cream — one material from the head to the floor — with the
// entity family's INK on the glyph and title and its ACCENT on the meta so
// the words read on the light coat and tie to the slate frieze under them.
// The rule under the head is the FRIEZE's floor (-10), so head → frieze
// reads as a light band then a dark one cut into it. The board's three head
// dials (`--dock-rule` / `--dock-ink` / `--dock-ink-mute`) still dress the
// BODY — the wells' rules and the section titles.
// ⭐ THE DASHBOARD'S HEAD AND FRIEZE (2026-10-12, user ask: "recolor the
// author and chat windows under the same color pallette as the general
// dashboard window"): the head on the window's own plaque with the
// `--grey-4` underline, the brown dial inks; the slim frieze back on
// `.flyout-window__frieze`'s `--grey-9` plate with FriezeBar's default
// waves. The blue-grey `--identity-head*` / `--identity-frieze*` recipe of
// 2026-09-22 PM4c/d is in git (the tokens stay minted, unworn here).
.identity-dock .dock-bar {
  background: var(--plaque-coat);
  border-bottom: 1px solid var(--dock-rule);
}

.identity-dock .dock-bar__icon,
.identity-dock .dock-bar__title { color: var(--dock-ink); }
.identity-dock .dock-bar__meta { color: var(--dock-ink-mute); text-transform: none; }

.identity-dock__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;

  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--dock-rule); border-radius: 999px; }
}

// ── The profile card ─────────────────────────────────────────
.identity-dock__card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-md);
}

.identity-dock__who {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__name {
  font-size: 0.92em;
  font-weight: 700;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__handle {
  font-size: 0.72em;
  color: rgba(66, 66, 66, 0.62);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 0 0 auto;
}

// The window's one button skin: a pale face (`--grey-2`, a step above the
// coat rather than the sunk `--dock-well` a floor takes), the family's strong
// rim and its ink; the quiet variant mutes further still (logout is an
// action, not a destination — the drawer's own register for it, and the one
// place in this window that was already grey while the rest was orange).
.identity-dock__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--dock-rule-strong);
  border-radius: var(--radius-sm, 6px);
  background: var(--grey-2);
  color: var(--dock-ink);
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: var(--grey-3); }
  &:disabled { opacity: 0.5; cursor: default; }

  &--quiet {
    border-color: rgba(66, 66, 66, 0.25);
    background: transparent;
    color: rgba(66, 66, 66, 0.72);
    &:hover:not(:disabled) { background: rgba(66, 66, 66, 0.06); color: var(--grey-9); }
  }

  &--tiny {
    padding: 1px 7px;
    font-size: 0.64em;
  }
}

// ── Acting-as band ───────────────────────────────────────────
.identity-dock__acting {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  background: var(--grey-3);
  border: 1px solid var(--dock-rule-strong);
  border-radius: var(--radius-md);
  color: var(--dock-ink);

  .q-icon { color: var(--dock-ink); }
}

.identity-dock__acting-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__acting-line { font-size: 0.76em; }
.identity-dock__acting-title { font-size: 0.68em; font-style: italic; opacity: 0.85; }

// ── Wells: organizations + badges ────────────────────────────
// ⭐ 2026-09-11 — THE DASHBOARD WINDOW'S WELL, not a tinted box. The board's
// `.flyout-window__well` recipe stated at this window's scale: `--dock-well`
// sunk one step under the coat so it is a floor CUT INTO the box rather than
// a region drawn on it, and the two-tone BEVEL that draws the cut —
// `--grey-5` on the top and left (the two walls a top-left light cannot
// reach), `--brown-1` on the bottom and right (lighter, where the floor
// climbs back to the plaque). The lit pair is warm on purpose: brown-1 is the
// side widgets' plaque coat at this plaque's own lightness, so the lip
// changes HUE and nothing else. Not the class itself — that one is `flex: 1`
// and margin-bounded for a single full-height well; these two are stacked
// blocks in a scrolling body.
.identity-dock__well {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--dock-well);
  border: 1px solid var(--brown-1);
  border-top-color: var(--dock-rule-strong);
  border-left-color: var(--dock-rule-strong);
  border-radius: var(--radius-md);
}

.identity-dock__well-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.62em;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dock-ink);
  .q-icon { color: var(--grey-7); }
}

.identity-dock__count {
  font-size: 0.9em;
  padding: 0 6px;
  border: 1px solid var(--dock-rule-strong);
  border-radius: 8px;
}

.identity-dock__refresh {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  border: none;
  background: none;
  color: var(--grey-7);
  cursor: pointer;
  padding: 2px;
  &:hover { color: var(--dock-ink); }
}

.identity-dock__empty {
  font-size: 0.72em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.55);
  padding: 2px 2px 4px;
}

// One org row: head line (mark · name · admin · title), mask line below.
.identity-dock__org {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);
}

.identity-dock__org-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.identity-dock__org-name {
  font-size: 0.8em;
  font-weight: 700;
  color: var(--ink-1);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: var(--grey-7); }
}

.identity-dock__admin {
  font-size: 0.56em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid var(--grey-7);
  color: var(--grey-7);
  flex: 0 0 auto;
}

.identity-dock__role {
  margin-left: auto;
  font-size: 0.66em;
  font-style: italic;
  color: var(--dock-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto;
}

.identity-dock__org-mask {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dashed var(--dock-rule);
  font-size: 0.72em;
  color: rgba(66, 66, 66, 0.8);
  .q-icon { color: var(--grey-7); }
}

.identity-dock__mask-name {
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__acting-chip {
  font-size: 0.62em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 7px;
  border-radius: 8px;
  background: var(--grey-7);
  color: #fff;
}

.identity-dock__all {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 2px 2px 0;
  font-size: 0.7em;
  font-weight: 700;
  color: var(--grey-7);
  cursor: pointer;
  &:hover { color: var(--dock-ink); }
}

// ── The Storage block (S4, 2026-11-01) ───────────────────────
// The well's top: one card in the org row's register (backend glyph ·
// the line · the meta), the mono usage line, a 4px quota bar when Drive
// answers, the org lock pill, the acts. Then the delegations' own sub-head.
.identity-dock__storage {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.identity-dock__storage-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 8px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);
}

.identity-dock__storage-glyph { color: var(--grey-7); flex: 0 0 auto; }

.identity-dock__storage-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__storage-line {
  font-size: 0.76em;
  color: var(--ink-1);
  b { font-weight: 700; }
  .mono { font-size: 0.9em; }
}

.identity-dock__storage-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.62em;
  color: rgba(66, 66, 66, 0.62);
  line-height: 1.4;
  min-width: 0;
  b { font-weight: 700; }
}

.identity-dock__storage-usage {
  font-size: 0.6em;
  color: rgba(66, 66, 66, 0.7);
  padding: 0 2px;
  line-height: 1.4;
}

.identity-dock__bar {
  height: 4px;
  margin: 0 2px;
  border-radius: 2px;
  background: var(--grey-3);
  overflow: hidden;
}
.identity-dock__bar-fill {
  height: 100%;
  background: var(--dock-rule-strong);
  border-radius: 2px;
}

.identity-dock__storage-lock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 1px 8px;
  border: 1px solid var(--grey-7);
  border-radius: 8px;
  font-size: 0.6em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--grey-7);
}

.identity-dock__storage-acts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.identity-dock__deleg-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed var(--dock-rule);
  font-size: 0.6em;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dock-ink);
  .q-icon { color: var(--grey-7); }
}

// ── Delegation rows (S3, 2026-10-31) ─────────────────────────
// The org row's card at a smaller scale: face · name + meta · the act at
// the end (revoke / drop), or the LOCK pill naming the org whose policy
// mandates the record. Received rows sit on the well floor with a dashed
// top rule, the org-mask line's register: held, not given.
.identity-dock__deleg-sub {
  font-size: 0.62em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.62);
  padding: 2px 2px 0;
}

.identity-dock__deleg {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 5px 8px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);

  &.is-mandated { border-style: dashed; }
  &--received { background: transparent; border-color: transparent; border-top: 1px dashed var(--dock-rule); border-radius: 0; }
}

.identity-dock__deleg-who {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__deleg-name {
  font-size: 0.78em;
  font-weight: 700;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__deleg-meta {
  font-size: 0.6em;
  color: rgba(66, 66, 66, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__deleg-lock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  max-width: 45%;
  padding: 1px 7px;
  border: 1px solid var(--grey-7);
  border-radius: 8px;
  font-size: 0.6em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--grey-7);
  span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

// ── Badge rows ───────────────────────────────────────────────
.identity-dock__badge-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.identity-dock__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1 1 auto;
  padding: 2px 8px 2px 4px;
  border: 1px solid var(--dock-rule);
  border-radius: 9px;
  background: var(--paper-card, #fff);
  opacity: 0.6;

  &.is-shown {
    border-color: var(--dock-rule-strong);
    opacity: 1;
  }
}

.identity-dock__badge-title {
  font-size: 0.64em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dock-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__badge-org {
  font-size: 0.62em;
  color: rgba(66, 66, 66, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto;
}

.identity-dock__eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);
  background: none;
  color: rgba(66, 66, 66, 0.45);
  cursor: pointer;
  flex: 0 0 auto;

  &:hover { border-color: var(--dock-rule-strong); }
  &.is-on {
    background: var(--grey-3);
    color: var(--dock-ink);
    border-color: var(--dock-rule-strong);
  }
}

.identity-dock__hint {
  font-size: 0.62em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.55);
  line-height: 1.4;
}
</style>
