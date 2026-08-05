<template>
  <q-layout view="hHh lpR fFf">
    <!-- Mercury frieze crown strip — same fixed band as MainLayout so
         the plaque crowns the auth pages too. -->
    <FriezeHeader />
    <q-page-container style="padding-top: calc(var(--frieze-h) + var(--media-tabs-h, 0px))">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import FriezeHeader from 'src/components/layout/FriezeHeader.vue'
export default defineComponent({ name: 'AuthLayout', components: { FriezeHeader } })
</script>
