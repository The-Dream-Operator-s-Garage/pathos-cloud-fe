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
  />
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue';
import MicroChip from 'src/components/shared/MicroChip.vue';
import { hashOf } from 'src/utils/kinds';
import { entitySummary } from 'src/utils/entityDisplay';

export default defineComponent({
  name: 'EntityMicro',
  components: { MicroChip },
  props: {
    id:          { type: [Number, String], default: null },
    path:        { type: String, default: '' },
    hashStr:     { type: String, default: '' },
    showType:    { type: Boolean, default: true },
    iconSize:    { type: String, default: '10px' },
    fullAddress: { type: String, default: '' },
    // Pre-resolved display name — pass it when the caller already has the
    // enriched entity so the chip skips its lookup entirely.
    username:    { type: String, default: '' },
    // Tri-state: true/false when the caller knows, null = resolve it here.
    pioneer:     { type: Boolean, default: null }
  },
  setup (props) {
    // Entity chips never show a bare hash: resolve username + pioneer flag
    // through the session-wide cache unless the caller supplied both.
    const resolved = ref(null);

    watchEffect(() => {
      if (props.username && props.pioneer !== null) return;
      const hash = props.hashStr || hashOf(props.path);
      if (props.id == null && !hash) return;
      entitySummary({ id: props.id, hash: props.id == null ? hash : null })
        .then((s) => { resolved.value = s; });
    });

    const effectiveName = computed(() =>
      props.username || resolved.value?.primary || '');

    const effectivePioneer = computed(() =>
      props.pioneer !== null ? props.pioneer : resolved.value?.pioneer === true);

    return { effectiveName, effectivePioneer };
  }
});
</script>
