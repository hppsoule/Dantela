/**
 * Configuration de la base de données PostgreSQL
 * Module d'authentification - Gestion de la connexion
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la pool de connexions PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD || ''),
    // Configuration pour la production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Pool de connexions
    max: 10, // Nombre maximum de connexions
    idleTimeoutMillis: 30000, // Temps avant fermeture d'une connexion inactive
    connectionTimeoutMillis: 2000, // Temps d'attente pour une nouvelle connexion
});

// Test de connexion au démarrage
pool.on('connect', () => {
    console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
    console.error('❌ Erreur de connexion PostgreSQL:', err);
    process.exit(-1);
});

// Fonction pour exécuter des requêtes
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Requête exécutée:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de la requête:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query
};