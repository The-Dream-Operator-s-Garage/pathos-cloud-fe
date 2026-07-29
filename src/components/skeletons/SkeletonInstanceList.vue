<template>
  <!-- The instantiation list carved inside a skeleton square's pit.

       LabelSquares recurses into child labels because each child has its
       own distinguishing NAME. Instances don't: every instance inherits its
       template's name (every POST instance is just "POST"), so recursing
       squares here rendered a wall of identical words. Instead each
       instantiation extends this list as an identifying row — title (or
       compacted name), author, age, excerpt — the same facts the
       detail page's Usages panel shows. A row can still dig further (its own
       instances, e.g. forks) as a nested, indented list. -->
  <div class="instance-list">
    <div v-if="loading && rows.length === 0" class="instance-list__loading">
      <q-spinner size="14px" color="primary" />
    </div>

    <div v-else-if="rows.length === 0" class="instance-list__empty">
      <q-icon name="schema" size="11px" class="q-mr-xs" /> no instantiations
    </div>

    <template v-else>
      <div v-for="row in rows" :key="row.id" class="instance-item">
        <div
          class="instance-row"
          :class="{ 'is-selected': selectedId === row.id }"
          @click.stop="$emit('select', row)"
        >
          <q-icon
            :name="isDug(row.id) ? 'indeterminate_check_box' : 'add_box'"
            size="13px"
            class="instance-row__toggle"
            title="Dig into this instantiation's own instances"
            @click.stop="toggleDig(row.id)"
          />

          <div class="instance-row__body">
            <div class="instance-row__head">
              <q-icon :name="iconFor(row)" size="12px" class="instance-row__kind" />
              <span class="instance-row__title" :title="row.title || row.name">
                {{ titleOf(row) }}
              </span>
              <q-space />
              <SkeletonRefLinks :id="row.id" :post="row.name === 'POST'" />
            </div>

            <div class="instance-row__meta">
              <q-icon name="person" size="10px" class="q-mr-xs" />
              <span>{{ (row.author && row.author.username) || ('entity #' + row.owner_id) }}</span>
              <span class="instance-row__dot">·</span>
              <span :title="row.created_at">{{ formatTimeShort(row.created_at) }}</span>
            </div>

            <div v-if="row.excerpt" class="instance-row__excerpt">
              {{ row.excerpt }}<span v-if="row.excerpt.length >= 120">…</span>
            </div>
          </div>
        </div>

        <div v-if="isDug(row.id)" class="instance-item__nest">
          <SkeletonInstanceList
            :parent-id="row.id"
            :depth="depth + 1"
            :selected-id="selectedId"
            @select="$emit('select', $event)"
          />
        </div>
      </div>

      <button
        v-if="total > rows.length"
        class="instance-list__more"
        @click.stop="loadMore"
      >
        <q-spinner v-if="loading" size="11px" class="q-mr-xs" />
        + {{ total - rows.length }} more…
      </button>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, watch } from 'vue'
import { skeletonService } from 'src/services/skeleton.service'
import SkeletonRefLinks from 'src/components/shared/SkeletonRefLinks.vue'

const PAGE = 30

const ICONS = {
  PATHOS_DOCS: 'folder',
  POST: 'article',
  PIN: 'push_pin',
  PINS: 'push_pin',
  USER_PROFILE: 'person',
  PATH_VIEW: 'route',
  ELEMENT: 'crop_free',
  // Per-kind element schemas (forks of ELEMENT) — icons match kinds.js.
  NODE: 'adjust',
  LABEL: 'label_important',
  MOMENT: 'schedule',
  SECRET: 'key',
  LINK: 'link',
  PATH: 'route'
}

export default defineComponent({
  name: 'SkeletonInstanceList',
  components: { SkeletonRefLinks },
  props: {
    // The skeleton whose direct instances (ancestor_id = parentId) we list.
    parentId: { type: [Number, String], required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: [Number, String], default: null }
  },
  emits: ['select', 'total'],
  setup (props, { emit }) {
    const loading = ref(false)
    const rows = ref([])
    const total = ref(0)
    const dug = reactive({})

    let nextPage = 1
    const fetchPage = async () => {
      loading.value = true
      try {
        const r = await skeletonService.listInstances(props.parentId, { limit: PAGE, page: nextPage })
        if (r.success) {
          const batch = r.instances || []
          rows.value = nextPage === 1 ? batch : [...rows.value, ...batch]
          total.value = r.total ?? rows.value.length
          emit('total', total.value)
          nextPage++
        }
      } catch (_) { /* keep what we have */ }
      loading.value = false
    }

    const reload = () => {
      nextPage = 1
      rows.value = []
      total.value = 0
      fetchPage()
    }

    const loadMore = () => { if (!loading.value) fetchPage() }

    const isDug = (id) => !!dug[id]
    const toggleDig = (id) => { dug[id] = !dug[id] }

    // Instances mostly carry a bound TITLE; fall back to the row name with
    // ELEMENT:<kind>/<hash> compacted so hashes don't flood the list.
    const titleOf = (row) => {
      if (row.title) return row.title
      const n = row.name || `skeleton #${row.id}`
      const m = n.match(/^ELEMENT:([a-z]+)\/([a-f0-9]{12,})$/)
      return m ? `ELEMENT:${m[1]}/${m[2].slice(0, 8)}…` : n
    }

    const iconFor = (row) => {
      if (row.is_doc) return 'menu_book'
      const base = (row.name || '').split(':')[0]
      return ICONS[base] || 'schema'
    }

    const formatTimeShort = (iso) => {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        const mins = Math.floor((Date.now() - d.getTime()) / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return mins + 'm'
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return hrs + 'h'
        const days = Math.floor(hrs / 24)
        if (days < 7) return days + 'd'
        return d.toLocaleDateString()
      } catch (_) { return iso }
    }

    onMounted(fetchPage)
    watch(() => props.parentId, reload)

    return {
      loading,
      rows,
      total,
      isDug,
      toggleDig,
      loadMore,
      titleOf,
      iconFor,
      formatTimeShort
    }
  }
})
</script>

<style lang="scss" scoped>
.instance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.instance-list__loading { padding: 4px; }

.instance-list__empty {
  display: inline-flex;
  align-items: center;
  font-size: 0.72em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
  padding: 2px 4px;
}

.instance-item { min-width: 0; }

.instance-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: var(--paper-card, #ffffff);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  padding: 6px 9px;
  cursor: pointer;
  transition: transform 0.06s, box-shadow 0.10s, border-color 0.12s;

  &:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(var(--ink-rgb-deep), 0.08);
  }
  &.is-selected {
    border-color: rgba(91, 108, 130, 0.85);
    box-shadow: 0 0 0 2px rgba(91, 108, 130, 0.22);
  }
}

.instance-row__toggle {
  color: rgba(var(--ink-rgb), 0.45);
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  &:hover { color: #5b6c82; }
}

.instance-row__body { flex: 1; min-width: 0; }

.instance-row__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.instance-row__kind { color: #5b6c82; flex-shrink: 0; }
.instance-row__title {
  font-size: 0.82em;
  font-weight: 600;
  color: var(--ink, #2C3D4E);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.instance-row__meta {
  display: flex;
  align-items: center;
  font-size: 0.7em;
  color: rgba(var(--ink-rgb), 0.55);
  margin-top: 3px;
}
.instance-row__dot { margin: 0 5px; opacity: 0.6; }

.instance-row__excerpt {
  font-size: 0.75em;
  color: rgba(var(--ink-rgb), 0.75);
  margin-top: 4px;
  line-height: 1.35;
  border-left: 2px solid rgba(var(--ink-rgb), 0.12);
  padding-left: 7px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Nested dig — indent under the parent row instead of re-tinting a pit.
.instance-item__nest {
  margin: 6px 0 2px 16px;
  padding-left: 9px;
  border-left: 2px solid rgba(91, 108, 130, 0.25);
}

.instance-list__more {
  align-self: flex-start;
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  background: transparent;
  border-radius: 7px;
  padding: 4px 10px;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.6);
  cursor: pointer;
  &:hover { border-color: #5b6c82; color: #5b6c82; }
}
</style>
