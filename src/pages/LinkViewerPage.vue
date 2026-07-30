<template>
  <q-page class="bg-base link-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <AccessDeniedBanner v-else-if="locked" :address="locked.address" />

      <div v-else-if="!link" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Link not found.</div>
      </div>

      <div v-else class="link-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column, shared .subject-panel chrome.
        ══════════════════════════════════════════════════════════ -->
        <div class="link-main">

          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="link" size="22px" class="subject-panel__title-icon link-tint" />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  link #{{ link.id }}
                  <span class="title-target mono">→ {{ link.target_type }} #{{ link.target_id }}</span>
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
                <span v-if="owner && moment" class="vsep" aria-hidden="true" />
                <MomentInfo v-if="moment" :moment="moment" />
              </div>
            </header>

            <!-- Meta strip. -->
            <div class="subject-panel__meta">
              <q-icon name="link" size="14px" class="meta-icon" />
              <div class="meta-label">
                <strong>link #{{ link.id }}</strong>
                <span v-if="parentPath" class="meta-typename">(step {{ position }} of path #{{ parentPath.id }})</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="link.path">{{ link.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <!-- Body — chain navigation + the target element + decoded proto. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">

                <!-- prev ← THIS → next -->
                <div class="chain-nav">
                  <router-link
                    v-if="prev"
                    :to="'/links/' + prev.id"
                    class="chain-nav__step is-link"
                    :title="prev.path"
                  >
                    <q-icon name="chevron_left" size="16px" />
                    <span class="mono">link #{{ prev.id }}</span>
                  </router-link>
                  <span v-else class="chain-nav__step is-edge">
                    <q-icon name="first_page" size="14px" /> chain head
                  </span>

                  <span class="chain-nav__bond" aria-hidden="true" />
                  <span class="chain-nav__current mono">
                    <q-icon name="link" size="14px" class="q-mr-xs link-tint" />link #{{ link.id }}
                  </span>
                  <span class="chain-nav__bond" aria-hidden="true" />

                  <router-link
                    v-if="next"
                    :to="'/links/' + next.id"
                    class="chain-nav__step is-link"
                    :title="next.path"
                  >
                    <span class="mono">link #{{ next.id }}</span>
                    <q-icon name="chevron_right" size="16px" />
                  </router-link>
                  <span v-else class="chain-nav__step is-edge">
                    chain tail <q-icon name="last_page" size="14px" />
                  </span>
                </div>

                <!-- The target element — the payload this link points at. -->
                <div class="target-section">
                  <div class="target-heading">
                    <q-icon name="my_location" size="14px" class="q-mr-xs" />
                    target
                  </div>
                  <component
                    :is="targetMini"
                    v-if="targetMini"
                    v-bind="targetMiniProps"
                  />
                  <div v-else class="target-fallback">
                    <MicroChip
                      :kind="link.target_type"
                      :id="link.target_id"
                      :path="link.target_type + 's/' + link.target_id"
                      :show-type="true"
                    />
                    <span class="mono target-fallback__label">
                      {{ link.target_type }} #{{ link.target_id }}
                    </span>
                  </div>
                </div>

                <!-- Decoded protobuf — refs render as Info chips. -->
                <div class="decoded-section">
                  <div class="decoded-heading">
                    <q-icon name="data_object" size="14px" class="q-mr-xs" />
                    decoded from pathchain
                  </div>
                  <div v-if="!decoded" class="decoded-empty">
                    no on-disk buffer found for this link
                  </div>
                  <div v-else class="decoded-grid">
                    <div v-for="(val, key) in decodedRows" :key="key" class="fact-row">
                      <span class="fact-key mono">{{ key }}</span>
                      <span class="fact-val">
                        <InfoChip
                          v-if="refFor(val)"
                          :kind="refFor(val).prefix"
                          :address="refFor(val).address"
                          dense
                        />
                        <span v-else class="mono">{{ String(val) }}</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </main>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT — the chain this link belongs to.
        ══════════════════════════════════════════════════════════ -->
        <aside class="link-side">
          <section class="chain-panel side-panel">
            <div class="chain-panel__header">
              <q-icon name="route" size="14px" class="q-mr-xs" />
              <span>Chain</span>
            </div>
            <div class="chain-panel__scroll">
              <div class="anchor-block">
                <div class="anchor-block__label">belongs to path</div>
                <PathInfo
                  v-if="parentPath"
                  :id="parentPath.id"
                  :primary="'path #' + parentPath.id"
                  :secondary="'this link is step ' + position"
                />
                <span v-else class="anchor-empty">no path claims this link</span>
              </div>
              <div class="anchor-block">
                <div class="anchor-block__label">minted at</div>
                <MomentInfo v-if="moment" :moment="moment" />
                <span v-else class="anchor-empty">no moment anchored</span>
              </div>
              <div v-if="headerLabels.length" class="anchor-block">
                <div class="anchor-block__label">labels</div>
                <LabelSlider :labels="headerLabels" />
              </div>
              <div v-if="surroundSections" class="anchor-block">
                <div class="anchor-block__label">surround</div>
                <ElementSurround
                  :sections="surroundSections"
                  :provenance-ref="link?.path"
                  :show-author="false"
                  :show-moment="false"
                  :show-labels="false"
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { linkService } from 'src/services/link.service'
import { isHash, shortHash, parseRef } from 'src/utils/kinds'

import MicroChip from 'src/components/shared/MicroChip.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import PathInfo from 'src/components/paths/PathInfo.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import ElementSurround from 'src/components/shared/ElementSurround.vue'
import AccessDeniedBanner from 'src/components/shared/AccessDeniedBanner.vue'
import { lockedInfoFromError } from 'src/utils/access'
import { useElementSurround } from 'src/composables/useElementSurround'

import NodeMini from 'src/components/nodes/NodeMini.vue'
import LabelMini from 'src/components/labels/LabelMini.vue'
import EntityMini from 'src/components/entities/EntityMini.vue'
import PathMini from 'src/components/paths/PathMini.vue'
import PostMini from 'src/components/posts/PostMini.vue'

// Same target dispatch the path viewer uses — the link's target renders
// as its kind's Mini, falling back to a Micro chip.
const MINI_BY_KIND = {
  node: markRaw(NodeMini),
  label: markRaw(LabelMini),
  entity: markRaw(EntityMini),
  path: markRaw(PathMini),
  skeleton: markRaw(PostMini),
  post: markRaw(PostMini)
}

export default defineComponent({
  name: 'LinkViewerPage',
  components: { MicroChip, InfoChip, MomentInfo, PathInfo, LabelSlider, ElementSurround, AccessDeniedBanner },
  setup () {
    const route = useRoute()

    const loading = ref(true)
    const locked = ref(null) // { kind, hash, id, address } when the read 403'd
    const link = ref(null)
    const target = ref(null)
    const prev = ref(null)
    const next = ref(null)
    const parentPath = ref(null)
    const position = ref(null)
    const owner = ref(null)
    const moment = ref(null)
    const decoded = ref(null)
    const header = ref(null)
    const copied = ref(false)

    const ownerDisplayName = computed(() => {
      const o = owner.value
      if (!o) return ''
      return o.display_name || o.username || ('entity #' + o.id)
    })

    // The skeleton-grounded surround (versions / forks / comments / scores)
    // — one GET /refs/surround off the link's own ELEMENT skeleton.
    const {
      sections: surroundSections,
      load: loadSurround
    } = useElementSurround(() => {
      const p = link.value?.path
      return p ? `links/${p.split('/').pop()}` : null
    })

    const headerLabels = computed(() => header.value?.labels || [])

    const targetMini = computed(() => {
      const kind = target.value?.kind
      if (!kind || !target.value?.[kind]) return null
      return MINI_BY_KIND[kind] || null
    })
    const targetMiniProps = computed(() => {
      const kind = target.value?.kind
      const sub = target.value?.[kind]
      if (!sub) return {}
      const propKey = (kind === 'skeleton' || kind === 'post') ? 'post' : kind
      return { [propKey]: sub }
    })

    const decodedRows = computed(() => {
      const d = decoded.value
      if (!d) return {}
      const out = {}
      for (const key of ['register', 'author', 'prev', 'next', 'target', 'ancestor', 'tag']) {
        if (d[key] !== undefined && d[key] !== '') out[key] = d[key]
      }
      return out
    })

    const refFor = (val) => parseRef(typeof val === 'string' ? val : '')

    const load = async () => {
      loading.value = true
      locked.value = null
      link.value = null
      target.value = null
      prev.value = null
      next.value = null
      parentPath.value = null
      position.value = null
      owner.value = null
      moment.value = null
      decoded.value = null
      header.value = null

      const param = String(route.params.id || '')
      try {
        const r = isHash(param)
          ? await linkService.getByHash(param)
          : await linkService.get(parseInt(param))
        if (r.success) {
          link.value = r.link || null
          target.value = r.target || null
          prev.value = r.prev || null
          next.value = r.next || null
          parentPath.value = r.parentPath || null
          position.value = r.position || null
          owner.value = r.owner || null
          moment.value = r.moment || null
          decoded.value = r.decoded || null
          header.value = r.header || null
        }
      } catch (e) { locked.value = lockedInfoFromError(e) }
      loading.value = false
      loadSurround()
    }

    const copyPath = () => {
      if (!link.value?.path) return
      navigator.clipboard.writeText(link.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      loading,
      locked,
      link,
      target,
      prev,
      next,
      parentPath,
      position,
      owner,
      moment,
      decoded,
      ownerDisplayName,
      headerLabels,
      surroundSections,
      targetMini,
      targetMiniProps,
      decodedRows,
      refFor,
      copied,
      copyPath,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
.link-page {
  padding: 16px 10px 0;
}

.link-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.link-main { min-width: 0; }

.link-side {
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
  .link-grid { grid-template-columns: minmax(0, 1fr); }
  .link-side { height: auto; max-height: none; }
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
  &.link-tint { color: #7d8995; }
}
.link-tint { color: #7d8995; }
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
  gap: 10px;
  .title-target {
    font-size: 0.62em;
    color: var(--panel-ink-2);
  }
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
  flex-wrap: wrap;
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

// ── Link body ──────────────────────────────────────────
.chain-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 8px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.15);
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.chain-nav__step {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.82em;
  text-decoration: none;
  &.is-link {
    background: rgba(var(--ink-rgb), 0.04);
    border: 1px solid rgba(var(--ink-rgb), 0.18);
    color: var(--panel-ink-1, #1F2A38);
    &:hover {
      background: rgba(var(--ink-rgb), 0.1);
      border-color: rgba(var(--ink-rgb), 0.32);
    }
  }
  &.is-edge {
    color: rgba(var(--ink-rgb), 0.4);
    font-style: italic;
  }
}
.chain-nav__bond {
  flex: 0 0 26px;
  height: 1px;
  background: rgba(var(--ink-rgb), 0.25);
}
.chain-nav__current {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 10px;
  background: rgba(var(--ink-rgb), 0.08);
  border: 1px solid rgba(var(--ink-rgb), 0.3);
  font-weight: 600;
  font-size: 0.88em;
  color: var(--panel-ink-1, #1F2A38);
}

.target-section { margin-bottom: 14px; }
.target-heading,
.decoded-heading {
  display: flex;
  align-items: center;
  font-size: 0.76em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-bottom: 6px;
}
.target-fallback {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px dashed rgba(var(--ink-rgb), 0.2);
  border-radius: 6px;
  font-size: 0.82em;
}
.target-fallback__label { color: rgba(var(--ink-rgb), 0.55); }

.fact-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 2px;
  font-size: 0.82em;
  & + & { border-top: 1px dotted rgba(var(--ink-rgb), 0.08); }
  .fact-key {
    flex: 0 0 120px;
    color: rgba(var(--ink-rgb), 0.55);
  }
  .fact-val {
    color: var(--panel-ink-1, #1F2A38);
    word-break: break-all;
  }
}

.decoded-section { margin-top: 4px; }
.decoded-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 6px 2px;
}
.decoded-grid { padding-bottom: 8px; }

// ── Right sidebar — chain panel ─────────────────────────
.chain-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}
.chain-panel__header {
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
.chain-panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.anchor-block__label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-2);
  margin-bottom: 5px;
}
.anchor-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
}
</style>
