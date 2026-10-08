<template>
  <!-- THE POST MINI — the face a post wears wherever it is quoted: a
       `![[pathos:posts/…]]` / `![[pathos:skeletons/…]]` embed in another
       post, a path lane's member, the file tree, a link's target.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "the post and path
       mini viewers look odd compared to the node and skeleton mini viewers
       … it is very probable to go and reference posts inside posts … take as
       layout the node mini viewer"). It was the last Mini on MiniPanel's
       default STACK head — title / author chip / provenance + time / label
       chips / hash, five lines before the body — over a white body and a
       votes foot, a 48px head beside the node's 22px. NodeMini's grammar now:
         HEAD  chip+copy │ title │ open        (MiniHead)
         BODY  the post's words — a plain excerpt, justified
         FOOT  ◻ by allegue · 3h ago · fork   (MiniFoot)
       · the chip is the post's COLLAPSED nano pill (`sym_o_post / 993fa6… ●`,
         its verdict self-resolved); the corner opens the post's window (the
         ref door on its `skeletons/` address, which steps a POST instance
         forward to its card);
       · the title, else the skeleton's name (the path viewer pages hand in a
         raw skeleton row), else `post #id` — never a borrowed content path;
       · the VOTES are gone, by NodeMini's rule ("a preview reports what the
         element IS; its activity is read in its own viewer") — and in the
         embed path they had never been real: ElementMini's post read carries
         no votes, so every quoted post printed ↑0 ↓0. The label chips went
         with the stack head (every post carries its classification markers
         — POST · ORIGINAL — and three of them said nothing about the post).
       See dashboard/doc/ui-reference.md. -->
  <!-- ⭐ THE EXCERPT KEEPS ITS REFERENCES (2026-10-07, the depth dial):
       the words are the post's RAW markdown read through MarkdownBody's
       `plain` tier — plainExcerpt's look (one run, 400 chars, `pre-wrap`)
       with every [[pathos:…]] a live slot: a nano pill, or a nested Mini
       while the dial's budget allows (a post quoted in a post shows ITS
       pictures and quotes as minis at depth 2, as pills at depth 1). The
       panel stops being a router-link while it hosts minis — a panel inside
       a panel must not nest anchors; the head's corner is still the door —
       and lifts MiniPanel's 110px excerpt cap, since a cropped mini is no
       preview of anything. -->
  <MiniPanel kind="posts" :to="hostsMinis ? null : targetRoute" :body-fit="hostsMinis">
    <template #head>
      <MiniHead
        kind="posts"
        :id="post.id"
        :path="postAddress"
        :integrity="post.integrity || null"
        :name="postLabel"
      />
    </template>

    <template #body>
      <MarkdownBody
        v-if="excerptRaw"
        class="post-mini__excerpt"
        :text="excerptRaw"
        plain
        :max-chars="400"
        ref-display="auto"
      />
      <div v-else class="post-mini__empty">(no words — open the post)</div>
    </template>

    <template v-if="footFacts.length" #foot>
      <MiniFoot kind="posts" :facts="footFacts" :title="footTitle" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, watchEffect } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { hashOf } from 'src/utils/kinds'
import { timeAgo } from 'src/utils/time'
import { entitySummary } from 'src/utils/entityDisplay'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'

export default defineComponent({
  name: 'PostMini',
  components: { MiniPanel, MiniHead, MiniFoot, MarkdownBody },
  props: {
    // The post: { id, path, title?, excerpt?, author?, owner_id?,
    // created_at?, forked_from_id?, integrity? } — ElementMini's read of
    // GET /posts/:id, pathService's enriched target, or (the path viewer
    // pages) a raw skeleton row { id, path, name, owner_id, created_at }.
    post: { type: Object, required: true },
    // Kept for the callers that pass it; the classification markers every
    // post carries are not what a preview is for.
    labels: { type: Array, default: () => [] },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/posts/${props.post.id}`)

    // The chip's address. A post's own `path` is `skeletons/<hash>`; the
    // pill states it as `posts/<hash>` (its kind), and its door maps it
    // back (MiniHead / MicroChip).
    const postAddress = computed(() => {
      const h = hashOf(props.post.path || '')
      return h ? `posts/${h}` : ''
    })

    const postLabel = computed(() => {
      const t = String(props.post.title || '').trim()
      if (t) return t
      const n = String(props.post.name || '').trim()
      if (n && n !== 'POST') return n
      return `post #${props.post.id}`
    })

    // The post's WORDS: its RAW markdown, read through MarkdownBody's plain
    // tier (one run, refs as live slots — see the template note). Callers
    // that hand a pre-stripped excerpt simply have no refs to seat.
    const excerptRaw = computed(() => String(props.post.excerpt || ''))

    // Does this excerpt bloom a nested Mini? Only an author's `![[…]]` can,
    // and only under a surface DIAL with budget left below this panel (the
    // ElementMini above already consumed this layer). No dial above (the
    // post viewer, a board) = every quoted reference is a nano pill.
    const budget = useRenderBudget()
    const hostsMinis = computed(() =>
      budget != null && !budgetExhausted(budget) && /!\[\[pathos:/.test(excerptRaw.value))

    // ── the foot: who, when, whether it is a fork ─────────────────────
    const author = ref('')
    watchEffect(() => {
      const a = props.post.author
      const named = a && (a.display_name || a.username)
      if (named) { author.value = named; return }
      const id = a?.id ?? props.post.owner_id
      if (id == null) { author.value = ''; return }
      entitySummary({ id }).then((s) => { author.value = s?.primary || '' })
    })
    const when = computed(() => timeAgo(props.post.created_at || null) || '')
    const footFacts = computed(() => [
      author.value && `by ${author.value}`,
      when.value && { text: when.value, title: props.post.created_at || '' },
      props.post.forked_from_id != null && { text: 'fork', title: `forked from post #${props.post.forked_from_id}` }
    ].filter(Boolean))
    const footTitle = computed(() => [
      props.post.path,
      author.value && `by ${author.value}`,
      props.post.created_at
    ].filter(Boolean).join(' · '))

    return { targetRoute, postAddress, postLabel, excerptRaw, hostsMinis, footFacts, footTitle }
  }
})
</script>

<style lang="scss" scoped>
// NodeMini's excerpt, verbatim: prose keeps a 4px side inset where the family
// body gave its padding up, and justifies out of the body's centring.
.post-mini__excerpt {
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: justify;
  padding: 0 4px;
  // The plain tier's own ink is the excerpt's, not MarkdownBody's default.
  :deep(.markdown-body) { color: inherit; }
  // A nested Mini stands on its own line at the body's size, not the
  // excerpt's 0.84em — the embed slot is a boundary (MarkdownBody's rule).
  :deep(.pathos-ref-embed) { margin: 6px 0; text-align: start; }
}

.post-mini__empty {
  font-size: 0.78em;
  color: #5b6c82;
  font-style: italic;
}
</style>
