<template>
  <div class="label-slider" v-if="labels && labels.length">
    <div class="label-slider-track">
      <LabelViewer
        v-for="lbl in labels"
        :key="lbl.id"
        :label="lbl"
      />
    </div>
  </div>

  <div v-else-if="loading" class="label-slider label-slider-loading">
    <q-spinner color="primary" size="14px" />
    <span class="text-dim" style="font-size:0.78em; margin-left:8px;">loading labels…</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import LabelViewer from './LabelViewer.vue'

export default defineComponent({
  name: 'LabelSlider',
  components: { LabelViewer },
  props: {
    labels:  { type: Array,   default: () => [] },
    loading: { type: Boolean, default: false }
  }
})
</script>

<style lang="scss" scoped>
.label-slider {
  display: flex;
  align-items: center;
  width: 100%;
  height: 30px;
  padding: 3px 8px;
  margin: 2px 0 4px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }

  &-loading {
    justify-content: flex-start;
  }
}

.label-slider-track {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  white-space: nowrap;
}
</style>
