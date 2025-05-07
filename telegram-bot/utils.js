// Función para validar BIN
export const isValidBin = (bin) => {
    if (!bin) return false;
    if (!/^\d{6,16}$/.test(bin)) return false;
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
        cardNumber = cardNumber + randomNum(0, 9);
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

// Función para generar correo temporal
export const generateTempMail = async () => {
    try {
        // Obtener dominios disponibles
        const domainsResponse = await fetch('https://api.mail.tm/domains');
        const domainsData = await domainsResponse.json();
        const domain = domainsData['hydra:member'][0].domain;

        // Generar nombre de usuario aleatorio
        const username = Math.random().toString(36).substring(2, 10);
        const email = `${username}@${domain}`;
        const password = Math.random().toString(36).substring(2, 15);

        // Crear cuenta
        const accountResponse = await fetch('https://api.mail.tm/accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                address: email,
                password: password
            })
        });

        if (!accountResponse.ok) {
            throw new Error('Error al crear cuenta de correo');
        }

        // Obtener token
        const tokenResponse = await fetch('https://api.mail.tm/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                address: email,
                password: password
            })
        });

        if (!tokenResponse.ok) {
            throw new Error('Error al obtener token');
        }

        const tokenData = await tokenResponse.json();

        return {
            email,
            token: tokenData.token
        };
    } catch (error) {
        console.error('Error al generar correo temporal:', error);
        throw error;
    }
};

// Función para verificar mensajes en el correo temporal
export const checkTempMail = async (token) => {
    try {
        const messagesResponse = await fetch('https://api.mail.tm/messages', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!messagesResponse.ok) {
            throw new Error('Error al obtener mensajes');
        }

        const messagesData = await messagesResponse.json();
        return messagesData['hydra:member'];
    } catch (error) {
        console.error('Error al verificar correo temporal:', error);
        throw error;
    }
}; 