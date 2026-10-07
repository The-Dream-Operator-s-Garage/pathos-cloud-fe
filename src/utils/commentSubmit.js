// commentSubmit — THE ONE ROUTE a comment takes from the dashboard
// (2026-10-07, the CommentMaker family). A comment's PARENT is a descriptor
// `{ kind, id, hash, address?, label? }`:
//   kind 'node'                        → POST /nodes/:id/comment
//   kind 'post' | 'comment' | 'skeleton' → POST /skeletons/:id/comment
//   any other kind (path / label / link) → POST /refs/comment by address
// Every one lands on the parent's COMMENTS chain through the server's holder
// rule (api/services/threadService.js). After a success the maker store's
// `lastPosted` signal fires (thread views re-read) and the act goes on the
// navigation trail like the dock's comments do.

import { nodeService } from 'src/services/node.service'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { useMakerStore } from 'src/stores/maker'
import { useNavStore } from 'src/stores/navigation'

const SKELETON_FAMILY = new Set(['post', 'comment', 'skeleton', 'skeletons'])

// The parent's address — what /refs/comment and the draft key read.
export const parentAddress = (p) => {
  if (!p) return ''
  if (p.address) return p.address
  const prefix = SKELETON_FAMILY.has(p.kind) ? 'skeletons' : (p.kind.endsWith('s') ? p.kind : p.kind + 's')
  return p.hash ? `${prefix}/${p.hash}` : ''
}

export const submitComment = async (parent, { content, authorEntityId = null, labelIds = [] }) => {
  const payload = { content, authorEntityId, labelIds }
  const k = parent.kind
  const r = k === 'node' || k === 'nodes'
    ? await nodeService.commentOnNode(parent.id, payload)
    : SKELETON_FAMILY.has(k)
      ? await skeletonService.commentOn(parent.id, payload)
      : await refService.commentOn(parentAddress(parent), payload)
  if (r?.success) {
    const created = r.skeleton || r.post || null
    try { useMakerStore().notePosted(parent, created) } catch (_) { /* signal only */ }
    try {
      useNavStore().recordAction('COMMENT', {
        targetType: k,
        targetId: parent.id ?? null,
        targetLabel: parent.label || 'comment',
        targetPath: created?.path || null
      })
    } catch (_) { /* a comment must never fail because its log did */ }
  }
  return r
}
