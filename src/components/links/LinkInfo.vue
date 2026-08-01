<template>
  <InfoChip
    kind="links"
    :id="id"
    :hash-str="hashStr"
    :address="address"
    :primary="primary"
    :secondary="secondary"
    :to="to"
    :dense="dense"
  />
</template>

<script>
import { defineComponent } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'

export default defineComponent({
  name: 'LinkInfo',
  components: { InfoChip },
  props: {
    id: { type: [Number, String], default: null },
    hashStr: { type: String, default: '' },
    address: { type: String, default: '' },
    primary: { type: String, default: '' },
    secondary: { type: String, default: '' },
    to: { type: String, default: null },
    dense: { type: Boolean, default: false }
  }
})
</script>
