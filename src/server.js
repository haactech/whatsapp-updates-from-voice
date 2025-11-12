require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const whatsappService = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Crear carpeta de uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rutas
app.use('/api', apiRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('📱 Iniciando WhatsApp...');

  try {
    await whatsappService.initialize();
    console.log('✅ WhatsApp inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar WhatsApp:', error.message);
  }
});

// Manejo de errores
process.on('unhandledRejection', (error) => {
  console.error('Error no manejado:', error);
});
