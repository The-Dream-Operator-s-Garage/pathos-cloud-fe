<template>
  <!-- The 404 surface: Talavero, the porcelain octopus, guards the paths
       that do not exist the same way he guards the ones you cannot read
       (AccessDeniedBanner) — one guardian for every dead end. Desktop:
       the landscape shot as full-bleed backdrop, copy on the empty slate
       field to his right; narrow screens: the portrait shot in flow. -->
  <!-- Plain div on purpose: this route mounts OUTSIDE any QLayout (the
       top-level catchAll), and a q-page without a layout renders nothing. -->
  <div class="notfound-page">
    <div class="octo-banner">
      <img
        class="octo-banner__art octo-banner__art--wide"
        :src="octoWide"
        alt="Talavero, the porcelain octopus, guarding a path that does not exist"
      >
      <img
        class="octo-banner__art octo-banner__art--tall"
        :src="octoTall"
        alt="Talavero, the porcelain octopus, guarding a path that does not exist"
      >

      <div class="octo-banner__msg">
        <div class="nasalization octo-banner__code">404</div>
        <p class="octo-banner__text">
          Path not found in the pathchain. Talavero has looked everywhere —
          whatever stood here was never minted, or its address is mistyped.
        </p>
      </div>

      <div class="octo-banner__cta">
        <q-btn
          unelevated no-caps color="primary" icon="arrow_back"
          label="Back to feed" to="/feed"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import octoWide from 'src/assets/access-octopus-gray.png'
import octoTall from 'src/assets/access-octopus-mobile.png'

export default defineComponent({
  name: 'ErrorNotFound',
  setup () {
    return { octoWide, octoTall }
  }
})
</script>

<style lang="scss" scoped>
.notfound-page {
  display: flex;
  min-height: 100vh;
  padding: 16px;
  background: var(--page-canvas, #1d262f);
}

// The same picture-banner pattern as AccessDeniedBanner's octo-banner —
// background matches the image's own slate field so cover-cropping never
// shows a seam.
.octo-banner {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: calc(100vh - 32px); // no layout chrome out here — full window
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

.octo-banner__code {
  font-size: 3em;
  color: #aebfca;
  margin-bottom: 10px;
}
.octo-banner__text {
  margin: 0;
  font-size: 1.12em;
  line-height: 1.65;
  text-wrap: balance;
  color: #eef3f8;
  text-shadow: 0 1px 8px rgba(16, 26, 33, 0.35);
}

@media (max-width: 767px) {
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
  .octo-banner__cta {
    grid-column: 1;
    grid-row: 4;
    padding: 8px 24px 28px;
    display: flex;
    justify-content: center;
  }
}
</style>
