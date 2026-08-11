<template>
  <!-- SKELETON SMART SEARCH (dashboards phase 4, 2026-08-10) — the edit
       mode's "add a table" input: recent-first on focus (GET /skeletons
       ?sort=recent), name LIKE as you type (?q=), access-filtered
       server-side. Enter/click appends the pick to the open dashboard
       (the host owns the addItem call); every row is also a DRAG SOURCE
       speaking application/x-pathos-ref, so a result can be dropped onto
       a phase-5 layout slot exactly like a tab can. -->
  <div class="smart-input" @focusout="onFocusOut">
    <div class="smart-input__box">
      <q-icon name="schema" size="13px" class="smart-input__glyph" />
      <input
        v-model="q"
        type="text"
        class="smart-input__field"
        placeholder="Add a skeleton…"
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
        <q-icon name="schema" size="12px" class="smart-input__row-glyph" />
        <span class="smart-input__row-name">{{ r.name || '(untitled)' }}</span>
        <span v-if="r.is_schema" class="smart-input__row-badge">SCHEMA</span>
        <q-space />
        <span class="smart-input__row-id mono">#{{ r.id }}</span>
        <q-icon name="drag_indicator" size="12px" class="smart-input__row-drag" />
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { skeletonService } from 'src/services/skeleton.service'

export default defineComponent({
  name: 'SkeletonSearchInput',
  emits: ['pick'],
  setup (props, { emit }) {
    const q = ref('')
    const rows = ref([])
    const openList = ref(false)
    const loading = ref(false)
    let seq = 0

    const search = async () => {
      const mySeq = ++seq
      loading.value = true
      try {
        const r = await skeletonService.list(
          q.value.trim() ? { q: q.value.trim() } : { sort: 'recent' }
        )
        if (mySeq !== seq) return
        rows.value = (r.skeletons || []).slice(0, 12)
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
    // focusout fires before the row's click without the @mousedown.prevent
    // on the rows — with it, focus never leaves the field on a pick.
    const onFocusOut = (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) openList.value = false
    }

    const pick = (r) => {
      emit('pick', { kind: 'skeletons', address: r.path, id: r.id, name: r.name || '' })
      q.value = ''
      openList.value = false
    }
    const pickFirst = () => { if (rows.value.length) pick(rows.value[0]) }

    const onDragStart = (r, e) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({
        kind: 'skeletons', address: r.path, primary: r.name || ''
      }))
    }

    return { q, rows, openList, loading, onType, onFocus, onFocusOut, pick, pickFirst, onDragStart }
  }
})
</script>

<style lang="scss" scoped src="./smart-input.scss"></style>
