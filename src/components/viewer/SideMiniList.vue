<template>
  <!-- ── THE SIDE VIEWER'S LIST OF MINIS (2026-11-06, user ask: "for the
       comments, please make sure we're using the same kind of viewer
       component as the ones we're using on the references section. i want
       to use the same kind of component to render the comments (that are
       posts). The current one's aesthetic comes from a old place").

       ONE list for every column of the side viewer that lists elements: a
       plain scroll of each element's kind MINI (`ElementMini :address` — the
       quick-visualization family), an optional caption over a row (the
       references' `via`: "in the text", "step 2" …), a locked row as its
       LockedChip, the thumbs on every votable member's foot (MiniVotesScope),
       then the list's notes and its "+N more" door. Born out of
       SideReferences (2026-11-04's scroll); the THREAD (comments / forks) drew
       its holder path's PathMini until today and draws this now too, so the
       three lists can never drift apart again. The host owns the reading
       (paging, totals, support) and the scroller (its pit); this draws rows.

       `items`: [{ key, address, locked?, caption? }]. -->
  <div class="side-minis">
    <MiniVotesScope v-if="items.length">
      <div v-for="it in items" :key="it.key" class="side-minis__item">
        <div v-if="it.caption" class="side-minis__via">
          <span class="side-minis__via-word">{{ it.caption }}</span>
        </div>
        <LockedChip v-if="it.locked" :address="it.address" />
        <ElementMini v-else :address="it.address" />
      </div>
    </MiniVotesScope>
    <div v-if="loading" class="side-minis__note"><q-spinner size="14px" /> loading…</div>
    <div v-else-if="error" class="side-minis__note is-error">{{ error }}</div>
    <div v-else-if="!items.length && empty" class="side-minis__note">{{ empty }}</div>
    <button
      v-if="!loading && more > 0"
      type="button" class="side-minis__more" @click="$emit('more')"
    >
      +{{ more }} more
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import LockedChip from 'src/components/shared/LockedChip.vue'
import MiniVotesScope from 'src/components/shared/MiniVotesScope.vue'

export default defineComponent({
  name: 'SideMiniList',
  components: { ElementMini, LockedChip, MiniVotesScope },
  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    // The note an empty, settled list shows ('' = none).
    empty: { type: String, default: '' },
    // How many rows the next page would add (0 = no door).
    more: { type: Number, default: 0 }
  },
  emits: ['more']
})
</script>

<style scoped lang="scss">
// The rows stack in the host's pit (SideReferences `__list`, SideElementView
// `__list`), which is the one scroller; this is only the column of rows.
.side-minis {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.side-minis__item {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

// The caption over a mini: the edge that holds it, in the reader's words.
.side-minis__via {
  display: flex;
  min-width: 0;
  padding: 0 2px;
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-rgb), 0.55);
  text-transform: lowercase;
}
.side-minis__via-word {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-minis__note {
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.8em;
  padding: 4px 2px;
  &.is-error { color: var(--red-10, #b71c1c); }
}

.side-minis__more {
  align-self: center;
  border: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.6);
  font-family: 'Space Mono', monospace;
  font-size: 0.7em;
  cursor: pointer;
  padding: 2px 6px;
  &:hover { color: rgba(var(--ink-rgb), 0.95); }
}
</style>
