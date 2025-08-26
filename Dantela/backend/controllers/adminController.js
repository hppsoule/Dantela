/**
 * Contrôleur Admin - Gestion par le directeur
 * Validation des comptes et gestion des dépôts
 */

const User = require('../models/User');
const Depot = require('../models/Depot');

/**
 * Obtenir tous les utilisateurs avec filtres
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, is_active, search } = req.query;
        
        console.log('📋 Récupération de tous les utilisateurs avec filtres:', { role, is_active, search });

        const filters = {};
        if (role && role !== 'all') filters.role = role;
        if (is_active !== undefined) filters.is_active = is_active === 'true';
        if (search) filters.search = search;

        const users = await User.getAllUsers(filters);

        res.json({
            success: true,
            message: 'Utilisateurs récupérés avec succès',
            users,
            total: users.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les statistiques des utilisateurs
 */
const getUserStats = async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques utilisateurs');

        const stats = await User.getUserStats();

        res.json({
            success: true,
            message: 'Statistiques récupérées avec succès',
            stats
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Mettre à jour un utilisateur
 */
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { nom, prenom, telephone, adresse, nom_chantier, email } = req.body;

        console.log('📝 Mise à jour utilisateur:', { userId }, 'par:', req.user.email);

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Validation des données
        if (!nom || !prenom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et le prénom sont obligatoires'
            });
        }

        // Validation spécifique pour chef de chantier
        if (user.role === 'chef_chantier' && !nom_chantier) {
            return res.status(400).json({
                success: false,
                message: 'Le nom du chantier est obligatoire pour les chefs de chantier'
            });
        }

        const updateData = {
            nom,
            prenom,
            telephone,
            adresse,
            nom_chantier,
            email
        };

        const updatedUser = await User.updateUser(userId, updateData);

        console.log('✅ Utilisateur mis à jour avec succès:', updatedUser.email);

        res.json({
            success: true,
            message: `Utilisateur ${updatedUser.prenom} ${updatedUser.nom} mis à jour avec succès`,
            user: updatedUser
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Désactiver un utilisateur
 */
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('🚫 Désactivation utilisateur:', { userId });

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (user.role === 'directeur') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de désactiver le compte directeur'
            });
        }

        const deactivatedUser = await User.deactivateUser(userId);

        res.json({
            success: true,
            message: `Compte de ${user.prenom} ${user.nom} désactivé avec succès`,
            user: deactivatedUser
        });

    } catch (error) {
        console.error('❌ Erreur lors de la désactivation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Supprimer un utilisateur
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('🗑️ Suppression utilisateur:', { userId });

        const deletedUser = await User.deleteUser(userId);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé ou impossible à supprimer'
            });
        }

        res.json({
            success: true,
            message: `Utilisateur ${deletedUser.prenom} ${deletedUser.nom} supprimé avec succès`,
            user: deletedUser
        });

    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Réactiver un utilisateur
 */
const reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('✅ Réactivation utilisateur:', { userId });

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        const reactivatedUser = await User.updateActiveStatus(userId, true);

        res.json({
            success: true,
            message: `Compte de ${user.prenom} ${user.nom} réactivé avec succès`,
            user: reactivatedUser
        });

    } catch (error) {
        console.error('❌ Erreur lors de la réactivation:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir tous les utilisateurs en attente de validation
 */
const getPendingUsers = async (req, res) => {
    try {
        console.log('📋 Récupération des utilisateurs en attente');

        const pendingUsers = await User.getPendingUsers();

        res.json({
            success: true,
            message: 'Utilisateurs en attente récupérés',
            users: pendingUsers
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs en attente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Valider ou rejeter un compte utilisateur
 */
const validateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action } = req.body; // 'approve' ou 'reject'

        console.log('✅ Validation utilisateur:', { userId, action });

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action invalide. Utilisez "approve" ou "reject"'
            });
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (action === 'approve') {
            // Activer le compte
            const updatedUser = await User.updateActiveStatus(userId, true);
            
            res.json({
                success: true,
                message: `Compte de ${user.prenom} ${user.nom} approuvé avec succès`,
                user: updatedUser
            });
        } else {
            // Pour le rejet, on pourrait supprimer l'utilisateur ou le marquer comme rejeté
            // Pour l'instant, on le laisse inactif
            res.json({
                success: true,
                message: `Compte de ${user.prenom} ${user.nom} rejeté`
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Créer un nouveau dépôt
 */
const createDepot = async (req, res) => {
    try {
        const { nom, adresse, description, magazinier_id } = req.body;
        const directeur_id = req.user.userId;

        console.log('🏗️ Création d\'un nouveau dépôt:', { nom, adresse });

        // Validation des données
        if (!nom || !adresse) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et l\'adresse du dépôt sont obligatoires'
            });
        }

        // Vérifier que le magazinier existe et est actif (si spécifié)
        if (magazinier_id) {
            const magazinier = await User.findById(magazinier_id);
            if (!magazinier || magazinier.role !== 'magazinier' || !magazinier.is_active) {
                return res.status(400).json({
                    success: false,
                    message: 'Magazinier invalide ou inactif'
                });
            }
        }

        const depotData = {
            nom,
            adresse,
            description,
            directeur_id,
            magazinier_id
        };

        const newDepot = await Depot.create(depotData);

        console.log('✅ Dépôt créé avec succès:', newDepot.nom);

        res.status(201).json({
            success: true,
            message: 'Dépôt créé avec succès',
            depot: newDepot
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du dépôt:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir tous les dépôts
 */
const getDepots = async (req, res) => {
    try {
        console.log('📋 Récupération de tous les dépôts');

        const depots = await Depot.getAll();

        res.json({
            success: true,
            message: 'Dépôts récupérés avec succès',
            depots
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des dépôts:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir tous les magaziniers actifs
 */
const getMagaziniers = async (req, res) => {
    try {
        console.log('📋 Récupération des magaziniers actifs');

        const magaziniers = await User.getActiveMagaziniers();

        res.json({
            success: true,
            message: 'Magaziniers récupérés avec succès',
            magaziniers
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des magaziniers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Attribuer un magazinier à un dépôt
 */
const assignMagazinier = async (req, res) => {
    try {
        const { depotId } = req.params;
        const { magazinier_id } = req.body;

        console.log('👤 Attribution magazinier au dépôt:', { depotId, magazinier_id });

        // Vérifier que le dépôt existe
        const depot = await Depot.findById(depotId);
        if (!depot) {
            return res.status(404).json({
                success: false,
                message: 'Dépôt non trouvé'
            });
        }

        // Vérifier que le magazinier existe et est actif
        const magazinier = await User.findById(magazinier_id);
        if (!magazinier || magazinier.role !== 'magazinier' || !magazinier.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Magazinier invalide ou inactif'
            });
        }

        const updatedDepot = await Depot.assignMagazinier(depotId, magazinier_id);

        res.json({
            success: true,
            message: `Magazinier ${magazinier.prenom} ${magazinier.nom} attribué au dépôt avec succès`,
            depot: updatedDepot
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'attribution:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
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
};