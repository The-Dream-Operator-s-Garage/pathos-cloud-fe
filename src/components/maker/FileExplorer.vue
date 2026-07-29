<template>
  <div class="file-explorer">

    <!-- ── Header: label + list/gallery toggle ─────────────── -->
    <div class="file-explorer__head">
      <span class="file-explorer__section-label">
        File explorer
        <span v-if="total" class="file-explorer__count mono">{{ total }}</span>
      </span>
      <q-space />
      <div class="view-toggle">
        <button
          type="button" class="view-toggle__btn"
          :class="{ 'is-active': mode === 'list' }"
          title="List view" @click="mode = 'list'"
        >
          <q-icon name="view_list" size="14px" />
        </button>
        <button
          type="button" class="view-toggle__btn"
          :class="{ 'is-active': mode === 'gallery' }"
          title="Gallery view" @click="mode = 'gallery'"
        >
          <q-icon name="grid_view" size="14px" />
        </button>
      </div>
    </div>

    <!-- ── Search by name ──────────────────────────────────── -->
    <q-input
      v-model="query" :dark="false" outlined dense
      class="file-explorer__search"
      placeholder="Search files by name…"
      clearable
      @update:model-value="onQueryInput"
    >
      <template #prepend><q-icon name="search" size="16px" /></template>
    </q-input>

    <!-- ── Results ─────────────────────────────────────────── -->
    <div class="file-explorer__scroll">
      <div v-if="!items.length && loading" class="file-explorer__state">
        <q-spinner size="18px" color="primary" />
      </div>
      <div v-else-if="!items.length" class="file-explorer__state">
        {{ query ? 'No files match that name.' : 'Uploaded files appear here.' }}
      </div>

      <!-- List mode: title · preview · date-time · labels -->
      <div v-else-if="mode === 'list'" class="file-list">
        <button
          v-for="f in items" :key="f.id"
          type="button" class="file-row"
          :title="titleOf(f)"
          @click="openNode(f)"
        >
          <span class="file-row__thumb">
            <img v-if="f.file && f.file.kind === 'image'" :src="f.file.url" loading="lazy" alt="" />
            <q-icon v-else :name="iconOf(f)" size="20px" :style="{ color: colorOf(f) }" />
          </span>
          <span class="file-row__lines">
            <span class="file-row__title">{{ titleOf(f) }}</span>
            <span v-if="excerptOf(f)" class="file-row__excerpt">{{ excerptOf(f) }}</span>
            <span class="file-row__meta">
              <span class="mono file-row__ext">.{{ f.file ? f.file.ext : '?' }}</span>
              <span class="file-row__when">{{ whenOf(f) }}</span>
              <span v-for="l in f.labels || []" :key="l.id" class="file-row__label">{{ l.name }}</span>
            </span>
          </span>
        </button>
      </div>

      <!-- Gallery mode: rectangular tiles, newest first -->
      <div v-else class="file-grid">
        <button
          v-for="f in items" :key="f.id"
          type="button" class="file-tile"
          :title="titleOf(f)"
          @click="openNode(f)"
        >
          <img v-if="f.file && f.file.kind === 'image'" class="file-tile__img"
            :src="f.file.url" loading="lazy" alt="" />
          <span v-else-if="excerptOf(f)" class="file-tile__text">{{ excerptOf(f) }}</span>
          <span v-else class="file-tile__blank" :style="{ background: tintOf(f) }">
            <q-icon :name="iconOf(f)" size="26px" :style="{ color: colorOf(f) }" />
            <span class="mono file-tile__ext">.{{ f.file ? f.file.ext : '?' }}</span>
          </span>
          <span class="file-tile__strip">
            <span class="file-tile__title">{{ titleOf(f) }}</span>
            <span class="file-tile__when">{{ whenOf(f) }}</span>
          </span>
        </button>
      </div>

      <!-- Paginated batches -->
      <div v-if="items.length && hasMore" class="file-explorer__more">
        <q-btn
          flat dense no-caps size="sm" icon="expand_more"
          :label="`Load more (${items.length} of ${total})`"
          :loading="loading" @click="loadMore"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { nodeService } from 'src/services/node.service'

const BATCH = 24

const KIND_ICON = {
  text: 'notes',
  image: 'image',
  video: 'movie',
  audio: 'music_note',
  binary: 'attach_file'
}
const KIND_COLOR = {
  text: '#00829c',
  image: '#4d8a83',
  video: '#6c4d72',
  audio: '#a2703f',
  binary: '#5b6c82'
}

export default defineComponent({
  name: 'FileExplorer',
  props: {
    // Bump to reload page 1 (e.g. after the dock finishes an upload).
    refreshKey: { type: Number, default: 0 }
  },
  emits: ['open'],

  setup (props, { emit }) {
    const router = useRouter()
    const mode = ref('list')
    const query = ref('')
    const items = ref([])
    const total = ref(0)
    const page = ref(1)
    const hasMore = ref(false)
    const loading = ref(false)
    let debounceTimer = null
    let seq = 0

    const load = async (reset) => {
      const mySeq = ++seq
      loading.value = true
      try {
        const r = await nodeService.listUploads({
          q: query.value || '',
          page: reset ? 1 : page.value + 1,
          limit: BATCH
        })
        if (mySeq !== seq) return
        if (r.success) {
          items.value = reset ? r.nodes : [...items.value, ...r.nodes]
          total.value = r.total
          page.value = r.page
          hasMore.value = r.hasMore
        }
      } catch (_) {
        if (mySeq === seq && reset) { items.value = []; total.value = 0; hasMore.value = false }
      } finally {
        if (mySeq === seq) loading.value = false
      }
    }

    const loadMore = () => load(false)

    const onQueryInput = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => load(true), 300)
    }

    onMounted(() => load(true))
    watch(() => props.refreshKey, () => load(true))

    // Title: original filename (line 2 of the node content, surfaced as
    // `name`), else the text's first line, else kind + extension.
    const titleOf = (f) => {
      if (f.name) return f.name
      const line = (f.file?.text || '')
        .split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean)
      if (line) return line.length > 60 ? line.slice(0, 59) + '…' : line
      return f.file ? `${f.file.kind} · .${f.file.ext}` : `node #${f.id}`
    }

    const excerptOf = (f) => {
      const t = (f.file?.text || '').trim()
      if (!t) return ''
      return t.length > 140 ? t.slice(0, 139) + '…' : t
    }

    const whenOf = (f) => {
      const d = new Date(f.created_at)
      if (isNaN(d)) return ''
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }

    const iconOf = (f) => KIND_ICON[f.file?.kind] || KIND_ICON.binary
    const colorOf = (f) => KIND_COLOR[f.file?.kind] || KIND_COLOR.binary
    const tintOf = (f) => `${colorOf(f)}14`

    const openNode = (f) => {
      emit('open', f)
      router.push('/nodes/' + f.id)
    }

    return {
      mode,
      query,
      items,
      total,
      hasMore,
      loading,
      onQueryInput,
      loadMore,
      titleOf,
      excerptOf,
      whenOf,
      iconOf,
      colorOf,
      tintOf,
      openNode
    }
  }
})
</script>

<style lang="scss" scoped>
// Same visual grammar as RefBrowser: mono uppercase section labels, white
// cards on a carved inset pit, teal accents.
.file-explorer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  height: 100%;
}

.file-explorer__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-explorer__section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.file-explorer__count {
  font-size: 0.9em;
  color: rgba(var(--ink-rgb), 0.5);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
}

// ── List / gallery toggle — carved pill pair ──
.view-toggle {
  display: inline-flex;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
}

.view-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border: none;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.45);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  &:hover { color: var(--ink); }

  &.is-active {
    background: #00829c;
    color: #fff;
    box-shadow: var(--shadow-carved-pressed);
  }
}

.file-explorer__search :deep(.q-field__control) { background: #fff; }

// ── Scrollable results pit ──
.file-explorer__scroll {
  flex: 1;
  min-height: 90px;
  overflow-y: auto;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.file-explorer__state {
  padding: 18px 8px;
  text-align: center;
  font-size: 0.76em;
  color: var(--ink-mute);
}

.file-explorer__more {
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
  color: var(--ink-soft);
}

// ── List mode ──
.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.5); }
}

.file-row__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 6px;
  background: rgba(var(--ink-rgb), 0.06);
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.file-row__lines {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.file-row__title {
  font-size: 0.78em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-row__excerpt {
  font-size: 0.68em;
  color: var(--ink-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.file-row__ext {
  font-size: 0.62em;
  color: var(--ink-soft);
}

.file-row__when {
  font-size: 0.64em;
  color: var(--ink-mute);
}

.file-row__label {
  font-size: 0.6em;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #00829c;
  background: rgba(0, 130, 156, 0.08);
  border: 1px solid rgba(0, 130, 156, 0.25);
  border-radius: var(--radius-pill);
  padding: 0 6px;
  white-space: nowrap;
  max-width: 14ch;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Gallery mode — rectangular tiles in upload order ──
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 6px;
}

.file-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 16 / 11;
  padding: 0;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover {
    border-color: rgba(0, 130, 156, 0.55);
    box-shadow: 0 2px 10px rgba(var(--ink-rgb-deep), 0.16);
  }
}

.file-tile__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-tile__text {
  flex: 1;
  min-height: 0;
  padding: 6px 8px;
  font-size: 0.6em;
  line-height: 1.35;
  color: var(--ink-soft);
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}

.file-tile__blank {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.file-tile__ext {
  font-size: 0.62em;
  color: var(--ink-soft);
}

.file-tile__strip {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 3px 7px 4px;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(var(--ink-rgb), 0.1);
}

.file-tile__title {
  font-size: 0.66em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-tile__when {
  font-size: 0.58em;
  color: var(--ink-mute);
}
</style>
