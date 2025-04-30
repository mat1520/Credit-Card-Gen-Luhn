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
    let sum = arr.reduce((acc, val, i) => {
        let doubled = val * 2;
        return acc + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);
    sum += lastDigit;
    return sum % 10 === 0;
};

// Función para generar un número de tarjeta válido
const generateCardNumber = (bin) => {
    let cardNumber = bin;
    
    // Rellenar con x's si el BIN es más corto que 16 dígitos
    while (cardNumber.length < 15) {
        cardNumber += 'x';
    }
    
    // Generar dígitos aleatorios para las x's
    cardNumber = cardNumber.replace(/x/g, () => getRandomDigit());
    
    // Asegurarse de que el número tenga 15 dígitos
    if (cardNumber.length > 15) {
        cardNumber = cardNumber.slice(0, 15);
    }
    
    // Calcular el dígito de verificación
    let checkDigit = 0;
    while (!luhnCheck(cardNumber + checkDigit)) {
        checkDigit = (checkDigit + 1) % 10;
    }
    
    return cardNumber + checkDigit;
};

// Función principal para generar una tarjeta
const generateCard = (bin) => {
    if (!isValidBin(bin)) {
        throw new Error('BIN inválido');
    }
    
    return {
        number: generateCardNumber(bin),
        month: generateMonth(),
        year: generateYear(),
        cvv: generateCVV()
    };
};

module.exports = {
    isValidBin,
    generateCard,
    generateMonth,
    generateYear,
    generateCVV
}; 