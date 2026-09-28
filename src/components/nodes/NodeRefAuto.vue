<template>
  <!-- The AUTO tier's node arm — a bare [[pathos:nodes/…]] ref on a surface
       that lets content decide its own size. Resolves the node once and
       splits on what it IS: a URL an EMBED_RULE recognizes (YouTube,
       Wikipedia, …) or a media file (image/video/audio) blooms into the
       teal NodeMini panel — the same panel a ![[…]] block embed renders —
       while a text node stays the micro chip. The chip mounts IMMEDIATELY
       (it self-resolves through refs/summary in parallel), so the common
       case never waits on the upgrade probe; when the probe says media,
       the panel replaces the chip and `upgrade` tells the host to give the
       slot figure treatment (block + margin). Locked/unresolvable nodes
       keep the chip — RefMicro already knows how to be quiet about them. -->
  <ElementMini v-if="media" :element="{ kind: 'node', node }" />
  <RefMicro v-else :address="address" :label="label" />
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, computed, onMounted, watch } from 'vue'
import RefMicro from 'src/components/shared/RefMicro.vue'
import { nodeService } from 'src/services/node.service'
// The one law behind "point at it" vs "show it" — shared with the maker's
// RefBrowser since 2026-09-28, which stamps the same nodes `mini` when
// they are staged so the body carries the `!` outright.
import { isShowableNode } from 'src/utils/showable'

export default defineComponent({
  name: 'NodeRefAuto',
  components: {
    RefMicro,
    // Async like MarkdownBody's own ElementMini import — this component is
    // mounted BY MarkdownBody, and ElementMini's Minis can host excerpt
    // surfaces that circle back; lazy loading breaks the accidental cycle.
    ElementMini: defineAsyncComponent(() => import('src/components/shared/ElementMini.vue'))
  },
  props: {
    // 'nodes/<hash>' reference.
    address: { type: String, default: '' },
    // Optional human display text ([[pathos:…|label]]).
    label: { type: String, default: '' }
  },
  // Fired once when the probe decides the ref blooms — the host widens the
  // slot from inline chip to block figure (MarkdownBody adds its
  // pathos-ref-embed class to the placeholder).
  emits: ['upgrade'],
  setup (props, { emit }) {
    const node = ref(null)

    const media = computed(() => isShowableNode(node.value))

    const hash = computed(() => {
      const p = (props.address || '').trim().split('/')
      return p.length >= 2 && p[p.length - 2] === 'nodes' ? p[p.length - 1] : ''
    })

    const probe = async () => {
      node.value = null
      if (!hash.value) return
      try {
        const r = await nodeService.getByPath(hash.value)
        if (r?.success && r.node) node.value = r.node
      } catch (_) { /* locked / gone — the chip stands */ }
    }

    onMounted(probe)
    watch(() => props.address, probe)
    watch(media, (m) => { if (m) emit('upgrade') })

    return { node, media }
  }
})
</script>
