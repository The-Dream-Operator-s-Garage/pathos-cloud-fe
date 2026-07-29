<template>
  <q-page class="bg-base moment-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="!moment" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Moment not found.</div>
      </div>

      <div v-else class="moment-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column. Same .subject-panel chrome as the
             node/path viewers so a moment reads as a member of the same
             family of primal types.
        ══════════════════════════════════════════════════════════ -->
        <div class="moment-main">

          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="schedule" size="22px" class="subject-panel__title-icon moment-tint" />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  {{ human?.datetime || ('moment #' + moment.id) }}
                </div>
              </div>

              <div class="subject-panel__labels">
                <span v-if="human?.place" class="place-chip" :title="coordsTitle">
                  <q-icon name="place" size="13px" class="q-mr-xs" />
                  <strong>{{ human.place }}</strong>
                </span>
                <span v-if="human?.place && sliderLabels.length" class="vsep" aria-hidden="true" />
                <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
              </div>
            </header>

            <!-- Meta strip — id + on-disk address with copy. -->
            <div class="subject-panel__meta">
              <q-icon name="schedule" size="14px" class="meta-icon" />
              <div class="meta-label">
                <strong>moment #{{ moment.id }}</strong>
                <span class="meta-typename">(time/space anchor)</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="moment.path">{{ moment.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <!-- Body — the decoded moment, straight from the pathchain,
                 rendered human-first: big datetime, coordinates, then the
                 raw protobuf fields for verification. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">

                <div class="moment-hero">
                  <div class="moment-hero__datetime nasalization">{{ human?.datetime || moment.time_utc }}</div>
                  <div v-if="human?.place" class="moment-hero__place">
                    <q-icon name="place" size="15px" class="q-mr-xs" />{{ human.place }}
                  </div>
                </div>

                <div class="moment-mid">
                  <div class="moment-facts">
                    <div class="fact-row">
                      <span class="fact-key mono">time_utc</span>
                      <span class="fact-val mono">{{ moment.time_utc }}</span>
                    </div>
                    <div class="fact-row">
                      <span class="fact-key mono">time (pathchain)</span>
                      <span class="fact-val mono">{{ moment.time }}</span>
                    </div>
                    <div v-if="hasCoords" class="fact-row">
                      <span class="fact-key mono">coordinates</span>
                      <span class="fact-val mono">
                        {{ moment.space_x }}, {{ moment.space_y }}<template v-if="Number(moment.space_z)"> · z {{ moment.space_z }}</template>
                        <a
                          :href="osmUrl" target="_blank" rel="noopener"
                          class="osm-link"
                          title="Open in OpenStreetMap"
                        >
                          <q-icon name="map" size="13px" /> map
                        </a>
                      </span>
                    </div>
                  </div>

                  <!-- The tiny world — pin on the moment's approximate city. -->
                  <MomentWorldMap
                    v-if="hasCoords"
                    class="moment-map"
                    :lat="moment.space_x" :lon="moment.space_y"
                    :city="human?.city || ''" :country="human?.country || ''"
                    :place="human?.place || ''"
                  />
                </div>

                <!-- Decoded protobuf — the on-disk truth. -->
                <div class="decoded-section">
                  <div class="decoded-heading">
                    <q-icon name="data_object" size="14px" class="q-mr-xs" />
                    decoded from pathchain
                    <span class="mono decoded-file">files/moments/{{ shortHash(moment.path, 12) }}…</span>
                  </div>
                  <div v-if="!decoded" class="decoded-empty">
                    no on-disk buffer found for this moment
                  </div>
                  <div v-else class="decoded-grid">
                    <template v-if="decoded.datetime">
                      <div v-for="(val, key) in decodedDatetime" :key="'dt-' + key" class="fact-row">
                        <span class="fact-key mono">datetime.{{ key }}</span>
                        <span class="fact-val mono">{{ val }}</span>
                      </div>
                    </template>
                    <template v-if="decoded.coordinates">
                      <div v-for="(val, key) in decodedCoords" :key="'co-' + key" class="fact-row">
                        <span class="fact-key mono">coordinates.{{ key }}</span>
                        <span class="fact-val mono">{{ val }}</span>
                      </div>
                    </template>
                  </div>
                </div>

              </div>
            </div>

          </main>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — everything minted at this moment, as Micro chips.
        ══════════════════════════════════════════════════════════ -->
        <aside class="moment-side">
          <section class="minted-panel side-panel">
            <div class="minted-panel__header">
              <q-icon name="workspaces" size="14px" class="q-mr-xs" />
              <span>Minted at this moment</span>
              <span class="minted-count">{{ items.length }}</span>
            </div>
            <div class="minted-panel__scroll">
              <div v-if="!items.length" class="minted-panel__empty">
                nothing anchored here
              </div>
              <div v-for="item in items" :key="item.kind + '-' + item.id" class="minted-row">
                <MicroChip :kind="item.kind" :id="item.id" :path="item.path" :show-type="true" />
                <span v-if="item.title || item.preview" class="minted-row-label">
                  {{ (item.title || item.preview || '').slice(0, 60) }}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { momentService } from 'src/services/moment.service'
import { isHash, shortHash } from 'src/utils/kinds'

import MicroChip from 'src/components/shared/MicroChip.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentWorldMap from 'src/components/moments/MomentWorldMap.vue'

export default defineComponent({
  name: 'MomentViewerPage',
  components: { MicroChip, LabelSlider, MomentWorldMap },
  setup () {
    const route = useRoute()

    const loading = ref(true)
    const moment = ref(null)
    const human = ref(null)
    const decoded = ref(null)
    const header = ref(null)
    const items = ref([])
    const copied = ref(false)

    const sliderLabels = computed(() => header.value?.labels || [])

    const hasCoords = computed(() => {
      const m = moment.value
      return m && (Number(m.space_x) !== 0 || Number(m.space_y) !== 0)
    })

    const coordsTitle = computed(() =>
      moment.value ? `${moment.value.space_x}, ${moment.value.space_y}` : '')

    const osmUrl = computed(() => {
      const m = moment.value
      if (!m) return '#'
      return `https://www.openstreetmap.org/?mlat=${m.space_x}&mlon=${m.space_y}#map=12/${m.space_x}/${m.space_y}`
    })

    // Flatten the decoded protobuf sub-messages into displayable rows,
    // skipping the parser bookkeeping fields (_index/_length/_match).
    const cleanFields = (obj) => {
      const out = {}
      for (const [k, v] of Object.entries(obj || {})) {
        if (k.startsWith('_') || v == null || typeof v === 'object') continue
        out[k] = v
      }
      return out
    }
    const decodedDatetime = computed(() => cleanFields(decoded.value?.datetime))
    const decodedCoords = computed(() => cleanFields(decoded.value?.coordinates))

    const load = async () => {
      loading.value = true
      moment.value = null
      human.value = null
      decoded.value = null
      header.value = null
      items.value = []

      const param = String(route.params.id || '')
      try {
        const r = isHash(param)
          ? await momentService.getByHash(param)
          : await momentService.get(parseInt(param))
        if (r.success) {
          moment.value = r.moment || null
          human.value = r.human || null
          decoded.value = r.decoded || null
          header.value = r.header || null
        }
        if (moment.value) {
          const ir = await momentService.items(moment.value.id)
          if (ir.success) items.value = ir.items || []
        }
      } catch (_) { /* leave empty */ }
      loading.value = false
    }

    const copyPath = () => {
      if (!moment.value?.path) return
      navigator.clipboard.writeText(moment.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      loading,
      moment,
      human,
      decoded,
      items,
      sliderLabels,
      hasCoords,
      coordsTitle,
      osmUrl,
      decodedDatetime,
      decodedCoords,
      copied,
      copyPath,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
// Same layout skeleton as PathViewerPage — 75/25 grid + subject-panel chrome.
.moment-page {
  padding: 16px 10px 0;
}

.moment-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.moment-main { min-width: 0; }

.moment-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
}
.side-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body, #ffffff);
  border: 1px solid var(--panel-rule, #e2e6ed);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 1 1 0;
}

@media (max-width: 1023px) {
  .moment-grid { grid-template-columns: minmax(0, 1fr); }
  .moment-side { height: auto; max-height: none; }
  .side-panel { flex: 0 0 auto; }
}

.subject-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;

  display: flex;
  flex-direction: column;
  height:     calc(100vh - 16px - var(--nav-footer-h));
  max-height: calc(100vh - 16px - var(--nav-footer-h));
  min-width: 0;
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  position: relative;

  & > * + * { border-top: 1px solid var(--panel-rule); }
}

.subject-panel__ident {
  padding: 8px 12px 6px;
  background: var(--panel-chrome);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.subject-panel__titlebar {
  display: flex;
  align-items: stretch;
  gap: 10px;
  border-bottom: 1px solid var(--panel-rule);
  margin: 0 -12px;
  padding: 0 12px 6px;
}
.subject-panel__title-icon {
  color: var(--ink);
  flex-shrink: 0;
  align-self: center;
  &.moment-tint { color: #c79a00; }
}
.subject-panel__title {
  font-size: 1.25em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}
.vsep {
  flex: 0 0 1px;
  width: 1px;
  background: var(--panel-rule);
  align-self: stretch;
}
.subject-panel__titlebar .vsep {
  margin-top: -8px;
  margin-bottom: -6px;
}
.subject-panel__labels .vsep {
  margin-top: -5px;
  margin-bottom: -6px;
}
.subject-panel__labels {
  display: flex;
  align-items: center;
  gap: 10px;
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}

.place-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #fdf6e3;
  border: 1px solid #e5d3a1;
  border-radius: 12px;
  color: #8a6d00;
  font-size: 0.92em;
}

.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;
}
.subject-panel__meta .meta-icon  { color: var(--panel-ink-2); }
.subject-panel__meta .meta-label {
  color: var(--panel-ink-2);
  white-space: nowrap;
  strong { color: var(--panel-ink-1); }
}
.subject-panel__meta .meta-typename { color: var(--panel-ink-mute); margin-left: 4px; }
.subject-panel__meta .meta-hash {
  font-size: 0.86em;
  color: var(--panel-ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}
.subject-panel__meta .meta-btn {
  color: var(--panel-ink-2);
  &:hover { color: var(--coral-deep); }
}

.subject-panel__body {
  flex: 1 1 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  background: var(--panel-chrome);
  padding: 8px;
}
.subject-panel__body-card {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--panel-body);
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
  padding: 10px 14px;
}

// ── Moment body ────────────────────────────────────────
.moment-hero {
  text-align: center;
  padding: 18px 10px 14px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.15);
  margin-bottom: 12px;
}
.moment-hero__datetime {
  font-size: 1.5em;
  color: var(--panel-ink-1, #1F2A38);
}
.moment-hero__place {
  margin-top: 6px;
  font-size: 0.92em;
  color: #8a6d00;
  display: inline-flex;
  align-items: center;
}

// Facts on the left, the tiny world pinned to their right.
.moment-mid {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}
.moment-facts { flex: 1 1 auto; min-width: 0; }
.moment-map   { flex: 0 0 230px; }
@media (max-width: 700px) {
  .moment-mid { flex-direction: column; }
  .moment-map { flex-basis: auto; width: 100%; max-width: 280px; align-self: center; }
}

.fact-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 2px;
  font-size: 0.82em;
  & + & { border-top: 1px dotted rgba(var(--ink-rgb), 0.08); }
  .fact-key {
    flex: 0 0 160px;
    color: rgba(var(--ink-rgb), 0.55);
  }
  .fact-val {
    color: var(--panel-ink-1, #1F2A38);
    word-break: break-all;
  }
}
.osm-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 10px;
  color: #4d8a83;
  text-decoration: none;
  border-bottom: 1px dotted #4d8a83;
  &:hover { color: var(--coral-deep); border-bottom-color: var(--coral-deep); }
}

.decoded-section { margin-top: 4px; }
.decoded-heading {
  display: flex;
  align-items: center;
  font-size: 0.76em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-bottom: 6px;
  .decoded-file {
    margin-left: 8px;
    text-transform: none;
    letter-spacing: 0;
    opacity: 0.7;
  }
}
.decoded-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 6px 2px;
}
.decoded-grid { padding-bottom: 8px; }

// ── Right sidebar — minted-here panel ───────────────────
.minted-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}
.minted-panel__header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  font-size: 0.78em;
  font-weight: 500;
  color: var(--panel-ink-1);
  flex-shrink: 0;
}
.minted-count {
  font-size: 0.92em;
  margin-left: 5px;
  color: var(--panel-ink-2);
}
.minted-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
}
.minted-panel__empty {
  padding: 10px 12px;
  font-size: 0.80em;
  color: var(--panel-ink-2);
  text-align: center;
  font-style: italic;
}
.minted-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  font-size: 0.82em;
  & + & { border-top: 1px solid var(--panel-rule); }
  .minted-row-label {
    color: var(--panel-ink-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    font-size: 0.9em;
  }
}
</style>
