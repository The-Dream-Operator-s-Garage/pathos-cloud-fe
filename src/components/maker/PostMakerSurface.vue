<template>
  <!-- The post maker's editor surface — ONE component rendered both by
       MakerDock (inside its tab chrome) and embedded in the comment panes
       of the post/node viewers. Reads/writes the maker store draft, so an
       embed and the dock tab are the same in-progress work: closing the
       embed parks the draft as a footer tab, restoring the dock resumes it. -->
  <div v-if="draft" class="maker-surface" :class="{ 'is-embed': embed }">

    <!-- Comment-target banner — shown whenever this draft belongs to a
         parent element. The chip navigates to the parent; when the parent
         is itself a comment it opens the ROOT post and unravels the
         thread down to it. -->
    <div v-if="draft.parent" class="maker-surface__parent">
      <q-icon name="reply" size="14px" class="maker-surface__parent-icon" />
      <span>
        This post will be published as a <strong>comment on</strong>
      </span>
      <button type="button" class="parent-chip" :title="parentTitle" @click="openParent">
        <q-icon :name="parentIcon" size="12px" class="q-mr-xs" />
        <span class="parent-chip__label">{{ parentLabel }}</span>
        <span class="parent-chip__hash mono">{{ shortParentHash }}</span>
      </button>
      <span class="maker-surface__parent-note">
        — the reply linkage lives on the comment's skeleton, not in its text.
        Until posted, this draft stays as a tab in the footer post maker.
      </span>
    </div>

    <div class="maker-surface__body" :class="{ 'no-refs': !!draft.parent }">
      <section class="maker-surface__editor">
        <MakerHeader
          :key="draft.id"
          target-kind="post"
          :type-id="2"
          :canonic-labels="canonicLabels"
          :compact="embed"
          :dense="!embed"
          :initial-author-id="draft.authorEntityId"
          :initial-labels="draft.labels"
          @update:author-entity-id="patch({ authorEntityId: $event })"
          @update:label-ids="patch({ labelIds: $event })"
          @update:user-labels="patch({ labels: $event })"
        >
          <!-- The title rides the header row (title | author | labels) so
               the meta chrome costs ONE control line before the editor. -->
          <template v-if="!draft.parent" #title>
            <q-input
              :model-value="draft.title" :dark="false" outlined dense
              label="Title (optional)"
              @update:model-value="patch({ title: $event })"
            />
          </template>
        </MakerHeader>

        <NoteEditor
          ref="editorRef"
          class="maker-surface__note"
          :model-value="draft.content"
          :show-save="false"
          :initial-mode="embed || isMobile ? 'edit' : 'split'"
          :height="embed ? '200px' : '100%'"
          @update:model-value="patch({ content: $event })"
        />

        <footer class="maker-surface__foot">
          <!-- One line of hint, the full doctrine behind the help glyph —
               the instructions must never crowd the writing room (#675). -->
          <span class="maker-surface__hint">
            {{ draft.parent
              ? 'The comment is a full post — markdown, [[pathos:…]] chips and all.'
              : 'Markdown body — [[pathos:…]] chips render inline.' }}
          </span>
          <q-icon v-if="!draft.parent" name="help_outline" size="14px" class="maker-surface__help">
            <q-tooltip class="maker-surface__help-tip" max-width="340px" :delay="150">
              The body becomes the post's markdown node. Insert references inline
              as [[pathos:…]] chips — staged ones you don't insert are appended as
              a References list. Each reference's auto/micro/mini stamp picks how
              it previews on the post.
            </q-tooltip>
          </q-icon>
          <q-space />
          <span v-if="errorMsg" class="maker-surface__msg text-negative">{{ errorMsg }}</span>
          <span v-if="successMsg" class="maker-surface__msg text-positive">{{ successMsg }}</span>
          <q-btn
            v-if="embed"
            flat dense no-caps size="sm" label="Close"
            title="Keep the draft as a footer maker tab"
            @click="$emit('close')"
          />
          <q-btn
            unelevated dense no-caps size="sm" color="primary"
            :icon="draft.parent ? 'send' : 'add'"
            :label="draft.parent ? 'Post comment' : 'Post'"
            :loading="posting"
            :disable="!draft.content || !draft.content.trim()"
            @click="submit"
          />
        </footer>
      </section>

      <!-- Comment drafts carry no staged-reference panel: a comment's
           ancestry lives on its skeleton (PARENT slot + the parent's
           COMMENTS path), and nothing may surface reference rows in the
           comment pane before the comment exists. -->
      <aside v-if="!draft.parent" class="maker-surface__refs">
        <RefBrowser
          :references="draft.references"
          @update:references="patch({ references: $event })"
          @invoke="invokeRef"
        />
      </aside>
    </div>

    <!-- Access doctrine: fresh posts pass through the access tree before
         publishing (comments inherit their parent's audience instead). -->
    <AccessTreeDialog
      v-model="accessOpen"
      :content="pendingBody"
      :title="draft.title"
      @confirm="doPost"
      @cancel="posting = false"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MakerHeader from './MakerHeader.vue'
import RefBrowser from './RefBrowser.vue'
import AccessTreeDialog from './AccessTreeDialog.vue'
import NoteEditor from 'src/components/nodes/NoteEditor.vue'
import { useMakerStore } from 'src/stores/maker'
import { useWindowsStore } from 'src/stores/windows'
import { postService } from 'src/services/post.service'
import { nodeService } from 'src/services/node.service'
import { skeletonService } from 'src/services/skeleton.service'
import { labelService } from 'src/services/label.service'
import { gotoCommentThread } from 'src/utils/threadNav'

const PARENT_ICONS = { post: 'article', comment: 'chat_bubble_outline', node: 'adjust' }

export default defineComponent({
  name: 'PostMakerSurface',
  components: { MakerHeader, RefBrowser, AccessTreeDialog, NoteEditor },
  props: {
    draftId: { type: String, default: null },
    // Embedded density: compact header, fixed-height editor, Close button.
    embed: { type: Boolean, default: false }
  },
  emits: ['posted', 'close'],

  setup (props, { emit }) {
    const router = useRouter()
    const store = useMakerStore()
    store.load()
    // Phones open the editor in edit mode — a 375px split pane leaves no
    // room to write (change request #675); the toggle stays a tap away.
    const windows = useWindowsStore()
    const isMobile = computed(() => windows.isMobile)

    const editorRef = ref(null)
    const posting = ref(false)
    const errorMsg = ref('')
    const successMsg = ref('')

    const draft = computed(() => store.drafts.find(d => d.id === props.draftId) || null)

    const patch = (p) => {
      if (draft.value) store.patchDraft(draft.value.id, p)
    }

    // The reference's chosen preview tier → its sigil: mini forces the
    // full panel (![[…]]), micro forces the smallest chip (-[[…]]), auto
    // writes the bare ref and lets the reading surface decide (URL/media
    // nodes bloom, the rest stay chips).
    const sigilOf = (r) => (r.display === 'mini' ? '!' : r.display === 'micro' ? '-' : '')

    // Drop a [[pathos:…]] chip at the editor caret so a reference can be
    // invoked anywhere in the body, not just trail the post.
    const invokeRef = (r) => {
      const label = (r.primary || '').replace(/[[\]|]/g, '').trim()
      const chip = label
        ? `${sigilOf(r)}[[pathos:${r.address}|${label}]]`
        : `${sigilOf(r)}[[pathos:${r.address}]]`
      editorRef.value?.insertText(chip)
    }

    // Canonic chips: the backend attaches POST + provenance on submit —
    // ORIGINAL for fresh posts, COMMENT for comment drafts.
    const canonicLabels = ref([])
    onMounted(async () => {
      try {
        const r = await labelService.listLeaves()
        if (r.success) {
          const name = draft.value?.parent ? 'COMMENT' : 'ORIGINAL'
          const leaf = r.leaves.find(l => l.name === name && l.parent_name === 'POST')
          if (leaf) canonicLabels.value = [leaf]
        }
      } catch (_) { /* leaves empty */ }
    })

    // ── Parent chip ─────────────────────────────────────────
    const parentIcon = computed(() => PARENT_ICONS[draft.value?.parent?.kind] || 'article')
    const parentLabel = computed(() => {
      const p = draft.value?.parent
      if (!p) return ''
      return p.label || `${p.kind} #${p.id}`
    })
    const parentTitle = computed(() => {
      const p = draft.value?.parent
      if (!p) return ''
      return p.kind === 'comment'
        ? 'Open the original post and unravel the thread to this comment'
        : `Open ${p.kind} #${p.id}`
    })
    const shortParentHash = computed(() => {
      const h = draft.value?.parent?.hash || ''
      return h ? h.slice(0, 10) + '…' : ''
    })

    const openParent = () => {
      const p = draft.value?.parent
      if (!p) return
      if (p.kind === 'comment') {
        gotoCommentThread(router, p.id)
      } else if (p.route) {
        router.push(p.route)
      }
    }

    // ── Submit — post vs comment, by draft.parent ───────────
    // Pair-path CONTENT is ONE markdown node — references live inline
    // as [[pathos:…]] chips. Staged references the author never
    // inserted are appended as a References list so nothing staged is
    // silently dropped. Comments skip this: their body is EXACTLY what
    // the author typed — the ancestry (which post/node/comment this
    // replies to) is skeleton data (PARENT slot, COMMENTS surround),
    // never text inside the content node.
    const buildBody = (d) => {
      let body = d.content
      if (!d.parent) {
        const missing = d.references.filter(x => !body.includes(x.address))
        if (missing.length) {
          // Each appended ref keeps its chosen preview tier: the sigil
          // rides INSIDE the list item (after "- "), so the markdown list
          // marker and the display marker never collide.
          const line = (x) => {
            const label = (x.primary || '').replace(/[[\]|]/g, '').trim()
            return `- ${sigilOf(x)}[[pathos:${x.address}${label ? '|' + label : ''}]]`
          }
          body += '\n\n---\n\n**References**\n\n' + missing.map(line).join('\n')
        }
      }
      return body
    }

    // Access doctrine: fresh posts route through the access-tree dialog
    // first (choose the post's visibility + which owned references to
    // publish); comments post straight away and inherit their parent's
    // audience server-side.
    const accessOpen = ref(false)
    const pendingBody = ref('')

    const submit = async () => {
      const d = draft.value
      if (!d || posting.value) return
      errorMsg.value = ''
      if (!d.parent) {
        pendingBody.value = buildBody(d)
        posting.value = true // hold the button while the tree is open
        accessOpen.value = true
        return
      }
      posting.value = true
      try {
        const payload = { content: buildBody(d), labelIds: d.labelIds, authorEntityId: d.authorEntityId }
        const r = d.parent.kind === 'node'
          ? await nodeService.commentOnNode(d.parent.id, payload)
          : await skeletonService.commentOn(d.parent.id, payload)
        finish(r, d)
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'Something went wrong'
        posting.value = false
      }
    }

    // Called by the access tree's confirm with { public, publish }.
    const doPost = async (access) => {
      const d = draft.value
      if (!d) { posting.value = false; return }
      try {
        const r = await postService.create({
          title: d.title,
          content: pendingBody.value,
          labelIds: d.labelIds,
          authorEntityId: d.authorEntityId,
          access
        })
        finish(r, d)
      } catch (e) {
        errorMsg.value = e?.response?.data?.error?.message || e?.message || 'Something went wrong'
        posting.value = false
      }
    }

    const finish = (r, d) => {
      if (r.success) {
        successMsg.value = 'Posted!'
        const id = d.id
        const parent = d.parent
        setTimeout(() => {
          store.removeDraft(id)
          successMsg.value = ''
          posting.value = false
          emit('posted', { created: r.post || r.skeleton, parent })
        }, 400)
      } else {
        errorMsg.value = r.error?.message || 'Failed'
        posting.value = false
      }
    }

    return {
      store,
      isMobile,
      draft,
      patch,
      invokeRef,
      canonicLabels,
      editorRef,
      posting,
      errorMsg,
      successMsg,
      parentIcon,
      parentLabel,
      parentTitle,
      shortParentHash,
      openParent,
      submit,
      accessOpen,
      pendingBody,
      doPost
    }
  }
})
</script>

<style lang="scss" scoped>
.maker-surface {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

// ── Comment-target banner ──
.maker-surface__parent {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
  font-size: 0.78em;
  color: var(--ink-1, #1f2a38);
  background: rgba(var(--coral-rgb, 235, 87, 87), 0.07);
  border: 1px solid rgba(var(--coral-rgb, 235, 87, 87), 0.25);
  border-radius: var(--radius-sm, 6px);
}
.maker-surface__parent-icon { color: var(--coral-deep, #d35f5f); }
.maker-surface__parent-note {
  color: var(--ink-mute, #8995a8);
  flex-basis: 100%;
  padding-left: 20px;
}
.parent-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  background: #ffffff;
  border: 1px solid rgba(var(--coral-rgb, 235, 87, 87), 0.45);
  border-radius: 11px;
  color: var(--coral-deep, #d35f5f);
  font-family: inherit;
  font-size: 0.95em;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
  &:hover {
    background: rgba(var(--coral-rgb, 235, 87, 87), 0.10);
    border-color: var(--coral-deep, #d35f5f);
  }
  .parent-chip__hash { font-size: 0.82em; opacity: 0.7; }
}

// ── Body: editor left, references right (same shape as the dock) ──
// The refs browser cedes ground to the editor (#675 — "room to write"):
// it was minmax(280, 340), nearly half the half-screen dock.
.maker-surface__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(230px, 290px);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

// Comment drafts have no references column — the editor takes the row.
.maker-surface__body.no-refs,
.maker-surface.is-embed .maker-surface__body.no-refs {
  grid-template-columns: minmax(0, 1fr);
}

.maker-surface__editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.maker-surface__note {
  flex: 1;
  min-height: 0;
}

.maker-surface__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  // The hint is the only shrinkable piece — buttons keep their box even
  // when the editor column squeezes (embedded pane widths).
  .q-btn { flex-shrink: 0; }
}

// One line, ellipsized under pressure — the writing room wins (#675).
.maker-surface__hint {
  font-size: 0.72em;
  color: var(--ink-mute);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 0 1 auto;
}

.maker-surface__help {
  color: var(--ink-mute);
  cursor: help;
  flex-shrink: 0;
}

.maker-surface__msg { font-size: 0.78em; }

// References card — sibling of the feed's detail panel.
.maker-surface__refs {
  min-height: 0;
  overflow-y: auto;
  background: var(--paper-card, #ffffff);
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 10px 12px;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

// Embedded density — sits inside a viewer's comment pane on the white
// panel surface: tone the refs card down and cap its height so the
// composer doesn't swallow the whole pane.
.maker-surface.is-embed {
  .maker-surface__body {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
    gap: 10px;
  }
  .maker-surface__refs { max-height: 320px; }
  .maker-surface__parent { margin-bottom: 6px; }
}

@media (max-width: 900px) {
  // Stacked = plain block flow, NOT a one-column grid: the editor's
  // vh min-height doesn't count into a grid row's intrinsic size, so the
  // refs row landed on top of the note's overflow. Block never does that.
  .maker-surface__body,
  .maker-surface.is-embed .maker-surface__body {
    display: block;
    overflow-y: auto;
  }
  .maker-surface__refs { margin-top: 12px; }
  .maker-surface__note { min-height: 200px; }
}

// Phones (keep in sync with MOBILE_MQ in stores/windows.js): everything
// stacks vertically — title, pickers, editor, refs — and the editor is the
// piece that gets the room (#675). The hint would fight the buttons for a
// 375px row; the help tooltip carries the doctrine instead.
@media (max-width: 600px) {
  .maker-surface__note { min-height: 48vh; }
  .maker-surface__hint { display: none; }
}
</style>
