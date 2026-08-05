<template>
  <!-- Per-kind media rendering inside a viewer's well
       (docs/plans/floating-media-viewer.md — Lane C owns this file).
       Branch order mirrors NodeMini's body: embed first (a LINK rendered
       as the thing it points at), then the file kinds, then plain text.
       `face` makes the decision ONCE in script — the chain below only
       states the renderings. A media kind whose enrichment failed (no
       url to load) falls to the download card: a dead end shaped like a
       file beats a broken <img>. -->
  <div class="mv-body">
    <!-- EMBED — EmbedFrame is the platform's one iframe; it takes a
         HEIGHT budget (--media-max-h) and holds the rule's geometry.
         The wrapper publishes that budget from the well's real box (see
         the styles) and keeps the caption on: provider + source line is
         part of the look, recoloured for the dark floor. -->
    <div
      v-if="face === 'embed'"
      class="mv-body__embed"
      :class="{ 'mv-body__embed--player': !embedIsPage }"
    >
      <EmbedFrame :embed="embed" />
    </div>

    <img
      v-else-if="face === 'image'"
      class="mv-body__image"
      :class="{ 'mv-body__image--natural': tinyImage }"
      :src="node.file.url"
      :alt="node.file.name || ('.' + node.file.ext + ' image')"
    />

    <video
      v-else-if="face === 'video'"
      class="mv-body__video"
      :src="node.file.url"
      controls
      preload="metadata"
    />

    <audio
      v-else-if="face === 'audio'"
      class="mv-body__audio"
      :src="node.file.url"
      controls
      preload="metadata"
    />

    <!-- Markdown FILE — a light reading pane set into the dark well,
         pretty by default. plain-refs because the file's [[pathos:]]
         refs are QUOTED content, not this surface's links; breaks off
         because doc sources are hard-wrapped and must reflow. The
         corner chip flips to the verbatim source (same pane, <pre>)
         and back; per-window state, nothing persists. -->
    <div v-else-if="face === 'doc'" class="mv-body__page">
      <button
        type="button"
        class="mv-body__page-toggle mono"
        :title="rawView ? 'Rendered view' : 'Verbatim source'"
        @click="rawView = !rawView"
      >{{ rawView ? 'pretty' : 'raw' }}</button>
      <div v-if="!rawView" class="mv-body__page-scroll">
        <MarkdownBody :text="text" :plain-refs="true" :breaks="false" class="md-rendered" />
      </div>
      <pre v-else class="mv-body__page-scroll mv-body__pre mono">{{ text }}</pre>
    </div>

    <!-- Non-md text files, and plain NOTE bodies — the raw pane directly -->
    <div v-else-if="face === 'text'" class="mv-body__page">
      <pre class="mv-body__page-scroll mv-body__pre mono">{{ text }}</pre>
    </div>

    <!-- Binary / unknown / enrichment-failed — NodeContentViewer's
         download row grown into a centred plaque. The link only renders
         when there are bytes to fetch. -->
    <div v-else class="mv-body__card">
      <q-icon :name="cardIcon" size="34px" class="mv-body__card-icon" />
      <div v-if="node.file?.name" class="mv-body__card-name">{{ node.file.name }}</div>
      <div class="mv-body__card-meta mono">
        .{{ node.file?.ext || '?' }} file{{ cardSize ? ' · ' + cardSize : '' }}
      </div>
      <a
        v-if="node.file?.url"
        :href="node.file.url"
        target="_blank"
        rel="noopener"
        class="mv-body__card-link"
      >
        <q-icon name="download" size="15px" />
        <span>download</span>
      </a>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import { bodyOf, formatBytes } from 'src/utils/nodeContent'
// The face ladder and the kind glyphs moved to utils/mediaKind.js on
// 2026-08-05, when the minimize tabs needed the same classification for
// their icons — one ladder, two readers (the glyph language is still
// NodeContentViewer's thumb column).
import { faceOf, KIND_ICON } from 'src/utils/mediaKind'

export default defineComponent({
  name: 'MediaViewerBody',
  components: { EmbedFrame, MarkdownBody },
  props: {
    // The store's viewer record: { id, node, natural, ... }
    viewer: { type: Object, required: true }
  },
  setup (props) {
    const node = computed(() => props.viewer.node)
    const embed = computed(() => node.value.embed || null)
    const embedIsPage = computed(() => embed.value?.mode === 'page')

    // ONE branch decision, and it lives in utils/mediaKind so the parked
    // tab's glyph and this renderer can never disagree about what a node is.
    const face = computed(() => faceOf(node.value))

    // md pretty ⇄ raw. Local per-window state — two viewers over the
    // same node keep independent toggles (plan: no persistence in v1).
    const rawView = ref(false)

    const text = computed(() => bodyOf(node.value) || '')

    // A tiny image stretched across a big well reads as a mistake —
    // under 300px on the long side it stays at its natural box instead.
    // The fit engine keeps the WINDOW near that box anyway; this guards
    // the maximized and hand-resized cases.
    const tinyImage = computed(() => {
      const n = props.viewer.natural
      const long = Math.max(n?.w || 0, n?.h || 0)
      return long > 0 && long <= 300
    })

    const cardIcon = computed(() => KIND_ICON[node.value.file?.kind] || 'attach_file')
    const cardSize = computed(() => formatBytes(node.value.file?.size))

    return { node, embed, embedIsPage, face, rawView, text, tinyImage, cardIcon, cardSize }
  }
})
</script>

<style lang="scss" scoped>
// The well is a size container; 100cqh/100cqw are its REAL content box,
// which is how a fixed-size window turns into the concrete budgets below.
// The content container, and since 2026-08-05 (user ask) a FRAMED one: a
// 1px --grey-6 rim with the well's 4px padding as daylight between it and
// the window's own edge, which wears the same tone. Two lines flush
// against each other would read as one thick one; separated, and drawn in
// ONE tone, they read as a frame set inside a case — the media sits
// INSIDE something. (It went in at --grey-8 for one pass and was too
// dark: the rim then competed with the frieze band, which is supposed to
// be the only dark line in the box.) The 2px it costs is declared to the
// fit engine as `BODY_RIM`.
.mv-body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  // ONE --grey-5 PLATE, floor and rim alike (2026-08-05, user ask): a
  // single step under the window's --grey-4 coat, edgeless within itself,
  // so the media lies on a plate set into a case and nothing between them
  // is drawn as a line. That is the "smooth metallic plates" this box is
  // after — depth stated by tone steps, never by outlines, which is also
  // why the window's own rim sits one step off ITS face (--grey-6 on
  // grey-4) instead of contrasting with it. The frame walked --grey-8 →
  // --grey-6 → grey-4 → here, lighter and smoother every pass.
  background: var(--grey-5, #bdbdbd);
  border: 1px solid var(--grey-5, #bdbdbd);
  // …except along the TOP (2026-08-05, user ask): the plate meets the
  // frieze band's side of the window with nothing of its own between
  // them, so the eye runs from the band straight onto the media. Three
  // sides is what a plate slid in from above has. The 1px it gives back
  // is `BODY_RIM` in utils/mediaFit — vertical chrome counts it once now.
  border-top: none;
  border-radius: 5px;
}

// ── EMBED ──
// EmbedFrame states its geometry from a HEIGHT budget: player mode
// converts `--media-max-h` to width via the rule's ratio, page mode
// takes it as raw height. Under the frame sits its caption — a 4px gap
// plus one ~15px provider/link row — so the budget is the well minus
// that line, or the pair overflows by exactly the caption. 22px covers
// the row with slack: squeezing a frame 3px is invisible, clipping the
// caption is not.
.mv-body__embed {
  width: 100%;
  --mv-cap-h: 22px;
  // …minus the content plate's own 1px, since `100cqh` is the WELL's box
  // and the rim lives inside it (2026-08-05 — one pixel, not two: the
  // plate has no top border).
  --media-max-h: calc(100cqh - var(--mv-cap-h) - 1px);

  // The caption inherits the paper palette's ink, which the window's own
  // coat has to answer: it was --grey-4 while the well floor was dark,
  // and it is --grey-9 since the coat went LIGHT (2026-08-05) — grey-4 on
  // grey-4 would have been the same invisibility from the other side.
  // The window's FOOTER line, in the window's voice: the display face
  // (Nasalization, 2026-08-05 user ask) to match the header above it. The
  // address inside it keeps `.mono` — that class sits on the anchor
  // itself and wins over this inherited family, which is right: a URL is
  // a machine string and is set as one everywhere on the platform.
  :deep(.embed-frame__cap) {
    // Back to --grey-9 with the mat at --grey-4 (7.0:1): the caption is
    // the one line of text lying directly on it, and it should read in
    // the same ink as the header above it. It spent one pass at
    // --grey-10, which the darker mat needed.
    color: var(--grey-9, #424242);
    font-family: var(--font-display);
    letter-spacing: 0.03em;
  }
}

// A ratio-locked player rarely spans the figure once the height budget
// converts to width — centre the box and its caption so the pair reads
// as one centred object. A page (Wikipedia) is full-width by nature and
// keeps the caption at its left edge.
.mv-body__embed--player {
  :deep(.embed-frame__box) { margin-inline: auto; }
  :deep(.embed-frame__cap) { justify-content: center; }
}

// ── IMAGE ──
// Fills the well contained — the window was FIT to the natural aspect,
// so "fill" is normally a hair's upscale at most; radius matches the
// window's rounding language.
.mv-body__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

// …unless the source is tiny (see `tinyImage`): natural box, centred by
// the flex above, still clamped by the well.
.mv-body__image--natural {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

// ── VIDEO ──
// Contained like the image; the element spans the well, so the native
// controls hug the well's bottom edge even when the picture letterboxes.
.mv-body__video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

// ── AUDIO ──
// A horizontal bar breathing ~5% at each side, centred by the flex.
.mv-body__audio {
  width: 90%;
}

// ── READING PANE (md pretty/raw, plain text, NOTE bodies) ──
// A light paper floor set into the dark well — the document look. The
// pane owns the ONE scrollbar; `.mv-body` clips everything else.
.mv-body__page {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--grey-1, #fafafa);
  border-radius: 6px;
  overflow: hidden;
}

.mv-body__page-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 14px 18px;
}

.mv-body__pre {
  margin: 0;
  font-size: 0.78em;
  line-height: 1.6;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}

// The raw⇄pretty flip — a tiny mono chip floating at the pane's top
// right, dark-on-light for the paper floor. Absolute over the pane (not
// sticky inside the scroller) so it stays put while the text scrolls
// under it; the right inset clears the scrollbar.
.mv-body__page-toggle {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 2;
  padding: 2px 9px;
  border: 1px solid rgba(var(--ink-rgb), 0.28);
  border-radius: 999px;
  background: rgba(var(--ink-rgb), 0.07);
  color: var(--ink);
  font-size: 0.62em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover { background: rgba(var(--ink-rgb), 0.14); }
}

// ── DOWNLOAD CARD ──
// The dead-end plaque: kind glyph, human name when the file has one,
// mono meta line, and the raw bytes as an accent link.
.mv-body__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: 78%;
  padding: 20px 26px;
  background: var(--grey-10, #212121);
  border: 1px solid var(--grey-8, #616161);
  border-radius: 8px;
  text-align: center;
}

.mv-body__card-icon { color: var(--grey-6, #9e9e9e); }

.mv-body__card-name {
  color: var(--grey-3, #eeeeee);
  font-size: 0.85em;
  word-break: break-word;
}

.mv-body__card-meta {
  color: var(--grey-6, #9e9e9e);
  font-size: 0.72em;
}

.mv-body__card-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  color: var(--accent);
  font-size: 0.78em;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}
</style>
