<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bot, Check, Clipboard, Database, LockKeyhole, Terminal, Wrench } from '@lucide/vue'

const emit = defineEmits(['notice', 'error'])
const info = ref(null)
const mode = ref('production')
const write = ref(false)
const copied = ref(false)

const args = computed(() => {
  if (!info.value) return []
  const base = mode.value === 'demo' ? info.value.demoArgs : info.value.args
  return write.value ? [...base, '--write'] : base
})
const configText = computed(() => JSON.stringify({ mcpServers: { 'cafetal-os': { command: info.value?.command || '', args: args.value } } }, null, 2))
const tools = [
  ['cafetal_resumen_general', 'Radiografía integral de la finca'], ['cafetal_listar_lotes', 'Consulta productiva de lotes'],
  ['cafetal_analizar_lote', 'Ficha 360° por lote'], ['cafetal_resumen_cosecha', 'Cosecha por período y recolector'],
  ['cafetal_resumen_beneficio', 'Rendimiento, humedad y fermentación'], ['cafetal_inventario_actual', 'Existencias y saldos negativos'],
  ['cafetal_resumen_financiero', 'Ingresos, costos y utilidad'], ['cafetal_alertas_operativas', 'Riesgos agronómicos y operativos'],
  ['cafetal_calidad_resumen', 'Puntajes SCA y atributos'], ['cafetal_trazabilidad_lote', 'Cadena operativa de origen'],
  ['cafetal_contexto_reporte', 'Paquete estructurado para informes'], ['cafetal_configuracion_reportes', 'Membrete institucional'],
  ['cafetal_planillas_corte', 'Semanas, cuadrillas, cantidades y pagos'], ['cafetal_resumen_compras', 'Acopio, proveedores, calidad y costo']
]

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(configText.value)
    copied.value = true
    emit('notice', 'Configuración MCP copiada al portapapeles.')
    setTimeout(() => { copied.value = false }, 2200)
  } catch (_error) { emit('error', 'No se pudo copiar. Seleccione el bloque y cópielo manualmente.') }
}

onMounted(async () => {
  try { info.value = await window.api.mcp.getInfo() } catch (error) { emit('error', String(error?.message || error)) }
})
</script>

<template>
  <div class="mcp-settings">
    <article class="settings-card mcp-hero-card">
      <div class="mcp-hero-icon"><Bot :size="30" /></div>
      <div><span class="eyebrow dark">IA local interoperable</span><h3>Servidor MCP por stdio</h3><p>Cafetal OS abre un proceso local sin endpoint de red. El cliente de IA recibe únicamente las respuestas de las tools que invoque; revise si ese cliente sincroniza conversaciones o resultados con servicios externos.</p></div>
      <div class="security-chip"><LockKeyhole :size="17" /> Solo lectura por defecto</div>
    </article>

    <div class="settings-grid two mcp-grid">
      <article class="settings-card">
        <div class="settings-card-title"><span><Terminal :size="20" /></span><div><h3>Configuración del cliente</h3><p>Seleccione la base y copie este bloque en su aplicación de IA.</p></div></div>
        <div class="mcp-options">
          <label>Base de datos<select v-model="mode"><option value="production">Productiva local</option><option value="demo">Demostración</option></select></label>
          <label class="check-row"><input v-model="write" type="checkbox" /> Habilitar tools de escritura</label>
        </div>
        <div v-if="write" class="mcp-warning"><strong>Modo avanzado:</strong> evite modificar la misma base simultáneamente desde la interfaz y desde la IA. Mantenga respaldos y confirme cada acción de escritura.</div>
        <div class="code-block"><button type="button" @click="copyConfig"><Check v-if="copied" :size="15" /><Clipboard v-else :size="15" /> {{ copied ? 'Copiado' : 'Copiar' }}</button><pre>{{ configText }}</pre></div>
        <dl v-if="info" class="path-list compact"><div><dt>Transporte</dt><dd>stdio local</dd></div><div><dt>Base activa</dt><dd>{{ info.databasePath }}</dd></div><div><dt>Comando</dt><dd>{{ info.command }}</dd></div></dl>
      </article>

      <article class="settings-card">
        <div class="settings-card-title"><span><Wrench :size="20" /></span><div><h3>Tools disponibles</h3><p>Consultas de dominio, no acceso SQL arbitrario.</p></div></div>
        <div class="mcp-tool-list"><div v-for="tool in tools" :key="tool[0]"><code>{{ tool[0] }}</code><span>{{ tool[1] }}</span></div></div>
        <div class="mcp-write-tools"><Database :size="18" /><div><strong>Escritura opcional</strong><span>Con <code>--write</code> se agregan tools validadas para gastos, clima y alertas fitosanitarias.</span></div></div>
      </article>
    </div>
  </div>
</template>
