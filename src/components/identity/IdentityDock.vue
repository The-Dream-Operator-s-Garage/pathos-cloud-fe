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
  light, a rising cast, a rounded free corner — drawn on the QUASAR ORANGE
  map (_tokens.scss § THE IDENTITY WINDOW'S ORANGE MAP): orange-3
  hairlines, orange-1/-2 wells, orange-10 ink, orange-8 contrast.

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

export default defineComponent({
  name: 'IdentityDock',
  components: { EntityAvatar, OrgLogoChip },
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
// shared coat, orange lines.
.identity-dock {
  left: 0;
  right: auto;
  bottom: var(--nav-footer-h);
  width: min(420px, 100vw);
  height: auto;
  max-height: calc(100vh - var(--media-tabs-h, 0px) - var(--nav-footer-h) - 14px);
  background: var(--plaque-coat);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid var(--orange-4, #ffb74d);
  border-left: none;
  border-bottom: none;
  border-top-left-radius: 0;
  border-top-right-radius: var(--radius-md);
  box-shadow:
    0 -10px 40px rgba(var(--ink-rgb-deep), 0.18),
    5px 0 12px rgba(var(--ink-rgb-deep), 0.16);
}

// The header row on the shared coat, ruled and inked in the window's orange.
.identity-dock .dock-bar {
  background: var(--plaque-coat);
  border-bottom: 1px solid var(--orange-3, #ffcc80);
}

.identity-dock .dock-bar__icon,
.identity-dock .dock-bar__title { color: var(--orange-10, #e65100); }
.identity-dock .dock-bar__meta { color: var(--orange-4, #ffb74d); text-transform: none; }

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
  &::-webkit-scrollbar-thumb { background: var(--orange-3, #ffcc80); border-radius: 999px; }
}

// ── The profile card ─────────────────────────────────────────
.identity-dock__card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--paper-card, #fff);
  border: 1px solid var(--orange-3, #ffcc80);
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

// The window's one button skin: paper face, orange rim + ink; the quiet
// variant mutes to the platform's greys (logout is an action, not a
// destination — the drawer's own register for it).
.identity-dock__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid var(--orange-4, #ffb74d);
  border-radius: var(--radius-sm, 6px);
  background: var(--orange-1, #fff3e0);
  color: var(--orange-10, #e65100);
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: var(--orange-2, #ffe0b2); }
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
  background: var(--orange-2, #ffe0b2);
  border: 1px solid var(--orange-4, #ffb74d);
  border-radius: var(--radius-md);
  color: var(--orange-10, #e65100);

  .q-icon { color: var(--orange-10, #e65100); }
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
.identity-dock__well {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--orange-1, #fff3e0);
  border: 1px solid var(--orange-3, #ffcc80);
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
  color: var(--orange-10, #e65100);
  .q-icon { color: var(--orange-8, #f57c00); }
}

.identity-dock__count {
  font-size: 0.9em;
  padding: 0 6px;
  border: 1px solid var(--orange-4, #ffb74d);
  border-radius: 8px;
}

.identity-dock__refresh {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  border: none;
  background: none;
  color: var(--orange-8, #f57c00);
  cursor: pointer;
  padding: 2px;
  &:hover { color: var(--orange-10, #e65100); }
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
  border: 1px solid var(--orange-3, #ffcc80);
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
  &:hover { color: var(--orange-8, #f57c00); }
}

.identity-dock__admin {
  font-size: 0.56em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid var(--orange-8, #f57c00);
  color: var(--orange-8, #f57c00);
  flex: 0 0 auto;
}

.identity-dock__role {
  margin-left: auto;
  font-size: 0.66em;
  font-style: italic;
  color: var(--orange-10, #e65100);
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
  border-top: 1px dashed var(--orange-3, #ffcc80);
  font-size: 0.72em;
  color: rgba(66, 66, 66, 0.8);
  .q-icon { color: var(--orange-8, #f57c00); }
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
  background: var(--orange-8, #f57c00);
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
  color: var(--orange-8, #f57c00);
  cursor: pointer;
  &:hover { color: var(--orange-10, #e65100); }
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
  border: 1px solid var(--orange-3, #ffcc80);
  border-radius: 9px;
  background: var(--paper-card, #fff);
  opacity: 0.6;

  &.is-shown {
    border-color: var(--orange-4, #ffb74d);
    opacity: 1;
  }
}

.identity-dock__badge-title {
  font-size: 0.64em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--orange-10, #e65100);
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
  border: 1px solid var(--orange-3, #ffcc80);
  border-radius: var(--radius-sm, 6px);
  background: none;
  color: rgba(66, 66, 66, 0.45);
  cursor: pointer;
  flex: 0 0 auto;

  &:hover { border-color: var(--orange-4, #ffb74d); }
  &.is-on {
    background: var(--orange-2, #ffe0b2);
    color: var(--orange-10, #e65100);
    border-color: var(--orange-4, #ffb74d);
  }
}

.identity-dock__hint {
  font-size: 0.62em;
  font-style: italic;
  color: rgba(66, 66, 66, 0.55);
  line-height: 1.4;
}
</style>
