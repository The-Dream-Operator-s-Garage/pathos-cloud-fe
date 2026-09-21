<template>
  <!-- The reusable "Micro" chip — THE NANO PILL, in TWO STATES (2026-09-21
       PM3, user ask: "help me developing 2 states for those pills: Collapsed
       and Extended"):

         extended   `● / icon :: type :: hash ⤢`
                    a reference in running text — the post body's
                    `[[pathos:]]` refs, the feed card's foot chip — the whole
                    address in the pill, the type word said, the door at the
                    end. The default state.
         collapsed  `● / icon :: 993fa6…`
                    a panel's header pill (every Mini's `#hash` slot): no
                    type word, the hash CUT to six digits + a stated
                    ellipsis, no door — the panel's corner is the door there.

       The grammar is FIXED: the light first, a lead `/` after it, `::`
       seams. One object on every surface (PM2's law), so `sep` is retired
       with this pass and `integrityLeads` too — the light always leads.

       ⭐ 2026-09-21 PM (user ask: "when I click on them, its respective
       flyout window is opened instead of redirecting to an individual page
       … put the expand icon on the right end of all nano chips … we're
       using the very same nano chips everywhere … the nano node pill on
       the mini node viewer's header is the reference"): the root is a SPAN
       with a button role, never a router-link — a click opens the element's
       flyout window (`openFlyout`), the page stays where it is; the door
       glyph stands at the right end; corners are the pill's; the text is
       the kind's ink. No host restyles it — a chip in a post body, on a
       card's cap or foot, in a mini's header, on the stack strip or in the
       file tree is the same object. -->
  <span
    class="micro-chip"
    :class="['kind-' + meta.kind, { 'is-open': opensOnClick, 'is-collapsed': collapsed, 'is-extended': !collapsed, 'no-type': !typeShown, 'pioneer-gold': pioneer }]"
    :style="accentStyle"
    :title="tooltip"
    :role="opensOnClick ? 'button' : null"
    :tabindex="opensOnClick ? 0 : null"
    :data-nav-focus="route || null"
    @click.stop="onRootClick"
    @keydown.enter.prevent="onRootClick"
  >
    <!-- The integrity traffic light (integrity-debt plan, 2026-08-08), the
         pill's FIRST mark since PM3 (markup order = reading order now; it
         was `order: -1` under `integrity-leads` for a day): green = this
         element's chain proof verified on the last read; red = a check
         CONTRADICTED — the body is withheld and clicking the dot opens
         Talavero's report in the flyout. Lawful-unproven states (drafts,
         pre-epoch) draw NOTHING: green must mean verified. -->
    <span
      v-if="integrityState"
      class="micro-chip__integrity"
      :class="'integrity-' + integrityState"
      :title="integrityTitle"
      role="button"
      @click.stop.prevent="onIntegrityClick"
    />
    <!-- The LEAD — the address dialect's root slash, drawn before the kind
         glyph in both states (`● / node :: …`). -->
    <span class="micro-chip__lead">/</span>
    <q-icon :name="meta.icon" :size="iconSize" class="micro-chip__icon" />
    <template v-if="typeShown">
      <span class="micro-chip__sep">::</span>
      <!-- The type slot says the same thing two ways: a WORD by default, or
           a GLYPH when the caller hands one — for a chip standing in a strip
           that already states that kind as an icon, where the word would be
           the only spelt-out thing in a run of marks. Extended state only. -->
      <q-icon
        v-if="typeIcon"
        :name="typeIcon"
        :size="iconSize"
        class="micro-chip__type-icon"
      />
      <span v-else class="micro-chip__type mono">{{ typeLabel || meta.kind }}</span>
    </template>
    <span class="micro-chip__sep">::</span>
    <span class="micro-chip__hash mono">{{ hashText }}</span>
    <!-- Claim STATUS dot — a chip this small states the standing as a
         color; the word rides the tooltip. Palette matches InfoChip's
         status pill (Thread D reader surface). -->
    <span
      v-if="claimStatus"
      class="micro-chip__status"
      :class="'status-' + claimStatus"
    />
    <!-- THE DOOR (2026-09-21, user ask: "add a button to extend the item";
         PM: "put the expand icon on the right end of all nano chips"): the
         chip's LAST mark, always at the right end — `order: 99`, whatever
         leads. It opens the element in the flyout viewer — the node's
         media faces, the post's card, the entity's profile, a skeleton's
         grid, a label / moment / path / link / secret as its Mini panel
         with its surround skeleton one switch away. The whole chip opens
         the same window since the PM pass; the glyph keeps its own handler
         for the one host that takes the root click back for itself (the
         file tree's RefChip reveals in-tree; its door still opens).
         `open_in_full`, NodeMini's corner glyph, one size down. EXTENDED
         state only (PM3): the collapsed pill stands in a panel header whose
         corner already is this door. -->
    <span
      v-if="canOpen && !collapsed"
      class="micro-chip__open"
      :title="'open this ' + meta.kind + ' in the flyout viewer'"
      @click.stop.prevent="openFlyout"
    >
      <q-icon name="open_in_full" size="8px" />
    </span>
  </span>
</template>

<script>
import { defineComponent, computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { kindFor, prefixFor, hashOf } from 'src/utils/kinds'
import { elementSummary } from 'src/utils/elementSummary'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

// The collapsed state's hash cut: six digits, the house's "993fa6…" (2026-09-21
// PM3, user ask: "make sure we're not displaying more than 6 hash digits").
const COLLAPSED_DIGITS = 6

export default defineComponent({
  name: 'MicroChip',
  props: {
    // 'nodes' (prefix) OR 'node' (singular slug) — both resolved by kindFor.
    kind: { type: String, default: 'unknown' },
    id: { type: [Number, String], default: null },
    // Path like 'nodes/abc...' — used for hash extraction if hashStr is absent.
    path: { type: String, default: '' },
    hashStr: { type: String, default: '' },
    // THE STATE (2026-09-21 PM3). `collapsed` = the panel-header form:
    // `● / icon :: 993fa6…` — no type word, six hash digits + `…`, no door.
    // Off (the default) = extended: `● / icon :: type :: hash ⤢`, the form
    // a reference wears inside a post. Every Mini's `#hash` slot passes it;
    // a RefMicro in prose never does.
    collapsed: { type: Boolean, default: false },
    // Show the type word in the EXTENDED state (default). Set false for a
    // hash-only chip; the collapsed state never shows it either way.
    showType: { type: Boolean, default: true },
    // The WORD between the two seams. Defaults to the kind's own slug
    // ('post', 'node', …) — what the element IS. A chip that stands for a
    // different READING of the same element says so here.
    typeLabel: { type: String, default: '' },
    // …or that word DRAWN. Wins over `typeLabel` when both are given.
    typeIcon: { type: String, default: '' },
    // ⚠ RETIRED 2026-09-21 PM3 — the grammar is fixed (`/` lead, `::` seams)
    // in both states; accepted so older callers do not warn, ignored.
    sep: { type: String, default: '' },
    icon: { type: String, default: null },
    iconSize: { type: String, default: '10px' },
    to: { type: String, default: null },
    // ⚠ RETIRED 2026-09-21 PM — the chip is never an anchor now (see the
    // template note); accepted so older callers do not warn, ignored.
    linked: { type: Boolean, default: true },
    fullAddress: { type: String, default: '' },
    // Human-readable text shown in place of the hash (e.g. an entity's
    // username). The hash stays reachable through the tooltip. A name is
    // never cut to six characters — the collapsed cut is for DIGITS.
    display: { type: String, default: '' },
    // Golden one-and-only treatment: star icon, `pioneer` type, carved gold.
    pioneer: { type: Boolean, default: false },
    // Claim refs: 'open' | 'supported' | 'disputed' | 'retracted' renders
    // a status dot; null (every non-claim) renders nothing.
    claimStatus: { type: String, default: null },
    // The element's integrity verdict from the API ({ status, check,
    // report }). 'ok' → green, 'violated' → red (click opens the report
    // flyout), 'exempt'/null → no dot.
    integrity: { type: Object, default: null },
    // ⚠ RETIRED 2026-09-21 PM3 — the light ALWAYS leads now (it stood at
    // the pill's head by default since PM anyway; PM3 fixed the grammar and
    // moved the markup to match). Accepted, ignored.
    integrityLeads: { type: Boolean, default: true },
    // THE LIGHT ON EVERY CHIP (2026-09-21, user ask: the node's traffic
    // light "to all of them"). When no `integrity` is handed in, the chip
    // resolves its own off `GET /refs/summary` — every kind's summary
    // carries the verdict since the same day (integrityService
    // .verifyElementSync) — through the session-wide cache in
    // utils/elementSummary, so N chips for one element cost one read.
    // `verify=false` opts a chip out (a dense strip that must not fetch).
    verify: { type: Boolean, default: true },
    // THE DOOR: draw the open-in-flyout mark at the right end (see the
    // template). On everywhere since 2026-09-21 PM — the same chip on every
    // surface; the mark is part of what an EXTENDED nano pill is.
    expand: { type: Boolean, default: true },
    // THE ROOT CLICK opens the flyout too (2026-09-21 PM). A host that needs
    // the click for itself (the file tree's in-tree reveal) turns this off
    // and listens on the chip; the door glyph still opens the window.
    openOnClick: { type: Boolean, default: true }
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

    // The type word shows in the extended state only.
    const typeShown = computed(() => props.showType && !props.collapsed)

    // What the hash slot PRINTS. A display name is printed whole in both
    // states; a hash is printed whole when extended (the CSS ellipsis cuts
    // it to the room the host gives, 6ch at the least) and cut to six
    // digits + a stated `…` when collapsed — stated, so a reader can tell a
    // short address from a whole one (NodeMini's 08-23 rule, now the
    // chip's own). No misleading ellipsis on a hash already that short.
    const hashText = computed(() => {
      if (props.display) return props.display
      const h = hash.value || ''
      if (!props.collapsed || h.length <= COLLAPSED_DIGITS) return h
      return h.slice(0, COLLAPSED_DIGITS) + '…'
    })

    // The element's page route — NOT navigated to any more (2026-09-21 PM);
    // it keys `data-nav-focus`, the trail's return halo, because a chip that
    // opens a window is still a way of being on that element.
    const route = computed(() => {
      if (props.to) return props.to
      if (!meta.value.route || !props.id) return null
      return meta.value.route(props.id)
    })

    const tooltip = computed(() => {
      const addr = props.fullAddress || props.path || `${meta.value.kind}/${hash.value}`
      return props.claimStatus ? `${addr}\nclaim · ${props.claimStatus}` : addr
    })

    // THE KIND'S COLOUR IS kinds.js's (2026-09-21) — two custom properties on
    // the root: `--kind-accent` for the glyph, `--kind-ink` (PM, user ask:
    // "the font color … same color as the icon, but in its darkest quasar
    // tone") for the text. The scoped `.kind-* .micro-chip__icon` block that
    // used to live in this file (a purple entity, a grey post, a teal label —
    // the pre-palette set) is gone with it.
    const accentStyle = computed(() => ({ '--kind-accent': meta.value.color, '--kind-ink': meta.value.ink }))

    // The on-disk prefix this chip stands for — 'entities' for a pioneer
    // chip too (the golden treatment renames the kind, not the registry).
    const prefix = computed(() => (props.pioneer || meta.value.kind === 'entity')
      ? 'entities'
      : prefixFor(props.kind))

    // The verdict: handed in, or resolved here off the cached summary.
    const resolvedIntegrity = ref(null)
    watchEffect(() => {
      resolvedIntegrity.value = null
      if (props.integrity || !props.verify) return
      const p = prefix.value
      if (!p || p === 'unknown' || p === 'actions') return
      const key = hash.value ? { hash: hash.value } : (props.id != null ? { id: props.id } : null)
      if (!key) return
      elementSummary({ prefix: p, ...key }).then((s) => {
        if (s?.integrity) resolvedIntegrity.value = s.integrity
      })
    })
    const integrityCard = computed(() => props.integrity || resolvedIntegrity.value)

    const integrityState = computed(() => {
      const s = integrityCard.value?.status
      return s === 'ok' || s === 'violated' ? s : null
    })
    const integrityTitle = computed(() => {
      if (integrityState.value === 'ok') {
        // Green says the check that EXISTS for this kind passed: a signed
        // sidecar for nodes / links / paths / skeletons, the chain file for
        // the four kinds the truth spine never signs. The tooltip names
        // which, so the same colour never overstates.
        return integrityCard.value?.proof === 'file'
          ? 'proof verified — chain file present and decodable (this kind is not signed)'
          : 'proof verified'
      }
      if (integrityState.value === 'violated') {
        const check = integrityCard.value?.check || 'integrity'
        return integrityCard.value?.report
          ? `integrity violated: ${check} — click for Talavero's report`
          : `integrity violated: ${check} — report unavailable`
      }
      return null
    })
    const onIntegrityClick = () => {
      const report = integrityCard.value?.report
      if (integrityState.value === 'violated' && report) {
        router.push({ path: '/feed', query: { flyout: report } })
      }
    }

    // THE DOOR. Every kind opens by ADDRESS through the flyout store's ref
    // door (`spawnRef`), which resolves nodes, entities and skeletons into
    // their own windows and everything else into the element window; a
    // chip that knows only an id learns its hash off the cached summary
    // first. Posts open on their SKELETON address — a post's `path` IS
    // `skeletons/<hash>` (the feed hands `item.skeleton_path`), and the ref
    // door steps a POST instance forward to its card by itself. An entity
    // with an id goes straight through the entity door. The collapsed pill
    // draws no door glyph but its ROOT still opens the window (the same
    // click law in both states).
    const canOpen = computed(() =>
      props.expand && prefix.value && prefix.value !== 'unknown' && prefix.value !== 'actions' &&
      (!!hash.value || props.id != null))
    const opensOnClick = computed(() => canOpen.value && props.openOnClick)
    const onRootClick = () => { if (opensOnClick.value) openFlyout() }
    const openFlyout = async () => {
      const flyouts = useFlyoutViewersStore()
      const p = prefix.value
      if (p === 'entities' && props.id != null) {
        flyouts.spawnEntity({ id: props.id, display_name: props.display || null, pioneer: !!props.pioneer })
        return
      }
      const addrPrefix = p === 'posts' ? 'skeletons' : p
      let h = hash.value
      if (!h && props.id != null) {
        const s = await elementSummary({ prefix: p, id: props.id })
        h = s?.hash || null
      }
      if (h) flyouts.spawnRef(`${addrPrefix}/${h}`)
    }

    return { meta, hash, hashText, typeShown, route, tooltip, accentStyle, integrityState, integrityTitle, onIntegrityClick, canOpen, opensOnClick, onRootClick, openFlyout }
  }
})
</script>

<style lang="scss" scoped>
.micro-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  // THE PILL (2026-09-21 PM): NodeMini's header pill is the reference for
  // every nano chip, and its corners were the pill's since the morning
  // (`--radius-pill`, scoped to that head then; the chip's own now).
  border-radius: var(--radius-pill, 999px);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: rgba(var(--ink-rgb), 0.04);
  // THE INK IS THE KIND'S (2026-09-21 PM, user ask): type word, separators
  // and hash in the icon family's darkest Quasar tone — kinds.js's `ink`,
  // through `--kind-ink`. (Was the platform's slate at .78; and on prose
  // surfaces the anchor rule painted it `#00829c` — the chip is not an
  // anchor any more, so no surface can recolour it.)
  color: var(--kind-ink, rgba(var(--ink-rgb), 0.78));
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  line-height: 1.4;
  letter-spacing: 0.02em;
  text-decoration: none;
  // Container-adaptive width (EXTENDED): shrinks to a 6-char hash slice when
  // squeezed, expands to the full hash when the parent is wide.
  flex: 0 1 auto;
  min-width: 9ch;   // icon + 6 chars
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.micro-chip.no-type { min-width: 8ch; }

// THE COLLAPSED PILL (2026-09-21 PM3) prints its whole text — six digits and
// the ellipsis it states itself — so it needs no room to adapt into and no
// CSS ellipsis over the one it already wrote.
.micro-chip.is-collapsed {
  min-width: 0;
  .micro-chip__hash { min-width: 0; overflow: visible; }
}

// A chip that opens its window answers the pointer in ITS OWN FAMILY: a
// wash of the glyph's tone behind it, the rim a step firmer, the ink
// unchanged. (`.is-link` — the anchor era's class — is gone with the anchor;
// the `text-decoration: none !important` it carried against prose
// `a:hover` rules has nothing to fight any more.)
.micro-chip.is-open {
  cursor: pointer;
  outline: none;
  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, var(--kind-accent, var(--ink)) 12%, transparent);
    border-color: color-mix(in srgb, var(--kind-accent, var(--ink)) 45%, transparent);
  }
}

// The kind glyph wears kinds.js's colour through the root's `--kind-accent`
// (2026-09-21). The pioneer's `.pioneer-gold` still out-ranks it (global,
// `!important`, the one carved treatment).
.micro-chip__icon { flex-shrink: 0; opacity: 0.85; color: var(--kind-accent, currentColor); }

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
// The integrity traffic light. ⭐ 2026-09-21 PM3 (user ask: "make the dot
// slightly smaller, paint it with a light-green quasar tone and put it a
// thin lighter light-green quasar tone border"): a 6px BEAD (was a 7px
// solid disc), Quasar light-green-6 under a 1px light-green-3 rim —
// `--verdict-ok` / `--verdict-ok-rim` in _tokens.scss, the one source both
// pills (this and InfoChip's) read. Red keeps its own palette and is the
// only interactive state (it routes to the report); the halo says so.
.micro-chip__integrity {
  flex-shrink: 0;
  box-sizing: border-box;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  &.integrity-ok {
    background: var(--verdict-ok, #8bc34a);
    border: 1px solid var(--verdict-ok-rim, #c5e1a5);
  }
  &.integrity-violated {
    background: #a03d3d;
    cursor: pointer;
    box-shadow: 0 0 0 2px rgba(160, 61, 61, 0.25);
  }
}
// THE DOOR — the chip's last mark. Dimmed like the type word until the chip
// is hovered; coral on its own hover, NodeMini's corner colour, so the
// three "open" marks on the platform (mini corner, flyout act, chip door)
// answer the finger the same way.
.micro-chip__open {
  order: 99;               // the RIGHT END, whatever else leads (2026-09-21 PM)
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  margin-left: 1px;
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.12s, color 0.12s;
  &:hover { opacity: 1; color: var(--coral-deep, #d35f5f); }
}
.micro-chip:hover .micro-chip__open { opacity: 0.85; }
// The lead `/` and the `::` seams — punctuation, a step under everything
// they separate.
.micro-chip__lead,
.micro-chip__sep  { flex-shrink: 0; opacity: 0.35; }
// The drawn type. One step under the leading icon's 0.85, the way the type
// WORD sits one step under the hash — it classifies, it does not name.
.micro-chip__type-icon { flex-shrink: 0; opacity: 0.7; }
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
  // Minimum 6 chars visible before truncation kicks in (extended)
  min-width: 6ch;
}

// (The per-kind `.kind-* .micro-chip__icon` tints stood here 2026-07 →
// 2026-09-21: a purple entity, a grey post, a #00829c label, a slate
// skeleton, one gold for pioneer and moment. They were the third palette
// the chips answered to. kinds.js is the one now — see `--kind-accent`.)
</style>
