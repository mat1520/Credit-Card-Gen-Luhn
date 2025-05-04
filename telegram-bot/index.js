import 'dotenv/config';
import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { isValidBin, generateCard } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const BOT_TOKEN = '7916820433:AAF3MB2Aw_sZWif1N4AxLZwRzEGolcRoVzg';
const bot = new Telegraf(BOT_TOKEN);

// Rate limiting and command debouncing
const userStates = new Map();
const COOLDOWN_PERIOD = 2000; // 2 seconds cooldown between commands
const processingCommands = new Set(); // Track commands being processed

const isCommandAllowed = (userId) => {
    const now = Date.now();
    const lastCommandTime = userStates.get(userId);
    
    if (!lastCommandTime || (now - lastCommandTime) >= COOLDOWN_PERIOD) {
        userStates.set(userId, now);
        return true;
    }
    return false;
};

// Middleware para rate limiting y prevención de duplicados
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
        const userId = ctx.from.id;
        const messageId = ctx.message.message_id;
        const commandKey = `${userId}_${messageId}_slash`;
        
        // Si el comando ya está siendo procesado, ignorarlo
        if (processingCommands.has(commandKey)) {
            console.log(`Comando con / duplicado ignorado: ${commandKey}`);
            return;
        }
        
        // Si el usuario está en cooldown, ignorar el comando
        if (!isCommandAllowed(userId)) {
            console.log(`Comando con / ignorado por cooldown: ${commandKey}`);
            await ctx.reply('⚠️ Por favor, espera unos segundos antes de usar otro comando.');
            return;
        }
        
        // Marcar el comando como en procesamiento
        processingCommands.add(commandKey);
        
        try {
            await next();
        } finally {
            // Limpiar después de un tiempo
            setTimeout(() => {
                processingCommands.delete(commandKey);
            }, 60000);
        }
    } else {
        await next();
    }
});

// Directorio de datos
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Funciones de utilidad
const getUserDataPath = (userId) => path.join(DATA_DIR, `${userId}.json`);

const loadUserData = (userId) => {
    const filePath = getUserDataPath(userId);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return {
        favorites: [],
        history: []
    };
};

const saveUserData = (userId, data) => {
    const filePath = getUserDataPath(userId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Función para consultar BIN usando APIs alternativas
const lookupBin = async (bin) => {
    try {
        console.log(`Consultando BIN ${bin} en binlist.net...`);
        // Primera API: binlist.net
        const response1 = await fetch(`https://lookup.binlist.net/${bin}`);
        if (response1.ok) {
            const data1 = await response1.json();
            console.log('Respuesta de binlist.net:', data1);
            return {
                bank: data1.bank?.name || 'Desconocido',
                brand: data1.scheme || 'Desconocida',
                type: data1.type || 'Desconocido',
                country: data1.country?.name || 'Desconocido',
                countryCode: data1.country?.alpha2 || '??',
                level: data1.brand || 'Desconocido'
            };
        }
        console.log(`binlist.net falló con status ${response1.status}`);

        console.log(`Consultando BIN ${bin} en bintable.com...`);
        // Segunda API: bintable.com
        const response2 = await fetch(`https://api.bintable.com/v1/${bin}?api_key=19d935a6d3244f3f8bab8f09157e4936`);
        if (response2.ok) {
            const data2 = await response2.json();
            console.log('Respuesta de bintable.com:', data2);
            return {
                bank: data2.bank?.name || 'Desconocido',
                brand: data2.scheme || data2.brand || 'Desconocida',
                type: data2.type || 'Desconocido',
                country: data2.country?.name || 'Desconocido',
                countryCode: data2.country?.code || '??',
                level: data2.level || 'Desconocido'
            };
        }
        console.log(`bintable.com falló con status ${response2.status}`);

        throw new Error('No se pudo obtener información del BIN');
    } catch (error) {
        console.error('Error al consultar BIN:', error);
        return null;
    }
};

// Función para registrar comandos con ambos prefijos
const registerCommand = (command, handler) => {
    // Registrar con prefijo /
    bot.command(command, handler);
    // Registrar con prefijo . usando regex insensible a mayúsculas
    bot.hears(new RegExp(`^\\.${command}\\b`, 'i'), handler);
};

// Función para extraer argumentos del mensaje
const getCommandArgs = (ctx) => {
    const text = ctx.message.text;
    // Si el comando empieza con /, usar split normal
    if (text.startsWith('/')) {
        return text.split(' ').slice(1).join(' ');
    }
    // Si el comando empieza con ., extraer todo después del comando
    const match = text.match(/^\.(\w+)\s*(.*)/);
    if (match) {
        return match[2];
    }
    return '';
};

// Función para generar mensaje de limpieza
const generateClearMessage = () => {
    return '⠀\n'.repeat(100) + '🧹 Chat limpiado';
};

// Función para procesar comandos con punto
const handleDotCommand = async (ctx) => {
    const text = ctx.message.text;
    if (!text.startsWith('.')) return false;

    // Extraer el comando y los argumentos
    const match = text.match(/^\.(\w+)\s*(.*)/);
    if (!match) return false;

    const [, command, args] = match;
    console.log('Comando con punto detectado:', { command, args });

    switch (command.toLowerCase()) {
        case 'clear':
        case 'limpiar':
            await ctx.reply(generateClearMessage());
            return true;

        case 'gen':
            if (!args) {
                await ctx.reply('❌ Uso: .gen BIN|MM|YYYY|CVV\nEjemplo: .gen 477349002646|05|2027|123');
                return true;
            }
            const parts = args.split('|');
            const bin = parts[0];
            const fixedMonth = parts[1];
            const fixedYear = parts[2];
            const fixedCVV = parts[3];

            if (!isValidBin(bin)) {
                await ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
                return true;
            }

            try {
                const cards = Array(10).fill().map(() => {
                    const card = generateCard(bin);
                    if (fixedMonth) card.month = fixedMonth;
                    if (fixedYear) card.year = fixedYear?.slice(-2) || card.year;
                    if (fixedCVV) card.cvv = fixedCVV;
                    return card;
                });
                
                const response = cards.map(card => 
                    `${card.number}|${card.month}|${card.year}|${card.cvv}`
                ).join('\n');

                // Guardar en historial
                const userId = ctx.from.id;
                const userData = loadUserData(userId);
                userData.history.unshift({
                    type: 'gen',
                    bin,
                    count: cards.length,
                    timestamp: new Date().toISOString()
                });
                saveUserData(userId, userData);

                await ctx.reply(`🎲 Tarjetas generadas:\n\n${response}`);
            } catch (error) {
                console.error('Error en comando .gen:', error);
                await ctx.reply(`❌ Error al generar tarjetas: ${error.message}`);
            }
            return true;

        case 'bin':
            if (!args) {
                await ctx.reply('❌ Uso: .bin BIN\nEjemplo: .bin 431940');
                return true;
            }
            if (!isValidBin(args)) {
                await ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
                return true;
            }
            try {
                const binInfo = await lookupBin(args);
                if (!binInfo) {
                    await ctx.reply('❌ No se encontró información para este BIN');
                    return true;
                }

                const response = `
🔍 Información del BIN: ${args}

🏦 Banco: ${binInfo.bank}
💳 Marca: ${binInfo.brand}
🌍 País: ${binInfo.country} (${binInfo.countryCode})
📱 Tipo: ${binInfo.type}
⭐️ Nivel: ${binInfo.level}
                `;

                // Guardar en historial
                const userId = ctx.from.id;
                const userData = loadUserData(userId);
                userData.history.unshift({
                    type: 'lookup',
                    bin: args,
                    info: binInfo,
                    timestamp: new Date().toISOString()
                });
                saveUserData(userId, userData);

                await ctx.reply(response);
            } catch (error) {
                console.error('Error en comando .bin:', error);
                await ctx.reply(`❌ Error al consultar BIN: ${error.message}`);
            }
            return true;

        case 'start':
        case 'ayuda':
        case 'help':
            const helpText = `👋 ¡Hola! Bienvenido a CARD GEN PRO

Todos los comandos funcionan con / o . (por ejemplo, /gen o .gen)

🔧 Generación de Tarjetas
gen BIN|MM|YYYY|CVV  
► Genera 10 tarjetas automáticamente  
Ejemplo: gen 477349002646|05|2027|123

🔍 Consultas Inteligentes
bin BIN  
► Información detallada de un BIN  
Ejemplo: bin 431940

cedula <número de cédula>  
► Consulta datos SRI por cédula  
Ejemplo: cedula 17xxxxxxxx

placa <número de placa>
► Consulta datos de vehículo por placa
Ejemplo: placa PDF9627

⭐️ Favoritos
favoritos  
► Lista tus BINs guardados

agregarbin BIN [mes] [año] [cvv]  
► Guarda un BIN para usarlo luego

eliminarbin <índice>  
► Elimina un BIN de tu lista

📋 Utilidades
historial  
► Revisa tus consultas anteriores

clear  
► Limpia el chat

ayuda  
► Muestra esta guía de comandos

🌐 Prueba también la versión web  
https://credit-cart-gen-luhn.vercel.app/index.html

Desarrollado con ❤️ por @mat1520`;
            await ctx.reply(helpText);
            return true;

        case 'favoritos':
            const userDataFav = loadUserData(ctx.from.id);
            if (userDataFav.favorites.length === 0) {
                await ctx.reply('📌 No tienes BINs favoritos guardados');
                return true;
            }
            const responseFav = userDataFav.favorites.map((fav, index) => 
                `${index + 1}. ${fav.bin} (${fav.month || 'MM'}/${fav.year || 'YY'})`
            ).join('\n');
            await ctx.reply(`📌 Tus BINs favoritos:\n\n${responseFav}`);
            return true;

        case 'historial':
            const userDataHist = loadUserData(ctx.from.id);
            if (userDataHist.history.length === 0) {
                await ctx.reply('📝 No hay historial de consultas');
                return true;
            }
            const responseHist = userDataHist.history.slice(0, 10).map((item, index) => {
                const date = new Date(item.timestamp).toLocaleString();
                if (item.type === 'gen') {
                    return `${index + 1}. Generación: ${item.bin} (${item.count} tarjetas) - ${date}`;
                } else {
                    return `${index + 1}. Consulta: ${item.bin} - ${date}`;
                }
            }).join('\n');
            await ctx.reply(`📝 Historial reciente:\n\n${responseHist}`);
            return true;
    }
    return false;
};

// Middleware para comandos con punto
bot.on('text', async (ctx, next) => {
    try {
        if (ctx.message.text.startsWith('.')) {
            const userId = ctx.from.id;
            const messageId = ctx.message.message_id;
            const commandKey = `${userId}_${messageId}_dot`;
            
            // Si el usuario está en cooldown, ignorar el comando
            if (!isCommandAllowed(userId)) {
                console.log(`Comando con . ignorado por cooldown: ${commandKey}`);
                await ctx.reply('⚠️ Por favor, espera unos segundos antes de usar otro comando.');
                return;
            }
            
            console.log(`Procesando comando con punto: ${ctx.message.text}`);
            const handled = await handleDotCommand(ctx);
            if (!handled) {
                await next();
            }
        } else {
            await next();
        }
    } catch (error) {
        console.error('Error en middleware de texto:', error);
    }
});

// Comandos del bot
registerCommand('start', (ctx) => {
    const helpText = `👋 ¡Hola! Bienvenido a CARD GEN PRO

Todos los comandos funcionan con / o . (por ejemplo, /gen o .gen)

🔧 Generación de Tarjetas
gen BIN|MM|YYYY|CVV  
► Genera 10 tarjetas automáticamente  
Ejemplo: gen 477349002646|05|2027|123

🔍 Consultas Inteligentes
bin BIN  
► Información detallada de un BIN  
Ejemplo: bin 431940

cedula <número de cédula>  
► Consulta datos SRI por cédula  
Ejemplo: cedula 17xxxxxxxx

placa <número de placa>
► Consulta datos de vehículo por placa
Ejemplo: placa PDF9627

⭐️ Favoritos
favoritos  
► Lista tus BINs guardados

agregarbin BIN [mes] [año] [cvv]  
► Guarda un BIN para usarlo luego

eliminarbin <índice>  
► Elimina un BIN de tu lista

📋 Utilidades
historial  
► Revisa tus consultas anteriores

clear  
► Limpia el chat

ayuda  
► Muestra esta guía de comandos

🌐 Prueba también la versión web  
https://credit-cart-gen-luhn.vercel.app/index.html

Desarrollado con ❤️ por @mat1520`;
    ctx.reply(helpText);
});

registerCommand('help', (ctx) => {
    ctx.reply('Para ver la lista de comandos, usa /start o .start');
});

registerCommand('gen', async (ctx) => {
    const messageId = ctx.message.message_id;
    console.log(`Procesando comando gen, messageId: ${messageId}`);
    
    try {
        const input = getCommandArgs(ctx);
        console.log('Input completo:', ctx.message.text);
        console.log('Input procesado:', input);
        
        if (!input) {
            return ctx.reply('❌ Uso: /gen o .gen BIN|MM|YYYY|CVV\nEjemplo: /gen 477349002646|05|2027|123');
        }

        const parts = input.split('|');
        const bin = parts[0];
        const fixedMonth = parts[1];
        const fixedYear = parts[2];
        const fixedCVV = parts[3];

        console.log('Partes:', { bin, fixedMonth, fixedYear, fixedCVV });

        if (!isValidBin(bin)) {
            return ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
        }

        // Validar mes si se proporciona
        if (fixedMonth && !/^(0[1-9]|1[0-2])$/.test(fixedMonth)) {
            return ctx.reply('❌ Mes inválido. Debe estar entre 01 y 12.');
        }

        // Validar año si se proporciona
        if (fixedYear && !/^20[2-3][0-9]$/.test(fixedYear)) {
            return ctx.reply('❌ Año inválido. Debe estar en formato YYYY y ser mayor al año actual.');
        }

        // Validar CVV si se proporciona
        if (fixedCVV && !/^[0-9]{3,4}$/.test(fixedCVV)) {
            return ctx.reply('❌ CVV inválido. Debe contener 3 o 4 dígitos.');
        }

        // Generar exactamente 10 tarjetas
        const cards = Array(10).fill().map(() => {
            const card = generateCard(bin);
            if (fixedMonth) card.month = fixedMonth;
            if (fixedYear) card.year = fixedYear?.slice(-2) || card.year;
            if (fixedCVV) card.cvv = fixedCVV;
            return card;
        });

        // Consultar info del BIN usando solo los primeros 6 dígitos
        let binInfo = await lookupBin(bin.slice(0, 6));
        if (!binInfo) binInfo = {};
        const bank = binInfo.bank || 'No disponible';
        const brand = binInfo.brand || 'No disponible';
        const country = binInfo.country || 'No disponible';
        const countryCode = binInfo.countryCode || '';
        const type = binInfo.type || 'No disponible';
        const level = binInfo.level || 'No disponible';
        const flag = countryCode ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '';

        // Formato mejorado y profesional
        const userName = ctx.from.first_name || 'Usuario';
        const header = `
╔══════════════════════════╗
║    💳 CARD GEN PRO 💳    ║
╚══════════════════════════╝

👤 Usuario: ${userName}
📅 Fecha: ${new Date().toLocaleDateString()}
`;

        // Lista de tarjetas en bloque de código para fácil copia
        const tarjetas = cards.map(card => 
            `${card.number}|${card.month}|${card.year}|${card.cvv}`
        ).join('\n');
        
        const cardBlock = '```\n' + tarjetas + '\n```';

        // Información del BIN con formato mejorado
        const binInfoFormatted = `
📊 Detalles del BIN:
• BIN: ${bin}
• Mes: ${fixedMonth || 'xx'}
• Año: ${fixedYear ? fixedYear.slice(-2) : 'xx'}
• CVV: ${fixedCVV || 'rnd'}

🏦 Información:
• Banco: ${bank}
• Marca: ${brand}
• País: ${country}${countryCode ? ` (${countryCode})` : ''} ${flag}
• Tipo: ${type}
• Nivel: ${level}
`;

        const response = `${header}${cardBlock}\n${binInfoFormatted}`;

        // Guardar en historial
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        userData.history.unshift({
            type: 'gen',
            bin,
            count: cards.length,
            timestamp: new Date().toISOString()
        });
        saveUserData(userId, userData);

        await ctx.reply(response);
    } catch (error) {
        console.error(`Error en comando gen, messageId: ${messageId}:`, error);
        await ctx.reply(`❌ Error al generar tarjetas: ${error.message}`);
    }
});

registerCommand('bin', async (ctx) => {
    try {
        const bin = getCommandArgs(ctx);
        console.log('Input completo:', ctx.message.text);
        console.log('BIN procesado:', bin);
        
        if (!bin) {
            return ctx.reply('❌ Uso: /bin o .bin BIN\nEjemplo: /bin 431940');
        }

        if (!isValidBin(bin)) {
            return ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
        }

        const binInfo = await lookupBin(bin);
        if (!binInfo) {
            return ctx.reply('❌ No se encontró información para este BIN');
        }

        const response = `
🔍 Información del BIN: ${bin}

🏦 Banco: ${binInfo.bank}
💳 Marca: ${binInfo.brand}
🌍 País: ${binInfo.country} (${binInfo.countryCode})
📱 Tipo: ${binInfo.type}
⭐️ Nivel: ${binInfo.level}
        `;

        // Guardar en historial
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        userData.history.unshift({
            type: 'lookup',
            bin,
            info: binInfo,
            timestamp: new Date().toISOString()
        });
        saveUserData(userId, userData);

        await ctx.reply(response);
    } catch (error) {
        console.error('Error en comando bin:', error);
        await ctx.reply(`❌ Error al consultar BIN: ${error.message}`);
    }
});

registerCommand('favoritos', (ctx) => {
    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    if (userData.favorites.length === 0) {
        return ctx.reply('📌 No tienes BINs favoritos guardados');
    }

    const response = userData.favorites.map((fav, index) => 
        `${index + 1}. ${fav.bin} (${fav.month || 'MM'}/${fav.year || 'YY'})`
    ).join('\n');

    ctx.reply(`📌 Tus BINs favoritos:\n\n${response}`);
});

registerCommand('agregarbin', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
        return ctx.reply('❌ Uso: /agregarbin o .agregarbin BIN mes? año? cvv?');
    }

    const [bin, month, year, cvv] = args;
    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
    }

    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    if (userData.favorites.some(fav => fav.bin === bin)) {
        return ctx.reply('❌ Este BIN ya está en tus favoritos');
    }

    userData.favorites.push({ bin, month, year, cvv });
    saveUserData(userId, userData);

    ctx.reply('✅ BIN agregado a favoritos');
});

registerCommand('eliminarbin', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
        return ctx.reply('❌ Uso: /eliminarbin o .eliminarbin índice');
    }

    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= userData.favorites.length) {
        return ctx.reply('❌ Índice inválido');
    }

    const removedBin = userData.favorites.splice(index, 1)[0];
    saveUserData(userId, userData);

    ctx.reply(`✅ BIN ${removedBin.bin} eliminado de favoritos`);
});

registerCommand('historial', (ctx) => {
    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    if (userData.history.length === 0) {
        return ctx.reply('📝 No hay historial de consultas');
    }

    const response = userData.history.slice(0, 10).map((item, index) => {
        const date = new Date(item.timestamp).toLocaleString();
        if (item.type === 'gen') {
            return `${index + 1}. Generación: ${item.bin} (${item.count} tarjetas) - ${date}`;
        } else {
            return `${index + 1}. Consulta: ${item.bin} - ${date}`;
        }
    }).join('\n');

    ctx.reply(`📝 Historial reciente:\n\n${response}`);
});

registerCommand('clear', async (ctx) => {
    await ctx.reply(generateClearMessage());
});

registerCommand('limpiar', async (ctx) => {
    await ctx.reply(generateClearMessage());
});

registerCommand('cedula', async (ctx) => {
    const cedula = getCommandArgs(ctx).trim();
    if (!cedula || !/^[0-9]{10}$/.test(cedula)) {
        return ctx.reply('❌ Uso: /cedula <número de cédula>\nEjemplo: /cedula 17xxxxxxxx');
    }
    try {
        const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porIdentificacion/${cedula}/?tipoPersona=N&_=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.contribuyente) {
            const info = data.contribuyente;
            let msg = `🪪 Información SRI para la cédula: <code>${cedula}</code>\n\n`;
            msg += `• <b>Nombre Comercial:</b> ${info.nombreComercial || 'No disponible'}\n`;
            msg += `• <b>Clase:</b> ${info.clase || 'No disponible'}\n`;
            msg += `• <b>Tipo de Identificación:</b> ${info.tipoIdentificacion || 'No disponible'}\n`;
            if (data.deuda) {
                msg += `\n💸 <b>Deuda:</b> ${data.deuda.estado || 'No disponible'} - ${data.deuda.monto || 'No disponible'}`;
            }
            await ctx.replyWithHTML(msg);
        } else {
            await ctx.reply('❌ No se encontró información para la cédula proporcionada.');
        }
    } catch (error) {
        console.error('Error en comando /cedula:', error);
        await ctx.reply('❌ Error al consultar la cédula. Intenta más tarde.');
    }
});

// Función para consultar datos de placa vehicular
async function consultarPlaca(placa) {
    const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/matriculacion/valor/${placa}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error en la consulta');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al consultar la placa:', error);
        throw error;
    }
}

// Función para manejar comandos de Telegram
function handleTelegramCommand(command, placa) {
    if (command === '.placa' || command === '/placa') {
        consultarPlaca(placa)
            .then(data => {
                // Aquí puedes enviar la respuesta al usuario de Telegram
                console.log('Datos de la placa:', data);
                // Ejemplo: bot.sendMessage(chatId, JSON.stringify(data, null, 2));
            })
            .catch(error => {
                console.error('Error al consultar la placa:', error);
                // Ejemplo: bot.sendMessage(chatId, 'Error al consultar la placa.');
            });
    } else if (command === '/start') {
        // Mensaje de bienvenida
        console.log('Bienvenido al bot de consulta de placas. Usa .placa o /placa seguido de la placa para consultar.');
        // Ejemplo: bot.sendMessage(chatId, 'Bienvenido al bot de consulta de placas. Usa .placa o /placa seguido de la placa para consultar.');
    } else if (command === '/help') {
        // Mensaje de ayuda
        console.log('Comandos disponibles:\n.placa [número de placa] - Consulta datos de la placa\n/placa [número de placa] - Consulta datos de la placa\n/start - Inicia el bot\n/help - Muestra este mensaje de ayuda');
        // Ejemplo: bot.sendMessage(chatId, 'Comandos disponibles:\n.placa [número de placa] - Consulta datos de la placa\n/placa [número de placa] - Consulta datos de la placa\n/start - Inicia el bot\n/help - Muestra este mensaje de ayuda');
    }
}

// Ejemplo de uso
// handleTelegramCommand('.placa', 'PDF9627');

// Registrar comando placa
registerCommand('placa', async (ctx) => {
    const placa = getCommandArgs(ctx).toUpperCase(); // Convertir a mayúsculas
    if (!placa) {
        await ctx.reply('❌ Uso: .placa PLACA\nEjemplo: .placa PDF9627');
        return;
    }

    try {
        const data = await consultarPlaca(placa);
        const mensaje = `
🚗 Información del vehículo: ${placa}

📝 Marca: ${data.marca}
🚙 Modelo: ${data.modelo}
📅 Año: ${data.anioModelo}
🔧 Cilindraje: ${data.cilindraje}
🏭 País: ${data.paisFabricacion}
🚦 Clase: ${data.clase}
🔑 Servicio: ${data.servicio}
💰 Total a pagar: $${data.total}

📍 Cantón: ${data.cantonMatricula}
📆 Última matrícula: ${new Date(data.fechaUltimaMatricula).toLocaleDateString()}
⏳ Caducidad: ${new Date(data.fechaCaducidadMatricula).toLocaleDateString()}
🔄 Estado: ${data.estadoAuto}
`;
        await ctx.reply(mensaje);
    } catch (error) {
        console.error('Error al consultar la placa:', error);
        await ctx.reply('❌ Error al consultar la placa. Por favor, verifica que la placa sea correcta.');
    }
});

// Iniciar el bot
let isShuttingDown = false;

const startBot = async () => {
    try {
        await bot.launch();
        console.log('Bot iniciado');
        
        // Signal ready to PM2
        if (process.send) {
            process.send('ready');
        }
    } catch (err) {
        console.error('Error al iniciar el bot:', err);
        process.exit(1);
    }
};

// Error handling for the bot
bot.catch((err, ctx) => {
    console.error('Error en el manejo del comando:', err);
    if (ctx && !isShuttingDown) {
        ctx.reply('❌ Ocurrió un error al procesar el comando. Por favor, intenta nuevamente.');
    }
});

// Graceful shutdown
const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`Recibida señal ${signal}. Iniciando apagado gracioso...`);
    
    try {
        await bot.stop(signal);
        console.log('Bot detenido correctamente');
    } catch (err) {
        console.error('Error al detener el bot:', err);
    }
    
    process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Start the bot
startBot();