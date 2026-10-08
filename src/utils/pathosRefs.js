// The pathos.cloud inline reference format.
//
// Any markdown body on the platform can embed a reference to any pathchain
// element with:
//
//     [[pathos:<prefix>/<hash>]]                inline chip (AUTO — see below)
//     [[pathos:<prefix>/<hash>|Display label]]  inline chip, custom label
//     ![[pathos:<prefix>/<hash>]]               BLOCK EMBED — the full Mini
//                                               panel (image preview, post
//                                               excerpt, …) on its own line
//     -[[pathos:<prefix>/<hash>]]               FORCED MICRO — the smallest
//                                               chip, even where the surface
//                                               would bloom the ref
//
// where <prefix> is an on-disk kind folder (nodes, posts, skeletons, labels,
// paths, entities, moments, secrets, links) and <hash> the element hash.
// The renderer (MarkdownBody.vue) swaps each occurrence for a live chip or
// embed that resolves human info via GET /api/refs/summary and navigates to
// the element's viewer on click. The bang prefix mirrors markdown's image
// embed: `!` means "show the thing", bare means "point at the thing", and
// `-` means "keep it small". A bare ref states no preference: on AUTO
// surfaces (feed cards, the post viewer) a node ref that resolves to a URL
// an EMBED_RULE recognizes (YouTube, Wikipedia, …) or to a media file
// blooms into its Mini panel, and everything else stays a micro chip.
//
// References inside inline code (`…`) or fenced blocks (``` … ```) are left
// verbatim so docs can show the syntax itself.

import { KINDS } from './kinds'

// [[pathos:posts/ab12…]], [[pathos:posts/ab12…|Read this first]],
// ![[pathos:nodes/ab12…]] (block embed) or -[[pathos:nodes/ab12…]] (forced micro)
export const PATHOS_REF_RE =
  /([!-])?\[\[pathos:([a-z]+)\/([a-f0-9]{32,64})(?:\|([^\]\n]{1,120}))?\]\]/g

// Split out code regions so refs inside them stay literal. Order matters:
// fenced blocks first, then inline code.
const CODE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g

/**
 * Replace every pathos ref outside code with an inert placeholder element
 * that survives marked + DOMPurify. Returns { text, refs } where refs[i]
 * describes the placeholder with data-pathos-ref="i".
 */
export function extractPathosRefs (markdown) {
  const refs = []
  if (!markdown || markdown.indexOf('[[pathos:') === -1) {
    return { text: markdown || '', refs }
  }

  // Mask code segments, substitute in the open text, then unmask.
  const masks = []
  const masked = markdown.replace(CODE_RE, (m) => {
    masks.push(m)
    return ` PATHOS_CODE_${masks.length - 1} `
  })

  const substituted = masked.replace(PATHOS_REF_RE, (m, sigil, prefix, hash, label) => {
    if (!KINDS[prefix]) return m // unknown kind — leave as text
    const i = refs.length
    const embed = sigil === '!'
    // The author's stated display intent: 'embed' (!) always blooms the
    // Mini, 'micro' (-) always stays the chip, 'auto' (bare) lets the
    // surface decide.
    const display = embed ? 'embed' : sigil === '-' ? 'micro' : 'auto'
    refs.push({
      prefix,
      hash,
      label: label ? label.trim() : '',
      address: `${prefix}/${hash}`,
      embed,
      display
    })
    return `<span class="pathos-ref-slot${embed ? ' pathos-ref-embed' : ''}" data-pathos-ref="${i}"></span>`
  })

  const text = substituted.replace(/ PATHOS_CODE_(\d+) /g, (_, i) => masks[+i])
  return { text, refs }
}

/**
 * Plain-text form for titles/excerpts: '[[pathos:posts/ab…|Label]]' → 'Label',
 * unlabeled refs → '<kind>/<short hash>…'.
 */
export function stripPathosRefs (markdown) {
  if (!markdown) return ''
  return markdown.replace(PATHOS_REF_RE, (m, sigil, prefix, hash, label) =>
    label ? label.trim() : `${prefix}/${hash.slice(0, 8)}…`)
}

/**
 * Cut a markdown string at about `max` chars WITHOUT splitting a
 * `[[pathos:…]]` token: a cut that lands inside one extends to its `]]`;
 * a token left open (no `]]` at all) is dropped with its sigil. A half
 * reference is literal text to every renderer — `[[pathos:nodes/ab12` on a
 * card — so the quoting seams (ElementMini's post excerpt, NodeMini's text
 * body) cut here, never with `slice`.
 */
export function safeCut (markdown, max) {
  const s = String(markdown || '')
  if (!(max > 0) || s.length <= max) return s
  let cut = max
  const open = s.lastIndexOf('[[', cut - 1)
  if (open !== -1) {
    const close = s.indexOf(']]', open)
    if (close === -1) cut = open > 0 && /[!-]/.test(s[open - 1]) ? open - 1 : open
    else if (close + 2 > cut) cut = close + 2
  }
  return s.slice(0, cut)
}

// The ref token a plain excerpt carries while its markdown is stripped —
// two private-use code points no author types, so the stripping regexes
// pass over them and the cut can tell a token from text.
const TOK = ''
const MASK = ''
const TOKEN_RE = /(\d+)/g
const MASK_RE = /(\d+)/g
const CODE_INLINE_RE = /`[^`\n]*`/g

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))

/**
 * THE EXCERPT TIER (2026-10-07) — a markdown body as one plain run (the
 * family's `plainExcerpt` rules: fences out, links to their text, block
 * markers and emphasis gone, line structure kept for `pre-wrap`) in which
 * every reference STAYS A LIVE PLACEHOLDER instead of being flattened to
 * its label. Returns `{ html, refs }` in `extractPathosRefs`'s shape, so
 * MarkdownBody's `plain` mode seats a chip or a Mini in each slot exactly
 * as the rendered tier does — a quoted post's references are elements
 * (nano pills, or minis while the depth dial allows), never text that
 * happens to spell an address. The cut never lands inside a token; a
 * ref cut off with the tail simply has no slot and mounts nothing.
 */
export function plainExcerptWithRefs (markdown, max = 400) {
  const refs = []
  let s = String(markdown || '')
  if (!s) return { html: '', refs }
  s = s.replace(/(```|~~~)[\s\S]*?\1/g, ' ')
  // Inline code stays literal through the ref pass (a doc showing the
  // syntax), then reads as its own text, as plainExcerpt leaves it.
  const codes = []
  s = s.replace(CODE_INLINE_RE, (m) => { codes.push(m); return `${MASK}${codes.length - 1}${MASK}` })
  s = s.replace(PATHOS_REF_RE, (m, sigil, prefix, hash, label) => {
    if (!KINDS[prefix]) return m
    const i = refs.length
    const embed = sigil === '!'
    refs.push({
      prefix,
      hash,
      label: label ? label.trim() : '',
      address: `${prefix}/${hash}`,
      embed,
      display: embed ? 'embed' : sigil === '-' ? 'micro' : 'auto'
    })
    return `${TOK}${i}${TOK}`
  })
  s = s.replace(MASK_RE, (_, i) => codes[+i].slice(1, -1))
  s = s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])[ \t]+/gm, '')
    .replace(/[*_~`]+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (max > 0 && s.length > max) {
    let cut = max
    // An odd count of token marks before the cut = inside one: step past it.
    let marks = 0
    for (let i = 0; i < cut; i++) if (s[i] === TOK) marks++
    if (marks % 2 === 1) cut = s.indexOf(TOK, cut) + 1
    s = s.slice(0, cut).trimEnd() + '…'
  }
  const html = escapeHtml(s).replace(TOKEN_RE, (_, i) => {
    const r = refs[+i]
    return r
      ? `<span class="pathos-ref-slot${r.embed ? ' pathos-ref-embed' : ''}" data-pathos-ref="${i}"></span>`
      : ''
  })
  return { html, refs }
}
