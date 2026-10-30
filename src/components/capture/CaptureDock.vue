<template>
  <!-- ── THE CAPTURE WINDOW (2026-10-11) — the dock the nav hub's three
       capture petals open (the fourth opens the uploader). Same chrome as
       the uploader it borrows its family from: the creation footprint
       (`.dock-window--creation`), the name plate, the traffic lights, the
       slim frieze in the family's darkest rung, and the tab strip — worn
       here as the MODE STRIP: Camera · Record · Note, one face at a time
       (a capture is a modal act; see stores/capture.js). Under the face,
       a receipts row draws every node this sitting minted as its chip, so
       "where did that go" is answered without leaving the window. ── -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="capture-dock dock-window dock-window--creation dock-window--hub"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('capture') === 'right' }"
      :data-dock-key="'capture'"
      :style="{ zIndex: windows.zOf('capture'), '--dock-right': windows.dockRight + 'px', '--trail-shift': windows.trailShiftOf('hub') + 'px', '--dock-seat': 'var(--seat-hub)', ...windows.winDragStyle('capture') }"
    >
      <header class="dock-bar">
        <span class="dock-bar__plate">
          <q-icon name="adjust" size="13px" class="dock-bar__icon" />
          <span class="dock-bar__title nasalization">Capture</span>
        </span>
        <span class="dock-bar__meta mono">{{ meta }}</span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (a note in course is versioned and kept)" @click="store.close()">
            <q-icon name="close" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
        </div>
      </header>

      <FriezeBar slim class="dock-window__frieze" />

      <div class="dock-tabs capture-modes">
        <button
          v-for="m in modes"
          :key="m"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': store.mode === m }"
          :title="META[m].title"
          @click="store.setMode(m)"
        >
          <q-icon :name="META[m].icon" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ META[m].label }}</span>
        </button>
      </div>

      <!-- Talavero's label suggestions on this sitting's captures (2026-10-14) —
           under the tabs: the footer's hub disc covers the floor's centre. -->
      <LabelSuggestionTray :node-ids="receiptIds" />

      <div class="dock-body capture-body">
        <CameraFace v-if="store.mode === 'camera'" key="camera" @created="onCreated" />
        <RecorderFace v-else-if="store.mode === 'recorder'" key="recorder" @created="onCreated" />
        <NotepadFace v-else key="notepad" @created="onCreated" />
      </div>

      <div v-if="store.receipts.length" class="capture-receipts">
        <span class="capture-receipts__label">saved</span>
        <MicroChip
          v-for="r in store.receipts"
          :key="r.id"
          kind="nodes"
          :id="r.id"
          :path="r.path"
          :type-icon="r.icon"
        />
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, computed } from 'vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import LabelSuggestionTray from 'src/components/labels/LabelSuggestionTray.vue'
import { useLabelSuggestionsStore } from 'src/stores/labelSuggestions'
import CameraFace from './CameraFace.vue'
import RecorderFace from './RecorderFace.vue'
import NotepadFace from './NotepadFace.vue'
import { useCaptureStore, CAPTURE_MODES, MODE_META } from 'src/stores/capture'
import { useWindowsStore } from 'src/stores/windows'

export default defineComponent({
  name: 'CaptureDock',
  components: { FriezeBar, MicroChip, LabelSuggestionTray, CameraFace, RecorderFace, NotepadFace },
  emits: ['created'],
  setup (props, { emit }) {
    const store = useCaptureStore()
    const windows = useWindowsStore()
    store.load()

    const meta = computed(() => {
      const n = store.receipts.length
      return n ? `${n} saved this sitting` : 'private · yours'
    })

    // A face minted nodes: remember them as receipts (chips under the
    // face) and let the layout decide whether anything else cares (a
    // skeleton populate session takes fresh nodes into its tray).
    // Every capture went through the upload door, which asked Talavero for
    // labels only while he can answer (`labeling`, 2026-10-29) — and never
    // for a note's later VERSIONS (`history`), minted by PUT.
    const suggestions = useLabelSuggestionsStore()
    const receiptIds = computed(() => store.receipts.map(r => r.id))
    const onCreated = (nodes, icon, labeling = false) => {
      for (const n of nodes || []) store.pushReceipt({ id: n.id, path: n.path, icon: icon || 'adjust' })
      if (labeling && icon !== 'history') suggestions.track(nodes, icon || 'adjust')
      emit('created', nodes)
    }

    return { store, windows, modes: CAPTURE_MODES, META: MODE_META, meta, onCreated, receiptIds }
  }
})
</script>

<style lang="scss" scoped>
// THE UPLOADER'S FAMILY, by the ask ("Use the teal coloring that is already
// used on the upload components") — the same dial recipe UploaderDock.vue
// states, so the two windows are one colorway: coat, rule, strong rule,
// ink, mute ink, well, the frieze's plate, and the q-primary Quasar reads.
.capture-dock {
  --dock-coat: var(--uploader-coat);
  --dock-rule: var(--uploader-contrast);
  --dock-rule-strong: var(--teal-9);
  --dock-ink: var(--uploader-contrast);
  --dock-ink-mute: var(--teal-4);
  --dock-well: var(--teal-1);
  --dock-frieze: var(--teal-10);
  --q-primary: var(--uploader-contrast);
}
.dock-tab:hover { color: var(--teal-9); }
.dock-bar__plate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--uploader-contrast);
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.04);
  .dock-bar__icon { color: var(--uploader-contrast); opacity: 0.85; }
  .dock-bar__title { color: var(--uploader-contrast); }
}
.dock-tab.is-active { box-shadow: inset 0 2px 0 var(--uploader-contrast); }

.capture-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

.capture-receipts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 14px 8px;
  border-top: 1px solid var(--dock-rule);
  flex-shrink: 0;
  max-height: 72px;
  overflow-y: auto;
}
.capture-receipts__label {
  font-size: 0.62em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dock-ink-mute);
}
</style>
