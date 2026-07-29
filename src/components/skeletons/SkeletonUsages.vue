<template>
  <!-- Tall right-hand section of the skeleton explorer — the mirror of
       LabelUsages. For the selected skeleton it shows what the skeleton IS
       (identity + owner + moment), what it HOLDS (the slot inventory as
       referential chips), and where it LEADS (structure view, instances). -->
  <div class="skeleton-usages pathos-card">
    <div class="skeleton-usages__head">
      <q-icon name="schema" size="16px" class="q-mr-sm text-accent" />
      <div class="col">
        <div class="nasalization text-accent" style="font-size:0.9em;">Structure</div>
        <div v-if="skeleton" class="skeleton-usages__sub">
          <span class="mono">{{ skeleton.name || ('skeleton #' + skeleton.id) }}</span>
        </div>
      </div>
      <router-link
        v-if="skeleton"
        :to="'/skeletons/' + skeleton.id"
        class="skeleton-usages__open"
        title="Open the full structure view"
      >
        open <q-icon name="north_east" size="11px" />
      </router-link>
    </div>

    <div v-if="!skeleton" class="skeleton-usages__empty">
      <q-icon name="touch_app" size="28px" style="opacity:.3;" />
      <div class="q-mt-sm">Select a skeleton to see what it holds.</div>
    </div>

    <div v-else-if="loading" class="text-center q-py-lg">
      <q-spinner color="primary" size="24px" />
    </div>

    <div v-else class="skeleton-usages__scroll">

      <!-- Identity -->
      <section class="skeleton-usages__group">
        <div class="skeleton-usages__group-head">
          <q-icon name="fingerprint" size="12px" style="color:#5b6c82;" />
          identity
        </div>
        <div class="usage-fact">
          <MicroChip kind="skeletons" :id="skeleton.id" :path="skeleton.path" :show-type="true" />
        </div>
        <div v-if="owner" class="usage-fact">
          <EntityInfo
            :id="owner.id"
            :primary="owner.display_name || owner.username || ('entity #' + owner.id)"
            :secondary="owner.username ? '@' + owner.username : ''"
          />
        </div>
        <div v-if="momentId" class="usage-fact">
          <MomentInfo :moment-id="momentId" :moment="momentObj" />
        </div>
        <div v-if="lineage" class="usage-fact usage-fact--muted">
          <q-icon name="device_hub" size="11px" class="q-mr-xs" />
          {{ lineage }}
        </div>
      </section>

      <!-- Slot inventory — every binding as a referential chip -->
      <section v-if="slots.length" class="skeleton-usages__group">
        <div class="skeleton-usages__group-head">
          <q-icon name="view_list" size="12px" style="color:#5b6c82;" />
          slots <span class="skeleton-usages__total">{{ slots.length }}</span>
        </div>
        <div v-for="s in slots" :key="s.slotName" class="slot-line">
          <span class="slot-line__key mono">{{ s.slotName }}</span>
          <InfoChip
            v-if="refOf(s)"
            :kind="refOf(s).prefix"
            :address="refOf(s).address"
            dense
          />
          <span v-else class="slot-line__empty">(unbound)</span>
        </div>
      </section>

      <!-- Labels -->
      <section v-if="labels.length" class="skeleton-usages__group">
        <div class="skeleton-usages__group-head">
          <q-icon name="label_important" size="12px" style="color:#00829c;" />
          labels <span class="skeleton-usages__total">{{ labels.length }}</span>
        </div>
        <div class="slot-line" style="flex-wrap:wrap; gap:4px;">
          <span
            v-for="l in labels"
            :key="l.id"
            class="usage-chip"
            :title="(l.chain || []).map(c => c.name).join(' > ')"
          >{{ l.name }}</span>
        </div>
      </section>

    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { skeletonService } from 'src/services/skeleton.service';
import { parseRef } from 'src/utils/kinds';

import MicroChip  from 'src/components/shared/MicroChip.vue';
import InfoChip   from 'src/components/shared/InfoChip.vue';
import MomentInfo from 'src/components/moments/MomentInfo.vue';
import EntityInfo from 'src/components/entities/EntityInfo.vue';

export default defineComponent({
  name: 'SkeletonUsages',
  components: { MicroChip, InfoChip, MomentInfo, EntityInfo },
  props: {
    // The selected skeleton row from the explorer squares (may be a raw
    // list row: { id, path, name, ancestor_id, owner_id, moment_id }).
    skeleton: { type: Object, default: null }
  },
  setup (props) {
    const loading = ref(false);
    const slots   = ref([]);
    const labels  = ref([]);
    const owner   = ref(null);

    const momentId  = computed(() => props.skeleton?.moment_id || null);
    const momentObj = computed(() =>
      props.skeleton?.moment_time_utc
        ? { id: props.skeleton.moment_id, time_utc: props.skeleton.moment_time_utc }
        : null);

    const lineage = computed(() => {
      const s = props.skeleton;
      if (!s) return '';
      if (s.ancestor_id == null || s.ancestor_id === s.id) return 'origin / template';
      return `instantiated from #${s.ancestor_id}`;
    });

    const refOf = (s) => parseRef(s.ref || '');

    const load = async () => {
      slots.value = [];
      labels.value = [];
      owner.value = null;
      if (!props.skeleton?.id) return;
      loading.value = true;
      try {
        const [walkR, labelsR] = await Promise.all([
          skeletonService.walk(props.skeleton.id),
          skeletonService.labels(props.skeleton.id).catch(() => ({ labels: [] }))
        ]);
        if (walkR.success) slots.value = walkR.slots || [];
        labels.value = labelsR.labels || [];

        // Owner through the AUTHOR slot when bound, else leave the raw id.
        const authorSlot = slots.value.find(x => x.slotName === 'AUTHOR');
        if (authorSlot?.ref) {
          const r = await skeletonService.resolveRef(authorSlot.ref).catch(() => null);
          if (r?.success) owner.value = r.row;
        }
        if (!owner.value && props.skeleton.owner_id) {
          owner.value = { id: props.skeleton.owner_id };
        }
      } catch (_) { /* leave empty */ }
      loading.value = false;
    };

    onMounted(load);
    watch(() => props.skeleton?.id, load);

    return { loading, slots, labels, owner, momentId, momentObj, lineage, refOf };
  }
});
</script>

<style lang="scss" scoped>
.skeleton-usages {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  max-height: calc(100vh - 140px);
  padding: 12px;
}

.skeleton-usages__head {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.1);
  margin-bottom: 8px;
}
.skeleton-usages__sub {
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.55);
}
.skeleton-usages__open {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.74em;
  color: #5b6c82;
  text-decoration: none;
  border-bottom: 1px dotted #5b6c82;
  &:hover { color: var(--coral-deep); border-bottom-color: var(--coral-deep); }
}

.skeleton-usages__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(var(--ink-rgb), 0.5);
  font-size: 0.82em;
  text-align: center;
  padding: 24px 12px;
}

.skeleton-usages__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.skeleton-usages__group { margin-bottom: 14px; }
.skeleton-usages__group-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.55);
  margin-bottom: 6px;
}
.skeleton-usages__total {
  font-family: 'Space Mono', monospace;
  font-size: 0.9em;
  color: rgba(var(--ink-rgb), 0.45);
}

.usage-fact {
  margin-bottom: 5px;
  &.usage-fact--muted {
    font-size: 0.76em;
    color: rgba(var(--ink-rgb), 0.55);
    display: flex;
    align-items: center;
  }
}

.slot-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  .slot-line__key {
    flex: 0 0 130px;
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink-rgb), 0.55);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .slot-line__empty {
    font-size: 0.76em;
    font-style: italic;
    color: rgba(var(--ink-rgb), 0.4);
  }
}

.usage-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.2);
  border-radius: 9px;
  font-size: 0.7em;
  color: rgba(var(--ink-rgb), 0.7);
  background: rgba(var(--ink-rgb), 0.04);
}
</style>
