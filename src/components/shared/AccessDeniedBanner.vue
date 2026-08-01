<template>
  <!-- The main viewers' access-denied surface: shown instead of the
       element grid when a direct read 403s (code 40310). A subject-panel
       style frame (white body, chrome header) sized to the viewport —
       thin header carrying the item's kind icon + hashname, then the
       picture banner: TALAVERO, the porcelain octopus, guards the left, the message
       + the cloth-textured "Request Access" button sit on the slate
       field. The button fires the same loop as the locked chips: a chat
       message into the owner's inbox + the access poll they answer. On
       narrow screens the portrait shot takes over — text above him,
       button below him. -->
  <div class="octo-frame">
    <!-- SVG filter behind the button's woven-cloth grain (referenced by id). -->
    <svg class="octo-frame__defs" aria-hidden="true" focusable="false">
      <filter id="octo-cloth-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.15 0" />
        <feComposite operator="in" in2="SourceGraphic" />
        <feBlend mode="multiply" in2="SourceGraphic" />
      </filter>
    </svg>

    <header class="octo-frame__head">
      <q-icon :name="kindIcon" size="14px" class="octo-frame__kind" />
      <span class="octo-frame__addr mono" :title="address || ''">{{ address || 'private element' }}</span>
      <q-space />
      <q-icon name="lock" size="13px" class="octo-frame__lock" />
    </header>

    <div class="octo-frame__body">
      <div class="octo-banner">
        <img
          class="octo-banner__art octo-banner__art--wide"
          :src="octoWide"
          alt="Talavero, the porcelain octopus, guarding a private element"
        >
        <img
          class="octo-banner__art octo-banner__art--tall"
          :src="octoTall"
          alt="Talavero, the porcelain octopus, guarding a private element"
        >

        <div class="octo-banner__msg">
          <div class="octo-banner__kicker">
            <q-icon name="lock" size="13px" />
            <span>Private element</span>
          </div>
          <p class="octo-banner__text">
            You do not have access to this item. Please request permission to
            the owner if you really want to see this content.
          </p>
        </div>

        <div class="octo-banner__cta">
          <template v-if="!sent && !pending">
            <button
              v-if="address"
              class="btn-cloth-texture"
              :disabled="checking"
            >
              <span>Request Access</span>
              <!-- The prompt: the same request-permission module the
                   locked chips open — optional message to the owner +
                   the send. -->
              <q-menu
                v-model="promptOpen"
                anchor="bottom middle"
                self="top middle"
                :offset="[0, 10]"
              >
                <RequestAccessPanel :address="address" @sent="onSent" />
              </q-menu>
            </button>
          </template>
          <div v-else class="octo-banner__sent">
            <q-icon name="mark_chat_read" size="18px" />
            <span>{{ sent
              ? 'Request sent — the owner received your message and an access poll.'
              : 'Access already requested — the owner has your message and a pending poll.' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { accessService } from 'src/services/access.service'
import { kindFor } from 'src/utils/kinds'
import RequestAccessPanel from 'src/components/shared/RequestAccessPanel.vue'
import octoWide from 'src/assets/access-octopus-gray.png'
import octoTall from 'src/assets/access-octopus-mobile.png'

export default defineComponent({
  name: 'AccessDeniedBanner',
  components: { RequestAccessPanel },
  props: {
    // '<kind>/<hash>' of the locked element, straight from the 403
    // envelope's locked stub. The message renders without it; the
    // request button + header hashname need it.
    address: { type: String, default: null }
  },
  emits: ['sent'],
  setup (props, { emit }) {
    const sent = ref(false) // sent just now (this visit)
    const pending = ref(false) // sent earlier — the poll is still open
    const checking = ref(false)
    const promptOpen = ref(false)

    const kindIcon = computed(() =>
      kindFor((props.address || '').split('/')[0] || 'unknown').icon
    )

    // The server remembers the ask (a pending POLL): restore the
    // already-requested state across reloads so the owner isn't spammed.
    const probe = async () => {
      sent.value = false
      pending.value = false
      if (!props.address) return
      checking.value = true
      try {
        const s = await accessService.status(props.address)
        if (s?.requested) pending.value = true
      } catch (_) { /* keep the button */ }
      checking.value = false
    }
    onMounted(probe)
    watch(() => props.address, probe)

    const onSent = () => {
      promptOpen.value = false
      sent.value = true
      emit('sent')
    }

    return { octoWide, octoTall, sent, pending, checking, promptOpen, kindIcon, onSent }
  }
})
</script>

<style lang="scss" scoped>
// ── The frame — subject-panel family chrome sized to the viewport ────
// Same tokens as the viewers' panels (chrome header zone over a white
// body) so the banner reads as one of them. Height clears the page's
// 16px top padding + the fixed nav footer, so the whole thing fits
// without scrolling.
.octo-frame {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink-1:  #1f2a38;
  --panel-ink-2:  #5b6c82;

  display: flex;
  flex-direction: column;
  height: calc(100vh - 16px - var(--nav-footer-h, 48px));
  min-width: 0;
  overflow: hidden;
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  border-radius: var(--radius-md, 10px);
  box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.08));
}

.octo-frame__defs {
  position: absolute;
  width: 0;
  height: 0;
}

.octo-frame__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  font-size: 0.78em;
  color: var(--panel-ink-2);
  flex-shrink: 0;
}
.octo-frame__kind { color: var(--panel-ink-2); }
.octo-frame__addr {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9em;
  color: var(--panel-ink-1);
}
.octo-frame__lock { color: #a06070; }

// Chrome inset around the picture, mirroring .subject-panel__body's
// chrome-zone-with-inner-card pattern.
.octo-frame__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  background: var(--panel-chrome);
  padding: 8px;
}

// ── The picture banner ───────────────────────────────────────────────
// Desktop: the landscape shot is a full-bleed backdrop (octopus lives in
// its left half); the grid only places the copy on the empty slate field
// to its right. Background matches the image's own field (#2e3b44 →
// #313e47) so cover-cropping never shows a seam.
.octo-banner {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(31, 42, 56, 0.18);
  border-radius: 10px;
  color: #eef3f8;
  background: #2e3c45;
  display: grid;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr);
  grid-template-rows: 1fr auto auto 1fr;
}

.octo-banner__art {
  pointer-events: none;
  user-select: none;
}
.octo-banner__art--wide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
}
.octo-banner__art--tall { display: none; }

.octo-banner__msg {
  position: relative;
  grid-column: 2;
  grid-row: 2;
  max-width: 520px;
  padding: 0 clamp(24px, 6vw, 96px);
}
.octo-banner__cta {
  position: relative;
  grid-column: 2;
  grid-row: 3;
  padding: 26px clamp(24px, 6vw, 96px) 0;
}

.octo-banner__kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #aebfca;
  margin-bottom: 14px;
}
.octo-banner__text {
  margin: 0;
  font-size: 1.12em;
  line-height: 1.65;
  text-wrap: balance;
  color: #eef3f8;
  text-shadow: 0 1px 8px rgba(16, 26, 33, 0.35);
}

.octo-banner__sent {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88em;
  line-height: 1.5;
  color: #d9f5e3;
  .q-icon { color: #7fe0a7; flex-shrink: 0; }
}

// ── The cloth-texture button — cut from the octopus's gray felt ──────
.btn-cloth-texture {
  position: relative;
  padding: 12px 28px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3e4e;

  // Base cloth tone (warm taupe, like the rag he's holding).
  background-color: #c2bfba;

  // Soft folded-fabric volume.
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(0, 0, 0, 0.05) 50%, rgba(0, 0, 0, 0.15) 100%);

  border: none;
  border-radius: 8px;

  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);

  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;

  // Woven grain via the SVG turbulence filter above.
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: inherit;
    filter: url(#octo-cloth-texture);
    pointer-events: none;
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 6px 14px rgba(0, 0, 0, 0.18),
      inset 0 1px 2px rgba(255, 255, 255, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow:
      0 2px 5px rgba(0, 0, 0, 0.12),
      inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    cursor: default;
    opacity: 0.75;
  }
}

// ── Mobile: the portrait shot in flow — text above him, button below ──
@media (max-width: 767px) {
  .octo-frame {
    height: auto;
    min-height: calc(100vh - 16px - var(--nav-footer-h, 48px));
  }
  .octo-banner {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 1fr auto auto auto 1fr;
  }
  .octo-banner__art--wide { display: none; }
  .octo-banner__art--tall {
    display: block;
    grid-column: 1;
    grid-row: 3;
    width: 100%;
    max-height: 46vh;
    object-fit: contain;
  }
  .octo-banner__msg {
    grid-column: 1;
    grid-row: 2;
    max-width: none;
    padding: 28px 24px 8px;
    text-align: center;
  }
  .octo-banner__kicker { justify-content: center; }
  .octo-banner__cta {
    grid-column: 1;
    grid-row: 4;
    padding: 8px 24px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
