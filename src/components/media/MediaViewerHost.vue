<template>
  <!-- Mounts every live media viewer + the minimize sliver
       (docs/plans/floating-media-viewer.md). `v-show`, not `v-if`: a
       minimized viewer keeps its DOM, so a playing video or a scrolled
       document survives the park/restore round-trip — minimize behaves
       like a real window manager's, not like a close. -->
  <div class="media-viewer-host">
    <MediaTabsBar v-if="store.parked.length" />
    <MediaViewerWindow
      v-for="v in store.viewers"
      v-show="!v.minimized"
      :key="v.id"
      :viewer-id="v.id"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import MediaViewerWindow from './MediaViewerWindow.vue'
import MediaTabsBar from './MediaTabsBar.vue'
import { useMediaViewersStore } from 'src/stores/mediaViewers'

export default defineComponent({
  name: 'MediaViewerHost',
  components: { MediaViewerWindow, MediaTabsBar },
  setup () {
    const store = useMediaViewersStore()
    return { store }
  }
})
</script>

<style lang="scss" scoped>
// No box of its own — every child is position: fixed.
.media-viewer-host {
  display: contents;
}
</style>
