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
       See src/utils/pathosRefs.js for the reference format. -->
  <div>
    <div ref="root" class="markdown-body" :class="{ 'has-mini-refs': refDisplay === 'mini' }" v-html="html" />
    <teleport
      v-for="slot in chipSlots"
      :key="slot.key"
      :to="slot.el"
    >
      <!-- ![[pathos:…]] block embeds always render the full Mini panel,
           whatever the surface's inline chip tier is. -->
      <ElementMini
        v-if="slot.ref.embed || refDisplay === 'mini'"
        :address="slot.ref.address"
        :label="slot.ref.label"
      />
      <RefMicro
        v-else-if="refDisplay === 'micro'"
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
import { extractPathosRefs } from 'src/utils/pathosRefs'

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
    // shared pieces — lazy load breaks any accidental cycle.
    ElementMini: defineAsyncComponent(() => import('./ElementMini.vue'))
  },
  props: {
    text: { type: String, default: '' },
    // Chip tier for inline [[pathos:…]] references: info | mini | micro.
    refDisplay: {
      type: String,
      default: 'info',
      validator: v => ['info', 'mini', 'micro'].includes(v)
    },
    // Optional hook applied to the sanitized HTML string before display —
    // used by callers that post-process links (e.g. doc-relative hrefs).
    transformHtml: { type: Function, default: null },
    // Treat a single newline as a hard <br>. True platform-wide (chat and
    // comments are written that way); pass false for hard-wrapped prose so
    // paragraphs REFLOW to the container's width. See the marked defaults.
    breaks: { type: Boolean, default: true }
  },
  setup (props) {
    const root = ref(null)
    const chipSlots = ref([])
    // Bumped per render so teleport keys never collide across re-renders.
    let renderTick = 0

    const parsed = computed(() => extractPathosRefs(props.text || ''))

    const html = computed(() => {
      if (!parsed.value.text) return ''
      const clean = DOMPurify.sanitize(marked.parse(parsed.value.text, { breaks: props.breaks }))
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

    return { root, html, chipSlots }
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

  // Mini refs are panels, not inline chips — give each its own line and
  // breathing room so a photo referenced mid-paragraph reads as a figure.
  &.has-mini-refs :deep(.pathos-ref-slot) {
    display: block;
    margin: 10px 0;
  }

  // ![[pathos:…]] block embeds get figure treatment on every surface.
  :deep(.pathos-ref-embed) {
    display: block;
    margin: 10px 0;
  }
}
</style>
