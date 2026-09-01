import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useAuthStore } from './auth'
import { orgService } from 'src/services/org.service'

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
    badges (s) {
      const shown = new Set(this.shownBadgeIds)
      return s.organizations
        .filter((o) => o.role_title)
        .map((o) => ({
          id: o.member_id,
          title: o.role_title,
          org: { id: o.id, name: o.name, logo: o.logo },
          shown: shown.has(o.member_id)
        }))
    },

    shownBadgeIds (s) {
      const auth = useAuthStore()
      const ids = s.badgePrefs[auth.rootEntityId]
      return Array.isArray(ids) ? ids : []
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
    },

    toggleBadge (memberId) {
      const auth = useAuthStore()
      const root = auth.rootEntityId
      if (!root) return
      const ids = new Set(this.badgePrefs[root] || [])
      if (ids.has(memberId)) ids.delete(memberId)
      else ids.add(memberId)
      this.badgePrefs = { ...this.badgePrefs, [root]: [...ids] }
      try {
        localStorage.setItem(BADGES_KEY, JSON.stringify(this.badgePrefs))
      } catch (_) { /* storage blocked — the wardrobe won't survive reload */ }
    }
  }
})
