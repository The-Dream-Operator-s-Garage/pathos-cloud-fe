<template>
  <!-- One row of the claim band's EVIDENCE TREE (Thread D reader surface).
       Any element can be evidence; evidence that is ITSELF a claim expands
       its own evidence beneath it — the tree is the recursion, bounded so a
       claim citing itself (or a long dispute chain) cannot run away. A
       private evidence target resolves to a locked chip via the summary
       endpoint: the access doctrine working, not a leak. -->
  <div class="evidence-node">
    <div class="evidence-node__row">
      <q-icon
        v-if="depth > 0"
        name="subdirectory_arrow_right"
        size="12px"
        class="evidence-node__elbow"
      />
      <InfoChip :address="refAddress" />
    </div>
    <div v-if="children.length" class="evidence-node__children">
      <ClaimEvidenceNode
        v-for="child in children"
        :key="child"
        :ref-address="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import { refService } from 'src/services/ref.service'
import { claimService } from 'src/services/claim.service'

const MAX_DEPTH = 3

export default defineComponent({
  name: 'ClaimEvidenceNode',
  components: { InfoChip },
  props: {
    // '<kind>/<hash>' evidence ref.
    refAddress: { type: String, required: true },
    depth: { type: Number, default: 0 }
  },
  setup (props) {
    const children = ref([])

    // The chip resolves itself; this second summary read only asks "is
    // this evidence a claim?" — and only then walks one level deeper.
    const load = async () => {
      children.value = []
      if (props.depth >= MAX_DEPTH || !props.refAddress.startsWith('skeletons/')) return
      try {
        const s = await refService.summary(props.refAddress)
        const claimId = s?.summary?.claim?.id
        if (!claimId) return
        const c = await claimService.get(claimId)
        if (c?.success) children.value = c.claim.evidence || []
      } catch (_) { /* an unreadable sub-claim just doesn't expand */ }
    }

    onMounted(load)
    watch(() => props.refAddress, load)

    return { children }
  }
})
</script>

<style lang="scss" scoped>
.evidence-node__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  min-width: 0;
}
.evidence-node__elbow {
  flex-shrink: 0;
  color: #8995a8;
}
.evidence-node__children {
  margin-left: 18px;
  border-left: 1px solid #e2e6ed;
  padding-left: 8px;
}
</style>
