<template>
  <!-- The standard platform-surround band (pair-path refactor): renders
       what the element's SKELETON says surrounds it — author, creation
       moment, fork origin, label rail, and the versions / forks /
       comments / scores paths. Everything shown is a REFERENCE routed to
       its own viewer. Data = one GET /refs/surround (useElementSurround).
       Pages with bespoke section UIs can switch bands off via props. -->
  <div v-if="sections" class="element-surround">
    <!-- header row: who · when · from-what -->
    <div class="row items-center q-gutter-x-sm q-gutter-y-xs wrap">
      <InfoChip
        v-if="showAuthor && sections.author"
        dense
        kind="entities"
        :id="sections.author.id"
        :address="sections.author.address"
        :primary="sections.author.primary"
        :to="sections.author.route"
      />
      <MomentInfo
        v-if="showMoment && sections.createdAt"
        :moment-id="sections.createdAt.momentId"
      />
      <template v-if="sections.forkedFrom">
        <span class="surround-cap">forked from</span>
        <InfoChip
          dense
          :kind="sections.forkedFrom.kind"
          :id="sections.forkedFrom.id"
          :address="sections.forkedFrom.address"
          :primary="sections.forkedFrom.primary"
          :to="sections.forkedFrom.route"
        />
      </template>
      <q-space />
      <div v-if="showScores && sections.scores" class="surround-scores row items-center q-gutter-x-xs">
        <q-icon name="arrow_upward" size="14px" :class="{ 'text-positive': sections.scores.mine === 'UP' }" />
        <span>{{ sections.scores.up }}</span>
        <q-icon name="arrow_downward" size="14px" :class="{ 'text-negative': sections.scores.mine === 'DOWN' }" />
        <span>{{ sections.scores.down }}</span>
      </div>
    </div>

    <!-- label rail -->
    <div v-if="showLabels && sections.labels?.length" class="row q-gutter-xs q-mt-xs wrap">
      <q-chip
        v-for="l in sections.labels"
        :key="l.id"
        dense
        clickable
        size="sm"
        class="surround-label"
        @click="$router.push(`/labels/${l.id}`)"
      >
        {{ l.name }}
        <q-tooltip v-if="l.chain?.length > 1">
          {{ l.chain.map(c => c.name).join(' › ') }}
        </q-tooltip>
      </q-chip>
    </div>

    <!-- path sections -->
    <div
      v-for="band in bands"
      :key="band.key"
      class="surround-band q-mt-sm"
    >
      <div class="surround-band-title row items-center q-gutter-x-xs">
        <q-icon :name="band.icon" size="14px" />
        <span>{{ band.title }}</span>
        <span class="surround-count">{{ band.section.total }}</span>
      </div>
      <div class="q-mt-xs q-gutter-xs row wrap">
        <InfoChip
          v-for="(item, i) in band.section.items"
          :key="`${band.key}:${i}`"
          dense
          :kind="item.kind"
          :id="item.id"
          :address="item.address"
          :primary="item.primary"
          :to="item.route"
        />
        <HashLink
          v-if="band.section.total > band.section.items.length && band.section.pathRef"
          :path="band.section.pathRef"
          :truncate="10"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import InfoChip from './InfoChip.vue'
import HashLink from './HashLink.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'

const BAND_DEFS = [
  { key: 'versions', title: 'Versions', icon: 'history' },
  { key: 'forks', title: 'Forks', icon: 'fork_right' },
  { key: 'comments', title: 'Comments', icon: 'chat_bubble_outline' },
  { key: 'posts', title: 'Posts', icon: 'article' },
  { key: 'uploads', title: 'Uploads', icon: 'attach_file' },
  { key: 'instantiations', title: 'Instantiations', icon: 'schema' }
]

export default defineComponent({
  name: 'ElementSurround',
  components: { InfoChip, HashLink, MomentInfo },
  props: {
    // The response of useElementSurround / refService.surround.
    sections: { type: Object, default: null },
    showAuthor: { type: Boolean, default: true },
    showMoment: { type: Boolean, default: true },
    showLabels: { type: Boolean, default: true },
    showScores: { type: Boolean, default: true },
    // Which path bands to render; pages with bespoke section UIs
    // (post comments thread, entity contributions) narrow this down.
    bandsShown: {
      type: Array,
      default: () => ['versions', 'forks', 'comments']
    }
  },
  setup (props) {
    const bands = computed(() =>
      BAND_DEFS
        .filter(b => props.bandsShown.includes(b.key))
        .map(b => ({ ...b, section: props.sections?.[b.key] }))
        .filter(b => b.section && (b.section.total > 0))
    )
    return { bands }
  }
})
</script>

<style lang="scss" scoped>
.element-surround {
  .surround-cap {
    font-size: 11px;
    opacity: 0.6;
  }
  .surround-scores {
    font-size: 12px;
    opacity: 0.8;
  }
  .surround-label {
    background: rgba(255, 255, 255, 0.08);
  }
  .surround-band-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.55;
  }
  .surround-count {
    opacity: 0.7;
  }
}
</style>
