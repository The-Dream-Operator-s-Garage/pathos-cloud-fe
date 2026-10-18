// AN ELEMENT → ITS WINDOW TARGET (2026-10-18 — lifted out of MiniHead's
// corner the day the mini family got a second door, the SIDE door: "if i
// click on the item (its title) … make the item be opened on the side
// viewer"). Both doors must resolve an element the same way:
//   · an ENTITY by id through the entity door (the face re-reads the row);
//   · a POST on its SKELETON address (a post's path is `skeletons/<hash>`,
//     and the ref door steps a POST instance forward to its card);
//   · everything else through the ref door, the hash learnt off the cached
//     summary when only an id is known.
// Resolves to a `flyoutViewers.spawn` target, or null.
import { hashOf, prefixFor } from 'src/utils/kinds'
import { elementSummary } from 'src/utils/elementSummary'

export async function elementTarget ({ kind, id = null, path = '' } = {}) {
  const p = prefixFor(kind || '')
  if (!p) return null
  if (p === 'entities' && id != null) {
    const n = parseInt(id, 10)
    if (n) return { kind: 'entity', entity: path ? { id: n, path } : { id: n } }
  }
  let h = hashOf(path || '')
  if (!h && id != null) {
    const s = await elementSummary({ prefix: p, id })
    h = s?.hash || null
  }
  return h ? { kind: 'ref', ref: `${p === 'posts' ? 'skeletons' : p}/${h}` } : null
}
