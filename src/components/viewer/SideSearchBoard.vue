<template>
  <!-- ── TALAVERO'S SEARCH BOARD (2026-10-07 eve, user ask: "introduce a
       search feature with cute dropdowns at the top of the side viewer.
       Preferably, use talavero to create the search header board and try
       finding a way of finding everything through it somewhat fast").

       The side viewer's HEAD, built from the feed's own Talavero board
       material (FeedHeadBox's talk pit): the seat's face at the left of a
       carved `--brown-1` pit, then ONE bubble — `--indigo-8` rim, Nasalization
       — holding two pill dropdowns and the field:
         · WHAT  — All, or one kind (posts, people, labels, nodes, paths,
                   schemas, moments, links), each in its kinds.js colour;
         · WHERE — open a hit in the side viewer (default) or as a window.

       FAST: one keystroke fans out ONE `GET /refs/search` per kind in scope
       (+ `GET /search`, the FULLTEXT node shadow, from 3 chars) in parallel,
       160ms debounced, every answer cached per (kind, q) for the session and
       drawn the moment it lands — the slow kind never holds the quick ones.
       A hex q also matches hash prefixes on every kind (the server's rule),
       and a pasted address (`kind/hash`, `pathos:…`) is offered as itself.
       Empty field + focus = the viewer's own history ("recently viewed").
       Keys: `/` focuses (outside any field), ↑ ↓ walk, Enter opens, Esc
       closes. -->
  <div ref="rootEl" class="side-search" :class="{ 'is-open': open }">
    <span class="side-search__seat" :class="{ 'is-thinking': pending > 0 }" :title="seatName + ' finds things for you'">
      <EntityAvatar :entity="seatEntity" :size="24" />
    </span>

    <div class="side-search__bubble">
      <button
        type="button"
        class="side-search__pill"
        :style="{ '--pill-tone': kindMeta.color }"
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

// Session cache: one answer per (kind, q) — a second keystroke back to a
// prefix already asked costs nothing.
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
      const key = kind + '\u0000' + text
      let rows = cache.get(key)
      if (!rows) {
        pending.value++
        try {
          if (kind === 'fulltext') {
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
            const r = await refService.search(kind, text, scope.value === 'all' ? 4 : 12)
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
      const m = ADDRESS_RE.exec(text)
      if (m) {
        const prefix = m[1].toLowerCase() === 'posts' ? 'skeletons' : m[1].toLowerCase()
        out.push({ key: 'address', word: 'Address', icon: 'link', color: kindFor(prefix).color, rows: [{ kind: prefix, address: `${prefix}/${m[2].toLowerCase()}`, hash: m[2].toLowerCase(), primary: 'Open this address', secondary: prefix }] })
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
// ── THE PIT: Talavero's talk room at header scale — FeedHeadBox's
// `.feed-head__half--talk` floor (`--brown-1`, carved by an inset shadow),
// the seat's face at its left, the bubble filling the rest.
.side-search {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px;
  background: var(--brown-1, #efebe9);
  box-shadow: inset 0 1px 3px rgba(62, 39, 35, 0.28), inset 0 -1px 0 rgba(62, 39, 35, 0.12);
  font-family: var(--font-display);
}

.side-search__seat {
  flex: 0 0 auto;
  display: inline-flex;
  border-radius: 7px;
  box-shadow: 0 0 0 1.5px var(--indigo-8, #283593);
  transition: box-shadow 0.2s;
  &.is-thinking { animation: side-search-think 0.9s ease-in-out infinite alternate; }
}
@keyframes side-search-think {
  from { box-shadow: 0 0 0 1.5px var(--indigo-8, #283593); }
  to { box-shadow: 0 0 0 3px var(--indigo-4, #7986cb); }
}

// The bubble: the feed board's chat field (`.feed-head__chat-input`) —
// `--indigo-8` 2px rim, pale face, carved.
.side-search__bubble {
  flex: 1 1 auto;
  min-width: 0;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 3px;
  border: 2px solid var(--indigo-8, #283593);
  border-radius: 9px;
  background: var(--grey-1, #fafafa);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
}
.side-search.is-open .side-search__bubble { border-color: var(--indigo-10, #1a237e); }

// THE CUTE DROPDOWNS: soft pills tinted by the kind they name.
.side-search__pill {
  --pill-tone: var(--indigo-8, #283593);
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 20px;
  padding: 0 5px 0 6px;
  border: 1px solid color-mix(in srgb, var(--pill-tone) 55%, transparent);
  border-radius: 999px;
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
