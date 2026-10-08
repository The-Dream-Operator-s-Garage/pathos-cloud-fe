<template>
  <!-- Compact preview panel for a NODE — and, since a `![[pathos:nodes/…]]`
       block embed in a post body renders this very component, the way a
       node appears QUOTED INSIDE a post on every surface (feed card, post
       viewer, chat bubble).

       ⭐ THE FAMILY'S TEMPLATE (2026-09-30, user ask: "take as layout the node
       mini viewer and help me refactor the whole family"). Its header ROW —
       `chip+copy │ title │ open`, split by full-height hairlines — was
       lifted into `shared/MiniHead.vue`, and its coat, lines and hover into
       `shared/MiniPanel.vue` (the family glass, `--mini-coat`), so every Mini
       now draws this panel's head from ONE source; NodeMini keeps what is
       its own — the body (media / embed / excerpt / source) and the link
       foot. The row's history (the round pill, the dot's zone, the swaps)
       is in specs/codemap.md and in `git log -p` of this file.
       See dashboard/doc/ui-reference.md. -->
  <!-- ⭐ 2026-10-07 (the depth dial): a text node's excerpt keeps its
       references as live slots (MarkdownBody `plain`); while it hosts a
       nested Mini the panel is no router-link (no anchor in an anchor — the
       head's corner stays the door) and the 110px cap comes off. -->
  <MiniPanel kind="nodes" :to="hostsMinis ? null : targetRoute" :body-fit="isMedia || showsSource || hostsMinis">
    <template #head>
      <!-- WHAT IT IS │ WHAT IT IS CALLED │ the door. The pill is the node's
           collapsed nano chip with its verdict light (MicroChip draws it);
           the copy hands over the FULL hash; the name is `nodeLabel`; the
           corner spawns the flyout viewer for THIS enriched node (media
           faces and its skeleton one header switch away). -->
      <MiniHead
        kind="nodes"
        :id="node.id"
        :path="node.path"
        :integrity="node.integrity"
        :name="nodeLabel"
        @open="openViewer"
      />
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
      <!-- `:caption="false"` since 2026-08-23 — the provider/url line the
           frame used to print underneath IS the header now, and drawing it
           twice would state the same address on both sides of the picture.
           The flat vote thumbs that rode that line's right end through
           EmbedFrame's `cap-end` slot went out with it, by the same ask
           ("remove the voting section"): a preview reports what the node IS,
           and the place to read its activity is the node's own viewer. -->
      <div v-if="embed" class="node-mini__embed">
        <EmbedFrame :embed="embed" :caption="false" />
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
      <MarkdownBody
        v-else-if="excerptRaw"
        class="node-mini__excerpt"
        :text="excerptRaw"
        plain
        :max-chars="400"
        ref-display="auto"
      />
      <!-- Integrity withholding (integrity-debt plan): a violated node's
           body never renders — the API already withheld it; this face says
           so instead of pretending emptiness, and routes to the report. -->
      <div v-else-if="isWithheld" class="node-mini__withheld" @click.stop.prevent="openIntegrityReport">
        <q-icon name="report" size="13px" />
        <span>body withheld — integrity check failed{{ integrityReport ? ' · open Talavero\'s report' : '' }}</span>
      </div>
      <div v-else class="node-mini__empty">(no content)</div>
    </template>

    <!-- ── THE FOOT: THE LINK LINE (2026-08-23, second pass) ─────────────
         The band came back on the first pass to hold the address chip ("remove
         the voting section and center the micro chip while extending it all
         the container's width"); the second pass swapped its occupant for the
         LINK LINE and sent the chip up to the header. The BAND's rules are the
         ones that ask established and they did not change with the tenant:
         full width, contents centred, 1px of vertical air.

         `v-if="linkLine"` on the SLOT, not inside it: MiniPanel renders its
         `<footer>` on `$slots.foot` being present, so a slot passed and left
         empty would draw an empty band with a divider above it. A conditional
         slot is absent, and the panel goes back to head + body for every node
         with no address to state — a note, a picture, a doc. -->
    <template v-if="linkLine" #foot>
      <span class="node-mini__foot-link" :title="linkTitle">
        <q-icon :name="linkLine.icon" size="10px" />
        <span class="node-mini__link-provider">{{ linkLine.provider }}</span>
        <a
          :href="linkLine.href"
          target="_blank"
          rel="noopener"
          class="node-mini__link-url mono"
          @click.stop
        >{{ linkLine.url }}</a>
      </span>
    </template>

  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { bodyOf, excerptOf } from 'src/utils/nodeContent'
import { safeCut } from 'src/utils/pathosRefs'
import { useRenderBudget, budgetExhausted } from 'src/composables/useRenderDepth'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

export default defineComponent({
  name: 'NodeMini',
  components: { MiniPanel, MiniHead, EmbedFrame, MarkdownBody },
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
    const flyoutViewers = useFlyoutViewersStore()
    const openViewer = () => { flyoutViewers.spawnNode(props.node) }

    // (THE HASH COPY — the full hash, the check glyph for 1600ms, the
    // swallowed denial — is MiniHead's since 2026-09-30, for every kind.)

    // "Node #276" is the fallback for a node with nothing better to say.
    // An embeddable link has something better: the provider it resolves to,
    // which is what the panel below it is showing.
    const effectiveTitle = computed(() =>
      props.node.title ||
      props.node.embed?.provider ||
      ('Node #' + props.node.id)
    )

    // THE NAME the header's left section states (2026-08-23, second pass).
    // Title when the node has one, and otherwise the node stated by what it
    // IS: `node #1758 · URL` — its id and `node.type.name`, which the
    // `GET /nodes/by-path/:hash` payload a block embed lands on carries
    // (checked against the live API; a node with no `type` degrades to
    // `node #1758` rather than printing an empty separator).
    //
    // NOT `effectiveTitle`, and the difference is the whole point: that one
    // answers "what should this panel be CALLED", so it falls back to the
    // embed's PROVIDER before the id — node #1758 is a titleless YouTube link
    // and `effectiveTitle` calls it "YouTube". The ask names it `node #1758 ·
    // URL`, because the provider is what the FOOT says and a panel should not
    // print the same fact twice.
    const nodeLabel = computed(() => {
      const t = String(props.node.title || '').trim()
      if (t) return t
      const type = props.node.type?.name
      return `node #${props.node.id}${type ? ` · ${type}` : ''}`
    })

    // The RAW body the plain tier reads (2026-10-07; the stripping moved
    // into MarkdownBody's `plain` mode, which keeps every reference as a
    // live slot where `plainExcerpt` flattened it to its label). File-backed
    // text nodes hand their resolved body, cut without splitting a ref; a
    // media file's "kind · .ext" line is excerptOf's as before (the media
    // branches above render first, so this is the binary/unknown fallback).
    const excerptRaw = computed(() => {
      if (props.node.file) {
        return props.node.file.kind === 'text'
          ? safeCut(bodyOf(props.node), 1200)
          : excerptOf(props.node, 400)
      }
      return props.node.content || props.node.excerpt || ''
    })

    // Does the excerpt bloom a nested Mini (an author's `![[…]]` with depth
    // budget left below this panel)? Governs the link and the body cap.
    const budget = useRenderBudget()
    const hostsMinis = computed(() =>
      budget != null && !budgetExhausted(budget) && /!\[\[pathos:/.test(excerptRaw.value))

    // The embed descriptor an EMBED_RULE produced for this node's URL
    // (API-side; null for links no rule matches and for every other kind).
    const embed = computed(() => props.node.embed || null)

    // THE HEADER'S LINK LINE (2026-08-23) — the fields EmbedFrame's
    // figcaption used to print under the frame, resolved here because the
    // header is where they land now and the frame's caption is off.
    //
    // Three cases, so the band is never blank. (1) An EMBEDDABLE link:
    // the rule's own icon and provider, which is what the panel below is
    // showing. (2) A PLAIN link no rule matched: `link` and the host, so an
    // address still announces itself as one. (3) Everything else — a note,
    // a file, a doc — has no address to state, and the node's title stands
    // in. The url is trimmed exactly the way the caption trimmed it (scheme
    // and `www.` say nothing at this size); `href` keeps the whole thing.
    const linkLine = computed(() => {
      const e = embed.value
      if (e) {
        const raw = e.url || e.src || ''
        return {
          icon: e.icon || 'play_circle',
          provider: e.provider || 'Embed',
          href: raw,
          url: raw.replace(/^https?:\/\/(www\.)?/, '')
        }
      }
      // `node.content` is an ADDRESS on file-backed nodes, never a url the
      // reader typed — so only content-carrying nodes are asked.
      const raw = props.node.file ? '' : String(props.node.content || '').trim()
      if (!/^https?:\/\/\S+$/i.test(raw)) return null
      let host = ''
      try { host = new URL(raw).hostname.replace(/^www\./, '') } catch (err) { host = '' }
      return {
        icon: 'link',
        provider: host || 'link',
        href: raw,
        url: raw.replace(/^https?:\/\/(www\.)?/, '')
      }
    })

    // The zone's tooltip carries what the ellipsis eats — the whole address
    // when there is one, the human title otherwise.
    const linkTitle = computed(() =>
      linkLine.value ? `${linkLine.value.provider} · ${linkLine.value.href}` : effectiveTitle.value
    )

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

    // (The header chip's own 10-digit cut, `chipHash`, stood here 2026-08-23
    // → 2026-09-21 PM3: the STATED ellipsis was its point — a reader must
    // tell a short address from a whole one — and that rule is MicroChip's
    // `collapsed` state now, at six digits, off the full path.)

    // The three bodies whose SIZE IS THEIR MEANING. They opt the panel out
    // of MiniPanel's 110px excerpt cap, which would otherwise crop a
    // picture or a player to its top third (audio is 32px and binary is one
    // line — both fit the cap, so neither needs the exemption).
    const isMedia = computed(() =>
      !!embed.value || mediaKind.value === 'image' || mediaKind.value === 'video'
    )

    // (`votes` / `viewerVote` came out 2026-08-23 with the flat thumbs that
    // were their only reader — the ask removed the voting section outright.
    // `node.votes` still arrives on the enriched node for whoever wants it.)

    // The integrity verdict rides the enriched node (integrity-debt plan):
    // green proof-verified / red violated (click → Talavero's report in
    // the flyout); lawful-unproven states draw nothing.
    // The verdict's state and tooltip are MicroChip's since 2026-09-21
    // (`node.integrity` goes to the pill whole); the panel keeps only what
    // its WITHHELD face needs — the report ref and the knock.
    const integrityReport = computed(() => props.node.integrity?.report || null)
    const isWithheld = computed(() => props.node.content_withheld === true)
    const openIntegrityReport = () => {
      if (integrityReport.value) {
        router.push({ path: '/feed', query: { flyout: integrityReport.value } })
      }
    }

    return {
      targetRoute,
      openViewer,
      integrityReport,
      isWithheld,
      openIntegrityReport,
      effectiveTitle,
      excerptRaw,
      hostsMinis,
      sourceText,
      showsSource,
      embed,
      mediaKind,
      isMedia,
      linkLine,
      linkTitle,
      nodeLabel
    }
  }
})
</script>

<style lang="scss" scoped>
// ── WHERE THE HEAD AND THE COLORWAY WENT (2026-09-30) ───────────────────
// This block held the node colorway — the four `--node-mini-*` dials (coat,
// rule, rule-hover, head-ink; no caller since the 2026-08-17 flyout fusion),
// the `:deep(.mini-panel)` box notes (grey-3 coat, radius-md, four even
// sides, shadow — the 09-21 "skeleton mini's box" pass), the hover that
// repainted the whole line system, the own-head row reset, and the zones:
// `.node-mini__zone` + its hairlines, the chip zone on the
// `--mini-chip-zone-*` dials, the centred Nasalization name, the copy glyph,
// the coral corner. User ask that day: "take as layout the node mini viewer
// and help me refactor the whole family … under the same basis". So they
// became THE BASIS, verbatim, and moved:
//   · the box, the glass coat, the lines + hover, the row reset and the body
//     metrics → `shared/MiniPanel.vue` (`kind="nodes"`: `--mini-ink` is the
//     node pill's teal-10, the ink the zones always wore here);
//   · the zones, the copy and the corner → `shared/MiniHead.vue`, which
//     still stamps `node-mini__zone--chip` / `--name` / `--open`,
//     `node-mini__copy`, `node-mini__name-text` on them (the witnesses'
//     hooks). The long history of each rule is in `git log -p` of this file
//     and in specs/codemap.md.
// What stays below is NodeMini's own: the LINK FOOT band and the bodies.

// ── THE FOOT IS THE LINK LINE'S BAND (2026-08-23) ───────────────────────
// "center the micro chip while extending it all the container's width." The
// band was `4px 10px` with an 8px gap for the three sections it used to hold;
// with one occupant and no siblings the gap has nothing to space and the
// padding only shortens the thing it is asked to extend. 1px of vertical air
// keeps the occupant off the divider above it. (A node never nests a panel,
// so this bare `:deep()` has no one else's foot to reach.)
:deep(.mini-panel__foot) {
  padding: 1px 0;
  gap: 0;
}

// ── THE FOOT'S LINK LINE (2026-08-23, second pass) ───────────────────────
// The three runs EmbedFrame's figcaption used to print under the frame, in
// the band the address chip vacated. The band's own rules (full width,
// centred) come from the first pass and did not move with the tenant, so the
// wrapper only has to be a row that can be cut: the ADDRESS is the elastic
// run and the first thing the ellipsis eats, while the provider — shorter and
// more identifying — holds. Whole string on the tooltip (`linkTitle`).
:deep(.mini-panel__foot) .node-mini__foot-link,
.node-mini__foot-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  color: var(--mini-ink, var(--teal-10, #004d40));
}

.node-mini__link-provider {
  flex: 0 0 auto;
  font-size: 0.74em;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The address: the elastic run, and the first thing cut.
.node-mini__link-url {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.72em;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.78;

  &:hover { text-decoration: underline; }
}

.node-mini__excerpt {
  // The plain tier (2026-10-07) inherits the excerpt's ink; a nested Mini
  // stands on its own line at the body's size (the embed slot's boundary).
  :deep(.markdown-body) { color: inherit; }
  :deep(.pathos-ref-embed) { margin: 6px 0; text-align: start; }
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
  // The ask centres the showcased item and JUSTIFIES it when it is text —
  // opting back out of the body's `text-align: center`, which would have
  // ragged both edges of a paragraph. Prose is the one body that keeps a side
  // inset (4px): the body's own went to zero for the media, and a run of text
  // set flush against a border is the case that inset exists for.
  text-align: justify;
  padding: 0 4px;
}

// ── SOURCE (`raw`) — the markdown as written ─────────────────────────────
// A reading pane, so it borrows the feed card's device: the surrounding
// panel is the glass (the family coat since 2026-09-30) and the pane you
// actually READ is a near-white floor SET INTO it — opaque, so however deep
// the panel is nested, the document reads on the same white. Its rim is the
// panel's own line tone (`--panel-rule`, which the hover repaints with the
// rest), its type the node pill's ink.
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
  color: var(--mini-ink, var(--teal-10, #004d40));
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--panel-rule, rgba(33, 33, 33, 0.22));
  border-radius: var(--radius-sm, 5px);
  // 8px 10px → 3px 5px (2026-08-23 density ask). The pane keeps a pad of its
  // own where the body gave its up: this is a document set into the panel,
  // and its rim has to stand off the type or the first character sits on the
  // line.
  padding: 3px 5px;
  max-height: var(--node-source-max-h, 320px);
  overflow-y: auto;
  // Justified with the 2026-08-23 ask, like the excerpt — and it costs
  // nothing here that `pre-wrap` has not already paid: justification only
  // touches lines the browser wrapped ITSELF, and a hard-wrapped source line
  // ends at its own newline, which is never a justified edge.
  text-align: justify;
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
// limit into the width cap its aspect-ratio box actually needs) — nothing to
// cap here. The 2px gap to the header came off with the 2026-08-23 density
// ask; the body's own 2px is the whole separation now.
//
// ── AND IT IS CENTRED (2026-08-23 user ask: "center the video/item
// horizontally — the videos are leaning on the left") ────────────────────
// The lean was real and measured: a 469px box in a 534px figure with 0px to
// its left and 65px to its right. It is the cost of how the frame bounds
// itself — `max-width: min(100%, calc(--media-max-h * --embed-ratio))` on
// `.embed-frame__box`, so whenever the HEIGHT budget binds (a 16:9 player in
// a short card, which is the common case) the box comes out narrower than the
// figure and, being a block with `margin: 0`, sits flush left. The body's
// `text-align: center` cannot reach it — that centres inline content, and
// this is a block.
//
// `auto` side margins are the fix, and they belong HERE rather than in
// EmbedFrame: the same lean exists wherever a bounded frame is quoted, but
// EmbedFrame is also mounted by surfaces that WANT it left-aligned with their
// prose (`NodeContentViewer`'s full mode prints the address under it and the
// two edges line up). Scoped to the Mini, the ask is answered without moving
// a shared component under three other callers.
.node-mini__embed {
  margin-top: 0;

  :deep(.embed-frame__box) {
    margin-left: auto;
    margin-right: auto;
  }
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

// ── The withheld face (integrity-debt plan) ──────────────────────────────
// (`.node-mini__integrity`, the panel's own 8px header dot, stood here
// 2026-08-08 → 2026-09-21. The light is MicroChip's 7px `.micro-chip__integrity`
// inside the address pill now — same palette, same red-only click — and the
// panel draws no dot of its own.)

.node-mini__withheld {
  display: flex;
  align-items: center;
  justify-content: center;   // centred with everything else (2026-08-23)
  gap: 6px;
  font-size: 0.78em;
  color: #a03d3d;
  cursor: pointer;
}

// ── THE FLAT VOTE THUMBS ARE GONE (2026-08-23) ──────────────────────────
// User ask: "remove the voting section". `.vote-flat` was a bare glyph + count
// in caption gray, parked at the right end of EmbedFrame's caption line
// through its `cap-end` slot, with the viewer's OWN vote keeping a semantic
// green/red in the ink alone. It went out with the caption itself — that line
// is the panel's HEADER now — and the votes were not moved up with it: a
// preview states what the node IS, and a node's activity is read in the node's
// own viewer. `node.votes` still arrives on the enriched node, so a surface
// that wants them back has the data; the ONE-line record of how they were
// drawn is this paragraph.

</style>
