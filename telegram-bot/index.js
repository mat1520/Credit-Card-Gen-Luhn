import 'dotenv/config';
import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { isValidBin, generateCard, generateTempMail, checkTempMail } from './utils.js';

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
        history: [],
        tempMail: null
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

// Función robusta para parsear el input del comando gen
function parseGenInput(input) {
    // Quitar espacios al inicio y final
    input = input.trim();
    // Reemplazar múltiples separadores por uno solo
    input = input.replace(/\|/g, ' ').replace(/\s+/g, ' ');
    // Quitar caracteres x o X al final del bin
    let [bin, month, year, cvv] = input.split(' ');
    if (bin) bin = bin.replace(/x+$/i, '');
    // Si el mes y año vienen juntos (ej: 06/25 o 06/2025)
    if (month && /\//.test(month)) {
        const [m, y] = month.split('/');
        month = m;
        year = y && y.length === 2 ? '20' + y : y;
    }
    // Si el año es de 2 dígitos, convertir a 4
    if (year && year.length === 2) year = '20' + year;
    // Si el mes es inválido pero el año parece mes (ej: 2025 06)
    if (year && month && month.length === 4 && /^20[2-3][0-9]$/.test(month) && /^0[1-9]|1[0-2]$/.test(year)) {
        [month, year] = [year, month];
    }
    // Si el cvv contiene x, ignorar
    if (cvv && /x/i.test(cvv)) cvv = undefined;
    return { bin, month, year, cvv };
}

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
            // Usar el nuevo parser
            const { bin, month: fixedMonth, year: fixedYear, cvv: fixedCVV } = parseGenInput(args);
            if (!isValidBin(bin)) {
                await ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
                return true;
            }
            if (fixedMonth && !/^(0[1-9]|1[0-2])$/.test(fixedMonth)) {
                await ctx.reply('❌ Mes inválido. Debe estar entre 01 y 12.');
                return true;
            }
            if (fixedYear && !/^([0-9]{2}|20[2-3][0-9])$/.test(fixedYear)) {
                await ctx.reply('❌ Año inválido. Debe estar en formato YY o YYYY y ser mayor al año actual.');
                return true;
            }
            if (fixedCVV && !/^[0-9]{3,4}$/.test(fixedCVV)) {
                await ctx.reply('❌ CVV inválido. Debe contener 3 o 4 dígitos.');
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

        case 'agregarbin':
            if (!args) {
                await ctx.reply('❌ Uso: .agregarbin BIN mes? año? cvv?');
                return true;
            }
            // Usar el parser flexible
            const parsedAdd = parseGenInput(args);
            if (!isValidBin(parsedAdd.bin)) {
                await ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
                return true;
            }
            const userIdAdd = ctx.from.id;
            const userDataAdd = loadUserData(userIdAdd);
            if (userDataAdd.favorites.some(fav => fav.bin === parsedAdd.bin)) {
                await ctx.reply('❌ Este BIN ya está en tus favoritos');
                return true;
            }
            userDataAdd.favorites.push({ bin: parsedAdd.bin, month: parsedAdd.month, year: parsedAdd.year, cvv: parsedAdd.cvv });
            saveUserData(userIdAdd, userDataAdd);
            await ctx.reply('✅ BIN agregado a favoritos');
            return true;

        case 'eliminarbin':
            if (!args) {
                await ctx.reply('❌ Uso: .eliminarbin índice o BIN');
                return true;
            }
            const userIdDel = ctx.from.id;
            const userDataDel = loadUserData(userIdDel);
            // Si es número, eliminar por índice
            if (/^\d+$/.test(args)) {
                const index = parseInt(args) - 1;
                if (isNaN(index) || index < 0 || index >= userDataDel.favorites.length) {
                    await ctx.reply('❌ Índice inválido');
                    return true;
                }
                const removedBin = userDataDel.favorites.splice(index, 1)[0];
                saveUserData(userIdDel, userDataDel);
                await ctx.reply(`✅ BIN ${removedBin.bin} eliminado de favoritos`);
                return true;
            }
            // Si es BIN flexible, usar el parser
            const parsedDel = parseGenInput(args);
            const favIndex = userDataDel.favorites.findIndex(fav => fav.bin === parsedDel.bin);
            if (favIndex === -1) {
                await ctx.reply('❌ No se encontró ese BIN en tus favoritos');
                return true;
            }
            const removedBin = userDataDel.favorites.splice(favIndex, 1)[0];
            saveUserData(userIdDel, userDataDel);
            await ctx.reply(`✅ BIN ${removedBin.bin} eliminado de favoritos`);
            return true;

        case 'mail':
            await handleMailCommand(ctx);
            return true;

        case 'check':
            await handleCheckCommand(ctx);
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

// URL RAW de la imagen oficial OFFICIALT.png en GitHub
const HACKER_IMG_URL = 'https://raw.githubusercontent.com/mat1520/Credit-Cart-Gen-Luhn/main/telegram-bot/OFFICIALT.png';

// Comandos del bot
registerCommand('start', async (ctx) => {
    const warning = '⚡️ <b>¡ADVERTENCIA!</b> Esto no es un simulacro';
    const desc = '<i>Este bot es solo para fines educativos y de pruebas en ciberseguridad. Bienvenido al laboratorio virtual de tarjetas y OSINT. Solo para hackers éticos, pentesters y mentes curiosas. El uso indebido de la información generada puede tener consecuencias legales. ¡Explora bajo tu propio riesgo! 👾</i>';
    const welcome = '<b>CardGen Pro BOT</b>\n';
    // Enviar la imagen desde la URL RAW de GitHub
    await ctx.replyWithPhoto(HACKER_IMG_URL, {
        caption: `${warning}\n\n${welcome}\n${desc}`,
        parse_mode: 'HTML'
    });
    // Menú con botones
    await ctx.reply('Selecciona una opción del menú:', {
        reply_markup: {
            keyboard: [
                ['🛠 Tools', '👤 Creator'],
                ['💸 Donate', '🐙 GitHub']
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Handlers para los botones del menú principal
bot.hears('🛠 Tools', (ctx) => {
    const toolsText = `🛠 *Herramientas disponibles:*\n\n` +
        `*Generación y Consultas:*\n` +
        `• \`/gen\` BIN|MM|YYYY|CVV - Genera tarjetas 💳\n` +
        `• \`/bin\` BIN - Consulta BIN 🔍\n` +
        `• \`/cedula\` <número> - Consulta SRI por cédula 🪪\n` +
        `• \`/placa\` <número> - Consulta datos de vehículo 🚗\n\n` +
        `*Correo Temporal:*\n` +
        `• \`/mail\` - Genera correo temporal 📧\n` +
        `• \`/check\` - Verifica mensajes del correo 📨\n\n` +
        `*Favoritos:*\n` +
        `• \`/favoritos\` - Tus BINs favoritos ⭐️\n` +
        `• \`/agregarbin\` BIN [mes] [año] [cvv] - Agrega BIN a favoritos ➕\n` +
        `• \`/eliminarbin\` <índice> - Elimina BIN de favoritos 🗑\n\n` +
        `*Utilidades:*\n` +
        `• \`/historial\` - Tu historial 📝\n` +
        `• \`/clear\` - Limpiar chat 🧹\n\n` +
        `*Todos los comandos funcionan con / o .*`;
    ctx.reply(toolsText, { parse_mode: 'Markdown' });
});
bot.hears('👤 Creator', (ctx) => {
    ctx.reply('👤 Creador: @MAT3810\nhttps://t.me/MAT3810');
});
bot.hears('💸 Donate', (ctx) => {
    ctx.reply('💸 Puedes apoyar el proyecto aquí:\nhttps://paypal.me/ArielMelo200?country.x=EC&locale.x=es_XC');
});
bot.hears('🐙 GitHub', (ctx) => {
    ctx.reply('🐙 GitHub: https://github.com/mat1520');
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
        // Usar el nuevo parser
        const { bin, month: fixedMonth, year: fixedYear, cvv: fixedCVV } = parseGenInput(input);
        console.log('Parseado:', { bin, fixedMonth, fixedYear, fixedCVV });
        if (!isValidBin(bin)) {
            return ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
        }
        if (fixedMonth && !/^(0[1-9]|1[0-2])$/.test(fixedMonth)) {
            return ctx.reply('❌ Mes inválido. Debe estar entre 01 y 12.');
        }
        if (fixedYear && !/^([0-9]{2}|20[2-3][0-9])$/.test(fixedYear)) {
            return ctx.reply('❌ Año inválido. Debe estar en formato YY o YYYY y ser mayor al año actual.');
        }
        if (fixedCVV && !/^[0-9]{3,4}$/.test(fixedCVV)) {
            return ctx.reply('❌ CVV inválido. Debe contener 3 o 4 dígitos.');
        }
        const cards = Array(10).fill().map(() => {
            const card = generateCard(bin);
            if (fixedMonth) card.month = fixedMonth;
            if (fixedYear) card.year = fixedYear?.slice(-2) || card.year;
            if (fixedCVV) card.cvv = fixedCVV;
            return card;
        });
        let binInfo = await lookupBin(bin.slice(0, 6));
        if (!binInfo) binInfo = {};
        const bank = binInfo.bank || 'No disponible';
        const brand = binInfo.brand || 'No disponible';
        const country = binInfo.country || 'No disponible';
        const countryCode = binInfo.countryCode || '';
        const type = binInfo.type || 'No disponible';
        const level = binInfo.level || 'No disponible';
        const flag = countryCode ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '';
        const userName = ctx.from.first_name || 'Usuario';
        const header = `\n𝘽𝙞𝙣 -» ${bin}xxxx|${fixedMonth || 'xx'}|${fixedYear ? fixedYear.slice(-2) : 'xx'}|${fixedCVV || 'rnd'}\n─━─━─━─━─━─━─━─━─━─━─━─━─`;
        const tarjetas = cards.map(card => `${card.number}|${card.month}|${card.year}|${card.cvv}`).join('\n');
        const cardBlock = tarjetas;
        const binInfoFormatted = `\n─━─━─━─━─━─━─━─━─━─━─━─━─\n• 𝙄𝙣𝙛𝙤 -» ${brand} - ${type} - ${level}\n• 𝘽𝙖𝙣𝙠 -» ${bank}\n• 𝘾𝙤𝙪𝙣𝙩𝙧𝙮 -» ${country} ${flag}\n─━─━─━─━─━─━─━─━─━─━─━─━─\n• 𝙂𝙚𝙣 𝙗𝙮 -» ${userName} -» @CardGenPro_BOT`;
        const response = `${header}\n${cardBlock}\n${binInfoFormatted}`;
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

// Función para manejar el comando de correo temporal
const handleMailCommand = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        
        // Generar nuevo correo temporal
        const { email, token, password } = await generateTempMail();
        
        // Guardar el token y la contraseña en los datos del usuario
        userData.tempMail = { email, token, password };
        saveUserData(userId, userData);
        
        // Enviar mensaje con el correo
        await ctx.reply(
            `📧 *Correo Temporal Generado*\n\n` +
            `📨 *Correo:* \`${email}\`\n` +
            `🔑 *Contraseña:* \`${password}\`\n\n` +
            `⚠️ Este correo es temporal y se eliminará automáticamente.\n` +
            `📝 Usa \`.check\` para verificar si hay nuevos mensajes.`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error en comando mail:', error);
        await ctx.reply('❌ Error al generar el correo temporal. Por favor, intenta de nuevo.');
    }
};

// Función para verificar mensajes
const handleCheckCommand = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        
        if (!userData.tempMail) {
            await ctx.reply('❌ No tienes un correo temporal activo. Usa \`.mail\` para generar uno.');
            return;
        }
        
        // Si el token ha expirado, intentamos renovarlo
        try {
            const messages = await checkTempMail(userData.tempMail.token);
            
            if (messages.length === 0) {
                await ctx.reply(`📭 No hay mensajes nuevos en el correo: ${userData.tempMail.email}`);
                return;
            }
            
            // Mostrar los mensajes con más detalles
            for (const msg of messages) {
                let messageText = `📨 *Nuevo mensaje recibido*\n\n`;
                messageText += `*De:* ${msg.from.address}\n`;
                messageText += `*Para:* ${msg.to[0].address}\n`;
                messageText += `*Asunto:* ${msg.subject || 'Sin asunto'}\n`;
                messageText += `*Fecha:* ${new Date(msg.createdAt).toLocaleString()}\n\n`;
                
                // Intentar extraer el contenido del mensaje
                let content = msg.text || msg.html || 'Sin contenido';
                if (msg.html) {
                    // Eliminar tags HTML básicos
                    content = content.replace(/<[^>]*>/g, '');
                }
                messageText += `*Contenido:*\n${content}\n`;
                
                await ctx.reply(messageText, { 
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true 
                });
            }
        } catch (error) {
            if (error.message === 'Token inválido o expirado') {
                // Intentar renovar el token
                try {
                    const tokenResponse = await fetch('https://api.mail.tm/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            address: userData.tempMail.email,
                            password: userData.tempMail.password
                        })
                    });

                    if (!tokenResponse.ok) {
                        throw new Error('No se pudo renovar el token');
                    }

                    const tokenData = await tokenResponse.json();
                    userData.tempMail.token = tokenData.token;
                    saveUserData(userId, userData);

                    // Intentar verificar mensajes nuevamente
                    const messages = await checkTempMail(tokenData.token);
                    
                    if (messages.length === 0) {
                        await ctx.reply(`📭 No hay mensajes nuevos en el correo: ${userData.tempMail.email}`);
                        return;
                    }

                    // Mostrar los mensajes
                    for (const msg of messages) {
                        let messageText = `📨 *Nuevo mensaje recibido*\n\n`;
                        messageText += `*De:* ${msg.from.address}\n`;
                        messageText += `*Para:* ${msg.to[0].address}\n`;
                        messageText += `*Asunto:* ${msg.subject || 'Sin asunto'}\n`;
                        messageText += `*Fecha:* ${new Date(msg.createdAt).toLocaleString()}\n\n`;
                        
                        let content = msg.text || msg.html || 'Sin contenido';
                        if (msg.html) {
                            content = content.replace(/<[^>]*>/g, '');
                        }
                        messageText += `*Contenido:*\n${content}\n`;
                        
                        await ctx.reply(messageText, { 
                            parse_mode: 'Markdown',
                            disable_web_page_preview: true 
                        });
                    }
                } catch (renewError) {
                    console.error('Error al renovar token:', renewError);
                    await ctx.reply('❌ Tu sesión de correo ha expirado. Por favor, genera un nuevo correo con \`.mail\`');
                }
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error en comando check:', error);
        await ctx.reply('❌ Error al verificar mensajes. Por favor, intenta de nuevo.');
    }
};

// Registrar comandos
registerCommand('mail', handleMailCommand);
registerCommand('check', handleCheckCommand);

// Actualizar el mensaje de ayuda
const helpMessage = `🤖 *CardGen Pro Bot*\n\n` +
    `*Comandos disponibles:*\n` +
    `• \`/start\` o \`.start\` - Mostrar ayuda y comandos disponibles\n` +
    `• \`/gen\` o \`.gen\` - Generar tarjetas\n` +
    `• \`/bin\` o \`.bin\` - Consultar información de BIN\n` +
    `• \`/cedula\` o \`.cedula\` - Consulta información SRI por cédula\n` +
    `• \`/placa\` o \`.placa\` - Consulta información Vehicular\n` +
    `• \`/mail\` o \`.mail\` - Generar correo temporal\n` +
    `• \`/check\` o \`.check\` - Verificar mensajes del correo\n` +
    `• \`/favoritos\` o \`.favoritos\` - Ver BINs favoritos\n` +
    `• \`/agregarbin\` o \`.agregarbin\` - Guardar BIN en favoritos\n` +
    `• \`/eliminarbin\` o \`.eliminarbin\` - Eliminar BIN de favoritos\n` +
    `• \`/historial\` o \`.historial\` - Ver historial de consultas\n` +
    `• \`/clear\` o \`.clear\` - Limpiar el chat\n` +
    `• \`/limpiar\` o \`.limpiar\` - Limpiar el chat\n` +
    `• \`/ayuda\` o \`.ayuda\` - Mostrar ayuda\n\n` +
    `*Ejemplos:*\n` +
    `• \`.gen 477349002646|05|2027|123\`\n` +
    `• \`.bin 477349\`\n` +
    `• \`.cedula 17xxxxxxxx\`\n` +
    `• \`.placa PDF9627\`\n` +
    `• \`.mail\`\n` +
    `• \`.check\``;

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