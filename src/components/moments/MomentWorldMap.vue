<template>
  <figure class="world-map" :title="caption || 'somewhere on Earth'">
    <svg class="world-map__globe" :viewBox="`0 0 ${cols} ${rows}`" role="img"
      :aria-label="caption ? `map pin near ${caption}` : 'world map'">
      <!-- the tiny world -->
      <circle
        v-for="(d, i) in landDots" :key="i"
        :cx="d[0] + 0.5" :cy="d[1] + 0.5" r="0.38"
        class="world-map__land"
      />
      <!-- the pin: radiating pulse + dot -->
      <g v-if="pin" class="world-map__pin" :transform="`translate(${pin.x}, ${pin.y})`">
        <circle class="world-map__pulse" r="2.2" />
        <circle class="world-map__pin-ring" r="1.55" />
        <circle class="world-map__pin-dot" r="0.85" />
      </g>
    </svg>
    <figcaption v-if="caption" class="world-map__caption">
      <q-icon name="place" size="13px" class="world-map__caption-icon" />
      <span v-if="city" class="world-map__city">{{ city }}<template v-if="country">,&nbsp;</template></span>
      <span v-if="country" class="world-map__country">{{ country }}</span>
      <span v-if="!city && !country" class="world-map__country">{{ place }}</span>
    </figcaption>
  </figure>
</template>

<script>
import { defineComponent, computed } from 'vue'
import worldDots, { COLS, ROWS } from './worldDots.js'

// A cute tiny dotted world with a pin on the moment's approximate location.
// Land cells come from the generated worldDots grid (3° resolution — the
// same city-level coarseness the platform stores); the pin is projected
// equirectangularly. Caption reads "City, Country" (or whichever half the
// reverse geocoder could resolve, falling back to formatted coordinates).
export default defineComponent({
  name: 'MomentWorldMap',
  props: {
    lat: { type: [Number, String], default: null },
    lon: { type: [Number, String], default: null },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    // Preformatted fallback line (server's human.place) when city/country
    // are unavailable.
    place: { type: String, default: '' }
  },
  setup (props) {
    const landDots = []
    for (let r = 0; r < worldDots.length; r++) {
      const row = worldDots[r]
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') landDots.push([c, r])
      }
    }

    const pin = computed(() => {
      const la = Number(props.lat)
      const lo = Number(props.lon)
      if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
      if (la === 0 && lo === 0) return null
      return {
        x: ((lo + 180) / 360) * COLS,
        y: ((90 - la) / 180) * ROWS
      }
    })

    const caption = computed(() =>
      props.city && props.country ? `${props.city}, ${props.country}`
        : (props.country || props.city || props.place || ''))

    return { landDots, pin, caption, cols: COLS, rows: ROWS }
  }
})
</script>

<style lang="scss" scoped>
.world-map {
  margin: 0;
  border: 1px solid #dce6f0;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, #eaf3fb 0%, #e2eef9 100%);
}

.world-map__globe {
  display: block;
  width: 100%;
  height: auto;
}

.world-map__land {
  fill: #a8bccf;
}

.world-map__pin-dot  { fill: #c79a00; }
.world-map__pin-ring {
  fill: none;
  stroke: #c79a00;
  stroke-width: 0.28;
  opacity: 0.85;
}
.world-map__pulse {
  fill: none;
  stroke: #c79a00;
  stroke-width: 0.3;
  transform-origin: center;
  animation: world-map-pulse 2.4s ease-out infinite;
}
@keyframes world-map-pulse {
  0%   { opacity: 0.9; transform: scale(0.45); }
  70%  { opacity: 0;   transform: scale(1.6); }
  100% { opacity: 0;   transform: scale(1.6); }
}

.world-map__caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px 6px;
  background: #fdf6e3;
  border-top: 1px solid #e5d3a1;
  color: #8a6d00;
  font-size: 0.82em;
  line-height: 1.2;
  text-align: center;
}
.world-map__caption-icon { flex-shrink: 0; }
.world-map__city    { font-weight: 600; }
.world-map__country { opacity: 0.9; }
</style>
