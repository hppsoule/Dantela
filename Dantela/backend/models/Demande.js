/**
 * Modèle Demande - Gestion des demandes de matériaux
 */

const { query } = require('../config/database');

class Demande {
    /**
     * Créer une nouvelle demande
     * @param {Object} demandeData - Données de la demande
     * @returns {Object} Demande créée
     */
    static async create(demandeData) {
        const {
            demandeur_id,
            depot_id,
            priorite,
            commentaire_demandeur,
            date_livraison_souhaitee,
            items
        } = demandeData;

        const client = await require('../config/database').pool.connect();
        
        try {
            await client.query('BEGIN');

            // Générer le numéro de demande
            const numeroResult = await client.query('SELECT generate_numero_demande() as numero');
            const numero_demande = numeroResult.rows[0].numero;

            // Créer la demande
            const demandeSql = `
                INSERT INTO demandes_materiaux (
                    numero_demande, demandeur_id, depot_id, priorite,
                    commentaire_demandeur, date_livraison_souhaitee
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const demandeResult = await client.query(demandeSql, [
                numero_demande,
                demandeur_id,
                depot_id,
                priorite || 'normale',
                commentaire_demandeur,
                date_livraison_souhaitee
            ]);

            const demande = demandeResult.rows[0];

            // Ajouter les items
            if (items && items.length > 0) {
                const itemsSql = `
                    INSERT INTO demande_items (demande_id, materiau_id, quantite_demandee, commentaire)
                    VALUES ($1, $2, $3, $4)
                `;

                for (const item of items) {
                    await client.query(itemsSql, [
                        demande.id,
                        item.materiau_id,
                        item.quantite_demandee,
                        item.commentaire || null
                    ]);
                }
            }

            await client.query('COMMIT');
            return demande;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtenir toutes les demandes avec détails
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} Liste des demandes
     */
    static async getAll(filters = {}) {
        let sql = `
            SELECT 
                dm.*,
                u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
                u_demandeur.role as demandeur_role,
                u_demandeur.nom_chantier,
                u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
                d.nom as depot_nom,
                COUNT(di.id) as nombre_items,
                SUM(di.quantite_demandee) as total_quantite_demandee,
                SUM(di.quantite_accordee) as total_quantite_accordee
            FROM demandes_materiaux dm
            LEFT JOIN users u_demandeur ON dm.demandeur_id = u_demandeur.id
            LEFT JOIN users u_valideur ON dm.validee_par = u_valideur.id
            LEFT JOIN depots d ON dm.depot_id = d.id
            LEFT JOIN demande_items di ON dm.id = di.demande_id
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.demandeur_id) {
            paramCount++;
            conditions.push(`dm.demandeur_id = $${paramCount}`);
            values.push(filters.demandeur_id);
        }

        if (filters.statut) {
            paramCount++;
            conditions.push(`dm.statut = $${paramCount}`);
            values.push(filters.statut);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`dm.depot_id = $${paramCount}`);
            values.push(filters.depot_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += `
            GROUP BY dm.id, u_demandeur.id, u_valideur.id, d.id
            ORDER BY dm.created_at DESC
        `;

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir une demande par ID avec ses items
     * @param {string} id - ID de la demande
     * @returns {Object|null} Demande avec items
     */
    static async findById(id) {
        const demandeSql = `
            SELECT 
                dm.*,
                u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
                u_demandeur.role as demandeur_role,
                u_demandeur.nom_chantier,
                u_demandeur.email as demandeur_email,
                u_demandeur.telephone as demandeur_telephone,
                u_demandeur.adresse as demandeur_adresse,
                u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
                d.nom as depot_nom
            FROM demandes_materiaux dm
            LEFT JOIN users u_demandeur ON dm.demandeur_id = u_demandeur.id
            LEFT JOIN users u_valideur ON dm.validee_par = u_valideur.id
            LEFT JOIN depots d ON dm.depot_id = d.id
            WHERE dm.id = $1
        `;

        const itemsSql = `
            SELECT 
                di.*,
                m.nom as materiau_nom,
                m.code_produit,
                m.unite,
                m.stock_actuel,
                c.nom as categorie_nom
            FROM demande_items di
            LEFT JOIN materiaux m ON di.materiau_id = m.id
            LEFT JOIN categories c ON m.categorie_id = c.id
            WHERE di.demande_id = $1
            ORDER BY m.nom
        `;

        try {
            const demandeResult = await query(demandeSql, [id]);
            if (demandeResult.rows.length === 0) {
                return null;
            }

            const demande = demandeResult.rows[0];
            
            const itemsResult = await query(itemsSql, [id]);
            demande.items = itemsResult.rows;

            return demande;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Valider une demande (approuver/rejeter)
     * @param {string} id - ID de la demande
     * @param {Object} validationData - Données de validation
     * @returns {Object} Demande mise à jour
     */
    static async validate(id, validationData) {
        const {
            statut,
            commentaire_magazinier,
            validee_par,
            items_accordes
        } = validationData;

        const client = await require('../config/database').pool.connect();
        
        try {
            await client.query('BEGIN');

            // Mettre à jour la demande
            const demandeSql = `
                UPDATE demandes_materiaux 
                SET 
                    statut = $1,
                    commentaire_magazinier = $2,
                    validee_par = $3,
                    date_validation = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `;

            const demandeResult = await client.query(demandeSql, [
                statut,
                commentaire_magazinier,
                validee_par,
                id
            ]);

            // Mettre à jour les quantités accordées si approuvée
            if (statut === 'approuvee' && items_accordes) {
                for (const item of items_accordes) {
                    const itemSql = `
                        UPDATE demande_items 
                        SET quantite_accordee = $1
                        WHERE id = $2
                    `;
                    await client.query(itemSql, [item.quantite_accordee, item.id]);
                }
            }

            await client.query('COMMIT');
            return demandeResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Mettre à jour le statut d'une demande
     * @param {string} id - ID de la demande
     * @param {string} statut - Nouveau statut
     * @returns {Object} Demande mise à jour
     */
    static async updateStatus(id, statut) {
        const sql = `
            UPDATE demandes_materiaux 
            SET statut = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        try {
            const result = await query(sql, [statut, id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir les statistiques des demandes
     * @param {Object} filters - Filtres optionnels
     * @returns {Object} Statistiques
     */
    static async getStats(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut = 'approuvee' THEN 1 END) as approuvees,
                COUNT(CASE WHEN statut = 'rejetee' THEN 1 END) as rejetees,
                COUNT(CASE WHEN statut = 'en_preparation' THEN 1 END) as en_preparation,
                COUNT(CASE WHEN statut = 'livree' THEN 1 END) as livrees,
                COUNT(CASE WHEN priorite = 'urgente' THEN 1 END) as urgentes
            FROM demandes_materiaux
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.demandeur_id) {
            paramCount++;
            conditions.push(`demandeur_id = $${paramCount}`);
            values.push(filters.demandeur_id);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`depot_id = $${paramCount}`);
            values.push(filters.depot_id);
        }

        if (filters.date_debut) {
            paramCount++;
            conditions.push(`date_demande >= $${paramCount}`);
            values.push(filters.date_debut);
        }

        if (filters.date_fin) {
            paramCount++;
            conditions.push(`date_demande <= $${paramCount}`);
            values.push(filters.date_fin);
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
}

module.exports = Demande;