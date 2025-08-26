/**
 * Routes Bons de Livraison - Gestion des bons de livraison
 */

const express = require('express');
const router = express.Router();
const {
    createDirectBon,
    getBonsLivraison,
    getBonLivraison,
    updateBonStatus,
    getBonStats,
    generateBonPDF
} = require('../controllers/bonLivraisonController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   POST /api/bons-livraison/direct
 * @desc    Créer un bon de livraison pour distribution directe
 * @access  Private (Magazinier, Directeur)
 */
router.post('/direct', authorizeRoles(['magazinier', 'directeur']), createDirectBon);

/**
 * @route   GET /api/bons-livraison
 * @desc    Obtenir tous les bons de livraison (filtrés selon le rôle)
 * @access  Private (Tous les rôles)
 */
router.get('/', getBonsLivraison);

/**
 * @route   GET /api/bons-livraison/stats
 * @desc    Obtenir les statistiques des bons de livraison
 * @access  Private (Magazinier, Directeur)
 */
router.get('/stats', authorizeRoles(['magazinier', 'directeur']), getBonStats);

/**
 * @route   GET /api/bons-livraison/:id
 * @desc    Obtenir un bon de livraison par ID
 * @access  Private (Tous les rôles, avec restrictions)
 */
router.get('/:id', getBonLivraison);

/**
 * @route   GET /api/bons-livraison/:id/pdf
 * @desc    Générer le PDF d'un bon de livraison
 * @access  Private (Tous les rôles, avec restrictions)
 */
router.get('/:id/pdf', generateBonPDF);

/**
 * @route   PUT /api/bons-livraison/:id/status
 * @desc    Mettre à jour le statut d'un bon de livraison
 * @access  Private (Magazinier, Directeur, Chef de chantier pour réception)
 */
router.put('/:id/status', updateBonStatus);

module.exports = router;