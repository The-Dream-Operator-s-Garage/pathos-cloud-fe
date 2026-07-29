<template>
  <div class="slot-row" :class="'slot-' + entry.slotName.toLowerCase()">
    <div class="slot-label">
      <q-icon :name="iconForSlot(entry.slotName)" size="12px" class="q-mr-xs" />
      {{ entry.slotName }}
    </div>

    <div class="slot-value">
      <!-- Empty / unbound -->
      <div v-if="!entry.ref" class="text-dim slot-empty">(unbound)</div>

      <!-- Resolving -->
      <q-spinner v-else-if="loading" size="14px" color="primary" />

      <!-- Node reference — TITLE inline, CONTENT as markdown. These are
           the actual content of the skeleton, so they render as text, not
           as a chip. -->
      <div v-else-if="entry.refKind === 'nodes' && resolved && entry.slotName === 'TITLE'" class="text-ink slot-inline">
        {{ resolved.content || '(empty)' }}
      </div>
      <NodeContentViewer v-else-if="entry.refKind === 'nodes' && resolved && entry.slotName === 'CONTENT'" class="md-rendered slot-markdown" :node="resolved" mode="full" ref-display="mini" />

      <!-- CONTENT now binds a path of elements (body node + references) —
           the Mini renders it as its element strip. -->
      <ElementMini v-else-if="entry.refKind === 'paths' && entry.slotName === 'CONTENT'" :address="entry.ref" />

      <!-- Plumbing references (interaction/version trees, labels path)
           stay compact chips — their content renders in the dedicated
           panels the hint points to. -->
      <div v-else-if="chipProps && slotHint" class="slot-chip-row">
        <InfoChip v-bind="chipProps" />
        <span class="slot-hint text-dim">{{ slotHint }}</span>
      </div>

      <!-- Every other bound reference blooms into the kind's Mini panel:
           a detailed preview that routes to the element's own viewer. -->
      <ElementMini v-else-if="chipProps" :address="entry.ref" :label="chipProps.primary || ''" />

      <!-- Couldn't parse the ref at all -->
      <div v-else class="text-dim">
        <span class="mono text-hash">{{ entry.ref }}</span>
        <span class="q-ml-sm">(unresolved)</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed, onMounted } from 'vue'
import { skeletonService } from 'src/services/skeleton.service'
import { parseRef } from 'src/utils/kinds'
import InfoChip from 'src/components/shared/InfoChip.vue'
import NodeContentViewer from 'src/components/nodes/NodeContentViewer.vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import { excerptOf } from 'src/utils/nodeContent'

const ICON_BY_SLOT = {
  AUTHOR: 'person',
  PARENT: 'arrow_upward',
  PROVENANCE: 'verified',
  TITLE: 'title',
  CONTENT: 'description',
  INTERACTION_TREE: 'forum',
  VERSION_TREE: 'history',
  ATTACHMENTS: 'attach_file',
  TARGET: 'gps_fixed',
  NOTE: 'sticky_note_2',
  TRANSFORMATIONS: 'change_history',
  CREATED_AT: 'schedule',
  FORKED_FROM: 'fork_right',
  LABELS_PATH: 'label_important',
  USERNAME: 'alternate_email',
  DISPLAY_NAME: 'badge',
  INVITED_BY: 'person_add',
  JOINED_AT: 'schedule',
  POSTS_PATH: 'route',
  BIO: 'notes',
  KIND: 'category',
  PATH_REF: 'route'
}

const HINT_BY_SLOT = {
  INTERACTION_TREE: '— see Comments / Forks below',
  VERSION_TREE: '— see Versions below',
  LABELS_PATH: '— the label rail above reads from this path'
}

export default defineComponent({
  name: 'SlotRenderer',
  components: { InfoChip, NodeContentViewer, ElementMini },
  props: {
    entry: { type: Object, required: true }
  },
  setup (props) {
    const resolved = ref(null)
    const loading = ref(false)

    const resolve = async () => {
      if (!props.entry.ref) { resolved.value = null; return }
      loading.value = true
      try {
        const r = await skeletonService.resolveRef(props.entry.ref)
        resolved.value = r.success ? r.row : null
      } catch (_) { resolved.value = null }
      loading.value = false
    }

    onMounted(resolve)
    watch(() => props.entry.ref, resolve)

    // Build the InfoChip props for any parseable ref. Pre-resolved rows
    // supply the display line straight away; anything else lets the chip
    // self-resolve through /refs/summary.
    const chipProps = computed(() => {
      const ref_ = parseRef(props.entry.ref || '')
      if (!ref_) return null
      const row = resolved.value
      const base = { kind: ref_.prefix, address: ref_.address, dense: false }
      if (row?.id != null) base.id = row.id
      if (row) {
        // Entities keep primary unset so the chip resolves via /refs/summary
        // — that's where the username and the pioneer flag come from.
        if (ref_.prefix === 'labels') base.primary = row.name
        else if (ref_.prefix === 'skeletons') base.primary = row.name || `skeleton #${row.id}`
        else if (ref_.prefix === 'nodes') base.primary = excerptOf(row, 60) || `node #${row.id}`
        else if (ref_.prefix === 'paths') base.primary = `path #${row.id}`
        // moments/secrets/links: leave primary unset — the chip resolves
        // the human line (datetime + place, used/unused, target) itself.
      }
      return base
    })

    const slotHint = computed(() => HINT_BY_SLOT[props.entry.slotName] || '')

    const iconForSlot = (name) => ICON_BY_SLOT[name] || 'circle'

    return { resolved, loading, chipProps, slotHint, iconForSlot }
  }
})
</script>

<style lang="scss" scoped>
.slot-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.06);
  align-items: start;
}
.slot-row:last-child { border-bottom: none; }

.slot-label {
  font-size: 0.78em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
}

.slot-value {
  min-width: 0;
  font-size: 0.92em;
  color: var(--ink);
  word-break: break-word;
}

.slot-empty {
  font-style: italic;
  font-size: 0.85em;
}

.slot-inline {
  font-size: 0.9em;
}

.slot-markdown {
  background: rgba(var(--ink-rgb), 0.03);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}

.slot-chip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.slot-hint { font-size: 0.8em; }
</style>
