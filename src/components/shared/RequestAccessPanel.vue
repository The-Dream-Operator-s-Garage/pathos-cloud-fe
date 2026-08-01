<template>
  <!-- The "Request permission" surface behind every locked chip: a short
       explanation, an optional message to the owner, and the request
       button. The request lands as a chat message + access poll on the
       owner's side (chat layer). -->
  <div class="req-access" @click.stop>
    <!-- Talavero, the porcelain octopus, guards every element you cannot
         read — the same guardian as the full-page banner, at chip scale. -->
    <img
      class="req-access__talavero"
      :src="talavero"
      alt="Talavero, the porcelain octopus, guarding this private element"
    >
    <div class="req-access__head">
      <q-icon name="lock" size="14px" />
      <span>Private element</span>
      <span class="req-access__hash mono">{{ shortHash }}</span>
    </div>

    <template v-if="!sent">
      <div class="req-access__note">
        You can see this element's hashname, but its content belongs to
        someone else. Ask its owner to grant you access.
      </div>
      <q-input
        v-model="message"
        type="textarea" outlined dense autogrow :dark="false"
        :input-style="{ minHeight: '48px' }"
        placeholder="Why do you need access? (optional message)"
      />
      <div class="req-access__foot">
        <span v-if="errorMsg" class="req-access__err">{{ errorMsg }}</span>
        <q-space />
        <q-btn
          unelevated dense no-caps size="sm" color="primary" icon="vpn_key"
          label="Request permission" :loading="sending" @click="send"
        />
      </div>
    </template>

    <div v-else class="req-access__sent">
      <q-icon name="mark_chat_read" size="16px" />
      Request sent — the owner received your message and an access poll.
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { accessService } from 'src/services/access.service'
import talavero from 'src/assets/access-octopus-gray.png'

export default defineComponent({
  name: 'RequestAccessPanel',
  props: {
    // '<kind>/<hash>' of the locked element.
    address: { type: String, required: true }
  },
  emits: ['sent'],
  setup (props, { emit }) {
    const message = ref('')
    const sending = ref(false)
    const sent = ref(false)
    const errorMsg = ref('')

    const shortHash = computed(() => {
      const h = (props.address || '').split('/').pop() || ''
      return h ? h.slice(0, 10) + '…' : ''
    })

    const send = async () => {
      if (sending.value) return
      sending.value = true
      errorMsg.value = ''
      try {
        const r = await accessService.request(props.address, message.value.trim())
        if (r.success) {
          sent.value = true
          emit('sent')
        } else {
          errorMsg.value = r.error?.message || 'Request failed'
        }
      } catch (e) {
        errorMsg.value = e?.response?.status === 404
          ? 'The request channel ships with chats — ask the owner directly for now.'
          : (e?.response?.data?.error?.message || e?.message || 'Request failed')
      } finally { sending.value = false }
    }

    return { message, sending, sent, errorMsg, shortHash, send, talavero }
  }
})
</script>

<style lang="scss" scoped>
.req-access {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  min-width: 240px;
  max-width: 320px;
  background: var(--paper-card, #ffffff);
  color: var(--ink, #1f2a38);
}
// Talavero's banner strip — the landscape shot cropped to his half, on
// its own slate field (the image's own background, so no seam).
.req-access__talavero {
  display: block;
  width: calc(100% + 24px);
  margin: -10px -12px 0;
  height: 86px;
  object-fit: cover;
  object-position: left 35%;
  background: #2e3c45;
  border-radius: 6px 6px 0 0;
  pointer-events: none;
  user-select: none;
}

.req-access__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  font-weight: 700;
  .q-icon { color: #a06070; }
}
.req-access__hash { font-size: 0.85em; opacity: 0.55; font-weight: 400; }
.req-access__note { font-size: 0.74em; color: var(--ink-mute, #8995a8); line-height: 1.4; }
.req-access__foot { display: flex; align-items: center; gap: 8px; }
.req-access__err { font-size: 0.72em; color: var(--q-negative, #c10015); max-width: 200px; }
.req-access__sent {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76em;
  color: var(--ink-1, #1f2a38);
  .q-icon { color: var(--q-positive, #21ba45); }
}
</style>
