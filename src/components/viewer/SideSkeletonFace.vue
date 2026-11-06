<template>
  <!-- ── THE SIDE VIEWER'S SKELETON FACE (2026-11-06, user ask: "regarding
       the new button to see the skeletons from the side viewer, please make
       sure they're displayed inside the side viewer content viewer section.
       i do not want u to open a flyout window. just change the icon on the
       header like the button the flyout does, but display it inside instead
       of popping the window out").

       The flyout's SKELETON FACE (ElementFlyout `.element-flyout__generic`),
       drawn in the side viewer's face under the card's cap — the same one
       SkeletonTable, the same rules for what it walks:
         · a POST (`item`) → its own grid, self-resolving off `skeleton_id`;
         · a SKELETON address (a schema, an instance, a board) → its grid,
           self-resolving off the address;
         · anything else — a node, a label, a path, a moment, a link, a
           secret, an entity — → the element's SURROUND walk (`GET
           /refs/surround`, one read: a node's / element's own header, an
           entity's USER_PROFILE), handed to the table pre-walked.
       `enriched`, and laid out the way the flyout's last skeleton face was
       left (the shared `pathos_skeleton_layout` key; the table's corner
       flips it). -->
  <div class="side-skeleton" aria-label="Skeleton">
    <SkeletonTable
      v-if="walk"
      :skeleton="walk.skeleton"
      :slots="walk.slots"
      :layout="layout"
      enriched
      @update:layout="setLayout"
    />
    <SkeletonTable
      v-else-if="tableRef != null"
      :ref-or-id="tableRef"
      :layout="layout"
      enriched
      @update:layout="setLayout"
    />
    <InfoChip v-else-if="failed" :kind="prefix" :address="address" />
    <div v-else class="side-skeleton__loading">
      <q-spinner size="14px" color="primary" />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import SkeletonTable from 'src/components/skeletons/SkeletonTable.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import { refService } from 'src/services/ref.service'

// The flyout's key: one layout for every skeleton face on this browser.
const LAYOUT_KEY = 'pathos_skeleton_layout'
const readLayout = () => {
  try { return localStorage.getItem(LAYOUT_KEY) === 'horizontal' ? 'horizontal' : 'vertical' } catch (_) { return 'vertical' }
}

export default defineComponent({
  name: 'SideSkeletonFace',
  components: { SkeletonTable, InfoChip },
  props: {
    // A feed row — the element is that POST.
    item: { type: Object, default: null },
    // Any element as '<kind>/<hash>'.
    address: { type: String, default: '' }
  },
  setup (props) {
    const prefix = computed(() => String(props.address || '').split('/')[0] || 'skeletons')
    // What SkeletonTable self-resolves from: a post's id, a skeleton's
    // address. Everything else walks its surround instead.
    const tableRef = computed(() => {
      if (props.item?.skeleton_id != null) return props.item.skeleton_id
      if (prefix.value === 'skeletons' && props.address) return props.address
      return null
    })
    const walk = ref(null)
    const failed = ref(false)
    let seq = 0
    const load = async () => {
      walk.value = null
      failed.value = false
      if (tableRef.value != null || !props.address) return
      const my = ++seq
      try {
        const s = await refService.surround(props.address, 1)
        if (my !== seq) return
        if (s?.success && s.skeleton) walk.value = { skeleton: s.skeleton, slots: s.slots || [] }
        else failed.value = true
      } catch (_) {
        if (my === seq) failed.value = true
      }
    }
    watch(() => [props.address, props.item?.skeleton_id], load, { immediate: true })

    const layout = ref(readLayout())
    const setLayout = (v) => {
      layout.value = v === 'horizontal' ? 'horizontal' : 'vertical'
      try { localStorage.setItem(LAYOUT_KEY, layout.value) } catch (_) { /* this session only */ }
    }

    return { prefix, tableRef, walk, failed, layout, setLayout }
  }
})
</script>

<style scoped lang="scss">
// The host's pit is the scroller (SideElementView `__skeleton`); this is the
// table at its width.
.side-skeleton {
  min-width: 0;
}
.side-skeleton__loading {
  display: flex;
  justify-content: center;
  padding: 18px 0;
}
</style>
