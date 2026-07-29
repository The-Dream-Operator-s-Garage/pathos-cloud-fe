<template>
  <div
    class="comment"
    :class="['depth-' + Math.min(depth, 4), { 'is-unravel-target': isUnravelTarget }]"
    ref="rootEl"
  >
    <div class="comment-row">

      <!-- LEFT: comment body -->
      <div class="comment-main">
        <!-- Header: author + provenance + time -->
        <div class="row items-center no-wrap" style="gap:8px; font-size:0.78em;">
          <EntityName class="text-ink" :entity="child.author" :id="child.owner_id" />
          <span v-if="child.provenance === 'FORK'" class="text-coral mono" style="font-size:0.9em;">(fork)</span>
          <q-space />
          <SkeletonRefLinks :id="child.id" />
          <span class="text-dim" style="font-size:0.86em;" :title="child.created_at">{{ formatTime(child.created_at) }}</span>
        </div>

        <!-- Labels attached to this comment -->
        <LabelScroll v-if="child.labels && child.labels.length" :labels="child.labels" class="q-mt-xs" />

        <!-- Excerpt body -->
        <div v-if="child.excerpt" class="comment-body q-mt-xs">
          {{ child.excerpt }}<span v-if="child.excerpt.length >= 280">…</span>
        </div>

        <!-- Reply / Fork actions -->
        <div class="row items-center q-mt-xs" style="gap:14px; font-size:0.74em;">
          <button v-if="!replyOpen && !forkOpen" class="bare-btn text-coral" @click="openReply">
            <q-icon name="chat_bubble_outline" size="11px" class="q-mr-xs" />comment
          </button>
          <button v-if="!replyOpen && !forkOpen" class="bare-btn text-coral" @click="openFork">
            <q-icon name="alt_route" size="11px" class="q-mr-xs" />fork
          </button>
          <button
            v-if="totalChildCount > 0 || repliesLoaded"
            class="bare-btn text-dim"
            @click="toggleReplies"
          >
            <q-icon :name="repliesOpen ? 'expand_less' : 'expand_more'" size="11px" class="q-mr-xs" />
            {{ totalChildCount }} {{ totalChildCount === 1 ? 'comment / fork' : 'comments / forks' }}
          </button>
        </div>
      </div>

      <!-- RIGHT: vote panel (up / score / down) -->
      <aside class="vote-panel" :title="voteScoreTitle">
        <button
          class="vote-btn"
          :class="{ active: localVote === 'UP' }"
          :disabled="voting"
          title="Vote up"
          @click="castVote('UP')"
        >
          <q-icon name="arrow_drop_up" size="22px" />
        </button>
        <span class="vote-score" :class="scoreClass">{{ voteScore }}</span>
        <button
          class="vote-btn"
          :class="{ active: localVote === 'DOWN' }"
          :disabled="voting"
          title="Vote down"
          @click="castVote('DOWN')"
        >
          <q-icon name="arrow_drop_down" size="22px" />
        </button>
      </aside>
    </div>

    <!-- Inline reply form — the SAME post-maker surface as the footer
         dock, embedded. The draft it edits is a real maker-store tab, so
         closing here keeps the in-progress comment reachable from the
         footer post maker until it's posted. -->
    <div v-if="replyOpen" ref="replyFormEl" class="reply-form q-mt-sm">
      <PostMakerSurface
        embed
        :draft-id="replyDraftId"
        @close="cancelReply"
        @posted="onReplyMade"
      />
    </div>

    <!-- Inline fork confirmation — content is copied automatically by the
         API; you land on the new fork ready to iterate on. -->
    <div v-if="forkOpen" ref="forkFormEl" class="reply-form q-mt-sm">
      <ForkConfirmPanel
        :kind="child.provenance === 'FORK' ? 'fork' : 'comment'"
        :loading="sending"
        @cancel="cancelFork"
        @confirm="sendFork"
      />
    </div>

    <!-- Nested replies — comments AND forks of this comment, each a full
         PostCommentItem so the tree unravels recursively at any depth. -->
    <div v-if="repliesOpen" class="nested-replies q-mt-sm">
      <div v-if="loadingReplies" class="text-dim q-py-sm" style="font-size:0.8em;">
        <q-spinner size="14px" /> loading…
      </div>
      <PostCommentItem
        v-for="r in nestedReplies"
        :key="r.id"
        :child="r"
        :depth="depth + 1"
        :unravel-path="nestedUnravel"
        @reply-posted="onNestedReplyPosted"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, inject, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { skeletonService } from 'src/services/skeleton.service'
import SkeletonRefLinks from 'src/components/shared/SkeletonRefLinks.vue'
import LabelScroll from 'src/components/labels/LabelScroll.vue'
import PostMakerSurface from 'src/components/maker/PostMakerSurface.vue'
import ForkConfirmPanel from 'src/components/nodes/ForkConfirmPanel.vue'
import EntityName from 'src/components/entities/EntityName.vue'
import { useMakerStore } from 'src/stores/maker'
import { hashOf } from 'src/utils/kinds'

const formatTime = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm'
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs + 'h'
    const days = Math.floor(hrs / 24)
    if (days < 7) return days + 'd'
    return d.toLocaleDateString()
  } catch (_) { return iso }
}

export default defineComponent({
  name: 'PostCommentItem',
  components: { SkeletonRefLinks, LabelScroll, PostMakerSurface, ForkConfirmPanel, EntityName },
  props: {
    child: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    // Thread-unravel chain: when this item's id heads the chain, it
    // auto-expands its replies (more ids below) or highlights itself
    // (chain end — the comment the user navigated to).
    unravelPath: { type: Array, default: () => [] }
  },
  emits: ['reply-posted'],
  setup (props, { emit }) {
    const router = useRouter()
    const makerStore = useMakerStore()
    const rootEl = ref(null)
    const replyOpen = ref(false)
    const replyDraftId = ref(null)
    const forkOpen = ref(false)
    const repliesOpen = ref(false)
    const repliesLoaded = ref(false)
    const loadingReplies = ref(false)
    const nestedReplies = ref([])
    const sending = ref(false)

    // Refs to the inline reply / fork form wrappers — used when
    // requesting the BottomSplitter to grow so the just-opened form
    // is fully visible above the splitter's footer.
    const replyFormEl = ref(null)
    const forkFormEl = ref(null)

    // Injected by the host viewer (PostViewer / NodeDetail / PathViewer)
    // when this comment is rendered inside a BottomSplitter. No-ops
    // when PostCommentItem is used outside a splitter context.
    const expandBottomPane = inject('expandBottomPane', () => {})
    const releaseBottomPane = inject('releaseBottomPane', () => {})

    // Chrome budget when growing the splitter for an inline form:
    // grip + tabs + buffer so context above the form stays in view.
    const INLINE_FORM_CHROME_PX = 200

    const requestSplitterRoom = async (formRef) => {
      await nextTick()
      const h = formRef.value?.offsetHeight || 280
      expandBottomPane(h + INLINE_FORM_CHROME_PX)
      // Bring the form into view in whichever scroll container hosts
      // it so the user lands directly on the editor after expansion.
      formRef.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }

    // Vote state — seeded from the enriched comment row so the panel
    // renders the correct counts + viewer's prior pick on first paint.
    const initialVotes = props.child.votes || { up: 0, down: 0, viewer_vote: null }
    const localUp = ref(parseInt(initialVotes.up) || 0)
    const localDown = ref(parseInt(initialVotes.down) || 0)
    const localVote = ref(initialVotes.viewer_vote || null)
    const voting = ref(false)

    const voteScore = computed(() => localUp.value - localDown.value)
    const scoreClass = computed(() => {
      if (localVote.value === 'UP') return 'is-up'
      if (localVote.value === 'DOWN') return 'is-down'
      return ''
    })
    const voteScoreTitle = computed(() =>
      `${localUp.value} up · ${localDown.value} down` +
      (localVote.value ? ` · you voted ${localVote.value.toLowerCase()}` : '')
    )

    const castVote = async (direction) => {
      if (voting.value) return
      voting.value = true
      // Optimistic update — roll back on failure.
      const priorVote = localVote.value
      const priorUp = localUp.value
      const priorDown = localDown.value
      try {
        if (priorVote === direction) {
          // Toggle off
          localVote.value = null
          if (direction === 'UP') localUp.value--; else localDown.value--
          await skeletonService.unvote(props.child.id)
        } else {
          if (priorVote === 'UP') localUp.value--
          if (priorVote === 'DOWN') localDown.value--
          if (direction === 'UP') localUp.value++
          if (direction === 'DOWN') localDown.value++
          localVote.value = direction
          await skeletonService.vote(props.child.id, direction)
        }
      } catch (_) {
        localVote.value = priorVote
        localUp.value = priorUp
        localDown.value = priorDown
      }
      voting.value = false
    }

    // The child tree = the comment's own COMMENTS thread PLUS its direct
    // forks, so both trees unravel recursively from any node.
    const totalChildCount = computed(() =>
      (parseInt(props.child.reply_count) || 0) + (parseInt(props.child.fork_count) || 0)
    )

    const loadReplies = async () => {
      if (repliesLoaded.value) return
      loadingReplies.value = true
      try {
        const [cr, fr] = await Promise.all([
          skeletonService.listChildren(props.child.id).catch(() => ({ children: [] })),
          skeletonService.listForks(props.child.id).catch(() => ({ forks: [] }))
        ])
        const seen = new Set()
        const merged = []
        for (const row of [...(cr.children || []), ...(fr.forks || [])]) {
          if (seen.has(row.id)) continue
          seen.add(row.id)
          merged.push(row)
        }
        nestedReplies.value = merged
        repliesLoaded.value = true
      } catch (_) { nestedReplies.value = [] }
      loadingReplies.value = false
    }

    const toggleReplies = async () => {
      repliesOpen.value = !repliesOpen.value
      if (repliesOpen.value) await loadReplies()
    }

    const openReply = () => {
      // The reply is a maker-store draft parented to THIS comment — the
      // footer post maker shows it as a tab until it's posted.
      const excerpt = (props.child.excerpt || '').trim().slice(0, 40)
      const d = makerStore.openCommentDraft({
        kind: 'comment',
        id: props.child.id,
        hash: hashOf(props.child.path || ''),
        route: `/posts/${props.child.id}`,
        label: excerpt || `comment #${props.child.id}`
      })
      replyDraftId.value = d.id
      replyOpen.value = true
      forkOpen.value = false
      requestSplitterRoom(replyFormEl)
    }
    const openFork = () => {
      forkOpen.value = true
      replyOpen.value = false
      requestSplitterRoom(forkFormEl)
    }

    const cancelReply = () => {
      if (replyDraftId.value) makerStore.parkDraft(replyDraftId.value)
      replyOpen.value = false
      releaseBottomPane()
    }
    const cancelFork = () => { forkOpen.value = false; releaseBottomPane() }

    // The embedded surface posted the comment — refresh this subtree.
    const onReplyMade = async () => {
      replyDraftId.value = null
      replyOpen.value = false
      releaseBottomPane()
      repliesLoaded.value = false
      await loadReplies()
      repliesOpen.value = true
      emit('reply-posted')
    }

    // Snapshot fork — content is copied from this comment automatically.
    // After success we land on the new fork so the owner can iterate via
    // the existing draft+promote flow (each save chains a new version).
    const sendFork = async () => {
      if (sending.value) return
      sending.value = true
      try {
        const r = await skeletonService.forkOf(props.child.id, {})
        if (r.success) {
          forkOpen.value = false
          releaseBottomPane()
          emit('reply-posted')
          const forked = r.skeleton || r.post
          if (forked?.id) router.push('/posts/' + forked.id)
        }
      } catch (_) { /* swallow */ }
      sending.value = false
    }

    const onNestedReplyPosted = async () => {
      repliesLoaded.value = false
      await loadReplies()
    }

    // ── Thread unravel ──────────────────────────────────────
    // When this item heads the chain: more ids below → auto-expand the
    // replies and hand the rest down; chain end → this is the comment the
    // user navigated to, halo it and scroll it into view.
    const isUnravelTarget = ref(false)
    const nestedUnravel = computed(() =>
      props.unravelPath[0] === props.child.id ? props.unravelPath.slice(1) : []
    )

    watch(() => props.unravelPath, async (chain) => {
      if (!chain.length || chain[0] !== props.child.id) return
      if (chain.length > 1) {
        if (!repliesOpen.value) {
          repliesOpen.value = true
          await loadReplies()
        }
      } else {
        isUnravelTarget.value = true
        await nextTick()
        rootEl.value?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }, { immediate: true })

    return {
      rootEl,
      replyOpen,
      replyDraftId,
      forkOpen,
      repliesOpen,
      repliesLoaded,
      loadingReplies,
      nestedReplies,
      totalChildCount,
      sending,
      replyFormEl,
      forkFormEl,
      openReply,
      openFork,
      toggleReplies,
      cancelReply,
      cancelFork,
      onReplyMade,
      sendFork,
      onNestedReplyPosted,
      isUnravelTarget,
      nestedUnravel,
      formatTime,
      // votes
      localUp,
      localDown,
      localVote,
      voting,
      voteScore,
      scoreClass,
      voteScoreTitle,
      castVote
    }
  }
})
</script>

<style lang="scss" scoped>
// Matches the unified content card aesthetic: same off-white surface,
// same border-token, same radius — just left-accent striping for depth.
.comment {
  padding: 12px 14px;
  border: 1px solid #e2e6ed;
  border-left: 3px solid #c8d0dc;
  margin: 8px 0;
  background: #fafbfd;
  border-radius: var(--radius-sm);
  color: #2C3D4E;
}
.comment.depth-1 { margin-left: 16px; background: #f4f7fb; border-left-color: #b9c2d2; }
.comment.depth-2 { margin-left: 32px; background: #eef2f7; border-left-color: #a6b1c6; }
.comment.depth-3 { margin-left: 48px; background: #e8edf4; border-left-color: #94a1ba; }
.comment.depth-4 { margin-left: 64px; background: #e2e8f0; border-left-color: #8493ae; }

// Thread-unravel destination — the luminous-yellow return halo the
// StateHolder uses for [data-nav-focus], so "navigated here" reads the
// same everywhere.
.comment.is-unravel-target {
  border-left-color: #e8c34a;
  box-shadow: 0 0 0 2px rgba(232, 195, 74, 0.55), 0 0 14px rgba(232, 195, 74, 0.35);
  animation: unravel-halo 2.4s ease-out 1.2s forwards;
}
@keyframes unravel-halo {
  to { box-shadow: 0 0 0 0 rgba(232, 195, 74, 0), 0 0 0 rgba(232, 195, 74, 0); }
}

.comment :deep(strong) { color: #1F2A38; }
.comment :deep(.text-ink) { color: #1F2A38 !important; }
.comment :deep(.text-dim) { color: #6b7993 !important; opacity: 1; }
.comment :deep(.text-coral) { color: #d35f5f !important; }
.comment :deep(.mono) { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace; }

.comment-body {
  font-size: 0.9em;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  padding: 6px 0 2px;
}

.bare-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  font-size: inherit;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  color: inherit;
  &:hover { text-decoration: underline; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.reply-form { padding: 6px 0; }
.fork-form .fork-hint {
  font-size: 0.78em;
  color: #6b7993;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}
.reply-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 0.92em;
  padding: 10px 12px;
  border: 1px solid #c8d0dc;
  border-radius: var(--radius-sm);
  background: #ffffff;
  resize: vertical;
  color: #1F2A38;
  line-height: 1.5;
  &::placeholder { color: #8995a8; }
  &:focus { outline: none; border-color: #d35f5f; box-shadow: 0 0 0 2px rgba(211, 95, 95, 0.18); }
}

.nested-replies {
  margin-top: 4px;
}

.open-link {
  text-decoration: none;
  &:hover { color: #d35f5f; }
}

// ── Two-column comment row: body + vote panel ────────────
// The vote panel sits flush against the right edge so every comment in a
// thread aligns its votes in a vertical strip — easy to scan.
.comment-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.comment-main {
  flex: 1 1 auto;
  min-width: 0;
}

.vote-panel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 4px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid #e2e6ed;
  min-width: 30px;
}

.vote-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 22px;
  background: transparent;
  border: none;
  color: #8995a8;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  transition: background 0.10s, color 0.10s;

  &:hover { background: rgba(0,0,0,0.05); color: #2C3D4E; }
  &:disabled { opacity: 0.4; cursor: wait; }

  &.active {
    color: #d35f5f;
    background: rgba(211, 95, 95, 0.08);
  }
}

.vote-score {
  font-family: 'Space Mono', monospace;
  font-size: 0.78em;
  font-weight: 600;
  color: #5b6c82;
  line-height: 1;
  min-width: 18px;
  text-align: center;

  &.is-up   { color: #d35f5f; }
  &.is-down { color: #4a6fa5; }
}
</style>
