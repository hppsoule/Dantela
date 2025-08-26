/**
 * Modèle Message - Gestion des messages en temps réel
 */

const { query } = require('../config/database');

class Message {
    /**
     * Créer un nouveau message
     * @param {Object} messageData - Données du message
     * @returns {Object} Message créé
     */
    static async create(messageData) {
        const {
            type,
            title,
            content,
            from_user_id,
            to_user_id,
            to_role,
            related_type,
            related_id,
            priority
        } = messageData;

        const sql = `
            SELECT create_automatic_message($1, $2, $3, $4, $5, $6, $7, $8, $9) as message_id
        `;

        const values = [
            type,
            title,
            content,
            from_user_id,
            to_user_id || null,
            to_role || null,
            related_type || null,
            related_id || null,
            priority || 'medium'
        ];

        try {
            const result = await query(sql, values);
            const messageId = result.rows[0].message_id;
            
            // Récupérer le message créé avec tous les détails
            return await this.findById(messageId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir tous les messages pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} Liste des messages
     */
    static async getForUser(userId, filters = {}) {
        let sql = `
            SELECT DISTINCT
                m.id,
                m.type,
                m.title,
                m.content,
                m.related_type,
                m.related_id,
                m.priority,
                m.created_at,
                u_from.nom || ' ' || u_from.prenom as from_user_name,
                u_from.role as from_user_role,
                u_from.email as from_user_email,
                -- Déterminer si le message est lu
                CASE 
                    WHEN m.to_user_id IS NOT NULL THEN m.is_read
                    ELSE COALESCE(mr.is_read, false)
                END as is_read,
                CASE 
                    WHEN m.to_user_id IS NOT NULL THEN m.read_at
                    ELSE mr.read_at
                END as read_at
            FROM messages m
            LEFT JOIN users u_from ON m.from_user_id = u_from.id
            LEFT JOIN message_recipients mr ON m.id = mr.message_id AND mr.user_id = $1
            LEFT JOIN users u_current ON u_current.id = $1
            WHERE (
                m.to_user_id = $1 OR 
                (m.to_role IS NOT NULL AND u_current.role = m.to_role AND mr.user_id = $1)
            )
        `;

        const conditions = [];
        const values = [userId];
        let paramCount = 1;

        if (filters.type) {
            paramCount++;
            conditions.push(`m.type = $${paramCount}`);
            values.push(filters.type);
        }

        if (filters.is_read !== undefined) {
            paramCount++;
            conditions.push(`
                CASE 
                    WHEN m.to_user_id IS NOT NULL THEN m.is_read = $${paramCount}
                    ELSE COALESCE(mr.is_read, false) = $${paramCount}
                END
            `);
            values.push(filters.is_read);
        }

        if (filters.priority) {
            paramCount++;
            conditions.push(`m.priority = $${paramCount}`);
            values.push(filters.priority);
        }

        if (filters.related_type) {
            paramCount++;
            conditions.push(`m.related_type = $${paramCount}`);
            values.push(filters.related_type);
        }

        if (conditions.length > 0) {
            sql += ' AND ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY m.created_at DESC';

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
     * Obtenir un message par ID
     * @param {string} id - ID du message
     * @returns {Object|null} Message trouvé
     */
    static async findById(id) {
        const sql = `
            SELECT 
                m.*,
                u_from.nom || ' ' || u_from.prenom as from_user_name,
                u_from.role as from_user_role,
                u_to.nom || ' ' || u_to.prenom as to_user_name,
                u_to.role as to_user_role
            FROM messages m
            LEFT JOIN users u_from ON m.from_user_id = u_from.id
            LEFT JOIN users u_to ON m.to_user_id = u_to.id
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
     * Marquer un message comme lu
     * @param {string} messageId - ID du message
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} Succès
     */
    static async markAsRead(messageId, userId) {
        const sql = `SELECT mark_message_as_read($1, $2) as success`;

        try {
            const result = await query(sql, [messageId, userId]);
            return result.rows[0].success;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Marquer tous les messages comme lus pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {number} Nombre de messages marqués
     */
    static async markAllAsRead(userId) {
        const client = await require('../config/database').pool.connect();
        
        try {
            await client.query('BEGIN');

            // Marquer les messages directs comme lus
            const directResult = await client.query(`
                UPDATE messages 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE to_user_id = $1 AND is_read = false
            `, [userId]);

            // Marquer les messages de rôle comme lus
            const roleResult = await client.query(`
                UPDATE message_recipients 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND is_read = false
            `, [userId]);

            await client.query('COMMIT');
            
            return directResult.rowCount + roleResult.rowCount;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtenir le nombre de messages non lus pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {number} Nombre de messages non lus
     */
    static async getUnreadCount(userId) {
        const sql = `SELECT get_unread_count($1) as count`;

        try {
            const result = await query(sql, [userId]);
            return result.rows[0].count || 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Supprimer les anciens messages (nettoyage)
     * @param {number} daysOld - Nombre de jours
     * @returns {number} Nombre de messages supprimés
     */
    static async deleteOldMessages(daysOld = 30) {
        const sql = `
            DELETE FROM messages 
            WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
            AND type != 'system'
        `;

        try {
            const result = await query(sql);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtenir les statistiques des messages
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @returns {Object} Statistiques
     */
    static async getStats(userId = null) {
        let sql = `
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN type = 'notification' THEN 1 END) as notifications,
                COUNT(CASE WHEN type = 'comment' THEN 1 END) as comments,
                COUNT(CASE WHEN type = 'activity' THEN 1 END) as activities,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_messages,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_messages
        `;

        const values = [];
        
        if (userId) {
            sql += `
                FROM (
                    SELECT m.* FROM messages m
                    LEFT JOIN message_recipients mr ON m.id = mr.message_id
                    LEFT JOIN users u ON u.id = $1
                    WHERE m.to_user_id = $1 OR (m.to_role = u.role AND mr.user_id = $1)
                ) as user_messages
            `;
            values.push(userId);
        } else {
            sql += ' FROM messages';
        }

        try {
            const result = await query(sql, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Créer un commentaire sur une demande
     * @param {Object} commentData - Données du commentaire
     * @returns {Object} Commentaire créé
     */
    static async createComment(commentData) {
        const {
            demande_id,
            from_user_id,
            to_user_id,
            content
        } = commentData;

        // Récupérer les infos de la demande
        const demandeResult = await query(
            'SELECT numero_demande, demandeur_id FROM demandes_materiaux WHERE id = $1',
            [demande_id]
        );

        if (demandeResult.rows.length === 0) {
            throw new Error('Demande non trouvée');
        }

        const demande = demandeResult.rows[0];

        // Récupérer les infos de l'expéditeur
        const userResult = await query(
            'SELECT nom, prenom FROM users WHERE id = $1',
            [from_user_id]
        );

        const user = userResult.rows[0];

        const messageData = {
            type: 'comment',
            title: `Commentaire sur ${demande.numero_demande}`,
            content: content,
            from_user_id: from_user_id,
            to_user_id: to_user_id,
            related_type: 'demande',
            related_id: demande.numero_demande,
            priority: 'medium'
        };

        return await this.create(messageData);
    }
}

module.exports = Message;