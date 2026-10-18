<template>
  <!-- THE LABEL STRIP (2026-10-18, user ask: "Talavero has been labeling
       some nodes already. For the whole mini viewer family, help me
       implementing a new section under the mini viewer header where the
       item labels are displayed in a discrete thin dense single-row
       horizontal scroll"). MiniPanel mounts it between the head and the
       well when the element has labels and the viewer has not hidden them
       (the head's label switch).

       The plates are the house's ONE label section (`LabelBundleRail`, its
       one-row form): the platform's vocabulary under `verified`, every
       other label under the FACE of whoever attached it — so Talavero's
       labels read as his, exactly as on a card's rail. `side`: a label or a
       face opens in the side viewer, like the Mini itself.

       ONE ROW, never two (a band that wraps changes the panel's height from
       its content); it scrolls sideways with its scrollbar hidden — a 4px
       bar would eat a 14px row (the card rail's rule) — and a soft FADE on
       the edge that has more to show says so instead. -->
  <div
    ref="el"
    class="mini-strip"
    :class="{ 'has-more-left': moreLeft, 'has-more-right': moreRight }"
    @scroll.passive="measure"
  >
    <LabelBundleRail :labels="labels" side />
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import LabelBundleRail from 'src/components/labels/LabelBundleRail.vue'

export default defineComponent({
  name: 'MiniLabelStrip',
  components: { LabelBundleRail },
  props: {
    // API label rows: { id, path, name, chain, system_label, added_by }
    labels: { type: Array, default: () => [] }
  },
  setup (props) {
    const el = ref(null)
    const moreLeft = ref(false)
    const moreRight = ref(false)

    // Which edges hide more plates — read off the box itself (1px slack:
    // a fractional scroll position never reaches the integer end).
    const measure = () => {
      const s = el.value
      if (!s) return
      moreLeft.value = s.scrollLeft > 1
      moreRight.value = s.scrollLeft + s.clientWidth < s.scrollWidth - 1
    }

    let ro = null
    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined' && el.value) {
        ro = new ResizeObserver(measure)
        ro.observe(el.value)
      }
    })
    onBeforeUnmount(() => { if (ro) ro.disconnect() })
    // After the DOM took the new plates — a post-flush watcher measures them.
    watch(() => props.labels, measure, { flush: 'post' })

    return { el, moreLeft, moreRight, measure }
  }
})
</script>

<style lang="scss" scoped>
.mini-strip {
  // The plates' row: LabelBundleRail sizes every plate off `--row-h` (its
  // members step 2px in a side). 14px — the card byline's 20 is a reading
  // row; this one is a glance.
  --row-h: var(--mini-strip-row-h, 14px);
  --strip-fade: 10px;

  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 3px;
  min-width: 0;
  box-sizing: content-box;
  height: var(--row-h);
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  // The run's trailing air: a flex item, so the last plate can scroll clear
  // of the right fade (a scroller's own end padding is not reliably part of
  // its scroll range).
  &::after {
    content: '';
    flex: 0 0 2px;
    height: 1px;
  }

  &.has-more-right {
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--strip-fade)), transparent);
    mask-image: linear-gradient(to right, #000 calc(100% - var(--strip-fade)), transparent);
  }
  &.has-more-left {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--strip-fade));
    mask-image: linear-gradient(to right, transparent, #000 var(--strip-fade));
  }
  &.has-more-left.has-more-right {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--strip-fade), #000 calc(100% - var(--strip-fade)), transparent);
    mask-image: linear-gradient(to right, transparent, #000 var(--strip-fade), #000 calc(100% - var(--strip-fade)), transparent);
  }
}
</style>
