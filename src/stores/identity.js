import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useAuthStore } from './auth'
import { orgService } from 'src/services/org.service'
import { authService } from 'src/services/auth.service'

// The identity window — the profile/organizations features RELOCATED OUT OF
// THE LEFT DRAWER (2026-08-31, user ask; the drawer itself is hidden the same
// day). Two surfaces read this store:
//   · IdentityChip — the full-bar-height section at the footer bar's very
//     left end (before the stack strip): face + name + acting-org line +
//     the badges the user chose to show. Clicking it toggles the window.
//   · IdentityDock — the expandable window rising from that seat, in the
//     platform's dock chrome on the QUASAR ORANGE colorway: profile card,
//     acting-as band, organizations list (with the put-on-the-mask switch),
//     and the badge wardrobe.
//
// The ORG DATA lives here rather than in either component because BOTH need
// it (the chip shows the acting org + shown badges; the window lists all),
// and one load should serve the pair. `load()` re-fetches on identity
// switches — the caller passes force after auth.switchIdentity resolves.
//
// BADGES are org-assigned role titles (`role_title` on the membership row —
// DATA, never labels). "Displayed if I want": `shownBadgeIds` is the set of
// membership ids whose badge the user wears on the bar chip, persisted per
// ROOT entity (masks share the root's wardrobe — the person chooses, not the
// seat) under `pathos_identity_badges`.
const BADGES_KEY = 'pathos_identity_badges'

function loadBadgePrefs () {
  try {
    const raw = JSON.parse(localStorage.getItem(BADGES_KEY))
    return raw && typeof raw === 'object' ? raw : {}
  } catch (_) { return {} }
}

export const useIdentityStore = defineStore('identity', {
  state: () => ({
    isOpen: false,
    organizations: [],
    // DELEGATED READS (S3, 2026-10-31 — docs/concepts/access.md § Delegated
    // reads): the acting seat's live delegations, both directions. `given`
    // = whose reads this seat handed out (the window's "who can read
    // everything I own" list, with revoke); `received` = whose reads this
    // seat holds (an alter-ego delegates to its root at mint). Seat-strict
    // like the API: the lists move with every identity switch.
    delegations: { given: [], received: [] },
    delegationsLoaded: false,
    loaded: false,
    loading: false,
    // { [rootEntityId]: [member_id, …] } — see BADGES_KEY above.
    badgePrefs: loadBadgePrefs()
  }),

  getters: {
    // The org whose seat the user currently occupies: a worn mask
    // (mask.acting) or — the ADMIN case — acting as the org entity itself.
    actingOrg (s) {
      const auth = useAuthStore()
      return s.organizations.find(
        (o) => o.mask?.acting || (auth.entityId && o.entity_id === auth.entityId)
      ) || null
    },

    // Every badge the orgs have given this root: one per membership that
    // carries a role title. `shown` rides along so the wardrobe renders in
    // one pass.
    // ⭐ 2026-09-22 PM: EVERY seat is a badge now (a seat with no title still
    // has a role — the glyph says which; `utils/roleBadges.js`), the row
    // carries `role` / `is_admin` / the org's `entity_id` so the chip can
    // draw the feed card's SEAT idiom (org face + role glyph), and an UNSET
    // wardrobe wears everything (user ask: "display the username and the
    // badges on the tiny square") — the eye toggles are opt-outs from a full
    // set, not opt-ins to an empty one.
    badges (s) {
      const ids = this.shownBadgeIds
      const shown = ids ? new Set(ids) : null
      return s.organizations
        .map((o) => ({
          id: o.member_id,
          title: o.role_title || null,
          role_title: o.role_title || null, // the shape `utils/roleBadges.js` reads (glyph + tooltip)
          role: o.role,
          is_admin: !!o.is_admin,
          org: { id: o.id, entity_id: o.entity_id, name: o.name, logo: o.logo },
          shown: shown ? shown.has(o.member_id) : true
        }))
    },

    // null = no preference saved for this root (everything is worn);
    // an array = exactly those membership ids.
    shownBadgeIds (s) {
      const auth = useAuthStore()
      const ids = s.badgePrefs[auth.rootEntityId]
      return Array.isArray(ids) ? ids : null
    },

    shownBadges () {
      return this.badges.filter((b) => b.shown)
    }
  },

  actions: {
    open () {
      this.isOpen = true
      useWindowsStore().focus('identity')
      this.load()
      // Delegations move out-of-band (an alter-ego minted elsewhere delegates
      // to this seat at birth), so every open re-reads them even when the
      // orgs were loaded at mount and load() returns early.
      if (this.loaded) this.loadDelegations()
    },

    close () {
      this.isOpen = false
      useWindowsStore().release('identity')
    },

    toggle () {
      if (this.isOpen) this.close()
      else this.open()
    },

    // One fetch serves chip + window; force re-reads (identity switches,
    // membership changes). Fail-soft — an unauthenticated or offline chip
    // simply shows the face and name it already has.
    async load (force = false) {
      if (this.loading || (this.loaded && !force)) return
      this.loading = true
      try {
        const r = await orgService.mine()
        if (r.success) this.organizations = r.organizations || []
        this.loaded = true
      } catch (_) { /* keep whatever we had */ }
      this.loading = false
      this.loadDelegations()
    },

    // The delegations ride the same load (one open serves the window); a
    // failed read leaves the lists as they were — the well then says so.
    async loadDelegations () {
      try {
        const r = await authService.delegations()
        if (r.success) {
          this.delegations = { given: r.given || [], received: r.received || [] }
          this.delegationsLoaded = true
        }
      } catch (_) { /* keep whatever we had */ }
    },

    // Revoke = the row leaves the list on the server's word; the error
    // (a mandated record while a member) is the caller's to show.
    async revokeDelegation (id) {
      const r = await authService.revokeDelegation(id)
      if (r.success) {
        this.delegations = {
          given: this.delegations.given.filter((d) => d.id !== id),
          received: this.delegations.received.filter((d) => d.id !== id)
        }
      }
      return r
    },

    toggleBadge (memberId) {
      const auth = useAuthStore()
      const root = auth.rootEntityId
      if (!root) return
      // An unset wardrobe means "all worn": the first toggle starts from the
      // full set, so hiding one badge does not hide the rest.
      const saved = this.badgePrefs[root]
      const ids = new Set(Array.isArray(saved) ? saved : this.badges.map((b) => b.id))
      if (ids.has(memberId)) ids.delete(memberId)
      else ids.add(memberId)
      this.badgePrefs = { ...this.badgePrefs, [root]: [...ids] }
      try {
        localStorage.setItem(BADGES_KEY, JSON.stringify(this.badgePrefs))
      } catch (_) { /* storage blocked — the wardrobe won't survive reload */ }
    }
  }
})
