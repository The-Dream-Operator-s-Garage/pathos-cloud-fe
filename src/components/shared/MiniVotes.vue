<template>
  <!-- ── THE FAMILY'S VOTES (2026-11-04, user ask: "attach the voting section
       on the footer of the family … use thumbs up and down for voting icons
       instead of arrows"). Two thumbs at the foot's right end, each with its
       own tally — the comment card's up / score / down panel
       (PostCommentItem's `.vote-panel`), said in the foot's size. The
       viewer's own vote is the FILLED thumb (`thumb_up` vs `thumb_up_off_alt`),
       tinted; a second press on it takes the vote back. Optimistic, rolled
       back on a refused write. Reads its tally itself (`GET /skeletons/:id/
       votes`) unless the host hands `votes` ({ up, down, viewer_vote }).
       Skeletons only (posts, comments, forks) — the one kind with a vote
       read; a press never reaches the panel under it (`@click.stop`). -->
  <span class="mini-votes" :title="title" @click.stop @mousedown.stop>
    <button
      type="button"
      class="mini-votes__btn is-up"
      :class="{ 'is-on': mine === 'UP' }"
      :aria-pressed="mine === 'UP'"
      :aria-label="mine === 'UP' ? 'Take back your thumbs up' : 'Thumbs up'"
      :disabled="busy"
      @click.stop.prevent="cast('UP')"
    >
      <q-icon :name="mine === 'UP' ? 'thumb_up' : 'thumb_up_off_alt'" size="11px" />
      <span class="mini-votes__n">{{ up }}</span>
    </button>
    <button
      type="button"
      class="mini-votes__btn is-down"
      :class="{ 'is-on': mine === 'DOWN' }"
      :aria-pressed="mine === 'DOWN'"
      :aria-label="mine === 'DOWN' ? 'Take back your thumbs down' : 'Thumbs down'"
      :disabled="busy"
      @click.stop.prevent="cast('DOWN')"
    >
      <q-icon :name="mine === 'DOWN' ? 'thumb_down' : 'thumb_down_off_alt'" size="11px" />
      <span class="mini-votes__n">{{ down }}</span>
    </button>
  </span>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { skeletonService } from 'src/services/skeleton.service'

export default defineComponent({
  name: 'MiniVotes',
  props: {
    // The element voted on — a skeleton's row id.
    id: { type: [Number, String], required: true },
    // Optional tally the host already holds: { up, down, viewer_vote }.
    votes: { type: Object, default: null }
  },
  setup (props) {
    const up = ref(0)
    const down = ref(0)
    const mine = ref(null)
    const busy = ref(false)

    const adopt = (v) => {
      up.value = parseInt(v?.up, 10) || 0
      down.value = parseInt(v?.down, 10) || 0
      mine.value = v?.viewer_vote || null
    }
    const read = async () => {
      if (props.votes) { adopt(props.votes); return }
      try {
        const r = await skeletonService.getVotes(props.id)
        if (r?.success) adopt(r.votes)
      } catch (_) { /* a tally that cannot be read stays 0 / 0 */ }
    }
    onMounted(read)
    watch(() => props.id, read)

    const cast = async (direction) => {
      if (busy.value) return
      busy.value = true
      const prior = { up: up.value, down: down.value, mine: mine.value }
      try {
        if (mine.value === direction) {
          mine.value = null
          if (direction === 'UP') up.value--; else down.value--
          await skeletonService.unvote(props.id)
        } else {
          if (mine.value === 'UP') up.value--
          if (mine.value === 'DOWN') down.value--
          if (direction === 'UP') up.value++; else down.value++
          mine.value = direction
          await skeletonService.vote(props.id, direction)
        }
      } catch (_) {
        up.value = prior.up
        down.value = prior.down
        mine.value = prior.mine
      }
      busy.value = false
    }

    const title = computed(() => `${up.value} up · ${down.value} down` +
      (mine.value ? ` · you voted ${mine.value === 'UP' ? 'up' : 'down'}` : ''))

    return { up, down, mine, busy, cast, title }
  }
})
</script>

<style lang="scss" scoped>
// The foot's own size and ink (MiniFoot's 0.7em line); the thumbs dim until
// pressed, the viewer's own vote filled and tinted.
.mini-votes {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.mini-votes__btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 16px;
  padding: 0 4px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  opacity: 0.72;
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: opacity 0.12s, background-color 0.12s, color 0.12s;
  &:hover:not(:disabled) { opacity: 1; background: rgba(var(--ink-rgb), 0.07); }
  &:disabled { cursor: progress; }
  &.is-on { opacity: 1; }
  &.is-up.is-on { color: var(--green-8, #388e3c); }
  &.is-down.is-on { color: var(--red-8, #c62828); }
}
.mini-votes__n { min-width: 0.6em; text-align: left; }
</style>
