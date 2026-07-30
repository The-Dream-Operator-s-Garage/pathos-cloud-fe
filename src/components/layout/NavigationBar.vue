<template>
  <q-footer class="nav-footer">

    <div class="nav-bar">

      <!-- ── LEFT: drawer toggle + identity actions ── -->
      <div class="nav-left">
        <q-btn push no-caps class="nav-btn" title="Menu" @click="$emit('toggle-drawer')">
          <q-icon name="menu" size="16px" />
        </q-btn>
        <q-btn push no-caps class="nav-btn" title="Profile" @click="goToProfile">
          <!-- Mask icon while acting as an alter-ego — the internal log-in
               should be visible at a glance. -->
          <q-icon :name="isAlterEgo ? 'theater_comedy' : 'person_outline'" size="16px" />
          <q-tooltip>{{ user?.display_name || user?.username || 'Profile' }}</q-tooltip>
        </q-btn>
        <q-btn push no-caps class="nav-btn" title="Logout" @click="handleLogout">
          <q-icon name="logout" size="16px" />
        </q-btn>
      </div>

      <!-- ── CENTER: nav controls + path info ── -->
      <div class="nav-center">
        <div class="nav-gap" />

        <!-- Primary navigation -->
        <div class="btn-group">
          <q-btn
            push no-caps
            class="nav-btn"
            :disable="!canGoBack"
            title="Back"
            @click="back"
          >
            <q-icon name="arrow_back" size="16px" />
          </q-btn>

          <q-btn
            push no-caps
            class="nav-btn"
            :disable="!canGoForward"
            title="Forward"
            @click="forward"
          >
            <q-icon name="arrow_forward" size="16px" />
          </q-btn>
        </div>

        <div class="nav-divider" />

        <!-- Checkpoint navigation -->
        <div class="btn-group">
          <q-btn
            push no-caps
            class="nav-btn checkpoint-btn"
            :disable="!canCheckpointBack"
            title="Previous checkpoint"
            @click="checkpointBack"
          >
            <q-icon name="arrow_back" size="13px" />
            <q-icon name="flag" size="13px" />
          </q-btn>

          <q-btn
            push no-caps
            class="nav-btn checkpoint-btn"
            :class="{ active: isCurrentCheckpoint }"
            title="Toggle checkpoint"
            @click="toggleCheckpoint"
          >
            <q-icon :name="isCurrentCheckpoint ? 'flag' : 'outlined_flag'" size="16px" />
          </q-btn>

          <q-btn
            push no-caps
            class="nav-btn checkpoint-btn"
            :disable="!canCheckpointForward"
            title="Next checkpoint"
            @click="checkpointForward"
          >
            <q-icon name="flag" size="13px" />
            <q-icon name="arrow_forward" size="13px" />
          </q-btn>
        </div>

        <div class="nav-divider" />

        <!-- Path info -->
        <div class="nav-path-info">
          <span class="step-indicator" v-if="stepLabel">{{ stepLabel }}</span>

          <span v-if="checkpointCount > 0" class="checkpoint-indicator">
            <q-icon name="flag" size="11px" class="q-mr-xs" />{{ checkpointCount }}
          </span>

          <div class="nav-divider-v" />

          <span class="current-title" :class="'type-' + (current?.type || 'page')">
            <q-icon :name="typeIcon(current?.type)" size="12px" class="q-mr-xs" style="opacity:.6;" />
            {{ current?.title || '—' }}
          </span>
        </div>

        <!-- Checkpoint tooltip list -->
        <div v-if="checkpointCount > 0" class="checkpoint-list" :class="{ visible: showCheckpoints }"
          @mouseenter="showCheckpoints = true" @mouseleave="showCheckpoints = false">
          <div v-for="(entry, i) in checkpointEntries" :key="i"
            class="checkpoint-list-item"
            @click="jumpToCheckpoint(entry)">
            <q-icon name="flag" size="11px" class="q-mr-xs text-accent" />
            <span>{{ entry.title }}</span>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: chat · create bundle · pin tack. The tack anchors the far
           corner directly BENEATH the pinned-list side panel (which now docks
           on top of the bar's top edge in both its expanded and rail states),
           so the tack + the pinned column read as one right-edge stack. There
           is no separate pinned-list toggle anymore — the panel is reached via
           its own rail head (it defaults to that rail and is minimize-only).
           The navigation-stack panel likewise has no button here. ── -->
      <div class="nav-right">
        <!-- Chat: the conversation window (distinctive teal treatment —
             chats are where entities meet, not another maker). The UNREAD
             BADGE (Thread A) rides it: the event spine's live unread count
             — messages, polls, invites, grants, comments all land here or
             one click away. Opening the dock marks the queue seen (coarse
             v1 ack; see stores/events.js). -->
        <q-btn
          push no-caps
          class="nav-btn chat-btn"
          :class="{ 'is-active': chatExpanded }"
          title="Chats — private conversations"
          @click="toggleChat"
        >
          <q-icon name="forum" size="15px" />
          <span class="chat-btn-label">chat</span>
          <q-badge
            v-if="events.unreadCount > 0"
            floating color="amber-9" text-color="black"
            class="chat-unread-badge"
          >{{ events.unreadCount }}</q-badge>
        </q-btn>

        <div class="nav-divider" />

        <!-- Create bundle: post maker + skeleton builder + label maker +
             uploader windows -->
        <q-btn-group push class="nav-bundle create-bundle">
          <q-btn push class="create-btn" @click="$emit('open-maker')">
            <q-icon name="add_circle_outline" size="16px" />
            <q-tooltip>Make post</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-skeleton-builder')">
            <q-icon name="schema" size="16px" />
            <q-tooltip>Build skeletons — define templates, populate and edit instances</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-label-maker')">
            <q-icon name="label_important" size="16px" />
            <q-tooltip>Label maker — grow, fork and reorganize label trees</q-tooltip>
          </q-btn>
          <q-btn push class="create-btn" @click="$emit('open-uploader')">
            <q-icon name="upload" size="16px" />
            <q-tooltip>Upload files, links or notes</q-tooltip>
          </q-btn>
        </q-btn-group>

        <div class="nav-divider" />

        <!-- Pin tack — the parked pinned column's body continued into the bar:
             the `.tack-slot` is the column (--dock-rail-w minus the hairline
             that stands in for its left border) and the tack itself is a small
             28px circle floating centred inside it, exactly like the parked
             chips float in their well. Flat inverted-brown chip, same skin as
             the drawer's Back button (NOT Quasar's push preset); its floating
             count badge shows how many pins you have. -->
        <div class="tack-slot">
          <q-btn
            round unelevated no-caps
            class="tack-btn"
            :class="{ 'is-pinned': isCurrentPinned }"
            :disable="!pinnable"
            @click="onTackClick"
          >
            <q-icon name="push_pin" size="15px" :class="{ 'tack-filled': isCurrentPinned }" />
            <q-badge v-if="pinsCount > 0" floating color="amber-9" text-color="black"
              class="pins-count-badge">{{ pinsCount }}</q-badge>
            <q-tooltip>{{ pinnable ? (isCurrentPinned ? 'Unpin this' : 'Pin this') : 'Open a node, post, label or skeleton to pin it' }}</q-tooltip>
          </q-btn>
        </div>
      </div>

    </div>
  </q-footer>

  <!-- ── The bar's top-edge cast, lifted OUT of the footer's stacking context
       (2026-07-25). A shadow written on `.nav-bar` cannot be seen: `.nav-footer`
       is z 2600, which makes it a stacking context, and two opaque surfaces
       stand on this very edge above that number — the frieze band (3000, at
       `bottom: var(--nav-footer-h)`) and the feed container (3001, whose track
       is `height: calc(100vh - var(--nav-footer-h))`, so its bottom edge lands
       on the same line). This box traces the bar and carries the cast alone, at
       a z-index that clears both. Decorative, pointer-events none. -->
  <div class="nav-top-shadow" aria-hidden="true" />

  <!-- ── Minitab strip: the minimized maker/uploader/builders/chat park here
       as folder tabs standing ON the frieze footer band (2026-07-27). It
       lives OUTSIDE the q-footer for the same reason `.nav-top-shadow` above
       does: the footer is a z-2600 stacking context and the band is opaque
       at 3000, so nothing inside the footer can ever paint over it — the
       strip is a lifted sibling instead, fixed at the bar's top edge with a
       z that clears the band AND the expanded docks (taskbar semantics: a
       parked tab stays clickable under an open window). The stack/pins side
       panels narrow to thin icon columns on the right edge instead
       (StackPanel/PinsDrawer `is-parked`). ── -->
  <div class="minitab-strip" :style="{ right: minitabRight }">
    <TransitionGroup name="minitab-pop">
      <button
        v-for="t in parkedTabs"
        :key="t.key"
        type="button"
        class="minitab"
        :title="t.title"
        @click="t.restore"
      >
        <q-spinner v-if="t.busy" size="12px" color="primary" />
        <q-icon v-else :name="t.icon" size="13px" :class="'minitab__icon--' + t.key" />
        <span class="minitab__label">{{ t.label }}</span>
        <span v-if="t.meta" class="minitab__meta mono">{{ t.meta }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavStore } from 'src/stores/navigation'
import { useAuthStore } from 'src/stores/auth'
import { useWindowsStore } from 'src/stores/windows'
import { useMakerStore, draftLabel } from 'src/stores/maker'
import { useUploaderStore, uploadLabel } from 'src/stores/uploader'
import { useSkeletonBuilderStore, builderLabel } from 'src/stores/skeletonBuilder'
import { useLabelMakerStore } from 'src/stores/labelMaker'
import { useChatStore } from 'src/stores/chat'
import { useEventsStore } from 'src/stores/events'
import { pinService } from 'src/services/pin.service'
import { typeIcon } from './navTypeIcons'

export default defineComponent({
  name: 'NavigationBar',
  emits: ['toggle-drawer', 'open-maker', 'open-uploader', 'open-skeleton-builder', 'open-label-maker', 'pins-changed'],
  props: {
    // Increment to force a pin-state refresh from the parent (e.g. after the
    // PinsDrawer unpins something so the tack indicator updates).
    pinsRefreshKey: { type: Number, default: 0 }
  },
  setup (props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const navStore = useNavStore()
    const authStore = useAuthStore()
    const windows = useWindowsStore()
    const makerStore = useMakerStore()
    const uploaderStore = useUploaderStore()
    const skeletonBuilderStore = useSkeletonBuilderStore()
    const labelMakerStore = useLabelMakerStore()
    const chatStore = useChatStore()
    const events = useEventsStore()

    // ── Chat window toggle (footer-button semantics) ─────────
    const chatExpanded = computed(() => chatStore.isOpen && !chatStore.isMinimized)
    const toggleChat = () => {
      if (!chatStore.isOpen) chatStore.open()
      else if (chatStore.isMinimized) chatStore.restore()
      else chatStore.close()
      // Surfacing the dock is SEEING the queue — the badge's coarse v1
      // semantics (every event kind lands in a chat surface or the polls
      // band one click away). Targeted per-event acks live in ChatDock.
      if (chatStore.isOpen && !chatStore.isMinimized && events.unreadCount > 0) {
        events.ackAll()
      }
    }

    // ── PIN state ────────────────────────────────────────────
    // Parse the current route to determine what (if anything) is pinnable.
    // /nodes/:id, /nodes/:id/edit, /posts/:id, /labels/:id, /skeletons/:id
    const currentPinTarget = computed(() => {
      const m = route.path.match(/^\/(nodes|posts|labels|skeletons)\/(\d+)/)
      if (!m) return null
      let type = m[1].slice(0, -1) // strip trailing 's' → node/post/label/skeleton
      if (type === 'post') type = 'skeleton' // posts ARE skeletons (C1 migration)
      return { targetType: type, targetId: parseInt(m[2]) }
    })
    const pinnable = computed(() => !!currentPinTarget.value)
    const isCurrentPinned = ref(false)
    const pinsCount = ref(0)

    const refreshPinState = async () => {
      try {
        const list = await pinService.list()
        if (list.success) pinsCount.value = list.pins.length
        if (currentPinTarget.value) {
          const t = currentPinTarget.value
          const r = await pinService.check(t.targetType, t.targetId)
          isCurrentPinned.value = !!(r.success && r.pinned)
        } else {
          isCurrentPinned.value = false
        }
      } catch (_) { /* unauthenticated or backend down — ignore */ }
    }

    const onTackClick = async () => {
      const t = currentPinTarget.value
      if (!t) return
      try {
        if (isCurrentPinned.value) {
          await pinService.unpin(t.targetType, t.targetId)
        } else {
          await pinService.pin(t.targetType, t.targetId)
        }
        await refreshPinState()
        // Let the pins window/rail reload — MainLayout routes this back
        // down as PinsDrawer's refresh-key.
        emit('pins-changed')
      } catch (_) { /* ignore — surface via tooltip later */ }
    }

    onMounted(refreshPinState)
    // Re-check whenever the route changes (so the tack reflects the new page).
    watch(() => route.path, refreshPinState)
    // Re-check when parent signals a pin-list mutation (e.g. unpin from drawer).
    watch(() => props.pinsRefreshKey, refreshPinState)

    const user = computed(() => authStore.user)
    const isAlterEgo = computed(() => authStore.isActingAsAlterEgo)

    // "Profile" is just the logged-in user's entity view. No separate page.
    const goToProfile = () => {
      const id = authStore.user?.id
      if (id) router.push('/entities/' + id)
    }
    const handleLogout = () => {
      authStore.logout()
      router.push('/auth')
    }

    const showCheckpoints = ref(false)

    const canGoBack = computed(() => navStore.canGoBack)
    const canGoForward = computed(() => navStore.canGoForward)
    const canCheckpointBack = computed(() => navStore.canCheckpointBack)
    const canCheckpointForward = computed(() => navStore.canCheckpointForward)
    const isCurrentCheckpoint = computed(() => navStore.isCurrentCheckpoint)
    const current = computed(() => navStore.current)
    const stepLabel = computed(() => navStore.stepLabel)
    const checkpointCount = computed(() => navStore.checkpointIndices.length)
    const checkpointEntries = computed(() => navStore.checkpointEntries)

    const back = () => navStore.back(router)
    const forward = () => navStore.forward(router)
    const toggleCheckpoint = () => navStore.toggleCheckpoint()
    const checkpointBack = () => navStore.checkpointBack(router)
    const checkpointForward = () => navStore.checkpointForward(router)

    // Jumps route through the store so return-marking (the yellow halo on
    // the element you came back from) and persistence both fire.
    const jumpToCheckpoint = (entry) => {
      const idx = navStore.history.findIndex(h => h.route === entry.route && h.timestamp === entry.timestamp)
      if (idx < 0) return
      navStore.jumpTo(idx, router)
      showCheckpoints.value = false
    }

    // ── Pins/stack windows live in the windows store and have NO footer
    // button anymore — both dock flush to the top edge and are reached via
    // their own rail chrome + persisted state. The pins panel (expanded or
    // parked) sits ON TOP of the bar and covers no buttons; the bar itself now
    // runs edge to edge with NO side padding, so the tack's 42px slot lands
    // exactly under the parked pinned column. ──

    // The minitab strip hugs the footer's top-right edge — the same band the
    // expanded pins panel (and its rail) occupy. Slide it left by
    // footerPanelInset so parked maker/uploader tabs stay clear of either.
    const minitabRight = computed(() => `${10 + windows.footerPanelInset}px`)

    // ── Minitab strip — one folder tab per minimized dock. Only the maker
    // and uploader park here; the stack/pins side panels narrow into
    // parked icon columns on the right edge instead. ──
    const parkedTabs = computed(() => {
      const tabs = []
      if (makerStore.isOpen && makerStore.isMinimized) {
        tabs.push({
          key: 'maker',
          icon: 'edit_note',
          label: draftLabel(makerStore.activeDraft),
          meta: makerStore.draftCount > 1 ? `+${makerStore.draftCount - 1}` : '',
          busy: false,
          title: 'Restore the post maker',
          restore: () => makerStore.restore()
        })
      }
      if (skeletonBuilderStore.isOpen && skeletonBuilderStore.isMinimized) {
        tabs.push({
          key: 'skeletonBuilder',
          icon: 'schema',
          label: builderLabel(skeletonBuilderStore.activeDraft),
          meta: skeletonBuilderStore.draftCount > 1 ? `+${skeletonBuilderStore.draftCount - 1}` : '',
          busy: false,
          title: 'Restore the skeleton builder',
          restore: () => skeletonBuilderStore.restore()
        })
      }
      if (labelMakerStore.isOpen && labelMakerStore.isMinimized) {
        tabs.push({
          key: 'labelMaker',
          icon: 'label_important',
          label: labelMakerStore.selected?.name || 'labels',
          meta: '',
          busy: false,
          title: 'Restore the label maker',
          restore: () => labelMakerStore.restore()
        })
      }
      if (uploaderStore.isOpen && uploaderStore.isMinimized) {
        tabs.push({
          key: 'uploader',
          icon: 'upload',
          label: uploadLabel(uploaderStore.activeUpload),
          meta: uploaderStore.uploadCount > 1 ? `+${uploaderStore.uploadCount - 1}` : '',
          busy: uploaderStore.busyCount > 0,
          title: 'Restore the uploader',
          restore: () => uploaderStore.restore()
        })
      }
      if (chatStore.isOpen && chatStore.isMinimized) {
        tabs.push({
          key: 'chat',
          icon: 'forum',
          label: 'chats',
          meta: '',
          busy: false,
          title: 'Restore the chat window',
          restore: () => chatStore.restore()
        })
      }
      return tabs
    })

    return {
      user,
      isAlterEgo,
      goToProfile,
      handleLogout,
      pinnable,
      isCurrentPinned,
      pinsCount,
      onTackClick,
      canGoBack,
      canGoForward,
      canCheckpointBack,
      canCheckpointForward,
      isCurrentCheckpoint,
      current,
      stepLabel,
      checkpointCount,
      checkpointEntries,
      showCheckpoints,
      typeIcon,
      back,
      forward,
      toggleCheckpoint,
      checkpointBack,
      checkpointForward,
      jumpToCheckpoint,
      minitabRight,
      chatExpanded,
      toggleChat,
      events,
      parkedTabs
    }
  }
})
</script>

<style lang="scss" scoped>
// All colors source from --ink, --paper, --aqua, etc. defined in _tokens.scss.
// The bar is a flat brown-1 plaque — the SAME surface vocabulary as the
// docked windows (.dock-window) so the minitabs parked on its top edge
// read as folder tabs attached to the bar, not floating chips. The ONE
// section painted brown-4 instead is the pin-tack slot at the right end.

.nav-footer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  // The bar's own layer. The parked minitabs no longer ride it — the docks
  // moved above the feed container (z 3010+, stores/windows.js), so taskbar
  // semantics now live on the lifted `.minitab-strip` sibling (z 3045).
  z-index: 2600;
  background: transparent !important;
  box-shadow: none !important;
}

// ── Minitab strip — ON the frieze footer band itself (2026-07-27; it stood
// on the band's TOP edge from 2026-07-25, back when nothing inside the
// footer could out-paint the opaque z-3000 strip). A lifted FIXED sibling of
// the footer now (see the template comment), so it can: `bottom:
// var(--nav-footer-h)` seats every tab's bottom edge exactly on the bar's
// top edge — the band's own bottom — and the 26px tabs stand over the 27px
// band rather than floating a band-height above it. z 3045: over the band
// (3000), the feed container (3001) and every dock (3010+, so a parked tab
// stays clickable while another window is expanded — taskbar semantics),
// under the drawer (3050) and the side widgets (3100). `right` is bound
// inline (base 10px, shifted left by the pins-widget inset) so parked tabs
// clear that column.
.minitab-strip {
  position: fixed;
  bottom: var(--nav-footer-h);
  right: 10px;
  z-index: 3045;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  transition: right 0.18s ease;
}

.minitab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(var(--ink-rgb-deep), 0.35);
  border-bottom: none;
  border-radius: 9px 9px 0 0;
  // Folder tabs attached to the brown-1 plaque — same flat color, no blur.
  background: var(--brown-1);
  color: var(--ink-1);
  cursor: pointer;
  // A slight cast onto the frieze band the tab now stands over (2026-07-27)
  // — soft and tight, so the tab reads as lying ON the band rather than
  // painted into it. The band's own carve is busy, which is why the reach
  // stays short.
  box-shadow: 0 2px 8px rgba(var(--ink-rgb-deep), 0.28);
  transition: background 0.12s;

  &:hover {
    background:
      linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.35)),
      var(--brown-1);
  }
}

// Distinctive icon tint per window, mirroring each window's header icon.
.minitab__icon--maker           { color: #00829c; }
.minitab__icon--uploader        { color: #7b52ab; }
.minitab__icon--skeletonBuilder { color: #5b6c82; }
.minitab__icon--labelMaker      { color: #00829c; }

.minitab__label {
  font-family: var(--font-mono);
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.03em;
  max-width: 24ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.minitab__meta {
  font-size: 0.64em;
  color: var(--ink-soft);
  background: rgba(var(--ink-rgb), 0.08);
  border-radius: 7px;
  padding: 0 5px;
}

.minitab-pop-enter-active, .minitab-pop-leave-active { transition: transform 0.16s ease, opacity 0.16s ease; }
.minitab-pop-enter-from, .minitab-pop-leave-to { transform: translateY(8px); opacity: 0; }

// The nav-btn base styling lives in src/css/_components.scss (light glass
// pebbles) — only per-variant tweaks remain here.

.nav-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  // STRETCH, not center — each section fills the bar's full height so its
  // hairline (section border or `.nav-divider`) touches the top and bottom
  // edges with no vertical inset. The sections center their own buttons.
  align-items: stretch;
  // No padding at all: the bar runs edge to edge so the right cluster's last
  // 42px (hairline + tack) lands exactly under the parked pinned column.
  padding: 0;
  // Flat brown-1 plaque — one clean color, no sheen gradients, no blur. The
  // BODY of the bar stays pale: the ONE section wearing the darker brown-4 coat
  // is the pin-tack slot at the right end, which continues the parked pinned
  // column down through the bar (2026-07-24).
  background: var(--brown-1);
  // Top lip BACK to --brown-3 (end of 2026-07-25; it was brown-3, went
  // brown-4 on 2026-07-24, and returns now). The FriezeFooter band moved onto
  // this edge, and that band wears the crown strip's own brown-3 lip — with
  // the bar in brown-4 the two hairlines bounding the band read as different
  // lines. On brown-3 they are one material: the frieze's lip, the drawer's
  // border-right and this edge all share the raw brown-3 hex again. (The
  // brown-4 frame the bar used to keep survives at the tack slot's block.)
  border-top: 1px solid var(--brown-3);
  // NO box-shadow here — a cast written on this box is invisible (it cannot
  // leave `.nav-footer`'s z-2600 stacking context, and the frieze band and the
  // feed container both stand on this edge above that). It lives in
  // `.nav-top-shadow` at the end of this file instead.
  // Exact height — the pinned column and the drawer sit at
  // bottom: var(--nav-footer-h), so the bar must fill that space precisely
  // for their edges to merge. (The creation docks and the minitab strip
  // anchor to this same edge and paint OVER the frieze band since
  // 2026-07-27; only chat still stands one --frieze-h higher — see
  // --dock-bottom in _tokens.scss.)
  height: var(--nav-footer-h);
  position: relative;
  user-select: none;
  // The pinned side panel (expanded panel OR parked column) sits ON TOP of the
  // bar and covers no buttons — the pin tack occupies that same 42px column
  // right beneath it, which is why there is no right inset left here.
}

// ── Three sections ─────────────────────────────────────────
// Each is a full-height grid cell (the bar stretches them) that centers its own
// buttons, so the section borders below run the WHOLE bar height. Side padding
// is trimmed to a hair — `.nav-right` has none on its right at all, so the tack
// sits flush against the screen edge under the parked pinned column.
.nav-left, .nav-right {
  display: flex;
  align-items: center;
}
.nav-left  { gap: 4px; padding: 0 6px 0 4px; border-right: 1px solid var(--brown-3); }
.nav-right { gap: 8px; padding-left: 6px;    border-left:  1px solid var(--brown-3); }

.nav-center { display: flex; align-items: center; gap: 8px; padding: 0 6px; min-width: 0; }
.nav-gap    { flex: 1; min-width: 0; }

.btn-group   { display: flex; align-items: center; gap: 4px; }
// Every inner hairline on the bar is brown-3 and spans the FULL bar height
// (`align-self: stretch`, no fixed height) — the section borders above, these
// dividers and the nested `.nav-divider-v` all carry that ONE lighter ink
// (2026-07-24, a step up from brown-4), so the lines drawn INSIDE the bar read
// softer than the brown-4 edges that bound it: the bar's own `border-top` and
// the tack slot's left edge, where the parked pinned column lands.
.nav-divider { width: 1px; align-self: stretch; background: var(--brown-3); flex-shrink: 0; }

// Checkpoint button — lemon flag accent (DIFFERENT semantic from coral
// tack), retuned to the playground's neon-lemon family on the brown-1 plaque.
.nav-bar .nav-btn.checkpoint-btn {
  color: var(--ink-2);

  &:hover:not(.disabled) {
    color: var(--ink-1);
    background:
      linear-gradient(rgba(254, 255, 153, 0.55), rgba(254, 255, 153, 0.55)),
      #f1f8e9;
  }

  // The active flag lights lemon; Quasar's push preset supplies the 3D lip,
  // so only the lemon glow remains — no fake surface-4 ledge.
  &.active {
    color: var(--ink-1);
    background: var(--neon-lemon);
    box-shadow: 0 0 10px rgba(254, 255, 153, 0.55);
  }
}

// ── Path info ────────────────────────────────────────────────
// Stretched to the full bar height so the hairline INSIDE it can reach both
// edges too; its own text children stay vertically centered.
.nav-path-info { display: flex; align-items: center; align-self: stretch; gap: 8px; flex: 1; min-width: 0; overflow: hidden; }

.step-indicator       { font-family: var(--font-mono); font-size: 0.72em; color: var(--ink-2); white-space: nowrap; }
.checkpoint-indicator { display: inline-flex; align-items: center; font-size: 0.72em; color: var(--ink-2); white-space: nowrap; cursor: pointer; }
.nav-divider-v        { width: 1px; align-self: stretch; background: var(--brown-3); flex-shrink: 0; }

.current-title {
  font-size: 0.78em;
  color: var(--ink-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;

  &.type-node  { color: var(--ink); }
  &.type-label { color: #00829c; }   // deep aqua — matches LABEL palette
  &.type-post  { color: #9a63b8; }   // deep plum — matches POST palette
  &.type-feed  { color: var(--ink-soft); }
}

// ── Checkpoint dropdown list ─────────────────────────────────
.checkpoint-list {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(var(--coral-rgb), 0.35);
  border-radius: var(--radius-md);
  min-width: 200px;
  max-width: 340px;
  padding: 6px;
  display: none;
  z-index: 100;
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(4px);

  &.visible { display: block; }
}
.checkpoint-list-item {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 0.8em;
  color: var(--coral-deep);
  cursor: pointer;
  &:hover { background: rgba(var(--coral-rgb), 0.12); }
}

// Chat — the conversation window's button. Aqua treatment on purpose:
// this is where entities talk, not another maker pebble.
.nav-bar .chat-btn {
  font-family: var(--font-display);
  font-size: 0.7em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-2);
  flex-shrink: 0;

  :deep(.q-btn__content) { gap: 4px; }

  &:hover, &.is-active {
    background: var(--aqua-3);
    color: var(--ink-1);
    border-color: rgba(var(--ink-rgb-deep), 0.50);
  }
}
.chat-btn-label { font-size: 0.95em; }

// ── Button bundles (Quasar q-btn-group push) — light-blue-1 pebbles.
// Quasar's push preset paints the 3D bottom lip AND the press animation
// natively, so there is NO extra colored ledge shadow here (the old
// surface-4 "blue" ledge is gone) — just the light-blue-1 face color.
.nav-bundle {
  border-radius: var(--radius-sm);
  flex-shrink: 0;

  :deep(.q-btn) {
    min-height: 30px;
    padding: 0 10px;
    background: #e1f5fe;   // Quasar light-blue-1
    color: var(--ink-1);
    border: 1px solid rgba(var(--ink-rgb-deep), 0.40);

    &:not(:first-child) { border-left: none; }
  }
}

// ── Pin tack ────────────────────────────────────────────────
// The SLOT is the parked pinned column continued down through the bar: the
// hairline before it + this box add up to exactly `--dock-rail-w` (42px) flush
// against the screen edge, so that hairline lands on the same pixel as the
// parked column's own left border and the two read as one uninterrupted
// right-edge column (the PIXEL still lines up; the ink no longer matches —
// that divider went brown-3 with the bar's other hairlines on 2026-07-24,
// while the column's border above stays brown-4. What carries the edge down
// here is the brown-4 BLOCK, not the line.) It wears the column's DARKER brown-4 coat
// (2026-07-24) instead of the bar's brown-1 plaque, and casts the shared
// `--shadow-side-edge` leftward ON TOP of the bar — the same cast the stack/
// pins widgets throw above it, so the whole right-edge column reads as one
// raised strip. `position: relative` + z-index keep that cast above the bar's
// own plaque and the create bundle beside it.
.tack-slot {
  width: calc(var(--dock-rail-w) - 1px);   // rail width less that 1px hairline
  margin-left: -8px;                       // cancel .nav-right's gap — butt against it
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;                 // the tack floats centred, padded both sides
  position: relative;
  z-index: 1;
  background: var(--brown-4);
  box-shadow: var(--shadow-side-edge);
}

// The tack itself is a small CIRCLE (the same 28px box the parked column's
// chips wear, so it reads as one of them) with no inner padding, floating in
// that slot. Skin is the drawer's Back button, NOT Quasar's push preset:
// a flat inverted brown chip — solid brown-8 fill, matching brown-8 rim so
// there is no contrasting outline, brown-1 pushpin, a hairline inset highlight
// along the top, and a brown-7 lift on hover.
.nav-bar .tack-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  border-radius: 50%;
  background: var(--brown-8);
  border: 1px solid var(--brown-8);
  color: var(--brown-1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);

  .q-icon { color: var(--brown-1); transition: transform 0.14s ease; }

  &:hover:not(.q-btn--disable) {
    background: #5d4037;                   // Quasar brown-7 — lifts on hover
    border-color: #5d4037;
  }

  // On a pinned element the chip INVERTS — a flat brown-1 face with a brown-8
  // outline + pushpin. Rim and pushpin were brown-4, which went invisible once
  // the SLOT under them was painted brown-4 (2026-07-24); brown-8 restores the
  // outline — the same ink the unpinned chip's own face and rim carry.
  &.is-pinned {
    background: var(--brown-1);
    color: var(--brown-8);
    border-color: var(--brown-8);
    box-shadow: none;                      // no inset highlight on the pale face

    .q-icon { color: var(--brown-8); }
    // 22° rotation to mimic a pushpin pressed in.
    .q-icon.tack-filled { transform: rotate(-22deg); }

    &:hover { background: var(--brown-1); }
  }
}

// Create bundle — aqua accent, same grammar as before the bundling.
.create-bundle {
  :deep(.create-btn) {
    color: var(--ink-2);

    &:hover {
      color: var(--ink-1);
      background: var(--aqua-3);
    }
  }
}

.pins-count-badge {
  font-size: 0.62em !important;
  padding: 0 4px !important;
  min-height: 12px !important;
  letter-spacing: 0;
}

// The event spine's unread count on the chat button — same tiny amber
// treatment as the pin tack's counter (they share the bar; one voice).
.chat-unread-badge {
  font-size: 0.62em !important;
  padding: 0 4px !important;
  min-height: 12px !important;
  letter-spacing: 0;
}

// ── Top-edge cast ──────────────────────────────────────────
// A VERY subtle shadow off the bar's `border-top`, and nothing else: this box
// has no background, no border and no content.
//
// It is a SIBLING of `.nav-footer`, not a child, because that footer's z 2600
// makes it a stacking context — a cast from inside it tops out at 2600 and both
// surfaces it must fall on sit higher and are opaque, so it is simply never
// seen. Here it is 3040, which lands it:
//   OVER   the frieze footer band (3000) — the band the shadow falls on for
//          every page but /feed
//   OVER   the feed container (3001) — on /feed the container's bottom edge
//          lands on this same line and covers the band, so the cast lands on
//          the blue-grey plaque instead
//   UNDER  the left drawer (3050) and the pinned column (3100), which also
//          stand on the bar's top edge; they keep their own clean bottom, the
//          same deal they already have with the band.
//
// The box traces the bar EXACTLY (bottom 0, full width, --nav-footer-h tall)
// and is transparent: an outer box-shadow paints only OUTSIDE the border box,
// so the bar's own face is never darkened by the shadow standing over it, and
// the left/right spill leaves the viewport. All that is left is the upward
// reach. Tight and pale — ~9px at 0.16 — the top border should look like an
// edge the page slides under, not a second band.
.nav-top-shadow {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: var(--nav-footer-h);
  z-index: 3040;
  pointer-events: none;
  box-shadow: 0 -2px 7px rgba(var(--ink-rgb-deep), 0.16);
}
</style>
