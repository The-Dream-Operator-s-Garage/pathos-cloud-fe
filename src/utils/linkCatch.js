// The note's link catch (2026-10-12) — which URLs a pasted text carries,
// and where a caught one still stands in the note.
//
// The uploader lost its link section that day: a link enters through the
// note, caught on paste (UploaderDock's teal frame) and, once confirmed,
// rewritten in place into the LINK node's nano pill. Two questions, both
// here so the dock and its witness agree on them:
//
//   findLinks(text)        → the distinct http(s) URLs in a pasted text
//   indexOfLink(text, url) → where the URL stands as a WHOLE token (not as
//                            the prefix of a longer URL), or -1
//
// A URL ends at whitespace, a quote or an angle bracket; trailing sentence
// punctuation is not part of it, and a closing paren only when it opens
// one inside (Wikipedia's `Foo_(bar)` keeps its paren, `(see https://x.y)`
// does not).

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi
const URL_CHAR = /[^\s<>"'`]/

function trimTail (url) {
  let u = url.replace(/[.,;:!?*_~]+$/, '')
  while (/[)\]}]$/.test(u)) {
    const close = u.slice(-1)
    const open = { ')': '(', ']': '[', '}': '{' }[close]
    if (u.split(open).length >= u.split(close).length) break
    u = u.slice(0, -1).replace(/[.,;:!?*_~]+$/, '')
  }
  return u
}

function isUrl (s) {
  try {
    const u = new URL(s)
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.')
  } catch (_) { return false }
}

export function findLinks (text) {
  const out = []
  for (const m of String(text || '').matchAll(URL_RE)) {
    const url = trimTail(m[0])
    if (isUrl(url) && !out.includes(url)) out.push(url)
  }
  return out
}

export function indexOfLink (text, url) {
  const s = String(text || '')
  if (!url) return -1
  let from = 0
  for (;;) {
    const at = s.indexOf(url, from)
    if (at < 0) return -1
    const next = s.charAt(at + url.length)
    // A longer URL this one prefixes is not this one — unless what follows
    // is the trailing punctuation findLinks would have trimmed.
    if (!next || !URL_CHAR.test(next) || trimTail(url + s.slice(at + url.length).match(/^[^\s<>"'`]*/)[0]) === url) return at
    from = at + 1
  }
}
