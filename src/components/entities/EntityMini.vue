<template>
  <!-- THE ENTITY MINI — the face an entity (a person, an org, an agent)
       wears wherever it is quoted: `![[pathos:entities/…]]`, a path lane's
       member, a label's usages, the file tree.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "take as layout
       the node mini viewer … under the same basis so they all look
       consistent … use the nano pills icons and coloring"). It was the
       default STACK head — icon + name / @handle + joined / the chip — over
       a bio. NodeMini's grammar now, in the entity pill's blue-grey:
         HEAD  chip+copy │ display name │ open    (MiniHead)
         BODY  the FACE beside the bio — the thing itself, as a node shows
               its picture
         FOOT  👤 @allegue · joined 3mo ago      (MiniFoot)
       · the chip is EntityMicro, collapsed: an entity pill names its handle
         (never a bare hash — the July rule) and wears the pioneer's carved
         gold; so the name zone states what the entity is CALLED — the
         display name, else `entity #id` (NodeMini's `node #id` fallback);
       · the corner is the entity door (the entity window, by id). -->
  <MiniPanel kind="entities" :to="targetRoute">
    <template #head>
      <MiniHead
        kind="entities"
        :id="entity.id"
        :path="entity.path"
        :name="effectiveTitle"
        :name-class="isPioneer ? 'pioneer-gold entity-mini__pioneer' : null"
      >
        <template #chip>
          <EntityMicro :id="entity.id" :path="entity.path" collapsed />
        </template>
      </MiniHead>
    </template>

    <template #body>
      <div class="entity-mini__body">
        <EntityAvatar :entity="entity" :size="36" class="entity-mini__face" />
        <div v-if="entity.bio" class="entity-mini__bio">{{ entity.bio }}</div>
        <div v-else class="entity-mini__empty">(no bio)</div>
      </div>
    </template>

    <template v-if="footFacts.length" #foot>
      <MiniFoot kind="entities" :facts="footFacts" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed, ref, watchEffect } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import EntityMicro from './EntityMicro.vue'
import EntityAvatar from './EntityAvatar.vue'
import { entitySummary } from 'src/utils/entityDisplay'
import { timeAgo } from 'src/utils/time'

export default defineComponent({
  name: 'EntityMini',
  components: { MiniPanel, MiniHead, MiniFoot, EntityMicro, EntityAvatar },
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

    // What the entity is CALLED. The pill already says the handle, so the
    // name zone says the display name — and, for an entity with none, its
    // id (NodeMini's `node #1758`), never the handle a second time.
    const effectiveTitle = computed(() => {
      const d = String(props.entity.display_name || '').trim()
      if (d && d !== props.entity.username) return d
      if (isPioneer.value) return 'Pioneer'
      return `entity #${props.entity.id}`
    })

    const footFacts = computed(() => [
      props.entity.username && { text: '@' + props.entity.username, mono: true },
      props.entity.joined_at && { text: 'joined ' + timeAgo(props.entity.joined_at), title: props.entity.joined_at },
      isPioneer.value && 'pioneer'
    ].filter(Boolean))

    return { targetRoute, effectiveTitle, isPioneer, footFacts }
  }
})
</script>

<style lang="scss" scoped>
// The global `.pioneer-gold` surface on the name run reads as a badge.
.entity-mini__pioneer {
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid transparent;
}

// THE FACE beside the words — a row, the tile at the start, the bio
// justified in the rest (NodeMini's prose inset: 4px a side).
.entity-mini__body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 4px;
  text-align: left;
}
.entity-mini__face { flex: 0 0 auto; }

.entity-mini__bio {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: justify;
}

.entity-mini__empty {
  flex: 1 1 auto;
  align-self: center;
  font-size: 0.78em;
  color: #5b6c82;
  font-style: italic;
}
</style>
