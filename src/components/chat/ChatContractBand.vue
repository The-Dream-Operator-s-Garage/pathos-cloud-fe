<template>
  <!-- The channel contract (Thread K): the live truth of who-sees-what,
       derived from recorded state (chat_member seats + element_access
       ledgers), never prose. One row per element this conversation has
       put on the table; each member wears their ACTUAL readability, so
       the panel cannot claim an audience the chain contradicts. -->
  <div class="contract-band">
    <div v-if="loading" class="contract-band__hint">reading the contract…</div>

    <template v-else-if="data">
      <!-- Seats: consent status straight off the mirror rows. -->
      <div class="contract-band__seats">
        <span
          v-for="m in data.members"
          :key="m.id"
          class="contract-band__seat"
          :title="seatTitle(m)"
        >
          <q-icon name="person" size="12px" />
          <span :class="{ 'is-me': m.is_me }">{{ m.display_name || m.username || `#${m.id}` }}</span>
          <span class="contract-band__pill" :class="'is-' + (m.status || '').toLowerCase()">
            {{ (m.status || '').toLowerCase() }}
          </span>
        </span>
      </div>

      <!-- Shares: each element's grant ledger + audience. -->
      <div v-if="data.shares.length" class="contract-band__shares">
        <div
          v-for="s in data.shares"
          :key="s.ref"
          class="contract-share"
        >
          <div class="contract-share__what">
            <q-icon :name="kindFor(s.kind).icon" size="13px" :style="{ color: kindFor(s.kind).color }" />
            <router-link
              v-if="s.summary && s.summary.route"
              :to="s.summary.route"
              class="contract-share__name"
            >{{ s.summary.primary }}</router-link>
            <span v-else class="contract-share__name">{{ (s.summary && s.summary.primary) || shortHash(s.ref) }}</span>
            <q-icon v-if="s.public" name="public" size="12px" class="contract-share__globe" title="public — the world is on the path" />
            <span v-if="s.first_shared && s.first_shared.at" class="contract-share__when" :title="s.first_shared.at.human">
              {{ s.first_shared.at.human }}
            </span>
            <router-link
              v-if="s.access_path_id"
              :to="`/paths/${s.access_path_id}`"
              class="contract-share__history"
              title="grant history — the on-chain ACCESS path"
            ><q-icon name="history" size="12px" /></router-link>
          </div>
          <div class="contract-share__audience">
            <span
              v-for="a in s.audience"
              :key="a.entity_id"
              class="contract-share__viewer"
              :class="{ 'is-out': !a.sees }"
              :title="viewerTitle(s, a)"
            >
              <q-icon :name="a.sees ? 'visibility' : 'visibility_off'" size="11px" />
              {{ nameOf(a.entity_id) }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="contract-band__hint">
        Nothing on the table yet — refs you send open here, with who can read them.
      </div>

      <!-- Attention receipts (Thread G stage 2): SYMMETRIC by design —
           receipts render only while EVERY seat consents, both sides see
           the same rows, and flipping your toggle off stops them for
           everyone at once. The window opens at the LAST consent, so
           nothing attended before consent is ever reported. -->
      <div class="contract-band__attention">
        <div class="contract-attention__head">
          <q-icon name="visibility" size="12px" />
          <span class="contract-attention__title">Attention receipts</span>
          <q-toggle
            :model-value="myAttention"
            dense size="28px" color="teal-8"
            :title="myAttention ? 'withdraw consent — stops receipts for everyone' : 'consent — receipts flow once every seat consents'"
            @update:model-value="onToggleAttention"
          />
        </div>
        <template v-if="attention">
          <div class="contract-band__seats">
            <span
              v-for="m in attention.members"
              :key="'att-' + m.id"
              class="contract-band__seat"
              :title="m.attention.enabled && m.attention.since ? 'consented' : 'not consenting'"
            >
              <span :class="{ 'is-me': m.is_me }">{{ m.display_name || m.username || `#${m.id}` }}</span>
              <span class="contract-band__pill" :class="m.attention.enabled ? '' : 'is-declined'">
                {{ m.attention.enabled ? 'consents' : 'off' }}
              </span>
            </span>
          </div>
          <template v-if="attention.mutual">
            <div
              v-for="r in attention.receipts"
              :key="'r-' + r.ref"
              class="contract-share"
            >
              <div class="contract-share__what">
                <q-icon :name="kindFor(r.kind).icon" size="13px" :style="{ color: kindFor(r.kind).color }" />
                <router-link
                  v-if="r.summary && r.summary.route"
                  :to="r.summary.route"
                  class="contract-share__name"
                >{{ r.summary.primary }}</router-link>
                <span v-else class="contract-share__name">{{ (r.summary && r.summary.primary) || shortHash(r.ref) }}</span>
              </div>
              <div class="contract-share__audience">
                <span
                  v-for="a in r.attention"
                  :key="'ra-' + a.entity_id"
                  class="contract-share__viewer"
                  :class="{ 'is-out': !a.at }"
                  :title="a.at ? `attended ${a.visits} time${a.visits === 1 ? '' : 's'}, last ${new Date(a.at).toLocaleString()}` : 'not attended in this window'"
                >
                  <q-icon :name="a.at ? 'visibility' : 'visibility_off'" size="11px" />
                  {{ nameOf(a.entity_id) }}<template v-if="a.visits > 1"> ×{{ a.visits }}</template>
                </span>
              </div>
            </div>
            <div v-if="!attention.receipts.length" class="contract-band__hint">
              Mutual — receipts open here as refs land on the table.
            </div>
          </template>
          <div v-else class="contract-band__hint">
            Receipts flow only while <b>every</b> seat consents — symmetric,
            per-conversation, revocable. Nothing attended before the last
            consent is ever shared.
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { chatService } from 'src/services/chat.service'
import { kindFor, shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'ChatContractBand',
  props: {
    chatId: { type: Number, required: true },
    // Bump to reload (the dock ties it to its feed refreshes, so a fresh
    // share or a poll grant re-derives the panel from state).
    refresh: { type: Number, default: 0 }
  },

  setup (props) {
    const data = ref(null)
    const loading = ref(false)
    const attention = ref(null)

    const load = async () => {
      if (!props.chatId) { data.value = null; attention.value = null; return }
      loading.value = !data.value
      try {
        const r = await chatService.contract(props.chatId)
        if (r.success) data.value = r
      } catch (_) { /* the band keeps its last derivation */ }
      try {
        const a = await chatService.attention(props.chatId)
        if (a.success) attention.value = a
      } catch (_) { /* same */ }
      loading.value = false
    }

    watch(() => [props.chatId, props.refresh], load, { immediate: true })

    // My consent state, off the attention read (any of my seats counts).
    const myAttention = computed(() =>
      (attention.value?.members || []).some((m) => m.is_me && m.attention.enabled))

    const onToggleAttention = async (v) => {
      try {
        await chatService.setAttention(props.chatId, v)
      } catch (_) { /* the reload below states the real outcome */ }
      try {
        const a = await chatService.attention(props.chatId)
        if (a.success) attention.value = a
      } catch (_) { /* keep last */ }
    }

    const nameOf = (entityId) => {
      const m = (data.value?.members || []).find((mm) => mm.id === entityId)
      return m ? (m.display_name || m.username || `#${entityId}`) : `#${entityId}`
    }

    const seatTitle = (m) => {
      const bits = [`seat: ${(m.status || '').toLowerCase()}`]
      if (m.joined?.human) bits.push(`joined ${m.joined.human}`)
      if (m.online) bits.push('connected now')
      return bits.join(' · ')
    }

    // The eye's tooltip states WHY: owner / public / the recorded grant.
    const viewerTitle = (s, a) => {
      if (a.entity_id === s.owner_id) return 'owner'
      if (!a.sees) return 'cannot read this element'
      const e = (s.entries || []).find((en) => en.entity_id === a.entity_id)
      if (e) {
        const by = e.granted_by_username ? ` by ${e.granted_by_username}` : ''
        const at = e.moment?.human ? ` · ${e.moment.human}` : ''
        return `granted${by}${at}`
      }
      return s.public ? 'public element' : 'can read'
    }

    return {
      data,
      loading,
      attention,
      myAttention,
      onToggleAttention,
      kindFor,
      shortHash,
      nameOf,
      seatTitle,
      viewerTitle
    }
  }
})
</script>

<style lang="scss" scoped>
.contract-band {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 14px;
  max-height: 34%;
  overflow-y: auto;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.12);
  background: rgba(#00829c, 0.04);

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.contract-band__hint {
  font-size: 0.72em;
  color: var(--ink-mute, #8995a8);
  line-height: 1.4;
}

.contract-band__seats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.contract-band__seat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74em;
  color: var(--ink, #1f2a38);
  .q-icon { color: #9b6cb0; }
  .is-me { font-weight: 700; }
}
.contract-band__pill {
  font-size: 0.82em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 5px;
  border-radius: 6px;
  border: 1px solid rgba(#21ba45, 0.5);
  color: #1a8a35;
  &.is-pending  { border-color: rgba(#c79a00, 0.55); color: #9a7800; }
  &.is-declined { border-color: rgba(#c10015, 0.45); color: #a5121f; }
}

.contract-band__shares {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.contract-share {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 7px;
  background: var(--paper-card, #ffffff);
}
.contract-share__what {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.contract-share__name {
  font-size: 0.76em;
  font-weight: 700;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: #00829c; }
}
.contract-share__globe { color: #0b7a8a; flex-shrink: 0; }
.contract-share__when {
  margin-left: auto;
  font-size: 0.64em;
  color: var(--ink-mute, #8995a8);
  white-space: nowrap;
  flex-shrink: 0;
}
.contract-share__history {
  display: inline-flex;
  color: var(--ink-mute, #8995a8);
  flex-shrink: 0;
  &:hover { color: #00829c; }
}
.contract-share__audience {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 10px;
}
.contract-share__viewer {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68em;
  color: #1a8a35;
  .q-icon { opacity: 0.85; }
  &.is-out { color: #a5121f; }
}

// Attention receipts (G stage 2) — a dashed rule sets the consent section
// off from the contract's recorded-state rows above it: same band, a
// different covenant (what you'll SHARE, not what you can READ).
.contract-band__attention {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 6px;
  border-top: 1px dashed rgba(var(--ink-rgb), 0.18);
}
.contract-attention__head {
  display: flex;
  align-items: center;
  gap: 5px;
  .q-icon { color: #0b7a8a; }
}
.contract-attention__title {
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--ink, #1f2a38);
  margin-right: auto;
}
// The receipts reuse .contract-share rows: an eye that means ATTENDED
// (not "can read") — the tooltip carries count + last time. A member
// with no attention in the window is quiet grey, not the audience red:
// "hasn't looked yet" is not a denial.
.contract-band__attention .contract-share__viewer.is-out { color: var(--ink-mute, #8995a8); }
</style>
