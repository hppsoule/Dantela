/**
 * Serveur principal Dantela Depot (Express) — compatible Vercel (CORS)
 */
const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// ——— Routes
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

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Render / proxy
app.set('trust proxy', 1);

// ===============================
// CORS — Autoriser Vercel & local
// ===============================
/**
 * FRONTEND_URL : ton domaine de prod Vercel (ex: https://dantela.vercel.app)
 * EXTRA_CORS_ORIGINS : liste d’origines additionnelles séparées par des virgules (optionnel)
 */
const baseAllowed = [
  process.env.FRONTEND_URL,          // ex: https://dantela.vercel.app
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]
  .concat(
    (process.env.EXTRA_CORS_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
  .filter(Boolean);

// Autoriser toutes les previews Vercel: https://*.vercel.app
const VERCEL_PREVIEW_REGEX = /^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman / apps natives
  if (baseAllowed.includes(origin)) return true;
  if (VERCEL_PREVIEW_REGEX.test(origin)) return true; // previews
  return false;
}

const corsOptions = {
  origin(origin, cb) {
    if (isAllowedOrigin(origin)) {
      return cb(null, true);
    }
    // En dev, on log et on autorise pour aider au debug
    if (NODE_ENV === 'development') {
      console.log('⚠️ CORS (dev, autorisé malgré tout):', origin);
      return cb(null, true);
    }
    console.log('⛔ CORS refusé pour:', origin);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Répondre aux préflights pour toutes les routes
app.options('*', cors(corsOptions));

// ——— Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (NODE_ENV !== 'test') {
  app.use((req, _res, next) => {
    console.log(
      `📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} | Origin=${req.headers.origin || 'n/a'}`
    );
    next();
  });
}

// ——— Health
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API Dantela Depot OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: NODE_ENV,
  });
});
app.get('/health', (_req, res) => res.send('ok'));

// ——— Routes API
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

// ——— Index
app.get('/', (_req, res) => {
  res.json({
    message: "Bienvenue sur l'API Dantela Depot",
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      profile: {
        getProfile: 'GET /api/profile',
        updateProfile: 'PUT /api/profile',
        changePassword: 'PUT /api/profile/password',
        stats: 'GET /api/profile/stats',
      },
      admin: {
        pendingUsers: 'GET /api/admin/pending-users',
        validateUser: 'POST /api/admin/validate-user/:userId',
        depots: 'GET/POST /api/admin/depots',
      },
      demandes: {
        create: 'POST /api/demandes',
        list: 'GET /api/demandes',
        validate: 'PUT /api/demandes/:id/validate',
        process: 'POST /api/demandes/:id/process',
      },
      bons: {
        direct: 'POST /api/bons-livraison/direct',
        list: 'GET /api/bons-livraison',
      },
      stock: {
        add: 'POST /api/stock/add',
        remove: 'POST /api/stock/remove',
        movements: 'GET /api/stock/movements',
      },
      messages: {
        list: 'GET /api/messages',
        create: 'POST /api/messages',
        markRead: 'PUT /api/messages/:id/read',
        unreadCount: 'GET /api/messages/unread-count',
      },
      settings: {
        get: 'GET /api/settings',
        update: 'PUT /api/settings',
        backup: 'POST /api/settings/backup',
        import: 'POST /api/settings/import',
        reset: 'POST /api/settings/reset',
        systemInfo: 'GET /api/settings/system-info',
      },
      reports: 'GET /api/reports',
    },
  });
});

// ——— 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint non trouvé', path: req.originalUrl });
});

// ——— Erreurs
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ——— Démarrage
let server;
function start() {
  server = http.createServer(app);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error(`❗ Port ${PORT} déjà utilisé`);
    console.error(e);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => {
    console.log('🚀 ================================');
    console.log('🏗️  Serveur Dantela Depot démarré');
    console.log(`🌐 Host: ${HOST}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔒 Environnement: ${NODE_ENV}`);
    console.log('🚀 ================================');
  });
}
function shutdown() {
  console.log('🛑 Arrêt du serveur...');
  server ? server.close(() => { console.log('✅ Arrêt propre.'); process.exit(0); }) : process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (require.main === module) start();

module.exports = app;
