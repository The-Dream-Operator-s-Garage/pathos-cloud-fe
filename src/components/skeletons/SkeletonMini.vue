<template>
  <!-- THE SKELETON MINI (skeletons plan phase 2, 2026-09-01 — born
       ResourceSkeletonMini on 2026-08-10, the embeddable mini table; the
       name is the one the dead 2026-07 SkeletonMini left behind). The face
       a skeleton ref wears when quoted into a post body, dealt into a
       dashboard cell, listed by the reference browser, or previewed in
       the composer: MiniPanel chrome in the web-media mini's grammar —
       NodeMini's header ROW of hairline-split zones (the address chip +
       copy button · the name · the integrity dot · the lock · the layout
       switch · the CORNER BUTTON that spawns the skeleton's own flyout
       window) over a SkeletonTable body and a provenance foot (schema ·
       keys · author · lock), the way a YouTube mini's foot says
       PROVIDER :: url.

       ⭐ 2026-09-17 — ONE VIEWER, EVERY SURFACE (user ask: "the chip with
       the copy button is on its own row, as is the title, the lock and
       the expand button — we want them all on a single row … the same
       viewer from the feed on the dashboard board … the layout switch
       and the nestability properly enabled for both … the same green dot
       and verification process for the skeletons"):
       · the header is a ROW again — the panel's default head is a flex
         COLUMN, and the `:deep` override here said `display: flex` and
         nothing else, so the four zones inherited the column and stacked
         into a tower (the gotcha NodeMini already paid for; the reset is
         restated on the style below);
       · the INTEGRITY DOT — `skeleton.integrity` off the walk, the
         skeleton's own verdict (its spine path + every live spine link,
         integrityService.verifySkeletonSync): green proof-verified, red
         violated (click → Talavero's report), lawful-unproven draws
         nothing. A violated spine WITHHELDS the keys (`slots_withheld`),
         and the body wears the withheld face instead of an empty grid;
       · the LAYOUT SWITCH — the flyout's toggle, on the mini: a VIEW
         setting (never an AXIS write) remembered per browser under the
         flyout's own key, so a skeleton lies the same way in a post, on
         a board and in its window. Top-level minis only; nested ones
         follow the layout handed down;
       · `enriched` is ON by default — nested skeletons (cell-bound, list
         members) render as minis on the feed and the board, not only in
         the flyout, so the whole tree reads one way everywhere.

       The grid inside owns every edit (keys, cells, axis — see
       SkeletonTable); this panel owns the NAME (double-click, owner) and
       the LOCK (owner; a locked skeleton freezes keys and cells, 40303).

       Recursion rides the grid: a cell bound to another skeleton renders
       that skeleton's grid inline (depth budget 2, cycle chip), so this
       panel no longer nests panels — `depth`/`visited` pass through.

       NOT a router-link (the grid's popovers and nested grids would nest
       anchors); the head carries explicit doors instead.

       bodyFit lifts MiniPanel's 110px excerpt cap — a grid's size is its
       meaning — and the body brings ITS OWN scroll contract in exchange:
       `--skel-mini-max-h`, published by the surface (dashboard cells;
       silence = uncapped). A NESTED mini ignores it: its host's scroll
       already bounds it, and a cap inside a cap is a scrollbar inside a
       scrollbar.

       Re-toning: NodeMini's dial pattern — `--skel-mini-coat/-rule/
       -rule-hover/-head-ink` repaint the CHROME; the grid inside listens
       to its own `--skel-table-*` dials, which pass through untouched.

       ⭐ 2026-09-21 PM6 — BROWN, AND THE MITRE (user ask: the footer's
       yellow section is SCHEMA creation and keeps its yellow; "for all the
       SKELETONS that are used on dashboards, flyouts and references
       (populated skeletons) … re-paint them to quasar brown tones … use
       the material 'mitre' icon instead of the SCHEMAS one"). The dials'
       DEFAULTS are the skeleton family's ladder now (`--skeleton-*` in
       _tokens.scss: coat brown-1, rule brown-3, hover brown-6, ink
       brown-8) instead of the flyout's greys, the SCHEMA badge washes in
       brown-7 instead of teal, and every teal-12 hover on the row is the
       family's brown-6. The foot's glyph reads `is_schema`: a schema keeps
       `schema`, a populated skeleton wears kinds.js's `sym_o_mitre` — the
       same split the address pill, the flyout head and the explorer make. -->
  <div v-if="loading" class="skel-mini__loading">
    <q-spinner size="14px" color="primary" />
  </div>

  <InfoChip v-else-if="failed" :kind="'skeletons'" :address="addressOf" :label="name" />

  <!-- GITHUB_PR instances keep their native card, bare — the chrome would
       double-frame a card that is already one. -->
  <SkeletonTable v-else-if="isGithubPr" :skeleton="head" :slots="slotRows" />

  <div
    v-else
    class="skel-mini"
    :class="{ 'is-locked': head.locked, 'is-sealed': sealed, 'is-schema': head.is_schema, 'is-nested': depth > 0, 'is-withheld': withheld }"
  >
    <MiniPanel body-fit>
      <template #head>
        <!-- The address chip + its copy button: WHAT IT IS first. -->
        <span class="skel-mini__zone skel-mini__zone--chip">
          <!-- THE STOCK NANO PILL since 2026-09-21 PM (user ask: the very same
               chip everywhere, NodeMini's header pill the reference) — an
               InfoChip stood here until then. The verdict off the walk
               leads it. ⭐ PM3 (user ask: the collapsed state on mini
               headers): `collapsed` — `● | ⌬ :: 993fa6…`, no type word, six
               digits, no door glyph (the corner is this panel's door; the
               pill's root click still opens the same window). -->
          <MicroChip kind="skeletons" :id="head.id" :path="head.path" :integrity="head.integrity" collapsed />
          <button
            type="button"
            class="skel-mini__copy"
            :class="{ 'is-copied': copied }"
            :title="copied ? 'address copied' : 'copy the full skeleton address'"
            @click.stop.prevent="copyAddress"
          >
            <q-icon :name="copied ? 'check' : 'content_copy'" size="10px" />
          </button>
        </span>

        <!-- The name — the one elastic zone. Double-click renames (owner,
             unlocked): the name is data, `PUT /skeletons/:id/name`. -->
        <span class="skel-mini__zone skel-mini__zone--name" :title="renameHint">
          <input
            v-if="renaming"
            ref="renameInput"
            v-model="renameText"
            type="text"
            class="skel-mini__rename mono"
            @keydown.enter.prevent="commitRename"
            @keydown.esc="renaming = false"
            @blur="commitRename"
            @click.stop
          >
          <span
            v-else
            class="skel-mini__name-text"
            :class="{ 'is-editable': canRename }"
            @dblclick.stop.prevent="canRename && beginRename()"
          >{{ headline }}</span>
          <span v-if="head.is_schema" class="skel-mini__schema">SCHEMA</span>
        </span>

        <!-- (THE DOT'S OWN ZONE stood here 2026-09-17 → 2026-09-21 —
             `.skel-mini__zone--dot`, an 8px light between the name and the
             lock. User ask: "remove the green dot next to the lock as the
             verification information is already on the pill" — the InfoChip
             in the chip zone resolves this skeleton's summary and wears
             `summary.integrity` as its own trailing dot, the same
             verifySkeletonSync verdict, red-click → report included. Two
             lights saying one thing was one too many. The row is
             `chip+copy │ name │ lock │ layout │ open`.) -->

        <!-- The lock: every owned skeleton since phase 0. A locked one
             refuses every key and cell write (403 40303); flips are
             versioned NOTEs on the element header — receipts. -->
        <button
          v-if="isOwner"
          type="button"
          class="skel-mini__zone skel-mini__lock"
          :class="{ 'is-locked': head.locked }"
          :title="lockTitle"
          :disabled="lockBusy"
          @click.stop.prevent="toggleLock"
        >
          <q-icon :name="lockGlyph" size="11px" />
        </button>
        <span v-else-if="head.locked" class="skel-mini__zone skel-mini__lock is-locked" :title="lockTitle">
          <q-icon :name="lockGlyph" size="11px" />
        </span>

        <!-- THE LAYOUT SWITCH (2026-09-17) — ElementFlyout's toggle, on the
             mini. Wears the glyph of the layout it OFFERS: swap_horiz while
             the grid stands vertical (keys down the first column, lists as
             columns), swap_vert while it lies horizontal (keys across the
             top, lists flowing left → right). A VIEW setting, never a write
             — the stored AXIS is untouched — and remembered per browser
             under the flyout's own key (`pathos_skeleton_layout`), so the
             post, the board and the window agree. Top-level minis only: a
             nested mini lies the way its host laid it, and one switch per
             tree is the whole point. The grid's own corner flips the same
             setting (`update:layout`). -->
        <button
          v-if="depth === 0 && !withheld"
          type="button"
          class="skel-mini__zone skel-mini__zone--layout"
          :class="{ 'is-horizontal': shownLayout === 'horizontal' }"
          :title="layoutTitle"
          @click.stop.prevent="toggleLayout"
        >
          <q-icon :name="shownLayout === 'horizontal' ? 'swap_vert' : 'swap_horiz'" size="10px" />
        </button>

        <!-- THE CORNER: this skeleton in its own floating window (the
             `?flyout=` door as a button — NodeMini's corner, verbatim). -->
        <button
          type="button"
          class="skel-mini__zone skel-mini__zone--open"
          title="open in the flyout viewer"
          @click.stop.prevent="openViewer"
        >
          <q-icon name="open_in_full" size="10px" />
        </button>
      </template>

      <template #body>
        <div v-if="editError" class="skel-mini__error">{{ editError }}</div>
        <!-- THE WITHHELD FACE (2026-09-17): the walk already emptied the
             slots (`slots_withheld`), and instead of pretending an empty
             table the panel says so — NodeMini's `.node-mini__withheld`
             grammar, the whole line clicking through to the report. -->
        <div
          v-if="withheld"
          class="skel-mini__withheld"
          role="button"
          :title="integrityTitle || 'keys withheld — integrity check failed'"
          @click.stop.prevent="openIntegrityReport"
        >
          <q-icon name="report" size="12px" />
          <span>keys withheld — integrity check failed{{ integrityReport ? ' · open Talavero\'s report' : '' }}</span>
        </div>
        <div v-else class="skel-mini__scroll">
          <SkeletonTable
            :skeleton="head"
            :slots="slotRows"
            :depth="depth"
            :visited="visited"
            :layout="effectiveLayout"
            :readonly="readonly"
            :enriched="enriched"
            @changed="refresh"
            @update:layout="setLayout"
          />
        </div>
      </template>

      <!-- The provenance foot: what this skeleton is an instance of, how
           many keys, who owns it, and whether it is frozen. -->
      <template #foot>
        <span class="skel-mini__foot-line" :title="footTitle">
          <q-icon :name="head.is_schema ? 'schema' : skeletonKind.icon" size="10px" />
          <span class="skel-mini__foot-schema">{{ footSchema }}</span>
          <span class="skel-mini__foot-dot">·</span>
          <span v-if="withheld" class="skel-mini__foot-withheld mono">keys withheld</span>
          <span v-else class="skel-mini__foot-keys mono">{{ slotRows.length }} {{ slotRows.length === 1 ? 'key' : 'keys' }}</span>
          <template v-if="author">
            <span class="skel-mini__foot-dot">·</span>
            <span class="skel-mini__foot-author">by {{ author }}</span>
          </template>
          <template v-if="head.locked">
            <span class="skel-mini__foot-dot">·</span>
            <span class="skel-mini__foot-lock">{{ head.lock_state === 'unproven' ? 'lock unproven' : (head.lock_state === 'sealed' ? 'sealed version' : 'locked') }}</span>
          </template>
        </span>
      </template>
    </MiniPanel>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import SkeletonTable from 'src/components/skeletons/SkeletonTable.vue'
import { skeletonService } from 'src/services/skeleton.service'
import { refService } from 'src/services/ref.service'
import { useAuthStore } from 'src/stores/auth'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { kindFor } from 'src/utils/kinds'

// One summary per address per session — the foot's author line must not
// cost a dashboard of twelve minis twelve round-trips on every reload.
const summaryCache = new Map()

// The layout preference's key — ElementFlyout's, deliberately: one
// setting, every surface (2026-09-17).
const LAYOUT_KEY = 'pathos_skeleton_layout'

export default defineComponent({
  name: 'SkeletonMini',
  components: { MiniPanel, InfoChip, MicroChip, SkeletonTable },
  props: {
    // Pre-walked mode (dashboard cells deal batch-walk results out).
    skeleton: { type: Object, default: null },
    slots: { type: Array, default: null },
    // Self-resolving mode: numeric id or 'skeletons/<hash>' address.
    refOrId: { type: [String, Number], default: null },
    // Labels the failure chip.
    name: { type: String, default: '' },
    // Recursion guards, passed through to the grid.
    depth: { type: Number, default: 0 },
    visited: { type: Array, default: () => [] },
    // THE HOST'S LAYOUT ('vertical' | 'horizontal'), when a host owns it:
    // a nested mini takes its parent grid's; the flyout hands its toggle
    // down through the grid. null (the top-level default) = this mini owns
    // the setting itself — the header switch + the browser's remembered
    // choice (2026-09-17; was a bare pass-through since 2026-09-06 PM).
    layout: { type: String, default: null },
    // A host that shows the grid as evidence only.
    readonly: { type: Boolean, default: false },
    // Skeletons inside this one render as minis too, so the whole tree
    // reads the same way (the NAVIGATION skeleton's stops and their
    // sub-stacks). ON by default since 2026-09-17 — the feed and the board
    // nest the way the flyout does; a host that wants bare grids says so.
    enriched: { type: Boolean, default: true }
  },
  // resolved mirrors SkeletonTable's emit; changed tells a pre-walked
  // host (the dashboard grid) its batch data went stale after a write;
  // update:layout asks a host that OWNS the layout for the other one.
  emits: ['resolved', 'changed', 'update:layout'],
  setup (props, { emit }) {
    const auth = useAuthStore()
    const flyouts = useFlyoutViewersStore()
    const router = useRouter()
    const loading = ref(false)
    const failed = ref(false)
    const walked = ref(null)
    const walkedSlots = ref([])

    const preWalked = computed(() => Array.isArray(props.slots))
    const addressOf = computed(() =>
      typeof props.refOrId === 'string' && props.refOrId.includes('/') ? props.refOrId : ''
    )

    const load = async () => {
      if (preWalked.value) { emitResolved(props.skeleton); return }
      if (props.refOrId == null) { failed.value = true; return }
      loading.value = walked.value == null
      failed.value = false
      try {
        let id = Number(props.refOrId)
        if (!Number.isFinite(id) || String(props.refOrId).includes('/')) {
          const s = await refService.summary(String(props.refOrId))
          id = s.success ? s.summary?.id : null
          if (s.success && s.summary) summaryCache.set(String(props.refOrId).replace(/^pathos:/, ''), s.summary)
        }
        if (id == null) throw new Error('unresolvable')
        const r = await skeletonService.walk(id)
        if (!r.success) throw new Error('walk failed')
        walked.value = r.skeleton
        walkedSlots.value = r.slots || []
        emitResolved(r.skeleton)
      } catch (_) {
        failed.value = true
        walked.value = null
        walkedSlots.value = []
      }
      loading.value = false
    }
    const emitResolved = (sk) => {
      if (!sk) return
      emit('resolved', { id: sk.id, name: sk.name, path: sk.path, is_schema: sk.is_schema })
    }
    onMounted(load)
    watch(() => props.refOrId, load)

    const head = computed(() => (preWalked.value ? props.skeleton : walked.value) || {})
    const slotRows = computed(() => (preWalked.value ? props.slots : walkedSlots.value) || [])
    const isGithubPr = computed(() => head.value.name === 'GITHUB_PR' && !head.value.is_schema)
    const headline = computed(() => props.name || head.value.name || ('Skeleton #' + head.value.id))
    const skeletonKind = kindFor('skeletons')

    // The foot's author: the summary's `author.username`, fetched once
    // per address and only for top-level minis.
    const author = ref('')
    const loadAuthor = async () => {
      const p = head.value.path
      if (!p || props.depth > 0) return
      let s = summaryCache.get(p)
      if (!s) {
        try {
          const r = await refService.summary(p)
          if (r.success && r.summary) { s = r.summary; summaryCache.set(p, s) }
        } catch (_) { /* nameless foot */ }
      }
      author.value = s?.author?.username || ''
    }
    watch(() => head.value.path, loadAuthor, { immediate: true })

    const footSchema = computed(() => {
      const h = head.value
      if (h.is_schema) return 'schema'
      return h.schema ? ('instance of ' + (h.schema.name || ('#' + h.schema.id))) : 'skeleton'
    })
    const footTitle = computed(() => {
      const h = head.value
      const bits = [h.path]
      if (h.schema) bits.push('schema #' + h.schema.id + (h.schema.locked ? ' (keys locked)' : ''))
      if (h.axis) bits.push('axis ' + h.axis)
      return bits.filter(Boolean).join(' · ')
    })

    // ── the verdict (2026-09-17) ──────────────────────────────────────
    // `skeleton.integrity` rides the walk (and the chip summary): 'ok' →
    // green, 'violated' → red + the slots came back withheld; exempt and
    // absent draw nothing (no claim, never a guess).
    const integrityState = computed(() => {
      const s = head.value.integrity?.status
      return s === 'ok' || s === 'violated' ? s : null
    })
    const integrityReport = computed(() => head.value.integrity?.report || null)
    const withheld = computed(() => head.value.slots_withheld === true)
    const integrityTitle = computed(() => {
      if (integrityState.value === 'ok') return 'proof verified — the spine and every live key link'
      if (integrityState.value !== 'violated') return null
      const i = head.value.integrity || {}
      const where = i.element && !String(i.element).startsWith('skeletons/') ? ` on ${i.element}` : ''
      const what = (i.check || 'integrity') + where
      return integrityReport.value
        ? `integrity violated: ${what} — click for Talavero's report`
        : `integrity violated: ${what} — report unavailable`
    })
    const openIntegrityReport = () => {
      if (integrityReport.value) {
        router.push({ path: '/feed', query: { flyout: integrityReport.value } })
      }
    }

    // ── the layout (2026-09-17) ───────────────────────────────────────
    // Host-owned when the `layout` prop is set (nested minis, a flyout
    // tree); otherwise this mini's own — the browser's remembered choice,
    // or null = the skeleton's stored AXIS until the reader chooses.
    const loadLayout = () => {
      try {
        const v = localStorage.getItem(LAYOUT_KEY)
        return v === 'horizontal' || v === 'vertical' ? v : null
      } catch (_) { return null }
    }
    const localLayout = ref(loadLayout())
    const effectiveLayout = computed(() => (props.layout != null ? props.layout : localLayout.value))
    // What the grid is SHOWING — the layout in force, else the stored axis.
    const shownLayout = computed(() => effectiveLayout.value || (head.value.axis === 'row' ? 'horizontal' : 'vertical'))
    const setLayout = (v) => {
      const next = v === 'horizontal' ? 'horizontal' : 'vertical'
      if (props.layout != null) { emit('update:layout', next); return }
      localLayout.value = next
      try { localStorage.setItem(LAYOUT_KEY, next) } catch (_) { /* preference only */ }
    }
    const toggleLayout = () => setLayout(shownLayout.value === 'horizontal' ? 'vertical' : 'horizontal')
    const layoutTitle = computed(() => (shownLayout.value === 'horizontal'
      ? 'Lay the skeleton out vertically — keys down the first column, lists as columns'
      : 'Lay the skeleton out horizontally — keys across the top, lists flowing left to right'))

    // ── the doors ─────────────────────────────────────────────────────
    const openViewer = () => {
      if (head.value.path) flyouts.spawnRef(head.value.path)
    }
    const copied = ref(false)
    const copyAddress = async () => {
      try {
        await navigator.clipboard.writeText(head.value.path || '')
        copied.value = true
        setTimeout(() => { copied.value = false }, 1600)
      } catch (_) { /* denied — the mark never flips */ }
    }

    // ── name (data) ───────────────────────────────────────────────────
    // Owner, or a member mask of an organization holding this skeleton on
    // its RESOURCES path (phase 5 — `can_write` off the walk).
    const isOwner = computed(() => (head.value.owner_id != null && head.value.owner_id === auth.entityId) || !!head.value.can_write)
    const canRename = computed(() => !props.readonly && isOwner.value && !head.value.locked && head.value.id != null && !String(head.value.name || '').startsWith('ELEMENT:'))
    const renameHint = computed(() => canRename.value ? 'double-click to rename' : headline.value)
    const renaming = ref(false)
    const renameText = ref('')
    const renameInput = ref(null)
    const beginRename = () => {
      renaming.value = true
      renameText.value = head.value.name || ''
      nextTick(() => renameInput.value?.focus?.())
    }
    const commitRename = async () => {
      if (!renaming.value) return
      renaming.value = false
      const next = String(renameText.value).trim()
      if (!next || next === head.value.name) return
      try {
        const r = await skeletonService.rename(head.value.id, next)
        if (!r.success) { flashError(r.error?.message || 'Could not rename'); return }
        await refresh()
      } catch (e) { flashError(e?.response?.data?.error?.message || 'Could not rename') }
    }

    // ── the lock ──────────────────────────────────────────────────────
    const editError = ref('')
    const flashError = (m) => {
      editError.value = m || ''
      if (m) setTimeout(() => { editError.value = '' }, 4000)
    }
    const refresh = async () => {
      if (preWalked.value) { emit('changed'); return }
      await load()
    }
    const lockBusy = ref(false)
    const sealed = computed(() => head.value.lock_state === 'sealed')
    const lockGlyph = computed(() => {
      if (head.value.lock_state === 'unproven') return 'gpp_maybe'
      if (sealed.value) return 'verified'
      return head.value.locked ? 'lock' : 'lock_open'
    })
    const lockTitle = computed(() => {
      if (head.value.lock_state === 'unproven') return 'Lock unproven — the LOCK node is violated; see the integrity incident'
      if (sealed.value) return 'A sealed version — seals never open; fork it to work on a copy'
      if (head.value.locked) return isOwner.value ? 'Locked — click to unlock' : 'Locked'
      return 'Unlocked — click to lock (freezes keys and cells)'
    })
    const toggleLock = async () => {
      if (sealed.value) return
      lockBusy.value = true
      try {
        const r = head.value.locked
          ? await skeletonService.unlock(head.value.id)
          : await skeletonService.lock(head.value.id)
        if (!r.success) flashError(r.error?.message || 'Lock flip failed')
        else if (r.pending) flashError('Asked your manager — the flip lands once the poll in your conversation is approved; click again then.')
        await refresh()
      } catch (e) {
        flashError(e?.response?.data?.error?.message || 'Lock flip failed')
      }
      lockBusy.value = false
    }

    return {
      loading,
      failed,
      addressOf,
      head,
      slotRows,
      isGithubPr,
      headline,
      skeletonKind,
      author,
      footSchema,
      footTitle,
      integrityReport,
      integrityTitle,
      withheld,
      openIntegrityReport,
      effectiveLayout,
      shownLayout,
      setLayout,
      toggleLayout,
      layoutTitle,
      openViewer,
      copied,
      copyAddress,
      isOwner,
      canRename,
      renameHint,
      renaming,
      renameText,
      renameInput,
      beginRename,
      commitRename,
      editError,
      refresh,
      lockBusy,
      lockTitle,
      lockGlyph,
      sealed,
      toggleLock
    }
  }
})
</script>

<style lang="scss" scoped>
.skel-mini__loading {
  padding: 6px 0;
}

.skel-mini {
  // NodeMini's dial pattern: the chrome listens to four dials, consumed
  // with fallbacks. Defaults = THE SKELETON FAMILY'S BROWN LADDER since
  // 2026-09-21 PM6 (`--skeleton-*`, _tokens.scss) — the flyout's greys
  // before that day; the grid inside falls back to the same ladder.
  --sm-ink: var(--skel-mini-head-ink, var(--skeleton-ink, #5d4037));
  --sm-rule: var(--skel-mini-rule, var(--skeleton-rule, #bcaaa4));

  :deep(.mini-panel) {
    --panel-chrome: var(--skel-mini-coat, var(--skeleton-coat, #efebe9));
    --panel-body: var(--skel-mini-coat, var(--skeleton-coat, #efebe9));
    --panel-rule: var(--sm-rule);
  }
  :deep(.mini-panel--hover):hover {
    --panel-rule: var(--skel-mini-rule-hover, var(--skeleton-hover, #795548));
  }
  // The header is one ROW of zones, split by full-height vertical
  // hairlines — which is why the zone padding lives on the zones and not
  // on the header (a padded header would inset the rules).
  // `flex-direction` and `gap` are RESETS, not decoration (2026-09-17):
  // MiniPanel's default head is a flex COLUMN of zones with a 4px gap, and
  // an override that only said `display: flex` inherited both — the chip,
  // the name, the lock and the corner stacked into a tower, one per line.
  // NodeMini paid for this exact lesson on 2026-08-23 (gotchas.md).
  :deep(.mini-panel__head--own) {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    min-width: 0;
    padding: 0;
  }
}

// ── the header zones (NodeMini's grammar) ────────────────────────────
.skel-mini__zone {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 4px;
  color: var(--sm-ink);
  // ONE LINE, ALWAYS: a header that grows a second line changes the
  // panel's height from its content, which a dense band must not do.
  white-space: nowrap;
  overflow: hidden;
  // The vertical hairlines — one before every zone but the first, so the
  // count follows the zones and no rule can end up hanging at an edge.
  & + & { border-left: 1px solid var(--sm-rule); }
}
.skel-mini__zone--chip {
  flex: 0 1 auto;
  gap: 2px;
  // THE PILL STANDS 1px OFF THE HEAD'S LEFT EDGE (⭐ 2026-09-21 PM8, user
  // ask: "reduce the padding on the left, between the left side of the
  // header container and the pill so the padding is consistent with the
  // top and bottom one") — the zone rule's 4px side air, on the first zone,
  // was the only air between the head's edge and the pill; 1px read "too
  // close" (a round end meets a straight edge at a tangent), 2px is where
  // it settled ("add a little more padding. just a little"). The right side
  // keeps the zone's 4px: that is the seam before the name zone's hairline,
  // not an edge. (NodeMini's chip zone says the same.)
  padding-left: 2px;
  // (The pill's corners were restated here — `:deep(.info-chip) {
  // border-radius: --radius-pill }` — for the InfoChip that stood in this
  // zone 2026-09-21 AM → PM; the stock MicroChip carries them itself.)
}
.skel-mini__zone--name {
  flex: 1 1 auto;
  justify-content: center;
  gap: 6px;
}
// The label itself, and the only run here allowed to disappear. The
// display face declared directly rather than through the `.nasalization`
// utility (NodeMini's reason): the utility also tracks the letters
// 0.05em, which at this size costs about a character of the ellipsis.
.skel-mini__name-text {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.76em;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  &.is-editable { cursor: text; }
  &.is-editable:hover { box-shadow: inset 0 -1px 0 var(--skeleton-hover, #795548); }
}
.skel-mini__rename {
  flex: 1 1 auto;
  min-width: 0;
  height: 18px;
  padding: 0 4px;
  border: 1px solid var(--sm-rule);
  border-radius: 3px;
  background: #fff;
  font-size: 0.74em;
  color: var(--sm-ink);
  outline: none;
}
.skel-mini__schema {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 3px;
  // The badge in the family's own wash (brown-7 at 12%, its rim at 45%,
  // brown-10 letters) — teal #00829c until 2026-09-21 PM6.
  border: 1px solid rgba(var(--brown-7-rgb, 109, 76, 65), 0.45);
  background: rgba(var(--brown-7-rgb, 109, 76, 65), 0.12);
  color: var(--skeleton-chip-ink, #3e2723);
  font-size: 0.6em;
  letter-spacing: 0.06em;
  font-weight: 600;
}
// The real <button>s in the row — reset to the zone's own face so the
// chrome stays the zone's and the cursor is the one tell.
.skel-mini__copy,
.skel-mini__lock,
.skel-mini__zone--layout,
.skel-mini__zone--open {
  appearance: none;
  background: none;
  border: 0;
  font: inherit;
  cursor: pointer;
  color: inherit;
}
// The copy button: a bare glyph on the chip's line, the zone's ink at 60%
// so it reads as an affordance ON the chip rather than a second object;
// full ink under the pointer, `--positive` for the 1600ms the check shows.
.skel-mini__copy {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: 3px;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.12s, color 0.12s;
  &:hover { opacity: 1; }
  &.is-copied { opacity: 1; color: var(--positive, #21ba45); }
}
// (`.skel-mini__zone--dot` stood here 2026-09-17 → 2026-09-21; the verdict
// light is the address pill's own — see the template note where the zone
// stood.)
.skel-mini__lock {
  flex: 0 0 auto;
  &:hover { color: var(--skeleton-hover, #795548); }
  &.is-locked { color: var(--coral-deep, #c05a4e); }
  &:disabled { opacity: 0.5; cursor: default; }
}
.skel-mini.is-sealed .skel-mini__lock { color: #2e8b57; cursor: default; }
.skel-mini__zone--layout {
  flex: 0 0 auto;
  &:hover { color: var(--skeleton-hover, #795548); }
}
.skel-mini__zone--open {
  flex: 0 0 auto;
  &:hover { color: var(--coral-deep, #d35f5f); }
}

// ── The withheld face (2026-09-17) ───────────────────────────────────
// (`.skel-mini__integrity`, the panel's own 8px dot at NodeMini's scale,
// stood here 2026-09-17 → 2026-09-21. The pill's `.info-chip__integrity`
// is the one light now — same palette, same red-only click.)
.skel-mini__withheld {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 8px;
  font-size: 0.74em;
  color: #a03d3d;
  cursor: pointer;
}
.skel-mini__foot-withheld { color: #a03d3d; }

.skel-mini__error {
  padding: 2px 6px;
  font-size: 0.7em;
  color: var(--coral-deep, #c05a4e);
}

// The body's OWN scroll contract, in exchange for bodyFit: the surface
// publishes the ceiling (dashboard cells); silence = uncapped. A nested
// mini is already inside its host's scroll and ignores the ceiling —
// the custom property inherits, and a cap inside a cap is a scrollbar
// inside a scrollbar (2026-09-17).
.skel-mini__scroll {
  max-height: var(--skel-mini-max-h, none);
  overflow: auto;
}
.skel-mini.is-nested .skel-mini__scroll {
  max-height: none;
  overflow: visible;
}

// ── the provenance foot ──────────────────────────────────────────────
:deep(.mini-panel__foot) .skel-mini__foot-line,
.skel-mini__foot-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.7em;
  color: var(--sm-ink);
}
.skel-mini__foot-schema,
.skel-mini__foot-author { overflow: hidden; text-overflow: ellipsis; }
.skel-mini__foot-dot { opacity: 0.5; }
.skel-mini__foot-lock { color: var(--coral-deep, #c05a4e); }
</style>
