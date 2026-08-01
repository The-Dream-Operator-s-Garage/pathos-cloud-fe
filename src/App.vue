<template>
  <router-view />
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { authService } from 'src/services/auth.service'

export default defineComponent({
  name: 'App',
  setup () {
    // On boot, if a token is cached, verify it against the API.
    // If the entity no longer exists (e.g. after a DB wipe), the 401
    // interceptor in api.js clears the cache and redirects to /auth.
    onMounted(() => {
      if (localStorage.getItem('pathos_token')) {
        authService.verify().catch(() => { /* interceptor handles 401 */ })
      }
    })
  }
})
</script>
