import { generateCard, generateCVV, generateExpiryDate } from '../utils/cardGenerator.js';
import { showNotification, createCardElement, exportToTXT, exportToCSV } from '../utils/ui.js';

// Card Generator Class
class CardGenerator {
    constructor() {
        // Initialize state
        this.cards = [];
        this.savedBins = new Set(JSON.parse(localStorage.getItem('savedBins') || '[]'));
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.theme = localStorage.getItem('theme') || 'dark';
        
        // Card brand BINs
        this.defaultBins = {
            'visa': ['400047', '411773', '4012', '4019', '4024', '4027', '4032', '4052', '4520', '4556', '4917'],
            'mastercard': ['510510', '520424', '530086', '533875', '515151', '525252', '535353', '545454', '551551'],
            'amex': ['340000', '370000', '340987', '378282'],
            'discover': ['601100', '601109', '601120', '601122', '601124', '601177', '601179', '601186', '601187'],
            'diners': ['300000', '301700', '302500', '303800', '304700', '305500', '305600', '360000', '368200'],
            'jcb': ['352800', '353800', '356900', '357300', '357600', '357700', '357800', '357900', '358100']
        };

        this.initialize();
        this.setupAnimations();
    }

    initialize() {
        this.setupEventListeners();
        this.applyTheme();
        this.setupKeyboardShortcuts();
        this.updateFavoritesList();
    }

    initializeElements() {
        this.binInput = document.getElementById('bin-input');
    }

    setupEventListeners() {
        const form = document.querySelector('.card-generator-form');
        const copyButton = document.querySelector('.copy-button');
        const resetButton = document.querySelector('.reset-button');
        const exportButton = document.getElementById('export-button');
        const binInput = document.getElementById('bin');
        const cvvInput = document.getElementById('cvv');

        // BIN input validation
        binInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
        });

        // CVV input validation
        cvvInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
        });

        // Form submission
        const handleSubmit = (e) => {
            e.preventDefault();
            this.generateCards();
            return false;
        };

        form?.addEventListener('submit', handleSubmit.bind(this));

        // Copy results
        copyButton?.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Reset form
        resetButton?.addEventListener('click', () => {
            this.resetForm();
        });

        // Export results
        exportButton?.addEventListener('click', () => {
            const format = document.getElementById('export-format').value;
            this.exportToFormat(format);
        });

        // Favorites
        const favoriteModal = document.getElementById('favorite-modal');
        const closeModalButton = document.getElementById('close-modal');
        const cancelModalButton = document.querySelector('.modal-cancel');
        const favoriteForm = document.getElementById('favorite-form');

        closeModalButton?.addEventListener('click', () => {
            favoriteModal.classList.remove('show');
        });

        cancelModalButton?.addEventListener('click', () => {
            favoriteModal.classList.remove('show');
        });

        favoriteForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFavorite();
        });

        // Nuevo: abrir modal de favoritos desde el header
        const openFavoritesButton = document.getElementById('open-favorites');
        openFavoritesButton?.addEventListener('click', () => {
            document.getElementById('favorite-modal').classList.add('show');
            this.updateFavoritesList();
        });

        // Mostrar/ocultar favoritos con el botón de ojo
        const favoritesSection = document.querySelector('.favorites-section');
        const favoritesList = document.getElementById('favorites-list');
        const toggleFavoritesBtn = document.getElementById('toggle-favorites-visibility');
        const favoritesVisibilityIcon = document.getElementById('favorites-visibility-icon');
        let favoritesVisible = true;
        toggleFavoritesBtn?.addEventListener('click', () => {
            favoritesVisible = !favoritesVisible;
            if (favoritesVisible) {
                favoritesList.style.display = '';
                favoritesVisibilityIcon.className = 'fas fa-eye';
                this.updateFavoritesList();
            } else {
                favoritesList.style.display = 'none';
                favoritesVisibilityIcon.className = 'fas fa-eye-slash';
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Generate cards with Ctrl+G
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateCards();
            }
            // Copy results with Ctrl+C when results are focused
            if (e.ctrlKey && e.key === 'c' && document.activeElement.id === 'results') {
                e.preventDefault();
                this.copyToClipboard();
            }
        });
    }

    generateCards() {
        const bin = document.getElementById('bin').value;
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;
        const cvv = document.getElementById('cvv').value;
        const format = document.getElementById('format').value;
        const quantity = parseInt(document.getElementById('quantity').value);

        if (bin.length < 1) {
            this.showNotification('Por favor ingrese un BIN válido', 'error');
            return;
        }

        // Clear previous cards
        this.cards = [];
        const results = document.getElementById('results');
        results.value = '';

        // Generate cards
        for (let i = 0; i < quantity; i++) {
            const cardNumber = this.generateValidCardNumber(bin);
            
            // Generate random month if "random" is selected
            let cardMonth = month;
            if (month === 'random') {
                cardMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
            }

            // Generate random year if "random" is selected
            let cardYear = year;
            if (year === 'random') {
                const currentYear = new Date().getFullYear();
                cardYear = (currentYear + Math.floor(Math.random() * 10)).toString();
            }

            // Generate random CVV if empty or "random"
            let cardCVV = cvv;
            if (!cvv || cvv.toLowerCase() === 'random') {
                cardCVV = Math.floor(100 + Math.random() * 900).toString();
            }

            const card = {
                number: cardNumber,
                month: cardMonth,
                year: cardYear,
                cvv: cardCVV
            };
            this.cards.push(card);
        }

        // Format and display results
        const formattedCards = this.formatCards(format);
        results.value = formattedCards;
        this.showNotification('Tarjetas generadas exitosamente', 'success');
    }

    generateValidCardNumber(bin) {
        const remainingLength = 16 - bin.length;
        let number = bin;
        
        // Generate random digits
        for (let i = 0; i < remainingLength - 1; i++) {
            number += Math.floor(Math.random() * 10);
        }
        
        // Add Luhn check digit
        return number + this.generateLuhnDigit(number);
    }

    generateLuhnDigit(number) {
        const digits = number.split('').map(Number);
        let sum = 0;
        let isEven = true;

        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = digits[i];
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isEven = !isEven;
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit.toString();
    }

    formatCards(format) {
        return this.cards.map(card => {
            switch (format) {
                case 'csv':
                    return `${card.number},${card.month},${card.year},${card.cvv}`;
                case 'json':
                    return JSON.stringify(card);
                case 'xml':
                    return `<card number="${card.number}" month="${card.month}" year="${card.year}" cvv="${card.cvv}" />`;
                case 'sql':
                    return `INSERT INTO cards (number, month, year, cvv) VALUES ('${card.number}', '${card.month}', '${card.year}', '${card.cvv}');`;
                default:
                    return `${card.number}|${card.month}|${card.year}|${card.cvv}`;
            }
        }).join('\n');
    }

    exportToFormat(format) {
        if (this.cards.length === 0) {
            this.showNotification('No hay resultados para exportar', 'error');
            return;
        }

        const exportButton = document.getElementById('export-button');
        exportButton.disabled = true;
        exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';

        try {
            const content = this.formatCards(format);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cards.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            this.showNotification('Archivo exportado exitosamente', 'success');
        } catch (error) {
            this.showNotification('Error al exportar el archivo', 'error');
        } finally {
            exportButton.disabled = false;
            exportButton.innerHTML = '<i class="fas fa-download"></i> Exportar';
        }
    }

    copyToClipboard() {
        const results = document.getElementById('results');
        if (!results.value) {
            this.showNotification('No hay resultados para copiar', 'error');
            return;
        }

        results.select();
        document.execCommand('copy');
        this.showNotification('Resultados copiados al portapapeles', 'success');
    }

    resetForm() {
        const form = document.querySelector('.card-generator-form');
        if (form) {
            form.reset();
        }
        const results = document.getElementById('results');
        if (results) {
            results.value = '';
        }
        this.cards = [];
        this.showNotification('Formulario reiniciado', 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    addBin(bin) {
        if (this.savedBins.has(bin)) {
            this.showNotification('Este BIN ya está en la lista', 'warning');
            return;
        }

        this.savedBins.add(bin);
        this.updateBinsList();
        this.saveBinsToStorage();
        this.showNotification('BIN agregado correctamente', 'success');
    }

    removeBin(bin) {
        this.savedBins.delete(bin);
        this.saveBinsToStorage();
        this.updateBinsList();
    }

    updateBinsList() {
        const binsList = document.getElementById('bins-list');
        binsList.innerHTML = '';
        
        if (this.savedBins.size === 0) {
            binsList.innerHTML = '<div class="empty-state">Ingresa un BIN y presiona Enter</div>';
            return;
        }
        
        this.savedBins.forEach(bin => {
            const binTag = document.createElement('div');
            binTag.className = 'bin-tag';
            binTag.innerHTML = `
                <span>${bin}</span>
                <button onclick="cardGenerator.removeBin('${bin}')" title="Eliminar">×</button>
            `;
            binsList.appendChild(binTag);
        });
    }

    displayCards() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        
        this.cards.forEach(card => {
            const text = document.createTextNode(`${card.number}|${card.month}/${card.year}|${card.cvv}\n`);
            resultsContainer.appendChild(text);
        });
    }

    getCardIcon(type) {
        const icons = {
            'Visa': 'cc-visa',
            'Mastercard': 'cc-mastercard',
            'Amex': 'cc-amex',
            'Discover': 'cc-discover',
            'Diners': 'cc-diners-club',
            'JCB': 'cc-jcb',
            'Card': 'credit-card'
        };
        return icons[type] || 'credit-card';
    }

    formatCardNumber(number) {
        return number.match(/.{1,4}/g).join(' ');
    }

    detectCardType(number) {
        const patterns = {
            'Visa': /^4/,
            'Mastercard': /^5[1-5]/,
            'Amex': /^3[47]/,
            'Discover': /^6/,
            'Diners': /^3(?:0[0-5]|[68][0-9])/,
            'JCB': /^35/
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(number)) {
                return type;
            }
        }
        
        return 'Card';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    setupAnimations() {
        this.createParticles();
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-container';
        document.body.appendChild(particlesContainer);

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--delay', `${Math.random() * 4}s`);
            particle.style.setProperty('--size', `${Math.random() * 3 + 1}px`);
            particlesContainer.appendChild(particle);
        }
    }

    handle3DEffect(e) {
        const card = e.currentTarget;
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const percentX = (e.clientX - centerX) / (cardRect.width / 2);
        const percentY = (e.clientY - centerY) / (cardRect.height / 2);
        const rotate = 10;

        card.style.transform = `
            perspective(1000px)
            rotateY(${percentX * rotate}deg)
            rotateX(${-percentY * rotate}deg)
            scale3d(1.05, 1.05, 1.05)
        `;
    }

    reset3DEffect(e) {
        const card = e.currentTarget;
        card.style.transform = '';
    }

    createCardElement(card) {
        return `${card.number}|${card.month}/${card.year}|${card.cvv}`;
    }

    saveBinsToStorage() {
        localStorage.setItem('savedBins', JSON.stringify([...this.savedBins]));
    }

    saveFavorite() {
        const bin = document.getElementById('favorite-bin').value;
        const name = document.getElementById('favorite-name').value;
        const month = document.getElementById('favorite-month').value;
        const year = document.getElementById('favorite-year').value;
        const cvv = document.getElementById('favorite-cvv').value;

        const favorite = {
            bin,
            name: name || null,
            month: month || null,
            year: year || null,
            cvv: cvv || null,
            timestamp: Date.now()
        };

        this.favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesList();
        this.showNotification('BIN agregado a favoritos', 'success');
        document.getElementById('favorite-modal').classList.remove('show');
    }

    updateFavoritesList() {
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        favoritesList.innerHTML = '';

        if (this.favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No hay BINs favoritos</p>
                </div>
            `;
            return;
        }

        this.favorites.forEach((favorite, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.style.setProperty('--item-index', index);
            item.innerHTML = `
                <div class="favorite-item-content">
                    <span class="favorite-item-bin">${favorite.bin}</span>
                    <span class="favorite-item-name">${favorite.name ? `<b>${favorite.name}</b> | ` : ''}</span>
                    <span class="favorite-item-details">
                        ${favorite.month ? `Mes: ${favorite.month}` : ''}
                        ${favorite.year ? ` | Año: ${favorite.year}` : ''}
                        ${favorite.cvv ? ` | CVV: ${favorite.cvv}` : ''}
                    </span>
                </div>
                <div class="favorite-item-actions">
                    <button class="use-favorite" title="Usar este BIN">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="delete-favorite" title="Eliminar de favoritos">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            const useButton = item.querySelector('.use-favorite');
            const deleteButton = item.querySelector('.delete-favorite');

            useButton.addEventListener('click', () => {
                document.getElementById('bin').value = favorite.bin;
                if (favorite.month) document.getElementById('month').value = favorite.month;
                if (favorite.year) document.getElementById('year').value = favorite.year;
                if (favorite.cvv) document.getElementById('cvv').value = favorite.cvv;
                this.showNotification('BIN copiado al formulario', 'success');
            });

            deleteButton.addEventListener('click', () => {
                item.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    this.favorites.splice(index, 1);
                    localStorage.setItem('favorites', JSON.stringify(this.favorites));
                    this.updateFavoritesList();
                    this.showNotification('BIN eliminado de favoritos', 'success');
                }, 300);
            });

            favoritesList.appendChild(item);
        });
    }
}

// Agregar estilos dinámicamente para las nuevas características
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .particles-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    }

    .particle {
        position: absolute;
        background: var(--primary-color);
        border-radius: 50%;
        opacity: 0.3;
        animation: float-particle 4s infinite ease-in-out var(--delay);
    }

    @keyframes float-particle {
        0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        25% {
            opacity: 0.3;
        }
        50% {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
        }
    }

    .stats-container {
        margin: 2rem auto;
        max-width: 1400px;
        padding: 1.5rem;
    }

    .stats-container h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: var(--primary-color);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .stat-item {
        text-align: center;
        padding: 1rem;
        background: var(--surface-color);
        border-radius: 0.75rem;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .stat-item:hover {
        transform: translateY(-2px);
        border-color: var(--primary-color);
    }

    .stat-value {
        display: block;
        font-size: var(--font-2xl);
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }

    .stat-label {
        color: var(--text-secondary);
        font-size: var(--font-sm);
    }

    .card-item {
        transition: transform 0.3s ease;
    }
`;

document.head.appendChild(styleSheet);

export { CardGenerator }; 