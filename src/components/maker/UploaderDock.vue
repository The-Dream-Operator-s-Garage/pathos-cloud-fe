<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="uploader-dock dock-window dock-window--creation dock-window--hub"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('uploader') === 'right' }"
      :data-dock-key="'uploader'"
      :style="{ zIndex: windows.zOf('uploader'), '--dock-right': windows.dockRight + 'px', '--trail-shift': windows.trailShiftOf('hub') + 'px', '--dock-seat': 'var(--seat-hub)', ...windows.winDragStyle('uploader') }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ──
           THE NAME IS A PLATE (2026-08-26, user ask: the uploader repaints
           "in the same style as the post section") — the same glyph + name +
           hairline-box object MakerDock wears, the feed card's foot plate
           worn as the window's name. The count stays outside it, as there. -->
      <header class="dock-bar">
        <span class="dock-bar__plate">
          <q-icon name="upload" size="13px" class="dock-bar__icon" />
          <span class="dock-bar__title nasalization">Uploader</span>
        </span>
        <span class="dock-bar__meta mono">
          {{ store.uploadCount }} in course{{ store.busyCount ? ` · ${store.busyCount} uploading` : '' }}
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (uploads in course are kept)" @click="store.close()">
            <q-icon name="close" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
        </div>
      </header>

      <!-- The band between the header and the tabs (2026-09-26, user ask):
           the dashboard window's slim frieze in this window's tones — plate
           = the family's darkest rung via `--dock-frieze` (set below), wave
           = the platform's cream. Recipe: `.dock-window__frieze`,
           `_components.scss`. -->
      <FriezeBar slim class="dock-window__frieze" />

      <!-- ── Upload tabs — one per upload in course. The glyph reads the
           tab's CONTENT (files, then link, then note) now that the three
           methods are simultaneous sections and no tab has a mode. ── -->
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
          <q-icon v-else :name="tabIcon(u)" size="13px" class="dock-tab__icon" />
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
          <!-- `dense`, like PostMakerSurface passes in the dock (2026-08-26,
               user ask: the captions were DUPLICATED — the header's three
               labelled rows already caption every field, and without `dense`
               the pickers drew their own "Authoring as"/"Add label" titles
               on top of them). One caption per field, the header's. -->
          <MakerHeader
            dense
            target-kind="node"
            :canonic-labels="canonicLabels"
            :initial-author-id="upload.authorEntityId"
            :initial-labels="upload.labels"
            @update:author-entity-id="patch({ authorEntityId: $event })"
            @update:label-ids="patch({ labelIds: $event })"
            @update:user-labels="patch({ labels: $event })"
          />

          <!-- ── THE THREE METHODS, SIMULTANEOUS (2026-08-26, user ask:
               "three methods available at the same time on the section,
               each one with its uploading button") — the mode pills died
               with this; every tab shows note / link / files stacked at
               45% / 15% / 40% of the section's height, each section
               closing with its own submit plate. Author + labels above
               apply to whichever button fires. ── -->
          <div class="method-stack">

            <!-- NOTE — 45%. A WRITING BOX FOR COMPLEX NOTES (2026-08-31,
                 user ask: "turn complex notes into posts easily"): still a
                 plain textarea, but files pasted or dragged INTO it upload
                 immediately as FILE nodes and land at the caret as mini
                 ![[pathos:nodes/…]] refs — the post editor's own reference
                 grammar. The head grew a minimalist cut of NoteEditor's
                 machinery (one edit⇄preview pill pair, MarkdownBody pane —
                 no format bar, no split) and a Post plate that hands the
                 note to the maker as a draft-in-progress. Save note still
                 lands the text as a .md FILE node exactly as before. -->
            <section
              class="method method--note"
              @dragover.prevent="noteDragOver = true"
              @dragleave.prevent="noteDragOver = false"
              @drop.prevent="onNoteDrop"
            >
              <div class="method__head">
                <span class="method__label">Note</span>
                <div class="note-mode" role="group" aria-label="Note view">
                  <button
                    type="button" class="note-mode__btn"
                    :class="{ 'is-on': !notePreview }" title="Markdown"
                    @click="notePreview = false"
                  ><q-icon name="edit" size="12px" /></button>
                  <button
                    type="button" class="note-mode__btn"
                    :class="{ 'is-on': notePreview }" title="Preview"
                    @click="notePreview = true"
                  ><q-icon name="visibility" size="12px" /></button>
                </div>
                <span v-if="noteUploading" class="method__hint">
                  uploading {{ noteUploading }} file{{ noteUploading > 1 ? 's' : '' }}…
                </span>
              </div>
              <!-- THE WELL (2026-10-12, user ask: "the post/save buttons of
                   the notepad … inside the containers, at the bottom right
                   corner … with inverted coloring so they look different")
                   — the box and its preview share one positioned frame, and
                   the two plates stand in its bottom-right corner, FILLED
                   in the window's contrast (the files plate stays the
                   outlined one). The box pads its foot so the last line is
                   never under them. -->
              <div class="note-well">
              <textarea
                v-show="!notePreview"
                ref="noteBox"
                class="note-box"
                :class="{ 'is-over': noteDragOver }"
                :value="upload.noteText"
                placeholder="Write a note — it uploads as a markdown file. Paste a link or an image/file and it lands here as a pill."
                @input="patch({ noteText: $event.target.value })"
                @paste="onNotePaste"
              ></textarea>
              <div v-show="notePreview" class="note-preview">
                <MarkdownBody
                  v-if="(upload.noteText || '').trim()"
                  class="md-rendered"
                  :text="upload.noteText"
                />
                <div v-else class="note-preview__empty">Nothing to preview yet…</div>
              </div>
              <div class="method__plates">
                <q-btn
                  unelevated dense no-caps size="sm" icon="post_add"
                  class="method__submit method__submit--inverted" label="Post"
                  title="Turn this note into a post draft and open it in the post window"
                  :disable="!canSubmit('note') || noteUploading > 0"
                  @click="toPost"
                />
                <q-btn
                  unelevated dense no-caps size="sm" icon="note_add"
                  class="method__submit method__submit--inverted" label="Save note"
                  title="Save this note as a markdown file"
                  :loading="isBusy('note')" :disable="!canSubmit('note') || noteUploading > 0"
                  @click="submit('note')"
                />
              </div>
              </div>
              <!-- THE LINK CATCH (2026-10-12, user ask: "if I paste a link,
                   identify it, put it in a neon teal frame and make me
                   confirm adding the link") — the link section folded into
                   the note. A pasted URL (or a provider's embed snippet,
                   unwrapped to its src) lands in the text as typed AND is
                   caught here; Add link mints the LINK node and rewrites
                   that text, in place, into the node's NANO PILL
                   `-[[pathos:nodes/<hash>|provider]]`. Dismissing keeps the
                   URL as plain text; deleting it from the note drops the
                   catch. -->
              <div v-if="linkCatches.length" class="link-catches">
                <div
                  v-for="c in linkCatches" :key="c.key"
                  class="link-catch" :class="{ 'is-busy': c.busy, 'is-error': !!c.error }"
                >
                  <q-icon :name="c.embed?.icon || 'link'" size="15px" class="link-catch__icon" />
                  <span class="link-catch__text">
                    <span class="link-catch__url" :title="c.url">{{ c.url }}</span>
                    <span class="link-catch__meta">{{ c.error || (c.embed ? `${c.embed.provider} — add it as a link pill?` : 'add it as a link pill?') }}</span>
                  </span>
                  <q-btn
                    unelevated dense no-caps size="sm" icon="add_link"
                    class="link-catch__add" label="Add link"
                    :loading="c.busy" @click="confirmCatch(c)"
                  />
                  <button type="button" class="link-catch__x" title="Keep it as plain text"
                    :disabled="c.busy" @click="dismissCatch(c)">
                    <q-icon name="close" size="12px" />
                  </button>
                </div>
              </div>
            </section>

            <!-- FILES — 45% (55% since the link section folded into the note, 2026-10-12): drag-drop + browse, staged as PREVIEW TILES
                 (user ask: "a preview for our supported media formats …
                 images and videos so we can pre-view them right there
                 before uploading") — images render themselves, videos their
                 first frame, everything else its kind glyph. Same tile
                 grammar as the explorer's gallery, so a staged file looks
                 like the tile it becomes once uploaded. -->
            <section class="method method--files">
              <div class="method__head">
                <span class="method__label">Files</span>
              </div>
              <div
                class="drop-zone"
                :class="{ 'is-over': dragOver }"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
              >
                <q-icon name="cloud_upload" size="22px" class="drop-zone__icon" />
                <div class="drop-zone__hint">Drag files here, or click to browse</div>
                <input ref="fileInput" type="file" multiple style="display:none" @change="onBrowse" />
                <!-- The plate stands in the drop frame's bottom-right corner
                     (2026-10-12, same ask as the note's well); `.stop` so
                     a click on it never opens the file browser too. -->
                <div class="method__plates" @click.stop>
                  <q-btn
                    unelevated dense no-caps size="sm" icon="upload"
                    class="method__submit" :label="filesLabel" :title="filesLabel"
                    :loading="isBusy('files')" :disable="!canSubmit('files')"
                    @click="submit('files')"
                  />
                </div>
              </div>

              <div v-if="upload.staged.length" class="staged-grid">
                <div
                  v-for="(f, i) in upload.staged" :key="`${f.name}-${i}`"
                  class="staged-tile" :title="f.name"
                >
                  <img
                    v-if="previewKindOf(f) === 'image'"
                    class="staged-tile__media" :src="previewFor(f)" alt=""
                  />
                  <video
                    v-else-if="previewKindOf(f) === 'video'"
                    class="staged-tile__media" :src="previewFor(f)"
                    muted playsinline preload="metadata"
                  />
                  <span v-else class="staged-tile__blank">
                    <q-icon :name="iconFor(f)" size="22px" />
                    <span class="mono staged-tile__ext">.{{ extOf(f.name) }}</span>
                  </span>
                  <span class="staged-tile__strip">
                    <span class="staged-tile__name">{{ f.name }}</span>
                    <span class="staged-tile__size mono">{{ prettySize(f.size) }}</span>
                  </span>
                  <button type="button" class="staged-tile__x"
                    title="Remove from staging" @click.stop="unstage(i)">
                    <q-icon name="close" size="12px" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <footer
            v-if="upload.errors.length || upload.status === 'done'"
            class="dock-editor__foot"
          >
            <q-space />
            <span v-for="(e, i) in upload.errors" :key="i" class="dock-editor__msg text-negative">
              {{ e.filename ? `${e.filename}: ` : '' }}{{ e.message }}
            </span>
            <span v-if="upload.status === 'done'" class="dock-editor__msg text-positive">
              Uploaded!
            </span>
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
import { defineComponent, ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import MakerHeader from './MakerHeader.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import FileExplorer from './FileExplorer.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { useUploaderStore, uploadLabel } from 'src/stores/uploader'
import { useMakerStore } from 'src/stores/maker'
import { useWindowsStore } from 'src/stores/windows'
import { useNavStore } from 'src/stores/navigation'
import { uploadCodeFor } from 'src/utils/navActions'
import { nodeService } from 'src/services/node.service'
import { labelService } from 'src/services/label.service'
import { embedService } from 'src/services/embed.service'
import { formatBytes } from 'src/utils/nodeContent'
import { extractPathosRefs } from 'src/utils/pathosRefs'
import { srcFromEmbedMarkup } from 'src/utils/embedMarkup'
import { findLinks, indexOfLink } from 'src/utils/linkCatch'

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

export default defineComponent({
  name: 'UploaderDock',
  components: { MakerHeader, FileExplorer, MarkdownBody, FriezeBar },
  emits: ['created'],

  setup (props, { emit }) {
    const $q = useQuasar()
    const store = useUploaderStore()
    const windows = useWindowsStore()
    store.load()

    const dragOver = ref(false)
    const refreshKey = ref(0)

    const upload = computed(() => store.activeUpload)

    const patch = (p) => {
      if (upload.value) store.patchUpload(upload.value.id, p)
    }

    // Tab glyph, content-first — the sections' own order.
    const tabIcon = (u) =>
      u.staged.length ? 'folder_open'
        : (u.noteText || '').trim() ? 'edit_note' : 'upload'

    // ── THE LINK CATCH (2026-10-12) ──────────────────────────
    // A link reaches the uploader only through the note now: a paste that
    // carries URLs leaves them in the text as typed and raises one catch
    // per new URL (one per URL per tab — pasting the same link twice asks
    // once). Each catch is resolved against the EMBED_RULE skeletons
    // (POST /embeds/resolve) for its provider word and glyph; a failure
    // just means "no rule matched". Catches are transient, like a tab's
    // busy state: a reload keeps the URL as text and drops the question.
    const catches = ref([])
    let catchSeq = 0
    const linkCatches = computed(() =>
      catches.value.filter(c => c.uploadId === upload.value?.id))

    const catchLinks = (urls) => {
      const u = upload.value
      if (!u) return
      for (const url of urls) {
        if (catches.value.some(c => c.uploadId === u.id && c.url === url)) continue
        catches.value.push({ key: ++catchSeq, uploadId: u.id, url, embed: null, busy: false, error: '' })
        const c = catches.value[catches.value.length - 1]
        embedService.resolve(url)
          .then(r => { if (r.success && r.embed) c.embed = r.embed })
          .catch(() => { /* unrecognized = a plain link pill */ })
      }
    }

    const dismissCatch = (c) => {
      catches.value = catches.value.filter(x => x.key !== c.key)
    }

    // A caught URL the author deleted from the note is no longer a
    // question — and a closed tab's catches go with it.
    watch(
      () => store.uploads.map(u => [u.id, u.noteText]),
      () => {
        catches.value = catches.value.filter(c => {
          if (c.busy) return true
          const t = store.uploads.find(x => x.id === c.uploadId)
          return !!t && indexOfLink(t.noteText || '', c.url) >= 0
        })
      }
    )

    // Add link: mint the LINK node, then swap the URL's text for the
    // node's nano pill where it stands (the first bare occurrence — never
    // a longer URL it prefixes). If the text moved under the request the
    // pill is appended rather than lost.
    const confirmCatch = async (c) => {
      const t0 = store.uploads.find(x => x.id === c.uploadId)
      if (!t0 || c.busy) return
      c.busy = true
      c.error = ''
      try {
        const r = await nodeService.create({
          content: c.url,
          typeId: 3,
          labelIds: t0.labelIds,
          authorEntityId: t0.authorEntityId
        })
        if (!r.success || !r.node?.path) {
          c.error = r.error?.message || 'Invalid link'
          return
        }
        const node = r.node
        // THE SUB-STACK (2026-09-06 PM): "Saved a link".
        try {
          useNavStore().recordAction('CREATE_LINK', {
            targetType: 'node',
            targetId: node.id ?? null,
            targetLabel: hostOf(c.url),
            targetPath: node.path
          })
        } catch (_) { /* a link must never fail because its log did */ }
        const label = refLabelOf(c.embed?.provider || node.embed?.provider || hostOf(c.url))
        const pill = `-[[pathos:${node.path}|${label}]]`
        const t = store.uploads.find(x => x.id === c.uploadId)
        if (t) {
          const text = t.noteText || ''
          const at = indexOfLink(text, c.url)
          const next = at >= 0
            ? text.slice(0, at) + pill + text.slice(at + c.url.length)
            : text + (!text || /\s$/.test(text) ? '' : ' ') + pill
          store.patchUpload(c.uploadId, { noteText: next })
        }
        refreshKey.value++
        c.busy = false
        dismissCatch(c)
      } catch (e) {
        c.error = e?.response?.data?.error?.message || e?.message || 'Could not save the link'
      } finally {
        c.busy = false
      }
    }

    // Tab label: first staged file, or the note's first line.
    const tabLabel = uploadLabel

    const hasWork = (u) =>
      u.staged.length || (u.noteText || '').trim()

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

    // Canonic chips: with the three methods simultaneous the window mints
    // EITHER a FILE (files / note) or a LINK node, so both canonic leaves
    // show — per submit, the backend attaches the one that applies.
    const allLeaves = ref([])
    const canonicLabels = computed(() =>
      allLeaves.value
        .filter(l => l.parent_name === 'NODE' && (l.name === 'FILE' || l.name === 'LINK'))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
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

    // Staged-tile previews: object URLs minted lazily per staged File and
    // revoked when the file leaves staging (or with the component) — an
    // object URL pins its blob in memory until revoked, so the Map is the
    // ledger of what is still owed a revoke.
    const previews = new Map()
    const previewFor = (f) => {
      if (!previews.has(f)) previews.set(f, URL.createObjectURL(f))
      return previews.get(f)
    }
    const revokePreview = (f) => {
      const url = previews.get(f)
      if (url) {
        URL.revokeObjectURL(url)
        previews.delete(f)
      }
    }
    onBeforeUnmount(() => {
      for (const url of previews.values()) URL.revokeObjectURL(url)
      previews.clear()
    })
    // MIME type first (what the browser knows), extension as fallback —
    // only the kinds a tile can actually render get an object URL.
    const previewKindOf = (f) => {
      const t = f.type || ''
      if (t.startsWith('image/')) return 'image'
      if (t.startsWith('video/')) return 'video'
      const k = KIND_BY_EXT[extOf(f.name)]
      return (k === 'image' || k === 'video') ? k : null
    }

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
      revokePreview(next[i])
      next.splice(i, 1)
      patch({ staged: next })
    }

    // ── note media (2026-08-31, user ask: "paste images and drag files …
    // automatically uploaded as a node, and then auto-referenced in mini
    // formatting inside the note") — a paste/drop lands the files through
    // the SAME /nodes/upload seam as the files section, but instead of
    // staging it drops a placeholder token at the caret and swaps it for
    // the minted node's NANO PILL `-[[pathos:nodes/…|name]]` when the
    // answer comes back (a `![[…]]` mini on its own line until 2026-10-12,
    // user ask: "add the pasted item as a pill embedded in the text" — the
    // pill sits in the sentence; turning pills into minis is a later
    // ask). The swap is a string replace against a UNIQUE token, so
    // the author can keep typing while the bytes travel. ──
    const notePreview = ref(false)
    const noteDragOver = ref(false)
    const noteUploading = ref(0)
    const noteBox = ref(null)
    let noteSeq = 0

    // A parked preview is per-look, not per-draft: switching tabs lands on
    // the writing side.
    watch(() => store.activeId, () => { notePreview.value = false })

    // The API's own multer caps on POST /nodes/upload — restated here so an
    // oversize paste fails with a sentence instead of a 500.
    const NOTE_FILE_CAP = 25 * 1024 * 1024
    const NOTE_BATCH_CAP = 10

    // The ref grammar forbids ']' and newlines in the label arm (and '|'
    // would end it early) — a filename wearing one still gets a label.
    const refLabelOf = (name) =>
      String(name || '').replace(/[|\]\n]/g, ' ').trim().slice(0, 80) || 'file'

    // Every clipboard image arrives named "image.png" — stamp pastes so two
    // of them don't read as the same file in the explorer.
    const dePasteName = (f) => {
      if (!/^image\.[a-z0-9]+$/i.test(f.name || '')) return f
      const ext = f.name.split('.').pop()
      const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
      return new File([f], `pasted-${ts}-${++noteSeq}.${ext}`, { type: f.type })
    }

    const insertAtNoteCaret = (text) => {
      const u = upload.value
      if (!u) return
      const el = notePreview.value ? null : noteBox.value
      const cur = u.noteText || ''
      const start = el ? el.selectionStart : cur.length
      const end = el ? el.selectionEnd : cur.length
      patch({ noteText: cur.slice(0, start) + text + cur.slice(end) })
      nextTick(() => {
        if (!el) return
        el.focus()
        el.setSelectionRange(start + text.length, start + text.length)
      })
    }

    const uploadIntoNote = async (list) => {
      const u = upload.value
      if (!u) return
      const id = u.id
      const all = Array.from(list || [])
      if (!all.length) return

      const errors = []
      for (const f of all.filter(x => x.size > NOTE_FILE_CAP)) {
        errors.push({ filename: f.name, message: `over the ${formatBytes(NOTE_FILE_CAP)} upload cap` })
      }
      let batch = all.filter(x => x.size <= NOTE_FILE_CAP)
      if (batch.length > NOTE_BATCH_CAP) {
        errors.push({ message: `only the first ${NOTE_BATCH_CAP} files were taken (the upload batch cap)` })
        batch = batch.slice(0, NOTE_BATCH_CAP)
      }
      if (errors.length) store.patchUpload(id, { errors: [...u.errors, ...errors] })
      if (!batch.length) return

      const jobs = batch.map(f => {
        const file = dePasteName(f)
        return { file, mark: `⟪uploading ${file.name} #${++noteSeq}⟫` }
      })
      // Inline, space-separated — a nano pill is a word in the sentence,
      // and the token sits where the pill will.
      insertAtNoteCaret(jobs.map(j => j.mark).join(' '))

      const fd = new FormData()
      for (const j of jobs) fd.append('files', j.file, j.file.name)
      if (u.authorEntityId) fd.append('authorEntityId', u.authorEntityId)
      fd.append('labelIds', JSON.stringify(u.labelIds))

      noteUploading.value += jobs.length
      const tabNow = () => store.uploads.find(x => x.id === id)
      try {
        const r = await nodeService.upload(fd)
        // Successes come back in file order with failures skipped, so walk
        // the jobs with one pointer into nodes and let the per-file errors
        // name their own casualties.
        const nodes = [...(r.nodes || [])]
        const failed = r.errors || []
        // THE SUB-STACK (2026-09-06 PM): an inline upload is quiet to the
        // `created` emit (the note keeps the stage) but it IS an act —
        // one per batch, verb by the batch's media kind ("Uploaded image").
        if (nodes.length) {
          try {
            useNavStore().recordAction(uploadCodeFor(jobs.map(j => j.file)), {
              targetType: 'node',
              targetId: nodes[0]?.id ?? null,
              targetLabel: nodes.length === 1 ? (jobs[0]?.file?.name || 'file') : `${nodes.length} files`,
              targetPath: nodes[0]?.path || null
            })
          } catch (_) { /* an upload must never fail because its log did */ }
        }
        for (const j of jobs) {
          const err = failed.find(e => e.filename === j.file.name)
          const node = err ? null : nodes.shift()
          const t = tabNow()
          if (!t) continue
          const ref = node
            ? `-[[pathos:${node.path}|${refLabelOf(node.file?.name || j.file.name)}]]`
            : ''
          store.patchUpload(id, { noteText: (t.noteText || '').replace(j.mark, ref) })
        }
        const t = tabNow()
        if (t && failed.length) store.patchUpload(id, { errors: [...t.errors, ...failed] })
        // NOT emitted as 'created' on purpose: the layout answers a lone
        // created node by navigating to its viewer (and an armed builder
        // capture by consuming it) — both wrong for a paste whose node
        // exists to be referenced HERE. The explorer still learns of it.
        if (r.nodes?.length) refreshKey.value++
      } catch (e) {
        const msg = e?.response?.data?.error?.message || e?.message || 'Upload failed'
        const t = tabNow()
        if (t) {
          let text = t.noteText || ''
          for (const j of jobs) text = text.replace(j.mark, '')
          store.patchUpload(id, { noteText: text, errors: [...t.errors, { message: msg }] })
        }
      } finally {
        noteUploading.value -= jobs.length
      }
    }

    // Files upload as pills; text is the browser's own paste, except that
    // a provider's embed snippet (<iframe>/<blockquote>) lands as the ONE
    // address it carries (utils/embedMarkup.js) — and either way every
    // URL in it is caught for the teal frame.
    const onNotePaste = (e) => {
      const files = Array.from(e.clipboardData?.files || [])
      if (files.length) {
        e.preventDefault()
        uploadIntoNote(files)
        return
      }
      const raw = e.clipboardData?.getData('text/plain') || ''
      const src = srcFromEmbedMarkup(raw)
      if (src) {
        e.preventDefault()
        insertAtNoteCaret(src)
        catchLinks([src])
        return
      }
      const urls = findLinks(raw)
      if (urls.length) catchLinks(urls)
    }

    // Drops carrying no files (dragged text) are simply ignored — the
    // section-level .prevent already ate the default, and the note's drop
    // story is files.
    const onNoteDrop = (e) => {
      noteDragOver.value = false
      const files = e.dataTransfer?.files
      if (files?.length) uploadIntoNote(files)
    }

    // ── Post — the note becomes a POST DRAFT (2026-08-31 ask: "turns the
    // node into a post … creates a post in progress and redirects me
    // there"). Nothing is minted here: the body, author and labels move
    // into a fresh maker draft, the note's inline [[pathos:]] refs are
    // staged on it (already in the body, so the maker appends nothing —
    // they just show in its References rail), and the maker dock opens on
    // it while the uploader steps aside. ──
    const toPost = () => {
      const u = upload.value
      if (!u || !(u.noteText || '').trim() || noteUploading.value) return
      const body = u.noteText
      const seen = new Set()
      const references = []
      for (const r of extractPathosRefs(body).refs) {
        if (seen.has(r.address)) continue
        seen.add(r.address)
        references.push({
          address: r.address,
          primary: r.label || `${r.prefix}/${r.hash.slice(0, 8)}…`,
          // The draft's display stamps are auto|micro|mini; the parser
          // calls the '!' sigil 'embed'.
          display: r.display === 'embed' ? 'mini' : r.display
        })
      }
      const maker = useMakerStore()
      maker.load()
      const d = maker.addDraft()
      maker.patchDraft(d.id, {
        content: body,
        authorEntityId: u.authorEntityId,
        labelIds: [...u.labelIds],
        labels: u.labels.map(l => ({ ...l })),
        references
      })
      // The note moved houses — clear it, retire the tab if nothing else
      // is drafted in it, and park the dock (removeUpload may already have
      // closed it) so the post window takes the stage.
      store.patchUpload(u.id, { noteText: '' })
      const t = store.uploads.find(x => x.id === u.id)
      if (t && !hasWork(t)) store.removeUpload(u.id)
      if (store.isOpen) store.minimize()
      // THE SUB-STACK (2026-09-06 PM): the hand-off is its own act — the
      // note left this window for the maker's draft.
      try {
        useNavStore().recordAction('NOTE_TO_POST', {
          targetType: 'window',
          targetId: null,
          targetLabel: (body.split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean) || 'note').slice(0, 60)
        })
      } catch (_) { /* cosmetic */ }
      maker.open()
    }

    // ── submit — per-SECTION now ('files' | 'note'; the link section folded
    // into the note's LINK CATCH 2026-10-12), still
    // per-tab in flight state, so other tabs stay editable while one is
    // busy; state lands in the store keyed by the upload's id. ──
    const isBusy = (kind) =>
      upload.value?.status === 'busy' && upload.value?.busyKind === kind

    const canSubmit = (kind) => {
      const u = upload.value
      if (!u || u.status === 'busy') return false
      if (kind === 'note') return !!(u.noteText || '').trim()
      return u.staged.length > 0
    }

    const filesLabel = computed(() => {
      const n = upload.value?.staged.length || 0
      return n > 1 ? `Upload ${n} files` : 'Upload'
    })

    // Note filename: the first heading/line, slugged — it becomes the
    // node's display name in the explorer (line 2 of the node content).
    const noteFilename = (text) => {
      const line = (text || '').split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean) || ''
      const slug = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
      return (slug || 'note') + '.md'
    }

    // A success clears ONLY the section that fired; the tab goes away (and
    // the dock steps aside) only once nothing else is drafted in it —
    // three live sections mean a saved link must not throw away staged
    // files sitting under it.
    const finish = (id, nodes) => {
      store.patchUpload(id, { status: 'done', busyKind: null })
      refreshKey.value++
      setTimeout(() => {
        const u = store.uploads.find(x => x.id === id)
        if (u) {
          if (hasWork(u)) {
            store.patchUpload(id, { status: 'idle' })
          } else {
            store.removeUpload(id)
            if (store.uploadCount) store.minimize()
          }
        }
        emit('created', nodes)
      }, 700)
    }

    // The host a link names, for the sub-stack's label and the nano pill's
    // label when no EMBED_RULE has a better word.
    const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch (_) { return 'link' } }

    const submit = async (kind) => {
      const u = upload.value
      if (!u || !canSubmit(kind)) return
      const id = u.id
      store.patchUpload(id, { status: 'busy', busyKind: kind, errors: [] })
      try {
        const files = kind === 'note'
          ? [new File([new Blob([u.noteText], { type: 'text/markdown' })], noteFilename(u.noteText), { type: 'text/markdown' })]
          : u.staged
        const fd = new FormData()
        for (const f of files) fd.append('files', f, f.name)
        if (u.authorEntityId) fd.append('authorEntityId', u.authorEntityId)
        fd.append('labelIds', JSON.stringify(u.labelIds))
        const r = await nodeService.upload(fd)
        const errors = r.errors || []
        if (r.success && r.nodes?.length) {
          // ── THE SUB-STACK (2026-09-06) — one act per submit, not per
          // file: an upload of nine images is one thing the user did, and
          // nine lines would bury the stop it happened in. The count rides
          // the label; the nodes themselves are on the chain either way.
          // The VERB names WHAT went up (2026-09-06 PM — the ask's own
          // example, "uploaded an image"): the note section is CREATE_NOTE,
          // a files batch is UPLOAD_IMAGE / _VIDEO / _AUDIO / _DOC by its
          // one media kind, UPLOAD when the batch mixes kinds.
          try {
            const first = r.nodes[0]
            useNavStore().recordAction(kind === 'note' ? 'CREATE_NOTE' : uploadCodeFor(files), {
              targetType: 'node',
              targetId: first?.id ?? null,
              targetLabel: r.nodes.length === 1
                ? (first?.file?.name || 'file')
                : `${r.nodes.length} files`,
              targetPath: first?.path || null
            })
          } catch (_) { /* an upload must never fail because its log did */ }
          if (kind === 'note') {
            store.patchUpload(id, { noteText: '' })
          } else {
            u.staged.forEach(revokePreview)
            store.patchUpload(id, { staged: [] })
          }
          if (errors.length) {
            // Partial batch: keep the tab alive with the failures visible.
            store.patchUpload(id, { status: 'idle', busyKind: null, errors })
            refreshKey.value++
            emit('created', r.nodes)
          } else {
            finish(id, r.nodes)
          }
        } else {
          store.patchUpload(id, {
            status: 'idle',
            busyKind: null,
            errors: errors.length ? errors : [{ message: r.error?.message || 'Upload failed' }]
          })
        }
      } catch (e) {
        const msg = e?.response?.data?.error?.message || e?.message || 'Something went wrong'
        store.patchUpload(id, {
          status: 'idle',
          busyKind: null,
          errors: [{ message: msg }]
        })
      }
    }

    return {
      store,
      windows,
      upload,
      patch,
      tabIcon,
      tabLabel,
      askDiscard,
      canonicLabels,
      dragOver,
      onDrop,
      onBrowse,
      unstage,
      notePreview,
      noteDragOver,
      noteUploading,
      noteBox,
      onNotePaste,
      onNoteDrop,
      toPost,
      extOf,
      iconFor,
      prettySize,
      previewFor,
      previewKindOf,
      linkCatches,
      confirmCatch,
      dismissCatch,
      isBusy,
      canSubmit,
      filesLabel,
      submit,
      refreshKey
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and tab strip come from the shared
// .dock-window chrome in src/css/_components.scss; the footprint comes from
// .dock-window--creation there (so does maximize and the narrow-screen
// fallback). The uploader's body layout and its COLORWAY live here.

// ── THE WINDOW'S COAT AND DIALS (2026-08-26, user ask: repaint the uploader
// "in the same style as the post section that has a blue-grey color
// palette, except … use teal instead on the approximate same tones") ──
//
// MakerDock's block verbatim, one family over. It used to be literally one
// family over at the same INDICES — the maker read the blue-greys at
// 50/300/500/700 and this window read the teals standing at each of them.
//
// ── ⚠ THE FAMILY TURNED 2026-09-05 (user ask: "for uploads, we want to go
// lime instead of teal") and the index law went with it, because lime cannot
// carry a ladder at those rungs: its 500 reads 1.3:1 on this window's own
// coat and its 700 reads 2.0:1 — the first invisible, the second under the
// 3:1 floor even for large text. So the ladder is stated by READING and sits
// three rungs deeper: pale -1, mute -9, contrast -10, deep `-deep` (the file's
// one hand-mixed level, named rather than numbered; Material lime stops at 900 and the deep rung has to
// out-read a contrast already standing on the family's floor).
//
// ⚠ WHAT THIS WINDOW LOOKS LIKE NOW, stated plainly so nobody "fixes" it: it
// reads OLIVE / BRASS, not lime green. The recognizable lime is in the COAT
// and the WELLS — `--lime-2` veils the sheet, `--lime-1` floors the fields —
// and the ink is the deep end of the same family, which for a yellow-green
// IS an olive. There is no tone in this hue that is both lime and legible.
// Full argument and measurements: `_tokens.scss` § THE UPLOADER'S TWO EXTRA
// LIMES. ──
//
// Same five `--dock-*` dials, same one-contrast-everywhere rule.
//
// ⚠ `--dock-coat` here is the SECOND sanctioned break in the one-plaque law
// — `fsck --static`'s `dock-coat` witness knows this file by name
// (`UploaderDock.vue` → `--uploader-coat`), exactly as it knows MakerDock's.
// Same two standing rules: the value is a background LAYER LIST legal only
// in a `background:` shorthand, and a third window wanting its own sheet
// gets added to the witness on purpose.
//
// The LAST THREE dials are the maker FAMILY's, re-pointed for the subtree:
// MakerHeader (shared with the post window) letters its captions, rims and
// icons in `--maker-contrast` and fills/hovers with `--maker-pale`/
// `--maker-deep` — custom properties inherit across component boundaries,
// so turning them here re-tones the header without touching the maker.
// `--q-primary` is the same mechanism PostMakerSurface uses: it repaints
// the fields' focus rings and the tab and explorer spinners. (The maker's
// old note that the uploader "keeps the brand" recorded that day's ask;
// today's ask is this window's own colorway.)
.uploader-dock {
  --dock-coat: var(--uploader-coat);
  // (`--dock-glow` stood here 2026-09-05 → 09-07: the open-window light, this
  // family's Material 200 feeding three shadow layers on the shared footprint.
  // Retired by the user's ask for "a thin grey shadow instead" — the cast is
  // one grey layer on `.dock-window--creation` now and no window sets a tone
  // for it, so every tone in this colorway is a rung of the ladder again. The
  // chip's lit glyph on the bar kept its own `--chip-glow`.)
  --dock-rule: var(--uploader-contrast);
  // ⚠ THE FAMILY MOVED ON 2026-09-07 (user ask: "uploads -> teal") — the levels named here
  // are teal (the August family, one rung deeper)'s now; the dials above them follow in `_tokens.scss`.
  --dock-rule-strong: var(--teal-9);
  --dock-ink: var(--uploader-contrast);
  --dock-ink-mute: var(--teal-4);
  --dock-well: var(--teal-1);
  // The band under the header's PLATE (2026-09-26): the family's darkest
  // rung, Material 900. The wave is the platform's cream, stated once on
  // `.dock-window__frieze` in `_components.scss` — not a per-window dial.
  --dock-frieze: var(--teal-10);
  --maker-contrast: var(--uploader-contrast);
  --maker-pale: var(--teal-1);
  --maker-deep: var(--teal-9);
  --q-primary: var(--uploader-contrast);
}

// The one brown in the shared chrome that is NOT a dial — the tab-hover ink,
// written `var(--brown-10, #3e2723)` inline. The window's deep step, as in
// the maker.
.dock-tab:hover { color: var(--teal-9); }

// ── THE HEADER PLATE — MakerDock's `.dock-bar__plate`, dial for dial, in
// this window's contrast. Same scoping argument: the plate is stated at the
// window, never on the shared `.dock-bar`, and its rim is SOLID because up
// here the plate is the window's one NAME. ──
.dock-bar__plate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--uploader-contrast);
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.04);
  transition: background 0.12s, border-color 0.12s;

  .dock-bar__icon { color: var(--uploader-contrast); opacity: 0.85; }
  .dock-bar__title { color: var(--uploader-contrast); }
}

// ── Upload tabs — the lit lip and the new-tab glyph read the window's own
// contrast, not the shared chrome's `#00829c` (which keeps lighting the
// docks that have no colorway). Scoped here, so a plain two-class rule
// outranks the global one — no `:deep()`, as in MakerDock. ──
.dock-tab.is-active { box-shadow: inset 0 2px 0 var(--uploader-contrast); }
.dock-tab--new:hover { color: var(--uploader-contrast); }

// ── Body: editor left, explorer right (2026-08-26, user ask: the explorer
// occupies 40% of the SCREEN's width). `40vw`, not a % of the body — the
// number is stated against the screen, so the maximized window gives the
// explorer exactly the asked-for share and the half-screen resting window
// gives it as much of that as it can afford: the `calc()` arm keeps the
// editor at its 300px floor (the width MakerHeader's labelled rows were
// built for) and hands everything past it to the explorer. It replaced
// `minmax(340px, 460px)`, a cap the ask was precisely about removing. ──
.dock-body {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) min(40vw, calc(100% - 312px));
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

// ── THE METHOD STACK (2026-08-26, user ask) — note 45%, link 15%, files
// 40% "of the uploading section['s] height": fr shares of the stack's free
// space, so the three keep the asked proportions at any window height.
// THE STACK IS A BOX (same day, later ask: "put the uploading subsections
// all inside a box with a thin teal border and rounded corners") — the
// window's inner-border grammar, worn by the stack itself rather than a
// wrapper: the explorer card's rim and radius, no fill (the coat shows
// through, so the fence reads as a region of the window, not another
// card). ──
.method-stack {
  display: grid;
  grid-template-rows: 55fr 45fr; // 45/15/40 until the link row folded into the note (2026-10-12)
  gap: 10px;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--uploader-contrast);
  border-radius: var(--radius-md);
  padding: 10px;
}

.method {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  // ⚠ `min-width: 0` is load-bearing (2026-09-28). A grid item's default
  // `min-width: auto` is its MIN-CONTENT width, and the link head's
  // recognition hint is `white-space: nowrap` — so the moment a rule
  // recognized a URL, the link section asked the grid for label + the
  // whole hint + its plates (468px in a 300px editor column), the grid's
  // tracks grew to it, and every section's plates were drawn UNDER the
  // explorer aside (a click on Post landed on a file row). The ellipsis
  // on `.method__hint` never got to work because the item itself refused
  // to shrink. Pre-existing since the hint replaced the frame preview
  // (2026-08-26); surfaced by the second plate.
  min-width: 0;
}

.method__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

// Section-label grammar (RefBrowser / FileExplorer): words that NAME a
// section letter in the window's contrast.
.method__label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--uploader-contrast);
  font-family: var(--font-mono);
}

.method__hint {
  font-size: 0.68em;
  color: var(--ink-mute);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

// ── The submit plates — `.maker-surface__post`'s chrome (the feed card's
// post plate) in this window's contrast, one per section ("each one with
// its uploading button"). Same single-class q-btn dials to beat, same
// scope-attribute trick to beat them without `!important`. ──
.method__submit {
  min-height: 0;
  // A plate never wraps its word and never gives way — the head's HINT is
  // the piece that shrinks (ellipsis), now that the section itself can
  // (`.method { min-width: 0 }` above). Without this, "Save link" broke
  // onto two lines at the resting 300px column once it had a sibling.
  flex: 0 0 auto;
  white-space: nowrap;
  padding: 2px 10px;
  border: 1px solid var(--uploader-contrast);
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.04);
  color: rgba(var(--ink-rgb), 0.78);
  font-family: var(--font-display);
  font-size: 0.66em;
  font-weight: 400;
  letter-spacing: 0.02em;
  transition: background 0.12s, color 0.12s, border-color 0.12s;

  &:hover {
    background: var(--uploader-contrast);
    border-color: var(--uploader-contrast);
    color: #fff;
  }

  // Quasar's disabled state is a 0.6 opacity wash on the whole button; the
  // plate needs its rim to go with it or a dead control keeps a live edge.
  &.disabled { border-color: rgba(var(--ink-rgb), 0.18); }

  :deep(.q-icon) { font-size: 13px; }

  // INVERTED (2026-10-12) — the note's two plates: filled in the contrast
  // at rest, the outlined plate's face on hover. The disabled wash keeps
  // the fill, so a dead plate reads as a paler one, not as a vanished one.
  &--inverted {
    background: var(--uploader-contrast);
    color: #fff;

    &:hover {
      background: #fff;
      color: var(--uploader-contrast);
    }
  }
}

// ── THE PLATES IN THE CORNER (2026-10-12) — every section's submit
// plates stand inside its container, bottom-right, over the content: the
// note's in the well, the files' in the drop frame. ──
.method__plates {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 1;
  display: flex;
  gap: 6px;
}

// ── NOTE — the writing well: the box (or its preview) fills it, the
// plates float in its corner. ──
.note-well {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// ── NOTE — the writing box. ──
.note-box {
  flex: 1;
  min-height: 0;
  resize: none;
  padding: 8px 10px;
  border: 1px solid var(--uploader-contrast);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
  font: inherit;
  // THE INPUT FACE (2026-09-26): the creation windows type in the display
  // face through `--input-font` (`_components.scss`); this box states its own
  // font, so it reads the dial itself — `font: inherit` alone would outrank
  // the window's element rule and keep the prose face.
  font-family: var(--input-font, inherit);
  font-size: 0.85em;
  line-height: 1.45;
  // The corner plates' row (22px + the 8px inset) plus a breath — the
  // last line scrolls clear of them.
  padding-bottom: 38px;

  &::placeholder { color: var(--ink-mute); }
  &:focus { outline: none; border-color: var(--teal-9); }

  // Files dragged over the note light it as a drop target — the drop
  // zone's own live-edge grammar (the wash restates the contrast's channels
  // through `--lime-10-rgb`, as there).
  &.is-over {
    border-color: var(--uploader-contrast);
    background: rgba(var(--teal-7-rgb), 0.06);
  }
}

// The edit⇄preview pills — NoteEditor's mode toggle at its smallest: two
// icon segments in one hairline pill, the active one filled with the
// window's contrast.
.note-mode {
  display: inline-flex;
  border: 1px solid rgba(var(--ink-rgb), 0.25);
  border-radius: 5px;
  overflow: hidden;
  flex-shrink: 0;
}

.note-mode__btn {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border: none;
  background: transparent;
  color: var(--ink-mute);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  & + & { border-left: 1px solid rgba(var(--ink-rgb), 0.18); }
  &:hover { color: var(--uploader-contrast); }
  &.is-on {
    background: var(--uploader-contrast);
    color: #fff;
  }
}

// The preview pane wears the note box's frame and MarkdownBody's global
// .md-rendered colors; sizing steps down like NoteEditor's proof pane —
// a full-scale h1 would eat half of a 45%-height section.
.note-preview {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 38px;
  border: 1px solid var(--uploader-contrast);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: 0.82em;
  line-height: 1.55;

  :deep(h1) { font-size: 1.45em; margin: 0.5em 0 0.35em; }
  :deep(h2) { font-size: 1.28em; margin: 0.5em 0 0.3em; }
  :deep(h3) { font-size: 1.12em; margin: 0.45em 0 0.25em; }
  :deep(h4), :deep(h5), :deep(h6) { font-size: 1em; margin: 0.4em 0 0.2em; }
  :deep(h1:first-child), :deep(h2:first-child), :deep(h3:first-child) { margin-top: 0; }
  :deep(p)  { margin: 0 0 0.6em; }
  :deep(ul), :deep(ol) { margin: 0 0 0.6em; padding-left: 1.4em; }

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.note-preview__empty {
  padding: 4px 2px;
  font-size: 0.85em;
  color: var(--ink-mute);
}

// ── THE LINK CATCH (2026-10-12) — the NEON teal frame: `--teal-13`
// (A400, the node family's loud accent) as a 1.5px rim with a `--teal-12`
// glow, on the field's pale. One row per caught URL under the note box:
// glyph │ url + provider line │ Add link │ ×. The rows never grow the
// section past its share — the list scrolls after three. ──
.link-catches {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  max-height: 120px;
  overflow-y: auto;
  // Room for the glow — an overflow box clips its children's shadows.
  padding: 4px;
  margin: -4px;
}

.link-catch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 8px;
  border: 1.5px solid var(--teal-13);
  border-radius: var(--radius-md);
  background: var(--teal-1);
  box-shadow: 0 0 0 2px rgba(29, 233, 182, 0.18), 0 0 10px rgba(100, 255, 218, 0.45);
  min-width: 0;

  &.is-error { border-color: var(--q-negative, #c10015); box-shadow: none; }
}

.link-catch__icon { color: var(--teal-10); flex-shrink: 0; }

.link-catch__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.25;
}

.link-catch__url {
  font-family: var(--font-mono);
  font-size: 0.72em;
  color: var(--teal-10);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-catch__meta {
  font-size: 0.68em;
  color: var(--ink-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .is-error & { color: var(--q-negative, #c10015); }
}

.link-catch__add {
  flex-shrink: 0;
  background: var(--teal-13);
  color: var(--teal-10);
  font-weight: 600;
}

.link-catch__x {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--teal-10);
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(0, 77, 64, 0.08); }
  &:disabled { opacity: 0.35; cursor: default; }
}

// ── FILES ──
.method--files { overflow: hidden; }

// THE DROP FIELD FILLS ITS SECTION (2026-08-26, user ask: "occupy the
// available height of its container … for both mobile and desktop"): the
// zone is the section's flexible piece — alone it takes everything under
// the head, and once tiles are staged it splits the room evenly with the
// grid (both `flex: 1 1 0`), never dropping under a real target's height.
// Content centers on both axes so a tall zone reads as a field, not as a
// caption floating at the top of one.
.drop-zone {
  flex: 1 1 0;
  // 56px until the Upload plate moved into its corner (2026-10-12): the
  // hint and the plate's row both have to fit a squeezed zone.
  min-height: 84px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  border-radius: var(--radius-md);
  padding: 10px 12px 38px;
  text-align: center;
  cursor: pointer;

  .method__plates { cursor: default; }
  background: rgba(255, 255, 255, 0.4);
  transition: border-color 0.15s, background 0.15s;

  &.is-over,
  &:hover {
    // The window's contrast; the wash is the contrast's own channels, read
    // through `--lime-10-rgb` since 2026-09-05 (it was a literal `0, 150, 136`,
    // `$teal-6`'s channels, which is what made the lime repaint a grep)
    // — the dial resolves to a hex, so a live-edge wash restates them.
    border-color: var(--uploader-contrast);
    background: rgba(var(--teal-7-rgb), 0.06);
  }
}

.drop-zone__icon { color: rgba(var(--ink-rgb), 0.4); }

.drop-zone__hint {
  margin-top: 2px;
  font-size: 0.74em;
  color: var(--ink-mute);
}

// Staged previews — the explorer's gallery-tile grammar, one surface over:
// a staged file looks like the tile it becomes once uploaded.
.staged-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 6px;
  align-content: start;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.staged-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 16 / 11;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  overflow: hidden;
  text-align: left;
}

.staged-tile__media {
  flex: 1;
  min-height: 0;
  width: 100%;
  object-fit: cover;
}

.staged-tile__blank {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;

  .q-icon { color: var(--uploader-contrast); }
}

.staged-tile__ext {
  font-size: 0.6em;
  color: var(--ink-soft);
}

.staged-tile__strip {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 2px 6px 3px;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(var(--ink-rgb), 0.1);
}

.staged-tile__name {
  flex: 1;
  font-size: 0.62em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staged-tile__size {
  font-size: 0.56em;
  color: var(--ink-mute);
  white-space: nowrap;
}

.staged-tile__x {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  cursor: pointer;

  &:hover { background: rgba(0, 0, 0, 0.65); }
}

.dock-editor__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dock-editor__msg { font-size: 0.78em; }

// The explorer lives in a white card, sibling of the maker's ref rail — and
// like that rail since the repaint (`.maker-surface__refs`), its rim is an
// INNER BORDER of the window: solid contrast, not an ink wash, this being
// the biggest box inside the uploader.
.dock-files {
  min-height: 0;
  background: var(--paper-card);
  border: 1px solid var(--uploader-contrast);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

// Mobile (2026-08-26, two user asks): the BODY drops to block flow —
// editor on top, explorer under it ("put the file explorer below
// the title/labels/upload section") — and the body scrolls as one surface.
// Inside the editor the METHODS rearrange ("put the write and file upload
// sections inside two columns inside a single row, on two contiguous
// square cells. Then, below these two, put the thin rectangle for the link
// uploader"): stacked, the editor has no bounded height for the desktop's
// 45/15/40 shares to divide, so the two working surfaces take real AREA
// instead — a cell each, side by side (`aspect-ratio` off the half-width
// column makes the section's height definite, which is what lets the note
// box and the staged grid keep their flex fills; born square, 4:3 since
// the same day's density ask) — and the one-line link method is the thin
// full-width bar under them. Grid placement overrides DOM order (note,
// link, files) to get the row.
@media (max-width: 900px) {
  // ⚠ The stacked body is BLOCK flow, not a one-column grid — the same
  // lesson PostMakerSurface's stacked body already recorded, hit here a
  // second way: a grid auto-row measures the editor's INTRINSIC height,
  // and the squares below state theirs through `aspect-ratio` (resolved
  // from track widths at layout time), which an intrinsic measurement
  // cannot see — measured, the editor's row came out 162px with ~240px of
  // squares overflowing it, painted OVER the explorer's head. Block flow
  // has no row to measure: heights resolve top-down during layout, the
  // editor is as tall as its squares, and the explorer simply follows in
  // flow (`margin-top` standing in for the grid's 12px gap).
  .dock-body { display: block; overflow-y: auto; }
  .dock-files { min-height: 320px; margin-top: 8px; }

  // DENSER on the phone (2026-08-26, latest ask: "make the uploading
  // subsections denser so it occupies less height and some elements of the
  // explorer are visible") — the stack's chrome tightens (gaps and the
  // box's padding), and the two cells give up strict squareness for a 4:3
  // rectangle: their height is bound to the column width, so with the
  // chrome already thin the ratio is the only real height knob left. The
  // arrangement holds — two contiguous cells over the thin link bar — it
  // just spends ~60px less before the explorer's head shows.
  .dock-editor { gap: 6px; }
  .method { gap: 4px; }
  .method-stack {
    // `flex: none` — stacked, the editor's height is its content, and a
    // flex share of an auto-height parent crushed the stack to ~7px while
    // its rows overflowed it. Natural height + the scrolling body instead.
    flex: none;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: auto;
    gap: 6px;
    padding: 6px;
  }
  // ⚠ THE SQUARE IS `aspect-ratio` + `min-height: auto` — BOTH, and the walk
  // to here is two measured failures (gotchas has the long form):
  //   · aspect-ratio alone: the base `.method`'s `min-height: 0` (the
  //     desktop stack needs it) zeroes the cell's contribution to the auto
  //     row, the transferred height lands on the box only after the tracks
  //     are sized — rows computed 0px and the squares overflowed them.
  //     Undoing the min-height AT THESE TWO CELLS is what lets the
  //     transferred square reach the track. (Content stays under it: the
  //     note box and the staged grid are the flexible pieces, and each
  //     carries its own `min-height: 0`.)
  //   · an explicit `50cqw` height: sized the row it was in, but a
  //     container-query unit is INVISIBLE TO INTRINSIC SIZING one level up —
  //     while the BODY's auto row measured the editor, the cqw resolved
  //     against a container not yet sized, contributed ~0, and the editor's
  //     row came out 162px tall with 240px of squares overflowing it,
  //     PAINTED OVER THE EXPLORER below (the overlap this note exists for).
  .method--note,
  .method--files {
    min-height: auto;
    aspect-ratio: 4 / 3; // was 1 — see the density note above
  }
  .method--note  { grid-column: 1; grid-row: 1; }
  .method--files { grid-column: 2; grid-row: 1; }

  // Half-width cells: quieter type, slimmer drop zone. The note head now
  // carries the mode pills and TWO plates (Post + Save note) — more than a
  // half-width cell's single line holds, so it wraps.
  .note-box,
  .note-preview { font-size: 0.8em; }
  .method--note .method__head { flex-wrap: wrap; }
  .drop-zone { padding: 8px 8px 34px; }
  .drop-zone__hint { font-size: 0.68em; }

  // The corner plates TIGHTEN in a half-width cell (2026-10-12): at the
  // desktop padding the two worded plates were wider than the note's cell
  // at 375px. (Glyph-only was tried and lost to Quasar's `.block` utility
  // — `display: block !important` on the label span; tight words fit.)
  .method__plates { right: 5px; bottom: 5px; gap: 4px; }
  .method__submit { padding: 3px 5px; }
  .note-box,
  .note-preview { padding-bottom: 32px; }
}
</style>
