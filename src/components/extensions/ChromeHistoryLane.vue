<template>
  <!-- THE CHROME HISTORY LANE (2026-11-02 — docs/plans/chrome-history-
       extension.md Part 7, docs/concepts/extensions.md): a CHROME_HISTORY
       instance draws its VISITS as a lane, not a grid — per visit the
       moment chip + its human line, the page's title, the URL node's mini
       (a YouTube link carries its embed). Newest first off GET
       /extensions/history, a page at a time: the sentinel under the last
       row asks for the next page as it scrolls into view (Older visits is
       the same door by hand). The root opens it through the Chrome
       alter-ego's delegation — no mask worn. -->
  <div class="chrome-lane" data-testid="chrome-history-lane">
    <div class="chrome-lane__head">
      <q-icon name="travel_explore" size="14px" />
      <span class="chrome-lane__name nasalization">Chrome history</span>
      <span class="chrome-lane__meta mono" data-testid="chrome-history-total">{{ total }} visit{{ total === 1 ? '' : 's' }}<template v-if="profile"> · {{ profile }}</template></span>
    </div>

    <div v-if="loading && !visits.length" class="chrome-lane__empty"><q-spinner size="14px" /></div>
    <div v-else-if="error" class="chrome-lane__empty">{{ error }}</div>
    <div v-else-if="!visits.length" class="chrome-lane__empty">No visits yet — the extension's first flush lands here.</div>

    <div v-for="v in visits" :key="v.id" class="chrome-lane__row" data-testid="chrome-history-row">
      <div class="chrome-lane__when">
        <MicroChip v-if="v.moment" kind="moments" :id="v.moment.id" :path="v.moment.path" collapsed />
        <span class="chrome-lane__datetime mono">{{ v.moment?.datetime || v.visited_at }}</span>
        <span v-if="v.page?.channel" class="chrome-lane__channel">· {{ v.page.channel }}</span>
      </div>
      <div class="chrome-lane__title" :title="v.node?.content || ''">{{ v.title || v.node?.content }}</div>
      <NodeMini v-if="v.node?.path" :node="v.node" />
    </div>

    <div ref="sentinel" class="chrome-lane__sentinel" />
    <button
      v-if="nextBefore"
      type="button"
      class="chrome-lane__more"
      data-testid="chrome-history-more"
      :disabled="loading"
      @click="more"
    >
      <q-spinner v-if="loading" size="11px" />
      <span v-else>Older visits</span>
    </button>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { extensionService } from 'src/services/extension.service'
import MicroChip from 'src/components/shared/MicroChip.vue'
import NodeMini from 'src/components/nodes/NodeMini.vue'

const PAGE = 20

export default defineComponent({
  name: 'ChromeHistoryLane',
  components: { MicroChip, NodeMini },
  props: {
    skeletonId: { type: [Number, String], required: true },
    profile: { type: String, default: null }
  },
  setup (props) {
    const visits = ref([])
    const total = ref(0)
    const nextBefore = ref(null)
    const loading = ref(false)
    const error = ref('')
    const sentinel = ref(null)
    let observer = null

    const load = async (before = null) => {
      if (loading.value) return
      loading.value = true
      error.value = ''
      try {
        const r = await extensionService.history(props.skeletonId, { before, limit: PAGE })
        if (r.success) {
          visits.value = before ? [...visits.value, ...r.visits] : r.visits
          total.value = r.total
          nextBefore.value = r.next_before
        } else error.value = r.error?.message || 'could not read the history'
      } catch (e) {
        error.value = e?.response?.data?.error?.message || 'could not read the history'
      } finally { loading.value = false }
    }
    const more = () => { if (nextBefore.value) load(nextBefore.value) }

    onMounted(() => {
      load()
      if (typeof IntersectionObserver === 'function' && sentinel.value) {
        observer = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting) && nextBefore.value && !loading.value) more()
        }, { rootMargin: '200px' })
        observer.observe(sentinel.value)
      }
    })
    onBeforeUnmount(() => { if (observer) observer.disconnect() })
    watch(() => props.skeletonId, () => { visits.value = []; nextBefore.value = null; load() })

    return { visits, total, nextBefore, loading, error, sentinel, more }
  }
})
</script>

<style lang="scss" scoped>
.chrome-lane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.chrome-lane__head {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--brown-8);
}

.chrome-lane__name { font-size: 12px; }
.chrome-lane__meta { font-size: 10px; color: var(--brown-4); }

.chrome-lane__empty {
  padding: 8px 0;
  font-size: 11px;
  color: var(--brown-4);
}

.chrome-lane__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-top: 6px;
  border-top: 1px solid var(--grey-4);
}

.chrome-lane__when {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10px;
  color: var(--brown-4);
}

.chrome-lane__channel { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chrome-lane__title {
  font-size: 12px;
  color: var(--brown-8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chrome-lane__sentinel { height: 1px; }

.chrome-lane__more {
  align-self: center;
  padding: 2px 10px;
  font-size: 11px;
  border: 1px solid var(--grey-5);
  border-radius: 4px;
  background: transparent;
  color: var(--brown-8);
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: default; }
}
</style>
