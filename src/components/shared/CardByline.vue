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
       · WHEN — the moment plate (the label plate's box with the
         `globe_clock` head) holding the TIME pill and, when there is a
         where, the SPACE pill — both the moment's door when the moment
         has an id. A kind states its own when: a post its moment, a label
         its minting, an entity its joining;
       · WHAT — the label rail: one plate per label TREE and origin
         (`utils/labelBundles.js` — `verified` for the platform's own
         vocabulary, the owner's face for anyone else's), each label a door
         to its page leading with the `label` glyph. The `#rail` slot lets
         a kind state its own classification there (a label's ancestry, a
         path's member tally); `#rail-end` is the row's fixed end cell.
       Every number is the feed card's (`--pill-h` 20 / `--row-h` 16 /
       `--row-gap` 2 / the 30px face / the 12px members). -->
  <div class="element-card__byline" :class="{ 'has-who': hasWho }">
    <slot name="who">
      <div v-if="author" class="element-card__pill element-card__identity">
        <router-link
          :to="'/entities/' + author.id"
          class="element-card__identity-door"
          :title="authorName + ' — open profile'"
          @click.stop
        >
          <EntityAvatar :entity="author" :size="30" class="element-card__pill-face" />
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
              <OrgLogoChip :org="aff.org" :size="12" :link="false" />
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
              <q-icon :name="roleBadgeGlyph(b)" size="10px" />
            </button>
          </span>
        </span>
      </div>
    </slot>

    <div class="element-card__byline-col">
      <div class="element-card__byline-row">
        <slot name="when">
          <div v-if="when" class="element-card__moment" :style="momentStyle">
            <span
              class="element-card__moment-head"
              role="img"
              :title="whenLine"
              :aria-label="'When and where — ' + whenLine"
            >
              <q-icon :name="GLOBE_CLOCK" size="12px" class="element-card__moment-glyph" />
            </span>
            <component
              :is="when.id ? 'router-link' : 'span'"
              :to="when.id ? '/moments/' + when.id : undefined"
              class="element-card__pill element-card__when is-time"
              :title="(when.title || when.datetime) + (when.id ? ' — open moment' : '')"
              @click.stop
            >
              <q-icon name="schedule" size="10px" class="element-card__pill-icon" />
              <span class="element-card__when-text">{{ when.datetime }}</span>
            </component>
            <component
              v-if="when.place"
              :is="when.id ? 'router-link' : 'span'"
              :to="when.id ? '/moments/' + when.id : undefined"
              class="element-card__pill element-card__when is-space"
              :title="when.place + (when.id ? ' — open moment' : '')"
              @click.stop
            >
              <q-icon name="location_on" size="10px" class="element-card__pill-icon element-card__pill-pin" />
              <span class="element-card__when-place">{{ when.place }}</span>
            </component>
          </div>
        </slot>
        <slot name="row1-end" />
      </div>

      <div class="element-card__byline-row element-card__rail-row">
        <div class="element-card__rail" :class="{ 'is-empty': !bundles.length && !$slots.rail }">
          <slot name="rail">
            <div
              v-for="b in bundles"
              :key="b.key"
              class="element-card__bundle"
              :class="b.platform ? 'is-platform' : 'is-entity'"
            >
              <span
                class="element-card__bundle-root"
                :title="originOf(b)"
                :role="b.platform ? 'img' : undefined"
                :aria-label="b.platform ? originOf(b) : undefined"
              >
                <q-icon v-if="b.platform" name="verified" size="12px" class="element-card__bundle-verified" />
                <a
                  v-else-if="b.owner"
                  :href="'#/entities/' + b.owner.id"
                  class="element-card__bundle-face"
                  :aria-label="originOf(b) + ' — open profile'"
                  @click.stop
                >
                  <EntityAvatar :entity="b.owner" :size="12" />
                </a>
                <span v-else class="mono">{{ b.root }}</span>
              </span>
              <template v-for="lp in b.items" :key="lp.id">
                <span class="element-card__bundle-item">
                  <router-link
                    :to="'/labels/' + lp.id"
                    class="element-card__label mono"
                    :title="lp.path"
                    @click.stop
                  >
                    <q-icon name="label" size="10px" class="element-card__label-glyph" />
                    <span
                      v-for="(name, i) in lp.names"
                      :key="i"
                      class="element-card__label-step"
                      :class="{ 'is-leaf': i === lp.names.length - 1 }"
                    >{{ name }}</span>
                  </router-link>
                </span>
              </template>
            </div>
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
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import { GLOBE_CLOCK } from 'src/utils/glyphs'
import { kindFor } from 'src/utils/kinds'
import { labelBundles, bundleOrigin } from 'src/utils/labelBundles'
import { roleBadgeGlyph, roleBadgeTitle } from 'src/utils/roleBadges'
import { orgService } from 'src/services/org.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

const momentKind = kindFor('moments')

export default defineComponent({
  name: 'CardByline',
  components: { EntityAvatar, OrgLogoChip },
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
    const whenLine = computed(() => {
      const w = props.when
      if (!w) return ''
      return w.place ? `${w.datetime} · ${w.place}` : (w.datetime || '')
    })

    const bundles = computed(() => labelBundles(props.labels))
    const originOf = (b) => bundleOrigin(b)

    // A seat badge → its ORG_MEMBER instance's window (an outsider sees the
    // locked face — doctrine); the org's window when the row can't be read.
    const openRoleBadge = async (org, badge) => {
      try {
        const r = await orgService.memberSkeleton(org.id, badge.member_id)
        if (r?.success && r.skeleton?.path) { flyouts.spawnRef(r.skeleton.path); return }
      } catch (_) { /* fall through to the org's window */ }
      if (org?.entity_id) flyouts.spawnEntity({ id: org.entity_id, display_name: org.name })
    }

    return { GLOBE_CLOCK, authorName, hasWho, momentStyle, whenLine, bundles, originOf, roleBadgeGlyph, roleBadgeTitle, openRoleBadge }
  }
})
</script>

<style lang="scss" scoped>
// ── THE BAND (`.post-square__byline`, 2026-09-22 PM6 dials) ──────────────
.element-card__byline {
  --pill-h: 20px;
  --row-h: 16px;
  --row-gap: 2px;
  --byline-coat: var(--light-cream, #fcf3e0);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  padding: 1px var(--card-gutter, 4px);
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
.element-card__identity {
  flex: 0 0 auto;
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
  align-self: center;
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
  --seat-h: 14px;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex: 0 0 auto;
  height: var(--seat-h);
  box-sizing: border-box;
  padding: 0 2px 0 0;
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
.element-card__byline .org-logo-chip { margin-left: -3px; }
.element-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
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

// ── WHEN — the moment plate: the label plate's box, the globe-clock head,
// the TIME and SPACE pills grown to share its length ─────────────────────
.element-card__bundle,
.element-card__moment {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  height: 16px;
  box-sizing: border-box;
  padding: 0 3px;
  border: 1px solid var(--grey-5, #bdbdbd);
  box-shadow: none;
  border-radius: 5px;
  overflow: hidden;
  background: var(--identity-coat, var(--grey-3, #eeeeee));
  &:hover { border-color: var(--grey-7, #757575); }
}
.element-card__moment {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
}
.element-card__moment-head {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: -1px;
  line-height: 0;
}
.element-card__moment-glyph {
  flex: 0 0 auto;
  color: var(--kind-accent, #c79a00);
}
.element-card__moment:hover .element-card__moment-glyph { color: var(--kind-ink, #5f4700); }
.element-card__when {
  --pill-h: 12px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 3px;
  gap: 2px;
  font-size: 0.62em;
  line-height: 1;
  border-width: 0.5px;
  border-radius: 3px;
  &.is-time { flex: 1 0 auto; }
  &:hover .element-card__when-text,
  &:hover .element-card__when-place { color: var(--kind-accent, currentColor); }
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
.element-card__bundle:hover .element-card__bundle-verified { color: var(--entity-ink, #263238); }
.element-card__bundle-root {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: -1px;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--red-9, #c62828);
}
.element-card__bundle-verified {
  flex: 0 0 auto;
  color: var(--entity-accent, #546e7a);
}
.element-card__bundle-face {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  line-height: 0;
  text-decoration: none;
  color: inherit;
}
.element-card__bundle-item {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0 3px;
  height: 12px;
  box-sizing: border-box;
  line-height: 1;
  border: 0.5px solid var(--grey-5, #bdbdbd);
  box-shadow: none;
  border-radius: 3px;
  background: var(--light-cream, #fcf3e0);
}
.element-card__label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-decoration: none;
  color: var(--red-9, #c62828);
  line-height: 1;
  &:hover { color: var(--red-10, #b71c1c); }
}
.element-card__label-step {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  & + &::before {
    content: '›';
    margin: 0 4px;
    opacity: 0.55;
  }
  &.is-leaf {
    font-weight: 700;
    color: var(--red-10, #b71c1c);
  }
}
.element-card__label-glyph {
  flex: 0 0 auto;
  margin-right: 2px;
}
.element-card__label:hover .element-card__label-step.is-leaf { color: var(--red-10, #b71c1c); }

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
