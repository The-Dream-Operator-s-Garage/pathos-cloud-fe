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

       ⭐ 2026-09-11 (user ask: "make the user section … occupy the size of
       the profile pic. remove the name and handle too … I just want to
       reduce the surface it occupies", then "make this profile button …
       the same size as the dashboard button on the right end") — THE CHIP
       IS THE FACE, at every width, in the DASHBOARD BUTTON'S BOX. The
       avatar-only state that used to be the sub-1024px branch is now the
       ONLY state, and --nav-id-w is one number equal to --nav-dash-w (42px,
       the rail-slot width): the name and the handle are GONE from the
       markup, the badge row is parked, and what the chip no longer says it
       says on hover (`title` carries name + acting org) and in the window it
       opens. The reduction is the drawer mini-state's argument taken all the
       way — the face IS the identity — and it squares the mirror the
       2026-09-02 ask started: the two ends of the bar are now the same
       glyph-sized block, one holding a 24px face, the other a 21px
       dashboard glyph. The mask chip stays: acting as an alter-ego has to
       read when the face is all there is. -->
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
    <!-- The worn badges — org-given role titles the user chose to display
         (the wardrobe lives in the window). Logo mark + title, one pill per
         title. PARKED since 2026-09-11: a pill cannot ride a 34px cell, so
         the row is display:none'd (see the style below) rather than unwired
         — the wardrobe's toggles, its store key and this markup all stand,
         waiting for a surface. Give the section width back, or give the
         badges a corner mark like the mask's, and they light up again. -->
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

    // THE TOOLTIP CARRIES WHAT THE CHIP NO LONGER PRINTS (2026-09-11): the
    // display name, and — when masked — the org and role title the old
    // second line spelled out ("@ <org> · <title>"). Hover is the reading
    // surface now; the window is the full one.
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

    return { identity, user, isAlterEgo, tooltip }
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
  // ⭐ 2026-09-11 — THE FACE IS CENTRED IN ITS OWN CELL. With the name, the
  // handle and the badge row gone there is nothing to lead into, so the
  // left-reading padding/gap the two-line stamp needed goes with them: the
  // 24px avatar sits in the middle of the 41px content box (--nav-id-w less
  // its closing hairline), the same box the dashboard button centres its
  // 21px glyph in at the other end. A picture, and the air around it.
  justify-content: center;
  gap: 0;
  padding: 0;
  border: none;
  background: var(--plaque-coat);
  cursor: pointer;
  text-align: left;
  min-width: 0;
  font-family: var(--font-body, inherit);

  // ⭐ 2026-09-11 — THE DASHBOARD BUTTON'S TWO STATES, to the declaration.
  // The mirror the user asked for is not only the box: this block and
  // `.nav-bar .dashboard-btn` are the bar's two full-height end cells, so
  // they answer the pointer and the standing window in one grammar — the
  // bar's shared `--grey-3` hover (`.nav-btn`'s), and `--grey-4` for the
  // panel-is-standing state.
  &:hover { background: var(--grey-3); }

  // THE WINDOW IS STANDING. This wore `--orange-2` for eleven days — the one
  // place the identity window's colorway reached the bar, under the
  // button-wears-its-window's-tone tie. The tie is INTACT and is exactly why
  // the tone moved: the window went to the board's grey family the same
  // sitting (see IdentityDock.vue), so the chip follows it to `--grey-4`,
  // the darker-grey-rather-than-accent argument the dashboard block has
  // carried since 2026-08-10. The plate is the WHOLE tell now — there is no
  // name or sub-line ink left to tint.
  &.is-active { background: var(--grey-4); }
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

// Worn badges — tiny pills in the window's family (grey rim, pale face,
// brown-8 title, since the window left orange the same sitting). PARKED
// 2026-09-11 as well: a
// 17px pill cannot ride a 33px content box beside a 24px face, so the row is
// held at `display: none` while the section is the picture's size. The rules
// below are the pills' REMAINING wardrobe, kept whole (with the markup and
// the store's `shownBadges`) so restoring them is one declaration, not a
// rebuild — widen --nav-id-w and flip this back to `flex`, or give the
// badges a corner mark the way the mask above takes one.
.identity-chip__badges {
  display: none;
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
  border: 1px solid var(--grey-5);
  border-radius: 9px;
  background: var(--grey-2);
  min-width: 0;
  flex: 0 1 auto;
}

.identity-chip__badge-title {
  font-size: 0.56em;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--brown-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// (The `@media (max-width: 1023px)` block that USED to hold this reduction
// retired on 2026-09-11 — its rules are the base rules now. One state, one
// width, no gate: the dial is 34px everywhere and the chip is the face
// everywhere, so there is nothing left for the breakpoint to say.)
</style>
