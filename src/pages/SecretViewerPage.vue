<template>
  <q-page class="bg-base secret-page">
    <div>

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="!secret" class="text-center q-py-xl text-dim">
        <q-icon name="error_outline" size="40px" style="opacity:.3;" />
        <div class="q-mt-sm" style="font-size:0.85em;">Secret not found.</div>
      </div>

      <div v-else class="secret-grid">

        <!-- ══════════════════════════════════════════════════════════
             LEFT — content column, shared .subject-panel chrome.
        ══════════════════════════════════════════════════════════ -->
        <div class="secret-main">

          <main class="subject-panel">

            <header class="subject-panel__ident">
              <div class="subject-panel__titlebar">
                <q-icon name="key" size="22px" class="subject-panel__title-icon secret-tint" />
                <span class="vsep" aria-hidden="true" />
                <div class="subject-panel__title nasalization">
                  secret #{{ secret.id }}
                  <span class="status-badge" :class="secret.used_at ? 'is-used' : 'is-unused'">
                    {{ secret.used_at ? 'used' : 'unused' }}
                  </span>
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
                  <strong>{{ displayName(owner) }}</strong>
                  <span class="author-chip-sep">|</span>
                  <span class="author-chip-hash mono">entity/{{ shortHash(owner.path, 8) }}</span>
                </router-link>
                <q-icon
                  v-if="owner && receiver"
                  name="arrow_forward" size="14px"
                  class="invite-arrow"
                  title="invited"
                />
                <router-link
                  v-if="receiver"
                  :to="'/entities/' + receiver.id"
                  class="author-chip author-chip--receiver"
                  :title="receiver.path"
                >
                  <q-icon name="person_add" size="13px" class="q-mr-xs" />
                  <strong>{{ displayName(receiver) }}</strong>
                </router-link>
                <span v-if="(owner || receiver) && moment" class="vsep" aria-hidden="true" />
                <MomentInfo v-if="moment" :moment="moment" />
              </div>
            </header>

            <!-- Meta strip. -->
            <div class="subject-panel__meta">
              <q-icon name="key" size="14px" class="meta-icon" />
              <div class="meta-label">
                <strong>secret #{{ secret.id }}</strong>
                <span class="meta-typename">(invite secret)</span>
              </div>
              <q-space />
              <span class="meta-hash mono" :title="secret.path">{{ secret.path }}</span>
              <q-btn
                flat dense size="sm" icon="content_copy"
                :ripple="false"
                :title="copied ? 'Copied!' : 'Copy path'"
                @click="copyPath"
                class="meta-btn"
              />
              <q-icon v-if="copied" name="check" size="14px" class="text-positive" />
            </div>

            <!-- Body — the secret's lifecycle + decoded protobuf. -->
            <div class="subject-panel__body">
              <div class="subject-panel__body-card">

                <div class="secret-lifecycle">
                  <div class="lifecycle-step">
                    <div class="lifecycle-step__label">minted by</div>
                    <EntityInfo
                      v-if="owner"
                      :id="owner.id"
                      :primary="displayName(owner)"
                      :secondary="owner.username ? '@' + owner.username : ''"
                    />
                    <span v-else class="lifecycle-empty">unknown</span>
                  </div>
                  <q-icon name="trending_flat" size="20px" class="lifecycle-arrow" />
                  <div class="lifecycle-step">
                    <div class="lifecycle-step__label">consumed by</div>
                    <EntityInfo
                      v-if="receiver"
                      :id="receiver.id"
                      :primary="displayName(receiver)"
                      :secondary="receiver.username ? '@' + receiver.username : ''"
                    />
                    <span v-else class="lifecycle-empty">
                      {{ secret.used_at ? 'unknown' : 'not consumed yet' }}
                    </span>
                  </div>
                </div>

                <div class="secret-facts">
                  <div class="fact-row">
                    <span class="fact-key mono">status</span>
                    <span class="fact-val">
                      <span class="status-badge" :class="secret.used_at ? 'is-used' : 'is-unused'">
                        {{ secret.used_at ? 'used' : 'unused' }}
                      </span>
                    </span>
                  </div>
                  <div v-if="secret.used_at" class="fact-row">
                    <span class="fact-key mono">used_at</span>
                    <span class="fact-val mono">{{ formatDate(secret.used_at) }}</span>
                  </div>
                  <div v-if="secret.cooldown_expires_at" class="fact-row">
                    <span class="fact-key mono">cooldown_expires_at</span>
                    <span class="fact-val mono">{{ formatDate(secret.cooldown_expires_at) }}</span>
                  </div>
                  <div class="fact-row">
                    <span class="fact-key mono">type_id</span>
                    <span class="fact-val mono">{{ secret.type_id }}</span>
                  </div>
                </div>

                <!-- Decoded protobuf — refs render as Info chips. -->
                <div class="decoded-section">
                  <div class="decoded-heading">
                    <q-icon name="data_object" size="14px" class="q-mr-xs" />
                    decoded from pathchain
                  </div>
                  <div v-if="!decoded" class="decoded-empty">
                    no on-disk buffer found for this secret
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
             RIGHT — anchor panel: the minting moment + labels.
        ══════════════════════════════════════════════════════════ -->
        <aside class="secret-side">
          <section class="anchor-panel side-panel">
            <div class="anchor-panel__header">
              <q-icon name="anchor" size="14px" class="q-mr-xs" />
              <span>Anchors</span>
            </div>
            <div class="anchor-panel__scroll">
              <div class="anchor-block">
                <div class="anchor-block__label">minted at</div>
                <MomentInfo v-if="moment" :moment="moment" />
                <span v-else class="anchor-empty">no moment anchored</span>
              </div>
              <div v-if="headerLabels.length" class="anchor-block">
                <div class="anchor-block__label">labels</div>
                <LabelSlider :labels="headerLabels" />
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
import { secretService } from 'src/services/secret.service'
import { isHash, shortHash, parseRef } from 'src/utils/kinds'

import InfoChip from 'src/components/shared/InfoChip.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import EntityInfo from 'src/components/entities/EntityInfo.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'

export default defineComponent({
  name: 'SecretViewerPage',
  components: { InfoChip, MomentInfo, EntityInfo, LabelSlider },
  setup () {
    const route = useRoute()

    const loading = ref(true)
    const secret = ref(null)
    const owner = ref(null)
    const receiver = ref(null)
    const moment = ref(null)
    const decoded = ref(null)
    const header = ref(null)
    const copied = ref(false)

    const displayName = (e) =>
      e?.display_name || e?.username || (e ? 'entity #' + e.id : '')

    const headerLabels = computed(() => header.value?.labels || [])

    // Only the proto's declared fields, in proto order.
    const decodedRows = computed(() => {
      const d = decoded.value
      if (!d) return {}
      const out = {}
      for (const key of ['register', 'author', 'user', 'used', 'tag']) {
        if (d[key] !== undefined && d[key] !== '') out[key] = d[key]
      }
      return out
    })

    const refFor = (val) => parseRef(typeof val === 'string' ? val : '')

    const formatDate = (raw) => {
      const d = new Date(raw)
      return Number.isNaN(d.getTime()) ? String(raw) : d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
    }

    const load = async () => {
      loading.value = true
      secret.value = null
      owner.value = null
      receiver.value = null
      moment.value = null
      decoded.value = null
      header.value = null

      const param = String(route.params.id || '')
      try {
        const r = isHash(param)
          ? await secretService.getByHash(param)
          : await secretService.get(parseInt(param))
        if (r.success) {
          secret.value = r.secret || null
          owner.value = r.owner || null
          receiver.value = r.receiver || null
          moment.value = r.moment || null
          decoded.value = r.decoded || null
          header.value = r.header || null
        }
      } catch (_) { /* leave empty */ }
      loading.value = false
    }

    const copyPath = () => {
      if (!secret.value?.path) return
      navigator.clipboard.writeText(secret.value.path).then(() => {
        copied.value = true
        setTimeout(() => { copied.value = false }, 1500)
      })
    }

    onMounted(load)
    watch(() => route.params.id, load)

    return {
      loading,
      secret,
      owner,
      receiver,
      moment,
      decoded,
      headerLabels,
      decodedRows,
      refFor,
      displayName,
      formatDate,
      copied,
      copyPath,
      shortHash
    }
  }
})
</script>

<style lang="scss" scoped>
.secret-page {
  padding: 16px 10px 0;
}

.secret-grid {
  display: grid;
  grid-template-columns: minmax(0, 75fr) minmax(0, 25fr);
  gap: 12px;
  align-items: stretch;
}
.secret-main { min-width: 0; }

.secret-side {
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
  .secret-grid { grid-template-columns: minmax(0, 1fr); }
  .secret-side { height: auto; max-height: none; }
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
  &.secret-tint { color: #a06070; }
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
  gap: 10px;
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

.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 9px;
  &.is-unused {
    background: #e7f5ec;
    border: 1px solid #a9d8bb;
    color: #22794a;
  }
  &.is-used {
    background: #f5eaea;
    border: 1px solid #d8b3b3;
    color: #9c4a4a;
  }
}

.invite-arrow { color: var(--panel-ink-2, #5b6c82); }

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
.author-chip--receiver {
  background: #eaf3f0;
  border-color: #aecfc4;
  color: #2f6b58;
  &:hover { background: #ddece6; border-color: #8fbcac; }
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

// ── Secret body ────────────────────────────────────────
.secret-lifecycle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 16px 10px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.15);
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.lifecycle-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.lifecycle-step__label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.5);
}
.lifecycle-arrow { color: rgba(var(--ink-rgb), 0.35); }
.lifecycle-empty {
  font-size: 0.82em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
}

.secret-facts { margin-bottom: 14px; }

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

.decoded-section { margin-top: 4px; }
.decoded-heading {
  display: flex;
  align-items: center;
  font-size: 0.76em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.5);
  margin-bottom: 6px;
}
.decoded-empty {
  font-size: 0.8em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 6px 2px;
}
.decoded-grid { padding-bottom: 8px; }

// ── Right sidebar — anchors panel ───────────────────────
.anchor-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
}
.anchor-panel__header {
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
.anchor-panel__scroll {
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
