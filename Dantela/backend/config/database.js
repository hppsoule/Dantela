/**
 * Configuration PostgreSQL (Neon ou local)
 */
const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

let pool;

// 1) Priorité à DATABASE_URL (recommandé sur Render/Neon)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },   // Neon nécessite SSL
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });
  console.log('🔌 DB: connexion via DATABASE_URL');
} else {
  // 2) Fallback variables séparées (dev/local)
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'Dantela',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    ssl: isProd ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });
  console.log(`🔌 DB: connexion via champs séparés (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME})`);
}

// Logs utiles
pool.on('connect', () => console.log('✅ Connexion PostgreSQL établie'));
pool.on('error', (err) => {
  // Ne pas tuer le process brutalement en prod; Render relancera si besoin.
  console.error('❌ Pool error PostgreSQL:', err.message);
});

// Helper requêtes
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('📊 SQL:', { q: text.slice(0, 80).replace(/\s+/g, ' ') + '...', ms: duration, rows: res.rowCount });
  return res;
};

module.exports = { pool, query };
