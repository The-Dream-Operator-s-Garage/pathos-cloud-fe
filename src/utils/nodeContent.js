// Helpers for file-backed node content.
//
// FILE nodes (type_id 2) carry only an `uploads/...` address in `content`;
// the API enriches every node it returns with a descriptor:
//
//   node.file = { address, url, ext, kind, exists, size, text? }
//
// where `kind` ∈ text|image|video|audio|binary and `text` is the resolved
// body for md/txt. These helpers are the one place the dashboard decides
// "what do I render for this node" — use them instead of reading
// node.content directly, which for file nodes is just the address string.

import { stripPathosRefs } from './pathosRefs'

export const isFileNode = (node) => !!node?.file

// The human-readable body: resolved file text for file-backed nodes,
// the content column for everything else (notes, links, legacy rows).
export const bodyOf = (node) => {
  if (!node) return ''
  if (node.file) return node.file.text ?? ''
  return node.content || ''
}

// URL of the raw bytes (served by the API's /api/uploads route) — usable
// directly in <img>/<video>/<audio> src. Root-relative in dev (the proxy
// serves it); absolute when the API has PUBLIC_API_URL set (prod).
export const fileUrl = (node) => node?.file?.url || null

export const fileKind = (node) => node?.file?.kind || null

// One-line excerpt that never leaks a raw uploads/ address.
export const excerptOf = (node, max = 140) => {
  if (!node) return ''
  if (node.file && node.file.kind !== 'text') {
    return `${node.file.kind} · .${node.file.ext}`
  }
  return bodyOf(node).slice(0, max)
}

// A markdown body as ONE PLAIN RUN, for a Mini's excerpt (2026-09-30 — the
// family pass; NodeMini and PostMini both read it). The old excerpt only
// deleted the characters `#*`_~[]`, which turned `[[pathos:nodes/…|My
// label]]` into `pathos:nodes/…|My label` and `[text](url)` into
// `text(url)`. Here refs become their labels (`stripPathosRefs` — an
// unlabeled one its `kind/short-hash…`), links their text, code fences drop
// out, block markers (headings, quotes, list bullets) and emphasis go, and
// the line structure survives for `pre-wrap`. Cut at `max` with a stated `…`.
export const plainExcerpt = (markdown, max = 400) => {
  const s = stripPathosRefs(String(markdown || ''))
    .replace(/(```|~~~)[\s\S]*?\1/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])[ \t]+/gm, '')
    .replace(/[*_~`]+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

export const formatBytes = (n) => {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
