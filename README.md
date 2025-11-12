# 📱 WhatsApp Updates From Voice

Automatización simple para publicar contenido en redes sociales (WhatsApp y Facebook) usando voz e imágenes. Diseñado especialmente para ayudar a personas que quieren digitalizar su negocio de forma sencilla.

## 🎯 Características

- ✅ **Interfaz súper simple y amigable** - Diseñada para ser usada por cualquier persona
- 🎤 **Grabación de voz** - Dicta tu mensaje y se convierte automáticamente a texto
- 📷 **Subida de imágenes** - Toma o elige fotos desde tu dispositivo
- 💚 **Publicación en WhatsApp Status** - Publica directamente en tu estado de WhatsApp
- 📘 **Publicación en Facebook** - Comparte en tu página de Facebook
- 🔄 **Publicación simultánea** - Publica en ambas plataformas a la vez

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de OpenAI (para transcripción de voz)
- WhatsApp (para publicar en estados)
- Página de Facebook (opcional, para publicar en Facebook)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd whatsapp-updates-from-voice
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configúralo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Puerto del servidor
PORT=3000

# OpenAI API Key (REQUERIDO para transcripción de voz)
OPENAI_API_KEY=sk-...

# Facebook (OPCIONAL - solo si quieres publicar en Facebook)
FACEBOOK_PAGE_ID=tu_page_id
FACEBOOK_ACCESS_TOKEN=tu_access_token
```

#### 🔑 Cómo obtener las credenciales:

**OpenAI API Key:**
1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva API key
5. Copia y pega en `.env`

**Facebook (Opcional):**
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una app
3. Agrega el producto "Facebook Login"
4. Obtén tu Page ID y Access Token
5. Copia y pega en `.env`

### 4. Iniciar la aplicación

```bash
npm start
```

O para desarrollo con auto-reload:

```bash
npm run dev
```

## 📱 Primer Uso - Conectar WhatsApp

La primera vez que inicies la aplicación, necesitas vincular tu WhatsApp:

1. Inicia la aplicación con `npm start`
2. Verás un código QR en la terminal
3. Abre WhatsApp en tu teléfono
4. Ve a **Menú (⋮) → Dispositivos vinculados → Vincular dispositivo**
5. Escanea el código QR mostrado en la terminal
6. ¡Listo! WhatsApp está conectado

> 💡 **Nota:** Solo necesitas hacer esto una vez. La sesión se guardará automáticamente.

## 🎨 Cómo Usar

1. **Abre tu navegador** y ve a `http://localhost:3000`

2. **Verifica el estado**:
   - 🟢 Verde = Servicio conectado y listo
   - 🔴 Rojo = Servicio no disponible

3. **Sube una foto**:
   - Toca el botón "Toca aquí para elegir o tomar una foto"
   - Selecciona o toma una foto de tu producto/tienda

4. **Agrega tu mensaje**:
   - **Opción 1:** Toca "🎤 Grabar Voz" y dicta tu mensaje
   - **Opción 2:** Escribe directamente en el cuadro de texto

5. **Elige dónde publicar**:
   - Marca WhatsApp, Facebook o ambos

6. **¡Publica!**:
   - Toca el botón "🚀 Publicar Ahora"
   - Espera la confirmación
   - ¡Tu contenido está en línea!

## 🛠️ Estructura del Proyecto

```
whatsapp-updates-from-voice/
├── src/
│   ├── server.js              # Servidor principal
│   ├── routes/
│   │   └── api.js             # Endpoints de la API
│   └── services/
│       ├── speechToText.js    # Servicio de transcripción de voz
│       ├── whatsappService.js # Integración con WhatsApp
│       └── facebookService.js # Integración con Facebook
├── public/
│   └── index.html            # Interfaz web
├── uploads/                  # Archivos temporales (auto-generado)
├── .env                      # Variables de entorno (no incluir en git)
├── .env.example              # Ejemplo de variables de entorno
├── package.json              # Dependencias del proyecto
└── README.md                 # Este archivo
```

## 🔌 API Endpoints

### `GET /api/health`
Verifica el estado de los servicios.

**Respuesta:**
```json
{
  "status": "ok",
  "whatsapp": true,
  "facebook": false
}
```

### `POST /api/transcribe`
Transcribe un archivo de audio a texto.

**Body:** `multipart/form-data`
- `audio`: Archivo de audio (mp3, wav, m4a, webm, ogg)

**Respuesta:**
```json
{
  "success": true,
  "text": "Texto transcrito del audio"
}
```

### `POST /api/publish`
Publica una imagen con texto en las redes sociales seleccionadas.

**Body:** `multipart/form-data`
- `image`: Archivo de imagen
- `text`: Texto de la publicación
- `platforms`: JSON array con plataformas ["whatsapp", "facebook"]

**Respuesta:**
```json
{
  "success": true,
  "results": {
    "whatsapp": {
      "success": true,
      "message": "Publicado en WhatsApp Status exitosamente"
    },
    "facebook": {
      "success": true,
      "postId": "123456789",
      "message": "Publicado en Facebook exitosamente"
    }
  }
}
```

## ⚠️ Solución de Problemas

### WhatsApp no se conecta
- Asegúrate de que WhatsApp esté abierto en tu teléfono
- Escanea nuevamente el código QR
- Elimina la carpeta `.wwebjs_auth` y reinicia la aplicación

### Error de transcripción de voz
- Verifica que tu `OPENAI_API_KEY` sea correcta
- Asegúrate de tener créditos en tu cuenta de OpenAI
- Verifica que el formato de audio sea compatible

### Facebook no publica
- Verifica que `FACEBOOK_PAGE_ID` y `FACEBOOK_ACCESS_TOKEN` estén configurados
- Asegúrate de que el token no haya expirado
- Verifica que tengas permisos en la página

### El servidor no inicia
- Verifica que el puerto 3000 no esté en uso
- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Revisa los logs en la consola para ver errores específicos

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas tu archivo `.env` o tus API keys
- Las imágenes y audios se eliminan automáticamente después de procesar
- Las sesiones de WhatsApp se guardan localmente de forma segura
- Usa HTTPS en producción

## 📈 Mejoras Futuras

- [ ] Soporte para Instagram
- [ ] Programación de publicaciones
- [ ] Múltiples cuentas de WhatsApp
- [ ] Plantillas de mensajes
- [ ] Análisis de engagement
- [ ] Aplicación móvil nativa

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para tu negocio o proyectos personales.

## 💖 Desarrollado con amor

Este proyecto fue creado para ayudar a digitalizar pequeños negocios y hacer que las redes sociales sean accesibles para todos, sin importar su nivel técnico.

---

**¿Preguntas o problemas?** Abre un issue en GitHub o contacta al desarrollador.
