<template>
  <!-- THE ENTITY CARD (2026-10-08, the card family) — an entity (a person,
       an org, an agent) as a CARD. Where EntityMini is the summary (face
       beside the bio, three facts), this is the full reading in the post
       card's grammar: the cap states what it is (the kind's glyph —
       person / corporate_fare / smart_toy / theater_comedy) and what it is
       called (the pioneer's name in carved gold); the byline is the
       entity's OWN identity pill — its face and name over the seats it
       holds — beside the moment it joined and the labels filed on it; the
       pit reads the face at a portrait's size, the handle, the kind word,
       the bio in full and the facts the read carries.
       ⚠ Not `EntityProfileCard` (the /entities/:id subject panel, renamed
       from `EntityCard` the day this family arrived) — that one is the
       profile page's chrome; this one is the family's card.
       Acts: share · open (entities take no pins; comments and forks are
       refused by doctrine — 40007 — so the doors are not offered). -->
  <CardPanel kind="entities" :address="entity.path" :open="isOpen" :fill="fill">
    <template #cap>
      <CardCap
        kind="entities"
        :icons="[glyph]"
        :icons-title="kindWord"
        :title="title"
        :title-tip="entity.path || title"
        :title-class="isPioneer ? 'pioneer-gold entity-card__pioneer' : null"
        :acts="[shareAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="identity" :when="when" :labels="labels" />
    </template>

    <template #pit>
      <div class="entity-card__body">
        <EntityAvatar :entity="entity" :size="64" class="entity-card__face" />
        <div class="entity-card__words">
          <div class="entity-card__name" :class="{ 'pioneer-gold': isPioneer }">{{ title }}</div>
          <div class="entity-card__line">
            <span v-if="handle" class="mono entity-card__handle">{{ handle }}</span>
            <span class="entity-card__kind"><q-icon :name="glyph" size="11px" /> {{ kindWord }}</span>
          </div>
          <div v-if="entity.bio" class="entity-card__bio">{{ entity.bio }}</div>
          <div v-else class="entity-card__mute">(no bio)</div>
          <dl class="entity-card__facts">
            <template v-if="joinedLine"><dt>joined</dt><dd>{{ joinedLine }}</dd></template>
            <template v-if="organization"><dt>organization</dt><dd>{{ organization.name }}<span v-if="organization.member_count != null" class="entity-card__note"> · {{ organization.member_count }} members</span></dd></template>
            <template v-if="isPioneer"><dt>origin</dt><dd>the pioneer — the first entity of this install</dd></template>
          </dl>
        </div>
      </div>
    </template>

    <template #foot>
      <CardFoot kind="entities" :id="entity.id" :path="entity.path" :stats="threadStats" @stat="onStat">
        <template #chip>
          <EntityMicro class="element-card__chip" :id="entity.id" :path="entity.path" />
        </template>
        <template #end>
          <span v-if="handle" class="element-card__stat mono">{{ handle }}</span>
          <span v-if="joinedAgo" class="element-card__stat" :title="entity.joined_at || ''">joined {{ joinedAgo }}</span>
        </template>
      </CardFoot>
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import EntityAvatar from './EntityAvatar.vue'
import EntityMicro from './EntityMicro.vue'
import { entitySummary } from 'src/utils/entityDisplay'
import { entityGlyph, entityTypeLabel, entityHandle } from 'src/utils/entityKind'
import { timeAgo, absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'EntityCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, EntityAvatar, EntityMicro },
  props: {
    // Enriched entity { id, path, username, display_name, joined_at, bio, type_id, affiliations? }
    entity: { type: Object, required: true },
    // The read's extras (GET /entities/:id): the minting moment, the label
    // rail, the organization row for an org.
    moment: { type: Object, default: null },
    labels: { type: Array, default: () => [] },
    organization: { type: Object, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const isPioneer = ref(false)
    watchEffect(() => {
      if (props.entity?.id == null) return
      entitySummary({ id: props.entity.id }).then((s) => { isPioneer.value = s?.pioneer === true })
    })

    const title = computed(() => {
      const d = String(props.entity.display_name || '').trim()
      if (d && d !== props.entity.username) return d
      if (isPioneer.value) return 'Pioneer'
      return props.entity.username || `entity #${props.entity.id}`
    })
    const handle = computed(() => entityHandle(props.entity) || (props.entity.username ? '@' + props.entity.username : ''))
    const glyph = computed(() => entityGlyph(props.entity))
    const kindWord = computed(() => (entityTypeLabel(props.entity) || 'entity').toLowerCase())

    // The byline's WHO is the entity itself — its face, its name, its seats.
    const identity = computed(() => ({
      ...props.entity,
      display_name: title.value,
      affiliations: props.entity.affiliations || [],
      pioneer: isPioneer.value
    }))
    const when = computed(() => {
      const m = props.moment
      if (m?.id != null) return { id: m.id, datetime: m.human?.datetime || m.time_utc || '', place: m.human?.place || '' }
      return props.entity.joined_at ? { datetime: absoluteTime(props.entity.joined_at) } : null
    })
    const joinedAgo = computed(() => (props.entity.joined_at ? timeAgo(props.entity.joined_at) : ''))
    const joinedLine = computed(() => (props.moment?.human?.datetime || (props.entity.joined_at ? absoluteTime(props.entity.joined_at) : '')))

    const card = useElementCard(props, emit, () => ({
      kind: 'entities',
      address: props.entity.path || '',
      id: props.entity.id,
      label: title.value,
      ownerId: props.entity.id,
      target: { kind: 'entity', entity: { id: props.entity.id, display_name: title.value, path: props.entity.path } }
    }))

    return { isPioneer, title, handle, glyph, kindWord, identity, when, joinedAgo, joinedLine, ...card }
  }
})
</script>

<style lang="scss" scoped>
.entity-card__pioneer {
  padding: 0 6px;
  border-radius: 4px;
}
.entity-card__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.entity-card__face { flex: 0 0 auto; }
.entity-card__words {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.entity-card__name {
  font-family: var(--font-display);
  font-size: 1.02em;
  letter-spacing: 0.02em;
  color: var(--card-ink, #263238);
}
.entity-card__line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.6);
}
.entity-card__handle { color: var(--card-ink, #263238); }
.entity-card__kind { display: inline-flex; align-items: center; gap: 3px; }
.entity-card__bio {
  font-size: 0.92em;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.entity-card__mute { font-size: 0.82em; font-style: italic; color: rgba(var(--ink-rgb), 0.5); }
.entity-card__facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 12px;
  margin: 2px 0 0;
  font-size: 0.8em;
  dt { color: rgba(var(--ink-rgb), 0.55); }
  dd { margin: 0; }
}
.entity-card__note { color: rgba(var(--ink-rgb), 0.5); }
</style>
