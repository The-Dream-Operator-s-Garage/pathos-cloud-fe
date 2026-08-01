<template>
  <MiniPanel :to="targetRoute">
    <template #title>
      <q-icon name="schedule" size="13px" class="q-mr-xs moment-mini__icon" />
      {{ headline }}
    </template>

    <template #chips>
      <span v-if="human?.place" class="mini-chip-fact">
        <q-icon name="place" size="11px" class="q-mr-xs" />
        {{ human.place }}
      </span>
      <span v-if="ago" class="mini-chip-fact" :title="moment.time_utc || ''">
        <q-icon name="history" size="11px" class="q-mr-xs" />
        {{ ago }}
      </span>
    </template>

    <template #hash>
      <MomentMicro :id="moment.id" :path="moment.path" :show-type="true" />
    </template>

    <template #body>
      <div class="moment-mini__facts mono">
        <div>{{ moment.time_utc }}</div>
        <div v-if="hasCoords">{{ moment.space_x }}, {{ moment.space_y }}</div>
      </div>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { date } from 'quasar'
import { timeAgo } from 'src/utils/time'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MomentMicro from './MomentMicro.vue'

export default defineComponent({
  name: 'MomentMini',
  components: { MiniPanel, MomentMicro },
  props: {
    // Moment row { id, path, space_x, space_y, space_z, time, time_utc }.
    moment: { type: Object, required: true },
    // Optional server-resolved { datetime, place } lines.
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

    return { targetRoute, headline, ago, hasCoords }
  }
})
</script>

<style lang="scss" scoped>
.moment-mini__icon { color: #c79a00; }
.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}
.moment-mini__facts {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.6);
  line-height: 1.5;
}
</style>
