<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, LockKeyhole, UserRound } from '@lucide/vue'
import brandLogo from '../assets/cafetal-os-logo.png'

const emit = defineEmits(['authenticated'])
const username = ref('admin')
const password = ref('admin')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await window.api.auth.login({ username: username.value, password: password.value })
    emit('authenticated', user)
  } catch (err) {
    error.value = String(err?.message || err).replace(/^Error invoking remote method '[^']+': Error: /, '')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-screen">
    <section class="login-story" aria-hidden="true">
      <div class="login-brand">
        <span><img :src="brandLogo" alt="" /></span>
        <div><strong>Cafetal OS</strong><small>Comunidad abierta</small></div>
      </div>
      <div class="login-copy">
        <span class="eyebrow">Tecnología para el origen</span>
        <h1>Decisiones claras desde la finca hasta la taza.</h1>
        <p>Administre lotes, cosecha, beneficio, calidad, trazabilidad y sostenibilidad desde una aplicación local, abierta y construida con la comunidad cafetalera.</p>
      </div>
      <div class="login-landscape"><span></span><span></span><span></span></div>
    </section>

    <section class="login-panel">
      <form class="login-card" @submit.prevent="submit">
        <div class="login-card-heading">
          <span class="login-icon"><LockKeyhole :size="22" /></span>
          <div><p>Acceso local</p><h2>Iniciar sesión</h2></div>
        </div>
        <p class="login-intro">Sus datos permanecen en este equipo. Use las credenciales del usuario asignado.</p>

        <div class="auth-field">
          <label for="login-username">Usuario</label>
          <div><UserRound :size="17" /><input id="login-username" v-model.trim="username" name="username" autocomplete="username" required /></div>
        </div>

        <div class="auth-field">
          <label for="login-password">Contraseña</label>
          <div>
            <LockKeyhole :size="17" />
            <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" name="password" autocomplete="current-password" required />
            <button type="button" class="password-toggle" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
              <EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" />
            </button>
          </div>
        </div>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="login-submit" type="submit" :disabled="loading">{{ loading ? 'Verificando…' : 'Entrar a Cafetal OS' }}</button>

        <div class="default-access-note">
          <strong>Primera ejecución</strong>
          <span>Usuario: <code>admin</code> · Contraseña: <code>admin</code></span>
          <small>Cámbiela en Configuración → Mi cuenta.</small>
        </div>
      </form>
    </section>
  </main>
</template>
