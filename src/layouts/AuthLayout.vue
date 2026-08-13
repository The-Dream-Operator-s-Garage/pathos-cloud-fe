<template>
  <q-layout view="hHh lpR fFf">
    <!-- ONE crown band since 2026-08-12 (user ask — the brown frieze plaque
         that stood under it, `FriezeHeader`, is deleted from both layouts):
         the media tabs rail, the thin silver strip that is the window's top
         chrome now. Permanent since 2026-08-05 — the auth pages never park a
         viewer on it, but its space is reserved by --media-tabs-h either way,
         and it is the line every top-anchored surface starts under. -->
    <MediaTabsBar />
    <q-page-container style="padding-top: var(--media-tabs-h, 0px)">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import MediaTabsBar from 'src/components/media/MediaTabsBar.vue'
export default defineComponent({ name: 'AuthLayout', components: { MediaTabsBar } })
</script>
