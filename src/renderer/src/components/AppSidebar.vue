<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight } from '@lucide/vue'
import { navigationGroups } from '../config/navigation'
import brandLogo from '../assets/cafetal-os-logo.png'

const props = defineProps({
  currentPage: { type: String, required: true },
  collapsed: { type: Boolean, default: false },
  version: { type: String, default: '2.2.1' }
})
const emit = defineEmits(['navigate', 'toggle'])

function readCollapsedGroups() {
  try {
    const raw = window.localStorage.getItem('cafetalos.sidebar.groups')
      ?? window.localStorage.getItem('appcafe.sidebar.groups')
      ?? '{}'
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const collapsedGroups = ref(readCollapsedGroups())
const currentGroupId = computed(() => navigationGroups.find(group => group.items.some(item => item.id === props.currentPage))?.id)

function saveGroups() {
  window.localStorage.setItem('cafetalos.sidebar.groups', JSON.stringify(collapsedGroups.value))
}

function toggleGroup(groupId) {
  collapsedGroups.value = {
    ...collapsedGroups.value,
    [groupId]: !collapsedGroups.value[groupId]
  }
  saveGroups()
}

function isGroupCollapsed(groupId) {
  return Boolean(collapsedGroups.value[groupId]) && !props.collapsed
}

watch(currentGroupId, groupId => {
  if (!groupId || !collapsedGroups.value[groupId]) return
  collapsedGroups.value = { ...collapsedGroups.value, [groupId]: false }
  saveGroups()
}, { immediate: true })
</script>

<template>
  <aside class="app-sidebar" aria-label="Navegación principal">
    <div class="brand-lockup">
      <div class="brand-mark"><img :src="brandLogo" alt="" /></div>
      <div v-show="!collapsed" class="brand-copy">
        <strong>Cafetal OS</strong><span>Comunidad</span>
      </div>
    </div>

    <nav class="nav-groups" data-testid="sidebar-scroll">
      <section v-for="group in navigationGroups" :key="group.id" class="nav-group">
        <button
          v-if="!collapsed"
          class="nav-group-toggle"
          type="button"
          :aria-expanded="!isGroupCollapsed(group.id)"
          :aria-controls="`nav-group-${group.id}`"
          @click="toggleGroup(group.id)"
        >
          <span>{{ group.label }}</span>
          <ChevronDown :size="15" :class="{ rotated: isGroupCollapsed(group.id) }" />
        </button>
        <div v-else class="nav-group-divider" :title="group.label" aria-hidden="true"></div>

        <div
          v-show="!isGroupCollapsed(group.id)"
          :id="`nav-group-${group.id}`"
          class="nav-group-items"
        >
          <button
            v-for="item in group.items"
            :key="item.id"
            class="nav-link"
            :class="{ active: currentPage === item.id }"
            :title="collapsed ? `${item.label}: ${item.description}` : item.description"
            :aria-label="item.label"
            :aria-current="currentPage === item.id ? 'page' : undefined"
            type="button"
            @click="emit('navigate', item.id)"
          >
            <component :is="item.icon" :size="19" stroke-width="1.9" />
            <span v-show="!collapsed">{{ item.label }}</span>
          </button>
        </div>
      </section>
    </nav>

    <div class="sidebar-footer">
      <div v-show="!collapsed" class="community-badge"><span>Edición comunitaria</span><small>v{{ version }}</small></div>
      <button class="collapse-button" type="button" :aria-label="collapsed ? 'Expandir menú' : 'Contraer menú'" @click="emit('toggle')">
        <ChevronRight v-if="collapsed" :size="18" />
        <ChevronLeft v-else :size="18" />
      </button>
    </div>
  </aside>
</template>
