<template>
  <q-page class="bg-base path-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <AccessDeniedBanner v-else-if="locked" :address="locked.address" />

      <div v-else-if="!pathRow" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Path not found.</div>
      </div>

      <div v-else class="path-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column. Shares the .subject-panel chrome
             with NodeDetailPage so the eye reads a path as a member of
             the same family of primal types.
        ══════════════════════════════════════════════════════════ -->
        <div class="path-main">

          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="route" size="22px" class="subject-panel__title-icon" />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  path #{{ pathRow.id }}
                </div>
              </div>

              <div class="subject-panel__labels">
                <router-link
                  v-if="owner"
                  :to="'/entities/' + owner.id"
                  class="author-chip"
                  :title="owner.path"
                >
                  <q-icon name="person" size="13px" class="q-mr-xs" />
                  <strong>{{ ownerDisplayName }}</strong>
                  <span class="author-chip-sep">|</span>
                  <span class="author-chip-hash mono">entity/{{ shortHash(owner.path, 8) }}</span>
                </router-link>
                <span
                  v-if="owner && (pathMomentId || sliderLabels.length)"
                  class="vsep"
                  aria-hidden="true"
                />
                <MomentInfo v-if="pathMomentId" :moment-id="pathMomentId" />
                <span
                  v-if="pathMomentId && sliderLabels.length"
                  class="vsep"
                  aria-hidden="true"
                />
                <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
              </div>
            </header>

            <!-- Meta strip — exposes the path id + on-disk address so
                 the user can copy the hash without leaving the page. -->
            <div class="subject-panel__meta">
              <q-icon name="route" size="14px" class="meta-icon" />
              <div class="meta-label">
                <strong>path #{{ pathRow.id }}</strong>
                <span class="meta-typename">({{ pathRow.step_count }} step{{ pathRow.step_count === 1 ? '' : 's' }})</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="pathRow.path">{{ pathRow.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <!-- Body — the link chain. Each step renders the target's
                 XMini if the family has one for the kind, otherwise the
                 XMicro chip. PathLinkConnector exposes the bond between
                 consecutive steps. -->
            <!-- ⭐ 2026-11-02 THE RING OF BLOCKS (allegue: "paginate the load
                 of large paths … like the feed"): the body card is the
                 scroller; at most 4 blocks of PATH_BLOCK steps are mounted,
                 spacers stand for the rest (measured above, estimated
                 below), so a 2,000-step path opens on one read and the
                 thumb reaches any step — useWindowedFeed, the feed's own. -->
            <div class="subject-panel__body">
              <div ref="bodyEl" class="subject-panel__body-card" data-testid="path-viewer-scroll">
                <div v-if="!steps.length && !win.loading.value" class="text-dim text-center q-py-md">
                  No steps in this path yet.
                </div>
                <div v-else class="path-slider">
                  <div v-if="win.topSpacer.value > 0" class="path-spacer" :style="{ height: win.topSpacer.value + 'px' }" />
                  <div
                    v-for="block in win.blocks.value"
                    :key="block.index"
                    :ref="win.bindBlock(block.index)"
                    class="path-block"
                    data-testid="path-block"
                    :data-block="block.index"
                  >
                  <template v-for="step in block.items" :key="step.index">

                    <component
                      :is="miniComponentFor(step)"
                      v-if="miniComponentFor(step)"
                      v-bind="miniPropsFor(step)"
                    />

                    <!-- Fallback: no XMini for this target kind. Render
                         the XMicro chip when we have one, else a bare
                         label so the chain still reads continuously. -->
                    <div v-else class="path-step-fallback">
                      <component
                        :is="microComponentFor(step)"
                        v-if="microComponentFor(step)"
                        v-bind="microPropsFor(step)"
                      />
                      <span v-else class="mono path-step-fallback__label">
                        {{ step.link.target_type }} #{{ step.link.target_id }}
                      </span>
                    </div>

                    <PathLinkConnector
                      v-if="step.index < stepTotal - 1"
                      :link="step.link"
                    />
                  </template>
                  </div>
                  <div v-if="win.bottomSpacer.value > 0" class="path-spacer" :style="{ height: win.bottomSpacer.value + 'px' }" />
                </div>
              </div>
            </div>

          </main>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — sidebar. Single "Steps" panel that mirrors the
             content order with a compact, link-list-style index. Lets
             the user jump to any element on the path without scrolling
             the main pane.
        ══════════════════════════════════════════════════════════ -->
        <aside class="path-side">
          <section class="steps-panel side-panel">
            <div class="steps-panel__header">
              <q-icon name="format_list_numbered" size="14px" class="q-mr-xs" />
              <span>Steps</span>
              <span class="steps-count">{{ stepTotal }}</span>
            </div>
            <div class="steps-panel__scroll">
              <div v-if="!steps.length" class="steps-panel__empty">
                empty path
              </div>
              <!-- the index lists the steps the ring holds (absolute #) -->
              <router-link
                v-for="s in steps"
                :key="s.index"
                :to="targetRouteFor(s) || '#'"
                class="step-row"
              >
                <span class="step-row-tag mono">#{{ s.index + 1 }}</span>
                <q-icon :name="iconForTargetType(s.link.target_type)" size="12px" class="step-row-icon" />
                <span class="step-row-label">{{ stepLabel(s) }}</span>
                <q-space />
                <span class="step-row-ref mono">{{ s.link.target_type }}/{{ shortHash(s.link.path, 8) }}</span>
              </router-link>
            </div>
          </section>
          <section v-if="surroundSections" class="side-panel surround-panel q-pa-sm">
            <ElementSurround
              :sections="surroundSections"
              :provenance-ref="pathRow?.path"
              :access-ref="pathRow?.path"
              :show-author="false"
              :show-moment="false"
              :show-labels="false"
            />
          </section>
        </aside>
      </div>

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, markRaw, nextTick } from 'vue'
import { useWindowedFeed } from 'src/composables/useWindowedFeed'
import { useRoute } from 'vue-router'
import { pathService, PATH_BLOCK } from 'src/services/path.service'

import PathLinkConnector from 'src/components/paths/PathLinkConnector.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import ElementSurround from 'src/components/shared/ElementSurround.vue'
import AccessDeniedBanner from 'src/components/shared/AccessDeniedBanner.vue'
import { useElementSurround } from 'src/composables/useElementSurround'
import { lockedInfoFromError } from 'src/utils/access'

import NodeMini from 'src/components/nodes/NodeMini.vue'
import LabelMini from 'src/components/labels/LabelMini.vue'
import EntityMini from 'src/components/entities/EntityMini.vue'
import PathMini from 'src/components/paths/PathMini.vue'
import PostMini from 'src/components/posts/PostMini.vue'

import NodeMicro from 'src/components/nodes/NodeMicro.vue'
import LabelMicro from 'src/components/labels/LabelMicro.vue'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import PathMicro from 'src/components/paths/PathMicro.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'

// Map target kind → XMini component. Skeleton targets render as Post
// because that's how a POST instance is named in the chain (skeleton
// row, post route, post mini). Any kind not in this table falls through
// to the XMicro chip path.
const MINI_BY_KIND = {
  node: markRaw(NodeMini),
  label: markRaw(LabelMini),
  entity: markRaw(EntityMini),
  path: markRaw(PathMini),
  skeleton: markRaw(PostMini),
  post: markRaw(PostMini)
}

const MICRO_BY_KIND = {
  node: markRaw(NodeMicro),
  label: markRaw(LabelMicro),
  entity: markRaw(EntityMicro),
  path: markRaw(PathMicro),
  skeleton: markRaw(PostMicro),
  post: markRaw(PostMicro)
}

const ICON_BY_KIND = {
  node: 'adjust',
  label: 'label',
  entity: 'person',
  path: 'route',
  skeleton: 'sym_o_mitre',
  post: 'edit_note',
  link: 'link'
}

export default defineComponent({
  name: 'PathViewerPage',
  components: { PathLinkConnector, LabelSlider, MomentInfo, ElementSurround, AccessDeniedBanner },
  setup () {
    const route = useRoute()

    const loading = ref(true)
    const locked = ref(null) // { kind, hash, id, address } when the read 403'd
    const pathRow = ref(null)
    const owner = ref(null)
    const labels = ref([])

    // THE RING (2026-11-02): blocks of PATH_BLOCK steps, the body card the
    // scroller. load() reads block 0 itself (the head + the 403 come with
    // it); the ring adopts that read instead of asking twice.
    const bodyEl = ref(null)
    let firstBlock = null
    const win = useWindowedFeed({
      fetchBlock: async (index) => {
        if (index === 0 && firstBlock) {
          const r = firstBlock
          firstBlock = null
          return { items: r.steps || [], total: r.path?.step_count || 0 }
        }
        const r = await pathService.byId(parseInt(route.params.id), 'forward', { offset: index * PATH_BLOCK, limit: PATH_BLOCK })
        return { items: r?.steps || [], total: r?.path?.step_count || 0 }
      },
      blockSize: PATH_BLOCK,
      estimateItemH: 120,
      scrollEl: bodyEl,
      keyOf: (st) => st?.link?.id ?? st?.index,
      memoryKey: () => `path:${route.params.id}`
    })
    const steps = computed(() => win.items.value)
    const stepTotal = computed(() => pathRow.value?.step_count ?? steps.value.length)
    const copied = ref(false)

    const ownerDisplayName = computed(() => {
      const o = owner.value
      if (!o) return ''
      return o.display_name ||
          o.profile?.display_name ||
          o.username ||
          ('entity #' + o.id)
    })

    // Creation moment comes from the path row itself (moment_id) — the
    // MomentInfo chip self-resolves via /refs/summary.
    const pathMomentId = computed(() => pathRow.value?.moment_id || null)
    const sliderLabels = computed(() => labels.value)

    // Skeleton-grounded surround off the path's ELEMENT skeleton.
    const {
      sections: surroundSections,
      load: loadSurround
    } = useElementSurround(() => {
      const pth = pathRow.value?.path
      return pth ? `paths/${pth.split('/').pop()}` : null
    })

    const load = async () => {
      loading.value = true
      locked.value = null
      pathRow.value = null
      owner.value = null
      labels.value = []
      firstBlock = null

      const id = parseInt(route.params.id)
      if (!id) { loading.value = false; return }
      try {
        const r = await pathService.byId(id, 'forward', { offset: 0, limit: PATH_BLOCK })
        if (r.success) {
          pathRow.value = r.path || null
          owner.value = r.owner || null
          labels.value = r.labels || []
          firstBlock = r
        }
      } catch (e) { locked.value = lockedInfoFromError(e) }
      loading.value = false
      if (pathRow.value) { await nextTick(); win.reset() }
      loadSurround()
    }

    // ── XMini / XMicro dispatch ──────────────────────────────────
    // The step's target.kind tells us which family member to render.
    // miniPropsFor flattens the backend's per-kind sub-object into the
    // single prop each XMini expects (`node`, `label`, `entity`, …).
    const miniComponentFor = (step) => {
      const kind = step?.target?.kind
      if (!kind) return null
      const sub = step.target[kind]
      if (!sub) return null // missing row → fall back to micro
      return MINI_BY_KIND[kind] || null
    }
    const miniPropsFor = (step) => {
      const kind = step?.target?.kind
      const sub = step?.target?.[kind]
      if (!sub) return {}
      // PostMini takes `post`, others take their own kind prop.
      const propKey = (kind === 'skeleton' || kind === 'post') ? 'post' : kind
      return { [propKey]: sub }
    }

    const microComponentFor = (step) => {
      const kind = step?.target?.kind
      return MICRO_BY_KIND[kind] || null
    }
    const microPropsFor = (step) => {
      const link = step?.link
      if (!link) return {}
      const path = `${link.target_type}/${shortHash(link.path, 64)}`
      return { id: link.target_id, path, showType: true }
    }

    // ── steps panel helpers ─────────────────────────────────────
    const targetRouteFor = (step) => {
      const kind = step?.target?.kind
      const id = step?.link?.target_id
      if (!id) return null
      switch (kind) {
        case 'node': return `/nodes/${id}`
        case 'label': return `/labels/${id}`
        case 'entity': return `/entities/${id}`
        case 'path': return `/paths/${id}`
        case 'skeleton': return `/skeletons/${id}`
        case 'post': return `/posts/${id}`
        default: return null
      }
    }

    const iconForTargetType = (t) => ICON_BY_KIND[t] || 'circle'

    const stepLabel = (s) => {
      const k = s?.target?.kind
      const sub = s?.target?.[k]
      if (!sub) return `${s.link.target_type} #${s.link.target_id}`
      if (k === 'node') return sub.content?.slice(0, 60) || `node #${sub.id}`
      if (k === 'label') return sub.name || `label #${sub.id}`
      if (k === 'entity') return sub.display_name || sub.username || `entity #${sub.id}`
      if (k === 'path') return `path #${sub.id} (${sub.step_count} steps)`
      if (k === 'skeleton' || k === 'post') return sub.title || `post #${sub.id}`
      return `${s.link.target_type} #${s.link.target_id}`
    }

    // ── small utils ─────────────────────────────────────────────
    const shortHash = (p, len = 12) => {
      if (!p) return ''
      const h = p.includes('/') ? p.split('/').pop() : p
      return h.slice(0, len) + (h.length > len ? '' : '')
    }

    const copyPath = () => {
      if (!pathRow.value?.path) return
      navigator.clipboard.writeText(pathRow.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      loading,
      locked,
      pathRow,
      owner,
      steps,
      stepTotal,
      win,
      bodyEl,
      pathMomentId,
      sliderLabels,
      ownerDisplayName,
      surroundSections,
      copied,
      copyPath,
      miniComponentFor,
      miniPropsFor,
      microComponentFor,
      microPropsFor,
      targetRouteFor,
      iconForTargetType,
      stepLabel,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
// ── Layout — mirrors NodeDetailPage so the eye reads the two viewers
//    as siblings: same edge-padding, same 75/25 grid, same subject-panel
//    chrome. The only structural difference is a single Steps sidebar
//    instead of [Related, Versions]. ──
.path-page {
  padding: 16px 10px 0;
}

.path-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.path-main { min-width: 0; }

.path-side {
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
  .path-grid { grid-template-columns: minmax(0, 1fr); }
  .path-side { height: auto; max-height: none; }
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

.author-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #f0ecfb;
  border: 1px solid #c1b8e6;
  border-radius: 12px;
  color: #4f3e98;
  font-size: 0.92em;
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: #e5dcf7;
    border-color: #a294d6;
  }
  .author-chip-sep  { opacity: 0.4; margin: 0 1px; }
  .author-chip-hash { font-size: 0.82em; opacity: 0.75; }
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

// ── Body — path slider ─────────────────────────────────
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

.path-slider {
  display: flex;
  flex-direction: column;
  gap: 0; // Mini panels + Connector handle their own spacing
  overflow-anchor: none; // the ring anchors the scroll itself (useWindowedFeed)
}
// a block of the ring lays its steps as the slider did
.path-block {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.path-spacer { flex: none; }

.path-step-fallback {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px dashed rgba(var(--ink-rgb), 0.2);
  border-radius: 6px;
  font-size: 0.82em;
  color: rgba(var(--ink-rgb), 0.6);
}
.path-step-fallback__label {
  color: rgba(var(--ink-rgb), 0.55);
}

// ── Right sidebar — Steps panel ─────────────────────────
.steps-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}
.steps-panel__header {
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
.steps-count {
  font-size: 0.92em;
  margin-left: 5px;
  color: var(--panel-ink-2);
}
.steps-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
}
.steps-panel__empty {
  padding: 10px 12px;
  font-size: 0.80em;
  color: var(--panel-ink-2);
  text-align: center;
  font-style: italic;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--panel-body);
  color: var(--panel-ink);
  text-decoration: none;
  font-size: 0.80em;
  & + & { border-top: 1px solid var(--panel-rule); }
  &:hover { background: #f6f8fb; }
  .step-row-tag   { color: var(--panel-ink-2); flex-shrink: 0; font-size: 0.86em; }
  .step-row-icon  { color: var(--panel-ink-2); flex-shrink: 0; }
  .step-row-label {
    color: var(--panel-ink-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
  }
  .step-row-ref   { color: var(--panel-ink-2); font-size: 0.78em; flex-shrink: 0; }
}
</style>
