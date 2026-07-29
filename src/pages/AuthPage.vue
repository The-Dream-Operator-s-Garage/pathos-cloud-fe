<template>
  <q-page class="flex flex-center bg-grid" style="min-height:100vh;">
    <div style="width:min(420px,96vw);">
      <div class="text-center q-mb-xl">
        <div class="nasalization text-accent" style="font-size:2em; letter-spacing:0.1em;">pathos.cloud</div>
        <div class="text-dim" style="font-size:0.82em; margin-top:4px;">cryptographically-secured knowledge paths</div>
      </div>

      <q-card class="pathos-card q-pa-lg">
        <q-tabs v-model="tab" dense align="justify" active-color="primary"
          indicator-color="primary" class="q-mb-lg">
          <q-tab name="login" label="Login" />
          <q-tab name="register" label="Register" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="login" class="q-pa-none">
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input v-model="loginForm.username" label="Username" dark outlined dense
                :rules="[v => !!v || 'Required']" />
              <q-input v-model="loginForm.password" label="Password" type="password" dark outlined dense
                :rules="[v => !!v || 'Required']" />
              <q-btn type="submit" color="primary" class="full-width" :loading="loading"
                label="Enter the pathchain" unelevated />
            </q-form>
          </q-tab-panel>

          <q-tab-panel name="register" class="q-pa-none">
            <q-form @submit.prevent="handleRegister" class="q-gutter-md">
              <q-input v-model="registerForm.secret" label="Invite secret" dark outlined dense
                hint="You need an invite secret from an existing user"
                :rules="[v => !!v || 'Required']" />
              <q-input v-model="registerForm.username" label="Choose username" dark outlined dense
                :rules="[v => !!v || 'Required']" />
              <q-input v-model="registerForm.password" label="Choose password" type="password" dark outlined dense
                :rules="[v => !!v || 'Required', v => v.length >= 8 || 'Min 8 chars']" />
              <q-btn type="submit" color="primary" class="full-width" :loading="loading"
                label="Join the pathchain" unelevated />
            </q-form>
          </q-tab-panel>
        </q-tab-panels>

        <div v-if="errorMsg" class="text-negative text-center q-mt-md" style="font-size:0.85em;">
          {{ errorMsg }}
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

export default defineComponent({
  name: 'AuthPage',
  setup() {
    const router    = useRouter();
    const authStore = useAuthStore();

    const tab     = ref('login');
    const loading = ref(false);
    const errorMsg = ref('');

    const loginForm    = reactive({ username: '', password: '' });
    const registerForm = reactive({ secret: '', username: '', password: '' });

    const handleLogin = async () => {
      loading.value  = true;
      errorMsg.value = '';
      try {
        const result = await authStore.login(loginForm.username, loginForm.password);
        if (result.success) router.push('/feed');
        else errorMsg.value = result.error?.message || 'Login failed';
      } catch (err) {
        errorMsg.value = err.response?.data?.error?.message || 'Connection error';
      } finally {
        loading.value = false;
      }
    };

    const handleRegister = async () => {
      loading.value  = true;
      errorMsg.value = '';
      try {
        const result = await authStore.register(
          registerForm.secret, registerForm.username, registerForm.password
        );
        if (result.success) router.push('/feed');
        else errorMsg.value = result.error?.message || 'Registration failed';
      } catch (err) {
        errorMsg.value = err.response?.data?.error?.message || 'Connection error';
      } finally {
        loading.value = false;
      }
    };

    return { tab, loading, errorMsg, loginForm, registerForm, handleLogin, handleRegister };
  }
});
</script>
