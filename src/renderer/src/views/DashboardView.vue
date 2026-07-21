<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Map, Ruler, Cherry, Warehouse, ArrowRight, Plus, WalletCards, Repeat2, Leaf, AlertTriangle } from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import { formatNumber } from '../utils/formatters'

const emit = defineEmits(['navigate'])
const loading = ref(true)
const error = ref('')
const stats = ref({ totalLotes: 0, areaTotal: 0, cosechaMes: 0, inventarioTotal: 0 })
const lotes = ref({})
const activity = ref([])
const canvas = ref(null)
let chart

const cards = computed(() => [
  { label: 'Lotes activos', value: formatNumber(stats.value.totalLotes), detail: 'parcelas en producción', icon: Map, tone: 'leaf' },
  { label: 'Área cultivada', value: `${formatNumber(stats.value.areaTotal, 1)} mz`, detail: 'superficie registrada', icon: Ruler, tone: 'earth' },
  { label: 'Cosecha del mes', value: `${formatNumber(stats.value.cosechaMes)} latas`, detail: 'avance del período', icon: Cherry, tone: 'cherry' },
  { label: 'Inventario', value: `${formatNumber(stats.value.inventarioTotal, 1)} qq`, detail: 'existencia estimada', icon: Warehouse, tone: 'gold' }
])

async function loadDashboard() {
  try {
    loading.value = true
    const [dashboardStats, resumen, days] = await Promise.all([
      window.api.dashboard.getStats(), window.api.lotes.getResumen(), window.api.cosecha.getLastDays(30)
    ])
    stats.value = dashboardStats || stats.value
    lotes.value = resumen || {}
    activity.value = days || []
    await nextTick()
    renderChart()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar el resumen.'
  } finally { loading.value = false }
}

function renderChart() {
  if (!canvas.value || !window.Chart) return
  chart?.destroy()
  chart = new window.Chart(canvas.value, {
    type: 'line',
    data: {
      labels: activity.value.map(row => row.fecha).slice(-14),
      datasets: [{ label: 'Latas recolectadas', data: activity.value.map(row => row.latas).slice(-14), borderColor: '#b66b3d', backgroundColor: 'rgba(182,107,61,.12)', fill: true, tension: .38, pointRadius: 2 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
  })
}

onMounted(loadDashboard)
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="dashboard-view">
    <section class="hero-panel">
      <div>
        <span class="eyebrow">Cosecha bajo control</span>
        <h2>Decisiones claras desde la finca hasta el pergamino.</h2>
        <p>Registra la operación diaria, conserva la trazabilidad y entiende el rendimiento económico de cada lote.</p>
        <div class="hero-actions">
          <button class="button primary" @click="emit('navigate', 'cosecha')"><Plus :size="17" />Registrar corte</button>
          <button class="button secondary" @click="emit('navigate', 'reportes')">Ver reportes<ArrowRight :size="17" /></button>
        </div>
      </div>
      <div class="coffee-orbit" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><Leaf :size="72" /></div>
    </section>

    <div v-if="error" class="inline-alert"><AlertTriangle :size="18" />{{ error }}</div>
    <section class="stats-grid" :aria-busy="loading">
      <StatCard v-for="card in cards" :key="card.label" v-bind="card" />
    </section>

    <section class="dashboard-grid">
      <article class="panel chart-panel">
        <div class="panel-heading"><div><span>Últimos 14 registros</span><h3>Ritmo de cosecha</h3></div><button class="text-button" @click="emit('navigate', 'cosecha')">Abrir cosecha<ArrowRight :size="15" /></button></div>
        <div class="chart-frame"><canvas ref="canvas"></canvas></div>
      </article>
      <article class="panel quick-panel">
        <div class="panel-heading"><div><span>Acciones frecuentes</span><h3>Continuar trabajando</h3></div></div>
        <button @click="emit('navigate', 'gastos')"><span><WalletCards :size="19" />Registrar gasto</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'beneficio')"><span><Repeat2 :size="19" />Procesar beneficio</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'sostenibilidad')"><span><Leaf :size="19" />Actualizar sostenibilidad</span><ArrowRight :size="16" /></button>
      </article>
    </section>
  </div>
</template>
