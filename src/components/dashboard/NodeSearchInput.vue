<template>
  <!-- NODE SMART SEARCH (dashboards phase 4, 2026-08-10) — the edit mode's
       "add a node" input beside SkeletonSearchInput (one shared skin,
       smart-input.scss). Empty focus lists the ACTING entity's recent
       uploads (GET /nodes/uploads?ownerId= — "your latest things");
       typing rides the FULLTEXT shadow (GET /api/search → nodes). Picks
       append to the open dashboard's ITEMS; rows are drag SOURCES on
       application/x-pathos-ref. -->
  <div class="smart-input" @focusout="onFocusOut">
    <div class="smart-input__box">
      <q-icon name="description" size="13px" class="smart-input__glyph" />
      <input
        v-model="q"
        type="text"
        class="smart-input__field"
        placeholder="Add a node…"
        @focus="onFocus"
        @input="onType"
        @keydown.enter.prevent="pickFirst"
        @keydown.esc="openList = false"
      >
      <q-spinner v-if="loading" size="12px" />
    </div>

    <div v-if="openList && rows.length" class="smart-input__drop">
      <button
        v-for="r in rows"
        :key="r.id"
        type="button"
        class="smart-input__row"
        draggable="true"
        @dragstart="onDragStart(r, $event)"
        @mousedown.prevent
        @click="pick(r)"
      >
        <q-icon name="description" size="12px" class="smart-input__row-glyph" />
        <span class="smart-input__row-name">{{ r.primary }}</span>
        <span v-if="r.snippet" class="smart-input__row-snippet">{{ r.snippet }}</span>
        <q-space />
        <span class="smart-input__row-id mono">#{{ r.id }}</span>
        <q-icon name="drag_indicator" size="12px" class="smart-input__row-drag" />
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import api from 'src/services/api'
import { nodeService } from 'src/services/node.service'
import { useAuthStore } from 'src/stores/auth'
import { shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'NodeSearchInput',
  emits: ['pick'],
  setup (props, { emit }) {
    const q = ref('')
    const rows = ref([])
    const openList = ref(false)
    const loading = ref(false)
    const auth = useAuthStore()
    let seq = 0

    const search = async () => {
      const mySeq = ++seq
      loading.value = true
      try {
        if (q.value.trim()) {
          const { data } = await api.get('/search', { params: { q: q.value.trim(), limit: 12 } })
          if (mySeq !== seq) return
          rows.value = (data.nodes || []).map(n => ({
            id: n.id,
            path: n.path,
            primary: shortHash(n.path, 10),
            snippet: (n.snippet || '').slice(0, 60)
          }))
        } else {
          const r = await nodeService.listUploads({ ownerId: auth.entityId, limit: 12 })
          if (mySeq !== seq) return
          rows.value = (r.nodes || []).map(n => ({
            id: n.id,
            path: n.path,
            primary: n.file?.name || n.name || shortHash(n.path, 10),
            snippet: n.file?.kind || ''
          }))
        }
      } catch (_) {
        if (mySeq === seq) rows.value = []
      }
      if (mySeq === seq) loading.value = false
    }

    let debounce = null
    const onType = () => {
      clearTimeout(debounce)
      debounce = setTimeout(search, 250)
    }
    const onFocus = () => { openList.value = true; search() }
    const onFocusOut = (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) openList.value = false
    }

    const pick = (r) => {
      emit('pick', { kind: 'nodes', address: r.path, id: r.id, name: r.primary })
      q.value = ''
      openList.value = false
    }
    const pickFirst = () => { if (rows.value.length) pick(rows.value[0]) }

    const onDragStart = (r, e) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({
        kind: 'nodes', address: r.path, primary: r.primary || ''
      }))
    }

    return { q, rows, openList, loading, onType, onFocus, onFocusOut, pick, pickFirst, onDragStart }
  }
})
</script>

<style lang="scss" scoped src="./smart-input.scss"></style>
