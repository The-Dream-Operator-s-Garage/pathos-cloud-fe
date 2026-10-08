<template>
  <!-- THE SECRET CARD (2026-10-08, the card family) — an invite secret
       (minted by an owner, consumed by the entity that registered through
       it) as a CARD: the seal's state and its two PARTIES read in full, the
       minting as the byline's when, the owner as its who. The row is the
       sanitized one (never password_hash — secretService's allow-list).
       Acts: share · open (secrets take no pins, comments or forks). -->
  <CardPanel kind="secrets" :address="secret.path" :open="isOpen" :fill="fill">
    <template #cap>
      <CardCap
        kind="secrets"
        :icons="['key']"
        icons-title="A secret — an invitation"
        :title="`secret #${secret.id}`"
        :title-tip="secret.path"
        :acts="[shareAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="owner" :when="when">
        <template #rail>
          <span class="element-card__rail-text mono">{{ secret.used_at ? 'consumed' : 'open invitation' }}</span>
        </template>
      </CardByline>
    </template>

    <template #pit>
      <div class="secret-card__body">
        <div class="secret-card__state" :class="secret.used_at ? 'is-used' : 'is-open'">
          <q-icon :name="secret.used_at ? 'lock' : 'lock_open'" size="14px" />
          <span>{{ secret.used_at ? 'consumed — the invitation was taken' : 'open invitation — not yet taken' }}</span>
        </div>
        <div class="secret-card__parties">
          <div class="secret-card__party">
            <span class="secret-card__role">minted by</span>
            <template v-if="owner">
              <EntityAvatar :entity="owner" :size="22" />
              <EntityName :entity="owner" :bold="false" />
            </template>
            <span v-else class="secret-card__mute">—</span>
          </div>
          <span class="secret-card__arrow">→</span>
          <div class="secret-card__party">
            <span class="secret-card__role">taken by</span>
            <template v-if="receiver">
              <EntityAvatar :entity="receiver" :size="22" />
              <EntityName :entity="receiver" icon="person_add" :bold="false" />
            </template>
            <span v-else class="secret-card__mute">nobody yet</span>
          </div>
        </div>
        <dl class="secret-card__facts">
          <dt>minted</dt><dd class="mono">{{ secret.created_at || '—' }}</dd>
          <dt>consumed</dt><dd class="mono">{{ secret.used_at || '—' }}</dd>
        </dl>
      </div>
    </template>

    <template #foot>
      <CardFoot kind="secrets" :id="secret.id" :path="secret.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span v-if="minted" class="element-card__stat" :title="secret.created_at || ''">minted {{ minted }}</span>
          <span v-if="consumed" class="element-card__stat" :title="secret.used_at || ''">consumed {{ consumed }}</span>
        </template>
      </CardFoot>
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import EntityName from 'src/components/entities/EntityName.vue'
import { timeAgo, absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'SecretCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, EntityAvatar, EntityName },
  props: {
    // Sanitized secret row { id, path, owner_id, receiver_id, used_at, created_at }.
    secret: { type: Object, required: true },
    owner: { type: Object, default: null },
    receiver: { type: Object, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const minted = computed(() => (props.secret.created_at ? timeAgo(props.secret.created_at) : ''))
    const consumed = computed(() => (props.secret.used_at ? timeAgo(props.secret.used_at) : ''))
    const when = computed(() => (props.secret.created_at ? { datetime: absoluteTime(props.secret.created_at) } : null))

    const card = useElementCard(props, emit, () => ({
      kind: 'secrets',
      address: props.secret.path || '',
      id: props.secret.id,
      label: `secret #${props.secret.id}`,
      ownerId: props.secret.owner_id ?? props.owner?.id ?? null
    }))

    return { minted, consumed, when, ...card }
  }
})
</script>

<style lang="scss" scoped>
.secret-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.84em;
}
.secret-card__state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &.is-used { color: #9c4a4a; }
  &.is-open { color: #22794a; }
}
.secret-card__parties {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.secret-card__party {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.secret-card__role {
  font-family: var(--font-display);
  font-size: 0.72em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.55);
}
.secret-card__arrow { color: var(--card-accent, #4e342e); }
.secret-card__mute { color: rgba(var(--ink-rgb), 0.5); font-style: italic; }
.secret-card__facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 12px;
  margin: 0;
  font-size: 0.92em;
  dt { color: rgba(var(--ink-rgb), 0.55); }
  dd { margin: 0; }
}
</style>
