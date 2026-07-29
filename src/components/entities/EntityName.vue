<template>
  <!-- Inline entity name for author lines and facts. Always resolves to a
       human name (never a bare id/hash), and renders the carved-gold
       one-and-only treatment with a star when the entity is the pioneer.
       Presentational drop-in: icon + name, no routing of its own. -->
  <span class="entity-name" :class="{ 'pioneer-gold entity-name--pioneer': isPioneer }">
    <q-icon
      v-if="showIcon"
      :name="isPioneer ? 'star' : icon"
      size="11px"
      class="q-mr-xs"
    />
    <strong v-if="bold">{{ name }}</strong>
    <template v-else>{{ name }}</template>
  </span>
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue'
import { hashOf } from 'src/utils/kinds'
import { entitySummary } from 'src/utils/entityDisplay'

export default defineComponent({
  name: 'EntityName',
  props: {
    // Enriched shape ({ id, path, username, display_name }) — any subset.
    entity: { type: Object, default: null },
    // Bare id fallback when the caller has no author object.
    id: { type: [Number, String], default: null },
    showIcon: { type: Boolean, default: true },
    icon: { type: String, default: 'person' },
    bold: { type: Boolean, default: true }
  },
  setup (props) {
    const entityId = computed(() => props.entity?.id ?? props.id)
    const entityHash = computed(() => hashOf(props.entity?.path || ''))

    // Cached summary lookup fills a missing name and answers "is this the
    // pioneer?" — enriched author objects don't carry ancestry.
    const resolved = ref(null)
    watchEffect(() => {
      if (entityId.value == null && !entityHash.value) return
      entitySummary({
        id: entityId.value,
        hash: entityId.value == null ? entityHash.value : null
      }).then((s) => { resolved.value = s })
    })

    const name = computed(() =>
      props.entity?.display_name || props.entity?.username ||
      resolved.value?.primary ||
      (entityId.value != null ? `entity #${entityId.value}` : ''))

    const isPioneer = computed(() => resolved.value?.pioneer === true)

    return { name, isPioneer }
  }
})
</script>

<style lang="scss" scoped>
.entity-name {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

// Chip-shaped so the global .pioneer-gold surface reads as a badge inline.
.entity-name--pioneer {
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid transparent;
}
</style>
