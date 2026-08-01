<template>
  <div class="fork-confirm">

    <div class="fork-confirm-header">
      <q-icon name="alt_route" size="14px" class="q-mr-xs" />
      <span>Fork this {{ kindLabel }}</span>
    </div>

    <div class="fork-confirm-body">
      <template v-if="kind === 'path'">
        A new <strong>owned path</strong> will be created for you — the title
        is copied as your starting point and the underlying link chain is
        shared so you see the same steps. Your fork's comments, votes, and
        attachments are independent from the original.
        <div class="fork-confirm-hint">
          After confirming you'll land on your fork. Rename it, attach things,
          or discuss it without affecting the source path.
        </div>
      </template>
      <template v-else>
        A new <strong>owned copy</strong> will be created for you — the current
        content is inherited as your starting point. Comments and sub-forks come
        along tagged as inherited. Votes start at zero.
        <div class="fork-confirm-hint">
          After confirming you'll land on your fork. Edit its content from there
          — each save creates a new version chained from the inherited node.
        </div>
      </template>
    </div>

    <div class="row items-center q-mt-sm" style="gap:8px;">
      <q-space />
      <button type="button" class="bare-btn text-dim" :disabled="loading" @click="$emit('cancel')">
        cancel
      </button>
      <button
        type="button"
        class="confirm-btn"
        :disabled="loading"
        @click="$emit('confirm')"
      >
        <q-spinner v-if="loading" size="12px" class="q-mr-xs" />
        <q-icon v-else name="alt_route" size="13px" class="q-mr-xs" />
        {{ loading ? 'forking…' : 'Confirm fork' }}
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'ForkConfirmPanel',
  emits: ['cancel', 'confirm'],
  props: {
    // What sort of thing is being forked — drives only the heading label.
    kind: { type: String, default: 'post' },
    loading: { type: Boolean, default: false }
  },
  setup (props) {
    const kindLabel = computed(() => {
      if (props.kind === 'node') return 'node'
      if (props.kind === 'comment') return 'comment'
      if (props.kind === 'fork') return 'fork'
      if (props.kind === 'path') return 'path'
      return 'post'
    })
    return { kindLabel }
  }
})
</script>

<style lang="scss" scoped>
.fork-confirm {
  padding: 12px 14px;
  background: #fafbfd;
  border-radius: var(--radius-sm);
}

.fork-confirm-header {
  display: flex;
  align-items: center;
  font-size: 0.82em;
  font-weight: 600;
  color: #2C3D4E;
  margin-bottom: 6px;
}

.fork-confirm-body {
  font-size: 0.82em;
  color: #5b6c82;
  line-height: 1.5;
  strong { color: #1F2A38; }
}

.fork-confirm-hint {
  margin-top: 6px;
  font-size: 0.94em;
  color: #6b7993;
  font-style: italic;
}

.bare-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 0.85em;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  color: #6b7993;
  &:hover { text-decoration: underline; }
  &:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: none; }
}

// Confirm = filled coral pill so the double-check intent reads as a real
// commitment, not a sibling of "cancel".
.confirm-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d35f5f;
  background: #d35f5f;
  color: #fff;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.85em;
  font-family: inherit;
  font-weight: 600;
  transition: background 0.10s, border-color 0.10s, opacity 0.10s;

  &:hover { background: #b14848; border-color: #b14848; }
  &:disabled { opacity: 0.55; cursor: wait; }
}
</style>
