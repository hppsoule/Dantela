/**
 * Routes Catégories - Gestion des catégories de matériaux
 */

const express = require('express');
const router = express.Router();
const Categorie = require('../models/Categorie');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   GET /api/categories
 * @desc    Obtenir toutes les catégories
 * @access  Private (Tous les rôles)
 */
router.get('/', async (req, res) => {
    try {
        const { depot_id } = req.query;

        const categories = await Categorie.getAll(depot_id);

        console.log(`📂 ${categories.length} catégories récupérées via /api/categories`);

        res.json({
            success: true,
            message: 'Catégories récupérées avec succès',
            categories
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des catégories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Directeur, Magazinier)
 */
router.post('/', authorizeRoles(['directeur', 'magazinier']), async (req, res) => {
    try {
        const { nom, description, depot_id } = req.body;

        console.log('📝 Création d\'une nouvelle catégorie:', { nom });

        // Validation des données
        if (!nom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom de la catégorie est obligatoire'
            });
        }

        const categorieData = {
            nom,
            description,
            depot_id: depot_id || null
        };

        const newCategorie = await Categorie.create(categorieData);

        console.log('✅ Catégorie créée avec succès:', newCategorie.nom);

        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            categorie: newCategorie
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création de la catégorie:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});

module.exports = router;