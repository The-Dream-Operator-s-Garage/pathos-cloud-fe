<template>
  <div class="lmm">
    <div class="lmm__target">
      <span class="lmm__target-label">{{ parentLabel ? 'append under' : 'new root label' }}</span>
      <span v-if="parentLabel" class="lmm__parent mono"
        :class="{ 'is-foreign': !parentOwned }">
        {{ parentLabel.name }}
        <q-icon v-if="!parentOwned" name="lock" size="11px" />
      </span>
    </div>

    <!-- Foreign tree: suggest the label to the owner, or fork the tree
         into an owned copy -->
    <div v-if="parentLabel && !parentOwned" class="lmm__fork">
      <p class="lmm__fork-text">
        You don't own <b>{{ parentLabel.name }}</b>{{ parentLabel.system_label ? ' (system tree)' : '' }}.
        <template v-if="canSuggest">Suggest the label to the owner (they'll get a poll in
        your chat), or fork</template>
        <template v-else>Fork</template>
        the tree to get an owned copy you can grow — the original stays untouched.
      </p>
      <div class="lmm__fork-actions">
        <q-btn
          v-if="canSuggest"
          unelevated dense no-caps size="sm" color="primary" icon="how_to_vote"
          label="Suggest to owner"
          @click="$emit('suggest', parentLabel)"
        />
        <q-btn
          unelevated dense no-caps size="sm" color="secondary" icon="call_split"
          :label="`Fork '${parentLabel.name}' tree`"
          :loading="forking"
          @click="forkParent"
        />
      </div>
    </div>

    <template v-else>
      <q-input
        v-model="name" :dark="false" outlined dense autofocus
        label="Label name"
        @keydown.enter.prevent="create"
      />
      <div class="lmm__actions">
        <span v-if="errorMsg" class="lmm__msg text-negative">{{ errorMsg }}</span>
        <q-space />
        <q-btn
          unelevated dense no-caps size="sm" color="primary" icon="new_label"
          label="Create label"
          :loading="busy"
          :disable="!name.trim()"
          @click="create"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { labelService } from 'src/services/label.service'
import { useAuthStore } from 'src/stores/auth'

// The mini label maker: create a label as a new root or appended under a
// parent. When the parent belongs to someone else (or the system), the form
// pivots to the FORK flow — fork the parent's tree, keep working inside the
// owned copy. Hosted by the label maker dock and by the schema builder's
// field picker popup.
export default defineComponent({
  name: 'LabelMiniMaker',
  props: {
    // Label object to append under; null → create a root.
    parent: { type: Object, default: null },
    // Offer 'Suggest to owner' on foreign parents (the label maker dock
    // handles the emitted event; pickers keep the fork-only pivot).
    canSuggest: { type: Boolean, default: false }
  },
  emits: ['created', 'forked', 'suggest'],

  setup (props, { emit }) {
    const auth = useAuthStore()
    const myEntityId = computed(() => auth.user?.id || null)

    // The fork flow retargets creation at the owned copy without mutating
    // the prop — parentLabel is the live target.
    const parentLabel = ref(props.parent)
    watch(() => props.parent, (p) => { parentLabel.value = p })

    const parentOwned = computed(() =>
      !parentLabel.value || parentLabel.value.owner_id === myEntityId.value)

    const name = ref('')
    const busy = ref(false)
    const forking = ref(false)
    const errorMsg = ref('')
    const flashErr = (m) => {
      errorMsg.value = m || ''
      if (m) setTimeout(() => { errorMsg.value = '' }, 4000)
    }

    const create = async () => {
      if (!name.value.trim()) return
      busy.value = true
      try {
        const r = await labelService.create({
          name: name.value.trim(),
          ancestorId: parentLabel.value?.id || null
        })
        if (r.success) {
          name.value = ''
          emit('created', r.label)
        } else {
          flashErr(r.error?.message || 'Could not create label')
        }
      } catch (e) {
        flashErr(e?.response?.data?.error?.message || 'Could not create label')
      } finally { busy.value = false }
    }

    const forkParent = async () => {
      forking.value = true
      try {
        const r = await labelService.fork(parentLabel.value.id)
        if (r.success) {
          parentLabel.value = r.label
          emit('forked', r.label)
        } else {
          flashErr(r.error?.message || 'Fork failed')
        }
      } catch (e) {
        flashErr(e?.response?.data?.error?.message || 'Fork failed')
      } finally { forking.value = false }
    }

    return {
      parentLabel,
      parentOwned,
      name,
      busy,
      forking,
      errorMsg,
      create,
      forkParent
    }
  }
})
</script>

<style lang="scss" scoped>
// ⚠ THE ACCENT IS A DIAL (2026-09-04): `--ltm-accent` / `--ltm-accent-rgb`
// with the shared chrome's `#00829c` as fallback — see LabelTreeMini.vue.
.lmm {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lmm__target {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lmm__target-label {
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.lmm__parent {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72em;
  font-weight: 700;
  color: var(--ltm-accent, #00829c);
  background: rgba(var(--ltm-accent-rgb, 0, 130, 156), 0.1);
  border-radius: var(--radius-pill);
  padding: 1px 9px;

  &.is-foreign { color: #8a6200; background: rgba(255, 200, 0, 0.16); }
}

.lmm__fork {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border: 1px dashed rgba(255, 180, 0, 0.5);
  border-radius: var(--radius-sm);
  background: rgba(255, 200, 0, 0.07);
}

.lmm__fork-text {
  margin: 0;
  font-size: 0.74em;
  color: var(--ink-soft);
  line-height: 1.4;
}

.lmm__fork-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lmm__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lmm__msg { font-size: 0.74em; }
</style>
