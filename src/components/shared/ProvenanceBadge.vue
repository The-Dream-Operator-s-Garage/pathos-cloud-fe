<template>
  <span
    v-if="state !== 'hidden'"
    class="provenance-badge"
    :class="`provenance-badge--${state}`"
    :title="title"
    @click.stop="state === 'verified' ? download() : null"
  >
    <q-spinner v-if="state === 'verifying'" size="11px" />
    <q-icon v-else-if="state === 'verified'" name="verified_user" size="12px" />
    <q-icon v-else-if="state === 'invalid'" name="gpp_bad" size="12px" />
    <q-icon v-else name="shield" size="12px" />
    {{ label }}
  </span>
</template>

<script>
// Provenance badge — FileContractBadge's general sibling (Thread B). Where
// the contract badge asks "are the BYTES behind this FILE node intact?",
// this one asks "does this element's CHAIN story hold?" — protobuf on
// disk, hash re-derivation, Ed25519 signature, author's current key
// (GET /api/verify/<kind>/<hash>). Three visible verdicts:
//
//   verified   — signed and every cross-check holds (click: download the
//                portable bundle for the offline verifier)
//   unsigned   — pre-truth-spine element (or SQL-only 'unchained' row):
//                consistent, but only the server vouches. Muted, not red —
//                history is not damage.
//   chain broken — INVALID: something contradicts. This is the loud one.
//
// Drafts and transport failures hide the badge (no verdict ≠ a verdict),
// matching FileContractBadge's rule. Only paths/links/nodes verify.
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { verifyService } from 'src/services/verify.service'

const VERIFIABLE = /^(paths|links|nodes)\/[0-9a-f]{64}$/

export default defineComponent({
  name: 'ProvenanceBadge',
  props: {
    // '<kind>/<hash>' — the element's canonical address.
    refPath: { type: String, default: null }
  },
  setup (props) {
    const state = ref('hidden') // verifying | verified | unsigned | invalid | hidden
    const checks = ref(null)

    const label = computed(() => {
      if (state.value === 'verifying') return 'verifying'
      if (state.value === 'verified') return 'chain verified'
      if (state.value === 'invalid') return 'chain broken'
      return 'unsigned'
    })

    const title = computed(() => {
      if (state.value === 'verified') {
        return 'Signed by its author’s key and every cross-check holds — click to download the bundle and verify it yourself, offline'
      }
      if (state.value === 'invalid') {
        const why = checks.value?.signature_reason || (checks.value?.protobuf !== 'ok' ? 'chain file missing or unreadable' : 'a cross-check failed')
        return `This element’s chain story does not hold (${why})`
      }
      if (state.value === 'unsigned') {
        return 'Minted before the truth spine — consistent, but only the server vouches for it'
      }
      return ''
    })

    const load = async () => {
      if (!props.refPath || !VERIFIABLE.test(props.refPath)) { state.value = 'hidden'; return }
      state.value = 'verifying'
      try {
        const { verify } = await verifyService.verify(props.refPath)
        checks.value = verify.checks
        if (verify.status === 'verified') state.value = 'verified'
        else if (verify.status === 'invalid') state.value = 'invalid'
        else if (verify.status === 'unsigned-legacy' || verify.status === 'unchained') state.value = 'unsigned'
        else state.value = 'hidden' // draft, not-found
      } catch {
        state.value = 'hidden'
      }
    }

    const download = () => verifyService.downloadBundle(props.refPath).catch(() => {})

    onMounted(load)
    watch(() => props.refPath, load)

    return { state, label, title, download }
  }
})
</script>

<style lang="scss" scoped>
// Same carved-chip relief as FileContractBadge — mint for a holding chain,
// red for a broken one, and a FLAT muted chip for unsigned history (legacy
// is a fact, not an alarm; it gets no relief treatment).
.provenance-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  vertical-align: middle;
  user-select: none;
}

.provenance-badge--verifying {
  color: #7a8a99;
  border-color: rgba(122, 138, 153, 0.35);
}

.provenance-badge--unsigned {
  color: #7a8a99;
  border-color: rgba(122, 138, 153, 0.45);
  background: rgba(122, 138, 153, 0.08);
}

.provenance-badge--verified {
  cursor: pointer;
  background: linear-gradient(160deg,
    #a8e6db 0%, #5ecab8 35%, #2bab89 58%, #57c5b2 80%, #1d8f77 100%);
  border-color: #0f7a64;
  color: #073f33;
  text-shadow:
    0 -1px 0 rgba(4, 48, 39, 0.45),
    0 1px 0 rgba(214, 250, 243, 0.85);
  box-shadow:
    inset 0 1px 1px rgba(224, 252, 246, 0.8),
    inset 0 -1px 2px rgba(6, 64, 52, 0.4),
    0 1px 3px rgba(6, 64, 52, 0.22);

  .q-icon {
    color: #06493b;
    filter: drop-shadow(0 1px 0 rgba(214, 250, 243, 0.85));
  }
}

.provenance-badge--invalid {
  background: linear-gradient(160deg,
    #f6b0a8 0%, #e5695c 35%, #c93a2c 58%, #e0604f 80%, #a52618 100%);
  border-color: #8f1f13;
  color: #4a0d06;
  text-shadow:
    0 -1px 0 rgba(58, 8, 3, 0.5),
    0 1px 0 rgba(255, 224, 219, 0.85);
  box-shadow:
    inset 0 1px 1px rgba(255, 230, 226, 0.8),
    inset 0 -1px 2px rgba(90, 15, 6, 0.4),
    0 1px 3px rgba(90, 15, 6, 0.22);

  .q-icon {
    color: #5c1109;
    filter: drop-shadow(0 1px 0 rgba(255, 224, 219, 0.85));
  }
}
</style>
