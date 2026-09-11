<template>
  <!-- THE ANCHORS PANEL — the entity viewer's side column: what the entity
       is anchored to (its minting moment, its profile skeleton) and, for
       the viewer's OWN profile, the account's furniture: the DOG Coin
       wallet, the invite secret minter with its doubling-wait status, the
       device sessions and the secrets ledger; on an INVITEE's profile the
       inviter's recovery mint. Lived inline in EntityProfilePage until
       2026-09-11, when the entity WINDOW needed the same column — so the
       page and the window both mount this, and each block still gates
       itself on the viewer (`isSelf` / `isMyInvitee`); the server re-checks
       every write. -->
  <section class="anchor-panel">
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

      <!-- DOG Coin wallet (C1, 2026-08-01): the root login's purse.
           Balance + the latest movements; every row's receipt is a
           signed TRANSACTION skeleton on the chain. -->
      <div v-if="isSelf && wallet" class="anchor-block">
        <div class="anchor-block__label">wallet</div>
        <div class="wallet-balance">
          <q-icon name="toll" size="16px" class="q-mr-xs" />
          <span class="wallet-balance__amount mono">{{ wallet.balance }}</span>
          <span class="wallet-balance__unit">DOG</span>
        </div>
        <div v-if="wallet.transactions.length" class="secret-list q-mt-xs">
          <div v-for="tx in wallet.transactions.slice(0, 5)" :key="tx.id" class="secret-row">
            <div class="secret-row__top">
              <q-icon
                :name="tx.direction === 'in' ? 'south_west' : 'north_east'"
                :class="tx.direction === 'in' ? 'wallet-tx--in' : 'wallet-tx--out'"
                size="14px"
              />
              <span class="mono">{{ tx.direction === 'in' ? '+' : '−' }}{{ tx.amount }}</span>
              <span class="wallet-tx__peer">
                {{ tx.direction === 'in' ? tx.from.name : tx.to.name }}
              </span>
              <InfoChip
                v-if="tx.receipt_skeleton_id"
                kind="skeletons"
                :id="tx.receipt_skeleton_id"
                primary="receipt"
              />
            </div>
            <div v-if="tx.memo" class="wallet-tx__memo">{{ tx.memo }}</div>
          </div>
        </div>
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
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { authService } from 'src/services/auth.service'
import { walletService } from 'src/services/wallet.service'
import { secretService } from 'src/services/secret.service'

import InfoChip from 'src/components/shared/InfoChip.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import EntityInfo from 'src/components/entities/EntityInfo.vue'
import SecretInfo from 'src/components/secrets/SecretInfo.vue'

export default defineComponent({
  name: 'EntityAnchors',
  components: { InfoChip, MomentInfo, EntityInfo, SecretInfo },
  props: {
    entity: { type: Object, required: true },
    moment: { type: Object, default: null }
  },
  setup (props) {
    const authStore = useAuthStore()

    const generatingSecret = ref(false)
    const generatedSecret = ref('')
    const generatedSecretId = ref(null)
    const mySecrets = ref([])
    const loadingSecrets = ref(false)

    // Doubling-wait curve (2026-08-01) — where this login stands.
    const inviteInfo = ref(null)
    const inviteError = ref('')

    // DOG Coin wallet (C1) — the root login's purse.
    const wallet = ref(null)

    // Recovery mint (Thread H) — inviter-side state.
    const mintingRecovery = ref(false)
    const recoverySecret = ref('')
    const recoveryError = ref('')

    // Device sessions (Thread H) — self-side state.
    const sessions = ref([])
    const loadingSessions = ref(false)
    const revokingId = ref(null)

    const isSelf = computed(() => !!props.entity && !!authStore.user && authStore.user.id === props.entity.id)

    // True when the viewed entity is a person THIS login invited — the
    // client-side gate for the recovery-mint block (the server re-checks:
    // only the inviter's identity tree may mint). Alter-egos/orgs are
    // skipped — recovery is for login-holding USER entities.
    const isMyInvitee = computed(() => {
      const e = props.entity
      return !!e && !isSelf.value && e.type_id === 1 &&
        !!authStore.rootEntityId && e.ancestor_id === authStore.rootEntityId
    })

    const loadWallet = async () => {
      try {
        const r = await walletService.get(1, 5)
        if (r.success) wallet.value = r.wallet
      } catch (_) { /* pre-economy API — block simply doesn't render */ }
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
        const result = await authService.mintRecoverySecret(props.entity.id)
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

    const load = () => {
      generatedSecret.value = ''
      generatedSecretId.value = null
      mySecrets.value = []
      recoverySecret.value = ''
      recoveryError.value = ''
      sessions.value = []
      wallet.value = null
      inviteInfo.value = null
      if (isSelf.value) {
        loadSecrets()
        loadSessions()
        loadInviteStatus()
        loadWallet()
      }
    }
    onMounted(load)
    watch(() => [props.entity?.id, authStore.user?.id], load)

    return {
      isSelf,
      isMyInvitee,
      generatingSecret,
      generatedSecret,
      generatedSecretId,
      generateSecret,
      inviteInfo,
      inviteError,
      wallet,
      humanWait,
      mySecrets,
      loadingSecrets,
      mintingRecovery,
      recoverySecret,
      recoveryError,
      mintRecovery,
      sessions,
      loadingSessions,
      revokingId,
      revokeSession,
      deviceLabel,
      timeLabel
    }
  }
})
</script>

<style lang="scss" scoped>
// The side panel's own chrome (the page used to lend it `.side-panel`);
// the host decides the height — the page pins it to its column, the
// window lets it flow. `--entity-anchors-max-h` caps the scroller where
// a host wants one.
.anchor-panel {
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
  flex: 1 1 0;
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
  max-height: var(--entity-anchors-max-h, none);
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
.rail-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
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

// ── DOG Coin wallet (C1) ────────────────────────────────
.wallet-balance {
  display: flex;
  align-items: baseline;
  gap: 4px;
  .wallet-balance__amount {
    font-size: 1.25em;
    font-weight: 600;
  }
  .wallet-balance__unit {
    font-size: 0.72em;
    letter-spacing: 0.06em;
    color: rgba(var(--ink-rgb), 0.5);
  }
}
.wallet-tx--in { color: var(--positive); }
.wallet-tx--out { color: rgba(var(--ink-rgb), 0.55); }
.wallet-tx__peer {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 0;
}
.wallet-tx__memo {
  font-size: 0.72em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  margin-top: 2px;
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
</style>
