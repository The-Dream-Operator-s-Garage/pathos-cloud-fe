<template>
  <q-page class="flex flex-center bg-base">
    <div class="text-center">
      <div class="nasalization text-accent" style="font-size:3em;">404</div>
      <div class="text-dim q-mt-sm">Path not found in the pathchain.</div>
      <q-btn flat color="primary" label="Back to feed" to="/feed" class="q-mt-lg" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
export default defineComponent({ name: 'ErrorNotFound' });
</script>
