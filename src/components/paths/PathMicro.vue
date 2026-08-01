<template>
  <MicroChip
    kind="paths"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :full-address="fullAddress"
  />
</template>

<script>
import { defineComponent } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'

export default defineComponent({
  name: 'PathMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    fullAddress: { type: String, default: '' }
  }
})
</script>
