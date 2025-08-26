/**
 * Routes Admin - Gestion par le directeur
 * Validation des comptes et gestion des dépôts
 */

const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserStats,
    updateUser,
    deactivateUser,
    deleteUser,
    reactivateUser,
    getPendingUsers,
    validateUser,
    createDepot,
    getDepots,
    getMagaziniers,
    assignMagazinier
} = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est directeur
const requireDirecteur = authorizeRoles(['directeur']);

/**
 * @route   GET /api/admin/users
 * @desc    Obtenir tous les utilisateurs avec filtres
 * @access  Private (Directeur seulement)
 */
router.get('/users', authenticateToken, requireDirecteur, getAllUsers);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Obtenir les statistiques des utilisateurs
 * @access  Private (Directeur seulement)
 */
router.get('/users/stats', authenticateToken, requireDirecteur, getUserStats);

/**
 * @route   GET /api/admin/pending-users
 * @desc    Obtenir tous les utilisateurs en attente de validation
 * @access  Private (Directeur seulement)
 */
router.get('/pending-users', authenticateToken, requireDirecteur, getPendingUsers);

/**
 * @route   POST /api/admin/validate-user/:userId
 * @desc    Valider ou rejeter un compte utilisateur
 * @access  Private (Directeur seulement)
 */
router.post('/validate-user/:userId', authenticateToken, requireDirecteur, validateUser);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Mettre à jour un utilisateur
 * @access  Private (Directeur seulement)
 */
router.put('/users/:userId', authenticateToken, requireDirecteur, updateUser);

/**
 * @route   PUT /api/admin/users/:userId/deactivate
 * @desc    Désactiver un utilisateur
 * @access  Private (Directeur seulement)
 */
router.put('/users/:userId/deactivate', authenticateToken, requireDirecteur, deactivateUser);

/**
 * @route   PUT /api/admin/users/:userId/reactivate
 * @desc    Réactiver un utilisateur
 * @access  Private (Directeur seulement)
 */
router.put('/users/:userId/reactivate', authenticateToken, requireDirecteur, reactivateUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Supprimer un utilisateur
 * @access  Private (Directeur seulement)
 */
router.delete('/users/:userId', authenticateToken, requireDirecteur, deleteUser);

/**
 * @route   POST /api/admin/depots
 * @desc    Créer un nouveau dépôt
 * @access  Private (Directeur seulement)
 */
router.post('/depots', authenticateToken, requireDirecteur, createDepot);

/**
 * @route   GET /api/admin/depots
 * @desc    Obtenir tous les dépôts
 * @access  Private (Directeur seulement)
 */
router.get('/depots', authenticateToken, requireDirecteur, getDepots);

/**
 * @route   GET /api/admin/magaziniers
 * @desc    Obtenir tous les magaziniers actifs
 * @access  Private (Directeur seulement)
 */
router.get('/magaziniers', authenticateToken, requireDirecteur, getMagaziniers);

/**
 * @route   GET /api/admin/chefs-chantier
 * @desc    Obtenir tous les chefs de chantier actifs (accessible aux magaziniers)
 * @access  Private (Directeur, Magazinier)
 */
router.get('/chefs-chantier', authenticateToken, authorizeRoles(['directeur', 'magazinier']), async (req, res) => {
    try {
        console.log('📋 Récupération des chefs de chantier actifs');

        const chefsChantier = await require('../models/User').getAllActiveUsers('chef_chantier');

        res.json({
            success: true,
            message: 'Chefs de chantier récupérés avec succès',
            users: chefsChantier
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des chefs de chantier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/admin/depots/:depotId/assign-magazinier
 * @desc    Attribuer un magazinier à un dépôt
 * @access  Private (Directeur seulement)
 */
router.post('/depots/:depotId/assign-magazinier', authenticateToken, requireDirecteur, assignMagazinier);

/**
 * @route   DELETE /api/admin/depots/:depotId
 * @desc    Supprimer un dépôt
 * @access  Private (Directeur seulement)
 */
router.delete('/depots/:depotId', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { depotId } = req.params;
        const { force = false } = req.body; // Option pour forcer la suppression

        console.log('🗑️ Suppression du dépôt:', depotId, 'par:', req.user.email);

        // Vérifier que le dépôt existe
        const Depot = require('../models/Depot');
        const depot = await Depot.findById(depotId);
        if (!depot) {
            return res.status(404).json({
                success: false,
                message: 'Dépôt non trouvé'
            });
        }

        let deletedDepot;
        
        if (force) {
            // Suppression forcée (désactivation)
            deletedDepot = await Depot.deactivateDepot(depotId);
            console.log('✅ Dépôt désactivé avec succès:', deletedDepot.nom);
            
            res.json({
                success: true,
                message: `Dépôt "${depot.nom}" désactivé avec succès`,
                depot: deletedDepot,
                action: 'deactivated'
            });
        } else {
            // Suppression normale avec vérifications
            deletedDepot = await Depot.deleteDepot(depotId);
            console.log('✅ Dépôt supprimé avec succès:', deletedDepot.nom);
            
            res.json({
                success: true,
                message: `Dépôt "${depot.nom}" supprimé avec succès`,
                depot: deletedDepot,
                action: 'deleted'
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors de la suppression du dépôt:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   PUT /api/admin/depots/:depotId
 * @desc    Mettre à jour un dépôt
 * @access  Private (Directeur seulement)
 */
router.put('/depots/:depotId', authenticateToken, requireDirecteur, async (req, res) => {
    try {
        const { depotId } = req.params;
        const { nom, adresse, description, magazinier_id } = req.body;

        console.log('📝 Mise à jour du dépôt:', depotId, 'par:', req.user.email);

        // Validation des données
        if (!nom || !adresse) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et l\'adresse sont obligatoires'
            });
        }

        // Vérifier que le dépôt existe
        const Depot = require('../models/Depot');
        const depot = await Depot.findById(depotId);
        if (!depot) {
            return res.status(404).json({
                success: false,
                message: 'Dépôt non trouvé'
            });
        }

        // Vérifier le magazinier si spécifié
        if (magazinier_id) {
            const User = require('../models/User');
            const magazinier = await User.findById(magazinier_id);
            if (!magazinier || magazinier.role !== 'magazinier' || !magazinier.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'Magazinier invalide ou inactif'
                });
            }
        }

        const updateData = {
            nom,
            adresse,
            description,
            magazinier_id: magazinier_id || null
        };

        const updatedDepot = await Depot.update(depotId, updateData);

        console.log('✅ Dépôt mis à jour avec succès:', updatedDepot.nom);

        res.json({
            success: true,
            message: `Dépôt "${updatedDepot.nom}" mis à jour avec succès`,
            depot: updatedDepot
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du dépôt:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});
module.exports = router;