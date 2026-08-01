<template>
  <span class="label-chip" @click="$emit('click', label)">
    <span v-if="showAncestors && ancestors.length" class="text-dim">
      <span v-for="a in ancestors" :key="a.id">
        {{ a.name }}<span class="sep"> / </span>
      </span>
    </span>
    {{ label.name }}
  </span>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { labelService } from 'src/services/label.service'

export default defineComponent({
  name: 'LabelChip',
  emits: ['click'],
  props: {
    label: { type: Object, required: true },
    showAncestors: { type: Boolean, default: false }
  },
  setup (props) {
    const ancestors = ref([])

    onMounted(async () => {
      if (props.showAncestors && props.label.ancestor_id) {
        const result = await labelService.getChain(props.label.id)
        if (result.success) {
          ancestors.value = result.chain.slice(0, -1)
        }
      }
    })

    return { ancestors }
  }
})
</script>
