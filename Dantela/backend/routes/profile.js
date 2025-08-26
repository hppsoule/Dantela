/**
 * Routes Profil - Gestion du profil utilisateur
 */

const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    getProfileStats
} = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   GET /api/profile
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   GET /api/profile/stats
 * @desc    Obtenir les statistiques du profil utilisateur
 * @access  Private
 */
router.get('/stats', getProfileStats);

/**
 * @route   PUT /api/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/', updateProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put('/password', changePassword);

module.exports = router;