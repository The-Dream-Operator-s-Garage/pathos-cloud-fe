<template>
  <div class="lfp">
    <button type="button" class="lfp__btn" :class="{ 'is-empty': !modelValue }">
      <q-icon name="label_important" size="13px" class="lfp__btn-icon" />
      <span class="lfp__btn-text">{{ modelValue?.name || placeholder }}</span>
      <q-icon name="arrow_drop_down" size="16px" class="lfp__btn-caret" />

      <q-menu v-model="open" anchor="bottom left" self="top left" :offset="[0, 4]">
        <div class="lfp__menu">
          <div class="lfp__menu-head">
            <span class="lfp__menu-title">{{ creating ? 'Create a label' : 'Pick a label' }}</span>
            <q-space />
            <button type="button" class="lfp__menu-toggle" @click="creating = !creating">
              <q-icon :name="creating ? 'travel_explore' : 'new_label'" size="13px" />
              {{ creating ? 'pick existing' : 'new label' }}
            </button>
          </div>

          <!-- Pick mode: the mini recursive viewer; a click selects the field
               label. The tree selection doubles as the create parent. -->
          <template v-if="!creating">
            <LabelTreeMini
              :selected-id="treePick?.id || null"
              :refresh-key="refreshKey"
              placeholder="Search labels — or browse"
              @select="onTreeSelect"
            />
            <div class="lfp__menu-foot">
              <span class="lfp__menu-hint">click a label to use it as the field</span>
            </div>
          </template>

          <!-- Create mode: append under the tree selection (fork flow if the
               tree isn't yours) or plant a root. -->
          <template v-else>
            <div class="lfp__create-parent">
              <LabelTreeMini
                class="lfp__create-tree"
                :selected-id="treePick?.id || null"
                :refresh-key="refreshKey"
                placeholder="Where does it belong? (optional parent)"
                @select="treePick = $event"
              />
              <button v-if="treePick" type="button" class="lfp__clear-parent"
                @click="treePick = null">
                <q-icon name="backspace" size="12px" /> no parent — create a root
              </button>
            </div>
            <LabelMiniMaker
              :key="treePick?.id || 'root'"
              :parent="treePick"
              @created="onCreated"
              @forked="refreshKey++"
            />
          </template>
        </div>
      </q-menu>
    </button>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import LabelTreeMini from './LabelTreeMini.vue'
import LabelMiniMaker from './LabelMiniMaker.vue'

// A form control whose value IS a label: shows the picked label, and pops
// the mini recursive viewer to search/browse for an existing one — or the
// mini maker to mint it (appending to a tree, with the fork flow when the
// tree isn't owned). The schema builder uses this for field names.
export default defineComponent({
  name: 'LabelFieldPicker',
  components: { LabelTreeMini, LabelMiniMaker },
  props: {
    // { id, name } | null
    modelValue: { type: Object, default: null },
    placeholder: { type: String, default: 'pick a label…' }
  },
  emits: ['update:modelValue'],

  setup (props, { emit }) {
    const open = ref(false)
    const creating = ref(false)
    const treePick = ref(null)
    const refreshKey = ref(0)

    const pick = (label) => {
      emit('update:modelValue', { id: label.id, name: label.name })
      open.value = false
      creating.value = false
    }

    const onTreeSelect = (label) => {
      treePick.value = label
      pick(label)
    }

    const onCreated = (label) => {
      refreshKey.value++
      pick(label)
    }

    return { open, creating, treePick, refreshKey, onTreeSelect, onCreated }
  }
})
</script>

<style lang="scss" scoped>
.lfp { min-width: 0; }

.lfp__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 40px;
  padding: 0 8px 0 12px;
  border: 1px solid rgba(var(--ink-rgb), 0.24);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.55); }
}

.lfp__btn-icon { color: #00829c; flex-shrink: 0; }

.lfp__btn-text {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.78em;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .is-empty & {
    color: var(--ink-mute);
    font-weight: 400;
  }
}

.lfp__btn-caret { color: var(--ink-soft); flex-shrink: 0; }

.lfp__menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 340px;
  max-width: 90vw;
  padding: 10px;

  :deep(.ltm__body) { max-height: 230px; min-height: 140px; }
}

.lfp__menu-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lfp__menu-title {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.lfp__menu-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 0.66em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover { border-color: rgba(0, 130, 156, 0.5); color: #00829c; }
}

.lfp__menu-foot { display: flex; }

.lfp__menu-hint {
  font-size: 0.68em;
  color: var(--ink-mute);
}

.lfp__create-parent {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lfp__create-tree :deep(.ltm__body) { max-height: 150px; min-height: 90px; }

.lfp__clear-parent {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 0;
  font-size: 0.68em;
  color: var(--ink-soft);
  cursor: pointer;

  &:hover { color: var(--coral-deep); }
}
</style>
