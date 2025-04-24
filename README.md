# CardGen - Generador de Tarjetas de Prueba

Una aplicación web moderna para generar tarjetas de crédito y débito de prueba con validación Luhn.

## Características

- Generación de tarjetas con BIN personalizado (6-8 dígitos)
- Validación mediante algoritmo de Luhn
- Generación de CVV aleatorio
- Fechas de expiración dinámicas
- Soporte para múltiples BINs
- Exportación a CSV y TXT
- Copiado al portapapeles
- Guardado de configuraciones en LocalStorage
- Modo claro/oscuro
- Totalmente accesible (A11y)
- Instalable como PWA
- Modo técnico con metadatos

## Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Node.js (para desarrollo local)

## Instalación Local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/cardgen.git
cd cardgen
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:3000`

## Uso

1. Ingresa un BIN (6-8 dígitos) en el campo correspondiente
2. Selecciona la cantidad de tarjetas a generar (máximo 150)
3. Configura las opciones de CVV y fecha de expiración
4. Haz clic en "Generar Tarjetas"
5. Utiliza los botones de exportación para guardar los resultados

## Desarrollo

### Estructura del Proyecto

```
cardgen/
├── public/          # Archivos estáticos
├── src/
│   ├── css/        # Estilos
│   ├── js/         # Código JavaScript
│   └── tests/      # Pruebas
└── README.md
```

### Pruebas

Para ejecutar las pruebas:
```bash
npm test
```

## Despliegue

El proyecto está configurado para despliegue automático en Vercel. Cada push a la rama main desencadenará un nuevo despliegue.

## Contribución

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

## Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter)

Link del Proyecto: [https://github.com/tu-usuario/cardgen](https://github.com/tu-usuario/cardgen) 