import { defineStore } from 'pinia'
import { navService } from 'src/services/nav.service'
import { actionLabel, DOCK_WINDOWS } from 'src/utils/navActions'

// ⚠ `pathos_nav_position` IS GONE (2026-09-06). It held the user's index into
// the history and it was the BOOT RACE that wiped the stack on every reload:
// the router's `afterEach` fires `push()` before MainLayout's `restore()` has
// awaited the server, that push's `_savePosition()` overwrote the saved index
// with 0, `restore()` then read its own clobbered value and seated a 66-entry
// history at index 0, and the follow-up push ran `history.slice(0, 1)` and
// truncated it to one — a loss that was then PERSISTED, so each reload ate
// what the last one left. The index is now whatever the server's fold says it
// is (`cursorIndex`), computed from the event log itself, so there is no
// second copy to race with. Nothing about navigation lives in localStorage.

// Dev-mode logger — visible in browser console for debugging navigation flow.
// Enable by running `localStorage.setItem('pathos_nav_debug', '1')` in devtools.
const _devLog = (...args) => {
  try {
    if (process.env.NODE_ENV === 'development' && localStorage.getItem('pathos_nav_debug')) {
      console.log('%c[nav]', 'color:#a39bff', ...args)
    }
  } catch (_) { /* ignore */ }
}

// Infer display info from a Vue Router route object
function entryFromRoute (route) {
  const path = route.path
  const p = route.params

  if (path === '/feed') return { title: 'Feed', type: 'feed', id: null }
  if (path === '/nodes') return { title: 'Node Explorer', type: 'explorer', id: null }
  if (path === '/labels') return { title: 'Label Explorer', type: 'explorer', id: null }
  if (path === '/paths') return { title: 'Path Explorer', type: 'explorer', id: null }
  if (path === '/skeletons') return { title: 'Skeletons', type: 'explorer', id: null }
  if (path === '/organizations') return { title: 'Organizations', type: 'explorer', id: null }

  if (path === '/files') return { title: 'File Tree', type: 'explorer', id: null }

  if (p.id && path.startsWith('/nodes/') && path.endsWith('/edit')) { return { title: `Edit Node #${p.id}`, type: 'node_edit', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/nodes/')) { return { title: `Node #${p.id}`, type: 'node', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/labels/')) { return { title: `Label #${p.id}`, type: 'label', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/posts/')) { return { title: `Post #${p.id}`, type: 'post', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/entities/')) { return { title: `Entity #${p.id}`, type: 'entity', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/skeletons/')) { return { title: `Skeleton #${p.id}`, type: 'skeleton', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/paths/')) { return { title: `Path #${p.id}`, type: 'path', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/moments/')) { return { title: `Moment #${p.id}`, type: 'moment', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/secrets/')) { return { title: `Secret #${p.id}`, type: 'secret', id: parseInt(p.id) } }
  if (p.id && path.startsWith('/links/')) { return { title: `Link #${p.id}`, type: 'link', id: parseInt(p.id) } }
  if (p.ownerHash && path.startsWith('/files/')) { return { title: 'File Tree', type: 'explorer', id: null } }

  return { title: path, type: 'page', id: null }
}

// A cursor entry as the server's fold ships it, normalised to the field
// names this store has always used (`timestamp`, not `lastAt`).
// ⚠ The client no longer REPLAYS the event log — `navService.foldEvents`
// does it server-side and ships both structures. The old `entryFromEvent`
// + the 60-line replay `switch` in `restore()` are gone with it: they were
// 179 KB on the wire and they had no case for action events at all, so
// every VOTE / PIN / EDIT ever recorded was read back and dropped.
function entryFromStop (stop) {
  return {
    route: stop.route,
    title: stop.title || stop.route,
    type: stop.type || 'page',
    id: stop.id || null,
    hash: stop.hash || null,
    targetPath: stop.targetPath || null,
    isCheckpoint: !!stop.isCheckpoint,
    timestamp: stop.lastAt || stop.firstAt || Date.now()
  }
}

// A TRAIL STOP as the ledger holds it. Same shape as a cursor entry plus
// the three things that make it a ledger row rather than a stack slot:
// where you were standing (`surface`), how many times you landed on it
// (`visits`), and WHAT YOU DID THERE (`actions` — the sub-stack).
function stopFromEntry (entry, surface = 'page') {
  return {
    ...entry,
    key: entry.route,
    surface,
    firstAt: entry.timestamp,
    lastAt: entry.timestamp,
    visits: 1,
    actions: []
  }
}

// Per-element debounce timers for StateHolder persistence.
const _stateTimers = new Map()
const STATE_DEBOUNCE_MS = 900

export const useNavStore = defineStore('navigation', {
  state: () => ({
    // ── THE CURSOR STACK — Back / Forward, browser semantics ────
    // A visit made after a Back DROPS the forward branch. That is correct
    // here and only here: this is what the two arrows in the top bar walk.
    // It is NOT the history — see `trail` below, which is the ledger and
    // exists precisely because this array is allowed to forget.
    history: [],
    historyIndex: -1,

    // ── THE TRAIL — the append-only ledger (2026-09-06, user ask:
    // "the stack should not get cleared up when I reload the page … a huge
    // skeleton of items I've been on"). One STOP per place you stood,
    // never truncated, each carrying its own SUB-STACK of what you did
    // there (`actions`, vocabulary in utils/navActions.js). This is what
    // the footer strip and the expanded panel read. Consecutive landings
    // on the same key extend one stop (`visits`, `lastAt`); coming back
    // later opens a new one, so two sittings never merge their sub-stacks.
    // Folded server-side by navService.foldEvents and kept in step here.
    trail: [],
    trailTotal: 0,

    // Indices into history that are marked as checkpoints
    checkpointIndices: [],

    // Prevent router afterEach from double-pushing when the bar drives navigation
    isNavigating: false,

    // ⚠ TRUE WHILE `restore()` IS IN FLIGHT (2026-09-06). The router's
    // `afterEach` fires on the very first navigation, which is BEFORE
    // MainLayout has awaited the server — and a push landing then writes
    // into a store that is about to be replaced wholesale. It used to also
    // clobber the saved position and truncate the restored history (the
    // reload wipe). The position is gone; this flag closes the rest of the
    // window, and MainLayout's own push right after the await is what
    // records the landing route.
    restoring: false,

    // Persistent session ID (one per user, forever)
    sessionId: null,
    sessionPath: null, // pathchain moment anchor for the session
    restored: false, // true once we've rehydrated from server

    // ── StateHolder ────────────────────────────────────────────
    // elementKey (route fullPath) → { state, targetType, targetId, … }.
    // `state` is the viewer's own snapshot: expanded label squares,
    // approximate scroll section, last-focused ref, __title/__hash.
    states: {},

    // Set when back/forward/jump lands somewhere: { to, from }. The
    // destination viewer consumes it to halo the element the user came
    // back from (luminous yellow — see .nav-return-halo).
    lastReturn: null
  }),

  getters: {
    current: (s) => s.history[s.historyIndex] || null,
    canGoBack: (s) => s.historyIndex > 0,
    canGoForward: (s) => s.historyIndex < s.history.length - 1,
    stepLabel: (s) => s.history.length
      ? `${s.historyIndex + 1} / ${s.history.length}`
      : '',

    isCurrentCheckpoint: (s) => s.checkpointIndices.includes(s.historyIndex),
    canCheckpointBack: (s) => s.checkpointIndices.some(i => i < s.historyIndex),
    canCheckpointForward: (s) => s.checkpointIndices.some(i => i > s.historyIndex),

    checkpointEntries: (s) =>
      s.checkpointIndices
        .filter(i => i < s.history.length)
        .map(i => s.history[i]),

    // ── trail getters ───────────────────────────────────────────
    // The stop you are standing in — the newest one, which is where any
    // action recorded right now belongs.
    currentStop: (s) => s.trail[s.trail.length - 1] || null,
    // The last thing done in it. This is the wide tile's second line.
    lastAction: (s) => {
      const stop = s.trail[s.trail.length - 1]
      return stop && stop.actions.length ? stop.actions[stop.actions.length - 1] : null
    },
    trailLabel: (s) => s.trail.length
      ? `${s.trail.length} stop${s.trail.length === 1 ? '' : 's'}`
      : '',
    // Every action across the ledger, newest first — the sub-stack seen
    // whole rather than per stop.
    actionCount: (s) => s.trail.reduce((n, t) => n + t.actions.length, 0)
  },

  actions: {
    push (route) {
      if (this.isNavigating) {
        _devLog('push: skipped (isNavigating)', route?.fullPath)
        return
      }
      if (this.restoring) {
        _devLog('push: skipped (restore in flight)', route?.fullPath)
        return
      }

      const targetRoute = route.fullPath

      // Detect adjacent back/forward triggered by something else
      const prev = this.history[this.historyIndex - 1]
      const next = this.history[this.historyIndex + 1]

      if (prev && prev.route === targetRoute) {
        this._markReturn(prev.route)
        this.historyIndex--
        _devLog('push: BACK detected', targetRoute, '→ index', this.historyIndex)
        this._appendTrail(prev)
        this._persist('BACK', prev)
        return
      }
      if (next && next.route === targetRoute) {
        this._markReturn(next.route)
        this.historyIndex++
        _devLog('push: FORWARD detected', targetRoute, '→ index', this.historyIndex)
        this._appendTrail(next)
        this._persist('FORWARD', next)
        return
      }

      const current = this.history[this.historyIndex]
      if (current && current.route === targetRoute) {
        _devLog('push: duplicate of current, skipped', targetRoute)
        return
      }

      const meta = entryFromRoute(route)
      const entry = {
        route: targetRoute,
        title: meta.title,
        type: meta.type,
        id: meta.id,
        isCheckpoint: false,
        timestamp: Date.now()
      }

      this.history = this.history.slice(0, this.historyIndex + 1)
      this.checkpointIndices = this.checkpointIndices.filter(i => i <= this.historyIndex)

      this.history.push(entry)
      this.historyIndex = this.history.length - 1

      // The cursor may have just forgotten a forward branch. The trail
      // never does — this is the line that makes the history a history.
      this._appendTrail(entry)

      _devLog('push: VISIT recorded', targetRoute, '→ index', this.historyIndex, '/', this.history.length)
      this._persist('VISIT', entry)
    },

    // ── THE LEDGER'S ONE WRITE SEAM ─────────────────────────────
    // Mirrors `navService.foldEvents` exactly (same consecutive-dedupe
    // rule, same fields) so a live session and a reloaded one show the
    // identical trail — if these two ever disagree, the stack changes
    // shape when you refresh, which is the bug this whole pass is about.
    _appendTrail (entry, surface = 'page') {
      const top = this.trail[this.trail.length - 1]
      if (top && top.key === entry.route) {
        top.lastAt = Date.now()
        top.visits += 1
        if (entry.title) top.title = entry.title
        if (entry.hash) top.hash = entry.hash
        if (surface === 'window') top.surface = 'window'
        return top
      }
      const stop = stopFromEntry({ ...entry, timestamp: Date.now() }, surface)
      this.trail.push(stop)
      this.trailTotal += 1
      return stop
    },

    back (router) {
      if (!this.canGoBack) {
        _devLog('back: blocked — canGoBack=false (at index 0)')
        return
      }
      this.isNavigating = true
      const entry = this.history[this.historyIndex - 1]
      this._markReturn(entry.route) // BEFORE moving the index — `from` is the current stop
      this.historyIndex--
      _devLog('back: → index', this.historyIndex, entry.route)
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist('BACK', entry)
      })
    },

    forward (router) {
      if (!this.canGoForward) {
        _devLog('forward: blocked — canGoForward=false (at end)')
        return
      }
      this.isNavigating = true
      const entry = this.history[this.historyIndex + 1]
      this._markReturn(entry.route) // BEFORE moving the index — `from` is the current stop
      this.historyIndex++
      _devLog('forward: → index', this.historyIndex, entry.route)
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist('FORWARD', entry)
      })
    },

    // Jump straight to any index of the history stack (stack panel,
    // checkpoint list). Same return-marking semantics as back/forward.
    jumpTo (idx, router) {
      if (idx < 0 || idx >= this.history.length || idx === this.historyIndex) return
      const eventType = idx < this.historyIndex ? 'BACK' : 'FORWARD'
      this.isNavigating = true
      const entry = this.history[idx]
      this._markReturn(entry.route) // BEFORE moving the index — `from` is the current stop
      this.historyIndex = idx
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist(eventType, entry)
      })
    },

    // ── A STOP THAT LEARNED WHAT IT IS ──────────────────────────
    // A flyout window can open on a BARE REF and only later resolve into
    // the node or post it addresses. The stop it opened is keyed by the
    // ref-shaped route (`/nodes/<hash>`), which is not a route this app
    // can navigate to — so when the window retargets, the stop is
    // REWRITTEN in place rather than a second one being opened beside it.
    // Newest match only: the same element visited twice is two sittings,
    // and only the live one is still resolving.
    refineStop (fromRoute, place = {}) {
      if (!fromRoute || !place.targetRoute) return
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const stop = this.trail[i]
        if (stop.key !== fromRoute) continue
        stop.key = place.targetRoute
        stop.route = place.targetRoute
        if (place.targetType) stop.type = place.targetType
        if (place.targetId != null) stop.id = place.targetId
        if (place.targetLabel) stop.title = place.targetLabel
        if (place.targetPath) {
          stop.targetPath = place.targetPath
          stop.hash = String(place.targetPath).split('/').pop()
        }

        // ⚠ REFINING CAN REVEAL A NEIGHBOUR. Two ref-door windows opened
        // back to back on the same element are two DIFFERENT keys until
        // they resolve, and one key once they do — at which point they are
        // consecutive landings on one place, which the dedupe rule says is
        // ONE stop. The server's fold reaches that conclusion on its own
        // (both events carry the ref route), so the client has to as well
        // or the trail re-shapes itself on the next reload. Merge into the
        // older stop, keeping its sub-stack ahead of this one's.
        const prev = this.trail[i - 1]
        if (prev && prev.key === stop.key) {
          prev.lastAt = Math.max(prev.lastAt || 0, stop.lastAt || 0)
          prev.visits += stop.visits
          prev.actions = [...prev.actions, ...stop.actions].slice(-24)
          if (stop.surface === 'window') prev.surface = 'window'
          if (stop.title) prev.title = stop.title
          if (stop.hash) prev.hash = stop.hash
          this.trail.splice(i, 1)
          this.trailTotal = Math.max(0, this.trailTotal - 1)
        }
        return
      }
    },

    // The window's resolved header, mirrored onto its stop's title so the
    // strip letters "Pinned essay" rather than the hash it opened on.
    renameStop (route, title) {
      if (!route || !title) return
      for (let i = this.trail.length - 1; i >= 0; i--) {
        if (this.trail[i].key === route) { this.trail[i].title = title; return }
      }
    },

    // Jump to a TRAIL stop. The trail is a ledger, so a stop is not an
    // index into the Back/Forward stack — most of them are not on it at
    // all any more (the cursor forgets forward branches; the trail does
    // not). When the stop's route DOES stand on the cursor, go through
    // `jumpTo` so return-marking and the yellow halo still fire; otherwise
    // it is an ordinary navigation and `push` will re-seat the cursor.
    jumpToStop (stop, router) {
      if (!stop?.route) return
      const idx = this.history.findIndex(e => e.route === stop.route)
      if (idx >= 0) return this.jumpTo(idx, router)
      router.push(stop.route)
    },

    toggleCheckpoint () {
      if (this.historyIndex < 0) return

      if (this.isCurrentCheckpoint) {
        this.checkpointIndices = this.checkpointIndices.filter(i => i !== this.historyIndex)
        this.history[this.historyIndex].isCheckpoint = false
      } else {
        this.checkpointIndices = [...this.checkpointIndices, this.historyIndex].sort((a, b) => a - b)
        this.history[this.historyIndex].isCheckpoint = true
        this._persist('CHECKPOINT', this.history[this.historyIndex])
      }
    },

    checkpointBack (router) {
      const prev = [...this.checkpointIndices].reverse().find(i => i < this.historyIndex)
      if (prev === undefined) return
      this.isNavigating = true
      const entry = this.history[prev]
      this._markReturn(entry.route) // BEFORE moving the index — `from` is the current stop
      this.historyIndex = prev
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist('CHECKPOINT_BACK', entry)
      })
    },

    checkpointForward (router) {
      const next = this.checkpointIndices.find(i => i > this.historyIndex)
      if (next === undefined) return
      this.isNavigating = true
      const entry = this.history[next]
      this._markReturn(entry.route) // BEFORE moving the index — `from` is the current stop
      this.historyIndex = next
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist('CHECKPOINT_FORWARD', entry)
      })
    },

    // Lazily creates the persistent session (no-op if it already exists server-side)
    async initSession () {
      try {
        const result = await navService.startSession()
        if (result.success) {
          this.sessionId = result.sessionId
          this.sessionPath = result.path
        }
      } catch (_) { /* non-critical */ }
    },

    // Rebuild in-memory history by replaying the server-side event log.
    // Called on app boot so the user's navigation story survives reloads.
    async restore () {
      if (this.restored) return
      this.restoring = true
      try {
        const result = await navService.restoreSession()
        if (!result.success) return

        this.sessionId = result.sessionId
        this.sessionPath = result.sessionPath

        // ── CONSUME, don't replay ──────────────────────────────
        // The server ships both structures already folded (navService
        // .foldEvents). The client's job is to seat them, which is also
        // what removed the boot race: there is no locally-stored index to
        // clobber, and no truncating replay to run over restored data.
        this.history = (result.cursor || []).map(entryFromStop)
        this.checkpointIndices = result.checkpointIndices || []
        this.historyIndex = typeof result.cursorIndex === 'number'
          ? Math.min(result.cursorIndex, this.history.length - 1)
          : this.history.length - 1

        this.trail = (result.trail || []).map(stop => ({
          ...entryFromStop(stop),
          key: stop.key || stop.route,
          surface: stop.surface || 'page',
          firstAt: stop.firstAt || stop.lastAt || Date.now(),
          lastAt: stop.lastAt || stop.firstAt || Date.now(),
          visits: stop.visits || 1,
          actions: Array.isArray(stop.actions) ? stop.actions : []
        }))
        this.trailTotal = result.trailTotal || this.trail.length

        this.restored = true
        _devLog('restore:', this.history.length, 'cursor entries (idx',
          this.historyIndex + ') |', this.trail.length, 'trail stops of',
          this.trailTotal, '|', this.actionCount, 'actions')

        // Rehydrate the StateHolders and re-apply remembered titles/hashes
        // to both structures (the trail included — a stop that learned its
        // real title in a past session must not come back as "Post #12").
        try {
          const st = await navService.getStates()
          if (st.success && st.states) {
            this.states = st.states
            for (const entry of [...this.history, ...this.trail]) {
              const held = st.states[entry.route]?.state
              if (held?.__title) entry.title = held.__title
              if (held?.__hash) entry.hash = held.__hash
            }
          }
        } catch (_) { /* states are an enhancement, never fatal */ }
      } catch (_) { /* non-critical, leave fresh */ } finally {
        this.restoring = false
      }
    },

    // ── StateHolder actions ────────────────────────────────────

    // Remember where a back/forward/jump is landing and where it left
    // from, so the destination viewer can halo the departure element.
    _markReturn (toRoute) {
      const from = this.current?.route || null
      if (!from || from === toRoute) return
      this.lastReturn = { to: toRoute, from, at: Date.now() }
    },

    // The destination viewer calls this once on restore. Returns the
    // route the user came back FROM (→ `[data-nav-focus]` halo target),
    // or null when this landing wasn't a return.
    consumeReturn (key) {
      const r = this.lastReturn
      if (!r || r.to !== key) return null
      this.lastReturn = null
      return r.from
    },

    stateFor (key) {
      return this.states[key]?.state || null
    },

    // Merge a viewer's snapshot into the StateHolder and persist it
    // (debounced per element so scroll tracking doesn't spam the API).
    saveState (key, snapshot, meta = {}) {
      const cur = this.states[key] || {}
      this.states[key] = {
        ...cur,
        state: snapshot,
        targetType: meta.targetType ?? cur.targetType ?? null,
        targetId: meta.targetId ?? cur.targetId ?? null,
        targetRoute: key
      }
      if (_stateTimers.has(key)) clearTimeout(_stateTimers.get(key))
      _stateTimers.set(key, setTimeout(() => this.flushState(key), STATE_DEBOUNCE_MS))
    },

    // Immediate persistence (route-leave / unmount).
    flushState (key) {
      if (_stateTimers.has(key)) {
        clearTimeout(_stateTimers.get(key))
        _stateTimers.delete(key)
      }
      const holder = this.states[key]
      if (!holder) return
      navService.saveState({
        elementKey: key,
        targetType: holder.targetType,
        targetId: holder.targetId,
        targetRoute: key,
        state: holder.state
      })
    },

    // One interaction performed while visiting `key` (a ref followed, a
    // label square dug open, …). Extends the element's pathchain
    // interaction path + the nav_event history server-side.
    recordInteraction (key, interaction, meta = {}) {
      const holder = this.states[key] || {}
      navService.saveState({
        elementKey: key,
        targetType: meta.targetType ?? holder.targetType ?? null,
        targetId: meta.targetId ?? holder.targetId ?? null,
        targetRoute: key,
        interaction
      })
    },

    // Update history entries in place once a viewer knows the element's
    // real title/hash (entries start as "Post #12"). The title is also
    // kept in the StateHolder (__title) so it survives reloads.
    decorate (key, { title, hash, type, id } = {}) {
      // Both structures — the cursor for the Back/Forward arrows' tooltips,
      // the trail for the stack bar's wide tile, which letters the title.
      for (const entry of [...this.history, ...this.trail]) {
        if (entry.route !== key) continue
        if (title) entry.title = title
        if (hash) entry.hash = hash
        if (type) entry.type = type
        if (id) entry.id = id
      }
    },

    // ── THE SUB-STACK'S WRITE SEAM ──────────────────────────────
    // One non-navigation act (vote, comment, fork, edit, upload, a window
    // opening …) performed in the stop you are standing in. It lands in
    // TWO places, which is the whole enhancement:
    //   · locally, on `trail[last].actions` — so the footer's wide tile
    //     can letter "what I last did here" without a round trip;
    //   · on the chain, as a nav_event whose type is the action code —
    //     which the server's fold reads straight back into the same slot
    //     on the next boot.
    // Never touches the cursor: doing something is not going somewhere.
    // `eventType` should be a code declared in utils/navActions.js; an
    // undeclared one still records and draws as the neutral fallback.
    recordAction (eventType, opts = {}) {
      const stop = this.trail[this.trail.length - 1]
      if (stop) {
        stop.actions.push({
          code: eventType,
          at: Date.now(),
          targetType: opts.targetType || null,
          targetId: opts.targetId || null,
          targetRoute: opts.targetRoute || null,
          label: opts.targetLabel || null,
          hash: opts.targetPath ? String(opts.targetPath).split('/').pop() : null
        })
        // Same cap the server folds to — a stop worked in all afternoon
        // keeps its tail, and the full record stays in nav_event.
        if (stop.actions.length > 24) stop.actions.shift()
        stop.lastAt = Date.now()
      }

      if (!this.sessionId) return
      navService.recordEvent({
        sessionId: this.sessionId,
        eventType,
        targetType: opts.targetType || null,
        targetId: opts.targetId || null,
        targetRoute: opts.targetRoute || null,
        targetLabel: opts.targetLabel || null,
        targetPath: opts.targetPath || null,
        isCheckpoint: false,
        // ── THE STOP STORY ON THE CHAIN (2026-09-06 PM) ──────────
        // The API mints a NAV_ACTION skeleton per act on the current
        // stop's SUBSTACK and names it after THIS label — the registry's
        // past-tense line — so the skeleton view letters "Uploaded image"
        // without ever learning the vocabulary (the server keeps knowing
        // one fact about it: NAV_CODES). `windowKey` names the NAV_WINDOW
        // leaf a creation-window act targets (a window is not an element).
        actionLabel: opts.actionLabel || actionLabel(eventType),
        windowKey: opts.windowKey || null
      })
    },

    // ── THE CREATION WINDOWS (2026-09-06 PM) ────────────────────
    // "Opened uploader" / "Closed uploader" as acts in the stop you are
    // standing in — the four dock stores call this from open()/close()
    // (every door goes through them). `verb` is 'open' | 'close'.
    recordDock (dockKey, verb) {
      const d = DOCK_WINDOWS[dockKey]
      const code = d && d[verb]
      if (!code) return
      this.recordAction(code, {
        targetType: 'window',
        targetId: null,
        targetLabel: d.label,
        windowKey: d.leaf
      })
    },

    // A CHAIN-ONLY event: recorded for its server-side side effect and
    // deliberately absent from the trail. Today that is `WINDOW_RESOLVED`
    // — a flyout opened on a bare REF has no element id at open time, so
    // the two window skeletons (which link by row id) learn nothing until
    // the window resolves and sends this. `navService.SILENT_CODES` drops
    // it from the fold; nothing here touches `trail` either, so the live
    // and restored ledgers stay identical.
    recordSilent (eventType, opts = {}) {
      if (!this.sessionId) return
      navService.recordEvent({
        sessionId: this.sessionId,
        eventType,
        targetType: opts.targetType || null,
        targetId: opts.targetId || null,
        targetRoute: opts.targetRoute || null,
        targetLabel: opts.targetLabel || null,
        targetPath: opts.targetPath || null,
        isCheckpoint: false
      })
    },

    // ── THE WINDOW SEAM (2026-09-06) ────────────────────────────
    // A floating viewer is the SECOND way to be on an element (the route
    // being the first), so opening one opens a trail stop exactly as a
    // page visit does — marked `surface: 'window'` — while minimize /
    // restore / maximize / close are acts INSIDE that stop. Server-side
    // OPEN_WINDOW/CLOSE_WINDOW also drive the two window skeletons
    // (navSkeletonService § THE WINDOW STORY).
    recordWindow (eventType, opts = {}) {
      if (eventType === 'OPEN_WINDOW' && opts.targetRoute) {
        this._appendTrail({
          route: opts.targetRoute,
          title: opts.targetLabel || opts.targetRoute,
          type: opts.targetType || 'page',
          id: opts.targetId || null,
          hash: opts.targetPath ? String(opts.targetPath).split('/').pop() : null,
          isCheckpoint: false,
          timestamp: Date.now()
        }, 'window')
      }
      this.recordAction(eventType, opts)
    },

    _persist (eventType, entry) {
      if (!this.sessionId) return
      navService.recordEvent({
        sessionId: this.sessionId,
        eventType,
        targetType: entry?.type || null,
        targetId: entry?.id || null,
        targetRoute: entry?.route || null,
        targetLabel: entry?.title || null,
        targetPath: entry?.targetPath || null,
        isCheckpoint: eventType === 'CHECKPOINT'
      })
    }
  }
})
