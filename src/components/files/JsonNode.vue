<template>
  <!-- Recursive JSON value renderer. Primitives render as a single inline
       span; objects/arrays render with a click-to-collapse chevron so
       deeply nested decoded payloads stay readable. -->
  <!-- Reference strings ('nodes/<hash>', '<owner>/links/<hash>', …) render
       as a navigable chip; every other primitive stays plain text. -->
  <RefChip
    v-if="kind === 'primitive' && asRef"
    :address="asRef.address"
  />
  <span
    v-else-if="kind === 'primitive'"
    :class="['jv-prim', primitiveClass]"
  >{{ display }}</span>

  <span
    v-else-if="!open"
    class="jv-collapsed"
    @click.stop="open = true"
  >
    <q-icon name="chevron_right" size="12px" class="jv-chev" />
    <span class="jv-bracket">{{ openChar }}</span>
    <span class="jv-summary">{{ summary }}</span>
    <span class="jv-bracket">{{ closeChar }}</span>
  </span>

  <template v-else>
    <span class="jv-open-head" @click.stop="open = false">
      <q-icon name="expand_more" size="12px" class="jv-chev" />
      <span class="jv-bracket">{{ openChar }}</span>
    </span>
    <span class="jv-children">
      <span
        v-for="(it, idx) in entries"
        :key="it.key"
        class="jv-row"
      >
        <template v-if="kind === 'object'">
          <span class="jv-key">"{{ it.key }}"</span><span class="jv-colon">: </span>
        </template>
        <JsonNode :value="it.value" :depth="depth + 1" />
        <span v-if="idx < entries.length - 1" class="jv-comma">,</span>
      </span>
    </span>
    <span class="jv-bracket jv-close">{{ closeChar }}</span>
  </template>
</template>

<script>
import { defineComponent, computed, ref } from 'vue';
import RefChip from './RefChip.vue';
import { parseRef } from 'src/utils/kinds';

const COLLAPSE_AT_DEPTH = 4;

export default defineComponent({
  name: 'JsonNode',
  components: { RefChip },
  props: {
    value: { default: null },
    depth: { type: Number, default: 0 }
  },
  setup (props) {
    // A decoded pathchain reference (kind/hash address) becomes a navigable
    // chip; plain content stays text. Non-strings are never refs.
    const asRef = computed(() =>
      typeof props.value === 'string' ? parseRef(props.value) : null
    );

    const kind = computed(() => {
      const v = props.value;
      if (Array.isArray(v)) return 'array';
      if (v !== null && typeof v === 'object') return 'object';
      return 'primitive';
    });

    const entries = computed(() => {
      if (kind.value === 'array') {
        return props.value.map((v, i) => ({ key: i, value: v }));
      }
      if (kind.value === 'object') {
        return Object.keys(props.value).map((k) => ({ key: k, value: props.value[k] }));
      }
      return [];
    });

    const openChar  = computed(() => kind.value === 'array' ? '[' : '{');
    const closeChar = computed(() => kind.value === 'array' ? ']' : '}');

    const summary = computed(() => {
      const n = entries.value.length;
      if (n === 0) return '';
      return ` ${n} ${kind.value === 'array' ? 'item' : 'key'}${n === 1 ? '' : 's'} `;
    });

    const display = computed(() => {
      const v = props.value;
      if (v === null) return 'null';
      if (typeof v === 'string') return `"${v}"`;
      return String(v);
    });

    const primitiveClass = computed(() => {
      const v = props.value;
      if (v === null) return 'jv-null';
      if (typeof v === 'string')  return 'jv-str';
      if (typeof v === 'boolean') return 'jv-bool';
      if (typeof v === 'number')  return 'jv-num';
      return '';
    });

    // Default open shallow nodes; deeper structures start collapsed so a
    // large payload doesn't drown the inline panel on first render.
    const startsOpen = entries.value.length === 0
      ? true
      : props.depth < COLLAPSE_AT_DEPTH;
    const open = ref(startsOpen);

    return {
      asRef,
      kind, entries, openChar, closeChar, summary,
      display, primitiveClass, open
    };
  }
});
</script>

<style lang="scss" scoped>
.jv-prim,
.jv-collapsed,
.jv-open-head {
  display: inline;
}

.jv-collapsed,
.jv-open-head {
  cursor: pointer;
  user-select: none;
}

.jv-chev {
  vertical-align: -2px;
  color: rgba(0, 0, 0, 0.45);
  margin-right: 1px;
}

.jv-collapsed:hover .jv-chev,
.jv-open-head:hover .jv-chev { color: #2C3D4E; }

.jv-bracket { color: rgba(0, 0, 0, 0.65); }

.jv-summary {
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
  font-size: 0.92em;
  margin: 0 2px;
}

.jv-children {
  display: block;
  padding-left: 16px;
  border-left: 1px dashed rgba(0, 0, 0, 0.08);
  margin-left: 4px;
}

.jv-row { display: block; }

.jv-close {
  display: block;
}

.jv-key   { color: #5b4a93; font-weight: 600; }
.jv-colon { color: rgba(0, 0, 0, 0.55); }
.jv-comma { color: rgba(0, 0, 0, 0.45); }

.jv-str   { color: #1b6e5f; }
.jv-num   { color: #b14848; }
.jv-bool  { color: #c79a00; font-weight: 600; }
.jv-null  { color: #8995a8; font-style: italic; }
</style>
