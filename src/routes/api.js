const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const speechToText = require('../services/speechToText');
const whatsappService = require('../services/whatsappService');
const facebookService = require('../services/facebookService');
const conversationalBot = require('../services/conversationalBot');

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

/**
 * Endpoint de salud
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: whatsappService.isWhatsAppReady(),
    facebook: facebookService.validateFacebookConfig()
  });
});

/**
 * Endpoint para obtener estadísticas del bot conversacional
 */
router.get('/bot/stats', (req, res) => {
  const stats = conversationalBot.getBotStats();
  res.json({
    status: 'ok',
    bot: stats
  });
});

/**
 * Endpoint para transcribir audio
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo de audio' });
    }

    const audioPath = req.file.path;

    // Validar archivo de audio
    if (!speechToText.validateAudioFile(audioPath)) {
      fs.unlinkSync(audioPath); // Eliminar archivo inválido
      return res.status(400).json({ error: 'Formato de audio no válido' });
    }

    // Transcribir
    const text = await speechToText.transcribeAudio(audioPath);

    // Eliminar archivo temporal
    fs.unlinkSync(audioPath);

    res.json({
      success: true,
      text: text
    });
  } catch (error) {
    console.error('Error en transcripción:', error);

    // Limpiar archivo si existe
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Error al transcribir audio',
      details: error.message
    });
  }
});

/**
 * Endpoint para publicar en redes sociales
 */
router.post('/publish', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió imagen' });
    }

    const { text, platforms } = req.body;

    if (!text) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El texto es requerido' });
    }

    const imagePath = req.file.path;
    const results = {
      whatsapp: null,
      facebook: null
    };

    const platformsArray = platforms ? JSON.parse(platforms) : ['whatsapp'];

    // Publicar en WhatsApp
    if (platformsArray.includes('whatsapp')) {
      try {
        if (!whatsappService.isWhatsAppReady()) {
          results.whatsapp = {
            success: false,
            error: 'WhatsApp no está conectado. Escanea el código QR primero.'
          };
        } else {
          results.whatsapp = await whatsappService.publishStatus(imagePath, text);
        }
      } catch (error) {
        results.whatsapp = {
          success: false,
          error: error.message
        };
      }
    }

    // Publicar en Facebook
    if (platformsArray.includes('facebook')) {
      try {
        if (!facebookService.validateFacebookConfig()) {
          results.facebook = {
            success: false,
            error: 'Facebook no está configurado correctamente'
          };
        } else {
          results.facebook = await facebookService.publishToFacebook(imagePath, text);
        }
      } catch (error) {
        results.facebook = {
          success: false,
          error: error.message
        };
      }
    }

    // Eliminar imagen temporal
    fs.unlinkSync(imagePath);

    // Verificar si al menos una plataforma tuvo éxito
    const anySuccess = results.whatsapp?.success || results.facebook?.success;

    res.json({
      success: anySuccess,
      results: results
    });
  } catch (error) {
    console.error('Error al publicar:', error);

    // Limpiar archivo si existe
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Error al publicar contenido',
      details: error.message
    });
  }
});

module.exports = router;
