<template>
  <!-- ── THE REFERENCES (2026-11-02, user ask: the side viewer's right column
       "divided on 2 subsections: the fork/comments part on the top, and then
       the reference path below. Here we're going to begin by listing all
       elements referenced inside the item. for example, if we're watching a
       post referencing a node, the node should be listed there").

       One box under the thread box, the same bar grammar: the word, the
       total, then ONE paged list — every element the item holds, in reading
       order, each drawn as its kind's MINI (the quick-visualization family:
       a feed of small faces), a caption over it naming the edge that holds
       it (`via` — "body", a slot's name, a board, a path position, a link's
       target). Read off `GET /refs/references` (api/services/
       referenceService.js); an entry the viewer may not open is a locked
       row. A mini's own doors open INSIDE the side viewer (the viewer's
       sink, 2026-10-07), so the list is a path the reader can walk. -->
  <section class="side-refs" aria-label="References">
    <header class="side-refs__bar">
      <span class="side-refs__tab">
        <q-icon name="account_tree" size="13px" />
        <span class="side-refs__tab-word">References</span>
        <span class="side-refs__tab-n">{{ supported ? (total ?? '·') : '–' }}</span>
      </span>
    </header>
    <div ref="listEl" class="side-refs__list">
      <div v-if="!supported" class="side-refs__note">
        {{ kindWord === 'element' ? 'This element' : 'A ' + kindWord }} holds no references.
      </div>
      <template v-else>
        <div v-for="it in items" :key="it.via + ':' + it.address + ':' + (it.position ?? '')" class="side-refs__item">
          <div class="side-refs__via">
            <span class="side-refs__via-word">{{ viaWord(it) }}</span>
          </div>
          <div v-if="it.locked" class="side-refs__row is-locked">
            <q-icon name="lock" size="12px" /> {{ lockedWord(it) }} you cannot read
          </div>
          <ElementMini v-else :address="it.address" />
        </div>
        <div v-if="loading" class="side-refs__note"><q-spinner size="14px" /> loading…</div>
        <div v-else-if="error" class="side-refs__note is-error">{{ error }}</div>
        <div v-else-if="!items.length" class="side-refs__note">Nothing referenced inside.</div>
        <button
          v-if="!loading && items.length < (total || 0)"
          type="button" class="side-refs__more" @click="load(true)"
        >
          {{ (total || 0) - items.length }} more
        </button>
      </template>
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import ElementMini from 'src/components/shared/ElementMini.vue'
import { refService } from 'src/services/ref.service'

const PAGE = 12
const WORD = { skeletons: 'skeleton', posts: 'post', dashboards: 'board', nodes: 'node', labels: 'label', paths: 'path', links: 'link', moments: 'moment', secrets: 'secret', entities: 'entity' }

export default defineComponent({
  name: 'SideReferences',
  components: { ElementMini },
  props: {
    // The element whose contents are listed, '<kind>/<hash>'.
    address: { type: String, required: true },
    // What to call it in the "holds no references" note ('post', 'label', …).
    kindWord: { type: String, default: 'element' }
  },
  setup (props) {
    const items = ref([])
    const total = ref(null)
    const supported = ref(true)
    const loading = ref(false)
    const error = ref('')
    const listEl = ref(null)

    let seq = 0
    const load = async (more = false) => {
      if (!props.address) return
      const my = ++seq
      loading.value = true
      error.value = ''
      try {
        const r = await refService.references(props.address, { limit: PAGE, offset: more ? items.value.length : 0 })
        if (my !== seq) return
        items.value = more ? items.value.concat(r.items || []) : (r.items || [])
        total.value = r.total ?? 0
        supported.value = r.supported !== false
      } catch (e) {
        if (my !== seq) return
        if (!more) items.value = []
        error.value = e?.response?.data?.error?.message || 'The references could not be read'
      }
      if (my === seq) loading.value = false
    }

    // The caption over each mini: the edge that holds it, in the reader's
    // words — a body ref, a board's item, a path's position, a link's
    // target, else the slot's own name.
    const viaWord = (it) => {
      if (it.via === 'body') return 'in the text'
      if (it.via === 'board') return 'on the board'
      if (it.via === 'member') return 'step ' + ((it.position ?? 0) + 1)
      if (it.via === 'target') return 'points at'
      if (it.via === 'CONTENT') return 'in the content'
      return String(it.via || '').toLowerCase().replace(/_/g, ' ')
    }
    const lockedWord = (it) => 'a ' + (WORD[it.kind] || 'element')

    watch(() => props.address, () => {
      items.value = []
      total.value = null
      supported.value = true
      if (listEl.value) listEl.value.scrollTop = 0
      load(false)
    }, { immediate: true })

    return { items, total, supported, loading, error, listEl, load, viaWord, lockedWord }
  }
})
</script>

<style scoped lang="scss">
// The thread box's twin (SideElementView `.side-element__thread`): the
// card's line ink for its rim, the card's corner, the grey-2 floor, the
// grey-3 bar — two boxes stacked in one column read as one furniture.
.side-refs {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--grey-2, #eeeeee);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--pit-r, 6.34px);
  overflow: hidden;
}

.side-refs__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  padding: 2px;
  border-bottom: 1px solid var(--grey-5, #bdbdbd);
  background: var(--grey-3, #e0e0e0);
  font-family: var(--font-display);
  font-size: 0.72em;
  letter-spacing: 0.02em;
}

// The bar's one word — drawn as the thread bar's ON tab (it is the only
// section here), so the two bars share one grammar.
.side-refs__tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 4px;
  background: var(--light-cream, #fcf3e0);
  color: var(--red-10, #b71c1c);
}
.side-refs__tab-n {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

// THE FEED OF MINIS — dense: 6px between items, a 6px inset, every medium
// capped low so a picture-heavy post still lists several references in view.
.side-refs__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
  --media-max-h: 160px;
}

.side-refs__item {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-refs__via {
  display: flex;
  min-width: 0;
  padding: 0 2px;
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  letter-spacing: 0.02em;
  color: rgba(var(--ink-rgb), 0.55);
  text-transform: lowercase;
}
.side-refs__via-word {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-refs__row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  &.is-locked { color: rgba(var(--ink-rgb), 0.5); }
}

.side-refs__note {
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.8em;
  padding: 4px 2px;
  &.is-error { color: var(--red-10, #b71c1c); }
}

.side-refs__more {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.6);
  font-size: 0.76em;
  cursor: pointer;
  padding: 2px;
  &:hover { color: rgba(var(--ink-rgb), 0.95); }
}
</style>
