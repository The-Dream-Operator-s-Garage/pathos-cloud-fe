// Intra-tree navigation controller for the file tree viewer.
//
// The file tree is a recursive component where each row owns its own
// open/closed state AND (since lazy loading) pages its leaves in 10 at a
// time, so there's no way to reveal an arbitrary element from the outside —
// e.g. when a reference chip inside one element's decoded payload points at
// another element elsewhere in the tree. This controller bridges that gap.
//
// FileTreePage builds it once per loaded tree and `provide()`s it. Reveal
// flow for a lazily-loaded tree:
//   1. if the leaf is already rendered → scroll + flag it, done;
//   2. otherwise ask the API which subtree holds it (`/files/locate`),
//   3. force-open the owner folder (root view) so its kind folders mount,
//   4. hand the hash to that kind folder's `loadUntil` — it pages leaves
//      from the top through the whole batch-of-10 containing the target,
//   5. scroll to the row; the leaf sees `revealKey` match and auto-expands
//      its Mini preview + decoded panel and flashes.
//
// Reactivity contract for consumers (FileTreeNode):
//   - `openIds`     reactive Set of folder uids that must render open.
//   - `revealKey`   ref — '<kind>/<hash>' of the leaf being revealed.
//   - `revealTick`  ref — bumped on every reveal so re-revealing the SAME
//                   leaf still re-triggers the expand/flash watcher.
//   - `registerEl(key, el)`        leaves register their row element.
//   - `registerFolder(key, api)`   lazy folders register { loadUntil }
//                                  under '<owner|global>/<kind>'.

import { reactive, ref, nextTick } from 'vue'
import { parseRef } from 'src/utils/kinds'
import { fileService } from 'src/services/file.service'

export const folderKeyFor = (owner, kind) => `${owner || 'global'}/${kind}`

export function createTreeNav () {
  const openIds = reactive(new Set())
  const revealKey = ref(null)
  const revealTick = ref(0)

  const els = new Map() // '<kind>/<hash>'        -> leaf row element
  const folders = new Map() // '<owner|global>/<kind>' -> { loadUntil }
  const owners = new Map() // ownerHash               -> owner-folder uid
  let uidSeq = 0
  let clearTimer = null

  function reset () {
    openIds.clear()
    els.clear()
    folders.clear()
    owners.clear()
    revealKey.value = null
    uidSeq = 0
  }

  // Walk the (shallow) tree once: assign uids to folder nodes and record
  // owner-folder uids so a reveal can force them open. Leaves aren't in
  // the payload anymore — they register themselves as they mount.
  function buildIndex (tree) {
    reset()
    if (!tree || !Array.isArray(tree.children)) return

    const walk = (node) => {
      if (!Array.isArray(node.children)) return
      node._uid = ++uidSeq
      if (node.kind === 'owner' && node.ownerHash) {
        owners.set(node.ownerHash, node._uid)
      }
      for (const child of node.children) walk(child)
    }
    for (const top of tree.children) walk(top)
  }

  function registerEl (key, el) {
    if (el) els.set(key, el)
    else els.delete(key)
  }

  function registerFolder (key, api) {
    if (api) folders.set(key, api)
    else folders.delete(key)
  }

  // Flag the leaf for expand/flash. Cleared after a beat so a row that
  // re-mounts minutes later (folder closed and reopened) doesn't re-expand.
  function _trigger (key) {
    revealKey.value = key
    revealTick.value += 1
    if (clearTimer) clearTimeout(clearTimer)
    clearTimer = setTimeout(() => {
      if (revealKey.value === key) revealKey.value = null
    }, 3000)
  }

  async function _scrollTo (key) {
    // Two ticks: the first mounts newly-opened folders, the second mounts
    // their leaf rows so the target element exists before we scroll.
    await nextTick()
    await nextTick()
    const el = els.get(key)
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return !!el
  }

  // Reveal the leaf a reference points at. Returns { found } so the caller
  // can decide on a cross-view fallback (e.g. hop to the whole-platform
  // view) when the target isn't reachable from the current tree.
  async function reveal (address) {
    const ref = parseRef(address)
    if (!ref) return { found: false }
    const key = `${ref.prefix}/${ref.hash}`

    // Already rendered → no loading needed.
    if (els.has(key)) {
      _trigger(key)
      await _scrollTo(key)
      return { found: true, key }
    }

    // Ask the API which subtree holds it. A decoded ref usually carries the
    // global form ('nodes/<hash>') even when the file lives under an owner.
    let owner = ref.owner
    if (!owner) {
      try {
        const res = await fileService.locate(address)
        if (!res.found) return { found: false, key }
        owner = res.owner // null → shared root registry
      } catch (_) {
        return { found: false, key }
      }
    }

    // Force the owner folder open so its kind subfolders mount + register.
    if (owner && owners.has(owner)) {
      openIds.add(owners.get(owner))
      await nextTick()
    }

    const folder = folders.get(folderKeyFor(owner, ref.prefix))
    if (!folder) return { found: false, key }

    // Flag before loading so the leaf auto-expands the moment it mounts.
    _trigger(key)
    const loaded = await folder.loadUntil(ref.hash)
    if (!loaded) {
      revealKey.value = null
      return { found: false, key }
    }

    await _scrollTo(key)
    return { found: true, key }
  }

  return {
    openIds,
    revealKey,
    revealTick,
    buildIndex,
    registerEl,
    registerFolder,
    reveal
  }
}
