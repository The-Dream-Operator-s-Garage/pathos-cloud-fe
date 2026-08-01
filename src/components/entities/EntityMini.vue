<template>
  <!-- Compact preview panel for an ENTITY. No author chip (the entity IS
       the author); no votes (entities aren't voteable). Uses the shared
       MiniPanel chrome so it sits next to NodeMini/PostMini cleanly. -->
  <MiniPanel :to="targetRoute">
    <template #title>
      <span :class="{ 'pioneer-gold entity-mini__pioneer': isPioneer }">
        <q-icon :name="isPioneer ? 'star' : 'person'" size="13px" class="q-mr-xs entity-mini__icon" />
        {{ effectiveTitle }}
      </span>
    </template>

    <template #chips>
      <span v-if="entity.username" class="mini-chip-fact">
        <q-icon name="alternate_email" size="11px" class="q-mr-xs" />
        <span class="mono">{{ entity.username }}</span>
      </span>
      <span v-if="joinedAgo" class="mini-chip-fact" :title="entity.joined_at || ''">
        <q-icon name="schedule" size="11px" class="q-mr-xs" />
        joined {{ joinedAgo }}
      </span>
    </template>

    <template #hash>
      <EntityMicro
        :id="entity.id"
        :path="entity.path"
        :show-type="true"
      />
    </template>

    <template #body>
      <div v-if="entity.bio" class="entity-mini__bio">{{ entity.bio }}</div>
      <div v-else class="entity-mini__empty">(no bio)</div>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, watchEffect } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import EntityMicro from './EntityMicro.vue'
import { entitySummary } from 'src/utils/entityDisplay'

export default defineComponent({
  name: 'EntityMini',
  components: { MiniPanel, EntityMicro },
  props: {
    // Enriched entity shape: { id, path, username, display_name, joined_at, bio }
    entity: { type: Object, required: true },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/entities/${props.entity.id}`)

    // Enriched entities don't carry ancestry, so pioneer status comes from
    // the cached summary lookup.
    const isPioneer = ref(false)
    watchEffect(() => {
      if (props.entity?.id == null) return
      entitySummary({ id: props.entity.id })
        .then((s) => { isPioneer.value = s?.pioneer === true })
    })

    const effectiveTitle = computed(() =>
      props.entity.display_name || props.entity.username || `entity #${props.entity.id}`
    )

    const joinedAgo = computed(() => {
      const iso = props.entity.joined_at
      if (!iso) return ''
      const d = Date.now() - new Date(iso).getTime()
      if (d < 0) return ''
      const s = Math.floor(d / 1000)
      if (s < 60) return `${s}s ago`
      const m = Math.floor(s / 60)
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      const days = Math.floor(h / 24)
      if (days < 30) return `${days}d ago`
      try { return new Date(iso).toLocaleDateString() } catch (_) { return iso }
    })

    return { targetRoute, effectiveTitle, joinedAgo, isPioneer }
  }
})
</script>

<style lang="scss" scoped>
.entity-mini__icon { color: #9b6cb0; vertical-align: middle; }

// Chip-shaped wrapper so the global .pioneer-gold surface reads as a badge
// inside the panel title.
.entity-mini__pioneer {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.entity-mini__bio {
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
}

.entity-mini__empty {
  font-size: 0.78em;
  color: #8995a8;
  font-style: italic;
}

.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}
</style>
