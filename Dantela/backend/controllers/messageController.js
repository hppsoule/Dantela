/**
 * Contrôleur Message - Gestion des messages en temps réel
 */

const Message = require('../models/Message');

/**
 * Créer une notification automatique pour une nouvelle demande
 * @param {Object} demandeData - Données de la demande
 * @param {Object} demandeurData - Données du demandeur
 */
const notifyNewDemande = async (demandeData, demandeurData) => {
    try {
        const messageData = {
            type: 'notification',
            title: 'Nouvelle Demande de Matériaux',
            content: `Demande ${demandeData.numero_demande} créée par ${demandeurData.prenom} ${demandeurData.nom}` +
                    (demandeurData.nom_chantier ? ` (Chantier: ${demandeurData.nom_chantier})` : ''),
            from_user_id: demandeData.demandeur_id,
            to_role: 'magazinier',
            related_type: 'demande',
            related_id: demandeData.numero_demande,
            priority: demandeData.priorite === 'urgente' ? 'urgent' : 'medium'
        };

        await Message.create(messageData);
        console.log('📨 Notification envoyée aux magaziniers pour:', demandeData.numero_demande);
    } catch (error) {
        console.error('❌ Erreur notification nouvelle demande:', error);
    }
};

/**
 * Créer une notification pour validation de demande
 * @param {Object} demandeData - Données de la demande
 * @param {Object} valideurData - Données du valideur
 * @param {string} action - 'approuvee' ou 'rejetee'
 */
const notifyDemandeValidated = async (demandeData, valideurData, action) => {
    try {
        const isApproved = action === 'approuvee';
        
        const messageData = {
            type: 'notification',
            title: isApproved ? 'Demande Approuvée' : 'Demande Rejetée',
            content: `Votre demande ${demandeData.numero_demande} a été ${isApproved ? 'approuvée' : 'rejetée'} par ${valideurData.prenom} ${valideurData.nom}` +
                    (demandeData.commentaire_magazinier ? `. Commentaire: ${demandeData.commentaire_magazinier}` : ''),
            from_user_id: demandeData.validee_par,
            to_user_id: demandeData.demandeur_id,
            related_type: 'demande',
            related_id: demandeData.numero_demande,
            priority: isApproved ? 'medium' : 'high'
        };

        await Message.create(messageData);
        console.log(`📨 Notification ${action} envoyée pour:`, demandeData.numero_demande);
    } catch (error) {
        console.error('❌ Erreur notification validation:', error);
    }
};

/**
 * Créer une notification pour bon de livraison
 * @param {Object} bonData - Données du bon
 * @param {Object} magazinierData - Données du magazinier
 */
const notifyBonCreated = async (bonData, magazinierData) => {
    try {
        const messageData = {
            type: 'notification',
            title: 'Bon de Livraison Prêt',
            content: `Bon de livraison ${bonData.numero_bon} préparé par ${magazinierData.prenom} ${magazinierData.nom}. Prêt pour récupération.`,
            from_user_id: bonData.magazinier_id,
            to_user_id: bonData.destinataire_id,
            related_type: 'bon_livraison',
            related_id: bonData.numero_bon,
            priority: 'medium'
        };

        await Message.create(messageData);
        console.log('📨 Notification bon créé envoyée pour:', bonData.numero_bon);
    } catch (error) {
        console.error('❌ Erreur notification bon créé:', error);
    }
};

/**
 * Créer une alerte système pour le directeur
 * @param {string} title - Titre de l'alerte
 * @param {string} content - Contenu de l'alerte
 * @param {string} priority - Priorité de l'alerte
 */
const notifySystemAlert = async (title, content, priority = 'medium') => {
    try {
        const messageData = {
            type: 'system',
            title,
            content,
            from_user_id: null,
            to_role: 'directeur',
            related_type: 'system',
            related_id: 'alert',
            priority
        };

        await Message.create(messageData);
        console.log('📨 Alerte système envoyée aux directeurs:', title);
    } catch (error) {
        console.error('❌ Erreur alerte système:', error);
    }
};

module.exports = {
    notifyNewDemande,
    notifyDemandeValidated,
    notifyBonCreated,
    notifySystemAlert
};