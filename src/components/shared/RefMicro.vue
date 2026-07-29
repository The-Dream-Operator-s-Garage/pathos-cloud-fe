<template>
  <!-- Micro-tier inline reference: the smallest clickable form of a
       [[pathos:…]] ref. Wraps MicroChip and self-resolves its route (and
       pioneer treatment) via /refs/summary — used on NODE surfaces where
       references stay compact, versus posts where they bloom into Minis. -->
  <MicroChip
    :kind="prefix"
    :hash-str="hash"
    :to="route"
    :display="label || undefined"
    :pioneer="isPioneer"
    :full-address="address"
  />
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import MicroChip from './MicroChip.vue'
import { refService } from 'src/services/ref.service'

export default defineComponent({
  name: 'RefMicro',
  components: { MicroChip },
  props: {
    // '<kind>/<hash>' reference.
    address: { type: String, default: '' },
    // Optional human display text ([[pathos:…|label]]).
    label: { type: String, default: '' }
  },
  setup (props) {
    const resolved = ref(null)

    const parts = computed(() => {
      const p = (props.address || '').trim().split('/')
      return p.length >= 2
        ? { prefix: p[p.length - 2], hash: p[p.length - 1] }
        : { prefix: 'unknown', hash: '' }
    })

    const load = async () => {
      resolved.value = null
      if (!props.address) return
      try {
        const r = await refService.summary(props.address)
        if (r?.success) resolved.value = r.summary
      } catch (_) { /* chip stays inert */ }
    }
    onMounted(load)
    watch(() => props.address, load)

    const route = computed(() => resolved.value?.route || null)
    const isPioneer = computed(() => resolved.value?.pioneer === true)

    return { prefix: computed(() => parts.value.prefix), hash: computed(() => parts.value.hash), route, isPioneer }
  }
})
</script>
