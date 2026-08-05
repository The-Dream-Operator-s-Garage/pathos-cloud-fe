<template>
  <!-- Mounts every live media viewer + the minimize band
       (docs/plans/floating-media-viewer.md). `v-show`, not `v-if`: a
       minimized viewer keeps its DOM, so a playing video or a scrolled
       document survives the park/restore round-trip — minimize behaves
       like a real window manager's, not like a close.

       The BAND is unconditional (2026-08-05, user ask): it is platform
       chrome, the rail every viewer hangs from, so it stands at the top
       of the window whether or not anything is parked on it — and the
       space it takes is a constant, which is also what stops the whole
       top chrome from stepping down and back up as viewers park. -->
  <div class="media-viewer-host">
    <MediaTabsBar />
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
