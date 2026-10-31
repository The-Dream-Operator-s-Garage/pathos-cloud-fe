<template>
  <!-- ── THE NOTEPAD FACE (2026-10-11): "a private notepad that supports
       only writing markdown text by now. It should only hold a title and
       plain text (no reference recognition here yet). Notes … are saved as
       versioned nodes … a big input space with a grid below that lets me
       scroll through old notes. The history button … When clicked, the grid
       changes background color and now showcases the note versions in order
       of succession. Notes are directly saved automatically".

       THE LIFECYCLE, on the platform's own version machinery (docs/concepts/
       versioning.md — the node-level chain):
         · first keystroke → 1.2s later the ORIGIN mints: POST /nodes/upload
           of `<title>.md` with `capture=notepad` (a private FILE node on the
           owner's UPLOADS_PATH; the title is the file's human name, line 2);
         · every later pause → PUT /nodes/:id/draft — the node's private
           in-place draft, the same row the post editor autosaves into;
         · ABANDONED or SAVED (leaving the note, opening another, a new note,
           the face unmounting, the save tool) → PUT /nodes/:id { content,
           filename } = draft + promote in one shot: a FRESH node chained to
           the prior (ancestor_id), renamed if the title moved, the prior
           joining its VERSIONS path. One version per sitting, never per
           keystroke — each version is an immutable file on disk and the
           prod account is inode-capped (gotchas § Prod inode quota).
       The grid lists the owner's notepad notes as chain HEADS (GET
       /nodes/uploads?capture=notepad&heads=1&ownerId=me); history lists the
       open note's chain (GET /nodes/:id/versions), oldest first, the head
       last and marked current. A version opens READ-ONLY in the editor;
       "Restore" writes it back as a new version. ── -->
  <div class="pad" :class="{ 'is-history': history, 'is-viewing': !!viewing }">
    <div class="pad__head">
      <input
        v-model="title"
        class="pad__title nasalization"
        placeholder="Title"
        maxlength="140"
        :readonly="!!viewing"
        @input="onEdit"
      >
      <span class="pad__state mono" :title="stateTitle">{{ stateText }}</span>
      <button type="button" class="pad__tool" title="New note" @click="newNote">
        <q-icon name="note_add" size="16px" />
      </button>
      <button type="button" class="pad__tool" :disabled="!!viewing || !store.noteDirty || !store.noteHasWork" title="Save a version now" @click="version('save')">
        <q-icon name="save" size="16px" />
      </button>
      <button type="button" class="pad__tool pad__tool--history" :class="{ 'is-on': history }" :disabled="!store.note.nodeId" :title="history ? 'Back to your notes' : 'Versions of this note'" @click="toggleHistory">
        <q-icon name="history" size="16px" />
      </button>
    </div>

    <textarea
      ref="bodyEl"
      v-model="body"
      class="pad__body mono"
      :placeholder="viewing ? '' : 'Write…'"
      :readonly="!!viewing"
      spellcheck="true"
      @input="onEdit"
      @paste="onPaste"
    />

    <!-- ⭐ THE AUTHORING CATCH (2026-10-31, user ask: link recognition "in
         teal coloring … when they're either writing a note or a post",
         plus pasted pictures and files, "if it is not duplicated") — the
         uploader's teal frame (`LinkCatchList` + `useLinkCatch`): a NEW
         link (pasted, or typed and finished) or a pasted file glows with
         Add; one already in the owner's pathchain shows calm with Use it.
         Either way the URL / the file's `⟪…⟫` mark becomes the node's nano
         pill in the note. Not while a version is open (read-only). -->
    <LinkCatchList
      v-if="!viewing"
      :catches="catcher.catches.value"
      @add="catcher.add" @use="catcher.use" @dismiss="catcher.dismiss"
    />

    <div v-if="viewing" class="pad__viewing">
      <q-icon name="history" size="13px" />
      <span>Viewing version {{ viewingIndex }} of {{ versions.length }}</span>
      <button type="button" class="pad__link" @click="restoreVersion">Restore as a new version</button>
      <button type="button" class="pad__link" @click="leaveVersion">Back to the current</button>
    </div>

    <div class="pad__grid-head">
      <span class="pad__grid-label">{{ history ? 'Versions · in order of succession' : 'Your notes' }}</span>
      <span class="pad__grid-count mono">{{ history ? versions.length : total }}</span>
    </div>
    <div ref="gridEl" class="pad__grid" @scroll.passive="onScroll">
      <template v-if="history">
        <button
          v-for="(v, i) in versions"
          :key="v.id"
          type="button"
          class="pad__cell pad__cell--version"
          :class="{ 'is-current': v.id === store.note.nodeId, 'is-viewing': viewing?.id === v.id }"
          @click="viewVersion(v, i)"
        >
          <span class="pad__cell-n mono">v{{ i + 1 }}{{ v.id === store.note.nodeId ? ' · current' : '' }}</span>
          <span class="pad__cell-title">{{ titleOf(v) }}</span>
          <span class="pad__cell-excerpt">{{ excerptOf(v) }}</span>
          <span class="pad__cell-when mono">{{ whenOf(v) }}</span>
        </button>
        <p v-if="!versions.length && !loading" class="pad__empty">No versions yet — the first mints when you leave or save this note.</p>
      </template>
      <template v-else>
        <button
          v-for="n in notes"
          :key="n.id"
          type="button"
          class="pad__cell"
          :class="{ 'is-current': n.id === store.note.nodeId }"
          @click="openNote(n)"
        >
          <span class="pad__cell-title">{{ titleOf(n) }}</span>
          <span class="pad__cell-excerpt">{{ excerptOf(n) }}</span>
          <span class="pad__cell-when mono">{{ whenOf(n) }}</span>
        </button>
        <p v-if="!notes.length && !loading" class="pad__empty">No notes yet — start writing above.</p>
      </template>
      <q-spinner v-if="loading" size="16px" class="pad__spin" />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useCaptureStore } from 'src/stores/capture'
import { useAuthStore } from 'src/stores/auth'
import { useNavStore } from 'src/stores/navigation'
import { nodeService } from 'src/services/node.service'
import { uploadCapture } from './captureMedia'
import { useLinkCatch } from 'src/composables/useLinkCatch'
import LinkCatchList from 'src/components/shared/LinkCatchList.vue'

const AUTOSAVE_MS = 1200
const PAGE = 24

export default defineComponent({
  name: 'NotepadFace',
  components: { LinkCatchList },
  emits: ['created'],
  setup (props, { emit }) {
    const store = useCaptureStore()
    const auth = useAuthStore()
    store.load()

    const bodyEl = ref(null)
    const gridEl = ref(null)
    const title = ref(store.note.title || '')
    const body = ref(store.note.body || '')
    const state = ref(store.note.nodeId ? 'saved' : 'new') // new | typing | saving | draft | saved | error
    const errorText = ref('')
    const history = ref(false)
    const notes = ref([])
    const total = ref(0)
    const page = ref(1)
    const hasMore = ref(false)
    const loading = ref(false)
    const versions = ref([])
    const viewing = ref(null)
    const viewingIndex = ref(0)

    let timer = null
    let chain = Promise.resolve()
    let lastDraftBody = store.note.savedBody || ''

    // Every write to the server goes through one lane, in order: an
    // autosave in flight never races the version that follows it.
    const run = (fn) => { chain = chain.then(fn, fn); return chain }

    const fileNameOf = (t) => {
      const clean = String(t || '').replace(/[\\/:*?"<>|\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
      return (clean || 'Untitled note') + '.md'
    }
    const titleOf = (n) => (n?.name || n?.file?.name || '').replace(/\.md$/i, '') || 'Untitled note'
    const excerptOf = (n) => {
      const t = (n?.file?.text || '').replace(/\s+/g, ' ').trim()
      return t.length > 140 ? t.slice(0, 139) + '…' : t
    }
    const whenOf = (n) => {
      const d = n?.created_at ? new Date(n.created_at) : null
      if (!d || isNaN(d)) return ''
      const p = (x) => String(x).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    }

    const stateText = computed(() => {
      if (viewing.value) return 'read-only'
      switch (state.value) {
        case 'new': return store.noteHasWork ? 'unsaved' : 'new note'
        case 'typing': return '…'
        case 'saving': return 'saving'
        case 'draft': return 'draft saved'
        case 'saved': return store.noteDirty ? 'edited' : 'saved'
        case 'error': return 'error'
        default: return ''
      }
    })
    const stateTitle = computed(() => errorText.value || 'Autosaves as you pause; a version mints when you leave or save the note')

    const recordAct = (code, node, label) => {
      try {
        useNavStore().recordAction(code, { targetType: 'node', targetId: node?.id ?? null, targetLabel: label, targetPath: node?.path || null })
      } catch (_) { /* a note must never fail because its log did */ }
    }

    // ── the grid ─────────────────────────────────────────────
    const loadNotes = async (reset = false) => {
      if (loading.value) return
      if (reset) { page.value = 1; notes.value = []; hasMore.value = false }
      loading.value = true
      try {
        const r = await nodeService.listUploads({
          capture: 'notepad', heads: 1, ownerId: auth.entityId, page: page.value, limit: PAGE
        })
        if (r.success) {
          notes.value = reset || page.value === 1 ? r.nodes : [...notes.value, ...r.nodes]
          total.value = r.total || 0
          hasMore.value = !!r.hasMore
        }
      } catch (_) { /* the grid stays as it was */ } finally { loading.value = false }
    }
    const onScroll = () => {
      const el = gridEl.value
      if (!el || history.value || !hasMore.value || loading.value) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) { page.value++; loadNotes() }
    }

    const loadVersions = async () => {
      const id = store.note.nodeId
      if (!id) { versions.value = []; return }
      loading.value = true
      try {
        const r = await nodeService.getVersions(id)
        if (r.success) {
          // `older` walks back toward the origin, nearest first; reversed it
          // reads oldest → newest, and the head closes the succession.
          versions.value = [...(r.older || []).slice().reverse(), r.head].filter(Boolean)
        }
      } catch (_) { versions.value = [] } finally { loading.value = false }
    }

    const toggleHistory = async () => {
      if (!history.value) {
        // Entering history closes the sitting: the chain shows what is
        // actually on it.
        await run(() => version('history'))
        history.value = true
        await loadVersions()
      } else {
        history.value = false
        leaveVersion()
        loadNotes(true)
      }
    }

    // ── the lifecycle ────────────────────────────────────────
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => run(autosave), AUTOSAVE_MS)
    }
    const onEdit = () => {
      if (viewing.value) return
      store.patchNote({ title: title.value, body: body.value })
      state.value = 'typing'
      schedule()
    }

    // THE AUTHORING CATCH (2026-10-31). One scope per SITTING with a note
    // (a new note, an opened one, a restore — each a fresh baseline: the
    // links already in it are not new); an open version is its own,
    // read-only scope. The owner authors here, so the duplicate check asks
    // as the acting entity.
    const sitting = ref(0)
    const padScope = () => (viewing.value ? `v${viewing.value.id}` : `s${sitting.value}`)
    const insertAtBodyCaret = (t) => {
      const el = bodyEl.value
      const v = body.value || ''
      const s = el ? el.selectionStart : v.length
      const e = el ? el.selectionEnd : v.length
      body.value = v.slice(0, s) + t + v.slice(e)
      onEdit()
      nextTick(() => { if (el) { const at = s + t.length; el.setSelectionRange(at, at) } })
    }
    const catcher = useLinkCatch({
      scope: padScope,
      text: () => body.value || '',
      setText: (next, k, caret) => {
        if (k !== padScope() || viewing.value) return
        body.value = next
        onEdit()
        nextTick(() => { const el = bodyEl.value; if (el && caret != null) { el.focus(); el.setSelectionRange(caret, caret) } })
      },
      author: () => auth.entityId || null,
      insertAtCaret: insertAtBodyCaret
    })
    const onPaste = (e) => { if (!viewing.value) catcher.onPaste(e) }

    const mintOrigin = async () => {
      const n = store.note
      if (!store.noteHasWork || n.nodeId) return null
      state.value = 'saving'
      const r = await uploadCapture(new Blob([n.body || ''], { type: 'text/markdown' }), fileNameOf(n.title), 'notepad')
      const node = r.nodes?.[0]
      if (!r.success || !node) {
        state.value = 'error'
        errorText.value = r.error?.message || r.errors?.[0]?.message || 'Could not save the note'
        return null
      }
      store.patchNote({ nodeId: node.id, savedTitle: n.title, savedBody: n.body })
      lastDraftBody = n.body
      state.value = 'saved'
      errorText.value = ''
      recordAct('CREATE_NOTE', node, fileNameOf(n.title))
      emit('created', [node], 'edit_note', !!r.labeling)
      loadNotes(true)
      return node
    }

    const autosave = async () => {
      if (viewing.value) return
      const n = store.note
      if (!n.nodeId) { await mintOrigin(); return }
      if (n.body === lastDraftBody) { state.value = store.noteDirty ? 'saved' : 'saved'; return }
      state.value = 'saving'
      try {
        const r = await nodeService.saveDraft(n.nodeId, { content: n.body })
        if (r.success) { lastDraftBody = n.body; state.value = 'draft'; errorText.value = '' } else { state.value = 'error'; errorText.value = r.error?.message || 'Draft not saved' }
      } catch (e) {
        state.value = 'error'
        errorText.value = e?.response?.data?.error?.message || e?.message || 'Draft not saved'
      }
    }

    // A VERSION: the sitting's result, minted once. No-op unless the note
    // moved since the last version (the server would happily mint an
    // identical file otherwise).
    const version = async (reason) => {
      clearTimeout(timer)
      const n = store.note
      if (!n.nodeId) { await mintOrigin(); return }
      if (!store.noteDirty) return
      state.value = 'saving'
      try {
        const r = await nodeService.update(n.nodeId, { content: n.body, filename: fileNameOf(n.title) })
        if (r.success && r.node) {
          store.patchNote({ nodeId: r.node.id, savedTitle: n.title, savedBody: n.body })
          lastDraftBody = n.body
          state.value = 'saved'
          errorText.value = ''
          recordAct('VERSION_NOTE', r.node, fileNameOf(n.title))
          emit('created', [r.node], 'history')
          if (history.value) loadVersions()
          else loadNotes(true)
        } else {
          state.value = 'error'
          errorText.value = r.error?.message || 'Version not saved'
        }
      } catch (e) {
        state.value = 'error'
        errorText.value = e?.response?.data?.error?.message || e?.message || 'Version not saved'
      }
    }

    const newNote = async () => {
      await run(() => version('new'))
      leaveVersion()
      history.value = false
      store.resetNote()
      title.value = ''
      body.value = ''
      sitting.value++
      lastDraftBody = ''
      state.value = 'new'
      errorText.value = ''
      await nextTick()
      bodyEl.value?.focus()
      loadNotes(true)
    }

    const openNote = async (n) => {
      if (!n?.id || n.id === store.note.nodeId) return
      await run(() => version('switch'))
      leaveVersion()
      let node = n
      try {
        const r = await nodeService.get(n.id)
        if (r.success && r.node) node = r.node
      } catch (_) { /* the row's excerpt is the fallback */ }
      const t = titleOf(node)
      const b = node.file?.text || ''
      // The head may carry an in-flight draft from an earlier sitting — the
      // body the owner last typed, not yet versioned.
      let draftBody = null
      try {
        const d = await nodeService.getDraft(node.id)
        if (d.success && d.draft && typeof d.draft.content === 'string') draftBody = d.draft.content
      } catch (_) { /* no draft */ }
      store.resetNote()
      store.patchNote({ nodeId: node.id, title: t, body: draftBody ?? b, savedTitle: t, savedBody: b })
      title.value = t
      body.value = draftBody ?? b
      sitting.value++
      lastDraftBody = draftBody ?? b
      state.value = 'saved'
      errorText.value = ''
      history.value = false
    }

    const viewVersion = (v, i) => {
      if (!v) return
      if (v.id === store.note.nodeId) { leaveVersion(); return }
      viewing.value = v
      viewingIndex.value = i + 1
      title.value = titleOf(v)
      body.value = v.file?.text || ''
    }
    const leaveVersion = () => {
      if (!viewing.value) return
      viewing.value = null
      title.value = store.note.title
      body.value = store.note.body
    }
    const restoreVersion = async () => {
      const v = viewing.value
      if (!v) return
      const t = titleOf(v)
      const b = v.file?.text || ''
      viewing.value = null
      store.patchNote({ title: t, body: b })
      title.value = t
      body.value = b
      sitting.value++
      await run(() => version('restore'))
    }

    // Leaving the face (mode switch, minimize, close) ends the sitting —
    // the version mints on the way out. The store keeps the note, so the
    // face comes back on it.
    onMounted(() => {
      loadNotes(true)
      if (!store.note.nodeId && store.noteHasWork) schedule()
    })
    onBeforeUnmount(() => {
      clearTimeout(timer)
      run(() => version('leave'))
    })

    watch(() => store.note.nodeId, (id) => { if (!id) history.value = false })

    return {
      store,
      bodyEl,
      gridEl,
      title,
      body,
      stateText,
      stateTitle,
      history,
      notes,
      total,
      loading,
      versions,
      viewing,
      viewingIndex,
      onEdit,
      onPaste,
      catcher,
      newNote,
      version,
      toggleHistory,
      openNote,
      viewVersion,
      leaveVersion,
      restoreVersion,
      onScroll,
      titleOf,
      excerptOf,
      whenOf
    }
  }
})
</script>

<style lang="scss" scoped>
.pad {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
}
.pad__head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.pad__title {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dock-rule, var(--teal-7));
  border-radius: 4px;
  background: var(--paper-card);
  color: var(--ink-1);
  font-size: 0.8em;
  letter-spacing: 0.04em;
  outline: none;
  &:focus { border-color: var(--dock-rule-strong, var(--teal-9)); }
  &:read-only { background: var(--dock-well, var(--teal-1)); }
}
.pad__state {
  font-size: 0.62em;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dock-ink-mute, var(--teal-4));
  white-space: nowrap;
}
.pad__tool {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid var(--dock-rule, var(--teal-7));
  background: var(--dock-well, var(--teal-1));
  color: var(--dock-ink, var(--teal-7));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover:not(:disabled) { background: var(--paper-card); }
  &:disabled { opacity: 0.35; cursor: default; }
  &.is-on { background: var(--dock-ink, var(--teal-7)); color: #fff; }
}
.pad__body {
  flex: 3 1 0;
  min-height: 120px;
  width: 100%;
  resize: none;
  padding: 10px 12px;
  border: 1px solid var(--dock-rule, var(--teal-7));
  border-radius: var(--radius-md);
  background: var(--paper-card);
  color: var(--ink-1);
  font-size: 0.8em;
  line-height: 1.5;
  outline: none;
  &:focus { border-color: var(--dock-rule-strong, var(--teal-9)); }
  &:read-only { background: var(--dock-well, var(--teal-1)); }
}
.pad__viewing {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.7em;
  color: var(--dock-ink, var(--teal-7));
}
.pad__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--dock-rule-strong, var(--teal-9));
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}
.pad__grid-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-shrink: 0;
}
.pad__grid-label {
  font-size: 0.66em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dock-ink, var(--teal-7));
}
.pad__grid-count {
  font-size: 0.62em;
  color: var(--dock-ink-mute, var(--teal-4));
}
// THE GRID — the owner's notes as tiles; in HISTORY it CHANGES COLOUR (the
// ask): the pale well deepens to the family's teal-2 wash and the tiles'
// rims follow, so the same grid plainly shows a different list.
.pad__grid {
  flex: 2 1 0;
  min-height: 90px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  grid-auto-rows: max-content;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--dock-rule, var(--teal-7));
  background: var(--dock-well, var(--teal-1));
  transition: background 0.2s, border-color 0.2s;
  position: relative;
}
.is-history .pad__grid {
  background: color-mix(in srgb, var(--teal-4, #4db6ac) 38%, var(--dock-well, var(--teal-1)));
  border-color: var(--dock-rule-strong, var(--teal-9));
}
.pad__cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 9px;
  min-height: 74px;
  text-align: left;
  border: 1px solid var(--dock-rule, var(--teal-7));
  border-radius: 6px;
  background: var(--paper-card);
  color: var(--ink-1);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
  &:hover { border-color: var(--dock-rule-strong, var(--teal-9)); }
  &.is-current { box-shadow: inset 0 2px 0 var(--dock-ink, var(--teal-7)); }
  &.is-viewing { background: var(--teal-1); border-color: var(--dock-rule-strong, var(--teal-9)); }
}
.pad__cell-n {
  font-size: 0.6em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dock-rule-strong, var(--teal-9));
}
.pad__cell-title {
  font-size: 0.76em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pad__cell-excerpt {
  font-size: 0.68em;
  line-height: 1.35;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pad__cell-when {
  margin-top: auto;
  font-size: 0.6em;
  color: var(--dock-ink-mute, var(--teal-4));
}
.pad__empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px;
  font-size: 0.72em;
  color: var(--dock-ink-mute, var(--teal-4));
}
.pad__spin {
  grid-column: 1 / -1;
  justify-self: center;
  color: var(--dock-ink, var(--teal-7));
}
</style>
