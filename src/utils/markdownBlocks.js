import { marked } from 'marked'

// ── MARKDOWN BLOCKS — the live editor's seam (2026-09-26) ──────────────────
//
// NoteEditor's `live` layout renders a document block by block and opens ONE
// block as its own source while the rest stay rendered. This module is the
// cut: `splitBlocks(src)` → `[{ text, tail, type }]` and `joinBlocks` is the
// exact inverse — `joinBlocks(splitBlocks(src)) === src`, byte for byte, for
// every input, or the split is not a split.
//
//   text  the block's source WITHOUT its trailing newlines (what the author
//         edits in the open block's field),
//   tail  those newlines plus the blank-line run that follows (a block owns
//         the gap after it, so an edit to `text` never touches the seams),
//   type  marked's block token type — 'paragraph' | 'heading' | 'code' |
//         'list' | 'blockquote' | 'table' | 'hr' | 'html' | 'space' … — or
//         'gap' for source the lexer swallowed (see below).
//
// WHY MARKED'S LEXER AND NOT A BLANK-LINE SPLIT: a blank line is not a block
// boundary in markdown. A loose numbered list ("1. a", blank, "2. b") is ONE
// list token — cut at the blank line it becomes two lists that both start at
// 1; an indented code block or a fence with an empty line inside is one token;
// so the boundaries have to be the grammar's own. Each block re-renders
// through MarkdownBody exactly as the whole document would, with two known
// exceptions noted at `renderText` in NoteEditor (link definitions, and a
// paragraph a def got folded into).
//
// WHY THE MAPPING IS BY LINE AND NOT BY `token.raw`: the lexer's raws do NOT
// concatenate back to the source. (1) Link definitions (`[id]: url`) are
// lifted into `tokens.links` and dropped from the list; (2) `\r\n` is
// normalized to `\n` and leading tabs to four spaces before tokenizing. Both
// are line-preserving, so the walk below matches each raw LINE against the
// original's current line (compared normalized) and advances a character
// cursor over the ORIGINAL text; a line that does not match means the lexer
// dropped something here — the walk scans forward for the token's first line
// and emits the skipped span as a 'gap' block. Anything the walk cannot
// account for falls back to ONE block holding the whole source, which is
// never wrong, only coarse.

const DEF_RE = /^ {0,3}\[[^\]]+\]:\s*\S/

// marked's own pre-tokenizing normalizations, applied to one ORIGINAL line
// so it can be compared with a raw line: CR stripped, leading tabs → 4 spaces.
const norm = (line) => line
  .replace(/\r$/, '')
  .replace(/^( *)(\t+)/, (_, sp, tabs) => sp + '    '.repeat(tabs.length))

// A span of source → its block: trailing line breaks move into `tail`.
const spanBlock = (str, type) => {
  const m = str.match(/[\r\n]+$/)
  const cut = m ? str.length - m[0].length : str.length
  return { text: str.slice(0, cut), tail: str.slice(cut), type }
}

// Blank-line runs become the previous block's tail; a run with nothing before
// it (a document that starts blank) stays as an empty-text block the editor
// hides — its whitespace still round-trips.
const fold = (blocks) => {
  const out = []
  for (const b of blocks) {
    if (b.type === 'space' && out.length) {
      out[out.length - 1].tail += b.text + b.tail
      continue
    }
    out.push(b)
  }
  return out
}

export function splitBlocks (src) {
  src = src || ''
  if (!src) return []
  let tokens
  try { tokens = marked.lexer(src) } catch (_) { return [spanBlock(src, 'paragraph')] }

  const lineEnd = (p) => { const i = src.indexOf('\n', p); return i < 0 ? src.length : i }
  const out = []
  let pos = 0
  try {
    for (const tok of tokens) {
      const rawLines = tok.raw.split('\n')
      const first = rawLines[0]
      let start = pos
      // The token's first line must be the original's current line. If it is
      // not, the lexer dropped source here (a link definition): scan forward
      // for the line and hand the skipped span back as a gap block.
      if (norm(src.slice(pos, lineEnd(pos))) !== first) {
        let p = lineEnd(pos) + 1
        let found = -1
        while (p <= src.length) {
          if (norm(src.slice(p, lineEnd(p))) === first) { found = p; break }
          if (p >= src.length) break
          p = lineEnd(p) + 1
        }
        if (found < 0) throw new Error('unmapped')
        out.push(spanBlock(src.slice(pos, found), 'gap'))
        start = found
        pos = found
      }
      // Consume the token line by line. Every raw line but the last ends in a
      // newline the original must have too; the last piece is either '' (the
      // raw ended on a newline — nothing more to take) or a whole line's text.
      for (let i = 0; i < rawLines.length; i++) {
        const last = i === rawLines.length - 1
        if (last && rawLines[i] === '') break
        const le = lineEnd(pos)
        if (norm(src.slice(pos, le)) !== rawLines[i]) throw new Error('unmapped')
        pos = last ? le : le + 1
      }
      if (pos > start) out.push(spanBlock(src.slice(start, pos), tok.type))
    }
    if (pos < src.length) out.push(spanBlock(src.slice(pos), 'gap'))
  } catch (_) {
    return [spanBlock(src, 'paragraph')]
  }
  return fold(out)
}

export const joinBlocks = (blocks) => blocks.map(b => b.text + b.tail).join('')

// A block that renders nothing and cannot be opened in the live layout: an
// empty-text block (a leading blank run) or a link definition the lexer
// dropped. The raw layout is where those are edited.
export const isHiddenBlock = (b) => !b.text || (b.type === 'gap' && DEF_RE.test(b.text))

// The link definitions of a document, to be appended to every block's render
// so `[text][id]` in one block still resolves to its `[id]: url` in another
// (a def renders to nothing, so the append is invisible).
export const defsOf = (blocks) => blocks
  .filter(b => b.type === 'gap' && DEF_RE.test(b.text))
  .map(b => b.text)
  .join('\n')

// Which block holds an absolute source offset, and where inside its text.
// An offset that falls in a block's tail (the blank run after it) lands at
// the start of the next block — that is where the caret would be typing.
export const locateOffset = (blocks, off) => {
  let s = 0
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (off <= s + b.text.length) return { index: i, caret: Math.max(0, off - s) }
    s += b.text.length + b.tail.length
  }
  if (!blocks.length) return null
  const l = blocks.length - 1
  return { index: l, caret: blocks[l].text.length }
}

// The absolute source offset where block `i` begins.
export const offsetOf = (blocks, i) => {
  let s = 0
  for (let k = 0; k < i && k < blocks.length; k++) s += blocks[k].text.length + blocks[k].tail.length
  return s
}
