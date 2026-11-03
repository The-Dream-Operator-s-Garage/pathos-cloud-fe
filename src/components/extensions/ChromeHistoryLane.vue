<template>
  <!-- THE CHROME HISTORY LANE (2026-11-02 — docs/plans/chrome-history-
       extension.md Part 7, docs/concepts/extensions.md): a CHROME_HISTORY
       instance draws its VISITS as a lane, not a grid — per visit the
       moment chip + its human line, the page's title, the URL node's mini
       (a YouTube link carries its embed). Newest first off GET
       /extensions/history, a page at a time: the sentinel under the last
       row asks for the next page as it scrolls into view (Older visits is
       the same door by hand). The root opens it through the Chrome
       alter-ego's delegation — no mask worn.
       ⭐ 2026-11-02 (allegue: "put each history element inside a container
       with thin rounded borders that match the aesthetic of what they are
       containing … not the text alone in the background"; "reference that
       link … instead of showcasing the raw link text"): every visit is ONE
       CARD in the node family's colorway (kinds.js nodes — a visit holds a
       node) on the mini family's corners; the moment line is its head band.
       A video keeps its embed (the object IS the page); a plain link is
       REFERENCED — the page's title, its nano pill (the node, one door) and
       host + path — never a mini around its raw URL.
       ⭐ 2026-11-03 (allegue: "incorporate the icons for popular sites next
       to the links … in color"): the head wears Chrome's own mark
       (utils/brandIcons.js) and every title its SITE's icon — SiteIcon,
       read from the site's <head> by the server, the brand mark while it
       loads.
       ⭐ 2026-11-03 PM: the row is ChromeHistoryVisit — a dense head band
       (moment │ site icon · title │ pin), the node's EXTENDED pill with the
       link at its right, the object under it when the page is one. And the
       window holding the lane switches to the instance's own GRID (the
       flyout's view switch; SkeletonTable `grid`). -->
  <div class="chrome-lane" data-testid="chrome-history-lane">
    <div class="chrome-lane__head">
      <q-icon :name="BRANDS.chrome" size="14px" data-testid="chrome-history-mark" />
      <span class="chrome-lane__name nasalization">Chrome history</span>
      <!-- ⭐ 2026-11-03 (allegue: "add a refresh button next to the
           title"): re-reads the newest page — visits the extension
           flushed since the lane opened land on top, the paging resets. -->
      <button
        type="button"
        class="chrome-lane__refresh"
        title="Refresh"
        aria-label="Refresh the history"
        data-testid="chrome-history-refresh"
        :disabled="loading"
        @click="refresh"
      >
        <q-spinner v-if="loading" size="11px" />
        <q-icon v-else name="refresh" size="13px" />
      </button>
      <span class="chrome-lane__meta mono" data-testid="chrome-history-total">{{ total }} visit{{ total === 1 ? '' : 's' }}<template v-if="profile"> · {{ profile }}</template></span>
    </div>

    <div v-if="loading && !visits.length" class="chrome-lane__empty"><q-spinner size="14px" /></div>
    <div v-else-if="error" class="chrome-lane__empty">{{ error }}</div>
    <div v-else-if="!visits.length" class="chrome-lane__empty">No visits yet — the extension's first flush lands here.</div>

    <!-- one card per visit — ChromeHistoryVisit (its head band, its pin,
         the node's reference line, the object when there is one) -->
    <ChromeHistoryVisit v-for="v in visits" :key="v.id" :visit="v" />

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
import ChromeHistoryVisit from 'src/components/extensions/ChromeHistoryVisit.vue'
import { BRANDS } from 'src/utils/brandIcons'

const PAGE = 20

export default defineComponent({
  name: 'ChromeHistoryLane',
  components: { ChromeHistoryVisit },
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
    const refresh = () => load()

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

    return { visits, total, nextBefore, loading, error, sentinel, more, refresh, BRANDS }
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

// the Identity dock's refresh idiom: a bare glyph, grey until hovered
.chrome-lane__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--grey-7);
  cursor: pointer;

  &:hover:not(:disabled) { color: var(--brown-8); background: var(--grey-3); }
  &:disabled { cursor: default; }
}
.chrome-lane__meta { font-size: 10px; color: var(--brown-4); }

.chrome-lane__empty {
  padding: 8px 0;
  font-size: 11px;
  color: var(--brown-4);
}

// (the visit cards style themselves — ChromeHistoryVisit.vue)

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
