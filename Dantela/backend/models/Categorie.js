/**
 * Modèle Categorie - Gestion des catégories de matériaux
 */

const { query } = require('../config/database');

class Categorie {
    /**
     * Créer une nouvelle catégorie
     * @param {Object} categorieData - Données de la catégorie
     * @returns {Object} Catégorie créée
     */
    static async create(categorieData) {
        const { nom, description, depot_id } = categorieData;

        const sql = `
            INSERT INTO categories (nom, description, depot_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [nom, description || null, depot_id];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir toutes les catégories
     * @param {string} depotId - ID du dépôt (optionnel)
     * @returns {Array} Liste des catégories
     */
    static async getAll(depotId = null) {
        let sql = `
            SELECT c.*, COUNT(m.id) as materiaux_count
            FROM categories c
            LEFT JOIN materiaux m ON c.id = m.categorie_id
        `;
        
        const values = [];
        
        if (depotId) {
            sql += ' WHERE c.depot_id = $1';
            values.push(depotId);
        }
        
        sql += ' GROUP BY c.id ORDER BY c.nom';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir une catégorie par ID
     * @param {string} id - ID de la catégorie
     * @returns {Object|null} Catégorie trouvée ou null
     */
    static async findById(id) {
        const sql = `
            SELECT * FROM categories WHERE id = $1
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mettre à jour une catégorie
     * @param {string} id - ID de la catégorie
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} Catégorie mise à jour
     */
    static async update(id, updateData) {
        const { nom, description } = updateData;

        const sql = `
            UPDATE categories 
            SET nom = $1, description = $2
            WHERE id = $3
            RETURNING *
        `;

        try {
            const result = await query(sql, [nom, description, id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Supprimer une catégorie
     * @param {string} id - ID de la catégorie
     * @returns {Object} Catégorie supprimée
     */
    static async delete(id) {
        const sql = `
            DELETE FROM categories 
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Categorie;