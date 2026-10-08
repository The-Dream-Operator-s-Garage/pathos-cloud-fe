<template>
  <!-- THE LINK CARD (2026-10-08, the card family) — one bond of a path as a
       CARD. Where LinkMini says only what it bonds to, this reads the link
       the way its face does: the CHAIN around it (prev ← this → next, the
       neighbours' own chips), its place in the path it belongs to (the cap's
       origin clause: `Step of <path chip> ::`), who minted it and when (the
       byline), and the TARGET drawn as its Mini in the pit — a card quoting
       a panel, the families nesting the way the post card quotes nodes.
       Acts: share · open; the thread doors offer comments (a link's schema
       holds a COMMENTS path since 2026-10-07) and no forks. -->
  <CardPanel kind="links" :address="link.path" :open="isOpen" :fill="fill">
    <template #cap>
      <CardCap
        kind="links"
        :icons="['link']"
        icons-title="A link — one bond of a path"
        :origins="origins"
        :title="headline"
        :title-tip="link.path"
        :acts="[shareAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="owner" :when="when">
        <template #rail>
          <span class="element-card__rail-text mono" :title="chainTitle">{{ chainPosition }}</span>
        </template>
      </CardByline>
    </template>

    <template #pit>
      <div class="link-card__body">
        <div class="link-card__chain">
          <LinkMicro v-if="prev" :id="prev.id" :path="prev.path" collapsed class="link-card__neighbour" />
          <span v-else class="link-card__edge"><q-icon name="first_page" size="12px" /> chain head</span>
          <span class="link-card__rail" aria-hidden="true" />
          <span class="link-card__here" :title="link.path"><q-icon name="link" size="12px" /> this link</span>
          <span class="link-card__rail" aria-hidden="true" />
          <LinkMicro v-if="next" :id="next.id" :path="next.path" collapsed class="link-card__neighbour" />
          <span v-else class="link-card__edge">chain tail <q-icon name="last_page" size="12px" /></span>
        </div>

        <div class="link-card__target-line">
          <span class="link-card__arrow">→</span>
          <EntityMicro v-if="targetPrefix === 'entities'" :id="link.target_id" :path="targetRow?.path || ''" />
          <MicroChip
            v-else
            :kind="targetPrefix"
            :id="link.target_id"
            :path="targetRow?.path || ''"
            :display="targetDisplay"
            :integrity="targetRow?.integrity || null"
          />
          <span v-if="link.type_id" class="link-card__note mono">type {{ link.type_id }}</span>
        </div>

        <div v-if="targetRow" class="link-card__target">
          <ElementMini :element="target" :depth="1" :visited="[link.path]" />
        </div>
      </div>
    </template>

    <template #foot>
      <CardFoot kind="links" :id="link.id" :path="link.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span v-if="parentPath?.id != null" class="element-card__stat" :title="parentPath.path || ''">
            <q-icon name="route" size="11px" />path #{{ parentPath.id }}
          </span>
          <span class="element-card__stat" :title="chainTitle">{{ chainPosition }}</span>
        </template>
      </CardFoot>
    </template>

    <template v-if="composing && commentParent" #storey>
      <CommentMaker variant="inline" :parent="commentParent" @cancel="closeComposer" @posted="onCommented" />
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import LinkMicro from './LinkMicro.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { prefixFor } from 'src/utils/kinds'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'LinkCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, MicroChip, ElementMini, EntityMicro, LinkMicro, CommentMaker },
  props: {
    // Link row { id, path, prev_id, next_id, target_type, target_id, … }.
    link: { type: Object, required: true },
    // Resolved target ({ kind, node|label|… }) from the link read.
    target: { type: Object, default: null },
    parentPath: { type: Object, default: null },
    prev: { type: Object, default: null },
    next: { type: Object, default: null },
    owner: { type: Object, default: null },
    moment: { type: Object, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
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
    const chainTitle = computed(() => `prev: ${props.link.prev_id || '—'} · next: ${props.link.next_id || '—'}`)

    const origins = computed(() => (props.parentPath?.id != null
      ? [{ word: 'Step of', kind: 'paths', id: props.parentPath.id, path: props.parentPath.path || '', display: props.parentPath.title || '' }]
      : []))

    const when = computed(() => {
      const m = props.moment
      if (m?.id != null) return { id: m.id, datetime: m.human?.datetime || m.time_utc || '', place: m.human?.place || '' }
      const ts = props.link.created_at || props.link.createdAt
      return ts ? { datetime: absoluteTime(ts) } : null
    })

    const card = useElementCard(props, emit, () => ({
      kind: 'links',
      address: props.link.path || '',
      id: props.link.id,
      label: headline.value,
      ownerId: props.link.owner_id ?? props.owner?.id ?? null
    }))

    return { headline, targetPrefix, targetRow, targetDisplay, chainPosition, chainTitle, origins, when, ...card }
  }
})
</script>

<style lang="scss" scoped>
.link-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
// prev ← this → next, the face's chain row.
.link-card__chain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 0.78em;
}
.link-card__rail {
  flex: 1 1 auto;
  height: 1px;
  background: var(--card-accent, #283593);
  opacity: 0.45;
}
.link-card__here {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--card-ink, #1a237e);
  font-family: var(--font-display);
  font-size: 0.9em;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.link-card__edge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(var(--ink-rgb), 0.5);
  white-space: nowrap;
}
.link-card__neighbour { flex: 0 1 auto; min-width: 0; }
.link-card__target-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.link-card__arrow { color: var(--card-accent, #283593); }
.link-card__note { font-size: 0.74em; color: rgba(var(--ink-rgb), 0.5); }
.link-card__target { min-width: 0; }
</style>
