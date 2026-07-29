<template>
  <!-- The platform's ONE <iframe>. Everything it needs arrives as DATA on
       the `embed` descriptor an EMBED_RULE produced (API:
       uploadService.enrichNode → node.embed, or POST /embeds/resolve) —
       src, title, allow, aspect. No surface builds an embed URL itself,
       and no markup ever crosses the wire: a rule ships a template, this
       component ships the frame. See docs/concepts/embeds.md.

       `@click.stop.prevent` is load-bearing: Minis are router-links, and a
       click meant for the play button must not navigate the panel away
       (the same guard NodeMini's <video>/<audio> branches carry). -->
  <figure class="embed-frame" @click.stop.prevent>
    <div
      class="embed-frame__box"
      :class="{ 'embed-frame__box--page': isPage }"
      :style="boxStyle"
    >
      <iframe
        :src="embed.src"
        :title="embed.title || provider"
        :allow="embed.allow || undefined"
        referrerpolicy="strict-origin-when-cross-origin"
        loading="lazy"
        allowfullscreen
        frameborder="0"
      />
    </div>

    <figcaption v-if="caption" class="embed-frame__cap">
      <q-icon :name="embed.icon || 'play_circle'" size="12px" />
      <span class="embed-frame__provider">{{ provider }}</span>
      <a
        :href="embed.url || embed.src"
        target="_blank"
        rel="noopener"
        class="embed-frame__src mono"
        @click.stop
      >{{ prettyUrl }}</a>
      <!-- `cap-end` — the caption's RIGHT END, for whatever small marks the
           surface wants on the provider/url line (NodeMini parks its flat
           vote thumbs here, 2026-07-27). `margin-left: auto` does the
           aligning; the url beside it keeps its ellipsis, since its
           `overflow: hidden` zeroes the flex minimum and lets it give
           first. -->
      <span v-if="$slots['cap-end']" class="embed-frame__cap-end">
        <slot name="cap-end" />
      </span>
    </figcaption>
  </figure>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'EmbedFrame',
  props: {
    // { provider, src, title, allow, aspect, icon, mode, zoom, url, rule }
    // — never HTML. `icon` is the rule's caption icon (a video rule says
    // play_circle, an article rule says menu_book); `mode` picks the
    // geometry (player = ratio-locked, page = full-width document);
    // `zoom` shrinks a page's rendering (see the --page styles).
    embed: { type: Object, required: true },
    // The provider + source line under the frame. Off on surfaces that
    // already state the link (the node viewer prints its address above).
    caption: { type: Boolean, default: true }
  },
  setup (props) {
    const provider = computed(() => props.embed?.provider || 'Embed')

    const aspect = computed(() => props.embed?.aspect || '16 / 9')

    // A 'page' is a scrollable DOCUMENT, not a fixed-ratio player — the
    // aspect machinery below does not apply to it.
    const isPage = computed(() => props.embed?.mode === 'page')

    // The ratio as a NUMBER, published as `--embed-ratio` beside the
    // `aspect-ratio` itself. A surface that has to bound the frame can only
    // bound its WIDTH without breaking the ratio (height is derived), and
    // the width that corresponds to a height limit is `limit × ratio`.
    // The style below does that conversion, so a surface states only a
    // HEIGHT budget (`--media-max-h`) and never has to know the rule's
    // aspect — which it could not, a 4:3 rule needing a 4:3 width.
    const boxStyle = computed(() => {
      if (isPage.value) {
        // Page mode: no ratio — only the zoom, re-clamped here because it
        // lands on a transform (the descriptor is input like any other).
        const z = Number(props.embed?.zoom)
        return { '--embed-zoom': String(z >= 0.4 && z <= 1 ? z : 1) }
      }
      const [w, h] = aspect.value.split(/[/:]/).map(n => parseFloat(n))
      const ratio = (w > 0 && h > 0) ? w / h : 16 / 9
      return { aspectRatio: aspect.value, '--embed-ratio': String(ratio) }
    })

    // The ORIGINAL url, trimmed to what identifies it — the scheme and a
    // `www.` say nothing at caption size.
    const prettyUrl = computed(() => {
      const raw = props.embed?.url || props.embed?.src || ''
      return raw.replace(/^https?:\/\/(www\.)?/, '')
    })

    return { provider, isPage, boxStyle, prettyUrl }
  }
})
</script>

<style lang="scss" scoped>
.embed-frame {
  margin: 0;
  width: 100%;
}

// The frame keeps the RATIO the rule declared and takes whatever width the
// surface gives it — a feed card, a mini panel and the full viewer all
// render the same player, only smaller or larger.
//
// …but a full-width 16:9 frame is TALLER THAN MOST BOXES it lands in (a
// 579px feed-card pit wants 326px in a 229px window), and the player's
// controls are dead centre, so an unbounded frame opens on its own top
// third with the play button below the fold. The surface therefore hands
// down a HEIGHT budget as `--media-max-h`, and the conversion to the only
// knob that can hold the ratio happens HERE, once, for every surface:
// `aspect-ratio` derives height FROM width, so a `max-height` would clamp
// the derived value, the box would stop being 16:9, and the provider's
// player would letterbox inside it (black bars — the symptom of the CSS,
// not of the video). The width that corresponds to a height limit is
// `limit × ratio`, and the ratio is right here as a number.
// `min()` keeps the container's width as the other limit, so a narrow
// column still wins. The default is the window's own height: no real cap,
// but no frame taller than the screen either.
.embed-frame__box {
  position: relative;
  width: 100%;
  max-width: min(100%, calc(var(--media-max-h, 100vh) * var(--embed-ratio, 1.7778)));
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  background: #000;

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    border: 0;
  }
}

// A PAGE (mode: 'page') is the other geometry: a scrollable document has
// no ratio to hold, so the box takes the surface's full WIDTH and its
// height budget DIRECTLY as height — the two things a ratio-locked player
// can never do at once. The rule's ZOOM then shrinks the rendering: a
// cross-origin page's font cannot be styled, so the iframe is laid out at
// a WIDER internal viewport (100% / zoom) and transform-scaled back down
// — 16px type at zoom .75 reads as 12px, and the page shows more of its
// column. Width × scale lands exactly on the box; the article scrolls
// inside the frame.
.embed-frame__box--page {
  aspect-ratio: auto;
  max-width: 100%;
  height: var(--media-max-h, 60vh);
  background: #fff;

  iframe {
    inset: auto;
    top: 0;
    left: 0;
    width: calc(100% / var(--embed-zoom, 1));
    height: calc(100% / var(--embed-zoom, 1));
    transform: scale(var(--embed-zoom, 1));
    transform-origin: 0 0;
  }
}

.embed-frame__cap {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.62);
  min-width: 0;
}

.embed-frame__provider {
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.92em;
}

.embed-frame__src {
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { text-decoration: underline; }
}

// The caption's right end — `margin-left: auto` claims the row's slack, so
// whatever the surface slotted here sits against the frame's right edge
// while the url keeps giving way first (its `overflow: hidden` zeroes the
// flex minimum). Rigid: the slot content is small marks, never prose.
.embed-frame__cap-end {
  margin-left: auto;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
