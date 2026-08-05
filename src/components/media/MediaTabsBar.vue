<template>
  <!-- The minimize sliver — a very thin dark-grey bar laid over the crown
       strip's top edge (EXACTLY 1/5 of --frieze-h), carrying one name tab
       per parked viewer; clicking a tab restores its window
       (docs/plans/floating-media-viewer.md). Rendered only while ≥1
       viewer is minimized (the host gates it). -->
  <div class="media-tabs" role="toolbar" aria-label="minimized media viewers">
    <TransitionGroup tag="div" name="mtab" class="media-tabs__row" appear>
      <button
        v-for="v in store.parked"
        :key="v.id"
        type="button"
        class="media-tabs__tab"
        :title="'restore ' + nameOf(v)"
        @click="store.restore(v.id)"
      >
        <q-icon name="web_asset" size="11px" class="media-tabs__glyph" />
        <span class="media-tabs__name">{{ nameOf(v) }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useMediaViewersStore } from 'src/stores/mediaViewers'

export default defineComponent({
  name: 'MediaTabsBar',
  setup () {
    const store = useMediaViewersStore()
    const nameOf = (v) =>
      v.node.file?.name ||
      v.node.embed?.title || v.node.embed?.provider ||
      v.node.title || ('node #' + v.node.id)
    return { store, nameOf }
  }
})
</script>

<style lang="scss" scoped>
// Above the stack widget (3100) so the tabs stay clickable across the full
// width, below the nav footer (3110) and drawer (3120). The band itself is
// PAINT — pointer-events pass through it so the 4-ish px it lays over the
// crown strip never deadens anything under it; only the tabs take taps.
.media-tabs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--frieze-h) / 5); // exactly a fifth of the crown strip
  background: var(--grey-10, #212121);
  z-index: 3105;
  pointer-events: none;
}

// Tabs hang DOWN from the sliver, minitab-style (rounded bottoms — the
// nav strip's device mirrored to the top edge).
.media-tabs__row {
  position: absolute;
  top: 100%;
  left: 40px;
  display: flex;
  gap: 6px;
}

.media-tabs__tab {
  pointer-events: auto; // the one clickable thing on a click-through band
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  max-width: 180px;
  padding: 0 10px;
  border: 1px solid var(--grey-8, #616161);
  border-top: none;
  border-radius: 0 0 9px 9px;
  background: var(--grey-9, #424242);
  color: var(--grey-3, #eeeeee);
  font-size: 0.72em;
  cursor: pointer;
  transition: background 0.12s, height 0.12s, transform 0.12s;

  // Hover pulls the tab a little further out of the sliver — the same
  // "this one will answer" cue the side widgets use, stated as reach.
  &:hover { background: var(--grey-8, #616161); height: 25px; }
  // Press: a 1px dip + a shade lighter, so the click reads on a surface
  // too dark for shadows. The shade is Material grey-7, stated as a
  // literal: the token sheet defines no --grey-7, and a var() that only
  // ever renders its fallback reads as a reference to nothing.
  &:active { background: #757575; transform: translateY(1px); }
}

.media-tabs__glyph {
  flex: 0 0 auto;
  color: var(--grey-5, #bdbdbd);
}

.media-tabs__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Park/restore choreography: a tab slides down out of the sliver when a
// window minimizes (appear covers the bar's own first mount) and lifts
// back into it when restored; .mtab-move eases the row closing ranks. A
// leaving tab keeps its flex slot for its 120ms — absolute repositioning
// would snap it to the row's start, a worse artifact than the brief hold.
.mtab-enter-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.mtab-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.mtab-enter-from,
.mtab-leave-to { opacity: 0; transform: translateY(-100%); }
.mtab-move { transition: transform 0.18s ease; }
</style>
