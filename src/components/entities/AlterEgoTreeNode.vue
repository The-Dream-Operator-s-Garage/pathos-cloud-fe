<template>
  <div class="ego-node">
    <div class="ego-row" :class="{ 'ego-row--acting': isActing }">
      <q-icon
        :name="node.type_id === 4 ? 'theater_comedy' : 'person'"
        size="14px"
        class="ego-icon"
      />
      <router-link :to="'/entities/' + node.id" class="ego-name">
        {{ node.display_name }}
      </router-link>
      <span v-if="isActing" class="ego-acting-chip">acting</span>
      <q-space />
      <q-btn
        v-if="!isActing"
        flat dense round size="xs" icon="login"
        class="ego-switch-btn"
        :title="'Log in as ' + node.display_name"
        @click="$emit('switch', node)"
      />
    </div>
    <div v-if="node.children && node.children.length" class="ego-children">
      <AlterEgoTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :acting-id="actingId"
        @switch="$emit('switch', $event)"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'AlterEgoTreeNode',
  props: {
    // One node of the identity tree: { id, type_id, display_name, children }
    node: { type: Object, required: true },
    // The identity the current JWT acts as — highlighted, not switchable.
    actingId: { type: Number, default: null }
  },
  emits: ['switch'],
  setup (props) {
    const isActing = computed(() => props.node.id === props.actingId)
    return { isActing }
  }
})
</script>

<style lang="scss" scoped>
.ego-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 6px;
  min-width: 0;

  &--acting {
    background: rgba(155, 108, 176, 0.12);
    border: 1px solid rgba(155, 108, 176, 0.35);
  }
}

.ego-icon { color: #9b6cb0; flex-shrink: 0; }

.ego-name {
  font-size: 0.82em;
  color: var(--panel-ink-1, #1F2A38);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { text-decoration: underline; }
}

.ego-acting-chip {
  flex-shrink: 0;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7a4f8f;
  background: rgba(155, 108, 176, 0.15);
  border: 1px solid rgba(155, 108, 176, 0.4);
  border-radius: 4px;
  padding: 0 6px;
}

.ego-switch-btn { color: var(--panel-ink-2, #5b6c82); }

.ego-children {
  margin-left: 10px;
  padding-left: 8px;
  border-left: 1px dotted rgba(155, 108, 176, 0.35);
}
</style>
