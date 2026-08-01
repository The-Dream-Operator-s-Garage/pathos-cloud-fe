<template>
  <!-- A reference chip for the decoded file view. Wraps the shared MicroChip
       (icon / type / hash, styled per kind) but, instead of routing to the
       element's own page, clicking it reveals that element *inside the file
       tree* — scrolling to it and auto-expanding its decoded panel. The
       click is captured before MicroChip's own `@click.stop` swallows it. -->
  <span
    class="ref-chip"
    role="link"
    :title="`reveal ${ref.address}`"
    @click.capture.stop.prevent="onClick"
  >
    <MicroChip :kind="ref.prefix" :hash-str="ref.hash" show-type />
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
  cursor: pointer;
  vertical-align: middle;
  border-radius: 4px;

  // The inner MicroChip is non-routed (span), so light it up here to read
  // as interactive.
  :deep(.micro-chip) {
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  &:hover :deep(.micro-chip) {
    background: rgba(var(--coral-rgb), 0.10);
    border-color: rgba(var(--coral-rgb), 0.40);
    color: var(--coral-deep);
  }
}
</style>
