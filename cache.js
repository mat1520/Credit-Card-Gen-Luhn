const fs = require('fs');
const path = require('path');

class Cache {
    constructor(options = {}) {
        this.cacheDir = path.join(__dirname, 'cache');
        this.defaultTTL = options.defaultTTL || 3600000; // 1 hora por defecto
        this.maxSize = options.maxSize || 1000; // Máximo 1000 entradas
        this.cleanupInterval = options.cleanupInterval || 1800000; // Limpieza cada 30 minutos
        
        // Crear directorio de caché si no existe
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir);
        }

        // Iniciar limpieza periódica
        this.startCleanup();
    }

    // Generar clave de caché
    generateKey(key) {
        return Buffer.from(key).toString('base64');
    }

    // Obtener ruta del archivo de caché
    getCachePath(key) {
        return path.join(this.cacheDir, `${this.generateKey(key)}.json`);
    }

    // Guardar en caché
    async set(key, value, ttl = this.defaultTTL) {
        const cachePath = this.getCachePath(key);
        const cacheData = {
            value,
            expires: Date.now() + ttl,
            created: Date.now()
        };

        try {
            await fs.promises.writeFile(cachePath, JSON.stringify(cacheData));
            return true;
        } catch (error) {
            console.error('Error al guardar en caché:', error);
            return false;
        }
    }

    // Obtener de caché
    async get(key) {
        const cachePath = this.getCachePath(key);
        
        try {
            if (!fs.existsSync(cachePath)) {
                return null;
            }

            const data = JSON.parse(await fs.promises.readFile(cachePath, 'utf8'));
            
            // Verificar si ha expirado
            if (data.expires < Date.now()) {
                await this.delete(key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Error al leer de caché:', error);
            return null;
        }
    }

    // Eliminar de caché
    async delete(key) {
        const cachePath = this.getCachePath(key);
        try {
            if (fs.existsSync(cachePath)) {
                await fs.promises.unlink(cachePath);
            }
            return true;
        } catch (error) {
            console.error('Error al eliminar de caché:', error);
            return false;
        }
    }

    // Limpiar caché expirada
    async cleanup() {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const now = Date.now();
            let deleted = 0;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
                
                if (data.expires < now) {
                    await fs.promises.unlink(filePath);
                    deleted++;
                }
            }

            console.log(`Limpieza de caché completada. ${deleted} entradas eliminadas.`);
        } catch (error) {
            console.error('Error en limpieza de caché:', error);
        }
    }

    // Iniciar limpieza periódica
    startCleanup() {
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    // Obtener estadísticas de caché
    async getStats() {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const stats = {
                total: files.length,
                size: 0,
                oldest: Date.now(),
                newest: 0
            };

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const fileStats = await fs.promises.stat(filePath);
                const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
                
                stats.size += fileStats.size;
                stats.oldest = Math.min(stats.oldest, data.created);
                stats.newest = Math.max(stats.newest, data.created);
            }

            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas de caché:', error);
            return null;
        }
    }
}

module.exports = Cache; 