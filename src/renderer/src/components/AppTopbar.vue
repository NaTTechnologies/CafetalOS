<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Menu, Search, Database, Command, UserRound, LogOut, Settings, X } from '@lucide/vue'
import { navigationItems } from '../config/navigation'

defineProps({
  page: { type: Object, required: true },
  mode: { type: String, default: 'production' },
  user: { type: Object, default: null }
})
const emit = defineEmits(['toggle-menu', 'navigate', 'logout'])

const query = ref('')
const searchOpen = ref(false)
const userMenuOpen = ref(false)
const activeIndex = ref(0)
const searchInput = ref(null)
const topbar = ref(null)

const filteredItems = computed(() => {
  const term = query.value.trim().toLocaleLowerCase('es')
  if (!term) return navigationItems
  return navigationItems.filter(item =>
    `${item.label} ${item.description} ${item.groupLabel}`.toLocaleLowerCase('es').includes(term)
  )
})

function openSearch() {
  searchOpen.value = true
  userMenuOpen.value = false
  activeIndex.value = 0
  nextTick(() => searchInput.value?.focus())
}

function closeSearch() {
  searchOpen.value = false
  query.value = ''
  searchInput.value?.blur()
}

function choose(item) {
  if (!item) return
  emit('navigate', item.id)
  closeSearch()
}

function onSearchKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filteredItems.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    choose(filteredItems.value[activeIndex.value])
  } else if (event.key === 'Escape') {
    closeSearch()
  }
}

function onGlobalKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openSearch()
  }
  if (event.key === 'Escape') {
    closeSearch()
    userMenuOpen.value = false
  }
}

function onDocumentClick(event) {
  if (!topbar.value?.contains(event.target)) {
    closeSearch()
    userMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  document.addEventListener('pointerdown', onDocumentClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.removeEventListener('pointerdown', onDocumentClick)
})
</script>

<template>
  <header ref="topbar" class="app-topbar">
    <button class="mobile-menu-button" type="button" aria-label="Abrir o cerrar menú" @click="emit('toggle-menu')"><Menu :size="20" /></button>
    <div class="page-context">
      <p>Gestión cafetalera</p>
      <h1>{{ page.label }}</h1>
    </div>
    <div class="topbar-actions">
      <button class="mobile-search-button" type="button" aria-label="Buscar módulo" @click="openSearch"><Search :size="19" /></button>
      <div class="module-search" :class="{ open: searchOpen }">
        <Search :size="17" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="Buscar módulo"
          aria-label="Buscar módulo"
          aria-controls="module-search-results"
          :aria-expanded="searchOpen"
          @focus="searchOpen = true; userMenuOpen = false"
          @input="activeIndex = 0"
          @keydown="onSearchKeydown"
        />
        <button class="mobile-search-close" type="button" aria-label="Cerrar búsqueda" @click="closeSearch"><X :size="18" /></button>
        <kbd><Command :size="12" /> K</kbd>
        <div v-if="searchOpen" id="module-search-results" class="search-results" role="listbox">
          <button
            v-for="(item, index) in filteredItems"
            :key="item.id"
            type="button"
            role="option"
            :aria-selected="index === activeIndex"
            :class="{ selected: index === activeIndex }"
            @mouseenter="activeIndex = index"
            @click="choose(item)"
          >
            <span class="result-icon"><component :is="item.icon" :size="17" /></span>
            <span><strong>{{ item.label }}</strong><small>{{ item.groupLabel }} · {{ item.description }}</small></span>
          </button>
          <p v-if="!filteredItems.length" class="empty-search">No se encontraron módulos.</p>
        </div>
      </div>

      <button
        class="mode-chip"
        :class="{ demo: mode === 'demo' }"
        type="button"
        :title="mode === 'demo' ? 'Base demostrativa activa' : 'Base productiva local activa'"
        @click="emit('navigate', 'configuracion')"
      >
        <Database :size="15" /><span>{{ mode === 'demo' ? 'Datos demo' : 'Base local' }}</span>
      </button>

      <div class="user-menu">
        <button
          class="user-menu-trigger"
          type="button"
          :aria-expanded="userMenuOpen"
          aria-label="Abrir menú de usuario"
          @click="userMenuOpen = !userMenuOpen; searchOpen = false"
        >
          <span class="user-avatar"><UserRound :size="17" /></span>
          <span class="user-summary"><strong>{{ user?.nombre || user?.username }}</strong><small>{{ user?.rol === 'admin' ? 'Administrador' : 'Usuario' }}</small></span>
        </button>
        <div v-if="userMenuOpen" class="user-menu-popover">
          <button type="button" @click="emit('navigate', 'configuracion'); userMenuOpen = false"><Settings :size="16" /> Configuración</button>
          <button type="button" @click="emit('logout'); userMenuOpen = false"><LogOut :size="16" /> Cerrar sesión</button>
        </div>
      </div>
    </div>
  </header>
</template>
