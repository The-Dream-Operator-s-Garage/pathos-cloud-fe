<template>
  <!-- Mounts every live flyout viewer + the minimize band (born
       media/MediaViewerHost.vue, 2026-08-04; renamed with the 2026-08-17
       fusion — the windows it hosts are element viewers now, media faces
       included). `v-show`, not `v-if`: a minimized viewer keeps its DOM,
       so a playing video, a scrolled article or a drafted comment in an
       embedded postcard survives the park/restore round-trip — minimize
       behaves like a real window manager's, not like a close.

       The BAND is unconditional (2026-08-05, user ask): it is platform
       chrome, the rail every viewer hangs from, so it stands at the top
       of the window whether or not anything is parked on it — and the
       space it takes is a constant, which is also what stops the whole
       top chrome from stepping down and back up as viewers park. -->
  <div class="element-flyout-host">
    <MediaTabsBar />
    <ElementFlyout
      v-for="v in store.viewers"
      v-show="!v.minimized"
      :key="v.id"
      :viewer-id="v.id"
      @pins-changed="$emit('pins-changed')"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ElementFlyout from 'src/components/shared/ElementFlyout.vue'
import MediaTabsBar from 'src/components/media/MediaTabsBar.vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

export default defineComponent({
  name: 'ElementFlyoutHost',
  components: { ElementFlyout, MediaTabsBar },
  // A viewer's pin button changed the pin set — MainLayout owns the
  // refresh key the tack and the pins widget both watch, so the signal
  // travels the same road the nav bar's does.
  emits: ['pins-changed'],
  setup () {
    const store = useFlyoutViewersStore()
    return { store }
  }
})
</script>

<style lang="scss" scoped>
// No box of its own — every child is position: fixed.
.element-flyout-host {
  display: contents;
}
</style>
