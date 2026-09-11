<!--
  THE IDENTITY WINDOW (2026-08-31, user ask) — the left drawer's
  profile/organizations features, bundled into an expandable window rising
  from the footer bar's LEFT end, exactly over the IdentityChip that opens
  it (the platform's a-window-rides-its-button doctrine, mirrored to the
  bar's other corner: the creation docks rise over their chips at the right
  half, this one rises over the identity section's seat).

  CHROME: the dock family's — the shared `--plaque-coat` sheet (NO coat of
  its own: a colorway is its lines, wells and ink, never its sheet — the
  dock-coat witness's law), the `.dock-bar` header row with a traffic
  light, a rising cast, a rounded free corner.

  ⭐ 2026-09-11 (user ask: "apply to it the same aesthetic and inner frieze
  bar as the dashboard window so they look consistent instead of the
  identity window being orange") — THE ORANGE MAP IS RETIRED. For eleven
  days this window was the one QUASAR ORANGE surface on the platform
  (orange-3 hairlines, orange-1/-2 wells, orange-10 ink, orange-8
  contrast); it now wears the FLYOUT FAMILY's chrome, the same five
  `--dock-*` values `.dock-window--dashboard` declares — `--grey-4` lines
  and wells, `--grey-5` strong edge, brown-8 / brown-4 head ink — plus the
  family's two named pieces the board also carries: the `slim` FriezeBar on
  its `--grey-9` base (`.flyout-window__frieze`) between the head and the
  body, and the two-tone BEVEL on the wells (grey-5 on the lit walls,
  brown-1 where the floor climbs back). The dials are the seam, not a
  repaint: the same one chat used to go lime and the board used to go grey,
  so the two windows the footer bar's two ends open are now one family seen
  twice. The COAT never moved — it was `--plaque-coat` before and after,
  which is why this is a colorway change and not a coat one.

  ⚠ The `--orange-*` ramp itself STAYS MINTED in _tokens.scss (§ THE
  IDENTITY WINDOW'S ORANGE MAP): nothing else reads it today, but it is a
  hand-declared family (the file never imports Quasar's palette) and
  deleting it is a separate, reversible decision from wearing it.

  CONTENT, top to bottom:
    · the PROFILE CARD — face, name, @handle (the drawer block's facts at
      window scale) + the two actions that lived with them: Profile and
      Log out.
    · the ACTING band — while wearing a mask: which org, which title, and
      the way back to yourself.
    · ORGANIZATIONS — every membership with its role title, admin state and
      the put-on-the-mask identity switch (EntityOrganizations' seam, worn
      here); the All-organizations link is the drawer item's successor.
    · BADGES — the wardrobe: each org-given role title with a visibility
      toggle; shown badges ride the bar chip so the authority an org
      granted can be pointed at.
-->
<template>
  <transition name="dock-slide">
    <section
      v-if="identity.isOpen"
      class="identity-dock dock-window"
      :style="{ zIndex: windows.zOf('identity') }"
    >
      <header class="dock-bar">
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close" @click="identity.close()">
            <q-icon name="close" />
          </button>
        </div>
        <q-icon name="person" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Identity</span>
        <q-space />
        <span class="dock-bar__meta mono">{{ handle }}</span>
      </header>

      <!-- THE FLYOUT FAMILY'S BAND (2026-09-11) — the dashboard window's
           piece, mounted at the same station: between the head and what the
           window holds. `slim` (half height, one wave) on the family's
           `--grey-9` base through `.flyout-window__frieze`, so the motif
           inverts and the brown waves read as the light ON a dark strip —
           the one carved, one dark thing in the box, at both ends of the
           bar now. -->
      <FriezeBar slim class="flyout-window__frieze" />

      <div class="identity-dock__body">
        <!-- ── The profile card ─────────────────────────────── -->
        <div class="identity-dock__card">
          <EntityAvatar :entity="user" :size="40" />
          <div class="identity-dock__who">
            <span class="identity-dock__name">{{ name }}</span>
            <span class="identity-dock__handle mono">{{ handle }}</span>
          </div>
          <div class="identity-dock__actions">
            <button type="button" class="identity-dock__btn" title="Open your profile" @click="goToProfile">
              <q-icon name="badge" size="13px" />
              <span>Profile</span>
            </button>
            <button type="button" class="identity-dock__btn identity-dock__btn--quiet" title="Log out" @click="handleLogout">
              <q-icon name="logout" size="13px" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        <!-- ── Acting-as — only while a mask is on ──────────── -->
        <div v-if="isAlterEgo" class="identity-dock__acting">
          <q-icon name="theater_comedy" size="15px" />
          <div class="identity-dock__acting-text">
            <span class="identity-dock__acting-line">
              Wearing a mask
              <template v-if="identity.actingOrg"> — in <b>{{ identity.actingOrg.name }}</b></template>
            </span>
            <span v-if="identity.actingOrg?.role_title" class="identity-dock__acting-title">
              {{ identity.actingOrg.role_title }}
            </span>
          </div>
          <button type="button" class="identity-dock__btn" :disabled="switching !== null" @click="takeOffMask">
            <q-icon name="logout" size="13px" />
            <span>Take it off</span>
          </button>
        </div>

        <!-- ── Organizations ────────────────────────────────── -->
        <div class="identity-dock__well">
          <div class="identity-dock__well-head nasalization">
            <q-icon name="reduce_capacity" size="13px" />
            <span>Organizations</span>
            <span v-if="identity.organizations.length" class="identity-dock__count mono">{{ identity.organizations.length }}</span>
            <button type="button" class="identity-dock__refresh" title="Refresh" @click="identity.load(true)">
              <q-icon name="refresh" size="12px" />
            </button>
          </div>

          <div v-if="identity.loading && !identity.organizations.length" class="identity-dock__empty">
            <q-spinner size="14px" />
          </div>
          <div v-else-if="!identity.organizations.length" class="identity-dock__empty">
            No organizations yet.
          </div>

          <div v-for="o in identity.organizations" :key="o.member_id" class="identity-dock__org">
            <div class="identity-dock__org-head">
              <OrgLogoChip :org="{ id: o.id, name: o.name, logo: o.logo }" :size="16" :link="false" />
              <a class="identity-dock__org-name" href="#" @click.prevent="goToOrg(o)">{{ o.name }}</a>
              <span v-if="o.is_admin" class="identity-dock__admin">admin</span>
              <span v-if="o.role_title" class="identity-dock__role">{{ o.role_title }}</span>
            </div>
            <div v-if="o.mask" class="identity-dock__org-mask">
              <q-icon name="theater_comedy" size="12px" />
              <span class="identity-dock__mask-name">{{ o.mask.display_name }}</span>
              <span v-if="o.mask.acting" class="identity-dock__acting-chip">acting</span>
              <button
                v-else
                type="button"
                class="identity-dock__btn identity-dock__btn--tiny"
                :disabled="switching !== null"
                @click="wearMask(o.mask)"
              >
                <q-spinner v-if="switching === o.mask.id" size="10px" />
                <q-icon v-else name="login" size="11px" />
                <span>Put on the mask</span>
              </button>
            </div>
          </div>

          <button type="button" class="identity-dock__all" @click="goToOrgs">
            All organizations
            <q-icon name="arrow_forward" size="12px" />
          </button>
        </div>

        <!-- ── Badges — the wardrobe ────────────────────────── -->
        <div class="identity-dock__well">
          <div class="identity-dock__well-head nasalization">
            <q-icon name="military_tech" size="13px" />
            <span>Badges</span>
            <span v-if="identity.badges.length" class="identity-dock__count mono">{{ identity.badges.length }}</span>
          </div>

          <div v-if="!identity.badges.length" class="identity-dock__empty">
            No badges yet — organizations grant them as role titles.
          </div>

          <div v-for="b in identity.badges" :key="b.id" class="identity-dock__badge-row">
            <span class="identity-dock__badge" :class="{ 'is-shown': b.shown }">
              <OrgLogoChip :org="b.org" :size="12" :link="false" />
              <span class="identity-dock__badge-title">{{ b.title }}</span>
              <span class="identity-dock__badge-org">· {{ b.org.name }}</span>
            </span>
            <button
              type="button"
              class="identity-dock__eye"
              :class="{ 'is-on': b.shown }"
              :title="b.shown ? 'Worn on your identity chip — click to hide' : 'Hidden — click to wear it on your identity chip'"
              @click="identity.toggleBadge(b.id)"
            >
              <q-icon :name="b.shown ? 'visibility' : 'visibility_off'" size="13px" />
            </button>
          </div>

          <div v-if="identity.badges.length" class="identity-dock__hint">
            Shown badges ride your identity chip on the bar — proof of the
            titles your organizations gave you.
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useIdentityStore } from 'src/stores/identity'
import { useWindowsStore } from 'src/stores/windows'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

export default defineComponent({
  name: 'IdentityDock',
  components: { EntityAvatar, OrgLogoChip, FriezeBar },
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const auth = useAuthStore()
    const identity = useIdentityStore()
    const windows = useWindowsStore()
    const switching = ref(null)

    const user = computed(() => auth.user)
    const isAlterEgo = computed(() => auth.isActingAsAlterEgo)
    const name = computed(() =>
      auth.user?.display_name || auth.user?.username || `entity #${auth.user?.id}`)
    const handle = computed(() =>
      auth.user?.username ? `@${auth.user.username}` : `entity #${auth.user?.id}`)

    // Navigations close the window first so the destination lands in full
    // view — the same row-activate-parks bargain the side widgets strike.
    const goToProfile = () => {
      const id = auth.user?.id
      identity.close()
      if (id) router.push('/entities/' + id)
    }
    const goToOrg = (o) => {
      identity.close()
      router.push('/organizations/' + o.id)
    }
    const goToOrgs = () => {
      identity.close()
      router.push('/organizations')
    }

    // Logout followed the section out of the drawer: an action belongs with
    // the identity it ends.
    const handleLogout = () => {
      identity.close()
      auth.logout()
      router.push('/auth')
    }

    // The put-on-the-mask switch — EntityOrganizations' seam, worn here.
    // A switch re-issues the JWT; the store reload moves the acting flag.
    const wearMask = async (mask) => {
      switching.value = mask.id
      try {
        await auth.switchIdentity(mask.id)
        $q.notify({ type: 'positive', message: `Now acting as ${mask.display_name}`, icon: 'theater_comedy' })
        await identity.load(true)
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    const takeOffMask = async () => {
      switching.value = 'root'
      try {
        await auth.switchIdentity(auth.rootEntityId)
        $q.notify({ type: 'positive', message: 'Back to yourself', icon: 'person' })
        await identity.load(true)
      } catch (e) {
        $q.notify({ type: 'negative', message: e?.response?.data?.error?.message || 'switch failed' })
      } finally { switching.value = null }
    }

    return {
      identity,
      windows,
      switching,
      user,
      isAlterEgo,
      name,
      handle,
      goToProfile,
      goToOrg,
      goToOrgs,
      handleLogout,
      wearMask,
      takeOffMask
    }
  }
})
</script>

<style lang="scss" scoped>
// The window's own geometry: rising from the identity section's seat at the
// bar's LEFT end (the .dock-window base supplies position: fixed + the flex
// column). Bottom welded to the bar, left flush at the screen edge — so the
// one free corner is the top-RIGHT, which takes the dock radius; casts rise
// and reach RIGHT (the stack panel's mirrored-at-this-corner pair). The
// shared coat, the FLYOUT FAMILY's lines.
.identity-dock {
  // ⭐ THE COLORWAY (2026-09-11, user ask: "the same aesthetic … as the
  // dashboard window … instead of the identity window being orange") — the
  // five values `.dock-window--dashboard` declares, restated here rather than
  // shared through that class because that class is also a GEOMETRY (right-
  // edge join, edit mode, the maximize footprint) and this window rises at
  // the opposite corner. The dials are the house seam for exactly this: chat
  // went lime through them, the board went grey, the post window blue-grey —
  // a window in another colorway is a handful of properties on its root and
  // nothing else.
  // ⚠ `--dock-coat` IS NOT AMONG THEM and must not be added: the sheet comes
  // from `--plaque-coat` below (`background`), and `fsck --static`'s
  // `dock-coat` witness fails on an unsanctioned second declaration. A
  // colorway is its lines, wells and ink — never its sheet.
  --dock-well: var(--grey-4);
  --dock-rule: var(--grey-4);
  --dock-rule-strong: var(--grey-5);
  --dock-ink: var(--brown-8);
  --dock-ink-mute: var(--brown-4);

  left: 0;
  right: auto;
  bottom: var(--nav-footer-h);
  width: min(420px, 100vw);
  height: auto;
  max-height: calc(100vh - var(--media-tabs-h, 0px) - var(--nav-footer-h) - 14px);
  background: var(--plaque-coat);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid var(--dock-rule-strong);
  border-left: none;
  border-bottom: none;
  border-top-left-radius: 0;
  border-top-right-radius: var(--radius-md);
  box-shadow:
    0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
    5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
}

// The header row on the shared coat, ruled and inked in the family's dials —
// `--dock-rule` under it, `--dock-ink` on the glyph and title, `--dock-ink-mute`
// on the meta. The same three the board's head wears at the bar's other end.
.identity-dock .dock-bar {
  background: var(--plaque-coat);
  border-bottom: 1px solid var(--dock-rule);
}

.identity-dock .dock-bar__icon,
.identity-dock .dock-bar__title { color: var(--dock-ink); }
.identity-dock .dock-bar__meta { color: var(--dock-ink-mute); text-transform: none; }

.identity-dock__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;

  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--dock-rule); border-radius: 999px; }
}

// ── The profile card ─────────────────────────────────────────
.identity-dock__card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-md);
}

.identity-dock__who {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__name {
  font-size: 0.92em;
  font-weight: 700;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__handle {
  font-size: 0.72em;
  color: rgba(66, 66, 66, 0.62);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 0 0 auto;
}

// The window's one button skin: a pale face (`--grey-2`, a step above the
// coat rather than the sunk `--dock-well` a floor takes), the family's strong
// rim and its ink; the quiet variant mutes further still (logout is an
// action, not a destination — the drawer's own register for it, and the one
// place in this window that was already grey while the rest was orange).
.identity-dock__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--dock-rule-strong);
  border-radius: var(--radius-sm, 6px);
  background: var(--grey-2);
  color: var(--dock-ink);
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: var(--grey-3); }
  &:disabled { opacity: 0.5; cursor: default; }

  &--quiet {
    border-color: rgba(66, 66, 66, 0.25);
    background: transparent;
    color: rgba(66, 66, 66, 0.72);
    &:hover:not(:disabled) { background: rgba(66, 66, 66, 0.06); color: var(--grey-9); }
  }

  &--tiny {
    padding: 1px 7px;
    font-size: 0.64em;
  }
}

// ── Acting-as band ───────────────────────────────────────────
.identity-dock__acting {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  background: var(--grey-3);
  border: 1px solid var(--dock-rule-strong);
  border-radius: var(--radius-md);
  color: var(--dock-ink);

  .q-icon { color: var(--dock-ink); }
}

.identity-dock__acting-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
  flex: 1 1 auto;
}

.identity-dock__acting-line { font-size: 0.76em; }
.identity-dock__acting-title { font-size: 0.68em; font-style: italic; opacity: 0.85; }

// ── Wells: organizations + badges ────────────────────────────
// ⭐ 2026-09-11 — THE DASHBOARD WINDOW'S WELL, not a tinted box. The board's
// `.flyout-window__well` recipe stated at this window's scale: `--dock-well`
// sunk one step under the coat so it is a floor CUT INTO the box rather than
// a region drawn on it, and the two-tone BEVEL that draws the cut —
// `--grey-5` on the top and left (the two walls a top-left light cannot
// reach), `--brown-1` on the bottom and right (lighter, where the floor
// climbs back to the plaque). The lit pair is warm on purpose: brown-1 is the
// side widgets' plaque coat at this plaque's own lightness, so the lip
// changes HUE and nothing else. Not the class itself — that one is `flex: 1`
// and margin-bounded for a single full-height well; these two are stacked
// blocks in a scrolling body.
.identity-dock__well {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--dock-well);
  border: 1px solid var(--brown-1);
  border-top-color: var(--dock-rule-strong);
  border-left-color: var(--dock-rule-strong);
  border-radius: var(--radius-md);
}

.identity-dock__well-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.62em;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dock-ink);
  .q-icon { color: var(--grey-7); }
}

.identity-dock__count {
  font-size: 0.9em;
  padding: 0 6px;
  border: 1px solid var(--dock-rule-strong);
  border-radius: 8px;
}

.identity-dock__refresh {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  border: none;
  background: none;
  color: var(--grey-7);
  cursor: pointer;
  padding: 2px;
  &:hover { color: var(--dock-ink); }
}

.identity-dock__empty {
  font-size: 0.72em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.55);
  padding: 2px 2px 4px;
}

// One org row: head line (mark · name · admin · title), mask line below.
.identity-dock__org {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);
}

.identity-dock__org-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.identity-dock__org-name {
  font-size: 0.8em;
  font-weight: 700;
  color: var(--ink-1);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: var(--grey-7); }
}

.identity-dock__admin {
  font-size: 0.56em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid var(--grey-7);
  color: var(--grey-7);
  flex: 0 0 auto;
}

.identity-dock__role {
  margin-left: auto;
  font-size: 0.66em;
  font-style: italic;
  color: var(--dock-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto;
}

.identity-dock__org-mask {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dashed var(--dock-rule);
  font-size: 0.72em;
  color: rgba(66, 66, 66, 0.8);
  .q-icon { color: var(--grey-7); }
}

.identity-dock__mask-name {
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__acting-chip {
  font-size: 0.62em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 7px;
  border-radius: 8px;
  background: var(--grey-7);
  color: #fff;
}

.identity-dock__all {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 2px 2px 0;
  font-size: 0.7em;
  font-weight: 700;
  color: var(--grey-7);
  cursor: pointer;
  &:hover { color: var(--dock-ink); }
}

// ── Badge rows ───────────────────────────────────────────────
.identity-dock__badge-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.identity-dock__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1 1 auto;
  padding: 2px 8px 2px 4px;
  border: 1px solid var(--dock-rule);
  border-radius: 9px;
  background: var(--paper-card, #fff);
  opacity: 0.6;

  &.is-shown {
    border-color: var(--dock-rule-strong);
    opacity: 1;
  }
}

.identity-dock__badge-title {
  font-size: 0.64em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dock-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-dock__badge-org {
  font-size: 0.62em;
  color: rgba(66, 66, 66, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 1 auto;
}

.identity-dock__eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--dock-rule);
  border-radius: var(--radius-sm, 6px);
  background: none;
  color: rgba(66, 66, 66, 0.45);
  cursor: pointer;
  flex: 0 0 auto;

  &:hover { border-color: var(--dock-rule-strong); }
  &.is-on {
    background: var(--grey-3);
    color: var(--dock-ink);
    border-color: var(--dock-rule-strong);
  }
}

.identity-dock__hint {
  font-size: 0.62em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.55);
  line-height: 1.4;
}
</style>
