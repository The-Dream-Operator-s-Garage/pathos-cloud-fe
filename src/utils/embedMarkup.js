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
//
// The SECOND shape (2026-10-01, the X ask): a `<blockquote>` snippet — X's
// "Embed post" hands out `<blockquote class="twitter-tweet">…<a href=
// "https://x.com/<handle>/status/<id>?ref_src=twsrc%5Etfw">date</a>
// </blockquote><script src=…widgets.js>`. The script is exactly what the
// platform never runs; the address is the LAST anchor (links inside the
// quoted text come first), or a `cite=` when the quote carries one. The
// `ref_src` tracking tail is dropped — it names X's referral, not the post.
const TAG_RE = /<(?:iframe|embed)\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
const QUOTE_RE = /<blockquote\b([^>]*)>([\s\S]*?)<\/blockquote>/i
const CITE_RE = /\bcite\s*=\s*(?:"([^"]+)"|'([^']+)')/i
const HREF_RE = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi

const _https = (raw) => {
  const v = String(raw || '').replace(/&amp;/g, '&').trim()
  return /^https:\/\/\S+$/i.test(v) ? v : null
}

function addressFromQuote (raw) {
  const q = QUOTE_RE.exec(raw)
  if (!q) return null
  const cite = CITE_RE.exec(q[1])
  let url = cite ? _https(cite[1] || cite[2]) : null
  if (!url) {
    const hrefs = [...q[2].matchAll(HREF_RE)].map(m => _https(m[1] || m[2])).filter(Boolean)
    url = hrefs[hrefs.length - 1] || null
  }
  if (!url) return null
  try {
    const u = new URL(url)
    u.searchParams.delete('ref_src')
    return u.href
  } catch (_) { return null }
}

export function srcFromEmbedMarkup (text) {
  const raw = String(text || '').trim()
  if (!raw.startsWith('<')) return null
  const m = TAG_RE.exec(raw)
  // Attribute values arrive HTML-escaped (`&amp;` between query params).
  if (m) return _https(m[1] || m[2] || m[3])
  return addressFromQuote(raw)
}

// The field's value after a paste or a keystroke: the unwrapped address
// when the text is embed markup, the text itself otherwise.
export function unwrapLinkInput (text) {
  return srcFromEmbedMarkup(text) || text
}
