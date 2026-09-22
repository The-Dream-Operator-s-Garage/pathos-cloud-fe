<template>
  <!-- THE MOMENT FACE (2026-09-21, user ask: "a flyout moment viewer that
       contains everything i see when visiting a moment … copying the
       aesthetic of other flyout viewers, such as the node and skeleton
       ones"). The moment page in a box, the way `EntityFace` is the profile
       page in a box: `ElementFlyout` mounts it as the face of a `moments/…`
       element target (in place of the MomentMini the fifth target drew
       until today), and `pages/MomentViewerPage.vue` mounts the SAME
       component under its page chrome — one source, so the window can never
       fall behind the page again.

       Loads itself off `id` (a DB id or a hash, exactly as the route does)
       and emits `loaded` with the read so the window can retitle. The
       layout is a CONTAINER query, not a media query — the box is what
       varies, not the viewport: one column narrow, subject 65 / minted 35
       from 700px, the entity face's rule. Every section is the page's,
       moved: the ident header (glyph in the kind's gold, the datetime as
       the title, the place chip + the label slider), the meta line (the
       stock nano pill for the address — the chips' one object — plus the
       copy control the page had), the hero, the facts + tiny world map, the
       decoded pathchain buffer, and the "minted at this moment" list. -->
  <div class="moment-face">
    <div v-if="loading && !moment" class="moment-face__state">
      <q-spinner size="22px" color="primary" />
    </div>
    <div v-else-if="!moment" class="moment-face__state moment-face__state--missing">
      <q-icon name="error_outline" size="34px" />
      <div>Moment not found.</div>
    </div>
    <div v-else class="moment-face__grid">
      <div class="moment-face__main">
        <section class="side-panel subject-panel">
          <header class="subject-panel__ident">
            <div class="subject-panel__titlebar">
              <q-icon
                :name="kind.icon" size="22px"
                class="subject-panel__title-icon"
                :style="{ color: kind.color }"
              />
              <span class="vsep" aria-hidden="true" />
              <div class="subject-panel__title nasalization">
                {{ human?.datetime || ('moment #' + moment.id) }}
              </div>
            </div>
            <div v-if="human?.place || sliderLabels.length" class="subject-panel__labels">
              <span v-if="human?.place" class="place-chip" :title="coordsTitle">
                <q-icon name="place" size="13px" class="q-mr-xs" />
                <strong>{{ human.place }}</strong>
              </span>
              <span v-if="human?.place && sliderLabels.length" class="vsep" aria-hidden="true" />
              <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
            </div>
          </header>

          <div class="subject-panel__meta">
            <MicroChip
              kind="moments"
              :id="moment.id"
              :path="moment.path"
              :show-type="true"
              :expand="false"
            />
            <span class="meta-typename">time/space anchor</span>
            <q-space />
            <q-btn
              flat dense size="sm" icon="content_copy"
              :ripple="false"
              :title="copied ? 'Copied!' : 'Copy path'"
              class="meta-btn"
              @click="copyPath"
            />
            <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
          </div>

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
                <MomentWorldMap
                  v-if="hasCoords"
                  class="moment-map"
                  :lat="moment.space_x" :lon="moment.space_y"
                  :city="human?.city || ''" :country="human?.country || ''"
                  :place="human?.place || ''"
                />
              </div>

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
        </section>
      </div>

      <aside class="moment-face__side">
        <section class="side-panel minted-panel">
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
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { momentService } from 'src/services/moment.service'
import { isHash, shortHash, kindFor } from 'src/utils/kinds'
import MicroChip from 'src/components/shared/MicroChip.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentWorldMap from 'src/components/moments/MomentWorldMap.vue'

export default defineComponent({
  name: 'MomentFace',
  components: { MicroChip, LabelSlider, MomentWorldMap },
  props: {
    // A DB id or a hash — the route's own contract (`moments/:id`).
    id: { type: [Number, String], default: null }
  },
  emits: ['loaded'],
  setup (props, { emit }) {
    const kind = kindFor('moments')
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

    // Drop private / nested fields from the decoded protobuf sections so the
    // grid lists plain scalars only (same helper the page had).
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
      const param = String(props.id ?? '')
      loading.value = true
      moment.value = null
      human.value = null
      decoded.value = null
      header.value = null
      items.value = []
      if (!param) { loading.value = false; return }
      try {
        const r = isHash(param)
          ? await momentService.getByHash(param)
          : await momentService.get(parseInt(param, 10))
        if (String(props.id ?? '') !== param) return // a newer id won the race
        if (r?.success) {
          moment.value = r.moment || null
          human.value = r.human || null
          decoded.value = r.decoded || null
          header.value = r.header || null
        }
        if (moment.value) {
          emit('loaded', { moment: moment.value, human: human.value, header: header.value })
          const ir = await momentService.items(moment.value.id)
          if (String(props.id ?? '') === param && ir?.success) items.value = ir.items || []
        }
      } catch (_) { /* leave the not-found state */ }
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
    watch(() => props.id, load)

    return {
      kind,
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
// The box — `EntityFace`'s root, to the letter: the face fills whatever
// mounts it (the flyout's well or the page), scrolls as ONE surface with the
// thin scrollbar the windows share, and measures itself for the grid below.
.moment-face {
  container-type: inline-size;
  container-name: moment-face;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }
}

.moment-face__state {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 10px;
  font-size: 0.85em;
  color: var(--grey-8, #616161);
  .q-icon { opacity: 0.35; }
}

// One column until the box is wide enough for the minted list to stand
// beside the subject — the entity face's 700px rule, its 60/40 split opened
// a notch for the wider subject panel.
.moment-face__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.moment-face__main,
.moment-face__side { min-width: 0; }
.moment-face__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
@container moment-face (min-width: 700px) {
  .moment-face__grid {
    grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
  }
}

// The panels — the entity face's `.side-panel` material: white body, the
// panel rule, `--radius-md`, the card shadow. The page's own palette rides
// on the panel (it was `.subject-panel`'s / `.minted-panel`'s on the page).
.side-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 0 0 auto;
}

// ── The subject panel — the page's, minus its viewport-height law (the
// face scrolls as one surface; the panel is as tall as its content) ──────
.subject-panel {
  min-width: 0;
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
// The kind's glyph, in the kind's colour (kinds.js `moments` — the chips'
// gold; set inline so this sheet names no colour of its own).
.subject-panel__title-icon {
  flex-shrink: 0;
  align-self: center;
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
.subject-panel__labels {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 22px;
}
.place-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.82em;
  color: #8a6d00;
  background: rgba(199, 154, 0, 0.10);
  border: 1px solid rgba(199, 154, 0, 0.35);
  border-radius: 999px;
  padding: 1px 9px 1px 6px;
  white-space: nowrap;
}

.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--panel-chrome);
  font-size: 0.80em;
  color: var(--panel-ink);
  flex-shrink: 0;
  min-width: 0;
  .meta-typename { color: var(--panel-ink-mute); white-space: nowrap; }
  .meta-btn {
    color: var(--panel-ink-2);
    &:hover { color: var(--coral-deep); }
  }
}

.subject-panel__body {
  flex: 1 1 auto;
  min-height: 0;
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
  padding: 10px 14px;
}

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

// Facts beside the map while the box allows; stacked (map centred) under
// 560px of face — the page's fold, restated as a container rule.
.moment-mid {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}
.moment-facts { flex: 1 1 auto; min-width: 0; }
.moment-map   { flex: 0 0 230px; }
@container moment-face (max-width: 560px) {
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
    flex: 0 0 150px;
    color: rgba(var(--ink-rgb), 0.55);
  }
  .fact-val {
    min-width: 0;
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
  flex-wrap: wrap;
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

// ── Minted at this moment — the page's side panel, capped so a long list
// scrolls inside its box instead of stretching the face ──────────────────
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
  max-height: 60vh;
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
  min-width: 0;
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
