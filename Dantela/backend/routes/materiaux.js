/**
 * Routes Matériaux - Gestion des matériaux de construction
 */

const express = require('express');
const router = express.Router();
const {
    upload,
    getMateriaux,
    getMateriau,
    createMateriau,
    updateMateriau,
    deleteMateriau,
    getLowStockMateriaux,
    getCategories
} = require('../controllers/materiauController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   GET /api/materiaux
 * @desc    Obtenir tous les matériaux
 * @access  Private (Tous les rôles)
 */
router.get('/', getMateriaux);

/**
 * @route   GET /api/materiaux/categories
 * @desc    Obtenir toutes les catégories
 * @access  Private (Tous les rôles)
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/materiaux/low-stock
 * @desc    Obtenir les matériaux avec stock faible
 * @access  Private (Directeur, Magazinier)
 */
router.get('/low-stock', authorizeRoles(['directeur', 'magazinier']), getLowStockMateriaux);

/**
 * @route   GET /api/materiaux/:id
 * @desc    Obtenir un matériau par ID
 * @access  Private (Tous les rôles)
 */
router.get('/:id', getMateriau);

/**
 * @route   POST /api/materiaux
 * @desc    Créer un nouveau matériau
 * @access  Private (Directeur, Magazinier)
 */
router.post('/', authorizeRoles(['directeur', 'magazinier']), upload.single('image'), createMateriau);

/**
 * @route   PUT /api/materiaux/:id
 * @desc    Mettre à jour un matériau
 * @access  Private (Directeur, Magazinier)
 */
router.put('/:id', authorizeRoles(['directeur', 'magazinier']), upload.single('image'), updateMateriau);

/**
 * @route   DELETE /api/materiaux/:id
 * @desc    Supprimer un matériau
 * @access  Private (Directeur, Magazinier)
 */
router.delete('/:id', authorizeRoles(['directeur', 'magazinier']), deleteMateriau);

module.exports = router;