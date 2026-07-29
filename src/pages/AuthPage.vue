<template>
  <q-page class="auth-page" :style-fn="() => ({})">
    <div class="auth-hero">
      <div class="auth-wordmark nasalization">pathos.cloud</div>
      <div class="auth-slogan">
        <span class="auth-slogan__rest">Set your mind at rest.</span>
        <span class="auth-slogan__blaze">Set your heart ablaze.</span>
      </div>
      <div class="auth-tagline">cryptographically-secured knowledge paths</div>
    </div>

    <!-- ── THE PLAQUE — one carved brown module (the docks' coat) framed by
         mercury friezes, holding BOTH doors side by side: enter | join. -->
    <div class="auth-plaque">
      <FriezeBar />

      <div class="auth-plaque__body">
        <section class="auth-half">
          <div class="auth-half__head">
            <div class="auth-half__title nasalization">enter</div>
            <div class="auth-half__sub">the chain remembers you</div>
          </div>
          <q-form class="auth-form" @submit.prevent="handleLogin">
            <q-input v-model="loginForm.username" label="Username" outlined dense
              class="auth-field" label-color="brown-8" color="teal-10"
              :rules="[v => !!v || 'Required']" />
            <q-input v-model="loginForm.password" label="Password" type="password" outlined dense
              class="auth-field" label-color="brown-8" color="teal-10"
              :rules="[v => !!v || 'Required']" />
            <q-btn type="submit" class="auth-cta auth-cta--enter nasalization full-width"
              :loading="loading" label="Enter the pathchain" unelevated />
          </q-form>
          <div class="auth-epigraph">
            what moves through the chain cannot be silently rewritten —
            every statement keeps its origin, its history, its audience
          </div>
        </section>

        <div class="auth-plaque__divide" aria-hidden="true" />

        <section class="auth-half">
          <div class="auth-half__head">
            <div class="auth-half__title nasalization">join</div>
            <div class="auth-half__sub">every entity arrives invited</div>
          </div>
          <q-form class="auth-form" @submit.prevent="handleRegister">
            <div class="auth-secret">
              <div class="auth-secret__head nasalization">
                <q-icon name="vpn_key" size="15px" class="q-mr-xs" />
                I've got a secret
              </div>
              <q-input v-model="registerForm.secret" label="Invite secret" outlined dense
                class="auth-field auth-field--secret" label-color="brown-8" color="teal-10"
                hint="a vouch from someone already inside"
                :rules="[v => !!v || 'Required']" />
            </div>
            <q-input v-model="registerForm.username" label="Choose username" outlined dense
              class="auth-field" label-color="brown-8" color="teal-10"
              :rules="[v => !!v || 'Required']" />
            <q-input v-model="registerForm.password" label="Choose password" type="password" outlined dense
              class="auth-field" label-color="brown-8" color="teal-10"
              :rules="[v => !!v || 'Required', v => v.length >= 8 || 'Min 8 chars']" />
            <q-btn type="submit" class="auth-cta auth-cta--join nasalization full-width"
              :loading="loading" label="Join the pathchain" unelevated />
          </q-form>
        </section>
      </div>

      <div v-if="errorMsg" class="auth-error">{{ errorMsg }}</div>

      <FriezeBar slim />
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

export default defineComponent({
  name: 'AuthPage',
  components: { FriezeBar },
  setup () {
    const router = useRouter()
    const authStore = useAuthStore()

    const loading = ref(false)
    const errorMsg = ref('')

    const loginForm = reactive({ username: '', password: '' })
    const registerForm = reactive({ secret: '', username: '', password: '' })

    const handleLogin = async () => {
      loading.value = true
      errorMsg.value = ''
      try {
        const result = await authStore.login(loginForm.username, loginForm.password)
        if (result.success) router.push('/feed')
        else errorMsg.value = result.error?.message || 'Login failed'
      } catch (err) {
        errorMsg.value = err.response?.data?.error?.message || 'Connection error'
      } finally {
        loading.value = false
      }
    }

    const handleRegister = async () => {
      loading.value = true
      errorMsg.value = ''
      try {
        const result = await authStore.register(
          registerForm.secret, registerForm.username, registerForm.password
        )
        if (result.success) router.push('/feed')
        else errorMsg.value = result.error?.message || 'Registration failed'
      } catch (err) {
        errorMsg.value = err.response?.data?.error?.message || 'Connection error'
      } finally {
        loading.value = false
      }
    }

    return { loading, errorMsg, loginForm, registerForm, handleLogin, handleRegister }
  }
})
</script>

<style scoped lang="scss">
// ── The auth surface: dark starfield canvas (body--dark), one warm plaque.
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 46px 14px 40px;
}

// ── HERO — wordmark + slogan over the canvas, not on the plaque.
.auth-hero {
  text-align: center;
  max-width: 92vw;
}

// Metallic wordmark: the brown plaque family CLIPPED INTO the letters, with
// a faint mint halo — warm metal catching cold light.
.auth-wordmark {
  font-size: clamp(2.1em, 6vw, 3.2em);
  letter-spacing: 0.14em;
  background: linear-gradient(172deg,
    var(--brown-1) 8%, var(--brown-3) 38%, var(--brown-1) 52%,
    var(--brown-4) 78%, var(--brown-2) 96%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(100, 255, 218, 0.16));
}

// The slogan carries the page's two temperatures: mint rest, ember blaze.
.auth-slogan {
  margin-top: 10px;
  font-size: clamp(0.98em, 2.4vw, 1.18em);
  letter-spacing: 0.04em;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.auth-slogan__rest {
  color: var(--teal-12);
  text-shadow: 0 0 16px rgba(100, 255, 218, 0.35);
}

.auth-slogan__blaze {
  background: linear-gradient(94deg, #ffd180 4%, #ffab40 36%, #ff6e40 72%, #ff3d00 98%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgba(255, 110, 64, 0.38));
}

.auth-tagline {
  margin-top: 7px;
  font-size: 0.74em;
  letter-spacing: 0.08em;
  color: var(--brown-3);
  opacity: 0.85;
}

// ── PLAQUE — the docks' brown-1 module coat with the uneven-border device
// (1px box, heavier foot) and both friezes flush to its edges. The halo is
// the one deliberately psychedelic edge: cold mint above, warm ember below.
.auth-plaque {
  width: min(940px, 96vw);
  background: var(--brown-1);
  border: 1px solid var(--brown-4);
  border-bottom-width: 3px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 4px 10px rgba(0, 0, 0, 0.42),
    0 -16px 60px -22px rgba(100, 255, 218, 0.28),
    0 26px 70px -26px rgba(255, 110, 64, 0.30);
}

.auth-plaque__body {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
}

.auth-half {
  flex: 1 1 340px;
  min-width: 0;
  padding: 24px 30px 26px;
}

.auth-half__head { margin-bottom: 16px; }

.auth-half__title {
  font-size: 1.16em;
  letter-spacing: 0.22em;
  color: var(--brown-8);
}

.auth-half__sub {
  margin-top: 3px;
  font-size: 0.78em;
  color: var(--brown-4);
  letter-spacing: 0.03em;
}

// The divide reads vertical between the halves and becomes a horizontal
// hairline when the flex wrap stacks them.
.auth-plaque__divide {
  flex: 0 0 1px;
  background: var(--brown-3);
  margin: 20px 0;
}

@media (max-width: 767px) {
  .auth-plaque__divide {
    flex-basis: 100%;
    height: 1px;
    margin: 0 26px;
  }
}

.auth-form { display: flex; flex-direction: column; gap: 4px; }

// ── FIELDS — light wells on the warm plaque: brown-2 floors, brown-8 ink,
// the focus ring in the platform's accent teal.
.auth-field {
  :deep(.q-field__control) {
    background: var(--brown-2);
    border-radius: 6px;
  }
  :deep(.q-field__control::before) { border-color: var(--brown-4); }
  :deep(.q-field__native),
  :deep(input) { color: var(--brown-10); }
  :deep(.q-field__control:hover::before) { border-color: var(--brown-8); }
  :deep(.q-field__messages) { color: var(--brown-4); }
}

// ── "I'VE GOT A SECRET" — the invite well: a darker inset with a mint
// aurora rising from its corner. The one place the plaque admits the glow
// INSIDE its body.
.auth-secret {
  position: relative;
  overflow: hidden;
  background: var(--brown-2);
  border: 1px solid var(--brown-4);
  border-radius: 8px;
  padding: 11px 13px 2px;
  margin-bottom: 14px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(120% 90% at 108% -18%, rgba(100, 255, 218, 0.34), transparent 55%),
      radial-gradient(90% 70% at -12% 118%, rgba(255, 171, 64, 0.20), transparent 60%);
  }

  .auth-field--secret :deep(.q-field__control) { background: var(--brown-1); }
}

.auth-secret__head {
  position: relative;
  font-size: 0.8em;
  letter-spacing: 0.14em;
  color: var(--brown-10);
  margin-bottom: 9px;
  display: flex;
  align-items: center;
}

// ── CTAs — mint door in, ember door in. Both ink in the deep brown.
.auth-cta {
  margin-top: 8px;
  letter-spacing: 0.12em;
  font-size: 0.82em;
  color: var(--brown-10);
  border-radius: 7px;
  transition: box-shadow 0.22s ease, filter 0.22s ease;
}

.auth-cta--enter {
  background: linear-gradient(180deg, #a7ffeb 0%, #64ffda 100%);
  &:hover { box-shadow: 0 0 22px rgba(100, 255, 218, 0.5); filter: saturate(1.25); }
}

.auth-cta--join {
  background: linear-gradient(94deg, #ffd180 0%, #ffab40 48%, #ff6e40 100%);
  &:hover { box-shadow: 0 0 22px rgba(255, 110, 64, 0.5); filter: saturate(1.25); }
}

.auth-error {
  text-align: center;
  padding: 0 20px 14px;
  font-size: 0.84em;
  color: #b71c1c;
}

// Quiet thesis line filling the enter half's slack under its CTA.
.auth-epigraph {
  margin-top: 22px;
  font-size: 0.72em;
  font-style: italic;
  line-height: 1.6;
  letter-spacing: 0.02em;
  color: var(--brown-4);
  max-width: 34ch;
}
</style>
