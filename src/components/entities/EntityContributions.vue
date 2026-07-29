<template>
  <div class="contrib">

    <!-- ══ 1 · Skeleton instantiations ══ -->
    <section class="contrib__panel">
      <header class="contrib__head">
        <q-icon name="schema" size="14px" class="q-mr-xs" />
        <span>Instantiations</span>
        <span v-if="instTotal !== null" class="contrib__count mono">{{ instTotal }}</span>
        <q-space />
        <label class="contrib__toggle">
          <q-toggle v-model="showPlumbing" dense size="xs" color="primary" />
          <span>plumbing</span>
        </label>
      </header>
      <div class="contrib__body">
        <div v-if="instLoading && !instances.length" class="contrib__state">
          <q-spinner size="18px" color="primary" />
        </div>
        <div v-else-if="!instances.length" class="contrib__state">
          No skeleton instances yet.
        </div>
        <template v-else>
          <router-link
            v-for="s in instances"
            :key="s.id"
            class="inst-row"
            :to="`/skeletons/${s.id}`"
          >
            <q-icon name="schema" size="13px" class="inst-row__icon" />
            <span class="inst-row__name mono">{{ s.name }}</span>
            <span class="inst-row__schema">
              of <router-link :to="`/skeletons/${s.schema.id}`" @click.stop>{{ s.schema.name }}</router-link>
            </span>
            <span class="inst-row__time mono">{{ shortTime(s) }}</span>
          </router-link>
          <button v-if="instHasMore" type="button" class="contrib__more" :disabled="instLoading"
            @click="loadInstances(instPage + 1)">
            <q-spinner v-if="instLoading" size="12px" /> load more
          </button>
        </template>
      </div>
    </section>

    <!-- ══ 2 · Posts ══ -->
    <section class="contrib__panel">
      <header class="contrib__head">
        <q-icon name="edit_note" size="14px" class="q-mr-xs" />
        <span>Posts</span>
        <span v-if="postTotal !== null" class="contrib__count mono">{{ postTotal }}</span>
      </header>
      <div class="contrib__body">
        <div v-if="postsLoading && !posts.length" class="contrib__state">
          <q-spinner size="18px" color="primary" />
        </div>
        <div v-else-if="!posts.length" class="contrib__state">
          No posts yet.
        </div>
        <template v-else>
          <router-link
            v-for="p in posts"
            :key="p.skeleton_id"
            class="post-row"
            :to="`/posts/${p.skeleton_id}`"
          >
            <q-icon :name="p.is_doc ? 'menu_book' : (p.parent_skeleton_id ? 'forum' : 'article')"
              size="13px" class="post-row__icon" />
            <span class="post-row__lines">
              <span class="post-row__title">{{ p.title || ('post #' + p.skeleton_id) }}</span>
              <span v-if="p.excerpt" class="post-row__excerpt">{{ p.excerpt }}</span>
            </span>
            <span class="post-row__time mono">{{ shortTime(p) }}</span>
          </router-link>
          <button v-if="postsHasMore" type="button" class="contrib__more" :disabled="postsLoading"
            @click="loadPosts(postPage + 1)">
            <q-spinner v-if="postsLoading" size="12px" /> load more
          </button>
        </template>
      </div>
    </section>

    <!-- ══ 3 · Content mini-gallery (uploads) ══ -->
    <section class="contrib__panel">
      <header class="contrib__head">
        <q-icon name="perm_media" size="14px" class="q-mr-xs" />
        <span>Content</span>
        <span v-if="uploadTotal !== null" class="contrib__count mono">{{ uploadTotal }}</span>
      </header>
      <div class="contrib__body">
        <div v-if="uploadsLoading && !uploads.length" class="contrib__state">
          <q-spinner size="18px" color="primary" />
        </div>
        <div v-else-if="!uploads.length" class="contrib__state">
          No uploaded content yet.
        </div>
        <template v-else>
          <div class="gallery">
            <router-link
              v-for="n in uploads"
              :key="n.id"
              class="gallery__cell"
              :to="`/nodes/${n.id}`"
              :title="n.name || n.file?.ext"
            >
              <img v-if="n.file?.kind === 'image'" :src="n.file.url" loading="lazy" alt="" />
              <span v-else class="gallery__file">
                <q-icon :name="galleryIcon(n.file?.kind)" size="20px" />
                <span class="gallery__ext mono">.{{ n.file?.ext || '?' }}</span>
              </span>
              <span v-if="n.name" class="gallery__name">{{ n.name }}</span>
            </router-link>
          </div>
          <button v-if="uploadsHasMore" type="button" class="contrib__more" :disabled="uploadsLoading"
            @click="loadUploads(uploadPage + 1)">
            <q-spinner v-if="uploadsLoading" size="12px" /> load more
          </button>
        </template>
      </div>
    </section>

  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import { entityService } from 'src/services/entity.service'
import { feedService } from 'src/services/feed.service'
import { nodeService } from 'src/services/node.service'

// The entity viewer's contribution band — three sections along the bottom:
// every skeleton instantiation the entity owns, the posts it has published,
// and a mini-gallery of the content (uploads) it has added.
export default defineComponent({
  name: 'EntityContributions',
  props: {
    entityId: { type: Number, required: true }
  },

  setup (props) {
    // ── instantiations ──
    const instances = ref([])
    const instTotal = ref(null)
    const instPage = ref(1)
    const instHasMore = ref(false)
    const instLoading = ref(false)
    // "all of them" is the point of the section — plumbing (per-kind
    // element headers, PATH_VIEW/PIN/NAVIGATION instances) shows by
    // default, one toggle to focus.
    const showPlumbing = ref(true)

    const loadInstances = async (page = 1) => {
      instLoading.value = true
      try {
        const r = await entityService.listSkeletons(props.entityId, {
          page, limit: 12, ...(showPlumbing.value ? {} : { plumbing: '0' })
        })
        if (r.success) {
          instances.value = page === 1 ? r.instances : [...instances.value, ...r.instances]
          instTotal.value = r.total
          instPage.value = r.page
          instHasMore.value = r.hasMore
        }
      } catch (_) { /* section stays empty */ }
      instLoading.value = false
    }
    watch(showPlumbing, () => loadInstances(1))

    // ── posts ──
    const posts = ref([])
    const postTotal = ref(null)
    const postPage = ref(1)
    const postsHasMore = ref(false)
    const postsLoading = ref(false)

    const loadPosts = async (page = 1) => {
      postsLoading.value = true
      try {
        const r = await feedService.getPublic({ ownerId: props.entityId, page, limit: 8 })
        if (r.success) {
          posts.value = page === 1 ? r.items : [...posts.value, ...r.items]
          postTotal.value = r.total
          postPage.value = r.page
          postsHasMore.value = page * 8 < r.total
        }
      } catch (_) { /* section stays empty */ }
      postsLoading.value = false
    }

    // ── uploads gallery ──
    const uploads = ref([])
    const uploadTotal = ref(null)
    const uploadPage = ref(1)
    const uploadsHasMore = ref(false)
    const uploadsLoading = ref(false)

    const loadUploads = async (page = 1) => {
      uploadsLoading.value = true
      try {
        const r = await nodeService.listUploads({ ownerId: props.entityId, page, limit: 18 })
        if (r.success) {
          uploads.value = page === 1 ? r.nodes : [...uploads.value, ...r.nodes]
          uploadTotal.value = r.total
          uploadPage.value = r.page
          uploadsHasMore.value = r.hasMore
        }
      } catch (_) { /* section stays empty */ }
      uploadsLoading.value = false
    }

    const loadAll = () => {
      loadInstances(1)
      loadPosts(1)
      loadUploads(1)
    }
    onMounted(loadAll)
    watch(() => props.entityId, loadAll)

    const shortTime = (row) => {
      const t = row.moment?.time_utc || row.moment?.time || row.created_at
      if (!t) return ''
      const d = new Date(t)
      return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    const galleryIcon = (kind) => ({
      video: 'videocam',
      audio: 'graphic_eq',
      text: 'description',
      download: 'insert_drive_file'
    }[kind] || 'insert_drive_file')

    return {
      instances,
      instTotal,
      instPage,
      instHasMore,
      instLoading,
      showPlumbing,
      loadInstances,
      posts,
      postTotal,
      postPage,
      postsHasMore,
      postsLoading,
      loadPosts,
      uploads,
      uploadTotal,
      uploadPage,
      uploadsHasMore,
      uploadsLoading,
      loadUploads,
      shortTime,
      galleryIcon
    }
  }
})
</script>

<style lang="scss" scoped>
.contrib {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.contrib__panel {
  background: var(--panel-body, #ffffff);
  border: 1px solid var(--panel-rule, #e2e6ed);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.contrib__head {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: #f4f7fb;
  border-bottom: 1px solid #e2e6ed;
  font-size: 0.78em;
  font-weight: 500;
  color: #1F2A38;
}

.contrib__count {
  margin-left: 8px;
  font-size: 0.82em;
  color: #5b6c82;
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: var(--radius-pill);
  padding: 0 7px;
}

.contrib__toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72em;
  color: #8995a8;
  cursor: pointer;
}

.contrib__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  max-height: 340px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 3px; }
}

.contrib__state {
  padding: 18px 8px;
  text-align: center;
  font-size: 0.78em;
  color: #8995a8;
}

.contrib__more {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  border-radius: var(--radius-pill);
  background: none;
  padding: 2px 12px;
  font-size: 0.7em;
  color: #5b6c82;
  cursor: pointer;

  &:hover:not(:disabled) { border-color: rgba(0, 130, 156, 0.5); color: #00829c; }
  &:disabled { opacity: 0.5; }
}

// ── instantiations rows ──
.inst-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border: 1px solid #eef1f6;
  border-radius: 7px;
  text-decoration: none;
  min-width: 0;

  &:hover { border-color: rgba(0, 130, 156, 0.45); background: #f9fbfd; }
}

.inst-row__icon { color: #5b6c82; flex-shrink: 0; }

.inst-row__name {
  font-size: 0.74em;
  font-weight: 700;
  color: #1F2A38;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inst-row__schema {
  font-size: 0.7em;
  color: #8995a8;
  white-space: nowrap;

  a { color: #00829c; text-decoration: none; &:hover { text-decoration: underline; } }
}

.inst-row__time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.66em;
  color: #8995a8;
}

// ── post rows ──
.post-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 6px 8px;
  border: 1px solid #eef1f6;
  border-radius: 7px;
  text-decoration: none;
  min-width: 0;

  &:hover { border-color: rgba(154, 99, 184, 0.45); background: #fbf9fd; }
}

.post-row__icon { color: #9a63b8; flex-shrink: 0; margin-top: 2px; }

.post-row__lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.post-row__title {
  font-size: 0.78em;
  font-weight: 600;
  color: #1F2A38;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-row__excerpt {
  font-size: 0.68em;
  color: #8995a8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-row__time {
  flex-shrink: 0;
  font-size: 0.66em;
  color: #8995a8;
  margin-top: 2px;
}

// ── gallery ──
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
}

.gallery__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px solid #e2e6ed;
  border-radius: 7px;
  overflow: hidden;
  background: #f4f7fb;
  text-decoration: none;

  &:hover { border-color: rgba(0, 130, 156, 0.55); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.gallery__file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #5b6c82;
}

.gallery__ext { font-size: 0.6em; }

.gallery__name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1px 4px;
  background: rgba(31, 42, 56, 0.72);
  color: #fff;
  font-size: 0.56em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1023px) {
  .contrib { grid-template-columns: 1fr; }
}
</style>
