<template>
  <!-- ENTITY AVATAR (2026-07-25) — an entity's face, as a rounded-square tile.

       The photo is not a column on the entity: it is the `nodes/<hash>`
       reference bound into that entity's USER_PROFILE > PROFILE_PHOTO
       field, resolved server-side into `{ url, … }`. So this component
       takes whatever the caller already has (a feed item's `author`
       carries the photo inline) and only falls back to the cached
       refs/summary resolver when handed a bare id.

       Three states, in order: the photo, the pioneer's star, a monogram.
       The monogram is not a placeholder to be ashamed of — it is a real
       fallback with a deterministic colour per entity, so a faceless
       author still reads as a distinct person down a column of cards.

       The tile is a ROUNDED SQUARE (2026-07-25, second pass), not a disc:
       the generated faces are square compositions and a circular crop was
       eating their corners, and a square sits square with everything else
       the platform draws (cards, wells, chips). -->
  <span
    class="entity-avatar"
    :class="{ 'entity-avatar--pioneer': isPioneer, 'entity-avatar--photo': !!photoUrl }"
    :style="boxStyle"
    :title="name"
  >
    <img v-if="photoUrl" :src="photoUrl" :alt="name" class="entity-avatar__img" @error="broken = true">
    <q-icon v-else-if="isPioneer" name="star" :size="glyphSize" />
    <span v-else class="entity-avatar__monogram">{{ monogram }}</span>
  </span>
</template>

<script>
import { defineComponent, ref, computed, watchEffect } from 'vue'
import { hashOf } from 'src/utils/kinds'
import { entitySummary } from 'src/utils/entityDisplay'

// Deterministic monogram tint — the same entity always gets the same one,
// and neighbouring ids never collide (the golden-angle step spreads hues
// as far apart as consecutive numbers allow).
const hueFor = (key) => {
  const s = String(key ?? '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return (h * 137.508) % 360
}

export default defineComponent({
  name: 'EntityAvatar',
  props: {
    // Enriched author/entity object — { id, path, username, display_name,
    // photo }. Any subset; `photo` skips the lookup entirely.
    entity: { type: Object, default: null },
    // Bare id fallback when the caller has no object.
    id: { type: [Number, String], default: null },
    size: { type: Number, default: 34 }
  },
  setup (props) {
    const broken = ref(false)
    const resolved = ref(null)

    const entityId = computed(() => props.entity?.id ?? props.id)
    const entityHash = computed(() => hashOf(props.entity?.path || ''))

    // Only resolve what the caller didn't bring. A feed card hands us the
    // whole author card, so the stream costs zero extra requests.
    watchEffect(() => {
      if (props.entity?.photo !== undefined && props.entity?.display_name) return
      if (entityId.value == null && !entityHash.value) return
      entitySummary({
        id: entityId.value,
        hash: entityId.value == null ? entityHash.value : null
      }).then((s) => { resolved.value = s })
    })

    const name = computed(() =>
      props.entity?.display_name || props.entity?.username ||
      resolved.value?.primary ||
      (entityId.value != null ? `entity #${entityId.value}` : ''))

    // A private photo resolves with `url: null` — there is a face, we are
    // simply not allowed to see it, and the monogram stands in.
    const photoUrl = computed(() => {
      if (broken.value) return null
      return props.entity?.photo?.url || resolved.value?.photo?.url || null
    })

    const isPioneer = computed(() => resolved.value?.pioneer === true)

    const monogram = computed(() => {
      const n = name.value.replace(/^@/, '').trim()
      return (n ? n[0] : '?').toUpperCase()
    })

    const boxStyle = computed(() => {
      const px = `${props.size}px`
      const base = { width: px, height: px, fontSize: `${Math.round(props.size * 0.42)}px` }
      if (photoUrl.value) return base
      const hue = hueFor(entityId.value ?? name.value)
      return {
        ...base,
        // The tile is drawn from one hue at two lightnesses, so the letter
        // always sits legibly on its own ground whatever the hue.
        background: `hsl(${hue}, 42%, 88%)`,
        color: `hsl(${hue}, 55%, 28%)`
      }
    })

    return { broken, name, photoUrl, isPioneer, monogram, boxStyle, glyphSize: `${Math.round(props.size * 0.5)}px` }
  }
})
</script>

<style lang="scss" scoped>
.entity-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  // A PERCENTAGE radius, not a token: the box is always square, so 26%
  // gives every size (a 34px feed chip, a 56px profile hero) the exact same
  // corner — an em-based token would follow the monogram's font-size
  // instead and the shape would drift between surfaces.
  border-radius: 26%;
  overflow: hidden;
  // One hairline rim, so a light photo still reads as a tile against a
  // light card.
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  line-height: 1;
  user-select: none;
}

.entity-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.entity-avatar__monogram {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  letter-spacing: 0;
}

// The pioneer keeps its carved-gold treatment here too — one entity on the
// platform wears it, and it should be recognisable at avatar scale.
.entity-avatar--pioneer:not(.entity-avatar--photo) {
  background: linear-gradient(160deg, #fff5cc, #e2b64a);
  color: #6d4c00;
  border-color: rgba(109, 76, 0, 0.35);
}
</style>
