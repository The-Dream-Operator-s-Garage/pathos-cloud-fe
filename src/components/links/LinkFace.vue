<template>
  <!-- THE LINK FACE (2026-09-27, user ask: "create a flyout link viewer to
       display the links information and make sure it opens when clicking on
       the references"). The link's information in a box — `ElementFlyout`
       mounts it as the face of a `links/…` element target, where the fifth
       target drew LinkMini until today; every link nano chip (the path
       viewer's bonds, a post body's `[[pathos:links/…]]`, the moment's
       minted list) opens it through MicroChip's door. `MomentFace`'s
       pattern: loads itself off `id` (a DB id or a hash — the route's own
       contract) and emits `loaded` with the read so the window can retitle.
       What a link IS, in order: the chain around it (prev ← THIS → next, the
       neighbours' own chips), the facts (target · belongs to · author ·
       moment · type), the TARGET drawn as its Mini (the family's dispatcher
       on the pre-resolved row), and the decoded pathchain buffer (refs as
       chips). Indigo — the links' family (`kinds.js links`, one step deeper
       than the posts'). -->
  <div class="link-face">
    <div v-if="loading && !link" class="link-face__state">
      <q-spinner size="22px" color="primary" />
    </div>
    <div v-else-if="!link" class="link-face__state link-face__state--missing">
      <q-icon name="error_outline" size="34px" />
      <div>{{ locked ? 'This link is not yours to read.' : 'Link not found.' }}</div>
    </div>
    <section v-else class="side-panel subject-panel">
      <header class="subject-panel__ident">
        <div class="subject-panel__titlebar">
          <q-icon :name="kind.icon" size="22px" class="subject-panel__title-icon" :style="{ color: kind.color }" />
          <span class="vsep" aria-hidden="true" />
          <div class="subject-panel__title nasalization">link #{{ link.id }}</div>
          <span class="vsep" aria-hidden="true" />
          <span class="subject-panel__position mono">{{ positionLine }}</span>
        </div>
      </header>

      <!-- The address line: the stock nano pill + the copy control -->
      <div class="subject-panel__meta">
        <LinkMicro :id="link.id" :path="link.path" :full-address="link.path" :expand="false" />
        <q-space />
        <button
          type="button"
          class="link-face__copy"
          :class="{ 'is-copied': copied }"
          :title="copied ? 'address copied' : 'copy the full link address'"
          @click.stop.prevent="copyPath"
        >
          <q-icon :name="copied ? 'check' : 'content_copy'" size="12px" />
        </button>
      </div>

      <div class="subject-panel__body">
        <!-- THE CHAIN: prev ← this → next. The neighbours are links too, so
             they wear their own chips and each is a door to its own face. -->
        <div class="link-face__chain">
          <LinkMicro v-if="prev" :id="prev.id" :path="prev.path" collapsed class="link-face__neighbour" />
          <span v-else class="link-face__edge"><q-icon name="first_page" size="12px" /> chain head</span>
          <span class="link-face__rail" aria-hidden="true" />
          <span class="link-face__here" :title="link.path">
            <q-icon name="link" size="12px" /> this link
          </span>
          <span class="link-face__rail" aria-hidden="true" />
          <LinkMicro v-if="next" :id="next.id" :path="next.path" collapsed class="link-face__neighbour" />
          <span v-else class="link-face__edge">chain tail <q-icon name="last_page" size="12px" /></span>
        </div>

        <!-- THE FACTS -->
        <dl class="link-face__facts">
          <dt>target</dt>
          <dd>
            <MicroChip
              :kind="targetPrefix"
              :id="link.target_id"
              :path="targetAddress"
              :display="targetDisplay"
              :integrity="targetRow?.integrity || null"
              :full-address="targetAddress"
            />
          </dd>
          <dt>belongs to</dt>
          <dd>
            <template v-if="parentPath">
              <PathMicro :id="parentPath.id" :path="parentPath.path" />
              <span v-if="position" class="link-face__fact-note">step {{ position }}</span>
            </template>
            <span v-else class="link-face__fact-mute">no path holds this link as its head chain</span>
          </dd>
          <dt>author</dt>
          <dd>
            <EntityName v-if="owner" :entity="owner" :bold="false" />
            <span v-else class="link-face__fact-mute">—</span>
          </dd>
          <dt>moment</dt>
          <dd>
            <template v-if="moment">
              <MomentMicro :id="moment.id" :path="moment.path" />
              <span class="link-face__fact-note">{{ momentHuman }}</span>
            </template>
            <span v-else class="link-face__fact-mute">—</span>
          </dd>
          <dt>kind</dt>
          <dd><span class="mono">{{ link.target_type }}</span><span v-if="link.type_id" class="link-face__fact-note">type {{ link.type_id }}</span></dd>
        </dl>

        <!-- THE TARGET, drawn — the element this link reaches, as its Mini -->
        <div v-if="targetRow" class="link-face__target">
          <div class="link-face__heading"><q-icon name="my_location" size="12px" /> target</div>
          <ElementMini :element="target" :depth="1" :visited="[link.path]" />
        </div>

        <!-- THE DECODED BUFFER — what the on-disk protobuf says -->
        <div class="link-face__decoded">
          <div class="link-face__heading"><q-icon name="data_object" size="12px" /> decoded from pathchain</div>
          <div v-if="!decodedRows.length" class="link-face__fact-mute">no on-disk buffer found for this link</div>
          <div v-else class="link-face__grid">
            <div v-for="[key, val] in decodedRows" :key="key" class="link-face__row">
              <span class="link-face__key mono">{{ key }}</span>
              <span class="link-face__val">
                <InfoChip v-if="refFor(val)" :kind="refFor(val).prefix" :address="refFor(val).address" dense />
                <span v-else class="mono">{{ String(val) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent, ref, computed, onMounted, watch } from 'vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import LinkMicro from './LinkMicro.vue'
import PathMicro from 'src/components/paths/PathMicro.vue'
import MomentMicro from 'src/components/moments/MomentMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'
import { linkService } from 'src/services/link.service'
import { kindFor, isHash, parseRef, prefixFor } from 'src/utils/kinds'
import { lockedInfoFromError } from 'src/utils/access'

export default defineComponent({
  name: 'LinkFace',
  components: {
    MicroChip,
    InfoChip,
    LinkMicro,
    PathMicro,
    MomentMicro,
    EntityName,
    // The dispatcher pulls the whole mini family; a face should not cost
    // the chunk until it draws a target.
    ElementMini: defineAsyncComponent(() => import('src/components/shared/ElementMini.vue'))
  },
  props: {
    // A DB id or a link hash — the route's own contract.
    id: { type: [Number, String], default: null }
  },
  emits: ['loaded'],
  setup (props, { emit }) {
    const kind = kindFor('links')
    const loading = ref(true)
    const locked = ref(null)
    const link = ref(null)
    const target = ref(null)
    const prev = ref(null)
    const next = ref(null)
    const parentPath = ref(null)
    const position = ref(null)
    const owner = ref(null)
    const moment = ref(null)
    const decoded = ref(null)

    const load = async () => {
      loading.value = true
      locked.value = null
      link.value = null
      target.value = null
      prev.value = null
      next.value = null
      parentPath.value = null
      position.value = null
      owner.value = null
      moment.value = null
      decoded.value = null
      const param = String(props.id ?? '')
      if (!param) { loading.value = false; return }
      try {
        const r = isHash(param) ? await linkService.getByHash(param) : await linkService.get(parseInt(param, 10))
        if (r?.success) {
          link.value = r.link || null
          target.value = r.target || null
          prev.value = r.prev || null
          next.value = r.next || null
          parentPath.value = r.parentPath || null
          position.value = r.position || null
          owner.value = r.owner || null
          moment.value = r.moment || null
          decoded.value = r.decoded || null
          emit('loaded', { link: link.value, target: target.value, parentPath: parentPath.value, position: position.value })
        }
      } catch (e) { locked.value = lockedInfoFromError(e) }
      loading.value = false
    }
    onMounted(load)
    watch(() => props.id, load)

    const targetRow = computed(() => {
      const k = target.value?.kind
      return k ? (target.value[k] || null) : null
    })
    const targetPrefix = computed(() => prefixFor(target.value?.kind || link.value?.target_type || 'unknown'))
    const targetAddress = computed(() => targetRow.value?.path || '')
    const targetDisplay = computed(() => {
      const k = target.value?.kind
      const row = targetRow.value
      if (!row) return ''
      if (k === 'label') return row.name || ''
      if (k === 'skeleton') return row.name && row.name !== 'POST' ? row.name : ''
      if (k === 'entity') return row.username ? '@' + row.username : (row.display_name || '')
      return ''
    })
    const positionLine = computed(() => {
      const hasPrev = !!link.value?.prev_id
      const hasNext = !!link.value?.next_id
      if (!hasPrev && !hasNext) return 'sole link'
      if (!hasPrev) return 'chain head'
      if (!hasNext) return 'chain tail'
      return 'mid-chain'
    })
    const momentHuman = computed(() => {
      const iso = moment.value?.time_utc
      if (!iso) return ''
      try { return new Date(iso).toLocaleString() } catch (_) { return iso }
    })
    const decodedRows = computed(() => {
      const d = decoded.value
      if (!d) return []
      const out = []
      for (const key of ['register', 'author', 'prev', 'next', 'target', 'ancestor', 'tag']) {
        if (d[key] !== undefined && d[key] !== '') out.push([key, d[key]])
      }
      return out
    })
    const refFor = (val) => parseRef(typeof val === 'string' ? val : '')

    const copied = ref(false)
    const copyPath = async () => {
      if (!link.value?.path) return
      try {
        await navigator.clipboard.writeText(link.value.path)
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (_) { /* clipboard denied — the glyph never flips */ }
    }

    return {
      kind,
      loading,
      locked,
      link,
      target,
      targetRow,
      targetPrefix,
      targetAddress,
      targetDisplay,
      prev,
      next,
      parentPath,
      position,
      positionLine,
      owner,
      moment,
      momentHuman,
      decodedRows,
      refFor,
      copied,
      copyPath
    }
  }
})
</script>

<style lang="scss" scoped>
// The box — MomentFace's root, to the letter: the face fills what mounts it
// and scrolls as ONE surface with the thin scrollbar the windows share.
.link-face {
  container-type: inline-size;
  container-name: link-face;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  &::-webkit-scrollbar       { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.18); border-radius: 4px; }
}
.link-face__state {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 10px;
  font-size: 0.85em;
  color: var(--grey-8, #616161);
  .q-icon { opacity: 0.35; }
}

// The panel — the faces' `.side-panel` material.
.side-panel {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;
  --link-ink: var(--indigo-8, #283593);
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  flex: 0 0 auto;
}
.subject-panel__ident {
  padding: 10px 12px 8px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
}
.subject-panel__titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.subject-panel__title {
  font-size: 1.05em;
  color: var(--panel-ink-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.subject-panel__position {
  font-size: 0.74em;
  color: var(--panel-ink-2);
}
.vsep {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: var(--panel-rule);
  flex: 0 0 auto;
}
.subject-panel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--panel-rule);
  background: var(--panel-body);
  min-width: 0;
}
.link-face__copy {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border: 0;
  background: none;
  color: var(--panel-ink-2);
  cursor: pointer;
  &:hover { color: var(--panel-ink-1); }
  &.is-copied { color: var(--positive, #21ba45); }
}
.subject-panel__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 12px 12px;
}

// ── the chain ────────────────────────────────────────────────────────────
.link-face__chain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  background: var(--panel-chrome);
}
.link-face__rail {
  flex: 1 1 auto;
  height: 1px;
  min-width: 10px;
  background: var(--link-ink);
  opacity: 0.55;
}
.link-face__here {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border: 1px solid var(--link-ink);
  border-radius: var(--radius-pill, 999px);
  color: var(--link-ink);
  font-size: 0.74em;
  font-weight: 600;
  white-space: nowrap;
}
.link-face__edge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72em;
  color: var(--panel-ink-mute);
  white-space: nowrap;
}
.link-face__neighbour { flex: 0 0 auto; }

// ── the facts ────────────────────────────────────────────────────────────
.link-face__facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 5px 12px;
  margin: 0;
  font-size: 0.8em;
  dt {
    color: var(--panel-ink-mute);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.8em;
    line-height: 20px;
  }
  dd {
    margin: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    color: var(--panel-ink);
  }
}
.link-face__fact-note { font-size: 0.88em; color: var(--panel-ink-2); }
.link-face__fact-mute { font-size: 0.88em; color: var(--panel-ink-mute); font-style: italic; }

// ── the target + the decoded buffer ──────────────────────────────────────
.link-face__heading {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--panel-ink-mute);
  margin-bottom: 4px;
}
.link-face__target :deep(.element-mini) { max-width: none; }
.link-face__grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md);
  background: var(--panel-chrome);
  font-size: 0.76em;
}
.link-face__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.link-face__key {
  flex: 0 0 70px;
  color: var(--panel-ink-mute);
}
.link-face__val {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--panel-ink);
}
</style>
