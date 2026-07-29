import { defineStore } from 'pinia'
import { navService } from 'src/services/nav.service'

// localStorage key for the user's current position in the persistent history.
// Everything else is rehydrated from the server.
const POSITION_KEY = 'pathos_nav_position'

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

// Convert a server-side nav_event row into an in-memory history entry
function entryFromEvent (event) {
  return {
    route: event.target_route,
    title: event.target_label || event.target_route,
    type: event.target_type || 'page',
    id: event.target_id || null,
    // Element hash (from 'kind/<hash>') — feeds the stack panel's MicroChip
    hash: event.target_path ? event.target_path.split('/').pop() : null,
    path: event.path, // pathchain moment hash
    prevPath: event.prev_path,
    targetPath: event.target_path, // target's pathchain hash
    isCheckpoint: !!event.is_checkpoint,
    timestamp: event.created_at ? new Date(event.created_at).getTime() : Date.now()
  }
}

// Per-element debounce timers for StateHolder persistence.
const _stateTimers = new Map()
const STATE_DEBOUNCE_MS = 900

export const useNavStore = defineStore('navigation', {
  state: () => ({
    // Replay of every VISIT the user has ever made
    history: [],
    historyIndex: -1,

    // Indices into history that are marked as checkpoints
    checkpointIndices: [],

    // Prevent router afterEach from double-pushing when the bar drives navigation
    isNavigating: false,

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
        .map(i => s.history[i])
  },

  actions: {
    push (route) {
      if (this.isNavigating) {
        _devLog('push: skipped (isNavigating)', route?.fullPath)
        return
      }

      const targetRoute = route.fullPath

      // Detect adjacent back/forward triggered by something else
      const prev = this.history[this.historyIndex - 1]
      const next = this.history[this.historyIndex + 1]

      if (prev && prev.route === targetRoute) {
        this._markReturn(prev.route)
        this.historyIndex--
        this._savePosition()
        _devLog('push: BACK detected', targetRoute, '→ index', this.historyIndex)
        this._persist('BACK', prev)
        return
      }
      if (next && next.route === targetRoute) {
        this._markReturn(next.route)
        this.historyIndex++
        this._savePosition()
        _devLog('push: FORWARD detected', targetRoute, '→ index', this.historyIndex)
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
      this._savePosition()

      _devLog('push: VISIT recorded', targetRoute, '→ index', this.historyIndex, '/', this.history.length)
      this._persist('VISIT', entry)
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
      this._savePosition()
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
      this._savePosition()
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
      this._savePosition()
      router.push(entry.route).finally(() => {
        this.isNavigating = false
        this._persist(eventType, entry)
      })
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
      this._savePosition()
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
      this._savePosition()
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
      try {
        const result = await navService.restoreSession()
        if (!result.success) return

        this.sessionId = result.sessionId
        this.sessionPath = result.sessionPath

        const history = []
        let index = -1
        const checkpointIndices = []

        for (const event of result.events) {
          const route = event.target_route
          if (!route) continue

          switch (event.event_type) {
            case 'VISIT': {
              const prev = history[index - 1]
              const next = history[index + 1]
              if (prev && prev.route === route) {
                index--
                break
              }
              if (next && next.route === route) {
                index++
                break
              }
              const cur = history[index]
              if (cur && cur.route === route) break // duplicate

              // New visit — drop forward stack
              history.splice(index + 1)
              for (let i = checkpointIndices.length - 1; i >= 0; i--) {
                if (checkpointIndices[i] > index) checkpointIndices.pop()
              }
              history.push(entryFromEvent(event))
              index = history.length - 1
              break
            }
            case 'BACK':
            case 'CHECKPOINT_BACK':
              if (index > 0) index--
              break
            case 'FORWARD':
            case 'CHECKPOINT_FORWARD':
              if (index < history.length - 1) index++
              break
            case 'CHECKPOINT':
              if (index >= 0 && !checkpointIndices.includes(index)) {
                checkpointIndices.push(index)
                if (history[index]) history[index].isCheckpoint = true
              }
              break
          }
        }

        this.history = history
        this.checkpointIndices = checkpointIndices.sort((a, b) => a - b)

        // Restore the user's last position from localStorage (or default to latest)
        const savedPos = parseInt(localStorage.getItem(POSITION_KEY))
        if (!isNaN(savedPos) && savedPos >= 0 && savedPos < history.length) {
          this.historyIndex = savedPos
        } else {
          this.historyIndex = index
        }

        this.restored = true
        _devLog('restore: rebuilt', this.history.length, 'entries, index=', this.historyIndex)

        // Rehydrate the StateHolders and re-apply remembered titles/hashes
        // to the rebuilt history entries.
        try {
          const st = await navService.getStates()
          if (st.success && st.states) {
            this.states = st.states
            for (const entry of this.history) {
              const held = st.states[entry.route]?.state
              if (held?.__title) entry.title = held.__title
              if (held?.__hash) entry.hash = held.__hash
            }
          }
        } catch (_) { /* states are an enhancement, never fatal */ }
      } catch (_) { /* non-critical, leave fresh */ }
    },

    _savePosition () {
      try {
        localStorage.setItem(POSITION_KEY, String(this.historyIndex))
      } catch (_) { /* ignore quota errors */ }
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
      for (const entry of this.history) {
        if (entry.route !== key) continue
        if (title) entry.title = title
        if (hash) entry.hash = hash
        if (type) entry.type = type
        if (id) entry.id = id
      }
    },

    // Persist a non-navigation action (vote, comment, fork, edit, etc.) to
    // the user's pathchain. Does NOT modify history or position. The action
    // is nested in the path viewer under the most recent navigation stop.
    recordAction (eventType, opts = {}) {
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
