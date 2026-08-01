<template>
  <!-- The native face of a GITHUB_PR instance (open-source dev flow,
       2026-08-01). GitHub sends X-Frame-Options: DENY on every page, so a
       pull request can never render in an EmbedFrame — this card IS the
       embed: drawn from the record's own slots (walk textValues), one
       outbound link, no iframe, no fetch. Hosts hand it the walk's slot
       rows; SkeletonMini and SkeletonPage both delegate here when the
       instance's schema name is GITHUB_PR. -->
  <component
    :is="url ? 'a' : 'div'"
    class="github-pr-card"
    :href="url || undefined"
    :target="url ? '_blank' : undefined"
    :rel="url ? 'noopener' : undefined"
    @click.stop
  >
    <div class="github-pr-card__head">
      <q-icon name="call_merge" size="15px" class="github-pr-card__merge-icon" />
      <span class="github-pr-card__repo mono">{{ repo || 'unknown repo' }}</span>
      <span v-if="number" class="github-pr-card__number mono">#{{ number }}</span>
      <q-space />
      <span class="github-pr-card__pill" :class="'is-' + (state || 'merged')">
        {{ (state || 'merged').toUpperCase() }}
      </span>
    </div>

    <div class="github-pr-card__title">{{ title || '(untitled pull request)' }}</div>

    <div class="github-pr-card__facts">
      <span v-if="author" class="github-pr-card__fact">
        <q-icon name="person" size="12px" /> {{ author }}
      </span>
      <span v-if="base" class="github-pr-card__fact mono">
        <q-icon name="account_tree" size="12px" /> → {{ base }}
      </span>
      <span v-if="additions != null || deletions != null" class="github-pr-card__fact mono">
        <span class="github-pr-card__plus">+{{ additions ?? 0 }}</span>
        <span class="github-pr-card__minus">−{{ deletions ?? 0 }}</span>
      </span>
      <span v-if="url" class="github-pr-card__fact github-pr-card__out">
        <q-icon name="open_in_new" size="12px" /> GitHub
      </span>
    </div>
  </component>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'GithubPrCard',
  props: {
    // The walk's slot rows for a GITHUB_PR instance
    // ([{ slotName, textValue, ref, … }]) — the card reads, never fetches.
    slots: { type: Array, default: () => [] }
  },
  setup (props) {
    const val = (name) => {
      const row = props.slots.find(s => s.slotName === name)
      return row?.textValue?.trim() || null
    }
    const repo = computed(() => val('REPO'))
    const number = computed(() => val('NUMBER'))
    const title = computed(() => val('PR_TITLE'))
    const state = computed(() => (val('STATE') || 'merged').toLowerCase())
    const author = computed(() => val('PR_AUTHOR'))
    const base = computed(() => val('BASE_BRANCH'))
    const additions = computed(() => val('ADDITIONS'))
    const deletions = computed(() => val('DELETIONS'))
    // The PR's address is derivable from repo + number — the URL slot binds
    // the LINK element for provenance, but walks only inline NOTE text.
    const url = computed(() =>
      repo.value && number.value
        ? `https://github.com/${repo.value}/pull/${number.value}`
        : null
    )
    return { repo, number, title, state, author, base, additions, deletions, url }
  }
})
</script>

<style lang="scss" scoped>
// GitHub's merge purple on the pill; everything else stays the platform's
// flat-plaque language (grey-1 floor, hairline rim, no shadow).
.github-pr-card {
  display: block;
  text-decoration: none;
  color: var(--ink, #2c3d4e);
  background: var(--grey-1, #fafafa);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-bottom-width: 2px;
  border-radius: 7px;
  padding: 8px 10px;
  cursor: pointer;

  &:hover { border-color: rgba(130, 80, 223, 0.45); }
}

.github-pr-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.github-pr-card__merge-icon { color: #8250df; }

.github-pr-card__repo {
  font-size: 0.72em;
  color: #5b6c82;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.github-pr-card__number {
  font-size: 0.72em;
  font-weight: 700;
  color: #2c3d4e;
}

.github-pr-card__pill {
  flex: 0 0 auto;
  font-size: 0.6em;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  background: #8250df; // merged — GitHub's own purple

  &.is-closed { background: #cf222e; }
  &.is-open { background: #1a7f37; }
}

.github-pr-card__title {
  font-weight: 700;
  font-size: 0.92em;
  line-height: 1.35;
  margin: 5px 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.github-pr-card__facts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.github-pr-card__fact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72em;
  color: #5b6c82;
}

.github-pr-card__plus { color: #1a7f37; font-weight: 700; }
.github-pr-card__minus { color: #cf222e; font-weight: 700; margin-left: 4px; }

.github-pr-card__out { margin-left: auto; color: #8250df; }
</style>
