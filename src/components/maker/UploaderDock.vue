<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="uploader-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('uploader') === 'right' }"
      :style="{ zIndex: windows.zOf('uploader'), '--dock-right': windows.dockRight + 'px', '--trail-shift': windows.trailShiftOf('uploader') + 'px' }"
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

            <!-- NOTE — 45%. A SIMPLE WRITING BOX (user ask: "no special
                 formatting"): a bare textarea where NoteEditor's
                 edit/split/preview machinery used to mount. The text still
                 lands as a .md FILE node exactly as before — what left is
                 the preview chrome, not the format. -->
            <section class="method method--note">
              <div class="method__head">
                <span class="method__label">Note</span>
                <q-space />
                <q-btn
                  unelevated dense no-caps size="sm" icon="note_add"
                  class="method__submit" label="Save note"
                  :loading="isBusy('note')" :disable="!canSubmit('note')"
                  @click="submit('note')"
                />
              </div>
              <textarea
                class="note-box"
                :value="upload.noteText"
                placeholder="Write a note — it uploads as a markdown file."
                @input="patch({ noteText: $event.target.value })"
              ></textarea>
            </section>

            <!-- LINK — 15%: one input, its button in the head row. The URL
                 is still resolved against the EMBED_RULE skeletons as it is
                 typed (POST /embeds/resolve); at this height the player
                 preview has no room, so recognition shows as the head's
                 hint line instead of as the frame itself. -->
            <section class="method method--link">
              <div class="method__head">
                <span class="method__label">Link</span>
                <span v-if="linkEmbed" class="method__hint">
                  recognized as {{ linkEmbed.provider }} — renders as its player wherever the node is shown
                </span>
                <q-space />
                <q-btn
                  unelevated dense no-caps size="sm" icon="add_link"
                  class="method__submit" label="Save link"
                  :loading="isBusy('link')" :disable="!canSubmit('link')"
                  @click="submit('link')"
                />
              </div>
              <q-input
                :model-value="upload.linkUrl" :dark="false" outlined dense hide-bottom-space
                placeholder="https://example.com/page"
                :error="!!linkHint"
                @update:model-value="linkHint = ''; patch({ linkUrl: $event })"
                @keyup.enter="submit('link')"
              >
                <template #prepend><q-icon name="link" /></template>
              </q-input>
            </section>

            <!-- FILES — 40%: drag-drop + browse, staged as PREVIEW TILES
                 (user ask: "a preview for our supported media formats …
                 images and videos so we can pre-view them right there
                 before uploading") — images render themselves, videos their
                 first frame, everything else its kind glyph. Same tile
                 grammar as the explorer's gallery, so a staged file looks
                 like the tile it becomes once uploaded. -->
            <section class="method method--files">
              <div class="method__head">
                <span class="method__label">Files</span>
                <q-space />
                <q-btn
                  unelevated dense no-caps size="sm" icon="upload"
                  class="method__submit" :label="filesLabel"
                  :loading="isBusy('files')" :disable="!canSubmit('files')"
                  @click="submit('files')"
                />
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
            v-if="linkHint || upload.errors.length || upload.status === 'done'"
            class="dock-editor__foot"
          >
            <q-space />
            <span v-if="linkHint" class="dock-editor__msg text-negative">{{ linkHint }}</span>
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
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import MakerHeader from './MakerHeader.vue'
import FileExplorer from './FileExplorer.vue'
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

export default defineComponent({
  name: 'UploaderDock',
  components: { MakerHeader, FileExplorer },
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

    // Tab glyph, content-first — the sections' own order.
    const tabIcon = (u) =>
      u.staged.length ? 'folder_open'
        : (u.linkUrl || '').trim() ? 'link'
            : (u.noteText || '').trim() ? 'edit_note' : 'upload'

    // ── embed recognition ────────────────────────────────────
    // The typed URL, resolved against the platform's EMBED_RULE skeletons
    // (POST /embeds/resolve). Debounced because it follows keystrokes, and
    // sequence-guarded because a slow answer for an older URL must not
    // land on a newer one. Failures are silent: no recognition is the same
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
      () => upload.value?.linkUrl,
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

    // ── submit — per-SECTION now ('files' | 'link' | 'note'), still
    // per-tab in flight state, so other tabs stay editable while one is
    // busy; state lands in the store keyed by the upload's id. ──
    const isBusy = (kind) =>
      upload.value?.status === 'busy' && upload.value?.busyKind === kind

    const canSubmit = (kind) => {
      const u = upload.value
      if (!u || u.status === 'busy') return false
      if (kind === 'link') return !!(u.linkUrl || '').trim()
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

    const submit = async (kind) => {
      const u = upload.value
      if (!u || !canSubmit(kind)) return
      const id = u.id
      linkHint.value = ''
      store.patchUpload(id, { status: 'busy', busyKind: kind, errors: [] })
      try {
        if (kind === 'link') {
          const r = await nodeService.create({
            content: u.linkUrl.trim(),
            typeId: 3,
            labelIds: u.labelIds,
            authorEntityId: u.authorEntityId
          })
          if (r.success) {
            store.patchUpload(id, { linkUrl: '' })
            finish(id, [r.node])
          } else {
            linkHint.value = r.error?.message || 'Invalid link'
            store.patchUpload(id, { status: 'idle', busyKind: null })
          }
          return
        }

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
        if (kind === 'link') linkHint.value = msg
        store.patchUpload(id, {
          status: 'idle',
          busyKind: null,
          errors: kind === 'link' ? [] : [{ message: msg }]
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
      extOf,
      iconFor,
      prettySize,
      previewFor,
      previewKindOf,
      linkHint,
      linkEmbed,
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
// MakerDock's block verbatim, one family over: the maker reads the
// blue-greys at 50/300/500/700 and this window reads the teals standing at
// the SAME indices (`_tokens.scss` § THE UPLOADER'S THREE). Same five
// `--dock-*` dials, same one-contrast-everywhere rule.
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
  --dock-rule: var(--uploader-contrast);
  --dock-rule-strong: var(--teal-8);
  --dock-ink: var(--uploader-contrast);
  --dock-ink-mute: var(--teal-4);
  --dock-well: var(--teal-1);
  --maker-contrast: var(--uploader-contrast);
  --maker-pale: var(--teal-1);
  --maker-deep: var(--teal-8);
  --q-primary: var(--uploader-contrast);
}

// The one brown in the shared chrome that is NOT a dial — the tab-hover ink,
// written `var(--brown-10, #3e2723)` inline. The window's deep step, as in
// the maker.
.dock-tab:hover { color: var(--teal-8); }

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
  grid-template-rows: 45fr 15fr 40fr;
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
}

// ── NOTE — the simple writing box. ──
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
  font-size: 0.85em;
  line-height: 1.45;

  &::placeholder { color: var(--ink-mute); }
  &:focus { outline: none; border-color: var(--teal-8); }
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
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.4);
  transition: border-color 0.15s, background 0.15s;

  &.is-over,
  &:hover {
    // The window's contrast; the wash is `$teal-6`'s own channels (0,150,136)
    // — the dial resolves to a hex, so a live-edge wash restates them.
    border-color: var(--uploader-contrast);
    background: rgba(0, 150, 136, 0.06);
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
    grid-template-rows: auto auto;
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
  .method--link  { grid-column: 1 / -1; grid-row: 2; }

  // Half-width cells: quieter type, slimmer drop zone.
  .note-box { font-size: 0.8em; }
  .drop-zone { padding: 8px; }
  .drop-zone__hint { font-size: 0.68em; }
}
</style>
