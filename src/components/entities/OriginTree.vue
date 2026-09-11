<template>
  <!-- The dialog host for the ORIGIN CONSTELLATION — the profile page's
       "Origin constellation" button opens it here. The sky itself moved to
       OriginSky.vue on 2026-09-11 so the entity WINDOW could mount it
       inline; this box keeps the page's door exactly as it was (v-model +
       entity-id). The dialog mounts its content on show, so the sky loads
       itself each time it is opened. -->
  <q-dialog v-model="open">
    <OriginSky :entity-id="entityId" @close="open = false" />
  </q-dialog>
</template>

<script>
import { defineComponent, computed } from 'vue'
import OriginSky from './OriginSky.vue'

export default defineComponent({
  name: 'OriginTree',
  components: { OriginSky },
  props: {
    entityId: { type: Number, required: true },
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const open = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })
    return { open }
  }
})
</script>
