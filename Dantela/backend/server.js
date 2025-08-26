/**
 * Serveur principal de l'application Dantela Depot
 * Module d'authentification - Configuration Express et routes
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const materiauxRoutes = require('./routes/materiaux');
const categoriesRoutes = require('./routes/categories');
const demandesRoutes = require('./routes/demandes');
const bonsLivraisonRoutes = require('./routes/bonsLivraison');
const stockRoutes = require('./routes/stock');
const messagesRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // écoute explicite IPv4
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== CORS =====
const allowedOrigins = [
  process.env.FRONTEND_URL,     // ex: http://localhost:5173 ou URL de prod
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (ex: applications mobiles, Postman)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En développement, être plus permissif
    if (NODE_ENV === 'development') {
      console.log('⚠️ CORS: Origin non autorisé mais accepté en dev:', origin);
      return callback(null, true);
    }
    
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // préflight global

// ===== Middlewares globaux =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging simple en dev
if (NODE_ENV !== 'test') {
  app.use((req, _res, next) => {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ===== Routes =====
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: "API Dantela Depot - Module d'authentification fonctionnel",
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/materiaux', materiauxRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/bons-livraison', bonsLivraisonRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/', (_req, res) => {
  res.json({
    message: "Bienvenue sur l'API Dantela Depot - Module d'authentification",
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile',
      getProfile: 'GET /api/profile',
      updateProfile: 'PUT /api/profile',
      changePassword: 'PUT /api/profile/password',
      profileStats: 'GET /api/profile/stats',
      pendingUsers: 'GET /api/admin/pending-users',
      validateUser: 'POST /api/admin/validate-user/:userId',
      createDepot: 'POST /api/admin/depots',
      getDepots: 'GET /api/admin/depots',
      createDemande: 'POST /api/demandes',
      getDemandes: 'GET /api/demandes',
      validateDemande: 'PUT /api/demandes/:id/validate',
      processDemande: 'POST /api/demandes/:id/process',
      createDirectBon: 'POST /api/bons-livraison/direct',
      getBonsLivraison: 'GET /api/bons-livraison',
      addStock: 'POST /api/stock/add',
      removeStock: 'POST /api/stock/remove',
      getMouvements: 'GET /api/stock/movements',
      getMessages: 'GET /api/messages',
      createMessage: 'POST /api/messages',
      markMessageRead: 'PUT /api/messages/:id/read',
      getUnreadCount: 'GET /api/messages/unread-count',
      getSettings: 'GET /api/settings',
      updateSettings: 'PUT /api/settings',
      createBackup: 'POST /api/settings/backup',
      importData: 'POST /api/settings/import',
      resetSystem: 'POST /api/settings/reset',
      getSystemInfo: 'GET /api/settings/system-info',
    },
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    path: req.originalUrl,
  });
});

// Gestion des erreurs globales
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    ...(NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// ===== Démarrage (uniquement si exécuté directement) =====
let server;

function start() {
  server = http.createServer(app);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❗ Port ${PORT} déjà utilisé. Libère-le ou change PORT dans .env`);
    }
    console.error(err);
    process.exit(1);
  });

  server.listen(PORT, HOST, () => {
    console.log('🚀 ================================');
    console.log(`🏗️  Serveur Dantela Depot démarré`);
    console.log(`📦 Module: Authentification`);
    console.log(`🌐 Host: ${HOST}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📊 Base de données: ${process.env.DB_NAME || '(non défini)'}`);
    console.log(`🔒 Environnement: ${NODE_ENV}`);
    console.log('🚀 ================================');
  });
}

function shutdown() {
  console.log('🛑 Arrêt du serveur...');
  if (server) {
    server.close(() => {
      console.log('✅ Serveur arrêté proprement.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Démarre seulement si ce fichier est le point d'entrée
if (require.main === module) {
  start();
}

module.exports = app;