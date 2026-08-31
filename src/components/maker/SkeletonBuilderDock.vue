<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="skeleton-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized }"
      :style="{ zIndex: windows.zOf('skeletonBuilder'), '--dock-right': windows.dockRight + 'px', '--trail-shift': windows.trailShiftOf('skeletonBuilder') + 'px' }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ── -->
      <header class="dock-bar">
        <q-icon name="architecture" size="14px" class="dock-bar__icon" />
        <span class="dock-bar__title nasalization">Schema builder</span>
        <span class="dock-bar__meta mono">
          {{ store.draftCount }} in progress
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (work in progress is kept)" @click="store.close()">
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

      <!-- ── Work tabs — one per schema in progress ── -->
      <div class="dock-tabs">
        <button
          v-for="d in store.drafts"
          :key="d.id"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': d.id === store.activeId }"
          @click="store.setActive(d.id)"
        >
          <q-icon :name="tabIcon(d)" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ tabLabel(d) }}</span>
          <span class="dock-tab__x" title="Discard" @click.stop="askDiscard(d)">
            <q-icon name="close" size="11px" />
          </span>
        </button>
        <button type="button" class="dock-tab dock-tab--new" title="New schema work"
          @click="store.addDraft()">
          <q-icon name="add" size="14px" />
        </button>
      </div>

      <!-- ════ START MODE — define / instantiate / fork ════ -->
      <div v-if="draft && draft.mode === 'start'" :key="'start-' + draft.id" class="dock-start">
        <div class="start-col">
          <button type="button" class="start-define" @click="beginDefine">
            <q-icon name="architecture" size="22px" />
            <span class="start-define__title">Define a new schema</span>
            <span class="start-define__sub">
              Name the schema and declare its fields. Each field IS a label
              from the label system — pick one or mint it in place; an
              optional constraint restricts which kind of element (entities,
              nodes, posts, labels, paths, skeletons, moments, links) can
              fill it on an instance.
            </span>
          </button>

          <div class="start-label">…or instantiate / fork an existing schema</div>
          <div class="start-list">
            <div v-if="templatesLoading" class="start-list__state">
              <q-spinner size="16px" color="primary" />
            </div>
            <div v-else-if="templates.length === 0" class="start-list__state">
              No schemas yet. Define one above.
            </div>
            <div
              v-else
              v-for="t in templates"
              :key="t.id"
              class="start-tmpl"
            >
              <q-icon name="architecture" size="14px" :style="{ color: '#5b6c82' }" />
              <span class="start-tmpl__name mono">{{ t.name }}</span>
              <span class="start-tmpl__meta">
                {{ t.slots.length }} field{{ t.slots.length === 1 ? '' : 's' }} · {{ t.owner_username || 'platform' }}
              </span>
              <span class="start-tmpl__actions">
                <button type="button" class="start-tmpl__btn" title="Create an empty instance and populate it"
                  @click.stop="instantiate(t)">
                  <q-icon name="add_box" size="14px" /> instance
                </button>
                <button type="button" class="start-tmpl__btn" title="Copy these fields into a new schema you can rename and modify"
                  @click.stop="forkSchema(t)">
                  <q-icon name="call_split" size="13px" /> fork
                </button>
              </span>
            </div>
          </div>
        </div>

        <div class="start-col">
          <div class="start-label">…or search existing schemas</div>
          <q-input
            v-model="schemaQuery" :dark="false" outlined dense clearable
            placeholder="Search schemas by name"
            @update:model-value="onSchemaQueryInput"
          >
            <template #prepend><q-icon name="search" size="16px" /></template>
          </q-input>
          <div class="start-list start-list--tall">
            <div v-if="schemaSearching" class="start-list__state">
              <q-spinner size="16px" color="primary" />
            </div>
            <div v-else-if="schemaResults.length === 0" class="start-list__state">
              {{ schemaQuery ? 'No schema matches.' : 'Type to search schemas.' }}
            </div>
            <div
              v-else
              v-for="t in schemaResults"
              :key="t.id"
              class="start-tmpl"
            >
              <q-icon name="architecture" size="14px" :style="{ color: '#5b6c82' }" />
              <router-link class="start-tmpl__name mono" :to="`/skeletons/${t.id}`">{{ t.name }}</router-link>
              <span class="start-tmpl__meta">
                {{ t.slots.length }} field{{ t.slots.length === 1 ? '' : 's' }} · {{ t.owner_username || 'platform' }}
              </span>
              <span class="start-tmpl__actions">
                <button type="button" class="start-tmpl__btn" title="Create an empty instance and populate it"
                  @click.stop="instantiate(t)">
                  <q-icon name="add_box" size="14px" /> instance
                </button>
                <button type="button" class="start-tmpl__btn" title="Copy these fields into a new schema"
                  @click.stop="forkSchema(t)">
                  <q-icon name="call_split" size="13px" /> fork
                </button>
              </span>
            </div>
          </div>
          <span v-if="loadMsg" class="dock-msg text-negative">{{ loadMsg }}</span>
        </div>
      </div>

      <!-- ════ DEFINE MODE — build (or extend) a schema ════ -->
      <div v-else-if="draft && draft.mode === 'define'" :key="'def-' + draft.id" class="dock-body">
        <section class="dock-editor">
          <q-input
            :model-value="draft.name" :dark="false" outlined dense
            label="Schema name (e.g. BASIC_USER_INFO, RECIPE)"
            :disable="!!draft.templateId"
            @update:model-value="patch({ name: $event })"
          />

          <!-- Fork banner: the new schema will record its lineage -->
          <div v-if="!draft.templateId && draft.forkOf" class="dock-section-label">
            <q-icon name="call_split" size="12px" />
            forking <b class="mono">{{ draft.forkOf.name }}</b> — the new schema keeps its lineage
          </div>

          <!-- Existing fields when extending a schema: append-only, locked -->
          <div v-if="draft.templateId && draft.template" class="field-locked-list">
            <div class="dock-section-label">Existing fields (append-only — fields can't be removed)</div>
            <div v-for="s in draft.template.slots" :key="s.slotName" class="field-row field-row--locked">
              <span class="field-row__name mono">{{ s.slotName }}</span>
              <span class="kind-chip" :style="kindChipStyle(s.kind)">
                {{ s.kind || 'any' }}
              </span>
              <q-icon name="lock" size="12px" class="field-row__lock" />
            </div>
          </div>

          <div class="dock-section-label">
            {{ draft.templateId ? 'New fields to add' : 'Fields — each field IS a label + optional constraint' }}
          </div>
          <div class="field-list">
            <div v-for="(f, i) in draft.fields" :key="i" class="field-row">
              <LabelFieldPicker
                class="field-row__input"
                :model-value="f.labelId ? { id: f.labelId, name: f.name } : null"
                placeholder="pick a label as the field name…"
                @update:model-value="patchField(i, { labelId: $event.id, name: $event.name })"
              />
              <q-select
                :model-value="f.kind" :dark="false" outlined dense
                class="field-row__kind"
                :options="kindOptions" emit-value map-options
                label="constraint"
                @update:model-value="patchField(i, { kind: $event })"
              />
              <button type="button" class="field-row__remove" title="Remove field"
                :disabled="draft.fields.length === 1 && !draft.templateId"
                @click="removeField(i)">
                <q-icon name="close" size="13px" />
              </button>
            </div>
          </div>
          <button type="button" class="field-add" @click="addField">
            <q-icon name="add" size="13px" /> add field
          </button>

          <footer class="dock-foot">
            <span class="dock-hint">
              A schema is a skeleton whose keys declare a field vocabulary and
              per-field constraints. Instances pair those fields with real
              elements — filled on the instance viewer, not here.
            </span>
            <q-space />
            <span v-if="errorMsg" class="dock-msg text-negative">{{ errorMsg }}</span>
            <span v-if="successMsg" class="dock-msg text-positive">{{ successMsg }}</span>
            <q-btn
              unelevated dense no-caps size="sm" color="primary" icon="architecture"
              :label="draft.templateId ? 'Add fields' : 'Create schema'"
              :loading="busy"
              :disable="!canSubmit"
              @click="submit"
            />
          </footer>
        </section>

        <aside class="dock-side">
          <div class="dock-section-label">What happens next</div>
          <p class="dock-side__text">
            Creating the schema mints its keys path (one field label each) and
            records every field's constraint. Then <b>instantiate</b> it: an
            empty instance is minted and you land on its viewer, where each
            field becomes an editable table row you fill by typing, searching,
            uploading, or building elements.
          </p>
          <p class="dock-side__text">
            Schemas are append-only: fields can be added later, never removed.
            Older instances simply show new fields as empty.
          </p>
          <q-btn
            v-if="draft.templateId"
            unelevated dense no-caps size="sm" color="secondary" icon="add_box"
            label="Instantiate this schema"
            class="q-mt-sm"
            @click="instantiate({ id: draft.templateId, name: draft.name })"
          />
        </aside>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useSkeletonBuilderStore, builderLabel } from 'src/stores/skeletonBuilder'
import { useWindowsStore } from 'src/stores/windows'
import { useAuthStore } from 'src/stores/auth'
import { skeletonService } from 'src/services/skeleton.service'
import { kindFor } from 'src/utils/kinds'
import LabelFieldPicker from 'src/components/labels/LabelFieldPicker.vue'

// Every referenceable pathchain element kind — mirrors the API's
// VALID_SLOT_KINDS (secrets stay out: their hash is the invite credential).
const KIND_OPTIONS = [
  { label: 'any element', value: null },
  { label: 'entities', value: 'entities' },
  { label: 'nodes', value: 'nodes' },
  { label: 'posts', value: 'posts' },
  { label: 'labels', value: 'labels' },
  { label: 'paths', value: 'paths' },
  { label: 'skeletons', value: 'skeletons' },
  { label: 'moments', value: 'moments' },
  { label: 'links', value: 'links' }
]

export default defineComponent({
  name: 'SkeletonBuilderDock',
  components: { LabelFieldPicker },

  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const store = useSkeletonBuilderStore()
    const windows = useWindowsStore()
    const auth = useAuthStore()
    store.load()

    const draft = computed(() => store.activeDraft)

    const busy = ref(false)
    const errorMsg = ref('')
    const successMsg = ref('')
    const flash = (okMsg, errMsg) => {
      successMsg.value = okMsg || ''
      errorMsg.value = errMsg || ''
      setTimeout(() => { successMsg.value = ''; errorMsg.value = '' }, 3500)
    }

    const patch = (p) => {
      if (draft.value) store.patchDraft(draft.value.id, p)
    }

    const tabLabel = builderLabel
    const tabIcon = (d) => d.mode === 'define' ? 'architecture' : 'add_box'

    const askDiscard = (d) => {
      const hasWork = d.mode !== 'start' &&
        ((d.name || '').trim() || (d.fields || []).some(f => f.labelId || (f.name || '').trim()))
      if (!hasWork) { store.removeDraft(d.id); return }
      $q.dialog({
        title: 'Discard work?',
        message: `“${tabLabel(d)}” hasn't been created — closing its tab throws the staged fields away.`,
        cancel: { flat: true, label: 'Keep' },
        ok: { color: 'negative', flat: true, label: 'Discard' }
      }).onOk(() => store.removeDraft(d.id))
    }

    const kindChipStyle = (kind) => {
      const c = kind ? kindFor(kind).color : 'rgba(90,100,110,0.8)'
      return { '--kind-color': c }
    }

    // ── start mode: schema list + search ─────────────────────
    const templates = ref([])
    const templatesLoading = ref(false)
    const loadTemplates = async () => {
      templatesLoading.value = true
      try {
        const r = await skeletonService.listTemplates()
        templates.value = r.success ? r.templates : []
      } catch (_) { templates.value = [] }
      templatesLoading.value = false
    }
    onMounted(loadTemplates)

    const schemaQuery = ref('')
    const schemaResults = ref([])
    const schemaSearching = ref(false)
    const loadMsg = ref('')
    let schemaTimer = null
    let schemaSeq = 0
    const runSchemaSearch = async () => {
      const seq = ++schemaSeq
      schemaSearching.value = true
      try {
        const r = await skeletonService.listTemplates(schemaQuery.value || '')
        if (seq === schemaSeq) schemaResults.value = r.success ? r.templates : []
      } catch (_) {
        if (seq === schemaSeq) schemaResults.value = []
      } finally {
        if (seq === schemaSeq) schemaSearching.value = false
      }
    }
    const onSchemaQueryInput = () => {
      clearTimeout(schemaTimer)
      schemaTimer = setTimeout(runSchemaSearch, 300)
    }

    const beginDefine = () => patch({ mode: 'define' })

    // Copy a schema's fields into a fresh define form (rename + modify).
    // Fields carry their label ids — a fork reuses the same vocabulary.
    // Submit goes through POST /skeletons/templates/:id/fork so the new
    // schema records its lineage (forked_from + spine ancestry).
    const forkSchema = (t) => {
      const d = (draft.value?.mode === 'start') ? draft.value : store.addDraft()
      store.patchDraft(d.id, {
        mode: 'define',
        templateId: null,
        template: null,
        name: '',
        forkOf: { id: t.id, name: t.name },
        fields: (t.slots || []).length
          ? t.slots.map(s => ({ labelId: s.labelId || null, name: s.slotName, kind: s.kind || null }))
          : [{ labelId: null, name: '', kind: null }]
      })
      store.setActive(d.id)
    }

    // Mint an empty instance of a schema and jump to its viewer to populate.
    const instantiate = async (t) => {
      busy.value = true
      try {
        const r = await skeletonService.instantiateById(t.id, {})
        if (r.success) {
          router.push('/skeletons/' + r.skeleton.id)
          store.minimize()
        } else {
          flash('', r.error?.message || 'Instantiate failed')
        }
      } catch (e) {
        flash('', e?.response?.data?.error?.message || e?.message || 'Instantiate failed')
      } finally { busy.value = false }
    }

    // ── define mode ──────────────────────────────────────────
    const patchField = (i, p) => {
      const fields = draft.value.fields.map((f, j) => j === i ? { ...f, ...p } : f)
      patch({ fields })
    }
    const addField = () => patch({ fields: [...draft.value.fields, { labelId: null, name: '', kind: null }] })
    const removeField = (i) => {
      const fields = draft.value.fields.filter((_, j) => j !== i)
      patch({ fields: fields.length ? fields : [{ labelId: null, name: '', kind: null }] })
    }

    // A field is filled once a label backs it (legacy drafts may still carry
    // free-text names — those submit through the name path).
    const cleanFields = computed(() =>
      (draft.value?.fields || []).filter(f => f.labelId || (f.name || '').trim()))

    const canSubmit = computed(() => {
      if (!draft.value) return false
      if (draft.value.templateId) return cleanFields.value.length > 0
      return (draft.value.name || '').trim() && cleanFields.value.length > 0
    })

    const submit = async () => {
      const d = draft.value
      if (!d) return
      busy.value = true
      try {
        const slots = cleanFields.value.map(f =>
          f.labelId ? { labelId: f.labelId, kind: f.kind } : { name: f.name, kind: f.kind })
        const wasExtend = !!d.templateId
        const wasFork = !wasExtend && !!d.forkOf
        const r = wasExtend
          ? await skeletonService.addSlots(d.templateId, slots)
          : (wasFork
              ? await skeletonService.forkTemplate(d.forkOf.id, { name: d.name, slots })
              : await skeletonService.createTemplate(d.name, slots))
        if (r.success) {
          const slotsOut = (r.slots || []).map(s => ({ slotName: s.slotName, kind: s.kind || null }))
          patch({
            templateId: r.skeleton.id,
            name: r.skeleton.name,
            template: { id: r.skeleton.id, name: r.skeleton.name, slots: slotsOut },
            forkOf: null,
            fields: [{ labelId: null, name: '', kind: null }]
          })
          flash(wasExtend ? 'Fields added.' : (wasFork ? 'Schema forked.' : 'Schema created.'))
          loadTemplates()
          $q.dialog({
            title: wasExtend ? 'Schema updated' : (wasFork ? 'Schema forked' : 'Schema created'),
            message: `Instantiate ${r.skeleton.name} now and start filling its fields?`,
            cancel: { flat: true, label: 'Later' },
            ok: { flat: true, label: 'Instantiate' }
          }).onOk(() => instantiate({ id: r.skeleton.id, name: r.skeleton.name }))
        } else {
          flash('', r.error?.message || 'Failed')
        }
      } catch (e) {
        flash('', e?.response?.data?.error?.message || e?.message || 'Something went wrong')
      } finally { busy.value = false }
    }

    return {
      store,
      windows,
      auth,
      draft,
      busy,
      errorMsg,
      successMsg,
      patch,
      tabLabel,
      tabIcon,
      askDiscard,
      kindChipStyle,
      kindOptions: KIND_OPTIONS,
      // start
      templates,
      templatesLoading,
      schemaQuery,
      schemaResults,
      schemaSearching,
      loadMsg,
      onSchemaQueryInput,
      beginDefine,
      forkSchema,
      instantiate,
      // define
      patchField,
      addField,
      removeField,
      canSubmit,
      submit
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and tab strip come from the shared
// .dock-window chrome in src/css/_components.scss; the footprint and the
// brown plaque come from .dock-window--creation there (so does maximize
// and the narrow-screen fallback). Only the builder's body layout lives
// here.

.dock-section-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
}

.dock-msg { font-size: 0.78em; }

.dock-hint {
  font-size: 0.72em;
  color: var(--ink-mute);
  line-height: 1.35;
  max-width: 52ch;
}

.dock-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-top: auto;
}

// ── Start mode ──
.dock-start {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
  padding: 14px 16px;
  overflow-y: auto;
}

.start-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.start-define {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: var(--radius-md);
  background: var(--paper-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.5); box-shadow: var(--shadow-soft); }
}

.start-define__title {
  font-weight: 700;
  font-size: 0.9em;
  color: var(--ink);
}

.start-define__sub {
  font-size: 0.74em;
  color: var(--ink-mute);
  line-height: 1.4;
}

.start-label {
  font-size: 0.7em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  font-family: var(--font-mono);
  margin-top: 4px;
}

.start-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 260px;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);

  &--tall { max-height: none; flex: 1; }
}

.start-list__state {
  padding: 16px 8px;
  text-align: center;
  font-size: 0.76em;
  color: var(--ink-mute);
}

.start-tmpl {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: var(--paper-card);
  text-align: left;
}

.start-tmpl__name {
  font-size: 0.78em;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: #00829c; }
}

.start-tmpl__meta {
  font-size: 0.66em;
  color: var(--ink-mute);
  white-space: nowrap;
}

.start-tmpl__actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
  flex-shrink: 0;
}

.start-tmpl__btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 7px;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink-soft);
  font-size: 0.64em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.5); color: #00829c; }
}

// ── Body (define mode) ──
.dock-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

.dock-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.dock-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  background: var(--paper-card);
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  padding: 10px 12px;
}

.dock-side__text {
  font-size: 0.76em;
  color: var(--ink-soft);
  line-height: 1.5;
  margin: 0;
}

// ── Define mode fields ──
.field-list, .field-locked-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &--locked {
    padding: 5px 10px;
    border: 1px solid rgba(var(--ink-rgb), 0.12);
    border-radius: 7px;
    background: rgba(var(--ink-rgb), 0.04);
  }
}

.field-row__input { flex: 1; }
.field-row__kind { width: 160px; flex-shrink: 0; }

.field-row__name {
  font-size: 0.78em;
  font-weight: 600;
  color: var(--ink);
  flex: 1;
}

.field-row__lock { color: rgba(var(--ink-rgb), 0.35); }

.field-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.5);
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(var(--coral-rgb), 0.14); color: var(--coral-deep); }
  &:disabled { opacity: 0.25; cursor: default; }
}

.field-add {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px dashed rgba(var(--ink-rgb), 0.3);
  border-radius: var(--radius-pill);
  background: none;
  padding: 3px 10px;
  font-size: 0.72em;
  color: var(--ink-soft);
  cursor: pointer;

  &:hover { border-color: rgba(0, 130, 156, 0.5); color: #00829c; }
}

.kind-chip {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--kind-color, #5b6c82);
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .dock-body, .dock-start { grid-template-columns: 1fr; overflow-y: auto; }
}
</style>
