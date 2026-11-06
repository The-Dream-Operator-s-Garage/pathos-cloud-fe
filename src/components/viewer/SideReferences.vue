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
       sink, 2026-10-07), so the list is a path the reader can walk.

       ⭐ 2026-11-03 — A FEED OF CARDS (the ask's second half: the right
       column is "the feed-like section", and the feed element viewers it
       waited on landed — `feed/FeedElement.vue`, the feed tier of the card
       family): every reference is now its kind's CARD in a feed container
       — the post card's grammar, a ceiling (`--feed-element-ceiling`), no
       thread doors (the list-host rule), its open door a step INSIDE the
       viewer through the same sink. The list is an inline-size container,
       so a filling kind (a label's unravel, a board) stands as the
       column's square.

       ⭐ 2026-11-04 — A PLAIN SCROLL OF MINIS (user asks: draw the side
       viewer's lists in "the same family that is used inside the skeleton
       viewers to represent paths" — then, of this list: "is the reference
       path an actual path? … I think it is inferred. do not display it as a
       path if it isn't. keep the references a simple scroll of elements").
       It IS inferred — referenceService computes it on every read from the
       item's body, slots and members; nothing stores it, so the item's
       skeleton never lists it. For the hour it wore a path mini's shell it
       was an impostor; now each reference is its kind's MINI (the family a
       path's members wear, so a comment, a fork and a reference read alike)
       in one scroll, the `via` caption over it, the thumbs on every votable
       member's foot (MiniVotesScope). The feed cards left. -->
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
      <!-- ⭐ 2026-11-06: the rows are SideMiniList — the one list the
           thread draws too (comments and forks), so the side viewer's
           columns share one component, not one copy of its markup. -->
      <SideMiniList
        v-else
        :items="rows"
        :loading="loading"
        :error="error"
        empty="Nothing referenced inside."
        :more="Math.max((total || 0) - items.length, 0)"
        @more="load(true)"
      />
    </div>
  </section>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import SideMiniList from 'src/components/viewer/SideMiniList.vue'
import { refService } from 'src/services/ref.service'

const PAGE = 12

export default defineComponent({
  name: 'SideReferences',
  components: { SideMiniList },
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
    // The rows SideMiniList draws: each reference, its edge as the caption.
    const rows = computed(() => items.value.map((it) => ({
      key: it.via + ':' + it.address + ':' + (it.position ?? ''),
      address: it.address,
      locked: !!it.locked,
      caption: viaWord(it)
    })))
    watch(() => props.address, () => {
      items.value = []
      total.value = null
      supported.value = true
      if (listEl.value) listEl.value.scrollTop = 0
      load(false)
    }, { immediate: true })

    return { items, rows, total, supported, loading, error, listEl, load }
  }
})
</script>

<style scoped lang="scss">
// The thread box's twin (SideElementView `.side-element__thread`): the
// card's line ink for its rim, the card's corner — two boxes stacked in one
// column read as one furniture. ⭐ 2026-11-04: the CARD's grammar — a grey
// frame (`--sev-frame`) with the bar on it and the list in a pit on the post
// card's PIT coat (`--sev-floor`, grey-1 — one content tone for all three
// sections; the box stood on grey-2 under a grey-3 bar until today); the
// host also sets the corner (flush sections: the viewer's own corner where
// this box meets it, square against the dividers).
.side-refs {
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  // ⭐ the FRAME since 2026-11-04 (the host's `--sev-frame`, the card's grey-4
  // coat): the bar on it, the list in a pit — the card's grammar.
  background: var(--sev-frame, var(--grey-4, #e0e0e0));
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--pit-r, 6.34px);
  overflow: hidden;
}

.side-refs__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  padding: 2px;
  background: transparent; // on the frame (2026-11-04; grey-3 over a grey-5 line before)
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

// THE PIT round the scroll of minis (2026-11-04; a feed of FeedElement cards
// 2026-11-03, minis before that).
// …and the list is the section's PIT (2026-11-04): the card's content
// container — the floor `--sev-floor`, a grey-5 rim, the pit's corner,
// inset in the frame by the card pit's own margins.
.side-refs__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin: var(--sev-pit-m, 3px 4px 4px);
  background: var(--sev-floor, var(--grey-1, #fafafa));
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--sev-pit-r, 6.34px);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
}

// The rows, their captions, notes and "+N more" are SideMiniList's own
// (2026-11-06) — the one list the thread draws too.
.side-refs__note {
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.8em;
  padding: 4px 2px;
}
</style>
