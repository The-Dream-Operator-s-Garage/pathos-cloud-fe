// Comment-thread navigation: given a COMMENT skeleton id, open the ROOT
// of its thread (the originating post or node) and unravel the comment
// tree down to it. The viewer pages read the `unravel` query param — a
// comma-separated chain of comment skeleton ids below the root — and
// auto-expand replies along it, highlighting the final target.
import { skeletonService } from 'src/services/skeleton.service'

export async function gotoCommentThread (router, commentId) {
  try {
    const r = await skeletonService.thread(commentId)
    const chain = (r.success && r.chain) || []
    if (chain.length) {
      const root = chain[0]
      const rest = chain.slice(1).filter(e => e.kind === 'post').map(e => e.id)
      const base = root.kind === 'node' ? `/nodes/${root.id}` : `/posts/${root.id}`
      router.push(rest.length ? `${base}?unravel=${rest.join(',')}` : base)
      return true
    }
  } catch (_) { /* fall back to the comment's own post view */ }
  router.push(`/posts/${commentId}`)
  return false
}

// Parse the viewer's `unravel` query param into an int id chain.
export function parseUnravel (queryValue) {
  if (!queryValue) return []
  return String(queryValue).split(',').map(s => parseInt(s)).filter(Number.isFinite)
}
