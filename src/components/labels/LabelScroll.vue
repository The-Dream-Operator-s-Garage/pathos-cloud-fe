<template>
  <div v-if="labels.length" class="label-scroll-row">
    <LabelChip v-for="label in labels" :key="label.id" :label="label" :show-ancestors="showAncestors" />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import LabelChip from './LabelChip.vue'

export default defineComponent({
  name: 'LabelScroll',
  components: { LabelChip },
  props: {
    labels: { type: Array, default: () => [] },
    showAncestors: { type: Boolean, default: false }
  }
})
</script>
