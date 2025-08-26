/**
 * Modèle Materiau - Gestion des matériaux de construction
 */

const { query } = require('../config/database');

class Materiau {
    /**
     * Créer un nouveau matériau
     * @param {Object} materiauData - Données du matériau
     * @returns {Object} Matériau créé
     */
    static async create(materiauData) {
        const {
            code_produit,
            nom,
            description,
            unite,
            stock_actuel,
            stock_minimum,
            fournisseur,
            categorie_id,
            depot_id,
            image_url,
            image_public_id
        } = materiauData;

        const sql = `
            INSERT INTO materiaux (
                code_produit, nom, description, unite,
                stock_actuel, stock_minimum, fournisseur, categorie_id, 
                depot_id, image_url, image_public_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            code_produit,
            nom,
            description || null,
            unite,
            stock_actuel || 0,
            stock_minimum || 0,
            fournisseur || null,
            categorie_id,
            depot_id,
            image_url || null,
            image_public_id || null
        ];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('Un matériau avec ce code produit existe déjà');
            }
            throw error;
        }
    }

    /**
     * Obtenir tous les matériaux avec informations des catégories
     * @param {string} depotId - ID du dépôt (optionnel)
     * @returns {Array} Liste des matériaux
     */
    static async getAll(depotId = null) {
        let sql = `
            SELECT 
                m.*,
                c.nom as categorie_nom,
                c.description as categorie_description
            FROM materiaux m
            LEFT JOIN categories c ON m.categorie_id = c.id
        `;
        
        const values = [];
        
        if (depotId) {
            sql += ' WHERE m.depot_id = $1';
            values.push(depotId);
        }
        
        sql += ' ORDER BY m.created_at DESC';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir un matériau par ID
     * @param {string} id - ID du matériau
     * @returns {Object|null} Matériau trouvé ou null
     */
    static async findById(id) {
        const sql = `
            SELECT 
                m.*,
                c.nom as categorie_nom,
                c.description as categorie_description
            FROM materiaux m
            LEFT JOIN categories c ON m.categorie_id = c.id
            WHERE m.id = $1
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mettre à jour un matériau
     * @param {string} id - ID du matériau
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} Matériau mis à jour
     */
    static async update(id, updateData) {
        const {
            code_produit,
            nom,
            description,
            unite,
            stock_actuel,
            stock_minimum,
            fournisseur,
            categorie_id,
            image_url,
            image_public_id
        } = updateData;

        const sql = `
            UPDATE materiaux 
            SET 
                code_produit = $1,
                nom = $2,
                description = $3,
                unite = $4,
                stock_actuel = $5,
                stock_minimum = $6,
                fournisseur = $7,
                categorie_id = $8,
                image_url = $9,
                image_public_id = $10,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING *
        `;

        const values = [
            code_produit,
            nom,
            description,
            unite,
            stock_actuel,
            stock_minimum,
            fournisseur,
            categorie_id,
            image_url,
            image_public_id,
            id
        ];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Supprimer un matériau
     * @param {string} id - ID du matériau
     * @returns {Object} Matériau supprimé
     */
    static async delete(id) {
        const sql = `
            DELETE FROM materiaux 
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

    /**
     * Rechercher des matériaux
     * @param {string} searchTerm - Terme de recherche
     * @param {string} depotId - ID du dépôt (optionnel)
     * @returns {Array} Liste des matériaux trouvés
     */
    static async search(searchTerm, depotId = null) {
        let sql = `
            SELECT 
                m.*,
                c.nom as categorie_nom
            FROM materiaux m
            LEFT JOIN categories c ON m.categorie_id = c.id
            WHERE (
                LOWER(m.nom) LIKE LOWER($1) OR 
                LOWER(m.description) LIKE LOWER($1) OR
                LOWER(m.code_produit) LIKE LOWER($1)
            )
        `;
        
        const values = [`%${searchTerm}%`];
        
        if (depotId) {
            sql += ' AND m.depot_id = $2';
            values.push(depotId);
        }
        
        sql += ' ORDER BY m.created_at DESC';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir les matériaux avec stock faible
     * @param {string} depotId - ID du dépôt (optionnel)
     * @returns {Array} Liste des matériaux avec stock faible
     */
    static async getLowStock(depotId = null) {
        let sql = `
            SELECT 
                m.*,
                c.nom as categorie_nom
            FROM materiaux m
            LEFT JOIN categories c ON m.categorie_id = c.id
            WHERE m.stock_actuel <= m.stock_minimum
        `;
        
        const values = [];
        
        if (depotId) {
            sql += ' AND m.depot_id = $1';
            values.push(depotId);
        }
        
        sql += ' ORDER BY (m.stock_actuel::float / NULLIF(m.stock_minimum, 0)) ASC';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Materiau;