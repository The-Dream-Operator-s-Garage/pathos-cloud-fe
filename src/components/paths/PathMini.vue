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
       COLORWAY: the `--path-*` ladder (_tokens.scss) — lime-1 coat, lime-3
       hairlines, lime-9 hover + rail, lime-10 head ink; the chip's own
       glyph/ink off kinds.js. Dials `--path-mini-coat/-rule/-rule-hover/
       -head-ink` re-tone one tree, NodeMini's pattern. -->
  <div v-if="loading && !row" class="path-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>
  <InfoChip v-else-if="failed" kind="paths" :address="addressOf" :label="pathLabel" />
  <div
    v-else
    class="path-mini"
    :class="{ 'is-nested': depth > 0, 'is-horizontal': shownLayout === 'horizontal', 'mode-reference': shownMode === 'reference' }"
  >
    <MiniPanel body-fit>
      <template #head>
        <!-- THE ADDRESS CHIP + ITS COPY: what it is first (NodeMini's
             reading). The pill is the chips' collapsed state; the corner is
             this panel's door. -->
        <span class="path-mini__zone path-mini__zone--chip">
          <PathMicro :id="row.id" :path="row.path" :integrity="row.integrity || null" collapsed />
          <button
            type="button"
            class="path-mini__copy"
            :class="{ 'is-copied': copied }"
            :title="copied ? 'hash copied' : 'copy the full path hash'"
            @click.stop.prevent="copyHash"
          >
            <q-icon :name="copied ? 'check' : 'content_copy'" size="10px" />
          </button>
        </span>

        <!-- THE NAME — the one elastic zone -->
        <span class="path-mini__zone path-mini__zone--name" :title="nameTitle">
          <span class="path-mini__name-text">{{ pathLabel }}</span>
        </span>

        <!-- THE MODE SWITCH — wears the glyph of the mode it OFFERS -->
        <button
          type="button"
          class="path-mini__zone path-mini__zone--mode"
          :class="{ 'is-reference': shownMode === 'reference' }"
          :title="modeTitle"
          @click.stop.prevent="toggleMode"
        >
          <q-icon :name="shownMode === 'enriched' ? 'short_text' : 'view_agenda'" size="10px" />
        </button>

        <!-- THE LAYOUT SWITCH — wears the glyph of the layout it OFFERS
             (SkeletonMini's switch, verbatim) -->
        <button
          type="button"
          class="path-mini__zone path-mini__zone--layout"
          :class="{ 'is-horizontal': shownLayout === 'horizontal' }"
          :title="layoutTitle"
          @click.stop.prevent="toggleLayout"
        >
          <q-icon :name="shownLayout === 'horizontal' ? 'swap_vert' : 'swap_horiz'" size="10px" />
        </button>

        <!-- THE CORNER: this path in its own floating window -->
        <button
          type="button"
          class="path-mini__zone path-mini__zone--open"
          title="open in the flyout viewer"
          @click.stop.prevent="openViewer"
        >
          <q-icon name="open_in_full" size="10px" />
        </button>
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
        <span class="path-mini__foot-line" :title="footTitle">
          <q-icon :name="pathKind.icon" size="10px" />
          <span class="path-mini__foot-steps mono">{{ stepCount }} {{ stepCount === 1 ? 'step' : 'steps' }}</span>
          <template v-if="authorName">
            <span class="path-mini__foot-dot">·</span>
            <span class="path-mini__foot-author">by {{ authorName }}</span>
          </template>
          <template v-if="kindTally">
            <span class="path-mini__foot-dot">·</span>
            <span class="path-mini__foot-kinds">{{ kindTally }}</span>
          </template>
        </span>
      </template>
    </MiniPanel>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import PathMicro from './PathMicro.vue'
import PathLane from './PathLane.vue'
import { pathService } from 'src/services/path.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { kindFor, hashOf, isHash } from 'src/utils/kinds'

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
  components: { MiniPanel, InfoChip, PathMicro, PathLane },
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
    const pathKind = kindFor('paths')

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

    const copied = ref(false)
    const copyHash = async () => {
      const full = hashOf(row.value?.path || '')
      if (!full) return
      try {
        await navigator.clipboard.writeText(full)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (e) { /* clipboard denied — the glyph simply never flips */ }
    }

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

    return {
      pathKind,
      loading,
      failed,
      row,
      walked,
      addressOf,
      stepCount,
      pathLabel,
      nameTitle,
      copied,
      copyHash,
      openViewer,
      shownLayout,
      toggleLayout,
      layoutTitle,
      shownMode,
      toggleMode,
      modeTitle,
      authorName,
      kindTally,
      footTitle
    }
  }
})
</script>

<style lang="scss" scoped>
.path-mini__loading { padding: 6px 0; text-align: center; }

.path-mini {
  // NodeMini's dial pattern, the path family's ladder as the defaults
  // (`--path-*`, _tokens.scss): a host re-tones one tree by writing the
  // `--path-mini-*` dials; the lane inside reads `--path-lane-*` and falls
  // back to the same ladder.
  --pm-ink: var(--path-mini-head-ink, var(--path-ink, #827717));
  --pm-rule: var(--path-mini-rule, var(--path-rule, #e6ee9c));
  --path-lane-ink: var(--pm-ink);
  --path-lane-rule: var(--pm-rule);
  --path-lane-bond: var(--path-mini-bond, var(--path-bond, #9e9d24));
  --path-lane-max-h: var(--path-mini-max-h, 360px);

  :deep(.mini-panel) {
    --panel-chrome: var(--path-mini-coat, var(--path-coat, #f9fbe7));
    --panel-body: var(--path-mini-coat, var(--path-coat, #f9fbe7));
    --panel-rule: var(--pm-rule);
  }
  :deep(.mini-panel--hover):hover {
    --panel-rule: var(--path-mini-rule-hover, var(--path-hover, #9e9d24));
  }
  // The header is one ROW of zones split by full-height hairlines. The
  // `flex-direction` and `gap` are RESETS: MiniPanel's default head is a
  // flex COLUMN with a 4px gap (the tower NodeMini paid for on 2026-08-23
  // and SkeletonMini again on 09-17).
  :deep(.mini-panel__head--own) {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    min-width: 0;
    padding: 0;
  }
  :deep(.mini-panel__body) {
    padding: 0;
    min-height: 0;
  }
  :deep(.mini-panel__foot) {
    padding: 1px 0;
    gap: 0;
  }
}

// ── the header zones (NodeMini's grammar) ────────────────────────────────
.path-mini__zone {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 4px;
  color: var(--pm-ink);
  white-space: nowrap;
  overflow: hidden;
  & + & { border-left: 1px solid var(--pm-rule); }
}
.path-mini__zone--chip {
  flex: 0 1 auto;
  // the ONE pair of dials every mini's chip zone reads (2026-09-21 PM8)
  padding: var(--mini-chip-zone-pad, 2px 4px 2px 2px);
  gap: var(--mini-chip-zone-gap, 2px);
}
.path-mini__zone--name {
  flex: 1 1 auto;
  justify-content: center;
}
.path-mini__name-text {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.76em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}
.path-mini__copy,
.path-mini__zone--mode,
.path-mini__zone--layout,
.path-mini__zone--open {
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
  color: inherit;
}
.path-mini__copy {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 3px;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.12s, color 0.12s;
  &:hover { opacity: 1; }
  &.is-copied { opacity: 1; color: var(--positive, #21ba45); }
}
.path-mini__zone--mode,
.path-mini__zone--layout {
  flex: 0 0 auto;
  &:hover { color: var(--path-mini-rule-hover, var(--path-hover, #9e9d24)); }
}
.path-mini__zone--open {
  flex: 0 0 auto;
  &:hover { color: var(--coral-deep, #d35f5f); }
}

.path-mini__empty {
  padding: 6px 8px;
  font-size: 0.78em;
  color: var(--pm-ink);
  opacity: 0.7;
  font-style: italic;
  text-align: center;
}

// ── the foot ─────────────────────────────────────────────────────────────
:deep(.mini-panel__foot) .path-mini__foot-line,
.path-mini__foot-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.7em;
  color: var(--pm-ink);
}
.path-mini__foot-author,
.path-mini__foot-kinds { overflow: hidden; text-overflow: ellipsis; }
.path-mini__foot-dot { opacity: 0.5; }
</style>
