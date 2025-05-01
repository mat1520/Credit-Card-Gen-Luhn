// Función para validar BIN
export const isValidBin = (bin) => {
    if (!bin) return false;
    if (!/^[\dx]{6,16}$/.test(bin)) return false;
    return true;
};

// Función para generar número aleatorio
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Función para generar mes aleatorio
const generateMonth = () => {
    const month = randomNum(1, 12);
    return month.toString().padStart(2, '0');
};

// Función para generar año aleatorio
const generateYear = () => {
    const currentYear = new Date().getFullYear();
    const year = randomNum(currentYear + 1, currentYear + 10);
    return year.toString().slice(-2);
};

// Función para generar CVV aleatorio
const generateCVV = () => {
    return randomNum(100, 999).toString();
};

// Algoritmo de Luhn
const luhnCheck = (num) => {
    let arr = (num + '')
        .split('')
        .reverse()
        .map(x => parseInt(x));
    let sum = arr.reduce((acc, val, i) => {
        if (i % 2 !== 0) {
            const doubled = val * 2;
            return acc + (doubled > 9 ? doubled - 9 : doubled);
        }
        return acc + val;
    }, 0);
    return sum % 10 === 0;
};

// Función para generar número de tarjeta válido
const generateValidCardNumber = (bin) => {
    const length = 16;
    let cardNumber = bin;
    
    // Completar con números aleatorios hasta length-1
    while (cardNumber.length < length - 1) {
        if (cardNumber.includes('x')) {
            cardNumber = cardNumber.replace('x', randomNum(0, 9));
        }
    }
    
    // Encontrar el último dígito que hace válido el número
    for (let i = 0; i <= 9; i++) {
        const fullNumber = cardNumber + i;
        if (luhnCheck(fullNumber)) {
            return fullNumber;
        }
    }
    
    return cardNumber + '0'; // Fallback
};

// Función principal para generar tarjeta
export const generateCard = (bin) => {
    return {
        number: generateValidCardNumber(bin),
        month: generateMonth(),
        year: generateYear(),
        cvv: generateCVV()
    };
}; 