// The split-tree grammar (dashboards phase 5, 2026-08-10) — the LAYOUT
// NOTE's `split` member, and every operation the canvas performs on it:
//
//   { dir: 'h'|'v', ratio, children: [node, node] } | { leaf: ref|null }
//
// The ops MUTATE the node they are handed. That is the design, not an
// accident: the tree is ONE reactive object owned by DashboardGrid's
// layout ref, SplitLayout panes hold references INTO it, and a change
// anywhere is the owner's to save (the component emits `changed`, the
// owner debounces saveLayout — the NOTE versions, arrangements are
// history). Stated here as a plain module so the grammar reads in one
// place and the components stay declarative.

// THE minimum slot size — a divider may not be dragged past it, and a
// pane below it anyway (window shrink) swaps content for its name plate.
// No nonsense layouts. Stated ONCE, here; a restated copy elsewhere owes
// an fsck --static witness (the keep-in-step law).
export const MIN_PANE_W = 240
export const MIN_PANE_H = 160

export const isSplit = (n) => !!n?.children
export const isEmptyLeaf = (n) => !!n && !n.children && !n.leaf

// Clamp a proposed ratio so both panes keep the MIN on the split's main
// axis (sizePx = the container's px size on that axis). A split too small
// to honor both minimums pins the divider mid-way.
export const clampRatio = (ratio, sizePx, horizontal) => {
  const min = horizontal ? MIN_PANE_W : MIN_PANE_H
  const lo = Math.min(min / sizePx, 0.5)
  const hi = Math.max(1 - min / sizePx, 0.5)
  return Math.min(hi, Math.max(lo, ratio))
}

export const setRatio = (node, ratio) => { node.ratio = ratio }

// Split a leaf in two: what it held moves to the first pane, the second
// opens empty.
export const splitLeaf = (node, dir) => {
  const current = node.leaf ?? null
  delete node.leaf
  Object.assign(node, {
    dir,
    ratio: 0.5,
    children: [{ leaf: current }, { leaf: null }]
  })
}

export const clearLeaf = (node) => { node.leaf = null }

export const dropOnLeaf = (node, ref) => { node.leaf = ref }

// Collapse a split whose panes are BOTH empty back into one empty slot.
export const fuseSplit = (node) => {
  delete node.dir
  delete node.ratio
  delete node.children
  node.leaf = null
}

// Every ref the tree's leaves cite (the export's ITEMS list).
export const leafRefs = (node, out = []) => {
  if (!node) return out
  if (node.children) { node.children.forEach((c) => leafRefs(c, out)); return out }
  if (node.leaf) out.push(node.leaf)
  return out
}
