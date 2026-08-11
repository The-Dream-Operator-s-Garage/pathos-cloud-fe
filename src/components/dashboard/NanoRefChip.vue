<template>
  <!-- THE NANO TIER (dashboards phase 7, 2026-08-11; the NanoLabelSlider
       naming precedent) — the smallest reference form there is: a dropped
       element waiting beside the agent input. Deliberately INERT until
       send — no resolution, no routing, no fetch; on send its ref joins
       the ask's body AND its shareRefs, and only then does it mean
       anything. A chip that did less would be text; one that did more
       would be a MicroChip. -->
  <span class="nano-ref" :title="address">
    <q-icon :name="icon" size="9px" class="nano-ref__glyph" />
    <span class="nano-ref__hash mono">{{ short }}</span>
    <button type="button" class="nano-ref__x" title="Remove" @click.stop.prevent="$emit('remove')">
      <q-icon name="close" size="8px" />
    </button>
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor, shortHash } from 'src/utils/kinds'

export default defineComponent({
  name: 'NanoRefChip',
  props: {
    // '<kind>/<hash>'
    address: { type: String, required: true }
  },
  emits: ['remove'],
  setup (props) {
    const icon = computed(() => kindFor(String(props.address).split('/')[0]).icon)
    const short = computed(() => shortHash(props.address, 8))
    return { icon, short }
  }
})
</script>

<style lang="scss" scoped>
.nano-ref {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 16px;
  padding: 0 4px;
  border: 1px solid var(--dock-rule-strong, var(--grey-5));
  border-radius: var(--radius-pill);
  background: #fff;
  font-size: 0.62em;
  color: var(--dock-ink, var(--brown-8));
}

.nano-ref__glyph { color: var(--dock-ink-mute, var(--brown-4)); }

.nano-ref__hash { letter-spacing: 0.02em; }

.nano-ref__x {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--dock-ink-mute, var(--brown-4));
  cursor: pointer;

  &:hover { color: var(--coral-deep, #c05a4e); }
}
</style>
