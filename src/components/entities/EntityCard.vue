<template>
  <!-- THE ENTITY CARD — "the main card with the entity skeleton
       information": the subject-panel every primal viewer wears (node /
       path / moment / secret / link), filled with who this actor is. Lived
       inline in EntityProfilePage until 2026-09-11, when the entity WINDOW
       (ElementFlyout's entity face) needed the same card in a box that is
       not the page — so the card is a component the page and the window
       both mount, and the page keeps only its grid.

       KIND-AWARE (same day, user ask: "properly arranged to represent
       organizations and non-human entities"). One card, three shapes:
       · a PERSON — face, name, @handle, bio, the profile facts;
       · an ORGANIZATION (type 3) — the org's LOGO beside its name, the
         ORG_PROFILE's tagline under it and its MISSION as the body, the
         org facts (members, parent, founded, founder, website, the
         viewer's access verdict) and the door to the organization page;
       · a NON-HUMAN seat (a BOT, an AGENT-labeled row) or an ALTER-EGO —
         the person's card with a NATURE line naming what kind of thing
         answers here and pointing at the origin constellation, which is
         where the person behind it is (or is not) disclosed.
       The glyph follows the kind everywhere it is drawn (utils/entityKind):
       the pioneer's star, the org's building, the bot, the masks, the
       person. -->
  <main class="subject-panel entity-card" :class="{ 'is-org': isOrg }">

    <header class="subject-panel__ident">
      <div class="subject-panel__titlebar">
        <q-icon
          :name="glyph"
          size="22px"
          class="subject-panel__title-icon"
          :class="tintClass"
        />
        <span class="vsep" aria-hidden="true" />
        <div class="subject-panel__title nasalization">
          <span :class="{ 'pioneer-gold entity-title--pioneer': isPioneer }">{{ displayName }}</span>
          <span v-if="username" class="title-username mono">@{{ username }}</span>
        </div>
      </div>

      <div class="subject-panel__labels">
        <template v-if="inviter">
          <span class="rail-label">invited by</span>
          <!-- Self-resolving: /refs/summary supplies the username and
               the pioneer flag, so a pioneer inviter renders gold. -->
          <EntityInfo :id="inviter.id" />
        </template>
        <span v-if="inviter && moment" class="vsep" aria-hidden="true" />
        <MomentInfo v-if="moment" :moment="moment" />
        <span v-if="(inviter || moment) && labels.length" class="vsep" aria-hidden="true" />
        <LabelSlider v-if="labels.length" :labels="labels" />
      </div>
    </header>

    <!-- Meta strip — id + kind + on-disk address with copy. -->
    <div class="subject-panel__meta">
      <q-icon :name="glyph" size="14px" class="meta-icon" :class="tintClass" />
      <div class="meta-label">
        <span v-if="isPioneer" class="pioneer-gold entity-meta--pioneer">★ pioneer</span>
        <strong>entity #{{ entity.id }}</strong>
        <span class="meta-typename">({{ typeLabel }})</span>
        <span v-if="organization" class="meta-typename">· org #{{ organization.id }}</span>
        <span v-if="nonHuman" class="meta-nature"><q-icon name="smart_toy" size="12px" /> non-human</span>
      </div>
      <q-space />
      <span class="meta-hash mono" :title="entity.path">{{ entity.path }}</span>
      <q-btn
        flat dense size="sm" icon="content_copy"
        :ripple="false"
        :title="copied ? 'Copied!' : 'Copy path'"
        @click="copyPath"
        class="meta-btn"
      />
      <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
    </div>

    <!-- Body — who this actor is: bio (or mission) as the content, the
         profile facts, then the decoded protobuf for verification. -->
    <div class="subject-panel__body">
      <div class="subject-panel__body-card">

        <div class="entity-hero">
          <!-- The real face when the entity's USER_PROFILE >
               PROFILE_PHOTO is bound and readable (2026-07-25);
               the generic kind glyph otherwise, so entities without a
               photo keep the treatment they always had. -->
          <EntityAvatar
            v-if="entity.profile?.photo?.url"
            :entity="{ id: entity.id, display_name: displayName, photo: entity.profile.photo }"
            :size="56"
          />
          <q-avatar
            v-else
            size="56px"
            :color="isPioneer ? 'transparent' : 'primary'"
            text-color="white"
            :icon="glyph"
            class="entity-hero__avatar"
            :class="{ 'pioneer-gold entity-hero__avatar--pioneer': isPioneer }"
          />
          <div class="entity-hero__names">
            <div class="entity-hero__display nasalization">
              <span :class="{ 'pioneer-gold entity-title--pioneer': isPioneer }">{{ displayName }}</span>
              <!-- An org wears its own badge beside its name — the LOGO
                   the masks wear on the feed, on the org itself. -->
              <OrgLogoChip v-if="orgCard" :org="orgCard" :size="20" :link="false" class="entity-hero__logo" />
            </div>
            <div v-if="username" class="entity-hero__username mono">@{{ username }}</div>
            <div v-if="orgProfile?.tagline" class="entity-hero__tagline">{{ orgProfile.tagline }}</div>
          </div>
        </div>

        <!-- ══ ORGANIZATION ══ -->
        <template v-if="isOrg">
          <div v-if="orgProfile?.mission" class="entity-bio">{{ orgProfile.mission }}</div>
          <div v-else-if="entity.profile?.bio" class="entity-bio">{{ entity.profile.bio }}</div>
          <div v-else class="entity-bio entity-bio--empty">(no mission stated yet)</div>

          <div class="entity-facts">
            <div class="fact-row">
              <span class="fact-key mono">members</span>
              <span class="fact-val mono">{{ organization?.member_count ?? '—' }}</span>
            </div>
            <div v-if="organization?.parent" class="fact-row">
              <span class="fact-key mono">part of</span>
              <span class="fact-val">
                <router-link :to="`/organizations/${organization.parent.id}`" class="entity-card__link">
                  <q-icon name="corporate_fare" size="12px" /> {{ organization.parent.name }}
                </router-link>
              </span>
            </div>
            <div v-if="orgProfile?.founded_at" class="fact-row">
              <span class="fact-key mono">founded</span>
              <span class="fact-val"><MomentInfo :moment="orgProfile.founded_at" dense /></span>
            </div>
            <div v-if="orgProfile?.founder" class="fact-row">
              <span class="fact-key mono">founder</span>
              <span class="fact-val"><EntityInfo :id="orgProfile.founder.id" dense /></span>
            </div>
            <div v-if="orgProfile?.website" class="fact-row">
              <span class="fact-key mono">website</span>
              <span class="fact-val">
                <a :href="orgProfile.website" target="_blank" rel="noopener" class="entity-card__link">{{ orgProfile.website }}</a>
              </span>
            </div>
            <div class="fact-row">
              <span class="fact-key mono">access</span>
              <span class="fact-val">
                <span class="access-pill" :class="orgAccess === 'member' ? 'access-pill--member' : 'access-pill--locked'">
                  <q-icon :name="orgAccess === 'member' ? 'lock_open' : 'lock'" size="11px" />
                  {{ orgAccess === 'member' ? 'you are a member' : 'members only' }}
                </span>
              </span>
            </div>
            <div v-if="orgProfile?.skeleton_id" class="fact-row">
              <span class="fact-key mono">org profile</span>
              <span class="fact-val">
                <InfoChip
                  kind="skeletons"
                  :id="orgProfile.skeleton_id"
                  :primary="'ORG_PROFILE #' + orgProfile.skeleton_id"
                  dense
                />
              </span>
            </div>
          </div>

          <router-link v-if="organization" :to="`/organizations/${organization.id}`" class="entity-card__door">
            <q-icon name="corporate_fare" size="14px" />
            <span>Open the organization page</span>
            <q-icon name="arrow_forward" size="12px" />
          </router-link>
        </template>

        <!-- ══ PERSON · NON-HUMAN · ALTER-EGO ══ -->
        <template v-else>
          <div v-if="entity.profile?.bio" class="entity-bio">{{ entity.profile.bio }}</div>
          <div v-else class="entity-bio entity-bio--empty">(no bio yet)</div>

          <div v-if="nature" class="entity-nature">
            <q-icon :name="nature.icon" size="15px" class="entity-nature__icon" />
            <span>{{ nature.text }}</span>
          </div>
        </template>

        <div class="entity-facts">
          <div v-if="entity.profile?.joined_at" class="fact-row">
            <span class="fact-key mono">joined</span>
            <span class="fact-val"><MomentInfo v-if="moment" :moment="moment" dense /><span v-else class="mono">{{ entity.profile.joined_at }}</span></span>
          </div>
          <div class="fact-row">
            <span class="fact-key mono">posts</span>
            <span class="fact-val mono">{{ entity.profile?.post_count ?? 0 }}</span>
          </div>
          <div v-if="entity.profile?.skeleton_id" class="fact-row">
            <span class="fact-key mono">profile skeleton</span>
            <span class="fact-val">
              <InfoChip
                kind="skeletons"
                :id="entity.profile.skeleton_id"
                :primary="'USER_PROFILE #' + entity.profile.skeleton_id"
                dense
              />
            </span>
          </div>
        </div>

        <div v-if="!entity.profile" class="no-profile-note">
          This entity has no USER_PROFILE skeleton yet. System entities and
          pre-backfill rows won't have one until <code>seed-user-profiles.js</code> runs.
        </div>

        <!-- Decoded protobuf — refs render as Info chips. -->
        <div class="decoded-section">
          <div class="decoded-heading">
            <q-icon name="data_object" size="14px" class="q-mr-xs" />
            decoded from pathchain
          </div>
          <div v-if="!decoded" class="decoded-empty">
            no on-disk buffer found for this entity
          </div>
          <div v-else class="decoded-grid">
            <div v-for="(val, key) in decodedRows" :key="key" class="fact-row">
              <span class="fact-key mono">{{ key }}</span>
              <span class="fact-val">
                <InfoChip
                  v-if="refFor(val)"
                  :kind="refFor(val).prefix"
                  :address="refFor(val).address"
                  dense
                />
                <span v-else class="mono">{{ String(val) }}</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </main>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { parseRef } from 'src/utils/kinds'
import {
  isPioneerEntity, entityGlyph, entityDisplayName, entityUsername, entityTypeLabel, isNonHuman
} from 'src/utils/entityKind'

import InfoChip from 'src/components/shared/InfoChip.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import EntityInfo from 'src/components/entities/EntityInfo.vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'

export default defineComponent({
  name: 'EntityCard',
  components: { InfoChip, MomentInfo, EntityInfo, EntityAvatar, LabelSlider, OrgLogoChip },
  props: {
    // GET /entities/:id → `entity` (row + username + profile)
    entity: { type: Object, required: true },
    moment: { type: Object, default: null },
    labels: { type: Array, default: () => [] },
    decoded: { type: Object, default: null },
    // Same read, for type-3 rows: the organization card
    // (`{ id, name, parent, member_count, profile, org_profile }`) and the
    // viewer's verdict on it ('member' | 'locked').
    organization: { type: Object, default: null },
    orgAccess: { type: String, default: null },
    // The install's Talavero seat is this entity (EntityFace resolves it
    // off GET /feed/lens-context) — the nature line names him.
    seat: { type: Boolean, default: false }
  },
  setup (props) {
    const copied = ref(false)

    const isPioneer = computed(() => isPioneerEntity(props.entity))
    const isOrg = computed(() => props.entity?.type_id === 3)
    const isAlterEgo = computed(() => props.entity?.type_id === 4)
    const nonHuman = computed(() => isNonHuman(props.entity, props.labels) || props.seat)
    const glyph = computed(() => entityGlyph(props.entity))
    const tintClass = computed(() => {
      if (isPioneer.value) return 'pioneer-tint'
      if (isOrg.value) return 'org-tint'
      if (nonHuman.value) return 'bot-tint'
      if (isAlterEgo.value) return 'ego-tint'
      return 'entity-tint'
    })

    const orgProfile = computed(() => props.organization?.org_profile || null)
    const displayName = computed(() =>
      (isOrg.value && (orgProfile.value?.name || props.organization?.name)) || entityDisplayName(props.entity))
    const username = computed(() =>
      entityUsername(props.entity) || (isOrg.value ? orgProfile.value?.handle : null) || null)
    const typeLabel = computed(() => entityTypeLabel(props.entity))
    const inviter = computed(() => props.entity?.profile?.invited_by || null)

    // The org's badge card in the feed's shape — OrgLogoChip draws the
    // LOGO when the org has a public one and a monogram plaque otherwise.
    const orgCard = computed(() => {
      if (!isOrg.value || !props.organization) return null
      return {
        id: props.organization.id,
        entity_id: props.entity.id,
        name: props.organization.name,
        handle: orgProfile.value?.handle || null,
        logo: orgProfile.value?.logo || null,
        self: true
      }
    })

    // What kind of thing answers under this name, when it is not simply a
    // person — one line, pointing at the sky where the disclosure lives.
    const nature = computed(() => {
      if (isOrg.value) return null
      if (props.seat) {
        return { icon: 'smart_toy', text: 'The feed\'s seat — Talavero, the platform\'s guardian, answers under this name. A non-human entity; its origin constellation names who stands behind it.' }
      }
      if (nonHuman.value) {
        return { icon: 'smart_toy', text: 'A non-human seat — an agent answers under this name. Its origin constellation names who stands behind it.' }
      }
      if (isAlterEgo.value) {
        return { icon: 'theater_comedy', text: 'An alter-ego — an identity a person operates. The origin constellation unravels it to its root when that is disclosed.' }
      }
      return null
    })

    // Only the proto's declared fields (entity: register, ancestor, tag).
    const decodedRows = computed(() => {
      const d = props.decoded
      if (!d) return {}
      const out = {}
      for (const key of ['register', 'ancestor', 'tag']) {
        if (d[key] !== undefined && d[key] !== '') out[key] = d[key]
      }
      return out
    })

    const refFor = (val) => parseRef(typeof val === 'string' ? val : '')

    const copyPath = () => {
      if (!props.entity?.path) return
      navigator.clipboard.writeText(props.entity.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    return {
      copied,
      isPioneer,
      isOrg,
      nonHuman,
      glyph,
      tintClass,
      orgProfile,
      displayName,
      username,
      typeLabel,
      inviter,
      orgCard,
      nature,
      decodedRows,
      refFor,
      copyPath
    }
  }
})
</script>

<style lang="scss" scoped>
// The subject-panel chrome the sibling primal viewers wear. HEIGHT is the
// host's call: the profile page pins the card to the viewport through
// `--entity-card-h` (its 75/25 grid wants a viewport-tall column with the
// body scrolling inside), the entity window leaves it content-tall and
// scrolls the whole face.
.subject-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  height:     var(--entity-card-h, auto);
  max-height: var(--entity-card-h, none);
  min-width: 0;
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  position: relative;

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.subject-panel__ident {
  padding: 8px 12px 6px;
  background: var(--panel-chrome);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.subject-panel__titlebar {
  display: flex;
  align-items: stretch;
  gap: 10px;
  border-bottom: 1px solid var(--panel-rule);
  margin: 0 -12px;
  padding: 0 12px 6px;
}
// The kind tints: the entity family's violet for a person, gold for the
// pioneer, indigo (the identity family) for an organization, the agents'
// teal for a non-human seat, the masks' plum for an alter-ego.
.subject-panel__title-icon {
  color: var(--ink);
  flex-shrink: 0;
  align-self: center;
  &.entity-tint  { color: #9b6cb0; }
  &.pioneer-tint { color: #c79a00; }
  &.org-tint     { color: #3f51b5; }
  &.bot-tint     { color: #00838f; }
  &.ego-tint     { color: #7b4f9d; }
}
.meta-icon.pioneer-tint { color: #c79a00; }
.meta-icon.org-tint     { color: #3f51b5; }
.meta-icon.bot-tint     { color: #00838f; }
.meta-icon.ego-tint     { color: #7b4f9d; }

// Chip-shaped wrappers so the global .pioneer-gold surface reads as a badge.
.entity-title--pioneer {
  padding: 1px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.entity-meta--pioneer {
  padding: 0 8px;
  margin-right: 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.86em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
// The faceless fallback wears the same rounded square as EntityAvatar
// (2026-07-25) — same 26% of the box, so a photo and a placeholder are the
// same shape on the same hero. Quasar's own `.q-avatar { border-radius: 50% }`
// is a single class, so one more class here outranks it.
.entity-hero__avatar,
.entity-hero__avatar--pioneer {
  border-radius: 26%;
}
.subject-panel__title {
  font-size: 1.25em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  .title-username {
    font-size: 0.62em;
    color: var(--panel-ink-2);
  }
}
.vsep {
  flex: 0 0 1px;
  width: 1px;
  background: var(--panel-rule);
  align-self: stretch;
}
.subject-panel__titlebar .vsep {
  margin-top: -8px;
  margin-bottom: -6px;
}
.subject-panel__labels .vsep {
  margin-top: -5px;
  margin-bottom: -6px;
}
.subject-panel__labels {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}
.rail-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
}

.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.subject-panel__meta .meta-icon  { color: var(--panel-ink-2); }
.subject-panel__meta .meta-label {
  color: var(--panel-ink-2);
  white-space: nowrap;
  strong { color: var(--panel-ink-1); }
}
.subject-panel__meta .meta-typename { color: var(--panel-ink-mute); margin-left: 4px; }
.subject-panel__meta .meta-nature {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 8px;
  padding: 0 7px;
  border-radius: 4px;
  border: 1px solid rgba(0, 131, 143, 0.35);
  background: rgba(0, 131, 143, 0.08);
  color: #00838f;
  font-size: 0.86em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.subject-panel__meta .meta-hash {
  font-size: 0.86em;
  color: var(--panel-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
  min-width: 0;
}
.subject-panel__meta .meta-btn {
  color: var(--panel-ink-2);
  &:hover { color: var(--coral-deep); }
}

.subject-panel__body {
  flex: 1 1 auto;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome);
  padding: 8px;
}
.subject-panel__body-card {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
  padding: 10px 14px;
}

// ── Entity body ────────────────────────────────────────
.entity-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px 10px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.15);
  margin-bottom: 12px;
  min-width: 0;
}
.entity-hero__names { min-width: 0; }
.entity-hero__display {
  font-size: 1.35em;
  color: var(--panel-ink-1, #1F2A38);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  word-break: break-word;
}
.entity-hero__logo { flex: 0 0 auto; }
.entity-hero__username {
  margin-top: 2px;
  font-size: 0.85em;
  color: rgba(var(--ink-rgb), 0.55);
}
.entity-hero__tagline {
  margin-top: 4px;
  font-size: 0.86em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.65);
}

.entity-bio {
  font-size: 0.92em;
  white-space: pre-wrap;
  color: var(--panel-ink-1, #1F2A38);
  padding: 4px 2px 12px;
  &.entity-bio--empty {
    font-style: italic;
    color: rgba(var(--ink-rgb), 0.4);
  }
}

// The nature line — a quiet plaque, the agents' teal, never a surface.
.entity-nature {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 12px;
  padding: 7px 10px;
  border: 1px dashed rgba(0, 131, 143, 0.4);
  border-radius: 8px;
  background: rgba(0, 131, 143, 0.05);
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.7);
  line-height: 1.4;
}
.entity-nature__icon { color: #00838f; flex: 0 0 auto; margin-top: 1px; }

.entity-facts { margin-bottom: 14px; }

.fact-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 2px;
  font-size: 0.82em;
  & + & { border-top: 1px dotted rgba(var(--ink-rgb), 0.08); }
  .fact-key {
    flex: 0 0 var(--entity-fact-key-w, 160px);
    color: rgba(var(--ink-rgb), 0.55);
  }
  .fact-val {
    color: var(--panel-ink-1, #1F2A38);
    word-break: break-all;
    min-width: 0;
  }
}

.entity-card__link {
  color: #3f51b5;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover { text-decoration: underline; }
}

.access-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.86em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  padding: 1px 7px;
  border: 1px solid transparent;
  &--member {
    color: #1d7a44;
    background: rgba(33, 186, 69, 0.1);
    border-color: rgba(33, 186, 69, 0.35);
  }
  &--locked {
    color: var(--panel-ink-2);
    background: rgba(var(--ink-rgb), 0.06);
    border-color: rgba(var(--ink-rgb), 0.2);
  }
}

// The door to the organization page — a full-width plaque under the facts.
.entity-card__door {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  padding: 7px 10px;
  border: 1px solid rgba(63, 81, 181, 0.35);
  border-radius: 8px;
  background: rgba(63, 81, 181, 0.06);
  color: #3f51b5;
  font-size: 0.82em;
  text-decoration: none;
  span { flex: 1 1 auto; }
  &:hover { background: rgba(63, 81, 181, 0.12); }
}

.no-profile-note {
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.55);
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px dashed rgba(var(--ink-rgb), 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 14px;
}

.decoded-section { margin-top: 4px; }
.decoded-heading {
  display: flex;
  align-items: center;
  font-size: 0.76em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-bottom: 6px;
}
.decoded-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 6px 2px;
}
.decoded-grid { padding-bottom: 8px; }
</style>
