<template>
  <!-- A read-only miniature for PATH skeleton rows. Same chrome family as
       PostMini via shared/MiniPanel; the icon, accent, and route all
       point at the path side of the world. Clicking routes to the full
       /paths/:id viewer. Footer carries votes (no other interactions). -->
  <MiniPanel :to="targetRoute">
    <template #title>
      <q-icon name="route" size="13px" class="q-mr-xs path-mini__icon" />
      {{ effectiveTitle }}
    </template>

    <template #chips>
      <span v-if="authorDisplayName" class="mini-author-chip" :title="path.author?.path">
        <EntityName :entity="path.author" />
        <span class="mini-sep">|</span>
        <span class="mini-hash mono">entity/{{ shortHash(path.author?.path, 8) }}</span>
      </span>

      <span v-if="path.kind" class="mini-chip-kind">
        <q-icon name="account_tree" size="11px" class="q-mr-xs" />
        {{ path.kind }}
      </span>

      <span v-if="path.forked_from_id" class="mini-chip-fork">
        <q-icon name="alt_route" size="11px" class="q-mr-xs" />
        fork of #{{ path.forked_from_id }}
      </span>

      <span v-if="path.created_at" class="mini-chip-fact" :title="path.created_at">
        <q-icon name="schedule" size="11px" class="q-mr-xs" />
        {{ timeAgo }}
      </span>
    </template>

    <template v-if="labels && labels.length" #labels>
      <span v-for="(l, i) in displayLabels" :key="l.id || i" class="mini-label-chip">
        {{ l.name }}
      </span>
      <span v-if="labels.length > displayLabels.length" class="mini-label-more">
        +{{ labels.length - displayLabels.length }}
      </span>
    </template>

    <template #hash>
      <PathMicro :id="path.id" :path="path.path" :show-type="true" />
    </template>

    <template #body>
      <!-- When the walked steps are supplied, the body becomes a little
           horizontal strip of the path's elements: image nodes render as
           thumbnails (a path of photos reads as a slider), everything
           else as its micro form. Scrolls sideways when it overflows. -->
      <div v-if="displaySteps.length" class="path-mini__strip" @click.stop.prevent>
        <component
          :is="s.route ? 'router-link' : 'span'"
          v-for="s in displaySteps"
          :key="s.key"
          :to="s.route"
          class="path-mini__step"
          :class="{ 'is-media': s.image }"
          :title="s.title"
        >
          <img v-if="s.image" :src="s.image" :alt="s.title" />
          <span v-else class="path-mini__step-chip">
            <q-icon :name="s.icon" size="12px" />
            <span class="mono">{{ s.short }}</span>
          </span>
        </component>
        <span v-if="hiddenSteps > 0" class="path-mini__more">+{{ hiddenSteps }}</span>
      </div>
      <div v-else-if="path.step_count != null" class="path-mini__summary">
        <q-icon name="format_list_numbered" size="12px" class="q-mr-xs" />
        {{ path.step_count }} step{{ path.step_count === 1 ? '' : 's' }}
      </div>
      <div v-else-if="path.excerpt" class="path-mini__excerpt">{{ path.excerpt }}</div>
      <div v-else class="path-mini__empty">(no description)</div>
    </template>

    <template #foot>
      <span class="vote-pill" :class="{ 'is-up': votes.viewer_vote === 1 }">
        <q-icon name="arrow_upward" size="11px" /> {{ votes.up || 0 }}
      </span>
      <span class="vote-pill" :class="{ 'is-down': votes.viewer_vote === -1 }">
        <q-icon name="arrow_downward" size="11px" /> {{ votes.down || 0 }}
      </span>
      <q-space />
      <span class="path-mini__open">open <q-icon name="open_in_new" size="11px" /></span>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import PathMicro from './PathMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'

export default defineComponent({
  name: 'PathMini',
  components: { MiniPanel, PathMicro, EntityName },
  props: {
    // Path-skeleton shape (enriched). Compatible with the postSkeletonService
    // _enrichChild output plus optional PATH-specific fields (kind,
    // step_count). Votes optional but rendered when present.
    path: { type: Object, required: true },
    labels: { type: Array, default: () => [] },
    // Walked steps from pathService (each { link, target: { kind, … } }).
    // When present, the body renders the element strip / image slider.
    steps: { type: Array, default: null },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/paths/${props.path.id}`)

    const authorDisplayName = computed(() => {
      const a = props.path.author
      if (!a) return ''
      return a.display_name || a.username || ('entity #' + a.id)
    })

    const effectiveTitle = computed(() =>
      props.path.title || 'Path #' + props.path.id
    )

    const displayLabels = computed(() => (props.labels || []).slice(0, 3))

    const votes = computed(() => props.path.votes || {})

    // Element strip: one entry per step target, image nodes as thumbs.
    const STEP_CAP = 12
    const STEP_ICONS = { node: 'adjust', label: 'label_important', path: 'route', skeleton: 'schema', entity: 'person' }
    const displaySteps = computed(() => {
      if (!Array.isArray(props.steps) || !props.steps.length) return []
      return props.steps.slice(0, STEP_CAP).map((s, i) => {
        const t = s.target || {}
        const row = t.node || t.label || t.path || t.skeleton || t.entity || null
        const image = (t.kind === 'node' && t.node?.file?.kind === 'image') ? t.node.file.url : null
        const route =
          t.kind === 'node' && row ? `/nodes/${row.id}`
            : t.kind === 'label' && row ? `/labels/${row.id}`
              : t.kind === 'path' && row ? `/paths/${row.id}`
                : t.kind === 'skeleton' && row ? `/posts/${row.id}`
                  : t.kind === 'entity' && row ? `/entities/${row.id}` : null
        const short = row?.path ? shortHash(row.path, 6) : (t.kind || '?')
        return {
          key: s.link?.id || i,
          image,
          route,
          icon: STEP_ICONS[t.kind] || 'circle',
          short,
          title: `${t.kind || 'element'}${row?.id != null ? ' #' + row.id : ''}`
        }
      })
    })
    const hiddenSteps = computed(() =>
      Array.isArray(props.steps) ? Math.max(0, props.steps.length - STEP_CAP) : 0)

    const shortHash = (p, len = 12) => {
      const h = (p || '').includes('/') ? (p || '').split('/').pop() : p
      return h ? h.slice(0, len) : ''
    }

    const timeAgo = computed(() => {
      const iso = props.path.created_at
      if (!iso) return ''
      const d = Date.now() - new Date(iso).getTime()
      if (d < 0) return ''
      const s = Math.floor(d / 1000)
      if (s < 60) return `${s}s ago`
      const m = Math.floor(s / 60)
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      const days = Math.floor(h / 24)
      if (days < 30) return `${days}d ago`
      try { return new Date(iso).toLocaleDateString() } catch (_) { return iso }
    })

    return {
      targetRoute,
      authorDisplayName,
      effectiveTitle,
      displayLabels,
      votes,
      shortHash,
      timeAgo,
      displaySteps,
      hiddenSteps
    }
  }
})
</script>

<style lang="scss" scoped>
.path-mini__icon { color: var(--coral-deep); vertical-align: middle; }

.path-mini__summary {
  font-size: 0.84em;
  color: #2C3D4E;
  display: inline-flex;
  align-items: center;
}

.path-mini__excerpt {
  font-size: 0.84em;
  line-height: 1.4;
  color: #2C3D4E;
  white-space: pre-wrap;
  word-break: break-word;
}

.path-mini__empty {
  font-size: 0.78em;
  color: #8995a8;
  font-style: italic;
}

// The element strip — horizontal, scrollable, image-first.
.path-mini__strip {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow-x: auto;
  padding: 2px 0 4px;
  scrollbar-width: thin;
}

.path-mini__step {
  flex-shrink: 0;
  text-decoration: none;

  &.is-media img {
    display: block;
    width: 72px;
    height: 54px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid rgba(var(--ink-rgb), 0.15);
    transition: transform 0.1s, border-color 0.1s;
  }
  &.is-media:hover img {
    transform: scale(1.04);
    border-color: rgba(var(--ink-rgb), 0.45);
  }
}

.path-mini__step-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  background: rgba(var(--ink-rgb), 0.05);
  color: #5b6c82;
  font-size: 0.72em;
  &:hover { border-color: rgba(var(--ink-rgb), 0.4); }
}

.path-mini__more {
  flex-shrink: 0;
  font-size: 0.72em;
  color: #8995a8;
}

.mini-chip-fact, .mini-chip-kind, .mini-chip-fork {
  display: inline-flex;
  align-items: center;
}

.mini-chip-kind {
  text-transform: lowercase;
  background: rgba(var(--coral-rgb), 0.08);
  border: 1px solid rgba(var(--coral-rgb), 0.30);
  color: var(--coral-deep);
  padding: 1px 7px;
  border-radius: 9px;
}

.mini-chip-fork {
  color: #b07020;
  background: #fff7ea;
  border: 1px solid #e8cca0;
  padding: 1px 7px;
  border-radius: 9px;
}

.mini-author-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: #f0ecfb;
  border: 1px solid #c1b8e6;
  border-radius: 10px;
  color: #4f3e98;
  font-size: 0.92em;
  .mini-sep  { opacity: 0.4; margin: 0 1px; }
  .mini-hash { font-size: 0.82em; opacity: 0.75; }
}

.mini-label-chip {
  font-size: 0.68em;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(var(--ink-rgb), 0.08);
  color: rgba(var(--ink-rgb), 0.78);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  white-space: nowrap;
}

.mini-label-more {
  font-size: 0.68em;
  color: #8995a8;
}

.vote-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.06);
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  color: #5b6c82;
  font-size: 0.84em;

  &.is-up {
    background: rgba(126, 187, 105, 0.15);
    border-color: rgba(126, 187, 105, 0.45);
    color: #3d7a2a;
  }
  &.is-down {
    background: rgba(211, 95, 95, 0.12);
    border-color: rgba(211, 95, 95, 0.4);
    color: #b14848;
  }
}

.path-mini__open {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #5b6c82;
  font-size: 0.92em;
}
</style>
