<template>
  <!-- One fork NODE in a node's fork tree. Forks of nodes are nodes
       (forked_from_id), so the row routes to the node viewer and the
       toggle recurses into the fork's OWN forks — same visual idiom as
       PostCommentItem so both trees read identically. -->
  <div class="comment fork-node" :class="'depth-' + Math.min(depth, 4)">
    <div class="row items-center no-wrap" style="gap:8px; font-size:0.78em;">
      <q-icon name="alt_route" size="12px" class="text-coral" />
      <EntityName class="text-ink" :entity="{ username: fork.username }" :id="fork.owner_id" />
      <span class="text-coral mono" style="font-size:0.9em;">(fork)</span>
      <q-space />
      <router-link :to="'/nodes/' + fork.id" class="fork-node__open mono" :title="fork.path">
        node #{{ fork.id }} <q-icon name="open_in_new" size="10px" />
      </router-link>
      <span class="text-dim" style="font-size:0.86em;" :title="fork.created_at">{{ formatTime(fork.created_at) }}</span>
    </div>

    <div v-if="excerpt" class="comment-body q-mt-xs">{{ excerpt }}</div>

    <div class="row items-center q-mt-xs" style="gap:14px; font-size:0.74em;">
      <button
        v-if="fork.fork_count > 0 || loaded"
        class="bare-btn text-dim"
        @click="toggle"
      >
        <q-icon :name="open ? 'expand_less' : 'expand_more'" size="11px" class="q-mr-xs" />
        {{ fork.fork_count }} {{ parseInt(fork.fork_count) === 1 ? 'fork' : 'forks' }}
      </button>
    </div>

    <div v-if="open" class="nested-replies q-mt-sm">
      <div v-if="loading" class="text-dim q-py-sm" style="font-size:0.8em;">
        <q-spinner size="14px" /> loading…
      </div>
      <NodeForkItem
        v-for="f in children"
        :key="f.id"
        :fork="f"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'
import EntityName from 'src/components/entities/EntityName.vue'
import { bodyOf } from 'src/utils/nodeContent'

const formatTime = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const mins = Math.floor((new Date() - d) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return mins + 'm'
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs + 'h'
    const days = Math.floor(hrs / 24)
    if (days < 7) return days + 'd'
    return d.toLocaleDateString()
  } catch (_) { return iso }
}

export default defineComponent({
  name: 'NodeForkItem',
  components: { EntityName },
  props: {
    fork: { type: Object, required: true },
    depth: { type: Number, default: 0 }
  },
  setup (props) {
    const open = ref(false)
    const loaded = ref(false)
    const loading = ref(false)
    const children = ref([])

    const excerpt = computed(() => {
      const body = (bodyOf(props.fork) || props.fork.content || '').trim()
      return body.length > 200 ? body.slice(0, 200) + '…' : body
    })

    const toggle = async () => {
      open.value = !open.value
      if (!open.value || loaded.value) return
      loading.value = true
      try {
        const r = await nodeInteractionService.getForks(props.fork.id)
        children.value = (r.success && r.forks) || []
        loaded.value = true
      } catch (_) { children.value = [] }
      loading.value = false
    }

    return { open, loaded, loading, children, excerpt, toggle, formatTime }
  }
})
</script>

<style lang="scss" scoped>
// Shares PostCommentItem's card idiom (same class names, same tints) so
// comment trees and fork trees read as one family.
.comment {
  padding: 12px 14px;
  border: 1px solid #e2e6ed;
  border-left: 3px solid #c8d0dc;
  margin: 8px 0;
  background: #fafbfd;
  border-radius: var(--radius-sm);
  color: #2C3D4E;
}
.comment.depth-1 { margin-left: 16px; background: #f4f7fb; border-left-color: #b9c2d2; }
.comment.depth-2 { margin-left: 32px; background: #eef2f7; border-left-color: #a6b1c6; }
.comment.depth-3 { margin-left: 48px; background: #e8edf4; border-left-color: #94a1ba; }
.comment.depth-4 { margin-left: 64px; background: #e2e8f0; border-left-color: #8493ae; }

.comment :deep(.text-ink) { color: #1F2A38 !important; }
.comment :deep(.text-dim) { color: #6b7993 !important; opacity: 1; }
.comment .text-coral { color: #d35f5f !important; }
.comment .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace; }

.comment-body {
  font-size: 0.9em;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  padding: 6px 0 2px;
}

.fork-node__open {
  color: #d35f5f;
  text-decoration: none;
  font-size: 0.9em;
  &:hover { text-decoration: underline; }
}

.bare-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  font-size: inherit;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  color: inherit;
  &:hover { text-decoration: underline; }
}

.nested-replies { margin-top: 4px; }
</style>
