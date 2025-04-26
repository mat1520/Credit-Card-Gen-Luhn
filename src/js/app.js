import { generateCard, generateCVV, generateExpiryDate } from '../utils/cardGenerator.js';
import { showNotification, createCardElement, exportToTXT, exportToCSV } from '../utils/ui.js';

// Card Generator Class
class CardGenerator {
    constructor() {
        // Initialize state
        this.cards = [];
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
    }

    initializeElements() {
        this.binInput = document.getElementById('bin-input');
    }

    setupEventListeners() {
        // Generate Cards
        const generateBtn = document.getElementById('generate');
        if (generateBtn) {
            generateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.generateCards();
            });
        }

        // Export Options
        const copyBtn = document.getElementById('copy-results');
        const csvBtn = document.getElementById('export-csv');
        const txtBtn = document.getElementById('export-txt');

        if (copyBtn) copyBtn.addEventListener('click', () => this.copyToClipboard());
        if (csvBtn) csvBtn.addEventListener('click', () => this.exportToCSV());
        if (txtBtn) txtBtn.addEventListener('click', () => this.exportToTXT());

        // Input Validation
        const baseNumberInput = document.getElementById('base-number');
        if (baseNumberInput) {
            baseNumberInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d]/g, '');
            });
        }
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

    // Luhn Algorithm Implementation
    luhnCheck(num) {
        let arr = (num + '').split('').reverse().map(x => parseInt(x));
        let lastDigit = arr.shift();
        let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
        sum += lastDigit;
        return sum % 10 === 0;
    }

    generateLuhnNumber(bin) {
        let number = bin;
        while (number.length < 15) {
            number += Math.floor(Math.random() * 10);
        }
        
        let sum = 0;
        let isSecond = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i]);
            
            if (isSecond) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isSecond = !isSecond;
        }
        
        const checkDigit = (10 - (sum % 10)) % 10;
        return number + checkDigit;
    }

    generateCVV() {
        const customCvv = document.getElementById('cvv').value.trim();
        if (customCvv && /^\d{3}$/.test(customCvv)) {
            return customCvv;
        }
        return Math.floor(100 + Math.random() * 900).toString().padStart(3, '0');
    }

    generateExpiryDate() {
        const month = document.getElementById('expiry-month').value.trim();
        const year = document.getElementById('expiry-year').value.trim();
        
        // Si ambos campos están vacíos, generar fecha aleatoria
        if (!month && !year) {
            const now = new Date();
            const randomYear = now.getFullYear() + Math.floor(Math.random() * 5);
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            return {
                month: randomMonth.toString().padStart(2, '0'),
                year: randomYear.toString()
            };
        }

        // Si solo el mes está presente
        if (month && !year) {
            const monthNum = parseInt(month);
            if (monthNum < 1 || monthNum > 12) {
                throw new Error('El mes debe estar entre 1 y 12');
            }
            const now = new Date();
            const randomYear = now.getFullYear() + Math.floor(Math.random() * 5);
            return {
                month: monthNum.toString().padStart(2, '0'),
                year: randomYear.toString()
            };
        }

        // Si solo el año está presente
        if (!month && year) {
            const yearNum = parseInt(year);
            if (yearNum < 2025) {
                throw new Error('El año debe ser 2025 o superior');
            }
            const randomMonth = Math.floor(Math.random() * 12) + 1;
            return {
                month: randomMonth.toString().padStart(2, '0'),
                year: yearNum.toString()
            };
        }

        // Si ambos están presentes
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }

        if (yearNum < 2025) {
            throw new Error('El año debe ser 2025 o superior');
        }

        return {
            month: monthNum.toString().padStart(2, '0'),
            year: yearNum.toString()
        };
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

    generateCards() {
        try {
            const baseNumber = document.getElementById('base-number')?.value?.trim();
            const quantity = parseInt(document.getElementById('quantity')?.value || '10');

            if (!baseNumber) {
                throw new Error('Por favor ingresa un número base');
            }

            if (!quantity || quantity < 1 || quantity > 100) {
                throw new Error('La cantidad debe estar entre 1 y 100');
            }

            this.cards = [];
            const resultsContainer = document.getElementById('results');
            if (!resultsContainer) return;

            resultsContainer.innerHTML = '';

            for (let i = 0; i < quantity; i++) {
                const cardNumber = this.generateLuhnNumber(baseNumber);
                const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
                const year = (2024 + Math.floor(Math.random() * 6)).toString();
                const cvv = Math.floor(100 + Math.random() * 900).toString();

                const card = { number: cardNumber, month, year, cvv };
                this.cards.push(card);

                const text = document.createTextNode(`${cardNumber}|${month}/${year}|${cvv}\n`);
                resultsContainer.appendChild(text);
            }

            // Save to localStorage for recovery
            localStorage.setItem('lastGeneratedCards', JSON.stringify(this.cards));

        } catch (error) {
            console.error('Error generating cards:', error);
            showNotification(error.message, 'error');
        }
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'error' ? 'exclamation-circle' : 
                    type === 'success' ? 'check-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        requestAnimationFrame(() => notification.classList.add('show'));
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    saveBinsToStorage() {
        localStorage.setItem('savedBins', JSON.stringify([...this.savedBins]));
    }

    copyToClipboard() {
        if (this.cards.length === 0) {
            showNotification('No hay tarjetas para copiar', 'error');
            return;
        }

        const text = this.cards
            .map(card => `${card.number}|${card.month}/${card.year}|${card.cvv}`)
            .join('\n');

        navigator.clipboard.writeText(text)
            .then(() => showNotification('Tarjetas copiadas al portapapeles'))
            .catch(() => showNotification('Error al copiar', 'error'));
    }

    exportToTXT() {
        if (this.cards.length === 0) {
            showNotification('No hay tarjetas para exportar', 'error');
            return;
        }
        exportToTXT(this.cards);
        showNotification('Archivo TXT descargado correctamente');
    }

    exportToCSV() {
        if (this.cards.length === 0) {
            showNotification('No hay tarjetas para exportar', 'error');
            return;
        }
        exportToCSV(this.cards);
        showNotification('Archivo CSV descargado correctamente');
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
}

// Initialize the application
const cardGenerator = new CardGenerator();

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