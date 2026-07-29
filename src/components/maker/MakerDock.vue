<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="maker-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('maker') === 'right' }"
      :style="{ zIndex: windows.zOf('maker'), '--dock-right': windows.dockRight + 'px' }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ── -->
      <header class="dock-bar">
        <q-icon name="article" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Post maker</span>
        <span class="dock-bar__meta mono">
          {{ store.draftCount }} in progress
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (drafts are kept)" @click="store.close()">
            <q-icon name="close" />
          </button>
        </div>
      </header>

      <!-- ── Draft tabs — one per unposted item. Comment drafts (parent
           set) carry a reply icon so they read as replies at a glance. ── -->
      <div class="dock-tabs">
        <button
          v-for="d in store.drafts"
          :key="d.id"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': d.id === store.activeId }"
          :title="d.parent ? `Comment on ${d.parent.kind} #${d.parent.id}` : ''"
          @click="store.setActive(d.id)"
        >
          <q-icon :name="d.parent ? 'reply' : 'edit_note'" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ tabLabel(d) }}</span>
          <span class="dock-tab__x" title="Discard draft" @click.stop="askDiscard(d)">
            <q-icon name="close" size="11px" />
          </span>
        </button>
        <button type="button" class="dock-tab dock-tab--new" title="New draft"
          @click="store.addDraft()">
          <q-icon name="add" size="14px" />
        </button>
      </div>

      <!-- ── Body: the shared post-maker surface (same component the
           viewers embed in their comment panes) ── -->
      <div v-if="draft" :key="draft.id" class="dock-body">
        <PostMakerSurface :draft-id="draft.id" @posted="onPosted" />
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import PostMakerSurface from './PostMakerSurface.vue'
import { useMakerStore, draftLabel } from 'src/stores/maker'
import { useWindowsStore } from 'src/stores/windows'
import { gotoCommentThread } from 'src/utils/threadNav'

export default defineComponent({
  name: 'MakerDock',
  components: { PostMakerSurface },
  emits: ['created'],

  setup (props, { emit }) {
    const $q = useQuasar()
    const store = useMakerStore()
    const windows = useWindowsStore()
    store.load()

    const draft = computed(() => store.activeDraft)

    // Tab label: title, else the first line of the body, else a placeholder.
    const tabLabel = draftLabel

    const askDiscard = (d) => {
      const hasWork = (d.title || '').trim() || (d.content || '').trim() || d.references.length
      if (!hasWork) { store.removeDraft(d.id); return }
      $q.dialog({
        title: 'Discard draft?',
        message: `“${tabLabel(d)}” hasn't been posted — closing its tab throws it away.`,
        cancel: { flat: true, label: 'Keep' },
        ok: { color: 'negative', flat: true, label: 'Discard' }
      }).onOk(() => store.removeDraft(d.id))
    }

    // The surface already removed the draft. Step aside so the fresh
    // element is visible behind the dock. A posted COMMENT lands in its
    // parent thread — open the root viewer and unravel down to it; plain
    // posts bubble up so MainLayout can navigate to the new post.
    const router = useRouter()
    const onPosted = ({ created, parent }) => {
      if (store.draftCount) store.minimize()
      if (parent && created?.id) {
        gotoCommentThread(router, created.id)
        return
      }
      emit('created', created)
    }

    return {
      store,
      windows,
      draft,
      tabLabel,
      askDiscard,
      onPosted
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and tab strip come from the shared
// .dock-window chrome in src/css/_components.scss; the footprint (right
// half of the screen, crown strip to nav bar, daylight off the side
// column) and the brown plaque come from .dock-window--creation there —
// so does maximize and the narrow-screen fallback. Only the maker's body
// layout lives here.

// ── Body — hosts the shared PostMakerSurface (editor + refs grid) ──
.dock-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

</style>
