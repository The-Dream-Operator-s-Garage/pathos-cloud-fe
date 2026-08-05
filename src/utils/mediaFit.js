// Media fit engine — natural-size probing + arena-maximized placement
// (docs/plans/floating-media-viewer.md). Pure functions over plain rects:
// the window shell calls `probeNaturalSize` + `fitRect` once per viewer,
// the interaction layer re-uses `clampRect` / `minSize` every gesture.
//
// The fit rule: scale the media's natural box to the largest size that
// fits the arena once the window's own chrome (header + frieze band +
// well padding) is added — i.e. maximize along whichever dimension is the
// binding one — then center the window in the arena.

// Chrome constants (kept in step with MediaViewerWindow's CSS):
// .dock-bar height (--dock-bar-h) + the slim FriezeBar (≈ --frieze-h/2 +
// its 2px padding) + the well's thin padding + the foot's tally ledge +
// the window's own 1px borders.
export const HEADER_H = 30
export const WELL_PAD = 4
export const FOOT_H = 22 // the action cluster + tally ledge (2026-08-05)
export const MIN_W = 220 // header shrink floor: lights + a name sliver

// The MEDIA box never goes shorter than this: the native <audio> controls
// bar needs ~40px to stay tappable, and an 8/1 audio strip under a
// width-bound fit (or the MIN_W shrink floor) would otherwise thin out
// below it. Both fitRect and minSize apply the floor.
export const MEDIA_MIN_H = 40

// A probe that never answers (dead url, stalled request) must not hold
// the window hostage — the shell keeps the box hidden until a rect lands,
// so past ~4s a guessed aspect beats a viewer that never appears.
const PROBE_TIMEOUT_MS = 4000

// Fallback boxes, one per shape family. Spread into fresh copies at every
// return site — callers keep the object, so no two viewers may share one.
const LANDSCAPE = { w: 16, h: 9 } // players, video, unreadable images
const BOXY = { w: 4, h: 3 } // sizeless images, binaries, the unclassified
const PORTRAIT = { w: 3, h: 4 } // documents: page embeds, markdown, notes
const AUDIO_STRIP = { w: 8, h: 1 } // a wide controls bar

// Total vertical chrome for a given crown-strip height in px (the slim
// frieze is half of it; `friezePx` comes from useMediaArena's measurement).
export function chromeOf (friezePx) {
  return HEADER_H + Math.round((friezePx || 19) / 2 + 2) +
    WELL_PAD * 2 + FOOT_H + 2
}

// Horizontal chrome: the well padding plus the window's two 1px borders.
// Stated once so the fit and the shrink floor cannot drift apart — the
// content container adds nothing of its own (it briefly had a rim on
// 2026-08-05; the box is uniform now).
const sideChrome = () => WELL_PAD * 2 + 2

// "W / H" — the enrich seam's normalized aspect form — parsed to a box,
// or null on absent/malformed/zeroed input so the caller picks a default
// (a "0 / 9" must not sneak a division-by-zero ratio into the fit).
function parseAspect (aspect) {
  const m = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(aspect || '')
  if (!m) return null
  const w = parseFloat(m[1])
  const h = parseFloat(m[2])
  return (w > 0 && h > 0) ? { w, h } : null
}

// Real image probe: a detached Image() decode. A load with a real size
// wins; a load reporting 0×0 falls to 4/3 (SVGs without width/height
// attrs do that in some browsers); errors and the timeout fall to 16/9.
// `settle` fires once — it clears the timer, drops the handlers, and
// empties src so a timed-out fetch stops downloading.
function probeImage (url) {
  return new Promise((resolve) => {
    let img = null
    let timer = null
    const settle = (box) => {
      if (timer) clearTimeout(timer)
      timer = null
      if (img) {
        img.onload = null
        img.onerror = null
        img.src = ''
        img = null
      }
      resolve(box)
    }
    try {
      img = new Image()
      img.onload = () => {
        if (!img) return
        const w = img.naturalWidth
        const h = img.naturalHeight
        settle(w > 0 && h > 0 ? { w, h } : { ...BOXY })
      }
      img.onerror = () => settle({ ...LANDSCAPE })
      timer = setTimeout(() => settle({ ...LANDSCAPE }), PROBE_TIMEOUT_MS)
      img.src = url
    } catch (e) {
      // No DOM (or an exotic construction failure) — guess and move on
      settle({ ...LANDSCAPE })
    }
  })
}

// Real video probe: a detached <video preload="metadata"> — headers and
// moov atom only, never a frame. Same settle discipline as the image
// probe, plus the media-element detach ritual (drop src, call load()) so
// an abandoned probe aborts its fetch instead of buffering on in the dark.
function probeVideo (url) {
  return new Promise((resolve) => {
    let video = null
    let timer = null
    let onMeta = null
    let onError = null
    const settle = (box) => {
      if (timer) clearTimeout(timer)
      timer = null
      if (video) {
        video.removeEventListener('loadedmetadata', onMeta)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        try { video.load() } catch (e) { /* detach is best-effort */ }
        video = null
      }
      resolve(box)
    }
    onMeta = () => {
      if (!video) return
      const w = video.videoWidth
      const h = video.videoHeight
      settle(w > 0 && h > 0 ? { w, h } : { ...LANDSCAPE })
    }
    onError = () => settle({ ...LANDSCAPE })
    try {
      video = document.createElement('video')
      video.preload = 'metadata'
      video.addEventListener('loadedmetadata', onMeta)
      video.addEventListener('error', onError)
      timer = setTimeout(() => settle({ ...LANDSCAPE }), PROBE_TIMEOUT_MS)
      video.src = url
    } catch (e) {
      settle({ ...LANDSCAPE })
    }
  })
}

// probeNaturalSize(node) -> Promise<{ w, h }>
// The media's intrinsic box, per kind. Embeds trust their descriptor:
// players carry the enrich seam's normalized `embed.aspect`, page embeds
// (a framed Wikipedia article) are documents and default portrait. Images
// and videos get a REAL probe off the wire; audio is a wide strip, text
// a portrait page, binaries boxy, and a node with neither file nor embed
// is prose — portrait too. Every path resolves: a viewer with a guessed
// box beats a viewer stuck hidden behind a rejected promise.
export async function probeNaturalSize (node) {
  const embed = node?.embed
  if (embed) {
    if (embed.mode === 'page') return { ...PORTRAIT }
    return parseAspect(embed.aspect) || { ...LANDSCAPE }
  }
  const file = node?.file
  if (!file) return { ...PORTRAIT }
  if (file.kind === 'image') {
    // file.url VERBATIM — private files carry a server-minted ?t= token
    // in the url; reconstructing it here would drop the token and 403.
    return file.url ? probeImage(file.url) : { ...BOXY }
  }
  if (file.kind === 'video') {
    return file.url ? probeVideo(file.url) : { ...LANDSCAPE }
  }
  if (file.kind === 'audio') return { ...AUDIO_STRIP }
  if (file.kind === 'text') return { ...PORTRAIT }
  return { ...BOXY }
}

// fitRect(natural, arena, { chrome, index }) -> { x, y, w, h }
// Largest chrome-inclusive window whose MEDIA keeps `natural`'s ratio and
// fits the arena; centered, then cascaded by `index` so simultaneous
// windows don't stack pixel-perfectly.
export function fitRect (natural, arena, { chrome = chromeOf(), index = 0 } = {}) {
  const ratio = (natural?.w > 0 && natural?.h > 0) ? natural.w / natural.h : 16 / 9
  // Room the MEDIA has once the shell is subtracted; the floors keep the
  // math alive in degenerate arenas (clampRect trims any excess at the end).
  const availW = Math.max(120, arena.w - sideChrome())
  const availH = Math.max(80, arena.h - chrome)
  // Binding dimension wins: try width-bound, fall back to height-bound.
  let mediaW = availW
  let mediaH = mediaW / ratio
  if (mediaH > availH) {
    mediaH = availH
    mediaW = mediaH * ratio
  }
  // Wide-short media (the audio strip) fit width-bound in a narrow arena
  // can undercut the controls bar — floor the media height without
  // re-widening (width already maxed what the arena offers).
  mediaH = Math.min(availH, Math.max(mediaH, MEDIA_MIN_H))
  const w = Math.max(MIN_W, Math.round(mediaW + sideChrome()))
  const h = Math.round(mediaH + chrome)
  // Cascade ~26px down-right per open window (wrapping every 5); since
  // the fit maximizes, the stepped axis often clamps back — the slide in
  // clampRect keeps every step inside rather than past the arena.
  const step = 26 * (index % 5)
  const x = Math.round(arena.x + (arena.w - w) / 2) + step
  const y = Math.round(arena.y + (arena.h - h) / 2) + step
  return clampRect({ x, y, w, h }, arena)
}

// clampRect(rect, arena) -> rect kept inside the arena (size capped to it,
// position slid back over the nearest edge — the "stays as far as it
// could go" drag rule).
export function clampRect (rect, arena) {
  const w = Math.min(rect.w, arena.w)
  const h = Math.min(rect.h, arena.h)
  const x = Math.min(Math.max(rect.x, arena.x), arena.x + arena.w - w)
  const y = Math.min(Math.max(rect.y, arena.y), arena.y + arena.h - h)
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}

// minSize(natural, chrome) -> { w, h } — the proportional shrink floor:
// width is bound by what the header survives (MIN_W), height follows the
// media ratio under it — floored at MEDIA_MIN_H so wide-short media
// never shrinks its controls bar out of usability.
export function minSize (natural, chrome = chromeOf()) {
  const ratio = (natural?.w > 0 && natural?.h > 0) ? natural.w / natural.h : 16 / 9
  const mediaW = MIN_W - sideChrome()
  return { w: MIN_W, h: Math.round(Math.max(mediaW / ratio, MEDIA_MIN_H) + chrome) }
}
