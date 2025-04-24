// Card Generator Class
class CardGenerator {
    constructor() {
        this.bins = new Set();
        this.cards = [];
        this.technicalMode = false;
        this.theme = localStorage.getItem('theme') || 'light';
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.loadSavedBins();
        this.applyTheme();
    }

    setupEventListeners() {
        document.getElementById('add-bin').addEventListener('click', () => this.addBin());
        document.getElementById('generate').addEventListener('click', () => this.generateCards());
        document.getElementById('export-csv').addEventListener('click', () => this.exportToCSV());
        document.getElementById('export-txt').addEventListener('click', () => this.exportToTXT());
        document.getElementById('copy-results').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('technical-mode').addEventListener('change', (e) => this.toggleTechnicalMode(e));
        document.getElementById('theme').addEventListener('change', (e) => this.changeTheme(e));
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
        return Math.floor(100 + Math.random() * 900).toString();
    }

    generateExpiryDate() {
        const now = new Date();
        const year = now.getFullYear() + Math.floor(Math.random() * 5);
        const month = Math.floor(Math.random() * 12) + 1;
        return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
    }

    addBin() {
        const binInput = document.getElementById('bin-input');
        const bin = binInput.value.trim();
        
        if (bin.length < 6 || bin.length > 8) {
            alert('El BIN debe tener entre 6 y 8 dígitos');
            return;
        }
        
        if (!/^\d+$/.test(bin)) {
            alert('El BIN solo puede contener números');
            return;
        }
        
        this.bins.add(bin);
        binInput.value = '';
        this.saveBins();
        this.updateBinDisplay();
    }

    generateCards() {
        const quantity = parseInt(document.getElementById('quantity').value);
        if (quantity < 1 || quantity > 150) {
            alert('La cantidad debe estar entre 1 y 150');
            return;
        }

        this.cards = [];
        for (const bin of this.bins) {
            for (let i = 0; i < quantity; i++) {
                const cardNumber = this.generateLuhnNumber(bin);
                const cvv = this.generateCVV();
                const expiry = this.generateExpiryDate();
                
                this.cards.push({
                    number: cardNumber,
                    cvv,
                    expiry,
                    bin
                });
            }
        }

        this.displayCards();
    }

    displayCards() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            
            let cardInfo = `Número: ${this.formatCardNumber(card.number)}\n`;
            cardInfo += `CVV: ${card.cvv}\n`;
            cardInfo += `Expira: ${card.expiry}\n`;
            
            if (this.technicalMode) {
                cardInfo += `BIN: ${card.bin}\n`;
                cardInfo += `Tipo: ${this.detectCardType(card.number)}\n`;
            }
            
            cardElement.textContent = cardInfo;
            resultsContainer.appendChild(cardElement);
        });
    }

    formatCardNumber(number) {
        return number.replace(/(\d{4})/g, '$1 ').trim();
    }

    detectCardType(number) {
        const firstDigit = number[0];
        switch(firstDigit) {
            case '4': return 'Visa';
            case '5': return 'Mastercard';
            case '3': return 'American Express';
            case '6': return 'Discover';
            default: return 'Desconocido';
        }
    }

    exportToCSV() {
        const headers = ['Número', 'CVV', 'Expiración', 'BIN'];
        if (this.technicalMode) {
            headers.push('Tipo');
        }
        
        const csvContent = [
            headers.join(','),
            ...this.cards.map(card => {
                const row = [
                    card.number,
                    card.cvv,
                    card.expiry,
                    card.bin
                ];
                if (this.technicalMode) {
                    row.push(this.detectCardType(card.number));
                }
                return row.join(',');
            })
        ].join('\n');

        this.downloadFile(csvContent, 'cards.csv', 'text/csv');
    }

    exportToTXT() {
        const txtContent = this.cards.map(card => {
            let line = `Número: ${card.number}\n`;
            line += `CVV: ${card.cvv}\n`;
            line += `Expiración: ${card.expiry}\n`;
            line += `BIN: ${card.bin}\n`;
            if (this.technicalMode) {
                line += `Tipo: ${this.detectCardType(card.number)}\n`;
            }
            return line + '\n';
        }).join('\n');

        this.downloadFile(txtContent, 'cards.txt', 'text/plain');
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

    async copyToClipboard() {
        const text = this.cards.map(card => {
            let line = `Número: ${card.number}\n`;
            line += `CVV: ${card.cvv}\n`;
            line += `Expiración: ${card.expiry}\n`;
            if (this.technicalMode) {
                line += `Tipo: ${this.detectCardType(card.number)}\n`;
            }
            return line;
        }).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            alert('Tarjetas copiadas al portapapeles');
        } catch (err) {
            alert('Error al copiar al portapapeles');
        }
    }

    toggleTechnicalMode(e) {
        this.technicalMode = e.target.checked;
        this.displayCards();
    }

    changeTheme(e) {
        this.theme = e.target.value;
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        document.getElementById('theme').value = this.theme;
    }

    saveBins() {
        localStorage.setItem('savedBins', JSON.stringify([...this.bins]));
    }

    loadSavedBins() {
        const savedBins = localStorage.getItem('savedBins');
        if (savedBins) {
            this.bins = new Set(JSON.parse(savedBins));
            this.updateBinDisplay();
        }
    }

    updateBinDisplay() {
        // Implementar visualización de BINs guardados
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CardGenerator();
}); 