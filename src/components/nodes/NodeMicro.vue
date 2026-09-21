<template>
  <!-- Inline "icon/type/hash" chip for a NODE element. Smuggles cleanly
       into running text via shared/MicroChip.vue; routes to /nodes/:id
       when an id is known. -->
  <MicroChip
    kind="nodes"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :full-address="fullAddress"
    :integrity="integrity"
    :integrity-leads="integrityLeads"
    :verify="verify"
    :expand="expand"
  />
</template>

<script>
import { defineComponent } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'

export default defineComponent({
  name: 'NodeMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    fullAddress: { type: String, default: '' },
    // The node's integrity verdict ({ status, check, report }) and where its
    // dot stands — both handed straight to MicroChip, which owns the law.
    integrity: { type: Object, default: null },
    integrityLeads: { type: Boolean, default: false },
    // (2026-09-21) self-resolve the verdict when none is given; draw the door.
    verify: { type: Boolean, default: true },
    expand: { type: Boolean, default: true }
  }
})
</script>
