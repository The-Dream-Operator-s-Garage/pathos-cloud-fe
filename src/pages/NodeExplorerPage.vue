<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <div class="row items-center q-mb-md">
          <div class="nasalization text-accent" style="font-size:1.1em;">Nodes</div>
          <q-space />
          <q-input v-model="search" placeholder="Search content..." dense outlined dark
            style="width:220px;" clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>

        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner color="primary" size="32px" />
        </div>

        <div v-else class="row q-gutter-md">
          <div v-for="node in nodes" :key="node.id" class="col-12 col-md-6 col-lg-4">
            <NodeCard :node="node" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';
import { nodeService } from 'src/services/node.service';
import NodeCard from 'src/components/nodes/NodeCard.vue';

export default defineComponent({
  name: 'NodeExplorerPage',
  components: { NodeCard },
  setup() {
    const nodes   = ref([]);
    const loading = ref(true);
    const search  = ref('');

    const load = async () => {
      loading.value = true;
      const result = await nodeService.list({ limit: 50 });
      if (result.success) nodes.value = result.nodes;
      loading.value = false;
    };

    onMounted(load);

    return { nodes, loading, search };
  }
});
</script>
