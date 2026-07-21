// ─── Exportación (interfaz desde renderer) ───
// Las funciones de exportación viven en reportes.js y main.js
// Este archivo es un placeholder para exportaciones futuras

const Exportar = {
    // Función genérica para exportar datos arbitrarios
    async exportarDatos(titulo, columnas, datos) {
        return await window.api.exportar.excel({ titulo, columnas, datos });
    },

    async generarPDF(titulo, contenidoHtml) {
        return await window.api.exportar.pdf({ tipo: 'custom', titulo, contenidoHtml });
    }
};

window.Exportar = Exportar;
