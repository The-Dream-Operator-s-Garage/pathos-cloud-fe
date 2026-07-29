<template>
  <!-- Nano member of the label-display family (LabelViewer → LabelSlider →
       NanoLabelSlider). Inert by design: no ancestry expansion, no
       navigation — just the element's labels stacked in a vertical
       scroller. Used wherever an element's labels are pure information
       (Minis, maker canonic labels) rather than a navigation surface. -->
  <div
    v-if="labels && labels.length"
    class="nano-label-slider"
    :style="{ maxHeight }"
  >
    <span
      v-for="(l, i) in labels"
      :key="l.id || i"
      class="nano-label"
      :title="l.path || l.name"
    >{{ l.name }}</span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NanoLabelSlider',
  props: {
    // Label rows — only `name` is required; `path` enriches the hover title
    labels: { type: Array, default: () => [] },
    maxHeight: { type: String, default: '64px' }
  }
})
</script>

<style lang="scss" scoped>
.nano-label-slider {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

// Same mono-uppercase pill language as LabelViewer's inner box, but
// static: no hover state, no pointer.
.nano-label {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 9px;
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
}
</style>
