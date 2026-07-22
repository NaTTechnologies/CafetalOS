<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Archive, Bot, CheckCircle2, Database, FileCheck2, FileText, HardDrive, KeyRound, Plus, RefreshCw,
  Save, Settings2, ShieldCheck, UserCog, UsersRound, XCircle
} from '@lucide/vue'
import ReportSettingsPanel from '../components/ReportSettingsPanel.vue'
import McpSettingsPanel from '../components/McpSettingsPanel.vue'
import OperationSettingsPanel from '../components/OperationSettingsPanel.vue'

const props = defineProps({
  user: { type: Object, required: true },
  appInfo: { type: Object, required: true }
})
const emit = defineEmits(['user-updated', 'app-info-updated'])

const activeTab = ref('datos')
const loading = ref(false)
const notice = ref('')
const error = ref('')
const dbStatus = ref(null)
const users = ref([])
const resetTarget = ref(null)

const profile = reactive({ username: props.user.username, nombre: props.user.nombre })
const accountPassword = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const newUser = reactive({ username: '', nombre: '', password: '', rol: 'usuario' })
const resetPassword = reactive({ newPassword: '', confirmPassword: '' })

const isAdmin = computed(() => props.user.rol === 'admin')
const tabs = computed(() => [
  { id: 'datos', label: 'Datos y demo', icon: Database },
  { id: 'operacion', label: 'Perfil operativo', icon: Settings2 },
  { id: 'reportes', label: 'Reportes y membrete', icon: FileCheck2 },
  { id: 'inteligencia', label: 'IA local (MCP)', icon: Bot },
  { id: 'cuenta', label: 'Mi cuenta', icon: UserCog },
  ...(isAdmin.value ? [{ id: 'usuarios', label: 'Usuarios', icon: UsersRound }] : []),
  { id: 'proyecto', label: 'Proyecto abierto', icon: FileText }
])

function cleanError(err) {
  return String(err?.message || err).replace(/^Error invoking remote method '[^']+': Error: /, '')
}

function flash(message) {
  notice.value = message
  error.value = ''
  window.setTimeout(() => { if (notice.value === message) notice.value = '' }, 4500)
}

function childError(message) {
  error.value = message
  notice.value = ''
}

async function loadStatus() {
  dbStatus.value = await window.api.db.getStatus()
}

async function loadUsers() {
  if (!isAdmin.value) return
  users.value = (await window.api.auth.listUsers()).map(user => ({ ...user, saving: false }))
}

async function switchMode(mode, reset = false) {
  const action = mode === 'demo'
    ? (reset ? 'reemplazar la base demo por la demostración original' : 'abrir la base demo')
    : 'volver a la base productiva local'
  if (!window.confirm(`¿Desea ${action}? Antes de continuar se guardará la base actual.`)) return
  loading.value = true
  error.value = ''
  try {
    const info = await window.api.db.switchMode({ mode, reset })
    emit('app-info-updated', info)
    flash('Base de datos cambiada correctamente. Recargando módulos…')
    window.setTimeout(() => window.location.reload(), 600)
  } catch (err) {
    error.value = cleanError(err)
  } finally {
    loading.value = false
  }
}

async function backup() {
  loading.value = true
  try {
    await window.api.db.backup()
    flash('El respaldo se creó en la carpeta Documentos/CafetalOS/Respaldos.')
  } catch (err) {
    error.value = cleanError(err)
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  error.value = ''
  try {
    const updated = await window.api.auth.updateUser(props.user.id, {
      username: profile.username,
      nombre: profile.nombre
    })
    emit('user-updated', updated)
    flash('Perfil actualizado.')
  } catch (err) {
    error.value = cleanError(err)
  }
}

async function changeOwnPassword() {
  error.value = ''
  if (accountPassword.newPassword !== accountPassword.confirmPassword) {
    error.value = 'La confirmación de la contraseña no coincide.'
    return
  }
  try {
    await window.api.auth.changePassword({
      userId: props.user.id,
      currentPassword: accountPassword.currentPassword,
      newPassword: accountPassword.newPassword
    })
    accountPassword.currentPassword = ''
    accountPassword.newPassword = ''
    accountPassword.confirmPassword = ''
    flash('Contraseña actualizada correctamente.')
  } catch (err) {
    error.value = cleanError(err)
  }
}

async function createUser() {
  error.value = ''
  try {
    await window.api.auth.createUser({ ...newUser })
    Object.assign(newUser, { username: '', nombre: '', password: '', rol: 'usuario' })
    await loadUsers()
    flash('Usuario creado.')
  } catch (err) {
    error.value = cleanError(err)
  }
}

async function saveUser(user) {
  user.saving = true
  error.value = ''
  try {
    const updated = await window.api.auth.updateUser(user.id, {
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo
    })
    Object.assign(user, updated)
    if (Number(updated.id) === Number(props.user.id)) emit('user-updated', updated)
    flash(`Usuario ${updated.username} actualizado.`)
  } catch (err) {
    error.value = cleanError(err)
    await loadUsers()
  } finally {
    user.saving = false
  }
}

function openReset(user) {
  resetTarget.value = user
  resetPassword.newPassword = ''
  resetPassword.confirmPassword = ''
}

async function submitReset() {
  if (!resetTarget.value) return
  error.value = ''
  if (resetPassword.newPassword !== resetPassword.confirmPassword) {
    error.value = 'La confirmación de la contraseña no coincide.'
    return
  }
  try {
    await window.api.auth.changePassword({
      userId: resetTarget.value.id,
      currentPassword: '',
      newPassword: resetPassword.newPassword
    })
    flash(`Contraseña de ${resetTarget.value.username} restablecida.`)
    resetTarget.value = null
  } catch (err) {
    error.value = cleanError(err)
  }
}

async function openDoc(doc) {
  try { await window.api.app.openDocs(doc) } catch (err) { error.value = cleanError(err) }
}

onMounted(async () => {
  try {
    await Promise.all([loadStatus(), loadUsers()])
  } catch (err) {
    error.value = cleanError(err)
  }
})
</script>

<template>
  <section class="settings-view">
    <header class="settings-heading">
      <div><span class="eyebrow dark">Administración local</span><h2>Configuración de Cafetal OS</h2><p>Controle datos, usuarios, identidad de reportes, integración con IA local y documentación del proyecto.</p></div>
      <div class="security-chip"><ShieldCheck :size="18" /> Sesión protegida</div>
    </header>

    <div v-if="notice" class="settings-message success"><CheckCircle2 :size="18" />{{ notice }}</div>
    <div v-if="error" class="settings-message error"><XCircle :size="18" />{{ error }}</div>

    <div class="settings-layout">
      <nav class="settings-tabs" aria-label="Secciones de configuración">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <component :is="tab.icon" :size="18" />{{ tab.label }}
        </button>
      </nav>

      <div class="settings-content">
        <template v-if="activeTab === 'datos'">
          <article class="settings-card data-mode-card">
            <div class="settings-card-title"><span><Database :size="20" /></span><div><h3>Base de datos activa</h3><p>La aplicación mantiene separada la información productiva de la demostración.</p></div></div>
            <div class="current-mode-banner" :class="{ demo: appInfo.mode === 'demo' }">
              <div><strong>{{ appInfo.mode === 'demo' ? 'Demostración cafetalera' : 'Base productiva local' }}</strong><span>{{ appInfo.mode === 'demo' ? 'Datos ficticios para explorar todos los módulos.' : 'Información real almacenada en este equipo.' }}</span></div>
              <b>{{ appInfo.mode === 'demo' ? 'DEMO' : 'LOCAL' }}</b>
            </div>
            <dl class="path-list">
              <div><dt>Archivo actual</dt><dd>{{ dbStatus?.databasePath || appInfo.databasePath }}</dd></div>
              <div><dt>Base productiva</dt><dd>{{ dbStatus?.productionPath }}</dd></div>
              <div><dt>Base demo</dt><dd>{{ dbStatus?.demoPath }}</dd></div>
            </dl>
          </article>

          <div class="settings-grid two">
            <article class="settings-card action-card">
              <span class="action-icon demo"><RefreshCw :size="22" /></span>
              <h3>Cargar demostración</h3>
              <p>Restaura una finca hondureña ficticia con lotes, cosechas, procesos, calidad, trazabilidad y mercado.</p>
              <button class="button solid" type="button" :disabled="loading || !isAdmin" @click="switchMode('demo', true)">Cargar demo completa</button>
              <small v-if="!isAdmin">Solo un administrador puede cambiar la base.</small>
            </article>
            <article class="settings-card action-card">
              <span class="action-icon"><HardDrive :size="22" /></span>
              <h3>Base productiva</h3>
              <p>Vuelve a la información local real sin eliminar la demostración. Cada entorno conserva sus cambios.</p>
              <button class="button outline" type="button" :disabled="loading || !isAdmin || appInfo.mode === 'production'" @click="switchMode('production', false)">Abrir base productiva</button>
            </article>
          </div>

          <article class="settings-card backup-row">
            <div><Archive :size="22" /><span><strong>Respaldo manual</strong><small>Crea una copia fechada de la base activa antes de cambios importantes.</small></span></div>
            <button class="button outline" type="button" :disabled="loading" @click="backup">Crear respaldo</button>
          </article>
        </template>

        <template v-else-if="activeTab === 'operacion'">
          <OperationSettingsPanel :is-admin="isAdmin" @notice="flash" @error="childError" />
        </template>

        <template v-else-if="activeTab === 'reportes'">
          <ReportSettingsPanel :is-admin="isAdmin" @notice="flash" @error="childError" />
        </template>

        <template v-else-if="activeTab === 'inteligencia'">
          <McpSettingsPanel @notice="flash" @error="childError" />
        </template>

        <template v-else-if="activeTab === 'cuenta'">
          <div class="settings-grid two">
            <form class="settings-card form-card" @submit.prevent="saveProfile">
              <div class="settings-card-title"><span><UserCog :size="20" /></span><div><h3>Perfil</h3><p>Nombre visible y usuario de acceso.</p></div></div>
              <label>Nombre completo<input v-model.trim="profile.nombre" required /></label>
              <label>Usuario<input v-model.trim="profile.username" required minlength="3" pattern="[a-zA-Z0-9._-]+" /></label>
              <button class="button solid" type="submit"><Save :size="16" /> Guardar perfil</button>
            </form>

            <form class="settings-card form-card" @submit.prevent="changeOwnPassword">
              <div class="settings-card-title"><span><KeyRound :size="20" /></span><div><h3>Cambiar contraseña</h3><p>Use al menos seis caracteres.</p></div></div>
              <label>Contraseña actual<input v-model="accountPassword.currentPassword" type="password" autocomplete="current-password" required /></label>
              <label>Nueva contraseña<input v-model="accountPassword.newPassword" type="password" autocomplete="new-password" minlength="6" required /></label>
              <label>Confirmar contraseña<input v-model="accountPassword.confirmPassword" type="password" autocomplete="new-password" minlength="6" required /></label>
              <button class="button solid" type="submit"><KeyRound :size="16" /> Actualizar contraseña</button>
            </form>
          </div>
        </template>

        <template v-else-if="activeTab === 'usuarios'">
          <form class="settings-card new-user-form" @submit.prevent="createUser">
            <div class="settings-card-title"><span><Plus :size="20" /></span><div><h3>Nuevo usuario</h3><p>Cree cuentas independientes para el equipo de la finca.</p></div></div>
            <div class="user-form-grid">
              <label>Usuario<input v-model.trim="newUser.username" required minlength="3" pattern="[a-zA-Z0-9._-]+" /></label>
              <label>Nombre<input v-model.trim="newUser.nombre" required /></label>
              <label>Contraseña<input v-model="newUser.password" type="password" required minlength="6" /></label>
              <label>Rol<select v-model="newUser.rol"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
            </div>
            <button class="button solid" type="submit"><Plus :size="16" /> Crear usuario</button>
          </form>

          <article class="settings-card user-list-card">
            <div class="settings-card-title"><span><UsersRound :size="20" /></span><div><h3>Usuarios del sistema</h3><p>Active, desactive o cambie el rol de cada cuenta.</p></div></div>
            <div class="user-table-wrap">
              <table class="settings-table">
                <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Activo</th><th>Acciones</th></tr></thead>
                <tbody>
                  <tr v-for="item in users" :key="item.id">
                    <td><strong>{{ item.username }}</strong><small v-if="item.id === user.id">Sesión actual</small></td>
                    <td><input v-model.trim="item.nombre" /></td>
                    <td><select v-model="item.rol"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></td>
                    <td><label class="switch-control"><input v-model="item.activo" type="checkbox" /><span></span></label></td>
                    <td><div class="row-actions"><button type="button" title="Guardar usuario" @click="saveUser(item)"><Save :size="16" /></button><button type="button" :disabled="item.id === user.id" :title="item.id === user.id ? 'Use la pestaña Mi cuenta' : 'Restablecer contraseña'" @click="openReset(item)"><KeyRound :size="16" /></button></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <form v-if="resetTarget" class="settings-card reset-card" @submit.prevent="submitReset">
            <div><h3>Restablecer contraseña de {{ resetTarget.username }}</h3><p>La nueva contraseña debe tener al menos seis caracteres.</p></div>
            <label>Nueva contraseña<input v-model="resetPassword.newPassword" type="password" minlength="6" required /></label>
            <label>Confirmar<input v-model="resetPassword.confirmPassword" type="password" minlength="6" required /></label>
            <div class="row-actions text"><button class="button outline" type="button" @click="resetTarget = null">Cancelar</button><button class="button solid" type="submit">Restablecer</button></div>
          </form>
        </template>

        <template v-else>
          <article class="settings-card open-source-card">
            <div class="settings-card-title"><span><FileText :size="20" /></span><div><h3>Documentación del proyecto</h3><p>Cafetal OS se publica bajo licencia MIT y está preparado para contribuciones.</p></div></div>
            <div class="doc-links">
              <button type="button" @click="openDoc('README.md')"><strong>README principal</strong><span>Instalación, uso y estructura del repositorio.</span></button>
              <button type="button" @click="openDoc('docs/MANUAL_USUARIO.md')"><strong>Manual de usuario</strong><span>Flujos funcionales de cada módulo.</span></button>
              <button type="button" @click="openDoc('docs/ARQUITECTURA.md')"><strong>Arquitectura</strong><span>Vue 3, Electron, IPC y persistencia local.</span></button>
              <button type="button" @click="openDoc('IMG/README.md')"><strong>Galería de interfaces</strong><span>Capturas automatizadas y descripción visual.</span></button>
              <button type="button" @click="openDoc('CONTRIBUTING.md')"><strong>Cómo contribuir</strong><span>Convenciones, pruebas y pull requests.</span></button>
            </div>
            <footer><span>Versión {{ appInfo.version }}</span><span>Licencia MIT</span><span>Comunidad Cafetal OS</span></footer>
          </article>
        </template>
      </div>
    </div>
  </section>
</template>
