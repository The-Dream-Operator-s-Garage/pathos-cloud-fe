<template>
  <!-- The platform's one markdown pipeline. Renders `text` through
       marked + DOMPurify, and swaps every [[pathos:<kind>/<hash>|label?]]
       reference for a live chip teleported into the rendered HTML —
       so chips keep the app's router context and navigate on click.

       `refDisplay` picks the chip tier per surface:
         'info'  (default) — inline InfoChip (1 resolved human line)
         'mini'  — the full Mini panel (posts prioritize showing the
                   referenced CONTENT: image nodes preview their photo,
                   image paths become a little slider, …)
         'micro' — the smallest hash chip (node surfaces stay compact)
         'auto'  — content decides (the POST surfaces): a node ref that
                   resolves to an embeddable URL or a media file blooms
                   into its NodeMini panel, everything else stays micro
       The AUTHOR's sigil always beats the surface tier: ![[…]] is the
       full Mini and -[[…]] is the micro chip, on every surface.
       `plain-refs` turns the whole chip stage OFF — refs stay literal
       text (the media viewer's document mode).
       ⭐ THE DEPTH DIAL (2026-10-07, composables/useRenderDepth.js): the
       budget a surface provides caps every tier here — exhausted (≤ 0)
       means EVERY ref is the micro chip, the author's ![[…]] included, and
       the AUTO node arm never probes for a bloom. No dial above = the rules
       as written.
       ⭐ `plain` (2026-10-07) — THE EXCERPT TIER: the body as one plain run
       (plainExcerpt's stripping, `max-chars` cut) in which every reference
       keeps its slot, so a Mini's excerpt seats chips and nested Minis by
       the same tier rules as a rendered body. PostMini and NodeMini read
       their quoted bodies through it.
       See src/utils/pathosRefs.js for the reference format. -->
  <div>
    <div ref="root" class="markdown-body" :class="{ 'has-mini-refs': refDisplay === 'mini', 'markdown-body--plain': plain }" v-html="html" />
    <teleport
      v-for="slot in chipSlots"
      :key="slot.key"
      :to="slot.el"
    >
      <ElementMini
        v-if="tierOf(slot.ref) === 'mini'"
        :address="slot.ref.address"
        :label="slot.ref.label"
      />
      <NodeRefAuto
        v-else-if="tierOf(slot.ref) === 'auto' && slot.ref.prefix === 'nodes'"
        :address="slot.ref.address"
        :label="slot.ref.label"
        @upgrade="upgradeSlot(slot)"
      />
      <RefMicro
        v-else-if="tierOf(slot.ref) === 'micro' || tierOf(slot.ref) === 'auto'"
        :address="slot.ref.address"
        :label="slot.ref.label"
      />
      <InfoChip
        v-else
        dense
        :kind="slot.ref.prefix"
        :address="slot.ref.address"
        :label="slot.ref.label"
      />
    </teleport>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, computed, watch, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import InfoChip from './InfoChip.vue'
import RefMicro from './RefMicro.vue'
import { extractPathosRefs, plainExcerptWithRefs } from 'src/utils/pathosRefs'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'

// Platform default: `breaks: true` — a single newline is a hard line break, the
// chat/comment convention the app was written around. Surfaces that render
// PROSE authored with hard-wrapped source lines (the docs, and every post that
// mirrors one) must turn it OFF via the `breaks` prop, or every ~72-char source
// line becomes its own <br> and the paragraph renders at the AUTHOR's wrap
// width instead of the container's — text that looks cut off at half width.
marked.setOptions({ breaks: true, gfm: true })

export default defineComponent({
  name: 'MarkdownBody',
  components: {
    InfoChip,
    RefMicro,
    // Async: ElementMini renders Minis which may render MarkdownBody-free
    // excerpts, but PostMini/NodeMini live in component trees that import
    // shared pieces — lazy load breaks any accidental cycle. NodeRefAuto
    // mounts ElementMini itself, so it rides the same lazy seam.
    ElementMini: defineAsyncComponent(() => import('./ElementMini.vue')),
    NodeRefAuto: defineAsyncComponent(() => import('src/components/nodes/NodeRefAuto.vue'))
  },
  props: {
    text: { type: String, default: '' },
    // Chip tier for inline [[pathos:…]] references: info | mini | micro | auto.
    refDisplay: {
      type: String,
      default: 'info',
      validator: v => ['info', 'mini', 'micro', 'auto'].includes(v)
    },
    // Optional hook applied to the sanitized HTML string before display —
    // used by callers that post-process links (e.g. doc-relative hrefs).
    transformHtml: { type: Function, default: null },
    // Treat a single newline as a hard <br>. True platform-wide (chat and
    // comments are written that way); pass false for hard-wrapped prose so
    // paragraphs REFLOW to the container's width. See the marked defaults.
    breaks: { type: Boolean, default: true },
    // Render [[pathos:…]] refs (and their ![[…]] / -[[…]] sigils) as the
    // literal text the author typed — no chips, no placeholder spans. For
    // surfaces that show a markdown FILE as a document rather than as
    // platform hypertext (the media viewer): the file's refs are QUOTED
    // content, not this surface's links, and live chips would both
    // mislead and fire a probe request per ref on every open. Marked,
    // DOMPurify and the breaks handling stay exactly as they are.
    plainRefs: { type: Boolean, default: false },
    // THE EXCERPT TIER (2026-10-07): render the body as a PLAIN RUN — no
    // marked, plainExcerpt's stripping instead — with every reference kept
    // as a live slot. For the Minis' quoted bodies (PostMini, NodeMini),
    // whose face is "a few lines, open it for the rest" and whose refs are
    // elements all the same. `maxChars` cuts the run (0 = whole), never
    // inside a reference.
    plain: { type: Boolean, default: false },
    maxChars: { type: Number, default: 0 }
  },
  setup (props) {
    const root = ref(null)
    const chipSlots = ref([])
    // Bumped per render so teleport keys never collide across re-renders.
    let renderTick = 0

    // The depth dial's budget (null = no dial on this surface).
    const budget = useRenderBudget()
    const exhausted = computed(() => budgetExhausted(budget))

    // plainRefs skips the extraction stage entirely: no placeholders land
    // in the HTML and the refs list is empty, so mountChips (below) finds
    // nothing to seat — the rest of the pipeline never knows. `plain`
    // builds its HTML in the extraction step itself (escaped text + slots).
    const parsed = computed(() => {
      if (props.plainRefs) return { text: props.text || '', refs: [], ready: false }
      if (props.plain) {
        const r = plainExcerptWithRefs(props.text || '', props.maxChars)
        return { text: r.html, refs: r.refs, ready: true }
      }
      return { ...extractPathosRefs(props.text || ''), ready: false }
    })

    const html = computed(() => {
      if (!parsed.value.text) return ''
      const raw = parsed.value.ready
        ? parsed.value.text
        : marked.parse(parsed.value.text, { breaks: props.breaks })
      const clean = DOMPurify.sanitize(raw)
      return props.transformHtml ? props.transformHtml(clean) : clean
    })

    // After the v-html lands, find the placeholder spans and teleport an
    // InfoChip into each. DOMPurify keeps data-* attributes by default.
    const mountChips = async () => {
      await nextTick()
      chipSlots.value = []
      if (!root.value) return
      const tick = ++renderTick
      const els = root.value.querySelectorAll('[data-pathos-ref]')
      const slots = []
      els.forEach((el) => {
        const idx = parseInt(el.getAttribute('data-pathos-ref'), 10)
        const refInfo = parsed.value.refs[idx]
        if (refInfo) slots.push({ el, ref: refInfo, key: `${tick}:${idx}` })
      })
      chipSlots.value = slots
    }

    onMounted(mountChips)
    watch(html, mountChips)

    // The slot's effective tier: the depth dial's exhausted budget caps
    // everything at micro; otherwise the author's sigil wins ('embed' →
    // mini, 'micro' → micro) and a bare ref takes the surface's refDisplay.
    const tierOf = (refInfo) => {
      if (exhausted.value) return 'micro'
      // A QUOTED body (the plain tier) blooms nothing unless a surface dial
      // above grants it layers: with no dial, every reference it carries is
      // the abstract one — the nano pill — which is also what bounds the
      // recursion (a post quoting a post quoting itself ends in pills).
      if (props.plain && budget == null) return 'micro'
      if (refInfo.display === 'embed') return 'mini'
      if (refInfo.display === 'micro') return 'micro'
      return props.refDisplay
    }

    // An auto node ref that resolved to media widens its placeholder to
    // figure treatment — same class a ![[…]] embed slot is born with.
    const upgradeSlot = (slot) => {
      slot.el?.classList?.add('pathos-ref-embed')
    }

    return { root, html, chipSlots, tierOf, upgradeSlot }
  }
})
</script>

<style lang="scss" scoped>
.markdown-body {
  // Explicit ink baseline — Quasar runs in dark mode globally, so inherited
  // text is near-white and vanishes on the light panel surfaces.
  color: var(--ink);

  :deep(.pathos-ref-slot) {
    display: inline-flex;
    vertical-align: middle;
    max-width: 100%;
  }

  // THE EXCERPT TIER (2026-10-07): a plain run keeps the author's line
  // structure the way the Minis' excerpts always did (`pre-wrap`), and a
  // chip in a sentence sizes with the sentence. The host sets the type.
  &.markdown-body--plain {
    white-space: pre-wrap;
    word-break: break-word;
  }

  // Mini refs are panels, not inline chips — give each its own line and
  // breathing room so a photo referenced mid-paragraph reads as a figure.
  &.has-mini-refs :deep(.pathos-ref-slot) {
    display: block;
    margin: 10px 0;
  }

  // ![[pathos:…]] block embeds get figure treatment on every surface.
  // ⭐ 2026-09-27 PM — THE EMBED SLOT IS A BOUNDARY (user ask: "make sure
  // we're using the same skeleton mini viewer on the post cards as in the
  // dashboard window"). It always WAS the same component — SkeletonMini on
  // both — but a block embed is teleported INTO the prose, and the prose's
  // type flowed into it: the feed card's pit runs at `--pit-scale` (0.88 →
  // 12.32px, the board's cell 14px) and justifies its paragraphs, so the
  // mini's names, foot and grid came out smaller and justified. An embedded
  // mini is the ELEMENT'S face, not the host's paragraph: the slot puts the
  // inherited type back on the body's own — the reading size and leading,
  // the body face, start-aligned, no hyphenation, no tracking — so the face
  // measures the same in a card, a post page and a board cell. Inline chip
  // slots (`.pathos-ref-slot` without `-embed`) keep flowing with the text:
  // a chip in a sentence is sized by the sentence. The hosts' ELEMENT rules
  // (`table`, `th`, `a`…) are not inherited and cannot be stopped here;
  // each prose skin excludes the slot's subtree itself (`$prose` in
  // FeedStream's `.post-square__md` block and `_components.scss`'s
  // `.md-rendered`).
  :deep(.pathos-ref-embed) {
    display: block;
    margin: 10px 0;
    font: 400 var(--font-size-body, 14px) / 1.5 var(--font-body, 'Inter', 'Helvetica Neue', system-ui, sans-serif);
    letter-spacing: normal;
    text-align: start;
    text-transform: none;
    hyphens: manual;
    -webkit-hyphens: manual;
    color: var(--ink);
  }
}
</style>
