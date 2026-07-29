<template>
  <!-- An organization invitation riding a chat feed (like PollCard): the
       invitee gets Accept / Decline while pending; everyone else sees the
       offer + its status. Accepting consumes the org's join secret and
       mints the invitee's MASK. -->
  <div class="invite-card" :class="'is-' + status.toLowerCase()">
    <div class="invite-card__head">
      <q-icon name="reduce_capacity" size="15px" />
      <span>Organization invite</span>
      <span class="invite-card__status">{{ status.toLowerCase() }}</span>
    </div>

    <div class="invite-card__body">
      <router-link
        v-if="invite.org"
        :to="`/organizations/${invite.org.id}`"
        class="invite-card__org"
      >{{ invite.org.name }}</router-link>
      <span v-if="invite.role_title" class="invite-card__role">as “{{ invite.role_title }}”</span>
    </div>

    <div v-if="canAnswer" class="invite-card__actions">
      <q-btn
        unelevated dense no-caps size="sm" color="positive" icon="theater_comedy"
        label="Accept — put on the mask" :loading="acting === 'accept'" :disable="!!acting"
        @click="answer('accept')"
      />
      <q-btn
        outline dense no-caps size="sm" color="negative" icon="close"
        label="Decline" :loading="acting === 'decline'" :disable="!!acting"
        @click="answer('decline')"
      />
    </div>
    <div v-else-if="status === 'PENDING'" class="invite-card__wait">
      waiting for their answer…
    </div>
    <div v-if="errorMsg" class="invite-card__err">{{ errorMsg }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { orgService } from 'src/services/org.service'

export default defineComponent({
  name: 'OrgInviteCard',
  props: {
    // A chat feed item of kind 'org_invite' ({ id, invite: { id, status,
    // role_title, invitee_id, org } }).
    item: { type: Object, required: true },
    // The viewer's entity ids (acting + root) — invitee detection.
    viewerIds: { type: Array, default: () => [] }
  },
  emits: ['answered'],
  setup (props, { emit }) {
    const acting = ref(null)
    const errorMsg = ref('')
    const localStatus = ref(null)

    const invite = computed(() => props.item.invite || {})
    const status = computed(() => localStatus.value || invite.value.status || 'PENDING')
    const canAnswer = computed(() =>
      status.value === 'PENDING' && props.viewerIds.includes(invite.value.invitee_id))

    const answer = async (verb) => {
      acting.value = verb
      errorMsg.value = ''
      try {
        const r = verb === 'accept'
          ? await orgService.acceptInvite(invite.value.id)
          : await orgService.declineInvite(invite.value.id)
        if (r.success) {
          localStatus.value = verb === 'accept' ? 'ACCEPTED' : 'DECLINED'
          emit('answered', { verb, result: r })
        } else {
          errorMsg.value = r.error?.message || `${verb} failed`
        }
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || `${verb} failed`
      } finally { acting.value = null }
    }

    return { invite, status, canAnswer, acting, errorMsg, answer }
  }
})
</script>

<style lang="scss" scoped>
.invite-card {
  align-self: center;
  width: min(86%, 480px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  border: 1px dashed rgba(#0b7a8a, 0.55);
  border-radius: 12px;
  background: rgba(#0b7a8a, 0.06);

  &.is-accepted { border-color: rgba(#21ba45, 0.55); background: rgba(#21ba45, 0.05); }
  &.is-declined { border-color: rgba(#c10015, 0.45); background: rgba(#c10015, 0.04); }
}

.invite-card__head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0b7a8a;

  .is-accepted & { color: #1a9436; }
  .is-declined & { color: #a5121f; }
}
.invite-card__status {
  margin-left: auto;
  font-size: 0.9em;
  padding: 1px 8px;
  border-radius: 9px;
  border: 1px solid currentColor;
}

.invite-card__body {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.88em;
}
.invite-card__org {
  font-weight: 700;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { color: #0b7a8a; }
}
.invite-card__role { font-size: 0.85em; font-style: italic; color: var(--coral-deep, #b25e49); }

.invite-card__actions { display: flex; gap: 8px; justify-content: flex-end; }
.invite-card__wait { font-size: 0.7em; color: var(--ink-mute, #8995a8); text-align: right; }
.invite-card__err { font-size: 0.7em; color: var(--q-negative, #c10015); text-align: right; }
</style>
