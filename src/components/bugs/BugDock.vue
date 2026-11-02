<template>
  <!-- ── THE BUG DOCK (2026-11-02, user ask: "a big debug bug button of the
       caliber and style of the creation ones on the footer nav bar. This bug
       thing is nothing but a simple notepad that allows item references and
       screenshot attachments … public by default when saved, and mailed
       directly to allegue@pathos.cloud … enough for a user to report a
       failure or for me to write an idea that I want to feed into a prompt
       layer"). The creation footprint and its chrome, dial for dial — name
       plate, traffic lights, the slim frieze in the family's darkest rung,
       the tab strip worn as the KIND STRIP (Failure · Idea, the capture
       window's mode-strip grammar) — in the ROACH'S CHESTNUT (`--bugs-*`,
       _tokens.scss). The body is a notepad and three rows under it:
       SCREENSHOTS (snap the screen, pick an image, or paste/drop one
       anywhere on the window), REFS (this page's element, any element by
       search, or a [[pathos:…]] chip typed inline), CONTEXT (the page you
       are on, the viewport, the locale). The foot holds the two defaults
       the ask named — Public, on, and the address the letter goes to — and
       the one button. A report is a POST in the DEVELOPMENT family
       (api/services/bugReportService.js), so the receipts row draws posts. ── -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="bug-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('bugs') === 'right', 'is-snapping': snapping, 'is-dropping': dropping }"
      :data-dock-key="'bugs'"
      :style="{ zIndex: windows.zOf('bugs'), '--dock-right': windows.dockRight + 'px', '--trail-shift': windows.trailShiftOf('bugs') + 'px', '--dock-seat': 'var(--seat-bugs)', ...windows.winDragStyle('bugs') }"
      @paste="onPaste"
      @dragover.prevent="dropping = true"
      @dragleave.self="dropping = false"
      @drop.prevent="onDrop"
    >
      <header class="dock-bar">
        <span class="dock-bar__plate">
          <q-icon :name="ROACH" size="15px" class="dock-bar__icon" />
          <span class="dock-bar__title nasalization">Bugs</span>
        </span>
        <span class="dock-bar__meta mono">{{ meta }}</span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (the draft is kept on this device)" @click="store.close()">
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

      <FriezeBar slim class="dock-window__frieze" />

      <div class="dock-tabs bug-kinds">
        <button
          v-for="k in kinds"
          :key="k"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': store.kind === k }"
          :title="META[k].title"
          @click="store.setKind(k)"
        >
          <q-icon :name="META[k].icon" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ META[k].label }}</span>
        </button>
        <q-space />
        <!-- The two feed lenses — every report filed, by kind (GET /feed?label=). -->
        <span v-if="store.meta" class="bug-lenses">
          <a :href="lensHref('failure')" class="bug-lens" title="Every bug report on the feed">all bugs</a>
          <a :href="lensHref('idea')" class="bug-lens" title="Every change request on the feed — the prompt layer's queue">all ideas</a>
        </span>
      </div>

      <div class="dock-body bug-body">
        <input
          :value="d.title"
          class="bug-title"
          type="text"
          maxlength="140"
          :placeholder="store.kind === 'idea' ? 'Idea — a name for it (optional)' : 'Bug — a name for it (optional)'"
          @input="store.patch({ title: $event.target.value })"
          @keydown="onKeydown"
        >
        <div class="bug-note-wrap">
          <textarea
            ref="noteEl"
            :value="d.body"
            class="bug-note"
            :placeholder="META[store.kind].placeholder"
            spellcheck="true"
            @input="store.patch({ body: $event.target.value })"
            @keydown="onKeydown"
          />
          <button
            v-if="!d.body.trim()"
            type="button"
            class="bug-outline"
            :title="'Start from an outline: ' + META[store.kind].outline.replace(/\n+/g, ' ').trim()"
            @click="useOutline"
          >
            <q-icon name="format_list_bulleted" size="12px" />
            outline
          </button>
        </div>

        <!-- ── SCREENSHOTS — uploaded the moment they are added (capture=screen),
             private until the report publishes them with it. ── -->
        <div class="bug-row">
          <span class="bug-row__label">Screenshots</span>
          <div class="bug-row__items">
            <div v-for="s in d.shots" :key="s.key || s.id" class="bug-shot" :class="{ 'is-busy': s.busy, 'is-failed': s.error }" :title="s.error || s.name">
              <img v-if="s.preview || s.url" :src="s.preview || s.url" alt="" @error="s.preview = ''; s.url = ''">
              <q-icon v-else :name="ROACH" size="16px" class="bug-shot__ph" />
              <q-spinner v-if="s.busy" size="14px" class="bug-shot__spin" />
              <q-icon v-else-if="s.error" name="error_outline" size="14px" class="bug-shot__spin" />
              <button type="button" class="bug-shot__x" title="Remove from the report" @click="store.removeShot(s.key || s.id)">
                <q-icon name="close" size="10px" />
              </button>
            </div>
            <button v-if="canSnap" type="button" class="bug-act" :disabled="snapping || shotsFull" title="Capture this tab (the browser asks which screen to share; this window steps aside for the frame)" @click="snapScreen">
              <q-icon name="screenshot_monitor" size="13px" />
              Snap screen
            </button>
            <button type="button" class="bug-act" :disabled="shotsFull" title="Pick image files" @click="pickEl && pickEl.click()">
              <q-icon name="add_photo_alternate" size="13px" />
              Image
            </button>
            <span class="bug-row__hint">or paste / drop one here</span>
            <input ref="pickEl" type="file" accept="image/*" multiple class="bug-pick" @change="onPick">
          </div>
        </div>

        <!-- ── REFS — elements the report is about; they ride as chips and are
             never published along (refs never cascade). ── -->
        <div class="bug-row">
          <span class="bug-row__label">Refs</span>
          <div class="bug-row__items">
            <span v-for="r in d.refs" :key="r.ref" class="bug-ref">
              <MicroChip :kind="r.kind" :path="r.ref" :display="r.label || ''" dense />
              <button type="button" class="bug-ref__x" title="Remove" @click="store.removeRef(r.ref)">
                <q-icon name="close" size="10px" />
              </button>
            </span>
            <button v-if="pageRef" type="button" class="bug-act" :disabled="pageRefTaken" :title="'Add the element this page shows: ' + (pageRef.label || pageRef.ref)" @click="addPageRef">
              <q-icon name="my_location" size="13px" />
              This page
            </button>
            <button type="button" class="bug-act" :class="{ 'is-on': finding }" title="Search any element to reference" @click="finding = !finding">
              <q-icon name="search" size="13px" />
              Find…
            </button>
          </div>
        </div>
        <div v-if="finding" class="bug-finder">
          <SlotRefPicker hint="→ refs" @pick="onPickRef" />
        </div>

        <!-- ── CONTEXT — what the page looked like, so a failure can be found
             again; the browser's own name rides from the request. ── -->
        <label class="bug-row bug-row--context">
          <input type="checkbox" :checked="d.withContext" @change="store.patch({ withContext: $event.target.checked })">
          <span class="bug-row__label">Context</span>
          <span class="bug-row__hint mono">{{ contextLine }}</span>
        </label>
      </div>

      <footer class="bug-foot">
        <q-toggle
          :model-value="d.isPublic"
          dense
          size="sm"
          class="bug-public"
          :label="d.isPublic ? 'Public' : 'Private'"
          :title="d.isPublic ? 'Anyone can read the report — its screenshots go public with it' : 'Only you (and the inbox) — the post stays owner-only'"
          @update:model-value="store.patch({ isPublic: $event })"
        />
        <span class="bug-mail mono" :title="'Every report is mailed to ' + mailTo">
          <q-icon name="mail_outline" size="12px" /> {{ mailTo }}
        </span>
        <q-space />
        <span v-if="status" class="bug-status" :class="'is-' + status.tone">{{ status.text }}</span>
        <q-btn
          unelevated no-caps dense
          color="primary"
          class="bug-file"
          :loading="filing"
          :disable="!canFile"
          :title="'File it (' + (isMac ? '⌘' : 'Ctrl') + '+Enter)'"
          @click="file"
        >
          <q-icon :name="ROACH" size="14px" class="q-mr-xs" />
          {{ META[store.kind].verb }}
        </q-btn>
      </footer>

      <div v-if="store.receipts.length" class="bug-receipts">
        <span class="bug-receipts__label">filed</span>
        <span v-for="r in store.receipts" :key="r.id" class="bug-receipt">
          <MicroChip kind="skeletons" :id="r.id" :path="r.path" :type-icon="META[r.kind].icon" />
          <q-icon :name="r.mailed ? 'mark_email_read' : 'unsubscribe'" size="12px" class="bug-receipt__mail" :class="{ 'is-off': !r.mailed }" :title="r.mailed ? 'Mailed' : 'Not mailed — the post is filed'" />
        </span>
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import SlotRefPicker from 'src/components/maker/SlotRefPicker.vue'
import { useBugsStore, BUG_KINDS, KIND_META } from 'src/stores/bugs'
import { useWindowsStore } from 'src/stores/windows'
import { useNavStore } from 'src/stores/navigation'
import { bugService } from 'src/services/bug.service'
import { refService } from 'src/services/ref.service'
import { uploadCapture, stamp, extForMime, stopStream } from 'src/components/capture/captureMedia'
import { ROACH } from 'src/utils/glyphs'

// The routes whose page IS one element — `This page` adds it. Posts are
// skeletons on the chain; the summary read takes either name.
const PAGE_KINDS = { nodes: 'nodes', posts: 'skeletons', labels: 'labels', paths: 'paths', links: 'links', moments: 'moments', entities: 'entities', skeletons: 'skeletons' }
const MAX_SHOTS = 8

export default defineComponent({
  name: 'BugDock',
  components: { FriezeBar, MicroChip, SlotRefPicker },
  setup () {
    const store = useBugsStore()
    const windows = useWindowsStore()
    const route = useRoute()
    const router = useRouter()
    store.load()

    const d = computed(() => store.draft)
    const noteEl = ref(null)
    const pickEl = ref(null)
    const finding = ref(false)
    const filing = ref(false)
    const snapping = ref(false)
    const dropping = ref(false)
    const status = ref(null)
    const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '')

    // The labels + the address: one read the first time the window stands.
    watch(() => store.isOpen && !store.isMinimized, async (up) => {
      if (!up || store.meta) return
      try {
        const m = await bugService.meta()
        if (m?.success) store.meta = m
      } catch (_) { /* the lenses wait; filing does not need them */ }
    }, { immediate: true })

    const mailTo = computed(() => store.meta?.mail_to || 'allegue@pathos.cloud')
    const meta = computed(() => {
      const n = store.receipts.length
      if (n) return `${n} filed this sitting`
      return d.value.isPublic ? 'public · mailed' : 'private · mailed'
    })
    const lensHref = (kind) => {
      const l = store.meta?.labels?.[kind]
      return l ? `#/feed?label=${l.id}` : '#/feed'
    }

    // ── the outline ──
    const useOutline = () => {
      store.patch({ body: KIND_META[store.kind].outline })
      setTimeout(() => {
        const el = noteEl.value
        if (!el) return
        el.focus()
        const at = el.value.indexOf('\n\n') + 1
        el.setSelectionRange(at, at)
      }, 0)
    }

    // ── SCREENSHOTS ──
    const shotsFull = computed(() => d.value.shots.length >= MAX_SHOTS)
    const addImage = async (blob, name) => {
      if (shotsFull.value) { status.value = { tone: 'warn', text: `${MAX_SHOTS} screenshots is the most a report carries` }; return }
      if (!String(blob.type || '').startsWith('image/')) return
      const key = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      const preview = URL.createObjectURL(blob)
      store.pushShot({ key, preview, busy: true, name })
      const r = await uploadCapture(blob, name, 'screen')
      const node = r?.success && r.nodes?.[0]
      if (node) {
        store.settleShot(key, { id: node.id, path: node.path, url: node.file?.url || '', busy: false })
      } else {
        store.settleShot(key, { busy: false, error: r?.error?.message || r?.errors?.[0]?.message || 'Upload failed' })
      }
    }
    const filesOf = (list) => Array.from(list || []).filter(f => String(f.type || '').startsWith('image/'))
    const onPick = (e) => {
      for (const f of filesOf(e.target.files)) addImage(f, f.name || `screenshot-${stamp()}.png`)
      e.target.value = ''
    }
    const onPaste = (e) => {
      const files = filesOf(e.clipboardData?.files)
      if (!files.length) return
      e.preventDefault()
      for (const f of files) addImage(f, `pasted-${stamp()}.${extForMime(f.type)}`)
    }
    const onDrop = (e) => {
      dropping.value = false
      for (const f of filesOf(e.dataTransfer?.files)) addImage(f, f.name || `dropped-${stamp()}.png`)
    }

    // Snap the screen: one frame off a getDisplayMedia share, then the share
    // stops. Chrome offers THIS TAB first (`preferCurrentTab`); the window
    // steps aside (`is-snapping` → hidden) for the frame so the screenshot
    // shows the page, not the report about it.
    const canSnap = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia
    const snapScreen = async () => {
      status.value = null
      let stream = null
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' })
        snapping.value = true
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.srcObject = stream
        await video.play()
        // two frames for the window to leave, then a beat for the share to
        // repaint without it
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        await new Promise(resolve => setTimeout(resolve, 350))
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        stopStream(stream)
        stream = null
        snapping.value = false
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        if (blob) await addImage(blob, `screen-${stamp()}.png`)
      } catch (e) {
        if (e?.name !== 'NotAllowedError' && e?.name !== 'AbortError') status.value = { tone: 'warn', text: e?.message || 'Could not capture the screen' }
      } finally {
        stopStream(stream)
        snapping.value = false
      }
    }

    // ── REFS ──
    const pageRef = ref(null)
    const pageRefTaken = computed(() => !!pageRef.value && d.value.refs.some(r => r.ref === pageRef.value.ref))
    watch(() => route.fullPath, async () => {
      pageRef.value = null
      const m = route.path.match(/^\/(nodes|posts|labels|paths|links|moments|entities|skeletons)\/(\d+)$/)
      if (!m) return
      const kind = PAGE_KINDS[m[1]]
      try {
        const r = await refService.summaryById(kind, parseInt(m[2], 10))
        const s = r?.summary
        if (s?.hash && !s.locked) pageRef.value = { ref: `${kind}/${s.hash}`, kind, label: s.primary || '' }
      } catch (_) { /* no element here we can name */ }
    }, { immediate: true })
    const addPageRef = () => { if (pageRef.value) store.addRef(pageRef.value) }
    const onPickRef = (r) => {
      const addr = String(r?.address || '').replace(/^posts\//, 'skeletons/')
      if (!/^[a-z]+\/[0-9a-f]{64}$/.test(addr)) return
      store.addRef({ ref: addr, kind: addr.split('/')[0], label: r.primary || '' })
    }

    // ── CONTEXT ──
    const context = () => {
      const w = typeof window !== 'undefined' ? window : null
      if (!w) return null
      let tz = ''
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch (_) { /* old engine */ }
      return {
        route: '#' + route.fullPath,
        viewport: `${w.innerWidth}×${w.innerHeight}${w.devicePixelRatio && w.devicePixelRatio !== 1 ? ` @${w.devicePixelRatio}x` : ''}`,
        lang: navigator.language || '',
        tz
      }
    }
    const contextLine = computed(() => {
      if (!d.value.withContext) return 'not attached'
      // read the route reactively so the line follows navigation
      const c = { ...context(), route: '#' + route.fullPath }
      return [c.route, c.viewport, c.lang, c.tz].filter(Boolean).join(' · ')
    })

    // ── FILING ──
    const uploading = computed(() => d.value.shots.some(s => s.busy))
    const canFile = computed(() => !filing.value && !uploading.value && store.hasWork)
    const file = async () => {
      if (!canFile.value) return
      filing.value = true
      status.value = null
      const kind = store.kind
      try {
        const r = await bugService.file({
          kind,
          title: d.value.title,
          body: d.value.body,
          screenshots: d.value.shots.filter(s => s.id && !s.error).map(s => s.id),
          refs: d.value.refs.map(({ ref, label }) => ({ ref, label })),
          context: d.value.withContext ? context() : null,
          public: d.value.isPublic
        })
        if (!r?.success) throw new Error(r?.error?.message || 'Filing failed')
        store.pushReceipt({ id: r.skeleton.id, path: r.skeleton.path, kind, mailed: !!r.mail?.ok })
        try {
          useNavStore().recordAction('FILE_BUG', {
            targetType: 'post',
            targetId: r.skeleton.id,
            targetLabel: d.value.title || (kind === 'idea' ? 'idea' : 'bug'),
            targetPath: r.skeleton.path
          })
        } catch (_) { /* a report must never fail because its log did */ }
        for (const s of d.value.shots) if (s.preview) URL.revokeObjectURL(s.preview)
        store.resetDraft()
        finding.value = false
        status.value = r.mail?.ok
          ? { tone: 'ok', text: `Filed — mailed to ${r.mail.to}` }
          : { tone: 'warn', text: `Filed — the mail did not go (${r.mail?.error || 'unknown'})` }
      } catch (e) {
        status.value = { tone: 'err', text: e?.response?.data?.error?.message || e?.message || 'Filing failed' }
      } finally {
        filing.value = false
      }
    }
    const onKeydown = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); file() }
    }

    // a stale status line leaves as soon as the next report starts
    watch(() => store.hasWork, (w) => { if (w && status.value?.tone === 'ok') status.value = null })

    return {
      store,
      windows,
      router,
      d,
      kinds: BUG_KINDS,
      META: KIND_META,
      ROACH,
      isMac,
      noteEl,
      pickEl,
      finding,
      filing,
      snapping,
      dropping,
      status,
      meta,
      mailTo,
      lensHref,
      useOutline,
      shotsFull,
      canSnap,
      snapScreen,
      onPick,
      onPaste,
      onDrop,
      pageRef,
      pageRefTaken,
      addPageRef,
      onPickRef,
      contextLine,
      canFile,
      file,
      onKeydown
    }
  }
})
</script>

<style lang="scss" scoped>
// THE ROACH'S CHESTNUT — the labels window's dial recipe, brown for red
// (`--bugs-*` in _tokens.scss states why brown-2 for the veil): coat, rule,
// strong rule, ink, mute ink, well, the frieze's plate, and the q-primary
// Quasar reads (the File button, the toggle, the spinners).
.bug-dock {
  --dock-coat: var(--bugs-coat);
  --dock-rule: var(--bugs-contrast);
  --dock-rule-strong: var(--brown-8);
  --dock-ink: var(--bugs-contrast);
  --dock-ink-mute: var(--brown-4);
  --dock-well: var(--brown-1);
  --dock-frieze: var(--brown-10);
  --q-primary: var(--bugs-contrast);
}
// The window steps aside for a screen snap (opacity, not display: the
// share keeps painting and the component keeps its state).
.bug-dock.is-snapping { opacity: 0; pointer-events: none; transition: none; }
.bug-dock.is-dropping .bug-body { box-shadow: inset 0 0 0 2px var(--bugs-contrast); }

.dock-tab:hover { color: var(--brown-8); }
.dock-tab.is-active { box-shadow: inset 0 2px 0 var(--bugs-contrast); }
.dock-bar__plate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--bugs-contrast);
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.04);
  .dock-bar__icon { color: var(--bugs-contrast); opacity: 0.9; }
  .dock-bar__title { color: var(--bugs-contrast); }
}

.bug-lenses {
  display: inline-flex;
  gap: 10px;
  padding: 0 12px;
  align-self: center;
}
.bug-lens {
  font-size: 0.68em;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dock-ink-mute);
  text-decoration: none;
  &:hover { color: var(--bugs-contrast); text-decoration: underline; }
}

.bug-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  overflow-y: auto;
}

// The notepad: the capture notepad's two fields, on the family's well.
.bug-title,
.bug-note {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--dock-rule) 45%, transparent);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--brown-10);
  font: inherit;
  outline: none;
  &:focus { border-color: var(--bugs-contrast); background: rgba(255, 255, 255, 0.8); }
  &::placeholder { color: var(--brown-4); }
}
.bug-title {
  flex-shrink: 0;
  height: 30px;
  padding: 0 10px;
  font-weight: 600;
}
.bug-note-wrap {
  position: relative;
  flex: 1;
  min-height: 140px;
  display: flex;
}
.bug-note {
  flex: 1;
  resize: none;
  padding: 8px 10px;
  line-height: 1.45;
  font-size: 0.92em;
}
.bug-outline {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, var(--dock-rule) 50%, transparent);
  border-radius: 10px;
  background: var(--bugs-flat);
  color: var(--bugs-contrast);
  font-size: 0.7em;
  cursor: pointer;
  &:hover { border-color: var(--bugs-contrast); }
}

.bug-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}
.bug-row__label {
  flex: 0 0 78px;
  padding-top: 5px;
  font-size: 0.62em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dock-ink-mute);
}
.bug-row__items {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.bug-row__hint {
  font-size: 0.68em;
  color: var(--brown-4);
}
.bug-row--context {
  align-items: center;
  cursor: pointer;
  input { accent-color: var(--bugs-contrast); margin: 0; }
  .bug-row__label { flex-basis: auto; padding-top: 0; }
  .bug-row__hint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.bug-act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--dock-rule) 55%, transparent);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--bugs-contrast);
  font-size: 0.72em;
  cursor: pointer;
  &:hover:not(:disabled), &.is-on { border-color: var(--bugs-contrast); background: rgba(255, 255, 255, 0.85); }
  &:disabled { opacity: 0.45; cursor: default; }
}
.bug-pick { display: none; }

.bug-shot {
  position: relative;
  width: 64px;
  height: 44px;
  border: 1px solid color-mix(in srgb, var(--dock-rule) 55%, transparent);
  border-radius: 4px;
  overflow: hidden;
  background: var(--brown-1);
  display: grid;
  place-items: center;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &.is-busy img { opacity: 0.5; }
  &.is-failed { border-color: var(--red-7); }
}
.bug-shot__ph { color: var(--brown-4); }
.bug-shot__spin { position: absolute; color: var(--bugs-contrast); }
.bug-shot__x,
.bug-ref__x {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(62, 39, 35, 0.72);
  color: #fff;
  cursor: pointer;
}
.bug-shot__x { position: absolute; top: 2px; right: 2px; }
.bug-ref {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.bug-ref__x { width: 14px; height: 14px; background: transparent; color: var(--brown-5); &:hover { color: var(--brown-10); } }

.bug-finder {
  flex-shrink: 0;
  max-height: 260px;
  overflow: auto;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--dock-rule) 40%, transparent);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.45);
}

.bug-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 8px 14px;
  border-top: 1px solid var(--dock-rule);
}
.bug-public { color: var(--bugs-contrast); font-size: 0.8em; }
.bug-mail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7em;
  color: var(--dock-ink-mute);
  white-space: nowrap;
}
.bug-status {
  font-size: 0.72em;
  max-width: 46%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &.is-ok { color: var(--green-9, #2e7d32); }
  &.is-warn { color: var(--brown-8); }
  &.is-err { color: var(--red-9, #c62828); }
}
.bug-file { padding: 0 12px; font-weight: 600; }

.bug-receipts {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 14px 8px;
  border-top: 1px solid color-mix(in srgb, var(--dock-rule) 40%, transparent);
  flex-shrink: 0;
  max-height: 72px;
  overflow-y: auto;
}
.bug-receipts__label {
  font-size: 0.62em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dock-ink-mute);
}
.bug-receipt { display: inline-flex; align-items: center; gap: 2px; }
.bug-receipt__mail { color: var(--bugs-contrast); &.is-off { color: var(--brown-4); } }

@media (max-width: 600px) {
  .bug-row__label { flex-basis: 62px; }
  .bug-mail { display: none; }
  .bug-lenses { display: none; }
}
</style>
