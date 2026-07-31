<template>
  <!-- The CLAIM READER BAND (Thread D reader surface, docs/concepts/
       claims.md) — mounted by SkeletonPage above a CLAIM instance's
       structure view. The structure table stays the element's truth;
       this band is the ARGUMENT read: statement + status, the author's
       stated confidence, the evidence tree, the live tally, and the
       stance controls (endorse free; dispute demands a ref — the form
       enforces what good-faith argument looks like; retract author-only
       and terminal). -->
  <section v-if="claim" class="claim-band">
    <header class="claim-band__head">
      <q-icon name="gavel" size="16px" class="claim-band__glyph" />
      <span class="claim-band__kind">claim</span>
      <span class="claim-band__status" :class="'status-' + claim.status">{{ claim.status }}</span>
      <ProvenanceBadge :ref-path="spineRef" />
      <q-space />
      <span class="claim-band__tally" title="endorsements">
        <q-icon name="thumb_up" size="12px" /> {{ claim.votes.endorse }}
      </span>
      <span class="claim-band__tally" title="disputes">
        <q-icon name="thumb_down" size="12px" /> {{ claim.votes.dispute }}
      </span>
    </header>

    <div class="claim-band__statement">
      <MarkdownBody :text="claim.statement || ''" ref-display="info" />
    </div>

    <div v-if="claim.confidence" class="claim-band__confidence">
      <q-icon name="speed" size="12px" class="q-mr-xs" />
      author's stated confidence: <em>{{ claim.confidence }}</em>
    </div>

    <div v-if="claim.evidence.length" class="claim-band__evidence">
      <div class="claim-band__evidence-head">
        <q-icon name="account_tree" size="13px" class="q-mr-xs" />
        Evidence ({{ claim.evidence.length }})
      </div>
      <ClaimEvidenceNode
        v-for="ev in claim.evidence"
        :key="ev"
        :ref-address="ev"
        :depth="0"
      />
    </div>
    <div v-else class="claim-band__evidence claim-band__evidence--empty">
      <q-icon name="account_tree" size="13px" class="q-mr-xs" />
      This claim cites no evidence.
    </div>

    <!-- Stage 2 — the disagreement topology: renders only when the claim
         has edges (disputed by / stands against / cited as support).
         Re-keyed on every vote so the graph follows the argument. -->
    <ClaimTopology :key="topoKey" :claim-id="claimId" />

    <!-- Stance controls. Authors retract; readers endorse or dispute
         (one live stance each — revoting replaces). -->
    <footer class="claim-band__actions">
      <template v-if="!isAuthor && claim.status !== 'retracted'">
        <q-btn
          unelevated dense no-caps size="sm" icon="thumb_up"
          :color="claim.votes.mine === 'endorse' ? 'positive' : 'grey-7'"
          :label="claim.votes.mine === 'endorse' ? 'endorsed' : 'endorse'"
          :loading="voting === 'endorse'"
          :disable="claim.votes.mine === 'endorse'"
          @click="endorse"
        />
        <q-btn
          outline dense no-caps size="sm" icon="thumb_down"
          :color="claim.votes.mine === 'dispute' ? 'negative' : 'grey-7'"
          :label="claim.votes.mine === 'dispute' ? 'disputed' : 'dispute'"
          @click="disputeOpen = !disputeOpen"
        />
      </template>
      <q-btn
        v-if="isAuthor && claim.status !== 'retracted'"
        outline dense no-caps size="sm" color="negative" icon="undo"
        label="retract"
        :loading="retracting"
        title="Terminal — a retracted claim never comes back"
        @click="confirmRetract"
      />
      <span v-if="claim.status === 'retracted'" class="claim-band__retracted-note">
        retracted by its author — terminal
      </span>
      <span v-if="error" class="claim-band__error">{{ error }}</span>
    </footer>

    <!-- The dispute form: no evidence-free objections — the ref is
         mandatory (server refuses without it, 40004). -->
    <div v-if="disputeOpen" class="claim-band__dispute">
      <!-- :dark="false" — the app runs Quasar dark globally, but this band
           is a light panel; without the override the input ink is white. -->
      <q-input
        v-model="disputeRef"
        dense outlined :dark="false"
        placeholder="evidence ref — kind/hash, e.g. nodes/ab12…"
        class="mono"
      >
        <template #prepend><q-icon name="link" size="14px" /></template>
      </q-input>
      <q-input
        v-model="disputeNote"
        dense outlined :dark="false" autogrow
        placeholder="why this evidence disputes the claim (optional)"
      />
      <div class="row items-center" style="gap:8px;">
        <q-btn
          unelevated dense no-caps size="sm" color="negative" icon="thumb_down"
          label="dispute with this evidence"
          :loading="voting === 'dispute'"
          :disable="!disputeRef.trim()"
          @click="dispute"
        />
        <span class="claim-band__dispute-hint">
          a dispute must stand on a resolvable element — it lands as a comment and notifies the author
        </span>
      </div>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { claimService } from 'src/services/claim.service'
import { useAuthStore } from 'src/stores/auth'
import { hashOf } from 'src/utils/kinds'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import ProvenanceBadge from 'src/components/shared/ProvenanceBadge.vue'
import ClaimEvidenceNode from './ClaimEvidenceNode.vue'
import ClaimTopology from './ClaimTopology.vue'

export default defineComponent({
  name: 'ClaimBand',
  components: { MarkdownBody, ProvenanceBadge, ClaimEvidenceNode, ClaimTopology },
  props: {
    claimId: { type: Number, required: true },
    ownerId: { type: Number, default: null }
  },
  emits: ['changed'],
  setup (props, { emit }) {
    const $q = useQuasar()
    const auth = useAuthStore()

    const claim = ref(null)
    const voting = ref(null) // 'endorse' | 'dispute' while in flight
    const retracting = ref(false)
    const disputeOpen = ref(false)
    const disputeRef = ref('')
    const disputeNote = ref('')
    const error = ref('')
    const topoKey = ref(0) // bumped on vote/retract — remounts the topology band

    const isAuthor = computed(() => auth.entityId != null && auth.entityId === props.ownerId)

    // The claim's spine IS a path — that is the ref Thread B verifies
    // (docs/concepts/claims.md: GET /api/verify/paths/<hash>).
    const spineRef = computed(() =>
      claim.value?.path ? `paths/${hashOf(claim.value.path)}` : null)

    const load = async () => {
      error.value = ''
      try {
        const r = await claimService.get(props.claimId)
        if (r?.success) claim.value = r.claim
      } catch (_) { claim.value = null }
    }
    onMounted(load)
    watch(() => props.claimId, load)

    const _vote = async (payload) => {
      error.value = ''
      voting.value = payload.stance
      try {
        const r = await claimService.vote(props.claimId, payload)
        if (r?.success) {
          disputeOpen.value = false
          disputeRef.value = ''
          disputeNote.value = ''
          await load()
          topoKey.value += 1
          emit('changed')
        } else {
          error.value = r?.error?.message || 'vote failed'
        }
      } catch (e) {
        error.value = e?.response?.data?.error?.message || 'vote failed'
      }
      voting.value = null
    }

    const endorse = () => _vote({ stance: 'endorse' })
    const dispute = () => _vote({
      stance: 'dispute',
      ref: disputeRef.value.trim(),
      note: disputeNote.value.trim()
    })

    const confirmRetract = () => {
      $q.dialog({
        title: 'Retract this claim?',
        message: 'Retraction is terminal — the claim keeps its history but never reopens.',
        cancel: true,
        persistent: false
      }).onOk(async () => {
        retracting.value = true
        try {
          const r = await claimService.retract(props.claimId)
          if (r?.success) {
            await load()
            topoKey.value += 1
            emit('changed')
          } else {
            error.value = r?.error?.message || 'retract failed'
          }
        } catch (e) {
          error.value = e?.response?.data?.error?.message || 'retract failed'
        }
        retracting.value = false
      })
    }

    return {
      claim,
      isAuthor,
      spineRef,
      voting,
      retracting,
      disputeOpen,
      disputeRef,
      disputeNote,
      error,
      topoKey,
      endorse,
      dispute,
      confirmRetract
    }
  }
})
</script>

<style lang="scss" scoped>
// Same panel tokens as .subject-panel so the band reads as part of the
// viewer family, not a foreign widget.
.claim-band {
  background: #ffffff;
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  margin-bottom: 16px;
  overflow: hidden;
}

.claim-band__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #f4f7fb;
  border-bottom: 1px solid #e2e6ed;
}
.claim-band__glyph { color: #5b6c82; }
.claim-band__kind {
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8995a8;
  font-weight: 700;
}

// STATUS pill — the shared claim palette (InfoChip pill, MicroChip dot).
.claim-band__status {
  padding: 1px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.66em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  &.status-open      { background: #5b6c82; }
  &.status-supported { background: #2e6a3a; }
  &.status-disputed  { background: #a03d3d; }
  &.status-retracted { background: #8995a8; text-decoration: line-through; }
}

.claim-band__tally {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74em;
  color: #5b6c82;
  & + .claim-band__tally { margin-left: 10px; }
}

.claim-band__statement {
  padding: 12px 14px 4px;
  color: #1F2A38;
  // The statement is the headline of the band — read it at full size.
  :deep(.markdown-body) { color: #1F2A38; font-size: 0.95em; }
}

.claim-band__confidence {
  display: flex;
  align-items: center;
  padding: 0 14px 8px;
  font-size: 0.76em;
  color: #6b7993;
  em { margin-left: 4px; font-style: normal; font-weight: 600; color: #2C3D4E; }
}

.claim-band__evidence {
  margin: 0 14px 10px;
  padding: 8px 10px;
  background: #f6f8fb;
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-sm, 7px);
}
.claim-band__evidence--empty {
  display: flex;
  align-items: center;
  color: #8995a8;
  font-size: 0.78em;
}
.claim-band__evidence-head {
  display: flex;
  align-items: center;
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8995a8;
  font-weight: 700;
  margin-bottom: 6px;
}

.claim-band__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 12px;
}
.claim-band__retracted-note { font-size: 0.76em; color: #8995a8; }
.claim-band__error { font-size: 0.76em; color: #a03d3d; }

.claim-band__dispute {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 14px 14px;
  padding: 10px;
  background: rgba(#a03d3d, 0.05);
  border: 1px dashed rgba(#a03d3d, 0.35);
  border-radius: var(--radius-sm, 7px);
}
.claim-band__dispute-hint { font-size: 0.72em; color: #6b7993; }
</style>
