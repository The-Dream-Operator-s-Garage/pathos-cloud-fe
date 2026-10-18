<template>
  <!-- THE MINI HEAD (2026-09-30, user ask: "take as layout the node mini
       viewer and help me refactor the whole family … under the same basis
       so they all look consistent"). NodeMini's header ROW, lifted out of
       NodeMini so every Mini draws the SAME one:

         chip+copy │ name │ [switches…] │ [labels] │ [pin] │ open

       · the CHIP — the kind's nano pill in its COLLAPSED state (`icon /
         993fa6… ●`, the verdict light after the hash; no door — the corner
         is the panel's door) + a copy glyph handing over the FULL hash;
       · the NAME — the one elastic zone, centred, Nasalization, one line
         cut by an ellipsis (the whole string on the tooltip);
       · SWITCHES — per-kind view toggles (the path's mode + layout), each
         a zone of its own wearing the glyph of what it OFFERS;
       · ⭐ 2026-10-18 the LABELS switch — shows / hides the panel's label
         strip (MiniPanel's; drawn only when the element has labels) — and
         the PIN — this element on the viewer's pins (the kinds pins take:
         node · label · skeleton/post), lit while pinned;
       · the OPEN corner — this element in its own floating window, the
         card family's `open_in_new` glyph (⤢ `open_in_full` until
         2026-10-18), ALWAYS a window — the NAME is the side door.

       Rendered as a FRAGMENT (no wrapper): the zones must be the panel
       head's direct flex children, which is what the full-height hairlines
       (`& + &`) and the witnesses (`.mini-panel__head--own > *`) read.
       Every element carries TWO classes — the family's (`mini-head__…`,
       styled here) and the kind's own (`node-mini__…`, `path-mini__…`, …)
       as a stable hook for hosts and witnesses; nothing styles the second.
       Colours come from the panel: `--mini-ink` (the pill's text tone) for
       the zones, `--mini-accent` (its glyph tone) for a switch under the
       pointer — MiniPanel's `kind` sets both. -->
  <span :class="zone('chip')">
    <slot name="chip">
      <MicroChip :kind="prefix" :id="id" :path="path" :integrity="integrity" collapsed />
    </slot>
    <button
      v-if="copyValue"
      type="button"
      :class="[el('copy'), { 'is-copied': copied }]"
      :title="copied ? 'hash copied' : copyTitleShown"
      @click.stop.prevent="copyHash"
    >
      <q-icon :name="copied ? 'check' : 'content_copy'" size="10px" />
    </button>
  </span>

  <!-- THE NAME IS THE SIDE DOOR (⭐ 2026-10-18, user ask: "if i click on
       the item (its title) … make the item be opened on the side viewer"):
       the element in the side viewer, a floating window where none is
       mounted — never its page. -->
  <span
    :class="zone('name')"
    :title="nameTitle || name"
    role="link"
    tabindex="0"
    @click="onName"
    @keydown.enter.prevent="openSide"
  >
    <slot name="name">
      <span :class="[el('name-text'), nameClass]">{{ name }}</span>
    </slot>
  </span>

  <button
    v-for="s in switches"
    :key="s.key"
    type="button"
    :class="[zone(s.key), 'mini-head__zone--switch', s.cls]"
    :title="s.title"
    :disabled="!!s.disabled"
    @click.stop.prevent="s.onClick && s.onClick()"
  >
    <q-icon :name="s.icon" :size="s.size || '10px'" />
  </button>

  <!-- THE LABELS SWITCH — the strip's hide / show; wears what the strip
       IS while shown, `label_off` while hidden. Only when there are labels. -->
  <button
    v-if="panel && panel.labelCount"
    type="button"
    :class="[zone('labels'), 'mini-head__zone--switch', { 'is-on': !panel.labelsHidden }]"
    :title="panel.labelsHidden ? `show the labels (${panel.labelCount})` : 'hide the labels'"
    :aria-pressed="!panel.labelsHidden"
    @click.stop.prevent="panel.toggleLabels()"
  >
    <q-icon :name="panel.labelsHidden ? 'label_off' : 'label'" size="10px" />
  </button>

  <!-- THE PIN — `usePin`, the card family's pin, one pinned set for both. -->
  <button
    v-if="pinnable"
    type="button"
    :class="[zone('pin'), 'mini-head__zone--switch', { 'is-on': pinned }]"
    :title="pinTitle"
    :aria-pressed="pinned"
    :disabled="pinBusy"
    @click.stop.prevent="togglePin"
  >
    <q-icon name="push_pin" size="10px" />
  </button>

  <button
    v-if="openable"
    type="button"
    :class="zone('open')"
    :title="openTitle"
    @click.stop.prevent="open"
  >
    <q-icon name="open_in_new" size="10px" />
  </button>
</template>

<script>
import { defineComponent, computed, ref, inject, watchEffect } from 'vue'
import MicroChip from './MicroChip.vue'
import { kindFor, prefixFor, hashOf } from 'src/utils/kinds'
import { elementTarget } from 'src/utils/elementTarget'
import { useFlyoutViewersStore, openInSideViewer } from 'src/stores/flyoutViewers'
import { usePin } from 'src/composables/usePin'

export default defineComponent({
  name: 'MiniHead',
  components: { MicroChip },
  inheritAttrs: false,
  props: {
    // The element kind — a kinds.js prefix ('nodes') or slug ('node').
    kind: { type: String, required: true },
    // The kind's own BEM block for the second class on every element.
    // Default `<slug>-mini` (node-mini, path-mini, post-mini, …).
    block: { type: String, default: '' },
    // The pill: id + address + the verdict (MicroChip resolves its own
    // when none is handed in).
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    integrity: { type: Object, default: null },
    // The name zone: the text, its tooltip, an extra class on the run
    // (the pioneer's carved gold).
    name: { type: String, default: '' },
    nameTitle: { type: String, default: '' },
    nameClass: { type: [String, Array, Object], default: null },
    // The copy glyph: true = the FULL hash of `path`; a string = that
    // value; false = no glyph.
    copy: { type: [Boolean, String], default: true },
    copyTitle: { type: String, default: '' },
    // [{ key, icon, title, onClick, cls?, disabled?, size? }] — zones between
    // the name and the corner, in order.
    switches: { type: Array, default: () => [] },
    openable: { type: Boolean, default: true },
    openTitle: { type: String, default: 'open in a flyout window' },
    // A custom door (`@open`); absent = the nano pill's own door.
    onOpen: { type: Function, default: null }
  },
  setup (props) {
    const meta = computed(() => kindFor(props.kind))
    const prefix = computed(() => prefixFor(props.kind))
    const blockName = computed(() => props.block || `${meta.value.kind}-mini`)

    // Both class families on every element (see the template note).
    const el = (name) => [`mini-head__${name}`, `${blockName.value}__${name}`]
    const zone = (mod) => [
      'mini-head__zone', `mini-head__zone--${mod}`,
      `${blockName.value}__zone`, `${blockName.value}__zone--${mod}`
    ]

    // THE COPY — the FULL hash, not the pill's six-digit cut: the short
    // form is for reading, and what a `[[pathos:]]` ref or an API call needs
    // is the whole one (NodeMini's 2026-08-23 argument). The house idiom:
    // the glyph flips to a check for 1600ms; a denied clipboard is swallowed
    // — the mark simply never flips.
    const copyValue = computed(() => {
      if (props.copy === false) return ''
      if (typeof props.copy === 'string') return props.copy
      return hashOf(props.path || '')
    })
    const copyTitleShown = computed(() => props.copyTitle || `copy the full ${meta.value.kind} hash`)
    const copied = ref(false)
    const copyHash = async () => {
      if (!copyValue.value) return
      try {
        await navigator.clipboard.writeText(copyValue.value)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (e) { /* clipboard denied — the glyph simply never flips */ }
    }

    // THE PANEL this head belongs to (MiniPanel's `miniPanel`): it learns
    // the element here — what its side door opens and whose labels its
    // strip reads — and hands back the strip's state for the switch.
    const panel = inject('miniPanel', null)
    const facts = computed(() => ({ kind: prefix.value, id: props.id, path: props.path || '', label: props.name }))
    if (panel) watchEffect(() => panel.register(facts.value))

    // THE WINDOW DOOR — the corner (`open_in_new`): a custom `@open`, else
    // the element's window by the ref / entity door (utils/elementTarget,
    // the nano pill's own resolution). ALWAYS a window (`flyout: true`) —
    // even pressed inside the side viewer, whose sink would take it.
    const open = async () => {
      if (props.onOpen) { props.onOpen(); return }
      const t = await elementTarget(facts.value)
      if (t) useFlyoutViewersStore().spawn(t, { flyout: true })
    }

    // THE SIDE DOOR — the name. A press on something inside the name that
    // is its own door (a chip handed in through #name) is left to it.
    const openSide = async () => {
      if (panel) { panel.openSide(); return }
      const t = await elementTarget(facts.value)
      if (t) openInSideViewer(t)
    }
    const onName = (e) => {
      const inner = e.target?.closest?.('a[href], button, [role="button"], input')
      if (inner && e.currentTarget.contains(inner)) return
      e.stopPropagation()
      e.preventDefault()
      openSide()
    }

    // THE PIN.
    const { pinnable, pinned, pinBusy, pinTitle, togglePin } = usePin(() => ({
      kind: prefix.value, id: props.id, address: props.path || '', label: props.name
    }))

    return { prefix, el, zone, copyValue, copyTitleShown, copied, copyHash, open, panel, onName, openSide, pinnable, pinned, pinBusy, pinTitle, togglePin }
  }
})
</script>

<style lang="scss" scoped>
// ── THE ZONES — NodeMini's grammar (2026-08-23 → 09-21), verbatim ─────────
// Divided by FULL-HEIGHT hairlines: the zones carry the padding (MiniPanel's
// own head carries none), and the panel head's `align-items: stretch` runs
// each rule its whole height. One line, always — a header that grows a
// second line changes the panel's height from its content, which a dense
// band must not do; the name takes the ellipsis.
.mini-head__zone {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 4px;
  color: var(--mini-ink, var(--panel-ink, #2C3D4E));
  white-space: nowrap;
  overflow: hidden;

  // One rule before every zone but the first, so the count follows the zones
  // and none can hang at an edge. `--panel-rule` is MiniPanel's line tone,
  // which its hover repaints — the whole line system moves as one.
  & + & { border-left: 1px solid var(--panel-rule, rgba(33, 33, 33, 0.22)); }
}

// THE CHIP ZONE — squeezable, never stretched (the slack is the name's). The
// ONE pair of dials every mini's chip zone reads (⭐ 2026-09-21 PM8,
// _tokens.scss): 2px of air on the pill's three edge sides, 4px on the right
// before the name's hairline, 2px between the pill and its copy glyph.
.mini-head__zone--chip {
  flex: 0 1 auto;
  padding: var(--mini-chip-zone-pad, 2px 4px 2px 2px);
  gap: var(--mini-chip-zone-gap, 2px);
}

// THE NAME — the one elastic zone, centred in the slack it absorbs.
.mini-head__zone--name {
  flex: 1 1 auto;
  justify-content: center;
}

// The display face declared directly rather than through `.nasalization`:
// the utility also tracks the letters 0.05em, which at this size costs about
// a character of the ellipsis (NodeMini's reason).
.mini-head__name-text {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.76em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The real <button>s — reset to the zone's own face, so the chrome stays the
// zone's and the cursor is the one tell. `border: 0` kills the UA box; the
// hairline survives it (`& + &` above outranks this for border-left).
.mini-head__copy,
.mini-head__zone--switch,
.mini-head__zone--open {
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
}

// THE COPY GLYPH — a bare glyph on the chip's line, the zone's ink at 60% so
// it reads as an affordance ON the chip rather than a second object; full ink
// under the pointer, `--positive` for the 1600ms the check shows.
.mini-head__copy {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 3px;
  padding: 0;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.12s, color 0.12s;

  &:hover { opacity: 1; }
  &.is-copied { opacity: 1; color: var(--positive, #21ba45); }
}

// A SWITCH answers the pointer in the kind's accent — the pill's glyph tone.
.mini-head__zone--switch {
  flex: 0 0 auto;
  &:hover { color: var(--mini-accent, var(--coral-deep, #d35f5f)); }
  &:disabled { opacity: 0.5; cursor: default; }
}

// THE NAME is a door (2026-10-18, the side viewer): the pointer says so,
// and the run takes the kind's accent under it — the switches' answer.
.mini-head__zone--name {
  cursor: pointer;
  &:hover { color: var(--mini-accent, var(--coral-deep, #d35f5f)); }
  &:focus-visible { outline: 1px solid var(--mini-accent, var(--coral-deep, #d35f5f)); outline-offset: -2px; }
}

// THE LABELS SWITCH (2026-10-18) — quiet while the strip shows (the strip
// itself is the state), dimmed while it is hidden, like a type word.
.mini-head__zone--labels:not(.is-on) { opacity: 0.55; }
.mini-head__zone--labels:not(.is-on):hover { opacity: 1; }

// THE PIN (2026-10-18) — lit in the card family's "on" amber (CardCap's
// `.is-on`), so a pinned element reads the same on a card and on a Mini.
.mini-head__zone--pin.is-on { color: var(--accent, #c79a00); }

// THE CORNER keeps NodeMini's coral — the door's one colour on every kind
// (mint on the old teal coat was ~1.1:1). It lights when the corner itself is
// under the pointer, and on a LINKED panel (the whole panel is a router-link)
// when the panel is: the child chain names this panel's own corner only, so
// hovering an outer panel never lights the corners of panels nested in it.
.mini-head__zone--open {
  flex: 0 0 auto;
  &:hover { color: var(--coral-deep, #d35f5f); }
}
.mini-panel--hover:hover > .mini-panel__head > .mini-head__zone--open {
  color: var(--coral-deep, #d35f5f);
}
</style>
