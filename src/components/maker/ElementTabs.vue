<template>
  <q-tabs
    v-model="localTab"
    dense align="left"
    active-color="primary" indicator-color="primary"
    class="element-tabs q-mb-md"
    no-caps
    inline-label
  >
    <q-tab name="content" icon="article" label="Content" />
    <q-tab name="versions" icon="history">
      <template #default>
        <span>Versions</span>
        <span v-if="versionCount > 0" class="tab-count">{{ versionCount }}</span>
      </template>
    </q-tab>
    <q-tab name="forks" icon="call_split">
      <template #default>
        <span>Forks</span>
        <span v-if="forkCount > 0" class="tab-count">{{ forkCount }}</span>
      </template>
    </q-tab>
    <q-tab name="comments" icon="forum">
      <template #default>
        <span>Comments</span>
        <span v-if="commentCount > 0" class="tab-count">{{ commentCount }}</span>
      </template>
    </q-tab>
  </q-tabs>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'ElementTabs',
  emits: ['update:modelValue'],
  props: {
    modelValue: { type: String, default: 'content' },
    versionCount: { type: Number, default: 0 },
    forkCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 }
  },
  setup (props, { emit }) {
    const localTab = ref(props.modelValue || 'content')
    watch(() => props.modelValue, v => (localTab.value = v))
    watch(localTab, v => emit('update:modelValue', v))
    return { localTab }
  }
})
</script>

<style lang="scss" scoped>
.element-tabs {
  border-bottom: 1px solid var(--rule);
}
.tab-count {
  margin-left: 6px;
  font-size: 0.72em;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--rule);
  color: var(--ink);
}
</style>
