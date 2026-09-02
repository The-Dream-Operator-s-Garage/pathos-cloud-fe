<template>
  <!-- THE DRAFT GRID (skeletons plan phase 3, D10 — decided 2026-09-01:
       "show the interface to populate the table anyways, just don't mint
       until all keys are set and inform the user"). A skeleton-to-be held
       draft-locally in the maker store (`draft.grids[]`): key cells that
       are EMPTY until a label is picked (a key is a label, and only a
       label — the pair grammar has no nameless key, which is why nothing
       is minted before every key is set), content cells the author can
       fill meanwhile, an axis toggle, a ghost + key, per-key ×. The
       moment every key is set (and there is at least one), it MINTS: a
       private user schema with those keys + one instance carrying the
       typed cells (`instantiate` with initialValues), the axis when it
       is not the default, and the surface swaps the body's placeholder
       token for the live `![[pathos:skeletons/<hash>|<name>]]` mini —
       from then on the grid IS the SkeletonMini, and its ghost + key goes
       through the head like anywhere else. -->
  <div class="draft-grid" :class="['is-' + local.axis, { 'is-ready': ready, 'is-minting': minting }]">
    <div class="draft-grid__head">
      <q-icon name="schema" size="12px" class="draft-grid__glyph" />
      <span class="draft-grid__title nasalization">{{ name }}</span>
      <span class="draft-grid__notice" :class="{ 'is-ready': ready }">{{ notice }}</span>
      <q-space />
      <button
        type="button"
        class="draft-grid__tool"
        :title="local.axis === 'col' ? 'keys down the first column — flip to a top row' : 'keys across the top row — flip to a first column'"
        @click.stop.prevent="flipAxis"
      >
        <q-icon :name="local.axis === 'col' ? 'view_column' : 'table_rows'" size="11px" />
        <span class="mono">{{ local.axis }}</span>
      </button>
      <button type="button" class="draft-grid__tool draft-grid__tool--x" title="discard this skeleton" @click.stop.prevent="$emit('discard')">
        <q-icon name="close" size="11px" />
      </button>
    </div>

    <table class="draft-grid__grid">
      <tbody>
        <tr v-for="(line, li) in matrix" :key="li" class="draft-grid__line">
          <component
            :is="c.kind === 'key' || c.kind === 'ghost-key' ? 'th' : 'td'"
            v-for="c in line"
            :key="c.kind + ':' + c.i"
            class="draft-grid__c"
            :class="{
              'draft-grid__key': c.kind === 'key',
              'draft-grid__key--ghost': c.kind === 'ghost-key',
              'draft-grid__cell': c.kind === 'cell',
              'draft-grid__cell--ghost': c.kind === 'ghost-cell',
              'is-empty': c.kind === 'key' && !local.keys[c.i]
            }"
          >
            <template v-if="c.kind === 'key'">
              <button
                type="button"
                class="draft-grid__key-btn mono"
                :title="local.keys[c.i] ? 'change this key (pick another label)' : 'pick a label for this key'"
                @click.stop.prevent="pickerFor = c.i"
              >{{ local.keys[c.i] ? local.keys[c.i].name : 'pick a key' }}</button>
              <button
                v-if="local.keys.length > 1"
                type="button"
                class="draft-grid__key-x"
                title="remove this key"
                @click.stop.prevent="removeKey(c.i)"
              ><q-icon name="close" size="10px" /></button>
              <div v-if="pickerFor === c.i" class="draft-grid__picker" @click.stop>
                <div class="draft-grid__picker-head">
                  <span>a key is an existing label</span>
                  <button type="button" class="draft-grid__tool" title="cancel" @click.stop.prevent="pickerFor = null">
                    <q-icon name="close" size="11px" />
                  </button>
                </div>
                <LabelPicker compact :exclude-ids="usedIds" @picked="onPicked(c.i, $event)" />
              </div>
            </template>
            <template v-else-if="c.kind === 'ghost-key'">
              <button type="button" class="draft-grid__ghost-btn" title="add a key" @click.stop.prevent="addKey">
                <q-icon name="add" size="11px" /><span>key</span>
              </button>
            </template>
            <template v-else-if="c.kind === 'cell'">
              <input
                :value="local.cells[c.i]"
                type="text"
                class="draft-grid__input mono"
                :placeholder="local.keys[c.i] ? local.keys[c.i].name.toLowerCase() : 'content'"
                @input="setCell(c.i, $event.target.value)"
                @click.stop
              >
            </template>
            <template v-else />
          </component>
        </tr>
      </tbody>
    </table>

    <div v-if="error" class="draft-grid__error">{{ error }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import LabelPicker from 'src/components/maker/LabelPicker.vue'
import { skeletonService } from 'src/services/skeleton.service'

export default defineComponent({
  name: 'DraftSkeletonGrid',
  components: { LabelPicker },
  props: {
    // { id, keys: [{ id, name } | null], cells: [''], axis: 'col'|'row' }
    grid: { type: Object, required: true },
    // The draft's title — the skeleton's name when it mints.
    titleHint: { type: String, default: '' }
  },
  // update:grid — the edited grid (the surface patches the draft);
  // minted — { id, skeletonId, hash, name } once every key is set;
  // discard — the author gave it up.
  emits: ['update:grid', 'minted', 'discard'],
  setup (props, { emit }) {
    const local = ref(clone(props.grid))
    watch(() => props.grid, (g) => { local.value = clone(g) }, { deep: true })
    function clone (g) {
      return {
        id: g.id,
        keys: Array.isArray(g.keys) ? g.keys.map(k => (k ? { id: k.id, name: k.name } : null)) : [null, null],
        cells: Array.isArray(g.cells) ? [...g.cells] : ['', ''],
        axis: g.axis === 'row' ? 'row' : 'col'
      }
    }
    const push = () => emit('update:grid', clone(local.value))

    const name = computed(() => (props.titleHint || '').trim() || 'skeleton')
    const setCount = computed(() => local.value.keys.filter(Boolean).length)
    const ready = computed(() => local.value.keys.length > 0 && setCount.value === local.value.keys.length)
    const notice = computed(() => {
      if (minting.value) return 'creating…'
      if (ready.value) return 'every key set — creating'
      const missing = local.value.keys.length - setCount.value
      return `pick every key to create this skeleton — ${missing} of ${local.value.keys.length} to go`
    })
    const usedIds = computed(() => local.value.keys.filter(Boolean).map(k => k.id))

    const matrix = computed(() => {
      const n = local.value.keys.length
      const keys = Array.from({ length: n }, (_, i) => ({ kind: 'key', i }))
      const cells = Array.from({ length: n }, (_, i) => ({ kind: 'cell', i }))
      if (local.value.axis === 'row') {
        return [[...keys, { kind: 'ghost-key', i: n }], [...cells, { kind: 'ghost-cell', i: n }]]
      }
      const lines = keys.map((k, i) => [k, cells[i]])
      lines.push([{ kind: 'ghost-key', i: n }, { kind: 'ghost-cell', i: n }])
      return lines
    })

    const pickerFor = ref(null)
    const onPicked = (i, leaf) => {
      pickerFor.value = null
      if (!leaf?.id) return
      local.value.keys[i] = { id: leaf.id, name: leaf.name }
      push()
    }
    const addKey = () => {
      local.value.keys.push(null)
      local.value.cells.push('')
      push()
    }
    const removeKey = (i) => {
      if (local.value.keys.length <= 1) return
      local.value.keys.splice(i, 1)
      local.value.cells.splice(i, 1)
      if (pickerFor.value === i) pickerFor.value = null
      push()
    }
    const setCell = (i, v) => {
      local.value.cells[i] = v
      push()
    }
    const flipAxis = () => {
      local.value.axis = local.value.axis === 'col' ? 'row' : 'col'
      push()
    }

    // ── the mint ─────────────────────────────────────────────────────
    const minting = ref(false)
    const error = ref('')
    const mint = async () => {
      if (minting.value || !ready.value) return
      minting.value = true
      error.value = ''
      try {
        const keys = local.value.keys
        const slots = keys.map(k => ({ labelId: k.id }))
        // A schema name is a template identity — retry past a collision
        // with a counter rather than fail the author for a busy word.
        let head = null
        for (let n = 0; n < 8 && !head; n++) {
          const tryName = n === 0 ? name.value : `${name.value} ${n + 1}`
          try {
            const r = await skeletonService.createTemplate(tryName, slots)
            if (r.success) head = r.skeleton
            else if (r.error?.code !== 40901) throw new Error(r.error?.message || 'could not create the schema')
          } catch (e) {
            // axios throws on the 409 the collision answers with — read
            // the envelope and try the next name.
            const code = e?.response?.data?.error?.code
            if (code !== 40901) throw e
          }
        }
        if (!head) throw new Error('could not find a free name for the schema')
        const initialValues = {}
        keys.forEach((k, i) => {
          const v = String(local.value.cells[i] || '').trim()
          if (v) initialValues[k.name] = { text: v }
        })
        const inst = await skeletonService.instantiateById(head.id, initialValues)
        if (!inst.success) throw new Error(inst.error?.message || 'could not create the skeleton')
        if (local.value.axis === 'row') {
          try { await skeletonService.setAxis(inst.skeleton.id, 'row') } catch (_) { /* presentation only */ }
        }
        const walk = await skeletonService.walk(inst.skeleton.id)
        const hash = walk.success ? walk.skeleton.path : inst.skeleton.path
        emit('minted', { id: local.value.id, skeletonId: inst.skeleton.id, hash, name: head.name })
      } catch (e) {
        error.value = e?.response?.data?.error?.message || e?.message || 'could not create the skeleton'
      }
      minting.value = false
    }
    watch(ready, (v) => { if (v) mint() })

    return { local, name, ready, notice, usedIds, matrix, pickerFor, onPicked, addKey, removeKey, setCell, flipAxis, minting, error }
  }
})
</script>

<style lang="scss" scoped>
.draft-grid {
  border: 1px dashed var(--grey-6, #9e9e9e);
  border-radius: 6px;
  background: var(--grey-2, #f5f5f5);
  padding: 4px;
  &.is-ready { border-style: solid; }
}
.draft-grid__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px 4px;
  font-size: 0.74em;
  color: var(--brown-8, #4e342e);
}
.draft-grid__glyph { color: var(--brown-4, #a1887f); }
.draft-grid__title { font-size: 0.95em; }
.draft-grid__notice {
  font-size: 0.86em;
  color: var(--coral-deep, #c05a4e);
  &.is-ready { color: #2e8b57; }
}
.draft-grid__tool,
.draft-grid__ghost-btn,
.draft-grid__key-x {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 2px;
  border: none;
  background: none;
  color: var(--brown-4, #a1887f);
  cursor: pointer;
  font: inherit;
  &:hover { color: var(--teal-12, #00b8d4); }
}
.draft-grid__tool--x:hover,
.draft-grid__key-x:hover { color: var(--coral-deep, #c05a4e); }

.draft-grid__grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: var(--grey-3, #eeeeee);
  border: 1px solid var(--grey-4, #e0e0e0);
  border-radius: 4px;
}
.draft-grid__c {
  position: relative;
  padding: 3px 6px;
  border-bottom: 1px solid var(--grey-4, #e0e0e0);
  vertical-align: top;
  text-align: left;
  min-width: 0;
}
.draft-grid__line:last-child .draft-grid__c { border-bottom: none; }
.is-row .draft-grid__c + .draft-grid__c { border-left: 1px solid var(--grey-4, #e0e0e0); }
.is-col .draft-grid__key { width: 34%; border-right: 1px solid var(--grey-4, #e0e0e0); }

.draft-grid__key {
  background: var(--grey-4, #e0e0e0);
  &.is-empty { background: repeating-linear-gradient(135deg, var(--grey-4, #e0e0e0) 0 6px, rgba(255, 255, 255, 0.5) 6px 12px); }
}
.draft-grid__key-btn {
  max-width: calc(100% - 16px);
  padding: 0;
  border: none;
  background: none;
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--brown-8, #4e342e);
  cursor: pointer;
  text-align: left;
  word-break: break-word;
  .is-empty & { color: var(--coral-deep, #c05a4e); font-style: italic; text-transform: none; font-weight: 600; }
  &:hover { box-shadow: inset 0 -1px 0 var(--teal-12, #00b8d4); }
}
.draft-grid__key-x { margin-left: 2px; vertical-align: middle; }
.draft-grid__key--ghost,
.draft-grid__cell--ghost {
  background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(0, 0, 0, 0.03) 6px 12px);
}
.draft-grid__ghost-btn {
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}
.draft-grid__input {
  width: 100%;
  height: 22px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 0.78em;
  color: var(--brown-8, #4e342e);
  outline: none;
  &:focus { border-color: var(--teal-12, #00b8d4); background: #fff; }
}
.draft-grid__picker {
  position: absolute;
  z-index: 6;
  left: 0;
  top: 100%;
  min-width: 240px;
  max-width: 360px;
  padding: 6px;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}
.draft-grid__picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.66em;
  color: var(--brown-4, #a1887f);
}
.draft-grid__error {
  padding: 2px 4px;
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}
</style>
