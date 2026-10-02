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
    <!-- THE BUDGET PROBE (card mode, 2026-09-28): a custom property keeps
         its expression (`max(120px, calc(…))`) until it lands on a
         property, so the surface's `--media-max-h` cannot be READ as a
         number — only measured. This invisible strip is exactly as tall
         as the budget (capped at the card's full rung) and a
         ResizeObserver turns it into `budget`, from which the box picks
         its rung below. -->
    <div v-if="isCard || isFit" ref="budgetEl" class="embed-frame__budget" :style="budgetStyle" aria-hidden="true" />
    <div
      class="embed-frame__box"
      :class="{
        'embed-frame__box--page': isPage,
        'embed-frame__box--card': isCard,
        'embed-frame__box--fit': isFit,
        'embed-frame__box--scroll': fitGeom?.scroll
      }"
      :style="boxStyle"
    >
      <iframe
        ref="frameEl"
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
import { defineComponent, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

// A card never shrinks a rung by more than a fifth before stepping down
// to the provider's next design: 352 at 0.91 is still the full Spotify
// card; at 0.7 its type is small and the compact design reads better.
const CARD_SHRINK_FLOOR = 0.8

// What a FIT provider may report about itself: below 80px nothing is a
// card, above 4000 nothing is a post; widths outside 120–2000 are noise.
const FIT_H_MIN = 80
const FIT_H_MAX = 4000
const FIT_W_MIN = 120
const FIT_W_MAX = 2000

// The {width, height} a provider's size message carries, wherever it sits
// in the payload. X speaks JSON-RPC as a STRING —
// `{"twttr.embed":{"method":"twttr.private.resize","params":[{"width":550,
// "height":387,…}]}}` — so a string is parsed (capped) and the object
// walked a few levels for the first numeric `height`. Not X-specific: any
// provider that posts its own height in a plain object is read the same
// way. Answers null for anything else.
function sizeIn (data, depth = 0) {
  if (depth === 0 && typeof data === 'string') {
    if (data.length > 20000) return null
    try { data = JSON.parse(data) } catch (_) { return null }
  }
  if (!data || typeof data !== 'object' || depth > 5) return null
  const h = Number(data.height)
  if (Number.isFinite(h) && h > 0 && !Array.isArray(data)) {
    const w = Number(data.width)
    return { h, w: Number.isFinite(w) ? w : 0 }
  }
  for (const v of Object.values(data).slice(0, 20)) {
    const found = sizeIn(v, depth + 1)
    if (found) return found
  }
  return null
}

export default defineComponent({
  name: 'EmbedFrame',
  props: {
    // { provider, src, title, allow, aspect, icon, mode, zoom, height,
    // heights, url, rule } — never HTML. `icon` is the rule's caption icon
    // (a video rule says play_circle, an article rule says menu_book, a
    // music rule music_note); `mode` picks the geometry (player =
    // ratio-locked, page = full-width document, card = full-width at one
    // of the rule's fixed `heights`, fit = the size the provider reports
    // about itself); `zoom` shrinks a page's rendering
    // (see the --page styles).
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

    // A 'card' (2026-09-28, Spotify) is the THIRD geometry: the provider
    // draws its own card at a few FIXED heights — 352px for Spotify's
    // full player, 152 for its compact one — responsive in width, and at
    // any other height it draws the nearer design and leaves the rest of
    // the frame transparent. So neither the ratio nor the surface's
    // budget describes it: the rule's LADDER does. The rungs are the
    // rule's word, re-clamped here because they land on a style (the
    // descriptor is input like any other); a card with no usable rung is
    // a player.
    const rungs = computed(() => {
      const e = props.embed || {}
      const list = Array.isArray(e.heights) && e.heights.length ? e.heights : [e.height]
      return [...new Set(list.map(Number).filter(h => h >= 80 && h <= 1200))].sort((a, b) => b - a)
    })
    const isCard = computed(() => props.embed?.mode === 'card' && rungs.value.length > 0)

    // A 'fit' (2026-10-01, X) is the FOURTH geometry: the provider
    // measures its own card — a post is as tall as its text — and says so
    // by postMessage; the rule's single HEIGHT is only the first guess the
    // box holds until then. The message is believed only from THIS frame's
    // window at the origin the rule's template named, and its numbers are
    // clamped (they land on a style). `w` only ever grows: X draws its card
    // at min(frame, 550) and reports that, so adopting a smaller report as
    // the box's width would pin the box narrow after a container shrinks
    // and grows back.
    const isFit = computed(() => props.embed?.mode === 'fit' && rungs.value.length > 0)
    const frameEl = ref(null)
    const reported = ref(null)
    const frameOrigin = computed(() => {
      try { return new URL(props.embed?.src).origin } catch (_) { return null }
    })
    const onMessage = (e) => {
      if (!isFit.value || !frameEl.value || e.source !== frameEl.value.contentWindow) return
      if (!frameOrigin.value || e.origin !== frameOrigin.value) return
      const size = sizeIn(e.data)
      if (!size) return
      const h = Math.round(Math.min(FIT_H_MAX, Math.max(FIT_H_MIN, size.h)))
      const w = size.w >= FIT_W_MIN && size.w <= FIT_W_MAX ? Math.round(size.w) : 0
      const prev = reported.value
      // A pixel of jitter is not news (zoom re-lays the post narrower or
      // wider by a hair); only a real change re-renders.
      if (prev && Math.abs(prev.h - h) < 2 && w <= prev.w) return
      reported.value = { h, w: Math.max(prev?.w || 0, w) }
    }
    onMounted(() => window.addEventListener('message', onMessage))
    onBeforeUnmount(() => window.removeEventListener('message', onMessage))
    watch(() => props.embed?.src, () => { reported.value = null })

    // The surface's height budget as a NUMBER — measured off the probe
    // strip in the template (null until the first measure, so the box
    // starts on the CSS `min()` form and snaps once the observer speaks).
    const budgetEl = ref(null)
    const budget = ref(null)
    const budgetStyle = computed(() => {
      // A fit's ceiling is whatever the provider may report, not a rung.
      const cap = isFit.value ? FIT_H_MAX : (rungs.value[0] || 0)
      return { height: `min(${cap}px, var(--media-max-h, ${cap}px))` }
    })
    let ro = null
    const observe = () => {
      if (ro) { ro.disconnect(); ro = null }
      const el = budgetEl.value
      if (!el || typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver((entries) => {
        const h = entries[0]?.contentRect?.height
        if (Number.isFinite(h) && h > 0) budget.value = h
      })
      ro.observe(el)
      const h = el.getBoundingClientRect().height
      if (h > 0) budget.value = h
    }
    onMounted(observe)
    watch(budgetEl, observe)
    onBeforeUnmount(() => { if (ro) ro.disconnect() })

    // The rung the budget affords: walk the ladder largest first and take
    // the first rung that fits natively, or fits after a shrink of at
    // most a fifth (CARD_SHRINK_FLOOR); when even the smallest rung needs
    // more, that one shrinks as far as it must. `h` is the box's height,
    // `z` the scale the iframe is drawn at — the page mode's zoom
    // mechanics, so the provider always lays out at one of ITS heights
    // and the frame never holds a transparent remainder.
    const cardFit = computed(() => {
      const ladder = rungs.value
      const b = budget.value
      if (!ladder.length) return null
      if (b == null) return { h: null, z: 1 }
      for (const r of ladder) {
        if (b >= r) return { h: r, z: 1 }
        if (b >= r * CARD_SHRINK_FLOOR) return { h: b, z: b / r }
      }
      const r = ladder[ladder.length - 1]
      return { h: Math.min(b, r), z: Math.min(b, r) / r }
    })

    // A fit's geometry: the provider's reported height (else the rule's
    // guess) inside the measured budget — natively when it fits, shrunk by
    // at most a fifth (the card's floor, same zoom mechanics) when that
    // lands it, and past that the box stops at the budget and SCROLLS the
    // shrunken post inside itself: a long thread stays readable instead
    // of shrinking to unreadable type or pushing a feed card off screen.
    const fitGeom = computed(() => {
      if (!isFit.value) return null
      const h = reported.value?.h || rungs.value[0]
      const b = budget.value
      if (b == null) return { h, box: null, z: 1, scroll: false }
      if (b >= h) return { h, box: h, z: 1, scroll: false }
      const z = Math.max(CARD_SHRINK_FLOOR, b / h)
      return { h, box: Math.min(b, h * z), z, scroll: h * z > b + 0.5 }
    })

    // The ratio as a NUMBER, published as `--embed-ratio` beside the
    // `aspect-ratio` itself. A surface that has to bound the frame can only
    // bound its WIDTH without breaking the ratio (height is derived), and
    // the width that corresponds to a height limit is `limit × ratio`.
    // The style below does that conversion, so a surface states only a
    // HEIGHT budget (`--media-max-h`) and never has to know the rule's
    // aspect — which it could not, a 4:3 rule needing a 4:3 width.
    const boxStyle = computed(() => {
      if (isCard.value) {
        const fit = cardFit.value
        const full = rungs.value[0]
        return {
          // Unmeasured: the largest rung bounded by the budget in CSS;
          // measured: the chosen rung (or the shrunken box), and the zoom
          // that lays the iframe out at the provider's own height.
          '--embed-height': fit?.h ? `${fit.h}px` : `min(${full}px, var(--media-max-h, ${full}px))`,
          '--embed-zoom': String(fit?.z || 1)
        }
      }
      if (isFit.value) {
        const g = fitGeom.value
        const w = reported.value?.w
        return {
          '--embed-height': g.box ? `${g.box}px` : `min(${g.h}px, var(--media-max-h, ${g.h}px))`,
          '--embed-inner-h': `${g.h}px`,
          '--embed-zoom': String(g.z),
          // The provider's card width (zoomed), so the box ends where the
          // card does and the caption sits under it, not under air.
          ...(w ? { maxWidth: `min(100%, ${Math.ceil(w * g.z)}px)` } : {})
        }
      }
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

    return { provider, isPage, isCard, isFit, fitGeom, frameEl, boxStyle, budgetEl, budgetStyle, prettyUrl }
  }
})
</script>

<style lang="scss" scoped>
.embed-frame {
  margin: 0;
  width: 100%;
  // The budget probe is absolutely positioned against the figure.
  position: relative;
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

// A CARD (mode: 'card', 2026-09-28) is the third geometry: full width like
// a page, but its height is one of the RULE's fixed rungs (`--embed-height`
// — Spotify's player is 352px or 152px tall at any width), never the
// surface's budget as such: the script above measures the budget off the
// probe strip and picks the rung it affords, shrinking one by at most a
// fifth (`--embed-zoom`, the page mode's mechanics — the iframe laid out at
// the provider's own height and transform-scaled down) before stepping to
// the next. So a card quoted into a feed card's pit never pushes the play
// button below the fold AND never holds a transparent remainder under a
// card the provider drew smaller than the box. The frame is TRANSPARENT
// with no rim: the provider draws its own rounded card inside the iframe
// (Spotify's snippet asks for `border-radius: 12px`, which is the card's
// own corner, so the box wears the same radius and nothing else) — a black
// bed and a hairline around it would show as a dark mat at the corners.
.embed-frame__box--card {
  aspect-ratio: auto;
  max-width: 100%;
  height: var(--embed-height, 352px);
  background: transparent;
  border: 0;
  border-radius: 12px;

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

// A FIT (mode: 'fit', 2026-10-01, X) is the fourth geometry: the box is as
// tall as the provider SAYS its card is (`--embed-inner-h`, from its
// postMessage; the rule's HEIGHT until then) and as wide as that card
// (an inline max-width), transparent and rimless like a card — X draws its
// own bordered, 12px-cornered post. Over budget, the card's zoom shrinks it
// by up to a fifth; past that `--scroll` turns the box into a well that
// scrolls the post (`overscroll-behavior` keeps a fling from dragging the
// feed along). The iframe is absolutely placed and transform-scaled, and a
// transform DOES count toward a scroller's overflow, so the well scrolls
// exactly the shrunken height.
.embed-frame__box--fit {
  aspect-ratio: auto;
  max-width: 100%;
  height: var(--embed-height, 420px);
  background: transparent;
  border: 0;
  border-radius: 12px;

  iframe {
    inset: auto;
    top: 0;
    left: 0;
    width: calc(100% / var(--embed-zoom, 1));
    height: var(--embed-inner-h, 100%);
    transform: scale(var(--embed-zoom, 1));
    transform-origin: 0 0;
  }
}

.embed-frame__box--scroll {
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

// The budget probe: out of flow, invisible, exactly as tall as the
// surface's `--media-max-h` (capped at the card's full rung) — measured,
// never seen.
.embed-frame__budget {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  visibility: hidden;
  pointer-events: none;
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
