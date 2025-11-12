const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FACEBOOK_GRAPH_API = 'https://graph.facebook.com/v18.0';

/**
 * Publica una imagen con texto en Facebook
 * @param {string} imagePath - Ruta a la imagen
 * @param {string} message - Texto del post
 * @returns {Promise<Object>}
 */
async function publishToFacebook(imagePath, message) {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      throw new Error('Configuración de Facebook incompleta. Verifica FACEBOOK_PAGE_ID y FACEBOOK_ACCESS_TOKEN');
    }

    console.log('📤 Publicando en Facebook...');

    // Crear FormData para subir la imagen
    const form = new FormData();
    form.append('source', fs.createReadStream(imagePath));
    form.append('message', message);
    form.append('access_token', accessToken);

    // Subir foto a Facebook
    const response = await axios.post(
      `${FACEBOOK_GRAPH_API}/${pageId}/photos`,
      form,
      {
        headers: form.getHeaders()
      }
    );

    console.log('✅ Publicación exitosa en Facebook');

    return {
      success: true,
      postId: response.data.id,
      message: 'Publicado en Facebook exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al publicar en Facebook:', error.response?.data || error.message);
    throw new Error(`Error al publicar en Facebook: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Valida la configuración de Facebook
 * @returns {boolean}
 */
function validateFacebookConfig() {
  return !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN);
}

module.exports = {
  publishToFacebook,
  validateFacebookConfig
};
