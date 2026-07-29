<template>
  <!-- The pre-publish ACCESS TREE (access doctrine): before a post goes
       out, its author reviews every referenced element (recursed through
       referenced posts' bodies) and decides what the world may see. The
       base row is the post itself — toggling it public flips every owned
       branch on; branches then toggle individually. Elements the author
       doesn't own show their status but take no toggle. -->
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="access-tree">
      <q-card-section class="access-tree__head">
        <q-icon :name="share ? 'group' : 'public'" size="18px" />
        <div>
          <div class="access-tree__title">Who can see this?</div>
          <div class="access-tree__sub">
            {{ share
              ? "The message reaches this conversation's members. Toggle which of your referenced elements they may open too."
              : 'Everything is private by default — only you (and entities you grant) can read it. Toggle the world icon to publish.' }}
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="access-tree__rows">
        <!-- Base of the tree: the post itself (share mode: the message —
             its audience is the conversation, not a choice). -->
        <div class="access-row is-root">
          <span v-if="share" class="world-badge is-public" title="Goes to the conversation's members">
            <q-icon name="group" size="15px" />
          </span>
          <button
            v-else
            type="button"
            class="world-toggle"
            :class="{ 'is-on': rootPublic }"
            :title="rootPublic ? 'Public — click to keep private' : 'Private — click to make public'"
            @click="toggleRoot"
          >
            <q-icon :name="rootPublic ? 'public' : 'lock'" size="15px" />
          </button>
          <span class="access-row__label">
            <strong>{{ title || (share ? 'This message' : 'This post') }}</strong>
            <span class="access-row__state">
              {{ share ? "the conversation's members" : (rootPublic ? 'public to the world' : 'private — only you') }}
            </span>
          </span>
        </div>

        <div v-if="loading" class="access-tree__loading">
          <q-spinner size="16px" color="primary" /> reading the reference tree…
        </div>

        <template v-else>
          <div
            v-for="row in rows"
            :key="row.node.address"
            class="access-row"
            :style="{ paddingLeft: (14 + row.depth * 18) + 'px' }"
          >
            <!-- Owned + gated + not yet public → the author decides. -->
            <button
              v-if="row.node.owned && row.node.gated && !row.node.public"
              type="button"
              class="world-toggle"
              :class="{ 'is-on': choices[row.node.address] }"
              :title="choices[row.node.address] ? 'Will be published' : 'Stays private'"
              @click="choices[row.node.address] = !choices[row.node.address]"
            >
              <q-icon :name="choices[row.node.address] ? 'public' : 'lock'" size="14px" />
            </button>
            <span v-else-if="row.node.public" class="world-badge is-public" title="Already public">
              <q-icon name="public" size="14px" />
            </span>
            <span v-else-if="!row.node.owned" class="world-badge" title="Someone else's element — its owner controls access">
              <q-icon :name="row.node.summary?.locked ? 'lock' : 'person'" size="14px" />
            </span>
            <span v-else class="world-badge" title="Not access-gated">
              <q-icon name="sell" size="14px" />
            </span>

            <InfoChip
              class="access-row__chip"
              :kind="row.node.kind"
              :primary="row.node.summary?.primary || row.node.hash.slice(0, 10)"
              :secondary="row.node.summary?.secondary || ''"
              dense
            />
            <span v-if="row.node.owned && row.node.gated && !row.node.public" class="access-row__state">
              {{ choices[row.node.address] ? (share ? 'sharing' : 'publishing') : 'stays private' }}
            </span>
          </div>

          <div v-if="!rows.length" class="access-tree__empty">
            No references in this post — only its own visibility to decide.
          </div>
        </template>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="access-tree__actions">
        <q-btn flat dense no-caps label="Cancel" @click="cancel" />
        <q-btn
          unelevated dense no-caps color="primary" icon="send"
          :label="share ? 'Send' : (rootPublic ? 'Publish' : 'Post privately')"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, reactive, computed, watch } from 'vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import { accessService } from 'src/services/access.service'

export default defineComponent({
  name: 'AccessTreeDialog',
  components: { InfoChip },
  props: {
    modelValue: { type: Boolean, default: false },
    // The draft's final markdown body — the tree is parsed from it.
    content: { type: String, default: '' },
    title: { type: String, default: '' },
    // 'publish' — posting: the base toggle makes the post (and branches)
    //   public; confirm emits { public, publish[] }.
    // 'share' — messaging: the audience is the conversation's members;
    //   branch toggles pick which owned refs to open to them (the caller
    //   reads confirm's `publish` list as its shareRefs).
    mode: { type: String, default: 'publish' }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup (props, { emit }) {
    const share = computed(() => props.mode === 'share')
    const loading = ref(false)
    const rows = ref([])
    const rootPublic = ref(false)
    const choices = reactive({})

    const flatten = (nodes, depth, out) => {
      for (const n of nodes || []) {
        out.push({ node: n, depth })
        flatten(n.children, depth + 1, out)
      }
      return out
    }

    const load = async () => {
      loading.value = true
      rows.value = []
      rootPublic.value = false
      for (const k of Object.keys(choices)) delete choices[k]
      try {
        const r = await accessService.tree({ content: props.content })
        if (r.success) {
          rows.value = flatten(r.tree, 0, [])
          for (const row of rows.value) {
            if (row.node.owned && row.node.gated && !row.node.public) {
              choices[row.node.address] = false
            }
          }
        }
      } catch (e) {
        // Empty tree — the root toggle still works; surface the why.
        console.warn('[access-tree] load failed:', e?.message || e)
      }
      loading.value = false
    }

    watch(() => props.modelValue, (open) => { if (open) load() })

    // The base of the tree: flipping the post public flips every owned
    // branch with it (then branches toggle individually).
    const toggleRoot = () => {
      rootPublic.value = !rootPublic.value
      for (const k of Object.keys(choices)) choices[k] = rootPublic.value
    }

    const confirm = () => {
      const publish = Object.keys(choices).filter((k) => choices[k])
      emit('confirm', { public: !share.value && rootPublic.value, publish })
      emit('update:modelValue', false)
    }

    const cancel = () => {
      emit('cancel')
      emit('update:modelValue', false)
    }

    return { loading, rows, rootPublic, choices, share, toggleRoot, confirm, cancel }
  }
})
</script>

<style lang="scss" scoped>
.access-tree {
  min-width: 440px;
  max-width: 560px;
  background: var(--paper-card, #ffffff);
  color: var(--ink, #1f2a38);
}

.access-tree__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  .q-icon { color: #00829c; margin-top: 2px; }
}
.access-tree__title { font-weight: 700; font-size: 0.95em; }
.access-tree__sub { font-size: 0.74em; color: var(--ink-mute, #8995a8); line-height: 1.4; }

.access-tree__rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 46vh;
  overflow-y: auto;
}

.access-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  &.is-root { padding-bottom: 4px; border-bottom: 1px dashed rgba(var(--ink-rgb), 0.14); margin-bottom: 2px; }
}
.access-row__label {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: 0.85em;
}
.access-row__chip { min-width: 0; }
.access-row__state { font-size: 0.68em; color: var(--ink-mute, #8995a8); white-space: nowrap; }

.world-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(var(--ink-rgb), 0.3);
  background: rgba(var(--ink-rgb), 0.04);
  color: rgba(var(--ink-rgb), 0.55);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;

  &:hover { border-color: #00829c; color: #00829c; }
  &.is-on {
    background: rgba(#00829c, 0.12);
    border-color: #00829c;
    color: #00829c;
  }
}

.world-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  color: rgba(var(--ink-rgb), 0.4);
  &.is-public { color: #21ba45; }
}

.access-tree__loading,
.access-tree__empty {
  font-size: 0.76em;
  color: var(--ink-mute, #8995a8);
  padding: 4px 0 2px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
