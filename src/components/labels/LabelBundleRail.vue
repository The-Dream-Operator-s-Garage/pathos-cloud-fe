<template>
  <!-- THE LABEL SECTION (2026-10-14, user ask: "those labels … must be
       contained inside a mini section with talavero's profile pic on the
       left. just like the ones inside the verified section belong to the
       origin, those newly added labels must be grouped by author … extend
       this kind of grouping to all label sections"). CardByline's plate
       grammar lifted into ONE component every label section mounts: a
       plate per origin — the platform's vocabulary under `verified`, every
       other label under the FACE of whoever attached it (the owner, or a
       delegate: Talavero, a label owner, an org) — grouping by
       utils/labelBundles.js. `wrap` lets the plates flow onto more lines
       (pages, panels); the card's one-row rail scrolls instead. -->
  <div v-if="bundles.length" class="label-rail" :class="{ 'is-wrap': wrap }">
    <div
      v-for="b in bundles"
      :key="b.key"
      class="element-card__bundle"
      :class="[b.platform ? 'is-platform' : 'is-entity', { 'is-by': b.by }]"
    >
      <span
        class="element-card__bundle-root"
        :title="bundleOrigin(b)"
        :role="b.platform ? 'img' : undefined"
        :aria-label="b.platform ? bundleOrigin(b) : undefined"
      >
        <q-icon v-if="b.platform" name="verified" size="12px" class="element-card__bundle-verified" />
        <span v-else-if="b.owner && inert" class="element-card__bundle-face">
          <EntityAvatar :entity="b.owner" :size="12" />
        </span>
        <a
          v-else-if="b.owner"
          :href="'#/entities/' + b.owner.id"
          class="element-card__bundle-face"
          :aria-label="bundleOrigin(b) + ' — open profile'"
          @click.stop
        >
          <EntityAvatar :entity="b.owner" :size="12" />
        </a>
        <span v-else class="mono">{{ b.root }}</span>
      </span>
      <span v-for="lp in b.items" :key="lp.id" class="element-card__bundle-item">
        <component
          :is="inert ? 'span' : 'router-link'"
          :to="inert ? undefined : '/labels/' + lp.id"
          class="element-card__label mono"
          :title="lp.path"
          @click="(e) => { if (!inert) e.stopPropagation() }"
        >
          <q-icon name="label" size="10px" class="element-card__label-glyph" />
          <span
            v-for="(name, i) in lp.names"
            :key="i"
            class="element-card__label-step"
            :class="{ 'is-leaf': i === lp.names.length - 1 }"
          >{{ name }}</span>
        </component>
      </span>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import { labelBundles, bundleOrigin } from 'src/utils/labelBundles'

export default defineComponent({
  name: 'LabelBundleRail',
  components: { EntityAvatar },
  props: {
    // API label rows: { id, name, chain?, system_label?, owner?, added_by? }
    labels: { type: Array, default: () => [] },
    wrap: { type: Boolean, default: false },
    // No links (the rail sits inside a clickable row — a <button> can't
    // hold anchors): faces and labels draw, the row keeps the click.
    inert: { type: Boolean, default: false }
  },
  setup (props) {
    const bundles = computed(() => labelBundles(props.labels))
    return { bundles, bundleOrigin: (b) => bundleOrigin(b) }
  }
})
</script>

<style lang="scss" scoped>
.label-rail {
  display: contents;
  &.is-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
}
.element-card__bundle {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  // The plate IS its host's row (2026-10-17): a card byline's `--row-h`
  // (20, the post card's since 2026-10-16), 16 where no row is declared.
  height: var(--row-h, 16px);
  box-sizing: border-box;
  padding: 0 3px;
  border: 1px solid var(--grey-5, #bdbdbd);
  box-shadow: none;
  border-radius: 5px;
  overflow: hidden;
  background: var(--identity-coat, var(--grey-3, #eeeeee));
  &:hover { border-color: var(--grey-7, #757575); }
}
.is-wrap .element-card__bundle { max-width: 100%; }
.element-card__bundle:hover .element-card__bundle-verified { color: var(--entity-ink, #263238); }
.element-card__bundle-root {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: -1px;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--red-9, #c62828);
}
.element-card__bundle-verified {
  flex: 0 0 auto;
  color: var(--entity-accent, #546e7a);
}
.element-card__bundle-face {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  line-height: 0;
  text-decoration: none;
  color: inherit;
}
.element-card__bundle-item {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0 3px;
  height: calc(var(--row-h, 16px) - 4px); // the member steps 2px in a side
  box-sizing: border-box;
  line-height: 1;
  border: 0.5px solid var(--grey-5, #bdbdbd);
  box-shadow: none;
  border-radius: 3px;
  background: var(--light-cream, #fcf3e0);
}
.element-card__label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-decoration: none;
  color: var(--red-9, #c62828);
  line-height: 1;
  &:hover { color: var(--red-10, #b71c1c); }
}
.element-card__label-step {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  & + &::before {
    content: '›';
    margin: 0 4px;
    opacity: 0.55;
  }
  &.is-leaf {
    font-weight: 700;
    color: var(--red-10, #b71c1c);
  }
}
.element-card__label-glyph {
  flex: 0 0 auto;
  margin-right: 2px;
}
</style>
