<template>
  <q-page class="bg-base q-pa-md">

    <!-- ════════════════════════════════════════════════════════════
         LIST MODE — /skeletons (no id). Explorer layout mirroring the
         /labels module: dig-in squares on the left (templates as roots,
         instances carved inside), Structure panel on the right reacting
         to the selected square.
    ═════════════════════════════════════════════════════════════ -->
    <div v-if="!skeletonId" class="row justify-center">
      <div class="col-12 col-xl-10">
        <div class="row items-center q-mb-md">
          <div class="nasalization text-accent" style="font-size:1.1em;">Skeletons</div>
          <q-space />
          <q-input v-model="searchQuery" placeholder="Filter skeletons..." dense outlined dark
            style="width:220px;" clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Big viewer: squares inside squares, one per origin skeleton -->
          <div class="col-12 col-md-7">
            <div class="text-dim q-mb-sm" style="font-size:0.8em; text-transform:uppercase; letter-spacing:.05em;">
              Templates &amp; directories — dig into a square to carve out its instances
            </div>

            <div v-if="loadingList" class="text-center q-py-lg">
              <q-spinner color="primary" />
            </div>

            <div v-else-if="filteredSkeletons.length === 0" class="text-dim text-center q-py-lg" style="font-size:0.82em;">
              <q-icon name="schema" size="32px" style="opacity:.3;" />
              <div class="q-mt-sm">No skeletons yet. Run the seeders:</div>
              <code style="font-size:.9em; color:var(--ink);">node scripts/seed-templates.js</code>
            </div>

            <div v-else class="skeleton-explorer__roots">
              <SkeletonSquares
                v-for="root in filteredSkeletons"
                :key="root.id"
                :skeleton="root"
                :depth="0"
                :selected-id="selectedSkeleton?.id ?? null"
                @select="selectSkeleton"
              />
            </div>
          </div>

          <!-- Tall structure section -->
          <div class="col-12 col-md-5">
            <SkeletonUsages :skeleton="selectedSkeleton" />
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════
         DETAIL MODE — STRUCTURE view of any skeleton
    ═════════════════════════════════════════════════════════════ -->
    <div v-else class="instance-view" style="max-width:1320px; margin:0 auto;">

      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="32px" />
      </div>

      <AccessDeniedBanner v-else-if="locked" :address="locked.address" />

      <!-- ── OWNED-INSTANCE EDITOR: full width, no Usages aside ── -->
      <div v-else-if="skeleton && isOwnedInstance" class="editor-view">
        <main class="subject-panel">
          <header class="subject-panel__ident">
            <div class="subject-panel__title row items-center no-wrap nasalization" style="gap:10px;">
              <q-icon name="schema" size="18px" />
              <span>{{ identifier.title || skeleton.name || '(unnamed)' }}</span>
              <q-space />
              <q-btn
                v-if="isForkableInstance"
                outline dense no-caps size="sm" color="primary" icon="call_split"
                label="Fork"
                :loading="forking"
                title="Fork this instantiation into your own copy — contents referenced, surround fresh"
                @click="forkThisInstance"
              />
              <q-btn-dropdown
                outline dense no-caps size="sm" color="primary" icon="download"
                label="Export" :loading="exporting"
                title="Take this skeleton with you — unraveled layers with chain evidence, or instance rows for a chart"
              >
                <q-list dense>
                  <q-item v-close-popup clickable @click="exportSkeleton('bundle')">
                    <q-item-section>
                      <q-item-label>Bundle · 3 layers deep</q-item-label>
                      <q-item-label caption>every element with its signature + verify verdict</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="exportSkeleton('rows')">
                    <q-item-section>
                      <q-item-label>Rows · tabular</q-item-label>
                      <q-item-label caption>instance slots as data rows, every cell a chain ref</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <ElementActions
                target-type="skeleton"
                :source-id="skeleton.id"
                :source-owner-id="skeleton.owner_id"
                :source-name="skeleton.name || ''"
                :hide-fork="isSchema || isForkableInstance"
                @updated="onSkeletonUpdated"
              />
              <!-- the owned-instance editor never hosts POSTs — no post view -->
              <SkeletonRefLinks :id="skeleton.id" :post="false" />
            </div>
            <div class="subject-panel__chips row items-center" style="gap:14px; flex-wrap:wrap;">
              <span v-if="skeleton.schema" class="chip-fact">
                <q-icon name="architecture" size="12px" class="q-mr-xs" />
                instance of
                <router-link :to="'/skeletons/' + skeleton.schema.id" class="mono q-ml-xs">{{ skeleton.schema.name }}</router-link>
              </span>
              <span class="chip-fact" :title="skeleton.created_at">
                <q-icon name="schedule" size="12px" class="q-mr-xs" />
                {{ formatTime(skeleton.created_at) }}
              </span>
              <EntityInfo v-if="identifier.author" :id="identifier.author.id" dense />
            </div>
            <div v-if="skeletonMomentId || sliderLabels.length" class="subject-panel__labels">
              <MomentInfo v-if="skeletonMomentId" :moment-id="skeletonMomentId" />
              <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
            </div>
          </header>
        </main>

        <!-- CLAIM instances carry the argument band (Thread D reader
             surface) — the author's read: status, tally, evidence tree,
             retract. Votes/retract rebind STATUS, so the band reloads
             the slot table underneath it. -->
        <ClaimBand
          v-if="isClaimInstance"
          :claim-id="skeletonId"
          :owner-id="skeleton.owner_id"
          @changed="reloadSlots"
        />

        <!-- GITHUB_PR instances lead with the native PR card (open-source
             dev flow, 2026-08-01) — the raw slot table stays below. -->
        <GithubPrCard v-if="isGithubPrInstance" :slots="slots" class="q-mb-md" />

        <!-- The owner's access contract (Thread K): who can read this
             instance, as recorded grants — with per-row revoke. -->
        <AccessContractPanel v-if="skeleton.path" :address="skeleton.path" />

        <SkeletonInstanceEditor
          :skeleton-id="skeletonId"
          :slots="slots"
          @changed="reloadSlots"
        />
      </div>

      <div v-else-if="skeleton" class="skeleton-grid">
        <!-- ── LEFT: structure column ── -->
        <div class="skeleton-main">

        <!-- CLAIM instances lead with the argument band (Thread D reader
             surface): statement + status + evidence tree + stance controls.
             The structure panel below stays the element's raw truth. -->
        <ClaimBand
          v-if="isClaimInstance"
          :claim-id="skeletonId"
          :owner-id="skeleton.owner_id"
          @changed="reloadSlots"
        />

        <!-- GITHUB_PR instances lead with the native PR card here too. -->
        <GithubPrCard v-if="isGithubPrInstance" :slots="slots" class="q-mb-md" />

        <!-- subject-panel — single container that holds everything about
             the viewed skeleton: identity zone (title row, ElementActions,
             ref links, file path, lineage, time, view-as-post, labels) and
             the structural body (slots or directory items). -->
        <main class="subject-panel">

          <header class="subject-panel__ident">
            <div class="subject-panel__title row items-center no-wrap nasalization" style="gap:10px;">
              <q-icon :name="iconForSkeleton(skeleton)" size="18px" />
              <span>{{ identifier.title || skeleton.name || '(unnamed)' }}</span>
              <q-space />
              <q-btn
                v-if="isSchema"
                unelevated dense no-caps size="sm" color="primary" icon="add_box"
                label="Instantiate"
                :loading="instantiating"
                title="Create an empty instance of this schema and fill it"
                @click="instantiateSchema"
              />
              <q-btn
                v-if="isSchema"
                outline dense no-caps size="sm" color="primary" icon="call_split"
                label="Fork"
                title="Fork this schema into a new one — its keys and constraints become yours to modify"
                @click="forkSchema"
              />
              <q-btn
                v-else-if="isForkableInstance"
                outline dense no-caps size="sm" color="primary" icon="call_split"
                label="Fork"
                :loading="forking"
                title="Fork this instantiation into your own copy — contents referenced, surround fresh"
                @click="forkThisInstance"
              />
              <q-btn-dropdown
                outline dense no-caps size="sm" color="primary" icon="download"
                label="Export" :loading="exporting"
                title="Take this skeleton with you — unraveled layers with chain evidence, or instance rows for a chart"
              >
                <q-list dense>
                  <q-item v-close-popup clickable @click="exportSkeleton('bundle')">
                    <q-item-section>
                      <q-item-label>Bundle · 3 layers deep</q-item-label>
                      <q-item-label caption>every element with its signature + verify verdict</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="exportSkeleton('rows')">
                    <q-item-section>
                      <q-item-label>Rows · tabular</q-item-label>
                      <q-item-label caption>instance slots as data rows, every cell a chain ref</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <ElementActions
                target-type="skeleton"
                :source-id="skeleton.id"
                :source-owner-id="skeleton.owner_id"
                :source-name="skeleton.name || ''"
                :hide-fork="isSchema || isForkableInstance"
                @updated="onSkeletonUpdated"
              />
              <SkeletonRefLinks :id="skeleton.id" :post="isPostInstance" />
            </div>

            <div class="subject-panel__chips row items-center" style="gap:14px; flex-wrap:wrap;">
              <span v-if="identifier.filePath" class="chip-fact">
                <q-icon name="folder" size="12px" class="q-mr-xs" />
                <span class="mono">{{ identifier.filePath }}</span>
              </span>
              <span v-if="skeleton.schema" class="chip-fact">
                <q-icon name="architecture" size="12px" class="q-mr-xs" />
                instance of
                <router-link :to="'/skeletons/' + skeleton.schema.id" class="mono q-ml-xs">{{ skeleton.schema.name }}</router-link>
              </span>
              <span v-else-if="skeleton.ancestor_id && skeleton.ancestor_id !== skeleton.id" class="chip-fact">
                <q-icon name="device_hub" size="12px" class="q-mr-xs" />
                instantiated from
                <router-link :to="'/skeletons/' + skeleton.ancestor_id" class="mono q-ml-xs">#{{ skeleton.ancestor_id }}</router-link>
              </span>
              <span v-else-if="skeleton.ancestor_id === skeleton.id" class="chip-fact">
                <q-icon name="circle" size="8px" class="q-mr-xs" />origin
              </span>
              <span v-if="skeleton.forked_from" class="chip-fact">
                <q-icon name="call_split" size="12px" class="q-mr-xs" />
                forked from
                <router-link :to="'/skeletons/' + skeleton.forked_from.id" class="mono q-ml-xs">{{ skeleton.forked_from.name }}</router-link>
              </span>
              <span class="chip-fact" :title="skeleton.created_at">
                <q-icon name="schedule" size="12px" class="q-mr-xs" />
                {{ formatTime(skeleton.created_at) }}
              </span>
              <EntityInfo
                v-if="identifier.author"
                :id="identifier.author.id"
                dense
              />
              <q-space />
              <router-link
                v-if="isPostInstance"
                :to="'/posts/' + skeletonId"
                class="view-as-post-link"
                title="View this skeleton instance as a post"
              >
                <q-icon name="article" size="13px" class="q-mr-xs" />view as post
              </router-link>
            </div>

            <div v-if="skeletonMomentId || sliderLabels.length" class="subject-panel__labels">
              <MomentInfo v-if="skeletonMomentId" :moment-id="skeletonMomentId" />
              <LabelSlider v-if="sliderLabels.length" :labels="sliderLabels" />
            </div>
          </header>

          <!-- SCHEMA body — field / constraint table (read-only definition) -->
          <div v-if="isSchema" class="subject-panel__body subject-panel__body--list">
            <div class="body-heading">
              <q-icon name="architecture" size="16px" class="q-mr-sm" />
              Fields ({{ slots.length }})
            </div>
            <table class="schema-table">
              <thead>
                <tr><th class="col-field">Field</th><th class="col-accepts">Accepts</th></tr>
              </thead>
              <tbody>
                <tr v-for="s in slots" :key="s.slotName">
                  <td class="col-field"><span class="mono">{{ s.slotName }}</span></td>
                  <td class="col-accepts">
                    <span class="kind-chip" :style="{ '--kind-color': s.expectedKind ? kindColor(s.expectedKind) : 'rgba(90,100,110,0.8)' }">
                      {{ s.expectedKind || 'any' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="schema-hint">
              <q-icon name="info" size="13px" class="q-mr-xs" />
              Instantiate this schema to create a fillable instance — each field becomes an editable row.
            </div>
          </div>

          <!-- Body — slots OR directory items (read-only for non-owned). -->
          <div v-else-if="slots.length" class="subject-panel__body subject-panel__body--list">
            <div class="body-heading">
              <q-icon name="schema" size="16px" class="q-mr-sm" />
              Fields ({{ slots.length }})
            </div>
            <div class="slot-list">
              <SlotRenderer v-for="slot in slots" :key="slot.slotName" :entry="slot" />
            </div>
          </div>

          <div v-else-if="dirItems.length" class="subject-panel__body subject-panel__body--list">
            <div class="body-heading">
              <q-icon name="folder" size="16px" class="q-mr-sm" />
              Contains ({{ dirItems.length }})
            </div>
            <div class="q-gutter-sm q-pa-md">
              <div
                v-for="item in dirItems"
                :key="item.id"
                class="pathos-card q-pa-sm dir-row"
              >
                <q-icon :name="iconForSkeleton(item)" size="14px" class="q-mr-sm" />
                <router-link :to="'/posts/' + item.id" class="text-ink dir-row-name">
                  {{ item.title || item.name }}
                </router-link>
                <span v-if="item.filePath" class="text-dim mono q-ml-md" style="font-size:0.78em;">
                  {{ item.filePath }}
                </span>
                <q-space />
                <SkeletonRefLinks :id="item.id" :post="item.name === 'POST'" />
              </div>
            </div>
          </div>
        </main>

        <!-- Forks — skeletons whose forked_from points here. For a schema
             this is its fork family (e.g. ELEMENT → NODE/PATH/…): each
             fork is itself a schema, editable by its own owner. -->
        <div v-if="forks.length" class="q-mb-md q-mt-md">
          <div class="section-heading">
            <q-icon name="call_split" size="16px" class="q-mr-sm" /> Forks ({{ forks.length }})
          </div>
          <div class="q-gutter-sm">
            <router-link
              v-for="f in forks"
              :key="f.id"
              :to="'/skeletons/' + f.id"
              class="child-row-link"
            >
              <div class="pathos-card q-pa-sm child-row">
                <q-icon :name="iconForSkeleton(f)" size="14px" class="q-mr-sm" />
                <span class="mono">{{ f.title || f.name }}</span>
                <span v-if="f.author && f.author.username" class="text-dim q-ml-md" style="font-size:0.8em;">
                  {{ f.author.username }}
                </span>
                <q-space />
                <span class="text-dim mono" style="font-size:0.78em;">{{ shortHash(f.path) }}</span>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Children (INTERACTION_TREE) -->
        <div v-if="children.length" class="q-mb-md">
          <div class="section-heading">
            <q-icon name="forum" size="16px" class="q-mr-sm" /> Children ({{ children.length }})
          </div>
          <div class="q-gutter-sm">
            <router-link
              v-for="c in children"
              :key="c.id"
              :to="'/posts/' + c.id"
              class="child-row-link"
            >
              <div class="pathos-card q-pa-sm child-row">
                <SkeletonRefLinks :id="c.id" />
                <span class="text-dim q-ml-md mono">{{ shortHash(c.path) }}</span>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Versions (VERSION_TREE) -->
        <div v-if="versions.length">
          <div class="section-heading">
            <q-icon name="history" size="16px" class="q-mr-sm" /> Previous Versions ({{ versions.length }})
          </div>
          <div class="q-gutter-sm">
            <div v-for="(v, i) in versions" :key="v.id" class="pathos-card q-pa-sm version-row">
              <span class="text-dim mono">v{{ i + 1 }}</span>
              <span class="text-ink q-ml-md" style="font-size:0.9em;">{{ (v.content || '').slice(0, 100) }}</span>
            </div>
          </div>
        </div>

        </div><!-- /.skeleton-main -->

        <!-- ── RIGHT: Usages panel — direct instances of this skeleton ── -->
        <aside class="skeleton-side">
          <!-- The owner's access contract (Thread K) — self-hides for
               non-owners and ungated elements (schemas stay open). -->
          <AccessContractPanel
            v-if="skeleton.path && !isSchema"
            class="q-mb-sm"
            :address="skeleton.path"
          />
          <div class="section-heading" style="padding:0 4px;">
            <q-icon name="how_to_reg" size="16px" class="q-mr-sm" />
            Usages
            <span class="text-dim q-ml-xs" style="font-weight:normal;">
              ({{ loadingInstances ? '…' : instancesTotal }})
            </span>
          </div>

          <div class="usages-scroll pathos-card q-pa-sm">
            <div v-if="loadingInstances" class="text-center q-py-md">
              <q-spinner color="primary" size="22px" />
            </div>
            <div v-else-if="instances.length === 0" class="text-dim q-py-md text-center" style="font-size:0.85em;">
              No instances yet.
            </div>
            <router-link
              v-for="i in instances"
              :key="i.id"
              :to="usageRoute(i)"
              class="usage-row-link"
            >
              <div class="usage-row">
                <div class="row items-center no-wrap" style="gap:6px;">
                  <q-icon :name="i.is_doc ? 'menu_book' : iconForSkeleton(i)" size="13px" class="text-dim" />
                  <span class="usage-title">{{ usageTitle(i) }}</span>
                  <q-space />
                  <SkeletonRefLinks :id="i.id" :post="i.name === 'POST'" />
                </div>

                <div class="row items-center no-wrap usage-meta">
                  <q-icon name="person" size="10px" class="q-mr-xs" />
                  <span>{{ (i.author && i.author.username) || ('entity #' + i.owner_id) }}</span>
                  <span class="usage-dot">·</span>
                  <span :title="i.created_at">{{ formatTimeShort(i.created_at) }}</span>
                </div>

                <div v-if="i.excerpt" class="usage-excerpt">
                  {{ i.excerpt }}<span v-if="i.excerpt.length >= 120">…</span>
                </div>

                <div v-if="usageChips(i).length" class="row q-mt-xs" style="gap:4px; flex-wrap:wrap;">
                  <span
                    v-for="l in usageChips(i)"
                    :key="l.id"
                    class="usage-chip"
                    :title="l.chain.map(c => c.name).join(' > ')"
                  >{{ l.name }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </aside>
      </div>
    </div>

  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { skeletonService } from 'src/services/skeleton.service'
import { useStateHolder } from 'src/composables/useStateHolder'
import { useAuthStore } from 'src/stores/auth'
import { useSkeletonBuilderStore } from 'src/stores/skeletonBuilder'
import { hashOf, kindFor } from 'src/utils/kinds'
import SlotRenderer from 'src/components/skeletons/SlotRenderer.vue'
import SkeletonSquares from 'src/components/skeletons/SkeletonSquares.vue'
import SkeletonUsages from 'src/components/skeletons/SkeletonUsages.vue'
import SkeletonInstanceEditor from 'src/components/skeletons/SkeletonInstanceEditor.vue'
import LabelSlider from 'src/components/labels/LabelSlider.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import EntityInfo from 'src/components/entities/EntityInfo.vue'
import SkeletonRefLinks from 'src/components/shared/SkeletonRefLinks.vue'
import ElementActions from 'src/components/maker/ElementActions.vue'
import AccessDeniedBanner from 'src/components/shared/AccessDeniedBanner.vue'
import ClaimBand from 'src/components/claims/ClaimBand.vue'
import GithubPrCard from 'src/components/dev/GithubPrCard.vue'
import AccessContractPanel from 'src/components/shared/AccessContractPanel.vue'
import { lockedInfoFromError } from 'src/utils/access'

// Per-schema icon — ELEMENT:<ref> names collapse to their ELEMENT base.
const SKELETON_ICONS = {
  PATHOS_DOCS: 'folder',
  POST: 'article',
  PIN: 'push_pin',
  PINS: 'push_pin',
  USER_PROFILE: 'person',
  PATH_VIEW: 'route',
  ELEMENT: 'crop_free',
  // Per-kind element schemas (forks of ELEMENT) — icons match kinds.js.
  NODE: 'adjust',
  LABEL: 'label_important',
  MOMENT: 'schedule',
  SECRET: 'key',
  LINK: 'link',
  PATH: 'route'
}
const iconForSkeleton = (s) => SKELETON_ICONS[(s?.name || '').split(':')[0]] || 'schema'

// Usage rows: a bound TITLE when there is one (POSTs), else the instance's
// own name — never "(untitled)", which misreads non-post instances as
// title-less posts. ELEMENT:<kind>/<hash> names compact their hash.
const usageTitle = (i) => {
  if (i.title) return i.title
  const n = i.name || `skeleton #${i.id}`
  const m = n.match(/^ELEMENT:([a-z]+)\/([a-f0-9]{12,})$/)
  return m ? `ELEMENT:${m[1]}/${m[2].slice(0, 8)}…` : n
}

const formatTime = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch (_) { return iso }
}

const shortHash = (p) => {
  const h = (p || '').split('/').pop()
  return h ? h.slice(0, 14) + (h.length > 14 ? '…' : '') : ''
}

// Per-family chip tint for the Labels panel — mirrors PostViewerPage so
// POST / DOC families are visually distinct.
const labelChipClass = (l) => {
  const parent = l.chain[1]?.name
  if (parent === 'POST') return 'chip-post'
  if (l.name === 'DOC') return 'chip-doc'
  return ''
}

export default defineComponent({
  name: 'SkeletonPage',
  components: {
    GithubPrCard,
    SlotRenderer,
    SkeletonSquares,
    SkeletonUsages,
    SkeletonInstanceEditor,
    LabelSlider,
    MomentInfo,
    EntityInfo,
    SkeletonRefLinks,
    ElementActions,
    AccessDeniedBanner,
    ClaimBand,
    AccessContractPanel
  },

  setup () {
    const route = useRoute()
    const router = useRouter()
    const auth = useAuthStore()
    const skeletonId = computed(() => {
      const v = parseInt(route.params.id)
      return Number.isInteger(v) && v > 0 ? v : null
    })

    // ── List mode (explorer) ──────────────────────────────────
    const skeletons = ref([])
    const loadingList = ref(false)
    const selectedSkeleton = ref(null)
    const searchQuery = ref('')

    const filteredSkeletons = computed(() => {
      const q = (searchQuery.value || '').trim().toLowerCase()
      if (!q) return skeletons.value
      return skeletons.value.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.path || '').toLowerCase().includes(q))
    })

    // StateHolder — list mode remembers selection + search; detail mode
    // remembers the approximate scroll and halos the ref you came back from.
    const holder = useStateHolder({ selected: null, query: '' }, { targetType: 'skeleton' })

    const selectSkeleton = (s) => {
      selectedSkeleton.value = s
      holder.state.selected = s ? { id: s.id, name: s.name, path: s.path } : null
    }

    watch(searchQuery, (q) => { holder.state.query = q || '' })

    const loadList = async () => {
      loadingList.value = true
      try {
        // origins=true → only first-class skeletons (templates, directories,
        // user PINS collections). Instances are dug out of each square
        // on demand (SkeletonSquares paginates them).
        const r = await skeletonService.list({ origins: true })
        if (r.success) skeletons.value = r.skeletons
      } catch (_) { skeletons.value = [] }
      loadingList.value = false

      // Re-apply the remembered exploration.
      if (holder.state.selected) selectedSkeleton.value = holder.state.selected
      if (holder.state.query) searchQuery.value = holder.state.query
      await holder.restore()
    }

    // ── Detail mode ───────────────────────────────────────────
    const loading = ref(false)
    const locked = ref(null) // { kind, hash, id, address } when the read 403'd
    const skeleton = ref(null)
    const slots = ref([])
    const attachedLabels = ref([])
    // Creation moment comes from the skeleton row itself (moment_id) —
    // the MomentInfo chip self-resolves via /refs/summary.
    const skeletonMomentId = computed(() => skeleton.value?.moment_id || null)
    const sliderLabels = computed(() => attachedLabels.value)
    const children = ref([])
    const versions = ref([])
    const identifier = ref({ title: '', filePath: '', author: null })
    const dirItems = ref([]) // enriched directory items if this skeleton holds skeleton refs

    // Direct instances (skeletons whose ancestor_id = this.id) for the
    // right-side Usages panel. Bounded by viewport via CSS.
    const instances = ref([])
    const instancesTotal = ref(0)
    const loadingInstances = ref(false)

    const loadInstances = async () => {
      loadingInstances.value = true
      try {
        const r = await skeletonService.listInstances(skeletonId.value, { limit: 100 })
        if (r.success) {
          instances.value = r.instances || []
          instancesTotal.value = r.total || instances.value.length
        }
      } catch (_) { instances.value = [] }
      loadingInstances.value = false
    }

    // Direct forks (forked_from_id → here) for the Forks band. On a
    // schema this is its fork family (ELEMENT → NODE/PATH/…/SKELETON).
    const forks = ref([])
    const loadForks = async () => {
      try {
        const r = await skeletonService.listForks(skeletonId.value)
        forks.value = r.forks || []
      } catch (_) { forks.value = [] }
    }

    // Self-ref ancestor convention: origins have ancestor_id == id; an
    // instance has ancestor_id pointing at its template (a different id).
    const isPostInstance = computed(() => {
      const s = skeleton.value
      return s?.name === 'POST' && s?.ancestor_id != null && s?.ancestor_id !== s?.id
    })

    // Schema = an instantiable definition (origin carrying the SCHEMA
    // classification label). Walk surfaces this as skeleton.is_schema.
    const isSchema = computed(() => !!skeleton.value?.is_schema)

    // CLAIM instances mount the argument band (Thread D reader surface).
    const isClaimInstance = computed(() => {
      const s = skeleton.value
      return s?.name === 'CLAIM' && s?.ancestor_id != null && s?.ancestor_id !== s?.id
    })

    // GITHUB_PR instances mount the native PR card (open-source dev flow).
    const isGithubPrInstance = computed(() => {
      const s = skeleton.value
      return s?.name === 'GITHUB_PR' && s?.ancestor_id != null && s?.ancestor_id !== s?.id
    })

    // Instances fork generically — except POSTs (their own fork flow on
    // the post viewer) and ELEMENT:* headers (surround plumbing).
    const isForkableInstance = computed(() => {
      const s = skeleton.value
      if (!s || isSchema.value) return false
      const isInstance = s.ancestor_id != null && s.ancestor_id !== s.id
      return isInstance && s.name !== 'POST' &&
        !String(s.name || '').startsWith('ELEMENT:') &&
        auth.entityId != null
    })

    // The editable-table experience: an instance (has a schema pointer) the
    // viewer owns and that isn't a POST (posts have their own editor). Docs
    // directories / PINS collections aren't instances, so they fall through
    // to the read-only view.
    const isOwnedInstance = computed(() => {
      const s = skeleton.value
      if (!s || isSchema.value) return false
      const isInstance = s.ancestor_id != null && s.ancestor_id !== s.id
      return isInstance && s.name !== 'POST' &&
        auth.entityId != null && s.owner_id === auth.entityId &&
        slots.value.length > 0
    })

    const instantiating = ref(false)
    const instantiateSchema = async () => {
      if (!skeletonId.value) return
      instantiating.value = true
      try {
        const r = await skeletonService.instantiateById(skeletonId.value, {})
        if (r.success) router.push('/skeletons/' + r.skeleton.id)
      } catch (_) { /* surfaced by the button leaving its loading state */ }
      instantiating.value = false
    }

    // Fork a schema: open the builder dock's fork draft (rename + tweak
    // fields, submit records lineage server-side). Works on your own
    // schemas too — that's how you branch a variant.
    const builder = useSkeletonBuilderStore()
    const forkSchema = () => {
      if (!skeleton.value) return
      builder.openForkDraft({ skeleton: skeleton.value, slots: slots.value })
    }

    // Fork an instantiation: server-side copy of the same schema with the
    // slot refs carried over; the fork inherits the INSTANTIATION side.
    const forking = ref(false)
    const forkThisInstance = async () => {
      if (!skeletonId.value) return
      forking.value = true
      try {
        const r = await skeletonService.forkOf(skeletonId.value, {})
        if (r.success && r.skeleton?.id) router.push('/skeletons/' + r.skeleton.id)
      } catch (_) { /* surfaced by the button leaving its loading state */ }
      forking.value = false
    }

    // Deep export (2026-08-01, data-ownership thread A): download the
    // skeleton unraveled 3 layers (bundle) or its instance rows, as a JSON
    // file — the chunk that leaves the platform still carrying its chain
    // evidence.
    const exporting = ref(false)
    const exportSkeleton = async (format) => {
      if (!skeletonId.value) return
      exporting.value = true
      try {
        const r = await skeletonService.exportDeep(skeletonId.value, { format, depth: 3 })
        if (r.success) {
          const name = (skeleton.value?.name || 'skeleton').toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const blob = new Blob([JSON.stringify(r.export, null, 2)], { type: 'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `pathos-${name}-${skeletonId.value}-${format}.json`
          a.click()
          URL.revokeObjectURL(a.href)
        }
      } catch (_) { /* 403 root → the banner path already told the story */ }
      exporting.value = false
    }

    // Re-walk just the slots after an inline bind (keeps the editor's rows
    // and the header title fresh without a full page reload).
    const reloadSlots = async () => {
      const w = await skeletonService.walk(skeletonId.value)
      if (w.success) {
        skeleton.value = w.skeleton
        slots.value = w.slots || []
        const titleSlot = slots.value.find(s => s.slotName === 'TITLE')
        if (titleSlot?.ref) {
          const r = await skeletonService.resolveRef(titleSlot.ref)
          if (r.success) identifier.value = { ...identifier.value, title: r.row.content || '' }
        }
      }
    }

    const kindColor = (k) => kindFor(k).color

    const load = async () => {
      loading.value = true
      locked.value = null
      skeleton.value = null
      slots.value = []; attachedLabels.value = []
      children.value = []; versions.value = []; forks.value = []
      identifier.value = { title: '', filePath: '', author: null }
      dirItems.value = []

      try {
        const [walkR, labelsR, kidsR, versR] = await Promise.all([
          skeletonService.walk(skeletonId.value),
          skeletonService.labels(skeletonId.value),
          skeletonService.listChildren(skeletonId.value).catch(() => ({ children: [] })),
          skeletonService.listVersions(skeletonId.value).catch(() => ({ versions: [] }))
        ])
        if (walkR.success) {
          skeleton.value = walkR.skeleton
          slots.value = walkR.slots || []
        }
        attachedLabels.value = labelsR.labels || []
        children.value = kidsR.children || []
        versions.value = versR.versions || []

        // Kick off the Usages panel + Forks band loads in parallel; no
        // need to await — they render independently once resolved.
        loadInstances()
        loadForks()

        // Pull identifying details. The source path (docs mirror) is data
        // on the CONTENT node — line 2 of its content, surfaced as
        // node.file.name — not a label.
        const titleSlot = slots.value.find(s => s.slotName === 'TITLE')
        const authorSlot = slots.value.find(s => s.slotName === 'AUTHOR')
        const contentSlot = slots.value.find(s => s.slotName === 'CONTENT')
        if (titleSlot?.ref) {
          const r = await skeletonService.resolveRef(titleSlot.ref)
          if (r.success) identifier.value.title = r.row.content || ''
        }
        if (authorSlot?.ref) {
          const r = await skeletonService.resolveRef(authorSlot.ref)
          if (r.success) identifier.value.author = r.row
        }
        if (contentSlot?.ref && contentSlot.ref.startsWith('nodes/')) {
          const r = await skeletonService.resolveRef(contentSlot.ref)
          if (r.success) identifier.value.filePath = r.row.file?.name || ''
        }

        // If this is a directory-shaped skeleton with no slots, walk the
        // vals_path links to get the contained skeleton refs.
        if (slots.value.length === 0) {
          try {
            const items = await skeletonService.items(skeletonId.value)
            if (items.success) {
              // items[].val.target.id is a skeleton id when it carries skeleton refs.
              const enriched = []
              for (const it of items.items || []) {
                const valTarget = it.val?.target
                const targetType = it.val?.link?.target_type
                if (valTarget && targetType === 'skeleton') {
                  let title = ''
                  let filePath = ''
                  try {
                    const w = await skeletonService.walk(valTarget.id)
                    const titleSlot = w.slots?.find(x => x.slotName === 'TITLE')
                    if (titleSlot?.ref) {
                      const rr = await skeletonService.resolveRef(titleSlot.ref)
                      if (rr.success) title = rr.row.content || ''
                    }
                    // Source path = the CONTENT node's own name (line 2 of
                    // its content), not a label.
                    const contentSlot = w.slots?.find(x => x.slotName === 'CONTENT')
                    if (contentSlot?.ref && contentSlot.ref.startsWith('nodes/')) {
                      const rr = await skeletonService.resolveRef(contentSlot.ref)
                      if (rr.success) filePath = rr.row.file?.name || ''
                    }
                  } catch (_) { /* skip */ }
                  enriched.push({ id: valTarget.id, name: valTarget.name, path: valTarget.path, title, filePath })
                }
              }
              dirItems.value = enriched
            }
          } catch (_) { dirItems.value = [] }
        }
      } catch (e) { locked.value = lockedInfoFromError(e) }
      loading.value = false

      holder.describe({
        title: identifier.value.title || skeleton.value?.name || `Skeleton #${skeletonId.value}`,
        hash: hashOf(skeleton.value?.path || ''),
        targetType: 'skeleton',
        targetId: skeletonId.value
      })
      await holder.restore()
    }

    onMounted(() => { if (skeletonId.value) load(); else loadList() })
    watch(() => route.params.id, () => { if (skeletonId.value) load(); else loadList() })

    // ── Usages panel helpers ─────────────────────────────────
    const usageRoute = (i) => {
      // POST instances open in the post viewer; everything else opens its
      // own skeleton structure view.
      return i.name === 'POST' ? `/posts/${i.id}` : `/skeletons/${i.id}`
    }

    const formatTimeShort = (iso) => {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        const diffMs = Date.now() - d.getTime()
        const mins = Math.floor(diffMs / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return mins + 'm'
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return hrs + 'h'
        const days = Math.floor(hrs / 24)
        if (days < 7) return days + 'd'
        return d.toLocaleDateString()
      } catch (_) { return iso }
    }

    // The chips we show under a usage row — strip the bare DOC marker since
    // it's already rendered above.
    const usageChips = (i) => {
      return (i.labels || []).filter(l => {
        const root = l.chain?.[0]?.name
        const parent = l.chain?.[1]?.name
        if (root === 'PATHCHAIN' && parent === 'DOC' && l.chain?.length === 2) return false
        return true
      })
    }

    const onSkeletonUpdated = (updated) => {
      if (updated?.id && skeleton.value) {
        skeleton.value = { ...skeleton.value, ...updated }
      }
    }

    return {
      skeletonId,
      locked,
      isPostInstance,
      isSchema,
      isClaimInstance,
      isGithubPrInstance,
      isOwnedInstance,
      isForkableInstance,
      instantiating,
      instantiateSchema,
      forkSchema,
      forking,
      exporting,
      exportSkeleton,
      forkThisInstance,
      forks,
      reloadSlots,
      kindColor,
      // list mode (explorer)
      skeletons,
      loadingList,
      filteredSkeletons,
      selectedSkeleton,
      selectSkeleton,
      searchQuery,
      // detail mode
      loading,
      skeleton,
      slots,
      attachedLabels,
      skeletonMomentId,
      sliderLabels,
      children,
      versions,
      identifier,
      dirItems,
      // usages panel
      instances,
      instancesTotal,
      loadingInstances,
      usageRoute,
      usageTitle,
      formatTimeShort,
      usageChips,
      // ElementActions callback
      onSkeletonUpdated,
      // helpers
      iconForSkeleton,
      formatTime,
      shortHash,
      labelChipClass
    }
  }
})
</script>

<style lang="scss" scoped>
// Explorer (list mode) — mirrors .label-explorer__roots.
.skeleton-explorer__roots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// (the schema/instance mode badges are gone — the SCHEMA / INSTANTIATION
// classification labels render as real chips in the labels band)

// ── owned-instance editor view (full width, no Usages aside) ──
.editor-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Schema definition table ──
.schema-table {
  width: 100%;
  border-collapse: collapse;
  th {
    text-align: left;
    font-size: 0.68em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8995a8;
    padding: 7px 14px;
    border-bottom: 1px solid #eef1f6;
  }
  td { padding: 8px 14px; border-bottom: 1px solid #f2f4f8; }
  .col-field { width: 60%; font-size: 0.86em; color: #1F2A38; font-weight: 600; }
}
.schema-hint {
  display: flex;
  align-items: center;
  font-size: 0.78em;
  color: #6b7993;
  padding: 10px 14px;
}
.kind-chip {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 0.6em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--kind-color, #5b6c82);
}

.skeleton-row { transition: transform 0.08s; }
.skeleton-row-name {
  text-decoration: none;
  color: inherit;
  &:hover { color: var(--coral-deep); }
}

.label-chip-tiny {
  font-size: 0.72em;
  height: 20px;
  margin-right: 4px;
}

// ── Labels panel ─────────────────────────────────────────
.label-panel {
  background: #f6f8fb;
  border: 1px solid #e2e6ed;
  color: #2C3D4E;
}
.label-panel :deep(.text-dim) { color: #6b7993 !important; opacity: 1; }
.label-chip {
  height: 22px;
  font-size: 0.74em;
  background: #ffffff;
  border: 1px solid #c8d0dc;
  color: #2C3D4E;
}
.label-chip .chip-parent {
  color: #8995a8;
  margin-right: 4px;
  font-size: 0.92em;
}
.label-chip .chip-sep    { margin-left: 2px; }
.label-chip .chip-leaf   { color: #1F2A38; font-weight: 600; }

.label-chip.chip-post   { border-color: #b4d2e8; background: #e8f1f9; .chip-leaf { color: #2a5a87; } }
.label-chip.chip-doc    { border-color: #bfd9c3; background: #ecf6ee; .chip-leaf { color: #2e6a3a; } }

.open-as-post,
.view-as-post-top {
  text-decoration: none;
  color: var(--coral-deep);
  display: inline-flex;
  align-items: center;
  font-size: 0.82em;
  &:hover { text-decoration: underline; }
}

// "View as post" chip — embedded right-aligned in the identity zone.
.view-as-post-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 0.82em;
  padding: 3px 9px;
  border-radius: 12px;
  background: rgba(var(--coral-rgb), 0.10);
  border: 1px solid rgba(var(--coral-rgb), 0.30);
  color: var(--coral-deep);
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: rgba(var(--coral-rgb), 0.18); border-color: rgba(var(--coral-rgb), 0.55); }
}

// ══════════════════════════════════════════════════════════
// .subject-panel — merged container for the viewed skeleton.
// Same tokens and zone names as the post/node viewers so the
// three surfaces read as one family.
// ══════════════════════════════════════════════════════════
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
  min-width: 0;
  overflow: hidden;
  margin-bottom: 16px;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);

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
.subject-panel__title {
  font-size: 1.05em;
  color: var(--panel-ink-1);
  line-height: 1.25;
  word-break: break-word;
}
.subject-panel__chips {
  font-size: 0.78em;
  color: var(--panel-ink-2);
  .chip-fact {
    display: inline-flex;
    align-items: center;
    color: var(--panel-ink-2);
  }
}
.subject-panel__labels {
  border-top: 1px dashed rgba(var(--ink-rgb), 0.10);
  padding-top: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  :deep(.label-slider) { margin: 0; flex: 1 1 auto; min-width: 0; }
}

.subject-panel__body {
  background: var(--panel-body);
  min-width: 0;
}
.subject-panel__body--list .body-heading {
  font-size: 0.80em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--panel-ink-2);
  padding: 10px 14px 6px;
  display: flex;
  align-items: center;
}
.subject-panel__body--list .slot-list {
  background: var(--panel-body);
}

// ── Two-column layout: structure left, Usages right ─────
// CSS Grid avoids the col-12 + gap math problem that pushes the right
// column to wrap. 70 / 30 split; sticky on wide screens. Below md (768px)
// the grid collapses to a single column.
.skeleton-grid {
  display: grid;
  grid-template-columns: minmax(0, 70fr) minmax(0, 30fr);
  gap: 20px;
  align-items: start;
}
.skeleton-main { min-width: 0; }
.skeleton-side {
  min-width: 0;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

@media (max-width: 1023px) {
  .skeleton-grid { grid-template-columns: minmax(0, 1fr); }
  .skeleton-side {
    position: static;
    max-height: none;
  }
}

// ── Usages panel — scrollable, viewport-bounded ─────────
.usages-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background: #f9fafc;
  border: 1px solid #e2e6ed;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.18) transparent;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
}

.usage-row-link {
  display: block;
  text-decoration: none;
  color: inherit;
}
.usage-row {
  background: #ffffff;
  border: 1px solid #e2e6ed;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  margin-bottom: 8px;
  transition: transform 0.06s, box-shadow 0.10s;
  cursor: pointer;
  &:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(31, 42, 56, 0.06);
  }
}

.usage-title {
  font-size: 0.86em;
  color: #1F2A38;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.usage-id { font-size: 0.72em; color: #8995a8; flex-shrink: 0; }

.usage-meta {
  font-size: 0.72em;
  color: #6b7993;
  margin-top: 4px;
}
.usage-dot { margin: 0 6px; opacity: 0.6; }

.usage-excerpt {
  font-size: 0.78em;
  color: #2C3D4E;
  margin-top: 6px;
  line-height: 1.35;
  border-left: 2px solid #e2e6ed;
  padding-left: 8px;
  // Clamp to two lines max so rows stay scannable.
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.usage-chip {
  display: inline-block;
  font-size: 0.65em;
  padding: 2px 6px;
  background: #eef2f7;
  border: 1px solid #d0d8e3;
  border-radius: 10px;
  color: #2a5a87;
  white-space: nowrap;
}

// This page pads q-pa-md (16px top AND bottom, vs the other viewers'
// 16px-top-only) — shrink the access-denied frame accordingly so it
// still fits the viewport without scrolling.
.instance-view :deep(.octo-frame) {
  height: calc(100vh - 32px - var(--nav-footer-h, 48px));
}

.instance-view .section-heading {
  font-size: 0.85em;
  color: var(--ink-1);
  display: flex;
  align-items: center;
  margin: 0 0 8px;
  padding-left: 4px;
}

.slot-list { overflow: hidden; }

.dir-row {
  display: flex;
  align-items: center;
}
.dir-row-name {
  text-decoration: none;
  color: inherit;
  font-size: 0.92em;
  &:hover { color: var(--coral-deep); }
}

.child-row-link { display: block; text-decoration: none; }
.child-row {
  transition: transform 0.08s;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover { transform: translateX(2px); }
}

.version-row { display: flex; align-items: center; }
</style>
