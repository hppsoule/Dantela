/*
  # Correction erreur content NULL dans les messages

  1. Problème
    - La fonction notify_new_demande() génère un content NULL
    - La colonne content de la table messages est NOT NULL
    - Erreur lors de l'insertion du message

  2. Solution
    - Corriger la fonction notify_new_demande()
    - S'assurer que le content n'est jamais NULL
    - Gérer les cas où les données utilisateur sont NULL

  3. Correction
    - Remplacer la fonction notify_new_demande()
    - Ajouter des vérifications NULL
    - Utiliser COALESCE pour valeurs par défaut
*/

-- =====================================================
-- CORRECTION DE LA FONCTION notify_new_demande
-- =====================================================

-- Supprimer l'ancienne fonction défaillante
DROP FUNCTION IF EXISTS notify_new_demande();

-- Recréer la fonction avec gestion des valeurs NULL
CREATE OR REPLACE FUNCTION notify_new_demande()
RETURNS TRIGGER AS $$
DECLARE
    demandeur_record RECORD;
    message_content TEXT;
BEGIN
    -- Récupérer les infos du demandeur avec gestion des NULL
    SELECT 
        COALESCE(nom, 'Utilisateur') as nom,
        COALESCE(prenom, 'Inconnu') as prenom,
        COALESCE(role, 'utilisateur') as role,
        nom_chantier
    INTO demandeur_record
    FROM users WHERE id = NEW.demandeur_id;
    
    -- Construire le contenu du message avec gestion des NULL
    message_content := 'Demande ' || COALESCE(NEW.numero_demande, 'NOUVELLE') || 
                      ' créée par ' || demandeur_record.prenom || ' ' || demandeur_record.nom;
    
    -- Ajouter le nom du chantier si disponible
    IF demandeur_record.nom_chantier IS NOT NULL AND demandeur_record.nom_chantier != '' THEN
        message_content := message_content || ' (Chantier: ' || demandeur_record.nom_chantier || ')';
    END IF;
    
    -- Ajouter la priorité si urgente
    IF NEW.priorite = 'urgente' THEN
        message_content := message_content || ' - PRIORITÉ URGENTE';
    END IF;
    
    -- Notifier tous les magaziniers
    PERFORM create_automatic_message(
        'notification',
        'Nouvelle Demande de Matériaux',
        message_content,
        NEW.demandeur_id,
        NULL, -- to_user_id
        'magazinier', -- to_role
        'demande',
        COALESCE(NEW.numero_demande, 'NOUVELLE'),
        CASE WHEN NEW.priorite = 'urgente' THEN 'urgent' ELSE 'medium' END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRECTION DE LA FONCTION notify_demande_validated
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_demande_validated();

-- Recréer la fonction avec gestion des valeurs NULL
CREATE OR REPLACE FUNCTION notify_demande_validated()
RETURNS TRIGGER AS $$
DECLARE
    valideur_record RECORD;
    message_content TEXT;
    message_title TEXT;
BEGIN
    -- Seulement si le statut change vers approuvee ou rejetee
    IF OLD.statut = 'en_attente' AND NEW.statut IN ('approuvee', 'rejetee') THEN
        -- Récupérer les infos du valideur avec gestion des NULL
        SELECT 
            COALESCE(nom, 'Magazinier') as nom,
            COALESCE(prenom, 'Dantela') as prenom
        INTO valideur_record
        FROM users WHERE id = NEW.validee_par;
        
        -- Construire le titre et contenu selon le statut
        IF NEW.statut = 'approuvee' THEN
            message_title := 'Demande Approuvée';
            message_content := 'Votre demande ' || COALESCE(NEW.numero_demande, 'NOUVELLE') || 
                              ' a été approuvée par ' || valideur_record.prenom || ' ' || valideur_record.nom;
        ELSE
            message_title := 'Demande Rejetée';
            message_content := 'Votre demande ' || COALESCE(NEW.numero_demande, 'NOUVELLE') || 
                              ' a été rejetée par ' || valideur_record.prenom || ' ' || valideur_record.nom;
        END IF;
        
        -- Ajouter le commentaire du magazinier si disponible
        IF NEW.commentaire_magazinier IS NOT NULL AND NEW.commentaire_magazinier != '' THEN
            message_content := message_content || '. Commentaire: ' || NEW.commentaire_magazinier;
        END IF;
        
        -- Notifier le demandeur
        PERFORM create_automatic_message(
            'notification',
            message_title,
            message_content,
            NEW.validee_par,
            NEW.demandeur_id, -- to_user_id
            NULL, -- to_role
            'demande',
            COALESCE(NEW.numero_demande, 'NOUVELLE'),
            CASE WHEN NEW.statut = 'rejetee' THEN 'high' ELSE 'medium' END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRECTION DE LA FONCTION notify_bon_created
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS notify_bon_created();

-- Recréer la fonction avec gestion des valeurs NULL
CREATE OR REPLACE FUNCTION notify_bon_created()
RETURNS TRIGGER AS $$
DECLARE
    magazinier_record RECORD;
    message_content TEXT;
BEGIN
    -- Récupérer les infos du magazinier avec gestion des NULL
    SELECT 
        COALESCE(nom, 'Magazinier') as nom,
        COALESCE(prenom, 'Dantela') as prenom
    INTO magazinier_record
    FROM users WHERE id = NEW.magazinier_id;
    
    -- Construire le contenu du message
    message_content := 'Bon de livraison ' || COALESCE(NEW.numero_bon, 'NOUVEAU') || 
                      ' préparé par ' || magazinier_record.prenom || ' ' || magazinier_record.nom ||
                      '. Prêt pour récupération.';
    
    -- Ajouter le type de livraison
    IF NEW.type_livraison = 'directe' THEN
        message_content := message_content || ' (Distribution directe)';
    END IF;
    
    -- Notifier le destinataire seulement s'il existe
    IF NEW.destinataire_id IS NOT NULL THEN
        PERFORM create_automatic_message(
            'notification',
            'Bon de Livraison Prêt',
            message_content,
            NEW.magazinier_id,
            NEW.destinataire_id, -- to_user_id
            NULL, -- to_role
            'bon_livraison',
            COALESCE(NEW.numero_bon, 'NOUVEAU'),
            'medium'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RECRÉER LES TRIGGERS AVEC LES FONCTIONS CORRIGÉES
-- =====================================================

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_notify_new_demande ON demandes_materiaux;
DROP TRIGGER IF EXISTS trigger_notify_demande_validated ON demandes_materiaux;
DROP TRIGGER IF EXISTS trigger_notify_bon_created ON bons_livraison;

-- Recréer les triggers avec les nouvelles fonctions
CREATE TRIGGER trigger_notify_new_demande
    AFTER INSERT ON demandes_materiaux
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_demande();

CREATE TRIGGER trigger_notify_demande_validated
    AFTER UPDATE ON demandes_materiaux
    FOR EACH ROW
    EXECUTE FUNCTION notify_demande_validated();

CREATE TRIGGER trigger_notify_bon_created
    AFTER INSERT ON bons_livraison
    FOR EACH ROW
    EXECUTE FUNCTION notify_bon_created();

-- =====================================================
-- VÉRIFICATION ET NETTOYAGE
-- =====================================================

-- Supprimer les messages avec content NULL s'il y en a
DELETE FROM messages WHERE content IS NULL;

-- Vérifier que les fonctions sont correctes
SELECT 'Fonctions de notification corrigées avec succès!' as message;

-- Test des fonctions (optionnel)
SELECT 'Test des fonctions:' as info;
SELECT 
    proname as fonction_name,
    pronargs as nombre_parametres
FROM pg_proc 
WHERE proname IN ('notify_new_demande', 'notify_demande_validated', 'notify_bon_created');

-- Afficher les triggers actifs
SELECT 'Triggers actifs:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trigger_notify_%';