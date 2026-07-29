// Recursive ancestral recovery for labels — the one shared walk used by
// every tree-shaped label UI (the squares explorer, LabelMicro/LabelMini
// horizontal navs, LabelViewer). Returns the full chain [root, ..., label].
//
// Fast path is the server-side walk (GET /labels/:id/chain). If that call
// fails we fall back to client-side recursion over ancestor_id, one label
// per hop, stopping at NULL or the self-reference root convention
// (ancestor_id = id). A seen-set guards against cycles either way.
import { labelService } from 'src/services/label.service'

export function isRootLabel (label) {
  return !!label && (label.ancestor_id == null || label.ancestor_id === label.id)
}

// Labels worth showing as plain chips on a post surface. Identity leaves
// (the bare DOC marker, the POST provenance family) are dropped — each of
// those is rendered by a dedicated chip or row (doc tag, origin/kind tags)
// wherever this filter is used. Authorship, creation moment, and source
// paths are not labels at all — they come from the element's own fields
// (a doc's source path is line 2 of its CONTENT node).
export function displayLabels (labels) {
  return (labels || []).filter(l => {
    const root = l.chain?.[0]?.name
    if (root !== 'PATHCHAIN') return true
    const parent = l.chain?.[1]?.name
    if (parent === 'POST') return false
    if (parent === 'DOC' && l.chain?.length === 2) return false
    return true
  })
}

export async function recoverAncestry (labelOrId) {
  const id = typeof labelOrId === 'object' && labelOrId !== null ? labelOrId.id : labelOrId
  if (!id) return []
  try {
    const res = await labelService.getChain(id)
    if (res.success && Array.isArray(res.chain) && res.chain.length) return res.chain
  } catch (_) { /* fall back to the client-side climb */ }
  const seed = typeof labelOrId === 'object' && labelOrId !== null ? labelOrId : null
  return climb(seed, id, new Set())
}

async function climb (label, id, seen) {
  if (seen.has(id)) return []
  seen.add(id)
  let row = label
  if (!row) {
    try { row = (await labelService.get(id)).label } catch (_) { return [] }
  }
  if (!row) return []
  if (isRootLabel(row)) return [row]
  const above = await climb(null, row.ancestor_id, seen)
  return [...above, row]
}
