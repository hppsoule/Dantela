/**
 * Routes Demandes - Gestion des demandes de matériaux
 */

const express = require('express');
const router = express.Router();
const {
    createDemande,
    getDemandes,
    getDemande,
    validateDemande,
    processDemande,
    getDemandeStats
} = require('../controllers/demandeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   POST /api/demandes
 * @desc    Créer une nouvelle demande de matériaux
 * @access  Private (Chef de chantier, Directeur)
 */
router.post('/', authorizeRoles(['chef_chantier', 'directeur']), createDemande);

/**
 * @route   GET /api/demandes
 * @desc    Obtenir toutes les demandes (filtrées selon le rôle)
 * @access  Private (Tous les rôles)
 */
router.get('/', getDemandes);

/**
 * @route   GET /api/demandes/stats
 * @desc    Obtenir les statistiques des demandes
 * @access  Private (Tous les rôles)
 */
router.get('/stats', getDemandeStats);

/**
 * @route   GET /api/demandes/:id
 * @desc    Obtenir une demande par ID
 * @access  Private (Tous les rôles, avec restrictions)
 */
router.get('/:id', getDemande);

/**
 * @route   PUT /api/demandes/:id/validate
 * @desc    Valider une demande (approuver/rejeter)
 * @access  Private (Magazinier, Directeur)
 */
router.put('/:id/validate', authorizeRoles(['magazinier', 'directeur']), validateDemande);

/**
 * @route   POST /api/demandes/:id/process
 * @desc    Traiter une demande approuvée (générer bon de livraison)
 * @access  Private (Magazinier, Directeur)
 */
router.post('/:id/process', authorizeRoles(['magazinier', 'directeur']), processDemande);

module.exports = router;