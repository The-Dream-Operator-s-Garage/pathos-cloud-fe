<template>
  <!-- One node of the org's decision-making tree: the MASK carries the
       seat; the operator's username rides along quietly. Nesting follows
       REPORTS_TO edges. Your own seat offers the mask switch. -->
  <div class="org-node">
    <div class="org-node__row" :class="{ 'is-me': node.is_me, 'is-acting': isActing }">
      <q-icon name="theater_comedy" size="15px" class="org-node__icon" />
      <router-link
        v-if="node.mask"
        :to="`/entities/${node.mask.id}`"
        class="org-node__name"
      >{{ node.mask.display_name }}</router-link>
      <span v-else class="org-node__name">{{ node.user.display_name }}</span>

      <span v-if="node.role_title" class="org-node__title">{{ node.role_title }}</span>
      <span v-if="node.role === 'ADMIN'" class="org-node__admin">admin</span>
      <span v-if="node.user?.username" class="org-node__operator mono">@{{ node.user.username }}</span>

      <q-chip v-if="isActing" dense size="sm" color="accent" text-color="white" class="org-node__chip">
        acting
      </q-chip>
      <q-btn
        v-else-if="node.is_me && node.mask"
        flat dense round size="sm" icon="login"
        :title="`Put on the mask — act as ${node.mask.display_name}`"
        @click="$emit('switch', node)"
      />
    </div>

    <div v-if="node.children && node.children.length" class="org-node__children">
      <OrgMemberTreeNode
        v-for="child in node.children"
        :key="child.member_id"
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
  name: 'OrgMemberTreeNode',
  props: {
    // A membersTree node: { member_id, role, role_title, mask, user,
    // is_me, children[] }.
    node: { type: Object, required: true },
    // The viewer's acting entity id (JWT) — highlights the worn mask.
    actingId: { type: Number, default: null }
  },
  emits: ['switch'],
  setup (props) {
    const isActing = computed(() => !!props.node.mask && props.node.mask.id === props.actingId)
    return { isActing }
  }
})
</script>

<style lang="scss" scoped>
.org-node__row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 7px;
  font-size: 0.82em;
  transition: background 0.12s;

  &:hover { background: rgba(var(--ink-rgb), 0.05); }
  &.is-me { background: rgba(#00829c, 0.06); }
  &.is-acting { background: rgba(#9b6cb0, 0.09); }
}

.org-node__icon { color: #9b6cb0; }
.org-node__name {
  font-weight: 700;
  color: var(--ink, #1f2a38);
  text-decoration: none;
  &:hover { color: #00829c; }
}
.org-node__title {
  font-size: 0.82em;
  color: var(--coral-deep, #b25e49);
  font-style: italic;
}
.org-node__admin {
  font-size: 0.62em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid rgba(#9b6cb0, 0.5);
  color: #9b6cb0;
}
.org-node__operator { font-size: 0.72em; opacity: 0.5; margin-left: auto; }
.org-node__chip { flex-shrink: 0; }

.org-node__children {
  margin-left: 12px;
  padding-left: 10px;
  border-left: 1px dotted rgba(#9b6cb0, 0.45);
}
</style>
