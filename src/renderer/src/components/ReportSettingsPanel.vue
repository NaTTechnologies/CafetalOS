<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Building2, FileCheck2, Image, Palette, Save, Trash2 } from '@lucide/vue'
import logo from '../assets/cafetal-os-logo.png'

const props = defineProps({ isAdmin: { type: Boolean, required: true } })
const emit = defineEmits(['notice', 'error'])
const loading = ref(false)
const logoName = ref('Logotipo predeterminado de Cafetal OS')
const form = reactive({
  reporte_nombre_organizacion: '', reporte_identificacion: '', reporte_direccion: '', reporte_telefono: '',
  reporte_email: '', reporte_sitio_web: '', reporte_responsable: '', reporte_logo_path: '',
  reporte_color_primario: '#17382C', reporte_color_secundario: '#D7A946',
  reporte_pie: 'Documento generado localmente por Cafetal OS.', reporte_mostrar_logo: '1'
})

const primary = computed(() => /^#[0-9A-F]{6}$/i.test(form.reporte_color_primario) ? form.reporte_color_primario : '#17382C')
const secondary = computed(() => /^#[0-9A-F]{6}$/i.test(form.reporte_color_secundario) ? form.reporte_color_secundario : '#D7A946')

function cleanError(error) {
  return String(error?.message || error).replace(/^Error invoking remote method '[^']+': Error: /, '')
}

async function load() {
  try {
    const values = await window.api.config.getAll()
    Object.keys(form).forEach(key => { if (values[key] !== undefined) form[key] = values[key] })
    if (form.reporte_logo_path) logoName.value = form.reporte_logo_path.split(/[\\/]/).pop()
  } catch (error) { emit('error', cleanError(error)) }
}

async function save() {
  if (!props.isAdmin) return emit('error', 'Solo un administrador puede modificar el membrete.')
  if (!form.reporte_nombre_organizacion.trim()) return emit('error', 'Indique el nombre de la finca u organización.')
  if (!/^#[0-9A-F]{6}$/i.test(form.reporte_color_primario) || !/^#[0-9A-F]{6}$/i.test(form.reporte_color_secundario)) return emit('error', 'Los colores deben usar formato hexadecimal, por ejemplo #17382C.')
  loading.value = true
  try {
    const values = await window.api.config.update({ ...form })
    Object.assign(form, values)
    emit('notice', 'Membrete de reportes actualizado.')
  } catch (error) { emit('error', cleanError(error)) } finally { loading.value = false }
}

async function selectLogo() {
  try {
    const result = await window.api.config.selectReportLogo()
    if (!result) return
    form.reporte_logo_path = result.path
    form.reporte_mostrar_logo = '1'
    logoName.value = result.path.split(/[\\/]/).pop()
    emit('notice', 'Logotipo copiado al almacenamiento seguro de Cafetal OS.')
  } catch (error) { emit('error', cleanError(error)) }
}

async function clearLogo() {
  try {
    await window.api.config.clearReportLogo()
    form.reporte_logo_path = ''
    logoName.value = 'Logotipo predeterminado de Cafetal OS'
    emit('notice', 'Se usará nuevamente el logotipo predeterminado.')
  } catch (error) { emit('error', cleanError(error)) }
}

async function testPdf() {
  try {
    const path = await window.api.exportar.pdf({
      titulo: 'Vista previa del membrete',
      contenidoHtml: `RESUMEN INSTITUCIONAL\nOrganización: ${form.reporte_nombre_organizacion}\nResponsable: ${form.reporte_responsable || 'No definido'}\n\nINDICADORES DE EJEMPLO\n• Área cultivada: 12.5 manzanas\n• Producción estimada: 185 quintales\n• Puntaje de calidad: 84.5 SCA\n\nOBSERVACIÓN:\nEste reporte permite validar el logotipo, colores, datos de contacto, encabezado, pie y numeración de páginas.`
    })
    if (path) emit('notice', `PDF de prueba guardado en ${path}`)
  } catch (error) { emit('error', cleanError(error)) }
}

async function applyFarmPreset() {
  if (!props.isAdmin) return emit('error', 'Solo un administrador puede aplicar datos institucionales.')
  try {
    const farm = await window.api.finca.get()
    form.reporte_nombre_organizacion = farm?.nombre || 'Mi Finca Cafetalera'
    form.reporte_direccion = farm?.ubicacion || 'Honduras'
    form.reporte_pie = `Documento operativo de ${form.reporte_nombre_organizacion}, generado localmente por Cafetal OS.`
    form.reporte_color_primario = '#17382C'
    form.reporte_color_secundario = '#D7A946'
    form.reporte_mostrar_logo = '1'
    emit('notice', farm ? 'Se cargaron los datos disponibles de la finca. Revise RTN, teléfono y responsable antes de guardar.' : 'Se aplicó una plantilla institucional inicial.')
  } catch (error) { emit('error', cleanError(error)) }
}

function applyCafetalPreset() {
  if (!props.isAdmin) return emit('error', 'Solo un administrador puede aplicar datos institucionales.')
  Object.assign(form, {
    reporte_nombre_organizacion: 'Mi Finca Cafetalera', reporte_identificacion: '', reporte_direccion: 'Honduras',
    reporte_telefono: '', reporte_email: '', reporte_sitio_web: '', reporte_responsable: '', reporte_logo_path: '',
    reporte_color_primario: '#17382C', reporte_color_secundario: '#D7A946',
    reporte_pie: 'Documento generado localmente por Cafetal OS.', reporte_mostrar_logo: '1'
  })
  logoName.value = 'Logotipo predeterminado de Cafetal OS'
  emit('notice', 'Plantilla Cafetal OS aplicada. Complete los datos propios de la organización y guarde.')
}

onMounted(load)
</script>

<template>
  <div class="report-settings-grid">
    <form class="settings-card report-form" @submit.prevent="save">
      <div class="settings-card-title"><span><FileCheck2 :size="20" /></span><div><h3>Identidad institucional</h3><p>Estos datos aparecerán en todos los reportes PDF.</p></div></div>
      <div class="report-fields">
        <label class="wide">Nombre de finca u organización<input v-model.trim="form.reporte_nombre_organizacion" required maxlength="120" /></label>
        <label>RTN, registro o identificación<input v-model.trim="form.reporte_identificacion" maxlength="80" /></label>
        <label>Responsable de emisión<input v-model.trim="form.reporte_responsable" maxlength="100" /></label>
        <label class="wide">Dirección<input v-model.trim="form.reporte_direccion" maxlength="180" /></label>
        <label>Teléfono<input v-model.trim="form.reporte_telefono" inputmode="tel" maxlength="40" /></label>
        <label>Correo<input v-model.trim="form.reporte_email" type="email" maxlength="120" /></label>
        <label class="wide">Sitio web<input v-model.trim="form.reporte_sitio_web" placeholder="https://" maxlength="160" /></label>
        <label class="wide">Texto del pie<textarea v-model.trim="form.reporte_pie" rows="3" maxlength="240"></textarea></label>
      </div>
      <div class="report-actions"><button class="button outline" type="button" :disabled="!isAdmin" @click="applyFarmPreset"><Building2 :size="16" /> Usar datos de finca</button><button class="button outline" type="button" :disabled="!isAdmin" @click="applyCafetalPreset">Aplicar plantilla</button><button class="button solid" type="submit" :disabled="loading || !isAdmin"><Save :size="16" /> Guardar membrete</button><button class="button outline" type="button" @click="testPdf">Generar PDF de prueba</button></div>
    </form>

    <div class="report-side-stack">
      <article class="settings-card logo-config-card">
        <div class="settings-card-title"><span><Image :size="20" /></span><div><h3>Logotipo</h3><p>PNG o JPG para el encabezado profesional.</p></div></div>
        <div class="logo-config-preview"><img :src="logo" alt="Logo de Cafetal OS" /><div><strong>{{ logoName }}</strong><small>El archivo seleccionado se copia al perfil local de la aplicación.</small></div></div>
        <label class="check-row"><input v-model="form.reporte_mostrar_logo" true-value="1" false-value="0" type="checkbox" /> Mostrar logotipo en los PDFs</label>
        <div class="row-actions text"><button class="button outline" type="button" :disabled="!isAdmin" @click="selectLogo"><Image :size="15" /> Seleccionar</button><button class="button ghost-danger" type="button" :disabled="!isAdmin || !form.reporte_logo_path" @click="clearLogo"><Trash2 :size="15" /> Restaurar</button></div>
      </article>

      <article class="settings-card color-config-card">
        <div class="settings-card-title"><span><Palette :size="20" /></span><div><h3>Colores del documento</h3><p>Personalice líneas, títulos y acentos.</p></div></div>
        <label>Color principal<div class="color-input"><input v-model="form.reporte_color_primario" type="color" /><input v-model.trim="form.reporte_color_primario" pattern="#[0-9A-Fa-f]{6}" /></div></label>
        <label>Color secundario<div class="color-input"><input v-model="form.reporte_color_secundario" type="color" /><input v-model.trim="form.reporte_color_secundario" pattern="#[0-9A-Fa-f]{6}" /></div></label>
      </article>

      <article class="pdf-letterhead-preview" :style="{ '--preview-primary': primary, '--preview-secondary': secondary }">
        <div class="preview-top"></div><div class="preview-head"><img v-if="form.reporte_mostrar_logo === '1'" :src="logo" alt="" /><div><strong>{{ form.reporte_nombre_organizacion || 'Mi Finca Cafetalera' }}</strong><span>{{ form.reporte_identificacion || 'Identificación institucional' }}</span><small>{{ form.reporte_direccion || 'Honduras' }}</small></div></div><div class="preview-line"></div><h4>Reporte de producción</h4><p>Encabezado, contenido y pie con identidad propia.</p><footer>{{ form.reporte_pie }}</footer>
      </article>
    </div>
  </div>
</template>
