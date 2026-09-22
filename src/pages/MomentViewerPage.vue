<template>
  <!-- THE MOMENT PAGE (2026-07; ⭐ 2026-09-21: the page is the FACE). Its
       grid, panels, facts, map, decoded buffer and minted list moved whole
       into `components/moments/MomentFace.vue` the day the moment got a
       flyout window (user ask: "a flyout moment viewer that contains
       everything i see when visiting a moment") — the entity pattern, one
       source for the page and the window, so neither can fall behind the
       other. The page keeps only its chrome: the route param (a DB id or a
       hash, `MomentFace` reads both), the base bed and the page gutters.
       The face's own state screens (spinner / not found) stand in for the
       page's old ones. -->
  <q-page class="bg-base moment-page">
    <MomentFace :id="momentKey" />
  </q-page>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import MomentFace from 'src/components/moments/MomentFace.vue'

export default defineComponent({
  name: 'MomentViewerPage',
  components: { MomentFace },
  setup () {
    const route = useRoute()
    const momentKey = computed(() => String(route.params.id || ''))
    return { momentKey }
  }
})
</script>

<style lang="scss" scoped>
// The page's gutters; the face fills the column and scrolls the page (the
// face's own `overflow: auto` is the window's — here the document scrolls).
.moment-page {
  padding: 16px 10px 0;
  display: flex;
  flex-direction: column;
  :deep(.moment-face) { padding: 0 0 16px; overflow: visible; }
}
</style>
