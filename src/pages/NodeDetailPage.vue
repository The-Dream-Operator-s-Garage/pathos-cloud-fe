<template>
  <q-page class="bg-base node-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="36px" />
      </div>

      <AccessDeniedBanner v-else-if="locked" :address="locked.address" />

      <div v-else-if="!node" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Node not found.</div>
      </div>

      <div v-else class="node-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column (mirrors PostViewerPage)
        ══════════════════════════════════════════════════════════ -->
        <div class="node-main">

          <!-- subject-panel — single container that holds everything
               about the viewed node: identity zone (title, chips, type
               chip, ElementActions, labels), node-ref meta strip, body
               viewport, action footer, and any inline forms. -->
          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="adjust" size="22px" class="subject-panel__title-icon" />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  <template v-if="origin?.kind === 'COMMENT' && origin.comment_of">
                    Comment from
                    <router-link
                      v-if="originRoot"
                      :to="originRoot.route"
                      class="origin-hash-link mono"
                      :title="origin.comment_of.path"
                    >{{ originHashLabel }}</router-link>
                    <span v-else class="origin-hash-fallback mono">{{ originHashLabel }}</span>
                  </template>
                  <template v-else>
                    node #{{ node.id }} · {{ typeName }}
                  </template>
                </div>
              </div>

              <div class="subject-panel__labels">
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
                  v-if="authorEntity && (nodeMomentId || sliderLabels.length)"
                  class="vsep"
                  aria-hidden="true"
                />
                <MomentInfo v-if="nodeMomentId" :moment-id="nodeMomentId" />
                <span
                  v-if="nodeMomentId && sliderLabels.length"
                  class="vsep"
                  aria-hidden="true"
                />
                <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
                <span
                  v-if="authorEntity || nodeMomentId || sliderLabels.length"
                  class="vsep"
                  aria-hidden="true"
                />
                <ElementActions
                  v-if="isEditableNode"
                  target-type="node"
                  :source-id="node.id"
                  :source-owner-id="node.owner_id"
                  :source-content="nodeBody"
                  :source-type-id="node.type_id"
                  hide-fork
                  @updated="onElementUpdated"
                  @forked="onElementForked"
                />
              </div>
            </header>

            <!-- Meta strip — exposes the node id + path so the hash can
                 be copied without leaving the page. -->
            <div class="subject-panel__meta">
              <q-icon :name="typeIcon" size="14px" class="meta-icon" />
              <div class="meta-label">
                <strong>node #{{ node.id }}</strong>
                <span class="meta-typename">({{ typeName }})</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="node.path">{{ node.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <router-link
              v-if="node.forked_from_id"
              :to="'/nodes/' + node.forked_from_id"
              class="subject-panel__banner banner--fork"
            >
              <q-icon name="call_split" size="13px" class="q-mr-sm" />
              <span class="banner-label">Forked from</span>
              <span class="banner-kind">node</span>
              <span class="banner-id mono">#{{ node.forked_from_id }}</span>
              <span v-if="forkSource && forkSource.path" class="banner-hash mono"
                :title="forkSource.path">{{ forkSource.path }}</span>
              <q-icon name="arrow_back" size="13px" class="q-ml-auto" />
            </router-link>

            <div v-if="versions.has_newer" class="subject-panel__banner banner--stale">
              <q-icon name="info" size="13px" class="q-mr-xs" />
              <span>
                A newer version of this node exists
                <span v-if="versions.newer && versions.newer.length">
                  (head: <router-link :to="'/nodes/' + versions.newer[0].id" class="banner-link">node #{{ versions.newer[0].id }}</router-link>).
                </span>
                Posts and references that bind to this node remain pinned here unless they opt in to update.
              </span>
            </div>

            <!-- Body — primitive-aware (NOTE renders markdown, URL/FILE/
                 REFERENCE each have their own treatment). Outer fills
                 with chrome tone; the inner card holds the content on
                 the white "paper" surface with matching rounded corners. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">
              <div class="markdown-scroll subject-panel__body-inset">
                <template v-if="typeName === 'NOTE'">
                  <pre v-if="node.content" class="node-raw mono">{{ node.content }}</pre>
                  <div v-else class="text-dim" style="font-size:0.85em;">(empty note)</div>
                </template>

                <template v-else-if="typeName === 'URL'">
                  <div class="body-kind">URL</div>
                  <NodeContentViewer :node="node" mode="full" ref-display="micro" class="md-rendered" />
                </template>

                <template v-else-if="typeName === 'FILE'">
                  <div class="body-kind">
                    File<span v-if="node.file" class="mono q-ml-sm">.{{ node.file.ext }}</span>
                    <FileContractBadge v-if="node.file" :key="node.file.address" :file="node.file" class="q-ml-sm" />
                  </div>
                  <NodeContentViewer :node="node" mode="full" ref-display="micro" class="md-rendered" />
                </template>

                <template v-else>
                  <div class="body-kind">Reference</div>
                  <div style="font-size:0.9em; white-space:pre-wrap; color:#2C3D4E;">
                    {{ node.content }}
                  </div>
                </template>
              </div>
              </div>
            </div>

            <!-- Bottom splitter — overlays the body. Footer-only at min
                 height; drag the grip up to surface the comment / fork
                 pane. See BottomSplitter for the resize mechanics. -->
            <BottomSplitter
              ref="bottomSplitterRef"
              v-model="activeTab"
              :comment-count="commentChildren.length"
              :fork-count="forkNodes.length"
              :vote-up="votes.up"
              :vote-down="votes.down"
              :viewer-vote="votes.viewer_vote"
              storage-key="node-viewer-bottom-h"
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
                  {{ composerOpen ? 'Cancel comment' : 'Write a new comment' }}
                </button>

                <div v-if="composerOpen" ref="composerEl" class="pane-composer">
                  <div class="reply-hint">
                    <q-icon name="adjust" size="11px" class="q-mr-xs" />
                    Comment will reference <strong>this specific version</strong> of the node. If the node is later updated, your comment still points here.
                  </div>
                  <PostMakerSurface
                    embed
                    :draft-id="commentDraftId"
                    @close="closeComposer"
                    @posted="onCommentPosted"
                  />
                </div>

                <div class="pane-scroll">
                  <div v-if="loadingChildren" class="pane-empty">
                    <q-spinner size="14px" /> loading…
                  </div>
                  <div v-else-if="commentChildren.length === 0" class="pane-empty">
                    No comments on this node yet.
                  </div>
                  <PostCommentItem
                    v-for="c in commentChildren"
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
                    kind="node"
                    :loading="submittingFork"
                    @cancel="forkConfirmOpen = false"
                    @confirm="submitFork"
                  />
                </div>

                <div class="pane-scroll">
                  <div v-if="forkNodes.length === 0" class="pane-empty">
                    No forks yet — be the first to branch this off.
                  </div>
                  <NodeForkItem
                    v-for="f in forkNodes"
                    :key="f.id"
                    :fork="f"
                    :depth="0"
                  />
                </div>
              </template>
            </BottomSplitter>
          </main>

          <!-- Legacy node_comment rows (pre-skeleton migration) -->
          <section v-if="comments.length" class="q-mt-lg">
            <div class="section-heading">
              <q-icon name="history_edu" size="16px" class="q-mr-sm" />
              Legacy comments ({{ comments.length }})
            </div>
            <div class="q-gutter-sm">
              <CommentItem
                v-for="c in comments"
                :key="c.id"
                :comment="c"
              />
            </div>
          </section>

        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — sidebar split vertically: Related (2/3) + Versions
             (1/3). Mirrors PostViewerPage so the two viewers share the
             same canonical [subject-panel, [Related, Versions]] shape.
        ══════════════════════════════════════════════════════════ -->
        <aside class="node-side">

          <section class="related-panel side-panel side-panel--related">
            <div class="related-panel__header">
              <q-icon name="dashboard" size="14px" class="q-mr-xs" />
              <span>Related</span>
              <span class="related-count">0</span>
            </div>
            <div class="related-panel__scroll">
              <div class="related-panel__empty">
                Nothing related yet.
              </div>
            </div>
          </section>

          <!-- Versions — chain of node versions (older toward origin,
               then the current head, then newer descendants). Each row
               navigates to that specific version of the node. -->
          <section class="versions-panel side-panel side-panel--versions">
            <div class="versions-panel__header">
              <q-icon name="history" size="14px" class="q-mr-xs" />
              <span>Versions</span>
              <span class="versions-count">{{ versionChain.length }}</span>
            </div>
            <div class="versions-panel__scroll">
              <div v-if="!versionChain.length" class="versions-panel__empty">
                No versions yet.
              </div>
              <router-link
                v-for="(v, i) in versionChain"
                :key="v.id"
                :to="'/nodes/' + v.id"
                class="version-row"
                :class="{ 'version-row--current': v.id === node.id }"
                :title="v.path"
              >
                <span class="version-row-tag mono">v{{ i + 1 }}</span>
                <span class="version-row-snippet">{{ versionSnippet(v) }}</span>
                <q-space />
                <span v-if="v.id === node.id" class="version-row-current">current</span>
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
import { useNavStore } from 'src/stores/navigation'
import { nodeService } from 'src/services/node.service'
import { nodeInteractionService } from 'src/services/nodeInteraction.service'
import { entityService } from 'src/services/entity.service'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import CommentItem from 'src/components/nodes/CommentItem.vue'
import PostCommentItem from 'src/components/posts/PostCommentItem.vue'
import ElementActions from 'src/components/maker/ElementActions.vue'
import NodeContentViewer from 'src/components/nodes/NodeContentViewer.vue'
import { bodyOf } from 'src/utils/nodeContent'
import { hashOf } from 'src/utils/kinds'
import { useStateHolder } from 'src/composables/useStateHolder'
import { useMakerStore } from 'src/stores/maker'
import { parseUnravel } from 'src/utils/threadNav'
import PostMakerSurface from 'src/components/maker/PostMakerSurface.vue'
import NodeForkItem from 'src/components/nodes/NodeForkItem.vue'
import ForkConfirmPanel from 'src/components/nodes/ForkConfirmPanel.vue'
import BottomSplitter from 'src/components/shared/BottomSplitter.vue'
import FileContractBadge from 'src/components/files/FileContractBadge.vue'
import AccessDeniedBanner from 'src/components/shared/AccessDeniedBanner.vue'
import { lockedInfoFromError } from 'src/utils/access'

const TYPE_ICONS = { NOTE: 'article', FILE: 'attachment', URL: 'link', REFERENCE: 'call_split' }
const TYPE_COLORS = { NOTE: 'primary', FILE: 'teal', URL: 'secondary', REFERENCE: 'orange' }

export default defineComponent({
  name: 'NodeDetailPage',
  components: { LabelSlider, MomentInfo, CommentItem, PostCommentItem, ElementActions, NodeContentViewer, PostMakerSurface, NodeForkItem, ForkConfirmPanel, BottomSplitter, FileContractBadge, AccessDeniedBanner },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const navStore = useNavStore()
    const makerStore = useMakerStore()

    const node = ref(null)
    const labels = ref([])
    const loading = ref(true)
    const locked = ref(null) // { kind, hash, id, address } when the read 403'd
    const copied = ref(false)

    const votes = ref({ up: 0, down: 0, viewer_vote: null })
    const comments = ref([])
    const forkSource = ref(null) // { id, path } of the node this one was forked from

    // Origin (legacy node_comment + new skeleton-based) + walked root. Drives
    // the header's "Comment from <kind>/<hash>" title and the hash link target.
    const origin = ref(null)

    // Author entity enriched with USER_PROFILE display_name. The node API
    // returns a basic author row; we enrich via entityService for parity
    // with the post viewer's chip.
    const authorEntity = ref(null)

    // ── Node-side POST children (reply / fork on this node) ─
    const nodeChildren = ref([])
    const loadingChildren = ref(false)

    // ── Versioning awareness ────────────────────────────────
    const versions = ref({ older: [], newer: [], has_newer: false })

    // ── Footer action state ─────────────────────────────────
    // ── Tabbed panel state (mirrors PostViewerPage) ─────────
    const activeTab = ref('comment')
    const composerOpen = ref(false)
    const forkConfirmOpen = ref(false)
    const submittingFork = ref(false)

    // BottomSplitter auto-expand wiring — see PostViewerPage for the
    // shared rationale. Same chrome-budget so all three viewers feel
    // consistent when the composer opens.
    const bottomSplitterRef = ref(null)
    const composerEl = ref(null)
    const COMPOSER_CHROME_PX = 150

    const expandBottomPane = (minPx) => bottomSplitterRef.value?.ensureMinHeight(minPx)
    const releaseBottomPane = () => bottomSplitterRef.value?.releaseMinHeight()
    provide('expandBottomPane', expandBottomPane)
    provide('releaseBottomPane', releaseBottomPane)

    // The embedded composer edits a real maker-store draft (parent =
    // this node) so the in-progress comment survives as a footer maker
    // tab if the embed is closed before posting.
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
      const excerpt = (bodyOf(node.value) || '').replace(/[#*`>\n]/g, ' ').trim().slice(0, 40)
      const d = makerStore.openCommentDraft({
        kind: 'node',
        id: node.value.id,
        hash: hashOf(node.value.path || ''),
        route: `/nodes/${node.value.id}`,
        label: excerpt || `node #${node.value.id}`
      })
      commentDraftId.value = d.id
      composerOpen.value = true
      await nextTick()
      const h = composerEl.value?.offsetHeight || 280
      expandBottomPane(h + COMPOSER_CHROME_PX)
    }

    const commentChildren = computed(() =>
      nodeChildren.value.filter(c => c.provenance !== 'FORK')
    )

    // Fork tree — forks of a node are NODES (forked_from_id), listed by
    // the interactions endpoint and rendered as a recursive NodeForkItem
    // tree (each fork expands into its own forks).
    const forkNodes = ref([])
    const loadForkNodes = async (id) => {
      try {
        const r = await nodeInteractionService.getForks(id)
        forkNodes.value = (r.success && r.forks) || []
      } catch (_) { forkNodes.value = [] }
    }

    // ── Thread unravel (?unravel=<id,…> below this node root) ──
    // Same-page unravels (a comment just posted from the dock) can target
    // a comment newer than the loaded list — refresh once, then expand.
    const unravelPath = computed(() => parseUnravel(route.query.unravel))
    let unravelReloadedFor = null
    watch([unravelPath, loading], async () => {
      const chain = unravelPath.value
      if (!chain.length || loading.value) return
      if (!nodeChildren.value.some(c => c.id === chain[0]) && unravelReloadedFor !== String(chain)) {
        unravelReloadedFor = String(chain)
        await reload()
        return
      }
      activeTab.value = 'comment'
      await nextTick()
      expandBottomPane(420)
    }, { immediate: true })

    // Full version chain rendered in the sidebar — older versions
    // (chronological, oldest first), then the current node, then any
    // newer descendants (also chronological). The endpoint returns
    // `older` walking back toward the origin and `newer` newest-first,
    // so both need to be flipped to produce one straight timeline.
    const versionChain = computed(() => {
      if (!node.value) return []
      const older = [...(versions.value.older || [])].reverse()
      const newer = [...(versions.value.newer || [])].reverse()
      const head = {
        id: node.value.id,
        path: node.value.path,
        content: node.value.content,
        file: node.value.file,
        created_at: node.value.created_at
      }
      return [...older, head, ...newer]
    })

    const versionSnippet = (v) => {
      const body = bodyOf(v).replace(/^\s+/, '')
      const firstLine = body.split('\n')[0] || ''
      return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine
    }

    const shortHash = (p) => {
      const h = (p || '').split('/').pop()
      return h ? h.slice(0, 10) + (h.length > 10 ? '…' : '') : ''
    }

    const typeName = computed(() => node.value?.type?.name || 'NOTE')
    const typeIcon = computed(() => TYPE_ICONS[typeName.value] || 'article')
    const typeColor = computed(() => TYPE_COLORS[typeName.value] || 'primary')

    // File-backed nodes: the editable body is the resolved file text, and
    // only text kinds (md/txt) can be edited in place — binary media hides
    // the Edit affordance (fork/re-upload instead).
    const nodeBody = computed(() => bodyOf(node.value))
    const isEditableNode = computed(() => {
      const f = node.value?.file
      return !f || f.kind === 'text'
    })

    // Creation moment comes from the node row itself (moment_id) — the
    // MomentInfo chip self-resolves via /refs/summary.
    const nodeMomentId = computed(() => node.value?.moment_id || null)
    const sliderLabels = computed(() => labels.value)

    // Author display name resolution mirrors the post viewer: USER_PROFILE
    // → user_login.username → fallback "entity #N".
    const authorDisplayName = computed(() => {
      const e = authorEntity.value
      if (!e) return ''
      return e.profile?.display_name ||
          e.display_name ||
          e.profile?.username ||
          e.username ||
          ('entity #' + e.id)
    })

    // "Comment from <kind>/<short-hash>" — the kind describes the IMMEDIATE
    // parent: "post" when the parent is a top-level post, "comment" when
    // the parent is itself a nested comment, "node" when the parent is a
    // raw node. The hash is the parent's short hash. The link target
    // (originRoot) walks past intermediate comment hops up to the root.
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

    const shortEntityHash = (p) => {
      const h = (p || '').split('/').pop()
      return h ? h.slice(0, 8) : ''
    }

    const formatTime = (iso) => {
      if (!iso) return ''
      try { return new Date(iso).toLocaleString() } catch (_) { return iso }
    }

    const copyPath = () => {
      if (!node.value?.path) return
      navigator.clipboard.writeText(node.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    const loadInteractions = async (id) => {
      const result = await nodeInteractionService.getInteractions(id)
      if (result.success) {
        votes.value = result.votes
        comments.value = result.comments
      }
    }

    // POST instances whose PARENT slot points at this node — recovered by
    // walking the action audit (target_type='node'). Mirrors the post
    // viewer's listChildren but for the node side.
    const loadNodeChildren = async (id) => {
      loadingChildren.value = true
      try {
        const result = await nodeService.listChildrenOfNode(id)
        nodeChildren.value = (result.success && result.children) ? result.children : []
      } catch (_) { nodeChildren.value = [] }
      loadingChildren.value = false
    }

    const loadVersions = async (id) => {
      try {
        const result = await nodeService.getVersions(id)
        if (result.success) {
          versions.value = {
            older: result.older || [],
            newer: result.newer || [],
            has_newer: !!result.has_newer
          }
        }
      } catch (_) { /* leave defaults */ }
    }

    // Snapshot fork — the API copies this node's content into a fresh
    // owned node automatically. On success we land on the new fork so the
    // owner can iterate via the existing draft+promote flow.
    const submitFork = async () => {
      if (submittingFork.value || !node.value) return
      submittingFork.value = true
      try {
        const r = await nodeService.forkOfNode(node.value.id, {})
        if (r.success) {
          forkConfirmOpen.value = false
          if (r.node?.id) router.push('/nodes/' + r.node.id)
        }
      } catch (_) { /* swallow */ }
      submittingFork.value = false
    }

    const reload = async () => {
      if (!node.value) return
      await Promise.all([
        loadNodeChildren(node.value.id),
        loadForkNodes(node.value.id)
      ])
    }

    // ElementActions callbacks
    const onElementUpdated = async (promotedNode) => {
      // The owner promoted a draft. The promoted node is a NEW descendant
      // row; navigate to it so the page shows the latest version.
      if (promotedNode?.id) router.push('/nodes/' + promotedNode.id)
    }
    const onElementForked = async (forkedNode) => {
      if (forkedNode?.id) router.push('/nodes/' + forkedNode.id)
    }

    const castVote = async (direction) => {
      const id = node.value.id
      const targetMeta = {
        targetType: 'node',
        targetId: id,
        targetRoute: `/nodes/${id}`,
        targetLabel: `Node #${id}`,
        targetPath: node.value.path
      }
      if (votes.value.viewer_vote === direction) {
        await nodeInteractionService.unvote(id)
        votes.value[direction === 'UP' ? 'up' : 'down']--
        votes.value.viewer_vote = null
        navStore.recordAction('UNVOTE', targetMeta)
      } else {
        if (votes.value.viewer_vote) {
          votes.value[votes.value.viewer_vote === 'UP' ? 'up' : 'down']--
        }
        await nodeInteractionService.vote(id, direction)
        votes.value[direction === 'UP' ? 'up' : 'down']++
        votes.value.viewer_vote = direction
        navStore.recordAction(direction === 'UP' ? 'VOTE_UP' : 'VOTE_DOWN', targetMeta)
      }
    }

    // Vue Router reuses the same component instance when navigating between
    // /nodes/A → /nodes/B, so we re-fetch when the params change.
    // When the loaded node is a fork (forked_from_id is set), fetch the
    // source so the "Forked from" banner can display its hash + link.
    const loadForkSource = async (forkedFromId) => {
      if (!forkedFromId) { forkSource.value = null; return }
      try {
        const r = await nodeService.get(forkedFromId)
        if (r.success && r.node) {
          forkSource.value = { id: r.node.id, path: r.node.path }
        }
      } catch (_) { forkSource.value = null }
    }

    // Load + enrich the node's author via the entity endpoint so the chip
    // can display the canonical USER_PROFILE display name. Falls back to
    // whatever the node API already returned.
    const loadAuthor = async (n) => {
      if (!n?.author) { authorEntity.value = null; return }
      authorEntity.value = n.author
      try {
        const er = await entityService.get(n.author.id)
        if (er.success) authorEntity.value = { ...n.author, ...er.entity }
      } catch (_) { /* keep raw author */ }
    }

    // The origin walk lives in the backend; the dashboard just renders it.
    const loadOrigin = async (id) => {
      try {
        const r = await nodeInteractionService.getOrigin(id)
        if (r.success) origin.value = r
      } catch (_) { origin.value = null }
    }

    // StateHolder — approximate window location + return halo for refs
    // followed out of this node.
    const holder = useStateHolder({}, { targetType: 'node' })

    const loadFromRoute = async () => {
      loading.value = true
      node.value = null
      locked.value = null
      labels.value = []
      comments.value = []
      forkSource.value = null
      votes.value = { up: 0, down: 0, viewer_vote: null }
      nodeChildren.value = []
      forkNodes.value = []
      versions.value = { older: [], newer: [], has_newer: false }
      composerOpen.value = false
      forkConfirmOpen.value = false
      origin.value = null
      authorEntity.value = null

      // A private node 403s here (code 40310) — surface the octopus
      // banner instead of hanging the spinner on the unhandled throw.
      let result = null
      try {
        if (route.params.path) {
          result = await nodeService.getByPath(route.params.path)
        } else {
          const id = parseInt(route.params.id)
          if (!id) { loading.value = false; return }
          result = await nodeService.get(id)
        }
      } catch (e) {
        locked.value = lockedInfoFromError(e)
      }

      if (result?.success) {
        node.value = result.node
        labels.value = result.node.labels || []
        await Promise.all([
          loadInteractions(result.node.id),
          loadNodeChildren(result.node.id),
          loadForkNodes(result.node.id),
          loadVersions(result.node.id),
          loadForkSource(result.node.forked_from_id),
          loadOrigin(result.node.id),
          loadAuthor(result.node)
        ])

        const excerpt = (bodyOf(result.node) || '').replace(/[#*`>\n]/g, ' ').trim().slice(0, 48)
        holder.describe({
          title: excerpt || `Node #${result.node.id}`,
          hash: hashOf(result.node.path || ''),
          targetType: 'node',
          targetId: result.node.id
        })
      }
      loading.value = false
      await holder.restore()
    }

    onMounted(loadFromRoute)
    watch(() => [route.params.id, route.params.path], loadFromRoute)

    return {
      node,
      labels,
      loading,
      locked,
      copied,
      nodeMomentId,
      sliderLabels,
      votes,
      comments,
      forkSource,
      typeName,
      typeIcon,
      typeColor,
      nodeBody,
      isEditableNode,
      copyPath,
      castVote,
      // Identity header — author + origin-aware "Comment from <kind>/<hash>"
      authorEntity,
      authorDisplayName,
      origin,
      originHashLabel,
      originRoot,
      shortEntityHash,
      formatTime,
      // node-side post children + fork tree + versioning
      nodeChildren,
      loadingChildren,
      commentChildren,
      forkNodes,
      versions,
      versionChain,
      versionSnippet,
      shortHash,
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
      // ElementActions callbacks
      onElementUpdated,
      onElementForked,
      reload
    }
  }
})
</script>

<style lang="scss" scoped>
// Page-edge padding — small breathing room on top so the panels don't
// touch the viewport edge, near-flush on sides + bottom so the
// [subject-panel, [Related, Versions]] rectangles read as full-bleed.
.node-page {
  padding: 16px 10px 0;
}

// ── Two-column grid — same approach as PostViewerPage ────
.node-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.node-main { min-width: 0; }

// Side column mirrors the subject-panel height; vertical flex split
// between Related (top 2/3) and Versions (bottom 1/3).
.node-side {
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
.side-panel--related  { flex: 2 1 0; }
.side-panel--versions { flex: 1 1 0; }

@media (max-width: 1023px) {
  .node-grid { grid-template-columns: minmax(0, 1fr); }
  .node-side {
    height: auto;
    max-height: none;
  }
  .side-panel--related,
  .side-panel--versions { flex: 0 0 auto; }
}

// ══════════════════════════════════════════════════════════
// .subject-panel — merged container for the viewed node.
// Shares the same tokens, internal-zone names, and color story
// as PostViewerPage so the two viewers read as one family.
// Chrome zones (--panel-chrome) wrap the white body zone; one
// outer border + shadow; hairline dividers between zones.
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
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  position: relative;           // anchor for BottomSplitter overlay

  & > * + *:not(.bottom-splitter) { border-top: 1px solid var(--panel-rule); }
}

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
.subject-panel__labels {
  display: flex;
  align-items: center;
  gap: 10px;
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}

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
.subject-panel__meta .meta-icon  { color: var(--panel-ink-2); }
.subject-panel__meta .meta-label {
  color: var(--panel-ink-2);
  white-space: nowrap;
  strong { color: var(--panel-ink-1); }
}
.subject-panel__meta .meta-typename { color: var(--panel-ink-mute); margin-left: 4px; }
.subject-panel__meta .meta-hash {
  font-size: 0.86em;
  color: var(--panel-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}
.subject-panel__meta .meta-btn {
  color: var(--panel-ink-2);
  &:hover { color: var(--coral-deep); }
}

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
  .banner-link {
    color: #8b6321;
    text-decoration: underline;
    &:hover { color: var(--coral-deep); }
  }
}

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
  color: var(--panel-ink); // dark-mode body inherits white; pin ink on the paper card
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

  .reply-hint {
    font-size: 0.78em;
    color: var(--panel-ink-2);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    strong { color: var(--panel-ink-1); }
  }
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

// Body content-kind ribbon (URL/File/Reference)
.body-kind {
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--panel-ink-mute);
  margin-bottom: 6px;
}

// Fork rows (matches the post viewer's sidebar fork list)
.fork-link { display: block; text-decoration: none; }
.fork-row {
  display: flex;
  align-items: center;
  transition: transform 0.08s;
  cursor: pointer;
  &:hover { transform: translateX(2px); }
}
.fork-excerpt {
  font-size: 0.82em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
}

// Body scroller — head + footer stay pinned while the body moves
.markdown-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
}

// ── Light-theme markdown (replaces the dark overrides) ───
// Verbatim markdown source — preserves whitespace, wraps long lines.
// The post viewer renders the formatted version of the same content;
// the node viewer surfaces the raw text so the user can see the source.
.node-raw {
  margin: 0;
  color: #2C3D4E;
  font-family: 'Space Mono', ui-monospace, monospace;
  font-size: 0.88em;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

// URL inline link
.url-link {
  color: #2a5a87;
  text-decoration: none;
  word-break: break-all;
  font-size: 0.95em;
  display: inline-flex;
  align-items: center;
  &:hover { color: #d35f5f; }
}

// ── Section heading (matches the post viewer) ────────────
.section-heading {
  font-size: 0.85em;
  color: #1F2A38;
  display: flex;
  align-items: center;
  margin: 0 0 8px;
  padding-left: 4px;
}

// ── Author chip (used inside .subject-panel__labels) ────
// Mirrors PostViewerPage.author-chip so the two viewers feel like
// members of the same family.
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

// "Comment from <kind>/<hash>" — the hash hyperlinks to the ROOT of the
// comment thread (post or node), bypassing intermediate comment nodes.
.origin-hash-link {
  color: #d35f5f;
  text-decoration: none;
  border-bottom: 1px dashed rgba(211, 95, 95, 0.5);
  padding-bottom: 1px;
  font-size: 0.92em;
  transition: color 0.12s, border-color 0.12s;
  &:hover {
    color: #b14848;
    border-color: rgba(211, 95, 95, 0.85);
  }
}
.origin-hash-fallback {
  color: #6b7993;
  font-size: 0.92em;
}

// ══════════════════════════════════════════════════════════
// .related-panel + .versions-panel — sidebar twins of .subject-panel
// (same token palette, hairline rules, coral accent) so the
// [subject-panel, [Related, Versions]] trio reads as one family.
// ══════════════════════════════════════════════════════════
.related-panel,
.versions-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}

.related-panel__header,
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

.related-panel__scroll,
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

.related-count,
.versions-count {
  font-size: 0.92em;
  margin-left: 5px;
  color: var(--panel-ink-2);
}

.related-panel__empty,
.versions-panel__empty {
  padding: 10px 12px;
  font-size: 0.80em;
  color: var(--panel-ink-2);
  text-align: center;
  font-style: italic;
}

// ── Version rows ─────────────────────────────────────────
// Each row hyperlinks to that specific node version. The row that
// matches the currently-viewed node is highlighted with a "current"
// chip + coral tint so the user can see where they sit in the chain.
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

  &.version-row--current {
    background: rgba(var(--coral-rgb), 0.08);
    .version-row-tag { color: var(--coral-deep); font-weight: 600; }
  }

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
  .version-row-current {
    font-size: 0.74em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--coral-deep);
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(var(--coral-rgb), 0.12);
  }
  &:hover .version-row-hash { color: var(--coral-deep); }
}
</style>
