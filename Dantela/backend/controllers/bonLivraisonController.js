/**
 * Contrôleur BonLivraison - Gestion des bons de livraison
 */

const BonLivraison = require('../models/BonLivraison');
const MouvementStock = require('../models/MouvementStock');
const { notifyBonCreated } = require('./messageController');

/**
 * Créer un bon de livraison pour distribution directe
 */
const createDirectBon = async (req, res) => {
    try {
        const {
            destinataire_id,
            depot_id,
            commentaire,
            items
        } = req.body;

        console.log('📦 Création bon de livraison direct par:', req.user.email);

        // Validation des données
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins un matériau doit être spécifié'
            });
        }

        // Vérifier que toutes les quantités sont positives
        for (const item of items) {
            if (!item.materiau_id || !item.quantite || item.quantite <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les matériaux doivent avoir une quantité positive'
                });
            }
        }

        const bonData = {
            demande_id: null,
            destinataire_id: destinataire_id || null,
            destinataire_custom: req.body.destinataire_custom || null,
            magazinier_id: req.user.userId,
            depot_id: depot_id || null,
            type_livraison: 'directe',
            commentaire,
            items
        };

        const bonLivraison = await BonLivraison.create(bonData);

        console.log('✅ Bon de livraison direct créé:', bonLivraison.numero_bon);

        // Créer notification pour le destinataire
        try {
            const magazinier = await require('../models/User').findById(req.user.userId);
            await notifyBonCreated(bonLivraison, magazinier);
        } catch (notifError) {
            console.error('❌ Erreur notification bon créé:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Bon de livraison créé avec succès',
            bon_livraison: bonLivraison
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du bon direct:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir tous les bons de livraison
 */
const getBonsLivraison = async (req, res) => {
    try {
        const { statut, destinataire_id, magazinier_id, depot_id, type_livraison } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'chef_chantier') {
            // Les chefs de chantier ne voient que leurs bons
            filters.destinataire_id = req.user.userId;
        } else if (req.user.role === 'magazinier') {
            // Les magaziniers voient tous les bons de leur dépôt
            if (depot_id) filters.depot_id = depot_id;
            if (destinataire_id) filters.destinataire_id = destinataire_id;
        } else if (req.user.role === 'directeur') {
            // Les directeurs voient tous les bons
            if (destinataire_id) filters.destinataire_id = destinataire_id;
            if (magazinier_id) filters.magazinier_id = magazinier_id;
            if (depot_id) filters.depot_id = depot_id;
        }

        if (statut) filters.statut = statut;
        if (type_livraison) filters.type_livraison = type_livraison;

        const bons = await BonLivraison.getAll(filters);

        console.log(`📋 ${bons.length} bons de livraison récupérés pour ${req.user.role}`);

        res.json({
            success: true,
            message: 'Bons de livraison récupérés avec succès',
            bons_livraison: bons,
            total: bons.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des bons:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir un bon de livraison par ID
 */
const getBonLivraison = async (req, res) => {
    try {
        const { id } = req.params;

        const bon = await BonLivraison.findById(id);
        
        if (!bon) {
            return res.status(404).json({
                success: false,
                message: 'Bon de livraison non trouvé'
            });
        }

        // Vérifier les permissions
        if (req.user.role === 'chef_chantier' && bon.destinataire_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        res.json({
            success: true,
            message: 'Bon de livraison récupéré avec succès',
            bon_livraison: bon
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du bon:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Mettre à jour le statut d'un bon de livraison
 */
const updateBonStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, signature_destinataire, commentaire } = req.body;

        console.log('📝 Mise à jour statut bon:', id, 'vers:', statut);

        // Vérifier que le statut est valide
        const statutsValides = ['en_preparation', 'prete', 'livree', 'annulee'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        // Vérifier que le bon existe
        const bon = await BonLivraison.findById(id);
        if (!bon) {
            return res.status(404).json({
                success: false,
                message: 'Bon de livraison non trouvé'
            });
        }

        // Vérifier les permissions
        if (req.user.role === 'chef_chantier') {
            // Les chefs de chantier peuvent seulement confirmer la réception
            if (statut !== 'livree' || bon.destinataire_id !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Action non autorisée'
                });
            }
        }

        const additionalData = {};
        if (signature_destinataire) additionalData.signature_destinataire = signature_destinataire;
        if (commentaire) additionalData.commentaire = commentaire;

        const bonMisAJour = await BonLivraison.updateStatus(id, statut, additionalData);

        console.log('✅ Statut bon mis à jour:', bonMisAJour.numero_bon);

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            bon_livraison: bonMisAJour
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les statistiques des bons de livraison
 */
const getBonStats = async (req, res) => {
    try {
        const { depot_id, magazinier_id, date_debut, date_fin } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'magazinier') {
            filters.magazinier_id = req.user.userId;
        } else if (req.user.role === 'directeur') {
            if (magazinier_id) filters.magazinier_id = magazinier_id;
            if (depot_id) filters.depot_id = depot_id;
        }

        if (date_debut) filters.date_debut = date_debut;
        if (date_fin) filters.date_fin = date_fin;

        const stats = await BonLivraison.getStats(filters);

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
 * Générer un PDF du bon de livraison
 */
const generateBonPDF = async (req, res) => {
    try {
        const { id } = req.params;

        const bon = await BonLivraison.findById(id);
        
        if (!bon) {
            return res.status(404).json({
                success: false,
                message: 'Bon de livraison non trouvé'
            });
        }

        // Vérifier les permissions
        if (req.user.role === 'chef_chantier' && bon.destinataire_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        // Pour l'instant, retourner les données du bon
        // TODO: Implémenter la génération PDF avec une librairie comme puppeteer
        res.json({
            success: true,
            message: 'Données du bon pour génération PDF',
            bon_livraison: bon,
            pdf_url: `/api/bons-livraison/${id}/pdf` // URL future pour le PDF
        });

    } catch (error) {
        console.error('❌ Erreur lors de la génération PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    createDirectBon,
    getBonsLivraison,
    getBonLivraison,
    updateBonStatus,
    getBonStats,
    generateBonPDF
};