<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import DashboardView from './views/DashboardView.vue'
import LegacyModuleView from './views/LegacyModuleView.vue'
import LoginView from './views/LoginView.vue'
import SettingsView from './views/SettingsView.vue'
import { getNavigationItem } from './config/navigation'

const MOBILE_BREAKPOINT = 860
const readStored = (key, legacyKey, fallback = null) =>
  window.localStorage.getItem(key) ?? window.localStorage.getItem(legacyKey) ?? fallback

const currentPage = ref(readStored('cafetalos.currentPage', 'appcafe.currentPage', 'inicio'))
const sidebarCollapsed = ref(readStored('cafetalos.sidebar.collapsed', 'appcafe.sidebar.collapsed', 'false') === 'true')
const mobileSidebarOpen = ref(false)
const isMobile = ref(window.innerWidth <= MOBILE_BREAKPOINT)
const appInfo = ref({ version: '2.6.0', mode: 'production', databasePath: '' })
const currentUser = ref(null)
const authReady = ref(false)
const pageMeta = computed(() => getNavigationItem(currentPage.value))

function navigate(page) {
  currentPage.value = getNavigationItem(page).id
  window.localStorage.setItem('cafetalos.currentPage', currentPage.value)
  mobileSidebarOpen.value = false
  document.querySelector('.workspace-content')?.scrollTo({ top: 0, behavior: 'instant' })
}

function toggleSidebar() {
  if (isMobile.value) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }
  sidebarCollapsed.value = !sidebarCollapsed.value
  window.localStorage.setItem('cafetalos.sidebar.collapsed', String(sidebarCollapsed.value))
}

function updateViewportState() {
  const nextMobile = window.innerWidth <= MOBILE_BREAKPOINT
  if (isMobile.value !== nextMobile) mobileSidebarOpen.value = false
  isMobile.value = nextMobile
}

function authenticated(user) {
  currentUser.value = user
  authReady.value = true
}

async function logout() {
  try { await window.api?.auth?.logout?.() } catch { /* session may already be expired */ }
  currentUser.value = null
  currentPage.value = 'inicio'
  mobileSidebarOpen.value = false
}

function updateUser(user) {
  currentUser.value = user
}

function updateAppInfo(info) {
  appInfo.value = { ...appInfo.value, ...info }
}

window.App = {
  get paginaActual() { return currentPage.value },
  get lista() { return true },
  cargarPagina: navigate
}

let removeMenuListener
let rejectionListener
onMounted(async () => {
  window.addEventListener('resize', updateViewportState, { passive: true })
  try {
    const [info, user] = await Promise.all([
      window.api?.app?.getInfo?.(),
      window.api?.auth?.getCurrent?.()
    ])
    if (info) appInfo.value = info
    currentUser.value = user || null
  } finally {
    authReady.value = true
  }

  if (window.api?.on) removeMenuListener = window.api.on('navegar', navigate)
  rejectionListener = event => {
    if (String(event.reason?.message || event.reason).includes('AUTH_REQUIRED')) currentUser.value = null
  }
  window.addEventListener('unhandledrejection', rejectionListener)
})

onBeforeUnmount(() => {
  removeMenuListener?.()
  window.removeEventListener('resize', updateViewportState)
  if (rejectionListener) window.removeEventListener('unhandledrejection', rejectionListener)
})
</script>

<template>
  <div v-if="!authReady" class="app-loading" aria-label="Cargando Cafetal OS"><span></span><p>Preparando su finca…</p></div>
  <LoginView v-else-if="!currentUser" @authenticated="authenticated" />
  <div
    v-else
    class="app-shell"
    :class="{
      'is-collapsed': sidebarCollapsed && !isMobile,
      'is-mobile': isMobile,
      'mobile-menu-open': mobileSidebarOpen
    }"
  >
    <AppSidebar
      :current-page="currentPage"
      :collapsed="sidebarCollapsed && !isMobile"
      :version="appInfo.version"
      @navigate="navigate"
      @toggle="toggleSidebar"
    />
    <button
      v-if="isMobile && mobileSidebarOpen"
      class="sidebar-backdrop"
      type="button"
      aria-label="Cerrar menú de navegación"
      @click="mobileSidebarOpen = false"
    ></button>
    <div class="workspace">
      <AppTopbar
        :page="pageMeta"
        :mode="appInfo.mode"
        :user="currentUser"
        @toggle-menu="toggleSidebar"
        @navigate="navigate"
        @logout="logout"
      />
      <main
        class="workspace-content"
        :aria-label="pageMeta.label"
        :data-page="currentPage"
        data-testid="workspace-scroll"
      >
        <DashboardView v-if="currentPage === 'inicio'" @navigate="navigate" />
        <SettingsView
          v-else-if="currentPage === 'configuracion'"
          :user="currentUser"
          :app-info="appInfo"
          @user-updated="updateUser"
          @app-info-updated="updateAppInfo"
        />
        <LegacyModuleView v-else :key="`${currentPage}-${appInfo.mode}`" :module-id="currentPage" />
      </main>
    </div>
  </div>
</template>
