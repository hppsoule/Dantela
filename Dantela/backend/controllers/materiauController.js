/**
 * Contrôleur Matériau - Gestion des matériaux de construction
 */

const Materiau = require('../models/Materiau');
const Categorie = require('../models/Categorie');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer pour l'upload temporaire
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
        }
    }
});

/**
 * Obtenir tous les matériaux
 */
const getMateriaux = async (req, res) => {
    try {
        const { depot_id, search, category } = req.query;
        
        let materiaux;
        
        if (search) {
            materiaux = await Materiau.search(search, depot_id);
        } else {
            materiaux = await Materiau.getAll(depot_id);
        }

        // Filtrer par catégorie si spécifié
        if (category && category !== 'all') {
            materiaux = materiaux.filter(m => m.categorie_id === category);
        }

        console.log(`📦 ${materiaux.length} matériaux récupérés`);

        res.json({
            success: true,
            message: 'Matériaux récupérés avec succès',
            materiaux,
            total: materiaux.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des matériaux:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir un matériau par ID
 */
const getMateriau = async (req, res) => {
    try {
        const { id } = req.params;

        const materiau = await Materiau.findById(id);
        
        if (!materiau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Matériau récupéré avec succès',
            materiau
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du matériau:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Créer un nouveau matériau
 */
const createMateriau = async (req, res) => {
    try {
        const {
            code_produit,
            nom,
            description,
            unite,
            stock_actuel,
            stock_minimum,
            fournisseur,
            categorie_id,
            depot_id
        } = req.body;

        console.log('📝 Création d\'un nouveau matériau:', { nom, code_produit });

        // Validation des données obligatoires
        if (!code_produit || !nom || !unite || !categorie_id) {
            return res.status(400).json({
                success: false,
                message: 'Le nom, l\'unité et la catégorie sont obligatoires'
            });
        }

        // Vérifier que la catégorie existe
        const categorie = await Categorie.findById(categorie_id);
        if (!categorie) {
            return res.status(400).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        // Générer un code produit automatique si pas fourni
        const finalCodeProduit = code_produit || `MAT-${Date.now()}`;
        let image_url = null;
        let image_public_id = null;

        // Upload de l'image si fournie
        if (req.file) {
            try {
                const uploadResult = await uploadImage(req.file.path);
                image_url = uploadResult.secure_url;
                image_public_id = uploadResult.public_id;
                
                // Supprimer le fichier temporaire
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
                
                console.log('📸 Image uploadée:', image_url);
            } catch (uploadError) {
                console.error('❌ Erreur upload image:', uploadError);
                // Continuer sans image si l'upload échoue
            }
        }

        const materiauData = {
            code_produit: finalCodeProduit,
            nom,
            description,
            unite,
            stock_actuel: parseInt(stock_actuel) || 0,
            stock_minimum: parseInt(stock_minimum) || 0,
            fournisseur,
            categorie_id,
            depot_id: depot_id || (await require('../models/Depot').getAll())[0]?.id || null,
            image_url,
            image_public_id
        };

        const newMateriau = await Materiau.create(materiauData);

        console.log('✅ Matériau créé avec succès:', newMateriau.nom);

        res.status(201).json({
            success: true,
            message: 'Matériau créé avec succès',
            materiau: newMateriau
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du matériau:', error);
        
        // Supprimer le fichier temporaire en cas d'erreur
        if (req.file) {
            const fs = require('fs');
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('❌ Erreur suppression fichier temporaire:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * Mettre à jour un matériau
 */
const updateMateriau = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code_produit,
            nom,
            description,
            unite,
            stock_actuel,
            stock_minimum,
            fournisseur,
            categorie_id
        } = req.body;

        console.log('📝 Mise à jour du matériau:', id);

        // Vérifier que le matériau existe
        const existingMateriau = await Materiau.findById(id);
        if (!existingMateriau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        let image_url = existingMateriau.image_url;
        let image_public_id = existingMateriau.image_public_id;

        // Upload de la nouvelle image si fournie
        if (req.file) {
            try {
                // Supprimer l'ancienne image de Cloudinary
                if (existingMateriau.image_public_id) {
                    await deleteImage(existingMateriau.image_public_id);
                }

                // Upload de la nouvelle image
                const uploadResult = await uploadImage(req.file.path);
                image_url = uploadResult.secure_url;
                image_public_id = uploadResult.public_id;
                
                // Supprimer le fichier temporaire
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
                
                console.log('📸 Nouvelle image uploadée:', image_url);
            } catch (uploadError) {
                console.error('❌ Erreur upload image:', uploadError);
            }
        }

        const updateData = {
            code_produit,
            nom,
            description,
            unite,
            stock_actuel: parseInt(stock_actuel),
            stock_minimum: parseInt(stock_minimum),
            fournisseur,
            categorie_id,
            image_url,
            image_public_id
        };

        const updatedMateriau = await Materiau.update(id, updateData);

        console.log('✅ Matériau mis à jour avec succès:', updatedMateriau.nom);

        res.json({
            success: true,
            message: 'Matériau mis à jour avec succès',
            materiau: updatedMateriau
        });

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du matériau:', error);
        
        // Supprimer le fichier temporaire en cas d'erreur
        if (req.file) {
            const fs = require('fs');
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('❌ Erreur suppression fichier temporaire:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Supprimer un matériau
 */
const deleteMateriau = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Suppression du matériau:', id);

        // Vérifier que le matériau existe
        const existingMateriau = await Materiau.findById(id);
        if (!existingMateriau) {
            return res.status(404).json({
                success: false,
                message: 'Matériau non trouvé'
            });
        }

        // Supprimer l'image de Cloudinary si elle existe
        if (existingMateriau.image_public_id) {
            try {
                await deleteImage(existingMateriau.image_public_id);
                console.log('📸 Image supprimée de Cloudinary');
            } catch (deleteError) {
                console.error('❌ Erreur suppression image Cloudinary:', deleteError);
            }
        }

        const deletedMateriau = await Materiau.delete(id);

        console.log('✅ Matériau supprimé avec succès:', deletedMateriau.nom);

        res.json({
            success: true,
            message: 'Matériau supprimé avec succès',
            materiau: deletedMateriau
        });

    } catch (error) {
        console.error('❌ Erreur lors de la suppression du matériau:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les matériaux avec stock faible
 */
const getLowStockMateriaux = async (req, res) => {
    try {
        const { depot_id } = req.query;

        const materiaux = await Materiau.getLowStock(depot_id);

        console.log(`⚠️ ${materiaux.length} matériaux avec stock faible`);

        res.json({
            success: true,
            message: 'Matériaux avec stock faible récupérés',
            materiaux,
            total: materiaux.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des stocks faibles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

/**
 * Obtenir les catégories
 */
const getCategories = async (req, res) => {
    try {
        const { depot_id } = req.query;

        const categories = await Categorie.getAll(depot_id);

        console.log(`📂 ${categories.length} catégories récupérées`);

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
};

module.exports = {
    upload,
    getMateriaux,
    getMateriau,
    createMateriau,
    updateMateriau,
    deleteMateriau,
    getLowStockMateriaux,
    getCategories
};