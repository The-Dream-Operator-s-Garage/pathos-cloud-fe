<template>
  <div class="note-editor" :class="'mode--' + mode" :style="{ height: height }">

    <!-- Top bar -->
    <div class="note-bar">
      <div class="note-bar-left">
        <q-btn-toggle
          v-model="mode"
          dense unelevated no-caps
          toggle-color="primary"
          color="transparent"
          text-color="blue-grey-8"
          :options="[
            { value: 'edit',    slot: 'edit' },
            { value: 'split',   slot: 'split' },
            { value: 'preview', slot: 'preview' }
          ]"
          style="border: 1px solid rgba(var(--ink-rgb), 0.25); border-radius: 6px;"
        >
          <template #edit>
            <q-icon name="edit" size="14px" /><span class="q-ml-xs" style="font-size:0.8em;">Edit</span>
          </template>
          <template #split>
            <q-icon name="vertical_split" size="14px" /><span class="q-ml-xs" style="font-size:0.8em;">Split</span>
          </template>
          <template #preview>
            <q-icon name="visibility" size="14px" /><span class="q-ml-xs" style="font-size:0.8em;">Preview</span>
          </template>
        </q-btn-toggle>
      </div>

      <div class="note-bar-right">
        <span class="text-dim" style="font-size:0.72em; margin-right:12px;">
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

    <!-- Formatting toolbar (edit + split modes) -->
    <div v-if="mode !== 'preview'" class="format-bar">
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
    </div>

    <!-- Panes -->
    <div class="note-panes">

      <!-- Editor pane -->
      <div v-show="mode !== 'preview'" class="editor-pane">
        <textarea
          ref="textareaRef"
          v-model="localValue"
          class="note-textarea mono"
          placeholder="Write in markdown…"
          spellcheck="false"
          @keydown="handleKeydown"
          @input="onInput"
        />
      </div>

      <!-- Divider (split mode only) -->
      <div v-if="mode === 'split'" class="pane-divider" />

      <!-- Preview pane -->
      <div v-show="mode !== 'edit'" class="preview-pane">
        <MarkdownBody
          v-if="localValue.trim()"
          class="md-preview md-rendered"
          :text="localValue"
        />
        <div v-else class="text-dim" style="padding:16px; font-size:0.85em;">
          Nothing to preview yet…
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
export default defineComponent({
  name: 'NoteEditor',
  components: { MarkdownBody },
  emits: ['update:modelValue', 'save'],

  props: {
    modelValue: { type: String, default: '' },
    showSave: { type: Boolean, default: true },
    saving: { type: Boolean, default: false },
    initialMode: { type: String, default: 'split' },
    height: { type: String, default: '520px' }
  },

  setup (props, { emit }) {
    const textareaRef = ref(null)
    const localValue = ref(props.modelValue)
    const mode = ref(props.initialMode)
    const dirty = ref(false)

    // Keep in sync if parent updates the value externally
    watch(() => props.modelValue, (v) => {
      if (v !== localValue.value) {
        localValue.value = v
        dirty.value = false
      }
    })

    // Emit upstream on every keystroke
    const onInput = () => {
      dirty.value = true
      emit('update:modelValue', localValue.value)
    }

    const wordCount = computed(() => {
      const text = localValue.value.trim()
      return text ? text.split(/\s+/).length : 0
    })

    const charCount = computed(() => localValue.value.length)

    const handleSave = () => {
      emit('save', localValue.value)
      dirty.value = false
    }

    // ---- Formatting helpers ----

    const getTextarea = () => textareaRef.value

    const wrap = (before, after) => {
      const el = getTextarea()
      const start = el.selectionStart
      const end = el.selectionEnd
      const sel = localValue.value.slice(start, end)
      const replacement = before + (sel || 'text') + after
      localValue.value = localValue.value.slice(0, start) + replacement + localValue.value.slice(end)
      emit('update:modelValue', localValue.value)
      dirty.value = true
      nextTick(() => {
        el.focus()
        const newCursor = start + before.length + (sel || 'text').length + after.length
        el.setSelectionRange(newCursor, newCursor)
      })
    }

    const insertBlock = (before, after) => {
      const el = getTextarea()
      const start = el.selectionStart
      const end = el.selectionEnd
      const sel = localValue.value.slice(start, end)
      const replacement = before + (sel || '') + after
      localValue.value = localValue.value.slice(0, start) + replacement + localValue.value.slice(end)
      emit('update:modelValue', localValue.value)
      dirty.value = true
      nextTick(() => {
        el.focus()
        el.setSelectionRange(start + before.length, start + before.length + (sel || '').length)
      })
    }

    const insertLine = (prefix) => {
      const el = getTextarea()
      const start = el.selectionStart
      // Go to start of current line
      const before = localValue.value.slice(0, start)
      const lineStart = before.lastIndexOf('\n') + 1
      localValue.value = localValue.value.slice(0, lineStart) + prefix + localValue.value.slice(lineStart)
      emit('update:modelValue', localValue.value)
      dirty.value = true
      nextTick(() => {
        el.focus()
        const newPos = lineStart + prefix.length + (start - lineStart)
        el.setSelectionRange(newPos, newPos)
      })
    }

    const insertLink = () => {
      const el = getTextarea()
      const sel = localValue.value.slice(el.selectionStart, el.selectionEnd)
      wrap('[' + (sel || 'link text'), '](url)')
    }

    const insertHR = () => {
      const el = getTextarea()
      const start = el.selectionStart
      const insertion = '\n\n---\n\n'
      localValue.value = localValue.value.slice(0, start) + insertion + localValue.value.slice(start)
      emit('update:modelValue', localValue.value)
      dirty.value = true
      nextTick(() => { el.focus(); el.setSelectionRange(start + insertion.length, start + insertion.length) })
    }

    // Insert arbitrary text at the caret (replacing any selection) — the
    // maker calls this through a template ref to drop [[pathos:…]] chips
    // wherever the cursor sits.
    const insertText = (text) => {
      const el = getTextarea()
      const start = el ? el.selectionStart : localValue.value.length
      const end = el ? el.selectionEnd : start
      localValue.value = localValue.value.slice(0, start) + text + localValue.value.slice(end)
      emit('update:modelValue', localValue.value)
      dirty.value = true
      nextTick(() => {
        if (!el) return
        el.focus()
        el.setSelectionRange(start + text.length, start + text.length)
      })
    }

    // Tab key → indent with 2 spaces instead of leaving the field
    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const el = getTextarea()
        const start = el.selectionStart
        localValue.value = localValue.value.slice(0, start) + '  ' + localValue.value.slice(el.selectionEnd)
        emit('update:modelValue', localValue.value)
        dirty.value = true
        nextTick(() => { el.setSelectionRange(start + 2, start + 2) })
      }
      // Ctrl/Cmd + S → save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    return {
      textareaRef,
      localValue,
      mode,
      dirty,
      wordCount,
      charCount,
      onInput,
      handleSave,
      wrap,
      insertBlock,
      insertLine,
      insertLink,
      insertHR,
      insertText,
      handleKeydown
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
  padding: 8px 12px;
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

.editor-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column; /* textarea must fill HEIGHT, not just width */
  overflow: hidden;
}

.pane-divider {
  width: 1px;
  background: rgba(var(--ink-rgb), 0.15);
  flex-shrink: 0;
}

.preview-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 16px 20px;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.note-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink);
  font-family: 'Space Mono', monospace;
  font-size: 0.88em;
  line-height: 1.75;
  padding: 16px 20px;
  caret-color: var(--ink);

  &::placeholder { color: var(--ink-mute); }
}

// --- Markdown preview ---
// Colors come from the global .md-rendered class (same pipeline as the
// viewers), so the preview matches what the saved note will look like.
// Only sizing is adjusted here.
.md-preview {
  font-size: 0.9em;
  line-height: 1.75;
}

// Mobile: stack panes vertically in split mode
@media (max-width: 600px) {
  .note-editor.mode--split .note-panes {
    flex-direction: column;
    .pane-divider { width: 100%; height: 1px; }
    .editor-pane, .preview-pane { flex: none; height: 200px; }
  }
}
</style>
