<template>
  <!-- ── THE COMMENT MAKER (2026-10-07, user ask: "develop a family of
       comment makers that is embeddable inside the place we're making the
       comment in. Use the available space of the comment section … A third
       window being opened that covers the content is not practical").

       ONE component, every place a comment is written — the side viewer's
       thread band, a comment card's reply, a feed card's foot, a flyout's
       foot, the post and node viewers' comment panes. It is a GUEST: it
       never opens the maker dock, never parks a dock tab, never floats; it
       lays itself out in the box its host gives it. A comment is the body,
       who publishes it and send — the title is blank by construction and the
       ancestry is chain data (PARENT slot + the parent's COMMENTS), so the
       post maker's title / labels / references / access chrome stays in the
       dock where posts are made.

       THE FAMILY = one anatomy, three fits (`variant`):
         · `fill`   — takes ALL of its host's height (flex column; the field
                      grows into it): the side viewer's band, a flyout.
         · `inline` — a few lines that grow with the text (to ~12): a reply
                      under a comment card, a viewer's comment pane.
         · `attach` — `inline` worn as a LIP of the element above it: no top
                      rim, square top corners, so it reads as part of that
                      card (a feed card's foot).
       Anatomy, top to bottom: the TARGET line (`↳ on «label»`, omitted with
       `hide-target` where the host already says it), the FIELD (markdown;
       Write │ Preview through MarkdownBody, the only renderer), the STRIP
       (publish-as pill · hint · Cancel · Comment). ⌘/Ctrl+Enter sends, Esc
       cancels. Unsent text survives a close, per parent, in this browser
       (localStorage — a convenience, never the record). -->
  <div
    class="comment-maker"
    :class="['comment-maker--' + variant, { 'is-busy': posting }]"
    @keydown="onKey"
  >
    <div v-if="!hideTarget && parent" class="comment-maker__target">
      <q-icon name="subdirectory_arrow_right" size="13px" />
      <span class="comment-maker__target-word">on</span>
      <span class="comment-maker__target-label" :title="parent.label">{{ parent.label || targetWord }}</span>
      <span class="comment-maker__fill" />
      <div class="comment-maker__modes" role="tablist">
        <button
          type="button" role="tab" :aria-selected="!preview"
          :class="{ 'is-on': !preview }" @click="preview = false"
        >Write</button>
        <button
          type="button" role="tab" :aria-selected="preview"
          :class="{ 'is-on': preview }" :disabled="!text.trim()" @click="preview = true"
        >Preview</button>
      </div>
    </div>

    <div class="comment-maker__field">
      <textarea
        v-show="!preview"
        ref="fieldEl"
        v-model="text"
        class="comment-maker__input"
        rows="3"
        :placeholder="placeholder"
        :disabled="posting"
        @input="autosize"
      />
      <div v-if="preview" class="comment-maker__preview">
        <MarkdownBody :text="text" ref-display="micro" />
      </div>
    </div>

    <div class="comment-maker__strip">
      <AuthorPicker v-model="authorEntityId" compact class="comment-maker__author" />
      <span class="comment-maker__hint">{{ error || 'markdown · ⌘↵ to send' }}</span>
      <span class="comment-maker__fill" />
      <button type="button" class="comment-maker__btn" :disabled="posting" @click="cancel">Cancel</button>
      <button
        type="button" class="comment-maker__btn comment-maker__btn--send"
        :disabled="posting || !text.trim()" @click="send"
      >
        <q-spinner v-if="posting" size="11px" />
        <q-icon v-else name="send" size="12px" />
        <span>Comment</span>
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue'
import AuthorPicker from 'src/components/maker/AuthorPicker.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { submitComment, parentAddress } from 'src/utils/commentSubmit'

const KEY = 'pathos.commentDraft.'
const read = (k) => { try { return localStorage.getItem(KEY + k) || '' } catch (_) { return '' } }
const write = (k, v) => {
  try { if (v) localStorage.setItem(KEY + k, v); else localStorage.removeItem(KEY + k) } catch (_) { /* private mode */ }
}
const WORD = { node: 'node', post: 'post', comment: 'comment', skeleton: 'skeleton', path: 'path', label: 'label', link: 'link' }

export default defineComponent({
  name: 'CommentMaker',
  components: { AuthorPicker, MarkdownBody },
  props: {
    // The element commented on: { kind, id, hash, address?, label? } —
    // kind ∈ post | comment | skeleton | node | path | label | link.
    parent: { type: Object, required: true },
    variant: { type: String, default: 'inline', validator: v => ['fill', 'inline', 'attach'].includes(v) },
    hideTarget: { type: Boolean, default: false },
    autofocus: { type: Boolean, default: true }
  },
  emits: ['posted', 'cancel'],
  setup (props, { emit }) {
    const draftKey = computed(() => parentAddress(props.parent) || (props.parent.kind + ':' + props.parent.id))
    const text = ref(read(draftKey.value))
    const authorEntityId = ref(null)
    const posting = ref(false)
    const error = ref('')
    const preview = ref(false)
    const fieldEl = ref(null)

    const targetWord = computed(() => WORD[props.parent?.kind] || 'element')
    const placeholder = computed(() => 'Write a comment on this ' + targetWord.value + '…')

    watch(text, (v) => write(draftKey.value, v))
    watch(draftKey, (k) => { text.value = read(k); error.value = '' })

    // `inline` / `attach` grow with the text up to ~12 lines; `fill` is
    // sized by its host (CSS) and scrolls inside.
    const autosize = () => {
      const el = fieldEl.value
      if (!el || props.variant === 'fill') return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight + 2, 240) + 'px'
    }

    const send = async () => {
      const body = text.value.trim()
      if (!body || posting.value) return
      posting.value = true
      error.value = ''
      try {
        const r = await submitComment(props.parent, { content: text.value, authorEntityId: authorEntityId.value })
        if (!r?.success) throw new Error(r?.error?.message || 'The comment was refused')
        text.value = ''
        write(draftKey.value, '')
        preview.value = false
        emit('posted', r.skeleton || r.post || null)
      } catch (e) {
        error.value = e?.response?.data?.error?.message || e?.message || 'Something went wrong'
      }
      posting.value = false
    }
    const cancel = () => { emit('cancel') }

    const onKey = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() } else if (e.key === 'Escape') { e.preventDefault(); cancel() }
    }

    onMounted(async () => {
      await nextTick()
      autosize()
      if (props.autofocus && fieldEl.value) fieldEl.value.focus({ preventScroll: true })
    })

    return { text, authorEntityId, posting, error, preview, fieldEl, targetWord, placeholder, autosize, send, cancel, onKey }
  }
})
</script>

<style scoped lang="scss">
// One anatomy, every host. The coat is the card's PIT (`--grey-1` floor,
// grey-5 rim) so the field reads as a place to write, on whatever ground.
.comment-maker {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 6px;
  font-size: 13px;
  &.is-busy { opacity: 0.85; }
}

// FILL: the host's whole height; the field takes what the target line and
// the strip leave.
.comment-maker--fill {
  flex: 1 1 auto;
  height: 100%;
  .comment-maker__field { flex: 1 1 auto; }
  .comment-maker__input { height: 100%; resize: none; }
}

// ATTACH: the lip of the element above — no top rim, square top corners.
.comment-maker--attach {
  border-top: 0;
  border-radius: 0 0 6px 6px;
}

.comment-maker__target {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 3px 6px 3px 8px;
  border-bottom: 1px solid var(--grey-4, #e0e0e0);
  font-family: var(--font-display);
  font-size: 0.78em;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-rgb), 0.6);
}
.comment-maker__target-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--ink-rgb), 0.9);
}

.comment-maker__modes {
  display: inline-flex;
  flex-shrink: 0;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 4px;
  overflow: hidden;
  button {
    border: 0;
    background: transparent;
    padding: 1px 7px;
    font: inherit;
    color: rgba(var(--ink-rgb), 0.6);
    cursor: pointer;
    &.is-on { background: var(--light-cream, #fcf3e0); color: var(--red-10, #b71c1c); }
    &:disabled { cursor: default; opacity: 0.45; }
  }
}

.comment-maker__field {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.comment-maker__input {
  flex: 1 1 auto;
  width: 100%;
  min-height: 3.6em;
  border: 0;
  outline: 0;
  resize: vertical;
  background: transparent;
  padding: 7px 9px;
  font: inherit;
  line-height: 1.45;
  color: rgba(var(--ink-rgb), 0.92);
  &::placeholder { color: rgba(var(--ink-rgb), 0.4); }
}

.comment-maker__preview {
  flex: 1 1 auto;
  min-height: 3.6em;
  overflow: auto;
  padding: 7px 9px;
}

.comment-maker__strip {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 5px 4px 6px;
  border-top: 1px solid var(--grey-4, #e0e0e0);
  background: var(--grey-2, #eeeeee);
  border-radius: 0 0 5px 5px;
}

.comment-maker__author {
  flex: 0 1 170px;
  min-width: 0;
}

// The publish-as picker as a PILL: AuthorPicker's dense outlined q-select
// (a 40px form field in the dock) cut to the strip's 22px row, its kind
// chip dropped — the glyph already says person vs alter-ego vs org.
.comment-maker__author :deep(.q-field__control),
.comment-maker__author :deep(.q-field__native),
.comment-maker__author :deep(.q-field__marginal) {
  min-height: 22px;
  height: 22px;
}
.comment-maker__author :deep(.q-field__control) {
  padding: 0 4px 0 7px;
  border-radius: 11px;
  font-size: 0.8em;
}
.comment-maker__author :deep(.q-field__control::before) { border-radius: 11px; }
.comment-maker__author :deep(.q-field__control::after) { border-radius: 11px; }
.comment-maker__author :deep(.kind-chip) { display: none; }
.comment-maker__author :deep(.kind-icon) { font-size: 13px !important; margin-right: 4px; }

.comment-maker__hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.5);
}

.comment-maker__fill { flex: 1 1 auto; }

.comment-maker__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 3px 9px;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 4px;
  background: var(--grey-1, #fafafa);
  font-family: var(--font-display);
  font-size: 0.74em;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-rgb), 0.75);
  cursor: pointer;
  &:hover:not(:disabled) { color: rgba(var(--ink-rgb), 0.95); background: #fff; }
  &:disabled { opacity: 0.5; cursor: default; }
}
.comment-maker__btn--send {
  border-color: var(--red-9, #c62828);
  background: var(--red-9, #c62828);
  color: #fff;
  &:hover:not(:disabled) { background: var(--red-10, #b71c1c); color: #fff; }
}
</style>
