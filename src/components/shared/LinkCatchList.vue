<template>
  <!-- THE AUTHORING CATCH (2026-10-31) — the uploader's neon-teal link
       frame (2026-10-12), lifted out so the notepad and the post composer
       wear the very same one (`composables/useLinkCatch` holds the logic).
       One row per caught link or pasted file, shown only once both
       questions are answered (what is it, is it already the author's):
         NEW      the glowing teal row — glyph │ url / name + what it is │
                  Add link · Add file │ ×
         ALREADY  a calm row, no glow — "already in your pathchain · node
                  #id" │ Use it (the existing node's pill) │ ×
       Nothing at all while there is nothing new to say. -->
  <div v-if="catches.length" class="link-catches">
    <div
      v-for="c in catches" :key="c.key"
      class="link-catch"
      :class="{ 'is-dup': !!c.existing, 'is-busy': c.busy, 'is-error': !!c.error, 'is-file': c.kind === 'file' }"
      :data-kind="c.kind"
    >
      <q-icon :name="glyphOf(c)" size="15px" class="link-catch__icon" />
      <span class="link-catch__text">
        <span class="link-catch__url" :title="c.url || c.name">{{ c.kind === 'link' ? c.url : c.name }}</span>
        <span class="link-catch__meta">{{ metaOf(c) }}</span>
      </span>
      <q-btn
        v-if="c.existing"
        unelevated dense no-caps size="sm" icon="link"
        class="link-catch__use" label="Use it"
        :title="`Put node #${c.existing.id}'s pill here — nothing new is minted`"
        @click="$emit('use', c)"
      />
      <q-btn
        v-else-if="!c.error"
        unelevated dense no-caps size="sm" :icon="c.kind === 'link' ? 'add_link' : 'upload_file'"
        class="link-catch__add" :label="c.kind === 'link' ? 'Add link' : 'Add file'"
        :loading="c.busy" @click="$emit('add', c)"
      />
      <button
        type="button" class="link-catch__x"
        :title="c.kind === 'link' ? 'Keep it as plain text' : 'Leave the file out'"
        :disabled="c.busy" @click="$emit('dismiss', c)"
      >
        <q-icon name="close" size="12px" />
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

const FILE_GLYPH = [
  [/^image\//, 'image'], [/^video\//, 'movie'], [/^audio\//, 'music_note'], [/pdf$/, 'picture_as_pdf'], [/^text\//, 'description']
]

const sizeOf = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`)

export default defineComponent({
  name: 'LinkCatchList',
  props: {
    // useLinkCatch's `catches` — the READY ones of the host's scope.
    catches: { type: Array, default: () => [] }
  },
  emits: ['add', 'use', 'dismiss'],
  setup () {
    const glyphOf = (c) => {
      if (c.kind === 'link') return c.embed?.icon || c.existing?.icon || 'link'
      const t = c.file?.type || ''
      return (FILE_GLYPH.find(([re]) => re.test(t)) || [null, 'attach_file'])[1]
    }
    const metaOf = (c) => {
      if (c.error) return c.error
      const what = c.kind === 'link' ? (c.embed?.provider || '') : sizeOf(c.size || 0)
      if (c.existing) return `${what ? what + ' — ' : ''}already in your pathchain · node #${c.existing.id}`
      return c.kind === 'link'
        ? (what ? `${what} — add it as a link pill?` : 'add it as a link pill?')
        : `${what} — add it to your pathchain?`
    }
    return { glyphOf, metaOf }
  }
})
</script>

<style lang="scss" scoped>
// ── THE NEON teal frame (2026-10-12, moved here 2026-10-31): `--teal-13`
// (A400, the node family's loud accent) as a 1.5px rim with a `--teal-12`
// glow, on the field's pale. The rows never grow the host past its share —
// the list scrolls after three. ──
.link-catches {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  max-height: 120px;
  overflow-y: auto;
  // Room for the glow — an overflow box clips its children's shadows.
  padding: 4px;
  margin: -4px;
}

.link-catch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 8px;
  border: 1.5px solid var(--teal-13);
  border-radius: var(--radius-md);
  background: var(--teal-1);
  box-shadow: 0 0 0 2px rgba(29, 233, 182, 0.18), 0 0 10px rgba(100, 255, 218, 0.45);
  min-width: 0;

  &.is-error { border-color: var(--q-negative, #c10015); box-shadow: none; }
  // ALREADY IN YOUR PATHCHAIN — nothing new to light up: the frame's
  // calm cousin, a 1px rim in the family's mid teal, no glow.
  &.is-dup {
    border: 1px solid var(--teal-6);
    background: transparent;
    box-shadow: none;
  }
}

.link-catch__icon { color: var(--teal-10); flex-shrink: 0; }

.link-catch__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  line-height: 1.25;
}

.link-catch__url {
  font-family: var(--font-mono);
  font-size: 0.72em;
  color: var(--teal-10);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-catch__meta {
  font-size: 0.68em;
  color: var(--ink-mute);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .is-error & { color: var(--q-negative, #c10015); }
}

.link-catch__add {
  flex-shrink: 0;
  background: var(--teal-13);
  color: var(--teal-10);
  font-weight: 600;
}

.link-catch__use {
  flex-shrink: 0;
  background: transparent;
  color: var(--teal-10);
  border: 1px solid var(--teal-6);
  font-weight: 600;
}

.link-catch__x {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--teal-10);
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(0, 77, 64, 0.08); }
  &:disabled { opacity: 0.35; cursor: default; }
}
</style>
