<template>
  <!-- Connector rendered between two PostMini cards in a path viewer.
       Shows the pathchain link's own cryptographic witness — the link's
       hash + (optional) prev/next refs. The link target hash itself is
       NOT shown here because both the previous and next PostMini cards
       already surface their `post/<hash>` chips; the connector's job is
       to expose the BOND between them, not the endpoints.

       Hyperlink behaviour: any rendered hash whose kind is `node`,
       `post`, or `path` is a router-link to that primitive's viewer.
       Generic `links/<hash>` has no dedicated viewer so it renders as
       a non-clickable mono chip. -->
  <div class="path-link-connector" :class="{ 'has-bond': !!link?.path }">

    <!-- Spine — a vertical rule with a diamond pip mid-line. The pip is
         the visual anchor for the bond's hash chip(s). -->
    <div class="connector-spine">
      <div class="connector-line connector-line--top" />
      <div class="connector-pip" :title="link?.path || ''">
        <q-icon name="link" size="10px" />
      </div>
      <div class="connector-line connector-line--bottom" />
    </div>

    <!-- Hash row. The link's own hash always shows; prev/next render
         when present so the user can verify the chain bidirectionally. -->
    <div class="connector-meta">
      <span class="connector-label">link</span>
      <span v-if="link?.path" class="mono connector-hash" :title="link.path">
        {{ shortPath(link.path) }}
      </span>
      <span v-else class="mono connector-hash connector-hash--missing">
        (unbonded)
      </span>

      <template v-if="link?.prev_path">
        <span class="connector-sep">←</span>
        <HashLink
          :path="link.prev_path"
          :show-icon="true"
          :truncate="10"
        />
      </template>
      <template v-if="link?.next_path">
        <span class="connector-sep">→</span>
        <HashLink
          :path="link.next_path"
          :show-icon="true"
          :truncate="10"
        />
      </template>
    </div>

  </div>
</template>

<script>
import { defineComponent } from 'vue'
import HashLink from 'src/components/shared/HashLink.vue'

export default defineComponent({
  name: 'PathLinkConnector',
  components: { HashLink },
  props: {
    // Link row from pathService.walkPathRow, shape:
    //   { id, path, prev_path, next_path, target_type, target_id,
    //     moment_id, created_at }
    link: { type: Object, default: null }
  },
  setup () {
    const shortPath = (p) => {
      if (!p) return ''
      const [kind, hash] = p.split('/')
      if (!hash) return p
      return `${kind}/${hash.slice(0, 12)}${hash.length > 12 ? '…' : ''}`
    }
    return { shortPath }
  }
})
</script>

<style lang="scss" scoped>
.path-link-connector {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0 6px;
  min-height: 38px;
}

// Vertical spine column — line above, diamond pip, line below. The pip
// sits centered horizontally over the same axis used by the mini cards'
// hash chips so the whole column reads as one continuous chain.
.connector-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 22px;
  flex-shrink: 0;
}

.connector-line {
  width: 2px;
  background: linear-gradient(
    to bottom,
    rgba(var(--ink-rgb), 0.35) 0%,
    rgba(var(--ink-rgb), 0.12) 100%
  );
}
.connector-line--top    { flex: 1 1 auto; min-height: 6px; }
.connector-line--bottom { flex: 1 1 auto; min-height: 6px; }

.connector-pip {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1.5px solid rgba(var(--ink-rgb), 0.40);
  color: rgba(var(--ink-rgb), 0.6);
  flex-shrink: 0;
  // Slight tint so the pip pops on a tinted page background.
  box-shadow: 0 0 0 2px rgba(var(--coral-rgb), 0.06);
}

.has-bond .connector-pip {
  border-color: rgba(var(--coral-rgb), 0.55);
  color: var(--coral-deep);
}

// Hash row — sits to the right of the spine, baseline-aligned with the
// pip. Wraps under the pip on narrow viewports.
.connector-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.55);
  // Centre against the spine pip vertically.
  align-self: center;
}

.connector-label {
  text-transform: uppercase;
  font-size: 0.86em;
  letter-spacing: 0.06em;
  color: rgba(var(--ink-rgb), 0.45);
}

.connector-hash {
  font-family: 'Space Mono', monospace;
  font-size: 0.92em;
  color: rgba(var(--ink-rgb), 0.70);
  padding: 1px 7px;
  background: rgba(var(--ink-rgb), 0.05);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 3px;
  white-space: nowrap;
}

.connector-hash--missing {
  color: rgba(var(--ink-rgb), 0.35);
  font-style: italic;
}

.connector-sep {
  color: rgba(var(--ink-rgb), 0.35);
  font-family: 'Space Mono', monospace;
}
</style>
