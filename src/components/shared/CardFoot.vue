<template>
  <!-- THE CARD FOOT (2026-10-08, the card family) — the feed card's foot
       (`.post-square__foot`, 2026-08-10 → 2026-10-07), ruled in cells the
       way the cap is, for every kind:

         [lead acts] │ [kind chip  copy] │ [thread doors] │ [end tallies]

       · the CHIP is the element's stock nano pill in its EXTENDED state
         (the post card's PM3 rule: `● | [glyph] :: kind :: hash ⤢`) — a
         door to the element's window — with the COPY glyph beside it
         handing over the PATHCHAIN ADDRESS (never a browser URL; the
         check flips for 1600ms);
       · the THREAD DOORS are the two tallies as buttons — COMMENTS and
         FORKS, the chain's own counts (`GET /refs/comments|forks`) — lit
         (`is-on`, red-10) for the section a host shows; a kind whose
         schemas give it no such holder simply has no door (`supported:
         false` — the act is not offered rather than offered and refused);
       · the END cell is the kind's own tallies (a post's votes, a path's
         steps, a skeleton's keys, a moment's age).
       The three dials are the post foot's: `--foot-ctl` 16 / `--foot-pad`
       2px 8px / `--foot-gap` 6px — one 20px row. -->
  <div class="element-card__foot">
    <template v-if="shownLead.length">
      <div class="element-card__foot-lead">
        <button
          v-for="a in shownLead"
          :key="a.key"
          type="button"
          class="element-card__foot-act"
          :class="[{ 'is-on': !!a.on }, 'element-card__foot-act--' + a.key]"
          :title="a.title"
          :aria-label="a.title"
          @click.stop.prevent="a.onClick && a.onClick()"
        >
          <q-icon :name="a.icon" size="12px" />
        </button>
      </div>
      <span class="element-card__foot-rule" aria-hidden="true" />
    </template>

    <div class="element-card__foot-main">
      <slot name="chip">
        <MicroChip class="element-card__chip" :kind="kind" :id="id" :path="path" />
      </slot>
      <button
        v-if="copyValue"
        type="button"
        class="element-card__foot-act element-card__foot-act--copy"
        :class="{ 'is-on': copied }"
        :title="copied ? 'Address copied' : 'Copy the pathchain address'"
        @click.stop.prevent="copy"
      >
        <q-icon :name="copied ? 'check' : 'content_copy'" size="12px" />
      </button>
    </div>

    <template v-if="shownStats.length">
      <span class="element-card__foot-rule" aria-hidden="true" />
      <div class="element-card__foot-side">
        <component
          :is="s.door ? 'button' : 'span'"
          v-for="s in shownStats"
          :key="s.key"
          :type="s.door ? 'button' : null"
          class="element-card__stat"
          :class="[{ 'element-card__stat--door': s.door, 'is-on': !!s.on }, 'element-card__stat--' + s.key]"
          :title="s.title || null"
          @click.stop="s.door && $emit('stat', s.key)"
        >
          <q-icon :name="s.icon" size="11px" />{{ s.n ?? '·' }}
        </component>
      </div>
    </template>

    <template v-if="$slots.end">
      <span class="element-card__foot-rule" aria-hidden="true" />
      <div class="element-card__foot-end">
        <slot name="end" />
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import MicroChip from './MicroChip.vue'

export default defineComponent({
  name: 'CardFoot',
  components: { MicroChip },
  props: {
    kind: { type: String, required: true },
    id: { type: [Number, String], default: null },
    path: { type: String, default: '' },
    // What the copy glyph hands over; default = `path`.
    address: { type: String, default: '' },
    // [{ key, icon, title, on, onClick, hidden }] — the lead cell's acts.
    lead: { type: Array, default: () => [] },
    // [{ key, icon, n, title, door, on, hidden }] — the tallies.
    stats: { type: Array, default: () => [] }
  },
  emits: ['stat'],
  setup (props) {
    const shownLead = computed(() => props.lead.filter((a) => a && !a.hidden))
    const shownStats = computed(() => props.stats.filter((s) => s && !s.hidden))
    const copyValue = computed(() => props.address || props.path || '')
    const copied = ref(false)
    const copy = async () => {
      if (!copyValue.value) return
      try {
        await navigator.clipboard.writeText(copyValue.value)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (_) { /* clipboard denied — the glyph simply never flips */ }
    }
    return { shownLead, shownStats, copyValue, copied, copy }
  }
})
</script>

<style lang="scss" scoped>
// `.post-square__foot` and its cells, verbatim (the 2026-09-13 density pass).
.element-card__foot {
  --foot-ctl: 16px;
  --foot-pad: 2px 8px;
  --foot-gap: 6px;
  display: flex;
  align-items: stretch;
  min-width: 0;
  flex: 0 0 auto;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}
.element-card__foot-rule {
  flex: 0 0 1px;
  width: 1px;
  background: var(--grey-5, #bdbdbd);
}
.element-card__foot-lead {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
}
.element-card__foot-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
  overflow: hidden;
}
.element-card__foot-side,
.element-card__foot-end {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
}
.element-card__foot-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--foot-ctl);
  height: var(--foot-ctl);
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--grey-8, #424242);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: rgba(var(--ink-rgb), 0.08);
    color: var(--grey-9, #424242);
  }
  &.is-on { color: var(--accent, #c79a00); }
}
// THE CHIP at the tallies' size, its hash cut to 10ch (the full path is on
// its tooltip and one press away).
.element-card__chip {
  font-size: 0.66em;
  min-width: 0;
  :deep(.micro-chip__hash) { max-width: 10ch; }
}
.element-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: var(--foot-ctl, 16px);
  font-family: var(--font-display);
  letter-spacing: 0.02em;
  font-size: 0.66em;
  color: rgba(var(--ink-rgb), 0.55);
  flex-shrink: 0;
  white-space: nowrap;
}
.element-card__stat--door {
  border: 0;
  background: transparent;
  padding: 0 3px;
  margin: 0 -3px;
  border-radius: 3px;
  cursor: pointer;
  font: inherit;
  font-size: 0.66em;
  &:hover { color: rgba(var(--ink-rgb), 0.9); background: rgba(var(--ink-rgb), 0.06); }
  &.is-on { color: var(--red-10, #b71c1c); }
}
// The end cell's words wear the stat's type.
.element-card__foot-end :deep(.element-card__stat) { gap: 3px; }
</style>
