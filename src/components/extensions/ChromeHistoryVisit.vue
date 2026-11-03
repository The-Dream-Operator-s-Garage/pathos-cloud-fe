<template>
  <!-- ONE VISIT, ONE CARD (ChromeHistoryLane's row since 2026-11-02 — its
       own component since 2026-11-03, when the card got a pin of its own:
       `usePin` is per element, and a v-for cannot call a composable).
       ⭐ 2026-11-03 (allegue: "make it a little tighter/denser … the hairline
       below go edge-to-edge … a hairline on the right of the date time
       information to put the title and the site icon right there … on the
       right corner of the header, add a dense pin button"; "use the extended
       pill instead of the compressed one … put the actual link on the right.
       Keep it one-line if no embedded item"):
         head band   moment chip · datetime │ site icon · title · channel   📌
                     one row, no padding of the card's own — the band's
                     hairline runs rim to rim, the vertical one meets it
         body        the node's EXTENDED nano pill ……… host/path   (one line)
                     + the node's mini under it when the page is an object
                       (a video keeps its embed, as it was) -->
  <div
    class="chrome-visit"
    :class="visit.node?.embed ? 'is-object' : 'is-link'"
    :style="cardStyle"
    data-testid="chrome-history-row"
  >
    <div class="chrome-visit__band">
      <div class="chrome-visit__when" :title="whenText">
        <MicroChip v-if="visit.moment" kind="moments" :id="visit.moment.id" :path="visit.moment.path" collapsed />
        <span class="chrome-visit__datetime mono">{{ whenText }}</span>
      </div>
      <div class="chrome-visit__heading" :title="headingTitle">
        <SiteIcon v-if="place.href" :href="place.href" size="13px" />
        <span class="chrome-visit__title">{{ visit.title || place.host || visit.node?.content }}</span>
        <span v-if="visit.page?.channel" class="chrome-visit__channel">· {{ visit.page.channel }}</span>
      </div>
      <!-- THE PIN — the node (what the visit holds) onto the root's pins,
           the mini family's pin: one session-wide pinned set, lit amber. -->
      <button
        v-if="pinnable"
        type="button"
        class="chrome-visit__pin"
        :class="{ 'is-on': pinned }"
        :title="pinTitle"
        :aria-pressed="pinned"
        :disabled="pinBusy"
        data-testid="chrome-history-pin"
        @click.stop.prevent="togglePin"
      >
        <q-icon name="push_pin" size="11px" />
      </button>
    </div>

    <div class="chrome-visit__body">
      <div v-if="visit.node?.path" class="chrome-visit__ref" data-testid="chrome-history-ref">
        <span class="chrome-visit__pill">
          <MicroChip kind="nodes" :id="visit.node.id" :path="visit.node.path" />
        </span>
        <a
          v-if="place.href"
          class="chrome-visit__place mono"
          :href="place.href"
          target="_blank"
          rel="noopener noreferrer"
          :title="place.href"
        ><b>{{ place.host }}</b>{{ place.rest }}</a>
      </div>
      <NodeMini v-if="visit.node?.embed && visit.node?.path" :node="visit.node" class="chrome-visit__object" />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import NodeMini from 'src/components/nodes/NodeMini.vue'
import SiteIcon from 'src/components/shared/SiteIcon.vue'
import { usePin } from 'src/composables/usePin'
import { KINDS } from 'src/utils/kinds'

// A visit card wears the node family's colorway — what it holds is a node.
const cardStyle = { '--visit-c': KINDS.nodes.color, '--visit-ink': KINDS.nodes.ink }

// The link, said as a place: host (www. dropped) + the rest of the address.
const placeOf = (node) => {
  try {
    const u = new URL(String(node?.content || '').split('\n')[0].trim())
    if (!/^https?:$/.test(u.protocol)) return {}
    const rest = (u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')) + u.search
    return { href: u.href, host: u.hostname.replace(/^www\./, ''), rest }
  } catch (_) { return {} }
}

export default defineComponent({
  name: 'ChromeHistoryVisit',
  components: { MicroChip, NodeMini, SiteIcon },
  props: {
    // a GET /extensions/history row: { id, visited_at, title, node, moment, page }
    visit: { type: Object, required: true }
  },
  setup (props) {
    const place = computed(() => placeOf(props.visit.node))
    const whenText = computed(() => props.visit.moment?.datetime || props.visit.visited_at)
    // the cut title says itself whole on hover, channel and all
    const headingTitle = computed(() => {
      const v = props.visit
      const t = v.title || place.value.host || v.node?.content || ''
      return v.page?.channel ? `${t} · ${v.page.channel}` : t
    })

    const { pinnable, pinned, pinBusy, pinTitle, togglePin } = usePin(() => ({
      kind: 'nodes',
      id: props.visit.node?.id ?? null,
      address: props.visit.node?.path || '',
      label: props.visit.title || place.value.host || ''
    }))

    return { cardStyle, place, whenText, headingTitle, pinnable, pinned, pinBusy, pinTitle, togglePin }
  }
})
</script>

<style lang="scss" scoped>
// The card: a thin rim in the node family's teal, the mini family's corners
// (top radius-md, bottom the pit's), a coat a breath off white so it reads
// as a thing on the window's sheet. NO padding of its own (2026-11-03) —
// the band and the body pad themselves, so the band's hairline runs from
// rim to rim; `overflow: hidden` keeps the band inside the rounded top.
.chrome-visit {
  --visit-rule: color-mix(in srgb, var(--visit-c) 22%, transparent);
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--visit-c) 38%, transparent);
  border-radius: var(--radius-md) var(--radius-md) var(--pit-r, 6.34px) var(--pit-r, 6.34px);
  background: color-mix(in srgb, var(--visit-c) 4%, var(--paper-card, #fff));
  overflow: hidden;
  container: visit / inline-size;
}

// THE HEAD BAND — one dense row: the moment │ the page │ the pin. The
// cells stretch the band's full height, so the vertical hairline meets the
// horizontal one with no gap.
.chrome-visit__band {
  display: flex;
  align-items: stretch;
  min-width: 0;
  min-height: 22px;
  border-bottom: 1px solid var(--visit-rule);
  font-size: 10px;
  color: var(--brown-4);
}

// The moment keeps its width on a roomy card; on a narrow one the datetime
// gives way (ellipsis) before the title drops under its 45% — and under
// 340px it steps aside whole, the moment pill (its door) standing alone.
.chrome-visit__when {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 0 7px 0 5px;
  white-space: nowrap;
  overflow: hidden;

  > .micro-chip { flex-shrink: 0; }
}
.chrome-visit__datetime { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
@container visit (max-width: 340px) {
  .chrome-visit__datetime { display: none; }
}

// the page: its site's icon, then its title — the room the moment leaves,
// cut where the band ends
.chrome-visit__heading {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 45%;
  padding: 0 4px 0 7px;
  border-left: 1px solid var(--visit-rule);
}

.chrome-visit__title {
  min-width: 0;
  font-size: 11.5px;
  color: var(--brown-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chrome-visit__channel {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// THE PIN — the lane's refresh idiom at the band's corner: a bare glyph,
// grey until hovered, the card family's "on" amber once pinned.
.chrome-visit__pin {
  flex: 0 0 auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 2px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--grey-6);
  cursor: pointer;

  &:hover:not(:disabled) { color: var(--brown-8); background: var(--grey-3); }
  &.is-on { color: var(--accent, #c79a00); }
  &:disabled { cursor: default; opacity: 0.5; }
}

.chrome-visit__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 5px 7px 6px;
}

// THE REFERENCE, one line: the node's extended pill takes what the link
// leaves (its elastic hash cuts at the edge), the link stands at the right.
.chrome-visit__ref {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.chrome-visit__pill {
  flex: 1 1 0;
  display: flex;
  min-width: 120px;
}

.chrome-visit__place {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 62%;
  font-size: 10px;
  color: var(--visit-ink);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  b { font-weight: 700; }
  &:hover { text-decoration: underline; }
}
</style>
