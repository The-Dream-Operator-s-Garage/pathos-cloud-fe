<template>
  <!-- A reference chip for the decoded file view. Wraps the shared MicroChip
       (the stock nano pill — 2026-09-21 PM: the very same chip everywhere)
       but, instead of opening the element's window, clicking it reveals that
       element *inside the file tree* — scrolling to it and auto-expanding
       its decoded panel. `open-on-click=false` hands the root click back;
       the chip's DOOR at its right end still opens the flyout. -->
  <span
    class="ref-chip"
    role="link"
    :title="`reveal ${ref.address}`"
    @click="onClick"
  >
    <MicroChip :kind="ref.prefix" :hash-str="ref.hash" show-type :open-on-click="false" />
  </span>
</template>

<script>
import { defineComponent, computed, inject } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import { parseRef } from 'src/utils/kinds'

export default defineComponent({
  name: 'RefChip',
  components: { MicroChip },
  props: {
    address: { type: String, required: true }
  },
  setup (props) {
    const treeNav = inject('treeNav', null)

    const ref = computed(() =>
      parseRef(props.address) || {
        prefix: 'unknown',
        kind: 'unknown',
        hash: props.address,
        address: props.address
      }
    )

    const onClick = () => {
      if (treeNav) treeNav.reveal(ref.value.address)
    }

    return { ref, onClick }
  }
})
</script>

<style lang="scss" scoped>
.ref-chip {
  display: inline-flex;
  vertical-align: middle;
  // (The wrapper used to light the chip up in coral on hover — the chip
  // carries its own hover in its kind's family now, 2026-09-21 PM.)
}
</style>
