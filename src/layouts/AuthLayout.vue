<template>
  <q-layout view="hHh lpR fFf">
    <!-- The two crown bands, in the order they stack down the top edge:
         the media tabs rail (permanent chrome since 2026-08-05 — the auth
         pages never park a viewer on it, but the strip is part of the
         window's top now and its space is reserved by --media-tabs-h
         either way, so leaving it out would float the frieze on nothing)
         and then the mercury frieze plaque, the same fixed band
         MainLayout crowns its pages with. -->
    <MediaTabsBar />
    <FriezeHeader />
    <q-page-container style="padding-top: calc(var(--frieze-h) + var(--media-tabs-h, 0px))">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeHeader from 'src/components/layout/FriezeHeader.vue'
import MediaTabsBar from 'src/components/media/MediaTabsBar.vue'
export default defineComponent({ name: 'AuthLayout', components: { FriezeHeader, MediaTabsBar } })
</script>
