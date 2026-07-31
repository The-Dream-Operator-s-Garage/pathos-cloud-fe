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
