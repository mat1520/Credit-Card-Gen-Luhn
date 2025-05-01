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

// Función para consultar BIN
const lookupBin = async (bin) => {
    try {
        const response = await fetch(`https://lookup.binlist.net/${bin}`);
        if (!response.ok) throw new Error('BIN no encontrado');
        return await response.json();
    } catch (error) {
        return null;
    }
};

// Comandos del bot
bot.command('start', (ctx) => {
    const helpText = `
👋 ¡Bienvenido al Generador de Tarjetas!

Comandos disponibles:
/gen [BIN] [cantidad] - Generar tarjetas
/bin [BIN] - Consultar información de BIN
/favoritos - Ver BINs favoritos
/agregarbin [BIN] [mes?] [año?] [cvv?] - Agregar BIN a favoritos
/eliminarbin [índice] - Eliminar BIN de favoritos
/historial - Ver historial de consultas
/ayuda - Mostrar esta ayuda
    `;
    ctx.reply(helpText);
});

bot.command('help', (ctx) => {
    ctx.reply('Para ver la lista de comandos, usa /start');
});

bot.command('gen', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
        return ctx.reply('❌ Uso: /gen [BIN] [cantidad]');
    }

    const [bin, count] = args;
    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números y x\'s, entre 6 y 16 dígitos.');
    }

    try {
        const cards = Array(parseInt(count)).fill().map(() => generateCard(bin));
        
        const response = cards.map(card => 
            `${card.number}|${card.month}|${card.year}|${card.cvv}`
        ).join('\n');

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

        ctx.reply(`🔑 Tarjetas generadas:\n\n${response}`);
    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('bin', async (ctx) => {
    const bin = ctx.message.text.split(' ')[1];
    if (!bin) {
        return ctx.reply('❌ Uso: /bin [BIN]');
    }

    if (!isValidBin(bin)) {
        return ctx.reply('❌ BIN inválido. Debe contener solo números y x\'s, entre 6 y 16 dígitos.');
    }

    const binInfo = await lookupBin(bin);
    if (!binInfo) {
        return ctx.reply('❌ No se encontró información para este BIN');
    }

    const response = `
🏦 Banco: ${binInfo.bank?.name || 'Desconocido'}
💳 Marca: ${binInfo.scheme || 'Desconocida'}
🌍 País: ${binInfo.country?.name || 'Desconocido'} (${binInfo.country?.alpha2 || '??'})
📱 Tipo: ${binInfo.type || 'Desconocido'}
⭐ Nivel: ${binInfo.brand || 'Desconocido'}
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

    ctx.reply(response);
});

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

// Iniciar el bot
bot.launch()
    .then(() => console.log('Bot iniciado'))
    .catch(err => console.error('Error al iniciar el bot:', err));

// Manejar cierre gracioso
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 