<template>
  <!-- The platform's markdown editor — TWO LAYOUTS since 2026-09-26 (user ask:
       "render and manage the markdown both in the same place so I can
       seamlessly look at what my post is going to look like. Create the raw
       view as a different layout, with only the raw data being displayed as
       plainly as possible"):

         live  (default) the document RENDERED block by block through
               MarkdownBody — the post as it will read, chips and minis
               included — with the ONE block under the caret open as its own
               markdown source, in place. Click a block to open it where you
               clicked; click the room under the last block to start a new
               one; Esc or a click elsewhere closes it and the block renders
               again. ↑ ↓ ← → at a block's edges walk to its neighbours,
               Backspace at a block's start / Delete at its end join it with
               the neighbour.
         raw   the whole source in one bare mono textarea. Nothing else: no
               format bar, no counter — the raw data, as plainly as possible.

       The layout is the reader's standing preference (localStorage, the
       skeleton grid's precedent), not the host's. The document is ONE string
       throughout: `splitBlocks` (utils/markdownBlocks) cuts it at marked's
       own block boundaries and `joinBlocks` is its exact inverse, so what the
       host receives on every keystroke is the same markdown the raw layout
       shows — the live layout never holds state the raw one cannot see.
       Edit │ Split │ Preview (2026-07 → 09-26) are gone; the old `initialMode`
       values still read ('edit' → raw, 'split' / 'preview' → live). -->
  <div ref="root" class="note-editor" :class="'layout--' + layout" :style="{ height: height }">

    <!-- Top bar: the layout switch left, count + Save right -->
    <div class="note-bar">
      <div class="note-bar-left">
        <q-btn-toggle
          v-model="layout"
          class="note-layout"
          dense unelevated no-caps
          toggle-color="primary"
          color="transparent"
          text-color="blue-grey-8"
          :options="[
            { value: 'live', slot: 'live' },
            { value: 'raw',  slot: 'raw' }
          ]"
          style="border: 1px solid rgba(var(--ink-rgb), 0.25); border-radius: 6px;"
        >
          <template #live>
            <q-icon name="edit_note" size="14px" /><span class="q-ml-xs" style="font-size:0.8em;">Live</span>
          </template>
          <template #raw>
            <q-icon name="code" size="14px" /><span class="q-ml-xs" style="font-size:0.8em;">Raw</span>
          </template>
        </q-btn-toggle>
      </div>

      <div class="note-bar-right">
        <span v-if="layout === 'live'" class="text-dim" style="font-size:0.72em; margin-right:12px;">
          {{ wordCount }} words · {{ charCount }} chars
        </span>
        <q-btn
          v-if="showSave"
          unelevated dense no-caps
          color="primary"
          label="Save"
          icon="save"
          size="sm"
          :loading="saving"
          :disable="!dirty"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Formatting toolbar — the live layout's. `mousedown.prevent` keeps the
         open block's field focused while a button is pressed: a focus move
         would close the block before the button's edit could land in it. -->
    <div v-if="layout === 'live'" class="format-bar" @mousedown.prevent>
      <q-btn flat dense round size="sm" @click="wrap('**','**')"    title="Bold">       <strong>B</strong>   </q-btn>
      <q-btn flat dense round size="sm" @click="wrap('*','*')"     title="Italic">      <em>I</em>           </q-btn>
      <q-btn flat dense round size="sm" @click="wrap('`','`')"     title="Inline code"> <span class="mono">`</span> </q-btn>
      <q-btn flat dense round size="sm" @click="insertBlock('```\n','\n```')" title="Code block">
        <q-icon name="code" size="14px" />
      </q-btn>
      <div class="format-sep" />
      <q-btn flat dense round size="sm" @click="insertLine('# ')"   title="H1"> <span style="font-size:.9em;">H1</span> </q-btn>
      <q-btn flat dense round size="sm" @click="insertLine('## ')"  title="H2"> <span style="font-size:.9em;">H2</span> </q-btn>
      <q-btn flat dense round size="sm" @click="insertLine('### ')" title="H3"> <span style="font-size:.9em;">H3</span> </q-btn>
      <div class="format-sep" />
      <q-btn flat dense round size="sm" @click="insertLine('- ')"   title="Bullet list">  <q-icon name="format_list_bulleted" size="14px" /> </q-btn>
      <q-btn flat dense round size="sm" @click="insertLine('1. ')"  title="Ordered list"> <q-icon name="format_list_numbered" size="14px" /> </q-btn>
      <q-btn flat dense round size="sm" @click="insertLine('> ')"   title="Blockquote">   <q-icon name="format_quote" size="14px" />          </q-btn>
      <div class="format-sep" />
      <q-btn flat dense round size="sm" @click="insertLink"  title="Link">  <q-icon name="link" size="14px" /> </q-btn>
      <q-btn flat dense round size="sm" @click="insertHR"    title="Divider"> <q-icon name="horizontal_rule" size="14px" /> </q-btn>
      <div class="format-sep" />
      <!-- Table / skeleton (skeletons plan phase 3, 2026-09-01): the host
           owns what happens — the post maker drops a draft grid into the
           draft and a placeholder token at the caret; the editor itself
           knows nothing about skeletons. -->
      <q-btn flat dense round size="sm" title="Table / skeleton — keys are labels, cells are content" @click="$emit('insert-skeleton')">
        <q-icon name="table_chart" size="14px" />
      </q-btn>
    </div>

    <div class="note-panes">

      <!-- RAW — the source, bare -->
      <div v-if="layout === 'raw'" class="editor-pane">
        <textarea
          ref="textareaRef"
          class="note-textarea mono"
          :value="localValue"
          placeholder="Write in markdown…"
          spellcheck="false"
          @keydown="onRawKeydown"
          @input="onRawInput"
        />
      </div>

      <!-- LIVE — rendered blocks, the open one as its source. The pane
           carries the preview's dense type (`.md-preview`, below) and the
           platform's markdown palette (`.md-rendered`, global) so every
           block reads exactly as the split preview used to. -->
      <div v-else class="live-pane md-preview md-rendered">
        <template v-for="(b, i) in blocks" :key="b.id">
          <textarea
            v-if="i === active"
            class="live-field"
            :value="b.text"
            rows="1"
            placeholder="Write in markdown…"
            spellcheck="false"
            @input="onFieldInput"
            @keydown="onFieldKeydown"
            @blur="onFieldBlur"
          />
          <div
            v-else-if="!isHiddenBlock(b)"
            class="live-block"
            :class="'live-block--' + b.type"
            @mousedown="onBlockDown(i, $event)"
          >
            <MarkdownBody :text="renderText(b)" ref-display="auto" />
          </div>
        </template>
        <!-- The room after the last block: press it to start a new one. -->
        <div class="live-tail" @mousedown.prevent="openTail()">
          <span v-if="active === null && !hasContent" class="live-tail__hint">Write in markdown…</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { splitBlocks, joinBlocks, isHiddenBlock, defsOf, locateOffset, offsetOf } from 'src/utils/markdownBlocks'

// The reader's standing layout — one key for every NoteEditor on the
// platform (post maker, comment composers, the node editor): how one writes
// markdown is a preference of the writer, not of the window.
const LAYOUT_KEY = 'pathos_note_layout'
const asLayout = (v) => ((v === 'raw' || v === 'edit') ? 'raw' : 'live')

// A press on one of these inside a rendered block is the thing's own click
// (a chip's door, a mini's editable key, a link) — never "open this block".
const INTERACTIVE = 'a, button, input, textarea, select, [contenteditable="true"], .pathos-ref-slot, .pathos-ref-embed'

export default defineComponent({
  name: 'NoteEditor',
  components: { MarkdownBody },
  emits: ['update:modelValue', 'save', 'insert-skeleton'],

  props: {
    modelValue: { type: String, default: '' },
    showSave: { type: Boolean, default: true },
    saving: { type: Boolean, default: false },
    // The layout when the writer has no standing preference yet: 'live' |
    // 'raw'. The pre-2026-09-26 values still read ('edit' → raw, the rest → live).
    initialMode: { type: String, default: 'live' },
    height: { type: String, default: '520px' }
  },

  setup (props, { emit }) {
    const root = ref(null)
    const textareaRef = ref(null)
    const localValue = ref(props.modelValue || '')
    const dirty = ref(false)

    // ── THE LAYOUT ────────────────────────────────────────────────────────
    const loadLayout = () => {
      try {
        const v = localStorage.getItem(LAYOUT_KEY)
        if (v === 'raw' || v === 'live') return v
      } catch (_) { /* preference only */ }
      return asLayout(props.initialMode)
    }
    const layout = ref(loadLayout())

    // ── THE BLOCKS ────────────────────────────────────────────────────────
    // [{ id, text, tail, type }] — `joinBlocks(blocks) === localValue`, always.
    // `active` is the index of the open block (its field replaces its render).
    let nextId = 1
    const blocks = ref([])
    const active = ref(null)

    // Re-cut the document. A block whose text survived keeps its id, so its
    // rendered element — and the chips MarkdownBody seated in it — stays
    // mounted instead of re-rendering (and re-probing) on every close.
    const cut = (src) => {
      const pool = blocks.value.slice()
      return splitBlocks(src).map(b => {
        const i = pool.findIndex(p => p.text === b.text)
        const id = i >= 0 ? pool.splice(i, 1)[0].id : nextId++
        return { ...b, id }
      })
    }
    blocks.value = cut(localValue.value)

    const hasContent = computed(() => localValue.value.trim().length > 0)
    const defsText = computed(() => defsOf(blocks.value))
    // A block renders with the document's link definitions appended (a def
    // renders to nothing) so `[text][id]` in one block still resolves to its
    // `[id]: url` in another. Not for code blocks — an unclosed fence would
    // swallow the defs into the code.
    const renderText = (b) => (defsText.value && b.type !== 'code') ? b.text + '\n\n' + defsText.value : b.text

    const emitUp = () => { dirty.value = true; emit('update:modelValue', localValue.value) }
    const syncFromBlocks = () => { localValue.value = joinBlocks(blocks.value) }

    // An external value — the host swapped a ⟪skeleton⟫ token for its chip,
    // a draft restored: re-cut and close whatever was open.
    watch(() => props.modelValue, (v) => {
      if (v === localValue.value) return
      localValue.value = v || ''
      blocks.value = cut(localValue.value)
      active.value = null
      dirty.value = false
    })

    // ── THE OPEN BLOCK ────────────────────────────────────────────────────
    const fieldEl = () => root.value?.querySelector('textarea.live-field') || null
    // The field grows with its text — the pane scrolls, the field never does.
    const grow = (el) => {
      if (!el) return
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }

    const activate = async (i, caret = null, focus = true) => {
      if (i == null || i < 0 || i >= blocks.value.length) return
      active.value = i
      await nextTick()
      const el = fieldEl()
      if (!el) return
      grow(el)
      if (!focus) return
      el.focus()
      const c = caret == null ? el.value.length : Math.min(caret, el.value.length)
      el.setSelectionRange(c, c)
    }

    // Close the open block: the document re-cuts at the grammar's own
    // boundaries, so a block that grew a blank line is two blocks now, a
    // `#` typed in front of a paragraph made it a heading, and so on.
    const closeActive = () => {
      if (active.value === null) return
      active.value = null
      blocks.value = cut(localValue.value)
    }

    // Move the caret to block `i` at `caret`. The target is re-found by SOURCE
    // OFFSET after the re-cut: closing the current block can split or merge
    // the list and move every index after it.
    let switching = false
    const switchTo = async (i, caret = 0) => {
      const b = blocks.value[i]
      if (!b) return
      const off = offsetOf(blocks.value, i) + Math.min(caret, b.text.length)
      switching = true
      active.value = null
      blocks.value = cut(localValue.value)
      const loc = locateOffset(blocks.value, off)
      if (loc) await activate(loc.index, loc.caret)
      switching = false
    }

    // Start a new block after the last one (or take the empty one already
    // there). The new block is `fresh`: it owes the blank line that separates
    // it from the block above, and pays it on its first keystroke (`settle`)
    // — so opening the tail and writing nothing leaves the document exactly
    // as it was, and the raw layout never shows a separator nobody typed.
    const openTail = async (focus = true) => {
      const open = active.value
      const list = blocks.value
      if (open !== null && open === list.length - 1 && !list[open].text) {
        if (focus) fieldEl()?.focus()
        return
      }
      if (open !== null) closeActive()
      const cur = blocks.value
      const last = cur[cur.length - 1]
      if (last && !last.text) { await activate(cur.length - 1, 0, focus); return }
      cur.push({ id: nextId++, text: '', tail: '', type: 'paragraph', fresh: true })
      await activate(cur.length - 1, 0, focus)
    }

    // A fresh block's first write: the block above gets the blank line that
    // makes this one its own paragraph (a joined "abcdef" otherwise).
    const settle = (i) => {
      const b = blocks.value[i]
      if (!b || !b.fresh) return
      delete b.fresh
      const prev = blocks.value[i - 1]
      if (!prev) return
      const joined = prev.text + prev.tail
      if (!/\n[ \t]*\r?\n$/.test(joined)) prev.tail += joined.endsWith('\n') ? '\n' : '\n\n'
    }

    const onFieldInput = (e) => {
      const b = blocks.value[active.value]
      if (!b) return
      settle(active.value)
      b.text = e.target.value
      grow(e.target)
      syncFromBlocks()
      emitUp()
    }

    // Deferred a tick: a format-bar press never blurs (mousedown.prevent), a
    // block or tail press moves the focus itself; anything else closes.
    const onFieldBlur = () => {
      setTimeout(() => {
        if (switching) return
        const el = fieldEl()
        if (el && document.activeElement === el) return
        closeActive()
      }, 0)
    }

    // Where in the block's SOURCE a press on its RENDER landed. The rendered
    // text before the pointer is mapped onto the source by its tail: both
    // sides are keyed with whitespace and markdown punctuation removed (so
    // `**bold**` meets "bold" and a soft break meets its <br>), the search
    // starts near the proportional position (a repeated phrase lands on the
    // right copy) and tries the longest suffix first (24 → 3 chars). Chip
    // labels are not in the source, so the shorter suffixes catch the prose
    // before a chip; when nothing matches, the caret goes to the block's end.
    const KEY_STRIP = /[\s*_`~[\]!#>|\\]/g
    const caretFromPoint = (blockEl, x, y, raw) => {
      let node = null
      let offset = 0
      try {
        if (document.caretPositionFromPoint) {
          const p = document.caretPositionFromPoint(x, y)
          if (p) { node = p.offsetNode; offset = p.offset }
        } else if (document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(x, y)
          if (r) { node = r.startContainer; offset = r.startOffset }
        }
      } catch (_) { /* no caret api — end of block */ }
      if (!node || !blockEl.contains(node)) return raw.length
      const range = document.createRange()
      try {
        range.setStart(blockEl, 0)
        range.setEnd(node, offset)
      } catch (_) { return raw.length }
      const prefixKey = range.toString().replace(KEY_STRIP, '')
      if (!prefixKey) return 0
      const fullKey = (blockEl.textContent || '').replace(KEY_STRIP, '')
      // The source keyed the same way, each key char remembering its offset.
      const idx = []
      let plain = ''
      for (let i = 0; i < raw.length; i++) {
        if (KEY_STRIP.test(raw[i])) { KEY_STRIP.lastIndex = 0; continue }
        plain += raw[i]
        idx.push(i)
      }
      const guess = fullKey.length ? Math.floor(plain.length * prefixKey.length / fullKey.length) : 0
      for (const n of [24, 16, 10, 6, 3]) {
        const s = prefixKey.slice(-n)
        if (s.length < 2) continue
        let at = plain.indexOf(s, Math.max(0, guess - s.length - 8))
        if (at < 0) at = plain.indexOf(s)
        if (at >= 0) return idx[at + s.length - 1] + 1
      }
      return raw.length
    }

    const onBlockDown = (i, e) => {
      if (e.button !== 0) return
      if (e.target.closest(INTERACTIVE)) return
      e.preventDefault()
      switchTo(i, caretFromPoint(e.currentTarget, e.clientX, e.clientY, blocks.value[i].text))
    }

    // ── KEYS IN THE OPEN BLOCK ────────────────────────────────────────────
    const prevVisible = (i) => { for (let k = i - 1; k >= 0; k--) if (!isHiddenBlock(blocks.value[k])) return k; return -1 }
    const nextVisible = (i) => { for (let k = i + 1; k < blocks.value.length; k++) if (!isHiddenBlock(blocks.value[k])) return k; return -1 }
    // ↑ on the first source line of a paragraph that WRAPS should move up a
    // visual line, not leave the block — so the edge walk only fires from a
    // single-line field (or from the very start / end of the text).
    const isSingleVisualLine = (el) => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 20
      return el.clientHeight < lh * 1.6
    }

    // Join two ADJACENT blocks into one (no separator — the caret was on the
    // seam) and keep writing at the seam. A hidden block between them (a
    // link definition) is never joined over: the walk moves instead.
    const join = async (a, b) => {
      const A = blocks.value[a]
      const B = blocks.value[b]
      if (!A || !B || b !== a + 1) { await switchTo(b === a + 1 ? b : a, 0); return }
      const caret = A.text.length
      blocks.value.splice(a, 2, { id: A.id, text: A.text + B.text, tail: B.tail, type: A.type })
      syncFromBlocks()
      emitUp()
      await activate(a, caret)
    }

    // Tab → two spaces, in either layout's field.
    const indentAt = (el) => {
      const s = el.selectionStart
      const v = el.value
      setValueOf(el, v.slice(0, s) + '  ' + v.slice(el.selectionEnd))
      nextTick(() => el.setSelectionRange(s + 2, s + 2))
    }
    // Write a textarea's new value into the model behind it.
    const setValueOf = (el, v) => {
      if (el.classList.contains('live-field')) {
        const b = blocks.value[active.value]
        if (!b) return
        settle(active.value)
        b.text = v
        syncFromBlocks()
        nextTick(() => grow(el))
      } else {
        localValue.value = v
      }
      emitUp()
    }

    const onFieldKeydown = (e) => {
      const el = e.target
      const i = active.value
      if (e.key === 'Escape') { e.preventDefault(); el.blur(); return }
      if (e.key === 'Tab') { e.preventDefault(); indentAt(el); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); return }
      if (i === null || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return
      const v = el.value
      const s = el.selectionStart
      if (s !== el.selectionEnd) return
      const atStart = s === 0
      const atEnd = s === v.length
      const firstLine = atStart || v.lastIndexOf('\n', s - 1) === -1
      const lastLine = atEnd || v.indexOf('\n', s) === -1
      if (e.key === 'ArrowUp' && (atStart || (firstLine && isSingleVisualLine(el)))) {
        const p = prevVisible(i)
        if (p >= 0) { e.preventDefault(); switchTo(p, blocks.value[p].text.length) }
        return
      }
      if (e.key === 'ArrowDown' && (atEnd || (lastLine && isSingleVisualLine(el)))) {
        const n = nextVisible(i)
        if (n >= 0) { e.preventDefault(); switchTo(n, 0) }
        return
      }
      if (e.key === 'ArrowLeft' && atStart) {
        const p = prevVisible(i)
        if (p >= 0) { e.preventDefault(); switchTo(p, blocks.value[p].text.length) }
        return
      }
      if (e.key === 'ArrowRight' && atEnd) {
        const n = nextVisible(i)
        if (n >= 0) { e.preventDefault(); switchTo(n, 0) }
        return
      }
      if (e.key === 'Backspace' && atStart) {
        const p = prevVisible(i)
        if (p >= 0) { e.preventDefault(); join(p, i) }
        return
      }
      if (e.key === 'Delete' && atEnd) {
        const n = nextVisible(i)
        if (n >= 0) { e.preventDefault(); join(i, n) }
      }
    }

    // ── RAW ───────────────────────────────────────────────────────────────
    const onRawInput = (e) => { localValue.value = e.target.value; emitUp() }
    const onRawKeydown = (e) => {
      if (e.key === 'Tab') { e.preventDefault(); indentAt(e.target); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }

    watch(layout, (v) => {
      try { localStorage.setItem(LAYOUT_KEY, v) } catch (_) { /* preference only */ }
      active.value = null
      if (v === 'live') {
        blocks.value = cut(localValue.value)
        if (!blocks.value.length) openTail(false)
      }
    })

    // An empty document opens its first block at once (unfocused — the
    // field must not take the focus from the title above it), so the live
    // layout's empty state is the same placeholder box the raw one shows.
    onMounted(() => { if (layout.value === 'live' && !blocks.value.length) openTail(false) })

    // ── COUNTS + SAVE ─────────────────────────────────────────────────────
    const wordCount = computed(() => {
      const text = localValue.value.trim()
      return text ? text.split(/\s+/).length : 0
    })
    const charCount = computed(() => localValue.value.length)
    const handleSave = () => {
      emit('save', localValue.value)
      dirty.value = false
    }

    // ── FORMATTING ────────────────────────────────────────────────────────
    // Every action works on "the field": the raw textarea, or the open
    // block's field — opened at the end of the document first when none is.
    const field = () => {
      if (layout.value === 'raw') {
        const el = textareaRef.value
        return el ? { el, get: () => localValue.value, set: (v) => { localValue.value = v } } : null
      }
      const el = fieldEl()
      if (active.value === null || !el) return null
      return {
        el,
        get: () => blocks.value[active.value].text,
        set: (v) => { settle(active.value); blocks.value[active.value].text = v; syncFromBlocks() }
      }
    }
    const ensureField = async () => {
      let f = field()
      if (!f && layout.value === 'live') { await openTail(); f = field() }
      return f
    }
    // `fn(value, selStart, selEnd)` → { value, start, end }: the field's new
    // text and the caret to leave in it.
    const edit = async (fn) => {
      const f = await ensureField()
      if (!f) return
      const { el } = f
      const r = fn(f.get(), el.selectionStart, el.selectionEnd)
      f.set(r.value)
      emitUp()
      await nextTick()
      if (el.classList.contains('live-field')) grow(el)
      el.focus()
      el.setSelectionRange(r.start, r.end)
    }

    const wrap = (before, after) => edit((v, s, e) => {
      const sel = v.slice(s, e) || 'text'
      const c = s + before.length + sel.length + after.length
      return { value: v.slice(0, s) + before + sel + after + v.slice(e), start: c, end: c }
    })
    const insertBlock = (before, after) => edit((v, s, e) => {
      const sel = v.slice(s, e)
      return { value: v.slice(0, s) + before + sel + after + v.slice(e), start: s + before.length, end: s + before.length + sel.length }
    })
    const insertLine = (prefix) => edit((v, s) => {
      const ls = v.lastIndexOf('\n', s - 1) + 1
      const c = s + prefix.length
      return { value: v.slice(0, ls) + prefix + v.slice(ls), start: c, end: c }
    })
    const insertLink = () => edit((v, s, e) => {
      const ins = '[' + (v.slice(s, e) || 'link text') + '](url)'
      const c = s + ins.length
      return { value: v.slice(0, s) + ins + v.slice(e), start: c, end: c }
    })
    const insertHR = () => edit((v, s) => {
      const ins = '\n\n---\n\n'
      return { value: v.slice(0, s) + ins + v.slice(s), start: s + ins.length, end: s + ins.length }
    })
    // The host drops [[pathos:…]] chips and ⟪skeleton⟫ tokens through this
    // template-ref method: at the caret of the open block, or — none open —
    // into a fresh block at the end of the document.
    const insertText = (text) => edit((v, s, e) => {
      const c = s + text.length
      return { value: v.slice(0, s) + text + v.slice(e), start: c, end: c }
    })

    return {
      root,
      textareaRef,
      localValue,
      layout,
      blocks,
      active,
      dirty,
      hasContent,
      isHiddenBlock,
      renderText,
      wordCount,
      charCount,
      onRawInput,
      onRawKeydown,
      onFieldInput,
      onFieldKeydown,
      onFieldBlur,
      onBlockDown,
      openTail,
      handleSave,
      wrap,
      insertBlock,
      insertLine,
      insertLink,
      insertHR,
      insertText
    }
  }
})
</script>

<style lang="scss" scoped>
// Same color story as the subject panels (labels/node/post viewers):
// chrome-toned bars around a white "paper" writing surface, hairline rules,
// ink text. Tokens mirror .subject-panel so the editor reads as family.
.note-editor {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;

  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow: hidden;
  /* height is set via :style binding from the height prop */
}

.note-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  flex-shrink: 0;
}

.note-bar-left,
.note-bar-right { display: flex; align-items: center; gap: 8px; }

.format-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  color: var(--ink);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.format-sep {
  width: 1px;
  height: 16px;
  background: rgba(var(--ink-rgb), 0.18);
  margin: 0 4px;
}

.note-panes {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0; /* allow shrink in a known-height parent */
}

// ── RAW ──
.editor-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column; /* textarea must fill HEIGHT, not just width */
  overflow: hidden;
}

// THE RAW FACE IS THE HASH FACE — Space Mono, stated here as it always was.
// ⚠ Deliberately NOT the creation windows' input dial (`--input-font`,
// `_components.scss` § THE INPUT FACE): "keep raw text with the distinctive
// font it already has" (2026-09-26). This scoped class rule outranks the
// windows' element selectors on its own; no exception is written there.
.note-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.85em;
  line-height: 1.6;
  padding: 10px 14px;
  caret-color: var(--ink);

  &::placeholder { color: var(--ink-mute); }
}

// ── LIVE ──
// The pane owns the scroll; blocks and the open field stack in it as a
// column, the tail taking whatever room is left so a press anywhere under
// the last block starts a new one.
.live-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 10px 0;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

// A rendered block: the post's own type, and a 2px left rule that lights
// under the pointer — the one mark that says "press to open".
.live-block {
  flex: 0 0 auto;
  padding: 0 8px;
  border-left: 2px solid transparent;
  border-radius: 4px;
  cursor: text;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: rgba(var(--ink-rgb), 0.03);
    border-left-color: rgba(var(--ink-rgb), 0.22);
  }
}

// The open block's field: same measure and type as the blocks around it
// (`font: inherit` takes the pane's), the rule lit in the host's tone —
// `--q-primary`, which the post maker re-dials to its contrast (see
// PostMakerSurface) — and the letters in the window's INPUT FACE where the
// window declares one (`--input-font`, the creation windows), the pane's
// own face where it does not (the node editor page).
.live-field {
  flex: 0 0 auto;
  display: block;
  width: 100%;
  box-sizing: border-box;
  min-height: 1.8em;
  margin: 0 0 0.6em;
  padding: 3px 8px;
  resize: none;
  overflow: hidden;
  border: none;
  border-left: 2px solid var(--q-primary, var(--ink));
  border-radius: 4px;
  outline: none;
  background: rgba(var(--ink-rgb), 0.035);
  color: var(--ink);
  font: inherit;
  font-family: var(--input-font, inherit);
  line-height: inherit;
  caret-color: var(--ink);

  &::placeholder { color: var(--ink-mute); }
}

.live-tail {
  flex: 1 0 auto;
  min-height: 44px;
  cursor: text;
}
.live-tail__hint {
  display: block;
  padding: 4px 10px;
  color: var(--ink-mute);
}

// --- Markdown type in the live pane ---
// Colors come from the global .md-rendered class (same pipeline as the
// viewers), so the blocks match what the saved note will look like.
// Only sizing is adjusted here — DENSE sizing (maker retouch, 2026-08-02):
// the pane is a working proof inside a half-dock column, not the reading
// surface, so headings step down hard (a full-scale h1 ate half the pane)
// and the vertical rhythm tightens. Per-block rendering makes EVERY heading
// the first child of its own block, so the first-heading margin reset is
// scoped to the pane's first block, where it always applied.
.md-preview {
  font-size: 0.82em;
  line-height: 1.55;

  :deep(h1) { font-size: 1.45em; margin: 0.5em 0 0.35em; }
  :deep(h2) { font-size: 1.28em; margin: 0.5em 0 0.3em; }
  :deep(h3) { font-size: 1.12em; margin: 0.45em 0 0.25em; }
  :deep(h4), :deep(h5), :deep(h6) { font-size: 1em; margin: 0.4em 0 0.2em; }
  .live-block:first-child :deep(h1),
  .live-block:first-child :deep(h2),
  .live-block:first-child :deep(h3) { margin-top: 0; }
  :deep(p)  { margin: 0 0 0.6em; }
  :deep(ul), :deep(ol) { margin: 0 0 0.6em; padding-left: 1.4em; }
  :deep(hr) { margin: 0.7em 0; }
  :deep(blockquote) { margin: 0 0 0.6em; }
  :deep(pre) { margin: 0 0 0.7em; }
}
</style>
