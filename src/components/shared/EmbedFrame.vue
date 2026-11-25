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
  <!-- ⭐ `rimmed` (2026-10-17 eve) rings the box in a thin dark line and a
       thin drop shadow (`.embed-frame--rimmed` below). `is-own` = the
       provider draws its own card corner (`embed.radius`), published as
       `--embed-own-r` already multiplied by the frame's zoom. -->
  <figure
    class="embed-frame"
    :class="{ 'embed-frame--rimmed': rimmed, 'is-own': ownR != null, 'embed-frame--html': isHtml }"
    :style="ownStyle"
    @click.stop.prevent
  >
    <!-- THE BUDGET PROBE (card mode, 2026-09-28): a custom property keeps
         its expression (`max(120px, calc(…))`) until it lands on a
         property, so the surface's `--media-max-h` cannot be READ as a
         number — only measured. This invisible strip is exactly as tall
         as the budget (capped at the card's full rung) and a
         ResizeObserver turns it into `budget`, from which the box picks
         its rung below. -->
    <!-- ⭐ THE SURFABLE VIEWER'S BAR (2026-11-23): an HTML page is a small
         browser — back / forward through the pages walked in THIS frame,
         the current address (opens the real page in a tab), and the step
         in flight. A link clicked in the page steps the frame in place
         (the navigator script → `pathos-page-nav` → POST …/visit). -->
    <div v-if="isHtml" class="embed-frame__nav">
      <button type="button" class="embed-frame__nav-btn" :disabled="pos <= 0" title="back" @click.stop.prevent="go(-1)">
        <q-icon name="arrow_back" size="13px" />
      </button>
      <button type="button" class="embed-frame__nav-btn" :disabled="pos >= stack.length - 1" title="forward" @click.stop.prevent="go(1)">
        <q-icon name="arrow_forward" size="13px" />
      </button>
      <a
        class="embed-frame__nav-url mono"
        :href="current.url"
        target="_blank"
        rel="noopener"
        :title="(pageTitle ? pageTitle + ' · ' : '') + current.url"
        @click.stop
      >
        <q-spinner v-if="stepping" size="10px" class="q-mr-xs" />{{ prettyCurrent }}
      </a>
      <span v-if="stepError" class="embed-frame__nav-err" :title="stepError">!</span>
    </div>
    <div v-if="isCard || isFit" ref="budgetEl" class="embed-frame__budget" :style="budgetStyle" aria-hidden="true" />
    <div
      class="embed-frame__box"
      :class="{
        'embed-frame__box--page': isPage,
        'embed-frame__box--card': isCard,
        'embed-frame__box--fit': isFit,
        'embed-frame__box--own': ownR != null,
        'embed-frame__box--scroll': fitGeom?.scroll
      }"
      :style="boxStyle"
    >
      <!-- ⭐ THE IN-BUILT HTML PAGE (2026-11-23, `embed.kind === 'html'`):
           no rule names this site, so the API reads the node's page and
           sanitizes it (services/pageService.js) and the frame renders it
           from `srcdoc` — SANDBOXED with no allow-same-origin: the
           document lives at an opaque origin and reaches nothing of the
           app's. `allow-scripts` runs ONE script — the navigator the page's
           CSP names by hash (the page's own scripts are stripped AND
           blocked); `allow-popups` lets a modified click open a tab. -->
      <iframe
        v-if="isHtml && pageHtml"
        ref="frameEl"
        class="embed-frame__doc"
        :srcdoc="pageHtml"
        :title="pageTitle || embed.title || provider"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        referrerpolicy="no-referrer"
        frameborder="0"
      />
      <div v-else-if="isHtml" class="embed-frame__doc-wait" :class="{ 'is-failed': pageFailed }">
        <q-spinner v-if="!pageFailed" size="18px" />
        <span v-else>page unavailable · <a :href="current.url" target="_blank" rel="noopener" @click.stop>open it in a tab</a></span>
      </div>
      <iframe
        v-else
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
import { nodeService } from 'src/services/node.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

// The HTML page displayer's reads, shared by every frame on the screen: the
// same node quoted in a card, its side viewer and its window fetches once.
// A failure is remembered too (the API caches its own answer for minutes).
const _pageReads = new Map() // node path → Promise<{ html, title } | null>
const readPage = (doc) => {
  if (!_pageReads.has(doc)) {
    if (_pageReads.size > 200) _pageReads.delete(_pageReads.keys().next().value)
    _pageReads.set(doc, nodeService.getPage(doc)
      .then(r => (r?.success && r.page?.html ? { html: r.page.html, title: r.page.title || null } : null))
      .catch(() => null))
  }
  return _pageReads.get(doc)
}

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
// A fit provider that reports only a HEIGHT (Reddit, 2026-10-15) draws a
// card as wide as its frame; left alone it would stretch across a 1000px
// post page with a two-line title. Its own widget seats it in a 640px
// column, so that is the box's width until a provider says otherwise.
// ⭐ 2026-10-31 (Instagram, 540): that column is the RULE's word now —
// `embed.width` (EMBED_RULE `WIDTH`); 640 is only the fallback for a rule
// that states none.
const FIT_W_DEFAULT = 640

// The {width, height} a provider's size message carries, wherever it sits
// in the payload. X speaks JSON-RPC as a STRING —
// `{"twttr.embed":{"method":"twttr.private.resize","params":[{"width":550,
// "height":387,…}]}}` — so a string is parsed (capped) and the object
// walked a few levels for the first numeric `height`. Not X-specific: any
// provider that posts its own height in a plain object is read the same
// way. Reddit (2026-10-15) speaks the other common dialect — a typed
// event whose payload IS the height: `{"type":"resize.embed","data":316}`
// (also a string) — so an object whose `type` names a resize and whose
// `data` is a bare number reads as that height. Answers null for anything
// else.
function sizeIn (data, depth = 0) {
  if (depth === 0 && typeof data === 'string') {
    if (data.length > 20000) return null
    try { data = JSON.parse(data) } catch (_) { return null }
  }
  if (!data || typeof data !== 'object' || depth > 5) return null
  if (typeof data.type === 'string' && /resize/i.test(data.type) && typeof data.data === 'number') {
    return data.data > 0 ? { h: data.data, w: 0 } : null
  }
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
    // heights, radius, width, url, rule } — never HTML. `icon` is the rule's caption icon
    // (a video rule says play_circle, an article rule says menu_book, a
    // music rule music_note); `mode` picks the geometry (player =
    // ratio-locked, page = full-width document, card = full-width at one
    // of the rule's fixed `heights`, fit = the size the provider reports
    // about itself); `zoom` shrinks a page's rendering
    // (see the --page styles).
    embed: { type: Object, required: true },
    // The provider + source line under the frame. Off on surfaces that
    // already state the link (the node viewer prints its address above).
    caption: { type: Boolean, default: true },
    // ⭐ 2026-10-17 eve — ring the box in a thin dark rim and cast a thin
    // shadow (`--embed-rule`, `--embed-shadow`). The host leaves the clear
    // ground the shadow lands on and, for a full-bleed frame, hands down the
    // corner to turn (`--embed-r`).
    rimmed: { type: Boolean, default: false }
  },
  // `unavailable` — an HTML page (kind 'html') the API could not read as a
  // document; the host may fall back to its plain link face.
  emits: ['unavailable'],
  setup (props, { emit }) {
    const provider = computed(() => props.embed?.provider || 'Embed')

    // THE IN-BUILT HTML PAGE (2026-11-23): page geometry, srcdoc content.
    const isHtml = computed(() => props.embed?.kind === 'html' && !!props.embed?.doc)
    const pageHtml = ref(null)
    const pageTitle = ref(null)
    const pageFailed = ref(false)

    // THE SURFABLE VIEWER (same day): the pages walked in THIS frame, each
    // { doc (the reader's LINK node path), url }; `pos` is the one shown.
    // Entry 0 is the node the frame was given — the host's own node.
    const stack = ref([])
    const pos = ref(0)
    const stepping = ref(false)
    const stepError = ref(null)
    const current = computed(() => stack.value[pos.value] || { doc: props.embed?.doc, url: props.embed?.url || '' })
    const prettyCurrent = computed(() => String(current.value.url || '').replace(/^https?:\/\/(www\.)?/, ''))
    watch(() => (isHtml.value ? props.embed.doc : null), (doc) => {
      stack.value = doc ? [{ doc, url: props.embed.url || props.embed.src || '' }] : []
      pos.value = 0
    }, { immediate: true })

    watch(() => (isHtml.value ? current.value.doc : null), (doc) => {
      pageHtml.value = null
      pageTitle.value = null
      pageFailed.value = false
      if (!doc) return
      readPage(doc).then((p) => {
        if (current.value.doc !== doc) return
        if (p) { pageHtml.value = p.html; pageTitle.value = p.title } else {
          pageFailed.value = true
          // only the host's OWN page sends it back to its link face; a page
          // walked to keeps the bar, so back still works
          if (pos.value === 0) emit('unavailable')
        }
      })
    }, { immediate: true })

    const go = (d) => {
      const next = pos.value + d
      if (next >= 0 && next < stack.value.length) { pos.value = next; stepError.value = null }
    }

    // A link clicked in the page: record the step on the reader's history
    // (their node + the visit — never a reference: deleted 2026-11-25), then
    // show its page here — unless the
    // address is a PROVIDER's (a rule embed: a video, a post), which opens
    // as that node's window, its player, instead of a scriptless page.
    const flyoutViewers = useFlyoutViewersStore()
    const step = async (href, text) => {
      if (stepping.value) return
      stepping.value = true
      stepError.value = null
      try {
        const r = await nodeService.visitFromPage(current.value.doc, href, text || null)
        const node = r?.node
        if (!node?.path) throw new Error('no node')
        if (node.embed && node.embed.kind !== 'html') {
          flyoutViewers.spawnNode(node, { flyout: true })
          return
        }
        stack.value = [...stack.value.slice(0, pos.value + 1), { doc: node.path, url: node.content || href }]
        pos.value = stack.value.length - 1
      } catch (e) {
        stepError.value = e?.response?.data?.error?.message || e?.message || 'step failed'
      } finally {
        stepping.value = false
      }
    }

    const aspect = computed(() => props.embed?.aspect || '16 / 9')

    // A 'page' is a scrollable DOCUMENT, not a fixed-ratio player — the
    // aspect machinery below does not apply to it.
    const isPage = computed(() => props.embed?.mode === 'page' || isHtml.value)

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
      // the page navigator's hand-off (opaque origin, so `e.origin` is the
      // string "null" — the SOURCE window is what proves it is our frame)
      if (isHtml.value && frameEl.value && e.source === frameEl.value.contentWindow &&
          e.data && e.data.type === 'pathos-page-nav' && typeof e.data.href === 'string' &&
          /^https?:\/\//i.test(e.data.href) && e.data.href.length <= 2048) {
        step(e.data.href, typeof e.data.text === 'string' ? e.data.text.slice(0, 200) : null)
        return
      }
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
    // The provider's own column for a fit that reports no width — the
    // rule's `width`, re-clamped (it lands on a style), else 640.
    const fitCol = computed(() => {
      const w = Number(props.embed?.width)
      return w >= FIT_W_MIN && w <= FIT_W_MAX ? Math.round(w) : FIT_W_DEFAULT
    })

    // The surface's height budget as a NUMBER — measured off the probe
    // strip in the template (null until the first measure, so the box
    // starts on the CSS `min()` form and snaps once the observer speaks).
    const budgetEl = ref(null)
    const budget = ref(null)
    const budgetStyle = computed(() => {
      // A fit's ceiling is whatever the provider may report, not a rung.
      const cap = isFit.value ? FIT_H_MAX : (rungs.value[0] || 0)
      return { height: `min(${cap}px, max(60px, calc(var(--media-max-h, ${cap}px) - var(--media-nest-h, 0px))))` }
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
    // guess) inside the measured budget — natively when it fits; the WHOLE
    // post shrunk to the budget, width in proportion, when a shrink of at
    // most a fifth (the card's floor) lands it; and past that NOT shrunk at
    // all: full size, as wide as the column lets it be, in a budget-tall box
    // that SCROLLS (`scroll`).
    // ⭐ 2026-10-18, two asks the same morning: "adapt the width
    // proportionally to display the whole thing under the available space"
    // (a post a little too tall had scrolled at 0.8) — then, an hour later,
    // "don't force it … just apply this to items that feel completely under
    // the portrait space. If they don't fit completely, prefer extending to
    // maximum width and turning the container into a scrollable section":
    // with no floor a long Reddit post had shrunk to a stamp at 0.2. Until
    // this day the scroll box held the post at 0.8; now a post that scrolls
    // reads at full size.
    const fitGeom = computed(() => {
      if (!isFit.value) return null
      const h = reported.value?.h || rungs.value[0]
      const b = budget.value
      if (b == null) return { h, box: null, z: 1, scroll: false }
      if (b >= h) return { h, box: h, z: 1, scroll: false }
      if (b / h >= CARD_SHRINK_FLOOR) return { h, box: b, z: b / h, scroll: false }
      return { h, box: b, z: 1, scroll: true }
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
          '--embed-height': fit?.h ? `${fit.h}px` : `min(${full}px, calc(var(--media-max-h, ${full}px) - var(--media-nest-h, 0px)))`,
          '--embed-zoom': String(fit?.z || 1)
        }
      }
      if (isFit.value) {
        const g = fitGeom.value
        const w = reported.value?.w || fitCol.value
        return {
          '--embed-height': g.box ? `${g.box}px` : `min(${g.h}px, calc(var(--media-max-h, ${g.h}px) - var(--media-nest-h, 0px)))`,
          '--embed-inner-h': `${g.h}px`,
          '--embed-zoom': String(g.z),
          // The provider's card width, so the box ends where the card does
          // and the caption sits under it, not under air — capped by the
          // column, THEN zoomed. ⚠ The order is load-bearing (2026-10-18):
          // the iframe lays out at box ÷ zoom, so `min(100%, w × z)` laid a
          // shrunk post out WIDER than the column (a 540 column at 0.5 →
          // 1080, clamped to the provider's 640), where it reflows SHORTER —
          // and its height is what picks shrink vs scroll. Capped first, the
          // layout width is `min(column, w)` at every zoom, so the reported
          // height cannot flip the choice it was measured for.
          maxWidth: `calc(min(100%, ${w}px) * ${g.z})`
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

    // THE PROVIDER'S OWN CORNER (2026-10-17 eve). A rule's `radius` says the
    // provider draws its card inside the frame with that corner (Spotify, X
    // 12; Reddit 8). The box clips at exactly that — a rounder clip shaves
    // the card's rim, a squarer one changes nothing — and since a card / fit
    // frame is transform-scaled by its zoom, the corner on screen is the
    // provider's radius × that zoom. Null = the content is full-bleed and
    // the corner is ours (`--embed-r`, which a host may hand down).
    const ownR = computed(() => {
      const r = Number(props.embed?.radius)
      if (!(r > 0 && r <= 40)) return null
      const z = isCard.value ? (cardFit.value?.z || 1) : isFit.value ? (fitGeom.value?.z || 1) : 1
      return Math.round(r * z * 100) / 100
    })
    const ownStyle = computed(() => (ownR.value != null ? { '--embed-own-r': `${ownR.value}px` } : null))

    // The ORIGINAL url, trimmed to what identifies it — the scheme and a
    // `www.` say nothing at caption size.
    const prettyUrl = computed(() => {
      const raw = props.embed?.url || props.embed?.src || ''
      return raw.replace(/^https?:\/\/(www\.)?/, '')
    })

    return { provider, isHtml, pageHtml, pageTitle, pageFailed, stack, pos, current, prettyCurrent, stepping, stepError, go, isPage, isCard, isFit, fitGeom, frameEl, boxStyle, budgetEl, budgetStyle, prettyUrl, ownR, ownStyle }
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
  max-width: min(100%, calc(max(60px, calc(var(--media-max-h, 100vh) - var(--media-nest-h, 0px))) * var(--embed-ratio, 1.7778)));
  overflow: hidden;
  // A dial since 2026-10-17 eve: a host hands its concentric corner down
  // through `--embed-r` (a full `border-radius` value, four corners).
  border-radius: var(--embed-r, 6px);
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
// THE SURFABLE VIEWER'S BAR (2026-11-23): one slim row over the page box —
// back, forward, the address. Calm: the family's ink at low contrast, the
// mono address ellipsed, nothing that competes with the page under it.
.embed-frame__nav {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 22px;
  padding: 0 2px 2px;
  font-size: 10.5px;
  color: rgba(var(--ink-rgb), 0.7);
}
.embed-frame__nav-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  &:hover:not(:disabled) { background: rgba(var(--ink-rgb), 0.08); }
  &:disabled { opacity: 0.3; cursor: default; }
}
.embed-frame__nav-url {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 3px;
  background: rgba(var(--ink-rgb), 0.05);
  color: inherit;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.embed-frame__nav-err {
  flex: 0 0 auto;
  width: 16px;
  text-align: center;
  font-weight: 700;
  color: var(--q-negative, #c10015);
}

// …and the bar's 24px come OFF the page box's budget, so the figure as a
// whole stays inside the surface's `--media-max-h` (a card pit, a window).
.embed-frame--html .embed-frame__box--page {
  height: max(60px, calc(var(--media-max-h, 60vh) - var(--media-nest-h, 0px) - 24px));
}

// The HTML page displayer's waiting / refused face — the page box's own
// size, a spinner or one quiet line, never a black rectangle.
.embed-frame__doc-wait {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--ink-rgb), 0.45);
  font-size: 11px;
  background: #fff;
}

.embed-frame__box--page {
  aspect-ratio: auto;
  max-width: 100%;
  height: max(60px, calc(var(--media-max-h, 60vh) - var(--media-nest-h, 0px)));
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
  // The provider's own corner comes as `embed.radius` since 2026-10-17
  // (`--own` below); 12 stays the fallback for a card rule that states none.
  border-radius: var(--embed-r, 12px);

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
// own bordered, 12px-cornered post. Over budget by at most a fifth, the
// card's zoom shrinks the whole post into it — height AND width, in
// proportion; past that `--scroll` turns the box into a well that scrolls
// the post at FULL size and the column's full width (2026-10-18 — it scrolled
// the post shrunk to 0.8 until then). `overscroll-behavior` keeps a fling
// from dragging the feed along.
.embed-frame__box--fit {
  aspect-ratio: auto;
  max-width: 100%;
  height: var(--embed-height, 420px);
  background: transparent;
  border: 0;
  border-radius: var(--embed-r, 12px);

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

// ⭐ THE PROVIDER'S CORNER (2026-10-17 eve): a rule that states `RADIUS`
// clips its box at exactly the provider's card corner × the frame's zoom
// (`--embed-own-r`, inline on the figure). Measured inside each frame:
// Spotify's widget container and X's post card turn 12px, Reddit's card
// `rounded-2` = 8px — the 12 every card / fit wore until today shaved
// Reddit's 8px corners, rim and all. Stated AFTER the mode rules: equal
// specificity, the later rule wins.
.embed-frame__box--own {
  border-radius: var(--embed-own-r, 12px);
}

// ⭐ A FULL-BLEED FIT (2026-10-31, Instagram): the transparent, rimless,
// 12px box above assumes the provider draws its own card (X, Reddit — the
// rules that state a RADIUS). Instagram's embed is an opaque white page
// edge to edge whose rim and corner its embed.js asks the HOST to draw
// (its `MOUNTED` message: `border: 1px solid #dbdbdb`), so a fit WITHOUT a
// provider corner is dressed like a player: the surface's corner and the
// player's hairline — as a RING, never a border, because a fit frame's
// width is load-bearing (X and Reddit report it back; Instagram
// re-measures its height at it). Stated BEFORE the rim: equal specificity,
// and a `rimmed` host's ring + shadow must win.
.embed-frame__box--fit:not(.embed-frame__box--own) {
  border-radius: var(--embed-r, 6px);
  box-shadow: 0 0 0 1px rgba(var(--ink-rgb), 0.14);
}

// ── ⭐ THE RIM (2026-10-17 eve) ──────────────────────────────────────────
// User ask: "make the embedded item have a thin dark grey border and make it
// project a thin shadow on the clear background" (it replaced, the same
// hour, a darker CONTAINER built round the frame on the ask before it).
// A `--embed-rule-w` (0.5px — 1px grey-8 for its first pass, then "thinner
// and of a lighter grey") `--embed-rule` (grey-6) ring and `--embed-shadow`
// (0 1px 3px, 25% black), BOTH as box-shadows:
// · a ring takes no layout. A real 1px border would narrow the content box
//   by 2px, and a FIT provider (X, Reddit) lays its card out at the frame's
//   width and REPORTS that width back — the box would follow it 2px
//   narrower, and so on every round;
// · a box-shadow follows `border-radius`, so the ring turns the box's own
//   corner its own width out — concentric with it by construction. On a
//   provider-cornered box (`--own`: exactly the card's corner) that puts
//   the rim on the card's edge; on a full-bleed one the corner is what the
//   host handed down (`--embed-r`);
// · `overflow: hidden` on the box clips its CONTENT, never its own shadow.
// The player's 14% hairline comes off under the ring (one rim, not two).
.embed-frame--rimmed .embed-frame__box {
  border: 0;
  box-shadow: 0 0 0 var(--embed-rule-w, 0.5px) var(--embed-rule, #9e9e9e), var(--embed-shadow, 0 1px 3px rgba(0, 0, 0, 0.25));
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
