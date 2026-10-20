// The dashboard LAYOUT tree — the client's EDITING ops over the grammar the
// API normalizes (`api/utils/dashboardLayout.js` is the one statement of
// the shape; this module never invents a node form the server would not
// accept). Phase 9, 2026-10-19 — replaces `splitTree.js` (phase 5's
// dashboard-only split canvas).
//
//   node := { split: 'h'|'v', ratio, children: [node, node] }
//         | { leaf: '<kind>/<hash>' }       a slot holding ANY element
//         | { leaf: null }                  an empty slot
//         | { slot: 'FIELD', leaf? }        a template slot (+ its binding)
//         | { virtual: 'session-activity' } the one virtual cell
//
// The ops MUTATE the node they are handed. That is the design: the tree is
// ONE reactive object owned by DashboardBoard, DashboardSplit panes hold
// references INTO it, and a change anywhere is the owner's to save (the
// component emits `changed`, the owner debounces saveLayout — the NOTE
// versions, arrangements are history).

// THE minimum pane size on the split's axis — a divider may not be dragged
// past it. Stated ONCE, here (the keep-in-step law).
export const MIN_PANE_W = 120
export const MIN_PANE_H = 80
export const RATIO_MIN = 0.1
export const RATIO_MAX = 0.9

export const isSplit = (n) => !!n && Array.isArray(n.children) && n.children.length === 2
export const isLeaf = (n) => !!n && !isSplit(n)
export const isEmptyLeaf = (n) => isLeaf(n) && !n.leaf && !n.virtual
export const isFilled = (n) => isLeaf(n) && !!(n.leaf || n.virtual)

export const emptyLeaf = () => ({ leaf: null })

// Clamp a proposed ratio so both panes keep the MIN on the split's axis
// (sizePx = the container's px size on that axis). A split too small to
// honour both minimums pins its divider mid-way.
export const clampRatio = (ratio, sizePx, horizontal) => {
  const min = horizontal ? MIN_PANE_W : MIN_PANE_H
  const lo = Math.max(RATIO_MIN, Math.min(min / sizePx, 0.5))
  const hi = Math.min(RATIO_MAX, Math.max(1 - min / sizePx, 0.5))
  return Math.min(hi, Math.max(lo, ratio))
}

export const setRatio = (node, ratio) => { node.ratio = Math.round(ratio * 1000) / 1000 }

// Split a leaf in two: what it held moves to pane 0, pane 1 opens empty.
export const splitLeaf = (node, dir) => {
  const kept = {}
  if (node.leaf) kept.leaf = node.leaf
  if (node.slot) kept.slot = node.slot
  if (node.virtual) kept.virtual = node.virtual
  for (const k of Object.keys(node)) delete node[k]
  Object.assign(node, {
    split: dir === 'v' ? 'v' : 'h',
    ratio: 0.5,
    children: [Object.keys(kept).length ? kept : emptyLeaf(), emptyLeaf()]
  })
}

export const clearLeaf = (node) => {
  delete node.leaf
  delete node.virtual
  node.leaf = null
}

export const setLeaf = (node, ref) => {
  delete node.virtual
  node.leaf = ref
}

// JOIN — collapse a split into ONE of its panes (the one kept). The
// parent is what the divider's join button hands here; the kept child's
// content becomes the node's.
export const joinSplit = (node, keepIndex = 0) => {
  if (!isSplit(node)) return
  const kept = node.children[keepIndex] || emptyLeaf()
  for (const k of Object.keys(node)) delete node[k]
  Object.assign(node, JSON.parse(JSON.stringify(kept)))
}

export const walk = (n, fn) => {
  if (!n) return
  fn(n)
  if (isSplit(n)) { walk(n.children[0], fn); walk(n.children[1], fn) }
}

// Every concrete ref the tree's leaves cite.
export const leafRefs = (root) => {
  const out = []
  walk(root, (n) => { if (isLeaf(n) && n.leaf) out.push(n.leaf) })
  return [...new Set(out)]
}

export const countLeaves = (root) => {
  let c = 0
  walk(root, (n) => { if (isLeaf(n)) c += 1 })
  return c
}

export const countFilled = (root) => {
  let c = 0
  walk(root, (n) => { if (isFilled(n)) c += 1 })
  return c
}

export const depthOf = (n, d = 0) => (isSplit(n) ? Math.max(depthOf(n.children[0], d + 1), depthOf(n.children[1], d + 1)) : d)

// A deep plain copy for the wire.
export const plain = (root) => JSON.parse(JSON.stringify(root))
