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
  <!-- ⭐ 2026-11-04 — THE VOTES RIDE THE FOOT (user ask: "attach the voting
       section on the footer of the family … thumbs up and down"): a mini
       that names its votable element (`vote-id`) draws `MiniVotes` at the
       line's right end — ONLY under a `MiniVotesScope` (utils/miniVotes.js:
       the side viewer's thread + references lanes), so every other surface
       keeps the plain line. The facts stay centred in what is left. -->
  <span class="mini-foot" :class="{ 'has-votes': showVotes }">
    <span class="mini-foot__facts" :title="title || plainTitle">
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
    <MiniVotes v-if="showVotes" :id="voteId" :votes="votes" class="mini-foot__votes" />
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { kindFor } from 'src/utils/kinds'
import { useMiniVotes } from 'src/utils/miniVotes'
import MiniVotes from 'src/components/shared/MiniVotes.vue'

export default defineComponent({
  name: 'MiniFoot',
  components: { MiniVotes },
  props: {
    // The kind whose glyph leads the line (kinds.js) — or `icon` outright.
    kind: { type: String, default: '' },
    icon: { type: String, default: '' },
    facts: { type: Array, default: () => [] },
    title: { type: String, default: '' },
    // The votable element (a skeleton's row id) — drawn only in a votes scope.
    voteId: { type: [Number, String], default: null },
    votes: { type: Object, default: null }
  },
  setup (props) {
    const votesOn = useMiniVotes()
    const showVotes = computed(() => !!votesOn && props.voteId != null)
    const glyph = computed(() => props.icon || (props.kind ? kindFor(props.kind).icon : ''))
    const shown = computed(() => (props.facts || [])
      .map((f) => (typeof f === 'string' ? { text: f } : f))
      .filter((f) => f && f.text != null && String(f.text).trim() !== ''))
    const plainTitle = computed(() => shown.value.map((f) => f.text).join(' · '))
    return { glyph, shown, plainTitle, showVotes }
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
.mini-foot__facts {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
}
.mini-foot__votes { margin-left: auto; }
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
