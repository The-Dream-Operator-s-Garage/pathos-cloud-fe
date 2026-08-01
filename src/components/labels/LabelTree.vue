<template>
  <div class="pathos-card q-pa-md">
    <div class="path-breadcrumb q-mb-sm">
      <span v-for="(crumb, i) in chain" :key="crumb.id">
        <span v-if="i > 0" class="sep">/</span>
        <span class="label-chip" @click="$emit('navigate', crumb)">{{ crumb.name }}</span>
      </span>
    </div>

    <div class="text-accent nasalization q-mb-sm" style="font-size:1em;">{{ label.name }}</div>
    <div class="q-mb-md">
      <HashLink :path="label.path" :id="label.id" :truncate="22" />
    </div>

    <div v-if="children.length" class="q-gutter-xs">
      <div class="text-dim q-mb-xs" style="font-size:0.75em; text-transform:uppercase; letter-spacing:.05em;">Children</div>
      <div class="label-scroll-row">
        <span v-for="child in children" :key="child.id"
          class="label-chip" @click="$emit('navigate', child)">
          {{ child.name }}
        </span>
      </div>
    </div>

    <div v-else class="text-dim" style="font-size:0.8em;">No children — leaf label</div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import { labelService } from 'src/services/label.service'
import HashLink from 'src/components/shared/HashLink.vue'

export default defineComponent({
  name: 'LabelTree',
  components: { HashLink },
  emits: ['navigate'],
  props: {
    label: { type: Object, required: true }
  },
  setup (props) {
    const chain = ref([])
    const children = ref([])

    const load = async () => {
      const [chainResult, childrenResult] = await Promise.all([
        labelService.getChain(props.label.id),
        labelService.getChildren(props.label.id)
      ])
      if (chainResult.success) chain.value = chainResult.chain
      if (childrenResult.success) children.value = childrenResult.children
    }

    onMounted(load)
    watch(() => props.label.id, load)

    return { chain, children }
  }
})
</script>
