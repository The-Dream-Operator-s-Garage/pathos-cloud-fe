<template>
  <div class="ref-browser">

    <!-- ── Browse & search ─────────────────────────────────── -->
    <div class="ref-browser__section-label">Reference browser</div>

    <!-- Kind tabs — search one element type at a time.
         ⚠ NO `--kind-color` BINDING SINCE 2026-08-26 (user ask): the pressed
         pill wears the post window's one contrast tone, not a per-kind tint.
         See `.ref-kind.is-active` in the style block for the five tones this
         row used to carry and why they went. -->
    <div class="ref-kinds">
      <button
        v-for="k in kindTabs"
        :key="k.key"
        type="button"
        class="ref-kind"
        :class="{ 'is-active': kind === k.key }"
        @click="setKind(k.key)"
      >
        <q-icon :name="k.icon" size="13px" />
        <span>{{ k.label }}</span>
      </button>
    </div>

    <!-- Search box -->
    <q-input
      v-model="query" :dark="false" outlined dense
      class="ref-search"
      :placeholder="searchPlaceholder"
      clearable
      @update:model-value="onQueryInput"
    >
      <template #prepend><q-icon name="search" size="16px" /></template>
    </q-input>

    <!-- Results -->
    <div class="ref-results">
      <div v-if="searching" class="ref-results__state">
        <q-spinner size="18px" color="primary" />
      </div>
      <div v-else-if="results.length === 0" class="ref-results__state">
        {{ query ? 'No ' + kindLabel + ' matches.' : 'Newest ' + kindLabel + ' appear here.' }}
      </div>
      <template v-else>
        <template v-for="r in results" :key="r.address">
          <!-- Skeleton results wear the SkeletonMini itself (skeletons plan
               phase 3, 2026-09-01: "display a list of tables on the new
               nice mini viewer format") — the grid is the preview, the
               + adds it (mini tier), and the row DRAGS as a pathos ref so
               it can drop straight into another skeleton's cell. -->
          <div
            v-if="kind === 'skeletons'"
            class="ref-result ref-result--mini"
            :class="{ 'is-added': isAdded(r.address) }"
            draggable="true"
            @dragstart="onResultDragStart(r, $event)"
          >
            <div class="ref-result__mini">
              <SkeletonMini :ref-or-id="r.address" :name="r.primary" />
            </div>
            <button
              type="button"
              class="ref-result__pick"
              :title="isAdded(r.address) ? 'Already referenced' : 'Add to references (renders as its grid)'"
              @click="add(r)"
            >
              <q-icon :name="isAdded(r.address) ? 'check' : 'add'" size="14px" />
            </button>
          </div>
          <button
            v-else
            type="button"
            class="ref-result"
            :class="{ 'is-added': isAdded(r.address) }"
            :title="isAdded(r.address) ? 'Already referenced' : 'Add to references'"
            draggable="true"
            @dragstart="onResultDragStart(r, $event)"
            @click="add(r)"
          >
            <q-icon :name="iconFor(r.kind)" size="13px" class="ref-result__icon"
              :style="{ color: colorFor(r.kind) }" />
            <span class="ref-result__lines">
              <span class="ref-result__primary">{{ r.primary }}</span>
              <span v-if="r.secondary" class="ref-result__secondary">{{ r.secondary }}</span>
            </span>
            <q-icon :name="isAdded(r.address) ? 'check' : 'add'" size="14px" class="ref-result__add" />
          </button>
        </template>
      </template>
    </div>

    <!-- Direct address fallback -->
    <q-input
      v-model="addressInput" :dark="false" outlined dense
      class="ref-address"
      placeholder="…or paste an address / [[pathos:…]] ref"
      :error="!!addressHint" :error-message="addressHint"
      @update:model-value="addressHint = ''"
      @keyup.enter.prevent="addByAddress"
    >
      <template #prepend><q-icon name="hub" size="14px" /></template>
      <template #append>
        <q-btn flat dense round size="sm" icon="add" :loading="addressChecking"
          :disable="!addressInput || !addressInput.trim()" @click="addByAddress" />
      </template>
    </q-input>

    <!-- ── Selected references ─────────────────────────────── -->
    <div class="ref-browser__section-label q-mt-sm">
      In this post
      <span class="ref-browser__count mono">{{ references.length }}</span>
    </div>

    <div v-if="references.length === 0" class="ref-list__empty">
      Nothing referenced yet — pick elements above. They join the post's
      CONTENT path after the body; use <q-icon name="keyboard_return" size="11px" />
      to also invoke one inline at the cursor.
    </div>

    <div v-else class="ref-list">
      <div
        v-for="(r, i) in references"
        :key="r.address"
        class="ref-item"
        :class="{ 'is-dragging': dragIndex === i }"
        draggable="true"
        @dragstart="onDragStart(i, $event)"
        @dragover.prevent="onDragOver(i)"
        @dragend="onDragEnd"
      >
        <q-icon name="drag_indicator" size="14px" class="ref-item__grip" />
        <span class="ref-item__index mono">{{ i + 1 }}</span>
        <InfoChip dense :address="r.address" :primary="r.primary" class="ref-item__chip" />
        <span class="ref-item__actions">
          <!-- How this reference SHOWS in the post — auto (content decides:
               URL/media nodes bloom, the rest stay chips), micro (always
               the smallest chip, -[[…]]) or mini (always the full panel,
               ![[…]]). Applies to the inline invoke AND to the appended
               References list. -->
          <button type="button" class="ref-item__display mono"
            :class="'is-' + displayOf(r)"
            :title="'Preview tier: ' + displayOf(r) + ' — click to change'"
            @click="cycleDisplay(i)">
            {{ displayOf(r) }}
          </button>
          <button type="button" class="ref-item__btn" title="Invoke at cursor"
            @click="$emit('invoke', r)">
            <q-icon name="keyboard_return" size="13px" />
          </button>
          <button type="button" class="ref-item__btn" title="Move up"
            :disabled="i === 0" @click="move(i, -1)">
            <q-icon name="expand_less" size="13px" />
          </button>
          <button type="button" class="ref-item__btn" title="Move down"
            :disabled="i === references.length - 1" @click="move(i, 1)">
            <q-icon name="expand_more" size="13px" />
          </button>
          <button type="button" class="ref-item__btn ref-item__btn--danger" title="Remove"
            @click="removeAt(i)">
            <q-icon name="close" size="13px" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import SkeletonMini from 'src/components/skeletons/SkeletonMini.vue'
import { refService } from 'src/services/ref.service'
import { kindFor } from 'src/utils/kinds'

// Reference kinds a CONTENT path can carry (posts are skeletons).
const REF_KINDS = new Set(['nodes', 'paths', 'skeletons', 'labels'])

// ⚠ NO `color` KEY since 2026-08-26 (user ask) — the pressed pill is
// `--grey-6` for every kind now. The tones this row carried are kept in the
// style block, not here: dead data on a config array reads as a dial that
// still turns something.
const KIND_TABS = [
  { key: 'posts', label: 'Posts', icon: 'article' },
  { key: 'nodes', label: 'Nodes', icon: 'adjust' },
  { key: 'labels', label: 'Labels', icon: 'label_important' },
  { key: 'paths', label: 'Paths', icon: 'route' },
  { key: 'skeletons', label: 'Skels', icon: 'schema' }
]

export default defineComponent({
  name: 'RefBrowser',
  components: { InfoChip, SkeletonMini },
  props: {
    // [{ address, primary }] — v-model:references
    references: { type: Array, default: () => [] }
  },
  emits: ['update:references', 'invoke'],

  setup (props, { emit }) {
    const kind = ref('posts')
    const query = ref('')
    const results = ref([])
    const searching = ref(false)
    let debounceTimer = null
    let searchSeq = 0

    const kindLabel = computed(() =>
      KIND_TABS.find(t => t.key === kind.value)?.label.toLowerCase() || 'element')

    const searchPlaceholder = computed(() =>
      kind.value === 'paths' ? 'Path id or hash prefix…' : `Search ${kindLabel.value}…`)

    const runSearch = async () => {
      const seq = ++searchSeq
      searching.value = true
      try {
        const r = await refService.search(kind.value, query.value || '', 8)
        if (seq === searchSeq) results.value = r.success ? r.results : []
      } catch (_) {
        if (seq === searchSeq) results.value = []
      } finally {
        if (seq === searchSeq) searching.value = false
      }
    }

    const onQueryInput = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(runSearch, 300)
    }

    const setKind = (k) => {
      kind.value = k
      runSearch()
    }

    onMounted(runSearch)

    // ── selection management ────────────────────────────────
    const isAdded = (address) => props.references.some(r => r.address === address)

    const emitRefs = (list) => emit('update:references', list)

    const add = (r) => {
      if (isAdded(r.address)) return
      // A skeleton reads as its grid: the mini tier is its default stamp
      // (the `auto` tier is node-only — a bare skeleton ref stays a chip).
      const mini = String(r.address || '').startsWith('skeletons/')
      emitRefs([...props.references, { address: r.address, primary: r.primary || '', ...(mini ? { display: 'mini' } : {}) }])
    }

    // Results and staged rows both drag as a pathos ref (the house MIME,
    // `application/x-pathos-ref`) — so the grid's cells, the dashboard's
    // inputs and the agent row all accept them.
    const refPayload = (e, r) => {
      try {
        e.dataTransfer.setData('application/x-pathos-ref', JSON.stringify({ address: r.address, primary: r.primary || '' }))
        e.dataTransfer.setData('text/plain', `[[pathos:${r.address}]]`)
      } catch (_) { /* older engines */ }
    }
    const onResultDragStart = (r, e) => {
      refPayload(e, r)
      e.dataTransfer.effectAllowed = 'copyMove'
    }

    const removeAt = (i) => {
      const next = [...props.references]
      next.splice(i, 1)
      emitRefs(next)
    }

    // ── display tier (auto → micro → mini) ─────────────────
    // Stored ON the reference object so the choice travels with the draft
    // (maker store persists it) and buildBody's References list sees it.
    const DISPLAY_CYCLE = ['auto', 'micro', 'mini']
    const displayOf = (r) => DISPLAY_CYCLE.includes(r.display) ? r.display : 'auto'

    const cycleDisplay = (i) => {
      const next = [...props.references]
      const cur = displayOf(next[i])
      next[i] = { ...next[i], display: DISPLAY_CYCLE[(DISPLAY_CYCLE.indexOf(cur) + 1) % DISPLAY_CYCLE.length] }
      emitRefs(next)
    }

    const move = (i, delta) => {
      const j = i + delta
      if (j < 0 || j >= props.references.length) return
      const next = [...props.references]
      ;[next[i], next[j]] = [next[j], next[i]]
      emitRefs(next)
    }

    // Native drag reorder — swap live while hovering so the list previews
    // its final order.
    const dragIndex = ref(null)
    const onDragStart = (i, e) => {
      dragIndex.value = i
      refPayload(e, props.references[i])
      e.dataTransfer.effectAllowed = 'copyMove'
    }
    const onDragOver = (i) => {
      if (dragIndex.value === null || dragIndex.value === i) return
      const next = [...props.references]
      const [moved] = next.splice(dragIndex.value, 1)
      next.splice(i, 0, moved)
      dragIndex.value = i
      emitRefs(next)
    }
    const onDragEnd = () => { dragIndex.value = null }

    // ── direct address fallback ─────────────────────────────
    const addressInput = ref('')
    const addressHint = ref('')
    const addressChecking = ref(false)

    const addByAddress = async () => {
      const raw = (addressInput.value || '').trim()
      if (!raw) return
      const m = raw.match(/([a-z]+)\/([0-9a-f]{16,64})/i)
      if (!m || !REF_KINDS.has(m[1])) {
        addressHint.value = 'Use nodes/<hash>, paths/<hash>, skeletons/<hash> or labels/<hash>'
        return
      }
      const address = `${m[1]}/${m[2]}`
      if (isAdded(address)) { addressHint.value = 'Already added'; return }
      addressChecking.value = true
      try {
        const r = await refService.summary(address)
        if (r?.success && r.summary?.id != null) {
          add({ address, primary: r.summary.primary || '' })
          addressInput.value = ''
        } else {
          addressHint.value = 'No element found at that address'
        }
      } catch (_) {
        addressHint.value = 'No element found at that address'
      } finally { addressChecking.value = false }
    }

    const iconFor = (k) => kindFor(k).icon
    const colorFor = (k) => kindFor(k).color

    return {
      onResultDragStart,
      kindTabs: KIND_TABS,
      kind,
      kindLabel,
      searchPlaceholder,
      query,
      results,
      searching,
      onQueryInput,
      setKind,
      isAdded,
      add,
      removeAt,
      displayOf,
      cycleDisplay,
      move,
      dragIndex,
      onDragStart,
      onDragOver,
      onDragEnd,
      addressInput,
      addressHint,
      addressChecking,
      addByAddress,
      iconFor,
      colorFor
    }
  }
})
</script>

<style lang="scss" scoped>
// Visual grammar borrowed from the labels/feed pages: white cards with
// hairline ink borders, mono uppercase section labels, carved inset pits,
// teal selection accents.
.ref-browser {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.ref-browser__section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  // A TITLE (2026-08-26, third ask) — the window's section headings letter in
  // its contrast tone, the same one the header's row captions take, so every
  // word that NAMES something here is one colour and every word that IS
  // something is ink.
  color: var(--maker-contrast);
  font-family: var(--font-mono);
}

.ref-browser__count {
  font-size: 0.9em;
  color: rgba(var(--ink-rgb), 0.5);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
}

// ── Kind tabs — pill row tinted per kind, like the label chips ──
.ref-kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ref-kind {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  // The resting pill's rim is one ramp step UP from the contrast, not a wash
  // of it: the contrast tone states the PRESSED pill, and a row of five at
  // full strength reads as five pressed ones. A step (`--blue-grey-4`) rather
  // than a transparency because every other line in this window is solid, and
  // one washed rim among them reads as a rendering artefact.
  border: 1px solid var(--blue-grey-4);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s;

  &:hover { border-color: var(--maker-contrast); color: var(--ink); }

  // PRESSED — the post window's contrast tone (2026-08-26, user ask), one
  // grey for all five kinds.
  //
  // It was a PER-KIND TINT, bound inline off `KIND_TABS`: posts `#6c4d72`,
  // nodes `#2C3D4E`, labels `#00829c`, paths `#4d8a83`, skels `#5b6c82` —
  // the platform's kind palette, the same five the result icons still draw
  // themselves in one row below (`colorFor`, `utils/kinds.js`). Kept here as
  // the record, because the ARGUMENT for them was sound and is only
  // outranked: a row where exactly one pill is lit does not need the lit
  // pill to also say WHICH kind — the label under it says that, and the
  // icons keep the colour language alive where it classifies many things at
  // once instead of one thing at a time.
  //
  // `--kind-color` survives as the dial INSIDE this component (the row is
  // one edit from tints again); it resolves to the window's own dial now,
  // `--maker-contrast`. That tone walked `--grey-6` → `--blue-grey-8` →
  // `--blue-grey-6` on 2026-08-26 and the walk is why the pill reads a dial
  // twice over: white on grey-6 measured 2.8:1 (a pill this size is small
  // enough that a single ramp step is the difference between a mark and an
  // unreadable one), and it reads 4.4:1 where it stands today.
  &.is-active {
    --kind-color: var(--maker-contrast);
    color: #fff;
    background: var(--kind-color);
    border-color: var(--kind-color);
    box-shadow: var(--shadow-carved-pressed);
  }
}

.ref-search :deep(.q-field__control) { background: #fff; }

// ── Results — sibling of the feed's post-square head rows ──
.ref-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 90px;
  max-height: 230px;
  overflow-y: auto;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.ref-results__state {
  padding: 18px 8px;
  text-align: center;
  font-size: 0.76em;
  color: var(--ink-mute);
}

.ref-result {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover {
    border-color: rgba(0, 130, 156, 0.5);
    .ref-result__add { color: #00829c; }
  }

  &.is-added {
    border-color: rgba(0, 130, 156, 0.35);
    background: rgba(0, 130, 156, 0.06);
    cursor: default;
    .ref-result__add { color: #00829c; }
  }
}

.ref-result__icon { flex-shrink: 0; }

.ref-result__lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.3;
}

.ref-result__primary {
  font-size: 0.76em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-result__secondary {
  font-size: 0.66em;
  color: var(--ink-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-result__add {
  flex-shrink: 0;
  color: rgba(var(--ink-rgb), 0.35);
}

.ref-address { margin-top: -2px; }
.ref-address :deep(.q-field__control) { background: #fff; }

// ── Selected list ──
.ref-list__empty {
  font-size: 0.74em;
  color: var(--ink-mute);
  line-height: 1.5;
  padding: 8px 10px;
  border: 1px dashed rgba(var(--ink-rgb), 0.25);
  border-radius: var(--radius-sm);
}

.ref-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  min-height: 0;

  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  transition: border-color 0.12s, opacity 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.45); }
  &.is-dragging { opacity: 0.45; border-style: dashed; }
}

.ref-item__grip {
  color: rgba(var(--ink-rgb), 0.3);
  cursor: grab;
  flex-shrink: 0;
}

.ref-item__index {
  font-size: 0.66em;
  color: var(--ink-mute);
  min-width: 14px;
  text-align: right;
  flex-shrink: 0;
}

.ref-item__chip {
  flex: 1;
  min-width: 0;
}

.ref-item__actions {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

// The display-tier toggle — a tiny stamped word, tinted by what it says:
// auto stays quiet, micro takes the ink, mini takes the browse accent teal
// (the tier that blooms the teal NodeMini panel).
.ref-item__display {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  margin-right: 2px;
  border: 1px solid rgba(var(--ink-rgb), 0.22);
  border-radius: 8px;
  background: transparent;
  font-size: 0.58em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-mute);
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s, background 0.12s;

  &:hover { border-color: rgba(var(--ink-rgb), 0.45); }

  &.is-micro {
    color: var(--ink);
    border-color: rgba(var(--ink-rgb), 0.45);
    background: rgba(var(--ink-rgb), 0.06);
  }
  &.is-mini {
    color: #00829c;
    border-color: rgba(0, 130, 156, 0.5);
    background: rgba(0, 130, 156, 0.08);
  }
}

.ref-item__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.5);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  &:hover:not(:disabled) { background: rgba(var(--ink-rgb), 0.1); color: var(--ink); }
  &:disabled { opacity: 0.25; cursor: default; }

  &--danger:hover:not(:disabled) {
    background: rgba(var(--coral-rgb), 0.14);
    color: var(--coral-deep);
  }
}

// ── skeleton results as minis (phase 3) ─────────────────────────────
.ref-result--mini {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px;
  cursor: grab;
  --skel-mini-max-h: 160px;
}
.ref-result__mini {
  flex: 1 1 auto;
  min-width: 0;
}
.ref-result__pick {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
}
</style>
