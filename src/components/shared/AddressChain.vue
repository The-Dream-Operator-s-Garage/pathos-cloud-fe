<template>
  <div class="address-chain" :title="path">
    <q-icon name="account_tree" size="14px" class="address-chain__container-icon" />
    <div class="address-chain__segments">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="i > 0" class="address-chain__sep">/</span>
        <span class="address-chain__prefix">{{ seg.prefix }}/</span>

        <router-link
          v-if="seg.to"
          :to="seg.to"
          class="address-chain__seg is-link"
          :class="'kind-' + seg.kind"
          :title="`${seg.prefix}/${seg.hash}`"
        >
          <q-icon :name="seg.icon" size="11px" class="address-chain__seg-icon" />
          <span class="address-chain__seg-hash mono">{{ seg.hash }}</span>
        </router-link>

        <span
          v-else
          class="address-chain__seg"
          :class="'kind-' + seg.kind"
          :title="`${seg.prefix}/${seg.hash}`"
        >
          <q-icon :name="seg.icon" size="11px" class="address-chain__seg-icon" />
          <span class="address-chain__seg-hash mono">{{ seg.hash }}</span>
        </span>
      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { kindFor } from 'src/utils/kinds';

export default defineComponent({
  name: 'AddressChain',

  props: {
    // Full pathchain address like `files/<entityHash>/nodes/<nodeHash>`.
    path: { type: String, default: '' },

    // Optional map { prefix: routePath } — turns each segment into a
    // hyperlink when the parent has resolved the DB id for that kind.
    // Example: { files: '/entities/12', nodes: '/nodes/34' }
    routes: { type: Object, default: () => ({}) }
  },

  setup (props) {
    const segments = computed(() => {
      const parts = (props.path || '').split('/').filter(Boolean);
      const out = [];
      for (let i = 0; i < parts.length; i += 2) {
        const prefix = parts[i];
        const hash   = parts[i + 1] || '';
        const meta   = kindFor(prefix);
        out.push({
          prefix,
          hash,
          kind: meta.kind,
          icon: meta.icon,
          to:   props.routes[prefix] || null
        });
      }
      return out;
    });

    return { segments };
  }
});
</script>

<style lang="scss" scoped>
.address-chain {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 5px;
  font-size: 0.86em;
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  // Chips and prefixes pack to the left; remaining width on the right
  // is intentional empty space inside the container.
  justify-content: flex-start;
}

.address-chain__container-icon {
  color: rgba(var(--ink-rgb), 0.45);
  flex-shrink: 0;
}

// Holds the alternating [prefix-text][chip] pairs. Everything is
// content-sized so the chips hug their text instead of stretching to
// fill empty space.
.address-chain__segments {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.address-chain__sep {
  color: rgba(var(--ink-rgb), 0.30);
  font-family: 'Space Mono', monospace;
  font-size: 0.92em;
  user-select: none;
  flex-shrink: 0;
}

.address-chain__prefix {
  color: rgba(var(--ink-rgb), 0.55);
  font-family: 'Space Mono', monospace;
  font-size: 0.92em;
  margin-right: 1px;
  user-select: none;
  flex-shrink: 0;
}

.address-chain__seg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.75);
  text-decoration: none;
  font-family: 'Space Mono', monospace;
  font-size: 0.92em;
  line-height: 1.4;
  transition: background 0.12s, color 0.12s;
  // Content-sized; can shrink if the parent gets very narrow.
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
}

.address-chain__seg-icon { flex-shrink: 0; }
.address-chain__seg-hash {
  font-weight: 600;
  // Hash hugs its text. The overflow rules only kick in if the parent
  // truly can't fit the chip — otherwise the full hash is visible.
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-chain__seg.is-link {
  cursor: pointer;
  &:hover {
    color: var(--ink);
    background: rgba(var(--ink-rgb), 0.06);
  }
}
</style>
