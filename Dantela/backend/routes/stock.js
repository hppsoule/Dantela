/**
 * Routes Stock - Gestion des mouvements de stock
 */

const express = require('express');
const router = express.Router();
const {
    addStock,
    removeStock,
    adjustStock,
    getMouvements,
    getHistoryMateriau,
    getStockStats
} = require('../controllers/stockController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   POST /api/stock/add
 * @desc    Enregistrer une entrée de stock (réception matériaux)
 * @access  Private (Magazinier, Directeur)
 */
router.post('/add', authorizeRoles(['magazinier', 'directeur']), addStock);

/**
 * @route   POST /api/stock/remove
 * @desc    Enregistrer une sortie de stock (distribution directe)
 * @access  Private (Magazinier, Directeur)
 */
router.post('/remove', authorizeRoles(['magazinier', 'directeur']), removeStock);

/**
 * @route   POST /api/stock/adjust
 * @desc    Ajuster le stock (correction d'inventaire)
 * @access  Private (Magazinier, Directeur)
 */
router.post('/adjust', authorizeRoles(['magazinier', 'directeur']), adjustStock);

/**
 * @route   GET /api/stock/movements
 * @desc    Obtenir tous les mouvements de stock
 * @access  Private (Magazinier, Directeur)
 */
router.get('/movements', authorizeRoles(['magazinier', 'directeur']), getMouvements);

/**
 * @route   GET /api/stock/stats
 * @desc    Obtenir les statistiques des mouvements de stock
 * @access  Private (Magazinier, Directeur)
 */
router.get('/stats', authorizeRoles(['magazinier', 'directeur']), getStockStats);

/**
 * @route   GET /api/stock/history/:id
 * @desc    Obtenir l'historique d'un matériau
 * @access  Private (Magazinier, Directeur)
 */
router.get('/history/:id', authorizeRoles(['magazinier', 'directeur']), getHistoryMateriau);

module.exports = router;