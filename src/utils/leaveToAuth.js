// ── THE SESSION ENDS WITH THE PAGE (2026-11-08, user ask: "im seein my tabs
// after had logged out. i shouldnt be able to") ─────────────────────────────
// A logout used to drop the token and hash-route to /auth, and every Pinia
// store — the window tray (the rail's parked tabs), the trail, the side
// viewer, the docks — kept the last identity in memory: the landing page's
// rail (AuthLayout mounts the same MediaTabsBar) drew the parked tabs, and
// the NEXT login on that tab inherited them (the tray's `hydrate()` is a
// no-op while windows stand, so its first save would have written the old
// identity's windows into the new one's row).
//
// Resetting store by store is a list that goes stale with every new store
// and every module-level singleton; a reload is the one reset that cannot
// miss one. Every way a session ends lands here: the Log out buttons
// (authService.logout), a 401 (the interceptor in services/api.js), and a
// logout in ANOTHER tab (`watchSessionEnd`, mounted by App.vue).
export function leaveToAuth () {
  // A bare hash change is not a navigation — it never reloads (the old
  // `location.href = origin + '/#/auth'` was exactly that). So park the URL
  // on the landing route without telling the router, then boot afresh on it.
  window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/auth')
  window.location.reload()
}

// Another tab logged out (its removeItem fires `storage` HERE, never in the
// tab that wrote it): this tab's token is gone too, so its in-memory session
// must go with it. Only a REMOVAL ends the session — a token that changes
// (an identity switch, a login) is the other tab's business. `key === null`
// is a `localStorage.clear()`. Returns the unhook.
export function watchSessionEnd () {
  const onStorage = (e) => {
    if (e.key !== null && e.key !== 'pathos_token') return
    if (e.key === 'pathos_token' && e.newValue) return
    if (window.location.hash.startsWith('#/auth')) return
    leaveToAuth()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
