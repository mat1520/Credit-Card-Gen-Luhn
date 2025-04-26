import { animateNotification } from './animations.js';

class BinLookup {
    constructor() {
        // API Key
        this.API_KEY = 'Lj0lF3jdVtV4QWlEbJy2T6ymyCe1bHFa';
        
        // Elementos del DOM
        this.form = document.getElementById('bin-lookup-form');
        this.input = document.getElementById('bin-input');
        this.button = document.getElementById('lookup-button');
        this.binInfoContainer = document.getElementById('bin-info-container');
        this.historyContainer = document.getElementById('history-items');
        this.emptyState = document.getElementById('empty-state');
        this.autoCompleteContainer = document.getElementById('autocomplete-container');
        
        // Estado
        this.isLoading = false;
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Inicializar
        this.init();
    }

    init() {
        // Verificar elementos requeridos
        if (!this.form || !this.input || !this.button) {
            console.error('Error: Elementos del formulario no encontrados', {
                form: this.form,
                input: this.input,
                button: this.button
            });
            return;
        }

        // Manejar envío del formulario
        this.form.addEventListener('submit', (e) => {
            console.log('Form submit event triggered');
            e.preventDefault();
            e.stopPropagation();
            if (!this.isLoading) {
                this.handleLookup();
            }
            return false;
        });

        // Manejar click directo en el botón
        this.button.addEventListener('click', (e) => {
            console.log('Button click event triggered');
                    e.preventDefault();
            e.stopPropagation();
            if (!this.isLoading) {
                    this.handleLookup();
                }
            });

        // Inicializar historial
        this.updateHistoryDisplay();

        // Manejar el botón de limpiar historial
        const clearButton = document.getElementById('clear-history');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearHistory());
        }

        console.log('BinLookup inicializado correctamente');
    }

    async handleLookup() {
        console.log('Iniciando consulta de BIN...');
        
        const bin = this.input.value.trim();
        
        if (!this.validateBin(bin)) {
            this.showError('Por favor ingresa un BIN válido (6-8 dígitos)');
            return;
        }

        this.setLoading(true);
        
        try {
            console.log('Consultando BIN:', bin);
            const data = await this.fetchBinInfo(bin);
            
            if (!data || data.success === false) {
                throw new Error('BIN no encontrado');
            }

            console.log('Respuesta recibida:', data);
            this.displayBinInfo(data);
            this.addToHistory(bin);
            this.updateHistoryDisplay();
        } catch (error) {
            console.error('Error en la consulta:', error);
            this.showError(error.message || 'Error al consultar el BIN');
            this.binInfoContainer.style.display = 'none';
        } finally {
            this.setLoading(false);
        }
    }

    validateBin(bin) {
        return /^\d{6,8}$/.test(bin);
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.button.disabled = loading;
        
        const buttonContent = this.button.querySelector('.button-content');
        const buttonLoading = this.button.querySelector('.button-loading');
        
        if (loading) {
            buttonContent.style.display = 'none';
            buttonLoading.style.display = 'flex';
        } else {
            buttonContent.style.display = 'flex';
            buttonLoading.style.display = 'none';
        }
    }

    showError(message) {
        console.log('Mostrando error:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message fade-in';
        errorDiv.textContent = message;
        
        const existingError = this.form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        this.form.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.classList.add('fade-out');
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    async fetchBinInfo(bin) {
        try {
            const response = await fetch(`https://api.apilayer.com/bincheck/${bin}`, {
                method: 'GET',
                headers: {
                    'apikey': this.API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error('Error en la consulta del BIN');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en fetchBinInfo:', error);
            throw new Error('Error al consultar el BIN');
        }
    }

    displayBinInfo(data) {
        // Mostrar el contenedor
        this.binInfoContainer.style.display = 'block';
        
        // Actualizar la información
        document.getElementById('bin-value').textContent = this.input.value;
        document.getElementById('brand-name').textContent = data.scheme || 'Desconocido';
        document.getElementById('card-type').textContent = data.type || 'Desconocido';
        
        // Actualizar icono de la marca
        const brandIcon = document.querySelector('.brand-badge i');
        brandIcon.className = `fab fa-cc-${(data.scheme || 'credit-card').toLowerCase()}`;
        
        // Actualizar detalles
        document.getElementById('bank-name').textContent = data.bank?.name || 'Desconocido';
        document.getElementById('country-name').textContent = this.getCountryInfo(data);
        document.getElementById('scheme').textContent = data.scheme || 'Desconocido';
        document.getElementById('type').textContent = data.type || 'Desconocido';
        
        // Aplicar animación
        this.binInfoContainer.classList.add('fade-in');
    }

    getCountryInfo(data) {
        if (!data.country) return 'No disponible';
        const emoji = this.getCountryEmoji(data.country_code);
        return `${emoji} ${data.country}`;
    }

    getCountryEmoji(countryCode) {
        if (!countryCode) return '🌍';
        const offset = 127397;
        return countryCode
            .toUpperCase()
            .split('')
            .map(char => String.fromCodePoint(char.charCodeAt(0) + offset))
            .join('');
    }

    addToHistory(bin) {
        this.recentSearches = this.recentSearches.filter(item => item !== bin);
        this.recentSearches.unshift(bin);
        if (this.recentSearches.length > 10) {
            this.recentSearches.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }

    updateHistoryDisplay() {
        this.historyContainer.innerHTML = '';
        
        if (this.recentSearches.length === 0) {
            this.emptyState.style.display = 'flex';
            return;
        }

        this.emptyState.style.display = 'none';
        this.recentSearches.forEach((bin, index) => {
            const item = document.createElement('div');
            item.className = 'history-item fade-in';
            item.dataset.bin = bin;
            item.style.animationDelay = `${index * 0.1}s`;
            
            item.innerHTML = `
                <i class="fas fa-clock"></i>
                <span>${bin}</span>
            `;
            
            this.historyContainer.appendChild(item);
            
            // Agregar evento de click
            item.addEventListener('click', () => {
                this.input.value = bin;
                this.handleLookup();
            });
        });
    }

    clearHistory() {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.updateHistoryDisplay();
        if (typeof animateNotification === 'function') {
            animateNotification('Historial borrado correctamente', 'success');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando BinLookup...');
    window.binLookup = new BinLookup();
}); 