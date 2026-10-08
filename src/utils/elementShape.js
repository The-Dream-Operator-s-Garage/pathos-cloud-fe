// THE ELEMENT SHAPE RESOLVER (2026-10-08, the card family) — ONE table that
// turns a reference into the per-kind row the viewer families draw.
//
// Born inside `shared/ElementMini.vue` (its `fromElement` / `fromAddress` /
// `fetchPost`, 2026-07 → 2026-09-30's family map) and lifted out the day the
// CARD family arrived: `ElementCard` dispatches on the very same shapes, and
// two dispatchers each carrying a private copy of the read table is how the
// `posts/` and `files/` aliases came to work on one surface and not the
// other for two months. Both families call this; a kind learnt here is
// learnt by both.
//
// A shape is `{ kind, …row }`:
//   node     { node }
//   path     { path (+ author = the owner), steps }
//   post     { post }          — PostMini's trimmed read of GET /posts/:id
//   label    { label }
//   entity   { entity, moment, labels, organization }   (the extras ride
//            along for the card; the Mini reads `entity` alone)
//   moment   { moment, human }
//   link     { link, target, parentPath, prev, next, owner, moment }
//   secret   { secret, owner, receiver }
//   skeleton { skeletonId, skeletonName }  — a non-POST skeleton (schema
//            or populated instance); the viewers walk it themselves
//   locked   {}                — the summary's locked stub (403 reads)
//   null     {}                — unresolvable (the InfoChip fallback)
import { nodeService } from 'src/services/node.service'
import { pathService } from 'src/services/path.service'
import { postService } from 'src/services/post.service'
import { labelService } from 'src/services/label.service'
import { entityService } from 'src/services/entity.service'
import { momentService } from 'src/services/moment.service'
import { linkService } from 'src/services/link.service'
import { secretService } from 'src/services/secret.service'
import { refService } from 'src/services/ref.service'
import { bodyOf } from 'src/utils/nodeContent'
import { safeCut } from 'src/utils/pathosRefs'

const NONE = () => ({ kind: null })

// '<kind>/<hash>' (optionally owner-scoped, optionally `pathos:`-prefixed)
// → { prefix, hash } off the LAST two segments, or null.
export const normAddress = (addr) => {
  const parts = String(addr || '').trim().replace(/^pathos:/, '').split('/')
  return parts.length >= 2
    ? { prefix: parts[parts.length - 2], hash: parts[parts.length - 1] }
    : null
}

// A POST read trimmed to what a quoted post states (PostMini's contract):
// the read carries no author object and no votes, so the shape names the
// OWNER by id and the content node's birth. The body is RAW markdown cut
// without splitting a [[pathos:…]] token (2026-10-07) — the Mini renders
// its refs as live slots.
export async function fetchPostShape (id) {
  try {
    const r = await postService.get(id)
    if (r.success && r.post) {
      const p = r.post
      return {
        kind: 'post',
        post: {
          id: p.id,
          path: p.path,
          title: p.title,
          excerpt: safeCut(bodyOf(p.node) || '', 1200),
          body: bodyOf(p.node) || '',
          owner_id: p.owner_id ?? null,
          created_at: p.created_at || p.node?.createdAt || null,
          forked_from_id: p.forked_from_id ?? null,
          labels: p.labels || []
        }
      }
    }
  } catch (_) { /* chip fallback */ }
  return NONE()
}

// A PRE-RESOLVED target ({ kind, node|label|path|skeleton|entity|moment|
// link|secret } — pathService.resolveLinkTarget's rows) → its shape.
export async function shapeFromElement (el) {
  if (!el) return NONE()
  if (el.kind === 'node' && el.node) return { kind: 'node', node: el.node }
  if (el.kind === 'label' && el.label) return { kind: 'label', label: el.label }
  if (el.kind === 'entity' && el.entity) return { kind: 'entity', entity: el.entity, moment: el.moment || null, labels: el.labels || [], organization: el.organization || null }
  // (2026-09-30 — the family map's dispatch gaps) a walk's MOMENT, LINK and
  // SECRET targets carry their rows since pathService's resolver learnt
  // them; before, a path member of those kinds fell through to the chip.
  if (el.kind === 'moment' && el.moment) return { kind: 'moment', moment: el.moment, human: el.human || null }
  if (el.kind === 'link' && el.link) {
    return {
      kind: 'link',
      link: el.link,
      target: el.target || null,
      parentPath: el.parentPath || null,
      prev: el.prev || null,
      next: el.next || null,
      owner: el.owner || null,
      moment: el.moment || null
    }
  }
  if (el.kind === 'secret' && el.secret) return { kind: 'secret', secret: el.secret, owner: el.owner || null, receiver: el.receiver || null }
  if (el.kind === 'path' && el.path) {
    // Fetch the walked steps so the viewer can draw its lane.
    try {
      const r = await pathService.byId(el.path.id, 'forward')
      if (r.success) return { kind: 'path', path: { ...r.path, author: r.owner }, steps: r.steps }
    } catch (_) { /* fall through */ }
    return { kind: 'path', path: el.path, steps: null }
  }
  if (el.kind === 'skeleton' && el.skeleton) {
    // POST instances read as posts; every other skeleton (schema or
    // populated instance) is walked by the viewer.
    if (el.skeleton.name === 'POST') return fetchPostShape(el.skeleton.id)
    return { kind: 'skeleton', skeletonId: el.skeleton.id, skeletonName: el.skeleton.name || '' }
  }
  return NONE()
}

// An ADDRESS → its shape, one read per kind (+ the `posts/` and `files/`
// aliases, 2026-09-30).
export async function shapeFromAddress (addr) {
  const ref_ = normAddress(addr)
  if (!ref_) return NONE()
  const address = `${ref_.prefix}/${ref_.hash}`
  try {
    switch (ref_.prefix) {
      case 'nodes': {
        const r = await nodeService.getByPath(ref_.hash)
        return r.success ? { kind: 'node', node: r.node } : NONE()
      }
      case 'paths': {
        const r = await pathService.byHash(ref_.hash, 'forward')
        return r.success ? { kind: 'path', path: { ...r.path, author: r.owner }, steps: r.steps } : NONE()
      }
      // A POST is a skeleton by address; a `posts/<hash>` ref (the pill's own
      // spelling) resolves exactly as its `skeletons/<hash>` twin —
      // /refs/summary maps the prefix itself.
      case 'posts':
      case 'skeletons': {
        const s = await refService.summary(address)
        // The locked stub CARRIES an id (the hash stays visible by doctrine)
        // — check locked FIRST or a private skeleton mounts a grid that 403s
        // on every field.
        if (s.success && s.summary?.locked) return { kind: 'locked' }
        if (!s.success || s.summary?.id == null) return NONE()
        if ((s.summary.route || '').startsWith('/posts/')) return fetchPostShape(s.summary.id)
        return { kind: 'skeleton', skeletonId: s.summary.id, skeletonName: s.summary.primary || '' }
      }
      case 'labels': {
        const s = await refService.summary(address)
        if (!s.success || s.summary?.id == null) return NONE()
        const r = await labelService.get(s.summary.id)
        return r.success ? { kind: 'label', label: r.label } : NONE()
      }
      // `files/<hash>` is the entity REGISTRY's alias (kinds.js) — the same
      // entity, the same viewer.
      case 'files':
      case 'entities': {
        const s = await refService.summary(`entities/${ref_.hash}`)
        if (!s.success || s.summary?.id == null) return NONE()
        const r = await entityService.get(s.summary.id)
        return r.success
          ? { kind: 'entity', entity: r.entity, moment: r.moment || null, labels: r.labels || [], organization: r.organization || null }
          : NONE()
      }
      case 'moments': {
        const r = await momentService.getByHash(ref_.hash)
        return r.success ? { kind: 'moment', moment: r.moment, human: r.human } : NONE()
      }
      case 'links': {
        const r = await linkService.getByHash(ref_.hash)
        return r.success
          ? { kind: 'link', link: r.link, target: r.target, parentPath: r.parentPath, prev: r.prev || null, next: r.next || null, owner: r.owner || null, moment: r.moment || null }
          : NONE()
      }
      case 'secrets': {
        // (2026-09-21) A secret has a viewer of its own — the sealed card
        // with its parties; the chip fallback stays for anything the read
        // refuses.
        const r = await secretService.getByHash(ref_.hash)
        return r?.success && r.secret
          ? { kind: 'secret', secret: r.secret, owner: r.owner || null, receiver: r.receiver || null }
          : NONE()
      }
      default:
        return NONE()
    }
  } catch (_) {
    return NONE()
  }
}

// THE ONE ENTRY: a pre-resolved target wins over an address; an address
// that resolves to nothing is asked once more whether it is LOCKED (the
// access doctrine's 403 reads — the summary endpoint says so with its
// locked stub), so the viewer draws the lock-bubbled chip, not a blank.
export async function resolveElementShape ({ address = '', element = null } = {}) {
  let shape = element ? await shapeFromElement(element) : await shapeFromAddress(address)
  if (shape.kind === null && address) {
    try {
      const s = await refService.summary(String(address).replace(/^pathos:/, ''))
      if (s.success && s.summary?.locked) shape = { kind: 'locked' }
    } catch (_) { /* stay on the chip fallback */ }
  }
  return shape
}
