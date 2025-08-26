/**
 * Routes Messages - Gestion des messages en temps réel
 */

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

// Middleware pour vérifier l'authentification sur toutes les routes
router.use(authenticateToken);

/**
 * @route   GET /api/messages
 * @desc    Obtenir tous les messages pour l'utilisateur connecté
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const { type, is_read, priority, limit } = req.query;
        
        const filters = {};
        if (type) filters.type = type;
        if (is_read !== undefined) filters.is_read = is_read === 'true';
        if (priority) filters.priority = priority;
        if (limit) filters.limit = parseInt(limit);

        const messages = await Message.getForUser(req.user.userId, filters);

        console.log(`📨 ${messages.length} messages récupérés pour ${req.user.email}`);

        res.json({
            success: true,
            message: 'Messages récupérés avec succès',
            messages,
            total: messages.length
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   GET /api/messages/unread-count
 * @desc    Obtenir le nombre de messages non lus
 * @access  Private
 */
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Message.getUnreadCount(req.user.userId);

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('❌ Erreur lors du comptage des messages non lus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   GET /api/messages/stats
 * @desc    Obtenir les statistiques des messages
 * @access  Private
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await Message.getStats(req.user.userId);

        res.json({
            success: true,
            message: 'Statistiques récupérées avec succès',
            stats
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/messages
 * @desc    Créer un nouveau message
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const {
            type,
            title,
            content,
            to_user_id,
            to_role,
            related_type,
            related_id,
            priority
        } = req.body;

        console.log('📝 Création d\'un nouveau message par:', req.user.email);

        // Validation des données
        if (!type || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Type, titre et contenu sont obligatoires'
            });
        }

        if (!to_user_id && !to_role) {
            return res.status(400).json({
                success: false,
                message: 'Destinataire (utilisateur ou rôle) obligatoire'
            });
        }

        const messageData = {
            type,
            title,
            content,
            from_user_id: req.user.userId,
            to_user_id,
            to_role,
            related_type,
            related_id,
            priority
        };

        const newMessage = await Message.create(messageData);

        console.log('✅ Message créé avec succès:', newMessage.id);

        res.status(201).json({
            success: true,
            message: 'Message créé avec succès',
            data: newMessage
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/messages/comment
 * @desc    Créer un commentaire sur une demande
 * @access  Private
 */
router.post('/comment', async (req, res) => {
    try {
        const {
            demande_id,
            to_user_id,
            content
        } = req.body;

        console.log('💬 Création d\'un commentaire par:', req.user.email);

        // Validation des données
        if (!demande_id || !content) {
            return res.status(400).json({
                success: false,
                message: 'ID de demande et contenu sont obligatoires'
            });
        }

        const commentData = {
            demande_id,
            from_user_id: req.user.userId,
            to_user_id,
            content
        };

        const newComment = await Message.createComment(commentData);

        console.log('✅ Commentaire créé avec succès:', newComment.id);

        res.status(201).json({
            success: true,
            message: 'Commentaire créé avec succès',
            data: newComment
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du commentaire:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Marquer un message comme lu
 * @access  Private
 */
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const success = await Message.markAsRead(id, req.user.userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Message marqué comme lu'
        });

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   PUT /api/messages/mark-all-read
 * @desc    Marquer tous les messages comme lus
 * @access  Private
 */
router.put('/mark-all-read', async (req, res) => {
    try {
        const count = await Message.markAllAsRead(req.user.userId);

        res.json({
            success: true,
            message: `${count} message(s) marqué(s) comme lu(s)`,
            count
        });

    } catch (error) {
        console.error('❌ Erreur lors du marquage global:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   DELETE /api/messages/cleanup
 * @desc    Nettoyer les anciens messages (admin seulement)
 * @access  Private (Directeur)
 */
router.delete('/cleanup', async (req, res) => {
    try {
        if (req.user.role !== 'directeur') {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        const { days = 30 } = req.query;
        const count = await Message.deleteOldMessages(parseInt(days));

        res.json({
            success: true,
            message: `${count} ancien(s) message(s) supprimé(s)`,
            count
        });

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

module.exports = router;