<template>
  <!-- A single row in the file tree, recursive. Top-level rows are kind
       folders (`nodes/`, `labels/`, …); their children are element
       leaves. Each leaf carries two dropdowns: a Mini preview and the
       decoded `{}` content + `.proto` schema. Both expand inline below
       the row so the tree never gets a floating overlay. -->
  <div class="ft-node" :class="{ 'ft-node--folder': isFolder }">

    <div
      ref="rowEl"
      class="ft-row"
      :class="{ 'ft-row--flash': flashing }"
      :style="`--depth: ${depth};`"
    >
      <span
        v-if="isFolder"
        class="ft-toggle"
        @click="toggleOpen"
      >
        <q-icon :name="open ? 'expand_more' : 'chevron_right'" size="14px" />
      </span>
      <span v-else class="ft-toggle-spacer" />

      <template v-if="isFolder">
        <template v-if="isOwnerFolder">
          <!-- Per-owner subtree: render like an entity row so it's clearly
               distinct from the kind folders. The "browse" button on the
               right hops into `/files/<hash>` for a focused subtree view. -->
          <q-icon name="person" size="14px" class="ft-owner-icon" />
          <span class="ft-folder-label">
            <span v-if="node.username" class="ft-owner-username">@{{ node.username }}</span>
            <span class="ft-owner-hash mono">{{ node.ownerHash.slice(0, 12) }}…</span>
          </span>
          <span class="ft-folder-count">{{ node.count }}</span>
          <q-btn
            dense flat round
            size="xs"
            icon="account_tree"
            class="ft-drop-btn ft-owner-jump"
            :to="`/files/${node.ownerHash}`"
            @click.stop
          >
            <q-tooltip>focus on this owner's subtree</q-tooltip>
          </q-btn>
        </template>
        <template v-else>
          <q-icon name="folder" size="14px" class="ft-folder-icon" />
          <span class="ft-folder-label nasalization">{{ node.name }}</span>
          <span class="ft-folder-count">{{ node.count }}</span>
        </template>
      </template>

      <template v-else>
        <component
          :is="microFor(node.kind)"
          v-if="node.hasMicro && node.db"
          :id="node.db.id"
          :path="`${node.kind}/${node.hash}`"
          :full-address="node.path"
          show-type
        />
        <HashLink
          v-else
          :path="`${node.kind}/${node.hash}`"
          :id="node.db?.id || null"
          :show-icon="true"
          :truncate="24"
        />

        <!-- Dropdown buttons sit immediately to the right of the chip so
             they read as controls *for that element*, not as right-edge
             chrome. -->
        <span class="ft-drops">
          <q-btn
            v-if="node.db && hasMini"
            dense flat round
            size="xs"
            :icon="miniOpen ? 'expand_less' : 'expand_more'"
            class="ft-drop-btn"
            @click.stop="toggleMini"
          >
            <q-tooltip>{{ miniOpen ? 'hide preview' : 'show preview' }}</q-tooltip>
          </q-btn>

          <q-btn
            dense flat
            size="xs"
            icon="data_object"
            :icon-right="rawOpen ? 'expand_less' : 'expand_more'"
            class="ft-drop-btn ft-raw-btn"
            @click.stop="toggleRaw"
          >
            <q-tooltip>{{ rawOpen ? 'hide decoded' : 'show decoded' }}</q-tooltip>
          </q-btn>

          <!-- For entity / pioneer leaves the on-disk hash *is* an owner
               hash, so let the user hop straight into that owner's tree. -->
          <q-btn
            v-if="isOwnerLike"
            dense flat round
            size="xs"
            icon="account_tree"
            class="ft-drop-btn"
            :to="`/files/${node.hash}`"
            @click.stop
          >
            <q-tooltip>browse this entity's tree</q-tooltip>
          </q-btn>
        </span>

        <q-space />
      </template>
    </div>

    <!-- Inline Mini preview, sitting under the row, indented to match. -->
    <div
      v-if="!isFolder && miniOpen"
      class="ft-inline-panel"
      :style="`--depth: ${depth};`"
    >
      <div v-if="miniLoading" class="ft-inline-status">
        <q-spinner-dots size="16px" /> loading…
      </div>
      <div v-else-if="miniError" class="ft-inline-status ft-inline-error">
        {{ miniError }}
      </div>
      <component
        v-else-if="miniComponent"
        :is="miniComponent"
        v-bind="miniProps"
      />
    </div>

    <!-- Inline decoded content + proto. -->
    <div
      v-if="!isFolder && rawOpen"
      class="ft-inline-panel"
      :style="`--depth: ${depth};`"
    >
      <DecodedContentInline :node="node" />
    </div>

    <div v-if="isFolder && open" class="ft-children">
      <FileTreeNode
        v-for="child in displayChildren"
        :key="child.hash || child.kind"
        :node="child"
        :depth="depth + 1"
      />
      <div
        v-if="folderLoading"
        class="ft-batch-status"
        :style="`--depth: ${depth + 1};`"
      >
        <q-spinner-dots size="14px" /> loading…
      </div>
      <div
        v-else-if="folderError"
        class="ft-batch-status ft-batch-error"
        :style="`--depth: ${depth + 1};`"
      >
        {{ folderError }}
      </div>
      <!-- Leaves page in 10 at a time, most recent first; this row pulls
           the next batch. -->
      <button
        v-if="canLoadMore"
        class="ft-load-more"
        :style="`--depth: ${depth + 1};`"
        @click="loadMore"
      >
        <q-icon name="expand_more" size="12px" class="q-mr-xs" />
        load 10 more
        <span class="ft-load-more__count mono">{{ displayChildren.length }}/{{ total }}</span>
      </button>
      <div v-if="isEmptyFolder" class="ft-empty">empty</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, markRaw, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import HashLink from 'src/components/shared/HashLink.vue'
import NodeMicro from 'src/components/nodes/NodeMicro.vue'
import LabelMicro from 'src/components/labels/LabelMicro.vue'
import PathMicro from 'src/components/paths/PathMicro.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import MomentMicro from 'src/components/moments/MomentMicro.vue'
import SecretMicro from 'src/components/secrets/SecretMicro.vue'
import LinkMicro from 'src/components/links/LinkMicro.vue'
import DecodedContentInline from 'src/components/files/DecodedContentInline.vue'

import { nodeService } from 'src/services/node.service'
import { labelService } from 'src/services/label.service'
import { entityService } from 'src/services/entity.service'
import { fileService } from 'src/services/file.service'
import { folderKeyFor } from 'src/utils/treeNav'

// Leaves page in from the API this many at a time.
const BATCH = 10

// Map on-disk kind → Micro component
const MICRO_BY_KIND = {
  nodes: NodeMicro,
  labels: LabelMicro,
  paths: PathMicro,
  posts: PostMicro,
  entities: EntityMicro,
  moments: MomentMicro,
  secrets: SecretMicro,
  links: LinkMicro
}

// Map on-disk kind → async Mini component (lazy so the chunk only loads
// when the user opens something).
const MINI_BY_KIND = {
  nodes: () => import('src/components/nodes/NodeMini.vue'),
  labels: () => import('src/components/labels/LabelMini.vue'),
  paths: () => import('src/components/paths/PathMini.vue'),
  posts: () => import('src/components/posts/PostMini.vue'),
  entities: () => import('src/components/entities/EntityMini.vue'),
  moments: () => import('src/components/moments/MomentMini.vue'),
  secrets: () => import('src/components/secrets/SecretMini.vue'),
  links: () => import('src/components/links/LinkMini.vue')
}

// Map on-disk kind → fetcher returning the prop object expected by the
// matching XMini (e.g. NodeMini takes a `node` prop).
const MINI_FETCHERS = {
  nodes: async (id) => ({ node: (await nodeService.get(id)).node }),
  labels: async (id) => ({ label: (await labelService.get(id)).label }),
  entities: async (id) => {
    const res = await entityService.get(id)
    const e = res.entity || res
    // Flatten USER_PROFILE slots onto the entity for EntityMini's prop shape.
    const profile = e.profile || {}
    return {
      entity: {
        id: e.id,
        path: e.path,
        username: e.username || profile.username || null,
        display_name: profile.display_name || null,
        joined_at: profile.joined_at || e.created_at || null,
        bio: profile.bio || null
      }
    }
  },
  posts: async (id) => {
    const { postService } = await import('src/services/post.service')
    const res = await postService.get(id)
    return { post: res.post || res }
  },
  // Paths are primal: `/api/paths/:id` walks the Path ROW directly and
  // returns { path, owner, steps, labels } with no skeleton wrapper.
  // PathMini takes the row itself plus the enriched owner as `author`.
  paths: async (id) => {
    const { pathService } = await import('src/services/path.service')
    const res = await pathService.byId(id)
    if (!res?.success || !res.path) {
      return { path: { id, path: '' }, labels: [] }
    }
    return {
      path: {
        ...res.path,
        author: res.owner || null
      },
      labels: res.labels || []
    }
  },
  moments: async (id) => {
    const { momentService } = await import('src/services/moment.service')
    const res = await momentService.get(id)
    return { moment: res.moment || { id, path: '' }, human: res.human || null }
  },
  secrets: async (id) => {
    const { secretService } = await import('src/services/secret.service')
    const res = await secretService.get(id)
    return {
      secret: res.secret || { id, path: '' },
      owner: res.owner || null,
      receiver: res.receiver || null
    }
  },
  links: async (id) => {
    const { linkService } = await import('src/services/link.service')
    const res = await linkService.get(id)
    return {
      link: res.link || { id, path: '' },
      target: res.target || null,
      parentPath: res.parentPath || null
    }
  }
}

export default defineComponent({
  name: 'FileTreeNode',
  components: { HashLink, DecodedContentInline },
  props: {
    node: { type: Object, required: true },
    depth: { type: Number, default: 0 }
  },
  setup (props) {
    // Intra-tree navigation controller, provided by FileTreePage. Absent in
    // isolated tests/storybook — every use is null-guarded.
    const treeNav = inject('treeNav', null)
    const uid = computed(() => props.node._uid)

    const isFolder = computed(() => Array.isArray(props.node.children))
    const isOwnerFolder = computed(() => props.node.kind === 'owner')
    const isLazy = computed(() => !!props.node.lazy)

    // Non-lazy shallow folders (owner rows on the root view) auto-open so
    // the user lands on the tree's *names* right away. Lazy kind folders
    // always start closed — expanding one is what triggers its first
    // batch fetch, so nothing loads until the user asks for it.
    const startsOpen = props.depth <= 1 &&
      Array.isArray(props.node.children) &&
      !props.node.lazy
    const open = ref(startsOpen)
    const toggleOpen = () => { open.value = !open.value }

    // ── Lazy leaf paging ─────────────────────────────────────────────
    // The tree payload only carries folder names + counts; leaves arrive
    // in mtime-desc batches of BATCH as the folder is opened / "load 10
    // more" is clicked.
    const loadedLeaves = ref([])
    const folderLoading = ref(false)
    const folderError = ref('')
    let loadedOnce = false

    const total = computed(() => props.node.count || 0)
    const displayChildren = computed(() =>
      isLazy.value ? loadedLeaves.value : (props.node.children || [])
    )
    const canLoadMore = computed(() =>
      isLazy.value && !folderLoading.value && loadedLeaves.value.length < total.value
    )
    const isEmptyFolder = computed(() =>
      !folderLoading.value && !folderError.value &&
      displayChildren.value.length === 0 &&
      (!isLazy.value || total.value === 0)
    )

    const fetchPage = async (params) => {
      folderLoading.value = true
      folderError.value = ''
      try {
        const res = await fileService.listFolder({
          owner: props.node.owner || undefined,
          kind: props.node.kind,
          ...params
        })
        if (!res.success) throw new Error(res.error?.message || 'load failed')
        return res
      } catch (e) {
        folderError.value = e.message || 'load failed'
        return null
      } finally {
        folderLoading.value = false
      }
    }

    const loadMore = async () => {
      const res = await fetchPage({ offset: loadedLeaves.value.length, limit: BATCH })
      if (res) {
        loadedOnce = true
        loadedLeaves.value.push(...res.leaves)
      }
    }

    // Reveal navigation entry point: open this folder and make sure every
    // batch from the top through the one containing `hash` is loaded, so
    // the target row exists to scroll to. Returns false when the hash
    // isn't in this folder on disk.
    const loadUntil = async (hash) => {
      // Claim the first-open fetch BEFORE opening, or the open-watcher's
      // loadMore() races this fetch and appends a duplicate first batch.
      loadedOnce = true
      open.value = true
      if (loadedLeaves.value.some(l => l.hash === hash)) return true
      const res = await fetchPage({ until: hash })
      if (!res || res.found === false) return false
      loadedLeaves.value = res.leaves
      return true
    }

    // First manual open pulls the first batch (count 0 folders skip the
    // round-trip). `loadUntil` sets loadedOnce itself, so a reveal-opened
    // folder doesn't double-fetch.
    watch(open, (isOpen) => {
      if (isOpen && isLazy.value && !loadedOnce && total.value > 0) loadMore()
    })

    // A reveal force-opens this folder if its uid is in the controller's
    // open set (it's an ancestor of the element being revealed). We never
    // force-close — the user's manual toggles still win afterwards.
    if (treeNav && isFolder.value) {
      watch(
        () => treeNav.openIds.has(uid.value),
        (forced) => { if (forced) open.value = true }
      )
      if (isLazy.value) {
        const fKey = folderKeyFor(props.node.owner, props.node.kind)
        onMounted(() => treeNav.registerFolder(fKey, { loadUntil }))
        onBeforeUnmount(() => treeNav.registerFolder(fKey, null))
      }
    }

    const hasMini = computed(() => Boolean(MINI_BY_KIND[props.node.kind]))

    // Leaves whose `hash` is itself an entity (owner) hash — those are
    // the jump-off points for "browse another user's tree".
    const isOwnerLike = computed(() => {
      const k = props.node.kind
      return k === 'entities' || k === 'pioneer'
    })

    // ── Mini preview dropdown ────────────────────────────────────────
    const miniOpen = ref(false)
    const miniLoading = ref(false)
    const miniError = ref('')
    const miniComponent = ref(null)
    const miniProps = ref(null)

    const ensureMini = async () => {
      if (miniComponent.value || miniLoading.value) return
      const kind = props.node.kind
      const loader = MINI_BY_KIND[kind]
      const fetcher = MINI_FETCHERS[kind]
      if (!loader || !fetcher || !props.node.db?.id) {
        miniError.value = `No preview available for ${kind}`
        return
      }
      miniLoading.value = true
      try {
        const [mod, propsObj] = await Promise.all([
          loader(),
          fetcher(props.node.db.id)
        ])
        miniComponent.value = markRaw(mod.default || mod)
        miniProps.value = propsObj
      } catch (e) {
        miniError.value = e.message || 'load failed'
      } finally {
        miniLoading.value = false
      }
    }

    const toggleMini = () => {
      miniOpen.value = !miniOpen.value
      if (miniOpen.value) ensureMini()
    }

    // ── Decoded content + proto dropdown ─────────────────────────────
    const rawOpen = ref(false)
    const toggleRaw = () => { rawOpen.value = !rawOpen.value }

    // ── Reveal target (intra-tree navigation) ────────────────────────
    // The leaf registers its row element under its canonical
    // '<kind>/<hash>' key so a reveal can scroll to it. When this leaf is
    // the reveal target we auto-expand its Mini preview AND its decoded
    // panel and flash the row so the eye lands on it. Because reveal
    // targets often mount *after* the reveal starts (their batch is still
    // loading), the mount hook checks the pending key too.
    const rowEl = ref(null)
    const flashing = ref(false)
    let flashTimer = null

    const leafKey = computed(() => `${props.node.kind}/${props.node.hash}`)

    const doReveal = () => {
      rawOpen.value = true
      if (hasMini.value && props.node.db) {
        miniOpen.value = true
        ensureMini()
      }
      flashing.value = true
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(() => { flashing.value = false }, 1400)
    }

    if (treeNav && !isFolder.value) {
      onMounted(() => {
        treeNav.registerEl(leafKey.value, rowEl.value)
        if (treeNav.revealKey.value === leafKey.value) doReveal()
      })
      onBeforeUnmount(() => {
        treeNav.registerEl(leafKey.value, null)
        if (flashTimer) clearTimeout(flashTimer)
      })

      // revealTick bumps on every reveal (even a repeat of the same key),
      // so watching it re-triggers the expand/flash reliably.
      watch(
        () => treeNav.revealTick.value,
        () => {
          if (treeNav.revealKey.value === leafKey.value) doReveal()
        }
      )
    }

    const microFor = (kind) => MICRO_BY_KIND[kind] || null

    return {
      isFolder,
      isOwnerFolder,
      open,
      toggleOpen,
      displayChildren,
      total,
      folderLoading,
      folderError,
      canLoadMore,
      isEmptyFolder,
      loadMore,
      hasMini,
      isOwnerLike,
      miniOpen,
      miniLoading,
      miniError,
      miniComponent,
      miniProps,
      toggleMini,
      rawOpen,
      toggleRaw,
      rowEl,
      flashing,
      microFor
    }
  }
})
</script>

<style lang="scss" scoped>
.ft-node {
  font-size: 0.86em;
}

.ft-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  padding-left: calc(6px + (var(--depth, 0) * 14px));
  border-radius: 4px;
  transition: background 0.1s;
  position: relative;
  min-height: 24px;

  &:hover { background: rgba(var(--ink-rgb), 0.04); }
}

// Reveal flash — a brief coral wash + ring so the eye lands on the element
// a reference chip just navigated to.
.ft-row--flash {
  animation: ft-flash 1.4s ease-out;
}

@keyframes ft-flash {
  0%   { background: rgba(var(--coral-rgb), 0.28); box-shadow: 0 0 0 2px rgba(var(--coral-rgb), 0.45); }
  60%  { background: rgba(var(--coral-rgb), 0.14); box-shadow: 0 0 0 2px rgba(var(--coral-rgb), 0.18); }
  100% { background: transparent; box-shadow: 0 0 0 2px rgba(var(--coral-rgb), 0); }
}

.ft-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: rgba(var(--ink-rgb), 0.55);
  width: 14px;

  &:hover { color: var(--ink); }
}
.ft-toggle-spacer { width: 14px; display: inline-block; }

.ft-folder-icon  { color: #b08020; }
.ft-folder-label { font-weight: 600; color: var(--ink); }
.ft-folder-count {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.5);
  font-family: 'Space Mono', monospace;
}

.ft-owner-icon { color: #4a6da7; }

.ft-owner-username {
  font-weight: 600;
  color: var(--ink);
  margin-right: 6px;
}

.ft-owner-hash {
  font-size: 0.82em;
  color: rgba(var(--ink-rgb), 0.55);
  font-weight: 500;
}

.ft-owner-jump { margin-left: 4px; }

.ft-children {
  margin-left: 0;
}

.ft-empty {
  padding: 2px 0 4px calc(20px + (var(--depth, 0) * 14px));
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.4);
  font-style: italic;
}

// Batch loading / error rows, indented to sit with the leaves they follow.
.ft-batch-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0 4px calc(20px + (var(--depth, 0) * 14px));
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.5);
}

.ft-batch-error { color: #b14848; }

// "Load 10 more" row — reads as a quiet tree row, lights coral on hover.
.ft-load-more {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8em;
  font-weight: 500;
  color: var(--coral-deep);
  padding: 3px 6px 3px calc(20px + (var(--depth, 0) * 14px));
  border-radius: 4px;
  text-align: left;
  transition: background 0.10s;

  &:hover { background: rgba(var(--coral-rgb), 0.10); }
}

.ft-load-more__count {
  margin-left: 6px;
  font-size: 0.9em;
  color: rgba(var(--ink-rgb), 0.45);
}

.ft-drops {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
}

.ft-drop-btn {
  color: rgba(var(--ink-rgb), 0.55);
  &:hover { color: var(--ink); }
}

.ft-raw-btn :deep(.q-btn__content) { gap: 2px; }

.ft-inline-panel {
  // Indent under the parent row to match the tree's depth scale.
  padding: 6px 6px 8px calc(20px + (var(--depth, 0) * 14px));
}

.ft-inline-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86em;
  color: rgba(var(--ink-rgb), 0.55);
  padding: 4px 8px;
}

.ft-inline-error { color: #b14848; }
</style>
