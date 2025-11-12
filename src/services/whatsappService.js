const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let client = null;
let isReady = false;

/**
 * Inicializa el cliente de WhatsApp
 */
async function initialize() {
  if (client) {
    console.log('⚠️  WhatsApp ya está inicializado');
    return;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // Evento: Generar QR para autenticación
  client.on('qr', (qr) => {
    console.log('📱 Escanea este código QR con WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('\n💡 Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo');
  });

  // Evento: Cliente listo
  client.on('ready', () => {
    console.log('✅ WhatsApp Web está listo!');
    isReady = true;
  });

  // Evento: Autenticación exitosa
  client.on('authenticated', () => {
    console.log('🔐 Autenticación exitosa');
  });

  // Evento: Error de autenticación
  client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
  });

  // Evento: Desconexión
  client.on('disconnected', (reason) => {
    console.log('⚠️  WhatsApp desconectado:', reason);
    isReady = false;
  });

  await client.initialize();
}

/**
 * Publica una imagen con texto en el estado de WhatsApp
 * @param {string} imagePath - Ruta a la imagen
 * @param {string} caption - Texto de la publicación
 * @returns {Promise<Object>}
 */
async function publishStatus(imagePath, caption) {
  try {
    if (!isReady) {
      throw new Error('WhatsApp no está listo. Por favor, escanea el código QR primero.');
    }

    console.log('📤 Publicando en estado de WhatsApp...');

    const media = require('whatsapp-web.js').MessageMedia.fromFilePath(imagePath);

    // Publicar en el estado (status)
    await client.sendMessage('status@broadcast', media, {
      caption: caption
    });

    console.log('✅ Publicación exitosa en WhatsApp Status');

    return {
      success: true,
      message: 'Publicado en WhatsApp Status exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al publicar en WhatsApp:', error.message);
    throw error;
  }
}

/**
 * Verifica si WhatsApp está listo
 * @returns {boolean}
 */
function isWhatsAppReady() {
  return isReady;
}

/**
 * Obtiene el cliente de WhatsApp
 * @returns {Client|null}
 */
function getClient() {
  return client;
}

module.exports = {
  initialize,
  publishStatus,
  isWhatsAppReady,
  getClient
};
