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
        console.log('Iniciando generación de correo temporal...');

        // Obtener dominios disponibles
        const domainsResponse = await fetch('https://api.mail.tm/domains', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const domainsText = await domainsResponse.text();
        console.log('Respuesta de dominios:', domainsText);

        if (!domainsResponse.ok) {
            console.error('Error al obtener dominios:', domainsText);
            throw new Error('Error al obtener dominios disponibles');
        }

        let domainsData;
        try {
            domainsData = JSON.parse(domainsText);
        } catch (parseError) {
            console.error('Error al parsear respuesta de dominios:', parseError);
            throw new Error('Error al procesar la respuesta del servidor');
        }

        if (!domainsData['hydra:member'] || !Array.isArray(domainsData['hydra:member']) || domainsData['hydra:member'].length === 0) {
            console.error('No se encontraron dominios disponibles:', domainsData);
            throw new Error('No hay dominios disponibles');
        }

        const domain = domainsData['hydra:member'][0].domain;
        console.log('Dominio seleccionado:', domain);

        // Generar nombre de usuario aleatorio
        const username = Math.random().toString(36).substring(2, 10);
        const email = `${username}@${domain}`;
        const password = Math.random().toString(36).substring(2, 15);

        console.log('Creando cuenta con:', { email, password });

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

        const accountText = await accountResponse.text();
        console.log('Respuesta de creación de cuenta:', accountText);

        if (!accountResponse.ok) {
            console.error('Error al crear cuenta:', accountText);
            throw new Error('Error al crear cuenta de correo');
        }

        console.log('Cuenta creada, obteniendo token...');

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

        const tokenText = await tokenResponse.text();
        console.log('Respuesta de token:', tokenText);

        if (!tokenResponse.ok) {
            console.error('Error al obtener token:', tokenText);
            throw new Error('Error al obtener token');
        }

        let tokenData;
        try {
            tokenData = JSON.parse(tokenText);
        } catch (parseError) {
            console.error('Error al parsear respuesta de token:', parseError);
            throw new Error('Error al procesar la respuesta del servidor');
        }

        if (!tokenData.token) {
            console.error('Token no encontrado en la respuesta:', tokenData);
            throw new Error('Token no encontrado en la respuesta');
        }

        console.log('Token obtenido correctamente');

        return {
            email,
            token: tokenData.token,
            password // Guardamos la contraseña para futuras autenticaciones
        };
    } catch (error) {
        console.error('Error al generar correo temporal:', error);
        throw error;
    }
};

// Función para verificar mensajes en el correo temporal
export const checkTempMail = async (token) => {
    try {
        console.log('Iniciando verificación de mensajes...');

        // Validar que el token no esté vacío
        if (!token) {
            console.error('Token vacío');
            throw new Error('Token no válido');
        }

        // Primero verificamos que el token sea válido
        const meResponse = await fetch('https://api.mail.tm/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const meText = await meResponse.text();
        console.log('Respuesta de verificación de token:', meText);

        if (!meResponse.ok) {
            console.error('Error al verificar token:', meText);
            throw new Error('Token inválido o expirado');
        }

        console.log('Token válido, obteniendo mensajes...');

        // Obtenemos los mensajes con parámetros específicos
        const messagesResponse = await fetch('https://api.mail.tm/messages?page=1&limit=50', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const messagesText = await messagesResponse.text();
        console.log('Respuesta de mensajes:', messagesText);

        if (!messagesResponse.ok) {
            console.error('Error al obtener mensajes:', messagesText);
            throw new Error('Error al obtener mensajes');
        }

        let messagesData;
        try {
            messagesData = JSON.parse(messagesText);
        } catch (parseError) {
            console.error('Error al parsear respuesta JSON:', parseError);
            throw new Error('Error al procesar la respuesta del servidor');
        }
        
        if (!messagesData['hydra:member'] || !Array.isArray(messagesData['hydra:member'])) {
            console.error('Formato de respuesta inválido:', messagesData);
            throw new Error('Formato de respuesta inválido');
        }

        console.log(`Se encontraron ${messagesData['hydra:member'].length} mensajes`);
        
        // Si hay mensajes, obtenemos el contenido completo de cada uno
        const messages = await Promise.all(
            messagesData['hydra:member'].map(async (msg) => {
                try {
                    console.log(`Obteniendo detalles del mensaje ${msg.id}...`);
                    const messageResponse = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const messageText = await messageResponse.text();
                    console.log(`Respuesta del mensaje ${msg.id}:`, messageText);
                    
                    if (!messageResponse.ok) {
                        console.error(`Error al obtener mensaje ${msg.id}:`, messageText);
                        return msg; // Si falla, retornamos el mensaje básico
                    }
                    
                    try {
                        const messageData = JSON.parse(messageText);
                        console.log(`Mensaje ${msg.id} obtenido correctamente`);
                        return messageData;
                    } catch (parseError) {
                        console.error(`Error al parsear mensaje ${msg.id}:`, parseError);
                        return msg;
                    }
                } catch (error) {
                    console.error(`Error al obtener mensaje individual ${msg.id}:`, error);
                    return msg;
                }
            })
        );

        console.log('Procesamiento de mensajes completado');
        return messages;
    } catch (error) {
        console.error('Error al verificar correo temporal:', error);
        throw error;
    }
}; 