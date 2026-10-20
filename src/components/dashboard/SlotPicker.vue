<template>
  <!-- THE SLOT PICKER (dashboards phase 9, 2026-10-19) — what an EMPTY slot
       shows in edit mode: one box that finds ANY element for the slot.
         · type a NAME → your boards (listMine, filtered here), then posts /
           skeletons / nodes / labels / paths through `/refs/search` (kind
           by kind, the summary shape the chips eat);
         · paste an ADDRESS (`kind/hash`, `pathos:` dress, the `dashboards/`
           and `posts/` aliases) → the one row that resolves it;
         · the slot is also a DROP TARGET on `application/x-pathos-ref`
           (the dock's tabs, the stack, every chip) — DashboardSlot owns that.
       A board never offers ITSELF (`exclude`) — a cycle is a wall of pills.
       Picks hand the canonical `<kind>/<hash>` up. Replaces phase 4's two
       smart inputs (SkeletonSearchInput + NodeSearchInput). -->
  <div class="slot-picker" :class="{ 'is-compact': compact }">
    <div class="slot-picker__box">
      <q-icon :name="kindHint ? kindFor(kindHint).icon : 'add_box'" size="14px" class="slot-picker__glyph" />
      <input
        ref="fieldEl"
        v-model="q"
        type="text"
        class="slot-picker__field"
        :placeholder="placeholder"
        @focus="open = true"
        @keydown.esc="open = false"
        @keydown.enter.prevent="pickFirst"
      >
      <q-spinner v-if="busy" size="12px" class="slot-picker__busy" />
    </div>

    <div v-if="open" class="slot-picker__drop" @mousedown.prevent>
      <div v-if="pasted" class="slot-picker__section">
        <span class="slot-picker__head">address</span>
        <button type="button" class="slot-picker__row" @click="pick(pasted)">
          <q-icon :name="kindFor(pasted.split('/')[0]).icon" size="12px" :style="{ color: kindFor(pasted.split('/')[0]).color }" />
          <span class="slot-picker__primary mono">{{ pasted }}</span>
        </button>
      </div>

      <template v-for="sec in sections" :key="sec.kind">
        <div v-if="sec.rows.length" class="slot-picker__section">
          <span class="slot-picker__head">{{ sec.label }}</span>
          <button
            v-for="r in sec.rows"
            :key="r.address"
            type="button"
            class="slot-picker__row"
            :title="r.address"
            @click="pick(r.address)"
          >
            <q-icon :name="kindFor(sec.kind).icon" size="12px" :style="{ color: kindFor(sec.kind).color }" />
            <span class="slot-picker__primary">{{ r.primary || '(untitled)' }}</span>
            <span v-if="r.secondary" class="slot-picker__secondary">{{ r.secondary }}</span>
          </button>
        </div>
      </template>

      <div v-if="!busy && !pasted && !sections.some(s => s.rows.length)" class="slot-picker__empty">
        {{ q.trim() ? 'nothing by that name' : 'type a name, or paste an address' }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { refService } from 'src/services/ref.service'
import { dashboardService } from 'src/services/dashboard.service'
import { kindFor, prefixFor } from 'src/utils/kinds'

// The kinds the box searches, in the order they list. Boards come first
// from listMine; `posts` and `skeletons` both answer with `skeletons/`
// addresses (a POST instance picked here still blooms as its post).
const SEARCH_KINDS = [
  { kind: 'posts', label: 'posts' },
  { kind: 'skeletons', label: 'skeletons' },
  { kind: 'nodes', label: 'nodes' },
  { kind: 'labels', label: 'labels' },
  { kind: 'paths', label: 'paths' }
]
const ALIAS = { posts: 'skeletons', dashboards: 'skeletons', files: 'entities' }
const LEAF = new Set(['nodes', 'skeletons', 'labels', 'paths', 'entities', 'moments', 'links', 'secrets'])

export const canonicalRef = (raw) => {
  const parts = String(raw || '').trim().replace(/^pathos:/, '').split('/').filter(Boolean)
  if (parts.length < 2) return null
  const hash = parts[parts.length - 1]
  const prefix = ALIAS[parts[parts.length - 2]] || parts[parts.length - 2]
  if (!LEAF.has(prefix) || !/^[0-9a-f]{8,}$/i.test(hash)) return null
  return `${prefix}/${hash.toLowerCase()}`
}

export default defineComponent({
  name: 'SlotPicker',
  props: {
    // Addresses this picker must not offer (the host board's own).
    exclude: { type: Array, default: () => [] },
    // A template slot's declared kind narrows the search to it.
    kindHint: { type: String, default: '' },
    placeholder: { type: String, default: 'find an element — a board, a post, a node, a label… or paste its address' },
    compact: { type: Boolean, default: false },
    autofocus: { type: Boolean, default: false }
  },
  emits: ['pick'],
  setup (props, { emit }) {
    const fieldEl = ref(null)
    const q = ref('')
    const open = ref(false)
    const busy = ref(false)
    const boards = ref(null)
    const sections = ref([])

    const excluded = computed(() => new Set((props.exclude || []).map(canonicalRef).filter(Boolean)))
    const pasted = computed(() => {
      const c = canonicalRef(q.value)
      return c && !excluded.value.has(c) ? c : null
    })

    const loadBoards = async () => {
      if (boards.value) return boards.value
      try {
        const r = await dashboardService.listMine()
        boards.value = r.success ? (r.dashboards || []) : []
      } catch (_) { boards.value = [] }
      return boards.value
    }

    let seq = 0
    const search = async () => {
      const my = ++seq
      const needle = q.value.trim().toLowerCase()
      busy.value = true
      const out = []
      const hint = props.kindHint ? prefixFor(props.kindHint) : ''
      try {
        if (!hint || hint === 'skeletons' || hint === 'dashboards') {
          const mine = await loadBoards()
          const rows = mine
            .filter(b => !needle || (b.name || '').toLowerCase().includes(needle) || String(b.id).includes(needle))
            .map(b => ({ address: b.path, primary: b.name || '(untitled board)', secondary: '#' + b.id }))
            .filter(r => !excluded.value.has(canonicalRef(r.address)))
            .slice(0, 8)
          out.push({ kind: 'dashboards', label: 'your boards', rows })
        }
        if (needle) {
          const kinds = hint
            ? SEARCH_KINDS.filter(k => k.kind === hint || (hint === 'skeletons' && k.kind === 'posts'))
            : SEARCH_KINDS
          const reads = await Promise.all(kinds.map(async (k) => {
            try {
              const r = await refService.search(k.kind, needle, 6)
              const rows = (r?.results || [])
                .map(x => ({ address: canonicalRef(x.address), primary: x.primary, secondary: x.secondary }))
                .filter(x => x.address && !excluded.value.has(x.address))
              return { ...k, rows }
            } catch (_) { return { ...k, rows: [] } }
          }))
          out.push(...reads)
        }
      } finally {
        if (my === seq) { sections.value = out; busy.value = false }
      }
    }

    let timer = null
    watch(q, () => { clearTimeout(timer); timer = setTimeout(search, 220) })
    watch(open, (v) => { if (v) search() })

    const pick = (address) => {
      const c = canonicalRef(address)
      if (!c) return
      open.value = false
      q.value = ''
      emit('pick', c)
    }
    const pickFirst = () => {
      if (pasted.value) return pick(pasted.value)
      const first = sections.value.find(s => s.rows.length)?.rows[0]
      if (first) pick(first.address)
    }

    const onDocDown = (e) => {
      if (!fieldEl.value) return
      const root = fieldEl.value.closest('.slot-picker')
      if (root && !root.contains(e.target)) open.value = false
    }
    onMounted(() => {
      document.addEventListener('mousedown', onDocDown)
      if (props.autofocus) fieldEl.value?.focus()
    })
    onBeforeUnmount(() => { document.removeEventListener('mousedown', onDocDown); clearTimeout(timer) })

    return { fieldEl, q, open, busy, pasted, sections, pick, pickFirst, kindFor }
  }
})
</script>

<style lang="scss" scoped>
// Grey family (the dock's dials), the dashboard brown on focus — one
// box, a dropdown of rows under it. Never a floating element positioned
// out of an overflow box: the drop is IN FLOW inside the slot.
.slot-picker {
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.slot-picker__box {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  background: #fff;
  border: 1px solid var(--dock-rule, var(--grey-4));
  border-radius: 6px;

  &:focus-within { border-color: var(--brown-6, #795548); }
}

.slot-picker__glyph { color: var(--brown-5, #8d6e63); flex-shrink: 0; }
.slot-picker__busy { color: var(--brown-5, #8d6e63); flex-shrink: 0; }

.slot-picker__field {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font: inherit;
  font-size: 0.78em;
  color: var(--dock-ink, var(--brown-8));

  &::placeholder { color: var(--dock-ink-mute, var(--brown-4)); }
}

.slot-picker__drop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 6;
  max-height: 240px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(62, 39, 35, 0.14);
  text-align: left;
}

.is-compact .slot-picker__drop { max-height: 180px; }

.slot-picker__section { padding: 4px 0; border-bottom: 1px solid var(--grey-3, #eee); &:last-child { border-bottom: none; } }

.slot-picker__head {
  display: block;
  padding: 2px 10px;
  font-size: 0.62em;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dock-ink-mute, var(--brown-4));
}

.slot-picker__row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 0.76em;
  color: var(--dock-ink, var(--brown-8));

  &:hover { background: rgba(121, 85, 72, 0.08); }
}

.slot-picker__primary { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.slot-picker__secondary { flex-shrink: 0; font-size: 0.86em; color: var(--dock-ink-mute, var(--brown-4)); }

.slot-picker__empty {
  padding: 10px;
  font-size: 0.72em;
  font-style: italic;
  color: var(--dock-ink-mute, var(--brown-4));
  text-align: center;
}
</style>
