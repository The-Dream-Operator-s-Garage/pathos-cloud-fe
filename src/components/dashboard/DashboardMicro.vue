<template>
  <!-- The dashboard's NANO form (phase 9, 2026-10-19) — MicroChip in the
       `dashboards` kind: the `dashboard` glyph in Quasar brown, the hash,
       the verdict light. The one chip every `-[[pathos:dashboards/…]]`
       and every spent-budget slot draws. Mirrors PostMicro. -->
  <MicroChip
    kind="dashboards"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon="icon"
    :type-label="typeLabel"
    :type-icon="typeIcon"
    :icon-size="iconSize"
    :linked="linked"
    :full-address="fullAddress"
    :integrity="integrity"
    :verify="verify"
    :expand="expand"
    :collapsed="collapsed"
    :display="display"
  />
</template>

<script>
import { defineComponent } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'

export default defineComponent({
  name: 'DashboardMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    icon: { type: String, default: null },
    typeLabel: { type: String, default: '' },
    typeIcon: { type: String, default: '' },
    iconSize: { type: String, default: '10px' },
    linked: { type: Boolean, default: true },
    fullAddress: { type: String, default: '' },
    integrity: { type: Object, default: null },
    verify: { type: Boolean, default: true },
    expand: { type: Boolean, default: true },
    collapsed: { type: Boolean, default: false },
    display: { type: String, default: '' }
  }
})
</script>
