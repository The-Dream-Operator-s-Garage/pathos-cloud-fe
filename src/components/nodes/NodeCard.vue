<template>
  <!-- THE NODE CARD (2026-10-08, the card family) — a node (a note, a file,
       a link, a reference) as a CARD. Where NodeMini is the quoted node (a
       few lines, a thumbnail-sized figure, 110px), this is the full reading
       in the post card's grammar: the cap states what it is (the node glyph
       + its TYPE's mark) and what it came out of (`Comment on <chip> ::`
       off `node.origin`), the byline who made it, when, and the labels on
       it (the read carries them with their chains), the pit THE WHOLE
       BODY — a note or a doc rendered through MarkdownBody (the one
       pipeline, `auto` refs so quoted pictures and players bloom), a file
       or a link as the thing itself (NodeContentViewer's full mode) — and
       the foot its address, the thread doors and its votes.
       Acts: edit (owner → /nodes/:id/edit) · share · pin (nodes take pins)
       · open (the node's own window, the enriched row handed over).
       ⚠ Until 2026-10-08 this file was the pre-feed list card
       (`.pathos-card`); the node explorer mounts this one now. -->
  <CardPanel kind="nodes" :address="row.path" :open="isOpen" :fill="fill" :pit-fit="isFigure">
    <template #cap>
      <CardCap
        kind="nodes"
        :icons="icons"
        :icons-title="'A ' + typeName.toLowerCase() + ' node'"
        :origins="origins"
        :title="nodeLabel"
        :title-tip="row.path || nodeLabel"
        :acts="[editAct, shareAct, pinAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="row.labels || []" />
    </template>

    <template #pit>
      <div v-if="isWithheld" class="node-card__withheld" @click.stop.prevent="openIntegrityReport">
        <q-icon name="report" size="13px" />
        <span>body withheld — integrity check failed{{ integrityReport ? ' · open Talavero\'s report' : '' }}</span>
      </div>
      <NodeContentViewer v-else-if="isFigure || isLink" :node="row" mode="full" ref-display="auto" class="node-card__figure" />
      <MarkdownBody
        v-else-if="bodyText"
        class="node-card__md"
        :text="bodyText"
        :breaks="false"
        ref-display="auto"
      />
      <div v-else class="node-card__empty">(no content)</div>
    </template>

    <template #foot>
      <CardFoot kind="nodes" :id="row.id" :path="row.path" :stats="threadStats" @stat="onStat">
        <template v-if="row.votes" #end>
          <span class="element-card__stat" title="up-votes"><q-icon name="keyboard_arrow_up" size="11px" />{{ row.votes.up || 0 }}</span>
          <span class="element-card__stat" title="down-votes"><q-icon name="keyboard_arrow_down" size="11px" />{{ row.votes.down || 0 }}</span>
        </template>
      </CardFoot>
    </template>

    <template v-if="composing && commentParent" #storey>
      <CommentMaker variant="inline" :parent="commentParent" @cancel="closeComposer" @posted="onCommented" />
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import NodeContentViewer from './NodeContentViewer.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { nodeService } from 'src/services/node.service'
import { bodyOf } from 'src/utils/nodeContent'
import { prefixFor } from 'src/utils/kinds'
import { entitySummary } from 'src/utils/entityDisplay'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

// The type's mark beside the node glyph — Material Icons ligatures.
const TYPE_GLYPH = { NOTE: 'notes', FILE: 'attach_file', URL: 'link', REFERENCE: 'tag' }

export default defineComponent({
  name: 'NodeCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, MarkdownBody, NodeContentViewer, CommentMaker },
  props: {
    // Enriched node: { id, path, content, file, embed, type, labels, author,
    // origin, votes, moment?, owner_id, createdAt }
    node: { type: Object, required: true },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const router = useRouter()

    // THE FULL READ. A `GET /nodes/by-path` row (what a reference resolves
    // through — the Mini's one request) carries the body, the type and the
    // tallies but no labels, no author card, no header; the card is the
    // reading surface, so it enriches itself ONCE from `GET /nodes/:id`
    // (labels with their chains, the author card, the ELEMENT header's
    // minting moment and lineage) — unless it stands in a list
    // (`thread: false`, the explorer's fifty rows) or the row already came
    // whole. The props' row is read underneath, so nothing is lost.
    const full = ref(null)
    const row = computed(() => (full.value
      ? { ...props.node, ...full.value.node, header: full.value.header || props.node.header || null }
      : props.node))
    watch(() => props.node?.id, async (id) => {
      full.value = null
      if (id == null || props.thread === false) return
      if (Array.isArray(props.node.labels) && props.node.header) return
      try {
        const r = await nodeService.get(id)
        if (r?.success && r.node && props.node?.id === id) full.value = { node: r.node, header: r.header || null }
      } catch (_) { /* the by-path row still draws the card */ }
    }, { immediate: true })

    const typeName = computed(() => row.value.type?.name || row.value.type_name || (row.value.file ? 'FILE' : 'NOTE'))
    const icons = computed(() => ['adjust', TYPE_GLYPH[typeName.value] || 'notes'])
    const nodeLabel = computed(() => {
      const t = String(row.value.title || '').trim()
      if (t) return t
      return `node #${row.value.id} · ${typeName.value}`
    })

    // The origin clause — a comment-node's parent (the explorer's list rows
    // and the thread reads pre-enrich `origin`).
    const origins = computed(() => {
      const out = []
      const o = row.value.origin
      const co = o?.comment_of
      if (o && o.kind === 'COMMENT' && co) {
        const root = o.root
        const target = root && root.kind === 'post' && root.id === co.id ? root : co
        const prefix = target.kind === 'post' ? 'posts' : prefixFor(target.kind || 'nodes')
        out.push({ word: 'Comment on', kind: prefix, id: target.id, path: target.path || '', display: target.title || '' })
      }
      // The ELEMENT header's lineage: a forked node names its origin.
      const ff = row.value.header?.forkedFrom
      if (ff && (ff.id != null || ff.path)) out.push({ word: 'Fork of', kind: prefixFor(ff.kind || 'nodes'), id: ff.id ?? null, path: ff.path || '', display: ff.title || '' })
      return out
    })

    // WHO — the read's author card, else the owner through the summary cache.
    const author = ref(null)
    watch(() => [row.value.author, row.value.header?.author, row.value.owner_id ?? row.value.author_id], async () => {
      const a = row.value.author || row.value.header?.author
      if (a && (a.display_name || a.username)) { author.value = a; return }
      const id = a?.id ?? row.value.owner_id ?? row.value.author_id ?? null
      author.value = null
      if (id == null) return
      const s = await entitySummary({ id })
      author.value = s ? { id, display_name: s.primary || '', pioneer: s.pioneer === true } : { id }
    }, { immediate: true })
    // WHEN — the header's minting moment (a door to the moment window),
    // else the row's own moment, else the birth stamp.
    const when = computed(() => {
      const c = row.value.header?.createdAt
      if (c && (c.human || c.time_utc)) return { id: c.momentId ?? null, datetime: c.human || c.time_utc, place: c.place || '' }
      const m = row.value.moment
      if (m?.id != null) return { id: m.id, datetime: m.human?.datetime || m.datetime || m.time_utc || '', place: m.human?.place || m.place || '' }
      const ts = row.value.createdAt || row.value.created_at
      return ts ? { datetime: absoluteTime(ts) } : null
    })

    // THE BODY — the figures and links through the content viewer, the
    // words through MarkdownBody (a file's text via bodyOf: a FILE node's
    // `content` is an ADDRESS).
    const fileKind = computed(() => row.value.file?.kind || null)
    const isFigure = computed(() => !!row.value.embed || ['image', 'video', 'audio', 'binary'].includes(fileKind.value) || (!!row.value.file && fileKind.value !== 'text'))
    const isLink = computed(() => !row.value.file && typeName.value === 'URL')
    const bodyText = computed(() => (row.value.file ? (fileKind.value === 'text' ? (bodyOf(row.value) || '') : '') : String(row.value.content || row.value.excerpt || '')))

    const integrityReport = computed(() => row.value.integrity?.report || null)
    const isWithheld = computed(() => row.value.content_withheld === true)
    const openIntegrityReport = () => {
      if (integrityReport.value) router.push({ path: '/feed', query: { flyout: integrityReport.value } })
    }

    const card = useElementCard(props, emit, () => ({
      kind: 'nodes',
      address: row.value.path || '',
      id: row.value.id,
      label: nodeLabel.value,
      ownerId: row.value.owner_id ?? row.value.author_id ?? row.value.author?.id ?? null,
      target: { kind: 'node', node: row.value }
    }))
    const editAct = computed(() => ({
      key: 'edit',
      icon: 'edit',
      title: 'Edit this node',
      hidden: !card.isOwner.value || !!row.value.file,
      onClick: () => router.push(`/nodes/${row.value.id}/edit`)
    }))

    return { row, typeName, icons, nodeLabel, origins, author, when, isFigure, isLink, bodyText, integrityReport, isWithheld, openIntegrityReport, editAct, ...card }
  }
})
</script>

<style lang="scss" scoped>
.node-card__md :deep(.markdown-body) { color: inherit; }
.node-card__figure {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 6px;
  :deep(.ncv-media) { max-height: var(--media-max-h, 60vh); }
}
.node-card__empty {
  font-size: 0.82em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
}
.node-card__withheld {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  color: #a03d3d;
  cursor: pointer;
}
</style>
