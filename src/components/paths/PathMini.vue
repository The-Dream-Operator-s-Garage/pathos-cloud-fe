<template>
  <!-- THE PATH MINI (rebuilt 2026-09-27, user ask: "a path viewer to display
       a path of elements either vertically or horizontally … belongs to the
       mini family … expandable into its flyout viewer … the node mini
       viewer's layout, but paint the contrast stuff using lime quasar tones
       instead of teal … reference the right nano chip on top and adapt the
       information on the mini footer"). The face a PATH wears wherever it is
       quoted — a `![[pathos:paths/…]]` embed in a post, a skeleton grid's
       paths-kind cell, the file tree, a label's usages, the element window.
       NodeMini's grammar, one hue over: MiniPanel's chrome with its OWN
       header ROW of hairline-split zones —
         chip+copy │ name │ MODE │ LAYOUT │ open
       — the PATH nano pill (`PathMicro`, collapsed: `icon / 993fa6… ●`) with
       the copy control, the name (`path #415 · 43 steps`, or the title when
       one is set), the two switches this viewer adds to the row, and the
       corner that spawns the path's own window. The body is the LANE
       (`PathLane`): the members along an axis, a bond per link. The FOOT is
       adapted to a path — what the skeleton mini's says about its schema and
       keys, said about members: `route · 43 steps · by claude · 43 paths`.
       THE TWO SWITCHES (per path AND per sub-path):
       · LAYOUT — vertical (a column, y-scroll) ⇄ horizontal (a row,
         x-scroll). `swap_horiz` offers horizontal, `swap_vert` vertical.
       · MODE — enriched (the members' minis) ⇄ reference (their nano chips).
         `short_text` offers reference, `view_agenda` offers enriched.
       A top-level mini remembers both per browser (`pathos_path_layout`,
       `pathos_path_mode`); a nested one opens in its host lane's layout and
       in REFERENCE (a sub-path unfolds on the reader's word — 43 nested
       minis each walking their own steps is not a default), and its
       switches flip only itself. A host that passes `layout` re-lays the
       mini when it flips (the grid's toggle).
       Self-resolving: given the row alone (`path`) it walks the steps
       itself (`GET /paths/by-hash`, forward); given `steps` it draws.
       ⭐ 2026-09-30 — ON THE FAMILY BASIS (user ask: "the post and path mini
       viewers look odd compared to the node and skeleton mini viewers …
       take as layout the node mini viewer … use the nano pills icons and
       coloring … the same background color as the node viewer"). The head
       is `MiniHead` (the two switches are its switch zones, the corner its
       door), the foot `MiniFoot`, the coat the family glass — the lime-1
       coat and lime-3 hairlines are gone (they also LEAKED: `:deep(.mini-
       panel)` repainted every mini nested in the lane lime). What stays
       lime is what the nano pill says: the ink (`--mini-ink` = kinds.js
       paths.ink, lime-deep), the glyph tone (lime-10) and the lane's BONDS
       — the rail is the path's own accent. -->
  <div v-if="loading && !row" class="path-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>
  <InfoChip v-else-if="failed" kind="paths" :address="addressOf" :label="pathLabel" />
  <div
    v-else
    class="path-mini"
    :class="{ 'is-nested': depth > 0, 'is-horizontal': shownLayout === 'horizontal', 'mode-reference': shownMode === 'reference' }"
  >
    <MiniPanel kind="paths" body-fit>
      <template #head>
        <!-- chip+copy │ name │ MODE │ LAYOUT │ open — each switch wears the
             glyph of what it OFFERS (SkeletonMini's switch, verbatim) -->
        <MiniHead
          kind="paths"
          :id="row.id"
          :path="row.path"
          :integrity="row.integrity || null"
          :name="pathLabel"
          :name-title="nameTitle"
          :switches="switches"
          @open="openViewer"
        />
      </template>

      <template #body>
        <div v-if="loading" class="path-mini__loading"><q-spinner size="12px" color="primary" /></div>
        <div v-else-if="!walked.length" class="path-mini__empty">(empty path)<slot name="tail" /></div>
        <PathLane
          v-else
          :steps="walked"
          :layout="shownLayout"
          :mode="shownMode"
          :depth="depth"
          :visited="visited"
          :self="row.path || ''"
          :readonly="readonly"
          :removable="removable"
          :rest-at-end="restAtEnd"
          @remove="$emit('remove', $event)"
        >
          <template #tail><slot name="tail" /></template>
        </PathLane>
      </template>

      <!-- THE FOOT, adapted to a path: steps · author · what the members are -->
      <template #foot>
        <MiniFoot kind="paths" :facts="footFacts" :title="footTitle" />
      </template>
    </MiniPanel>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import PathLane from './PathLane.vue'
import { pathService } from 'src/services/path.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { hashOf, isHash } from 'src/utils/kinds'

// The two preferences' keys — the flyout's `pathos_skeleton_layout` pattern,
// one setting per surface for the top-level mini.
const LAYOUT_KEY = 'pathos_path_layout'
const MODE_KEY = 'pathos_path_mode'
const readPref = (key, allowed, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return allowed.includes(v) ? v : fallback
  } catch (_) { return fallback }
}
const writePref = (key, v) => { try { localStorage.setItem(key, v) } catch (_) { /* preference only */ } }

const PLURAL = { node: 'nodes', label: 'labels', entity: 'entities', path: 'paths', skeleton: 'skeletons', post: 'posts', moment: 'moments', secret: 'secrets', link: 'links' }

export default defineComponent({
  name: 'PathMini',
  components: { MiniPanel, MiniHead, MiniFoot, InfoChip, PathLane },
  props: {
    // The path row ({ id, path, step_count, created_at, owner_id, author?,
    // integrity?, title? }) — the file tree's, a walk's nested target, the
    // grid's list. Optional when `refOrId` is given.
    path: { type: Object, default: null },
    // Pre-walked steps (pathService, forward). null → the mini walks them.
    steps: { type: Array, default: null },
    // Self-resolving address 'paths/<hash>' or a bare row id.
    refOrId: { type: [String, Number], default: null },
    // Kept for the callers that pass it (the file tree, the label usages);
    // the header states the path, not its labels.
    labels: { type: Array, default: () => [] },
    to: { type: String, default: null },
    // 'vertical' | 'horizontal' | null. Given: the layout this mini OPENS in
    // and follows when the host flips (a nested lane's, the grid's toggle).
    // null: the top-level default — the browser's remembered choice.
    layout: { type: String, default: null },
    // 'enriched' | 'reference' | null. Given: the mode this mini opens in.
    // null: remembered (top level) / reference (nested).
    mode: { type: String, default: null },
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] },
    readonly: { type: Boolean, default: false },
    // The grid's list: a × per member (emits `remove(step)`), and the lane
    // rests at its newest end when horizontal.
    removable: { type: Boolean, default: false },
    restAtEnd: { type: Boolean, default: false }
  },
  emits: ['remove', 'resolved'],
  setup (props, { emit }) {
    const flyouts = useFlyoutViewersStore()

    // ── the row + the walk ─────────────────────────────────────────────
    const loading = ref(false)
    const failed = ref(false)
    const fetched = ref(null) // { row, steps } when this mini walked
    const row = computed(() => fetched.value?.row || props.path || null)
    const walked = computed(() => (Array.isArray(props.steps) ? props.steps : (fetched.value?.steps || [])))
    const addressOf = computed(() => {
      if (row.value?.path) return row.value.path
      return typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    })

    const load = async () => {
      if (Array.isArray(props.steps)) { emit('resolved', row.value); return }
      const hash = hashOf(row.value?.path || (typeof props.refOrId === 'string' ? props.refOrId : ''))
      const id = row.value?.id ?? (props.refOrId != null && !isHash(String(props.refOrId)) ? Number(props.refOrId) : null)
      if (!hash && !id) { failed.value = true; return }
      loading.value = true
      failed.value = false
      try {
        const r = isHash(hash) ? await pathService.byHash(hash, 'forward') : await pathService.byId(id, 'forward')
        if (r?.success && r.path) {
          fetched.value = { row: { ...r.path, author: r.owner || row.value?.author || null }, steps: r.steps || [] }
          emit('resolved', fetched.value.row)
        } else if (!row.value) {
          failed.value = true
        }
      } catch (_) {
        // a 403 with the row in hand still draws the head; without one, the chip
        if (!row.value) failed.value = true
      }
      loading.value = false
    }
    onMounted(load)
    watch(() => [props.path?.path, props.path?.id, props.refOrId, props.steps], load)

    // ── the head ───────────────────────────────────────────────────────
    const stepCount = computed(() => (walked.value.length || row.value?.step_count || 0))
    const pathLabel = computed(() => {
      const t = String(row.value?.title || '').trim()
      if (t) return t
      const id = row.value?.id
      const n = stepCount.value
      return `path${id != null ? ' #' + id : ''} · ${n} ${n === 1 ? 'step' : 'steps'}`
    })
    const nameTitle = computed(() => row.value?.path || pathLabel.value)

    // (The copy glyph is MiniHead's since 2026-09-30.)

    const openViewer = () => { if (row.value?.path) flyouts.spawnRef(row.value.path) }

    // ── the layout ─────────────────────────────────────────────────────
    const localLayout = ref(props.layout || (props.depth === 0 ? readPref(LAYOUT_KEY, ['vertical', 'horizontal'], 'vertical') : 'vertical'))
    watch(() => props.layout, (v) => { if (v === 'vertical' || v === 'horizontal') localLayout.value = v })
    const shownLayout = computed(() => (localLayout.value === 'horizontal' ? 'horizontal' : 'vertical'))
    const setLayout = (v) => {
      localLayout.value = v === 'horizontal' ? 'horizontal' : 'vertical'
      if (props.depth === 0 && props.layout == null) writePref(LAYOUT_KEY, localLayout.value)
    }
    const toggleLayout = () => setLayout(shownLayout.value === 'horizontal' ? 'vertical' : 'horizontal')
    const layoutTitle = computed(() => (shownLayout.value === 'horizontal'
      ? 'Lay the path out vertically — the members down a column, scrolling down'
      : 'Lay the path out horizontally — the members along a row, scrolling sideways'))

    // ── the mode ───────────────────────────────────────────────────────
    const localMode = ref(props.mode || (props.depth === 0 ? readPref(MODE_KEY, ['enriched', 'reference'], 'enriched') : 'reference'))
    watch(() => props.mode, (v) => { if (v === 'enriched' || v === 'reference') localMode.value = v })
    const shownMode = computed(() => (localMode.value === 'reference' ? 'reference' : 'enriched'))
    const setMode = (v) => {
      localMode.value = v === 'reference' ? 'reference' : 'enriched'
      if (props.depth === 0 && props.mode == null) writePref(MODE_KEY, localMode.value)
    }
    const toggleMode = () => setMode(shownMode.value === 'enriched' ? 'reference' : 'enriched')
    const modeTitle = computed(() => (shownMode.value === 'enriched'
      ? 'Show the members as references — their nano chips'
      : 'Show the members enriched — their mini viewers'))

    // The head's two switch zones (MiniHead): the MODE, then the LAYOUT —
    // each wearing the glyph of what it OFFERS, `is-reference` /
    // `is-horizontal` stating the current one (the witnesses read them).
    const switches = computed(() => [
      {
        key: 'mode',
        icon: shownMode.value === 'enriched' ? 'short_text' : 'view_agenda',
        title: modeTitle.value,
        cls: { 'is-reference': shownMode.value === 'reference' },
        onClick: toggleMode
      },
      {
        key: 'layout',
        icon: shownLayout.value === 'horizontal' ? 'swap_vert' : 'swap_horiz',
        title: layoutTitle.value,
        cls: { 'is-horizontal': shownLayout.value === 'horizontal' },
        onClick: toggleLayout
      }
    ])

    // ── the foot ───────────────────────────────────────────────────────
    const authorName = computed(() => {
      const a = row.value?.author || row.value?.owner || null
      if (!a) return ''
      return a.display_name || a.username || a.profile?.username || ''
    })
    const kindTally = computed(() => {
      const counts = {}
      for (const st of walked.value) {
        const k = st.target?.kind || st.link?.target_type || 'unknown'
        counts[k] = (counts[k] || 0) + 1
      }
      const parts = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${n} ${n === 1 ? k : (PLURAL[k] || k)}`)
      return parts.join(' · ')
    })
    const footTitle = computed(() => [row.value?.path, authorName.value && `by ${authorName.value}`, kindTally.value].filter(Boolean).join(' · '))
    const footFacts = computed(() => [
      { text: `${stepCount.value} ${stepCount.value === 1 ? 'step' : 'steps'}`, mono: true },
      authorName.value && `by ${authorName.value}`,
      kindTally.value
    ])

    return {
      loading,
      failed,
      row,
      walked,
      addressOf,
      stepCount,
      pathLabel,
      nameTitle,
      openViewer,
      shownLayout,
      toggleLayout,
      layoutTitle,
      shownMode,
      toggleMode,
      modeTitle,
      switches,
      authorName,
      kindTally,
      footTitle,
      footFacts
    }
  }
})
</script>

<style lang="scss" scoped>
.path-mini__loading { padding: 6px 0; text-align: center; }

// ── WHAT THE PATH STILL OWNS (2026-09-30) ────────────────────────────────
// The coat, the lines, the hover, the head row and its zones, the foot line
// are the FAMILY's now (MiniPanel `kind="paths"`, MiniHead, MiniFoot). They
// stood here as the lime colorway of 2026-09-27 — `--path-mini-coat/-rule/
// -rule-hover/-head-ink` dials, never set by a host — written as bare
// `:deep(.mini-panel…)` rules, which reach EVERY panel below this one: the
// lane's node / post / label minis all wore the path's lime coat and its
// 1px-0 foot. What is left is the lane's contract and this panel's own body.
.path-mini {
  // The lane's two dials a host still sets: its scroll cap (the flyout's
  // element face uncaps it) and the bond rail's tone (the path's accent).
  --path-lane-bond: var(--path-mini-bond, var(--path-bond, #9e9d24));
  --path-lane-max-h: var(--path-mini-max-h, 360px);
}

// THIS panel's body only (a CHILD chain — the lane nests minis, and a bare
// `:deep(.mini-panel__body)` would un-pad every one of them): the lane runs
// edge to edge and brings its own padding.
.path-mini > :deep(.mini-panel-link > .mini-panel > .mini-panel__body) {
  padding: 0;
}

.path-mini__empty {
  padding: 6px 8px;
  font-size: 0.78em;
  color: var(--mini-ink, var(--path-ink, #827717));
  opacity: 0.7;
  font-style: italic;
  text-align: center;
}
</style>
