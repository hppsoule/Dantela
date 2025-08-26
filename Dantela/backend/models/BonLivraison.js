/**
 * Modèle BonLivraison - Gestion des bons de livraison
 */

const { query } = require('../config/database');

class BonLivraison {
    /**
     * Créer un nouveau bon de livraison
     * @param {Object} bonData - Données du bon de livraison
     * @returns {Object} Bon de livraison créé
     */
    static async create(bonData) {
        const {
            demande_id,
            destinataire_id,
            destinataire_custom,
            magazinier_id,
            depot_id,
            type_livraison,
            commentaire,
            items
        } = bonData;

        const client = await require('../config/database').pool.connect();
        
        try {
            await client.query('BEGIN');

            // Générer le numéro de bon
            const numeroResult = await client.query('SELECT generate_numero_bon() as numero');
            const numero_bon = numeroResult.rows[0].numero;

            // Créer le bon de livraison
            const bonSql = `
                INSERT INTO bons_livraison (
                    numero_bon, demande_id, destinataire_id, magazinier_id,
                    depot_id, type_livraison, commentaire, destinataire_custom
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const bonResult = await client.query(bonSql, [
                numero_bon,
                demande_id || null,
                destinataire_id,
                magazinier_id,
                depot_id,
                type_livraison || 'commande',
                commentaire,
                destinataire_custom ? JSON.stringify(destinataire_custom) : null
            ]);

            const bon = bonResult.rows[0];

            // Ajouter les items et mettre à jour les stocks
            if (items && items.length > 0) {
                // Récupérer les informations complètes des matériaux
                const materiauInfoSql = `
                    SELECT id, nom, code_produit, unite, stock_actuel 
                    FROM materiaux WHERE id = $1
                `;

                const itemSql = `
                    INSERT INTO bon_items (bon_livraison_id, materiau_id, quantite)
                    VALUES ($1, $2, $3)
                `;

                const mouvementSql = `
                    INSERT INTO mouvements_stock (
                        materiau_id, type_mouvement, quantite, stock_avant, stock_apres,
                        utilisateur_id, demande_id, bon_livraison_id, motif, description
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `;

                const updateStockSql = `
                    UPDATE materiaux 
                    SET stock_actuel = stock_actuel - $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING stock_actuel
                `;

                for (const item of items) {
                    // Récupérer les informations complètes du matériau
                    const materiauResult = await client.query(materiauInfoSql, [item.materiau_id]);

                    if (materiauResult.rows.length === 0) {
                        throw new Error(`Matériau non trouvé: ${item.materiau_id}`);
                    }

                    const materiau = materiauResult.rows[0];
                    const stockAvant = materiau.stock_actuel;

                    if (stockAvant < item.quantite) {
                        throw new Error(`Stock insuffisant pour ${materiau.nom} (${materiau.code_produit}). Stock disponible: ${stockAvant} ${materiau.unite}, demandé: ${item.quantite} ${materiau.unite}`);
                    }

                    // Ajouter l'item au bon
                    await client.query(itemSql, [bon.id, item.materiau_id, item.quantite]);

                    // Mettre à jour le stock
                    const updateResult = await client.query(updateStockSql, [item.quantite, item.materiau_id]);
                    const stockApres = updateResult.rows[0].stock_actuel;

                    // Enregistrer le mouvement de stock
                    await client.query(mouvementSql, [
                        item.materiau_id,
                        'sortie',
                        -Math.abs(item.quantite), // Négatif pour sortie
                        stockAvant,
                        stockApres,
                        magazinier_id,
                        demande_id || null,
                        bon.id,
                        type_livraison === 'directe' ? 'Distribution directe' : 'Livraison commande',
                        `Bon de livraison ${numero_bon} - ${materiau.nom} (${materiau.code_produit}): ${item.quantite} ${materiau.unite}`
                    ]);

                    console.log(`✅ Item ajouté au bon: ${materiau.nom} - ${item.quantite} ${materiau.unite} (Stock: ${stockAvant} → ${stockApres})`);
                }
            }

            await client.query('COMMIT');
            return bon;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtenir tous les bons de livraison
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} Liste des bons de livraison
     */
    static async getAll(filters = {}) {
        let sql = `
            SELECT 
                bl.*,
                u_destinataire.nom || ' ' || u_destinataire.prenom as destinataire_nom,
                u_destinataire.role as destinataire_role,
                u_destinataire.nom_chantier,
                u_magazinier.nom || ' ' || u_magazinier.prenom as magazinier_nom,
                d.nom as depot_nom,
                dm.numero_demande,
                COUNT(bi.id) as nombre_items,
                SUM(bi.quantite) as total_quantite
            FROM bons_livraison bl
            LEFT JOIN users u_destinataire ON bl.destinataire_id = u_destinataire.id
            LEFT JOIN users u_magazinier ON bl.magazinier_id = u_magazinier.id
            LEFT JOIN depots d ON bl.depot_id = d.id
            LEFT JOIN demandes_materiaux dm ON bl.demande_id = dm.id
            LEFT JOIN bon_items bi ON bl.id = bi.bon_livraison_id
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.destinataire_id) {
            paramCount++;
            conditions.push(`bl.destinataire_id = $${paramCount}`);
            values.push(filters.destinataire_id);
        }

        if (filters.magazinier_id) {
            paramCount++;
            conditions.push(`bl.magazinier_id = $${paramCount}`);
            values.push(filters.magazinier_id);
        }

        if (filters.statut) {
            paramCount++;
            conditions.push(`bl.statut = $${paramCount}`);
            values.push(filters.statut);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`bl.depot_id = $${paramCount}`);
            values.push(filters.depot_id);
        }

        if (filters.type_livraison) {
            paramCount++;
            conditions.push(`bl.type_livraison = $${paramCount}`);
            values.push(filters.type_livraison);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += `
            GROUP BY bl.id, u_destinataire.id, u_magazinier.id, d.id, dm.id
            ORDER BY bl.created_at DESC
        `;

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir un bon de livraison par ID avec ses items
     * @param {string} id - ID du bon de livraison
     * @returns {Object|null} Bon de livraison avec items
     */
    static async findById(id) {
        const bonSql = `
            SELECT 
                bl.*,
                u_destinataire.nom || ' ' || u_destinataire.prenom as destinataire_nom,
                u_destinataire.role as destinataire_role,
                u_destinataire.nom_chantier,
                u_destinataire.email as destinataire_email,
                u_destinataire.telephone as destinataire_telephone,
                u_destinataire.adresse as destinataire_adresse,
                u_magazinier.nom || ' ' || u_magazinier.prenom as magazinier_nom,
                d.nom as depot_nom,
                d.adresse as depot_adresse,
                dm.numero_demande
            FROM bons_livraison bl
            LEFT JOIN users u_destinataire ON bl.destinataire_id = u_destinataire.id
            LEFT JOIN users u_magazinier ON bl.magazinier_id = u_magazinier.id
            LEFT JOIN depots d ON bl.depot_id = d.id
            LEFT JOIN demandes_materiaux dm ON bl.demande_id = dm.id
            WHERE bl.id = $1
        `;

        const itemsSql = `
            SELECT 
                bi.*,
                m.nom as materiau_nom,
                m.code_produit,
                m.unite,
                m.stock_actuel,
                c.nom as categorie_nom
            FROM bon_items bi
           INNER JOIN materiaux m ON bi.materiau_id = m.id
            LEFT JOIN categories c ON m.categorie_id = c.id
            WHERE bi.bon_livraison_id = $1
            ORDER BY m.nom
        `;

        try {
            const bonResult = await query(bonSql, [id]);
            if (bonResult.rows.length === 0) {
               console.log('❌ Bon de livraison non trouvé:', id);
                return null;
            }

            const bon = bonResult.rows[0];
           console.log('📋 Bon trouvé:', bon.numero_bon);
            
            const itemsResult = await query(itemsSql, [id]);
            bon.items = itemsResult.rows;
           
           console.log('📦 Items récupérés pour le bon:', {
               bon_id: id,
               numero_bon: bon.numero_bon,
               nombre_items: itemsResult.rows.length,
               items: itemsResult.rows.map(item => ({
                   nom: item.materiau_nom,
                   code: item.code_produit,
                   quantite: item.quantite,
                   unite: item.unite
               }))
           });

            return bon;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mettre à jour le statut d'un bon de livraison
     * @param {string} id - ID du bon de livraison
     * @param {string} statut - Nouveau statut
     * @param {Object} additionalData - Données supplémentaires
     * @returns {Object} Bon de livraison mis à jour
     */
    static async updateStatus(id, statut, additionalData = {}) {
        const { signature_destinataire, commentaire } = additionalData;

        let sql = `
            UPDATE bons_livraison 
            SET statut = $1, updated_at = CURRENT_TIMESTAMP
        `;
        
        const values = [statut, id];
        let paramCount = 1;

        if (statut === 'livree') {
            paramCount++;
            sql += `, date_livraison = CURRENT_TIMESTAMP`;
        }

        if (signature_destinataire) {
            paramCount++;
            sql += `, signature_destinataire = $${paramCount}`;
            values.splice(-1, 0, signature_destinataire);
        }

        if (commentaire) {
            paramCount++;
            sql += `, commentaire = $${paramCount}`;
            values.splice(-1, 0, commentaire);
        }

        sql += ` WHERE id = $${paramCount + 1} RETURNING *`;

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir les statistiques des bons de livraison
     * @param {Object} filters - Filtres optionnels
     * @returns {Object} Statistiques
     */
    static async getStats(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut = 'en_preparation' THEN 1 END) as en_preparation,
                COUNT(CASE WHEN statut = 'prete' THEN 1 END) as pretes,
                COUNT(CASE WHEN statut = 'livree' THEN 1 END) as livrees,
                COUNT(CASE WHEN statut = 'annulee' THEN 1 END) as annulees,
                COUNT(CASE WHEN type_livraison = 'directe' THEN 1 END) as directes,
                COUNT(CASE WHEN type_livraison = 'commande' THEN 1 END) as commandes
            FROM bons_livraison
        `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.magazinier_id) {
            paramCount++;
            conditions.push(`magazinier_id = $${paramCount}`);
            values.push(filters.magazinier_id);
        }

        if (filters.depot_id) {
            paramCount++;
            conditions.push(`depot_id = $${paramCount}`);
            values.push(filters.depot_id);
        }

        if (filters.date_debut) {
            paramCount++;
            conditions.push(`date_preparation >= $${paramCount}`);
            values.push(filters.date_debut);
        }

        if (filters.date_fin) {
            paramCount++;
            conditions.push(`date_preparation <= $${paramCount}`);
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

module.exports = BonLivraison;