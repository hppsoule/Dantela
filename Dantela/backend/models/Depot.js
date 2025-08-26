/**
 * Modèle Depot - Gestion des dépôts
 * Création et attribution des dépôts aux magaziniers
 */

const { query } = require('../config/database');

class Depot {
    /**
     * Créer un nouveau dépôt
     * @param {Object} depotData - Données du dépôt
     * @returns {Object} Dépôt créé
     */
    static async create(depotData) {
        const {
            nom,
            adresse,
            description,
            directeur_id,
            magazinier_id
        } = depotData;

        const sql = `
            INSERT INTO depots (
                nom, adresse, description, directeur_id, magazinier_id, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nom, adresse, description, directeur_id, magazinier_id, is_active, created_at
        `;

        const values = [
            nom,
            adresse,
            description || null,
            directeur_id,
            magazinier_id || null,
            true
        ];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir tous les dépôts avec informations des utilisateurs
     * @returns {Array} Liste des dépôts
     */
    static async getAll() {
        const sql = `
            SELECT 
                d.id, d.nom, d.adresse, d.description, d.is_active, d.created_at,
                dir.nom as directeur_nom, dir.prenom as directeur_prenom,
                mag.nom as magazinier_nom, mag.prenom as magazinier_prenom,
                mag.email as magazinier_email
            FROM depots d
            LEFT JOIN users dir ON d.directeur_id = dir.id
            LEFT JOIN users mag ON d.magazinier_id = mag.id
            ORDER BY d.created_at DESC
        `;

        try {
            const result = await query(sql);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir un dépôt par ID
     * @param {string} id - ID du dépôt
     * @returns {Object|null} Dépôt trouvé ou null
     */
    static async findById(id) {
        const sql = `
            SELECT 
                d.id, d.nom, d.adresse, d.description, d.is_active, d.created_at,
                dir.nom as directeur_nom, dir.prenom as directeur_prenom,
                mag.nom as magazinier_nom, mag.prenom as magazinier_prenom,
                mag.email as magazinier_email
            FROM depots d
            LEFT JOIN users dir ON d.directeur_id = dir.id
            LEFT JOIN users mag ON d.magazinier_id = mag.id
            WHERE d.id = $1
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Attribuer un magazinier à un dépôt
     * @param {string} depotId - ID du dépôt
     * @param {string} magazinierId - ID du magazinier
     * @returns {Object} Dépôt mis à jour
     */
    static async assignMagazinier(depotId, magazinierId) {
        const sql = `
            UPDATE depots 
            SET magazinier_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, nom, adresse, magazinier_id, updated_at
        `;

        try {
            const result = await query(sql, [magazinierId, depotId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mettre à jour un dépôt
     * @param {string} id - ID du dépôt
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} Dépôt mis à jour
     */
    static async update(id, updateData) {
        const { nom, adresse, description, magazinier_id } = updateData;
        
        const sql = `
            UPDATE depots 
            SET nom = $1, adresse = $2, description = $3, magazinier_id = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING id, nom, adresse, description, magazinier_id, is_active, updated_at
        `;

        try {
            const result = await query(sql, [nom, adresse, description, magazinier_id, id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Supprimer un dépôt (avec vérifications de sécurité)
     * @param {string} id - ID du dépôt
     * @returns {Object} Dépôt supprimé
     */
    static async deleteDepot(id) {
        // Vérifier s'il y a des matériaux associés
        const materiauxResult = await query(
            'SELECT COUNT(*) as count FROM materiaux WHERE depot_id = $1',
            [id]
        );
        const nombreMateriaux = parseInt(materiauxResult.rows[0].count);

        if (nombreMateriaux > 0) {
            throw new Error(`Impossible de supprimer ce dépôt. Il contient ${nombreMateriaux} matériau(x). Veuillez d'abord transférer ou supprimer les matériaux.`);
        }

        // Vérifier s'il y a des demandes associées
        const demandesResult = await query(
            'SELECT COUNT(*) as count FROM demandes_materiaux WHERE depot_id = $1',
            [id]
        );
        const nombreDemandes = parseInt(demandesResult.rows[0].count);

        if (nombreDemandes > 0) {
            throw new Error(`Impossible de supprimer ce dépôt. Il a ${nombreDemandes} demande(s) associée(s). Veuillez d'abord traiter ou transférer les demandes.`);
        }

        // Suppression sécurisée
        const sql = `
            DELETE FROM depots 
            WHERE id = $1
            RETURNING id, nom, adresse, description, is_active
        `;

        try {
            const result = await query(sql, [id]);
            if (result.rows.length === 0) {
                throw new Error('Dépôt non trouvé');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Désactiver un dépôt (soft delete)
     * @param {string} id - ID du dépôt
     * @returns {Object} Dépôt désactivé
     */
    static async deactivateDepot(id) {
        const sql = `
            UPDATE depots 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, nom, adresse, description, is_active, updated_at
        `;

        try {
            const result = await query(sql, [id]);
            if (result.rows.length === 0) {
                throw new Error('Dépôt non trouvé');
            }
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Depot;