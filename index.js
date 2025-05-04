require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { isValidBin, generateCard } = require('./utils');
const Cache = require('./cache');

// Configuración
const API_KEY = process.env.BIN_API_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!API_KEY || !BOT_TOKEN) {
    console.error('Error: API_KEY and BOT_TOKEN must be set in environment variables');
    process.exit(1);
}

// Inicializar caché
const cache = new Cache({
    defaultTTL: 3600000, // 1 hora
    maxSize: 1000,
    cleanupInterval: 1800000 // 30 minutos
});

const bot = new Telegraf(BOT_TOKEN);

// Rate limiting configuration
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

// Rate limiting middleware
const rateLimiter = (ctx, next) => {
    const userId = ctx.from.id;
    const now = Date.now();
    
    if (!rateLimits.has(userId)) {
        rateLimits.set(userId, []);
    }
    
    const userRequests = rateLimits.get(userId);
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Remove old requests
    while (userRequests.length && userRequests[0] < windowStart) {
        userRequests.shift();
    }
    
    if (userRequests.length >= MAX_REQUESTS) {
        return ctx.reply('⚠️ Rate limit exceeded. Please wait a minute before making more requests.');
    }
    
    userRequests.push(now);
    return next();
};

// Apply rate limiting to all commands
bot.use(rateLimiter);

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

// Función para consultar BIN con caché
const lookupBin = async (bin) => {
    try {
        // Intentar obtener de caché primero
        const cachedData = await cache.get(bin);
        if (cachedData) {
            console.log(`BIN ${bin} encontrado en caché`);
            return cachedData;
        }

        console.log(`Consultando BIN: ${bin}`);
        const response = await axios({
            method: 'GET',
            url: `https://api.apilayer.com/bincheck/${bin}`,
            headers: {
                'apikey': API_KEY
            }
        });
        
        console.log('Status de la respuesta:', response.status);
        console.log('Datos recibidos:', JSON.stringify(response.data, null, 2));
        
        // Guardar en caché
        await cache.set(bin, response.data);
        
        return response.data;
    } catch (error) {
        console.error('Error detallado en lookupBin:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
    }
};

// Mensaje de bienvenida y ayuda
const getHelpMessage = () => `
🎉 *¡Bienvenido a CardGen Pro!* 🎉

*⚡️ Desarrollado por:*
👨‍💻 Owner: *@MAT3810*
🌐 Web: [credit-cart-gen-luhn.vercel.app](https://credit-cart-gen-luhn.vercel.app/index.html)

📋 *Comandos Disponibles:*

*1️⃣ Generación de Tarjetas:*
➜ /gen [BIN|mes|año|]
  _Ejemplo: /gen 438108|05|25|_
  _Genera 10 tarjetas con el BIN especificado_

*2️⃣ Consulta de BIN:*
➜ /bin [BIN]
  _Ejemplo: /bin 438108_
  _Muestra información detallada del BIN_

*3️⃣ Gestión de Favoritos:*
➜ /favoritos - _Ver tus BINs guardados_
➜ /agregarbin [BIN] [mes?] [año?] [cvv?]
  _Ejemplo: /agregarbin 438108 05 25 123_
➜ /eliminarbin [índice]
  _Ejemplo: /eliminarbin 1_

*4️⃣ Historial:*
➜ /historial - _Ver tus últimas consultas_

*5️⃣ Ayuda:*
➜ /ayuda - _Mostrar este mensaje de ayuda_

💡 *Tips:*
• Los BINs deben tener entre 6 y 8 dígitos
• El mes debe estar entre 01 y 12
• El año debe estar entre 23 y 30
• El CVV es opcional


📞 *Soporte y Contacto:*
_Para ayuda o reportar problemas, contacta al Owner._
_Visita nuestra web para más herramientas._
`;

// Comandos del bot
bot.command('start', (ctx) => {
    ctx.replyWithMarkdown(getHelpMessage());
});

bot.command('help', (ctx) => {
    ctx.replyWithMarkdown(getHelpMessage());
});

bot.command('ayuda', (ctx) => {
    ctx.replyWithMarkdown(getHelpMessage());
});

bot.command('gen', async (ctx) => {
    const input = ctx.message.text.slice(5).trim(); // Eliminar '/gen ' del inicio
    if (!input) {
        return ctx.reply('❌ Uso: /gen [BIN|mes|año|]');
    }

    try {
        // Parsear el input con el formato BIN|mes|año|
        let [bin, month, year] = input.split('|');
        
        // Limpiar espacios en blanco y validar
        bin = bin ? bin.trim() : '';
        month = month ? month.trim() : '';
        year = year ? year.trim() : '';

        if (!isValidBin(bin)) {
            return ctx.reply('❌ BIN inválido. Debe contener solo números y x\'s, entre 6 y 16 dígitos.');
        }

        // Validar mes y año si se proporcionan
        if (month && (parseInt(month) < 1 || parseInt(month) > 12)) {
            return ctx.reply('❌ Mes inválido. Debe estar entre 01 y 12.');
        }
        if (year && (parseInt(year) < 0 || parseInt(year) > 99)) {
            return ctx.reply('❌ Año inválido. Debe estar entre 00 y 99.');
        }

        // Generar siempre 10 tarjetas
        const count = 10;
        const cards = Array(count).fill().map(() => {
            const card = generateCard(bin);
            return {
                number: card.number,
                month: month || card.month,
                year: year || card.year,
                cvv: card.cvv
            };
        });
        
        // Formatear la respuesta con el formato solicitado
        const header = `•𝘽𝙞𝙣 -» ${bin}|${month || 'xx'}|${year || 'xx'}|rnd\n─━─━─━─━─━─━─━─━─━─━─━─━─`;
        const cardsList = cards.map(card => 
            `${card.number}|${card.month}|${card.year}|${card.cvv}`
        ).join('\n');
        const footer = `─━─━─━─━─━─━─━─━─━─━─━─━─\n*DATOS DEL BIN*\n─━─━─━─━─━─━─━─━─━─━─━─━─\n•  *USUARIO*: ${ctx.from.first_name || 'Usuario'}`;

        const response = `${header}\n${cardsList}\n${footer}`;

        // Guardar en historial
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        userData.history.unshift({
            type: 'gen',
            bin,
            count,
            timestamp: new Date().toISOString()
        });
        saveUserData(userId, userData);

        // Enviar mensaje con formato Markdown
        await ctx.replyWithMarkdown(response);
    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('bin', async (ctx) => {
    try {
        const bin = ctx.message.text.split(' ')[1];
        if (!bin) {
            return ctx.reply('❌ Uso: /bin [BIN]\nEjemplo: /bin 438108');
        }

        if (bin.length < 6 || bin.length > 8) {
            return ctx.reply('❌ El BIN debe tener entre 6 y 8 dígitos');
        }

        if (!/^\d+$/.test(bin)) {
            return ctx.reply('❌ El BIN debe contener solo números');
        }

        const msg = await ctx.reply('🔍 Buscando información del BIN...');
        
        try {
            const data = await lookupBin(bin);
            console.log('Datos procesados:', data);

            if (!data) {
                await ctx.reply('❌ No se pudo encontrar información para este BIN. Intenta con otro.');
                return;
            }

            // Procesar el nombre del banco correctamente
            let bankName = 'Desconocido';
            if (data.bank_name) {
                bankName = data.bank_name;
            } else if (data.bank) {
                bankName = typeof data.bank === 'string' ? data.bank : data.bank.name || 'Desconocido';
            }

            const response = `ℹ️ Información del BIN: ${bin}
🏦 Banco: ${bankName}
💳 Marca: ${data.scheme || 'Desconocida'}
🌍 País: ${data.country || 'Desconocido'}
📱 Tipo: ${data.type || 'Desconocido'}
💰 Prepago: ${data.prepaid ? 'Sí' : 'No'}`;

            // Guardar en historial
            const userId = ctx.from.id;
            const userData = loadUserData(userId);
            userData.history.unshift({
                type: 'lookup',
                bin,
                info: data,
                timestamp: new Date().toISOString()
            });
            saveUserData(userId, userData);

            await ctx.reply(response);
        } catch (error) {
            console.error('Error en la consulta del BIN:', error);
            await ctx.reply(`❌ Error al consultar el BIN: ${error.message}`);
        }
    } catch (error) {
        console.error('Error general en comando /bin:', error);
        await ctx.reply('❌ Error al procesar la consulta del BIN. Por favor, intenta más tarde.');
    }
});

// Función para obtener el emoji de la bandera del país
const getCountryEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const offset = 127397;
    return countryCode
        .toUpperCase()
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + offset))
        .join('');
};

bot.command('favoritos', (ctx) => {
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

bot.command('agregarbin', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
        return ctx.reply('❌ Uso: /agregarbin [BIN] [mes?] [año?] [cvv?]');
    }

    const [bin, month, year, cvv] = args;
    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números y x\'s, entre 6 y 16 dígitos.');
    }

    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    // Verificar si el BIN ya existe
    if (userData.favorites.some(fav => fav.bin === bin)) {
        return ctx.reply('❌ Este BIN ya está en tus favoritos');
    }

    userData.favorites.push({ bin, month, year, cvv });
    saveUserData(userId, userData);

    ctx.reply('✅ BIN agregado a favoritos');
});

bot.command('eliminarbin', (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
        return ctx.reply('❌ Uso: /eliminarbin [índice]');
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

bot.command('historial', (ctx) => {
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

// Agregar comando para ver estadísticas de caché
bot.command('cachestats', async (ctx) => {
    try {
        const stats = await cache.getStats();
        if (!stats) {
            return ctx.reply('❌ Error al obtener estadísticas de caché');
        }

        const response = `📊 *Estadísticas de Caché*

📦 Total de entradas: ${stats.total}
💾 Tamaño total: ${(stats.size / 1024).toFixed(2)} KB
⏰ Entrada más antigua: ${new Date(stats.oldest).toLocaleString()}
🕒 Entrada más reciente: ${new Date(stats.newest).toLocaleString()}`;

        ctx.replyWithMarkdown(response);
    } catch (error) {
        ctx.reply('❌ Error al obtener estadísticas de caché');
    }
});

// Agregar comando para limpiar caché manualmente
bot.command('clearcache', async (ctx) => {
    try {
        await cache.cleanup();
        ctx.reply('✅ Caché limpiada correctamente');
    } catch (error) {
        ctx.reply('❌ Error al limpiar la caché');
    }
});

// Iniciar el bot
console.log('Iniciando bot...');
bot.launch()
    .then(() => {
        console.log('✅ Bot iniciado correctamente');
        console.log('🤖 Bot listo para usar');
    })
    .catch(err => {
        console.error('❌ Error al iniciar el bot:', err);
        process.exit(1);
    });

// Manejar cierre gracioso
process.once('SIGINT', () => {
    console.log('Cerrando bot...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('Cerrando bot...');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
}); 