<template>
  <!-- THE MINI FOOT (2026-09-30) — the family's provenance line, lifted from
       SkeletonMini's (`schema · 4 keys · by allegue · locked`) and PathMini's
       (`43 steps · by claude · 43 paths`): ONE centred line in the band
       MiniPanel draws, the kind's glyph first (in the pill's glyph tone),
       then the facts divided by dimmed `·`, each cut by its own ellipsis
       before the line ever wraps. What a preview says about an element it
       says HERE — who made it, when, what it holds — so the head can stay
       `what it is │ what it is called` and the body can be the thing itself.
       A fact is a string, or `{ text, mono, warn, title }`; empty ones drop. -->
  <span class="mini-foot" :title="title || plainTitle">
    <q-icon v-if="glyph" :name="glyph" size="10px" class="mini-foot__glyph" />
    <template v-for="(f, i) in shown" :key="i">
      <span v-if="i > 0 || glyph" class="mini-foot__dot">·</span>
      <span
        class="mini-foot__fact"
        :class="{ mono: f.mono, 'is-warn': f.warn }"
        :title="f.title || null"
      >{{ f.text }}</span>
    </template>
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor } from 'src/utils/kinds'

export default defineComponent({
  name: 'MiniFoot',
  props: {
    // The kind whose glyph leads the line (kinds.js) — or `icon` outright.
    kind: { type: String, default: '' },
    icon: { type: String, default: '' },
    facts: { type: Array, default: () => [] },
    title: { type: String, default: '' }
  },
  setup (props) {
    const glyph = computed(() => props.icon || (props.kind ? kindFor(props.kind).icon : ''))
    const shown = computed(() => (props.facts || [])
      .map((f) => (typeof f === 'string' ? { text: f } : f))
      .filter((f) => f && f.text != null && String(f.text).trim() !== ''))
    const plainTitle = computed(() => shown.value.map((f) => f.text).join(' · '))
    return { glyph, shown, plainTitle }
  }
})
</script>

<style lang="scss" scoped>
// SkeletonMini's foot line, verbatim metrics (the family's reference foot):
// the band is MiniPanel's `.mini-panel__foot`; this line fills it, centred.
.mini-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.7em;
  color: var(--mini-ink, var(--panel-ink-2, #5b6c82));
}
// The kind's glyph in the pill's glyph tone — the one mark of hue on the line.
.mini-foot__glyph {
  flex: 0 0 auto;
  color: var(--mini-accent, currentColor);
}
.mini-foot__dot { flex: 0 0 auto; opacity: 0.5; }
.mini-foot__fact {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  &.is-warn { color: #a03d3d; }
}
</style>
