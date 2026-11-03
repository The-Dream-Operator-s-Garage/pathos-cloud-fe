// ─────────────────────────────────────────────────────────────────────────────
// BRAND MARKS IN COLOUR (2026-11-03, user ask: "look for an icon library …
// incorporate the icons for popular sites next to the links or the buttons,
// in color and everything")
//
// THE LIBRARY: SVG Logos (gilbarbara/logos, CC0) through
// `@iconify-icons/logos` — ~1,900 full-colour brand marks, ONE small ES
// module per mark (`@iconify-icons/logos/<name>` → `{ body, width, height }`),
// so the bundle carries only the marks imported here. Browse the names at
// icon-sets.iconify.design/logos. The dashboard's glyph font (Material
// Symbols, utils/glyphs.js) has no brands and paints one colour; a
// brand-coloured mark tells the eye WHICH service a button talks to before
// the words do.
//
// QIcon draws a mark through its `img:` form: each one is its own small SVG
// document in a data: URL — its gradient and mask ids can never collide with
// another mark's on the page — sized like a font glyph (a 1em square, the
// mark centred in it): `<q-icon :name="BRANDS.googleDrive" size="13px" />`.
//
// LINKS get the site's OWN icon (components/shared/SiteIcon.vue →
// POST /api/site-icons, read from the site's <head>); a brand below is the
// fallback for a host whose icon has not answered (yet, or ever).
import googleDrive from '@iconify-icons/logos/google-drive'
import googleIcon from '@iconify-icons/logos/google-icon'
import chrome from '@iconify-icons/logos/chrome'
import youtubeIcon from '@iconify-icons/logos/youtube-icon'
import githubIcon from '@iconify-icons/logos/github-icon'
import redditIcon from '@iconify-icons/logos/reddit-icon'
import x from '@iconify-icons/logos/x'
import spotifyIcon from '@iconify-icons/logos/spotify-icon'
import instagramIcon from '@iconify-icons/logos/instagram-icon'
import safari from '@iconify-icons/logos/safari'
import firefox from '@iconify-icons/logos/firefox'
import microsoftEdge from '@iconify-icons/logos/microsoft-edge'
import opera from '@iconify-icons/logos/opera'

const img = ({ body, width, height }) => 'img:data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`)

export const BRANDS = {
  googleDrive: img(googleDrive),
  google: img(googleIcon),
  chrome: img(chrome),
  youtube: img(youtubeIcon),
  github: img(githubIcon),
  reddit: img(redditIcon),
  x: img(x),
  spotify: img(spotifyIcon),
  instagram: img(instagramIcon),
  safari: img(safari),
  firefox: img(firefox),
  edge: img(microsoftEdge),
  opera: img(opera)
}

// host → the brand to draw while (or if) the site's own icon is missing.
const HOST_BRANDS = [
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'youtube'],
  [/^drive\.google\.com$/, 'googleDrive'],
  [/(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/, 'google'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)reddit\.com$|(^|\.)redd\.it$/, 'reddit'],
  [/(^|\.)x\.com$|(^|\.)twitter\.com$/, 'x'],
  [/(^|\.)spotify\.com$/, 'spotify'],
  [/(^|\.)instagram\.com$/, 'instagram']
]
export const brandOfHost = (host) => {
  const h = String(host || '').toLowerCase()
  const hit = HOST_BRANDS.find(([re]) => re.test(h))
  return hit ? BRANDS[hit[1]] : null
}

// A device session's browser, by its user-agent — the mark, or null.
// Order matters: Edge and Opera say "Chrome/" too, Chrome says "Safari/".
export const browserBrand = (ua) => {
  const s = String(ua || '')
  if (/Edg(A|iOS)?\//.test(s)) return BRANDS.edge
  if (/OPR\/|OPT\//.test(s)) return BRANDS.opera
  if (/Firefox\/|FxiOS\//.test(s)) return BRANDS.firefox
  if (/Chrome\/|CriOS\//.test(s)) return BRANDS.chrome
  if (/Safari\//.test(s) && /Version\//.test(s)) return BRANDS.safari
  return null
}
