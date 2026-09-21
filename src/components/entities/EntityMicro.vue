<template>
  <MicroChip
    kind="entities"
    :id="id"
    :path="path"
    :hash-str="hashStr"
    :show-type="showType"
    :icon-size="iconSize"
    :full-address="fullAddress"
    :display="effectiveName"
    :pioneer="effectivePioneer"
    :integrity="effectiveIntegrity"
    :verify="verify && !username"
    :expand="expand"
    :collapsed="collapsed"
  />
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import { hashOf } from 'src/utils/kinds'
import { entitySummary } from 'src/utils/entityDisplay'

export default defineComponent({
  name: 'EntityMicro',
  components: { MicroChip },
  props: {
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    showType: { type: Boolean, default: true },
    iconSize: { type: String, default: '10px' },
    fullAddress: { type: String, default: '' },
    // Pre-resolved display name — pass it when the caller already has the
    // enriched entity so the chip skips its lookup entirely.
    username: { type: String, default: '' },
    // Tri-state: true/false when the caller knows, null = resolve it here.
    pioneer: { type: Boolean, default: null },
    // The traffic light and the door (2026-09-21). An entity chip that
    // resolves its name already holds the summary the verdict rides on, so
    // it hands that down and MicroChip fetches nothing more; a chip given
    // its name outright lets MicroChip resolve (the cache is shared —
    // utils/elementSummary — so it is one read per entity either way).
    integrity: { type: Object, default: null },
    verify: { type: Boolean, default: true },
    expand: { type: Boolean, default: true },
    // THE STATE (2026-09-21 PM3): `collapsed` = the panel-header pill
    // (`● | icon :: 993fa6…`, no type, no door); off = the extended
    // reference (`● | icon :: type :: hash ⤢`). Through to MicroChip.
    collapsed: { type: Boolean, default: false }
  },
  setup (props) {
    // Entity chips never show a bare hash: resolve username + pioneer flag
    // through the session-wide cache unless the caller supplied both.
    const resolved = ref(null)

    watchEffect(() => {
      if (props.username && props.pioneer !== null) return
      const hash = props.hashStr || hashOf(props.path)
      if (props.id == null && !hash) return
      entitySummary({ id: props.id, hash: props.id == null ? hash : null })
        .then((s) => { resolved.value = s })
    })

    const effectiveName = computed(() =>
      props.username || resolved.value?.primary || '')

    const effectivePioneer = computed(() =>
      props.pioneer !== null ? props.pioneer : resolved.value?.pioneer === true)

    const effectiveIntegrity = computed(() =>
      props.integrity || resolved.value?.integrity || null)

    return { effectiveName, effectivePioneer, effectiveIntegrity }
  }
})
</script>
