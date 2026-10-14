<template>
  <div v-if="labels.length" class="label-scroll-row">
    <!-- ⭐ 2026-10-14 — plates per origin (LabelBundleRail); `showAncestors`
         is moot: every plate draws its labels' chains. -->
    <LabelBundleRail :labels="labels" wrap />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import LabelBundleRail from './LabelBundleRail.vue'

export default defineComponent({
  name: 'LabelScroll',
  components: { LabelBundleRail },
  props: {
    labels: { type: Array, default: () => [] },
    showAncestors: { type: Boolean, default: false }
  }
})
</script>
