<template>
  <!-- The profile's "My polls" band (own profile only): every access
       poll the viewer sits in, newest first. Decider-seat cards carry
       the live controls — Yes/No while pending, and the reverse button
       once decided (granted ⇄ denied, access flips with it). Requester-
       seat cards just show where the ask stands. Same PollCard the chat
       renders — one poll module everywhere. -->
  <section class="polls-band">
    <div class="polls-band__header">
      <q-icon name="how_to_vote" size="14px" class="q-mr-xs" />
      <span>My polls</span>
      <span class="polls-band__count">{{ polls.length }}</span>
      <q-space />
      <q-btn
        flat dense size="sm" icon="refresh" :ripple="false"
        :loading="loading" title="Refresh" @click="load"
      />
    </div>

    <div v-if="loading && !polls.length" class="polls-band__empty">
      <q-spinner color="primary" size="18px" />
    </div>
    <div v-else-if="!polls.length" class="polls-band__empty">
      No access polls yet — they appear here when someone asks for your
      content, or you ask for someone else's.
    </div>
    <div v-else class="polls-band__grid">
      <div v-for="p in polls" :key="p.id" class="poll-cell">
        <div class="poll-cell__meta">
          <span class="poll-cell__role" :class="'role--' + p.role">
            {{ p.role === 'decider' ? 'you decide' : 'your request' }}
          </span>
          <span v-if="p.moment" class="poll-cell__when">{{ p.moment.human }}</span>
        </div>
        <PollCard
          :item="p"
          :viewer-ids="viewerIds"
          :allow-reverse="p.role === 'decider'"
          @voted="load"
        />
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { pollService } from 'src/services/poll.service'
import PollCard from 'src/components/chat/PollCard.vue'

export default defineComponent({
  name: 'EntityPolls',
  components: { PollCard },
  setup () {
    const auth = useAuthStore()
    const polls = ref([])
    const loading = ref(false)

    const viewerIds = computed(() => {
      const u = auth.user || {}
      return [u.entityId, u.rootEntityId, u.id].map((x) => parseInt(x, 10)).filter(Boolean)
    })

    const load = async () => {
      loading.value = true
      try {
        const r = await pollService.mine()
        if (r.success) polls.value = r.polls || []
      } catch (_) { /* leave as-is */ }
      loading.value = false
    }
    onMounted(load)

    return { polls, loading, viewerIds, load }
  }
})
</script>

<style lang="scss" scoped>
// Same panel family as the profile's other bands.
.polls-band {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1f2a38;
  --panel-ink-2:  #5b6c82;

  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md, 10px);
  box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.08));
  overflow: hidden;
}

.polls-band__header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  font-size: 0.78em;
  font-weight: 500;
  color: var(--panel-ink-1);
}
.polls-band__count {
  margin-left: 5px;
  color: var(--panel-ink-2);
}

.polls-band__empty {
  padding: 16px 12px;
  text-align: center;
  font-size: 0.8em;
  font-style: italic;
  color: var(--panel-ink-2);
}

.polls-band__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 10px;
  padding: 10px;
}

.poll-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  // PollCard sizes itself for a chat column — stretch it to the cell.
  :deep(.poll-card) {
    width: 100%;
    align-self: stretch;
  }
}

.poll-cell__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
}
.poll-cell__role {
  font-size: 0.66em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid transparent;

  &.role--decider {
    color: #6a4a80;
    background: rgba(155, 108, 176, 0.1);
    border-color: rgba(155, 108, 176, 0.35);
  }
  &.role--requester {
    color: var(--panel-ink-2);
    background: rgba(31, 42, 56, 0.05);
    border-color: rgba(31, 42, 56, 0.16);
  }
}
.poll-cell__when {
  font-size: 0.68em;
  color: var(--panel-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
