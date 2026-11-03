<template>
  <!-- THE FEED ELEMENT (2026-11-02, user ask: "since the feed is post-only
       … create a feed element viewer family that can showcase all elements
       inside feed containers").

       The feed tier of the CARD family — not a second family. Every kind
       already has its X-Card on the post card's grammar (`shared/
       ElementCard.vue` and the nine kind cards, 2026-10-08); what a FEED
       CONTAINER adds is a CONTRACT, not chrome, and this component is where
       that contract lives:

         · THE CEILING — a card in a feed column obeys the post card's
           height rule. The host publishes `--feed-element-ceiling` (FeedStream
           writes the very `--post-ceiling` formula on its element rows);
           here it becomes the card's `--element-card-max` and its media
           budget (`--element-card-media`), so a tall pit scrolls in place
           the way a post's does;
         · THE LIST-HOST RULE — `thread: false` by default: a stream of ten
           cards does not fire twenty `/refs/comments|forks` reads to draw
           doors (the post rows carry their tallies on the feed row; an
           element's thread is one press away in its window);
         · THE OPEN DOOR — the store's own `spawn` (a window from the feed;
           inside the side viewer the sink turns it into a step INSIDE the
           viewer — the 2026-10-07 navigation rule), unless the host is a
           `window-host`, which gets `select(target)` instead;
         · THE FILLING KINDS (the label's unravel, the board) — a viewer that
           wants its host's height gets a DEFINITE box in a stream: the
           square (`--post-square-max`, the column's width), capped by the
           ceiling;
         · A STEADY BOX WHILE IT READS — a feed row arrives as an address and
           its card resolves a beat later; drawn as a 32px spinner meanwhile,
           a block of ten measured in that state dragged the windowed ring's
           average block height down until the whole track shrank under the
           reader and the ring chased its blocks to the end of the stream
           (measured 2026-11-03: a jump to 50% landed on blocks 163–166
           inside a 1.25M px spacer). A row that is still reading stands at
           `--feed-element-pending-h` (40% of the column, under the ceiling);
           a filling kind the row already names (label, board) takes its
           square from the first frame;
         · A POST stays THE postcard: `item` (a feed row) or a post address
           resolves through ElementCard → PostCard → FeedStream's embed.

       Input: `address` ('<kind>/<hash>', any dress ElementCard takes), or a
       `row` — an element-stream row (`GET /feed/elements`: `{ kind, id,
       address }`, a post row being a whole feed row) or a ref summary
       (`{ address | path | ref }` / `{ prefix, hash }`) — or `item`, a feed
       row. FeedStream mounts it for every non-post row of its KINDS lens;
       the side viewer's REFERENCES list is its next host. -->
  <div
    class="feed-element"
    :class="{ 'feed-element--fills': fills, 'feed-element--post': isPost, 'feed-element--pending': pending }"
    :data-kind="kind || null"
    :data-element="elementAddress || null"
  >
    <ElementCard
      :address="isPost ? '' : elementAddress"
      :item="postItem"
      :label="label || row?.name || ''"
      :thread-on="threadOn"
      :thread-host="threadHost"
      :thread="thread"
      :window-host="true"
      :fill="true"
      @select="onSelect"
      @thread="(slot) => $emit('thread', slot)"
      @pins-changed="$emit('pins-changed')"
      @resolved="onResolved"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import ElementCard from 'src/components/shared/ElementCard.vue'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'
import { kindFor } from 'src/utils/kinds'

// The kinds whose card is a viewer that fills its host (ElementCard's
// FILLING set) — a row naming one takes its square before it resolves.
const FILLING = new Set(['label', 'dashboard'])

// A row's address in whichever dress it travels: the stream's `address`,
// a summary's `path` / `ref`, or a `{ prefix, hash }` pair.
const addressOf = (row) => {
  if (!row) return ''
  const a = row.address || row.path || row.ref || row.skeleton_path || ''
  if (a) return String(a).replace(/^pathos:/, '')
  return row.prefix && row.hash ? `${row.prefix}/${row.hash}` : ''
}

export default defineComponent({
  name: 'FeedElement',
  components: { ElementCard },
  props: {
    address: { type: String, default: '' },
    row: { type: Object, default: null },
    item: { type: Object, default: null },
    label: { type: String, default: '' },
    ...CARD_PROPS,
    // THE LIST-HOST RULE: no thread doors unless the host hands totals in.
    thread: { type: [Object, Boolean], default: false }
  },
  emits: [...CARD_EMITS, 'resolved'],
  setup (props, { emit }) {
    const flyouts = useFlyoutViewersStore()

    // A feed row — handed in, or a stream row that IS one (post rows of
    // `GET /feed/elements` are whole `GET /feed` rows).
    const postItem = computed(() => props.item || (props.row?.skeleton_id != null ? props.row : null))
    const isPost = computed(() => !!postItem.value)
    const elementAddress = computed(() => props.address || addressOf(props.row) || addressOf(postItem.value))

    const resolvedKind = ref(null)
    const kind = computed(() => {
      if (isPost.value) return 'post'
      if (resolvedKind.value) return resolvedKind.value
      const k = props.row?.kind || String(elementAddress.value).split('/')[0]
      return k ? kindFor(k).kind : null
    })

    // Until the card says otherwise, a row that names a filling kind fills.
    const fills = ref(FILLING.has(props.row?.kind))
    const pending = ref(!isPost.value)
    const onResolved = (r) => {
      resolvedKind.value = r?.kind || null
      fills.value = !!r?.fills
      pending.value = false
      emit('resolved', r)
    }

    // ElementCard is always a window-host here, so every open door — the
    // nine cards' and the postcard's alike — arrives as one `select`.
    const onSelect = (t) => {
      if (props.windowHost) { emit('select', t); return }
      if (t) flyouts.spawn(t)
    }

    return { postItem, isPost, elementAddress, kind, fills, pending, onResolved, onSelect }
  }
})
</script>

<style lang="scss" scoped>
.feed-element {
  // THE CEILING — the host's (FeedStream: the post card's own formula), else
  // the feed card's old resting 60vh.
  --element-card-max: var(--feed-element-ceiling, 60vh);
  --element-card-media: var(--feed-element-ceiling, 60vh);
  min-width: 0;
  display: flex;
  flex-direction: column;
}
// A FILLING kind stands as the column's square, capped by the ceiling — a
// definite box its viewer can fill (and scroll inside).
.feed-element--fills {
  height: min(var(--feed-element-ceiling, 60vh), var(--post-square-max, 100cqw));
}
// STILL READING — a steady box for the windowed ring to measure (see the
// note above); the resolved card takes its own height.
.feed-element--pending:not(.feed-element--fills) {
  --feed-element-pending-h: min(var(--feed-element-ceiling, 60vh), calc(0.4 * var(--post-square-max, 100cqw)));
  min-height: var(--feed-element-pending-h);
}
</style>
