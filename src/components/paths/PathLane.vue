<template>
  <!-- THE PATH LANE (2026-09-27, user ask: "a path viewer to display a path
       of elements either vertically or horizontally … an 'enriched' and a
       'reference' view for each path and sub-path … for both, a thin line
       with link nano references to represent the links that bond the path
       elements"). The BODY of PathMini, and the face a skeleton grid's
       paths-kind cell wears: one scroller laid along an AXIS —
         vertical    a column, scrolling on y (capped by `--path-lane-max-h`
                     at the top level; a nested lane is bounded by its host);
         horizontal  a row, scrolling on x, every item a card's width.
       Along it, in pathchain order: BOND · item · BOND · item … — one bond
       per link, standing BEFORE the member it reaches (the path's head
       points at link₀, link₀ at its target and at link₁ — so the first
       link is drawn too, not only the ones "between" two members). The
       bond is the rail (a 1px `--path-bond` line, along the axis) with the
       LINK's own nano chip riding it, collapsed (`icon / 993fa6… ●`, the
       walk's verdict on it); a click opens the link's window (the flyout's
       link face). The item is the member in the lane's MODE:
         enriched    the member's Mini — NodeMini, LabelMini, EntityMini,
                     MomentMini, LinkMini (their rows ride the walk since
                     2026-09-30), PostMini / SkeletonMini (the grid's own
                     nesting rules, `layout` + `readonly` handed down), and a
                     nested PathMini for a path (which owns its own
                     switches) — every one on the family basis, so each
                     level of nesting composites one more layer of glass;
         reference   the member's nano chip, extended (`icon type / hash ● ⤢`).
       BUDGETS: enriched draws minis for the NEWEST `ENRICH_MAX` members and
       chips for the rest (the grid's LIST_UNFOLD_MAX rule — the NAVIGATION
       skeleton's list holds hundreds of stops and each mini is a walk); a
       lane shows `SHOW_MAX` members and offers the rest on a click (the
       biggest local path has 1615). Cycle guard: `visited` — a member whose
       address is an ancestor's draws an inert dense chip, before any fetch.
       `removable` draws the grid's × per member (emits `remove(step)`); the
       `#tail` slot is the grid's drop line. `restAtEnd`: a horizontal lane
       rests scrolled to its NEWEST end (the footer strip's law, for the
       grid's ledgers — a plain path reads oldest-first from the left). -->
  <div
    ref="rootEl"
    class="path-lane"
    :class="['is-' + layout, 'mode-' + mode, { 'is-nested': depth > 0 }]"
  >
    <template v-for="(st, idx) in shown" :key="st.link?.id ?? idx">
      <!-- ── THE BOND — the link that reaches this member ────────────── -->
      <div class="path-lane__bond" :class="{ 'is-head': idx === 0 }">
        <span class="path-lane__rail" aria-hidden="true" />
        <LinkMicro
          v-if="st.link?.path"
          :id="st.link.id"
          :path="st.link.path"
          :integrity="st.link.integrity || null"
          collapsed
          class="path-lane__bond-chip"
        />
        <span class="path-lane__rail" aria-hidden="true" />
      </div>

      <!-- ── THE MEMBER ──────────────────────────────────────────────── -->
      <div class="path-lane__item" :class="['kind-' + kindOf(st), { 'is-mini': isMini(idx, st) }]">
        <!-- a locked stub: the hash stays visible by doctrine, the body is
             Talavero's -->
        <LockedChip v-if="st.target?.locked" :address="addressOf(st)" />
        <!-- an ancestor of this lane — inert, before any fetch -->
        <InfoChip
          v-else-if="isCycle(st)"
          dense
          :kind="prefixOf(st)"
          :address="addressOf(st)"
          title="already open above — a path cannot contain itself"
        />
        <template v-else-if="isMini(idx, st)">
          <!-- a NESTED PATH — its own viewer, its own switches; the layout
               it opens in is this lane's, the mode it opens in is
               `reference` (PathMini's nested default) -->
          <PathMini
            v-if="kindOf(st) === 'path'"
            :path="st.target.path"
            :layout="layout"
            :depth="depth + 1"
            :visited="visitedNext"
            :readonly="readonly"
          />
          <!-- a POPULATED SKELETON — the grid's own nesting (SkeletonMini
               follows the layout handed down, `readonly` rides) -->
          <SkeletonMini
            v-else-if="kindOf(st) === 'skeleton' && st.target.skeleton.name !== 'POST'"
            :ref-or-id="st.target.skeleton.id"
            :name="st.target.skeleton.name || ''"
            :depth="depth + 1"
            :visited="visitedNext"
            :readonly="readonly"
            :layout="layout"
            enriched
          />
          <!-- everything else through the family's dispatcher: the pre-
               resolved target row skips the fetch (POST instances → PostMini) -->
          <ElementMini
            v-else
            :element="st.target"
            :depth="depth + 1"
            :visited="visitedNext"
          />
        </template>
        <!-- THE REFERENCE — the extended nano pill, the walk's verdict on it -->
        <MicroChip
          v-else
          :kind="prefixOf(st)"
          :id="idOf(st)"
          :path="addressOf(st)"
          :display="displayOf(st)"
          :integrity="rowOf(st)?.integrity || null"
          :full-address="addressOf(st)"
        />
        <button
          v-if="removable"
          type="button"
          class="path-lane__x"
          title="remove from the list"
          @click.stop.prevent="$emit('remove', st)"
        ><q-icon name="close" size="10px" /></button>
      </div>
    </template>

    <button
      v-if="hidden > 0"
      type="button"
      class="path-lane__more"
      :title="`show the next ${Math.min(hidden, SHOW_MAX)} of ${hidden} more`"
      @click.stop.prevent="showMore"
    >+{{ hidden }} more</button>

    <slot name="tail" />
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent, computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import LockedChip from 'src/components/shared/LockedChip.vue'
import LinkMicro from 'src/components/links/LinkMicro.vue'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'

// Enriched minis for the newest ENRICH_MAX members; chips past that. The
// grid's LIST_UNFOLD_MAX (2026-09-06 PM), moved here with the lane.
const ENRICH_MAX = 24
// Members drawn before the "+N more" step — 1615 chips in one lane is a
// scroll nobody asked for.
const SHOW_MAX = 200

const PREFIX = { skeleton: 'skeletons', post: 'skeletons', node: 'nodes', label: 'labels', entity: 'entities', path: 'paths', moment: 'moments', secret: 'secrets', link: 'links' }

export default defineComponent({
  name: 'PathLane',
  components: {
    MicroChip,
    InfoChip,
    LockedChip,
    LinkMicro,
    // The three minis a lane nests are all async: PathMini mounts THIS lane
    // (a cycle for the bundler), and ElementMini / SkeletonMini pull the
    // whole family — a lane in a post body should not cost the chunk until
    // a member actually unfolds.
    PathMini: defineAsyncComponent(() => import('./PathMini.vue')),
    ElementMini: defineAsyncComponent(() => import('src/components/shared/ElementMini.vue')),
    SkeletonMini: defineAsyncComponent(() => import('src/components/skeletons/SkeletonMini.vue'))
  },
  props: {
    // Walked steps from pathService (forward = pathchain order):
    // [{ link: { id, path, integrity, target_type, target_id }, target: { kind, <kind>: row | locked } }]
    steps: { type: Array, default: () => [] },
    layout: { type: String, default: 'vertical' }, // 'vertical' | 'horizontal'
    mode: { type: String, default: 'enriched' }, // 'enriched' | 'reference'
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] },
    // The lane's OWN address, added to `visited` for the members' guards.
    self: { type: String, default: '' },
    readonly: { type: Boolean, default: false },
    removable: { type: Boolean, default: false },
    restAtEnd: { type: Boolean, default: false }
  },
  emits: ['remove'],
  setup (props) {
    const rootEl = ref(null)
    const limit = ref(SHOW_MAX)
    const shown = computed(() => (props.steps || []).slice(0, limit.value))
    const hidden = computed(() => Math.max(0, (props.steps || []).length - limit.value))
    const showMore = () => { limit.value += SHOW_MAX }
    watch(() => props.steps, () => { limit.value = SHOW_MAX })

    const kindOf = (st) => st.target?.kind || st.link?.target_type || 'unknown'
    const prefixOf = (st) => PREFIX[kindOf(st)] || 'unknown'
    const rowOf = (st) => {
      const t = st.target || {}
      // (moment / secret / link rows ride the walk since 2026-09-30 — the
      // resolver learnt the three kinds; before, their members drew an
      // address-less chip even in enriched mode)
      return t.skeleton || t.node || t.label || t.entity || t.path || t.moment || t.secret || t.link || null
    }
    const hasRow = (st) => !!rowOf(st)
    const idOf = (st) => rowOf(st)?.id ?? st.target?.id ?? st.link?.target_id ?? null
    const addressOf = (st) => {
      const row = rowOf(st)
      if (row?.path) return row.path
      const t = st.target || {}
      if (t.hash) return `${prefixOf(st)}/${t.hash}`
      return ''
    }
    // A member's NAME in the chip's hash slot when it has one that is not
    // an address — a label's name, a skeleton's name, an entity's handle;
    // nodes and paths keep their hash (a note's title is not its identity).
    const displayOf = (st) => {
      const k = kindOf(st)
      const row = rowOf(st)
      if (!row) return ''
      if (k === 'label') return row.name || ''
      if (k === 'skeleton') return row.name && row.name !== 'POST' ? row.name : ''
      if (k === 'entity') return row.username ? '@' + row.username : (row.display_name || '')
      return ''
    }
    const visitedNext = computed(() => (props.self ? [...props.visited, props.self] : props.visited))
    const isCycle = (st) => {
      const a = addressOf(st)
      return !!a && visitedNext.value.includes(a)
    }
    // THE DEPTH DIAL (2026-10-07): a lane whose surface budget is spent
    // draws every member as its nano chip, whatever mode it was given.
    const budget = useRenderBudget()

    // Which members unfold into minis: enriched mode, a row to draw, and the
    // newest ENRICH_MAX (forward order — the newest are the last).
    const isMini = (idx, st) => {
      if (budgetExhausted(budget)) return false
      if (props.mode !== 'enriched' || !hasRow(st) || st.target?.locked || isCycle(st)) return false
      const n = shown.value.length
      return idx >= n - ENRICH_MAX
    }

    // A HORIZONTAL ledger rests scrolled to its newest end (the grid's
    // 2026-09-06 PM law, moved here). The members ARRIVE AFTER the lane does
    // — each mini walks its own skeleton — so one scroll at load lands
    // mid-row once they widen it; re-pin as they resize, for the first
    // seconds only, then let go so a reader's own scroll is never fought.
    let ro = null
    let roTimer = null
    const releaseObserver = () => {
      if (ro) { ro.disconnect(); ro = null }
      if (roTimer) { clearTimeout(roTimer); roTimer = null }
    }
    const scrollToEnd = () => {
      const el = rootEl.value
      if (!el || !props.restAtEnd || props.layout !== 'horizontal') return
      el.scrollLeft = el.scrollWidth
      releaseObserver()
      if (typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(() => { if (rootEl.value) rootEl.value.scrollLeft = rootEl.value.scrollWidth })
      for (const m of el.children) ro.observe(m)
      roTimer = setTimeout(releaseObserver, 3500)
    }
    onMounted(() => { nextTick(() => scrollToEnd()) })
    watch(() => [props.layout, props.steps], () => { nextTick(() => scrollToEnd()) })
    onBeforeUnmount(releaseObserver)

    return {
      rootEl,
      shown,
      hidden,
      showMore,
      SHOW_MAX,
      kindOf,
      prefixOf,
      rowOf,
      idOf,
      addressOf,
      displayOf,
      visitedNext,
      isCycle,
      isMini
    }
  }
})
</script>

<style lang="scss" scoped>
// ── THE LANE ─────────────────────────────────────────────────────────────
// One scroller along an axis. The dials are PathMini's (`--path-lane-*`),
// falling back to the path family's ladder in _tokens.scss.
.path-lane {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  min-width: 0;
  padding: 2px 6px 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--path-lane-bond, var(--path-bond, #9e9d24)) transparent;
}
// VERTICAL: a column, scrolling on y. The cap is the top-level lane's only —
// a nested lane is bounded by whatever holds it (a cap inside a cap is a
// scrollbar inside a scrollbar).
.path-lane.is-vertical {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: var(--path-lane-max-h, 360px);
  &.is-nested { max-height: none; overflow: visible; }
}
// HORIZONTAL: a row, scrolling on x; items stand shoulder to shoulder at
// the top and take a card's width when they are minis.
.path-lane.is-horizontal {
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding: 4px 6px 6px;
}

// ── THE BOND — a rail with the link chip riding it ───────────────────────
.path-lane__bond {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 0;
  gap: 2px;
}
.path-lane__rail {
  display: block;
  flex: 1 1 auto;
  background: var(--path-lane-bond, var(--path-bond, #9e9d24));
}
// vertical: the rail runs down, 1px wide; each half is at least 5px so a
// bond never collapses to a chip glued to two minis
.is-vertical .path-lane__bond {
  flex-direction: column;
  align-self: center;
  min-height: 26px;
  .path-lane__rail { width: 1px; min-height: 5px; }
}
// horizontal: the rail runs across
.is-horizontal .path-lane__bond {
  flex-direction: row;
  min-width: 34px;
  .path-lane__rail { height: 1px; min-width: 5px; }
}
.path-lane__bond-chip { flex: 0 0 auto; }

// ── THE MEMBER ───────────────────────────────────────────────────────────
.path-lane__item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  > :first-child { flex: 1 1 auto; min-width: 0; }
  // a reference chip hugs its content and centres on the rail
  &:not(.is-mini) { justify-content: center; align-items: center; > :first-child { flex: 0 1 auto; } }
}
.is-horizontal .path-lane__item {
  flex: 0 0 auto;
  &.is-mini { width: var(--path-lane-item-w, 300px); max-width: 82%; }
  &:not(.is-mini) { max-width: 60%; }
}
.path-lane__x {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0 2px;
  border: none;
  background: none;
  color: var(--path-lane-ink, var(--path-ink, #827717));
  cursor: pointer;
  opacity: 0.55;
  &:hover { color: var(--coral-deep, #c05a4e); opacity: 1; }
}
.path-lane__more {
  flex: 0 0 auto;
  align-self: center;
  margin: 6px 0 2px;
  padding: 1px 8px;
  border: 1px dashed var(--path-lane-rule, var(--path-rule, #e6ee9c));
  border-radius: var(--radius-pill, 999px);
  background: none;
  font: inherit;
  font-size: 0.72em;
  color: var(--path-lane-ink, var(--path-ink, #827717));
  cursor: pointer;
  &:hover { border-color: var(--path-lane-bond, var(--path-bond, #9e9d24)); }
}
</style>
