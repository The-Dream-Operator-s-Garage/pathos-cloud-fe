<template>
  <!-- The reusable "Micro" chip: per-spec `icon / type / hash` format.
       Designed to be smuggled inline with text. Width adapts to its
       container — fully expanded shows the entire hash; collapsed shows a
       6-character minimum slice + ellipsis. Click routes to the kind's
       viewer when an `id` is known (via src/utils/kinds.js). -->
  <component
    :is="rootTag"
    :to="route"
    class="micro-chip"
    :class="['kind-' + meta.kind, { 'is-link': !!route, 'no-type': !showType, 'pioneer-gold': pioneer }]"
    :title="tooltip"
    :data-nav-focus="route || null"
    @click.stop
  >
    <q-icon :name="meta.icon" :size="iconSize" class="micro-chip__icon" />
    <template v-if="showType">
      <span class="micro-chip__sep">/</span>
      <span class="micro-chip__type mono">{{ meta.kind }}</span>
      <span class="micro-chip__sep">/</span>
    </template>
    <span class="micro-chip__hash mono">{{ display || hash }}</span>
    <!-- Claim STATUS dot — a chip this small states the standing as a
         color; the word rides the tooltip. Palette matches InfoChip's
         status pill (Thread D reader surface). -->
    <span
      v-if="claimStatus"
      class="micro-chip__status"
      :class="'status-' + claimStatus"
    />
    <!-- The integrity traffic light (integrity-debt plan, 2026-08-08):
         green = this element's chain proof verified on the last read; red =
         a check CONTRADICTED — the body is withheld and clicking the dot
         opens Talavero's report in the flyout. Lawful-unproven states
         (drafts, pre-epoch) draw NOTHING: green must mean verified. -->
    <span
      v-if="integrityState"
      class="micro-chip__integrity"
      :class="'integrity-' + integrityState"
      :title="integrityTitle"
      role="button"
      @click.stop.prevent="onIntegrityClick"
    />
  </component>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { kindFor, hashOf } from 'src/utils/kinds'

export default defineComponent({
  name: 'MicroChip',
  props: {
    // 'nodes' (prefix) OR 'node' (singular slug) — both resolved by kindFor.
    kind: { type: String, default: 'unknown' },
    id: { type: [Number, String], default: null },
    // Path like 'nodes/abc...' — used for hash extraction if hashStr is absent.
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    // Show the `icon / type / hash` triplet (default). Set false for a
    // hash-only minimal chip.
    showType: { type: Boolean, default: true },
    icon: { type: String, default: null },
    iconSize: { type: String, default: '10px' },
    to: { type: String, default: null },
    // Render as a plain SPAN even when the kind has a viewer route. A chip
    // that TRIGGERS something instead of navigating needs this — the feed
    // card's foot chip opens the post's information flyout, and as an anchor
    // it would navigate away on the same click (and nesting one inside a
    // control is invalid markup besides). The chip keeps its icon, hash and
    // address tooltip; it just stops being a link.
    linked: { type: Boolean, default: true },
    fullAddress: { type: String, default: '' },
    // Human-readable text shown in place of the hash (e.g. an entity's
    // username). The hash stays reachable through the tooltip.
    display: { type: String, default: '' },
    // Golden one-and-only treatment: star icon, `pioneer` type, carved gold.
    pioneer: { type: Boolean, default: false },
    // Claim refs: 'open' | 'supported' | 'disputed' | 'retracted' renders
    // a status dot; null (every non-claim) renders nothing.
    claimStatus: { type: String, default: null },
    // The element's integrity verdict from the API ({ status, check,
    // report }). 'ok' → green, 'violated' → red (click opens the report
    // flyout), 'exempt'/null → no dot.
    integrity: { type: Object, default: null }
  },
  setup (props) {
    const router = useRouter()
    const meta = computed(() => {
      const base = kindFor(props.kind)
      const withIcon = props.icon ? { ...base, icon: props.icon } : base
      // Pioneer chips read `★ / pioneer / <name>` but keep the entity route
      // so the chip still opens the profile.
      return props.pioneer ? { ...withIcon, kind: 'pioneer', icon: 'star' } : withIcon
    })

    const hash = computed(() => props.hashStr || hashOf(props.path))

    const route = computed(() => {
      if (!props.linked) return null
      if (props.to) return props.to
      if (!meta.value.route || !props.id) return null
      return meta.value.route(props.id)
    })

    const tooltip = computed(() => {
      const addr = props.fullAddress || props.path || `${meta.value.kind}/${hash.value}`
      return props.claimStatus ? `${addr}\nclaim · ${props.claimStatus}` : addr
    })

    const rootTag = computed(() => route.value ? 'router-link' : 'span')

    const integrityState = computed(() => {
      const s = props.integrity?.status
      return s === 'ok' || s === 'violated' ? s : null
    })
    const integrityTitle = computed(() => {
      if (integrityState.value === 'ok') return 'proof verified'
      if (integrityState.value === 'violated') {
        const check = props.integrity?.check || 'integrity'
        return props.integrity?.report
          ? `integrity violated: ${check} — click for Talavero's report`
          : `integrity violated: ${check} — report unavailable`
      }
      return null
    })
    const onIntegrityClick = () => {
      const report = props.integrity?.report
      if (integrityState.value === 'violated' && report) {
        router.push({ path: '/feed', query: { flyout: report } })
      }
    }

    return { meta, hash, route, rootTag, tooltip, integrityState, integrityTitle, onIntegrityClick }
  }
})
</script>

<style lang="scss" scoped>
.micro-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: rgba(var(--ink-rgb), 0.04);
  color: rgba(var(--ink-rgb), 0.78);
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  line-height: 1.4;
  letter-spacing: 0.02em;
  text-decoration: none;
  // Container-adaptive width: shrinks to a 6-char hash slice when squeezed,
  // expands to the full hash when the parent is wide.
  flex: 0 1 auto;
  min-width: 9ch;   // icon + 6 chars
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.micro-chip.no-type { min-width: 8ch; }

.micro-chip.is-link {
  cursor: pointer;
  &:hover {
    background: rgba(var(--ink-rgb), 0.10);
    color: var(--ink);
    border-color: rgba(var(--ink-rgb), 0.32);
    // A linked chip IS an anchor, so in rendered prose the surface's
    // `a:hover { text-decoration: underline }` outscores the `none` on
    // `.micro-chip` and struck a line under `node / a1b2c3…`. A chip is a
    // bordered PILL — the box is the affordance, and an underline through an
    // address only makes the hash harder to read character by character.
    //
    // `!important` for the reason MiniPanel gives at length: those rules are
    // scoped (`.post-square__md[data-v-…] .markdown-body a:hover` = four
    // classes + an element), so this is not a specificity fight worth entering
    // once per surface. See MiniPanel.vue's `.mini-panel-link`.
    text-decoration: none !important;
  }
}

.micro-chip__icon { flex-shrink: 0; opacity: 0.85; }

// Claim STATUS dot — same palette as InfoChip's status pill.
.micro-chip__status {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  &.status-open      { background: #5b6c82; }
  &.status-supported { background: #2e6a3a; }
  &.status-disputed  { background: #a03d3d; }
  &.status-retracted { background: #8995a8; }
}
// The integrity traffic light — same footprint as the claim dot. Red is
// the only interactive state (it routes to the report); the halo says so.
.micro-chip__integrity {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  &.integrity-ok       { background: #2e6a3a; }
  &.integrity-violated {
    background: #a03d3d;
    cursor: pointer;
    box-shadow: 0 0 0 2px rgba(160, 61, 61, 0.25);
  }
}
.micro-chip__sep  { flex-shrink: 0; opacity: 0.35; }
.micro-chip__type {
  flex-shrink: 0;
  opacity: 0.7;
  text-transform: lowercase;
}

.micro-chip__hash {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  // Minimum 6 chars visible before truncation kicks in
  min-width: 6ch;
}

// Per-kind icon tinting matches the existing HashLink palette so the family
// stays visually coherent.
.kind-node     .micro-chip__icon { color: var(--ink); }
.kind-label    .micro-chip__icon { color: #00829c; }
.kind-post     .micro-chip__icon { color: #7d8995; }
.kind-path     .micro-chip__icon { color: #4d8a83; }
.kind-entity   .micro-chip__icon { color: #9b6cb0; }
.kind-skeleton .micro-chip__icon { color: #5b6c82; }
.kind-pioneer  .micro-chip__icon { color: #c79a00; }
.kind-moment   .micro-chip__icon { color: #c79a00; }
.kind-secret   .micro-chip__icon { color: #a06070; }
.kind-link     .micro-chip__icon { color: #7d8995; }
</style>
