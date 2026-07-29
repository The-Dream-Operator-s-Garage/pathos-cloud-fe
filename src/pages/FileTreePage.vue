<template>
  <q-page class="q-pa-md file-tree-page" :style-fn="pageStyleFn">

    <!-- ft-panel — single container in the subject-panel family (see
         PostViewerPage): one outer border + shadow, chrome-toned header
         strip, hairline dividers between zones, white body. -->
    <div class="ft-panel">

      <!-- Identity header — title, owner chip, actions. Sits on the
           chrome surface so it anchors the panel like the post viewer's
           identity zone. -->
      <header class="ft-panel__header">
        <q-icon name="folder_open" size="18px" class="ft-panel__header-icon" />
        <span class="ft-panel__title nasalization">File tree</span>
        <span class="vsep" aria-hidden="true" />
        <div v-if="isRootView" class="ft-owner-chip">
          <q-icon name="public" size="11px" class="q-mr-xs" />
          <span class="mono">files/</span>
        </div>
        <div v-else-if="tree?.ownerHash" class="ft-owner-chip">
          <q-icon name="person" size="11px" class="q-mr-xs" />
          <span class="mono">files/{{ tree.ownerHash.slice(0, 16) }}…</span>
        </div>
        <q-space />
        <router-link
          v-if="!isRootView"
          :to="'/files'"
          class="ft-panel__action"
        >
          <q-icon name="public" size="13px" class="q-mr-xs" />
          browse all
        </router-link>
        <router-link
          v-if="isRootView && myHash"
          :to="'/files/' + myHash"
          class="ft-panel__action"
        >
          <q-icon name="person" size="13px" class="q-mr-xs" />
          my subtree
        </router-link>
        <button class="ft-panel__action" @click="load">
          <q-icon name="refresh" size="13px" class="q-mr-xs" />
          reload
        </button>
      </header>

      <!-- Lineage breadcrumb — walks the entity ancestor chain from self
           back to the pioneer. Each crumb routes to that entity's tree so
           the user can pop UP the invite chain step by step. -->
      <div v-if="lineageChain.length" class="ft-lineage">
        <q-icon name="account_tree" size="14px" class="ft-lineage__icon" />
        <template v-for="(c, i) in lineageChain" :key="c.hash">
          <span v-if="i > 0" class="ft-lineage__sep">↑</span>
          <router-link
            v-if="!c.is_self"
            :to="'/files/' + c.hash"
            class="ft-lineage__crumb"
            :class="{ 'is-pioneer': c.is_pioneer }"
            :title="`entities/${c.hash}`"
          >
            <q-icon
              :name="c.is_pioneer ? 'star' : 'person'"
              size="11px"
              class="q-mr-xs"
            />
            <span>{{ c.username || ('entity #' + c.id) }}</span>
            <span class="ft-lineage__hash mono">/{{ c.hash.slice(0, 8) }}</span>
          </router-link>
          <span v-else class="ft-lineage__crumb is-self">
            <q-icon name="adjust" size="11px" class="q-mr-xs" />
            <span>{{ c.username || 'you' }}</span>
            <span class="ft-lineage__hash mono">/{{ c.hash.slice(0, 8) }}</span>
          </span>
        </template>
      </div>

      <div class="ft-panel__body">
        <div class="ft-section-title">
          <q-icon :name="isRootView ? 'public' : 'person'" size="14px" class="q-mr-xs" />
          <span class="nasalization">{{ isRootView ? 'all files' : 'owner subtree' }}</span>
          <span v-if="!isRootView && tree?.ownerHash" class="ft-section-sub mono">
            files/{{ tree.ownerHash.slice(0, 16) }}…
          </span>
          <span v-else-if="isRootView" class="ft-section-sub">
            shared registries + per-owner subtrees
          </span>
        </div>

        <div v-if="loading" class="ft-loading">
          <q-spinner-dots size="22px" /> loading tree…
        </div>
        <div v-else-if="error" class="ft-error">{{ error }}</div>
        <div v-else-if="tree && !tree.exists" class="ft-empty-root">
          No files directory yet.
        </div>
        <div v-else-if="tree" class="ft-tree-body">
          <FileTreeNode
            v-for="(folder, i) in tree.children"
            :key="folder.kind ? folder.kind + ':' + (folder.ownerHash || folder.name || i) : i"
            :node="folder"
            :depth="0"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, provide, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FileTreeNode from 'src/components/files/FileTreeNode.vue'
import { fileService } from 'src/services/file.service'
import { createTreeNav } from 'src/utils/treeNav'
import { useStateHolder } from 'src/composables/useStateHolder'

export default defineComponent({
  name: 'FileTreePage',
  components: { FileTreeNode },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const tree = ref(null)
    const lineage = ref([])
    const myHash = ref(null)
    const loading = ref(false)
    const error = ref('')

    // Intra-tree navigation: reference chips inside a decoded payload call
    // `reveal(address)` to scroll to + auto-expand the element they point
    // at. The controller is rebuilt on every load so its index tracks the
    // currently-rendered tree.
    const nav = createTreeNav()

    // StateHolder — the tree scrolls inside its own container and folder
    // uids aren't stable across reloads, so what we remember is the last
    // revealed address: coming back re-reveals it (force-opens ancestors,
    // scrolls, flashes) instead of dropping the user at a collapsed root.
    const holder = useStateHolder({ lastReveal: null }, { trackScroll: false })

    // Public reveal used by chips. When the target isn't in the loaded
    // tree (e.g. a cross-owner reference while focused on one owner's
    // subtree), hop to the whole-platform `/files` view and let it resolve
    // there via the `?reveal=` deep-link. On the root view a miss means the
    // element genuinely isn't on disk, so we don't loop.
    const reveal = async (address) => {
      holder.state.lastReveal = address
      const res = await nav.reveal(address)
      if (!res.found && !isRootView.value) {
        router.push({ path: '/files', query: { reveal: address } })
      }
      return res
    }

    provide('treeNav', {
      openIds: nav.openIds,
      revealKey: nav.revealKey,
      revealTick: nav.revealTick,
      registerEl: nav.registerEl,
      registerFolder: nav.registerFolder,
      reveal
    })

    // Root view = `/files` (no owner param). Renders the whole platform
    // directory; the user drills into a specific owner via `/files/:hash`.
    const isRootView = computed(() => !route.params.ownerHash)

    // Render the lineage with the deepest ancestor on the LEFT so the
    // breadcrumb reads "ancestor → … → you" — the chain comes from the
    // API in [self, …, pioneer] order, so reverse for display. We strip
    // the pioneer crumb (the gold star one) because the user reaches the
    // pioneer through the shared `pioneer/` folder; the breadcrumb only
    // needs the chain of inviters between self and pioneer. And if all
    // that's left is the self crumb, hide the bar entirely — showing
    // "you" alone gives no navigation value and leaves dead space above
    // the tree container.
    const lineageChain = computed(() => {
      const chain = [...lineage.value].reverse().filter(c => !c.is_pioneer)
      if (chain.length <= 1) return []
      return chain
    })

    const load = async () => {
      loading.value = true
      error.value = ''
      try {
        const owner = route.params.ownerHash
        const res = owner
          ? await fileService.getTreeOf(owner)
          : await fileService.getTree()
        if (!res.success) throw new Error(res.error?.message || 'load failed')
        tree.value = res.tree
        lineage.value = res.lineage || []
        myHash.value = res.myHash || null
        nav.buildIndex(tree.value)
      } catch (e) {
        error.value = e.message || 'failed to load tree'
      } finally {
        loading.value = false
      }
    }

    // Honor a `?reveal=<address>` deep-link (used both for shareable links
    // and the cross-view fallback) AFTER load() has flipped `loading` off —
    // the tree only renders then, and reveal needs the folder components
    // mounted so their lazy loaders are registered. The tick lets that
    // mount flush happen.
    const loadAndReveal = async () => {
      await load()
      const target = route.query.reveal
      if (target && tree.value) {
        await nextTick()
        reveal(String(target))
      } else if (holder.state.lastReveal && tree.value) {
        // Returning to a remembered exploration: re-carve the way to the
        // last revealed element (nav.reveal directly — no re-recording).
        await nextTick()
        nav.reveal(holder.state.lastReveal)
      }
      await holder.restore()
    }

    onMounted(loadAndReveal)
    watch(() => route.params.ownerHash, loadAndReveal)

    // Pin the page to exactly the viewport minus Quasar's layout offset
    // (the fixed nav footer) so the panel can flex to fill it and the tree
    // scrolls INSIDE its container instead of growing the document.
    const pageStyleFn = (offset) => ({
      height: offset ? `calc(100vh - ${offset}px)` : '100vh'
    })

    return { tree, lineage, lineageChain, myHash, isRootView, loading, error, load, pageStyleFn }
  }
})
</script>

<style lang="scss" scoped>
// The page is height-pinned via q-page's style-fn; the panel fills it as
// a flex column and the tree body is the single scrolling zone.
.file-tree-page {
  max-width: min(1600px, calc(100vw - 48px));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── ft-panel — member of the subject-panel family (PostViewerPage,
//    NodeDetailPage): same chrome/body/rule tokens so the file tree
//    reads as a sibling surface. Zones separated by hairline dividers.
.ft-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;

  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;

  // Fill the height-pinned page; header + lineage keep their natural
  // height, the body takes the rest.
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.ft-panel__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--panel-chrome);
}

.ft-panel__header-icon { color: var(--ink); flex-shrink: 0; }

.ft-panel__title {
  font-size: 1.05em;
  color: var(--panel-ink-1);
  white-space: nowrap;
}

.vsep {
  flex: 0 0 1px;
  width: 1px;
  align-self: stretch;
  margin: -8px 0;
  background: var(--panel-rule);
}

// Header actions — bare coral-accent buttons in the style of the post
// viewer's panel buttons (related-add-btn): transparent at rest, soft
// coral tint on hover.
.ft-panel__action {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--coral-deep);
  font-family: inherit;
  font-size: 0.82em;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.10s;
  &:hover { background: rgba(var(--coral-rgb), 0.10); }
}

.ft-owner-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 4px;
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.7);
  font-family: 'Space Mono', monospace;
}

.ft-panel__body {
  padding: 12px 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ft-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(var(--ink-rgb), 0.55);
}

.ft-error      { color: #b14848; }
.ft-empty-root {
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
  text-align: center;
  padding: 24px 0;
}

// The single scrolling zone: expanded folders, previews, and decoded
// panels all scroll inside here instead of growing the page.
.ft-tree-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ft-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.6);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.10);
}

.ft-section-sub {
  font-size: 0.84em;
  text-transform: none;
  letter-spacing: 0;
  color: rgba(var(--ink-rgb), 0.45);
  margin-left: 6px;
}

// ── Lineage breadcrumb — chrome-toned strip inside the panel listing
//    every ancestor entity from the pioneer down to the currently-viewed
//    tree. Each crumb is a link to that entity's tree. The self crumb is
//    rendered inert (you're already there).
.ft-lineage {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--panel-chrome);
  flex-wrap: wrap;
  font-size: 0.84em;
}

.ft-lineage__icon { color: rgba(var(--ink-rgb), 0.55); }

.ft-lineage__sep {
  color: rgba(var(--ink-rgb), 0.35);
  font-family: 'Space Mono', monospace;
  user-select: none;
}

.ft-lineage__crumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  color: var(--ink);
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s, color 0.12s;

  &:hover {
    background: rgba(var(--coral-rgb), 0.08);
    border-color: rgba(var(--coral-rgb), 0.35);
    color: var(--coral-deep);
  }

  &.is-pioneer {
    background: rgba(199, 154, 0, 0.10);
    border-color: rgba(199, 154, 0, 0.45);
    color: #8a6800;
    &:hover {
      background: rgba(199, 154, 0, 0.18);
      border-color: rgba(199, 154, 0, 0.65);
      color: #5e4600;
    }
  }

  &.is-self {
    cursor: default;
    background: rgba(var(--ink-rgb), 0.10);
    border-color: rgba(var(--ink-rgb), 0.28);
    color: var(--ink);
    font-weight: 600;
  }
}

.ft-lineage__hash {
  font-size: 0.78em;
  opacity: 0.65;
}
</style>
