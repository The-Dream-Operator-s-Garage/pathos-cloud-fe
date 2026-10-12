<template>
  <!-- ── THE HUB (2026-10-11, user ask: "a big round button sticking to the
       center of the bottom nav bar. It should be bigger than the nav bar so
       it claims attention. Use the node icon on it … when hovered [desktop]
       / pressed [mobile], this button unravels a circular menu around itself
       where we have 4 buttons: camera, record, note and the already existing
       upload one").

       One object: the CORE (a 52px disc on a 32px bar — the chips' own
       construction, cream tile + family rim + carved glyph, at twice the
       scale, in the uploader's teal) and four PETALS that unravel on an arc
       above it. The arc opens UPWARD because the bar is the floor: the
       petals' seats are polar (`--px`/`--py`, radius 60px, 152° → 28°) and
       they travel from the core's centre to their seats, staggered, so the
       menu reads as the core unravelling rather than four buttons appearing.

       Desktop: pointer enter opens, leave closes after a 260ms grace (the
       hand crosses the gap to a petal; a shorter grace made the menu flinch).
       A click on the core toggles on every pointer kind — the phone's
       "press", and a touch laptop's. Outside taps and Escape close it. The
       glyph is `adjust` — kinds.js's node mark — because every petal mints a
       NODE.

       ⭐ THE MOUNT (2026-10-11 eve, user ask: "put it inside a container
       that is the same color as the footer nav bar, but that surrounds the
       circular node button and also ends up in a rectangular basis that
       fits inside the footer nav bar … make the node button tinier by
       making it a little denser and the icon a little bigger"). The disc
       went 52 → 40px with the glyph 28 → 32px, and it sits in a cream
       ARCH — the bar's own `--plaque-flat` and `--grey-6` lip — concentric
       with the disc above the bar's top edge, its straight sides dropping
       into a rectangle exactly the bar's height. The bar's lip breaks
       around the mount and the mount's outline carries it up and over,
       so the hub reads as the bar rising to hold the button. ── -->
  <div
    ref="rootEl"
    class="nav-hub"
    :class="{ 'is-open': open, 'is-lit': lit, 'is-row': seat === 'row' }"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
  >
    <span class="nav-hub__mount" aria-hidden="true" />
    <div class="nav-hub__petals" aria-hidden="false">
      <button
        v-for="(p, i) in petals"
        :key="p.key"
        type="button"
        class="nav-hub__petal"
        :class="'nav-hub__petal--' + p.key"
        :style="petalStyle(i)"
        :title="p.title"
        :tabindex="open ? 0 : -1"
        @click.stop="pick(p)"
      >
        <q-icon :name="p.icon" size="17px" />
      </button>
    </div>
    <button
      type="button"
      class="nav-hub__core"
      :title="open ? 'Close' : 'Capture — camera · record · note · upload'"
      :aria-expanded="open ? 'true' : 'false'"
      @click.stop="toggle"
    >
      <q-icon name="adjust" class="nav-hub__glyph" />
    </button>
  </div>
</template>

<script>
import { defineComponent, ref, onBeforeUnmount } from 'vue'
import { useWindowsStore } from 'src/stores/windows'

// Seats on the arc, left to right: the four doors in the order the ask
// named them. Angles in degrees from the core's +x axis, upward positive.
const PETALS = [
  { key: 'camera', icon: 'photo_camera', title: 'Camera — take a photo or a video', angle: 152 },
  { key: 'recorder', icon: 'mic', title: 'Record — a voice note', angle: 110 },
  { key: 'notepad', icon: 'edit_note', title: 'Note — write a private note', angle: 70 },
  { key: 'upload', icon: 'upload', title: 'Upload files, links or notes', angle: 28 }
]
const RADIUS = 60

export default defineComponent({
  name: 'NavHub',
  props: {
    // The capture window stands open — the glyph lights, as a chip's does.
    lit: { type: Boolean, default: false },
    // 'bar' (default): the hub is a free disc the host seats (NavigationBar
    // puts it absolute at the bar's centre). 'row': the hub stands IN a
    // chip row — its flow box is then one CHIP tall and the disc hangs off
    // it, so a 46px disc never stretches a 25px row (which would push every
    // chip in the row 7px down through the bar's floor — measured 2026-10-11).
    seat: { type: String, default: 'bar' }
  },
  emits: ['open-capture', 'open-uploader'],
  setup (props, { emit }) {
    const rootEl = ref(null)
    const open = ref(false)
    const windows = useWindowsStore()
    let leaveTimer = null

    const petals = PETALS
    const petalStyle = (i) => {
      const a = PETALS[i].angle * Math.PI / 180
      return {
        '--px': `${Math.round(Math.cos(a) * RADIUS)}px`,
        '--py': `${-Math.round(Math.sin(a) * RADIUS)}px`,
        '--delay': `${i * 28}ms`
      }
    }

    const clearLeave = () => { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null } }

    const onDocDown = (e) => {
      if (!rootEl.value || rootEl.value.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }

    const setOpen = (v) => {
      if (open.value === v) return
      open.value = v
      clearLeave()
      if (v) {
        document.addEventListener('pointerdown', onDocDown, true)
        document.addEventListener('keydown', onKey)
      } else {
        document.removeEventListener('pointerdown', onDocDown, true)
        document.removeEventListener('keydown', onKey)
      }
    }

    const toggle = () => setOpen(!open.value)
    // Hover is a MOUSE affordance on the DESKTOP seat only: a touch's
    // synthetic pointerenter would open the menu and the same tap's click
    // would close it again — and on the phone seat (the store's 600px gate)
    // the hub stands between two chips, where a pointer crossing the row
    // must not pop the menu on its way to LABELS.
    const hoverable = (e) => e.pointerType === 'mouse' && !windows.isMobile
    const onEnter = (e) => { if (hoverable(e)) setOpen(true) }
    const onLeave = (e) => {
      if (!hoverable(e)) return
      clearLeave()
      leaveTimer = setTimeout(() => setOpen(false), 260)
    }

    const pick = (p) => {
      setOpen(false)
      if (p.key === 'upload') emit('open-uploader')
      else emit('open-capture', p.key)
    }

    onBeforeUnmount(() => { setOpen(false); clearLeave() })

    return { rootEl, open, petals, petalStyle, toggle, onEnter, onLeave, pick }
  }
})
</script>

<style lang="scss" scoped>
// The hub's own dials — the uploader's teal family (`--uploader-contrast`
// = teal-7 rim, teal-10 word/glyph, teal-3 glow, teal-1 pale), the chips'
// cream face (`--plaque-flat`), the chips' carve. A host seats the hub
// (NavigationBar: absolute at the bar's centre on desktop, in the chip row
// on a phone) and may redial `--hub-d` (the core's diameter) and
// `--hub-foot` (the core's bottom inside the hub's box — 0 at the bar seat,
// where the box IS the disc).
.nav-hub {
  --hub-d: 40px;
  --hub-foot: 0px;
  // THE MOUNT's dials: the ring of cream around the disc, and the depth of
  // its rectangular base below the disc's centre — one bar, so the base's
  // floor is the bar's floor whenever the host puts the disc's centre on
  // the bar's top edge (both seats do).
  --hub-mount-pad: 3px;
  --hub-mount-base: var(--nav-bar-h, 32px);
  --hub-petal-d: 34px;
  --hub-rim: var(--uploader-contrast, #00897b);
  --hub-ink: var(--teal-10, #004d40);
  --hub-glow: var(--teal-3, #80cbc4);
  --hub-face: var(--plaque-flat, #f8f2e4);
  --hub-pale: var(--teal-1, #e0f2f1);
  position: relative;
  width: var(--hub-d);
  height: var(--hub-d);
  flex: 0 0 auto;
}

// THE MOUNT — the bar's own coat and lip, shaped as an arch over a box:
// a half-round top concentric with the disc (radius = disc + pad), straight
// sides from the disc's centre down, no floor rule (it stands ON the bar's
// floor). It is opaque, so it also covers the bar's lip and the lane's
// open rows under it — a cell wearing its own coat, like every chip.
.nav-hub__mount {
  --mount-r: calc(var(--hub-d) / 2 + var(--hub-mount-pad));
  position: absolute;
  z-index: 0;
  left: 50%;
  translate: -50% 0;
  bottom: calc(var(--hub-foot) + var(--hub-d) / 2 - var(--hub-mount-base));
  width: calc(var(--mount-r) * 2);
  height: calc(var(--mount-r) + var(--hub-mount-base));
  box-sizing: border-box;
  border: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 0;
  border-radius: var(--mount-r) var(--mount-r) 0 0;
  background: var(--plaque-flat, #f8f2e4);
  pointer-events: none;
}

.nav-hub__core {
  position: relative;
  z-index: 2;
  width: var(--hub-d);
  height: var(--hub-d);
  padding: 0;
  border-radius: 50%;
  border: 2px solid var(--hub-rim);
  background: var(--hub-face);
  color: var(--hub-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  // The chip's edge system at disc scale: a white lip inside the rim, a
  // grey rim ring outside it, and the cast that lifts it off the plaque.
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 85%),
    0 0 0 1px color-mix(in srgb, var(--grey-9) 30%, transparent),
    0 2px 8px -2px color-mix(in srgb, var(--grey-9) 55%, transparent);
  transition: background 0.16s, color 0.16s, border-color 0.16s, box-shadow 0.16s, transform 0.16s;
  // The glyph is 80% of the disc (32px on the 40px bar disc, ~29 on the
  // phone's 36) — the denser disc carries a BIGGER mark than the 52px
  // one did (28px, 54%): the disc is mostly node now, little cream ring.
  .nav-hub__glyph {
    font-size: calc(var(--hub-d) * 0.8);
    text-shadow: var(--chip-carve, none);
    transition: text-shadow 0.16s;
  }
  &:hover { border-color: var(--hub-ink); }
  &:active { transform: scale(0.96); }
  &:focus-visible { outline: 2px solid var(--hub-glow); outline-offset: 2px; }
}

// Unravelled: the disc INVERTS — teal fill, cream glyph — so the open
// state is unmistakable from across the room, and the petals wear the
// resting disc's own cream-and-rim skin.
.nav-hub.is-open .nav-hub__core {
  background: var(--hub-rim);
  border-color: var(--hub-rim);
  color: var(--hub-face);
  .nav-hub__glyph { text-shadow: none; }
}
// The capture window stands open: the glyph lights like a chip's does
// (`.create-btn.is-active` recipe).
.nav-hub.is-lit:not(.is-open) .nav-hub__core .nav-hub__glyph {
  color: var(--hub-glow);
  text-shadow:
    0 0 2px color-mix(in srgb, var(--hub-rim) 80%, transparent),
    0 0 6px color-mix(in srgb, var(--hub-glow) 70%, transparent);
}

.nav-hub__petals {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  z-index: 1;
  pointer-events: none;
}
.nav-hub__petal {
  position: absolute;
  left: calc(var(--hub-petal-d) / -2);
  top: calc(var(--hub-petal-d) / -2);
  width: var(--hub-petal-d);
  height: var(--hub-petal-d);
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--hub-rim);
  background: var(--hub-face);
  color: var(--hub-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: none;
  opacity: 0;
  transform: translate(0, 0) scale(0.4);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 85%),
    0 0 0 1px color-mix(in srgb, var(--grey-9) 30%, transparent),
    0 2px 6px -2px color-mix(in srgb, var(--grey-9) 55%, transparent);
  transition:
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1.2) var(--delay, 0ms),
    opacity 0.16s ease var(--delay, 0ms),
    background 0.12s, color 0.12s;
  .q-icon { text-shadow: var(--chip-carve, none); }
  &:hover { background: var(--hub-pale); border-color: var(--hub-ink); }
  &:focus-visible { outline: 2px solid var(--hub-glow); outline-offset: 1px; }
}
.nav-hub.is-open .nav-hub__petal {
  pointer-events: auto;
  opacity: 1;
  transform: translate(var(--px), var(--py)) scale(1);
}
// The bridge between core and petals: while open, the hub's hit area grows
// to the arc so the pointer crossing the gap never "leaves".
.nav-hub.is-open::before {
  content: '';
  position: absolute;
  left: calc(50% - 90px);
  top: -78px;
  width: 180px;
  height: calc(78px + var(--hub-d));
  border-radius: 90px 90px 0 0;
}

// THE ROW SEAT: the flow box is chip-height and `--hub-d` wide; the disc
// is absolute inside it, raised by `--hub-foot` so its CENTRE lands on the
// bar's top edge as at the desktop seat (the row is centred in the 32px
// bar with ~3px to spare below it: centre = bar − 3px above the row's
// floor). The mount then reaches the bar's floor and nothing hangs below
// the screen. The petals' origin follows the disc's centre.
.nav-hub.is-row {
  --hub-foot: calc(var(--nav-bar-h, 32px) - 3px - var(--hub-d) / 2);
  height: var(--nav-chip-h, 25px);
  .nav-hub__core {
    position: absolute;
    left: 0;
    bottom: var(--hub-foot);
  }
  .nav-hub__petals {
    top: auto;
    bottom: calc(var(--hub-foot) + var(--hub-d) / 2);
  }
  &.is-open::before {
    top: auto;
    bottom: var(--hub-foot);
    height: calc(78px + var(--hub-d));
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-hub__petal { transition-duration: 0.01s; }
}
</style>
