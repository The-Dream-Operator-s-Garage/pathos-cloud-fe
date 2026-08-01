<template>
  <!-- Always a span so we can nest safely inside router-link wrappers (no <a> in <a>) -->
  <span
    role="link"
    class="hash-link"
    :class="{
      'is-link': !!route,
      ['kind-' + kind]: true,
      'with-icon': showIcon
    }"
    :title="path"
    :data-nav-focus="route || null"
    @click.stop="onClick"
  >
    <q-icon v-if="showIcon" :name="iconForKind" size="10px" class="hl-icon" />
    <span class="hl-text mono">{{ display }}</span>
    <q-icon v-if="route" name="open_in_new" size="9px" class="hl-arrow" />
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KINDS } from 'src/utils/kinds'

export default defineComponent({
  name: 'HashLink',
  props: {
    // Full pathchain path string like "nodes/abc123..." OR a bare hash
    path: { type: String, default: '' },
    // Optional integer id for the DB record — preferred when present
    id: { type: [Number, String], default: null },
    // Override the inferred kind (e.g. when we only have a bare hash)
    kindOverride: { type: String, default: null },
    // Hash truncation length (chars from the hash part)
    truncate: { type: Number, default: 14 },
    // Show the kind icon to the left
    showIcon: { type: Boolean, default: true },
    // Full route override; bypasses kind inference
    to: { type: String, default: null }
  },

  setup (props) {
    const router = useRouter()

    const kind = computed(() => {
      if (props.kindOverride) return props.kindOverride
      const prefix = props.path?.split('/')[0]
      if (prefix && KINDS[prefix]) return prefix
      return 'unknown'
    })

    const iconForKind = computed(() => KINDS[kind.value]?.icon || 'circle')

    const route = computed(() => {
      if (props.to) return props.to
      const meta = KINDS[kind.value]
      if (!meta?.route) return null
      if (!props.id) return null
      return meta.route(props.id)
    })

    const display = computed(() => {
      const h = props.path?.includes('/') ? props.path.split('/').pop() : props.path
      if (!h) return '—'
      return h.length > props.truncate ? h.slice(0, props.truncate) + '…' : h
    })

    const onClick = (e) => {
      if (!route.value) return
      e.preventDefault()
      router.push(route.value)
    }

    return { kind, iconForKind, route, display, onClick }
  }
})
</script>

<style lang="scss" scoped>
.hash-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  color: rgba(var(--ink-rgb), 0.45);
  text-decoration: none;
  letter-spacing: 0.02em;
  border-bottom: 1px dashed transparent;
  padding-bottom: 1px;
  transition: color 0.12s, border-color 0.12s;
  cursor: default;

  &.is-link {
    cursor: pointer;
    border-bottom-color: rgba(var(--ink-rgb), 0.25);

    &:hover {
      color: var(--ink);
      border-bottom-color: rgba(var(--ink-rgb), 0.65);

      .hl-arrow { opacity: 1; }
      .hl-icon  { opacity: 1; }
    }
  }

  // Kind-tinted icons
  &.kind-nodes    .hl-icon { color: var(--ink); }
  &.kind-labels   .hl-icon { color: #00BCD4; }
  &.kind-posts    .hl-icon { color: #b0bec5; }
  &.kind-entities .hl-icon { color: #ce93d8; }
  &.kind-pioneer  .hl-icon { color: #ffd54f; }
  &.kind-moments  .hl-icon { color: rgba(255, 200, 0, 0.7); }
  &.kind-paths    .hl-icon { color: #80cbc4; }
}

.hl-icon {
  opacity: 0.6;
  flex-shrink: 0;
}

.hl-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hl-arrow {
  opacity: 0.3;
  flex-shrink: 0;
  transition: opacity 0.12s;
}
</style>
