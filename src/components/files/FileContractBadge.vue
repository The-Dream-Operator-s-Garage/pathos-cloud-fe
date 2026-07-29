<template>
  <span
    v-if="state !== 'hidden'"
    class="contract-badge"
    :class="`contract-badge--${state}`"
    :title="title"
  >
    <q-spinner v-if="state === 'verifying'" size="11px" />
    <q-icon v-else-if="state === 'verified'" name="verified_user" size="12px" />
    <q-icon v-else name="warning" size="12px" />
    {{ label }}
  </span>
</template>

<script>
// Contract verify badge for FILE nodes. Asks the API to unseal-check the
// node's container on disk (GET /uploads/verify/…) and reports the verdict:
// the pathchain's word on whether the bytes behind this address are still
// the ones the node was minted over. Transport failures hide the badge —
// no verdict is not a verdict.
import { defineComponent, ref, computed, onMounted } from 'vue'
import { uploadService } from 'src/services/upload.service'

export default defineComponent({
  name: 'FileContractBadge',
  props: {
    // node.file descriptor — needs .address (and .exists to short-circuit)
    file: { type: Object, required: true }
  },
  setup (props) {
    const state = ref('verifying') // verifying | verified | corrupted | hidden
    const reason = ref(null)

    const label = computed(() => {
      if (state.value === 'verifying') return 'verifying'
      if (state.value === 'verified') return 'contract verified'
      return 'contract violated'
    })

    const title = computed(() => {
      if (state.value === 'verified') {
        return 'The sealed file on disk still matches the contract minted from this node'
      }
      if (state.value === 'corrupted') {
        return `The file behind this node failed its contract check (${reason.value}) — it was altered or replaced on disk`
      }
      return ''
    })

    onMounted(async () => {
      if (!props.file || !props.file.address) { state.value = 'hidden'; return }
      try {
        const verdict = await uploadService.verify(props.file.address)
        reason.value = verdict.reason || null
        state.value = verdict.verified ? 'verified' : 'corrupted'
      } catch {
        state.value = 'hidden'
      }
    })

    return { state, label, title }
  }
})
</script>

<style lang="scss" scoped>
// Carved-surface chip, same relief treatment as .pioneer-gold
// (css/_components.scss) — teal for a kept contract, red for a broken one.
.contract-badge {
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

.contract-badge--verifying {
  color: #7a8a99;
  border-color: rgba(122, 138, 153, 0.35);
}

.contract-badge--verified {
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

.contract-badge--corrupted {
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
