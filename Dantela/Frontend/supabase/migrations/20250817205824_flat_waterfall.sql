/*
  # Système de messages en temps réel

  1. Nouvelles Tables
    - `messages`
      - `id` (uuid, primary key)
      - `type` (text) - Type de message (notification, comment, activity)
      - `title` (text) - Titre du message
      - `content` (text) - Contenu du message
      - `from_user_id` (uuid, foreign key) - Expéditeur
      - `to_user_id` (uuid, foreign key) - Destinataire (NULL pour tous)
      - `to_role` (text) - Rôle destinataire (NULL pour utilisateur spécifique)
      - `related_type` (text) - Type d'objet lié (demande, bon, etc.)
      - `related_id` (text) - ID de l'objet lié
      - `priority` (text) - Priorité (low, medium, high, urgent)
      - `is_read` (boolean) - Lu ou non
      - `read_at` (timestamp) - Date de lecture
      - `created_at` (timestamp)

    - `message_recipients`
      - `id` (uuid, primary key)
      - `message_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `is_read` (boolean)
      - `read_at` (timestamp)
      - `created_at` (timestamp)

  2. Index et Contraintes
    - Index sur tous les champs de recherche
    - Contraintes de validation
    - Triggers pour notifications automatiques

  3. Fonctions
    - Fonction pour créer des messages automatiques
    - Fonction pour marquer comme lu
    - Fonction pour obtenir les messages non lus
*/

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('notification', 'comment', 'activity', 'system')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL pour message à tous d'un rôle
    to_role VARCHAR(20) CHECK (to_role IN ('directeur', 'magazinier', 'chef_chantier')), -- NULL pour utilisateur spécifique
    related_type VARCHAR(50), -- 'demande', 'bon_livraison', 'materiau', 'user', etc.
    related_id VARCHAR(100), -- ID de l'objet lié
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : soit to_user_id soit to_role doit être défini
    CONSTRAINT check_recipient CHECK (
        (to_user_id IS NOT NULL AND to_role IS NULL) OR 
        (to_user_id IS NULL AND to_role IS NOT NULL)
    )
);

-- =====================================================
-- 2. TABLE MESSAGE_RECIPIENTS (pour messages à plusieurs destinataires)
-- =====================================================

CREATE TABLE IF NOT EXISTS message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(message_id, user_id)
);

-- =====================================================
-- 3. INDEX POUR PERFORMANCES
-- =====================================================

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_role ON messages(to_role);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_related ON messages(related_type, related_id);

-- Index pour message_recipients
CREATE INDEX IF NOT EXISTS idx_recipients_message ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_recipients_user ON message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_is_read ON message_recipients(is_read);

-- =====================================================
-- 4. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer un message automatique
CREATE OR REPLACE FUNCTION create_automatic_message(
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_content TEXT,
    p_from_user_id UUID,
    p_to_user_id UUID DEFAULT NULL,
    p_to_role VARCHAR(20) DEFAULT NULL,
    p_related_type VARCHAR(50) DEFAULT NULL,
    p_related_id VARCHAR(100) DEFAULT NULL,
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    user_record RECORD;
BEGIN
    -- Créer le message principal
    INSERT INTO messages (
        type, title, content, from_user_id, to_user_id, to_role,
        related_type, related_id, priority
    ) VALUES (
        p_type, p_title, p_content, p_from_user_id, p_to_user_id, p_to_role,
        p_related_type, p_related_id, p_priority
    ) RETURNING id INTO message_id;
    
    -- Si c'est un message pour un rôle, créer les entrées pour tous les utilisateurs de ce rôle
    IF p_to_role IS NOT NULL THEN
        FOR user_record IN 
            SELECT id FROM users 
            WHERE role = p_to_role AND is_active = true AND id != COALESCE(p_from_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
        LOOP
            INSERT INTO message_recipients (message_id, user_id)
            VALUES (message_id, user_record.id);
        END LOOP;
    END IF;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un message comme lu
CREATE OR REPLACE FUNCTION mark_message_as_read(
    p_message_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Vérifier si le message existe
    SELECT * INTO message_record FROM messages WHERE id = p_message_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Si c'est un message direct
    IF message_record.to_user_id IS NOT NULL THEN
        UPDATE messages 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = p_message_id AND to_user_id = p_user_id;
    ELSE
        -- Si c'est un message de rôle, marquer dans message_recipients
        UPDATE message_recipients 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE message_id = p_message_id AND user_id = p_user_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le nombre de messages non lus pour un utilisateur
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_direct INTEGER;
    count_role INTEGER;
BEGIN
    -- Messages directs non lus
    SELECT COUNT(*) INTO count_direct
    FROM messages 
    WHERE to_user_id = p_user_id AND is_read = false;
    
    -- Messages de rôle non lus
    SELECT COUNT(*) INTO count_role
    FROM message_recipients mr
    JOIN messages m ON mr.message_id = m.id
    WHERE mr.user_id = p_user_id AND mr.is_read = false;
    
    RETURN count_direct + count_role;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS AUTOMATIQUES
-- =====================================================

-- Trigger pour créer une notification quand une demande est créée
CREATE OR REPLACE FUNCTION notify_new_demande()
RETURNS TRIGGER AS $$
DECLARE
    demandeur_record RECORD;
BEGIN
    -- Récupérer les infos du demandeur
    SELECT nom, prenom, role, nom_chantier INTO demandeur_record
    FROM users WHERE id = NEW.demandeur_id;
    
    -- Notifier tous les magaziniers
    PERFORM create_automatic_message(
        'notification',
        'Nouvelle Demande de Matériaux',
        'Demande ' || NEW.numero_demande || ' créée par ' || demandeur_record.prenom || ' ' || demandeur_record.nom || 
        CASE WHEN demandeur_record.nom_chantier IS NOT NULL 
             THEN ' (Chantier: ' || demandeur_record.nom_chantier || ')'
             ELSE '' END,
        NEW.demandeur_id,
        NULL, -- to_user_id
        'magazinier', -- to_role
        'demande',
        NEW.numero_demande,
        CASE WHEN NEW.priorite = 'urgente' THEN 'urgent' ELSE 'medium' END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer une notification quand une demande est validée
CREATE OR REPLACE FUNCTION notify_demande_validated()
RETURNS TRIGGER AS $$
DECLARE
    valideur_record RECORD;
BEGIN
    -- Seulement si le statut change vers approuvee ou rejetee
    IF OLD.statut = 'en_attente' AND NEW.statut IN ('approuvee', 'rejetee') THEN
        -- Récupérer les infos du valideur
        SELECT nom, prenom INTO valideur_record
        FROM users WHERE id = NEW.validee_par;
        
        -- Notifier le demandeur
        PERFORM create_automatic_message(
            'notification',
            CASE WHEN NEW.statut = 'approuvee' 
                 THEN 'Demande Approuvée' 
                 ELSE 'Demande Rejetée' END,
            'Votre demande ' || NEW.numero_demande || ' a été ' || 
            CASE WHEN NEW.statut = 'approuvee' THEN 'approuvée' ELSE 'rejetée' END ||
            ' par ' || valideur_record.prenom || ' ' || valideur_record.nom ||
            CASE WHEN NEW.commentaire_magazinier IS NOT NULL 
                 THEN '. Commentaire: ' || NEW.commentaire_magazinier
                 ELSE '' END,
            NEW.validee_par,
            NEW.demandeur_id, -- to_user_id
            NULL, -- to_role
            'demande',
            NEW.numero_demande,
            CASE WHEN NEW.statut = 'rejetee' THEN 'high' ELSE 'medium' END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer une notification quand un bon de livraison est créé
CREATE OR REPLACE FUNCTION notify_bon_created()
RETURNS TRIGGER AS $$
DECLARE
    magazinier_record RECORD;
BEGIN
    -- Récupérer les infos du magazinier
    SELECT nom, prenom INTO magazinier_record
    FROM users WHERE id = NEW.magazinier_id;
    
    -- Notifier le destinataire
    PERFORM create_automatic_message(
        'notification',
        'Bon de Livraison Prêt',
        'Bon de livraison ' || NEW.numero_bon || ' préparé par ' || 
        magazinier_record.prenom || ' ' || magazinier_record.nom ||
        '. Prêt pour récupération.',
        NEW.magazinier_id,
        NEW.destinataire_id, -- to_user_id
        NULL, -- to_role
        'bon_livraison',
        NEW.numero_bon,
        'medium'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_notify_new_demande ON demandes_materiaux;
CREATE TRIGGER trigger_notify_new_demande
    AFTER INSERT ON demandes_materiaux
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_demande();

DROP TRIGGER IF EXISTS trigger_notify_demande_validated ON demandes_materiaux;
CREATE TRIGGER trigger_notify_demande_validated
    AFTER UPDATE ON demandes_materiaux
    FOR EACH ROW
    EXECUTE FUNCTION notify_demande_validated();

DROP TRIGGER IF EXISTS trigger_notify_bon_created ON bons_livraison;
CREATE TRIGGER trigger_notify_bon_created
    AFTER INSERT ON bons_livraison
    FOR EACH ROW
    EXECUTE FUNCTION notify_bon_created();

-- =====================================================
-- 6. SÉCURITÉ RLS
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- Politiques pour messages
CREATE POLICY "Users can read their messages" ON messages
    FOR SELECT TO authenticated
    USING (
        to_user_id = auth.uid() OR
        (to_role IS NOT NULL AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = messages.to_role AND is_active = true
        )) OR
        from_user_id = auth.uid()
    );

CREATE POLICY "Users can create messages" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update their messages" ON messages
    FOR UPDATE TO authenticated
    USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

-- Politiques pour message_recipients
CREATE POLICY "Users can read their recipient entries" ON message_recipients
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their recipient entries" ON message_recipients
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- 7. DONNÉES DE DÉMONSTRATION
-- =====================================================

-- Insérer quelques messages de démonstration
INSERT INTO messages (
    type, title, content, from_user_id, to_role, related_type, related_id, priority
) VALUES 
(
    'notification',
    'Bienvenue dans le système Dantela',
    'Bienvenue dans le système de gestion des dépôts Dantela. Vous pouvez maintenant gérer vos demandes et recevoir des notifications en temps réel.',
    (SELECT id FROM users WHERE role = 'directeur' LIMIT 1),
    'magazinier',
    'system',
    'welcome',
    'medium'
),
(
    'notification',
    'Système de notifications activé',
    'Le système de notifications en temps réel est maintenant actif. Vous recevrez des alertes pour toutes les activités importantes.',
    (SELECT id FROM users WHERE role = 'directeur' LIMIT 1),
    'chef_chantier',
    'system',
    'notifications',
    'medium'
);

-- Créer les entrées dans message_recipients pour les messages de rôle
INSERT INTO message_recipients (message_id, user_id)
SELECT m.id, u.id
FROM messages m
CROSS JOIN users u
WHERE m.to_role IS NOT NULL 
AND u.role = m.to_role 
AND u.is_active = true
AND m.from_user_id != u.id;

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue pour les messages avec détails complets
CREATE OR REPLACE VIEW v_messages_details AS
SELECT 
    m.id,
    m.type,
    m.title,
    m.content,
    m.related_type,
    m.related_id,
    m.priority,
    m.created_at,
    -- Informations expéditeur
    u_from.nom || ' ' || u_from.prenom as from_user_name,
    u_from.role as from_user_role,
    u_from.email as from_user_email,
    -- Informations destinataire
    m.to_user_id,
    m.to_role,
    u_to.nom || ' ' || u_to.prenom as to_user_name,
    u_to.role as to_user_role,
    -- Statut de lecture (pour messages directs)
    m.is_read as direct_is_read,
    m.read_at as direct_read_at,
    -- Statut de lecture (pour messages de rôle via recipients)
    mr.is_read as recipient_is_read,
    mr.read_at as recipient_read_at
FROM messages m
LEFT JOIN users u_from ON m.from_user_id = u_from.id
LEFT JOIN users u_to ON m.to_user_id = u_to.id
LEFT JOIN message_recipients mr ON m.id = mr.message_id;

-- =====================================================
-- 9. RÉSUMÉ
-- =====================================================

SELECT 'Système de messages en temps réel créé avec succès!' as message;

SELECT 
    'Tables créées:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'message_recipients');

-- Affichage des messages de démonstration
SELECT 'Messages de démonstration créés:' as info;
SELECT 
    m.title,
    m.content,
    m.type,
    m.to_role,
    m.priority,
    u.nom || ' ' || u.prenom as from_user
FROM messages m
LEFT JOIN users u ON m.from_user_id = u.id
ORDER BY m.created_at DESC;

-- Affichage des destinataires
SELECT 'Destinataires créés:' as info;
SELECT 
    m.title,
    u.nom || ' ' || u.prenom as recipient_name,
    u.role as recipient_role,
    mr.is_read
FROM message_recipients mr
JOIN messages m ON mr.message_id = m.id
JOIN users u ON mr.user_id = u.id
ORDER BY m.created_at DESC;