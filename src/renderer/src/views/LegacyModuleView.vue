<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CircleAlert } from '@lucide/vue'

const props = defineProps({ moduleId: { type: String, required: true } })
const host = ref(null)
const error = ref('')
let observer

const registry = {
  finca: 'Finca', lotes: 'Lotes', cosecha: 'Cosecha', beneficio: 'Beneficio', inventario: 'Inventario',
  gastos: 'Gastos', reportes: 'Reportes', sostenibilidad: 'Sostenibilidad', calidad: 'Calidad', trazabilidad: 'Trazabilidad',
  predictivo: 'Predictivo', mercado: 'Mercado', marketing: 'Marketing', clima: 'Clima',
  suscripcion: 'Suscripcion', educacion: 'Educacion', ayuda: 'Ayuda'
}

function enhanceResponsiveTables() {
  if (!host.value) return
  host.value.querySelectorAll('table').forEach(table => {
    table.classList.add('responsive-data-table')
    const headers = [...table.querySelectorAll('thead th')].map(cell => cell.textContent.trim())
    table.querySelectorAll('tbody tr').forEach(row => {
      ;[...row.children].forEach((cell, index) => {
        if (cell.tagName === 'TD') cell.dataset.label = headers[index] || `Campo ${index + 1}`
      })
    })
  })
  host.value.querySelectorAll('.table-container').forEach(container => {
    container.setAttribute('tabindex', '0')
    container.setAttribute('aria-label', 'Tabla desplazable')
  })
}

onMounted(async () => {
  try {
    const moduleName = registry[props.moduleId]
    const feature = window[moduleName]
    if (!feature?.cargar) throw new Error(`El módulo ${props.moduleId} no está disponible.`)
    await feature.cargar(host.value)
    enhanceResponsiveTables()
    observer = new window.MutationObserver(enhanceResponsiveTables)
    observer.observe(host.value, { childList: true, subtree: true })
  } catch (err) {
    console.error(err)
    error.value = err.message || 'No se pudo cargar el módulo.'
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="legacy-module-host">
    <div v-if="error" class="module-error"><CircleAlert :size="24" /><div><h2>No se pudo abrir este módulo</h2><p>{{ error }}</p></div></div>
    <div v-show="!error" ref="host" class="legacy-module-content"></div>
  </section>
</template>
