// Card Generator Class
class CardGenerator {
    constructor() {
        this.cards = [];
        this.theme = localStorage.getItem('theme') || 'dark';
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
        this.setupQuantityControls();
    }

    initializeElements() {
        this.binInput = document.getElementById('bin-input');
    }

    setupEventListeners() {
        // Generate Cards
        document.getElementById('generate').addEventListener('click', () => this.generateCards());
        
        // Export Options
        document.getElementById('copy-results').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('export-csv').addEventListener('click', () => this.exportToCSV());
        document.getElementById('export-txt').addEventListener('click', () => this.exportToTXT());

        // Base number validation
        document.getElementById('base-number').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d]/g, '');
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateCards();
            }
        });
    }

    setupQuantityControls() {
        const quantity = document.getElementById('quantity');
        const decrease = document.getElementById('decrease-quantity');
        const increase = document.getElementById('increase-quantity');

        decrease.addEventListener('click', () => {
            const current = parseInt(quantity.value);
            if (current > 1) {
                quantity.value = current - 1;
            }
        });

        increase.addEventListener('click', () => {
            const current = parseInt(quantity.value);
            if (current < 150) {
                quantity.value = current + 1;
            }
        });

        quantity.addEventListener('change', () => {
            let value = parseInt(quantity.value);
            if (value < 1) value = 1;
            if (value > 150) value = 150;
            quantity.value = value;
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
        
        let checkDigit = (10 - (sum % 10)) % 10;
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
        
        if (month && year && /^\d{1,2}$/.test(month) && /^\d{4}$/.test(year)) {
            if (month < 1 || month > 12) {
                throw new Error('El mes debe estar entre 1 y 12');
            }
            return {
                month: month.padStart(2, '0'),
                year: year
            };
        }
        
        const now = new Date();
        const randomYear = now.getFullYear() + Math.floor(Math.random() * 5);
        const randomMonth = Math.floor(Math.random() * 12) + 1;
        return {
            month: randomMonth.toString().padStart(2, '0'),
            year: randomYear.toString()
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
        const baseNumber = document.getElementById('base-number').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value);

        if (!baseNumber) {
            this.showNotification('Ingresa un número base', 'error');
            return;
        }

        if (quantity < 1 || quantity > 100) {
            this.showNotification('La cantidad debe estar entre 1 y 100', 'error');
            return;
        }

        try {
            this.cards = [];
            const startTime = performance.now();
            
            for (let i = 0; i < quantity; i++) {
                const cardNumber = this.completeCardNumber(baseNumber);
                const cvv = this.generateCVV();
                const expiry = this.generateExpiryDate();
                
                this.cards.push({
                    number: cardNumber,
                    cvv,
                    expiry,
                    type: this.detectCardType(cardNumber)
                });
            }

            const endTime = performance.now();
            const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);
            
            this.displayCards();
            this.showNotification(
                `${this.cards.length} tarjetas generadas en ${timeElapsed}s`, 
                'success'
            );
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    completeCardNumber(baseNumber) {
        let number = baseNumber;
        // Completar hasta 15 dígitos
        while (number.length < 15) {
            number += Math.floor(Math.random() * 10);
        }
        
        // Calcular y agregar el dígito de verificación Luhn
        let sum = 0;
        let isSecond = false;
        
        // Recorrer los números de derecha a izquierda
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i]);

            if (isSecond) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isSecond = !isSecond;
        }

        // Calcular el dígito de verificación
        const checkDigit = (10 - (sum % 10)) % 10;
        return number + checkDigit;
    }

    displayCards() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        
        if (this.cards.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state">No hay tarjetas generadas</div>';
            return;
        }
        
        const pre = document.createElement('pre');
        pre.className = 'cards-list';
        
        const cardsList = this.cards.map(card => {
            return `${card.number}|${card.expiry.month}|${card.expiry.year}|${card.cvv}`;
        }).join('\n');
        
        pre.textContent = cardsList;
        resultsContainer.appendChild(pre);
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
            this.showNotification('No hay tarjetas para copiar', 'error');
            return;
        }

        const text = this.cards.map(card => {
            return `${card.number}|${card.expiry.month}|${card.expiry.year}|${card.cvv}`;
        }).join('\n');

        navigator.clipboard.writeText(text)
            .then(() => this.showNotification('Tarjetas copiadas al portapapeles', 'success'))
            .catch(() => this.showNotification('Error al copiar', 'error'));
    }

    exportToTXT() {
        if (this.cards.length === 0) {
            this.showNotification('No hay tarjetas para exportar', 'error');
            return;
        }

        const content = this.cards.map(card => {
            return `${card.number}|${card.expiry.month}|${card.expiry.year}|${card.cvv}`;
        }).join('\n');

        this.downloadFile(content, 'tarjetas.txt', 'text/plain');
        this.showNotification('Archivo TXT descargado', 'success');
    }

    exportToCSV() {
        if (this.cards.length === 0) {
            this.showNotification('No hay tarjetas para exportar', 'error');
            return;
        }

        const content = this.cards.map(card => {
            return `${card.number},${card.expiry.month},${card.expiry.year},${card.cvv}`;
        }).join('\n');

        this.downloadFile(content, 'tarjetas.csv', 'text/csv');
        this.showNotification('Archivo CSV descargado', 'success');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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