<template>
  <MicroChip
    kind="posts"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :linked="linked"
    :full-address="fullAddress"
  />
</template>

<script>
import { defineComponent } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'

export default defineComponent({
  name: 'PostMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    // Pass false to render the chip as a span instead of a router-link — see
    // MicroChip. The feed card's foot chip does, so a click on it can open
    // the post information flyout rather than navigate to the viewer.
    linked: { type: Boolean, default: true },
    fullAddress: { type: String, default: '' }
  }
})
</script>
