<template>
  <!-- The locked tier of the chip family — what a viewer sees in place of
       an element they have no access to. The hashname stays visible (a
       micro-style chip) surrounded by the lock bubble; clicking opens the
       request-permission panel. Used by ElementMini (block embeds) and
       anywhere a locked ref needs more presence than an InfoChip. -->
  <button type="button" class="locked-chip" :class="['kind-' + meta.kind]" :title="address">
    <span class="locked-chip__bubble">
      <q-icon name="lock" size="11px" />
    </span>
    <q-icon :name="meta.icon" size="13px" class="locked-chip__kind-icon" />
    <span class="locked-chip__type">{{ meta.kind }}</span>
    <span class="locked-chip__hash mono">{{ shortHash }}</span>

    <q-menu anchor="bottom left" self="top left" :offset="[0, 4]">
      <RequestAccessPanel :address="address" />
    </q-menu>
  </button>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor } from 'src/utils/kinds'
import RequestAccessPanel from './RequestAccessPanel.vue'

export default defineComponent({
  name: 'LockedChip',
  components: { RequestAccessPanel },
  props: {
    // '<kind>/<hash>' of the locked element.
    address: { type: String, required: true }
  },
  setup (props) {
    const parts = computed(() => {
      const p = (props.address || '').split('/').filter(Boolean)
      return { kind: p[p.length - 2] || 'unknown', hash: p[p.length - 1] || '' }
    })
    const meta = computed(() => kindFor(parts.value.kind))
    const shortHash = computed(() =>
      parts.value.hash ? parts.value.hash.slice(0, 10) + '…' : '')
    return { meta, shortHash }
  }
})
</script>

<style lang="scss" scoped>
.locked-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 22px;
  border-radius: 6px;
  border: 1px dashed rgba(var(--ink-rgb), 0.35);
  background: rgba(var(--ink-rgb), 0.05);
  color: rgba(var(--ink-rgb), 0.6);
  font-family: inherit;
  font-size: 0.8em;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: rgba(var(--ink-rgb), 0.1);
    border-color: rgba(var(--ink-rgb), 0.5);
  }
}

// The lock bubble "surrounding" the item — anchored on the chip's edge.
.locked-chip__bubble {
  position: absolute;
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--paper-card, #ffffff);
  border: 1px solid rgba(#a06070, 0.55);
  color: #a06070;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}

.locked-chip__kind-icon { opacity: 0.55; }
.locked-chip__type {
  font-size: 0.82em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.locked-chip__hash { font-size: 0.86em; }
</style>
