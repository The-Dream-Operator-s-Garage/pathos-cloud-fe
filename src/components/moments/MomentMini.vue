<template>
  <!-- THE MOMENT MINI — a moment (a when, and often a where) quoted into a
       post, a path lane, a skeleton's date field, the file tree.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "take as layout
       the node mini viewer … use the nano pills icons and coloring"). It was
       the default STACK head (clock + date / place + ago / the chip) over two
       mono lines. NodeMini's grammar now, in the moment pill's carved gold:
         HEAD  chip+copy │ Tue, 23 Jun 2026 · 4:01 AM │ open   (MiniHead)
         BODY  the thing itself, as a node shows its picture — the tiny
               WORLD MAP with its pin when the moment is located
               (MomentFace's own map), else the raw UTC stamp
         FOOT  🕓 Mexico City, MX · 3d ago                   (MiniFoot)
       All client-side moment formatting is UTC (the chips' rule). -->
  <MiniPanel kind="moments" :to="targetRoute">
    <template #head>
      <MiniHead
        kind="moments"
        :id="moment.id"
        :path="moment.path"
        :integrity="moment.integrity || null"
        :name="headline"
        :name-title="moment.time_utc ? `${headline} (UTC ${moment.time_utc})` : headline"
      />
    </template>

    <template #body>
      <MomentWorldMap
        v-if="hasCoords"
        class="moment-mini__map"
        :lat="moment.space_x"
        :lon="moment.space_y"
        :city="human?.city || ''"
        :country="human?.country || ''"
        :place="human?.place || ''"
      />
      <div v-else class="moment-mini__facts mono">{{ moment.time_utc || '(no time)' }}</div>
    </template>

    <template v-if="footFacts.length" #foot>
      <MiniFoot kind="moments" :facts="footFacts" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { date } from 'quasar'
import { timeAgo } from 'src/utils/time'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import MomentWorldMap from './MomentWorldMap.vue'

export default defineComponent({
  name: 'MomentMini',
  components: { MiniPanel, MiniHead, MiniFoot, MomentWorldMap },
  props: {
    // Moment row { id, path, space_x, space_y, space_z, time, time_utc }.
    moment: { type: Object, required: true },
    // Optional server-resolved { datetime, place, city, country } lines.
    human: { type: Object, default: null },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/moments/${props.moment.id}`)

    const headline = computed(() => {
      if (props.human?.datetime) return props.human.datetime
      const raw = props.moment?.time_utc
      if (!raw) return `moment #${props.moment.id}`
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return `moment #${props.moment.id}`
      // Format in UTC (pathchain's canonical time) — quasar formatDate is
      // local-only, so shift by the tz offset first.
      const u = new Date(d.getTime() + d.getTimezoneOffset() * 60000)
      return date.formatDate(u, 'ddd, D MMM YYYY · h:mm A')
    })

    const ago = computed(() => timeAgo(null, props.moment) || '')

    const hasCoords = computed(() =>
      Number(props.moment?.space_x) !== 0 || Number(props.moment?.space_y) !== 0)

    const footFacts = computed(() => [
      props.human?.place || (hasCoords.value ? `${props.moment.space_x}, ${props.moment.space_y}` : ''),
      ago.value && { text: ago.value, title: props.moment.time_utc || '' }
    ].filter(Boolean))

    return { targetRoute, headline, hasCoords, footFacts }
  }
})
</script>

<style lang="scss" scoped>
// The map is a figure in the family body's centre — capped to a thumbnail's
// width, its own caption kept (the place under the pin).
.moment-mini__map {
  max-width: 220px;
  margin: 2px auto;
}

.moment-mini__facts {
  font-size: 0.78em;
  line-height: 1.5;
  color: #5b6c82;
  padding: 2px 4px;
}
</style>
