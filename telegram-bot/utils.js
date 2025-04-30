// Función para validar un BIN
const isValidBin = (bin) => {
    return /^[0-9x]{6,16}$/.test(bin);
};

// Función para generar un número aleatorio
const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Función para generar un dígito aleatorio
const getRandomDigit = () => {
    return Math.floor(Math.random() * 10);
};

// Función para generar un mes válido
const generateMonth = () => {
    return String(getRandomNumber(1, 12)).padStart(2, '0');
};

// Función para generar un año válido
const generateYear = () => {
    const currentYear = new Date().getFullYear();
    return String(getRandomNumber(currentYear, currentYear + 10)).slice(-2);
};

// Función para generar un CVV
const generateCVV = () => {
    return String(getRandomNumber(100, 999));
};

// Función para validar un número de tarjeta usando el algoritmo de Luhn
const luhnCheck = (num) => {
    let arr = (num + '')
        .split('')
        .reverse()
        .map(x => parseInt(x));
    let lastDigit = arr.shift();
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    sum += lastDigit;
    return sum % 10 === 0;
};

// Función para generar un número de tarjeta válido
const generateCardNumber = (bin) => {
    let cardNumber = bin;
    const length = 16;
    
    // Rellenar con x's si el BIN es más corto que 16 dígitos
    while (cardNumber.length < length - 1) {
        cardNumber += 'x';
    }
    
    // Generar dígitos aleatorios para las x's
    cardNumber = cardNumber.replace(/x/g, () => getRandomDigit());
    
    // Calcular el dígito de verificación
    let checkDigit = 0;
    while (!luhnCheck(cardNumber + checkDigit)) {
        checkDigit++;
    }
    
    return cardNumber + checkDigit;
};

// Función principal para generar una tarjeta
const generateCard = (bin, month, year, cvv) => {
    if (!isValidBin(bin)) {
        throw new Error('BIN inválido');
    }
    
    return {
        number: generateCardNumber(bin),
        month: month || generateMonth(),
        year: year || generateYear(),
        cvv: cvv || generateCVV()
    };
};

module.exports = {
    isValidBin,
    generateCard,
    generateMonth,
    generateYear,
    generateCVV
}; 