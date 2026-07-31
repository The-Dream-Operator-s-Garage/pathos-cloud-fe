<template>
  <q-page class="bg-base post-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <AccessDeniedBanner v-else-if="locked" :address="locked.address" />

      <div v-else-if="!skeleton" class="text-center text-dim q-py-xl">
        Couldn't load skeleton.
      </div>

      <div v-else class="post-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column
        ══════════════════════════════════════════════════════════ -->
        <div class="main-pane">

          <!-- subject-panel — the single container that holds everything
               about the viewed post: identity zone (title, author chips,
               structure link, labels), the bound-node meta strip, the body
               viewport, the action footer, and any inline forms. One outer
               border + one shadow; internal sections separated by hairline
               dividers and alternating tinted/white surfaces so the eye
               reads it as one continuous object. -->
          <main class="subject-panel">

            <!-- Identity zone — title, chip row, labels. Sits on a softly
                 tinted "chrome" surface so it visually anchors the panel. -->
            <header v-if="hasIdentityHeader" class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="article" size="22px" class="subject-panel__title-icon" />
                <span class="vsep" aria-hidden="true" />
                <div
                  v-if="effectiveTitleVisible"
                  class="subject-panel__title nasalization"
                >
                  <template v-if="origin && origin.kind === 'COMMENT' && origin.comment_of">
                    Comment from
                    <router-link
                      v-if="originRoot"
                      :to="originRoot.route"
                      class="origin-hash-link mono"
                      :title="origin.comment_of.path"
                    >{{ originHashLabel }}</router-link>
                    <span v-else class="origin-hash-fallback mono">{{ originHashLabel }}</span>
                  </template>
                  <template v-else>{{ titleContent }}</template>
                </div>
                <span v-if="effectiveTitleVisible" class="vsep" aria-hidden="true" />
                <router-link
                  :to="'/skeletons/' + id"
                  class="structure-link structure-link--stacked"
                  title="View skeleton structure"
                >
                  <q-icon name="schema" size="16px" />
                  <span class="structure-link__label">view as<br>skeleton</span>
                </router-link>
              </div>

              <div
                v-if="authorEntity || skeletonMomentId || sliderLabels.length"
                class="subject-panel__labels"
              >
                <router-link
                  v-if="authorEntity"
                  :to="'/entities/' + authorEntity.id"
                  class="author-chip"
                  :title="authorEntity.path"
                >
                  <q-icon name="person" size="13px" class="q-mr-xs" />
                  <strong>{{ authorDisplayName }}</strong>
                  <span class="author-chip-sep">|</span>
                  <span class="author-chip-hash mono">entity/{{ shortEntityHash(authorEntity.path) }}</span>
                </router-link>
                <span
                  v-if="authorEntity && (skeletonMomentId || sliderLabels.length)"
                  class="vsep"
                  aria-hidden="true"
                />
                <MomentInfo v-if="skeletonMomentId" :moment-id="skeletonMomentId" />
                <span
                  v-if="skeletonMomentId && sliderLabels.length"
                  class="vsep"
                  aria-hidden="true"
                />
                <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
              </div>
            </header>

            <!-- Meta strip — surfaces the underlying CONTENT node's real
                 filesystem location (files/<authorHash>/nodes/<nodeHash>)
                 so the user can copy the on-disk path and open the node. -->
            <div v-if="contentNode" class="subject-panel__meta">
              <div class="meta-label">
                <AddressChain :path="contentNodeFsPath" :routes="addressRoutes" />
              </div>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copyHashTitle"
                @click="copyContentNodeRef"
                class="meta-btn"
              />
              <router-link :to="'/nodes/' + contentNode.id" class="meta-btn meta-link" title="View the underlying node">
                <q-icon name="open_in_new" size="14px" />
              </router-link>
            </div>

            <!-- Forked-from banner — back-link to the post this is a fork
                 of. Type + hash give cryptographic identification. -->
            <router-link
              v-if="skeleton.forked_from_id"
              :to="'/posts/' + skeleton.forked_from_id"
              class="subject-panel__banner banner--fork"
            >
              <q-icon name="alt_route" size="13px" class="q-mr-sm" />
              <span class="banner-label">Forked from</span>
              <span class="banner-kind">post</span>
              <span class="banner-id mono">#{{ skeleton.forked_from_id }}</span>
              <span v-if="forkSource && forkSource.path" class="banner-hash mono"
                :title="forkSource.path">{{ forkSource.path }}</span>
              <q-icon name="arrow_back" size="13px" class="q-ml-auto" />
            </router-link>

            <!-- Stale-content banner — surfaces when the bound CONTENT node
                 has newer descendants. Owner can opt in to update. -->
            <div v-if="contentVersions.has_newer" class="subject-panel__banner banner--stale">
              <q-icon name="info" size="13px" class="q-mr-xs" />
              <span>
                A newer version of this content exists
                <router-link
                  v-if="contentVersions.newer && contentVersions.newer.length"
                  :to="'/nodes/' + contentVersions.newer[0].id"
                  class="banner-link"
                >(node #{{ contentVersions.newer[0].id }})</router-link>.
                This post stays pinned to the original.
              </span>
              <q-space />
              <button
                v-if="isOwner"
                class="banner-action"
                :disabled="updatingContent"
                @click="updateContentToLatest"
              >
                <q-icon name="update" size="12px" class="q-mr-xs" />
                {{ updatingContent ? 'updating…' : 'Use latest' }}
              </button>
            </div>

            <!-- Body — the markdown viewport. Outer fills with chrome
                 tone (matching the identity zone); the inner card holds
                 the actual content on the white "paper" surface with
                 rounded corners that match the title container. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">
                <div v-if="!contentBody" class="text-dim text-center q-py-md">
                  (no content)
                </div>
                <div
                  v-else
                  ref="contentEl"
                  class="markdown-scroll subject-panel__body-inset"
                  @click="onContentClick"
                >
                  <!-- `auto` tier (2026-07-31, was 'mini'): node refs that
                       resolve to embeddable URLs or media files bloom into
                       NodeMini panels; every other bare ref reads as a
                       micro chip. ![[…]] / -[[…]] sigils overrule per ref. -->
                  <MarkdownBody class="md-rendered post-md-rendered" :text="contentBody" :transform-html="docLinkTransform" ref-display="auto" />

                </div>
              </div>
            </div>

            <!-- Bottom splitter — overlays the body. Footer-only at min
                 height; drag the grip upward to surface the comment /
                 fork pane. See BottomSplitter for the resize mechanics. -->
            <BottomSplitter
              ref="bottomSplitterRef"
              v-model="activeTab"
              :comment-count="comments.length"
              :fork-count="forks.length"
              :vote-up="voteUp"
              :vote-down="voteDown"
              :viewer-vote="viewerVote"
              storage-key="post-viewer-bottom-h"
              default-collapsed
              @vote="castVote"
            >
              <template #commentPane>
                <button
                  class="pane-cta"
                  :class="{ active: composerOpen }"
                  @click="toggleComposer"
                >
                  <q-icon :name="composerOpen ? 'close' : 'add'" size="14px" class="q-mr-sm" />
                  {{ composerOpen ? 'Close comment maker' : 'Write a new comment' }}
                </button>

                <div v-if="composerOpen" ref="composerEl" class="pane-composer">
                  <PostMakerSurface
                    embed
                    :draft-id="commentDraftId"
                    @close="closeComposer"
                    @posted="onCommentPosted"
                  />
                </div>

                <div class="pane-scroll">
                  <div v-if="comments.length === 0" class="pane-empty">
                    No comments yet — start the conversation.
                  </div>
                  <PostCommentItem
                    v-for="c in comments"
                    :key="c.id"
                    :child="c"
                    :depth="0"
                    :unravel-path="unravelPath"
                    @reply-posted="reload"
                  />
                </div>
              </template>

              <template #forkPane>
                <button
                  class="pane-cta"
                  :class="{ active: forkConfirmOpen }"
                  @click="forkConfirmOpen = !forkConfirmOpen"
                >
                  <q-icon :name="forkConfirmOpen ? 'close' : 'alt_route'" size="14px" class="q-mr-sm" />
                  {{ forkConfirmOpen ? 'Cancel fork' : 'Create a new fork' }}
                </button>

                <div v-if="forkConfirmOpen" class="pane-composer">
                  <ForkConfirmPanel
                    kind="post"
                    :loading="submittingFork"
                    @cancel="forkConfirmOpen = false"
                    @confirm="submitFork"
                  />
                </div>

                <div class="pane-scroll">
                  <div v-if="forks.length === 0" class="pane-empty">
                    No forks yet — be the first to branch this off.
                  </div>
                  <PostCommentItem
                    v-for="f in forks"
                    :key="f.id"
                    :child="f"
                    :depth="0"
                    @reply-posted="reload"
                  />
                </div>
              </template>
            </BottomSplitter>

          </main>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — sidebar: Versions (content history). Attachments are
             retired — references live inline in the post body as
             [[pathos:…]] chips / ![[pathos:…]] embeds.
        ══════════════════════════════════════════════════════════ -->
        <aside class="side-pane">

          <!-- Versions (content history) — historical CONTENT nodes
               returned by listVersions (oldest-first, head excluded). -->
          <section class="versions-panel side-panel side-panel--versions">
            <div class="versions-panel__header">
              <q-icon name="history" size="14px" class="q-mr-xs" />
              <span>Versions</span>
              <span class="versions-count">{{ versions.length }}</span>
            </div>
            <div class="versions-panel__scroll">
              <div v-if="!versions.length" class="versions-panel__empty">
                No previous versions.
              </div>
              <router-link
                v-for="(v, i) in versions"
                :key="v.id"
                :to="'/nodes/' + v.id"
                class="version-row"
                :title="v.path"
              >
                <span class="version-row-tag mono">v{{ i + 1 }}</span>
                <span class="version-row-snippet">{{ versionSnippet(v) }}</span>
                <q-space />
                <span class="version-row-hash mono">{{ shortHash(v.path) }}</span>
              </router-link>
            </div>
          </section>
        </aside>
      </div>

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { skeletonService } from 'src/services/skeleton.service'
import { nodeService } from 'src/services/node.service'
import { entityService } from 'src/services/entity.service'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'
import PostCommentItem from 'src/components/posts/PostCommentItem.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import PostMakerSurface from 'src/components/maker/PostMakerSurface.vue'
import ForkConfirmPanel from 'src/components/nodes/ForkConfirmPanel.vue'
import BottomSplitter from 'src/components/shared/BottomSplitter.vue'
import AddressChain from 'src/components/shared/AddressChain.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { postService } from 'src/services/post.service'
import { bodyOf } from 'src/utils/nodeContent'
import { useAuthStore } from 'src/stores/auth'
import { useMakerStore } from 'src/stores/maker'
import { useStateHolder } from 'src/composables/useStateHolder'
import { hashOf } from 'src/utils/kinds'
import { parseUnravel } from 'src/utils/threadNav'
import AccessDeniedBanner from 'src/components/shared/AccessDeniedBanner.vue'
import { lockedInfoFromError } from 'src/utils/access'

const resolveDocHref = (href, fromPath) => {
  if (!href) return null
  const [hrefNoHash] = href.split('#')
  if (!hrefNoHash) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(hrefNoHash)) return null
  if (hrefNoHash.startsWith('//')) return null
  if (!hrefNoHash.toLowerCase().endsWith('.md')) return null
  const fromDir = (fromPath || '').includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : ''
  const startSegs = hrefNoHash.startsWith('/') ? [] : fromDir.split('/').filter(Boolean)
  const segs = [...startSegs]
  for (const piece of hrefNoHash.replace(/^\/+/, '').split('/')) {
    if (piece === '' || piece === '.') continue
    if (piece === '..') segs.pop(); else segs.push(piece)
  }
  return segs.join('/')
}

const NODE_TYPES_BY_ID = { 1: 'NOTE', 2: 'FILE', 3: 'URL', 4: 'REFERENCE' }

export default defineComponent({
  name: 'PostViewerPage',
  components: { PostCommentItem, LabelSlider, MomentInfo, PostMakerSurface, ForkConfirmPanel, BottomSplitter, AddressChain, MarkdownBody, AccessDeniedBanner },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const auth = useAuthStore()
    const makerStore = useMakerStore()

    const id = computed(() => parseInt(route.params.id))

    const loading = ref(true)
    const locked = ref(null) // { kind, hash, id, address } when the read 403'd
    const skeleton = ref(null)
    const slots = ref([])
    const labels = ref([])
    const children = ref([]) // all child skeletons, enriched
    const versions = ref([])
    const titleContent = ref('')
    const contentBody = ref('')
    const contentNode = ref(null) // the underlying CONTENT body node row
    const contentNodeTypeName = ref('')
    // The rest of the CONTENT path: referenced elements, Mini-ready
    // ({ kind, node|label|path|skeleton|entity } per element).
    const contentNodeOwner = ref(null) // entity row of contentNode.owner_id (for fs path)
    const authorEntity = ref(null)
    // The CONTENT node's source name (line 2 of a doc node's content, e.g.
    // `concepts/embeds.md`). It is NOT rendered and NOT a title fallback —
    // its single job is to be the base a doc's RELATIVE markdown links
    // resolve against in `resolveDocHref`. Provenance, not classification.
    const docSourcePath = ref('')
    const contentEl = ref(null)

    const topReplyBody = ref('')
    const sendingTop = ref(false)

    // StateHolder — remembers the approximate location inside the post
    // body (the content inset scrolls, not the window) and halos the ref
    // the user came back from after a reference detour.
    const holder = useStateHolder({}, { targetType: 'skeleton' })
    holder.trackContainer(contentEl, 'content')

    const forkOpen = ref(false)
    const forkBody = ref('')
    const sendingFork = ref(false)

    // ── Tabbed panel state ──────────────────────────────────
    // The bottom of the panel is a tab strip (Replies / Forks). Each pane
    // has its own thin-wide CTA (Add comment / Create fork) that toggles
    // the maker for that pane. Submissions roll their own "sending" flags
    // so the two panes never block each other.
    const activeTab = ref('comment')
    const composerOpen = ref(false)
    const forkConfirmOpen = ref(false)
    const submittingFork = ref(false)

    // Template refs used by the auto-expand wiring: bottomSplitterRef
    // is the BottomSplitter component, composerEl is the wrapper around
    // the embedded PostMakerSurface (so we can measure its rendered height
    // and grow the splitter to fit the whole composer).
    const bottomSplitterRef = ref(null)
    const composerEl = ref(null)

    // Chrome above + below the composer that the splitter must also
    // accommodate (grip + tabs + cta + a little scroll-buffer so the
    // first comment teases into view).
    const COMPOSER_CHROME_PX = 150

    // Expose imperative grow/shrink hooks so nested comment items can
    // ask the splitter to grow when they open their inline reply form
    // and shrink it back when the form goes away.
    const expandBottomPane = (minPx) => bottomSplitterRef.value?.ensureMinHeight(minPx)
    const releaseBottomPane = () => bottomSplitterRef.value?.releaseMinHeight()
    provide('expandBottomPane', expandBottomPane)
    provide('releaseBottomPane', releaseBottomPane)

    // The embedded composer edits a real maker-store draft, so the same
    // in-progress comment is reachable as a tab in the footer post maker.
    // Closing the embed PARKS the draft (tab stays until posted/discarded).
    const commentDraftId = ref(null)

    const closeComposer = () => {
      if (commentDraftId.value) makerStore.parkDraft(commentDraftId.value)
      composerOpen.value = false
      releaseBottomPane()
    }

    const onCommentPosted = async () => {
      commentDraftId.value = null
      composerOpen.value = false
      releaseBottomPane()
      await reload()
    }

    const toggleComposer = async () => {
      if (composerOpen.value) {
        closeComposer()
        return
      }
      // The parent meta rides the draft: viewers + the dock tab both know
      // this post will belong to the viewed element on submit. A post
      // that is itself a comment threads the ref as 'comment' so clicking
      // it later unravels from the thread root.
      const parentKind = origin.value?.kind === 'COMMENT' ? 'comment' : 'post'
      const d = makerStore.openCommentDraft({
        kind: parentKind,
        id: id.value,
        hash: hashOf(skeleton.value?.path || ''),
        route: `/posts/${id.value}`,
        label: titleContent.value ? titleContent.value.slice(0, 40) : `post #${id.value}`
      })
      commentDraftId.value = d.id
      composerOpen.value = true
      // Wait for the composer to render so we can measure its actual
      // height. Falls back to a sensible default if the measurement
      // returns 0 (composer not yet laid out).
      await nextTick()
      const h = composerEl.value?.offsetHeight || 280
      expandBottomPane(h + COMPOSER_CHROME_PX)
    }

    const voteUp = ref(0)
    const voteDown = ref(0)
    const viewerVote = ref(null)

    // ── Stale CONTENT detection ─────────────────────────────
    // After resolving the post's CONTENT slot to a node, we also fetch the
    // node's versions: if any descendants exist (someone minted a newer
    // version via a post edit or a fork), we surface a chip in the content
    // head. The reference stays pinned to the original node until the
    // post owner opts in to update it via "use latest".
    const contentVersions = ref({ newer: [], has_newer: false })
    const updatingContent = ref(false)

    const copyHashTitle = ref('Copy node ref')
    const crosslinkCache = ref(new Map())

    // Every attached label renders as a chip — labels are classification
    // only now (the source path is data on the CONTENT node, not a label).
    const otherLabels = computed(() => labels.value)

    // Creation moment comes from the skeleton row itself (moment_id) —
    // the MomentInfo chip self-resolves via /refs/summary.
    const skeletonMomentId = computed(() => skeleton.value?.moment_id || null)
    const sliderLabels = computed(() => labels.value)

    // Per-family chip tint so the POST / DOC families are visually
    // distinguishable in the labels panel without needing to read the
    // hover-revealed ancestor chain.
    const labelChipClass = (l) => {
      const parent = l.chain[1]?.name
      if (parent === 'POST') return 'chip-post'
      if (l.name === 'DOC') return 'chip-doc'
      return ''
    }

    // The original `title` computed still drives places that need a SINGLE
    // string (e.g. window title or anywhere else it's read). The new
    // `effectiveTitleVisible` / `hasIdentityHeader` flags drive the in-page
    // header so the section can disappear entirely when empty.
    const title = computed(() => titleContent.value || '')

    // Comment-origin lookup for the post's CONTENT node — when the post is
    // itself a COMMENT, the title becomes "Comment from <kind>/<hash>" and
    // the hash hyperlinks to the ROOT of the comment thread. Resolved via
    // the backend walker so nested comments are bypassed up to the root.
    const origin = ref(null)

    const originHashLabel = computed(() => {
      const co = origin.value?.comment_of
      if (!co) return ''
      const root = origin.value?.root
      const hash = (co.path || '').split('/').pop() || ''
      let kindLabel
      if (co.kind === 'node') {
        kindLabel = 'node'
      } else if (root && root.kind === 'post' && root.id === co.id) {
        kindLabel = 'post'
      } else {
        kindLabel = 'comment'
      }
      return `${kindLabel}/${hash.slice(0, 14)}${hash.length > 14 ? '…' : ''}`
    })

    const originRoot = computed(() => {
      const r = origin.value?.root
      if (!r) return null
      const route = r.kind === 'post' ? `/posts/${r.id}` : `/nodes/${r.id}`
      return { ...r, route }
    })

    const effectiveTitleVisible = computed(() => {
      if (origin.value?.kind === 'COMMENT') return true
      return !!titleContent.value
    })

    // Bottom row of the identity card (author chip, file path, time) is
    // always populated for an existing post, so the card itself remains
    // visible whenever the post resolved.
    const hasIdentityHeader = computed(() => !!skeleton.value)

    // Resolved author label, preferring the USER_PROFILE skeleton's
    // DISPLAY_NAME → USERNAME → user_login.username → 'entity #N'.
    const authorDisplayName = computed(() => {
      const e = authorEntity.value
      if (!e) return ''
      return e.profile?.display_name ||
          e.profile?.username ||
          e.username ||
          ('entity #' + e.id)
    })

    // INTERACTION_TREE children are comments only. Forks live as independent
    // top-level skeletons (forked_from_id → original.id), so they need a
    // separate fetch via listForks instead of a children filter.
    const comments = computed(() => children.value.filter(c => c.provenance !== 'FORK'))
    const forks = ref([])
    const forkSource = ref(null) // { id, path } of the post this one was forked from

    const isOwner = computed(() => {
      return skeleton.value && auth.user && auth.user.id === skeleton.value.owner_id
    })

    const loadForkSource = async (forkedFromId) => {
      if (!forkedFromId) { forkSource.value = null; return }
      try {
        const r = await skeletonService.get(forkedFromId)
        if (r.success && r.skeleton) {
          forkSource.value = { id: r.skeleton.id, path: r.skeleton.path }
        }
      } catch (_) { forkSource.value = null }
    }

    const load = async () => {
      loading.value = true
      locked.value = null
      skeleton.value = null
      slots.value = []; labels.value = []
      children.value = []; versions.value = []
      forks.value = []; forkSource.value = null
      titleContent.value = ''; contentBody.value = ''; contentNode.value = null
      contentNodeOwner.value = null
      authorEntity.value = null; docSourcePath.value = ''
      contentVersions.value = { newer: [], has_newer: false }
      origin.value = null

      try {
        const [walkR, labelsR, kidsR, forksR, versR, votesR] = await Promise.all([
          skeletonService.walk(id.value),
          skeletonService.labels(id.value),
          skeletonService.listChildren(id.value).catch(() => ({ children: [] })),
          skeletonService.listForks(id.value).catch(() => ({ forks: [] })),
          skeletonService.listVersions(id.value).catch(() => ({ versions: [] })),
          skeletonService.getVotes(id.value).catch(() => ({ votes: { up: 0, down: 0, viewer_vote: null } }))
        ])
        forks.value = forksR.forks || []
        if (votesR.success !== false) {
          voteUp.value = votesR.votes?.up || 0
          voteDown.value = votesR.votes?.down || 0
          viewerVote.value = votesR.votes?.viewer_vote || null
        }
        if (!walkR.success) { loading.value = false; return }
        skeleton.value = walkR.skeleton
        slots.value = walkR.slots || []
        labels.value = labelsR.labels || []
        children.value = kidsR.children || []
        versions.value = versR.versions || []

        const titleSlot = slots.value.find(s => s.slotName === 'TITLE')
        const contentSlot = slots.value.find(s => s.slotName === 'CONTENT')
        const authorSlot = slots.value.find(s => s.slotName === 'AUTHOR')

        const resolvers = []
        if (skeleton.value?.forked_from_id) resolvers.push(loadForkSource(skeleton.value.forked_from_id))
        if (titleSlot?.ref) {
          resolvers.push(
            skeletonService.resolveRef(titleSlot.ref).then(r => { if (r.success) titleContent.value = r.row.content || '' })
          )
        }
        if (contentSlot?.ref) {
          // CONTENT binds a path of elements — the enriched post endpoint
          // resolves the body node AND the referenced elements in one call
          // (legacy nodes/ bindings resolve through the same walker).
          resolvers.push(
            postService.get(id.value).then(async r => {
              if (r.success && r.post?.node) {
                const n = r.post.node
                contentNode.value = n
                // File-backed content nodes carry the resolved .md body in
                // node.file.text; the content column is the address plus,
                // for docs, the source path on line 2 (node.file.name) —
                // kept only to resolve relative doc links, never shown.
                contentBody.value = bodyOf(n)
                docSourcePath.value = n.file?.name || ''
                contentNodeTypeName.value = NODE_TYPES_BY_ID[n.type_id] || ''
                // Probe for newer versions so the head can surface a chip,
                // resolve comment-origin so the identity header can show
                // "Comment from <kind>/<hash>" for comment-derived posts,
                // and resolve the node's author entity so the meta strip
                // can render the real filesystem location of the node file
                // (files/<authorHash>/nodes/<nodeHash>).
                try {
                  const [v, o, oe] = await Promise.all([
                    nodeService.getVersions(n.id),
                    nodeInteractionService.getOrigin(n.id),
                    entityService.get(n.owner_id)
                  ])
                  if (oe && oe.success) contentNodeOwner.value = oe.entity
                  if (v.success) {
                    contentVersions.value = {
                      newer: v.newer || [],
                      has_newer: !!v.has_newer
                    }
                  }
                  if (o.success) origin.value = o
                } catch (_) { /* leave defaults */ }
              }
            })
          )
        }
        if (authorSlot?.ref) {
          resolvers.push(
            skeletonService.resolveRef(authorSlot.ref).then(async r => {
              if (!r.success) return
              // resolveRef returns the raw entity row (no username — that lives
              // in user_login). Enrich via the entity endpoint so the header
              // chip can show the display name + a clickable hash.
              authorEntity.value = r.row
              try {
                const er = await entityService.get(r.row.id)
                if (er.success) authorEntity.value = { ...r.row, ...er.entity }
              } catch (_) { /* keep raw row */ }
            })
          )
        }
        await Promise.all(resolvers)
      } catch (e) { locked.value = lockedInfoFromError(e) }
      loading.value = false
      nextTick(() => { if (contentEl.value) contentEl.value.scrollTop = 0 })

      // Feed the real title/hash to the nav stack, then re-apply the
      // remembered location (runs after the scrollTop reset above).
      holder.describe({
        title: titleContent.value || `Post #${id.value}`,
        hash: hashOf(skeleton.value?.path || ''),
        targetType: 'skeleton',
        targetId: id.value
      })
      await holder.restore()
    }
    const reload = load

    onMounted(load)
    watch(() => route.params.id, load)

    // Applied by MarkdownBody after sanitize: rewrite doc-relative hrefs
    // into #md: crosslinks handled by onContentClick.
    const docLinkTransform = (html) => {
      if (typeof window === 'undefined') return html
      const fromPath = docSourcePath.value || ''
      const tpl = document.createElement('template')
      tpl.innerHTML = html
      tpl.content.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href')
        const resolved = resolveDocHref(href, fromPath)
        if (resolved) {
          a.setAttribute('href', `#md:${resolved}`)
          a.setAttribute('data-md-target', resolved)
          a.classList.add('md-internal-link')
        }
      })
      return tpl.innerHTML
    }

    const onContentClick = async (ev) => {
      const a = ev.target.closest && ev.target.closest('a[data-md-target]')
      if (!a) return
      ev.preventDefault()
      const target = a.getAttribute('data-md-target')
      if (!target) return
      if (crosslinkCache.value.has(target)) {
        router.push(`/posts/${crosslinkCache.value.get(target)}`)
        return
      }
      try {
        // The target doc is the skeleton whose CONTENT node carries this
        // source path on line 2 of its content (node data, not a label).
        const r = await skeletonService.byContentName(target)
        if (r.success && r.skeleton) {
          const targetId = r.skeleton.id
          crosslinkCache.value.set(target, targetId)
          router.push(`/posts/${targetId}`)
        }
      } catch (_) { /* swallow */ }
    }

    // Filesystem location of the underlying CONTENT node's protobuf file.
    // pathchain writes `files/<authorHash>/nodes/<nodeHash>` (see
    // pathchain/maker.js → node()); we surface that real on-disk path so
    // the meta strip reflects ground truth instead of the SQL-only
    // `nodes/<hash>` ref. Falls back to the SQL ref while the owner entity
    // is still loading.
    const contentNodeFsPath = computed(() => {
      const node = contentNode.value
      if (!node) return ''
      const nodeHash = (node.path || '').split('/').pop()
      const ownerHash = (contentNodeOwner.value?.path || '').split('/').pop()
      if (!nodeHash) return ''
      if (!ownerHash) return `nodes/${nodeHash}`
      return `files/${ownerHash}/nodes/${nodeHash}`
    })

    // Per-prefix routes consumed by <AddressChain>. Each segment becomes
    // a hyperlink when its kind's DB id has resolved; otherwise the chip
    // renders as a static label.
    const addressRoutes = computed(() => ({
      files: contentNodeOwner.value ? `/entities/${contentNodeOwner.value.id}` : null,
      nodes: contentNode.value ? `/nodes/${contentNode.value.id}` : null
    }))

    const copyContentNodeRef = async () => {
      const text = contentNodeFsPath.value
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        copyHashTitle.value = 'Copied!'
        setTimeout(() => { copyHashTitle.value = 'Copy node ref' }, 1200)
      } catch (_) { /* swallow */ }
    }

    const sendTopReply = async () => {
      if (!topReplyBody.value.trim() || sendingTop.value) return
      sendingTop.value = true
      try {
        const r = await skeletonService.commentOn(id.value, topReplyBody.value)
        if (r.success) {
          topReplyBody.value = ''
          await reload()
        }
      } catch (_) { /* swallow */ }
      sendingTop.value = false
    }

    // ── Thread unravel ──────────────────────────────────────
    // ?unravel=<id,id,…> — the chain of comment ids below this post down
    // to a target comment. Auto-open the comments pane and let each
    // PostCommentItem on the chain expand its replies; the final id gets
    // the highlight halo.
    const unravelPath = computed(() => parseUnravel(route.query.unravel))

    // Same-page unravels (a comment just posted from the dock) can target
    // a comment newer than the loaded list — refresh once, then expand.
    let unravelReloadedFor = null
    watch([unravelPath, loading], async () => {
      const chain = unravelPath.value
      if (!chain.length || loading.value) return
      if (!children.value.some(c => c.id === chain[0]) && unravelReloadedFor !== String(chain)) {
        unravelReloadedFor = String(chain)
        await reload()
        return
      }
      activeTab.value = 'comment'
      await nextTick()
      expandBottomPane(420)
    }, { immediate: true })

    // Confirm a fork from the Fork pane CTA. Snapshot semantics — the API
    // copies the source's content automatically; we land on the new fork
    // so the owner can iterate via the existing draft+promote flow.
    const submitFork = async () => {
      if (submittingFork.value) return
      submittingFork.value = true
      try {
        const r = await skeletonService.forkOf(id.value, {})
        if (r.success) {
          forkConfirmOpen.value = false
          const forked = r.skeleton || r.post
          if (forked?.id) {
            router.push('/posts/' + forked.id)
          } else {
            await reload()
          }
        }
      } catch (_) { /* swallow */ }
      submittingFork.value = false
    }

    // ── Opt-in: rebind CONTENT slot to the newest node version ──
    // Default behaviour is sticky — the post stays pinned to its original
    // content node even after newer versions exist. This handler explicitly
    // updates the slot to the head descendant when the owner chooses to.
    const updateContentToLatest = async () => {
      if (!isOwner.value || !contentVersions.value.has_newer || updatingContent.value) return
      const latest = contentVersions.value.newer[0] // newest-first from the API
      if (!latest?.path) return
      updatingContent.value = true
      try {
        const r = await skeletonService.setSlot(id.value, 'CONTENT', latest.path)
        if (r.success) await reload()
      } catch (_) { /* swallow */ }
      updatingContent.value = false
    }

    const loadVotes = async () => {
      try {
        const r = await skeletonService.getVotes(id.value)
        if (r.success) {
          voteUp.value = r.votes.up
          voteDown.value = r.votes.down
          viewerVote.value = r.votes.viewer_vote
        }
      } catch (_) { /* leave defaults */ }
    }

    const castVote = async (direction) => {
      // Clicking the same direction twice removes the vote (toggle off)
      try {
        if (viewerVote.value === direction) {
          await skeletonService.unvote(id.value)
        } else {
          await skeletonService.vote(id.value, direction)
        }
        await loadVotes()
      } catch (_) { /* swallow */ }
    }

    const cancelFork = () => {
      forkOpen.value = false
      forkBody.value = ''
    }

    const sendFork = async () => {
      if (!forkBody.value.trim() || sendingFork.value) return
      sendingFork.value = true
      try {
        const r = await skeletonService.forkOf(id.value, forkBody.value)
        if (r.success) {
          forkBody.value = ''
          forkOpen.value = false
          await reload()
        }
      } catch (_) { /* swallow */ }
      sendingFork.value = false
    }

    const shortHash = (p) => {
      const h = (p || '').split('/').pop()
      return h ? h.slice(0, 14) + (h.length > 14 ? '…' : '') : ''
    }

    // Author chip uses a shorter hash slice so "entity/<8>" fits next to the
    // username without wrapping in the post-header inline row.
    const shortEntityHash = (p) => {
      const h = (p || '').split('/').pop()
      return h ? h.slice(0, 8) : ''
    }

    // First-line content snippet for the Versions sidebar — strips
    // leading whitespace and caps the visible width so the row stays
    // single-line in the narrow side column.
    const versionSnippet = (v) => {
      const body = bodyOf(v).replace(/^\s+/, '')
      const firstLine = body.split('\n')[0] || ''
      return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine
    }

    return {
      id,
      loading,
      locked,
      skeleton,
      slots,
      labels,
      skeletonMomentId,
      sliderLabels,
      title,
      titleContent,
      contentBody,
      contentNode,
      contentNodeTypeName,
      contentNodeOwner,
      contentNodeFsPath,
      addressRoutes,
      authorEntity,
      authorDisplayName,
      // Identity header — "Comment from <kind>/<hash>" + visibility flags
      origin,
      originHashLabel,
      originRoot,
      effectiveTitleVisible,
      hasIdentityHeader,
      children,
      comments,
      forks,
      forkSource,
      versions,
      otherLabels,
      isOwner,
      labelChipClass,
      docLinkTransform,
      onContentClick,
      contentEl,
      copyContentNodeRef,
      copyHashTitle,
      topReplyBody,
      sendingTop,
      sendTopReply,
      forkOpen,
      forkBody,
      sendingFork,
      cancelFork,
      sendFork,
      // Tabbed panel state
      activeTab,
      composerOpen,
      forkConfirmOpen,
      submittingFork,
      submitFork,
      // Embedded comment maker + thread unravel
      commentDraftId,
      closeComposer,
      onCommentPosted,
      unravelPath,
      // BottomSplitter auto-expand wiring
      bottomSplitterRef,
      composerEl,
      toggleComposer,
      voteUp,
      voteDown,
      viewerVote,
      castVote,
      // Stale-content detection on the bound CONTENT node
      contentVersions,
      updatingContent,
      updateContentToLatest,
      shortHash,
      shortEntityHash,
      versionSnippet,
      reload
    }
  }
})
</script>

<style lang="scss" scoped>
// Page-edge padding — small breathing room on top so the panels don't
// touch the viewport edge, near-flush on sides + bottom so the
// [subject-panel, [Related, Versions]] rectangles read as full-bleed.
.post-page {
  padding: 16px 10px 0;
}

.structure-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-family: 'Space Mono', monospace;
  font-size: 0.78em;
  padding: 3px 9px;
  border-radius: 12px;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.30);
  color: var(--ink);
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  &:hover {
    background: rgba(var(--ink-rgb), 0.12);
    border-color: var(--ink);
    color: var(--ink-1);
  }
}
.structure-link--stacked {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  line-height: 1.05;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--ink);
  border-color: var(--ink);
  color: #ffffff;
  &:hover {
    background: var(--ink-1);
    border-color: var(--ink-1);
    color: #ffffff;
  }
}
.structure-link__label {
  display: inline-block;
  text-align: left;
}

// ── Two-column grid ─────────────────────────────────────
// CSS Grid sidesteps the col-12 + gap math problem that pushes the right
// column to wrap. 75 / 25 split, 12px gutter, both columns confined
// horizontally to their tracks. Below md (768px) we stack vertically.
.post-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.main-pane { min-width: 0; }

// Side column mirrors the subject-panel's vertical extent so the
// [Related, Versions] stack visually balances the panel on the left.
// Flex 2:1 split between Related (top) and Versions (bottom).
.side-pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
}
.side-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body, #ffffff);
  border: 1px solid var(--panel-rule, #e2e6ed);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.side-panel--versions { flex: 1 1 0; }

@media (max-width: 1023px) {
  .post-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .side-pane {
    height: auto;
    max-height: none;
  }
  .side-panel--versions { flex: 0 0 auto; }
}

// ── Markdown content — viewport-bounded scroller ─────────
// Lives inside .subject-panel__body, which is itself flex:1 1 auto inside
// the panel. Letting it scroll independently keeps the panel's identity,
// meta, and foot zones visually pinned while the body moves.
.markdown-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  // …and, since 2026-07-26, the SIZE CONTAINER the body's media measures
  // itself against. A `![[pathos:nodes/…]]` block embed puts a picture or a
  // player in this scroller, and the size that reads as "the whole thing,
  // at once" is the biggest one that still fits THIS box — which is not a
  // viewport fraction: the panel is viewport-tall, but the identity zone
  // above this scroller grows with the title, the labels and any banners.
  // `100cqh` is the exact remainder, and nothing else can state it.
  //
  // Declaring size containment here is safe precisely because this element
  // never sized itself from its content: it is the only flex child of a
  // panel whose height is `calc(100vh - 16px - var(--nav-footer-h))` at
  // every breakpoint, so `flex: 1 1 auto` fills whatever the zones above it
  // left. (On a box whose height DOES follow its content — a feed card, say
  // — the same declaration would collapse it to nothing; that surface
  // derives its budget from its own ceiling instead.)
  container-type: size;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
}

// The media budget this reading window can spare — the scroller's own
// height less the chrome that travels WITH a medium: ~20px of scroller
// padding, ~70px of the Mini's header and foot, ~21px of embed caption and
// ~25px of block margin. A picture bounded by this shows whole on arrival;
// anything more and the reader has to scroll a figure into view, which is
// the one thing a preview must not ask for. The 200px floor covers a very
// short window (and a browser without container queries, which drops the
// declaration and falls back to the components' own defaults).
.post-md-rendered {
  --media-max-h: max(200px, calc(100cqh - 136px));
}

.fork-excerpt {
  font-size: 0.82em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
}

.label-chip-tiny {
  font-size: 0.74em;
  height: 22px;
  margin-right: 4px;
}

// ── Labels panel ─────────────────────────────────────────
.label-panel {
  background: #f6f8fb;
  border: 1px solid #e2e6ed;
  color: #2C3D4E;
}
.label-panel :deep(.text-dim) { color: #6b7993 !important; opacity: 1; }
.label-chip {
  height: 22px;
  font-size: 0.74em;
  background: #ffffff;
  border: 1px solid #c8d0dc;
  color: #2C3D4E;
}
.label-chip .chip-parent {
  color: #8995a8;
  margin-right: 4px;
  font-size: 0.92em;
}
.label-chip .chip-sep    { margin-left: 2px; }
.label-chip .chip-leaf   { color: #1F2A38; font-weight: 600; }

.label-chip.chip-post   { border-color: #b4d2e8; background: #e8f1f9; .chip-leaf { color: #2a5a87; } }
.label-chip.chip-doc    { border-color: #bfd9c3; background: #ecf6ee; .chip-leaf { color: #2e6a3a; } }

// ══════════════════════════════════════════════════════════
// .subject-panel — the merged container that holds everything
// about the viewed post / node / skeleton. One outer border, one
// shadow, internal zones use a shared 1px hairline divider and
// alternate between two surface tones:
//   • chrome  (--panel-chrome)  → identity, meta, foot, form
//   • body    (--panel-body)    → markdown viewport
// Banners use semantic tints (blue=fork, amber=stale) but share the
// hairline divider and chip styling so they sit inside the panel
// without breaking its visual continuity.
// ══════════════════════════════════════════════════════════
.subject-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  // Subtract page padding (8px top + 8px bottom = q-pa-sm) AND the fixed
  // bottom NavigationBar height so the panel's bottom edge sits clear of
  // the bar — no scrolling needed to see the panel's footer.
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
  min-width: 0;
  overflow: hidden;             // each zone scrolls inside if needed
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  position: relative;           // anchor for BottomSplitter overlay

  // Hairline divider between zones, but skip the BottomSplitter — it
  // brings its own top border so its drop-shadow can read.
  & > * + *:not(.bottom-splitter) { border-top: 1px solid var(--panel-rule); }
}

// ── Identity zone ───────────────────────────────────────
.subject-panel__ident {
  padding: 8px 12px 6px;
  background: var(--panel-chrome);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.subject-panel__titlebar {
  display: flex;
  align-items: stretch;
  gap: 10px;
  border-bottom: 1px solid var(--panel-rule);
  margin: 0 -12px;
  padding: 0 12px 6px;
}
.subject-panel__title-icon {
  color: var(--ink);
  flex-shrink: 0;
  align-self: center;
}
.vsep {
  flex: 0 0 1px;
  width: 1px;
  background: var(--panel-rule);
  align-self: stretch;
}
.subject-panel__titlebar .vsep {
  margin-top: -8px;
  margin-bottom: -6px;
}
.subject-panel__labels .vsep {
  margin-top: -5px;
  margin-bottom: -6px;
}
.subject-panel__title {
  font-size: 1.25em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}
.subject-panel__labels {
  display: flex;
  align-items: center;
  gap: 10px;
  // Let the slider's own padding/border draw the chip rail without
  // doubling vertical breathing room inside this slot.
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}

// ── Meta strip (the bound CONTENT node ref) ─────────────
.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;
}
.subject-panel__meta .meta-icon  { color: var(--panel-ink-2); flex: 0 0 auto; }
.subject-panel__meta .meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
  color: var(--panel-ink-2);
  strong { color: var(--panel-ink-1); }
}
.subject-panel__meta .meta-prefix { white-space: nowrap; flex: 0 0 auto; }
.subject-panel__meta .meta-typename { color: var(--panel-ink-mute); }
.subject-panel__meta .meta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: var(--panel-ink-2);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  &:hover { color: var(--coral-deep); background: rgba(0,0,0,0.04); }
}
.subject-panel__meta .meta-link { padding: 4px 6px; }

// ── Banners (forked-from, stale) — share size + spacing ─
.subject-panel__banner {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  font-size: 0.80em;
  text-decoration: none;
  gap: 6px;
  flex-shrink: 0;
}
.subject-panel__banner.banner--fork {
  background: #eef3fb;
  color: var(--panel-ink);
  transition: background 0.12s;
  &:hover { background: #e2eaf6; }
  .banner-label { opacity: 0.65; }
  .banner-kind {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.76em;
    padding: 1px 6px;
    background: rgba(44, 61, 78, 0.1);
    border-radius: 3px;
  }
  .banner-id   { font-weight: 600; }
  .banner-hash {
    font-size: 0.74em;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
  }
}
.subject-panel__banner.banner--stale {
  background: #fff6e6;
  color: #8b6321;
  font-size: 0.80em;
}
.banner-link {
  color: #8b6321;
  text-decoration: underline;
  margin-left: 3px;
  &:hover { color: var(--coral-deep); }
}
.banner-action {
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.8);
  border: 1px solid #e8cca0;
  color: #8b6321;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  font-family: inherit;
  transition: background 0.10s, border-color 0.10s, color 0.10s;
  &:hover {
    background: #fff;
    border-color: var(--coral-deep);
    color: var(--coral-deep);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ── Body (markdown viewport) — fills all space below the meta
//    strip. The BottomSplitter floats on top of it; reserve room
//    at the bottom so the markdown's last lines aren't permanently
//    hidden behind the always-visible interaction footer. ─
.subject-panel__body {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome);
  padding: 8px 8px 52px; // 8px breathing room + 44px reserved for BottomSplitter footer
}
.subject-panel__body-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow: hidden;
}
.subject-panel__body-inset { padding: 10px 14px; }

// ── Pane content styles ─────────────────────────────────
// Tabs / votes / pane container chrome now live inside
// <BottomSplitter>; the styles below are still consumed by the
// slot content (composer, scroll, empty state) we pass into it.
.pane-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 5px 12px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.18);
  color: var(--coral-deep);
  font-family: inherit;
  font-size: 0.82em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.10s, color 0.10s;
  flex-shrink: 0;

  &:hover  { background: rgba(var(--coral-rgb), 0.06); }
  &.active {
    background: rgba(var(--coral-rgb), 0.10);
    color: var(--coral-deep);
    border-bottom-style: solid;
    border-bottom-color: rgba(var(--coral-rgb), 0.30);
  }
}

.pane-composer {
  padding: 6px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  flex-shrink: 0;
}

.pane-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
}

.pane-empty {
  padding: 14px 10px;
  text-align: center;
  font-size: 0.82em;
  color: var(--panel-ink-2);
}

// "Comment from <kind>/<hash>" — the hash hyperlinks to the ROOT of the
// comment thread (post or node), bypassing intermediate comment nodes.
.origin-hash-link {
  color: #d35f5f;
  text-decoration: none;
  border-bottom: 1px dashed rgba(211, 95, 95, 0.5);
  padding-bottom: 1px;
  font-size: 0.78em;
  transition: color 0.12s, border-color 0.12s;
  &:hover {
    color: #b14848;
    border-color: rgba(211, 95, 95, 0.85);
  }
}
.origin-hash-fallback {
  color: #6b7993;
  font-size: 0.78em;
}

// Author chip in the post header: username + abbreviated entity hash,
// clickable through to the entity profile page.
.author-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #f0ecfb;
  border: 1px solid #c1b8e6;
  border-radius: 12px;
  color: #4f3e98;
  text-decoration: none;
  font-size: 0.92em;
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: #e5dcf7;
    border-color: #a294d6;
  }
  .author-chip-sep {
    opacity: 0.4;
    margin: 0 1px;
  }
  .author-chip-hash {
    font-size: 0.82em;
    opacity: 0.75;
  }
}

.post-md-rendered :deep(a) { color: var(--coral-deep); }
.post-md-rendered :deep(a.md-internal-link) {
  border-bottom: 1px dashed rgba(var(--coral-rgb, 235, 87, 87), 0.6);
  text-decoration: none;
  &:hover { background: rgba(var(--coral-rgb, 235, 87, 87), 0.08); }
}

.section-heading {
  font-size: 0.85em;
  color: var(--ink-1);
  display: flex;
  align-items: center;
  margin: 0 0 8px;
  padding-left: 4px;
}

// ══════════════════════════════════════════════════════════
// .versions-panel — sidebar twin of .subject-panel. Same token palette
// (chrome header, white body, hairline rule, coral accent) so the
// surfaces read as one family; internal scroll keeps the header pinned.
// (The attachments "Related" twin retired with the pair-path refactor.)
// ══════════════════════════════════════════════════════════
.versions-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}

.versions-panel__header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  font-size: 0.78em;
  font-weight: 500;
  color: var(--panel-ink-1);
  flex-shrink: 0;
}

.versions-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
}
// `.bare-btn` was used elsewhere (legacy fork form); kept as a
// compatibility shim so nothing referencing the class regresses.
.bare-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: inherit;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  color: inherit;
  &:hover { text-decoration: underline; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.fork-link { display: block; text-decoration: none; }
.fork-row {
  display: flex;
  align-items: center;
  transition: transform 0.08s;
  cursor: pointer;
  &:hover { transform: translateX(2px); }
}

// ── Versions panel rows ─────────────────────────────────
// Each row hyperlinks to the underlying historical node so the user
// can jump into any previous version of the bound CONTENT.
.versions-count {
  font-size: 0.92em;
  margin-left: 5px;
  color: var(--panel-ink-2);
}
.versions-panel__empty {
  padding: 10px 12px;
  font-size: 0.80em;
  color: var(--panel-ink-2);
  text-align: center;
  font-style: italic;
}
.version-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--panel-body);
  color: var(--panel-ink);
  text-decoration: none;
  font-size: 0.80em;
  transition: background 0.10s, color 0.10s;

  & + & { border-top: 1px solid var(--panel-rule); }
  &:hover { background: #f6f8fb; }

  .version-row-tag {
    color: var(--panel-ink-2);
    flex-shrink: 0;
    font-size: 0.86em;
  }
  .version-row-snippet {
    color: var(--panel-ink-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
  }
  .version-row-hash {
    color: var(--panel-ink-2);
    font-size: 0.78em;
    flex-shrink: 0;
  }
  &:hover .version-row-hash { color: var(--coral-deep); }
}

</style>
