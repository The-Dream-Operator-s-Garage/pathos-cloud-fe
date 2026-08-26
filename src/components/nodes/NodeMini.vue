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
      <!-- ── THE ADDRESS CHIP + ITS COPY BUTTON, the row's left end ──────
           (2026-08-23, third pass: "swap the title section with the nano chip
           section", plus "add a copy icon that lets me copy the node's hash".)
           The chip led the header until 2026-07-27, spent a day in the foot,
           came back to the right of the title, and now leads again — which is
           the reading the panel settled on: WHAT IT IS first, what it is
           CALLED second.

           The COPY button hands over the FULL hash, not the chip's `chipHash`
           cut: the truncated form is for reading and the whole one is what a
           `[[pathos:nodes/…]]` ref or an API call needs, and a copy button
           that yields a value you cannot paste anywhere is a trap. House
           idiom for the feedback (FeedStream, ElementFlyout, PinsDrawer): flip
           the glyph to a check for 1600ms and swallow a denied clipboard —
           the mark simply never flips. `.stop.prevent` because the panel is a
           router-link. -->
      <span class="node-mini__zone node-mini__zone--chip">
        <NodeMicro
          :id="node.id"
          :path="node.path"
          :hash-str="chipHash"
          :show-type="true"
        />
        <button
          type="button"
          class="node-mini__copy"
          :class="{ 'is-copied': copied }"
          :title="copied ? 'hash copied' : 'copy the full node hash'"
          @click.stop.prevent="copyHash"
        >
          <q-icon :name="copied ? 'check' : 'content_copy'" size="10px" />
        </button>
      </span>

      <!-- ── THE TITLE ────────────────────────────────────────────────────
           `nodeLabel` — the node's title, or else `node #1758 · URL` (its id
           and `node.type.name`). Deliberately NOT `effectiveTitle`, which
           falls back to the EMBED'S PROVIDER first and would call that node
           "YouTube"; the provider is what the FOOT says.

           BARE TEXT since the third pass ("on the title section, remove the
           icon and the '::'"). It carried a 10px kind glyph and a dimmed `::`
           for a few hours: the glyph restated what the chip beside it already
           says in words, and the separator only existed to hold the glyph off
           the text. With the glyph gone the separator had nothing to separate,
           so both left together. -->
      <span class="node-mini__zone node-mini__zone--name" :title="nodeLabel">
        <span class="node-mini__name-text">{{ nodeLabel }}</span>
      </span>

      <!-- The integrity traffic light (integrity-debt plan): the panel
           wears its node's verdict in the header — green proof-verified,
           red violated (click → Talavero's report). Same grammar as the
           chips'; lawful-unproven draws nothing.

           IN A ZONE OF ITS OWN since the third pass, which is what puts
           hairlines on both sides of it (see `.node-mini__zone`'s `& + &`
           rule: it only fires between ADJACENT zones, so a bare dot in the
           row broke the chain and the flyout beyond it went unruled). The
           `v-if` degrades correctly — with no verdict to show, the flyout's
           previous sibling is the title zone and it keeps its hairline. -->
      <span v-if="integrityState" class="node-mini__zone node-mini__zone--dot">
        <span
          class="node-mini__integrity"
          :class="'integrity-' + integrityState"
          :title="integrityTitle"
          role="button"
          @click.stop.prevent="openIntegrityReport"
        />
      </span>

      <!-- The FLYOUT VIEWER trigger (2026-08-04 as the media viewer's;
           the general element flyout since the 2026-08-17 fusion) — the
           corner that was a decorative glyph is the header's one real
           button now: it spawns the floating viewer for this node, media
           faces and the node's skeleton one header switch away.
           `.stop.prevent` because the whole panel is a router-link;
           navigation stays the panel's job, the corner's is the
           preview. Glyph down to 10px with the 2026-08-23 density pass.

           THE ROUND PILL that stood at the row's other end is GONE with
           that pass (user ask: "remove the button from the left section on
           the header — remove the section"). It was the kind glyph closed
           into a `--grey-3` circle over a 2px `--teal-12` base, and its
           MATERIAL survives it: the pin tack took it the day before
           (2026-08-22, `--red-13` base), which is now the only place that
           object exists — see NavigationBar's `.tack-btn` and the
           `tack-skin` witness. -->
      <button
        type="button"
        class="node-mini__zone node-mini__zone--open"
        title="open in the flyout viewer"
        @click.stop.prevent="openViewer"
      >
        <q-icon name="open_in_full" size="10px" />
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
import { defineComponent, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import NodeMicro from './NodeMicro.vue'
// `kindFor` left with the title section's glyph (2026-08-23, third pass) —
// nothing on this panel draws the node KIND as a picture any more: the chip
// says it in words and the title says what this one is called.
import { hashOf, shortHash } from 'src/utils/kinds'
import { bodyOf, excerptOf } from 'src/utils/nodeContent'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

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
    const flyoutViewers = useFlyoutViewersStore()
    const openViewer = () => { flyoutViewers.spawnNode(props.node) }

    // THE HASH COPY (2026-08-23, third pass). The FULL hash, not `chipHash`'s
    // 10-digit cut: the short form is for reading, and what a `[[pathos:]]`
    // ref or an API call needs is the whole one — a copy button handing over
    // a value that pastes into nothing is worse than no button.
    // The house feedback idiom (FeedStream's `copyAddress`, ElementFlyout's
    // `copyPath`, PinsDrawer's): flip a flag for 1600ms so the glyph becomes a
    // check, and swallow a denied clipboard — the mark simply never flips,
    // which is the correct silent failure for a convenience button.
    const copied = ref(false)
    const copyHash = async () => {
      const full = hashOf(props.node.path)
      if (!full) return
      try {
        await navigator.clipboard.writeText(full)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (e) { /* clipboard denied — the glyph simply never flips */ }
    }

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

    // (`votes` / `viewerVote` came out 2026-08-23 with the flat thumbs that
    // were their only reader — the ask removed the voting section outright.
    // `node.votes` still arrives on the enriched node for whoever wants it.)

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
      effectiveTitle,
      excerpt,
      sourceText,
      showsSource,
      chipHash,
      embed,
      mediaKind,
      isMedia,
      linkLine,
      linkTitle,
      nodeLabel,
      copied,
      copyHash
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
  // THE COAT IS THE POST CARD'S (2026-08-23, second ask on the same surface:
  // "the background color of the mini node card should be the same as the
  // post card's background color, the light-cream with a grey veil"). It was a
  // uniform `--teal-1`, head to foot, since the colorway was written.
  //
  // `transparent` was the FIRST answer, earlier the same day, and it was
  // wrong for a reason worth keeping: this panel does not sit on the card, it
  // sits in the card's PIT — `.post-square__pit`, a `--grey-1` well with its
  // own `--grey-5` border — so taking no coat showed the WELL's near-white,
  // not the card's cream. "The same as the post card" had to be painted.
  //
  // `--card-coat` is that sandwich as one background value (`_tokens.scss`,
  // beside `--plaque-coat`): `--card-veil` — the wash `.post-square::before`
  // itself now reads — over `--light-cream`. Two consumers, one declaration
  // each, so a repaint of the card carries the panel with it and there is no
  // pasted `rgba(...)` here to go stale. It is a LAYER LIST, not a colour;
  // MiniPanel only ever puts these two properties in `background`, which is
  // the one place a layer list is legal.
  --panel-chrome: var(--node-mini-coat, var(--card-coat));
  --panel-body:   var(--node-mini-coat, var(--card-coat));
  // MiniPanel's own line tone: its outer border AND its head/body divider.
  // GREY-5 SINCE 2026-08-23 (user ask: "make the mini node viewer's borders
  // grey-5 instead of teal"). It was `--teal-3` from the colorway's first day
  // — the panel drew every line in one hue so it read as another ELEMENT set
  // into the post. What replaces that argument is the pit's own border, which
  // is `--grey-5` exactly (`.post-square__pit`): the quoted panel and the well
  // it sits in are now drawn in one line tone, which is the same "one
  // material" idea one box further out.
  --panel-rule:   var(--node-mini-rule, var(--grey-5, #bdbdbd));
  // OUR hairlines — the header's zone splits, which MiniPanel knows nothing
  // about. Same tone, held in a variable for the same reason `--panel-rule`
  // is: at rest every line on this panel is one colour, so hovering has one
  // thing to change rather than four selectors to keep in step. Declared
  // HERE, on the panel, so the header zones inherit it — and so the hover
  // rule below can flip the panel's entire line system by writing two
  // custom properties.
  --node-rule:    var(--node-mini-rule, var(--grey-5, #bdbdbd));
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

  // ONE WEIGHT ON ALL FOUR SIDES (2026-08-23 user ask: "make all its borders
  // the same thinness — the bottom border is thicker right now"). It carried
  // the feed card's uneven-border device at Mini scale — a 1px box on a 2px
  // base, seating the panel on the post's surface — which was a statement a
  // COATED panel could afford. With the coat gone the base was the last thing
  // still drawing weight, and it read as a shadow under a frame rather than as
  // a frame. MiniPanel's own 1px stands unmodified now; the note further up
  // about a width dial having to double this base is dead with it.
  //
  // SQUARE, by the same ask: `--radius-md` rounded a panel that now shares its
  // fill with the card behind it, and a rounded hole cut in a square column of
  // prose shows its corners as four gaps.
  border-radius: 0;

  // ── FULL BLEED TO THE HOST CONTAINER'S BORDER (2026-08-23 user ask:
  // "remove the padding between the mini node viewer's right border and the
  // post card's content container's right border, and also the left") ──────
  // The gap was never this panel's: it is `.post-square__pit`'s own 10px side
  // padding, and the panel was simply standing inside it. The pit PUBLISHES
  // that inset as `--quoted-bleed-x` (declared once there and used for its own
  // `padding`), and the panel pulls itself back out by exactly that much — the
  // `--media-max-h` seam again, the surface stating a fact about itself and
  // the quoted thing consuming it.
  //
  // Negative margins and not a width: a block box with `width: auto` and
  // negative side margins grows into the parent's PADDING area, which is
  // inside the padding box, so nothing overflows and the pit's
  // `overflow-x: hidden` has nothing to clip. A `width: calc(100% + 20px)`
  // would have needed the offset written twice and would fight the flex
  // column above it.
  //
  // The `0px` fallback is what keeps every other host unchanged — a chat
  // bubble, a skeleton cell, the post viewer's scroller publish nothing and
  // the panel sits where it always did. ⚠ `0px`, not `0`: it lands inside a
  // `calc()`, where a unitless zero is invalid and would drop the declaration.
  margin-left: calc(-1 * var(--quoted-bleed-x, 0px));
  margin-right: calc(-1 * var(--quoted-bleed-x, 0px));

  // ── NO SIDE BORDERS (2026-08-23 user ask: "remove the borders from the
  // right and left of the mini node viewer") ───────────────────────────────
  // The finish of the bleed above. Once the panel reaches the pit's padding
  // edge, its own side lines land ONE PIXEL inside `.post-square__pit`'s
  // border — two hairlines of the same `--grey-5`, a pixel apart, running the
  // panel's whole height. That reads as a doubled edge, not as two boxes: the
  // pit's line is already stating where the content column ends, and a second
  // one beside it says nothing new. Dropping them leaves the panel bounded
  // top and bottom, which is all a full-width band needs — the horizontal
  // rules are what separate it from the prose above and below, and the
  // container supplies the vertical ones.
  //
  // Written as WIDTH, not `border-style: none`: MiniPanel's hover rule and
  // this component's both set `border-color` on the panel, and a coloured
  // zero-width border stays invisible where a re-declared style might not.
  // The head/body/foot dividers are untouched — they are `& > * + *`
  // `border-top`s inside the panel, not part of its box.
  border-left-width: 0;
  border-right-width: 0;
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
// ⚠ THE HOVER TONE MOVED WITH THE RESTING ONE (2026-08-23). The ask was only
// "borders grey-5 instead of teal", but the two dials are one system and the
// paragraph below says why: lighting a GREY panel's whole line system to
// `--teal-11` would have put a mint flash on a surface with no teal on it —
// precisely the fault this block was written to fix, one hue further out. So
// hover is `--grey-7` now, and note it DARKENS where the teal LIGHTENED: on a
// mint-on-teal panel the pointer answered by chroma, and on a neutral one over
// a pale coat there is no chroma to answer with, so weight is the only channel
// left. (If the teal ever comes back, this line goes back to -11 with it.)
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
  --panel-rule: var(--node-mini-rule-hover, var(--grey-7, #757575));
  --node-rule:  var(--node-mini-rule-hover, var(--grey-7, #757575));
  border-color: var(--node-mini-rule-hover, var(--grey-7, #757575));
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

// ── THE BODY RUNS EDGE TO EDGE (2026-08-23 user ask: "remove the padding
// between the content container's side borders and the side borders of the
// mini node viewer") ─────────────────────────────────────────────────────
// MiniPanel pads its body `7px 10px`. The 10px was written for an EXCERPT —
// prose wants a margin off its rule — but this panel's body is a picture, a
// player or an embedded page far more often than it is prose, and for those
// the inset is a frame around a frame: the media already carries its own rim,
// so the reader sees two edges with a stripe of coat between them. With the
// coat now the card's own (see the dial above) that stripe had nothing left
// to be. Sides go to ZERO and the content meets the border; the vertical pad
// drops to 2px with the density ask rather than to nothing, because the
// head/body divider is a real line and a body flush against it reads as one
// thick rule.
//
// The item inside is CENTRED (same ask: "center horizontally the item
// showcased in the node"). `text-align` is the whole mechanism and that is
// deliberate — it reaches the inline and inline-flex bodies (the binary line,
// the empty note) without laying a flex context over the block ones, which
// would have fought `--media-max-h`'s intrinsic sizing. The block media
// centre themselves on `margin: 0 auto` as they always did, and the two TEXT
// bodies opt back out to `justify` below, which the ask names explicitly.
:deep(.mini-panel__body) {
  padding: 2px 0;
  min-height: 0;
  text-align: center;
}

// ── THE FOOT IS THE CHIP (2026-08-23) ────────────────────────────────────
// "center the micro chip while extending it all the container's width." The
// band was `4px 10px` with an 8px gap for the three sections it used to hold;
// with one occupant and no siblings the gap has nothing to space and the
// padding only shortens the thing it is asked to extend. 1px of vertical air
// keeps the chip's own rim off the divider above it.
:deep(.mini-panel__foot) {
  padding: 1px 0;
  gap: 0;
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
  // 5px 8px → 1px 4px with the 2026-08-23 density ask ("reduce the paddings
  // dramatically to make the node viewer very dense"). The zone hairlines
  // still run the full band height, so the row reads as divided at any
  // padding; what the padding buys is only air, and the ask is for none.
  padding: 1px 4px;
  color: var(--node-mini-head-ink, var(--teal-10, #004d40));
  // ONE LINE, ALWAYS (same ask: "make sure the text is cut off instead of
  // creating extra lines if the space for it gets too reduced"). A header
  // that grows a second line changes the panel's height from its content,
  // which is the one thing a dense band must not do.
  white-space: nowrap;
  overflow: hidden;

  // The vertical hairlines — one before every zone but the first, so the
  // count follows the zones and no rule can end up hanging at an edge. Drawn
  // in `--node-rule` (= `--teal-3`), which hover repaints in one place.
  & + & { border-left: 1px solid var(--node-rule, #80cbc4); }
}

// ── THE ICON ZONE AND ITS ROUND PILL ARE GONE (2026-08-23) ──────────────
// User ask: "remove the button from the left section on the header (remove
// the section)". `.node-mini__zone--icon` held `.node-mini__round-pill` — the
// kind glyph closed into an 18px `--grey-3` circle with a `--grey-5` ring
// outside and seam inside, over a 2px `--teal-12` base — an OBJECT laid on
// the coat rather than a zone of it, which is what made it worth a rule of
// its own.
//
// THE MATERIAL OUTLIVED THE ELEMENT BY ONE DAY. On 2026-08-22 the pin tack
// took it whole (user ask), swapping only the base to `--red-13`; the tack is
// where that object lives now, in `NavigationBar.vue` and `PinsDrawer.vue`,
// held together by the `tack-skin` witness in `fsck --static`. Anyone wanting
// the pill back should copy it from there rather than rebuild it — and should
// know the witness reads those two rules as the definition.

// ── THE TITLE ZONE (2026-08-23; second in the row since the third pass) ──
// The one elastic zone: it absorbs all the slack, which is what pushes the
// dot and the open glyph to the row's right end while the chip keeps its
// natural width at the left. It has held, in order, the ADDRESS CHIP (from
// 2026-07-27), the LINK LINE (for a few hours), `[glyph] :: [nodeLabel]`, and
// now `nodeLabel` bare — the glyph restated in a picture what the chip beside
// it says in words, and the `::` existed only to hold the glyph off the text,
// so removing one removed the other's job.
// `min-width: 0` is what lets the label take the ellipsis instead of forcing
// the row wider; the whole string is on the zone's tooltip.
.node-mini__zone--name {
  flex: 1 1 auto;
  min-width: 0;
  // CENTRED in the slack it absorbs (2026-08-23 user ask). It is the elastic
  // zone, so it owns every spare pixel in the row — the title sat at its left
  // edge, hard against the chip's hairline, with all of that space trailing
  // it. Centring is what makes the band read as `[what it is] · [what it is
  // called] · [verdict] · [open]` rather than as three things crowded left
  // and one parked right.
  justify-content: center;
}

// The label itself, and the only run here allowed to disappear.
//
// NASALIZATION since 2026-08-23 (user ask) — `--font-display`, the platform's
// display face, which is what MiniPanel's own `#title` slot wears (`.mini-panel__title
// .nasalization`) and what every parked dock tab wears. Declared here rather
// than by adding the `.nasalization` utility class to the span because the
// utility also sets `letter-spacing: 0.05em`, and at this size that tracking
// costs about a character of the ellipsis on a narrow card; the face is what
// the ask is for. `text-align: center` as well as the zone's `justify-content`
// — the zone centres the BOX, and this centres the text inside it once the
// box has been squeezed narrower than its content.
.node-mini__name-text {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.76em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── THE DOT'S ZONE (2026-08-23, third pass) ──────────────────────────────
// The verdict light used to stand in the row as a BARE span, which cost it
// both hairlines: `.node-mini__zone`'s `& + &` rule fires only between
// adjacent ZONES, so an unwrapped element in the middle broke the chain and
// the flyout past it went unruled too. Wrapping it restores the row's own
// grammar — every boundary is a hairline, and the count follows the zones.
// `flex: 0 0 auto` because a dot has one size.
.node-mini__zone--dot {
  flex: 0 0 auto;
}

// ── THE HASH COPY BUTTON (2026-08-23, third pass) ────────────────────────
// A bare glyph beside the chip whose address it copies — no box, no rim, the
// zone's own ink at 60% so it reads as an affordance ON the chip's line
// rather than as a second object in the row. It brightens to full ink under
// the pointer and turns `--positive` for the 1600ms the check is showing,
// which is the only moment this button says anything.
.node-mini__copy {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 3px;
  padding: 0;
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.12s, color 0.12s;

  &:hover { opacity: 1; }

  &.is-copied {
    opacity: 1;
    color: var(--positive, #21BA45);
  }
}

// ── THE ADDRESS CHIP'S ZONE ──────────────────────────────────────────────
// LEFT OF THE GREEN DOT by the ask, which is what fixes the header's reading
// order: name, address, verdict, action. `flex: 0 1 auto` — it may be
// squeezed (MicroChip is container-adaptive and shortens its own hash slice)
// but never stretched, because the slack belongs to the name.
//
// ITS TEXT IS DARK TEAL since 2026-08-23 (user ask: "make the nano node
// chip's text dark teal"). MicroChip's stock ink is `rgba(var(--ink-rgb),
// .78)` — the platform's slate, correct for a chip smuggled into prose and
// wrong here, now that the panel's LINES have gone grey: the chip's ink is
// the last thing on the panel still able to say which colorway this is.
// `--teal-10` is the colorway's own ink, the tone the source pane reads
// directly for exactly the same reason. `:deep()` + `!important` because
// MicroChip states `color` on `.micro-chip` itself and again on
// `.is-link:hover`, and a linked chip would otherwise take its slate back
// under the pointer.
// FIRST IN THE ROW since the third pass (it was second, right of the title,
// for a few hours). It holds two things now — the chip and its copy button —
// so it is a row within the row; `flex: 0 1 auto` keeps it squeezable but
// never stretched, the slack belonging to the title beside it.
.node-mini__zone--chip {
  flex: 0 1 auto;
  min-width: 0;

  :deep(.micro-chip) {
    color: var(--teal-10, #004d40) !important;
  }
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
  color: var(--node-mini-head-ink, var(--teal-10, #004d40));
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

// ── The integrity traffic light + withheld face (integrity-debt plan) ────
// Header dot: the chips' grammar at panel scale. Red is the only
// interactive state — it routes to Talavero's report.
.node-mini__integrity {
  flex-shrink: 0;
  align-self: center;
  width: 8px;
  height: 8px;
  // No margin since 2026-08-23: the dot sits in a padded zone of its own now,
  // and its old `0 4px` would have doubled that inset on both sides.
  margin: 0;
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
