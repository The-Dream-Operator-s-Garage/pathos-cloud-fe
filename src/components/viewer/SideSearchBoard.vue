<template>
  <!-- ── TALAVERO'S SEARCH BOARD (2026-10-07 eve, user ask: "introduce a
       search feature with cute dropdowns at the top of the side viewer.
       Preferably, use talavero to create the search header board and try
       finding a way of finding everything through it somewhat fast").

       The side viewer's HEAD, built from the feed's own Talavero board
       material (FeedHeadBox's talk pit): the seat's face at the left of a
       carved `--brown-1` pit, then ONE bubble — `--indigo-8` rim, Nasalization
       — holding two pill dropdowns and the field (⭐ 2026-11-04: the pit's
       floor is the shown element's INK — the rail checker's dark tiles — and
       the face + the field sit in a light-cream ROOM, FeedHeadBox's talk room
       at one line, its corners the feed board's, the pills and a veil over
       the face and the field in the element's tone — the style notes):
         · WHAT  — All, or one kind (posts, people, labels, nodes, paths,
                   schemas, moments, links), each in its kinds.js colour;
         · WHERE — open a hit in the side viewer (default) or as a window.

       FAST: one keystroke fans out ONE `GET /refs/search` per kind in scope
       (+ `GET /search`, the FULLTEXT node shadow, from 3 chars) in parallel,
       160ms debounced, every answer cached per (kind, q) for the session and
       drawn the moment it lands — the slow kind never holds the quick ones.
       A hex q also matches hash prefixes on every kind (the server's rule),
       and a pasted address (`kind/hash`, `pathos:…`) is offered as itself —
       and ONLY as itself (2026-11-03): no fan-out, one `GET /refs/summary`
       names the row. Fanned out, the address made the posts and people
       scans resolve their whole candidate lists (4–8 s), and every other
       read in the side viewer queued behind them.
       Empty field + focus = the viewer's own history ("recently viewed").
       Keys: `/` focuses (outside any field), ↑ ↓ walk, Enter opens, Esc
       closes. -->
  <div ref="rootEl" class="side-search" :class="{ 'is-open': open }">
    <!-- ⭐ 2026-11-04 — THE ROOM (user ask: "make this bubble look the same
         as the feed container talavero board … a clear light bubble with the
         talavero and the input bubble inside, except … a single-line one"):
         FeedHeadBox's talk room at one line — a light-cream room on the dark
         body, the seat's face and the field inside it. -->
    <div class="side-search__room">
    <span class="side-search__seat" :class="{ 'is-thinking': pending > 0 }" :title="seatName + ' finds things for you'">
      <EntityAvatar :entity="seatEntity" :size="24" />
    </span>

    <div class="side-search__bubble">
      <!-- Both pills wear the SHOWN element's tone (2026-11-04: "make the
           buttons … match the color of the given reviewed element"); the
           scope's own colour stays on its glyph in the menu. -->
      <button
        type="button"
        class="side-search__pill"
        :title="'Search in: ' + kindMeta.word"
        @mousedown.prevent
      >
        <q-icon :name="kindMeta.icon" size="12px" />
        <span class="side-search__pill-word">{{ kindMeta.short }}</span>
        <q-icon name="expand_more" size="12px" class="side-search__caret" />
        <q-menu class="side-search__menu" anchor="bottom left" self="top left" :offset="[0, 4]" auto-close>
          <button
            v-for="k in SCOPES" :key="k.key"
            type="button"
            class="side-search__menu-row"
            :class="{ 'is-on': scope === k.key }"
            :style="{ '--pill-tone': k.color }"
            @click="setScope(k.key)"
          >
            <q-icon :name="k.icon" size="13px" class="side-search__menu-glyph" />
            <span>{{ k.word }}</span>
          </button>
        </q-menu>
      </button>

      <input
        ref="inputEl"
        v-model="q"
        class="side-search__input"
        type="search"
        spellcheck="false"
        autocomplete="off"
        :placeholder="'Ask ' + seatName + ' to find ' + kindMeta.find + '…'"
        :aria-label="'Search ' + kindMeta.word"
        @focus="open = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(flat[active])"
        @keydown.esc.prevent="close"
      >

      <button
        type="button"
        class="side-search__pill side-search__pill--where"
        :title="where === 'viewer' ? 'Hits open here, in the side viewer' : 'Hits open as floating windows'"
        @mousedown.prevent
      >
        <q-icon :name="where === 'viewer' ? 'view_sidebar' : 'open_in_new'" size="12px" />
        <q-icon name="expand_more" size="12px" class="side-search__caret" />
        <q-menu class="side-search__menu" anchor="bottom right" self="top right" :offset="[0, 4]" auto-close>
          <button
            v-for="w in WHERES" :key="w.key"
            type="button"
            class="side-search__menu-row"
            :class="{ 'is-on': where === w.key }"
            @click="where = w.key"
          >
            <q-icon :name="w.icon" size="13px" class="side-search__menu-glyph" />
            <span>{{ w.word }}</span>
          </button>
        </q-menu>
      </button>
    </div>
    </div>

    <!-- THE DROP: grouped by kind, drawn as each kind answers. -->
    <div v-if="open && (groups.length || pending || q.trim())" class="side-search__drop" role="listbox">
      <div v-if="!q.trim() && groups.length" class="side-search__hint">Recently viewed here</div>
      <section v-for="g in groups" :key="g.key" class="side-search__group" :style="{ '--pill-tone': g.color }">
        <header class="side-search__group-head">
          <q-icon :name="g.icon" size="12px" />
          <span>{{ g.word }}</span>
          <span class="side-search__group-n">{{ g.rows.length }}</span>
        </header>
        <button
          v-for="row in g.rows" :key="g.key + ':' + row.address"
          type="button"
          class="side-search__row"
          :class="{ 'is-active': flat[active] === row }"
          role="option"
          :aria-selected="flat[active] === row"
          @mousedown.prevent
          @mouseenter="active = flat.indexOf(row)"
          @click="pick(row)"
        >
          <span class="side-search__row-primary">{{ row.primary }}</span>
          <span v-if="row.secondary" class="side-search__row-secondary">{{ row.secondary }}</span>
          <span class="side-search__row-hash">{{ row.hash.slice(0, 6) }}</span>
        </button>
      </section>
      <div v-if="pending" class="side-search__hint"><q-spinner-dots size="14px" /> {{ seatName }} is looking…</div>
      <div v-else-if="q.trim() && !groups.length" class="side-search__hint">Nothing answers to “{{ q.trim() }}”.</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import { refService } from 'src/services/ref.service'
import { feedService } from 'src/services/feed.service'
import { kindFor } from 'src/utils/kinds'

// The WHAT dropdown. `key` = the /refs/search kind ('all' fans out to all).
const SCOPE_DEFS = [
  { key: 'all', word: 'Everything', short: 'All', find: 'anything', icon: 'travel_explore', color: '#5d4037' },
  { key: 'posts', word: 'Posts', short: 'Posts', find: 'a post' },
  { key: 'entities', word: 'People & agents', short: 'People', find: 'someone' },
  { key: 'labels', word: 'Labels', short: 'Labels', find: 'a label' },
  { key: 'nodes', word: 'Nodes', short: 'Nodes', find: 'a node' },
  { key: 'paths', word: 'Paths', short: 'Paths', find: 'a path' },
  { key: 'skeletons', word: 'Schemas & skeletons', short: 'Schemas', find: 'a skeleton' },
  { key: 'moments', word: 'Moments', short: 'Moments', find: 'a moment' },
  { key: 'links', word: 'Links', short: 'Links', find: 'a link' }
]
const SCOPES = SCOPE_DEFS.map((s) => s.key === 'all' ? s : { ...s, icon: kindFor(s.key).icon, color: kindFor(s.key).color })
const KIND_KEYS = SCOPES.filter((s) => s.key !== 'all').map((s) => s.key)
const WHERES = [
  { key: 'viewer', word: 'Open in the side viewer', icon: 'view_sidebar' },
  { key: 'window', word: 'Open as a window', icon: 'open_in_new' }
]
const DEBOUNCE_MS = 160
const ADDRESS_RE = /^(?:pathos:)?(posts|skeletons|nodes|labels|paths|links|moments|secrets|entities)\/([0-9a-f]{8,})$/i

// A pasted address → `{ kind, address, hash }` (posts/ reads as skeletons/).
const addressOf = (text) => {
  const m = ADDRESS_RE.exec(text)
  if (!m) return null
  const kind = m[1].toLowerCase() === 'posts' ? 'skeletons' : m[1].toLowerCase()
  const hash = m[2].toLowerCase()
  return { kind, address: `${kind}/${hash}`, hash }
}

// Session cache: one answer per (kind, q, limit) — a second keystroke back
// to a prefix already asked costs nothing, and narrowing All (4 a kind) to
// one kind (12) asks again instead of keeping the 4.
const cache = new Map()

export default defineComponent({
  name: 'SideSearchBoard',
  components: { EntityAvatar },
  props: {
    // The viewer's history, newest first — `{ address, kind, label }` —
    // shown as "recently viewed" while the field is empty.
    recent: { type: Array, default: () => [] }
  },
  emits: ['open', 'open-window'],
  setup (props, { emit }) {
    const rootEl = ref(null)
    const inputEl = ref(null)
    const q = ref('')
    const scope = ref('all')
    const where = ref('viewer')
    const open = ref(false)
    const active = ref(0)
    const pending = ref(0)
    const results = ref({}) // kind → rows
    const seat = ref(null)

    const kindMeta = computed(() => SCOPES.find((s) => s.key === scope.value) || SCOPES[0])
    const seatName = computed(() => seat.value?.display_name || 'Talavero')
    const seatEntity = computed(() => ({
      id: seat.value?.id || null,
      display_name: seatName.value,
      photo: seat.value?.photo || null
    }))

    const rowOf = (r, kind) => ({
      kind: r.kind || kind,
      address: r.address || `${r.kind || kind}/${r.hash}`,
      hash: String(r.hash || '').toLowerCase(),
      primary: r.primary || r.label || (kind + ' #' + r.id),
      secondary: typeof r.secondary === 'string' ? r.secondary : ''
    })

    // ── the fan-out ────────────────────────────────────────────────
    let seq = 0
    let timer = null
    const ask = async (kind, text, my) => {
      const limit = scope.value === 'all' ? 4 : 12
      const key = [kind, text, limit].join('\u0000')
      let rows = cache.get(key)
      if (!rows) {
        pending.value++
        try {
          if (kind === 'address') {
            // the pasted address, named by its own summary
            const s = (await refService.summary(text))?.summary
            rows = s && s.id != null && !s.locked ? [{ primary: s.primary, secondary: s.secondary || '' }] : []
          } else if (kind === 'fulltext') {
            const r = await refService.fulltext(text, 6)
            rows = (r?.nodes || []).map((n) => rowOf({
              kind: 'nodes',
              id: n.id,
              hash: String(n.path || '').split('/').pop(),
              address: n.path,
              primary: String(n.snippet || '').replace(/^---[\s\S]*?\n(?:name:\s*)?/, '').split('\n').find((l) => l.trim()) || ('node #' + n.id),
              secondary: 'words match'
            }, 'nodes'))
          } else {
            const r = await refService.search(kind, text, limit)
            rows = (r?.results || []).filter((x) => !x.locked).map((x) => rowOf(x, kind))
          }
          cache.set(key, rows)
        } catch (_) {
          rows = []
        } finally {
          pending.value--
        }
      }
      if (my !== seq) return
      results.value = { ...results.value, [kind]: rows }
    }

    const run = () => {
      const text = q.value.trim()
      const my = ++seq
      results.value = {}
      active.value = 0
      if (!text) return
      const addr = addressOf(text)
      if (addr) return ask('address', addr.address, my)
      const kinds = scope.value === 'all' ? KIND_KEYS : [scope.value]
      kinds.forEach((k) => ask(k, text, my))
      if (text.length >= 3 && (scope.value === 'all' || scope.value === 'nodes')) ask('fulltext', text, my)
    }

    watch(q, () => {
      open.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(run, DEBOUNCE_MS)
    })
    const setScope = (k) => {
      scope.value = k
      run()
      if (inputEl.value) inputEl.value.focus()
    }

    // ── the drop's groups ──────────────────────────────────────────
    const groups = computed(() => {
      const text = q.value.trim()
      if (!text) {
        const rows = props.recent.map((r) => ({
          kind: r.kind,
          address: r.address,
          hash: String(r.address || '').split('/').pop(),
          primary: r.label || r.address,
          secondary: ''
        })).filter((r) => r.address)
        return rows.length ? [{ key: 'recent', word: 'Recent', icon: 'history', color: '#5d4037', rows }] : []
      }
      const out = []
      const addr = addressOf(text)
      if (addr) {
        // the element's own headline once its summary lands
        const named = (results.value.address || [])[0]
        out.push({ key: 'address', word: 'Address', icon: 'link', color: kindFor(addr.kind).color, rows: [{ ...addr, primary: named?.primary || 'Open this address', secondary: named ? (named.secondary || addr.kind) : addr.kind }] })
      }
      const seen = new Set()
      for (const s of SCOPES) {
        if (s.key === 'all') continue
        let rows = (results.value[s.key] || []).slice()
        if (s.key === 'nodes') rows = rows.concat(results.value.fulltext || [])
        rows = rows.filter((r) => r.hash && !seen.has(r.address) && seen.add(r.address))
        if (rows.length) out.push({ key: s.key, word: s.word, icon: s.icon, color: s.color, rows })
      }
      return out
    })
    const flat = computed(() => groups.value.flatMap((g) => g.rows))

    const move = (d) => {
      open.value = true
      const n = flat.value.length
      if (!n) return
      active.value = (active.value + d + n) % n
    }

    const close = () => {
      open.value = false
      if (inputEl.value) inputEl.value.blur()
    }

    const pick = (row) => {
      if (!row) return
      emit(where.value === 'window' ? 'open-window' : 'open', { address: row.address, label: row.primary })
      open.value = false
      if (inputEl.value) inputEl.value.blur()
    }

    // `/` focuses the board from anywhere outside a field; a press outside
    // the board closes the drop.
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (!rootEl.value || !rootEl.value.offsetParent) return
      e.preventDefault()
      inputEl.value && inputEl.value.focus()
    }
    const onDown = (e) => {
      if (!open.value || !rootEl.value) return
      if (rootEl.value.contains(e.target)) return
      if (e.target.closest && e.target.closest('.side-search__menu')) return
      open.value = false
    }

    onMounted(async () => {
      document.addEventListener('keydown', onKey)
      document.addEventListener('pointerdown', onDown, true)
      try {
        const ctx = await feedService.getLensContext()
        seat.value = ctx?.seat || null
      } catch (_) { /* the stub face stands */ }
    })
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown, true)
      if (timer) clearTimeout(timer)
    })

    return {
      SCOPES,
      WHERES,
      rootEl,
      inputEl,
      q,
      scope,
      where,
      open,
      active,
      pending,
      kindMeta,
      seatName,
      seatEntity,
      groups,
      flat,
      setScope,
      move,
      close,
      pick
    }
  }
})
</script>

<style scoped lang="scss">
// ── THE BOARD: Talavero's talk room at header scale — FeedHeadBox's talk
// half, one line tall.
// ⭐ 2026-11-04, the day's four asks, in order:
//   1. "reduce the outer padding around talavero's pic and … the bubble …
//      make those item's outer thick border … exactly the same as the lips"
//      — the pad came down to 3px; the 2px cream LIP rims it asked for are
//      now THE ROOM's own cream (ask 3), the room being the rail lips' tone.
//   2. "the background color of the side viewer's header … use the same dark
//      one as the tiles on the checkered frieze bar" — THE BODY is the shown
//      element's INK (`--side-viewer-plate`, kinds.js `ink`, set by
//      SideViewer per stop: posts indigo-10, nodes teal-10, labels red-10 …),
//      flat like the feed board's indigo-8 body. (`--brown-1` carved before;
//      the kind's lighter `color` for an hour — "too light".)
//   3. "make this bubble look the same as the feed container talavero board
//      … a clear light bubble with the talavero and the input bubble inside
//      … single-line … keep the current occupied space, but if needed, make
//      the section slightly bigger … make the buttons and add an overlay over
//      talavero's pic and the input bubble match the color of the given
//      reviewed element" — THE ROOM: `--light-cream` (the feed room's face)
//      in a 1px rim of the element's tone lightened (`--ssb-rim`, 70% tone +
//      white: for a post that IS the feed room's indigo-4), 3px pad, the face
//      and the FIELD inside it; the field the feed's chat field (brown-1
//      face, the same carve, a 1px `--ssb-rim`), one line; a VEIL of the
//      element's tone over the face (`--ssb-veil`, 30%) and a WASH over the
//      field's face (`--ssb-wash`, 12% — under its contents, so the words
//      and pills stay crisp); both pills in the tone. The head grew 34 → 38
//      (3 + room 32 + 3) — "slightly bigger", to seat a 24px field.
//   4. "match the roundness of the feed container talavero board so they
//      look like they're of the same kind" — the feed board's own numbers:
//      the room 13px (`--fhead-talk-r`), the field 12px (`--fhead-chat-r`),
//      the face 40% (the feed seat's avatar); the pills stay CONCENTRIC with
//      the field (ask of the same morning: "their roundness match the
//      roundness of their containers") — 12 − 1 − 2 = 9px on an 18px pill,
//      a capsule again because the field turned rounder.
//   5. (later) "make side viewer talavero board bubble match the border
//      roundness of its container, rounder on top corners and less round on
//      bottom corners. never rounder than the container closest corners bc
//      it looks weird" — the room left the feed board's 13px, which was
//      rounder than the box it stands in (the viewer's 10px). Its corners now
//      answer to the corners NEAREST them: the TOP pair turns CONCENTRIC with
//      the box's inside corner (`--side-viewer-inner-r` 9 − the 3px body pad
//      = 6px), so the ink band round it keeps one width through the turn;
//      the BOTTOM pair sits on the divider's straight seam, which has no
//      curve to follow, so it is the soft floor — 3px, less round, not
//      square. The top never drops below the floor (a phone's box is square:
//      the room is 3px all round there).
.side-search {
  --ssb-pad: 3px;          // the body round the room (the feed body's 3px)
  --ssb-room-pad: 3px;     // the room round its face + field (the feed room's)
  --ssb-room-r-bottom: 3px; // on the divider's straight seam: the soft floor
  // concentric with the box's inside corner, never under the floor
  --ssb-room-r-top: max(var(--ssb-room-r-bottom), calc(var(--side-viewer-inner-r, 9px) - var(--ssb-pad)));
  --ssb-field-h: 24px;     // the one line: the field's and the face's height
  --ssb-field-r: 12px;     // FeedHeadBox `--fhead-chat-r`
  --ssb-field-rim: 1px;
  --ssb-inset: 2px;        // the field's inner pad round its pills
  --ssb-tone: var(--side-viewer-lip, var(--indigo-6, #3f51b5));
  --ssb-rim: color-mix(in srgb, var(--ssb-tone) 70%, white);
  --ssb-veil: color-mix(in srgb, var(--ssb-tone) 30%, transparent);
  --ssb-wash: color-mix(in srgb, var(--ssb-tone) 12%, transparent);
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding: var(--ssb-pad);
  background: var(--side-viewer-plate, var(--indigo-8, #303f9f));
  font-family: var(--font-display);
  transition: background-color 0.25s;
}

// THE ROOM — the clear light bubble that holds the face and the field.
.side-search__room {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: var(--ssb-room-pad);
  background: var(--light-cream, #fcf3e0);
  border: 1px solid var(--ssb-rim);
  // rounder on top (the box's corner), less round on the bottom (the seam)
  border-radius: var(--ssb-room-r-top) var(--ssb-room-r-top) var(--ssb-room-r-bottom) var(--ssb-room-r-bottom);
}

// The face: the feed seat's avatar corner, the element's VEIL over it.
.side-search__seat {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  border-radius: 40%;
  :deep(.entity-avatar) { border-radius: 40%; }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ssb-veil);
    pointer-events: none;
    transition: background-color 0.25s;
  }
  // Thinking: the veil breathes.
  &.is-thinking::after { animation: side-search-think 0.9s ease-in-out infinite alternate; }
}
@keyframes side-search-think {
  from { opacity: 1; }
  to { opacity: 0.25; }
}

// The field: the feed board's chat field (`.feed-head__chat-input`) at one
// line — brown-1 face under the element's WASH, carved, a 1px rim in the
// room's tone.
.side-search__bubble {
  flex: 1 1 auto;
  min-width: 0;
  height: var(--ssb-field-h);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--ssb-inset);
  border: var(--ssb-field-rim) solid var(--ssb-rim);
  border-radius: var(--ssb-field-r);
  background: linear-gradient(var(--ssb-wash), var(--ssb-wash)), var(--brown-1, #efebe9);
  box-shadow:
    inset 0 1.5px 4px rgba(var(--ink-rgb-deep, 31, 42, 56), 0.3),
    inset 0 -1px 0 rgba(255, 255, 255, 0.4);
}

// THE DROPDOWNS: soft pills in the shown element's tone (ask 3), CONCENTRIC
// with the field (ask 4 — its corner less its rim and the inset).
.side-search__pill {
  --pill-tone: var(--ssb-tone);
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: calc(var(--ssb-field-h) - 2 * var(--ssb-field-rim) - 2 * var(--ssb-inset));
  padding: 0 5px 0 6px;
  border: 1px solid color-mix(in srgb, var(--pill-tone) 55%, transparent);
  border-radius: calc(var(--ssb-field-r) - var(--ssb-field-rim) - var(--ssb-inset));
  background: color-mix(in srgb, var(--pill-tone) 13%, white);
  color: var(--pill-tone);
  font: inherit;
  font-size: 0.62em;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  &:hover { background: color-mix(in srgb, var(--pill-tone) 22%, white); transform: translateY(-1px); }
}
.side-search__pill--where { padding: 0 3px 0 5px; }
.side-search__caret { opacity: 0.7; margin-left: -1px; }

.side-search__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.9);
  font: inherit;
  font-size: 0.68em;
  &::placeholder { color: rgba(var(--ink-rgb), 0.4); }
  &::-webkit-search-cancel-button { cursor: pointer; }
}

// ── THE DROP: a cream sheet hanging under the board, over the divider and
// the well — grouped by kind, each group in its kinds.js tone.
.side-search__drop {
  position: absolute;
  top: calc(100% + 2px);
  left: 8px;
  right: 8px;
  z-index: 20;
  max-height: min(62vh, 520px);
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--grey-6, #9e9e9e);
  border-radius: 8px;
  background: var(--light-cream, #fcf3e0);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
  scrollbar-width: thin;
}

.side-search__group + .side-search__group { margin-top: 6px; }

.side-search__group-head {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  color: var(--pill-tone);
  font-size: 0.6em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.side-search__group-n { opacity: 0.6; font-variant-numeric: tabular-nums; }

.side-search__row {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 8px 4px 10px;
  border: 0;
  border-left: 2px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.88);
  font-family: var(--font-body, inherit);
  font-size: 0.78em;
  text-align: left;
  cursor: pointer;
  &.is-active {
    background: color-mix(in srgb, var(--pill-tone) 12%, white);
    border-left-color: var(--pill-tone);
  }
}
.side-search__row-primary {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.side-search__row-secondary {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--ink-rgb), 0.5);
  font-size: 0.9em;
}
.side-search__row-hash {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--pill-tone);
  font-family: var(--font-mono, monospace);
  font-size: 0.82em;
  opacity: 0.75;
}

.side-search__hint {
  padding: 4px 8px;
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.7em;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

<style lang="scss">
// The dropdown menus teleport to the body — unscoped, named by their class.
.side-search__menu {
  padding: 4px;
  border-radius: 9px;
  background: var(--light-cream, #fcf3e0);
  border: 1px solid var(--grey-6, #9e9e9e);
  font-family: var(--font-display);
}
.side-search__menu-row {
  --pill-tone: var(--indigo-8, #283593);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.85);
  font: inherit;
  font-size: 0.72em;
  letter-spacing: 0.02em;
  text-align: left;
  cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--pill-tone) 12%, white); }
  &.is-on { background: color-mix(in srgb, var(--pill-tone) 18%, white); color: var(--pill-tone); }
}
.side-search__menu-glyph { color: var(--pill-tone); }
</style>
