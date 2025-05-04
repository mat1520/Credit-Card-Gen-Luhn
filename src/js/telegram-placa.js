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