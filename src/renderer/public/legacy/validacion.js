// ─── Validación inteligente de formularios ─────────────────────────
// Mantiene compatibilidad con los módulos heredados y agrega validaciones
// cruzadas, cálculos derivados y recomendaciones operativas en tiempo real.

const Validador = {
    rules: {
        required: val => (val === null || val === undefined || String(val).trim() === '') ? 'Este campo es obligatorio' : null,
        number: val => (val === null || val === undefined || val === '') ? null : (!Number.isFinite(Number(val)) ? 'Debe ser un número válido' : null),
        positive: val => (val === null || val === undefined || val === '') ? null : (Number(val) <= 0 ? 'Debe ser mayor que 0' : null),
        nonNegative: val => (val === null || val === undefined || val === '') ? null : (Number(val) < 0 ? 'No puede ser negativo' : null),
        integer: val => (val === null || val === undefined || val === '') ? null : (!Number.isInteger(Number(val)) ? 'Debe ser un número entero' : null),
        min: (val, min) => (val === null || val === undefined || val === '') ? null : (Number(val) < Number(min) ? `El valor mínimo es ${min}` : null),
        max: (val, max) => (val === null || val === undefined || val === '') ? null : (Number(val) > Number(max) ? `El valor máximo es ${max}` : null),
        minLength: (val, min) => !val ? null : (String(val).trim().length < min ? `Mínimo ${min} caracteres` : null),
        maxLength: (val, max) => !val ? null : (String(val).length > max ? `Máximo ${max} caracteres` : null),
        select: val => (!val || val === '') ? 'Debes seleccionar una opción' : null,
        date: val => !val ? null : (/^\d{4}-\d{2}-\d{2}$/.test(val) && !Number.isNaN(Date.parse(`${val}T00:00:00`)) ? null : 'Fecha inválida'),
        notFuture: val => !val ? null : (val > new Date().toISOString().slice(0, 10) ? 'La fecha no puede estar en el futuro' : null),
        pattern: (val, regex, msg) => !val ? null : (regex.test(val) ? null : (msg || 'Formato inválido')),
        email: val => !val ? null : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Correo electrónico inválido'),
        phone: val => !val ? null : (/^[\d\s\-+()]{7,20}$/.test(val) ? null : 'Teléfono inválido')
    },

    validarCampo(id, validaciones) {
        const el = document.getElementById(id);
        if (!el) return true;
        const val = el.value;
        for (const item of validaciones) {
            let regla, args = [], msg = null;
            if (typeof item === 'string') regla = item;
            else if (Array.isArray(item)) {
                regla = item[0]; args = item.slice(1);
                if (args.length && typeof args[args.length - 1] === 'string' && Number.isNaN(Number(args[args.length - 1]))) msg = args.pop();
            } else if (item && typeof item === 'object') {
                regla = item.regla; args = item.args || []; msg = item.msg || null;
            }
            const fn = this.rules[regla];
            if (!fn) continue;
            const error = fn(val, ...args);
            if (error) { this._mostrarError(el, msg || error); return false; }
        }
        this._limpiarError(el);
        return true;
    },

    validarForm(campos) {
        this._limpiarTodo();
        let valido = true;
        for (const [id, reglas] of Object.entries(campos || {})) if (!this.validarCampo(id, reglas)) valido = false;
        if (!this._validarContexto()) valido = false;
        if (!valido) {
            const first = document.querySelector('.is-invalid');
            first?.focus(); first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valido;
    },

    _value(id) { return document.getElementById(id)?.value ?? ''; },
    _number(id) { const n = Number(this._value(id)); return Number.isFinite(n) ? n : 0; },
    _invalidate(id, message) { const el = document.getElementById(id); if (el) this._mostrarError(el, message); return false; },

    _validarContexto() {
        let valid = true;
        const has = id => Boolean(document.getElementById(id));

        if (has('finca-area-total')) {
            const total = this._number('finca-area-total'), cafe = this._number('finca-area-cafe');
            if (cafe > total && total > 0) valid = this._invalidate('finca-area-cafe', 'El área cultivada no puede superar el área total.') && valid;
        }
        if (has('lote-año')) {
            const year = this._number('lote-año'), max = new Date().getFullYear() + 1;
            if (year && (year < 1900 || year > max)) valid = this._invalidate('lote-año', `Use un año entre 1900 y ${max}.`) && valid;
            const density = this._number('lote-densidad');
            if (density && (density < 100 || density > 15000)) valid = this._invalidate('lote-densidad', 'Revise la densidad: debe estar entre 100 y 15,000 plantas por manzana.') && valid;
        }
        if (has('corte-fecha') && this._value('corte-fecha') > new Date().toISOString().slice(0, 10)) valid = this._invalidate('corte-fecha', 'No puede registrar una cosecha futura.') && valid;
        if (has('corte-hora-ini') && this._value('corte-hora-fin') && this._value('corte-hora-fin') <= this._value('corte-hora-ini')) valid = this._invalidate('corte-hora-fin', 'La hora final debe ser posterior a la hora inicial.') && valid;

        if (has('beneficio-cereza')) {
            const cereza = this._number('beneficio-cereza'), pergamino = this._number('beneficio-pergamino');
            if (pergamino > cereza && cereza > 0) valid = this._invalidate('beneficio-pergamino', 'El pergamino seco no puede superar el peso de cereza ingresado.') && valid;
            const start = this._value('beneficio-fecha-ini'), end = this._value('beneficio-fecha-fin');
            if (start && end && end < start) valid = this._invalidate('beneficio-fecha-fin', 'La fecha final no puede ser anterior al inicio.') && valid;
            const humidity = this._number('beneficio-humedad');
            if (humidity && (humidity < 7 || humidity > 18)) valid = this._invalidate('beneficio-humedad', 'La humedad registrada está fuera de un rango operativo razonable (7–18%).') && valid;
        }
        if (has('inv-tipo')) {
            const movement = this._value('inv-tipo');
            if (movement === 'venta') {
                if (!this._value('inv-cliente').trim()) valid = this._invalidate('inv-cliente', 'Indique el cliente de la venta.') && valid;
                if (this._number('inv-precio') <= 0) valid = this._invalidate('inv-precio', 'Indique un precio por quintal mayor que cero.') && valid;
            }
        }
        if (has('gasto-fecha') && this._value('gasto-fecha') > new Date().toISOString().slice(0, 10)) valid = this._invalidate('gasto-fecha', 'No puede registrar un gasto futuro.') && valid;
        if (has('clima-tmax') && this._number('clima-tmax') < this._number('clima-tmin')) valid = this._invalidate('clima-tmax', 'La temperatura máxima no puede ser menor que la mínima.') && valid;
        if (has('clima-humedad')) {
            const humidity = this._number('clima-humedad');
            if (humidity < 0 || humidity > 100) valid = this._invalidate('clima-humedad', 'La humedad relativa debe estar entre 0 y 100%.') && valid;
        }
        if (has('calidad-fragancia')) {
            for (const id of ['calidad-fragancia','calidad-sabor','calidad-acidez','calidad-cuerpo','calidad-uniformidad','calidad-taza','calidad-dulzor']) {
                const value = this._number(id);
                if (value < 0 || value > 10) valid = this._invalidate(id, 'Cada atributo de catación debe estar entre 0 y 10.') && valid;
            }
        }
        if (has('cert-obtencion')) {
            const obtained = this._value('cert-obtencion'), expires = this._value('cert-vencimiento');
            if (obtained && expires && expires <= obtained) valid = this._invalidate('cert-vencimiento', 'El vencimiento debe ser posterior a la obtención.') && valid;
        }
        if (has('practica-area') && this._number('practica-area') < 0) valid = this._invalidate('practica-area', 'El área no puede ser negativa.') && valid;
        if (has('alerta-nivel') && this._value('alerta-nivel') === 'alto' && this._value('alerta-recomendacion').trim().length < 8) valid = this._invalidate('alerta-recomendacion', 'Una alerta alta debe incluir una recomendación clara.') && valid;
        if (has('mkt-campana-inicio')) {
            const start = this._value('mkt-campana-inicio'), end = this._value('mkt-campana-fin');
            if (start && end && end < start) valid = this._invalidate('mkt-campana-fin', 'La campaña no puede finalizar antes de iniciar.') && valid;
            if (this._value('mkt-campana-estado') === 'activa' && this._value('mkt-campana-contenido').trim().length < 3) valid = this._invalidate('mkt-campana-contenido', 'Una campaña activa necesita contenido.') && valid;
        }
        return valid;
    },

    activarInteligencia(container) {
        if (!container) return;
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.dataset.smartValidation === '1') return;
            input.dataset.smartValidation = '1';
            const update = () => this._actualizarInteligencia(container);
            input.addEventListener('input', update);
            input.addEventListener('change', update);
            input.addEventListener('blur', () => this._validarNativo(input));
        });
        this._actualizarInteligencia(container);
    },

    _validarNativo(input) {
        const value = String(input.value ?? '').trim();
        let error = null;
        if (input.required && !value) error = 'Este campo es obligatorio';
        else if (value && input.type === 'email') error = this.rules.email(value);
        else if (value && input.type === 'number') {
            error = this.rules.number(value);
            if (!error && input.min !== '' && Number(value) < Number(input.min)) error = `El valor mínimo es ${input.min}`;
            if (!error && input.max !== '' && Number(value) > Number(input.max)) error = `El valor máximo es ${input.max}`;
        } else if (value && input.type === 'date') error = this.rules.date(value);
        if (!error && value && input.pattern) {
            try { if (!new RegExp(`^(?:${input.pattern})$`).test(value)) error = 'El formato no es válido'; } catch (_) { /* patrón HTML inválido: lo gestiona el navegador */ }
        }
        if (error) this._mostrarError(input, error); else this._limpiarError(input);
        return !error;
    },

    _insightHost(container) {
        const modalBody = container.querySelector('.modal-overlay.active .modal-body') || container.querySelector('.modal-body') || container.querySelector('form') || container.querySelector('.page-body');
        if (!modalBody) return null;
        let host = modalBody.querySelector(':scope > .smart-form-insights');
        if (!host) { host = document.createElement('div'); host.className = 'smart-form-insights'; modalBody.appendChild(host); }
        return host;
    },

    _actualizarInteligencia(container) {
        const insights = [];
        const has = id => Boolean(document.getElementById(id));
        const set = (id, value) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = value; };

        if (has('corte-latas')) {
            const latas = this._number('corte-latas'), peso = this._number('corte-peso-lata') || 18, precio = this._number('corte-precio');
            if (latas > 0) { set('corte-kilos', (latas * peso).toFixed(1)); set('corte-total', (latas * precio).toFixed(2)); insights.push({ tone: 'info', title: 'Cálculo automático', text: `${latas} latas equivalen a ${(latas * peso).toFixed(1)} kg y L ${(latas * precio).toFixed(2)} de pago estimado.` }); }
            const maturity = this._value('corte-madurez');
            if (['verde','mixto','sobremaduro'].includes(maturity)) insights.push({ tone: 'warning', title: 'Control de selección', text: 'La madurez seleccionada puede afectar uniformidad, rendimiento y calidad. Documente la causa.' });
        }

        if (has('beneficio-cereza')) {
            const cereza = this._number('beneficio-cereza'), pergamino = this._number('beneficio-pergamino');
            if (cereza > 0 && pergamino > 0) {
                const yieldPct = pergamino / cereza * 100; set('beneficio-rendimiento', `${yieldPct.toFixed(1)}%`);
                const tone = yieldPct >= 16 && yieldPct <= 28 ? 'success' : 'warning';
                insights.push({ tone, title: 'Rendimiento cereza → pergamino', text: `${yieldPct.toFixed(1)}%. ${tone === 'success' ? 'El resultado está dentro del rango operativo configurado.' : 'Revise pesaje, selección, pulpa, secado o unidades antes de guardar.'}` });
            }
            const humidity = this._number('beneficio-humedad');
            if (humidity) insights.push({ tone: humidity >= 10 && humidity <= 12 ? 'success' : 'warning', title: 'Humedad final', text: humidity >= 10 && humidity <= 12 ? 'La humedad está en el intervalo recomendado para almacenamiento del pergamino.' : 'La humedad se aparta de 10–12%; verifique el medidor y las condiciones de secado.' });
            const method = this._value('beneficio-metodo'), fermentation = this._number('beneficio-fermentacion');
            if (method === 'lavado' && fermentation > 36) insights.push({ tone: 'warning', title: 'Fermentación prolongada', text: 'Confirme temperatura, pH y objetivo sensorial antes de registrar este tiempo.' });
        }

        if (has('inv-cantidad')) {
            const qq = this._number('inv-cantidad'), price = this._number('inv-precio');
            if (qq > 0) { set('inv-kilos', (qq * 46).toFixed(1)); if (this._value('inv-tipo') === 'venta') set('inv-total', (qq * price).toFixed(2)); insights.push({ tone: 'info', title: 'Conversión de inventario', text: `${qq.toFixed(2)} qq equivalen a ${(qq * 46).toFixed(1)} kg.` }); }
        }

        if (has('gasto-cantidad')) {
            const quantity = this._number('gasto-cantidad') || 1, unit = this._number('gosto-unitario');
            if (unit > 0) { const total = quantity * unit; set('gasto-total', total.toFixed(2)); insights.push({ tone: 'info', title: 'Costo calculado', text: `${quantity} × L ${unit.toFixed(2)} = L ${total.toFixed(2)}.` }); }
            if (!this._value('gasto-lote')) insights.push({ tone: 'warning', title: 'Costo sin lote', text: 'Este gasto quedará como general. Asignarlo a un lote mejora el análisis de rentabilidad por parcela.' });
        }

        if (has('calidad-fragancia')) {
            const ids = ['calidad-fragancia','calidad-sabor','calidad-acidez','calidad-cuerpo','calidad-uniformidad','calidad-taza','calidad-dulzor'];
            const values = ids.map(id => this._number(id));
            if (values.some(Boolean)) {
                const score = values.reduce((sum, value) => sum + value, 0); set('calidad-puntaje-preview', score.toFixed(1));
                insights.push({ tone: score >= 80 ? 'success' : 'info', title: 'Lectura de calidad', text: `${score.toFixed(1)} puntos calculados. ${score >= 80 ? 'El lote alcanza el umbral usado por el sistema para identificar café de especialidad.' : 'Use las notas de catación para explicar oportunidades de mejora.'}` });
            }
        }

        if (has('clima-humedad')) {
            const humidity = this._number('clima-humedad'), rain = this._number('clima-precipitacion'), max = this._number('clima-tmax'), min = this._number('clima-tmin');
            if (humidity >= 85 || rain >= 40) insights.push({ tone: 'warning', title: 'Vigilancia fitosanitaria', text: 'Humedad o precipitación elevadas: revise roya, ventilación y drenajes en los lotes sensibles.' });
            if (max && min) insights.push({ tone: 'info', title: 'Amplitud térmica', text: `Diferencia diaria estimada: ${(max - min).toFixed(1)} °C.` });
        }

        if (has('lote-area')) {
            const area = this._number('lote-area'), density = this._number('lote-densidad');
            if (area > 0 && density > 0) insights.push({ tone: 'info', title: 'Población estimada', text: `${Math.round(area * density).toLocaleString('es-HN')} plantas para ${area} mz según la densidad indicada.` });
        }

        if (has('emision-cantidad')) {
            const quantity = this._number('emision-cantidad');
            const type = this._value('emision-tipo');
            const factors = { fertilizante: 4.5, combustible: 3.2, energia: 0.5, transporte: 0.8, otros: 1 };
            if (quantity > 0) insights.push({ tone: 'info', title: 'Huella estimada', text: `${(quantity * (factors[type] || 1)).toFixed(2)} kg CO₂e según el factor operativo actual. Use este dato como estimación y documente la fuente.` });
        }
        if (has('practica-area') && !this._value('practica-lote')) insights.push({ tone: 'warning', title: 'Práctica general', text: 'Sin lote asignado no podrá compararse el efecto por parcela.' });
        if (has('cert-vencimiento') && this._value('cert-vencimiento')) {
            const days = Math.ceil((new Date(`${this._value('cert-vencimiento')}T00:00:00`) - new Date()) / 86400000);
            insights.push({ tone: days < 90 ? 'warning' : 'info', title: 'Vigencia de certificación', text: days >= 0 ? `Faltan aproximadamente ${days} días para el vencimiento.` : `La certificación venció hace ${Math.abs(days)} días.` });
        }
        if (has('alerta-nivel') && this._value('alerta-nivel') === 'alto') insights.push({ tone: 'warning', title: 'Alerta prioritaria', text: 'Defina una recomendación, asigne lote cuando corresponda y programe seguimiento.' });
        if (has('mkt-campana-estado') && this._value('mkt-campana-estado') === 'activa') insights.push({ tone: 'warning', title: 'Campaña activa', text: 'Revise audiencia, vigencia, contenido y canal antes de guardar.' });

        const host = this._insightHost(container);
        if (!host) return;
        host.innerHTML = insights.slice(0, 3).map(item => `<div class="smart-insight ${item.tone}"><strong>${item.title}</strong><span>${item.text}</span></div>`).join('');
        host.hidden = insights.length === 0;
    },

    _mostrarError(el, msg) {
        el.classList.add('is-invalid'); el.classList.remove('is-valid'); el.setAttribute('aria-invalid', 'true');
        const container = el.closest('.form-group') || el.parentElement;
        if (!container) return;
        let error = container.querySelector(':scope > .form-error');
        if (!error) { error = document.createElement('div'); error.className = 'form-error'; container.appendChild(error); }
        error.textContent = msg;
    },
    _limpiarError(el) {
        el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid');
        const container = el.closest('.form-group') || el.parentElement;
        container?.querySelector(':scope > .form-error')?.remove();
    },
    _limpiarTodo() {
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid,.is-valid').forEach(el => { el.classList.remove('is-invalid','is-valid'); el.removeAttribute('aria-invalid'); });
    },
    limpiarForm(containerId) {
        const container = document.getElementById(containerId); if (!container) return;
        container.querySelectorAll('.form-error').forEach(el => el.remove());
        container.querySelectorAll('.is-invalid,.is-valid').forEach(el => { el.classList.remove('is-invalid','is-valid'); el.removeAttribute('aria-invalid'); });
    }
};

window.Validador = Validador;
