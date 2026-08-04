<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="label-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized }"
      :style="{ zIndex: windows.zOf('labelMaker'), '--dock-right': windows.dockRight + 'px' }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ── -->
      <header class="dock-bar">
        <q-icon name="label_important" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Label maker</span>
        <span class="dock-bar__meta mono">
          {{ selected ? selected.name : 'the vocabulary workshop' }}
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close" @click="store.close()">
            <q-icon name="close" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--yellow"
            title="Minimize" @click="store.minimize()">
            <q-icon name="remove" />
          </button>
          <button type="button" class="traffic__dot traffic__dot--green"
            :title="store.isMaximized ? 'Restore size' : 'Maximize'"
            @click="store.toggleMaximize()">
            <q-icon :name="store.isMaximized ? 'close_fullscreen' : 'open_in_full'" />
          </button>
        </div>
      </header>

      <div class="dock-body">
        <!-- ── LEFT: the recursive tree browser / search. Appendable:
             every unraveled layer ends with an add row — inline create on
             owned layers, suggest/fork hand-off on foreign ones. ── -->
        <section class="label-dock__tree">
          <div class="dock-section-label">Browse the label forest</div>
          <LabelTreeMini
            :selected-id="selected?.id || null"
            :refresh-key="refreshKey"
            appendable
            @select="onSelect"
            @created="onCreated"
            @append-foreign="onSuggestTarget"
          />
        </section>

        <!-- ── RIGHT: action panel for the selection ── -->
        <aside class="label-dock__panel">
          <!-- Nothing selected: plant a new root -->
          <template v-if="!selected">
            <div class="dock-section-label">New root label</div>
            <p class="label-dock__hint">
              Roots start vocabularies. Pick any label on the left to grow,
              rename, move or fork its tree — or plant a fresh root here.
            </p>
            <LabelMiniMaker :parent="null" @created="onCreated" />
          </template>

          <template v-else>
            <!-- Identity: chain breadcrumb + badges -->
            <div class="label-dock__ident">
              <div class="label-dock__chain">
                <template v-for="(c, i) in chain" :key="c.id">
                  <span v-if="i > 0" class="label-dock__chain-sep">›</span>
                  <button type="button" class="label-dock__chain-link mono"
                    :class="{ 'is-current': c.id === selected.id }"
                    @click="selectById(c)">{{ c.name }}</button>
                </template>
              </div>
              <div class="label-dock__badges">
                <span v-if="selected.system_label" class="ltm-badge ltm-badge--sys">system</span>
                <span v-else-if="isMine" class="ltm-badge ltm-badge--mine">yours</span>
                <span v-else class="ltm-badge">entity #{{ selected.owner_id }}</span>
                <router-link class="label-dock__open" :to="`/labels/${selected.id}`">
                  open viewer <q-icon name="north_east" size="10px" />
                </router-link>
              </div>
            </div>

            <!-- Action strip -->
            <div class="label-dock__actions">
              <button type="button" class="label-act" :class="{ 'is-on': mode === 'child' }"
                title="Append a child label under this one"
                @click="setMode('child')">
                <q-icon name="subdirectory_arrow_right" size="14px" /> child
              </button>
              <button type="button" class="label-act" :class="{ 'is-on': mode === 'sibling' }"
                title="Append a brother label beside this one"
                @click="setMode('sibling')">
                <q-icon name="account_tree" size="14px" /> brother
              </button>
              <button type="button" class="label-act" :class="{ 'is-on': mode === 'rename' }"
                :disabled="!canEdit" title="Rename (owner only, not system)"
                @click="setMode('rename')">
                <q-icon name="drive_file_rename_outline" size="14px" /> rename
              </button>
              <button type="button" class="label-act" :class="{ 'is-on': mode === 'move' }"
                :disabled="!canEdit" title="Assign a different ancestor (owner only)"
                @click="setMode('move')">
                <q-icon name="move_up" size="14px" /> move
              </button>
              <button v-if="!isMine" type="button" class="label-act"
                :class="{ 'is-on': mode === 'suggest' }"
                title="Suggest a label for this layer — the owner decides via a poll"
                @click="setMode('suggest')">
                <q-icon name="how_to_vote" size="14px" /> suggest
              </button>
              <button type="button" class="label-act label-act--fork"
                title="Deep-copy this tree into labels you own"
                @click="forkTree">
                <q-spinner v-if="forking" size="12px" />
                <q-icon v-else name="call_split" size="14px" /> fork tree
              </button>
              <button v-if="canEdit" type="button" class="label-act label-act--delete"
                :class="{ 'is-danger': mode === 'delete' }"
                title="Delete this label and its whole branch"
                @click="setMode('delete')">
                <q-icon name="delete_forever" size="14px" /> delete
              </button>
            </div>

            <!-- ── Mode panels ── -->
            <div v-if="mode === 'child'" class="label-dock__mode">
              <LabelMiniMaker :parent="selected" can-suggest
                @created="onCreated" @forked="onForked" @suggest="onSuggestTarget" />
            </div>

            <div v-else-if="mode === 'sibling'" class="label-dock__mode">
              <LabelMiniMaker
                :key="'sib-' + selected.id"
                :parent="parentOfSelected"
                can-suggest
                @created="onCreated"
                @forked="onForked"
                @suggest="onSuggestTarget"
              />
            </div>

            <div v-else-if="mode === 'suggest'" class="label-dock__mode">
              <div class="dock-section-label">Suggest a label under '{{ selected.name }}'</div>
              <p class="label-dock__hint">
                The owner gets a poll in your chat — yes plants your label in
                their tree, exactly where you point.
              </p>
              <q-input
                v-model="suggestName" :dark="false" outlined dense autofocus
                label="Label name"
                @keydown.enter.prevent="sendSuggestion"
              />
              <q-input
                v-model="suggestMsg" :dark="false" outlined dense autogrow
                type="textarea" label="Message to the owner (optional)"
              />
              <div class="label-dock__mode-actions">
                <q-btn flat dense no-caps size="sm" icon="call_split" label="Fork instead"
                  :loading="forking" @click="forkTree" />
                <q-space />
                <q-btn unelevated dense no-caps size="sm" color="primary" icon="how_to_vote"
                  label="Send suggestion" :loading="busy" :disable="!suggestName.trim()"
                  @click="sendSuggestion" />
              </div>
            </div>

            <div v-else-if="mode === 'delete'" class="label-dock__mode label-dock__mode--danger">
              <div class="dock-section-label">Delete this branch</div>
              <p class="label-dock__hint">
                Deletes <b>'{{ selected.name }}'</b> and every label beneath it,
                including their attachments to elements. Branches that key
                skeleton fields are protected. This cannot be undone.
              </p>
              <div class="label-dock__mode-actions">
                <q-space />
                <q-btn unelevated dense no-caps size="sm" color="negative" icon="delete_forever"
                  :label="`Delete '${selected.name}' branch`" :loading="busy"
                  @click="deleteBranch" />
              </div>
            </div>

            <div v-else-if="mode === 'rename'" class="label-dock__mode">
              <q-input
                v-model="renameText" :dark="false" outlined dense autofocus
                label="New name"
                @keydown.enter.prevent="rename"
              />
              <div class="label-dock__mode-actions">
                <q-space />
                <q-btn unelevated dense no-caps size="sm" color="primary"
                  label="Rename" :loading="busy" :disable="!renameText.trim()"
                  @click="rename" />
              </div>
            </div>

            <div v-else-if="mode === 'move'" class="label-dock__mode label-dock__mode--move">
              <div class="dock-section-label">Pick the new ancestor (one of your labels)</div>
              <LabelTreeMini
                class="label-dock__move-tree"
                placeholder="Search for the new parent…"
                :selected-id="moveTarget?.id || null"
                :refresh-key="refreshKey"
                @select="moveTarget = $event"
              />
              <div class="label-dock__mode-actions">
                <q-btn flat dense no-caps size="sm" icon="south_west" label="Detach to root"
                  :loading="busy" @click="reparent(null)" />
                <q-space />
                <q-btn unelevated dense no-caps size="sm" color="primary" icon="move_up"
                  :label="moveTarget ? `Move under ${moveTarget.name}` : 'Move'"
                  :loading="busy" :disable="!moveTarget"
                  @click="reparent(moveTarget)" />
              </div>
            </div>

            <p v-else class="label-dock__hint">
              <template v-if="isMine">
                This label is yours — append children or brothers (the add rows
                at the end of each unraveled layer work too), rename it, move
                its whole branch elsewhere, or delete the branch outright.
              </template>
              <template v-else>
                You don't own this tree. <b>Suggest</b> sends the owner a poll
                with your label; <b>fork</b> deep-copies the tree into labels
                you own and opens it here for editing.
              </template>
            </p>

          </template>

          <!-- Flashes render regardless of selection — a branch delete
               clears the selection but its confirmation must still show. -->
          <span v-if="errorMsg" class="label-dock__msg text-negative">{{ errorMsg }}</span>
          <span v-if="successMsg" class="label-dock__msg text-positive">{{ successMsg }}</span>
        </aside>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useLabelMakerStore } from 'src/stores/labelMaker'
import { useWindowsStore } from 'src/stores/windows'
import { useAuthStore } from 'src/stores/auth'
import { labelService } from 'src/services/label.service'
import LabelTreeMini from 'src/components/labels/LabelTreeMini.vue'
import LabelMiniMaker from 'src/components/labels/LabelMiniMaker.vue'

// The label maker dock — sibling of the maker/uploader/schema-builder docks.
// End-to-end vocabulary work: browse/search the forest (left), then act on
// the selection (right): child/brother appends, rename, re-hang, fork.
export default defineComponent({
  name: 'LabelMakerDock',
  components: { LabelTreeMini, LabelMiniMaker },

  setup () {
    const store = useLabelMakerStore()
    const windows = useWindowsStore()
    const auth = useAuthStore()

    const selected = computed(() => store.selected)
    const isMine = computed(() =>
      !!selected.value && selected.value.owner_id === auth.user?.id)
    const canEdit = computed(() => isMine.value && !selected.value?.system_label)

    const refreshKey = ref(0)
    const mode = ref('info')
    const busy = ref(false)
    const forking = ref(false)
    const errorMsg = ref('')
    const successMsg = ref('')
    let flashTimer = null
    const flash = (ok, err) => {
      successMsg.value = ok || ''
      errorMsg.value = err || ''
      clearTimeout(flashTimer)
      flashTimer = setTimeout(() => { successMsg.value = ''; errorMsg.value = '' }, 3500)
    }

    // Ancestry chain of the selection ([root, …, selected]) — feeds the
    // breadcrumb and gives 'brother' its parent target.
    const chain = ref([])
    const parentOfSelected = computed(() =>
      chain.value.length > 1 ? chain.value[chain.value.length - 2] : null)

    const loadChain = async () => {
      chain.value = []
      if (!selected.value) return
      try {
        const r = await labelService.getChain(selected.value.id)
        if (r.success) chain.value = r.chain
      } catch (_) { /* breadcrumb stays empty */ }
    }
    watch(selected, loadChain, { immediate: true })

    const onSelect = (label) => {
      store.select(label)
      mode.value = 'info'
    }
    const selectById = async (labelRow) => {
      // Chain rows are lean — refetch the full row so owner checks hold.
      try {
        const r = await labelService.get(labelRow.id)
        if (r.success) onSelect(r.label)
      } catch (_) { onSelect(labelRow) }
    }

    const renameText = ref('')
    const moveTarget = ref(null)
    const suggestName = ref('')
    const suggestMsg = ref('')
    const setMode = (m) => {
      mode.value = mode.value === m ? 'info' : m
      if (mode.value === 'rename') renameText.value = selected.value?.name || ''
      if (mode.value === 'move') moveTarget.value = null
      if (mode.value === 'suggest') { suggestName.value = ''; suggestMsg.value = '' }
    }

    // A foreign layer's add row (or a mini-maker's 'Suggest to owner') —
    // focus that parent and open the suggestion panel on it.
    const onSuggestTarget = (parentLabel) => {
      store.select(parentLabel)
      mode.value = 'suggest'
      suggestName.value = ''
      suggestMsg.value = ''
    }

    const bump = () => { refreshKey.value++ }

    const onCreated = (label) => {
      flash(`Created '${label.name}'.`)
      store.select(label)
      mode.value = 'info'
      bump()
    }

    // A mini-maker fork (from the child/brother flows) — focus the copy:
    // the maker IS the editor, so the forked tree opens ready to grow.
    const onForked = (forkRoot) => {
      flash(`Forked into '${forkRoot.name}' — now yours.`)
      store.select(forkRoot)
      mode.value = 'info'
      bump()
    }

    const sendSuggestion = async () => {
      if (!suggestName.value.trim()) return
      busy.value = true
      try {
        const r = await labelService.suggest(selected.value.id, {
          name: suggestName.value.trim(),
          message: suggestMsg.value.trim() || undefined
        })
        if (r.success) {
          flash(`Suggestion sent — the owner of '${selected.value.name}' got a poll in your chat.`)
          mode.value = 'info'
        } else flash('', r.error?.message || 'Suggestion failed')
      } catch (e) {
        flash('', e?.response?.data?.error?.message || 'Suggestion failed')
      } finally { busy.value = false }
    }

    const deleteBranch = async () => {
      busy.value = true
      try {
        const r = await labelService.remove(selected.value.id)
        if (r.success) {
          flash(`Deleted '${r.root.name}' — ${r.deleted} label${r.deleted === 1 ? '' : 's'} gone.`)
          store.select(null)
          mode.value = 'info'
          bump()
        } else flash('', r.error?.message || 'Delete failed')
      } catch (e) {
        flash('', e?.response?.data?.error?.message || 'Delete failed')
      } finally { busy.value = false }
    }

    const rename = async () => {
      busy.value = true
      try {
        const r = await labelService.update(selected.value.id, { name: renameText.value.trim() })
        if (r.success) {
          store.select({ ...selected.value, name: renameText.value.trim() })
          flash('Renamed.')
          mode.value = 'info'
          bump()
        } else flash('', r.error?.message || 'Rename failed')
      } catch (e) {
        flash('', e?.response?.data?.error?.message || 'Rename failed')
      } finally { busy.value = false }
    }

    const reparent = async (target) => {
      busy.value = true
      try {
        const r = await labelService.update(selected.value.id, { ancestorId: target ? target.id : null })
        if (r.success) {
          flash(target ? `Moved under '${target.name}'.` : 'Detached into a root.')
          mode.value = 'info'
          bump()
          loadChain()
        } else flash('', r.error?.message || 'Move failed')
      } catch (e) {
        flash('', e?.response?.data?.error?.message || 'Move failed')
      } finally { busy.value = false }
    }

    const forkTree = async () => {
      forking.value = true
      try {
        const r = await labelService.fork(selected.value.id)
        if (r.success) {
          flash(`Forked ${r.count} label${r.count === 1 ? '' : 's'} — the copy is yours.`)
          store.select(r.label)
          mode.value = 'info'
          bump()
        } else flash('', r.error?.message || 'Fork failed')
      } catch (e) {
        flash('', e?.response?.data?.error?.message || 'Fork failed')
      } finally { forking.value = false }
    }

    return {
      store,
      windows,
      selected,
      isMine,
      canEdit,
      refreshKey,
      mode,
      busy,
      forking,
      errorMsg,
      successMsg,
      chain,
      parentOfSelected,
      renameText,
      moveTarget,
      suggestName,
      suggestMsg,
      onSelect,
      selectById,
      setMode,
      onSuggestTarget,
      onCreated,
      onForked,
      sendSuggestion,
      deleteBranch,
      rename,
      reparent,
      forkTree
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights come from the shared .dock-window
// chrome in src/css/_components.scss; the footprint and the brown plaque
// come from .dock-window--creation there (so does maximize and the
// narrow-screen fallback).

.dock-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

.dock-section-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.label-dock__tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;

  :deep(.ltm) { flex: 1; min-height: 0; }
  :deep(.ltm__body) { max-height: none; }
}

.label-dock__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  background: var(--paper-card);
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 10px 12px;
}

.label-dock__hint {
  font-size: 0.74em;
  color: var(--ink-mute);
  line-height: 1.45;
  margin: 0;
}

.label-dock__ident {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-dock__chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
}

.label-dock__chain-sep {
  color: rgba(var(--ink-rgb), 0.35);
  font-size: 0.72em;
}

.label-dock__chain-link {
  border: none;
  background: rgba(var(--ink-rgb), 0.06);
  border-radius: var(--radius-pill);
  padding: 1px 8px;
  font-size: 0.7em;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;

  &:hover { color: #00829c; background: rgba(0, 130, 156, 0.1); }
  &.is-current { color: #fff; background: #00829c; }
}

.label-dock__badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

// Badge grammar shared with LabelTreeMini rows.
.ltm-badge {
  font-family: var(--font-mono);
  font-size: 0.6em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-pill);
  padding: 0 7px;
  color: var(--ink-soft);
  background: rgba(var(--ink-rgb), 0.08);

  &--sys  { color: #8a6200; background: rgba(255, 200, 0, 0.18); }
  &--mine { color: #00829c; background: rgba(0, 130, 156, 0.12); }
}

.label-dock__open {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  text-decoration: none;

  &:hover { color: #00829c; }
}

.label-dock__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.label-act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, background 0.12s;

  &:hover:not(:disabled) { border-color: rgba(0, 130, 156, 0.5); color: #00829c; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }

  &.is-on {
    color: #fff;
    background: #00829c;
    border-color: #00829c;
  }

  &--fork:hover:not(:disabled) { border-color: rgba(255, 180, 0, 0.7); color: #8a6200; }

  &--delete:hover:not(:disabled) { border-color: rgba(193, 0, 21, 0.5); color: #c10015; }
  &--delete.is-danger {
    color: #fff;
    background: #c10015;
    border-color: #c10015;
  }
}

.label-dock__mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(var(--ink-rgb), 0.12);
  border-radius: var(--radius-sm);
  background: rgba(var(--ink-rgb), 0.03);
}

.label-dock__mode--move { min-height: 0; }

.label-dock__mode--danger {
  border-color: rgba(193, 0, 21, 0.35);
  background: rgba(193, 0, 21, 0.04);
}

.label-dock__move-tree {
  :deep(.ltm__body) { max-height: 200px; min-height: 120px; }
}

.label-dock__mode-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-dock__msg { font-size: 0.76em; }

@media (max-width: 900px) {
  .dock-body { grid-template-columns: 1fr; overflow-y: auto; }
}
</style>
