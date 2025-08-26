/**
 * Contrôleur Profil - Gestion du profil utilisateur
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Obtenir le profil de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
    try {
        console.log('👤 Récupération du profil pour:', req.user.email);

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Retourner le profil sans le mot de passe
        const { password_hash, ...userProfile } = user;

        res.json({
            success: true,
            message: 'Profil récupéré avec succès',
            user: userProfile
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Mettre à jour le profil utilisateur
 */
const updateProfile = async (req, res) => {
    try {
        const {
            nom,
            prenom,
            telephone,
            adresse,
            nom_chantier
        } = req.body;

        console.log('📝 Mise à jour du profil pour:', req.user.email);

        // Validation des données
        if (!nom || !prenom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom et le prénom sont obligatoires'
            });
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
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
            nom: nom.trim(),
            prenom: prenom.trim(),
            telephone: telephone ? telephone.trim() : null,
            adresse: adresse ? adresse.trim() : null,
            nom_chantier: user.role === 'chef_chantier' ? (nom_chantier ? nom_chantier.trim() : null) : user.nom_chantier
        };

        const updatedUser = await User.updateUser(req.user.userId, updateData);

        console.log('✅ Profil mis à jour avec succès pour:', updatedUser.email);

        // Retourner le profil mis à jour sans le mot de passe
        const { password_hash, ...userProfile } = updatedUser;

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: userProfile
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Changer le mot de passe
 */
const changePassword = async (req, res) => {
    try {
        const {
            current_password,
            new_password,
            confirm_password
        } = req.body;

        console.log('🔐 Changement de mot de passe pour:', req.user.email);

        // Validation des données
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires'
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Les nouveaux mots de passe ne correspondent pas'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Récupérer l'utilisateur avec le mot de passe
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier le mot de passe actuel
        const isCurrentPasswordValid = await User.verifyPassword(current_password, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hacher le nouveau mot de passe
        const saltRounds = 10;
        const new_password_hash = await bcrypt.hash(new_password, saltRounds);

        // Mettre à jour le mot de passe en base
        const { query } = require('../config/database');
        await query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [new_password_hash, req.user.userId]
        );

        console.log('✅ Mot de passe changé avec succès pour:', user.email);

        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les statistiques du profil utilisateur
 */
const getProfileStats = async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques de profil pour:', req.user.email);
        
        const { query } = require('../config/database');
        const userId = req.user.userId;
        const userRole = req.user.role;

        let stats = {};

        if (userRole === 'magazinier') {
            // Statistiques spécifiques au magazinier
            const statsQuery = `
                SELECT 
                    -- Demandes traitées
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE validee_par = $1) as total_demandes_traitees,
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE validee_par = $1 AND statut = 'approuvee') as demandes_approuvees,
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE validee_par = $1 AND statut = 'rejetee') as demandes_rejetees,
                    
                    -- Bons de livraison générés
                    (SELECT COUNT(*) FROM bons_livraison WHERE magazinier_id = $1) as total_bons_generes,
                    
                    -- Mouvements de stock effectués
                    (SELECT COUNT(*) FROM mouvements_stock WHERE utilisateur_id = $1) as total_mouvements_stock,
                    
                    -- Matériaux différents gérés
                    (SELECT COUNT(DISTINCT materiau_id) FROM mouvements_stock WHERE utilisateur_id = $1) as materiaux_geres,
                    
                    -- Informations du dépôt
                    (SELECT d.nom FROM depots d WHERE d.magazinier_id = $1 LIMIT 1) as depot_nom,
                    (SELECT d.adresse FROM depots d WHERE d.magazinier_id = $1 LIMIT 1) as depot_adresse
            `;

            const result = await query(statsQuery, [userId]);
            stats = result.rows[0] || {};

        } else if (userRole === 'chef_chantier') {
            // Statistiques spécifiques au chef de chantier
            const statsQuery = `
                SELECT 
                    -- Demandes créées
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE demandeur_id = $1) as total_demandes_creees,
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE demandeur_id = $1 AND statut = 'approuvee') as demandes_approuvees,
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE demandeur_id = $1 AND statut = 'livree') as demandes_livrees,
                    
                    -- Bons reçus
                    (SELECT COUNT(*) FROM bons_livraison WHERE destinataire_id = $1) as bons_recus,
                    
                    -- Matériaux différents commandés
                    (SELECT COUNT(DISTINCT di.materiau_id) 
                     FROM demande_items di 
                     JOIN demandes_materiaux dm ON di.demande_id = dm.id 
                     WHERE dm.demandeur_id = $1) as materiaux_commandes
            `;

            const result = await query(statsQuery, [userId]);
            stats = result.rows[0] || {};

        } else if (userRole === 'directeur') {
            // Statistiques globales pour le directeur
            const statsQuery = `
                SELECT 
                    -- Vue d'ensemble système
                    (SELECT COUNT(*) FROM users WHERE is_active = true) as total_utilisateurs_actifs,
                    (SELECT COUNT(*) FROM depots WHERE is_active = true) as total_depots_actifs,
                    (SELECT COUNT(*) FROM materiaux) as total_materiaux,
                    (SELECT COUNT(*) FROM demandes_materiaux) as total_demandes_systeme,
                    
                    -- Activité récente
                    (SELECT COUNT(*) FROM demandes_materiaux WHERE date_demande >= CURRENT_DATE - INTERVAL '7 days') as demandes_semaine,
                    (SELECT COUNT(*) FROM bons_livraison WHERE date_preparation >= CURRENT_DATE - INTERVAL '7 days') as bons_semaine
            `;

            const result = await query(statsQuery);
            stats = result.rows[0] || {};
        }

        res.json({
            success: true,
            message: 'Statistiques de profil récupérées avec succès',
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

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getProfileStats
};