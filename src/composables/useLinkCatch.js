// useLinkCatch — THE AUTHORING CATCH (2026-10-31), one law for every place
// a person writes: the uploader's note, the capture window's notepad and the
// post composer.
//
// User asks, the same day: "link recognition for the upload section already
// recognizes a link and lets you upload it through a glowing teal button.
// Help me adding this same functionality (in teal coloring) … when they're
// either writing a note or a post … visible and glowing only when a new
// link is recognized. Also, we must now run a test to see if the same link
// has been already uploaded before triggering this … a not-duplicated check
// on the authoring entitie's nodes" — and, before it, "if i paste a picture
// or a file on a post, it should recognize it and help me prompt the
// addition of it into my pathchain (if it is not duplicated)".
//
// THE LIFE OF A CATCH
//   · a NEW link appears — pasted, or typed and finished (whitespace after
//     it; `isLinkFinished`) — or a file is pasted (a `⟪name #n⟫` mark lands
//     at the caret where its pill will stand);
//   · it is asked TWO questions in parallel before anything shows: what is
//     it (`POST /embeds/resolve` — the provider's word and glyph) and is it
//     already the AUTHOR's (`POST /nodes/links/lookup` / `files/lookup`,
//     seat-strict: only the authoring entity's own nodes, a link keyed by
//     the object it names, a file by its sha256);
//   · then it shows: NEW → the neon-teal glowing row with Add link / Add
//     file; ALREADY THERE → a calm row naming the node, with Use it (its
//     pill, nothing minted);
//   · Add mints (a LINK node / one upload) as the authoring entity and
//     rewrites the URL — or the mark — into the node's nano pill
//     `-[[pathos:nodes/<hash>|label]]`; × keeps a link as text and takes a
//     file's mark out; deleting the URL / mark from the text drops the catch.
//
// Links already in a document when it is first seen (a restored draft, an
// opened note) are not new; `reset()` re-reads that baseline when a host
// swaps its document in place. Catches are per SCOPE (an uploader tab, a
// draft, a note sitting) and transient: a reload keeps the text, drops the
// question.
//
// The host hands in its document as functions of the scope key:
//   text(scope) → string · setText(next, scope) · author(scope) → entity id
//   labelIds(scope) → [] · scope() → the current key
//   insertAtCaret(text) — where a pasted file's mark goes
//   onLinkMinted(node, catch) / onFileMinted(node, catch) — the host's
//   after-mint duties (labels ask, nav action, refresh)

import { reactive, computed, watch, onBeforeUnmount } from 'vue'
import { embedService } from 'src/services/embed.service'
import { nodeService } from 'src/services/node.service'
import { findBareLinks, indexOfLink, isLinkFinished } from 'src/utils/linkCatch'

const SCAN_MS = 450
// The upload route's own cap (multer, routes/nodeRoutes.js).
export const CATCH_FILE_CAP = 25 * 1024 * 1024

export const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch (_) { return 'link' } }
// A pill label: no `|`, `]` or newline (they would end the ref), ≤ 80 chars.
export const refLabelOf = (name) =>
  String(name || '').replace(/[|\]\n]/g, ' ').trim().slice(0, 80) || 'file'

let pasteSeq = 0
// Every clipboard image arrives named "image.png" — stamp it so two pastes
// don't read as one file in the explorer (UploaderDock's rule).
const dePasteName = (f) => {
  if (!/^image\.[a-z0-9]+$/i.test(f.name || '')) return f
  const ext = f.name.split('.').pop()
  const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  return new File([f], `pasted-${ts}-${++pasteSeq}.${ext}`, { type: f.type })
}

// The hex sha256 of a file's bytes — null where SubtleCrypto is not
// available (a non-secure origin), which only skips the duplicate check.
async function sha256Of (file) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (_) { return null }
}

const errText = (e, fallback) => e?.response?.data?.error?.message || e?.message || fallback

export function useLinkCatch ({
  text, setText, author = () => null, labelIds = () => [], scope = () => 'one',
  insertAtCaret = null, onLinkMinted = null, onFileMinted = null
}) {
  const state = reactive({ list: [] })
  const seen = new Map() // scope → Set of the links that are not new there
  let seq = 0
  let timer = null

  const key = () => String(scope() ?? 'one')
  const seenOf = (k) => {
    if (!seen.has(k)) seen.set(k, new Set(findBareLinks(text(k))))
    return seen.get(k)
  }
  const drop = (c) => { state.list = state.list.filter(x => x.key !== c.key) }
  // The document as it stands at mount is the first baseline.
  seenOf(key())

  // The two questions. A failed lookup only means "not known to be a
  // duplicate"; a failed resolve only means "no rule matched".
  const lookup = async (c) => {
    c.ready = false
    const who = author(c.scope) || null
    try {
      if (c.kind === 'link') {
        const [res, dup] = await Promise.allSettled([embedService.resolve(c.url), nodeService.lookupLink(c.url, who)])
        if (res.status === 'fulfilled' && res.value?.success) c.embed = res.value.embed || null
        c.existing = dup.status === 'fulfilled' && dup.value?.success ? (dup.value.existing || null) : null
      } else if (c.sha256) {
        const dup = await nodeService.lookupFile({ sha256: c.sha256, size: c.size }, who).catch(() => null)
        c.existing = dup?.success ? (dup.existing || null) : null
      }
    } finally {
      c.checkedAs = who
      c.ready = true
    }
  }

  const catchUrls = (urls) => {
    const k = key()
    const s = seenOf(k)
    for (const url of urls || []) {
      s.add(url)
      if (state.list.some(c => c.scope === k && c.kind === 'link' && c.url === url)) continue
      state.list.push({ key: ++seq, scope: k, kind: 'link', url, embed: null, existing: null, ready: false, busy: false, error: '' })
      lookup(state.list[state.list.length - 1])
    }
  }

  // `before` = the text before the caret, when the host knows it: a mark is
  // a word in the sentence, so it never lands flush against the last one.
  const catchFiles = async (files, before = '') => {
    const k = key()
    const jobs = Array.from(files || []).map(f => {
      const file = dePasteName(f)
      return { key: ++seq, scope: k, kind: 'file', file, name: file.name, size: file.size, mark: `⟪${refLabelOf(file.name)} #${seq}⟫`, sha256: null, existing: null, ready: false, busy: false, error: file.size > CATCH_FILE_CAP ? 'over the 25 MB upload cap' : '' }
    })
    if (!jobs.length) return
    const lead = before && !/\s$/.test(before) ? ' ' : ''
    if (insertAtCaret) insertAtCaret(lead + jobs.map(j => j.mark).join(' '))
    else setText((text(k) || '') + jobs.map(j => j.mark).join(' '), k)
    for (const j of jobs) {
      state.list.push(j)
      const c = state.list[state.list.length - 1]
      c.sha256 = c.error ? null : await sha256Of(c.file)
      lookup(c)
    }
  }

  // Typing: every pause, the links that appeared — finished — are caught;
  // links that left the text are forgotten (retyping one asks again), and
  // a catch whose URL or mark left the text goes with it.
  const scan = () => {
    const k = key()
    const t = text(k) || ''
    const s = seenOf(k)
    const present = findBareLinks(t)
    for (const url of [...s]) if (!present.includes(url)) s.delete(url)
    state.list = state.list.filter(c => c.busy || c.scope !== k || (c.kind === 'link'
      ? indexOfLink(t, c.url) >= 0
      : t.includes(c.mark)))
    catchUrls(present.filter(url => !s.has(url) && isLinkFinished(t, url)))
  }
  watch(() => [key(), text(key())], ([k], [prevK] = []) => {
    clearTimeout(timer)
    if (k !== prevK) seenOf(k)
    timer = setTimeout(scan, SCAN_MS)
  })
  // The author changed under a standing catch (the maker's author picker):
  // ask the duplicate question again, as the new author.
  watch(() => author(key()), () => {
    for (const c of state.list) if (c.scope === key() && c.ready && !c.busy && c.checkedAs !== (author(c.scope) || null)) lookup(c)
  })
  onBeforeUnmount(() => clearTimeout(timer))

  // A paste: files become catches at the caret (the host prevents the
  // browser's default); text pastes as typed, and its links are caught at
  // once — a pasted link is finished by definition.
  const onPaste = (e) => {
    const files = Array.from(e.clipboardData?.files || [])
    if (files.length) {
      e.preventDefault()
      const el = e.target
      catchFiles(files, typeof el?.value === 'string' ? el.value.slice(0, el.selectionStart ?? el.value.length) : '')
      return true
    }
    const urls = findBareLinks(e.clipboardData?.getData('text/plain') || '')
    if (urls.length) catchUrls(urls)
    return false
  }

  const reset = () => {
    const k = key()
    seen.set(k, new Set(findBareLinks(text(k))))
    state.list = state.list.filter(c => c.scope !== k)
  }

  // The pill takes the URL's place (or the mark's) where it stands; if the
  // text moved under the request it is appended rather than lost. The
  // third argument is where the caret belongs — right after the pill — for
  // a host whose field can hold one.
  const writePill = (c, node, label) => {
    const pill = `-[[pathos:${node.path}|${refLabelOf(label)}]]`
    const t = text(c.scope) || ''
    const at = c.kind === 'link' ? indexOfLink(t, c.url) : t.indexOf(c.mark)
    const gone = c.kind === 'link' ? c.url.length : c.mark.length
    const lead = !t || /\s$/.test(t) ? '' : ' '
    const next = at >= 0 ? t.slice(0, at) + pill + t.slice(at + gone) : t + lead + pill
    setText(next, c.scope, at >= 0 ? at + pill.length : next.length)
  }
  const labelOf = (c, node) => c.kind === 'link'
    ? (c.embed?.provider || node?.provider || node?.embed?.provider || hostOf(c.url))
    : (node?.name || c.name)

  const add = async (c) => {
    if (c.busy || c.error) return
    c.busy = true
    try {
      const who = author(c.scope) || undefined
      if (c.kind === 'link') {
        const r = await nodeService.create({ content: c.url, typeId: 3, labelIds: labelIds(c.scope) || [], authorEntityId: who })
          .catch(e => ({ success: false, error: e?.response?.data?.error || { message: errText(e, 'Could not save the link') } }))
        if (!r.success || !r.node?.path) {
          // 40901 = this exact address is already the author's (a node's
          // hash is its text + owner): a race with the lookup — use it.
          if (r.error?.code === 40901) { await lookup(c); if (c.existing) { c.busy = false; return use(c) } }
          c.error = r.error?.message || 'Invalid link'
          return
        }
        writePill(c, r.node, labelOf(c, r.node))
        drop(c)
        if (onLinkMinted) { try { onLinkMinted(r.node, c) } catch (_) { /* the pill stands */ } }
      } else {
        const fd = new FormData()
        fd.append('files', c.file, c.file.name)
        if (who) fd.append('authorEntityId', who)
        fd.append('labelIds', JSON.stringify(labelIds(c.scope) || []))
        const r = await nodeService.upload(fd)
        const node = r.nodes?.[0]
        if (!node?.path) { c.error = r.errors?.[0]?.message || r.error?.message || 'Could not upload the file'; return }
        writePill(c, node, c.name)
        drop(c)
        if (onFileMinted) { try { onFileMinted(node, c) } catch (_) { /* the pill stands */ } }
      }
    } catch (e) {
      c.error = errText(e, c.kind === 'link' ? 'Could not save the link' : 'Could not upload the file')
    } finally {
      c.busy = false
    }
  }

  // ALREADY THERE: the existing node's pill, nothing minted.
  const use = (c) => {
    if (!c.existing?.path) return
    writePill(c, c.existing, labelOf(c, c.existing))
    drop(c)
  }

  // × — a link stays as typed (and stays seen: it will not ask again while
  // it stands); a file's mark leaves the text with it.
  const dismiss = (c) => {
    if (c.kind === 'file') {
      const t = text(c.scope) || ''
      if (t.includes(c.mark)) setText(t.split(c.mark).join('').replace(/ {2,}/g, ' '), c.scope)
    }
    drop(c)
  }

  const catches = computed(() => state.list.filter(c => c.scope === key() && c.ready))
  const pending = computed(() => state.list.some(c => c.scope === key() && (!c.ready || c.busy)))

  return { catches, pending, catchUrls, catchFiles, onPaste, scan, reset, add, use, dismiss }
}
