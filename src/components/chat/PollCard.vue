<template>
  <!-- A poll inside a conversation. Two kinds share the card: access
       polls ("Grant X access to Y?") and label suggestions ("Add label
       'N' under Y?" — yes plants the label in the decider's tree). The
       DECIDER (the target's owner) gets the Yes/No buttons while the
       poll is pending; everyone else sees the question + its status. The
       question is markdown, so the entity/element render as chips — the
       requester sees their own target still locked until the yes lands. -->
  <div class="poll-card" :class="'is-' + status">
    <div class="poll-card__head">
      <q-icon :name="kind === 'label' ? 'new_label' : kind === 'approval' ? 'fact_check' : 'how_to_vote'" size="15px" />
      <span>{{ kind === 'label' ? 'Label suggestion' : kind === 'approval' ? 'Approval' : 'Access poll' }}</span>
      <span class="poll-card__status">{{ status }}</span>
    </div>

    <MarkdownBody class="poll-card__q" :text="item.poll?.question || ''" ref-display="info" />

    <div v-if="canDecide" class="poll-card__actions">
      <q-btn
        unelevated dense no-caps size="sm" color="positive" icon="check"
        :label="kind === 'label' ? 'Yes — add the label' : kind === 'approval' ? 'Yes — approve' : 'Yes — grant access'"
        :loading="voting === 'yes'" :disable="!!voting"
        @click="cast('yes')"
      />
      <q-btn
        outline dense no-caps size="sm" color="negative" icon="close"
        label="No" :loading="voting === 'no'" :disable="!!voting"
        @click="cast('no')"
      />
      <!-- The transformation face's THIRD affordance (phase 7): polls
           stay strictly yes/no — Modify IS a decline, plus a fresh
           proposal by design (the host prefills the agent input). -->
      <q-btn
        v-if="isTransformation"
        outline dense no-caps size="sm" color="grey-8" icon="edit"
        label="Modify" :loading="voting === 'modify'" :disable="!!voting"
        @click="modify"
      />
    </div>
    <!-- Approved transformation, seen by its requester: the APPLY button —
         the change replays under THEIR identity, here, now. -->
    <div v-else-if="isTransformation && status === 'approved' && isDecider && !applied" class="poll-card__actions">
      <q-btn
        unelevated dense no-caps size="sm" color="primary" icon="play_arrow"
        label="Apply the transformation"
        :loading="applying" @click="applyTransformation"
      />
    </div>
    <div v-else-if="applied" class="poll-card__wait">applied ✓</div>
    <div v-else-if="canReverse" class="poll-card__actions">
      <q-btn
        outline dense no-caps size="sm" icon="undo"
        :color="status === 'granted' ? 'negative' : 'positive'"
        :label="status === 'granted' ? 'Reverse — revoke access' : 'Reverse — grant access'"
        :loading="reversing" @click="doReverse"
      />
    </div>
    <div v-else-if="status === 'pending'" class="poll-card__wait">
      {{ kind === 'approval' ? 'waiting for the decision…' : "waiting for the owner's answer…" }}
    </div>
    <div v-if="errorMsg" class="poll-card__err">{{ errorMsg }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { pollService } from 'src/services/poll.service'
import { refService } from 'src/services/ref.service'
import { transformationService } from 'src/services/transformation.service'

// The transformation face's discovery seam: the receipt chip the server
// appends to the poll QUESTION (transformService — keep in step).
const RECEIPT_RE = /\[\[pathos:(skeletons\/[0-9a-f]{16,64})\|receipt\]\]/

export default defineComponent({
  name: 'PollCard',
  components: { MarkdownBody },
  props: {
    // A chat feed item of kind 'poll' ({ id, poll: { question, status,
    // decider_id, grantee_id } }).
    item: { type: Object, required: true },
    // The viewer's entity ids (acting + root) — decider detection.
    viewerIds: { type: Array, default: () => [] },
    // Offer the decider a "reverse decision" on decided polls (the
    // profile's My-polls band; chats keep decisions read-only).
    allowReverse: { type: Boolean, default: false }
  },
  emits: ['voted', 'modify', 'applied'],
  setup (props, { emit }) {
    const voting = ref(null)
    const reversing = ref(false)
    const errorMsg = ref('')
    const localStatus = ref(null)
    const applying = ref(false)
    const applied = ref(false)

    const status = computed(() => localStatus.value || props.item.poll?.status || 'pending')
    // Kind rides the feed item (server-derived); fall back to the TARGET
    // ref for polls fetched before the server learned to send it.
    const kind = computed(() => props.item.poll?.kind ||
      (String(props.item.poll?.target_ref || '').startsWith('labels/') ? 'label' : 'access'))
    const isDecider = computed(() => props.viewerIds.includes(props.item.poll?.decider_id))
    const canDecide = computed(() => status.value === 'pending' && isDecider.value)
    // Label suggestions are one-shot — pruning the branch is the undo.
    const canReverse = computed(() =>
      props.allowReverse && isDecider.value && kind.value === 'access' &&
      (status.value === 'granted' || status.value === 'denied'))

    const cast = async (answer) => {
      voting.value = answer
      errorMsg.value = ''
      try {
        const r = await pollService.vote(props.item.id, answer)
        if (r.success) {
          localStatus.value = r.status
          emit('voted', r)
        } else {
          errorMsg.value = r.error?.message || 'vote failed'
        }
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'vote failed'
      } finally { voting.value = null }
    }

    const doReverse = async () => {
      reversing.value = true
      errorMsg.value = ''
      try {
        const r = await pollService.reverse(props.item.id)
        if (r.success) {
          localStatus.value = r.status
          emit('voted', r)
        } else {
          errorMsg.value = r.error?.message || 'reverse failed'
        }
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'reverse failed'
      } finally { reversing.value = false }
    }

    // ── the transformation face (dashboards phase 7) ───────────────
    const receiptRef = computed(() =>
      RECEIPT_RE.exec(props.item.poll?.question || '')?.[1] || null
    )
    const isTransformation = computed(() => kind.value === 'approval' && !!receiptRef.value)

    const receiptId = async () => {
      const s = await refService.summary(receiptRef.value)
      return s.success ? s.summary?.id : null
    }

    const applyTransformation = async () => {
      applying.value = true
      errorMsg.value = ''
      try {
        const id = await receiptId()
        if (id == null) throw new Error('receipt unresolvable')
        const r = await transformationService.apply(id)
        if (r.success) {
          applied.value = true
          emit('applied', r)
        } else if (r.error?.code === 40904) {
          applied.value = true
        } else {
          errorMsg.value = r.error?.message || 'apply failed'
        }
      } catch (e) {
        if (e?.response?.data?.error?.code === 40904) applied.value = true
        else errorMsg.value = e?.response?.data?.error?.message || e?.message || 'apply failed'
      } finally { applying.value = false }
    }

    // Modify = decline + fresh proposal by design: vote NO, mark the
    // receipt declined, hand the host the receipt so it can prefill the
    // agent input with the original prompt.
    const modify = async () => {
      voting.value = 'modify'
      errorMsg.value = ''
      try {
        const r = await pollService.vote(props.item.id, 'no')
        if (r.success) localStatus.value = r.status
        const id = await receiptId()
        if (id != null) await transformationService.decline(id).catch(() => {})
        emit('modify', { receiptRef: receiptRef.value, receiptId: id })
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'modify failed'
      } finally { voting.value = null }
    }

    return {
      voting,
      reversing,
      errorMsg,
      status,
      kind,
      canDecide,
      canReverse,
      cast,
      doReverse,
      isDecider,
      isTransformation,
      applying,
      applied,
      applyTransformation,
      modify
    }
  }
})
</script>

<style lang="scss" scoped>
.poll-card {
  align-self: center;
  width: min(86%, 480px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  border: 1px dashed rgba(#9b6cb0, 0.5);
  border-radius: 12px;
  background: rgba(#9b6cb0, 0.06);

  &.is-granted,
  &.is-accepted,
  &.is-approved { border-color: rgba(#21ba45, 0.55); background: rgba(#21ba45, 0.05); }
  &.is-denied,
  &.is-declined { border-color: rgba(#c10015, 0.45); background: rgba(#c10015, 0.04); }
}

.poll-card__head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9b6cb0;

  .is-granted &,
  .is-accepted &,
  .is-approved & { color: #1a9436; }
  .is-denied &,
  .is-declined & { color: #a5121f; }
}
.poll-card__status {
  margin-left: auto;
  font-size: 0.9em;
  padding: 1px 8px;
  border-radius: 9px;
  border: 1px solid currentColor;
}

.poll-card__q {
  font-size: 0.85em;
  :deep(p) { margin: 0; }
}

.poll-card__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.poll-card__wait { font-size: 0.7em; color: var(--ink-mute, #8995a8); text-align: right; }
.poll-card__err { font-size: 0.7em; color: var(--q-negative, #c10015); text-align: right; }
</style>
