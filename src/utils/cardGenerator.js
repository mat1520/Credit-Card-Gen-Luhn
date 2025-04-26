// Algoritmo de Luhn para validación
export const luhnCheck = (num) => {
    let arr = (num + '').split('').reverse().map(x => parseInt(x));
    let lastDigit = arr.shift();
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    sum += lastDigit;
    return sum % 10 === 0;
};

// Generar dígito de verificación
export const generateCheckDigit = (partial) => {
    for (let i = 0; i <= 9; i++) {
        if (luhnCheck(partial + i)) return i;
    }
    return 0;
};

// Generar número de tarjeta
export const generateCard = (baseNumber) => {
    let card = baseNumber;
    while (card.length < 15) {
        card += Math.floor(Math.random() * 10);
    }
    card += generateCheckDigit(card);
    return card;
};

// Generar CVV
export const generateCVV = (customCvv) => {
    if (customCvv && /^\d{3}$/.test(customCvv)) {
        return customCvv;
    }
    return Math.floor(100 + Math.random() * 900).toString().padStart(3, '0');
};

// Generar fecha de expiración
export const generateExpiryDate = (month, year) => {
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
}; 