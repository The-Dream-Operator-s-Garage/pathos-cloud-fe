<template>
  <!-- THE CONVERSATION PICKER (dashboards phase 5, 2026-08-10) — the small
       dialog behind every "share to chat" button (dashboards AND posts).
       It owns the WHOLE prefill flow so hosts stay one line: pick a
       conversation → the share body ('[[pathos:<ref>]]') lands in that
       chat's DRAFT (the chat store's drafts seam), the chat activates,
       the dock opens — and ChatDock's existing send machinery does the
       rest: REF_RE sees the ref, AccessTreeDialog opens in mode="share",
       shareRefs GRANTS the recipients (sharing grants, never publishes),
       then the message sends. A fresh pair chat honors the opener rule
       exactly as anywhere else — 40311 surfaces as ChatDock's own gate
       line (the FeedStream.onAsk precedent), nothing here special-cases
       it. -->
  <q-dialog v-model="open">
    <div class="conv-picker">
      <div class="conv-picker__head">
        <q-icon name="ios_share" size="14px" />
        <span class="nasalization">Share to a conversation</span>
      </div>

      <div v-if="loading" class="conv-picker__loading">
        <q-spinner size="16px" color="primary" />
      </div>

      <div v-else-if="!chats.length" class="conv-picker__empty">
        No conversations yet — open one from a profile or the chat window
        first.
      </div>

      <div v-else class="conv-picker__list">
        <button
          v-for="c in chats"
          :key="c.id"
          type="button"
          class="conv-picker__row"
          @click="pick(c)"
        >
          <q-icon name="forum" size="13px" class="conv-picker__row-glyph" />
          <span class="conv-picker__row-names">{{ namesOf(c) }}</span>
          <q-icon name="chevron_right" size="14px" class="conv-picker__row-go" />
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { chatService } from 'src/services/chat.service'
import { useChatStore } from 'src/stores/chat'

export default defineComponent({
  name: 'ConversationPicker',
  props: {
    modelValue: { type: Boolean, default: false },
    // The '<kind>/<hash>' address being shared — becomes the draft's
    // [[pathos:…]] chip.
    shareRef: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const open = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })

    const loading = ref(false)
    const chats = ref([])

    const load = async () => {
      loading.value = true
      try {
        const r = await chatService.list()
        chats.value = r.success ? (r.chats || []) : []
      } catch (_) {
        chats.value = []
      }
      loading.value = false
    }
    watch(() => props.modelValue, (v) => { if (v) load() })

    const namesOf = (c) => {
      const others = (c.members || []).filter(m => !m.is_me)
      return others.map(m => m.display_name || m.username || ('#' + m.id)).join(', ') || ('chat #' + c.id)
    }

    const pick = (c) => {
      if (!props.shareRef) { open.value = false; return }
      const chat = useChatStore()
      const existing = chat.getDraft ? chat.getDraft(c.id) : (chat.drafts[c.id] || '')
      const chip = `[[pathos:${props.shareRef}]]`
      chat.setDraft(c.id, existing ? `${existing} ${chip}` : chip)
      chat.setActive(c.id)
      chat.open()
      open.value = false
    }

    return { open, loading, chats, namesOf, pick }
  }
})
</script>

<style lang="scss" scoped>
.conv-picker {
  width: min(360px, 92vw);
  background: var(--grey-3, #eee);
  border: 1px solid var(--grey-4, #e0e0e0);
  border-radius: 10px;
  overflow: hidden;
}

.conv-picker__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  font-size: 0.8em;
  font-weight: 600;
  color: var(--brown-8, #4e342e);
  border-bottom: 1px solid var(--grey-5, #d0d0d0);
}

.conv-picker__loading { padding: 14px; text-align: center; }

.conv-picker__empty {
  padding: 14px;
  font-size: 0.76em;
  font-style: italic;
  color: var(--brown-4, #8d6e63);
}

.conv-picker__list {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
}

.conv-picker__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-bottom: 1px solid var(--grey-4, #e0e0e0);
  background: #fff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 0.8em;
  color: var(--brown-8, #4e342e);

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(0, 184, 212, 0.07); }
}

.conv-picker__row-glyph { color: var(--brown-4, #8d6e63); flex-shrink: 0; }

.conv-picker__row-names {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-picker__row-go { color: var(--grey-5, #d0d0d0); flex-shrink: 0; }
</style>
