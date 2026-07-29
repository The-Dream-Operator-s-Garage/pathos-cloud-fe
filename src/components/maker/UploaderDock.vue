<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="uploader-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('uploader') === 'right' }"
      :style="{ zIndex: windows.zOf('uploader'), '--dock-right': windows.dockRight + 'px' }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ── -->
      <header class="dock-bar">
        <q-icon name="upload" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Uploader</span>
        <span class="dock-bar__meta mono">
          {{ store.uploadCount }} in course{{ store.busyCount ? ` · ${store.busyCount} uploading` : '' }}
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (uploads in course are kept)" @click="store.close()">
            <q-icon name="close" />
          </button>
        </div>
      </header>

      <!-- ── Upload tabs — one per upload in course ── -->
      <div class="dock-tabs">
        <button
          v-for="u in store.uploads"
          :key="u.id"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': u.id === store.activeId }"
          @click="store.setActive(u.id)"
        >
          <q-spinner v-if="u.status === 'busy'" size="12px" color="primary" class="dock-tab__icon" />
          <q-icon v-else :name="modeIcon(u.mode)" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ tabLabel(u) }}</span>
          <span class="dock-tab__x" title="Discard upload" @click.stop="askDiscard(u)">
            <q-icon name="close" size="11px" />
          </span>
        </button>
        <button type="button" class="dock-tab dock-tab--new" title="New upload"
          @click="store.addUpload()">
          <q-icon name="add" size="14px" />
        </button>
      </div>

      <!-- ── Body: upload editor left, file explorer right ── -->
      <div v-if="upload" class="dock-body">
        <section :key="upload.id" class="dock-editor">
          <MakerHeader
            target-kind="node"
            :type-id="upload.mode === 'link' ? 3 : 2"
            :canonic-labels="canonicLabels"
            :initial-author-id="upload.authorEntityId"
            :initial-labels="upload.labels"
            @update:author-entity-id="patch({ authorEntityId: $event })"
            @update:label-ids="patch({ labelIds: $event })"
            @update:user-labels="patch({ labels: $event })"
          />

          <!-- Mode pills — files / link / write -->
          <div class="mode-pills">
            <button
              v-for="m in modes" :key="m.key"
              type="button" class="mode-pill"
              :class="{ 'is-active': upload.mode === m.key }"
              @click="patch({ mode: m.key })"
            >
              <q-icon :name="m.icon" size="13px" />
              <span>{{ m.label }}</span>
            </button>
          </div>

          <!-- FILES: drag-drop + browse, multi-file staging -->
          <div v-if="upload.mode === 'files'" class="mode-pane">
            <div
              class="drop-zone"
              :class="{ 'is-over': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
              @click="$refs.fileInput.click()"
            >
              <q-icon name="cloud_upload" size="30px" class="drop-zone__icon" />
              <div class="drop-zone__hint">Drag files here, or click to browse</div>
              <input ref="fileInput" type="file" multiple style="display:none" @change="onBrowse" />
            </div>

            <div v-if="upload.staged.length" class="staged-list">
              <div v-for="(f, i) in upload.staged" :key="`${f.name}-${i}`" class="staged-row">
                <q-icon :name="iconFor(f)" size="16px" class="staged-row__icon" />
                <span class="staged-name">{{ f.name }}</span>
                <span class="mono staged-ext">.{{ extOf(f.name) }}</span>
                <span class="staged-size">{{ prettySize(f.size) }}</span>
                <q-btn flat round dense size="sm" icon="close" @click="unstage(i)" />
              </div>
            </div>
          </div>

          <!-- LINK: paste a web address -->
          <div v-else-if="upload.mode === 'link'" class="mode-pane">
            <q-input
              :model-value="upload.linkUrl" :dark="false" outlined dense
              label="Web link" placeholder="https://example.com/page"
              :error="!!linkHint" :error-message="linkHint"
              @update:model-value="linkHint = ''; patch({ linkUrl: $event })"
              @keyup.enter="submit"
            >
              <template #prepend><q-icon name="link" /></template>
            </q-input>

            <!-- Embed preview: the link is resolved against the platform's
                 EMBED_RULE skeletons as it is typed, so a raw YouTube URL
                 shows the player it will render as BEFORE the node exists.
                 Nothing is saved by looking — the node still holds the URL
                 exactly as pasted; the frame is derived from it. -->
            <div v-if="linkEmbed" class="mode-pane__embed">
              <EmbedFrame :embed="linkEmbed" />
            </div>

            <div class="mode-pane__hint">
              <template v-if="linkEmbed">
                Recognized as a <strong>{{ linkEmbed.provider }}</strong> link —
                it renders as this player wherever the node is shown.
              </template>
              <template v-else>
                The link's domain joins the DOMAIN label family automatically
                (new domains are minted on first sighting).
              </template>
            </div>
          </div>

          <!-- WRITE: markdown by hand → .md file node -->
          <div v-else class="mode-pane mode-pane--fill">
            <NoteEditor
              class="mode-pane__note"
              :model-value="upload.noteText"
              :show-save="false"
              initial-mode="split"
              height="100%"
              @update:model-value="patch({ noteText: $event })"
            />
          </div>

          <footer class="dock-editor__foot">
            <span class="dock-editor__hint">{{ footHint }}</span>
            <q-space />
            <span v-for="(e, i) in upload.errors" :key="i" class="dock-editor__msg text-negative">
              {{ e.filename ? `${e.filename}: ` : '' }}{{ e.message }}
            </span>
            <span v-if="upload.status === 'done'" class="dock-editor__msg text-positive">
              Uploaded!
            </span>
            <q-btn
              unelevated dense no-caps size="sm" color="primary" :icon="submitIcon"
              :label="submitLabel" :loading="upload.status === 'busy'"
              :disable="!canSubmit" @click="submit"
            />
          </footer>
        </section>

        <!-- The explorer lives OUTSIDE the tabs — one gallery shared by all
             uploads in course, refreshed whenever one of them lands. -->
        <aside class="dock-files">
          <FileExplorer :refresh-key="refreshKey" @open="store.minimize()" />
        </aside>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import MakerHeader from './MakerHeader.vue'
import FileExplorer from './FileExplorer.vue'
import NoteEditor from 'src/components/nodes/NoteEditor.vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import { useUploaderStore, uploadLabel } from 'src/stores/uploader'
import { useWindowsStore } from 'src/stores/windows'
import { nodeService } from 'src/services/node.service'
import { labelService } from 'src/services/label.service'
import { embedService } from 'src/services/embed.service'
import { formatBytes } from 'src/utils/nodeContent'

const KIND_BY_EXT = {
  md: 'text',
  txt: 'text',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio'
}
const KIND_ICON = { text: 'notes', image: 'image', video: 'movie', audio: 'music_note', binary: 'attach_file' }

const MODES = [
  { key: 'files', label: 'Files', icon: 'folder_open' },
  { key: 'link', label: 'Link', icon: 'link' },
  { key: 'write', label: 'Write', icon: 'edit_note' }
]

export default defineComponent({
  name: 'UploaderDock',
  components: { MakerHeader, FileExplorer, NoteEditor, EmbedFrame },
  emits: ['created'],

  setup (props, { emit }) {
    const $q = useQuasar()
    const store = useUploaderStore()
    const windows = useWindowsStore()
    store.load()

    const dragOver = ref(false)
    const linkHint = ref('')
    const refreshKey = ref(0)

    const upload = computed(() => store.activeUpload)

    const patch = (p) => {
      if (upload.value) store.patchUpload(upload.value.id, p)
    }

    const modeIcon = (m) => MODES.find(x => x.key === m)?.icon || 'upload'

    // ── embed preview ────────────────────────────────────────
    // The typed URL, resolved against the platform's EMBED_RULE skeletons
    // (POST /embeds/resolve). Debounced because it follows keystrokes, and
    // sequence-guarded because a slow answer for an older URL must not
    // land on a newer one. Failures are silent: no preview is the same
    // outcome as "no rule matched".
    const linkEmbed = ref(null)
    let embedSeq = 0
    let embedTimer = null

    const resolveEmbed = (raw) => {
      const url = (raw || '').trim()
      const seq = ++embedSeq
      if (embedTimer) clearTimeout(embedTimer)
      if (!/^https?:\/\/\S+\.\S+/.test(url)) { linkEmbed.value = null; return }
      embedTimer = setTimeout(async () => {
        try {
          const r = await embedService.resolve(url)
          if (seq === embedSeq) linkEmbed.value = r.success ? (r.embed || null) : null
        } catch (_) {
          if (seq === embedSeq) linkEmbed.value = null
        }
      }, 350)
    }

    watch(
      () => (upload.value?.mode === 'link' ? upload.value?.linkUrl : null),
      (url) => resolveEmbed(url),
      { immediate: true }
    )

    // Tab label: first staged file, the link's host, or the note's first line.
    const tabLabel = uploadLabel

    const hasWork = (u) =>
      u.staged.length || (u.linkUrl || '').trim() || (u.noteText || '').trim()

    const askDiscard = (u) => {
      if (u.status === 'busy') return
      if (!hasWork(u)) { store.removeUpload(u.id); return }
      $q.dialog({
        title: 'Discard upload?',
        message: `“${tabLabel(u)}” hasn't been uploaded — closing its tab throws it away.`,
        cancel: { flat: true, label: 'Keep' },
        ok: { color: 'negative', flat: true, label: 'Discard' }
      }).onOk(() => store.removeUpload(u.id))
    }

    // Canonic chip follows the mode: files/write mint FILE nodes, link a LINK.
    const allLeaves = ref([])
    const canonicLabels = computed(() => {
      const typeName = upload.value?.mode === 'link' ? 'LINK' : 'FILE'
      const leaf = allLeaves.value.find(l => l.name === typeName && l.parent_name === 'NODE')
      return leaf ? [leaf] : []
    })
    onMounted(async () => {
      try {
        const r = await labelService.listLeaves()
        if (r.success) allLeaves.value = r.leaves
      } catch (_) { /* leaves empty */ }
    })

    // ── files staging ───────────────────────────────────────
    const extOf = (name) => {
      const e = String(name || '').toLowerCase().split('.').pop()
      return /^[a-z0-9]{1,10}$/.test(e) ? e : 'bin'
    }
    const iconFor = (f) => KIND_ICON[KIND_BY_EXT[extOf(f.name)] || 'binary']
    const prettySize = formatBytes

    const addFiles = (list) => {
      if (!upload.value) return
      patch({ staged: [...upload.value.staged, ...Array.from(list || [])] })
    }
    const onDrop = (e) => {
      dragOver.value = false
      addFiles(e.dataTransfer?.files)
    }
    const onBrowse = (e) => {
      addFiles(e.target.files)
      e.target.value = ''
    }
    const unstage = (i) => {
      const next = [...upload.value.staged]
      next.splice(i, 1)
      patch({ staged: next })
    }

    // ── submit — per-tab, so other tabs stay editable while one is
    // in flight; state lands in the store keyed by the upload's id. ──
    const footHint = computed(() => {
      switch (upload.value?.mode) {
        case 'link': return 'Saved as a LINK node addressed by its URL.'
        case 'write': return 'Saved as a markdown file — same storage and indexing as any uploaded file.'
        default: return 'Each file becomes its own FILE node; author and labels apply to the whole batch.'
      }
    })

    const submitLabel = computed(() => {
      const u = upload.value
      if (!u) return 'Upload'
      if (u.mode === 'link') return 'Save link'
      if (u.mode === 'write') return 'Save note'
      return u.staged.length > 1 ? `Upload ${u.staged.length} files` : 'Upload'
    })

    const submitIcon = computed(() => {
      const m = upload.value?.mode
      return m === 'link' ? 'add_link' : m === 'write' ? 'note_add' : 'upload'
    })

    const canSubmit = computed(() => {
      const u = upload.value
      if (!u || u.status === 'busy') return false
      if (u.mode === 'link') return !!(u.linkUrl || '').trim()
      if (u.mode === 'write') return !!(u.noteText || '').trim()
      return u.staged.length > 0
    })

    // Note filename: the first heading/line, slugged — it becomes the
    // node's display name in the explorer (line 2 of the node content).
    const noteFilename = (text) => {
      const line = (text || '').split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean) || ''
      const slug = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
      return (slug || 'note') + '.md'
    }

    const finish = (id, nodes) => {
      store.patchUpload(id, { status: 'done' })
      refreshKey.value++
      setTimeout(() => {
        store.removeUpload(id)
        if (store.uploadCount) store.minimize()
        emit('created', nodes)
      }, 700)
    }

    const submit = async () => {
      const u = upload.value
      if (!u || !canSubmit.value) return
      const id = u.id
      linkHint.value = ''
      store.patchUpload(id, { status: 'busy', errors: [] })
      try {
        if (u.mode === 'link') {
          const r = await nodeService.create({
            content: u.linkUrl.trim(),
            typeId: 3,
            labelIds: u.labelIds,
            authorEntityId: u.authorEntityId
          })
          if (r.success) {
            finish(id, [r.node])
          } else {
            linkHint.value = r.error?.message || 'Invalid link'
            store.patchUpload(id, { status: 'idle' })
          }
          return
        }

        const files = u.mode === 'write'
          ? [new File([new Blob([u.noteText], { type: 'text/markdown' })], noteFilename(u.noteText), { type: 'text/markdown' })]
          : u.staged
        const fd = new FormData()
        for (const f of files) fd.append('files', f, f.name)
        if (u.authorEntityId) fd.append('authorEntityId', u.authorEntityId)
        fd.append('labelIds', JSON.stringify(u.labelIds))
        const r = await nodeService.upload(fd)
        const errors = r.errors || []
        if (r.success && r.nodes?.length) {
          if (errors.length) {
            // Partial batch: keep the tab alive with the failures visible.
            store.patchUpload(id, { status: 'idle', errors, staged: [] })
            refreshKey.value++
            emit('created', r.nodes)
          } else {
            finish(id, r.nodes)
          }
        } else {
          store.patchUpload(id, {
            status: 'idle',
            errors: errors.length ? errors : [{ message: r.error?.message || 'Upload failed' }]
          })
        }
      } catch (e) {
        const msg = e?.response?.data?.error?.message || e?.message || 'Something went wrong'
        if (u.mode === 'link') linkHint.value = msg
        store.patchUpload(id, { status: 'idle', errors: u.mode === 'link' ? [] : [{ message: msg }] })
      }
    }

    return {
      store,
      windows,
      upload,
      patch,
      modes: MODES,
      modeIcon,
      tabLabel,
      askDiscard,
      canonicLabels,
      dragOver,
      onDrop,
      onBrowse,
      unstage,
      extOf,
      iconFor,
      prettySize,
      linkHint,
      linkEmbed,
      footHint,
      submitLabel,
      submitIcon,
      canSubmit,
      submit,
      refreshKey
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and tab strip come from the shared
// .dock-window chrome in src/css/_components.scss; the footprint and the
// brown plaque come from .dock-window--creation there (so does maximize
// and the narrow-screen fallback). Only the uploader's body layout lives
// here.

// ── Body: editor left, explorer right (the explorer column is wider
// than the maker's reference rail — it's a browsing surface). ──
.dock-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 460px);
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

.dock-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

// ── Mode pills — same grammar as the ref browser's kind pills ──
.mode-pills {
  display: flex;
  gap: 4px;
}

.mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s;

  &:hover { border-color: rgba(var(--ink-rgb), 0.4); color: var(--ink); }

  &.is-active {
    color: #fff;
    background: #00829c;
    border-color: #00829c;
    box-shadow: var(--shadow-carved-pressed);
  }
}

// ── Mode panes ──
.mode-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
  overflow-y: auto;

  &--fill { overflow: hidden; }

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.mode-pane__hint {
  font-size: 0.72em;
  color: var(--ink-mute);
  line-height: 1.35;
}

// The preview is a READING of the typed link, so it stays modest — half
// the pane's width, left-aligned under the input, never the pane's subject.
.mode-pane__embed {
  margin-top: 10px;
  max-width: 320px;
}

.mode-pane__note {
  flex: 1;
  min-height: 0;
}

.drop-zone {
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  border-radius: var(--radius-md);
  padding: 26px 12px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.4);
  transition: border-color 0.15s, background 0.15s;
  flex-shrink: 0;

  &.is-over,
  &:hover {
    border-color: #00829c;
    background: rgba(0, 130, 156, 0.06);
  }
}

.drop-zone__icon { color: rgba(var(--ink-rgb), 0.4); }

.drop-zone__hint {
  margin-top: 4px;
  font-size: 0.78em;
  color: var(--ink-mute);
}

.staged-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.staged-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  font-size: 0.8em;
}

.staged-row__icon { color: #00829c; }

.staged-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
}

.staged-ext  { font-size: 0.8em; color: var(--ink-soft); }
.staged-size { font-size: 0.8em; color: var(--ink-mute); }

.dock-editor__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dock-editor__hint {
  font-size: 0.72em;
  color: var(--ink-mute);
  line-height: 1.35;
  max-width: 52ch;
}

.dock-editor__msg { font-size: 0.78em; }

// The explorer lives in a white card, sibling of the maker's ref rail.
.dock-files {
  min-height: 0;
  background: var(--paper-card);
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .dock-body { grid-template-columns: 1fr; overflow-y: auto; }
  .dock-files { min-height: 320px; }
}
</style>
