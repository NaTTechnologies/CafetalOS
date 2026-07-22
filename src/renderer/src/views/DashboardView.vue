<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarRange,
  Cherry,
  CircleDollarSign,
  FlaskConical,
  Leaf,
  Map,
  PackageSearch,
  Plus,
  RefreshCw,
  Repeat2,
  Ruler,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  WalletCards,
  Warehouse
} from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import { formatCurrency, formatNumber } from '../utils/formatters'

const emit = defineEmits(['navigate'])
const loading = ref(true)
const error = ref('')
const selectedRange = ref(30)
const selectedYear = ref(new Date().getFullYear())
const selectedMetric = ref('latas')

const stats = ref({ totalLotes: 0, areaTotal: 0, cosechaMes: 0, inventarioTotal: 0 })
const activity = ref([])
const rentabilidad = ref({ total_ingresos: 0, costos_totales: 0, utilidad: 0, rentabilidad_porcentaje: 0, costos_cosecha: 0, costos_gastos: 0 })
const gastosResumen = ref([])
const inventarioResumen = ref([])
const alertas = ref([])
const comprasResumen = ref({ total_compras: 0, kilos: 0, inversion: 0, pendientes: 0 })
const rendimientoLotes = ref([])

const activityCanvas = ref(null)
const costsCanvas = ref(null)
const inventoryCanvas = ref(null)
const rendimientoCanvas = ref(null)

let activityChart
let costsChart
let inventoryChart
let rendimientoChart

const rangeOptions = [
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' }
]

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, index) => current - index)
})

const cards = computed(() => [
  { label: 'Lotes activos', value: formatNumber(stats.value.totalLotes), detail: 'parcelas en producción', icon: Map, tone: 'leaf' },
  { label: 'Área cultivada', value: `${formatNumber(stats.value.areaTotal, 1)} mz`, detail: 'superficie registrada', icon: Ruler, tone: 'earth' },
  { label: 'Cosecha del mes', value: `${formatNumber(stats.value.cosechaMes)} latas`, detail: 'avance del período', icon: Cherry, tone: 'cherry' },
  { label: 'Inventario', value: `${formatNumber(stats.value.inventarioTotal, 1)} qq`, detail: 'existencia estimada', icon: Warehouse, tone: 'gold' }
])

const expertCards = computed(() => {
  const utilidad = Number(rentabilidad.value.utilidad || 0)
  const rentPct = Number(rentabilidad.value.rentabilidad_porcentaje || 0)
  return [
    {
      label: `Ingresos ${selectedYear.value}`,
      value: formatCurrency(rentabilidad.value.total_ingresos),
      detail: `${formatNumber(comprasResumen.value.total_compras || 0)} compras registradas`,
      icon: CircleDollarSign,
      tone: 'positive'
    },
    {
      label: `Costos ${selectedYear.value}`,
      value: formatCurrency(rentabilidad.value.costos_totales),
      detail: `Corte ${formatCurrency(rentabilidad.value.costos_cosecha)} · gastos ${formatCurrency(rentabilidad.value.costos_gastos)}`,
      icon: WalletCards,
      tone: 'neutral'
    },
    {
      label: 'Utilidad estimada',
      value: formatCurrency(utilidad),
      detail: `${rentPct >= 0 ? '+' : ''}${formatNumber(rentPct, 1)}% de rentabilidad`,
      icon: TrendingUp,
      tone: utilidad >= 0 ? 'positive' : 'danger'
    },
    {
      label: 'Alertas activas',
      value: formatNumber(alertas.value.length),
      detail: alertas.value.length ? 'Requieren seguimiento fitosanitario' : 'Sin alertas críticas',
      icon: TriangleAlert,
      tone: alertas.value.length ? 'warning' : 'positive'
    }
  ]
})

const topLote = computed(() => rendimientoLotes.value[0] || null)
const inventoryTotalAvailable = computed(() => inventarioResumen.value.reduce((acc, item) => acc + Number(item.existencias_qq || 0), 0))

const insights = computed(() => {
  const items = []
  const totalCompradoKg = Number(comprasResumen.value.kilos || 0)
  items.push({
    title: 'Trazabilidad e inventario',
    icon: PackageSearch,
    text: `El inventario consolidado disponible es de ${formatNumber(inventoryTotalAvailable.value, 1)} qq. Usa esta referencia para planificar ventas y beneficio.`
  })
  items.push({
    title: 'Compras y acopio',
    icon: ShoppingCart,
    text: totalCompradoKg > 0
      ? `Se han recibido ${formatNumber(totalCompradoKg, 0)} kg en compras de café. ${formatNumber(comprasResumen.value.pendientes || 0)} registro(s) continúan pendientes de validación de calidad.`
      : 'Todavía no hay compras registradas. Si tu operación también compra café, registra proveedores y recepciones para medir el margen real.'
  })
  items.push({
    title: 'Rendimiento de beneficio',
    icon: FlaskConical,
    text: topLote.value
      ? `El lote ${topLote.value.codigo} lidera con ${formatNumber(topLote.value.rend_promedio, 1)}% de rendimiento promedio y ${formatNumber(topLote.value.procesos)} proceso(s) registrados.`
      : 'Aún no hay procesos de beneficio suficientes para comparar rendimientos por lote.'
  })
  items.push({
    title: 'Estado sanitario',
    icon: AlertTriangle,
    text: alertas.value.length
      ? `Hay ${formatNumber(alertas.value.length)} alerta(s) activas. Prioriza los lotes con incidencia fitosanitaria antes de que afecten la cosecha o la calidad.`
      : 'No se reportan alertas activas. Mantén la vigilancia climática y registra novedades oportunamente.'
  })
  return items
})

function startDateForRange(days) {
  const date = new Date()
  date.setDate(date.getDate() - Number(days || 30))
  return date.toISOString().slice(0, 10)
}

function chartLabelFromDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('es-HN', { day: '2-digit', month: 'short' }).format(date)
}

async function loadDashboard() {
  try {
    loading.value = true
    error.value = ''
    const start = startDateForRange(selectedRange.value)
    const end = new Date().toISOString().slice(0, 10)
    const [dashboardStats, days, rent, gastos, inventario, activeAlerts, compras, rendimiento] = await Promise.all([
      window.api.dashboard.getStats(),
      window.api.cosecha.getLastDays(selectedRange.value),
      window.api.dashboard.getRentabilidad(selectedYear.value),
      window.api.gastos.resumen(start, end),
      window.api.inventario.getResumen(),
      window.api.clima.getAlertas(),
      window.api.comprasCafe.getSummary(),
      window.api.beneficio.rendimientoPorLote()
    ])
    stats.value = dashboardStats || stats.value
    activity.value = days || []
    rentabilidad.value = rent || rentabilidad.value
    gastosResumen.value = gastos || []
    inventarioResumen.value = inventario || []
    alertas.value = activeAlerts || []
    comprasResumen.value = compras || comprasResumen.value
    rendimientoLotes.value = (rendimiento || []).slice(0, 6)
    await nextTick()
    renderCharts()
  } catch (err) {
    error.value = err.message || 'No fue posible cargar el resumen experto.'
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  renderActivityChart()
  renderCostsChart()
  renderInventoryChart()
  renderRendimientoChart()
}

function destroyCharts() {
  activityChart?.destroy()
  costsChart?.destroy()
  inventoryChart?.destroy()
  rendimientoChart?.destroy()
}

function renderActivityChart() {
  if (!activityCanvas.value || !window.Chart) return
  activityChart?.destroy()
  const labels = activity.value.map(row => chartLabelFromDate(row.fecha))
  const values = activity.value.map(row => Number(row[selectedMetric.value] || 0))
  const isLatas = selectedMetric.value === 'latas'
  activityChart = new window.Chart(activityCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: isLatas ? 'Latas recolectadas' : 'Kilogramos estimados',
        data: values,
        borderColor: '#b66b3d',
        backgroundColor: 'rgba(182, 107, 61, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => isLatas ? formatNumber(value) : `${formatNumber(value)} kg`
          }
        }
      }
    }
  })
}

function renderCostsChart() {
  if (!costsCanvas.value || !window.Chart) return
  costsChart?.destroy()
  const labels = gastosResumen.value.map(item => (item.categoria || 'sin_categoria').replaceAll('_', ' '))
  const values = gastosResumen.value.map(item => Number(item.total || 0))
  costsChart = new window.Chart(costsCanvas.value, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['Sin registros'],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: values.length
          ? ['#17382c', '#2f6a51', '#d7a946', '#b66b3d', '#7a8f6a', '#9b7f5f', '#3f8b77', '#dfb26c', '#6f7d73', '#b64f4f']
          : ['#d9d6cf'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
      }
    }
  })
}

function renderInventoryChart() {
  if (!inventoryCanvas.value || !window.Chart) return
  inventoryChart?.destroy()
  const labels = inventarioResumen.value.map(item => (item.tipo_producto || 'sin_producto').replaceAll('_', ' '))
  const values = inventarioResumen.value.map(item => Number(item.existencias_qq || 0))
  inventoryChart = new window.Chart(inventoryCanvas.value, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Sin registros'],
      datasets: [{
        label: 'Existencias (qq)',
        data: values.length ? values : [0],
        borderRadius: 8,
        backgroundColor: '#2f6a51',
        maxBarThickness: 34
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    }
  })
}

function renderRendimientoChart() {
  if (!rendimientoCanvas.value || !window.Chart) return
  rendimientoChart?.destroy()
  const labels = rendimientoLotes.value.map(item => item.codigo)
  const values = rendimientoLotes.value.map(item => Number(item.rend_promedio || 0))
  rendimientoChart = new window.Chart(rendimientoCanvas.value, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Sin datos'],
      datasets: [{
        label: 'Rendimiento promedio (%)',
        data: values.length ? values : [0],
        borderRadius: 8,
        backgroundColor: '#d7a946',
        maxBarThickness: 32
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, suggestedMax: 30 },
        y: { grid: { display: false } }
      }
    }
  })
}

function reloadForControls() {
  loadDashboard()
}

function refreshActivityOnly() {
  renderActivityChart()
}

onMounted(loadDashboard)
onBeforeUnmount(() => destroyCharts())
</script>

<template>
  <div class="dashboard-view expert-dashboard-view">
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

    <section class="dashboard-controls panel" :aria-busy="loading">
      <div class="panel-heading compact-heading">
        <div>
          <span>Panel experto</span>
          <h3>Controles operativos</h3>
        </div>
        <button class="text-button" @click="reloadForControls"><RefreshCw :size="16" />Actualizar datos</button>
      </div>
      <div class="controls-grid">
        <label>
          <span><CalendarRange :size="16" />Ventana analítica</span>
          <select v-model="selectedRange" @change="reloadForControls">
            <option v-for="option in rangeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span><BarChart3 :size="16" />Año financiero</span>
          <select v-model="selectedYear" @change="reloadForControls">
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
          </select>
        </label>
        <label>
          <span><Cherry :size="16" />Indicador de cosecha</span>
          <select v-model="selectedMetric" @change="refreshActivityOnly">
            <option value="latas">Latas recolectadas</option>
            <option value="kilos">Kilogramos estimados</option>
          </select>
        </label>
        <div class="dashboard-meta-box">
          <small>Estado del tablero</small>
          <strong>{{ loading ? 'Actualizando...' : 'Datos listos para análisis' }}</strong>
          <p>Resumen de {{ selectedRange }} días y finanzas {{ selectedYear }}.</p>
        </div>
      </div>
    </section>

    <section class="stats-grid" :aria-busy="loading">
      <StatCard v-for="card in cards" :key="card.label" v-bind="card" />
    </section>

    <section class="expert-kpi-grid">
      <article v-for="card in expertCards" :key="card.label" class="expert-kpi-card" :data-tone="card.tone">
        <div class="expert-kpi-icon"><component :is="card.icon" :size="20" /></div>
        <div>
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
          <small>{{ card.detail }}</small>
        </div>
      </article>
    </section>

    <section class="dashboard-grid expert-grid-main">
      <article class="panel chart-panel">
        <div class="panel-heading">
          <div>
            <span>Monitoreo diario</span>
            <h3>Ritmo de cosecha</h3>
          </div>
          <button class="text-button" @click="emit('navigate', 'cosecha')">Abrir cosecha<ArrowRight :size="15" /></button>
        </div>
        <div class="chart-frame large"><canvas ref="activityCanvas"></canvas></div>
      </article>
      <article class="panel quick-panel">
        <div class="panel-heading"><div><span>Acciones frecuentes</span><h3>Continuar trabajando</h3></div></div>
        <button @click="emit('navigate', 'gastos')"><span><WalletCards :size="19" />Registrar gasto</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'beneficio')"><span><Repeat2 :size="19" />Procesar beneficio</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'sostenibilidad')"><span><Leaf :size="19" />Actualizar sostenibilidad</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'compras')"><span><ShoppingCart :size="19" />Registrar compra</span><ArrowRight :size="16" /></button>
        <button @click="emit('navigate', 'ventas')"><span><CircleDollarSign :size="19" />Registrar venta</span><ArrowRight :size="16" /></button>
      </article>
    </section>

    <section class="analytics-grid">
      <article class="panel">
        <div class="panel-heading"><div><span>Estructura de costos</span><h3>Gastos del período</h3></div></div>
        <div class="chart-frame medium"><canvas ref="costsCanvas"></canvas></div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><span>Stock operativo</span><h3>Composición del inventario</h3></div></div>
        <div class="chart-frame medium"><canvas ref="inventoryCanvas"></canvas></div>
      </article>
      <article class="panel">
        <div class="panel-heading"><div><span>Beneficio</span><h3>Top lotes por rendimiento</h3></div></div>
        <div class="chart-frame medium"><canvas ref="rendimientoCanvas"></canvas></div>
      </article>
    </section>

    <section class="insights-grid">
      <article class="panel insights-panel">
        <div class="panel-heading">
          <div>
            <span>Lectura ejecutiva</span>
            <h3>Señales para decidir mejor</h3>
          </div>
        </div>
        <div class="insights-list">
          <article v-for="insight in insights" :key="insight.title" class="insight-card">
            <div class="insight-icon"><component :is="insight.icon" :size="18" /></div>
            <div>
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.text }}</p>
            </div>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>
