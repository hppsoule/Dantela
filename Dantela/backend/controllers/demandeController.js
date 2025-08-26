/**
 * Contrôleur Demande - Gestion des demandes de matériaux
 */

const Demande = require('../models/Demande');
const BonLivraison = require('../models/BonLivraison');
const MouvementStock = require('../models/MouvementStock');
const { notifyNewDemande, notifyDemandeValidated } = require('./messageController');

/**
 * Créer une nouvelle demande
 */
const createDemande = async (req, res) => {
    try {
        const {
            depot_id,
            priorite,
            commentaire_demandeur,
            date_livraison_souhaitee,
            items
        } = req.body;

        console.log('📝 Création d\'une nouvelle demande par:', req.user.email);

        // Validation des données
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins un matériau doit être demandé'
            });
        }

        // Vérifier que toutes les quantités sont positives
        for (const item of items) {
            if (!item.materiau_id || !item.quantite_demandee || item.quantite_demandee <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les matériaux doivent avoir une quantité positive'
                });
            }
        }

        const demandeData = {
            demandeur_id: req.user.userId,
            depot_id: depot_id || null,
            priorite,
            commentaire_demandeur,
            date_livraison_souhaitee,
            items
        };

        const nouvelleDemande = await Demande.create(demandeData);

        console.log('✅ Demande créée avec succès:', nouvelleDemande.numero_demande);

        // Créer notification automatique pour les magaziniers
        try {
            const demandeur = await require('../models/User').findById(req.user.userId);
            await require('./messageController').notifyNewDemande(nouvelleDemande, demandeur);
        } catch (notifError) {
            console.error('❌ Erreur notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Demande créée avec succès',
            demande: nouvelleDemande
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création de la demande:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir toutes les demandes
 */
const getDemandes = async (req, res) => {
    try {
        const { statut, demandeur_id, depot_id } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'chef_chantier') {
            // Les chefs de chantier ne voient que leurs demandes
            filters.demandeur_id = req.user.userId;
        } else if (req.user.role === 'magazinier' || req.user.role === 'directeur') {
            // Les magaziniers et directeurs voient toutes les demandes
            if (demandeur_id) filters.demandeur_id = demandeur_id;
            if (depot_id) filters.depot_id = depot_id;
        }

        if (statut) filters.statut = statut;

        const demandes = await Demande.getAll(filters);

        console.log(`📋 ${demandes.length} demandes récupérées pour ${req.user.role}`);

        res.json({
            success: true,
            message: 'Demandes récupérées avec succès',
            demandes,
            total: demandes.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des demandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir une demande par ID
 */
const getDemande = async (req, res) => {
    try {
        const { id } = req.params;

        const demande = await Demande.findById(id);
        
        if (!demande) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        // Vérifier les permissions
        if (req.user.role === 'chef_chantier' && demande.demandeur_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        res.json({
            success: true,
            message: 'Demande récupérée avec succès',
            demande
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Valider une demande (approuver/rejeter)
 */
const validateDemande = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, commentaire_magazinier, items_accordes } = req.body;

        console.log('✅ Validation de la demande:', id, 'par:', req.user.email);

        // Vérifier que le statut est valide
        if (!['approuvee', 'rejetee'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Utilisez "approuvee" ou "rejetee"'
            });
        }

        // Vérifier que la demande existe
        const demande = await Demande.findById(id);
        if (!demande) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        if (demande.statut !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: 'Cette demande a déjà été traitée'
            });
        }

        const validationData = {
            statut,
            commentaire_magazinier,
            validee_par: req.user.userId,
            items_accordes
        };

        const demandeValidee = await Demande.validate(id, validationData);

        console.log('✅ Demande validée avec succès:', demandeValidee.numero_demande);

        // Créer notification pour le demandeur
        try {
            const valideur = await require('../models/User').findById(req.user.userId);
            await require('./messageController').notifyDemandeValidated(demandeValidee, valideur, statut);
        } catch (notifError) {
            console.error('❌ Erreur notification validation:', notifError);
        }

        res.json({
            success: true,
            message: `Demande ${statut === 'approuvee' ? 'approuvée' : 'rejetée'} avec succès`,
            demande: demandeValidee
        });

    } catch (error) {
        console.error('❌ Erreur lors de la validation de la demande:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Traiter une demande approuvée (générer bon de livraison)
 */
const processDemande = async (req, res) => {
    try {
        const { id } = req.params;
        const { commentaire } = req.body;

        console.log('📦 Traitement de la demande:', id);

        // Vérifier que la demande existe et est approuvée
        const demande = await Demande.findById(id);
        if (!demande) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        if (demande.statut !== 'approuvee') {
            return res.status(400).json({
                success: false,
                message: 'Seules les demandes approuvées peuvent être traitées'
            });
        }

        // Préparer les items pour le bon de livraison
        const items = demande.items
            .filter(item => item.quantite_accordee > 0)
            .map(item => ({
                materiau_id: item.materiau_id,
                quantite: item.quantite_accordee
            }));

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun matériau accordé à livrer'
            });
        }

        // Créer le bon de livraison
        const bonData = {
            demande_id: demande.id,
            destinataire_id: demande.demandeur_id,
            magazinier_id: req.user.userId,
            depot_id: demande.depot_id,
            type_livraison: 'commande',
            commentaire,
            items
        };

        const bonLivraison = await BonLivraison.create(bonData);

        // Mettre à jour le statut de la demande
        await Demande.updateStatus(id, 'en_preparation');

        console.log('✅ Bon de livraison créé:', bonLivraison.numero_bon);

        res.json({
            success: true,
            message: 'Demande traitée avec succès. Bon de livraison généré.',
            bon_livraison: bonLivraison
        });

    } catch (error) {
        console.error('❌ Erreur lors du traitement de la demande:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les statistiques des demandes
 */
const getDemandeStats = async (req, res) => {
    try {
        const { depot_id, date_debut, date_fin } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'chef_chantier') {
            filters.demandeur_id = req.user.userId;
        } else {
            if (depot_id) filters.depot_id = depot_id;
        }

        if (date_debut) filters.date_debut = date_debut;
        if (date_fin) filters.date_fin = date_fin;

        const stats = await Demande.getStats(filters);

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

module.exports = {
    createDemande,
    getDemandes,
    getDemande,
    validateDemande,
    processDemande,
    getDemandeStats
};