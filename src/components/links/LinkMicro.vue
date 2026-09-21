<template>
  <MicroChip
    kind="links"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :full-address="fullAddress"
    :integrity="integrity"
    :verify="verify"
    :expand="expand"
    :collapsed="collapsed"
  />
</template>

<script>
import { defineComponent } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'

export default defineComponent({
  name: 'LinkMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    fullAddress: { type: String, default: '' },
    // The traffic light and the door (2026-09-21) — all three hand straight
    // through to MicroChip, which owns the law: a verdict given here wins,
    // else the chip resolves its own; `expand` draws the open-in-flyout mark.
    integrity: { type: Object, default: null },
    verify: { type: Boolean, default: true },
    expand: { type: Boolean, default: true },
    // THE STATE (2026-09-21 PM3): `collapsed` = the panel-header pill
    // (`● | icon :: 993fa6…`, no type, no door); off = the extended
    // reference (`● | icon :: type :: hash ⤢`). Through to MicroChip.
    collapsed: { type: Boolean, default: false }
  }
})
</script>
