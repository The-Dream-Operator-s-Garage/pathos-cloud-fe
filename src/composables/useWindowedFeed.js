// useWindowedFeed — THE RING OF BLOCKS (2026-10-07, user ask: "I cannot scroll
// more than 20 items … load the content as the user scrolls down, in ordered
// tiny blocks … as we go past a part of the feed and move down, we should
// delete some of the latest blocks and then use the new available space to
// fit inside the new loaded stuff. Like a circular linked list made out of
// loaded content blocks. We're going to need this kind of structure on all
// feed containers").
//
// THE SHAPE. A feed is read as a sequence of BLOCKS — ordered pages of
// `blockSize` items, block i = `GET …?page=i+1&limit=blockSize`. At any
// moment at most `maxLive` consecutive blocks are MOUNTED; they form a
// window that slides along the feed as the reader scrolls. The blocks the
// window has passed are unmounted and replaced by ONE spacer above the
// window whose height is the sum of their MEASURED heights, and the blocks
// not reached yet by one spacer below whose height is estimated from the
// average measured block, so the scroller's track represents the WHOLE feed
// from the first load: the thumb can be dragged to the end and the window
// jumps there (random access — page N is one request away). Scrolling back
// re-mounts dropped blocks from an LRU cache (no second fetch) and the top
// spacer gives their height back. The window is the "circular list": a
// fixed number of slots, the oldest slot recycled for the newest block.
//
// THE CONTRACT (what a feed container hands in):
//   fetchBlock(index)  async → { items, total, filtered? } — the page read.
//                      `total` = how many items the feed holds under its
//                      current lenses (the server's count; a FLOOR when
//                      `filtered` is true — JS post-filters, see
//                      feedService). A block shorter than `blockSize` is the
//                      END of the feed.
//   blockSize          items per block (10 — one or two screens of cards)
//   maxLive            blocks mounted at once (4 → 40 cards in the DOM)
//   cacheMax           blocks kept after unmounting (24 → 240 items)
//   overscan           px of lead beyond the viewport on each side at
//                      which the next block is wanted (600)
//   estimateItemH      px per item before any block is measured (320)
//   scrollEl           ref → the scrolling element (the feed's well)
//   gap                () → px between blocks (the stream's flex row-gap;
//                      a spacer standing for n blocks is Σ h + (n−1)·gap,
//                      since the flex gap after the spacer counts as the
//                      n-th) — read, never hard-coded
//   keyOf(item)        the identity used to drop duplicates when offset
//                      pages drift (a post landed on top while reading:
//                      page k+1 repeats page k's last row)
//
// WHAT IT RETURNS (reactive):
//   blocks       [{ index, items }] — the live window, ascending, contiguous
//   items        the live items flattened (what the old `items` ref was)
//   total        the feed's count (the head box's number)
//   totalBlocks  how many blocks the feed has (known or estimated)
//   loading      true while block 0 of a fresh load is in flight
//   fetchingAbove / fetchingBelow   a block is in flight on that side
//   topSpacer / bottomSpacer        px — render as empty divs (v-if > 0)
//   reset()      forget everything, scroll to the top, load block 0 (the
//                lens changed, a verdict applied…) — resolves when block 0
//                is in the window
//   refresh()    refetch the live blocks in place (same window, same
//                scroll position)
//   bindBlock(index) → the template `:ref` callback for the block's
//                element (measures it; unobserves on unmount)
//
// SCROLL ANCHORING. A block ABOVE the viewport that changes height (one
// re-mounted from the top with a height other than its estimate, an image
// inside it loading late) would shift what the reader is looking at; its
// delta is added to scrollTop in the same measurement so the view holds
// still. The well sets `overflow-anchor: none` so Chrome's own anchoring
// does not correct the same shift twice.
//
// docs/concepts/feed-windowing.md is the pattern's home — read it before
// giving a new feed container this structure.

import { ref, shallowRef, computed, watch, onBeforeUnmount } from 'vue'

export const FEED_BLOCK_SIZE = 10
export const FEED_LIVE_BLOCKS = 4

export function useWindowedFeed ({
  fetchBlock,
  blockSize = FEED_BLOCK_SIZE,
  maxLive = FEED_LIVE_BLOCKS,
  cacheMax = 24,
  overscan = 600,
  estimateItemH = 320,
  scrollEl,
  gap = () => 0,
  keyOf = (it) => it?.skeleton_id ?? it?.id
} = {}) {
  const blocks = shallowRef([])
  const total = ref(0)
  const filtered = ref(false)
  const loading = ref(false)
  const inFlight = ref(new Set())
  const knownEnd = ref(null) // index of the LAST block once a short one was read
  const maxLoaded = ref(-1)
  const topSpacer = ref(0)
  const bottomSpacer = ref(0)

  const heights = new Map() // index → measured px (the block element alone)
  const cache = new Map() // index → items, insertion order = LRU order
  const observers = new Map() // index → ResizeObserver
  const wanted = new Set() // indices the window should hold right now
  let generation = 0 // bumps on reset — a stale fetch is dropped
  let avgH = estimateItemH * blockSize
  let scrollFrame = 0

  const totalBlocks = computed(() => {
    if (knownEnd.value != null) return knownEnd.value + 1
    const byTotal = Math.ceil((total.value || 0) / blockSize)
    // A floor total keeps one block of headroom until the end is seen.
    return filtered.value ? Math.max(byTotal, maxLoaded.value + 2) : byTotal
  })

  const items = computed(() => blocks.value.flatMap((b) => b.items))

  const liveRange = () => {
    const b = blocks.value
    return b.length ? { first: b[0].index, last: b[b.length - 1].index } : null
  }
  // With no live block (a jump dropped them all), everything in flight is
  // "below" — the bottom spacer starts at the wanted range, so its spinner
  // stands where the cards are about to appear.
  const fetchingAbove = computed(() => {
    const r = liveRange()
    for (const i of inFlight.value) if (r && i < r.first) return true
    return false
  })
  const fetchingBelow = computed(() => {
    const r = liveRange()
    for (const i of inFlight.value) if (!r || i > r.last) return true
    return false
  })

  const hOf = (i) => heights.get(i) ?? avgH
  const gapPx = () => Number(gap()) || 0

  // The y where block i begins, with every block before it at its measured
  // (or estimated) height plus one gap each.
  const offsetOf = (i) => {
    const g = gapPx()
    let y = 0
    for (let j = 0; j < i; j++) y += hOf(j) + g
    return y
  }

  // The spacers hold the track for every block that is not mounted. ⚠ THE
  // TRACK NEVER COLLAPSES: when a jump (the thumb dragged, a restored
  // reading spot) drops every live block before the new ones arrive, the
  // two spacers split the WHOLE track at the wanted range — a stream that
  // shrank to nothing for one frame would have its scrollTop clamped to 0
  // by the browser, and the scroll that asked for those blocks would be
  // undone before they landed (the restore landed on block 0 that way).
  const recomputeSpacers = () => {
    const r = liveRange()
    const g = gapPx()
    const n = totalBlocks.value
    if (n <= 0) {
      topSpacer.value = 0
      bottomSpacer.value = 0
      return
    }
    if (!r) {
      const split = wanted.size ? Math.min(...wanted) : 0
      let top = 0
      for (let j = 0; j < split; j++) top += hOf(j) + g
      topSpacer.value = split > 0 ? Math.max(0, top - g) : 0
      let rest = 0
      for (let j = split; j < n; j++) rest += hOf(j) + g
      bottomSpacer.value = Math.max(0, rest - g)
      return
    }
    let top = 0
    for (let j = 0; j < r.first; j++) top += hOf(j) + g
    topSpacer.value = r.first > 0 ? Math.max(0, top - g) : 0
    let bottom = 0
    for (let j = r.last + 1; j < n; j++) bottom += hOf(j) + g
    bottomSpacer.value = n > r.last + 1 ? Math.max(0, bottom - g) : 0
  }

  const refreshAvg = () => {
    // Full blocks only — a short last block would drag the estimate down.
    let sum = 0; let k = 0
    for (const b of blocks.value) {
      if (b.items.length === blockSize && heights.has(b.index)) { sum += heights.get(b.index); k++ }
    }
    if (k) avgH = sum / k
  }

  // LRU: re-insert to mark fresh; evict the oldest blocks NOT in the window.
  const touchCache = (index, list) => {
    cache.delete(index)
    cache.set(index, list)
    if (cache.size <= cacheMax) return
    for (const k of [...cache.keys()]) {
      if (cache.size <= cacheMax) break
      if (!wanted.has(k)) cache.delete(k)
    }
  }

  // Insert a block's items into the live window, in order, minus any item a
  // neighbouring live block already shows (offset drift).
  const place = (index, list) => {
    if (!wanted.has(index)) return
    const seen = new Set()
    for (const b of blocks.value) if (b.index !== index) for (const it of b.items) seen.add(keyOf(it))
    const own = list.filter((it) => !seen.has(keyOf(it)))
    const next = blocks.value.filter((b) => b.index !== index)
    next.push({ index, items: own })
    next.sort((a, b) => a.index - b.index)
    blocks.value = next
    recomputeSpacers()
  }

  const fetchOne = async (index) => {
    if (inFlight.value.has(index)) return
    const gen = generation
    const set = new Set(inFlight.value); set.add(index); inFlight.value = set
    let result = null
    try {
      result = await fetchBlock(index)
    } catch (_) { result = null }
    const done = new Set(inFlight.value); done.delete(index); inFlight.value = done
    if (gen !== generation) return
    if (!result) return
    const list = Array.isArray(result.items) ? result.items : []
    if (typeof result.total === 'number') total.value = result.total
    filtered.value = !!result.filtered
    if (index > maxLoaded.value) maxLoaded.value = index
    if (list.length < blockSize) {
      const end = list.length ? index : index - 1
      if (knownEnd.value == null || end < knownEnd.value) knownEnd.value = end
    }
    touchCache(index, list)
    place(index, list)
  }

  // Make the window hold exactly the blocks of [a, b] (plus what is already
  // live and still fits), fetching or recalling what is missing.
  const ensure = (a, b) => {
    const n = totalBlocks.value
    if (n <= 0 && knownEnd.value != null) { wanted.clear(); blocks.value = []; recomputeSpacers(); return }
    a = Math.max(0, a)
    b = Math.min(Math.max(n - 1, 0), b)
    if (b < a) b = a
    if (b - a + 1 > maxLive) b = a + maxLive - 1
    const r = liveRange()
    let first = a; let last = b
    if (r && b >= r.first - 1 && a <= r.last + 1) {
      // Overlapping or adjacent: extend, then trim the far side to maxLive.
      first = Math.min(a, r.first)
      last = Math.max(b, r.last)
      while (last - first + 1 > maxLive) {
        if (first < a) first++
        else if (last > b) last--
        else break
      }
    }
    wanted.clear()
    for (let i = first; i <= last; i++) wanted.add(i)
    const kept = blocks.value.filter((bl) => wanted.has(bl.index))
    if (kept.length !== blocks.value.length) { blocks.value = kept; recomputeSpacers() }
    for (let i = first; i <= last; i++) {
      if (blocks.value.some((bl) => bl.index === i)) continue
      if (cache.has(i)) place(i, cache.get(i))
      else fetchOne(i)
    }
  }

  // Which blocks the viewport (plus overscan) covers right now.
  const neededRange = () => {
    const el = scrollEl?.value
    const n = totalBlocks.value
    if (!el || n <= 0) return null
    const g = gapPx()
    const yTop = Math.max(0, el.scrollTop - overscan)
    const yBot = el.scrollTop + el.clientHeight + overscan
    let y = 0; let a = -1; let b = -1
    for (let i = 0; i < n; i++) {
      const h = hOf(i) + g
      if (a === -1 && y + h > yTop) a = i
      if (y < yBot) b = i
      else break
      y += h
    }
    if (a === -1) a = n - 1
    if (b === -1) b = a
    return { a, b }
  }

  const onScroll = () => {
    if (scrollFrame) return
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0
      const r = neededRange()
      if (r) ensure(r.a, r.b)
    })
  }

  // ── block measurement ─────────────────────────────────────────────
  // One memoized `:ref` callback per index: a fresh closure every render
  // would make Vue unbind (null) and rebind the element on each patch, and
  // the observer would re-measure for nothing.
  const binders = new Map()
  const bindBlock = (index) => {
    if (binders.has(index)) return binders.get(index)
    const fn = (el) => {
      const old = observers.get(index)
      if (old) { old.disconnect(); observers.delete(index) }
      if (!el || typeof ResizeObserver === 'undefined') return
      const ro = new ResizeObserver(() => {
        const h = el.getBoundingClientRect().height
        if (!(h > 0)) return
        const prev = heights.get(index) ?? avgH
        heights.set(index, h)
        refreshAvg()
        const sc = scrollEl?.value
        // A block WHOLLY above the reading line changed height: hold the view
        // still. (A block the reading line runs through is left alone — the
        // change may be above or below the line, and guessing moves the view
        // more often than it holds it.)
        if (sc && prev !== h && offsetOf(index) + prev <= sc.scrollTop) sc.scrollTop += (h - prev)
        recomputeSpacers()
      })
      ro.observe(el)
      observers.set(index, ro)
    }
    binders.set(index, fn)
    return fn
  }

  // ── lifecycle ────────────────────────────────────────────────────
  const reset = async () => {
    generation++
    for (const ro of observers.values()) ro.disconnect()
    observers.clear()
    wanted.clear()
    blocks.value = []
    cache.clear()
    heights.clear()
    inFlight.value = new Set()
    knownEnd.value = null
    maxLoaded.value = -1
    total.value = 0
    filtered.value = false
    avgH = estimateItemH * blockSize
    topSpacer.value = 0
    bottomSpacer.value = 0
    const el = scrollEl?.value
    if (el) el.scrollTop = 0
    loading.value = true
    wanted.add(0)
    await fetchOne(0)
    loading.value = false
    // The viewport may be taller than block 0 — fill it.
    const r = neededRange()
    if (r) ensure(r.a, r.b)
  }

  const refresh = async () => {
    const live = [...wanted]
    for (const i of live) cache.delete(i)
    await Promise.all(live.map((i) => fetchOne(i)))
  }

  let scrollerRO = null
  const attach = (el, old) => {
    if (old) old.removeEventListener('scroll', onScroll)
    if (scrollerRO) { scrollerRO.disconnect(); scrollerRO = null }
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    if (typeof ResizeObserver !== 'undefined') {
      scrollerRO = new ResizeObserver(onScroll)
      scrollerRO.observe(el)
    }
  }
  if (scrollEl) watch(scrollEl, attach, { immediate: true })

  onBeforeUnmount(() => {
    if (scrollEl?.value) scrollEl.value.removeEventListener('scroll', onScroll)
    if (scrollerRO) scrollerRO.disconnect()
    for (const ro of observers.values()) ro.disconnect()
    observers.clear()
    if (scrollFrame) cancelAnimationFrame(scrollFrame)
  })

  return {
    blocks,
    items,
    total,
    totalBlocks,
    loading,
    fetchingAbove,
    fetchingBelow,
    topSpacer,
    bottomSpacer,
    reset,
    refresh,
    bindBlock,
    onScroll
  }
}
