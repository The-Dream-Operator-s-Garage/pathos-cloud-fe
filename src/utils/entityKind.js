// What an ENTITY is, for display — the one table every surface that glyphs,
// names or handles an entity reads from (2026-09-11, the entity window).
//
// Born the day the entity viewer became a floating window. The profile page
// answered "what glyph / what name / what handle" inline, and only for one
// shape: a person. The window's header, its parked tab, the face inside it
// and the page now all have to agree — and the answers differ by KIND. An
// organization is not a person is not a bot is not an alter-ego, and each
// wears its own mark so a strip of parked tabs sorts itself by kind at a
// glance, the way the media tabs sort by face.
export const ENTITY_TYPES = { 1: 'USER', 2: 'BOT', 3: 'ORGANIZATION', 4: 'ALTER_EGO', 5: 'COMMUNITY' }

// One Material glyph per entity type. `person` is the family's mark (the
// kinds.js entry for `entities/`), the others are the type's own: a bot is
// the toy robot, an organization the building, an alter-ego the two masks
// (the chrome the org member rows already wear), a community the group.
export const ENTITY_TYPE_GLYPH = { 1: 'person', 2: 'smart_toy', 3: 'corporate_fare', 4: 'theater_comedy', 5: 'groups' }

// The one-and-only origin entity: ancestor self-ref (or null). Accepts a
// summary card (`pioneer: true` off /refs/summary) or a raw row; a card
// that carries neither answers false rather than guessing.
export function isPioneerEntity (e) {
  if (!e) return false
  if (e.pioneer === true) return true
  if (e.ancestor_id === undefined) return false
  return e.ancestor_id === null || e.ancestor_id === e.id
}

export function entityTypeLabel (e) {
  if (!e || e.type_id == null) return 'ENTITY'
  return ENTITY_TYPES[e.type_id] || `type ${e.type_id}`
}

// The pioneer's star outranks the type — it is the golden treatment every
// chip already gives the origin entity.
export function entityGlyph (e) {
  if (isPioneerEntity(e)) return 'star'
  return ENTITY_TYPE_GLYPH[e?.type_id] || 'person'
}

// Takes whatever the caller has: the entity read's row (`profile` nested),
// a feed author card, a /refs/summary card (`primary`), a bare `{ id }`.
export function entityDisplayName (e) {
  if (!e) return ''
  return e.display_name || e.profile?.display_name || e.primary ||
    e.profile?.username || e.username ||
    (isPioneerEntity(e) ? 'Pioneer' : (e.id != null ? `entity #${e.id}` : ''))
}

// The handle without its sigil, or null. An organization has no login and
// therefore no username; its ORG_PROFILE HANDLE is the same idea one
// layer over, so it answers here too.
export function entityUsername (e) {
  if (!e) return null
  const u = e.username || e.profile?.username || e.organization?.org_profile?.handle || null
  if (u) return String(u).replace(/^@/, '')
  // A /refs/summary card states the handle as its `secondary` ("@name").
  if (typeof e.secondary === 'string' && e.secondary.startsWith('@')) return e.secondary.slice(1)
  return null
}

// What the window's bar and its parked tab call the entity (user ask: the
// tab shows "an entity icon and the handle"): `@handle` when there is one,
// the display name otherwise — orgs and system rows have no login.
export function entityHandle (e) {
  const u = entityUsername(e)
  return u ? '@' + u : entityDisplayName(e)
}

// A non-human seat: a BOT row, or a person-shaped row wearing the AGENT
// label (the resident agents are alter-egos or root accounts classified
// `ENTITY > AGENT`; `labels` is the entity read's rail, chains included).
export function isNonHuman (e, labels = []) {
  if (e?.type_id === 2) return true
  return (labels || []).some(l =>
    l?.name === 'AGENT' || (l?.chain || []).some(c => c?.name === 'AGENT'))
}
