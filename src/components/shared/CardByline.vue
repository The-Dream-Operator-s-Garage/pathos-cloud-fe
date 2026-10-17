<template>
  <!-- THE CARD BYLINE (2026-10-08, the card family) — the feed card's
       "general labeling section" (`.post-square__byline`, 2026-09-21 →
       2026-09-22 PM8), the same 2×2 for every kind:

         [ WHO: face + name over the SEATS ] [ WHEN: the moment plate ]
                                             [ WHAT: the label rail    ]

       · WHO — the author pill, two rows tall: the entity door (face 30 +
         name, `#/entities/<id>` — the capture-phase door → the entity
         window) over the seats (one chip per organization off
         `author.affiliations`: the org's face + a badge button per role,
         `utils/roleBadges.js`). A kind with no author (a moment) drops
         the pill and the column takes the band;
       · WHEN — the moment row: the TIME at its left end and, when there
         is a where, the SPACE at its right, each a bare underlined 700
         link (clock / pin glyph + words, the moment ink a quarter toward
         black) — both the moment's door when the moment has an id. A kind
         states its own when: a post its moment, a label its minting, an
         entity its joining. (Until 2026-10-17 a plate with a globe-clock
         head holding two pills — the post card shed both 2026-10-16);
       · WHAT — the label rail: one plate per label TREE and origin
         (`utils/labelBundles.js` — `verified` for the platform's own
         vocabulary, the owner's face for anyone else's), each label a door
         to its page leading with the `label` glyph. The `#rail` slot lets
         a kind state its own classification there (a label's ancestry, a
         path's member tally); `#rail-end` is the row's fixed end cell.
       Every number is the feed card's since its 2026-10-16 refit, ported
       2026-10-17 (user ask: "taking as a basis the post card aesthetics
       and for all the rest of them … adapt the header and the label
       section aesthetic rules, such as the time and place being plain
       instead of labels and also the coloring and sizing of the author
       section"): `--row-h` 20 / `--row-gap` 2, and every inner box derived
       from the row — the face 38 (2 × row + gap − 4, a prop), the seat
       row − 2, its org mark and badges row − 6, the label plates the row
       and their members row − 4; the author pill TRANSPARENT onto the
       card's coat, its name 1.2em. -->
  <div class="element-card__byline" :class="{ 'has-who': hasWho }">
    <slot name="who">
      <div v-if="author" class="element-card__pill element-card__identity">
        <router-link
          :to="'/entities/' + author.id"
          class="element-card__identity-door"
          :title="authorName + ' — open profile'"
          @click.stop
        >
          <!-- 38 = 2 × --row-h + --row-gap − 2 borders − 2 insets. ⚠ A
               prop, not CSS (the avatar sizes itself inline): move it with
               the two dials. -->
          <EntityAvatar :entity="author" :size="38" class="element-card__pill-face" />
          <span class="element-card__identity-name" :class="{ 'pioneer-gold': !!author.pioneer }">{{ authorName }}</span>
        </router-link>
        <span class="element-card__identity-seats">
          <span
            v-for="aff in (author.affiliations || [])"
            :key="aff.org.id"
            class="element-card__seat"
            :class="{ 'is-active': aff.active }"
          >
            <a
              :href="'#/entities/' + aff.org.entity_id"
              class="element-card__seat-face"
              :title="aff.org.name + (aff.active ? ' — published under this seat' : '') + ' — open organization'"
              @click.stop
            >
              <OrgLogoChip :org="aff.org" :size="14" :link="false" />
            </a>
            <button
              v-for="b in (aff.badges || [])"
              :key="b.member_id"
              type="button"
              class="element-card__badge"
              :title="roleBadgeTitle(aff.org, b)"
              :aria-label="roleBadgeTitle(aff.org, b)"
              @click.stop.prevent="openRoleBadge(aff.org, b)"
            >
              <q-icon :name="roleBadgeGlyph(b)" size="12px" />
            </button>
          </span>
        </span>
      </div>
    </slot>

    <div class="element-card__byline-col">
      <div class="element-card__byline-row">
        <slot name="when">
          <!-- THE MOMENT ROW — bare since 2026-10-17 (the post card's
               2026-10-16 rule): no plate, no globe head, no pills. The time
               holds the left end, the place the right. -->
          <div v-if="when" class="element-card__moment" :style="momentStyle">
            <component
              :is="when.id ? 'router-link' : 'span'"
              :to="when.id ? '/moments/' + when.id : undefined"
              class="element-card__when is-time"
              :title="(when.title || when.datetime) + (when.id ? ' — open moment' : '')"
              @click.stop
            >
              <q-icon name="schedule" size="12px" class="element-card__pill-icon" />
              <span class="element-card__when-text">{{ when.datetime }}</span>
            </component>
            <component
              v-if="when.place"
              :is="when.id ? 'router-link' : 'span'"
              :to="when.id ? '/moments/' + when.id : undefined"
              class="element-card__when is-space"
              :title="when.place + (when.id ? ' — open moment' : '')"
              @click.stop
            >
              <q-icon name="location_on" size="12px" class="element-card__pill-icon element-card__pill-pin" />
              <span class="element-card__when-place">{{ when.place }}</span>
            </component>
          </div>
        </slot>
        <slot name="row1-end" />
      </div>

      <div class="element-card__byline-row element-card__rail-row">
        <div class="element-card__rail" :class="{ 'is-empty': !bundles.length && !$slots.rail }">
          <slot name="rail">
            <LabelBundleRail :labels="labels" />
          </slot>
        </div>
        <slot name="rail-end" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import LabelBundleRail from 'src/components/labels/LabelBundleRail.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import { kindFor } from 'src/utils/kinds'
import { labelBundles } from 'src/utils/labelBundles'
import { roleBadgeGlyph, roleBadgeTitle } from 'src/utils/roleBadges'
import { orgService } from 'src/services/org.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

const momentKind = kindFor('moments')

export default defineComponent({
  name: 'CardByline',
  components: { EntityAvatar, OrgLogoChip, LabelBundleRail },
  props: {
    // The WHO: an identity card ({ id, display_name, username, photo?,
    // affiliations?, pioneer? }) or null.
    author: { type: Object, default: null },
    // The WHEN: { id?, datetime, place?, title? } or null.
    when: { type: Object, default: null },
    // The WHAT: label rows ({ id, name, chain?, system_label?, owner? }).
    labels: { type: Array, default: () => [] }
  },
  setup (props, { slots }) {
    const flyouts = useFlyoutViewersStore()

    const authorName = computed(() => {
      const a = props.author
      return a?.display_name || a?.username || `entity #${a?.id}`
    })
    const hasWho = computed(() => !!props.author || !!slots.who)

    const momentStyle = { '--kind-accent': momentKind.color, '--kind-ink': momentKind.ink }

    const bundles = computed(() => labelBundles(props.labels))

    // A seat badge → its ORG_MEMBER instance's window (an outsider sees the
    // locked face — doctrine); the org's window when the row can't be read.
    const openRoleBadge = async (org, badge) => {
      try {
        const r = await orgService.memberSkeleton(org.id, badge.member_id)
        if (r?.success && r.skeleton?.path) { flyouts.spawnRef(r.skeleton.path); return }
      } catch (_) { /* fall through to the org's window */ }
      if (org?.entity_id) flyouts.spawnEntity({ id: org.entity_id, display_name: org.name })
    }

    return { authorName, hasWho, momentStyle, bundles, roleBadgeGlyph, roleBadgeTitle, openRoleBadge }
  }
})
</script>

<style lang="scss" scoped>
// ── THE BAND (`.post-square__byline`, its 2026-10-16 dials) ──────────────
// `--row-h` 20 (16 until 2026-10-17): every box inside derives from it, so
// tune the two dials, nothing else. 4px under the cap's rule, 1px above the
// pit — the post card's pads.
.element-card__byline {
  --pill-h: 20px;
  --row-h: 20px;
  --row-gap: 2px;
  --byline-coat: var(--light-cream, #fcf3e0);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  padding: 4px var(--card-gutter, 4px) 1px;
  flex: 0 0 auto;
  min-width: 0;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

// THE PILL — MicroChip's material restated (cream, the 18% hairline, Space
// Mono), the chip's corner law at the pill's height.
.element-card__pill {
  --pill-h: 20px;
  --chip-half-h: calc(var(--pill-h) / 2);
  --round: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  height: var(--pill-h);
  padding: 0 6px;
  border-radius: calc(var(--chip-half-h) * var(--round));
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: var(--byline-coat, var(--light-cream, #fcf3e0));
  color: var(--kind-ink, var(--grey-8, #424242));
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-decoration: none;
  vertical-align: middle;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  &:hover { background: color-mix(in srgb, var(--kind-accent, var(--ink)) 12%, var(--byline-coat, var(--light-cream, #fcf3e0))); }
}
.element-card__pill-face { flex: 0 0 auto; }
.element-card__pill-icon { flex: 0 0 auto; opacity: 0.85; color: var(--kind-accent, currentColor); }

// ── WHO — the author pill, a 2-row GRID: face │ name / seats ────────────
// TRANSPARENT onto the card's coat (the post card's 2026-10-16 rule — a
// cream patch read as a hole in the card); the rim stays, the hover is the
// 12% accent wash over the card.
.element-card__identity {
  flex: 0 0 auto;
  background: transparent;
  &:hover { background: color-mix(in srgb, var(--kind-accent, var(--ink)) 12%, transparent); }
  --author-h: calc(2 * var(--row-h) + var(--row-gap));
  --face-inset: 1px;
  --kind-accent: var(--entity-accent, #546e7a);
  --kind-ink: var(--entity-ink, #263238);
  font-family: var(--font-display);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: calc(var(--row-h) - 1px) calc(var(--row-h) - 1px);
  grid-template-areas: 'face name' 'face seats';
  column-gap: 4px;
  row-gap: var(--row-gap);
  align-items: center;
  height: var(--author-h);
  padding: 0 6px 0 var(--face-inset);
  :deep(.entity-avatar) {
    grid-area: face;
    align-self: center;
    border-radius: calc(var(--chip-half-h) * var(--round) - 1px - var(--face-inset));
  }
  &:hover .element-card__identity-name { color: var(--entity-accent, #546e7a); }
}
.element-card__identity-door {
  display: contents;
  color: inherit;
  text-decoration: none;
}
.element-card__identity-name {
  grid-area: name;
  font-size: 1.2em;
  align-self: end;
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.element-card__identity-seats {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  grid-area: seats;
  height: calc(var(--row-h) - 1px);
  min-width: 0;
  padding-left: 0;
}
.element-card__seat {
  --seat-h: calc(var(--row-h) - 2px); // 18 — the seats row is row − 1
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex: 0 0 auto;
  height: var(--seat-h);
  box-sizing: border-box;
  padding: 0 2px 0 1px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: calc(var(--seat-h) / 2 * var(--round));
  background: var(--grey-2, #f5f5f5);
  overflow: hidden;
  transition: border-color 0.12s, background 0.12s;
  &:hover { background: var(--grey-1, #fafafa); }
  &.is-active { border-color: var(--entity-accent, #546e7a); }
}
.element-card__seat-face {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  line-height: 0;
  text-decoration: none;
  color: inherit;
  :deep(.org-logo-chip__mark) { border-radius: 4px; box-shadow: none; }
}
// (The −3px `.org-logo-chip` pull went 2026-10-17 — the post card dropped
// it 2026-10-16: it clipped the seat's mark against the seat's rim.)
.element-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: calc(var(--row-h) - 6px); // 14 — the org mark's size
  height: calc(var(--row-h) - 6px);
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--entity-accent, #546e7a);
  cursor: pointer;
  line-height: 1;
  transition: background 0.12s, color 0.12s;
  &:hover { background: rgba(var(--ink-rgb), 0.08); color: var(--entity-ink, #263238); }
}

// ── THE RIGHT COLUMN — two rows in the author pill's height ─────────────
.element-card__byline-col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(2 * var(--row-h) + var(--row-gap));
  gap: var(--row-gap);
}
.element-card__byline-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  height: var(--row-h);
}

// ── WHEN — the moment row, BARE (the post card's 2026-10-16 rule, here
// 2026-10-17): no plate, no head, no pills — the row is the glyph and an
// underlined 700 run at each end, time left, place right, in the moment's
// ink a quarter toward black; hover lifts both to the moment's gold.
.element-card__moment {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: var(--row-h);
  overflow: hidden;
}
.element-card__when {
  display: inline-flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  gap: 2px;
  padding: 0;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  color: color-mix(in srgb, var(--kind-ink, #5f4700) 75%, #000);
  text-decoration: none;
  .element-card__when-text,
  .element-card__when-place {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    text-decoration-color: rgba(var(--ink-rgb), 0.35);
  }
  &.is-space { margin-left: auto; justify-content: flex-end; }
  &:hover .element-card__when-text,
  &:hover .element-card__when-place { color: var(--kind-accent, currentColor); text-decoration-color: currentColor; }
}
.element-card__when-text { flex: 0 0 auto; }
.element-card__when-place {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── WHAT — the label rail and its plates ────────────────────────────────
.element-card__rail-row {
  --rail-corner: calc(var(--row-h) / 2 * 0.7);
  background: var(--card-coat, var(--light-cream, #fcf3e0));
  border-radius: var(--rail-corner);
}
.element-card__rail {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 3px;
  flex: 1 1 auto;
  min-width: 0;
  height: var(--row-h);
  padding: 0 2px;
  border: 0;
  border-radius: var(--rail-corner, 0) 0 0 var(--rail-corner, 0);
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  &.is-empty { min-width: 0; }
}
// The plates and their labels are `LabelBundleRail`'s (its scoped rules —
// rules here could not reach them); they size off this band's `--row-h`.

// A kind's own words in the rail (the `#rail` slot): the members' size and
// the rail's red ink, mono.
.element-card__rail :deep(.element-card__rail-text) {
  flex: 0 0 auto;
  font-size: 0.62em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--red-9, #c62828);
  white-space: nowrap;
  padding: 0 3px;
}

@media (max-width: 600px) {
  .element-card__when {
    flex: 0 20 auto;
    min-width: 0;
  }
}
</style>
