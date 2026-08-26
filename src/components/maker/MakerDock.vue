<template>
  <!-- Minimized state renders as a minitab inside NavigationBar's footer
       strip — the dock itself only exists while expanded. -->
  <transition name="dock-slide">
    <section
      v-if="store.isOpen && !store.isMinimized"
      class="maker-dock dock-window dock-window--creation"
      :class="{ 'is-max': store.isMaximized, 'is-split-right': windows.splitSideOf('maker') === 'right' }"
      :style="{ zIndex: windows.zOf('maker'), '--dock-right': windows.dockRight + 'px' }"
    >
      <!-- ── Thin header: title left, Mac-style traffic lights right ──
           THE NAME IS A PLATE (2026-08-26, user ask) — the window states
           itself in the same object the feed's post cards state themselves
           with, `.post-square__foot .post-square__chip`: glyph, name, one
           hairline box. The icon and the title were two loose items in the
           bar's flex row (a teal glyph, then `Post maker` in the display
           face); wrapping them makes the pair ONE thing, which is what the
           card's foot plate is. The count stays outside it — the plate names
           the window, it does not report on it. -->
      <header class="dock-bar">
        <span class="dock-bar__plate">
          <q-icon name="article" size="13px" class="dock-bar__icon" />
          <span class="dock-bar__title nasalization">Post maker</span>
        </span>
        <span class="dock-bar__meta mono">
          {{ store.draftCount }} in progress
        </span>
        <q-space />
        <div class="traffic">
          <button type="button" class="traffic__dot traffic__dot--red"
            title="Close (drafts are kept)" @click="store.close()">
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

      <!-- ── Draft tabs — one per unposted item. Comment drafts (parent
           set) carry a reply icon so they read as replies at a glance. ── -->
      <div class="dock-tabs">
        <button
          v-for="d in store.drafts"
          :key="d.id"
          type="button"
          class="dock-tab"
          :class="{ 'is-active': d.id === store.activeId }"
          :title="d.parent ? `Comment on ${d.parent.kind} #${d.parent.id}` : ''"
          @click="store.setActive(d.id)"
        >
          <q-icon :name="d.parent ? 'reply' : 'edit_note'" size="13px" class="dock-tab__icon" />
          <span class="dock-tab__label">{{ tabLabel(d) }}</span>
          <span class="dock-tab__x" title="Discard draft" @click.stop="askDiscard(d)">
            <q-icon name="close" size="11px" />
          </span>
        </button>
        <button type="button" class="dock-tab dock-tab--new" title="New draft"
          @click="store.addDraft()">
          <q-icon name="add" size="14px" />
        </button>
      </div>

      <!-- ── Body: the shared post-maker surface (same component the
           viewers embed in their comment panes) ── -->
      <div v-if="draft" :key="draft.id" class="dock-body">
        <PostMakerSurface :draft-id="draft.id" @posted="onPosted" />
      </div>
    </section>
  </transition>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import PostMakerSurface from './PostMakerSurface.vue'
import { useMakerStore, draftLabel } from 'src/stores/maker'
import { useWindowsStore } from 'src/stores/windows'
import { gotoCommentThread } from 'src/utils/threadNav'

export default defineComponent({
  name: 'MakerDock',
  components: { PostMakerSurface },
  emits: ['created'],

  setup (props, { emit }) {
    const $q = useQuasar()
    const store = useMakerStore()
    const windows = useWindowsStore()
    store.load()

    const draft = computed(() => store.activeDraft)

    // Tab label: title, else the first line of the body, else a placeholder.
    const tabLabel = draftLabel

    const askDiscard = (d) => {
      const hasWork = (d.title || '').trim() || (d.content || '').trim() || d.references.length
      if (!hasWork) { store.removeDraft(d.id); return }
      $q.dialog({
        title: 'Discard draft?',
        message: `“${tabLabel(d)}” hasn't been posted — closing its tab throws it away.`,
        cancel: { flat: true, label: 'Keep' },
        ok: { color: 'negative', flat: true, label: 'Discard' }
      }).onOk(() => store.removeDraft(d.id))
    }

    // The surface already removed the draft. Step aside so the fresh
    // element is visible behind the dock. A posted COMMENT lands in its
    // parent thread — open the root viewer and unravel down to it; plain
    // posts bubble up so MainLayout can navigate to the new post.
    const router = useRouter()
    const onPosted = ({ created, parent }) => {
      if (store.draftCount) store.minimize()
      if (parent && created?.id) {
        gotoCommentThread(router, created.id)
        return
      }
      emit('created', created)
    }

    return {
      store,
      windows,
      draft,
      tabLabel,
      askDiscard,
      onPosted
    }
  }
})
</script>

<style lang="scss" scoped>
// Shell, header bar, traffic lights and tab strip come from the shared
// .dock-window chrome in src/css/_components.scss; the footprint (right
// half of the screen, crown strip to nav bar, daylight off the side
// column) and the brown plaque come from .dock-window--creation there —
// so does maximize and the narrow-screen fallback. Only the maker's body
// layout lives here.

// ── THE WINDOW'S COAT (2026-08-26, user ask) ──
//
// `--maker-coat`: the plaque's own construction with both dials turned — the
// `--light-cream` sheet under a `--blue-grey-1` veil at 40%, where the fixed
// chrome's is `--grey-3` at 30%. The shell and the header bar both read
// `--dock-coat`, so one declaration on the window's root re-coats both.
//
// ⚠ THIS IS THE ONE SANCTIONED SECOND DECLARATION OF `--dock-coat` on the
// platform. `.dock-window--creation` states the shared dial once and the
// `dock-coat` witness (`api/scripts/fsck.js`) fails on any other — except
// this file, which it knows by name. Two rules come with the exception:
// the value must still be a background LAYER LIST used only in a
// `background:` shorthand (it is a `<color>` nowhere), and a second window
// wanting its own sheet has to be added to the witness on purpose.
// ── THE WINDOW'S DIALS LEAVE BROWN (2026-08-26, third user ask: "use
// blue-grey-6 as contrasting color on buttons, inner borders of the window,
// titles, tabs, etc… instead of the remaining brown bits") ──
//
// This is the seam `.dock-window--creation` was built for and the one CHAT
// already uses to go lime: a colorway is its LINES, WELLS and INK, and each
// of those is a `--dock-*` dial with a brown fallback. Turning the five here
// takes every brown out of the post window without touching the other four
// creation docks, which keep the warm chrome.
//
//   --dock-rule        the INNER BORDERS — shell, bar underline, tab strip,
//                      tab rims (was `--brown-3`)
//   --dock-rule-strong the active tab's rim, one step deeper (was brown-4)
//   --dock-ink         the TITLES — bar name, tab labels (was brown-8)
//   --dock-ink-mute    the meta line (was brown-4)
//   --dock-well        the resting tab face (was brown-2)
//
// ⚠ `--dock-rule`'s own declaration in `_components.scss` carries a note
// saying the dial STAYS BROWN, and the reason given there was that moving it
// would repaint every creation dock's tab strip and header underline in one
// stroke. That reason is intact: this moves the dial for ONE window, at the
// window, which is what the note's objection was about.
.maker-dock {
  --dock-coat: var(--maker-coat);
  --dock-rule: var(--maker-contrast);
  --dock-rule-strong: var(--blue-grey-8);
  --dock-ink: var(--maker-contrast);
  --dock-ink-mute: var(--blue-grey-4);
  --dock-well: var(--blue-grey-1);
}

// The one brown in the shared chrome that is NOT a dial — a tab's hover ink
// is written `var(--brown-10, #3e2723)` inline. It takes the window's deep
// step, the same tone the active tab's rim does.
.dock-tab:hover { color: var(--blue-grey-8); }

// ── THE HEADER PLATE (2026-08-26, user ask) ──
//
// The feed card's post plate, worn by the window's own name. Same dials as
// `.maker-surface__post` in PostMakerSurface — MicroChip's rim/wash/ink at
// 4px corners, lettered in `--font-display` — and the two move together:
// they are the SAME object, once at the top of the window and once at the
// control that publishes out of it.
//
// Scoped to `.maker-dock` on purpose. `.dock-bar` is shared chrome (six
// windows wear it, `css/_components.scss`), and the ask was about the post
// maker; the plate reaching the other five would be a decision nobody made.
// ⚠ ITS RIM IS SOLID `--blue-grey-8` SINCE 2026-08-26 (second user ask:
// "use solid blue-grey-8 on the contrast color, borders and buttons"). The
// card's plate closes itself with a 18% wash of the ink, which is a hairline
// meant to be read at card scale in a column of many; up here the plate is
// the window's NAME, there is exactly one of it, and the wash left it barely
// attached to the bar. Solid at the same 1px: the box is stated, the plate's
// fill and ink stay the card's.
.dock-bar__plate {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--maker-contrast);
  border-radius: 4px;
  background: rgba(var(--ink-rgb), 0.04);
  transition: background 0.12s, border-color 0.12s;

  // ⚠ GLYPH AND NAME BOTH LETTER IN THE CONTRAST since 2026-08-26's third
  // ask ("…on buttons, inner borders of the window, titles, tabs"). They were
  // the card plate's ink at 0.78 — the chip's own value, which is right on a
  // card in a feed and wrong here, where this is the one TITLE the window
  // has. The glyph keeps MicroChip's 0.85 opacity step under the word.
  .dock-bar__icon { color: var(--maker-contrast); opacity: 0.85; }
  .dock-bar__title { color: var(--maker-contrast); }
}

// ── Draft tabs — the window's contrast tone (2026-08-26, user ask) ──
//
// The active tab's lit lip and the new-tab glyph's hover were `#00829c`, the
// shared dock chrome's teal (it still lights the other five windows' tabs).
// Here they read `--maker-contrast`, the dial every accent in this window
// reads, so the whole thing lights up in exactly one colour. (The tone under
// it moved twice the same day — `--grey-6`, then `--blue-grey-8`, then
// `--blue-grey-6` — which is why it is a dial and not a level.)
//
// These tabs are rendered by THIS component, so they carry its scope
// attribute and a plain two-class rule outranks the global one — no
// `:deep()`, and nothing changes for the docks that share the stylesheet.
.dock-tab.is-active { box-shadow: inset 0 2px 0 var(--maker-contrast); }
.dock-tab--new:hover { color: var(--maker-contrast); }

// ── Body — hosts the shared PostMakerSurface (editor + refs grid) ──
.dock-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
}

// Phones: the dock is the whole screen (shared mobile chrome) — spend the
// padding on the editor instead (#675).
@media (max-width: 600px) {
  .dock-body { padding: 8px; }
}

</style>
