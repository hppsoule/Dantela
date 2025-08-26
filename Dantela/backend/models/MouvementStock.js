/**
 * Modèle MouvementStock - Gestion des mouvements de stock
 */

const { query } = require('../config/database');

class MouvementStock {
    /**
     * Enregistrer un mouvement de stock
     * @param {Object} mouvementData - Données du mouvement
     * @returns {Object} Mouvement créé
     */
    static async create(mouvementData) {
        const {
            materiau_id,
            type_mouvement,
            quantite,
            utilisateur_id,
            demande_id,
            bon_livraison_id,
            motif,
            description,
            fournisseur,
            numero_facture
        } = mouvementData;

        const client = await require('../config/database').pool.connect();
        
        try {
            await client.query('BEGIN');

            // Obtenir le stock actuel
            const stockResult = await client.query(
                'SELECT stock_actuel FROM materiaux WHERE id = $1',
                [materiau_id]
            );

            if (stockResult.rows.length === 0) {
                throw new Error('Matériau non trouvé');
            }

            const stock_avant = stockResult.rows[0].stock_actuel;
            let stock_apres;

            // Calculer le nouveau stock
            if (type_mouvement === 'entree' || type_mouvement === 'ajustement') {
                stock_apres = stock_avant + Math.abs(quantite);
            } else if (type_mouvement === 'sortie') {
                stock_apres = stock_avant - Math.abs(quantite);
                if (stock_apres < 0) {
                    throw new Error(`Stock insuffisant. Stock actuel: ${stock_avant}, demandé: ${Math.abs(quantite)}`);
                }
            } else {
                stock_apres = stock_avant;
            }

            // Enregistrer le mouvement
            const mouvementSql = `
                INSERT INTO mouvements_stock (
                    materiau_id, type_mouvement, quantite, stock_avant, stock_apres,
                    utilisateur_id, demande_id, bon_livraison_id, motif, description,
                    fournisseur, numero_facture
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const mouvementResult = await client.query(mouvementSql, [
                materiau_id,
                type_mouvement,
                type_mouvement === 'sortie' ? -Math.abs(quantite) : Math.abs(quantite),
                stock_avant,
                stock_apres,
                utilisateur_id,
                demande_id || null,
                bon_livraison_id || null,
                motif,
                description,
                fournisseur || null,
                numero_facture || null
            ]);

            // Mettre à jour le stock du matériau
            if (type_mouvement !== 'inventaire') {
                await client.query(
                    'UPDATE materiaux SET stock_actuel = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [stock_apres, materiau_id]
                );
            }

            await client.query('COMMIT');
            return mouvementResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtenir tous les mouvements de stock
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} Liste des mouvements
     */
    static async getAll(filters = {}) {
        let sql = `
            SELECT 
                ms.*,
                m.nom as materiau_nom,
                m.code_produit,
                m.unite,
                c.nom as categorie_nom,
                u.nom || ' ' || u.prenom as utilisateur_nom,
                u.role as utilisateur_role,
                dm.numero_demande,
                bl.numero_bon
            FROM mouvements_stock ms
            LEFT JOIN materiaux m ON ms.materiau_id = m.id
            LEFT JOIN categories c ON m.categorie_id = c.id
            LEFT JOIN users u ON ms.utilisateur_id = u.id
            LEFT JOIN demandes_materiaux dm ON ms.demande_id = dm.id
            LEFT JOIN bons_livraison bl ON ms.bon_livraison_id = bl.id
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.materiau_id) {
            paramCount++;
            conditions.push(`ms.materiau_id = $${paramCount}`);
            values.push(filters.materiau_id);
        }

        if (filters.type_mouvement) {
            paramCount++;
            conditions.push(`ms.type_mouvement = $${paramCount}`);
            values.push(filters.type_mouvement);
        }

        if (filters.utilisateur_id) {
            paramCount++;
            conditions.push(`ms.utilisateur_id = $${paramCount}`);
            values.push(filters.utilisateur_id);
        }

        if (filters.date_debut) {
            paramCount++;
            conditions.push(`ms.created_at >= $${paramCount}`);
            values.push(filters.date_debut);
        }

        if (filters.date_fin) {
            paramCount++;
            conditions.push(`ms.created_at <= $${paramCount}`);
            values.push(filters.date_fin);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`m.depot_id = $${paramCount}`);
            values.push(filters.depot_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY ms.created_at DESC';

        if (filters.limit) {
            paramCount++;
            sql += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir un mouvement par ID
     * @param {string} id - ID du mouvement
     * @returns {Object|null} Mouvement trouvé
     */
    static async findById(id) {
        const sql = `
            SELECT 
                ms.*,
                m.nom as materiau_nom,
                m.code_produit,
                m.unite,
                c.nom as categorie_nom,
                u.nom || ' ' || u.prenom as utilisateur_nom,
                u.role as utilisateur_role,
                dm.numero_demande,
                bl.numero_bon
            FROM mouvements_stock ms
            LEFT JOIN materiaux m ON ms.materiau_id = m.id
            LEFT JOIN categories c ON m.categorie_id = c.id
            LEFT JOIN users u ON ms.utilisateur_id = u.id
            LEFT JOIN demandes_materiaux dm ON ms.demande_id = dm.id
            LEFT JOIN bons_livraison bl ON ms.bon_livraison_id = bl.id
            WHERE ms.id = $1
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir les statistiques des mouvements
     * @param {Object} filters - Filtres optionnels
     * @returns {Object} Statistiques
     */
    static async getStats(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_mouvements,
                COUNT(CASE WHEN type_mouvement = 'entree' THEN 1 END) as entrees,
                COUNT(CASE WHEN type_mouvement = 'sortie' THEN 1 END) as sorties,
                COUNT(CASE WHEN type_mouvement = 'ajustement' THEN 1 END) as ajustements,
                SUM(CASE WHEN type_mouvement = 'entree' THEN quantite ELSE 0 END) as total_entrees,
                SUM(CASE WHEN type_mouvement = 'sortie' THEN ABS(quantite) ELSE 0 END) as total_sorties,
                COUNT(DISTINCT materiau_id) as materiaux_concernes,
                COUNT(DISTINCT utilisateur_id) as utilisateurs_actifs
            FROM mouvements_stock ms
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.date_debut) {
            paramCount++;
            conditions.push(`ms.created_at >= $${paramCount}`);
            values.push(filters.date_debut);
        }

        if (filters.date_fin) {
            paramCount++;
            conditions.push(`ms.created_at <= $${paramCount}`);
            values.push(filters.date_fin);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`EXISTS (SELECT 1 FROM materiaux m WHERE m.id = ms.materiau_id AND m.depot_id = $${paramCount})`);
            values.push(filters.depot_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir l'historique d'un matériau
     * @param {string} materiau_id - ID du matériau
     * @param {Object} options - Options de pagination
     * @returns {Array} Historique des mouvements
     */
    static async getHistoryByMateriau(materiau_id, options = {}) {
        const { limit = 50, offset = 0 } = options;

        const sql = `
            SELECT 
                ms.*,
                u.nom || ' ' || u.prenom as utilisateur_nom,
                u.role as utilisateur_role,
                dm.numero_demande,
                bl.numero_bon
            FROM mouvements_stock ms
            LEFT JOIN users u ON ms.utilisateur_id = u.id
            LEFT JOIN demandes_materiaux dm ON ms.demande_id = dm.id
            LEFT JOIN bons_livraison bl ON ms.bon_livraison_id = bl.id
            WHERE ms.materiau_id = $1
            ORDER BY ms.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        try {
            const result = await query(sql, [materiau_id, limit, offset]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = MouvementStock;