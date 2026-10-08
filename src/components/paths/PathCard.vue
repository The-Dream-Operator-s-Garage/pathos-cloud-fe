<template>
  <!-- THE PATH CARD (2026-10-08, the card family) — a path as a CARD: the
       post card's grammar around THE LANE. Where PathMini is the quoted
       path (its lane in a panel), this is the full reading surface — the
       lane at the pit's height, the mode and layout switches as acts in
       the cap (the Mini's two switches, worn as the card's controls), the
       owner and the minting in the byline, the members' tally stated in
       the rail (a path classifies by what it holds), the step count in the
       foot. The two preferences are the Mini's keys (`pathos_path_layout` /
       `pathos_path_mode`): one setting, every surface.
       Acts: mode · layout · share · open; comments offered (a PATH holds a
       COMMENTS path since 2026-10-07), forks not. -->
  <CardPanel kind="paths" :address="row.path" :open="isOpen" :fill="fill" pit-fit>
    <template #cap>
      <CardCap
        kind="paths"
        :icons="['route']"
        icons-title="A path — elements bonded in order"
        :title="pathLabel"
        :title-tip="row.path || pathLabel"
        :acts="[modeAct, layoutAct, shareAct, openAct]"
      />
    </template>

    <template #byline>
      <CardByline :author="author" :when="when" :labels="row.labels || []">
        <template v-if="kindTally" #rail>
          <span class="element-card__rail-text mono" :title="kindTally">{{ kindTally }}</span>
        </template>
      </CardByline>
    </template>

    <template #pit>
      <div class="path-card__lane" :class="{ 'is-horizontal': shownLayout === 'horizontal', 'mode-reference': shownMode === 'reference' }">
        <div v-if="loading" class="path-card__note"><q-spinner size="14px" color="primary" /></div>
        <div v-else-if="!walked.length" class="path-card__note">(empty path)</div>
        <PathLane
          v-else
          :steps="walked"
          :layout="shownLayout"
          :mode="shownMode"
          :depth="0"
          :visited="[row.path || '']"
          :self="row.path || ''"
        />
      </div>
    </template>

    <template #foot>
      <CardFoot kind="paths" :id="row.id" :path="row.path" :stats="threadStats" @stat="onStat">
        <template #end>
          <span class="element-card__stat mono" :title="kindTally">
            <q-icon name="route" size="11px" />{{ stepCount }} {{ stepCount === 1 ? 'step' : 'steps' }}
          </span>
        </template>
      </CardFoot>
    </template>

    <template v-if="composing && commentParent" #storey>
      <CommentMaker variant="inline" :parent="commentParent" @cancel="closeComposer" @posted="onCommented" />
    </template>
  </CardPanel>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import CardPanel from 'src/components/shared/CardPanel.vue'
import CardCap from 'src/components/shared/CardCap.vue'
import CardByline from 'src/components/shared/CardByline.vue'
import CardFoot from 'src/components/shared/CardFoot.vue'
import PathLane from './PathLane.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import { pathService } from 'src/services/path.service'
import { hashOf, isHash } from 'src/utils/kinds'
import { absoluteTime } from 'src/utils/time'
import { useElementCard, CARD_PROPS, CARD_EMITS } from 'src/composables/useElementCard'

// The Mini's two preference keys — one setting per surface family.
const LAYOUT_KEY = 'pathos_path_layout'
const MODE_KEY = 'pathos_path_mode'
const readPref = (key, allowed, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return allowed.includes(v) ? v : fallback
  } catch (_) { return fallback }
}
const writePref = (key, v) => { try { localStorage.setItem(key, v) } catch (_) { /* preference only */ } }
const PLURAL = { node: 'nodes', label: 'labels', entity: 'entities', path: 'paths', skeleton: 'skeletons', post: 'posts', moment: 'moments', secret: 'secrets', link: 'links' }

export default defineComponent({
  name: 'PathCard',
  components: { CardPanel, CardCap, CardByline, CardFoot, PathLane, CommentMaker },
  props: {
    // The path row ({ id, path, step_count, created_at, owner_id, author?, title? }).
    path: { type: Object, required: true },
    // Pre-walked steps (pathService, forward). null → the card walks them.
    steps: { type: Array, default: null },
    ...CARD_PROPS
  },
  emits: CARD_EMITS,
  setup (props, { emit }) {
    const loading = ref(false)
    const fetched = ref(null) // { row, steps } when this card walked
    const row = computed(() => fetched.value?.row || props.path)
    const walked = computed(() => (Array.isArray(props.steps) ? props.steps : (fetched.value?.steps || [])))

    const load = async () => {
      if (Array.isArray(props.steps)) return
      const hash = hashOf(props.path?.path || '')
      const id = props.path?.id
      if (!hash && id == null) return
      loading.value = true
      try {
        const r = isHash(hash) ? await pathService.byHash(hash, 'forward') : await pathService.byId(id, 'forward')
        if (r?.success && r.path) fetched.value = { row: { ...r.path, author: r.owner || props.path?.author || null }, steps: r.steps || [] }
      } catch (_) { /* the row alone still draws the head */ }
      loading.value = false
    }
    watch(() => [props.path?.id, props.path?.path, props.steps], load, { immediate: true })

    const stepCount = computed(() => (walked.value.length || row.value?.step_count || 0))
    const pathLabel = computed(() => {
      const t = String(row.value?.title || '').trim()
      if (t) return t
      const n = stepCount.value
      return `path${row.value?.id != null ? ' #' + row.value.id : ''} · ${n} ${n === 1 ? 'step' : 'steps'}`
    })

    // ── the two switches, as acts ─────────────────────────────────────
    const localLayout = ref(readPref(LAYOUT_KEY, ['vertical', 'horizontal'], 'vertical'))
    const shownLayout = computed(() => (localLayout.value === 'horizontal' ? 'horizontal' : 'vertical'))
    const toggleLayout = () => {
      localLayout.value = shownLayout.value === 'horizontal' ? 'vertical' : 'horizontal'
      writePref(LAYOUT_KEY, localLayout.value)
    }
    const localMode = ref(readPref(MODE_KEY, ['enriched', 'reference'], 'enriched'))
    const shownMode = computed(() => (localMode.value === 'reference' ? 'reference' : 'enriched'))
    const toggleMode = () => {
      localMode.value = shownMode.value === 'enriched' ? 'reference' : 'enriched'
      writePref(MODE_KEY, localMode.value)
    }
    const modeAct = computed(() => ({
      key: 'mode',
      icon: shownMode.value === 'enriched' ? 'short_text' : 'view_agenda',
      title: shownMode.value === 'enriched'
        ? 'Show the members as references — their nano chips'
        : 'Show the members enriched — their mini viewers',
      on: shownMode.value === 'reference',
      onClick: toggleMode
    }))
    const layoutAct = computed(() => ({
      key: 'layout',
      icon: shownLayout.value === 'horizontal' ? 'swap_vert' : 'swap_horiz',
      title: shownLayout.value === 'horizontal'
        ? 'Lay the path out vertically — the members down a column'
        : 'Lay the path out horizontally — the members along a row',
      on: shownLayout.value === 'horizontal',
      onClick: toggleLayout
    }))

    // ── who, when, what it holds ──────────────────────────────────────
    const author = computed(() => {
      const a = row.value?.author || row.value?.owner || null
      if (!a) return null
      return { ...a, display_name: a.display_name || a.username || a.profile?.username || '' }
    })
    const when = computed(() => {
      const ts = row.value?.created_at || row.value?.createdAt
      return ts ? { datetime: absoluteTime(ts) } : null
    })
    const kindTally = computed(() => {
      const counts = {}
      for (const st of walked.value) {
        const k = st.target?.kind || st.link?.target_type || 'unknown'
        counts[k] = (counts[k] || 0) + 1
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${n} ${n === 1 ? k : (PLURAL[k] || k)}`)
        .join(' · ')
    })

    const card = useElementCard(props, emit, () => ({
      kind: 'paths',
      address: row.value?.path || '',
      id: row.value?.id,
      label: pathLabel.value,
      ownerId: row.value?.owner_id ?? author.value?.id ?? null
    }))

    return { loading, row, walked, stepCount, pathLabel, shownLayout, shownMode, modeAct, layoutAct, author, when, kindTally, ...card }
  }
})
</script>

<style lang="scss" scoped>
// The lane fills the pit and scrolls on its own axis.
.path-card__lane {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 6px;
  scrollbar-width: thin;
}
.path-card__note {
  padding: 8px;
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.5);
  font-style: italic;
}
</style>
