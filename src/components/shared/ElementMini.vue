<template>
  <!-- The "any element as a Mini" dispatcher — give it an address
       ('<kind>/<hash>') or a pre-resolved target ({ kind, node|label|
       path|skeleton|entity } from pathService.resolveLinkTarget) and it
       renders the matching Mini panel. Skeleton refs split on the summary
       route: POST instances render PostMini, every other skeleton (schema
       or populated instance) renders SkeletonMini's embeddable grid
       (2026-08-10 as ResourceSkeletonMini; the 2026-07 SkeletonMini field
       summary before that). Secrets render SecretMini since 2026-09-21
       (the element window's face); unresolvable refs degrade to an
       InfoChip, locked ones to the LockedChip.
       ⭐ 2026-09-30 (the family map): every one of the nine kinds reaches
       its Mini by ADDRESS (+ the `posts/` and `files/` aliases) and by
       PRE-RESOLVED row (+ moment / link / secret, which the path walk now
       resolves) — and every Mini wears the one basis (MiniPanel's glass,
       MiniHead's row, MiniFoot's line).
       Used by post content-element rails, by MarkdownBody's inline
       reference rendering on post surfaces, and by the skeleton
       instance viewers' populated field rows. -->
  <div class="element-mini" :class="{ 'element-mini--media': isMedia, 'element-mini--fill': isFill }">
    <div v-if="loading" class="element-mini__loading">
      <q-spinner size="14px" color="primary" />
    </div>

    <NodeMini v-else-if="shape.kind === 'node' && shape.node" :node="shape.node" />
    <!-- A PATH wears the path viewer (rebuilt 2026-09-27): depth/visited
         ride so a nested lane cannot re-enter an ancestor. -->
    <PathMini v-else-if="shape.kind === 'path' && shape.path" :path="shape.path" :steps="shape.steps" :depth="depth" :visited="visited" />
    <PostMini v-else-if="shape.kind === 'post' && shape.post" :post="shape.post" />
    <LabelMini v-else-if="shape.kind === 'label' && shape.label" :label="shape.label" :unravel="fill" />
    <EntityMini v-else-if="shape.kind === 'entity' && shape.entity" :entity="shape.entity" />
    <MomentMini v-else-if="shape.kind === 'moment' && shape.moment" :moment="shape.moment" :human="shape.human" />
    <LinkMini v-else-if="shape.kind === 'link' && shape.link" :link="shape.link" :target="shape.target" :parent-path="shape.parentPath" />
    <SecretMini v-else-if="shape.kind === 'secret' && shape.secret" :secret="shape.secret" :owner="shape.owner" :receiver="shape.receiver" />
    <!-- Non-POST skeletons wear the skeleton mini (dashboards phase 2,
         2026-08-10 as ResourceSkeletonMini; SkeletonMini since the
         skeletons plan phase 2, 2026-09-01) — it resolves the walk itself
         and blooms GITHUB_PR instances into their native card, so this
         branch needs no name pre-check. depth/visited thread the
         recursion guards through: a grid nested in a grid arrives here
         with its ancestors' refs on the list. -->
    <SkeletonMini
      v-else-if="shape.kind === 'skeleton'"
      :ref-or-id="shape.skeletonId"
      :name="label || shape.skeletonName"
      :depth="depth"
      :visited="visited"
    />

    <LockedChip v-else-if="shape.kind === 'locked'" :address="chipAddress" />
    <InfoChip v-else :address="chipAddress" :label="label" />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import NodeMini from 'src/components/nodes/NodeMini.vue'
import PathMini from 'src/components/paths/PathMini.vue'
import PostMini from 'src/components/posts/PostMini.vue'
import LabelMini from 'src/components/labels/LabelMini.vue'
import EntityMini from 'src/components/entities/EntityMini.vue'
import MomentMini from 'src/components/moments/MomentMini.vue'
import LinkMini from 'src/components/links/LinkMini.vue'
import SecretMini from 'src/components/secrets/SecretMini.vue'
import SkeletonMini from 'src/components/skeletons/SkeletonMini.vue'
import InfoChip from './InfoChip.vue'
import LockedChip from './LockedChip.vue'
import { nodeService } from 'src/services/node.service'
import { pathService } from 'src/services/path.service'
import { postService } from 'src/services/post.service'
import { labelService } from 'src/services/label.service'
import { entityService } from 'src/services/entity.service'
import { momentService } from 'src/services/moment.service'
import { linkService } from 'src/services/link.service'
import { secretService } from 'src/services/secret.service'
import { refService } from 'src/services/ref.service'
import { bodyOf } from 'src/utils/nodeContent'
import { safeCut } from 'src/utils/pathosRefs'
import { consumeRenderLayer } from 'src/composables/useRenderDepth'

export default defineComponent({
  name: 'ElementMini',
  components: { NodeMini, PathMini, PostMini, LabelMini, EntityMini, MomentMini, LinkMini, SecretMini, SkeletonMini, InfoChip, LockedChip },
  props: {
    // '<kind>/<hash>' reference (optionally owner-scoped) — self-resolves.
    address: { type: String, default: '' },
    // Pre-resolved target from the API ({ kind, node|label|path|... }) —
    // skips fetching entirely when supplied.
    element: { type: Object, default: null },
    // Optional headline override for the InfoChip fallback.
    label: { type: String, default: '' },
    // Recursion guards, threaded through to SkeletonMini (a
    // skeleton table nested in a skeleton table re-enters this dispatcher
    // conceptually — the guards ride the props either way).
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] },
    // A WINDOW FACE (2026-10-07: ElementFlyout's element face + the side
    // viewer's SideElementView): a kind with a full-height viewer takes the
    // host's whole height — today the LABEL, whose Mini becomes the unravel
    // viewer. Every other kind ignores it and keeps its own height.
    fill: { type: Boolean, default: false }
  },
  setup (props) {
    const loading = ref(false)
    const shape = ref({ kind: null })

    // THE DEPTH DIAL (2026-10-07): a Mini is one layer of enrichment —
    // everything quoted inside it stands one layer deeper, so the budget
    // the surface provided goes down by one for this subtree (no dial
    // above = nothing provided, the family's own guards rule).
    consumeRenderLayer()

    const chipAddress = computed(() => {
      if (props.address) return props.address
      // Reconstruct a chip address from a pre-resolved target row.
      const el = props.element
      if (!el) return ''
      const row = el.node || el.label || el.path || el.skeleton || el.entity || el.moment || el.link || el.secret
      return row?.path || ''
    })

    const norm = (addr) => {
      const parts = (addr || '').trim().split('/')
      return parts.length >= 2
        ? { prefix: parts[parts.length - 2], hash: parts[parts.length - 1] }
        : null
    }

    const fromElement = async (el) => {
      if (el.kind === 'node' && el.node) return { kind: 'node', node: el.node }
      if (el.kind === 'label' && el.label) return { kind: 'label', label: el.label }
      if (el.kind === 'entity' && el.entity) return { kind: 'entity', entity: el.entity }
      // (2026-09-30 — the family map's dispatch gaps) a walk's MOMENT, LINK
      // and SECRET targets carry their rows since pathService's resolver
      // learnt them; before, a path member of those kinds fell through to
      // the InfoChip even in the lane's enriched mode.
      if (el.kind === 'moment' && el.moment) return { kind: 'moment', moment: el.moment, human: el.human || null }
      if (el.kind === 'link' && el.link) return { kind: 'link', link: el.link, target: el.target || null, parentPath: el.parentPath || null }
      if (el.kind === 'secret' && el.secret) return { kind: 'secret', secret: el.secret, owner: el.owner || null, receiver: el.receiver || null }
      if (el.kind === 'path' && el.path) {
        // Fetch the walked steps so the Mini can render its element strip.
        try {
          const r = await pathService.byId(el.path.id, 'forward')
          if (r.success) return { kind: 'path', path: { ...r.path, author: r.owner }, steps: r.steps }
        } catch (_) { /* fall through */ }
        return { kind: 'path', path: el.path, steps: null }
      }
      if (el.kind === 'skeleton' && el.skeleton) {
        // POST instances read as posts; every other skeleton (schema or
        // populated instance) gets the embeddable mini table.
        if (el.skeleton.name === 'POST') return fetchPost(el.skeleton.id)
        return { kind: 'skeleton', skeletonId: el.skeleton.id, skeletonName: el.skeleton.name || '' }
      }
      return { kind: null }
    }

    const fetchPost = async (id) => {
      try {
        const r = await postService.get(id)
        if (r.success && r.post) {
          const p = r.post
          // The read carries no author object and no votes (it never did —
          // the old PostMini printed ↑0 ↓0 on every quoted post); the new
          // foot states the OWNER (resolved by id through the entity cache)
          // and the content node's birth, which the read does carry.
          return {
            kind: 'post',
            post: {
              id: p.id,
              path: p.path,
              title: p.title,
              // RAW markdown, cut without splitting a [[pathos:…]] token
              // (2026-10-07): PostMini renders its refs as live slots now.
              excerpt: safeCut(bodyOf(p.node) || '', 1200),
              owner_id: p.owner_id ?? null,
              created_at: p.created_at || p.node?.createdAt || null,
              forked_from_id: p.forked_from_id ?? null
            }
          }
        }
      } catch (_) { /* chip fallback */ }
      return { kind: null }
    }

    const fromAddress = async (addr) => {
      const ref_ = norm(addr)
      if (!ref_) return { kind: null }
      try {
        switch (ref_.prefix) {
          case 'nodes': {
            const r = await nodeService.getByPath(ref_.hash)
            return r.success ? { kind: 'node', node: r.node } : { kind: null }
          }
          case 'paths': {
            const r = await pathService.byHash(ref_.hash, 'forward')
            return r.success ? { kind: 'path', path: { ...r.path, author: r.owner }, steps: r.steps } : { kind: null }
          }
          // A POST is a skeleton by address; a `posts/<hash>` ref (the pill's
          // own spelling, and what an author copies off a post chip) resolves
          // exactly as its `skeletons/<hash>` twin — /refs/summary maps the
          // prefix itself (2026-09-30; it fell through to the InfoChip).
          case 'posts':
          case 'skeletons': {
            const s = await refService.summary(addr)
            // The locked stub CARRIES an id (the hash stays visible by
            // doctrine) — check locked FIRST or a private skeleton mounts
            // a mini table that 403s on every field.
            if (s.success && s.summary?.locked) return { kind: 'locked' }
            if (!s.success || s.summary?.id == null) return { kind: null }
            // POST instances get the post Mini; every other skeleton gets
            // the embeddable mini table.
            if ((s.summary.route || '').startsWith('/posts/')) return fetchPost(s.summary.id)
            return { kind: 'skeleton', skeletonId: s.summary.id, skeletonName: s.summary.primary || '' }
          }
          case 'labels': {
            const s = await refService.summary(addr)
            if (!s.success || s.summary?.id == null) return { kind: null }
            const r = await labelService.get(s.summary.id)
            return r.success ? { kind: 'label', label: r.label } : { kind: null }
          }
          // `files/<hash>` is the entity REGISTRY's alias (kinds.js) — the
          // same entity, the same Mini.
          case 'files':
          case 'entities': {
            const s = await refService.summary(`entities/${ref_.hash}`)
            if (!s.success || s.summary?.id == null) return { kind: null }
            const r = await entityService.get(s.summary.id)
            return r.success ? { kind: 'entity', entity: r.entity } : { kind: null }
          }
          case 'moments': {
            const r = await momentService.getByHash(ref_.hash)
            return r.success ? { kind: 'moment', moment: r.moment, human: r.human } : { kind: null }
          }
          case 'links': {
            const r = await linkService.getByHash(ref_.hash)
            return r.success ? { kind: 'link', link: r.link, target: r.target, parentPath: r.parentPath } : { kind: null }
          }
          case 'secrets': {
            // (2026-09-21) A secret has a Mini of its own — the sealed card
            // with its parties — and the element window needs it; the
            // InfoChip fallback below stays for anything the read refuses.
            const r = await secretService.getByHash(ref_.hash)
            return r?.success && r.secret
              ? { kind: 'secret', secret: r.secret, owner: r.owner || null, receiver: r.receiver || null }
              : { kind: null }
          }
          default:
            return { kind: null }
        }
      } catch (_) {
        return { kind: null }
      }
    }

    const load = async () => {
      loading.value = true
      shape.value = props.element
        ? await fromElement(props.element)
        : await fromAddress(props.address)
      // Access doctrine: an unresolvable ref may be LOCKED (403 direct
      // reads) — the summary endpoint says so with its locked stub, and
      // the block embed renders the lock-bubbled hash chip instead.
      if (shape.value.kind === null && props.address) {
        try {
          const s = await refService.summary(props.address)
          if (s.success && s.summary?.locked) shape.value = { kind: 'locked' }
        } catch (_) { /* stay on the InfoChip fallback */ }
      }
      loading.value = false
    }

    onMounted(load)
    watch(() => [props.address, props.element], load)

    // A node whose preview IS a picture, a player or an embedded frame.
    // The 480px cap below is a MEASURE — the width prose is comfortable to
    // read — and a figure is not prose: it should use whatever the surface
    // gives it. Resolved here rather than sniffed out of the rendered DOM,
    // since this is the component that already knows the shape.
    const isMedia = computed(() => {
      const n = shape.value.kind === 'node' ? shape.value.node : null
      return !!n && (!!n.embed || ['image', 'video'].includes(n.file?.kind))
    })

    const isFill = computed(() => props.fill && shape.value.kind === 'label')

    return { loading, shape, chipAddress, isMedia, isFill }
  }
})
</script>

<style lang="scss" scoped>
// A comfortable prose MEASURE for the panels that are read as text.
.element-mini {
  max-width: 480px;
}

// A filling face (`fill` + a kind that has one — the label's unravel
// viewer): the whole host, width and height, and the panel's body becomes
// the column's stretch instead of a 110px excerpt. Child chains only, so a
// Mini nested deeper inside keeps the family's excerpt rule.
.element-mini--fill {
  max-width: none;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.element-mini--fill > :deep(.mini-panel-link) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.element-mini--fill > :deep(.mini-panel-link > .mini-panel) {
  flex: 1 1 auto;
  min-height: 0;
}
.element-mini--fill > :deep(.mini-panel-link > .mini-panel > .mini-panel__body) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  padding: 0;
}

// …but a media Mini is a FIGURE: it takes the surface's whole width and
// bounds itself by the surface's height budget instead (`--media-max-h`,
// honoured down in NodeMini/EmbedFrame). Capping it here as well would
// leave a picture in a 480px box with the rest of the column empty beside
// it — and would cap the frame by the wrong dimension, since the one that
// overflows is the height.
.element-mini--media {
  max-width: 100%;
}
.element-mini__loading {
  padding: 6px 0;
}
</style>
