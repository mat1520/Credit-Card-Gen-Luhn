// Algoritmo de Luhn mejorado para validación
export const luhnCheck = (num) => {
    if (!num || typeof num !== 'string') return false;
    
    // Eliminar espacios y guiones si existen
    num = num.replace(/[\s-]/g, '');
    
    // Verificar que solo contenga números
    if (!/^\d+$/.test(num)) return false;
    
    let sum = 0;
    let isEven = false;
    
    // Recorrer de derecha a izquierda
    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return (sum % 10) === 0;
};

// Generar dígito de verificación mejorado
export const generateCheckDigit = (partial) => {
    if (!partial || typeof partial !== 'string') return null;
    
    // Limpiar y validar entrada
    partial = partial.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(partial)) return null;
    
    let sum = 0;
    let isEven = true; // Comenzamos en true porque añadiremos un dígito
    
    // Calcular suma según Luhn
    for (let i = partial.length - 1; i >= 0; i--) {
        let digit = parseInt(partial[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    // Calcular dígito de verificación
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
};

// Generar número de tarjeta mejorado
export const generateCard = (baseNumber) => {
    // Validar entrada
    if (!baseNumber || typeof baseNumber !== 'string') {
        throw new Error('El número base debe ser una cadena válida');
    }
    
    baseNumber = baseNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(baseNumber)) {
        throw new Error('El número base debe contener solo dígitos');
    }
    
    let card = baseNumber;
    
    // Generar dígitos aleatorios hasta alcanzar longitud 15
    while (card.length < 15) {
        card += Math.floor(Math.random() * 10);
    }
    
    // Validar longitud
    if (card.length !== 15) {
        throw new Error('Error en la longitud de la tarjeta generada');
    }
    
    // Generar y añadir dígito de verificación
    const checkDigit = generateCheckDigit(card);
    if (checkDigit === null) {
        throw new Error('Error al generar el dígito de verificación');
    }
    
    card += checkDigit;
    
    // Verificación final
    if (!luhnCheck(card)) {
        throw new Error('La tarjeta generada no pasa la validación Luhn');
    }
    
    return card;
};

// Generar CVV mejorado
export const generateCVV = (customCvv) => {
    if (customCvv) {
        if (!/^\d{3}$/.test(customCvv)) {
            throw new Error('El CVV debe ser un número de 3 dígitos');
        }
        return customCvv;
    }
    return Math.floor(100 + Math.random() * 900).toString().padStart(3, '0');
};

// Generar fecha de expiración mejorada
export const generateExpiryDate = (month, year) => {
    if (month && year) {
        // Validar formato
        if (!/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) {
            throw new Error('Formato de fecha inválido');
        }
        
        // Convertir a números
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        // Validar rango del mes
        if (monthNum < 1 || monthNum > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }
        
        // Validar año
        const currentYear = new Date().getFullYear();
        if (yearNum < currentYear || yearNum > currentYear + 10) {
            throw new Error('El año debe estar entre el actual y los próximos 10 años');
        }
        
        return {
            month: monthNum.toString().padStart(2, '0'),
            year: yearNum.toString()
        };
    }
    
    // Generar fecha aleatoria válida
    const now = new Date();
    const randomYear = now.getFullYear() + Math.floor(Math.random() * 5);
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    
    return {
        month: randomMonth.toString().padStart(2, '0'),
        year: randomYear.toString()
    };
}; 