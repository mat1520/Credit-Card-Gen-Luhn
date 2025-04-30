# Bot Generador de Tarjetas para Telegram

Un bot de Telegram que replica las funcionalidades de la web generadora de tarjetas, incluyendo generación de tarjetas, gestión de BINs favoritos, historial y consulta de información de BINs.

## Características

- Generación de tarjetas con BIN personalizado
- Consulta de información de BINs
- Gestión de BINs favoritos
- Historial de consultas y generaciones
- Almacenamiento local de datos por usuario
- Interfaz intuitiva con emojis

## Requisitos

- Node.js 14 o superior
- npm o yarn
- Token de bot de Telegram

## Instalación

1. Clona este repositorio:
```bash
git clone <url-del-repositorio>
cd telegram-bot
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con tu token de bot:
```
BOT_TOKEN=tu_token_aqui
```

4. Inicia el bot:
```bash
node index.js
```

## Comandos Disponibles

- `/start` o `/ayuda` - Muestra la lista de comandos disponibles
- `/gen [BIN] [cantidad]` - Genera tarjetas con el BIN especificado
- `/bin [BIN]` - Consulta información de un BIN
- `/favoritos` - Muestra tus BINs favoritos
- `/agregarbin [BIN] [mes?] [año?] [cvv?]` - Agrega un BIN a favoritos
- `/eliminarbin [índice]` - Elimina un BIN de favoritos
- `/historial` - Muestra el historial de consultas

## Ejemplos de Uso

1. Generar tarjetas:
```
/gen 123456 5
```

2. Consultar información de BIN:
```
/bin 123456
```

3. Agregar BIN a favoritos:
```
/agregarbin 123456 12 25 123
```

4. Eliminar BIN de favoritos:
```
/eliminarbin 1
```

## Notas

- Los datos se almacenan localmente en archivos JSON por usuario
- El bot utiliza el algoritmo de Luhn para generar números de tarjeta válidos
- La información de BINs se obtiene de la API de binlist.net

## Licencia

MIT 