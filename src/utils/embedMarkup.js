// A pasted embed snippet, reduced to the ONE address it carries.
//
// Providers hand people markup — `<iframe src="https://open.spotify.com/
// embed/track/…" width="100%" height="352" …></iframe>` — and almost none
// of it is information: the platform stores the ADDRESS and derives the
// frame from an EMBED_RULE (docs/concepts/embeds.md). So when the
// uploader's link field receives markup instead of a URL, it unwraps it
// here (2026-09-28, the Spotify ask) and the field shows the src.
//
// Deliberately narrow: an `<iframe>` or `<embed>` tag's `src`, https only,
// the FIRST such tag, nothing else parsed — the markup is never rendered
// or kept. Anything that is not that shape answers null and the text
// stands as typed (the API's link validation says the rest).
const TAG_RE = /<(?:iframe|embed)\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i

export function srcFromEmbedMarkup (text) {
  const raw = String(text || '').trim()
  if (!raw.startsWith('<')) return null
  const m = TAG_RE.exec(raw)
  if (!m) return null
  // Attribute values arrive HTML-escaped (`&amp;` between query params).
  const src = (m[1] || m[2] || m[3] || '').replace(/&amp;/g, '&').trim()
  return /^https:\/\/\S+$/i.test(src) ? src : null
}

// The field's value after a paste or a keystroke: the unwrapped address
// when the text is embed markup, the text itself otherwise.
export function unwrapLinkInput (text) {
  return srcFromEmbedMarkup(text) || text
}
