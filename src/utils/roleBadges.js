// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGES (2026-09-22, user ask: "for each organization … a chip with the
// org's profile pic and then, on the right, inside the org chip … the given
// icons for the role badges assigned to the user by the org") — the glyph a
// seat's badge wears on the feed card's author pill (`posts/FeedStream.vue`
// `.post-square__badge`), and the words its tooltip says.
//
// A membership row carries a coarse ROLE enum (ADMIN | MEMBER) and a free
// ROLE TITLE (data, never a label — "CEO", "Guardian of the Chain"); it
// carries NO icon of its own. So the glyph is DERIVED from what the row
// states, and the title rides the tooltip:
//
//   admin seat      → shield_person   (the org trusts this seat to act as it)
//   titled member   → badge           (a named seat)
//   untitled member → person          (a plain seat)
//
// ONE HOME for the mapping, so a per-title glyph (an ICON slot on the
// ORG_MEMBER schema, say) can be threaded through here later without the
// card learning anything new.
// ⚠ `sym_o_*` names must exist as LIGATURES in the installed Material
// Symbols Outlined (`@quasar/extras` 1.18.0) or QIcon draws the NAME as text
// (specs/gotchas.md, the ligature trap) — the three below verified rendering
// at 10px (flow-feed-card-rows asserts the glyph box is glyph-sized).
// ─────────────────────────────────────────────────────────────────────────────

export function roleBadgeGlyph (badge) {
  if (!badge) return 'sym_o_person'
  if (badge.is_admin || badge.role === 'ADMIN') return 'sym_o_shield_person'
  return badge.role_title ? 'sym_o_badge' : 'sym_o_person'
}

// "CEO · Dream Operator's Garage (admin)" — the title (or the enum's word
// when the seat is untitled), the org, and the admin mark when the title
// does not already say so.
export function roleBadgeTitle (org, badge) {
  const admin = !!(badge?.is_admin || badge?.role === 'ADMIN')
  const title = badge?.role_title || (admin ? 'Admin' : 'Member')
  const parts = [title]
  if (org?.name) parts.push(org.name)
  return parts.join(' · ') + (admin && badge?.role_title ? ' (admin)' : '')
}
