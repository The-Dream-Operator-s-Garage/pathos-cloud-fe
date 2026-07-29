<template>
  <!-- ── FULL ─────────────────────────────────────────────── -->
  <div v-if="mode === 'full'" class="node-content-viewer">

    <!-- File-backed node -->
    <template v-if="file">
      <MarkdownBody v-if="file.kind === 'text' && file.ext === 'md'" :text="body" :ref-display="refDisplay" />
      <pre v-else-if="file.kind === 'text'" class="ncv-pre">{{ body }}</pre>

      <img v-else-if="file.kind === 'image'" :src="file.url" :alt="`node image .${file.ext}`" class="ncv-media" />

      <video v-else-if="file.kind === 'video'" :src="file.url" controls class="ncv-media" />

      <audio v-else-if="file.kind === 'audio'" :src="file.url" controls class="ncv-audio" />

      <a v-else :href="file.url" target="_blank" rel="noopener" class="ncv-download">
        <q-icon name="attach_file" size="18px" />
        <span class="mono">.{{ file.ext }} file · {{ prettySize }}</span>
        <q-icon name="download" size="16px" />
      </a>

      <div v-if="!file.exists" class="text-negative q-mt-xs" style="font-size:0.78em;">
        The file behind this node is missing on disk ({{ file.address }}).
      </div>
    </template>

    <!-- Web link node. A URL an EMBED_RULE recognizes renders as the thing
         it points at (the API resolves the rule into `node.embed`), with
         the address still printed underneath — the node's content IS that
         address, and the frame is only a reading of it. -->
    <template v-else-if="isLink">
      <EmbedFrame v-if="embed" :embed="embed" :caption="false" class="q-mb-xs" />
      <a :href="node.content" target="_blank" rel="noopener" class="ncv-link">
        <q-icon name="link" size="16px" />{{ node.content }}
      </a>
    </template>

    <!-- Inline note (and legacy rows) -->
    <pre v-else class="ncv-pre">{{ node?.content || '' }}</pre>
  </div>

  <!-- ── THUMB (mini chips / cards) ───────────────────────── -->
  <div v-else-if="mode === 'thumb'" class="ncv-thumb">
    <img v-if="file && file.kind === 'image'" :src="file.url" :alt="`.${file.ext}`" />
    <q-icon v-else :name="thumbIcon" size="22px" class="text-dim" />
  </div>

  <!-- ── EXCERPT ──────────────────────────────────────────── -->
  <span v-else class="ncv-excerpt">
    <template v-if="embed">
      <q-icon name="play_circle" size="13px" class="q-mr-xs" />{{ embed.provider }} · {{ excerpt }}
    </template>
    <template v-else-if="file && file.kind !== 'text'">
      <q-icon :name="thumbIcon" size="13px" class="q-mr-xs" />{{ file.kind }} · .{{ file.ext }}
    </template>
    <template v-else>{{ excerpt }}</template>
  </span>
</template>

<script>
import { defineComponent, computed } from 'vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import EmbedFrame from 'src/components/shared/EmbedFrame.vue'
import { bodyOf, formatBytes } from 'src/utils/nodeContent'

const KIND_ICON = {
  image: 'image',
  video: 'movie',
  audio: 'music_note',
  binary: 'attach_file',
  text: 'notes'
}

export default defineComponent({
  name: 'NodeContentViewer',
  components: { MarkdownBody, EmbedFrame },

  props: {
    // An API-enriched node row ({ content, type_id, file? })
    node: { type: Object, required: true },
    mode: {
      type: String,
      default: 'full',
      validator: v => ['full', 'excerpt', 'thumb'].includes(v)
    },
    // Chip tier for inline [[pathos:…]] refs in markdown bodies —
    // node surfaces pass 'micro', post surfaces pass 'mini'.
    refDisplay: { type: String, default: 'info' },
    excerptMax: { type: Number, default: 140 }
  },

  setup (props) {
    const file = computed(() => props.node?.file || null)
    const body = computed(() => bodyOf(props.node))
    const isLink = computed(() =>
      (props.node?.type_id === 3 || props.node?.type_id === 4) &&
      /^https?:\/\//.test(props.node?.content || ''))
    // Resolved API-side by an EMBED_RULE — see docs/concepts/embeds.md.
    const embed = computed(() => props.node?.embed || null)

    const excerpt = computed(() => {
      const text = body.value.replace(/[#*_`>[\]]/g, '').replace(/\s+/g, ' ').trim()
      return text.length > props.excerptMax ? `${text.slice(0, props.excerptMax)}…` : text
    })

    const thumbIcon = computed(() => KIND_ICON[file.value?.kind] || 'notes')
    const prettySize = computed(() => formatBytes(file.value?.size))

    return { file, body, isLink, embed, excerpt, thumbIcon, prettySize }
  }
})
</script>

<style lang="scss" scoped>
.ncv-pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  margin: 0;
  color: var(--ink);
}
.ncv-media {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 4px;
  display: block;
}
.ncv-audio { width: 100%; }
.ncv-download,
.ncv-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  text-decoration: none;
  word-break: break-all;
  &:hover { text-decoration: underline; }
}
.ncv-thumb {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.ncv-excerpt { color: inherit; }
</style>
