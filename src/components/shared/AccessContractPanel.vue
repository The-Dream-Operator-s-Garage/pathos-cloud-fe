<template>
  <!-- The element-viewer face of the channel contract (Thread K): the
       owner's standing who-can-read panel, derived from the element's
       grant ledger (accessService.status entries — element_access mirror
       + the on-chain ACCESS path), never prose. Renders ONLY for the
       owner of a gated element; every row is a recorded grant with its
       moment, its granter, and a revoke that rewrites the present (the
       chain keeps the history — the history chip links to it). -->
  <div v-if="visible" class="access-contract">
    <div class="access-contract__head">
      <q-icon name="policy" size="13px" />
      <span>who can read this</span>
      <q-icon
        v-if="data.public"
        name="public" size="12px"
        class="access-contract__globe"
        title="public — the world is on the path"
      />
      <router-link
        v-if="data.access_path_id"
        :to="`/paths/${data.access_path_id}`"
        class="access-contract__history"
        title="grant history — the on-chain ACCESS path"
      ><q-icon name="history" size="12px" /></router-link>
    </div>

    <div v-if="data.entries.length" class="access-contract__rows">
      <div
        v-for="e in data.entries"
        :key="e.entity_id"
        class="access-contract__row"
      >
        <q-icon :name="e.public ? 'public' : 'person'" size="12px" />
        <span class="access-contract__who">{{ e.public ? 'the world' : (e.username || `#${e.entity_id}`) }}</span>
        <span class="access-contract__when" :title="e.moment ? e.moment.human : ''">
          <template v-if="e.granted_by_username">by {{ e.granted_by_username }}</template>
          <template v-if="e.moment"> · {{ e.moment.human }}</template>
        </span>
        <q-btn
          flat dense size="xs" icon="close" no-caps
          class="access-contract__revoke"
          :loading="revoking === e.entity_id"
          :title="e.public ? 'Unpublish — take the world off the path' : `Revoke ${e.username || 'this grant'}`"
          @click="revoke(e)"
        />
      </div>
    </div>
    <div v-else class="access-contract__hint">
      Only you — no grants recorded on this element.
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { accessService } from 'src/services/access.service'

export default defineComponent({
  name: 'AccessContractPanel',
  props: {
    // '<kind>/<hash>' of the element.
    address: { type: String, required: true }
  },
  emits: ['changed'],

  setup (props, { emit }) {
    const data = ref(null)
    const revoking = ref(null)

    const load = async () => {
      data.value = null
      if (!props.address || !props.address.includes('/')) return
      try {
        const r = await accessService.status(props.address)
        if (r.success) data.value = r
      } catch (_) { /* not the owner's element — the panel stays away */ }
    }

    watch(() => props.address, load, { immediate: true })

    // The panel is the OWNER's contract: gated element + canManage.
    const visible = computed(() => !!(data.value && data.value.gated && data.value.canManage))

    const revoke = async (entry) => {
      if (revoking.value) return
      revoking.value = entry.entity_id
      try {
        const r = await accessService.revoke(props.address, entry.entity_id)
        if (r.success) {
          await load()
          emit('changed')
        }
      } catch (_) { /* the row stays — nothing changed */ }
      revoking.value = null
    }

    return { data, visible, revoking, revoke }
  }
})
</script>

<style lang="scss" scoped>
.access-contract {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 7px;
  background: rgba(#00829c, 0.04);
}

.access-contract__head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.75;
  .q-icon { color: #00829c; }
}
.access-contract__globe { color: #0b7a8a; }
.access-contract__history {
  margin-left: auto;
  display: inline-flex;
  color: var(--ink-mute, #8995a8);
  &:hover { color: #00829c; }
}

.access-contract__rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.access-contract__row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74em;
  .q-icon { color: #9b6cb0; }
}
.access-contract__who { font-weight: 700; }
.access-contract__when {
  color: var(--ink-mute, #8995a8);
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.access-contract__revoke {
  margin-left: auto;
  color: var(--ink-mute, #8995a8);
  &:hover { color: #a5121f; }
}

.access-contract__hint {
  font-size: 0.72em;
  color: var(--ink-mute, #8995a8);
}
</style>
