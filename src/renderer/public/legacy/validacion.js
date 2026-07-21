// ─── Validador de Formularios ───
// Proporciona validación visual con mensajes de error en tiempo real

const Validador = {
    // Reglas de validación predefinidas
    rules: {
        required: (val) => {
            if (val === null || val === undefined) return 'Este campo es obligatorio';
            if (typeof val === 'string' && val.trim() === '') return 'Este campo es obligatorio';
            return null;
        },
        number: (val) => {
            if (val === null || val === undefined || val === '') return null; // skip if empty
            return isNaN(parseFloat(val)) || !isFinite(val) ? 'Debe ser un número válido' : null;
        },
        positive: (val) => {
            if (val === null || val === undefined || val === '') return null; // skip if empty
            const n = parseFloat(val);
            return isNaN(n) || n <= 0 ? 'Debe ser mayor que 0' : null;
        },
        min: (val, min) => {
            if (val === null || val === undefined || val === '') return null;
            return parseFloat(val) < min ? `El valor mínimo es ${min}` : null;
        },
        max: (val, max) => {
            if (val === null || val === undefined || val === '') return null;
            return parseFloat(val) > max ? `El valor máximo es ${max}` : null;
        },
        minLength: (val, min) => {
            if (!val) return null;
            return String(val).length < min ? `Mínimo ${min} caracteres` : null;
        },
        select: (val) => {
            if (!val || val === '') return 'Debes seleccionar una opción';
            return null;
        },
        date: (val) => {
            if (!val) return null;
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            return regex.test(val) ? null : 'Fecha inválida (formato YYYY-MM-DD)';
        },
        pattern: (val, regex, msg) => {
            if (!val) return null;
            return regex.test(val) ? null : (msg || 'Formato inválido');
        },
        email: (val) => {
            if (!val) return null;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Correo electrónico inválido';
        },
        phone: (val) => {
            if (!val) return null;
            return /^[\d\s\-+()]{7,15}$/.test(val) ? null : 'Teléfono inválido';
        }
    },

    /**
     * Valida un campo individual y muestra/oculta el error visualmente.
     * @param {string} id - ID del elemento del formulario
     * @param {Array} validaciones - Lista de reglas. Cada una puede ser:
     *   - string: nombre de la regla (ej: 'required')
     *   - array: [nombreRegla, arg1, arg2, ...] o [nombreRegla, arg1, mensajeError]
     *   - object: { regla: nombre, args: [], msg: 'mensaje personalizado' }
     * @returns {boolean} - true si el campo es válido
     */
    validarCampo(id, validaciones) {
        const el = document.getElementById(id);
        if (!el) return true;

        const val = el.value;

        for (const item of validaciones) {
            let regla, args = [], msg = null;

            if (typeof item === 'string') {
                regla = item;
            } else if (Array.isArray(item)) {
                regla = item[0];
                args = item.slice(1);
                // Si el último argumento es string y no parece número, es mensaje personalizado
                if (args.length > 0 && typeof args[args.length - 1] === 'string' && isNaN(args[args.length - 1]) && args[args.length - 1] !== '') {
                    msg = args.pop();
                }
            } else if (typeof item === 'object' && item.regla) {
                regla = item.regla;
                args = item.args || [];
                msg = item.msg || null;
            } else {
                continue;
            }

            const fn = this.rules[regla];
            if (!fn) continue;

            const error = fn(val, ...args);
            if (error !== null) {
                this._mostrarError(el, msg || error);
                return false;
            }
        }

        this._limpiarError(el);
        return true;
    },

    /**
     * Valida un conjunto de campos del formulario.
     * @param {Object} campos - Mapa de { idCampo: [reglas, ...] }
     * @returns {boolean} - true si TODOS los campos son válidos
     */
    validarForm(campos) {
        // Limpiar errores previos primero
        this._limpiarTodo();

        let valido = true;

        for (const [id, validaciones] of Object.entries(campos)) {
            if (!this.validarCampo(id, validaciones)) {
                valido = false;
            }
        }

        if (!valido) {
            // Enfocar el primer campo con error
            const firstInvalid = document.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return valido;
    },

    /**
     * Muestra el mensaje de error visual en un campo
     */
    _mostrarError(el, msg) {
        el.classList.add('is-invalid');
        el.classList.remove('is-valid');

        const container = el.closest('.form-group');
        if (!container) return;

        // Remover error previo si existe
        let errorEl = container.querySelector('.form-error');
        if (errorEl) errorEl.remove();

        errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = msg;
        container.appendChild(errorEl);
    },

    /**
     * Limpia el error visual de un campo
     */
    _limpiarError(el) {
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');

        const container = el.closest('.form-group');
        if (!container) return;
        const errorEl = container.querySelector('.form-error');
        if (errorEl) errorEl.remove();
    },

    /**
     * Limpia todos los errores visuales en el documento
     */
    _limpiarTodo() {
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
    },

    /**
     * Limpia errores dentro de un contenedor específico
     * @param {string} containerId - ID del contenedor (modal)
     */
    limpiarForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.form-error').forEach(el => el.remove());
        container.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        container.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
    }
};

window.Validador = Validador;
