/**
 * Modèle User - Module d'authentification
 * Gestion des utilisateurs (Directeur, Magazinier, Chef de chantier)
 */

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Créer un nouvel utilisateur
     * @param {Object} userData - Données de l'utilisateur
     * @returns {Object} Utilisateur créé
     */
    static async create(userData) {
        const {
            email,
            password,
            nom,
            prenom,
            telephone,
            adresse,
            role,
            nom_chantier
        } = userData;

        // Hachage du mot de passe
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const sql = `
            INSERT INTO users (
                email, password_hash, nom, prenom, telephone, 
                adresse, role, nom_chantier, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, email, nom, prenom, telephone, adresse, role, nom_chantier, is_active, created_at
        `;

        const values = [
            email,
            password_hash,
            nom,
            prenom,
            telephone || null,
            adresse || null,
            role,
            nom_chantier || null,
            false // Les comptes sont inactifs par défaut (sauf directeur)
        ];

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Violation de contrainte unique
                throw new Error('Un utilisateur avec cet email existe déjà');
            }
            throw error;
        }
    }

    /**
     * Trouver un utilisateur par email
     * @param {string} email - Email de l'utilisateur
     * @returns {Object|null} Utilisateur trouvé ou null
     */
    static async findByEmail(email) {
        const sql = `
            SELECT id, email, password_hash, nom, prenom, telephone, 
                   adresse, role, nom_chantier, is_active, created_at, updated_at
            FROM users 
            WHERE email = $1
        `;

        try {
            const result = await query(sql, [email]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Trouver un utilisateur par ID
     * @param {string} id - ID de l'utilisateur
     * @returns {Object|null} Utilisateur trouvé ou null
     */
    static async findById(id) {
        const sql = `
            SELECT id, email, nom, prenom, telephone, adresse, 
                   role, nom_chantier, is_active, created_at, updated_at
            FROM users 
            WHERE id = $1
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Vérifier le mot de passe
     * @param {string} password - Mot de passe en clair
     * @param {string} hash - Hash stocké en base
     * @returns {boolean} True si le mot de passe est correct
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Obtenir tous les utilisateurs en attente d'approbation
     * @returns {Array} Liste des utilisateurs inactifs
     */
    static async getPendingUsers() {
        const sql = `
            SELECT id, email, nom, prenom, telephone, role, nom_chantier, created_at
            FROM users 
            WHERE is_active = false AND role != 'directeur'
            ORDER BY created_at DESC
        `;

        try {
            const result = await query(sql);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Activer/Désactiver un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @param {boolean} isActive - Statut d'activation
     * @returns {Object} Utilisateur mis à jour
     */
    static async updateActiveStatus(id, isActive) {
        const sql = `
            UPDATE users 
            SET is_active = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, email, nom, prenom, role, is_active, updated_at
        `;

        try {
            const result = await query(sql, [isActive, id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir tous les magaziniers actifs
     * @returns {Array} Liste des magaziniers actifs
     */
    static async getActiveMagaziniers() {
        const sql = `
            SELECT id, email, nom, prenom, telephone, created_at
            FROM users 
            WHERE role = 'magazinier' AND is_active = true
            ORDER BY nom, prenom
        `;

        try {
            const result = await query(sql);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir tous les utilisateurs actifs
     * @param {string} role - Rôle spécifique (optionnel)
     * @returns {Array} Liste des utilisateurs actifs
     */
    static async getAllActiveUsers(role = null) {
        let sql = `
            SELECT id, email, nom, prenom, telephone, adresse, role, nom_chantier, 
                   is_active, created_at, updated_at
            FROM users 
            WHERE is_active = true
        `;
        
        const values = [];
        
        if (role) {
            sql += ' AND role = $1';
            values.push(role);
        }
        
        sql += ' ORDER BY role, nom, prenom';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir tous les utilisateurs (actifs et inactifs)
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} Liste de tous les utilisateurs
     */
    static async getAllUsers(filters = {}) {
        let sql = `
            SELECT id, email, nom, prenom, telephone, adresse, role, nom_chantier, 
                   is_active, created_at, updated_at
            FROM users 
            WHERE 1=1
        `;
        
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.role) {
            paramCount++;
            conditions.push(`role = $${paramCount}`);
            values.push(filters.role);
        }

        if (filters.is_active !== undefined) {
            paramCount++;
            conditions.push(`is_active = $${paramCount}`);
            values.push(filters.is_active);
        }

        if (filters.search) {
            paramCount++;
            conditions.push(`(
                LOWER(nom) LIKE LOWER($${paramCount}) OR 
                LOWER(prenom) LIKE LOWER($${paramCount}) OR 
                LOWER(email) LIKE LOWER($${paramCount}) OR
                LOWER(nom_chantier) LIKE LOWER($${paramCount})
            )`);
            values.push(`%${filters.search}%`);
        }

        if (conditions.length > 0) {
            sql += ' AND ' + conditions.join(' AND ');
        }
        
        sql += ' ORDER BY is_active DESC, role, nom, prenom';

        try {
            const result = await query(sql, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Désactiver un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @returns {Object} Utilisateur mis à jour
     */
    static async deactivateUser(id) {
        const sql = `
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND role != 'directeur'
            RETURNING id, email, nom, prenom, role, is_active, updated_at
        `;

        try {
            const result = await query(sql, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Supprimer un utilisateur (soft delete en le désactivant)
     * @param {string} id - ID de l'utilisateur
     * @returns {Object} Utilisateur supprimé
     */
    static async deleteUser(id) {
        // Vérifier d'abord que ce n'est pas le directeur
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.role === 'directeur') {
            throw new Error('Impossible de supprimer le compte directeur');
        }

        // Vérifier s'il y a des données associées
        const { query } = require('../config/database');
        
        // Vérifier demandes créées
        const demandesResult = await query(
            'SELECT COUNT(*) as count FROM demandes_materiaux WHERE demandeur_id = $1',
            [id]
        );
        const nombreDemandes = parseInt(demandesResult.rows[0].count);

        // Vérifier bons de livraison
        const bonsResult = await query(
            'SELECT COUNT(*) as count FROM bons_livraison WHERE destinataire_id = $1 OR magazinier_id = $1',
            [id]
        );
        const nombreBons = parseInt(bonsResult.rows[0].count);

        // Vérifier mouvements de stock
        const mouvementsResult = await query(
            'SELECT COUNT(*) as count FROM mouvements_stock WHERE utilisateur_id = $1',
            [id]
        );
        const nombreMouvements = parseInt(mouvementsResult.rows[0].count);

        // Si l'utilisateur a des données associées, désactiver au lieu de supprimer
        if (nombreDemandes > 0 || nombreBons > 0 || nombreMouvements > 0) {
            const sql = `
                UPDATE users 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND role != 'directeur'
                RETURNING id, email, nom, prenom, role, is_active
            `;
            
            const result = await query(sql, [id]);
            const deactivatedUser = result.rows[0];
            
            // Ajouter des informations sur pourquoi c'est une désactivation
            deactivatedUser.action = 'deactivated';
            deactivatedUser.reason = `Utilisateur désactivé car il a ${nombreDemandes} demande(s), ${nombreBons} bon(s) de livraison et ${nombreMouvements} mouvement(s) de stock associés.`;
            
            return deactivatedUser;
        }

        // Si aucune donnée associée, suppression définitive possible
        const sql = `
            DELETE FROM users 
            WHERE id = $1 AND role != 'directeur'
            RETURNING id, email, nom, prenom, role
        `;

        try {
            const result = await query(sql, [id]);
            const deletedUser = result.rows[0];
            if (deletedUser) {
                deletedUser.action = 'deleted';
                deletedUser.reason = 'Utilisateur supprimé définitivement (aucune donnée associée).';
            }
            return deletedUser;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Désactiver définitivement un utilisateur (soft delete sécurisé)
     * @param {string} id - ID de l'utilisateur
     * @returns {Object} Utilisateur désactivé
     */
    static async safeDeleteUser(id) {
        // Vérifier que l'utilisateur existe
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.role === 'directeur') {
            throw new Error('Impossible de désactiver le compte directeur');
        }

        const sql = `
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND role != 'directeur'
            RETURNING id, email, nom, prenom, role, is_active, updated_at
        `;

        try {
            const result = await query(sql, [id]);
            const deactivatedUser = result.rows[0];
            if (deactivatedUser) {
                deactivatedUser.action = 'deactivated';
                deactivatedUser.reason = 'Utilisateur désactivé de manière sécurisée.';
            }
            return deactivatedUser;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mettre à jour les informations d'un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Object} Utilisateur mis à jour
     */
    static async updateUser(id, updateData) {
        const { nom, prenom, telephone, adresse, nom_chantier, email } = updateData;
        
        // Vérifier que l'utilisateur existe
        const user = await this.findById(id);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        // Validation des données
        if (!nom || !prenom) {
            throw new Error('Le nom et le prénom sont obligatoires');
        }

        // Validation email si modifié
        if (email && email !== user.email) {
            const existingUser = await this.findByEmail(email);
            if (existingUser && existingUser.id !== id) {
                throw new Error('Un utilisateur avec cet email existe déjà');
            }
        }

        // Validation nom_chantier pour chef_chantier
        if (user.role === 'chef_chantier' && !nom_chantier) {
            throw new Error('Le nom du chantier est obligatoire pour les chefs de chantier');
        }
        
        const sql = `
            UPDATE users 
            SET nom = $1, prenom = $2, telephone = $3, adresse = $4, 
                nom_chantier = $5, email = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING id, email, nom, prenom, telephone, adresse, role, nom_chantier, is_active, updated_at
        `;

        try {
            const result = await query(sql, [
                nom.trim(), 
                prenom.trim(), 
                telephone ? telephone.trim() : null, 
                adresse ? adresse.trim() : null, 
                nom_chantier ? nom_chantier.trim() : null,
                email ? email.trim() : user.email,
                id
            ]);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Violation contrainte unique
                throw new Error('Un utilisateur avec cet email existe déjà');
            }
            throw error;
        }
    }

    /**
     * Obtenir les statistiques des utilisateurs
     * @returns {Object} Statistiques
     */
    static async getUserStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN is_active = false THEN 1 END) as pending_users,
                COUNT(CASE WHEN role = 'directeur' THEN 1 END) as directeurs,
                COUNT(CASE WHEN role = 'magazinier' AND is_active = true THEN 1 END) as magaziniers_actifs,
                COUNT(CASE WHEN role = 'chef_chantier' AND is_active = true THEN 1 END) as chefs_chantier_actifs,
                COUNT(CASE WHEN role = 'magazinier' AND is_active = false THEN 1 END) as magaziniers_pending,
                COUNT(CASE WHEN role = 'chef_chantier' AND is_active = false THEN 1 END) as chefs_chantier_pending
            FROM users
        `;

        try {
            const result = await query(sql);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;