<template>
  <!-- The "Info" tier of the chip family — between Micro (hash chip) and
       Mini (panel). Renders 1–2 lines of resolved human-readable info
       ("Tue, 13 Apr 2026 · 2:33 PM / 18.92°N, 99.23°W") with the kind's
       icon tint, and routes to the element's individual viewer.

       Presentational when `primary` is given; self-resolving via
       GET /api/refs/summary when given only an address or kind+id. -->
  <component
    :is="rootTag"
    :to="route"
    class="info-chip"
    :class="['kind-' + meta.kind, { 'is-link': !!route, 'is-dense': dense, 'is-loading': loading, 'pioneer-gold': isPioneer, 'is-locked': isLocked }]"
    :title="isLocked ? 'Private element — click to request access' : tooltip"
    :data-nav-focus="route || null"
    @click.stop
  >
    <span v-if="isLocked" class="info-chip__lock">
      <q-icon name="lock" size="9px" />
    </span>
    <q-icon :name="icon || (isPioneer ? 'star' : meta.icon)" :size="dense ? '12px' : '14px'" class="info-chip__icon" />
    <span class="info-chip__lines">
      <span class="info-chip__primary mono-when-locked">{{ primaryLine }}</span>
      <span v-if="secondaryLine && !dense" class="info-chip__secondary">{{ secondaryLine }}</span>
    </span>
    <!-- Claim refs wear their STATUS at a glance (Thread D reader surface):
         the summary carries claim { id, status } for CLAIM instances. -->
    <span
      v-if="claimStatus"
      class="info-chip__status"
      :class="'status-' + claimStatus"
      :title="'claim · ' + claimStatus"
    >{{ claimStatus }}</span>
    <!-- The integrity traffic light (integrity-debt plan): green = proof
         verified, red = a check contradicted (click → Talavero's report);
         lawful-unproven draws nothing. Same grammar as MicroChip's dot. -->
    <span
      v-if="integrityState"
      class="info-chip__integrity"
      :class="'integrity-' + integrityState"
      :title="integrityTitle"
      role="button"
      @click.stop.prevent="onIntegrityClick"
    />
    <!-- Locked chips open the request-permission panel instead of routing. -->
    <q-menu v-if="isLocked" anchor="bottom left" self="top left" :offset="[0, 4]">
      <RequestAccessPanel :address="lockedAddress" />
    </q-menu>
  </component>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { kindFor, prefixFor, hashOf, shortHash } from 'src/utils/kinds'
import { refService } from 'src/services/ref.service'
import RequestAccessPanel from './RequestAccessPanel.vue'

export default defineComponent({
  name: 'InfoChip',
  components: { RequestAccessPanel },
  props: {
    // 'moments' (prefix) OR 'moment' (singular slug).
    kind: { type: String, default: 'unknown' },
    id: { type: [Number, String], default: null },
    hashStr: { type: String, default: '' },
    // Full reference ('moments/<hash>' or owner-scoped) — enables
    // self-resolution when no primary is supplied.
    address: { type: String, default: '' },
    // Pre-resolved display lines. When `primary` is set the chip never
    // fetches — purely presentational.
    primary: { type: String, default: '' },
    // Display override that does NOT suppress resolution — the chip still
    // fetches to learn its route/secondary, but shows this text as the
    // headline. Used by inline [[pathos:…|label]] references.
    label: { type: String, default: '' },
    secondary: { type: String, default: '' },
    icon: { type: String, default: null },
    to: { type: String, default: null },
    // Single-line compact form (secondary folds into the tooltip).
    dense: { type: Boolean, default: false },
    // Golden one-and-only treatment. Usually learned from the resolved
    // summary; pass explicitly when `primary` suppresses resolution.
    pioneer: { type: Boolean, default: false }
  },
  setup (props) {
    const router = useRouter()
    const meta = computed(() => kindFor(props.kind))

    const loading = ref(false)
    const resolved = ref(null) // { primary, secondary, route, id, hash }

    const needsFetch = computed(() =>
      !props.primary && (props.address || props.id != null || props.hashStr))

    const load = async () => {
      if (!needsFetch.value) return
      loading.value = true
      try {
        const res = props.address
          ? await refService.summary(props.address)
          : (props.id != null
              ? await refService.summaryById(prefixFor(meta.value.kind), props.id)
              : await refService.summary(`${prefixFor(meta.value.kind)}/${props.hashStr}`))
        if (res?.success) resolved.value = res.summary
      } catch (_) { /* chip degrades to short hash */ }
      loading.value = false
    }

    onMounted(load)
    watch(() => [props.address, props.id, props.hashStr, props.primary], load)

    const fallbackHash = computed(() =>
      shortHash(props.hashStr || props.address, 10))

    const primaryLine = computed(() =>
      props.label || props.primary || resolved.value?.primary ||
      (loading.value ? '…' : (fallbackHash.value || meta.value.kind)))

    const secondaryLine = computed(() =>
      props.secondary || resolved.value?.secondary || '')

    // Access doctrine: the summary endpoint answers with a locked stub
    // (hash, no content, no route) for elements the viewer can't read.
    const isLocked = computed(() => resolved.value?.locked === true)

    const lockedAddress = computed(() => {
      if (props.address) return props.address
      const r = resolved.value
      if (r?.kind && r?.hash) return `${prefixFor(r.kind)}/${r.hash}`
      return props.hashStr ? `${prefixFor(meta.value.kind)}/${props.hashStr}` : ''
    })

    const route = computed(() => {
      if (isLocked.value) return null // locked chips open the request panel
      if (props.to) return props.to
      // The server's resolved route is canonical (e.g. a POST-instance
      // skeleton routes to /posts/:id, not /skeletons/:id).
      if (resolved.value?.route) return resolved.value.route
      const id = props.id ?? resolved.value?.id
      if (meta.value.route && id != null) return meta.value.route(id)
      return null
    })

    const tooltip = computed(() => {
      const bits = [primaryLine.value]
      if (secondaryLine.value) bits.push(secondaryLine.value)
      const addr = props.address ||
        (props.hashStr ? `${prefixFor(meta.value.kind)}/${props.hashStr}` : '')
      if (addr) bits.push(addr)
      return bits.join('\n')
    })

    const rootTag = computed(() => route.value ? 'router-link' : 'span')

    const isPioneer = computed(() =>
      props.pioneer || resolved.value?.pioneer === true)

    const claimStatus = computed(() => resolved.value?.claim?.status || null)

    // The integrity verdict rides the summary (integrity-debt plan):
    // 'ok' → green, 'violated' → red + click routes to Talavero's report.
    const integrityState = computed(() => {
      const s = resolved.value?.integrity?.status
      return s === 'ok' || s === 'violated' ? s : null
    })
    const integrityTitle = computed(() => {
      if (integrityState.value === 'ok') return 'proof verified'
      if (integrityState.value !== 'violated') return null
      const check = resolved.value?.integrity?.check || 'integrity'
      return resolved.value?.integrity?.report
        ? `integrity violated: ${check} — click for Talavero's report`
        : `integrity violated: ${check} — report unavailable`
    })
    const onIntegrityClick = () => {
      const report = resolved.value?.integrity?.report
      if (integrityState.value === 'violated' && report) {
        router.push({ path: '/feed', query: { flyout: report } })
      }
    }

    return {
      claimStatus,
      integrityState,
      integrityTitle,
      onIntegrityClick,
      meta,
      loading,
      primaryLine,
      secondaryLine,
      route,
      rootTag,
      tooltip,
      hashOf,
      isPioneer,
      isLocked,
      lockedAddress
    }
  }
})
</script>

<style lang="scss" scoped>
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: rgba(var(--ink-rgb), 0.04);
  color: rgba(var(--ink-rgb), 0.82);
  text-decoration: none;
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.info-chip.is-link {
  cursor: pointer;
  &:hover {
    background: rgba(var(--ink-rgb), 0.10);
    color: var(--ink);
    border-color: rgba(var(--ink-rgb), 0.32);
  }
}

.info-chip.is-loading { opacity: 0.6; }

// Locked (access doctrine): the hashname shows, the content doesn't. The
// lock bubble sits on the chip's edge; clicking opens the request panel.
.info-chip.is-locked {
  position: relative;
  padding-left: 14px;
  border-style: dashed;
  cursor: pointer;
  color: rgba(var(--ink-rgb), 0.55);
  .info-chip__primary { font-family: var(--mono, monospace); font-weight: 400; }
  &:hover { background: rgba(var(--ink-rgb), 0.1); border-color: rgba(var(--ink-rgb), 0.4); }
}
.info-chip__lock {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--paper-card, #ffffff);
  border: 1px solid rgba(#a06070, 0.55);
  color: #a06070;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.info-chip__icon { flex-shrink: 0; opacity: 0.9; }

// Claim STATUS pill — one shared palette with MicroChip's status dot and
// the claim band so every surface states a claim's standing identically.
.info-chip__status {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  font-size: 0.6em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  &.status-open      { background: #5b6c82; }
  &.status-supported { background: #2e6a3a; }
  &.status-disputed  { background: #a03d3d; }
  &.status-retracted { background: #8995a8; text-decoration: line-through; }
}

// The integrity traffic light — MicroChip's dot at Info scale. Red is the
// only interactive state (routes to Talavero's report).
.info-chip__integrity {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.integrity-ok       { background: #2e6a3a; }
  &.integrity-violated {
    background: #a03d3d;
    cursor: pointer;
    box-shadow: 0 0 0 2px rgba(160, 61, 61, 0.25);
  }
}

.info-chip__lines {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.info-chip__primary {
  font-size: 0.78em;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-chip__secondary {
  font-size: 0.68em;
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-chip.is-dense {
  gap: 4px;
  padding: 1px 6px;
  .info-chip__primary { font-size: 0.72em; }
}

// Per-kind icon tints — same palette as MicroChip so the family coheres.
.kind-node     .info-chip__icon { color: var(--ink); }
.kind-label    .info-chip__icon { color: #00829c; }
.kind-post     .info-chip__icon { color: #7d8995; }
.kind-path     .info-chip__icon { color: #4d8a83; }
.kind-entity   .info-chip__icon { color: #9b6cb0; }
.kind-skeleton .info-chip__icon { color: #5b6c82; }
.kind-pioneer  .info-chip__icon { color: #c79a00; }
.kind-moment   .info-chip__icon { color: #c79a00; }
.kind-secret   .info-chip__icon { color: #a06070; }
.kind-link     .info-chip__icon { color: #7d8995; }
</style>
