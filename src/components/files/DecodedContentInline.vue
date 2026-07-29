<template>
  <!-- Inline decoded view for a pathchain element. Lives directly below
       its row in the file tree (not a floating dialog) and shows the
       decoded JSON + the matching `.proto` schema side-by-side by default
       so the user can read content and shape together. The whole panel
       is height-capped and scrolls internally so a large payload never
       runs past the viewport. -->
  <section class="decoded-inline">
    <!-- Draggable vertical splitter: decoded content leads at 70%, the
         `.proto` schema trails at 30%. On a narrow viewport the bar flips
         horizontal so the two panes stack instead of squeezing. -->
    <q-splitter
      v-model="split"
      :horizontal="stacked"
      :limits="[20, 85]"
      unit="%"
      class="decoded-splitter"
    >
      <template #before>
        <div class="decoded-pane">
          <div class="decoded-pane-head">
            <q-icon name="description" size="13px" />
            <span>decoded</span>
          </div>
          <div v-if="loading" class="decoded-status">
            <q-spinner-dots size="18px" /> decoding…
          </div>
          <div v-else-if="error" class="decoded-status decoded-error">
            {{ error }}
          </div>
          <JsonView v-else :value="decoded" />
        </div>
      </template>

      <template #after>
        <div class="decoded-pane">
          <div class="decoded-pane-head">
            <q-icon name="schema" size="13px" />
            <span>.proto</span>
          </div>
          <div v-if="protoLoading" class="decoded-status">
            <q-spinner-dots size="18px" /> fetching schema…
          </div>
          <div v-else-if="protoError" class="decoded-status decoded-error">
            {{ protoError }}
          </div>
          <pre v-else class="proto-view" v-html="protoHighlighted" />
        </div>
      </template>
    </q-splitter>
  </section>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import JsonView from './JsonView.vue';
import { fileService } from 'src/services/file.service';
import { kindFor } from 'src/utils/kinds.js';

const PROTO_KEYWORDS = /\b(syntax|message|required|optional|repeated|string|int32|int64|float|double|bool|enum|true|false)\b/g;

const escapeHtml = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const highlightProto = (raw) =>
  escapeHtml(raw)
    .replace(/^(\s*\/\/.*)$/gm, '<span class="p-comment">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="p-str">"$1"</span>')
    .replace(PROTO_KEYWORDS, '<span class="p-kw">$1</span>');

export default defineComponent({
  name: 'DecodedContentInline',
  components: { JsonView },
  props: {
    // Tree leaf shape from fileTreeService: { kind, hash, path, db, hasMicro }
    node: { type: Object, required: true }
  },
  setup (props) {
    const $q = useQuasar();

    // Decoded pane leads at 70%, `.proto` trails at 30%. Draggable within
    // [20, 85]. On phones the split flips to a stacked (horizontal) bar.
    const split   = ref(70);
    const stacked = computed(() => $q.screen.lt.sm);

    const decoded   = ref(null);
    const loading   = ref(false);
    const error     = ref('');
    const proto     = ref('');
    const protoLoading = ref(false);
    const protoError   = ref('');

    // Map the on-disk plural prefix to its singular proto slug via the
    // canonical kinds map. Naive `slice(0, -1)` mis-singularizes `entities`
    // → `entitie` (no `entitie.proto` ⇒ 404 on the schema fetch).
    const singularKind = computed(() => kindFor(props.node.kind).kind);

    const protoHighlighted = computed(() => highlightProto(proto.value || ''));

    const loadDecoded = async () => {
      loading.value = true;
      error.value   = '';
      try {
        const res = await fileService.decode(props.node.path);
        if (!res.success) throw new Error(res.error?.message || 'decode failed');
        decoded.value = res.decoded;
      } catch (e) {
        error.value = e.message || 'decode failed';
      } finally {
        loading.value = false;
      }
    };

    const loadProto = async () => {
      if (proto.value) return;
      protoLoading.value = true;
      protoError.value   = '';
      try {
        const res = await fileService.getProto(singularKind.value);
        if (!res.success) throw new Error(res.error?.message || 'proto fetch failed');
        proto.value = res.source;
      } catch (e) {
        protoError.value = e.message || 'no proto available';
      } finally {
        protoLoading.value = false;
      }
    };

    onMounted(() => {
      loadDecoded();
      loadProto();
    });
    watch(() => props.node.path, () => {
      loadDecoded();
      proto.value = '';
      loadProto();
    });

    return {
      split, stacked,
      decoded, loading, error,
      proto, protoLoading, protoError, protoHighlighted
    };
  }
});
</script>

<style lang="scss" scoped>
.decoded-inline {
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: 6px;
  background: #ffffff;
  overflow: hidden;
}

// The splitter is height-capped to a fraction of the viewport so a deep
// payload never escapes the screen; each pane scrolls independently inside
// its panel.
.decoded-splitter {
  height: min(60vh, 520px);
}

.decoded-pane {
  height: 100%;
  overflow: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.decoded-pane-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-rgb), 0.55);
  position: sticky;
  top: 0;
  background: #ffffff;
  padding-bottom: 2px;
  border-bottom: 1px dashed rgba(var(--ink-rgb), 0.10);
  z-index: 1;
}

.decoded-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(var(--ink-rgb), 0.55);
  padding: 8px 4px;
}

.decoded-error { color: #b14848; }

.proto-view {
  margin: 0;
  font-family: 'Space Mono', 'Menlo', monospace;
  font-size: 0.82em;
  line-height: 1.55;
  color: #2C3D4E;
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;

  :deep(.p-kw)      { color: #5b4a93; font-weight: 600; }
  :deep(.p-str)     { color: #1b6e5f; }
  :deep(.p-comment) { color: #8995a8; font-style: italic; }
}

@media (max-width: 640px) {
  // Stacked (horizontal) splitter gets more vertical room since the two
  // panes now share the height instead of the width.
  .decoded-splitter { height: min(75vh, 640px); }
}
</style>
