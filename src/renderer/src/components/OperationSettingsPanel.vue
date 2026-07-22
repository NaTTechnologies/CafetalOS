<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Building2, CalendarRange, Plus, Save, Scale, ShoppingBasket, Sprout } from '@lucide/vue'

const props = defineProps({ isAdmin: { type: Boolean, required: true } })
const emit = defineEmits(['notice', 'error'])
const loading = ref(false)
const seasons = ref([])
const form = reactive({
  operacion_tipo: 'mixta',
  cosecha_dias_semana: '5',
  compra_control_calidad: '1',
  unidad_area: 'Manzana',
  unidad_recoleccion: 'Lata',
  unidad_comercial: 'Quintal',
  peso_lata_kg: '18'
})
const seasonForm = reactive({ nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'activa', precio_unidad_default: 0, unidad_default: 'lata', peso_lata_kg: 18, observaciones: '' })

function cleanError(error) {
  return String(error?.message || error).replace(/^Error invoking remote method '[^']+': Error: /, '')
}

function suggestedSeason() {
  const now = new Date()
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  seasonForm.nombre = `Cosecha ${startYear}-${startYear + 1}`
  seasonForm.fecha_inicio = `${startYear}-09-01`
  seasonForm.fecha_fin = `${startYear + 1}-04-30`
  seasonForm.estado = 'activa'
  seasonForm.precio_unidad_default = 0
  seasonForm.unidad_default = 'lata'
  seasonForm.peso_lata_kg = Number(form.peso_lata_kg || 18)
}

async function load() {
  try {
    const [config, seasonRows] = await Promise.all([window.api.config.getAll(), window.api.temporadas.getAll()])
    Object.keys(form).forEach(key => { if (config[key] !== undefined) form[key] = config[key] })
    seasons.value = seasonRows || []
    suggestedSeason()
  } catch (error) { emit('error', cleanError(error)) }
}

async function save() {
  if (!props.isAdmin) return emit('error', 'Solo un administrador puede cambiar el perfil operativo.')
  const weight = Number(form.peso_lata_kg)
  if (!Number.isFinite(weight) || weight < 1 || weight > 100) return emit('error', 'El peso de referencia debe estar entre 1 y 100 kg.')
  loading.value = true
  try {
    await window.api.config.update({ ...form, peso_lata_kg: String(weight) })
    emit('notice', 'Perfil operativo actualizado. Los módulos adaptarán sus flujos a esta configuración.')
  } catch (error) { emit('error', cleanError(error)) } finally { loading.value = false }
}

async function createSeason() {
  if (!props.isAdmin) return emit('error', 'Solo un administrador puede crear temporadas.')
  if (!seasonForm.nombre || !seasonForm.fecha_inicio || !seasonForm.fecha_fin) return emit('error', 'Complete nombre, fecha inicial y fecha final de la temporada.')
  try {
    await window.api.temporadas.create({ ...seasonForm, precio_unidad_default: Number(seasonForm.precio_unidad_default || 0), peso_lata_kg: Number(seasonForm.peso_lata_kg || 18) })
    seasons.value = await window.api.temporadas.getAll()
    emit('notice', `Temporada ${seasonForm.nombre} creada. Las nuevas planillas se asociarán automáticamente cuando sus fechas coincidan.`)
    suggestedSeason()
  } catch (error) { emit('error', cleanError(error)) }
}

onMounted(load)
</script>

<template>
  <div class="operation-settings-stack">
    <form class="settings-card operation-settings" @submit.prevent="save">
      <div class="settings-card-title">
        <span><Building2 :size="20" /></span>
        <div><h3>Perfil de operación cafetalera</h3><p>Configure si Cafetal OS se utilizará para producir, comprar y transformar café, o para ambas actividades.</p></div>
      </div>

      <div class="operation-profile-grid">
        <label class="operation-option" :class="{ selected: form.operacion_tipo === 'productor' }">
          <input v-model="form.operacion_tipo" type="radio" value="productor" />
          <Sprout :size="24" /><span><strong>Productor</strong><small>Finca, lotes, cortes, beneficio e inventario propio.</small></span>
        </label>
        <label class="operation-option" :class="{ selected: form.operacion_tipo === 'comprador' }">
          <input v-model="form.operacion_tipo" type="radio" value="comprador" />
          <ShoppingBasket :size="24" /><span><strong>Comprador / beneficiador</strong><small>Acopio, recepción por peso, control de calidad y transformación.</small></span>
        </label>
        <label class="operation-option" :class="{ selected: form.operacion_tipo === 'mixta' }">
          <input v-model="form.operacion_tipo" type="radio" value="mixta" />
          <Building2 :size="24" /><span><strong>Operación mixta</strong><small>Combina café propio con compras a productores y proveedores.</small></span>
        </label>
      </div>

      <div class="settings-grid two compact-grid">
        <article class="settings-subcard">
          <h4><Scale :size="17" /> Unidades de trabajo</h4>
          <label>Unidad de área<input v-model.trim="form.unidad_area" maxlength="30" /></label>
          <label>Unidad interna de recolección<input v-model.trim="form.unidad_recoleccion" maxlength="30" /></label>
          <label>Unidad comercial<input v-model.trim="form.unidad_comercial" maxlength="30" /></label>
          <label>Peso de referencia por lata/canasta (kg)<input v-model="form.peso_lata_kg" type="number" min="1" max="100" step="0.1" /></label>
        </article>
        <article class="settings-subcard">
          <h4><ShoppingBasket :size="17" /> Captura y recepción</h4>
          <label>Días visibles en la planilla semanal<select v-model="form.cosecha_dias_semana"><option value="5">Lunes a viernes</option><option value="6">Lunes a sábado</option><option value="7">Semana completa</option></select></label>
          <label class="check-row"><input v-model="form.compra_control_calidad" true-value="1" false-value="0" type="checkbox" /> Exigir revisión de humedad y calidad antes de incorporar compras al inventario</label>
          <p class="settings-help">Las compras se registran por peso. La lata o canasta se conserva como unidad operativa para el pago de cortadores y se convierte a kilogramos.</p>
        </article>
      </div>

      <button class="button solid" type="submit" :disabled="loading || !isAdmin"><Save :size="16" /> Guardar perfil operativo</button>
    </form>

    <section class="settings-card season-settings">
      <div class="settings-card-title"><span><CalendarRange :size="20" /></span><div><h3>Temporadas de café</h3><p>Agrupe planillas, cosecha, beneficio y análisis de rentabilidad por ciclo productivo.</p></div></div>
      <div class="season-layout">
        <form class="season-form" @submit.prevent="createSeason">
          <label>Nombre<input v-model.trim="seasonForm.nombre" required /></label>
          <div class="season-date-grid"><label>Inicio<input v-model="seasonForm.fecha_inicio" type="date" required /></label><label>Fin<input v-model="seasonForm.fecha_fin" type="date" required /></label></div>
          <div class="season-date-grid"><label>Estado<select v-model="seasonForm.estado"><option value="planificada">Planificada</option><option value="activa">Activa</option><option value="cerrada">Cerrada</option></select></label><label>Unidad<select v-model="seasonForm.unidad_default"><option value="lata">Lata</option><option value="kg">Kilogramo</option><option value="canasta">Canasta</option></select></label></div>
          <div class="season-date-grid"><label>Precio predeterminado<input v-model="seasonForm.precio_unidad_default" type="number" min="0" step="0.01" /></label><label>Peso kg/unidad<input v-model="seasonForm.peso_lata_kg" type="number" min="1" max="100" step="0.1" /></label></div>
          <label>Observaciones<textarea v-model.trim="seasonForm.observaciones" rows="2"></textarea></label>
          <button class="button solid" type="submit" :disabled="!isAdmin"><Plus :size="16" /> Crear temporada</button>
        </form>
        <div class="season-list">
          <article v-for="season in seasons" :key="season.id" class="season-card">
            <div><strong>{{ season.nombre }}</strong><small>{{ season.fecha_inicio }} → {{ season.fecha_fin }}</small></div>
            <span class="status-pill" :class="season.estado">{{ season.estado }}</span>
            <footer>{{ season.unidad_default }} · {{ season.peso_lata_kg }} kg/unidad · L {{ Number(season.precio_unidad_default || 0).toFixed(2) }}</footer>
          </article>
          <p v-if="!seasons.length" class="season-empty">Todavía no hay temporadas. Cree la primera para organizar las planillas de corte.</p>
        </div>
      </div>
    </section>
  </div>
</template>
