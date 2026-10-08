// LABEL BUNDLES (2026-10-08, the card family) — the feed card's label rail
// grammar, lifted into a util so every card draws classification the one
// way the post card does (`posts/FeedStream.vue` `labelPaths` /
// `labelBundles` / `bundleOrigin`, 2026-08-10 → 2026-09-22 PM7).
//
// INPUT: the API's label rows as the feed / the skeleton-labels / the
// entity read hand them — `{ id, name, chain: [{ id, name }…],
// system_label?, owner? }`. A row with no chain stands as its own one-step
// chain (a bare `{ id, name }` still draws).
//
// `labelPaths(labels)` → one entry per LEAF path (a path that is a prefix of
// another on the same element is folded into the longer one), each
// `{ id, names, path, rootId, system, owner }`, plumbing (PATHCHAIN) last.
// `labelBundles(labels)` → one plate per ROOT + ORIGIN (`rootId:platform |
// rootId:ownerId`): `{ key, root, platform, owner, items: [{ id, path,
// names (the TAIL — the root is the plate's head) }] }`.
// `bundleOrigin(b, nameOf)` → the plate head's words (tooltip / aria).

export function labelPaths (labels) {
  const rows = (labels || [])
    .filter((l) => l && (l.chain?.length || l.name))
    .map((l) => ({ ...l, chain: l.chain?.length ? l.chain : [{ id: l.id, name: l.name }] }))
  const keyOfChain = (l) => l.chain.map((c) => c.id).join('>')
  const keys = rows.map(keyOfChain)
  return rows
    .filter((l, i) => !keys.some((k, j) => j !== i && k.startsWith(`${keys[i]}>`)))
    .map((l) => ({
      id: l.id,
      names: l.chain.map((c) => c.name),
      path: l.chain.map((c) => c.name).join(' > '),
      rootId: l.chain[0].id,
      system: !!l.system_label,
      owner: l.owner || null
    }))
    .sort((a, b) => {
      const plumbing = (p) => (p.names[0] === 'PATHCHAIN' ? 1 : 0)
      return plumbing(a) - plumbing(b) || a.path.localeCompare(b.path)
    })
}

export function labelBundles (labels) {
  const groups = new Map()
  for (const lp of labelPaths(labels)) {
    const key = `${lp.rootId}:${lp.system ? 'platform' : (lp.owner?.id ?? '?')}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        root: lp.names[0],
        platform: lp.system,
        owner: lp.system ? null : lp.owner,
        items: []
      })
    }
    groups.get(key).items.push({
      id: lp.id,
      path: lp.path,
      names: lp.names.length > 1 ? lp.names.slice(1) : lp.names
    })
  }
  return [...groups.values()]
}

export function bundleOrigin (b, nameOf = (o) => o?.display_name || o?.username || `entity #${o?.id}`) {
  if (b.platform) return `${b.root} — the platform's own labels (verified)`
  return b.owner ? `${b.root} — labels by ${nameOf(b.owner)}` : b.root
}
