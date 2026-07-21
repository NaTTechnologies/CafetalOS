// ─── Utilidades ───

const Utils = {
    // Formatear moneda en Lempiras
    moneda(valor) {
        if (valor === null || valor === undefined) return 'L 0.00';
        return 'L ' + Number(valor).toLocaleString('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    // Formatear número
    numero(valor, decimales = 2) {
        if (valor === null || valor === undefined) return '0';
        return Number(valor).toLocaleString('es-HN', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        });
    },

    // Fecha actual en formato YYYY-MM-DD
    hoy() {
        return new Date().toISOString().split('T')[0];
    },

    // Formatear fecha para mostrar
    formatearFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha + 'T12:00:00');
        return d.toLocaleDateString('es-HN', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    },

    // Mes actual en español
    mesActual() {
        return new Date().toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });
    },

    // Mostrar toast
    toast(mensaje, tipo = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.textContent = mensaje;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Mostrar modal
    mostrarModal(id) {
        document.getElementById(id).classList.add('active');
    },

    cerrarModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    // Confirmación
    confirmar(mensaje) {
        return new Promise((resolve) => {
            if (window.confirm(mensaje)) resolve(true);
            else resolve(false);
        });
    },

    // Limpiar formulario
    limpiarForm(id) {
        const container = document.getElementById(id);
        if (!container) return;
        container.querySelectorAll('input, select, textarea').forEach(el => {
            switch (el.tagName) {
                case 'SELECT':
                    el.selectedIndex = 0;
                    break;
                case 'TEXTAREA':
                    el.value = '';
                    break;
                default:
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        el.checked = false;
                    } else {
                        el.value = '';
                    }
            }
        });
    },

    // Cargar select
    async cargarSelect(selectId, data, valueKey = 'id', labelKey = 'nombre', placeholder = 'Seleccionar...') {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[valueKey];
            opt.textContent = item[labelKey];
            select.appendChild(opt);
        });
    },

    // Obtener valor de input
    getVal(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        if (el.type === 'number') return el.value === '' ? null : parseFloat(el.value);
        if (el.type === 'date') return el.value || null;
        return el.value || null;
    },

    // Setear valor de input
    setVal(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        if (val === null || val === undefined) el.value = '';
        else el.value = val;
    },

    // Escapar HTML para seguridad
    escapar(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    },

    // Obtener año actual
    añoActual() {
        return new Date().getFullYear();
    },

    // Mostrar tip contextual desde el módulo de educación
    async mostrarTip(modulo, accion) {
        try {
            const tip = await window.api.educacion.getTip(modulo, accion);
            if (tip && tip.contenido_tip) {
                const container = document.getElementById('toastContainer');
                if (!container) return;
                const toast = document.createElement('div');
                toast.className = 'toast info';
                toast.style.background = '#4E342E';
                toast.innerHTML = `${tip.icono || '💡'} ${Utils.escapar(tip.contenido_tip)}`;
                container.appendChild(toast);
                setTimeout(() => { toast.style.animation = 'fadeOut 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 6000);
            }
        } catch (e) { /* silencioso */ }
    },

    // Indicador de rendimiento de café
    indicadorRendimiento(porcentaje) {
        if (!porcentaje) return { texto: 'Sin datos', clase: '' };
        if (porcentaje >= 24) return { texto: 'Excelente', clase: 'rend-excelente' };
        if (porcentaje >= 20) return { texto: 'Bueno', clase: 'rend-bueno' };
        if (porcentaje >= 16) return { texto: 'Regular', clase: 'rend-regular' };
        return { texto: 'Bajo', clase: 'rend-malo' };
    },

    // Plantilla HTML simple para exportar
    generarHtmlTabla(titulo, columnas, datos) {
        let html = `<h3>${titulo}</h3>\n<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:12px;">\n<thead><tr>`;
        columnas.forEach(c => { html += `<th style="background:#3E2723;color:white;padding:8px;">${c}</th>`; });
        html += '</tr></thead>\n<tbody>\n';
        datos.forEach(row => {
            html += '<tr>';
            row.forEach(cell => { html += `<td style="padding:6px;border:1px solid #ddd;">${cell}</td>`; });
            html += '</tr>\n';
        });
        html += '</tbody>\n</table>\n';
        return html;
    }
};

// Exponer al contexto global para onclick en HTML dinámico
window.Utils = Utils;
