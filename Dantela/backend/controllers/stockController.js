/**
 * Contrôleur Stock - Gestion des mouvements de stock
 */

const MouvementStock = require('../models/MouvementStock');
const Materiau = require('../models/Materiau');

/**
 * Enregistrer une entrée de stock (réception matériaux)
 */
const addStock = async (req, res) => {
    try {
        const {
            materiau_id,
            quantite,
            fournisseur,
            numero_facture,
            motif,
            description
        } = req.body;

        console.log('📦 Entrée de stock par:', req.user.email);

        // Validation des données
        if (!materiau_id || !quantite || quantite <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Matériau et quantité positive requis'
            });
        }

        // Vérifier que le matériau existe
        const materiau = await Materiau.findById(materiau_id);
        if (!materiau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        const mouvementData = {
            materiau_id,
            type_mouvement: 'entree',
            quantite: Math.abs(quantite), // Positif pour entrée
            utilisateur_id: req.user.userId,
            motif: motif || 'Réception fournisseur',
            description: description || `Réception de ${quantite} ${materiau.unite}`,
            fournisseur,
            numero_facture
        };

        const mouvement = await MouvementStock.create(mouvementData);

        console.log('✅ Entrée de stock enregistrée:', mouvement.id);

        res.status(201).json({
            success: true,
            message: 'Entrée de stock enregistrée avec succès',
            mouvement
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'entrée de stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Enregistrer une sortie de stock (distribution directe)
 */
const removeStock = async (req, res) => {
    try {
        const {
            materiau_id,
            quantite,
            destinataire_id,
            motif,
            description
        } = req.body;

        console.log('📤 Sortie de stock par:', req.user.email);

        // Validation des données
        if (!materiau_id || !quantite || quantite <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Matériau et quantité positive requis'
            });
        }

        // Vérifier que le matériau existe
        const materiau = await Materiau.findById(materiau_id);
        if (!materiau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        // Vérifier le stock disponible
        if (materiau.stock_actuel < quantite) {
            return res.status(400).json({
                success: false,
                message: `Stock insuffisant. Disponible: ${materiau.stock_actuel} ${materiau.unite}, demandé: ${quantite} ${materiau.unite}`
            });
        }

        const mouvementData = {
            materiau_id,
            type_mouvement: 'sortie',
            quantite: -Math.abs(quantite), // Négatif pour sortie
            utilisateur_id: req.user.userId,
            motif: motif || 'Distribution directe',
            description: description || `Distribution de ${quantite} ${materiau.unite}`
        };

        const mouvement = await MouvementStock.create(mouvementData);

        console.log('✅ Sortie de stock enregistrée:', mouvement.id);

        res.status(201).json({
            success: true,
            message: 'Sortie de stock enregistrée avec succès',
            mouvement
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sortie de stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Ajuster le stock (correction d'inventaire)
 */
const adjustStock = async (req, res) => {
    try {
        const {
            materiau_id,
            nouveau_stock,
            motif,
            description
        } = req.body;

        console.log('🔧 Ajustement de stock par:', req.user.email);

        // Validation des données
        if (!materiau_id || nouveau_stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Matériau et nouveau stock (≥0) requis'
            });
        }

        // Vérifier que le matériau existe
        const materiau = await Materiau.findById(materiau_id);
        if (!materiau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        const stock_actuel = materiau.stock_actuel;
        const difference = nouveau_stock - stock_actuel;

        if (difference === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau stock est identique au stock actuel'
            });
        }

        const mouvementData = {
            materiau_id,
            type_mouvement: 'ajustement',
            quantite: difference,
            utilisateur_id: req.user.userId,
            motif: motif || 'Ajustement inventaire',
            description: description || `Ajustement de ${stock_actuel} à ${nouveau_stock} ${materiau.unite}`
        };

        const mouvement = await MouvementStock.create(mouvementData);

        console.log('✅ Ajustement de stock enregistré:', mouvement.id);

        res.status(201).json({
            success: true,
            message: 'Ajustement de stock enregistré avec succès',
            mouvement
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajustement de stock:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir tous les mouvements de stock
 */
const getMouvements = async (req, res) => {
    try {
        const { 
            materiau_id, 
            type_mouvement, 
            utilisateur_id, 
            date_debut, 
            date_fin, 
            depot_id,
            limit 
        } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'magazinier') {
            // Les magaziniers voient les mouvements de leur dépôt
            if (depot_id) filters.depot_id = depot_id;
        } else if (req.user.role === 'directeur') {
            // Les directeurs voient tous les mouvements
            if (depot_id) filters.depot_id = depot_id;
            if (utilisateur_id) filters.utilisateur_id = utilisateur_id;
        }

        if (materiau_id) filters.materiau_id = materiau_id;
        if (type_mouvement) filters.type_mouvement = type_mouvement;
        if (date_debut) filters.date_debut = date_debut;
        if (date_fin) filters.date_fin = date_fin;
        if (limit) filters.limit = parseInt(limit);

        const mouvements = await MouvementStock.getAll(filters);

        console.log(`📋 ${mouvements.length} mouvements récupérés pour ${req.user.role}`);

        res.json({
            success: true,
            message: 'Mouvements de stock récupérés avec succès',
            mouvements,
            total: mouvements.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des mouvements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir l'historique d'un matériau
 */
const getHistoryMateriau = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Vérifier que le matériau existe
        const materiau = await Materiau.findById(id);
        if (!materiau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const historique = await MouvementStock.getHistoryByMateriau(id, options);

        res.json({
            success: true,
            message: 'Historique récupéré avec succès',
            materiau: {
                id: materiau.id,
                nom: materiau.nom,
                code_produit: materiau.code_produit,
                unite: materiau.unite,
                stock_actuel: materiau.stock_actuel
            },
            historique,
            total: historique.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les statistiques des mouvements
 */
const getStockStats = async (req, res) => {
    try {
        const { depot_id, date_debut, date_fin } = req.query;
        
        let filters = {};

        // Filtrer selon le rôle
        if (req.user.role === 'magazinier') {
            // Les magaziniers voient les stats de leur dépôt
            if (depot_id) filters.depot_id = depot_id;
        } else if (req.user.role === 'directeur') {
            // Les directeurs voient toutes les stats
            if (depot_id) filters.depot_id = depot_id;
        }

        if (date_debut) filters.date_debut = date_debut;
        if (date_fin) filters.date_fin = date_fin;

        const stats = await MouvementStock.getStats(filters);

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
    addStock,
    removeStock,
    adjustStock,
    getMouvements,
    getHistoryMateriau,
    getStockStats
};