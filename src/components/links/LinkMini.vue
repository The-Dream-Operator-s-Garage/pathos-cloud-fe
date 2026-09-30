<template>
  <!-- THE LINK MINI — a link (one bond of a path: it points at a target and
       knows its prev / next) quoted as a panel: the element window, a path
       lane's member, the file tree.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "take as layout
       the node mini viewer … use the nano pills icons and coloring"). It was
       the default STACK head (link # → kind # / path # + chain position / the
       chip) over a grey text summary. NodeMini's grammar now, in the link
       pill's indigo-8:
         HEAD  chip+copy │ link #12 → node #34 │ open        (MiniHead)
         BODY  WHAT IT BONDS TO — the target as its own extended nano pill
               (a door: click → the target's window), the way PathLane
               draws a member in reference mode
         FOOT  🔗 path #415 · mid-chain                       (MiniFoot) -->
  <MiniPanel kind="links" :to="targetRoute">
    <template #head>
      <MiniHead
        kind="links"
        :id="link.id"
        :path="link.path"
        :integrity="link.integrity || null"
        :name="headline"
      />
    </template>

    <template #body>
      <div class="link-mini__target">
        <span class="link-mini__arrow">→</span>
        <EntityMicro
          v-if="targetPrefix === 'entities'"
          :id="link.target_id"
          :path="targetRow?.path || ''"
        />
        <MicroChip
          v-else
          :kind="targetPrefix"
          :id="link.target_id"
          :path="targetRow?.path || ''"
          :display="targetDisplay"
          :integrity="targetRow?.integrity || null"
        />
      </div>
    </template>

    <template #foot>
      <MiniFoot kind="links" :facts="footFacts" :title="chainTitle" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import { prefixFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'LinkMini',
  components: { MiniPanel, MiniHead, MiniFoot, MicroChip, EntityMicro },
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

    const headline = computed(() =>
      `link #${props.link.id} → ${props.link.target_type || 'element'} #${props.link.target_id ?? '?'}`)

    // A POST target is a skeleton by address (its `path` is `skeletons/…`).
    const targetPrefix = computed(() => {
      const t = props.link.target_type
      return t === 'post' ? 'skeletons' : prefixFor(t || 'unknown')
    })
    const targetRow = computed(() => {
      const kind = props.target?.kind
      return kind ? (props.target[kind] || null) : null
    })
    // A name where the target has one that is not an address — a label's,
    // a skeleton's (PathLane's `displayOf` rule); nodes and paths keep their
    // hash (a note's title is not its identity).
    const targetDisplay = computed(() => {
      const row = targetRow.value
      if (!row) return ''
      if (targetPrefix.value === 'labels') return row.name || ''
      if (targetPrefix.value === 'skeletons') return row.name && row.name !== 'POST' ? row.name : ''
      return ''
    })

    const chainPosition = computed(() => {
      const hasPrev = !!props.link.prev_id
      const hasNext = !!props.link.next_id
      if (!hasPrev && !hasNext) return 'sole link'
      if (!hasPrev) return 'chain head'
      if (!hasNext) return 'chain tail'
      return 'mid-chain'
    })
    const chainTitle = computed(() =>
      `prev: ${props.link.prev_id || '—'} · next: ${props.link.next_id || '—'}`)

    const footFacts = computed(() => [
      props.parentPath?.id != null && `path #${props.parentPath.id}`,
      chainPosition.value
    ].filter(Boolean))

    return { targetRoute, headline, targetPrefix, targetRow, targetDisplay, footFacts, chainTitle }
  }
})
</script>

<style lang="scss" scoped>
// The target on its own centred line, the bond's arrow before it.
.link-mini__target {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 3px 4px;
}
.link-mini__arrow {
  flex: 0 0 auto;
  font-size: 0.8em;
  color: var(--mini-accent, #283593);
}
</style>
