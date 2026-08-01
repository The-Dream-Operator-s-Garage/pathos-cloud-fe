<template>
  <MiniPanel :to="targetRoute">
    <template #title>
      <q-icon name="link" size="13px" class="q-mr-xs link-mini__icon" />
      link #{{ link.id }}
      <span class="link-mini__arrow mono">→ {{ link.target_type }} #{{ link.target_id }}</span>
    </template>

    <template #chips>
      <span v-if="parentPath" class="mini-chip-fact">
        <q-icon name="route" size="11px" class="q-mr-xs" />
        path #{{ parentPath.id }}
      </span>
      <span class="mini-chip-fact" :title="'prev: ' + (link.prev_id || '—') + ' · next: ' + (link.next_id || '—')">
        <q-icon name="linear_scale" size="11px" class="q-mr-xs" />
        {{ chainPosition }}
      </span>
    </template>

    <template #hash>
      <LinkMicro :id="link.id" :path="link.path" :show-type="true" />
    </template>

    <template #body>
      <div class="link-mini__body">
        <EntityName v-if="targetEntity" :entity="targetEntity" :bold="false" />
        <template v-else>{{ targetSummary }}</template>
      </div>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import LinkMicro from './LinkMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'

export default defineComponent({
  name: 'LinkMini',
  components: { MiniPanel, LinkMicro, EntityName },
  props: {
    // Link row { id, path, prev_id, next_id, target_type, target_id, … }.
    link: { type: Object, required: true },
    // Resolved target payload from linkService ({ kind, node|label|… }).
    target: { type: Object, default: null },
    parentPath: { type: Object, default: null },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/links/${props.link.id}`)

    const chainPosition = computed(() => {
      const hasPrev = !!props.link.prev_id
      const hasNext = !!props.link.next_id
      if (!hasPrev && !hasNext) return 'sole link'
      if (!hasPrev) return 'chain head'
      if (!hasNext) return 'chain tail'
      return 'mid-chain'
    })

    // Entity targets render through EntityName (username + pioneer gold);
    // every other kind stays a plain text summary.
    const targetEntity = computed(() =>
      props.target?.kind === 'entity' ? props.target.entity : null)

    const targetSummary = computed(() => {
      const kind = props.target?.kind
      const sub = kind ? props.target[kind] : null
      if (!sub) return `${props.link.target_type} #${props.link.target_id}`
      if (kind === 'node') return (sub.content || '').slice(0, 80) || `node #${sub.id}`
      if (kind === 'label') return sub.name || `label #${sub.id}`
      if (kind === 'path') return `path #${sub.id} (${sub.step_count ?? '?'} steps)`
      return sub.title || sub.name || `${kind} #${sub.id}`
    })

    return { targetRoute, chainPosition, targetSummary, targetEntity }
  }
})
</script>

<style lang="scss" scoped>
.link-mini__icon { color: #7d8995; }
.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}
.link-mini__arrow {
  margin-left: 6px;
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.55);
}
.link-mini__body {
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
