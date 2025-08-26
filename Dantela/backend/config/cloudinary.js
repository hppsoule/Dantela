/**
 * Configuration Cloudinary pour l'upload d'images
 */

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload d'image vers Cloudinary
 * @param {string} filePath - Chemin du fichier à uploader
 * @param {string} folder - Dossier de destination sur Cloudinary
 * @returns {Promise} Résultat de l'upload
 */
const uploadImage = async (filePath, folder = 'dantela/materiaux') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
            ]
        });
        return result;
    } catch (error) {
        console.error('❌ Erreur upload Cloudinary:', error);
        throw error;
    }
};

/**
 * Suppression d'image de Cloudinary
 * @param {string} publicId - ID public de l'image à supprimer
 * @returns {Promise} Résultat de la suppression
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('❌ Erreur suppression Cloudinary:', error);
        throw error;
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage
};