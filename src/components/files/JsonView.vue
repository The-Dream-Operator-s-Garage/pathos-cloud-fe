<template>
  <!-- Pretty-printed JSON renderer. Wraps the recursive `JsonNode` so the
       root value (object/array/primitive alike) gets the same collapsible
       chrome as anything nested below it. -->
  <div class="json-view">
    <JsonNode :value="value" :depth="0" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import JsonNode from './JsonNode.vue';

export default defineComponent({
  name: 'JsonView',
  components: { JsonNode },
  props: {
    value: { type: [Object, Array, String, Number, Boolean, null], default: null }
  }
});
</script>

<style lang="scss" scoped>
.json-view {
  margin: 0;
  padding: 12px 14px;
  font-family: 'Space Mono', 'Menlo', monospace;
  font-size: 0.84em;
  line-height: 1.55;
  color: #2C3D4E;
  background: #f8fafc;
  border-radius: 6px;
  word-break: break-word;
}
</style>
