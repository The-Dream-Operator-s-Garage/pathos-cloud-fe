// useStateHolder — the per-viewer seam into the navigation StateHolder.
//
// Every viewer page owns one holder keyed by its route (the "visited
// element"). The holder gives it:
//
//   state              reactive snapshot that survives navigation + reloads
//                      (persisted via the nav store → POST /nav/state).
//                      Seed it with defaults; mutate it freely — saving is
//                      debounced and flushed on route-leave.
//   restore()          call ONCE after the page's data is in the DOM.
//                      Re-applies the remembered approximate scroll
//                      location (window + tracked containers) and, when
//                      this landing was a back/forward return, halos the
//                      element the user came back from (luminous yellow on
//                      the matching [data-nav-focus]).
//   trackContainer(elRef, name)
//                      track a scrollable container (e.g. the post body
//                      inset) instead of / in addition to the window.
//   describe({...})    hand over the element's real title/hash once known —
//                      updates the nav stack entries + persists (__title).
//   recordInteraction  one significant in-viewer interaction (a ref
//                      followed, a label square dug open). Extends the
//                      element's pathchain interaction path server-side.
//
// Scroll positions are stored as { y, h } so restores are proportional
// when the content height changed — an *approximate* location by design.
// Detail pages that swap :id in place (watch on route.params) are handled:
// the holder re-keys itself when the route changes but still renders the
// same page component.

import { reactive, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'

const HALO_CLASS = 'nav-return-halo'
const HALO_MS = 4200
const SCROLL_THROTTLE_MS = 400

// Attribute-selector lookup for the element the user came back from.
// data-nav-focus values are routes; try the exact route first, then the
// query-less base so '/files?reveal=x' still matches '/files'.
function findFocusEl (fromRoute) {
  const esc = (s) => String(s).replace(/["\\]/g, '\\$&')
  let el = document.querySelector(`[data-nav-focus="${esc(fromRoute)}"]`)
  if (!el && fromRoute.includes('?')) {
    el = document.querySelector(`[data-nav-focus="${esc(fromRoute.split('?')[0])}"]`)
  }
  return el
}

const proportionalY = (saved, currentH) => {
  if (!saved || saved.y <= 0) return 0
  return saved.h > 0 && currentH > 0 && Math.abs(currentH - saved.h) > 40
    ? saved.y * (currentH / saved.h)
    : saved.y
}

// Markdown bodies keep growing for a beat after "loaded" (images, ref
// chips resolving). Wait until two consecutive height reads agree before
// trusting the proportional math, capped at ~2s.
const settleHeight = async (readH) => {
  let prev = readH()
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const h = readH()
    if (h === prev && h > 0) return h
    prev = h
  }
  return prev
}

export function useStateHolder (defaults = {}, opts = {}) {
  const route = useRoute()
  const navStore = useNavStore()

  // The route record pattern this page renders (e.g. '/posts/:id') —
  // used to tell an in-place :id swap apart from leaving the page.
  const routePattern = route.matched[route.matched.length - 1]?.path || route.path

  let key = opts.key || route.fullPath

  const state = reactive({})
  const meta = { targetType: opts.targetType || null, targetId: opts.targetId || null }

  // Saved scroll offsets snapshotted BEFORE live tracking overwrites them.
  let savedScroll = null
  let savedContainers = {}

  const _loadKey = () => {
    const saved = navStore.stateFor(key) || {}
    savedScroll = saved.__scroll || null
    savedContainers = {}
    for (const k of Object.keys(saved)) {
      if (k.startsWith('__c_')) savedContainers[k.slice(4)] = saved[k]
    }
    for (const k of Object.keys(state)) delete state[k]
    Object.assign(state, JSON.parse(JSON.stringify(defaults)), saved)
  }
  _loadKey()

  const snapshot = () => JSON.parse(JSON.stringify(state))

  // Persist on any mutation (store debounces per key).
  watch(state, () => navStore.saveState(key, snapshot(), meta), { deep: true })

  // ── Approximate location tracking — window ──────────────────
  let scrollTimer = null
  const onScroll = () => {
    if (scrollTimer) return
    scrollTimer = setTimeout(() => {
      scrollTimer = null
      state.__scroll = {
        y: window.scrollY,
        h: document.documentElement.scrollHeight
      }
    }, SCROLL_THROTTLE_MS)
  }
  if (opts.trackScroll !== false) {
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  // ── Approximate location tracking — named containers ────────
  const containers = new Map() // name → elRef
  const trackContainer = (elRef, name = 'main') => {
    containers.set(name, elRef)
    let t = null
    const onC = () => {
      if (t) return
      t = setTimeout(() => {
        t = null
        const el = elRef.value
        if (el) state['__c_' + name] = { y: el.scrollTop, h: el.scrollHeight }
      }, SCROLL_THROTTLE_MS)
    }
    watch(elRef, (el, old) => {
      if (old) old.removeEventListener('scroll', onC)
      if (el) el.addEventListener('scroll', onC, { passive: true })
    }, { immediate: true })
  }

  // ── Restore (page calls this once its data is in the DOM) ──
  const restore = async () => {
    await nextTick()

    const fromRoute = navStore.consumeReturn(key)

    for (const [name, elRef] of containers) {
      const saved = savedContainers[name]
      if (!saved || saved.y <= 0) continue
      settleHeight(() => elRef.value?.scrollHeight || 0).then(h => {
        const el = elRef.value
        if (el) el.scrollTop = proportionalY(saved, h)
      })
    }

    if (savedScroll && savedScroll.y > 0 && opts.trackScroll !== false) {
      settleHeight(() => document.documentElement.scrollHeight).then(h => {
        window.scrollTo({ top: proportionalY(savedScroll, h) })
      })
    }

    if (fromRoute) {
      // Landing back from a reference: halo + center the departure
      // element. Panels often finish loading AFTER restore() (usages
      // lists, comment trees), so poll for the element for a few seconds
      // instead of checking once.
      for (let attempt = 0; attempt < 12; attempt++) {
        const focusEl = findFocusEl(fromRoute)
        if (focusEl) {
          focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          focusEl.classList.add(HALO_CLASS)
          setTimeout(() => focusEl.classList.remove(HALO_CLASS), HALO_MS)
          break
        }
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  // ── Descriptions + interactions ─────────────────────────────
  const describe = ({ title, hash, targetType, targetId } = {}) => {
    if (targetType) meta.targetType = targetType
    if (targetId) meta.targetId = targetId
    if (title) state.__title = title
    if (hash) state.__hash = hash
    navStore.decorate(key, { title, hash })
  }

  const recordInteraction = (interaction) =>
    navStore.recordInteraction(key, interaction, meta)

  // ── Flush + lifecycle ───────────────────────────────────────
  const flush = () => {
    navStore.saveState(key, snapshot(), meta)
    navStore.flushState(key)
  }

  // In-place :id swap on the same page component → flush the old element
  // and re-key onto the new one. Leaving the page entirely is handled by
  // onBeforeRouteLeave instead (pattern check tells the two apart).
  watch(() => route.fullPath, (newPath) => {
    const stillHere = route.matched[route.matched.length - 1]?.path === routePattern
    if (!stillHere || newPath === key || opts.key) return
    flush()
    key = newPath
    meta.targetType = opts.targetType || null
    meta.targetId = opts.targetId || null
    _loadKey()
  })

  const stopTracking = () => {
    window.removeEventListener('scroll', onScroll)
    if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null }
  }

  onBeforeRouteLeave(() => { flush(); return true })
  onBeforeUnmount(() => { stopTracking(); flush() })

  return {
    get key () { return key },
    state,
    restore,
    trackContainer,
    describe,
    recordInteraction,
    flush
  }
}
