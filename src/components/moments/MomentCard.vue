<template>
  <!-- THE MOMENT CARD (2026-10-08, the card family) — a moment (a when, and
       often a where) as a CARD: the post card's grammar, the moment's own
       facts in it. Where MomentMini is the summary (headline · tiny map ·
       place), this is the full reading — the moment's own plate stands in
       the byline (a moment has no author: the plate takes the band), the
       pit holds the world map at a figure's size over the facts the page
       states (UTC stamp, pathchain time, coordinates with the map link) and
       the elements MINTED at this moment as their nano pills (`GET
       /moments/:id/items`), the foot tallies them.
       Acts: share · open (moments take no pins, no comments, no forks — the
       doors are not offered). -->
  <CardPanel kind="moments" :address="moment.path" :open="isOpen" :fill="fill">
    <template #cap>
      <CardCap
        kind="moments"
        :icons="['schedule']"
        icons-title="A moment — a time/space anchor"
        :title="headline"
        :title-tip="moment.time_utc ? `${headline} (UTC ${moment.time_utc})` : headline"
        :acts="[shareAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :when="when">
        <template v-if="hasCoords" #rail>
          <span class="element-card__rail-text mono" :title="coordsTitle">{{ moment.space_x }}, {{ moment.space_y }}</span>
        </template>
      </CardByline>
    </template>

    <template #pit>
      <div class="moment-card__body">
        <MomentWorldMap
          v-if="hasCoords"
          class="moment-card__map"
          :lat="moment.space_x"
          :lon="moment.space_y"
          :city="human?.city || ''"
          :country="human?.country || ''"
          :place="human?.place || ''"
        />
        <dl class="moment-card__facts">
          <dt>time_utc</dt><dd class="mono">{{ moment.time_utc || '—' }}</dd>
          <dt>time (pathchain)</dt><dd class="mono">{{ moment.time ?? '—' }}</dd>
          <dt>coordinates</dt>
          <dd class="mono">
            <template v-if="hasCoords">
              {{ moment.space_x }}, {{ moment.space_y }}<template v-if="Number(moment.space_z)"> · z {{ moment.space_z }}</template>
              <a :href="osmUrl" target="_blank" rel="noopener" class="moment-card__osm" title="Open in OpenStreetMap" @click.stop>
                <q-icon name="map" size="12px" /> map
              </a>
            </template>
            <span v-else class="moment-card__mute">unlocated (0, 0)</span>
          </dd>
        </dl>
        <div class="moment-card__items">
          <div class="moment-card__heading">
            <q-icon name="history_edu" size="12px" />
            minted at this moment
            <span class="moment-card__n">{{ items.length }}</span>
          </div>
          <div v-if="loadingItems" class="moment-card__mute"><q-spinner size="12px" /> reading…</div>
          <div v-else-if="!items.length" class="moment-card__mute">nothing names this moment</div>
          <div v-else class="moment-card__chips">
            <MicroChip
              v-for="it in items"
              :key="it.address || (it.kind + ':' + it.id)"
              :kind="it.kind"
              :id="it.id"
              :path="it.address || it.path || ''"
              :display="it.primary || ''"
            />
          </div>
        </div>
      </div>
    </template>

    <template #foot>
      <CardFoot kind="moments" :id="moment.id" :path="moment.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span class="element-card__stat" :title="moment.time_utc || ''">
            <q-icon name="history_edu" size="11px" />{{ items.length }}
          </span>
          <span v-if="ago" class="element-card__stat" :title="moment.time_utc || ''">{{ ago }}</span>
        </template>
      </CardFoot>
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { date } from 'quasar'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import MomentWorldMap from './MomentWorldMap.vue'
import { momentService } from 'src/services/moment.service'
import { timeAgo } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

export default defineComponent({
  name: 'MomentCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, MicroChip, MomentWorldMap },
  props: {
    // Moment row { id, path, space_x, space_y, space_z, time, time_utc }.
    moment: { type: Object, required: true },
    // Server-resolved { datetime, place, city, country } lines.
    human: { type: Object, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const headline = computed(() => {
      if (props.human?.datetime) return props.human.datetime
      const raw = props.moment?.time_utc
      if (!raw) return `moment #${props.moment.id}`
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return `moment #${props.moment.id}`
      // UTC, the chips' rule — quasar formats local time, so shift first.
      const u = new Date(d.getTime() + d.getTimezoneOffset() * 60000)
      return date.formatDate(u, 'ddd, D MMM YYYY · h:mm A')
    })
    const hasCoords = computed(() => Number(props.moment?.space_x) !== 0 || Number(props.moment?.space_y) !== 0)
    const coordsTitle = computed(() => `${props.moment.space_x}, ${props.moment.space_y}`)
    const osmUrl = computed(() => `https://www.openstreetmap.org/?mlat=${props.moment.space_x}&mlon=${props.moment.space_y}#map=10/${props.moment.space_x}/${props.moment.space_y}`)
    const ago = computed(() => timeAgo(null, props.moment) || '')
    const when = computed(() => ({ id: props.moment.id, datetime: headline.value, place: props.human?.place || '' }))

    // The elements minted at this moment — the page's list, as pills.
    const items = ref([])
    const loadingItems = ref(false)
    const loadItems = async () => {
      if (props.moment?.id == null) { items.value = []; return }
      loadingItems.value = true
      try {
        const r = await momentService.items(props.moment.id)
        items.value = (r?.items || []).filter((it) => it && (it.kind || it.address))
      } catch (_) { items.value = [] }
      loadingItems.value = false
    }
    watch(() => props.moment?.id, loadItems, { immediate: true })

    const card = useElementCard(props, emit, () => ({
      kind: 'moments',
      address: props.moment.path || '',
      id: props.moment.id,
      label: headline.value,
      ownerId: null
    }))

    return { headline, hasCoords, coordsTitle, osmUrl, ago, when, items, loadingItems, ...card }
  }
})
</script>

<style lang="scss" scoped>
.moment-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.moment-card__map {
  max-width: 420px;
  margin: 0 auto;
}
.moment-card__facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 12px;
  margin: 0;
  font-size: 0.82em;
  dt { color: rgba(var(--ink-rgb), 0.55); }
  dd { margin: 0; min-width: 0; word-break: break-all; }
}
.moment-card__osm {
  margin-left: 8px;
  color: var(--card-ink, #5f4700);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.moment-card__heading {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-display);
  font-size: 0.7em;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--card-ink, #5f4700);
  margin-bottom: 4px;
}
.moment-card__n { opacity: 0.6; }
.moment-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.moment-card__mute {
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.5);
  font-style: italic;
}
</style>
