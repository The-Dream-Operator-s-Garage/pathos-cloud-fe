<template>
  <!-- Compact preview panel for a SKELETON (schema or populated instance).
       Same MiniPanel chrome/size as NodeMini; the body summarizes the
       skeleton's keys and their populated values: bound NOTE text renders
       inline, other bound refs render as dense InfoChips, unbound fields
       show their ACCEPTS hint (so a schema reads as its field inventory).
       Self-resolving: give it a skeleton `id` OR a 'skeletons/<hash>'
       address — one GET /skeletons/:id/walk paints the whole panel.
       Dispatched by ElementMini for non-POST skeleton refs, so post
       viewers' [[pathos:skeletons/…]] chips bloom into this. -->
  <div v-if="loading" class="skeleton-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="address" :label="name" />

  <!-- GITHUB_PR instances bloom into the native PR card instead of the
       generic field table (open-source dev flow, 2026-08-01) — so a
       ![[pathos:skeletons/…]] block ref in a PR post's body IS the embed. -->
  <GithubPrCard v-else-if="isGithubPr" :slots="slots" />

  <MiniPanel v-else :to="targetRoute">
    <template #title>
      <q-icon :name="skeletonKind.icon" size="13px" class="q-mr-xs skeleton-mini__icon" />
      {{ headline }}
    </template>

    <template #chips>
      <span v-if="walk.is_schema" class="skeleton-mini__schema-badge">SCHEMA</span>
      <span v-else-if="walk.schema" class="mini-chip-fact" :title="'instance of schema #' + walk.schema.id">
        <q-icon name="schema" size="11px" class="q-mr-xs" />
        instance of {{ walk.schema.name || ('#' + walk.schema.id) }}
      </span>
    </template>

    <template #hash>
      <span class="skeleton-mini__hash mono">skeletons/{{ shortHash(walk.path, 12) }}</span>
    </template>

    <template #body>
      <div v-if="!rows.length" class="skeleton-mini__none">(no fields)</div>
      <div v-for="row in rows" :key="row.slotName" class="skeleton-mini__row">
        <span class="skeleton-mini__key">{{ row.slotName }}</span>
        <span class="skeleton-mini__val">
          <span v-if="row.textValue" class="skeleton-mini__text">{{ row.textValue }}</span>
          <InfoChip v-else-if="row.ref" dense :kind="row.refKind || 'unknown'" :address="row.ref" />
          <span v-else class="skeleton-mini__empty">
            {{ row.expectedKind ? 'accepts ' + row.expectedKind : '(empty)' }}
          </span>
        </span>
      </div>
    </template>

    <template #foot>
      <span>{{ boundCount }}/{{ rows.length }} fields populated</span>
      <q-space />
      <span class="mini-open">open <q-icon name="open_in_new" size="11px" /></span>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import GithubPrCard from 'src/components/dev/GithubPrCard.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { kindFor, shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'SkeletonMini',
  components: { MiniPanel, InfoChip, GithubPrCard },
  props: {
    // Skeleton id — walks directly.
    id: { type: [Number, String], default: null },
    // 'skeletons/<hash>' reference — resolved to an id via /refs/summary
    // first, so the component is drop-in usable wherever only the address
    // is known.
    address: { type: String, default: '' },
    // Optional headline override (e.g. the [[pathos:…|label]] text);
    // also labels the InfoChip fallback when resolution fails.
    name: { type: String, default: '' }
  },
  // What the walk resolved ({ id, name, path }) — hosts that frame this
  // panel (SkeletonFlyout) title themselves after it (2026-07-31).
  emits: ['resolved'],
  setup (props, { emit }) {
    const loading = ref(false)
    const failed = ref(false)
    const walk = ref({})
    const slots = ref([])

    const skeletonKind = kindFor('skeletons')

    const load = async () => {
      loading.value = true
      failed.value = false
      try {
        let id = props.id
        if (id == null && props.address) {
          const s = await refService.summary(props.address)
          id = s.success ? s.summary?.id : null
        }
        if (id == null) throw new Error('unresolvable')
        const r = await skeletonService.walk(id)
        if (!r.success) throw new Error('walk failed')
        walk.value = r.skeleton
        slots.value = r.slots || []
        emit('resolved', { id: r.skeleton.id, name: r.skeleton.name, path: r.skeleton.path })
      } catch (_) {
        failed.value = true
        walk.value = {}
        slots.value = []
      }
      loading.value = false
    }

    onMounted(load)
    watch(() => [props.id, props.address], load)

    const headline = computed(() =>
      props.name || walk.value.name || ('Skeleton #' + walk.value.id)
    )

    const targetRoute = computed(() =>
      walk.value.id != null ? `/skeletons/${walk.value.id}` : null
    )

    // Populated fields first, declaration order preserved within each group.
    const rows = computed(() => {
      const bound = slots.value.filter(s => s.ref)
      const empty = slots.value.filter(s => !s.ref)
      return [...bound, ...empty]
    })

    const boundCount = computed(() => slots.value.filter(s => s.ref).length)

    // GITHUB_PR instances (never the schema head itself) wear the PR card.
    const isGithubPr = computed(() =>
      walk.value.name === 'GITHUB_PR' && !walk.value.is_schema
    )

    return { loading, failed, walk, slots, skeletonKind, headline, targetRoute, rows, boundCount, isGithubPr, shortHash }
  }
})
</script>

<style lang="scss" scoped>
.skeleton-mini__loading {
  padding: 6px 0;
}

.skeleton-mini__icon { color: var(--ink); vertical-align: middle; }

.skeleton-mini__schema-badge {
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(0, 130, 156, 0.10);
  border: 1px solid rgba(0, 130, 156, 0.35);
  color: #00687d;
  font-size: 0.92em;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.skeleton-mini__hash {
  font-size: 0.72em;
  color: #8995a8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skeleton-mini__row {
  display: grid;
  grid-template-columns: minmax(72px, 34%) 1fr;
  gap: 8px;
  align-items: start;
  padding: 2px 0;

  & + & { border-top: 1px dashed rgba(var(--ink-rgb), 0.06); }
}

.skeleton-mini__key {
  font-size: 0.72em;
  line-height: 1.9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5b6c82;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skeleton-mini__val {
  min-width: 0;
  font-size: 0.84em;
  color: #2C3D4E;
  word-break: break-word;
}

.skeleton-mini__text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
}

.skeleton-mini__empty {
  font-size: 0.9em;
  font-style: italic;
  color: #8995a8;
}

.skeleton-mini__none {
  font-size: 0.78em;
  color: #8995a8;
  font-style: italic;
}

.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}

.mini-open {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #5b6c82;
  font-size: 0.92em;
}
</style>
