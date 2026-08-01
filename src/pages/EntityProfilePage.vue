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
             LEFT — content column. Same .subject-panel chrome as the
             node/path/moment/secret/link viewers so an entity reads as
             a member of the same family of primal types.
        ══════════════════════════════════════════════════════════ -->
        <div class="entity-main">

          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon
                  :name="isPioneer ? 'star' : 'person'"
                  size="22px"
                  class="subject-panel__title-icon"
                  :class="isPioneer ? 'pioneer-tint' : 'entity-tint'"
                />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  <span :class="{ 'pioneer-gold entity-title--pioneer': isPioneer }">{{ displayName }}</span>
                  <span v-if="entity.profile?.username || entity.username" class="title-username mono">
                    @{{ entity.profile?.username || entity.username }}
                  </span>
                </div>
              </div>

              <div class="subject-panel__labels">
                <template v-if="inviter">
                  <span class="rail-label">invited by</span>
                  <!-- Self-resolving: /refs/summary supplies the username and
                       the pioneer flag, so a pioneer inviter renders gold. -->
                  <EntityInfo :id="inviter.id" />
                </template>
                <span v-if="inviter && moment" class="vsep" aria-hidden="true" />
                <MomentInfo v-if="moment" :moment="moment" />
                <span v-if="(inviter || moment) && sliderLabels.length" class="vsep" aria-hidden="true" />
                <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
              </div>
            </header>

            <!-- Meta strip — id + on-disk address with copy. -->
            <div class="subject-panel__meta">
              <q-icon :name="isPioneer ? 'star' : 'person'" size="14px" class="meta-icon" :class="{ 'pioneer-tint': isPioneer }" />
              <div class="meta-label">
                <span v-if="isPioneer" class="pioneer-gold entity-meta--pioneer">★ pioneer</span>
                <strong>entity #{{ entity.id }}</strong>
                <span class="meta-typename">({{ entityTypeLabel }})</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="entity.path">{{ entity.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <!-- Body — who this actor is: bio as the content, the profile
                 facts, then the decoded protobuf for verification. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">

                <div class="entity-hero">
                  <!-- The real face when the entity's USER_PROFILE >
                       PROFILE_PHOTO is bound and readable (2026-07-25);
                       the generic person/star disc otherwise, so entities
                       without a photo keep the treatment they always had. -->
                  <EntityAvatar
                    v-if="entity.profile?.photo?.url"
                    :entity="{ id: entity.id, display_name: displayName, photo: entity.profile.photo }"
                    :size="56"
                  />
                  <q-avatar
                    v-else
                    size="56px"
                    :color="isPioneer ? 'transparent' : 'primary'"
                    text-color="white"
                    :icon="isPioneer ? 'star' : 'person'"
                    class="entity-hero__avatar"
                    :class="{ 'pioneer-gold entity-hero__avatar--pioneer': isPioneer }"
                  />
                  <div class="entity-hero__names">
                    <div class="entity-hero__display nasalization">
                      <span :class="{ 'pioneer-gold entity-title--pioneer': isPioneer }">{{ displayName }}</span>
                    </div>
                    <div v-if="entity.profile?.username || entity.username" class="entity-hero__username mono">
                      @{{ entity.profile?.username || entity.username }}
                    </div>
                  </div>
                </div>

                <div v-if="entity.profile?.bio" class="entity-bio">{{ entity.profile.bio }}</div>
                <div v-else class="entity-bio entity-bio--empty">(no bio yet)</div>

                <div class="entity-facts">
                  <div v-if="entity.profile?.joined_at" class="fact-row">
                    <span class="fact-key mono">joined</span>
                    <span class="fact-val"><MomentInfo v-if="moment" :moment="moment" dense /><span v-else class="mono">{{ entity.profile.joined_at }}</span></span>
                  </div>
                  <div class="fact-row">
                    <span class="fact-key mono">posts</span>
                    <span class="fact-val mono">{{ entity.profile?.post_count ?? 0 }}</span>
                  </div>
                  <div v-if="entity.profile?.skeleton_id" class="fact-row">
                    <span class="fact-key mono">profile skeleton</span>
                    <span class="fact-val">
                      <InfoChip
                        kind="skeletons"
                        :id="entity.profile.skeleton_id"
                        :primary="'USER_PROFILE #' + entity.profile.skeleton_id"
                        dense
                      />
                    </span>
                  </div>
                </div>

                <div v-if="!entity.profile" class="no-profile-note">
                  This entity has no USER_PROFILE skeleton yet. System entities and
                  pre-backfill rows won't have one until <code>seed-user-profiles.js</code> runs.
                </div>

                <!-- Decoded protobuf — refs render as Info chips. -->
                <div class="decoded-section">
                  <div class="decoded-heading">
                    <q-icon name="data_object" size="14px" class="q-mr-xs" />
                    decoded from pathchain
                  </div>
                  <div v-if="!decoded" class="decoded-empty">
                    no on-disk buffer found for this entity
                  </div>
                  <div v-else class="decoded-grid">
                    <div v-for="(val, key) in decodedRows" :key="key" class="fact-row">
                      <span class="fact-key mono">{{ key }}</span>
                      <span class="fact-val">
                        <InfoChip
                          v-if="refFor(val)"
                          :kind="refFor(val).prefix"
                          :address="refFor(val).address"
                          dense
                        />
                        <span v-else class="mono">{{ String(val) }}</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </main>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — anchors + (self only) the invitation minter +
             (own identity tree only) the alter-ego panel.
        ══════════════════════════════════════════════════════════ -->
        <aside class="entity-side">
          <!-- Sub-entities tree + creation module + internal log-in. The
               panel renders itself only when this entity is in the viewer's
               identity tree (their root login or one of its alter-egos).
               Organization entities (type 3) skip it — their masks are
               managed through the org surfaces, never minted here. -->
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

          <AlterEgoPanel v-if="entity.type_id !== 3" :entity-id="entity.id" />
          <section class="anchor-panel side-panel">
            <div class="anchor-panel__header">
              <q-icon name="anchor" size="14px" class="q-mr-xs" />
              <span>Anchors</span>
            </div>
            <div class="anchor-panel__scroll">
              <div class="anchor-block">
                <div class="anchor-block__label">minted at</div>
                <MomentInfo v-if="moment" :moment="moment" />
                <span v-else class="anchor-empty">no moment anchored</span>
              </div>
              <div v-if="entity.profile?.skeleton_id" class="anchor-block">
                <div class="anchor-block__label">profile skeleton</div>
                <InfoChip
                  kind="skeletons"
                  :id="entity.profile.skeleton_id"
                  :primary="'USER_PROFILE #' + entity.profile.skeleton_id"
                />
              </div>

              <div v-if="isSelf" class="anchor-block">
                <div class="anchor-block__label">invite secret</div>
                <div class="invite-hint">
                  Share this secret with someone you want to invite. Each secret is one-time use —
                  and the wait before your next invitation doubles every time you extend one.
                </div>
                <div v-if="inviteInfo" class="invite-hint">
                  Invitation #{{ inviteInfo.invitation_number }}
                  <template v-if="inviteInfo.can_invite_now"> · unlocked</template>
                  <template v-else> · unlocks in {{ humanWait(inviteInfo.retry_after_s) }}</template>
                  <template v-if="inviteInfo.inherited_handicap">
                    ({{ inviteInfo.inherited_handicap }} inherited from your inviter)
                  </template>
                </div>
                <q-btn
                  color="primary" unelevated dense size="sm"
                  label="Generate secret"
                  :loading="generatingSecret"
                  :disable="inviteInfo ? !inviteInfo.can_invite_now : false"
                  @click="generateSecret"
                />
                <div v-if="inviteError" class="anchor-empty q-mt-xs">{{ inviteError }}</div>
                <div v-if="generatedSecret" class="q-mt-sm">
                  <SecretInfo
                    v-if="generatedSecretId"
                    :id="generatedSecretId"
                    primary="Secret · unused"
                    secondary="freshly minted — click to view"
                  />
                  <div class="generated-hash mono">{{ generatedSecret }}</div>
                </div>
              </div>

              <!-- Recovery mint (Thread H): the invite chain is the recovery
                   infrastructure — on an INVITEE's profile, their inviter can
                   mint a one-time reset secret bound to this entity. -->
              <div v-if="isMyInvitee" class="anchor-block">
                <div class="anchor-block__label">password recovery</div>
                <div class="invite-hint">
                  You invited this person. If they're locked out, mint a recovery
                  secret and hand it to them — it resets only their password,
                  one time, and only for them.
                </div>
                <q-btn
                  color="primary" unelevated dense size="sm"
                  label="Mint recovery secret"
                  :loading="mintingRecovery"
                  @click="mintRecovery"
                />
                <div v-if="recoverySecret" class="generated-hash mono q-mt-sm">{{ recoverySecret }}</div>
                <div v-if="recoveryError" class="anchor-empty q-mt-xs">{{ recoveryError }}</div>
              </div>

              <!-- Device sessions (Thread H): every login is a listed,
                   revocable session. Revoking one kills that device's token. -->
              <div v-if="isSelf" class="anchor-block">
                <div class="anchor-block__label">sessions</div>
                <div v-if="loadingSessions" class="text-center q-py-sm">
                  <q-spinner color="primary" size="18px" />
                </div>
                <div v-else-if="!sessions.length" class="anchor-empty">
                  no listed sessions — tokens minted before session tracking
                  aren't listed until their next login
                </div>
                <div v-else class="secret-list">
                  <div v-for="s in sessions" :key="s.id" class="secret-row session-row">
                    <div class="secret-row__top">
                      <q-icon name="devices" size="14px" class="session-row__icon" />
                      <span class="session-row__agent" :title="s.user_agent || 'unknown device'">
                        {{ deviceLabel(s) }}
                      </span>
                      <span
                        v-if="s.current"
                        class="secret-status secret-status--unused"
                      >this device</span>
                      <q-btn
                        v-else
                        flat dense size="xs" icon="close" color="negative"
                        title="Revoke this session"
                        :loading="revokingId === s.id"
                        @click="revokeSession(s)"
                      />
                    </div>
                    <div class="secret-row__used-by">
                      <span class="rail-label">last seen</span>
                      <span class="session-row__time mono">{{ timeLabel(s.last_seen_at || s.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="isSelf" class="anchor-block">
                <div class="anchor-block__label">your secrets</div>
                <div v-if="loadingSecrets" class="text-center q-py-sm">
                  <q-spinner color="primary" size="18px" />
                </div>
                <div v-else-if="!mySecrets.length" class="anchor-empty">
                  no secrets minted yet
                </div>
                <div v-else class="secret-list">
                  <div v-for="s in mySecrets" :key="s.id" class="secret-row">
                    <div class="secret-row__top">
                      <SecretInfo
                        :id="s.id"
                        :primary="'Secret #' + s.id"
                        :secondary="s.hash.slice(0, 12) + '…'"
                        dense
                      />
                      <span
                        class="secret-status"
                        :class="s.status === 'used' ? 'secret-status--used' : 'secret-status--unused'"
                      >{{ s.type === 'reset' ? 'reset · ' + s.status : s.status }}</span>
                    </div>
                    <div v-if="s.receiver" class="secret-row__used-by">
                      <!-- A reset secret's receiver is bound at MINT (who it
                           recovers); an invite's receiver arrives at use. -->
                      <span class="rail-label">{{ s.type === 'reset' ? (s.status === 'used' ? 'recovered' : 'recovers') : 'used by' }}</span>
                      <EntityInfo :id="s.receiver.id" dense />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

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
import { authService } from 'src/services/auth.service'
import { secretService } from 'src/services/secret.service'
import { parseRef } from 'src/utils/kinds'

import InfoChip from 'src/components/shared/InfoChip.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import EntityInfo from 'src/components/entities/EntityInfo.vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import SecretInfo from 'src/components/secrets/SecretInfo.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import AlterEgoPanel from 'src/components/entities/AlterEgoPanel.vue'
import OriginTree from 'src/components/entities/OriginTree.vue'
import EntityOrganizations from 'src/components/entities/EntityOrganizations.vue'
import EntityContributions from 'src/components/entities/EntityContributions.vue'
import EntityPolls from 'src/components/entities/EntityPolls.vue'

const ENTITY_TYPES = { 1: 'USER', 2: 'BOT', 3: 'ORGANIZATION', 4: 'ALTER_EGO', 5: 'COMMUNITY' }

export default defineComponent({
  name: 'EntityProfilePage',
  components: { InfoChip, MomentInfo, EntityInfo, EntityAvatar, SecretInfo, LabelSlider, AlterEgoPanel, OriginTree, EntityOrganizations, EntityContributions, EntityPolls },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const entity = ref(null)
    const moment = ref(null)
    const labels = ref([])
    const decoded = ref(null)
    const loading = ref(true)
    const copied = ref(false)

    const generatingSecret = ref(false)
    const generatedSecret = ref('')
    const generatedSecretId = ref(null)
    const mySecrets = ref([])
    const loadingSecrets = ref(false)

    // Doubling-wait curve (2026-08-01) — where this login stands.
    const inviteInfo = ref(null)
    const inviteError = ref('')

    // Recovery mint (Thread H) — inviter-side state.
    const mintingRecovery = ref(false)
    const recoverySecret = ref('')
    const recoveryError = ref('')

    // Device sessions (Thread H) — self-side state.
    const sessions = ref([])
    const loadingSessions = ref(false)
    const revokingId = ref(null)

    const id = computed(() => parseInt(route.params.id))
    const isSelf = computed(() => entity.value && authStore.user && authStore.user.id === entity.value.id)

    // True when the viewed entity is a person THIS login invited — the
    // client-side gate for the recovery-mint block (the server re-checks:
    // only the inviter's identity tree may mint). Alter-egos/orgs are
    // skipped — recovery is for login-holding USER entities.
    const isMyInvitee = computed(() => {
      const e = entity.value
      return !!e && !isSelf.value && e.type_id === 1 &&
        !!authStore.rootEntityId && e.ancestor_id === authStore.rootEntityId
    })

    // The one-and-only origin entity: ancestor self-ref (or null). The
    // controller ships ancestor_id, so no extra lookup is needed here.
    const isPioneer = computed(() => {
      const e = entity.value
      return !!e && (e.ancestor_id === null || e.ancestor_id === e.id)
    })

    const displayName = computed(() => {
      const e = entity.value
      if (!e) return ''
      return e.profile?.display_name ||
          e.profile?.username ||
          e.username ||
          (isPioneer.value ? 'Pioneer' : ('entity #' + e.id))
    })

    const entityTypeLabel = computed(() =>
      entity.value && (ENTITY_TYPES[entity.value.type_id] || `type ${entity.value.type_id}`))

    const inviter = computed(() => entity.value?.profile?.invited_by || null)

    const sliderLabels = computed(() => labels.value)

    // Only the proto's declared fields (entity: register, ancestor, tag).
    const decodedRows = computed(() => {
      const d = decoded.value
      if (!d) return {}
      const out = {}
      for (const key of ['register', 'ancestor', 'tag']) {
        if (d[key] !== undefined && d[key] !== '') out[key] = d[key]
      }
      return out
    })

    const refFor = (val) => parseRef(typeof val === 'string' ? val : '')

    const load = async () => {
      loading.value = true
      entity.value = null
      moment.value = null
      labels.value = []
      decoded.value = null
      generatedSecret.value = ''
      generatedSecretId.value = null
      mySecrets.value = []
      recoverySecret.value = ''
      recoveryError.value = ''
      sessions.value = []
      try {
        const r = await entityService.get(id.value)
        if (r.success) {
          entity.value = r.entity
          moment.value = r.moment || null
          labels.value = r.labels || []
          decoded.value = r.decoded || null
        }
      } catch (_) { /* leave null */ }
      loading.value = false
      if (isSelf.value) {
        loadSecrets()
        loadSessions()
        loadInviteStatus()
      }
    }

    const loadSecrets = async () => {
      loadingSecrets.value = true
      try {
        const r = await secretService.mine()
        if (r.success) mySecrets.value = r.secrets
      } catch (_) { /* leave empty */ }
      loadingSecrets.value = false
    }

    const loadInviteStatus = async () => {
      try {
        const r = await authService.inviteStatus()
        if (r.success) inviteInfo.value = r.invite
      } catch (_) { /* leave null — button stays enabled, server still gates */ }
    }

    // "in 3s" / "in 4m" / "in 2.5h" / "in 12d" / "in 1.2y"
    const humanWait = (s) => {
      if (s < 60) return `${Math.ceil(s)}s`
      if (s < 3600) return `${Math.ceil(s / 60)}m`
      if (s < 86400) return `${Math.round(s / 360) / 10}h`
      if (s < 31536000) return `${Math.round(s / 8640) / 10}d`
      return `${Math.round(s / 3153600) / 10}y`
    }

    const generateSecret = async () => {
      generatingSecret.value = true
      inviteError.value = ''
      try {
        const result = await authService.generateSecret()
        if (result.success) {
          generatedSecret.value = result.secret.hash
          generatedSecretId.value = result.secret.id || null
          loadSecrets()
        }
      } catch (err) {
        // 429 = the doubling wait hasn't elapsed — surface when it will.
        const e = err.response?.data?.error
        inviteError.value = e?.retry_after_s
          ? `Not yet — invitation #${e.invite?.invitation_number} unlocks in ${humanWait(e.retry_after_s)}`
          : (e?.message || 'Generation failed')
      } finally {
        generatingSecret.value = false
        loadInviteStatus()
      }
    }

    // ── Recovery mint (Thread H) ─────────────────────────────
    const mintRecovery = async () => {
      mintingRecovery.value = true
      recoveryError.value = ''
      try {
        const result = await authService.mintRecoverySecret(entity.value.id)
        if (result.success) recoverySecret.value = result.secret.hash
        else recoveryError.value = result.error?.message || 'Mint failed'
      } catch (err) {
        recoveryError.value = err.response?.data?.error?.message || 'Mint failed'
      } finally {
        mintingRecovery.value = false
      }
    }

    // ── Device sessions (Thread H) ───────────────────────────
    const loadSessions = async () => {
      loadingSessions.value = true
      try {
        const r = await authService.sessions()
        if (r.success) sessions.value = r.sessions
      } catch (_) { /* leave empty */ }
      loadingSessions.value = false
    }

    const revokeSession = async (s) => {
      revokingId.value = s.id
      try {
        const r = await authService.revokeSession(s.id)
        if (r.success) sessions.value = sessions.value.filter(x => x.id !== s.id)
      } catch (_) { /* row stays */ }
      revokingId.value = null
    }

    // "Chrome · Mac" out of a user-agent string — a glance label, not parsing.
    const deviceLabel = (s) => {
      const ua = s.user_agent || ''
      if (!ua) return 'unknown device'
      const browser = /Edg\//.test(ua) ? 'Edge'
        : /OPR\//.test(ua) ? 'Opera'
          : /Chrome\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) && /Version\//.test(ua) ? 'Safari'
              : /Firefox\//.test(ua) ? 'Firefox'
                : ua.split('/')[0].slice(0, 24)
      const os = /Android/.test(ua) ? 'Android'
        : /iPhone|iPad/.test(ua) ? 'iOS'
          : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
            : /Windows/.test(ua) ? 'Windows'
              : /Linux/.test(ua) ? 'Linux' : null
      return os ? `${browser} · ${os}` : browser
    }

    const timeLabel = (t) => {
      if (!t) return '—'
      const d = new Date(t)
      const mins = Math.floor((Date.now() - d.getTime()) / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return `${mins}m ago`
      if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`
      return d.toLocaleDateString()
    }

    const logout = () => {
      authStore.logout()
      router.push('/auth')
    }

    const copyPath = () => {
      if (!entity.value?.path) return
      navigator.clipboard.writeText(entity.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    onMounted(load)
    watch(() => route.params.id, load)

    const originOpen = ref(false)

    return {
      entity,
      moment,
      labels,
      decoded,
      loading,
      isSelf,
      isPioneer,
      originOpen,
      displayName,
      entityTypeLabel,
      inviter,
      sliderLabels,
      decodedRows,
      refFor,
      generatingSecret,
      generatedSecret,
      generatedSecretId,
      generateSecret,
      inviteInfo,
      inviteError,
      humanWait,
      mySecrets,
      loadingSecrets,
      isMyInvitee,
      mintingRecovery,
      recoverySecret,
      recoveryError,
      mintRecovery,
      sessions,
      loadingSessions,
      revokingId,
      revokeSession,
      deviceLabel,
      timeLabel,
      logout,
      copied,
      copyPath
    }
  }
})
</script>

<style lang="scss" scoped>
// Same layout skeleton as the sibling primal viewers — 75/25 grid +
// subject-panel chrome.
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
.entity-main { min-width: 0; }

.entity-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
}
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
  .entity-side { height: auto; max-height: none; }
  .side-panel { flex: 0 0 auto; }
}

.subject-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
  min-width: 0;
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  position: relative;

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.subject-panel__ident {
  padding: 8px 12px 6px;
  background: var(--panel-chrome);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.subject-panel__titlebar {
  display: flex;
  align-items: stretch;
  gap: 10px;
  border-bottom: 1px solid var(--panel-rule);
  margin: 0 -12px;
  padding: 0 12px 6px;
}
.subject-panel__title-icon {
  color: var(--ink);
  flex-shrink: 0;
  align-self: center;
  &.entity-tint  { color: #9b6cb0; }
  &.pioneer-tint { color: #c79a00; }
}
.meta-icon.pioneer-tint { color: #c79a00; }

// Chip-shaped wrappers so the global .pioneer-gold surface reads as a badge.
.entity-title--pioneer {
  padding: 1px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.entity-meta--pioneer {
  padding: 0 8px;
  margin-right: 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.86em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
// The faceless fallback wears the same rounded square as EntityAvatar
// (2026-07-25) — same 26% of the box, so a photo and a placeholder are the
// same shape on the same hero. Quasar's own `.q-avatar { border-radius: 50% }`
// is a single class, so one more class here outranks it.
.entity-hero__avatar,
.entity-hero__avatar--pioneer {
  border-radius: 26%;
}
.subject-panel__title {
  font-size: 1.25em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  .title-username {
    font-size: 0.62em;
    color: var(--panel-ink-2);
  }
}
.vsep {
  flex: 0 0 1px;
  width: 1px;
  background: var(--panel-rule);
  align-self: stretch;
}
.subject-panel__titlebar .vsep {
  margin-top: -8px;
  margin-bottom: -6px;
}
.subject-panel__labels .vsep {
  margin-top: -5px;
  margin-bottom: -6px;
}
.subject-panel__labels {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}
.rail-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
}

.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;
}
.subject-panel__meta .meta-icon  { color: var(--panel-ink-2); }
.subject-panel__meta .meta-label {
  color: var(--panel-ink-2);
  white-space: nowrap;
  strong { color: var(--panel-ink-1); }
}
.subject-panel__meta .meta-typename { color: var(--panel-ink-mute); margin-left: 4px; }
.subject-panel__meta .meta-hash {
  font-size: 0.86em;
  color: var(--panel-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}
.subject-panel__meta .meta-btn {
  color: var(--panel-ink-2);
  &:hover { color: var(--coral-deep); }
}

.subject-panel__body {
  flex: 1 1 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome);
  padding: 8px;
}
.subject-panel__body-card {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
  padding: 10px 14px;
}

// ── Entity body ────────────────────────────────────────
.entity-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px 10px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.15);
  margin-bottom: 12px;
}
.entity-hero__display {
  font-size: 1.35em;
  color: var(--panel-ink-1, #1F2A38);
}
.entity-hero__username {
  margin-top: 2px;
  font-size: 0.85em;
  color: rgba(var(--ink-rgb), 0.55);
}

.entity-bio {
  font-size: 0.92em;
  white-space: pre-wrap;
  color: var(--panel-ink-1, #1F2A38);
  padding: 4px 2px 12px;
  &.entity-bio--empty {
    font-style: italic;
    color: rgba(var(--ink-rgb), 0.4);
  }
}

.entity-facts { margin-bottom: 14px; }

.fact-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 2px;
  font-size: 0.82em;
  & + & { border-top: 1px dotted rgba(var(--ink-rgb), 0.08); }
  .fact-key {
    flex: 0 0 160px;
    color: rgba(var(--ink-rgb), 0.55);
  }
  .fact-val {
    color: var(--panel-ink-1, #1F2A38);
    word-break: break-all;
  }
}

.no-profile-note {
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.55);
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px dashed rgba(var(--ink-rgb), 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 14px;
}

.decoded-section { margin-top: 4px; }
.decoded-heading {
  display: flex;
  align-items: center;
  font-size: 0.76em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-bottom: 6px;
}
.decoded-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 6px 2px;
}
.decoded-grid { padding-bottom: 8px; }

// ── Right sidebar — anchors panel ───────────────────────
.anchor-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}
.anchor-panel__header {
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
.anchor-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.anchor-block__label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
  margin-bottom: 5px;
}
.anchor-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
}
.invite-hint {
  font-size: 0.76em;
  color: rgba(var(--ink-rgb), 0.55);
  margin-bottom: 8px;
}
.generated-hash {
  margin-top: 6px;
  font-size: 0.72em;
  word-break: break-all;
  color: rgba(var(--ink-rgb), 0.6);
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  border-radius: 6px;
  padding: 6px 8px;
}

// ── "your secrets" list ─────────────────────────────────
.secret-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.secret-row {
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 6px;
  padding: 6px 8px;
  background: rgba(var(--ink-rgb), 0.03);
}
.secret-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.secret-status {
  flex-shrink: 0;
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid transparent;
  &--unused {
    color: #1d7a44;
    background: rgba(33, 186, 69, 0.1);
    border-color: rgba(33, 186, 69, 0.35);
  }
  &--used {
    color: var(--panel-ink-2);
    background: rgba(var(--ink-rgb), 0.06);
    border-color: rgba(var(--ink-rgb), 0.2);
  }
}
.secret-row__used-by {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dotted rgba(var(--ink-rgb), 0.12);
}

// ── Sessions (Thread H) — device rows in the secrets' chrome ──
.session-row__icon {
  flex: 0 0 auto;
  opacity: 0.55;
}

.session-row__agent {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78em;
}

.session-row__time { font-size: 0.74em; }

// ── Log out — big, unmissable, below the anchors panel ──
.logout-btn {
  flex: 0 0 auto;
  width: 100%;
}
</style>
