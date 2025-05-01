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
        // Primera API: binlist.net
        const response1 = await fetch(`https://lookup.binlist.net/${bin}`);
        if (response1.ok) {
            const data1 = await response1.json();
            return {
                bank: data1.bank?.name || 'Desconocido',
                brand: data1.scheme || 'Desconocida',
                type: data1.type || 'Desconocido',
                country: data1.country?.name || 'Desconocido',
                countryCode: data1.country?.alpha2 || '??',
                level: data1.brand || 'Desconocido'
            };
        }

        // Segunda API: bintable.com
        const response2 = await fetch(`https://api.bintable.com/v1/${bin}?api_key=19d935a6d3244f3f8bab8f09157e4936`);
        if (response2.ok) {
            const data2 = await response2.json();
            return {
                bank: data2.bank?.name || 'Desconocido',
                brand: data2.scheme || data2.brand || 'Desconocida',
                type: data2.type || 'Desconocido',
                country: data2.country?.name || 'Desconocido',
                countryCode: data2.country?.code || '??',
                level: data2.level || 'Desconocido'
            };
        }

        throw new Error('No se pudo obtener información del BIN');
    } catch (error) {
        console.error('Error al consultar BIN:', error);
        return null;
    }
};

// Comandos del bot
bot.command('start', (ctx) => {
    const helpText = `
🎉 *¡Bienvenido al Generador de Tarjetas!*

Comandos disponibles:

🔧 *Generación de Tarjetas:*
/gen [BIN|MM|YYYY|CVV] - Generar 10 tarjetas
Ejemplo: /gen 477349002646|05|2027|123

🔍 *Consultas:*
/bin [BIN] - Consultar información de BIN
Ejemplo: /bin 431940

⭐️ *Gestión de Favoritos:*
/favoritos - Ver BINs guardados
/agregarbin [BIN] [mes?] [año?] [cvv?] - Guardar BIN
/eliminarbin [índice] - Eliminar BIN guardado

📋 *Otros:*
/historial - Ver historial de consultas
/ayuda - Mostrar esta ayuda

_Desarrollado por @mat1520_
    `;
    ctx.reply(helpText, { parse_mode: 'Markdown' });
});

bot.command('help', (ctx) => {
    ctx.reply('Para ver la lista de comandos, usa /start');
});

bot.command('gen', async (ctx) => {
    const input = ctx.message.text.split(' ')[1];
    if (!input) {
        return ctx.reply('❌ Uso: /gen [BIN|MM|YYYY|CVV]\nEjemplo: /gen 477349002646|05|2027|123');
    }

    const parts = input.split('|');
    const bin = parts[0];
    const fixedMonth = parts[1];
    const fixedYear = parts[2];
    const fixedCVV = parts[3];

    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números, entre 6 y 16 dígitos.');
    }

    try {
        const cards = Array(10).fill().map(() => {
            const card = generateCard(bin);
            // Si se proporcionaron valores fijos, los usamos
            if (fixedMonth) card.month = fixedMonth;
            if (fixedYear) card.year = fixedYear?.slice(-2) || card.year;
            if (fixedCVV) card.cvv = fixedCVV;
            return card;
        });
        
        const response = cards.map(card => 
            `💳 \`${card.number}|${card.month}|${card.year}|${card.cvv}\``
        ).join('\n');

        // Guardar en historial
        const userId = ctx.from.id;
        const userData = loadUserData(userId);
        userData.history.unshift({
            type: 'gen',
            bin,
            count: 10,
            timestamp: new Date().toISOString()
        });
        saveUserData(userId, userData);

        ctx.reply(`✅ *Tarjetas Generadas:*\n\n${response}`, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('bin', async (ctx) => {
    const bin = ctx.message.text.split(' ')[1];
    if (!bin) {
        return ctx.reply('❌ Uso: /bin [BIN]\nEjemplo: /bin 431940');
    }

    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números y x\'s, entre 6 y 16 dígitos.');
    }

    const binInfo = await lookupBin(bin);
    if (!binInfo) {
        return ctx.reply('❌ No se encontró información para este BIN');
    }

    const response = `
🔍 *Información del BIN:* \`${bin}\`

🏦 *Banco:* ${binInfo.bank}
💳 *Marca:* ${binInfo.brand}
🌍 *País:* ${binInfo.country} (${binInfo.countryCode})
📱 *Tipo:* ${binInfo.type}
⭐️ *Nivel:* ${binInfo.level}
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

    ctx.reply(response, { parse_mode: 'Markdown' });
});

bot.command('favoritos', (ctx) => {
    const userId = ctx.from.id;
    const userData = loadUserData(userId);
    
    if (userData.favorites.length === 0) {
        return ctx.reply('📌 No tienes BINs favoritos guardados');
    }

    const response = userData.favorites.map((fav, index) => 
        `${index + 1}. \`${fav.bin}\` (${fav.month || 'MM'}/${fav.year || 'YY'})`
    ).join('\n');

    ctx.reply(`📌 *Tus BINs favoritos:*\n\n${response}`, { parse_mode: 'Markdown' });
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

    ctx.reply(`