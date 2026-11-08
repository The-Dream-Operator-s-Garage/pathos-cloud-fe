<template>
  <router-view />
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount } from 'vue'
import { authService } from 'src/services/auth.service'
import { watchSessionEnd } from 'src/utils/leaveToAuth'

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
    // A logout in ANOTHER tab ends this tab's session too — reloaded onto
    // /auth so none of its windows or trail outlive the token (2026-11-08).
    const unwatch = watchSessionEnd()
    onBeforeUnmount(unwatch)
  }
})
</script>
