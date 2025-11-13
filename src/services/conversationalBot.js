const path = require('path');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const speechToText = require('./speechToText');
// No importar whatsappService para evitar dependencia circular
// La función publishStatus se pasará como parámetro

// Estados de la conversación
const STATES = {
  IDLE: 'IDLE',
  WAITING_FOR_IMAGE: 'WAITING_FOR_IMAGE',
  WAITING_FOR_DESCRIPTION: 'WAITING_FOR_DESCRIPTION',
  PROCESSING: 'PROCESSING'
};

// Almacenar el estado de cada usuario (número de teléfono)
const userStates = new Map();

// Almacenar datos temporales de cada usuario
const userData = new Map();

// Almacenar la función publishStatus para evitar dependencia circular
let publishStatusFunction = null;

/**
 * Inicializa el bot conversacional
 * @param {Client} whatsappClient - Cliente de WhatsApp
 * @param {Function} publishStatus - Función para publicar en estados de WhatsApp
 */
function initializeBot(whatsappClient, publishStatus) {
  // Guardar la función publishStatus
  publishStatusFunction = publishStatus;
  console.log('\n🤖 ========================================');
  console.log('🤖 BOT CONVERSACIONAL INICIADO');
  console.log('🤖 Esperando mensajes...');
  console.log('🤖 ========================================\n');

  // Escuchar mensajes entrantes
  console.log('🔧 Registrando listener de mensajes...');

  // Usar 'message_create' en lugar de 'message' para capturar TODOS los mensajes
  // incluyendo los que el usuario se envía a sí mismo
  whatsappClient.on('message_create', async (message) => {
    console.log('🔔 EVENTO MESSAGE_CREATE DISPARADO'); // Log básico para ver si el evento llega
    try {
      await handleMessage(message);
    } catch (error) {
      console.error('❌ Error al procesar mensaje:', error);

      // Solo responder si no es nuestro propio mensaje
      if (!message.fromMe || !message.body || !(
        message.body.includes('👋 ¡Hola! ¿Qué quieres publicar') ||
        message.body.includes('✅ ¡Perfecto! Recibí tu foto') ||
        message.body.includes('🎉 ¡Listo! Tu publicación') ||
        message.body.includes('❌')
      )) {
        await message.reply('❌ Ocurrió un error. Por favor intenta de nuevo escribiendo "hola".');
      }
    }
  });

  console.log('✅ Listener de mensajes registrado correctamente');
}

/**
 * Maneja los mensajes entrantes
 * @param {Message} message - Mensaje de WhatsApp
 */
async function handleMessage(message) {
  // Ignorar mensajes de grupos y estados
  if (message.from.includes('@g.us') || message.from === 'status@broadcast') {
    return;
  }

  // Permitir mensajes propios (para que el usuario pueda enviarse mensajes a sí mismo)
  // pero ignorar las respuestas automáticas del bot para evitar loops infinitos
  if (message.fromMe && message.body && (
    message.body.includes('👋 ¡Hola! ¿Qué quieres publicar') ||
    message.body.includes('✅ ¡Perfecto! Recibí tu foto') ||
    message.body.includes('🎉 ¡Listo! Tu publicación') ||
    message.body.includes('❌')
  )) {
    // Ignorar las respuestas automáticas del bot
    return;
  }

  const userId = message.from;
  const currentState = userStates.get(userId) || STATES.IDLE;
  const contact = await message.getContact();
  const contactName = contact.pushname || contact.number;

  console.log('\n📨 ========================================');
  console.log(`📨 MENSAJE RECIBIDO`);
  console.log(`📨 De: ${contactName} (${userId})`);
  console.log(`📨 Tipo: ${message.type}`);
  console.log(`📨 Estado actual: ${currentState}`);
  if (message.body) {
    console.log(`📨 Contenido: "${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}"`);
  }
  console.log('📨 ========================================\n');

  // Comando para cancelar el proceso
  if (message.body.toLowerCase().includes('cancelar')) {
    userStates.set(userId, STATES.IDLE);
    userData.delete(userId);
    await message.reply('❌ Proceso cancelado. Escribe "hola" cuando quieras publicar algo nuevo.');
    return;
  }

  // Máquina de estados
  switch (currentState) {
    case STATES.IDLE:
      await handleIdleState(message, userId);
      break;

    case STATES.WAITING_FOR_IMAGE:
      await handleWaitingForImage(message, userId);
      break;

    case STATES.WAITING_FOR_DESCRIPTION:
      await handleWaitingForDescription(message, userId);
      break;

    default:
      userStates.set(userId, STATES.IDLE);
      await message.reply('👋 Escribe "hola" o "publicar" para comenzar.');
  }
}

/**
 * Estado IDLE: Usuario inicia la conversación
 */
async function handleIdleState(message, userId) {
  const text = message.body.toLowerCase();

  // Palabras clave para iniciar
  if (text.includes('hola') || text.includes('publicar') || text.includes('nuevo')) {
    userStates.set(userId, STATES.WAITING_FOR_IMAGE);
    userData.set(userId, {});

    await message.reply(
      '👋 ¡Hola! ¿Qué quieres publicar hoy?\n\n' +
      '📸 Envíame una foto de tu producto o negocio.\n\n' +
      '💡 Escribe "cancelar" si cambias de opinión.'
    );
  } else {
    await message.reply(
      '👋 ¡Hola! Soy tu asistente para publicar en WhatsApp.\n\n' +
      'Escribe "hola" o "publicar" cuando quieras compartir algo en tu estado.'
    );
  }
}

/**
 * Estado WAITING_FOR_IMAGE: Esperando que el usuario envíe una foto
 */
async function handleWaitingForImage(message, userId) {
  // Verificar si el mensaje tiene una imagen
  if (message.hasMedia && (message.type === 'image')) {
    try {
      console.log('📸 Recibiendo imagen...');

      // Descargar la imagen
      const media = await message.downloadMedia();

      if (!media) {
        await message.reply('❌ No pude descargar la imagen. Por favor, intenta enviarla de nuevo.');
        return;
      }

      // Guardar la imagen temporalmente
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${uniqueSuffix}.${media.mimetype.split('/')[1]}`;
      const filePath = path.join(uploadsDir, filename);

      // Guardar el archivo
      const buffer = Buffer.from(media.data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Guardar la ruta en los datos del usuario
      const data = userData.get(userId) || {};
      data.imagePath = filePath;
      userData.set(userId, data);

      // Cambiar al siguiente estado
      userStates.set(userId, STATES.WAITING_FOR_DESCRIPTION);

      await message.reply(
        '✅ ¡Perfecto! Recibí tu foto.\n\n' +
        '🎤 Ahora puedes:\n' +
        '• Enviar un mensaje de voz con la descripción\n' +
        '• Escribir el texto que quieres publicar\n\n' +
        '💡 Escribe "cancelar" si cambias de opinión.'
      );
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      await message.reply('❌ Hubo un error al procesar tu imagen. Por favor, intenta de nuevo.');
    }
  } else {
    await message.reply(
      '📸 Por favor, envíame una foto de tu producto.\n\n' +
      '💡 Puedes tomarla ahora o elegir una de tu galería.\n' +
      '💡 Escribe "cancelar" si cambias de opinión.'
    );
  }
}

/**
 * Estado WAITING_FOR_DESCRIPTION: Esperando texto o audio con la descripción
 */
async function handleWaitingForDescription(message, userId) {
  const data = userData.get(userId);

  if (!data || !data.imagePath) {
    await message.reply('❌ Algo salió mal. Vamos a empezar de nuevo. Escribe "hola".');
    userStates.set(userId, STATES.IDLE);
    userData.delete(userId);
    return;
  }

  let description = '';

  // Si es un mensaje de voz, transcribirlo
  if (message.hasMedia && message.type === 'ptt') {
    try {
      await message.reply('🎤 Recibí tu mensaje de voz. Estoy procesándolo...');

      console.log('🎤 Descargando audio...');
      const media = await message.downloadMedia();

      if (!media) {
        await message.reply('❌ No pude descargar el audio. Por favor, intenta de nuevo.');
        return;
      }

      // Guardar el audio temporalmente
      const uploadsDir = path.join(__dirname, '../../uploads');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const audioPath = path.join(uploadsDir, `${uniqueSuffix}.ogg`);

      const buffer = Buffer.from(media.data, 'base64');
      fs.writeFileSync(audioPath, buffer);

      console.log('🎤 Transcribiendo audio...');

      // Transcribir el audio
      description = await speechToText.transcribeAudio(audioPath);

      // Eliminar archivo temporal
      fs.unlinkSync(audioPath);

      console.log('✅ Audio transcrito:', description);
    } catch (error) {
      console.error('Error al transcribir audio:', error);
      await message.reply(
        '❌ Hubo un error al procesar tu audio. ¿Puedes intentar de nuevo o escribir el texto?'
      );
      return;
    }
  }
  // Si es texto
  else if (message.body && message.body.trim().length > 0) {
    description = message.body.trim();
  }
  // No es ni audio ni texto válido
  else {
    await message.reply(
      '🎤 Por favor, envía:\n' +
      '• Un mensaje de voz con la descripción\n' +
      '• O escribe el texto directamente\n\n' +
      '💡 Escribe "cancelar" si cambias de opinión.'
    );
    return;
  }

  // Si llegamos aquí, tenemos la descripción
  if (description && description.length > 0) {
    // Cambiar estado a procesando
    userStates.set(userId, STATES.PROCESSING);

    await message.reply(
      '✅ ¡Excelente! Recibí tu mensaje:\n\n' +
      `"${description}"\n\n` +
      '📤 Estoy publicando en tu estado de WhatsApp...'
    );

    // Publicar en el estado
    try {
      await publishStatusFunction(data.imagePath, description);

      // Limpiar datos temporales
      if (fs.existsSync(data.imagePath)) {
        fs.unlinkSync(data.imagePath);
      }

      userData.delete(userId);
      userStates.set(userId, STATES.IDLE);

      await message.reply(
        '🎉 ¡Listo! Tu publicación ya está en tu estado de WhatsApp.\n\n' +
        '👀 Tus contactos ya pueden verla.\n\n' +
        '💡 Escribe "hola" cuando quieras publicar algo más.'
      );
    } catch (error) {
      console.error('Error al publicar:', error);

      // Limpiar imagen temporal
      if (fs.existsSync(data.imagePath)) {
        fs.unlinkSync(data.imagePath);
      }

      userData.delete(userId);
      userStates.set(userId, STATES.IDLE);

      await message.reply(
        '❌ Hubo un error al publicar. Por favor, intenta de nuevo escribiendo "hola".\n\n' +
        `Error: ${error.message}`
      );
    }
  }
}

/**
 * Obtiene las estadísticas del bot
 */
function getBotStats() {
  return {
    activeUsers: userStates.size,
    users: Array.from(userStates.entries()).map(([userId, state]) => ({
      userId,
      state
    }))
  };
}

module.exports = {
  initializeBot,
  getBotStats,
  STATES
};
