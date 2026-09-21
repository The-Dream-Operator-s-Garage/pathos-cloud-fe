<template>
  <MicroChip
    kind="posts"
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
    // Both pass straight to MicroChip — the kind's default glyph is the
    // feed cap's `sym_o_post` (kinds.js, since 2026-09-21 PM3 — it was
    // `edit_note`, and the cap had to send its own to match). (`sep` left
    // with that pass: the pill's grammar is fixed, `/` lead + `::` seams.)
    icon: { type: String, default: null },
    typeLabel: { type: String, default: '' },
    typeIcon: { type: String, default: '' },
    iconSize: { type: String, default: '10px' },
    // Pass false to render the chip as a span instead of a router-link — see
    // MicroChip. The feed card's foot chip does, so a click on it can open
    // the post information flyout rather than navigate to the viewer.
    linked: { type: Boolean, default: true },
    fullAddress: { type: String, default: '' },
    // The traffic light and the door (2026-09-21) — all three hand straight
    // through to MicroChip, which owns the law: a verdict given here wins,
    // else the chip resolves its own; `expand` draws the open-in-flyout mark.
    integrity: { type: Object, default: null },
    verify: { type: Boolean, default: true },
    expand: { type: Boolean, default: true },
    // THE STATE (2026-09-21 PM3): `collapsed` = the panel-header pill
    // (`● / icon :: 993fa6…`, no type, no door); off = the extended
    // reference (`● / icon :: type :: hash ⤢`). Through to MicroChip.
    collapsed: { type: Boolean, default: false }
  }
})
</script>
