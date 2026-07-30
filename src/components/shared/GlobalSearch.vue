<template>
  <span>
    <q-btn
      flat dense no-caps
      icon="search"
      class="nav-btn"
      @click="open = true"
    >
      <q-tooltip>search everything (Thread E)</q-tooltip>
    </q-btn>

    <q-dialog v-model="open" position="top">
      <q-card class="gsearch">
        <q-card-section class="q-pb-none">
          <q-input
            v-model="q"
            dense outlined autofocus clearable
            placeholder="search everything ever said…"
            debounce="350"
            @update:model-value="run"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </q-card-section>

        <q-card-section v-if="searching" class="gsearch__state">
          <q-spinner-dots size="22px" />
        </q-card-section>

        <q-card-section v-else-if="ran && !nodes.length && !refs.length" class="gsearch__state">
          nothing matches — access filters apply, so private content only
          answers to those who may read it
        </q-card-section>

        <q-card-section v-else-if="nodes.length || refs.length" class="gsearch__results">
          <div v-if="refs.length" class="gsearch__band">
            <div class="gsearch__label">by name</div>
            <div class="row q-gutter-xs wrap">
              <q-chip
                v-for="r in refs" :key="`${r.kind}:${r.hash || r.id}`"
                dense clickable size="sm"
                :icon="r.kind === 'entities' ? 'person' : r.kind === 'labels' ? 'label' : 'article'"
                @click="go(r)"
              >
                {{ r.primary || r.name || r.hash?.slice(0, 10) }}
              </q-chip>
            </div>
          </div>
          <div v-if="nodes.length" class="gsearch__band">
            <div class="gsearch__label">in content</div>
            <div
              v-for="n in nodes" :key="n.id"
              class="gsearch__hit"
              @click="goNode(n)"
            >
              <q-icon name="notes" size="13px" class="gsearch__hit-icon" />
              <span class="gsearch__snippet">{{ n.snippet }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </span>
</template>

<script>
// The global search (Thread E's face, 2026-07-30): one input over
// GET /api/search — FULLTEXT body hits (already viewer-filtered
// server-side) + name/hash ref matches. Every result routes to its own
// viewer; the search surface itself holds nothing.
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from 'src/services/api'

export default defineComponent({
  name: 'GlobalSearch',
  setup () {
    const router = useRouter()
    const open = ref(false)
    const q = ref('')
    const searching = ref(false)
    const ran = ref(false)
    const nodes = ref([])
    const refs = ref([])

    const run = async () => {
      const query = (q.value || '').trim()
      if (query.length < 2) { nodes.value = []; refs.value = []; ran.value = false; return }
      searching.value = true
      try {
        const { data } = await api.get('/search', { params: { q: query, limit: 12 } })
        nodes.value = data.nodes || []
        refs.value = data.refs || []
        ran.value = true
      } catch (_) { nodes.value = []; refs.value = [] }
      searching.value = false
    }

    const goNode = (n) => {
      open.value = false
      router.push(`/nodes/${n.id}`)
    }
    const go = (r) => {
      open.value = false
      if (r.kind === 'entities') router.push(`/entities/${r.id}`)
      else if (r.kind === 'labels') router.push(`/labels/${r.id}`)
      else if (r.kind === 'posts') router.push(`/posts/${r.id}`)
    }

    return { open, q, searching, ran, nodes, refs, run, go, goNode }
  }
})
</script>

<style lang="scss" scoped>
.gsearch {
  width: 520px;
  max-width: 94vw;
  margin-top: 40px;

  &__state {
    font-size: 0.78rem;
    opacity: 0.6;
    text-align: center;
  }
  &__results { max-height: 55vh; overflow-y: auto; }
  &__band { margin-bottom: 10px; }
  &__label {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.5;
    margin-bottom: 4px;
  }
  &__hit {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 6px;
    border-radius: 6px;
    cursor: pointer;
    &:hover { background: rgba(0, 0, 0, 0.05); }
  }
  &__hit-icon { opacity: 0.5; flex: 0 0 auto; }
  &__snippet {
    font-size: 0.76rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
