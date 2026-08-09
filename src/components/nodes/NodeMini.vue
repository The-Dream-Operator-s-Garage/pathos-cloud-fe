<template>
  <!-- Compact preview panel for a NODE — and, since a `![[pathos:nodes/…]]`
       block embed in a post body renders this very component, the way a
       node appears QUOTED INSIDE a post on every surface (feed card, post
       viewer, chat bubble).

       It wears MiniPanel's chrome but not its default head: a node panel is
       one header ROW — `round pill │ address chip │ open` — split by
       vertical hairlines, and it is coated in its own teal colorway so it
       reads as another element set into the post rather than more of the
       post. The FOOT is GONE (2026-07-27): the address the foot used to
       state moved up into the header, and the votes ride the embed
       caption line when the body has one.
       See dashboard/doc/ui-reference.md. -->
  <MiniPanel :to="targetRoute" :body-fit="isMedia || showsSource">
    <template #head>
      <!-- The ROUND PILL (2026-07-27) — the address pill's material closed
           into a circle around the kind glyph alone: the same `--grey-3`
           fill, `--grey-5` ring + inner seam and 2px `--teal-12` base the
           foot's chip wore, at the smallest size the device survives. An
           OBJECT laid on the coat where a flat icon used to be — the same
           statement the chip beside it makes. -->
      <span class="node-mini__zone node-mini__zone--icon">
        <span class="node-mini__round-pill">
          <q-icon :name="nodeKind.icon" size="12px" />
        </span>
      </span>

      <!-- The node's ADDRESS where the title stood (2026-07-27): the foot
           pill's content — icon / node / hash — reset in MicroChip's own
           plain skin, the exact chip the feed card's foot wears, so the
           header names the node by what it IS in the element system. The
           human title survives on the zone's tooltip; the hash keeps the
           foot's stated 10-digit cut (`chipHash`), full path on the chip's
           own tooltip. -->
      <span class="node-mini__zone node-mini__zone--title" :title="effectiveTitle">
        <NodeMicro
          :id="node.id"
          :path="node.path"
          :hash-str="chipHash"
          :show-type="true"
        />
      </span>

      <!-- The integrity traffic light (integrity-debt plan): the panel
           wears its node's verdict in the header — green proof-verified,
           red violated (click → Talavero's report). Same grammar as the
           chips'; lawful-unproven draws nothing. -->
      <span
        v-if="integrityState"
        class="node-mini__integrity"
        :class="'integrity-' + integrityState"
        :title="integrityTitle"
        role="button"
        @click.stop.prevent="openIntegrityReport"
      />

      <!-- The MEDIA VIEWER trigger (2026-08-04) — the corner that was a
           decorative glyph is the header's one real button now: it spawns
           the floating dark-grey viewer for this node
           (docs/plans/floating-media-viewer.md). `.stop.prevent` because
           the whole panel is a router-link; navigation stays the panel's
           job, the corner's is the preview. -->
      <button
        type="button"
        class="node-mini__zone node-mini__zone--open"
        title="open media viewer"
        @click.stop.prevent="openViewer"
      >
        <q-icon name="open_in_full" size="13px" />
      </button>
    </template>

    <template #body>
      <!-- Media-backed nodes show the thing itself: an image, a playable
           audio/video element, or a download line — text nodes keep the
           excerpt.

           A LINK node whose URL an EMBED_RULE recognizes shows the thing it
           POINTS AT, on the same principle: the API resolves the rule into
           `node.embed` (a descriptor, never markup) and the frame renders
           here instead of the address.

           Every one of these is sized by the SURFACE, through
           `--media-max-h` — see the media styles below. -->
      <!-- The THUMBS live on the caption line (2026-07-27), where the
           provider and url are written — FLAT: bare glyph + count in the
           caption's own gray, no box and no rim, aligned to the row's
           right end through EmbedFrame's `cap-end` slot. They report, they
           don't route (the panel is the link). The viewer's OWN vote keeps
           its semantic green/red in the INK alone — the one thing here
           reporting a decision rather than a fact. -->
      <div v-if="embed" class="node-mini__embed">
        <EmbedFrame :embed="embed">
          <template #cap-end>
            <span class="vote-flat" :class="{ 'is-up': viewerVote === 'UP' }">
              <q-icon name="thumb_up" size="10px" /> {{ votes.up || 0 }}
            </span>
            <span class="vote-flat" :class="{ 'is-down': viewerVote === 'DOWN' }">
              <q-icon name="thumb_down" size="10px" /> {{ votes.down || 0 }}
            </span>
          </template>
        </EmbedFrame>
      </div>

      <div v-else-if="mediaKind === 'image'" class="node-mini__media">
        <img :src="node.file.url" :alt="`.${node.file.ext} image`" />
      </div>
      <div v-else-if="mediaKind === 'video'" class="node-mini__media" @click.stop.prevent>
        <video :src="node.file.url" controls preload="metadata" />
      </div>
      <div v-else-if="mediaKind === 'audio'" class="node-mini__audio" @click.stop.prevent>
        <audio :src="node.file.url" controls preload="metadata" />
      </div>
      <div v-else-if="mediaKind === 'binary'" class="node-mini__binary">
        <q-icon name="attach_file" size="13px" class="q-mr-xs" />
        <span class="mono">.{{ node.file.ext }} file</span>
      </div>
      <!-- `raw` — the node's text body as its own SOURCE, not as an
           excerpt of it. The default body strips `#*`_~[]` and cuts at 400
           chars, which is right for a node QUOTED into a post (a few lines,
           open it for the rest) and wrong wherever the panel IS the reading
           surface: a stripped markdown file is neither the rendered
           document nor the source, and a `# Heading` that lost its hash
           reads as a stray line. Here the body arrives whole and verbatim
           — every marker intact, hard wraps and blank lines preserved by
           `pre-wrap` — and the panel is the one that scrolls. -->
      <div v-else-if="showsSource" class="node-mini__source mono">{{ sourceText }}</div>
      <div v-else-if="excerpt" class="node-mini__excerpt">{{ excerpt }}</div>
      <!-- Integrity withholding (integrity-debt plan): a violated node's
           body never renders — the API already withheld it; this face says
           so instead of pretending emptiness, and routes to the report. -->
      <div v-else-if="isWithheld" class="node-mini__withheld" @click.stop.prevent="openIntegrityReport">
        <q-icon name="report" size="13px" />
        <span>body withheld — integrity check failed{{ integrityReport ? ' · open Talavero\'s report' : '' }}</span>
      </div>
      <div v-else class="node-mini__empty">(no content)</div>
    </template>

    <!-- NO FOOT (2026-07-27). The three-section foot (`votes │ node chip │
         tallies`) is gone: the chip moved into the header's title zone, the
         votes onto the embed caption line, and the comment/fork tallies
         came off with the band — the panel is a preview, and the place to
         read a node's activity is the node's own viewer. -->
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import NodeMicro from './NodeMicro.vue'
import { kindFor, hashOf, shortHash } from 'src/utils/kinds'
import { bodyOf, excerptOf } from 'src/utils/nodeContent'
import { useMediaViewersStore } from 'src/stores/mediaViewers'

export default defineComponent({
  name: 'NodeMini',
  components: { MiniPanel, EmbedFrame, NodeMicro },
  props: {
    // Enriched node: { id, path, content, file, embed, votes,
    //                  comment_count, fork_count }
    node: { type: Object, required: true },
    to: { type: String, default: null },
    // Read the TEXT body as source instead of as an excerpt (see the body
    // slot). Media bodies ignore it — a picture has no source to show.
    // Height comes from the surface via `--node-source-max-h`.
    raw: { type: Boolean, default: false }
  },
  setup (props) {
    const router = useRouter()
    const targetRoute = computed(() => props.to || `/nodes/${props.node.id}`)

    // The header corner's job: hand THIS enriched node card to the
    // floating viewer family (one per node; re-triggering fronts it).
    const mediaViewers = useMediaViewersStore()
    const openViewer = () => { mediaViewers.spawn(props.node) }

    const nodeKind = kindFor('nodes')

    // "Node #276" is the fallback for a node with nothing better to say.
    // An embeddable link has something better: the provider it resolves to,
    // which is what the panel below it is showing.
    const effectiveTitle = computed(() =>
      props.node.title ||
      props.node.embed?.provider ||
      ('Node #' + props.node.id)
    )

    const excerpt = computed(() => {
      // File-backed nodes: excerptOf reads the resolved body for text kinds
      // and a "kind · .ext" line for media — never the uploads/ address.
      const raw = props.node.file
        ? excerptOf(props.node, 400)
        : (props.node.content || props.node.excerpt || '')
      return raw.replace(/[#*`_~[\]]/g, '').trim()
    })

    // The embed descriptor an EMBED_RULE produced for this node's URL
    // (API-side; null for links no rule matches and for every other kind).
    const embed = computed(() => props.node.embed || null)

    // Non-text file kinds render as themselves in the body slot.
    const mediaKind = computed(() => {
      const k = props.node.file?.kind
      return k && k !== 'text' ? k : null
    })

    // The whole text body, verbatim. `bodyOf` is the one reader that knows
    // a FILE node's `content` is an ADDRESS and the text lives in
    // `file.text` — never read `node.content` here, or a doc renders as its
    // own `uploads/…` path.
    const sourceText = computed(() =>
      mediaKind.value ? '' : (bodyOf(props.node) || '')
    )

    const showsSource = computed(() => props.raw && !!sourceText.value)

    // The header chip's address, cut to a few digits with an explicit
    // ellipsis so the truncation is STATED rather than left to the CSS one —
    // a reader has to be able to tell a short address from a whole one. 10
    // is the house compact length's neighbourhood (8 in the skeleton lists,
    // 14 in the comment-origin label), kept from the foot chip this one
    // replaced. `hashOf` for the comparison, so a node whose hash is already
    // shorter than the cut gets no misleading ellipsis.
    const chipHash = computed(() => {
      const full = hashOf(props.node.path)
      if (!full) return ''
      const cut = shortHash(full, 10)
      return cut.length < full.length ? cut + '…' : cut
    })

    // The three bodies whose SIZE IS THEIR MEANING. They opt the panel out
    // of MiniPanel's 110px excerpt cap, which would otherwise crop a
    // picture or a player to its top third (audio is 32px and binary is one
    // line — both fit the cap, so neither needs the exemption).
    const isMedia = computed(() =>
      !!embed.value || mediaKind.value === 'image' || mediaKind.value === 'video'
    )

    const votes = computed(() => props.node.votes || {})
    // node_vote stores 'UP'/'DOWN'; tolerate the ±1 form some callers shape.
    const viewerVote = computed(() => {
      const v = votes.value.viewer_vote
      if (v === 1 || v === 'UP') return 'UP'
      if (v === -1 || v === 'DOWN') return 'DOWN'
      return null
    })

    // The integrity verdict rides the enriched node (integrity-debt plan):
    // green proof-verified / red violated (click → Talavero's report in
    // the flyout); lawful-unproven states draw nothing.
    const integrityState = computed(() => {
      const s = props.node.integrity?.status
      return s === 'ok' || s === 'violated' ? s : null
    })
    const integrityReport = computed(() => props.node.integrity?.report || null)
    const isWithheld = computed(() => props.node.content_withheld === true)
    const integrityTitle = computed(() => {
      if (integrityState.value === 'ok') return 'proof verified'
      if (integrityState.value !== 'violated') return null
      const check = props.node.integrity?.check || 'integrity'
      return integrityReport.value
        ? `integrity violated: ${check} — click for Talavero's report`
        : `integrity violated: ${check} — report unavailable`
    })
    const openIntegrityReport = () => {
      if (integrityReport.value) {
        router.push({ path: '/feed', query: { flyout: integrityReport.value } })
      }
    }

    return {
      targetRoute,
      openViewer,
      integrityState,
      integrityTitle,
      integrityReport,
      isWithheld,
      openIntegrityReport,
      nodeKind,
      effectiveTitle,
      excerpt,
      sourceText,
      showsSource,
      chipHash,
      embed,
      mediaKind,
      isMedia,
      votes,
      viewerVote
    }
  }
})
</script>

<style lang="scss" scoped>
// ── The node colorway ────────────────────────────────────────────────────
// MiniPanel reads its surfaces from four custom properties it declares on
// `.mini-panel` itself, so an ancestor cannot inherit them out of the way —
// they have to be re-declared ON that element, which is what `:deep()` is
// for here.
//
// Bare `:deep(…)`, with no class of ours in front of it: MiniPanel sets
// `inheritAttrs: false`, so a `class` written on the component is DROPPED
// and never reaches the panel (the symptom is silence — every rule below
// simply does nothing). What does survive is the SCOPE ID, which Vue puts
// on a child component's root regardless, so `[data-v-…] .mini-panel` still
// resolves to this Mini's panel and nobody else's.
//
// The panel is ONE uniform `--teal-1` coat, top to bottom: every
// other Mini splits chrome (`#f4f7fb`) from body (white) to zone the panel,
// and a node preview does not need that split because its header is one row
// and its body is usually one picture. Every LINE is `--teal-3` —
// the outer border, the head/body divider, the header's vertical
// hairlines — so only weight distinguishes them, the way the feed card
// draws everything in `--indigo-3`.
// COAT, LINES and (2026-07-27) the HEADER'S INK are the panel's dials, the
// same seam FriezeBar exposes as `--frieze-bar-base`: a surface outside the
// teal colorway sets them on the element it mounts the Mini in and the panel
// follows. `--node-mini-coat` repaints both faces of the coat (they are ONE
// tone and always move together); `--node-mini-rule` repaints the whole line
// system in one value — the outer border, MiniPanel's head/body dividers,
// the header's zone splits and the source pane's rim — because at rest
// every line here is one colour and only weight distinguishes them, which
// is the property a dial has to preserve.
// `--node-mini-rule-hover` is its partner (see the hover rule).
// `--node-mini-head-ink` takes the header ROW as one thing — the open glyph
// and whatever zone text there is (see `.node-mini__zone`; the round pill
// and the address chip are their own neutral objects and stay out of it).
// (`--node-mini-foot-glyph` died with the foot, 2026-07-27 — there are no
// foot marks left to paint.)
//
// The post information flyout is the only caller, and it dials all four:
// the COAT to `--grey-4`, the LINES to `--grey-3` — both its own material,
// so at rest that panel is drawn entirely in the host box's tones — and
// HOVER to `--teal-12`, the accent mint, which is then the panel's one
// moment of hue and lifts by chroma rather than by weight. Its lines went
// `--teal-3` (this component's default) → `--grey-5` → `--teal-2` →
// `--grey-3` across 2026-07-27; what settled it is that the neutral only
// works LIGHTER than the coat, so the panel is drawn in light rather than
// divided by dark rules. The HEAD ink followed the same day, to `--grey-10`.
//
// What is NOT dialled is the reading matter — `--teal-10` on the source pane
// (the chip and the round pill are neutral `--grey-8` already, being their
// own objects). That is deliberate: a quoted node can be restated in the
// host's material, but a preview that gave up its coat, its lines AND all
// of its ink would have nothing left saying "node" and would simply be a
// card. What says it is the `--teal-1` ring, the body — and the viewer's
// own vote on the caption line, which no dial touches.
:deep(.mini-panel) {
  --panel-chrome: var(--node-mini-coat, var(--teal-1, #e0f2f1));
  --panel-body:   var(--node-mini-coat, var(--teal-1, #e0f2f1));
  // MiniPanel's own line tone: its outer border AND its head/body divider.
  --panel-rule:   var(--node-mini-rule, var(--teal-3, #80cbc4));
  // OUR hairlines — the header's zone splits, which MiniPanel knows nothing
  // about. Same tone, held in a variable for the same reason `--panel-rule`
  // is: at rest every line on this panel is one colour, so hovering has one
  // thing to change rather than four selectors to keep in step. Declared
  // HERE, on the panel, so the header zones inherit it — and so the hover
  // rule below can flip the panel's entire line system by writing two
  // custom properties.
  --node-rule:    var(--node-mini-rule, var(--teal-3, #80cbc4));
  // There is no WEIGHT dial to go with the two tone dials, and the attempt is
  // worth a line (2026-07-27): `--node-mini-rule-w` existed for part of a day
  // so the flyout could thicken this panel's lines to 2px, and came out with
  // that experiment. Every line here is 1px because at Mini scale that is
  // what a hairline is; a host that finds them too faint on its own coat has
  // a TONE problem, which is what `--node-mini-rule` is for. Two notes if it
  // is ever wanted back: MiniPanel hard-codes 1px on its border and its
  // dividers, so a width dial has to be restated over both (the tone needs no
  // such reach — MiniPanel reads it from `--panel-rule`), and the heavy base
  // below has to become `calc(w * 2)` or a thickened system catches up with
  // it and the panel is just an even box.

  // A HEAVIER BASE (1px box, 2px bottom) — the feed card's uneven-border
  // device read at Mini scale: enough of a base to seat the panel on the
  // post's surface without the outline shouting on all four sides.
  border-bottom-width: 2px;
  // The card's own drop shadow goes with the coat: a tinted panel already
  // separates from the post body it sits in, and the shadow only greyed
  // the tint.
  box-shadow: none;
}

// HOVER, in the colorway (2026-07-26). MiniPanel reddens the border with
// `--coral` for the whole Mini family; on a panel whose entire point is that
// it is coated in ONE hue, a red edge was the only thing on it speaking
// another language. `--teal-11` is the family's mint ACCENT — brighter than
// the resting `--teal-3`, so the lines LIGHTEN under the pointer, the same
// direction MiniPanel's shadow and 1px lift already move.
//
// The pointer lights the panel's WHOLE LINE SYSTEM, not just its rim: the
// outer border, MiniPanel's head/body dividers and the header's vertical
// zone splits all go -11 together. At rest
// they are already one tone, and it is weight alone that distinguishes them —
// so lighting them as one keeps that true, where a mint rim around teal-3
// insides would have invented a distinction hover has no reason to make.
//
// Two custom properties do it all, because every line on this panel reads
// its colour from one or the other: `--panel-rule` is MiniPanel's (its border
// + its divider), `--node-rule` is ours (the zone hairlines).
// Custom properties inherit, so writing them on the panel reaches every
// descendant that uses them without a selector per line. `border-color` is
// still restated: MiniPanel's own `.mini-panel--hover:hover` sets the border
// directly, so a fresh `--panel-rule` alone would lose to it.
//
// `.mini-panel.mini-panel--hover` and not the hover class alone: MiniPanel's
// own `.mini-panel--hover:hover` scores the same as a one-class `:deep()`
// descendant, and a tie resolves by source order across two files — not
// something to rely on across a build.
// The hover tone is dialled TOO (`--node-mini-rule-hover`), and it has to be:
// the rule above lights the whole line system from one value, so a surface
// that recoloured only the resting lines would get a MINT flash on a panel
// with no teal on it — the exact fault this block was written to fix, one
// hue further out. The two dials move together or not at all.
:deep(.mini-panel.mini-panel--hover):hover {
  --panel-rule: var(--node-mini-rule-hover, var(--teal-11, #a7ffeb));
  --node-rule:  var(--node-mini-rule-hover, var(--teal-11, #a7ffeb));
  border-color: var(--node-mini-rule-hover, var(--teal-11, #a7ffeb));
}

// The header is a ROW of zones divided by FULL-HEIGHT vertical hairlines,
// which is why the zone padding lives on the zones and not on the header:
// a padded header would inset the rules and they would stop short of both
// edges. `align-items: stretch` is what makes each rule run the whole
// height of the band.
// `flex-direction` and `gap` are RESETS, not decoration: the default head
// is a flex COLUMN of zones with a 4px gap, so inheriting it silently
// stacked the four sections into a 121px tower instead of a 28px row.
:deep(.mini-panel__head--own) {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  padding: 0;
}

// Everything WRITTEN on the panel's own zones is the colorway's own ink.
// The generic slate `--panel-ink-*` reads as a borrowed default on a tinted
// coat; one ink against one tone is what makes the panel a single material
// rather than a teal box with a grey Mini inside it. The round pill and the
// address chip are exempt by construction — they are neutral OBJECTS laid
// on the coat, each stating its own `--grey-8` face — so since 2026-07-27
// the zone ink lands mostly on the open glyph.
//
// The HEADER's share of that ink is the panel's fourth dial
// (`--node-mini-head-ink`, 2026-07-27). The post information flyout is the
// only caller and sets a 900-index neutral, so the header changes hue and
// nothing else.
//
// PER ZONE and not panel-wide on purpose: the source pane below still reads
// `--teal-10` directly, and that is what is left saying NODE on a panel that
// has given up its coat, its lines and its hover tone — one dial over the
// whole ink would leave the flyout's copy a card.
.node-mini__zone {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 5px 8px;
  color: var(--node-mini-head-ink, var(--teal-10, #004d40));

  // The vertical hairlines — one before every zone but the first, so the
  // count follows the zones and no rule can end up hanging at an edge. Drawn
  // in `--node-rule` (= `--teal-3`), which hover repaints in one place.
  & + & { border-left: 1px solid var(--node-rule, #80cbc4); }
}

.node-mini__zone--icon {
  flex: 0 0 auto;
}

// ── The ROUND PILL, top left (2026-07-27) ────────────────────────────────
// The address pill's material at its smallest read: the same `--grey-3`
// fill, the same `--grey-5` hairline RING outside the box and SEAM inside
// its bottom edge (both box-shadows, for the reasons the pill had — the
// one border is spent on the base, and a shadow follows `border-radius`
// where an outline may not), and the same 2px `--teal-12` BASE — here
// closed into a CIRCLE around the kind glyph alone. `border-radius: 50%`
// on a fixed 18px box; the base curves along the bottom arc, which is the
// pill's own device (its 999px ends did exactly that). Grey-8 ink with the
// hairline stroke every glyph on that pill wore. An OBJECT laid on the
// coat, not a zone of it — which is why no ink dial reaches it.
.node-mini__round-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--grey-3, #eeeeee);
  border: 0;
  border-bottom: 2px solid var(--teal-12, #64ffda);
  box-shadow:
    0 0 0 1px var(--grey-5, #bdbdbd),
    inset 0 -1px 0 var(--grey-5, #bdbdbd);
  color: var(--grey-8, #616161);

  .q-icon { -webkit-text-stroke: 0.35px currentColor; }
}

// The one elastic zone: it absorbs all the slack, which is what pushes the
// open glyph to the row's right end. Since 2026-07-27 it holds the ADDRESS
// CHIP — a plain NodeMicro in MicroChip's own stock skin, the exact chip
// the feed card's foot wears — so the type styling the title text carried
// went with the text: the chip states its own face, and the zone only has
// to hold it (`min-width: 0` so the chip's ellipsis can bite instead of
// the zone overflowing). The human title lives on the zone's tooltip.
.node-mini__zone--title {
  flex: 1 1 auto;
  min-width: 0;
}

// A real <button> since 2026-08-04 (the media-viewer trigger) — reset to
// the zone's own face, so the chrome stays the zone's and the cursor is
// the one tell it does something the panel-as-link doesn't. `border: 0`
// kills the UA button box; the zone hairline survives it (the `& + &`
// rule above outranks this one for border-left).
.node-mini__zone--open {
  flex: 0 0 auto;
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
  :deep(.mini-panel--hover):hover & { color: var(--coral-deep, #d35f5f); }
}

.node-mini__excerpt {
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
}

// ── SOURCE (`raw`) — the markdown as written ─────────────────────────────
// A reading pane, so it borrows the feed card's device: the surrounding
// panel is the colorway (teal here, indigo there) and the pane you
// actually READ is a near-white floor SET INTO it. Tinting the text field
// too would make one flat teal block of panel and prose, and markdown
// source is the densest thing this component ever shows.
//
// Two settings do the legibility work. `pre-wrap` keeps the file's own
// shape — hard wraps, blank lines between blocks, indented list children —
// which is most of what makes source scannable and exactly what the
// stripped excerpt destroys. And the type is MONOSPACE at a generous 1.62
// line-height: markdown is aligned writing (`- `, `  - `, table pipes,
// fence markers line up column-wise) and a proportional face throws all of
// that out.
//
// It opts the panel out of the 110px excerpt cap (`body-fit`) and scrolls
// ITSELF instead, capped by `--node-source-max-h` — published by the
// SURFACE, the same contract `--media-max-h` uses just below, because the
// height a document wants is a fact about the window it is being read in
// and not about this component.
.node-mini__source {
  font-size: 0.78em;
  line-height: 1.62;
  color: var(--teal-10, #004d40);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--node-rule, #80cbc4);
  border-radius: var(--radius-sm, 5px);
  padding: 8px 10px;
  max-height: var(--node-source-max-h, 320px);
  overflow-y: auto;
  // The file's own line structure IS the readability.
  white-space: pre-wrap;
  // `break-word` splits a long word only when the LINE can't hold it;
  // `anywhere` would break even a short url mid-token on a narrow panel.
  word-break: break-word;
  overflow-wrap: break-word;
  tab-size: 2;
}

// ── MEDIA — sized by the surface, not by this component ──────────────────
// A picture or a player is not an excerpt: the preview IS the content, so
// the only sensible size is the biggest one that still fits the window the
// post is being read in. That number is not knowable here — the same Mini
// renders in a 60vh-capped feed card and in a full-height post viewer — so
// the SURFACE publishes it as `--media-max-h` and this is where it lands.
//
// Bounding both axes and setting neither is what makes one rule serve both
// orientations: a replaced element keeps its intrinsic ratio and renders at
// the largest size satisfying both caps, so a PORTRAIT image is bound by
// the height budget (and centred in the leftover width) while a LANDSCAPE
// one runs to the panel's full width. Never fix `width: 100%` with a
// `max-height` — that letterboxes: the box takes the width, the picture
// contains itself inside it, and the difference is dead space.
//
// The 180px fallback is for surfaces that publish nothing (chat bubbles,
// skeleton cells) — a thumbnail, deliberately.
.node-mini__media {
  img, video {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: var(--media-max-h, 180px);
    width: auto;
    height: auto;
    border-radius: 5px;
    border: 1px solid rgba(var(--ink-rgb), 0.12);
  }
}

// The frame bounds ITSELF from the same budget (EmbedFrame turns the height
// limit into the width cap its aspect-ratio box actually needs) — nothing
// to cap here, only the gap to the header.
.node-mini__embed {
  margin-top: 2px;
}

.node-mini__audio audio {
  width: 100%;
  height: 32px;
}

.node-mini__binary {
  display: inline-flex;
  align-items: center;
  font-size: 0.82em;
  color: #5b6c82;
}

.node-mini__empty {
  font-size: 0.78em;
  color: #8995a8;
  font-style: italic;
}

// ── The integrity traffic light + withheld face (integrity-debt plan) ────
// Header dot: the chips' grammar at panel scale. Red is the only
// interactive state — it routes to Talavero's report.
.node-mini__integrity {
  flex-shrink: 0;
  align-self: center;
  width: 8px;
  height: 8px;
  margin: 0 4px;
  border-radius: 50%;
  &.integrity-ok       { background: #2e6a3a; }
  &.integrity-violated {
    background: #a03d3d;
    cursor: pointer;
    box-shadow: 0 0 0 2px rgba(160, 61, 61, 0.25);
  }
}

.node-mini__withheld {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78em;
  color: #a03d3d;
  cursor: pointer;
}

// ── The THUMBS, flat on the caption line (2026-07-27) ────────────────────
// They left the foot (which left with them) for the embed caption — the
// line where the provider and url are written — through EmbedFrame's
// `cap-end` slot, which parks them at the row's right end. FLAT: no fill,
// no rim, no box — a bare glyph and its count in caption-scale gray, a
// size down from the pills they were. They report; the caption's link and
// the panel itself do the routing.
//
// Scoped styles reach them because slot content compiles in THIS
// component's scope — the spans carry NodeMini's scope id even though
// EmbedFrame renders them.
.vote-flat {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.95em; // of the caption's 0.74em — a size down from the pills
  color: var(--grey-8, #616161);

  // The viewer's OWN vote keeps its semantic green/red, in the INK alone:
  // this pair is the one thing on the panel reporting a decision rather
  // than a fact, and flat means the ink is all it has left to say it with.
  &.is-up   { color: #3d7a2a; }
  &.is-down { color: #b14848; }
}

</style>
