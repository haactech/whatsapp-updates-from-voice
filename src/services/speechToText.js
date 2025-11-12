const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Convierte un archivo de audio a texto usando OpenAI Whisper
 * @param {string} audioFilePath - Ruta al archivo de audio
 * @returns {Promise<string>} - Texto transcrito
 */
async function transcribeAudio(audioFilePath) {
  try {
    console.log('🎤 Transcribiendo audio...');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'es', // Español
      response_format: 'text'
    });

    console.log('✅ Audio transcrito correctamente');
    return transcription;
  } catch (error) {
    console.error('❌ Error al transcribir audio:', error.message);
    throw new Error(`Error en transcripción: ${error.message}`);
  }
}

/**
 * Valida que el archivo de audio sea válido
 * @param {string} filePath - Ruta al archivo
 * @returns {boolean}
 */
function validateAudioFile(filePath) {
  const validExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
  const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return validExtensions.includes(ext);
}

module.exports = {
  transcribeAudio,
  validateAudioFile
};
