<template>
  <!-- THE IDENTITY CHIP (2026-08-31, user ask) — the drawer's profile block,
       relocated to the footer bar's very LEFT END, before the stack strip,
       standing the bar's WHOLE height (not just the trail band — that is the
       ask's own distinction; the stack strip rides the 21px band, this
       section owns the full 31px content box the way the burger/tack slots
       did). It is the identity window's opener and its parked face at once:
       the face, the name, the acting-org line and whichever org-given badges
       the user chose to wear. Clicking it toggles IdentityDock; the active
       state answers in the window's own QUASAR ORANGE, the same
       button-wears-its-window's-tone tie chat (aqua) and the dashboard
       (grey) already play on this bar.

       BELOW 1024px the section collapses to the avatar alone — --nav-id-w
       drops to 34px (the tap-target floor argument from the bar's mobile
       block) and the text/badges are display:none'd; the face IS the
       identity at rail scale, the same reduction the drawer's mini state
       made. -->
  <button
    type="button"
    class="identity-chip"
    :class="{ 'is-active': identity.isOpen }"
    :title="tooltip"
    @click="identity.toggle()"
  >
    <span class="identity-chip__facebox">
      <EntityAvatar :entity="user" :size="24" />
      <!-- The mask chip floats on the avatar's corner exactly as it did in
           the drawer: acting as an alter-ego must read in the collapsed
           (avatar-only) state too. -->
      <span v-if="isAlterEgo" class="identity-chip__mask">
        <q-icon name="theater_comedy" size="8px" />
      </span>
    </span>
    <span class="identity-chip__text">
      <span class="identity-chip__name">{{ name }}</span>
      <span class="identity-chip__sub mono">{{ subLine }}</span>
    </span>
    <!-- The worn badges — org-given role titles the user chose to display
         (the wardrobe lives in the window). Logo mark + title, ellipsizing
         as a row; authority you can point at, one pill per title. -->
    <span v-if="identity.shownBadges.length" class="identity-chip__badges">
      <span
        v-for="b in identity.shownBadges"
        :key="b.id"
        class="identity-chip__badge"
        :title="b.title + ' · ' + b.org.name"
      >
        <OrgLogoChip :org="b.org" :size="11" :link="false" />
        <span class="identity-chip__badge-title">{{ b.title }}</span>
      </span>
    </span>
  </button>
</template>

<script>
import { defineComponent, computed, onMounted, watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useIdentityStore } from 'src/stores/identity'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'

export default defineComponent({
  name: 'IdentityChip',
  components: { EntityAvatar, OrgLogoChip },
  setup () {
    const auth = useAuthStore()
    const identity = useIdentityStore()

    const user = computed(() => auth.user)
    const isAlterEgo = computed(() => auth.isActingAsAlterEgo)
    const name = computed(() =>
      auth.user?.display_name || auth.user?.username || `entity #${auth.user?.id}`)

    // Line two states WHERE you are acting when you are inside an org —
    // "@ <org> · <title>" — and falls back to the address you can be typed
    // back at (the drawer's own name-over-handle rhythm) when you are just
    // yourself.
    const subLine = computed(() => {
      const o = identity.actingOrg
      if (o) return `@ ${o.name}${o.role_title ? ' · ' + o.role_title : ''}`
      return auth.user?.username ? `@${auth.user.username}` : `entity #${auth.user?.id}`
    })

    const tooltip = computed(() => {
      const o = identity.actingOrg
      return o
        ? `${name.value} — acting in ${o.name}${o.role_title ? ' as ' + o.role_title : ''}`
        : `${name.value} — profile & organizations`
    })

    // The chip needs the org rows for the acting line + worn badges; reload
    // whenever the acting identity changes (a switch re-issues the JWT and
    // moves mask.acting to another row).
    onMounted(() => { if (auth.isAuthenticated) identity.load() })
    watch(() => auth.entityId, (id) => { if (id) identity.load(true) })

    return { identity, user, isAlterEgo, name, subLine, tooltip }
  }
})
</script>

<style lang="scss" scoped>
// The section's own box: fills `.nav-left` (NavigationBar sizes that cell to
// --nav-id-w less its closing hairline). An OPAQUE plate — the bar's own
// coat — because the trail band crosses this cell at z 0 and text cannot
// read over a meander (the same argument the stack strip's plaque plate
// makes one seat to the right).
.identity-chip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 7px;
  border: none;
  background: var(--plaque-coat);
  cursor: pointer;
  text-align: left;
  min-width: 0;
  font-family: var(--font-body, inherit);

  // Hover lifts the veil a step — the minitab's own idiom on this coat.
  &:hover {
    background:
      linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.35)),
      var(--plaque-coat);
  }

  // THE WINDOW IS STANDING — the identity window's orange, the one place
  // this colorway reaches the bar (chat's aqua / dashboard's grey pattern:
  // a button and the window it summons wear one tone).
  &.is-active {
    background: var(--orange-2, #ffe0b2);

    .identity-chip__name { color: var(--orange-10, #e65100); }
    .identity-chip__sub { color: rgba(230, 81, 0, 0.72); }
  }
}

.identity-chip__facebox {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  line-height: 0;
}

// The mask chip — the drawer block's own device at one size down: inverted
// grey so it reads on any generated avatar, ringed off the tile beneath.
.identity-chip__mask {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--grey-9);
  border: 1px solid var(--grey-3);
  .q-icon { color: var(--grey-3) !important; opacity: 1; }
}

// Two stacked lines read as ONE stamp — the feed card's identity figure,
// compacted to the bar's 31px.
.identity-chip__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.15;
  min-width: 0;
  flex: 0 1 auto;
}

.identity-chip__name {
  font-size: 0.72em;
  font-weight: 700;
  color: var(--ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-chip__sub {
  font-size: 0.6em;
  color: rgba(66, 66, 66, 0.62);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Worn badges — tiny pills in the window's orange, after the text, eating
// whatever width the name left over and ellipsizing from the last pill.
.identity-chip__badges {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  flex: 0 1 auto;
  margin-left: auto;
}

.identity-chip__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 17px;
  padding: 0 6px 0 3px;
  border: 1px solid var(--orange-4, #ffb74d);
  border-radius: 9px;
  background: var(--orange-1, #fff3e0);
  min-width: 0;
  flex: 0 1 auto;
}

.identity-chip__badge-title {
  font-size: 0.56em;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--orange-10, #e65100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Below the desktop gate the section is the face alone (--nav-id-w is 34px
// there — the dial's own media override): center the avatar, drop the rest.
@media (max-width: 1023px) {
  .identity-chip {
    justify-content: center;
    padding: 0;
    gap: 0;
  }
  .identity-chip__text,
  .identity-chip__badges { display: none; }
}
</style>
