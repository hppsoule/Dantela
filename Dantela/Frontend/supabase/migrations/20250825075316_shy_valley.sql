/*
  # 🏗️ BASE DE DONNÉES DANTELA DEPOT - SCRIPT COMPLET FINAL
  # Système de Gestion des Dépôts et Matériaux de Construction
  # Version: 1.0 - Production Ready
  # Compatible: PostgreSQL 12+
  
  INSTRUCTIONS D'INSTALLATION:
  1. createdb -U postgres DantelaDepot
  2. psql -U postgres -d DantelaDepot -f dantela_final_schema.sql
  
  COMPTES PAR DÉFAUT:
  - Directeur: directeur@dantela.cm / admin123
  - Magazinier: soulemane@dantela.cm / admin123  
  - Chef de chantier: izmet@dantela.cm / admin123
*/

-- =====================================================
-- 1. NETTOYAGE ET PRÉPARATION
-- =====================================================

-- Supprimer les tables dans l'ordre inverse des dépendances (si elles existent)
DROP TABLE IF EXISTS message_recipients CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS materiaux_retour_utilise CASCADE;
DROP TABLE IF EXISTS materiaux_en_panne CASCADE;
DROP TABLE IF EXISTS bon_items CASCADE;
DROP TABLE IF EXISTS bons_livraison CASCADE;
DROP TABLE IF EXISTS mouvements_stock CASCADE;
DROP TABLE IF EXISTS demande_items CASCADE;
DROP TABLE IF EXISTS demandes_materiaux CASCADE;
DROP TABLE IF EXISTS materiaux CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS depots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS v_materiaux_retour_details CASCADE;
DROP VIEW IF EXISTS v_materiaux_panne_details CASCADE;
DROP VIEW IF EXISTS v_bons_livraison_details CASCADE;
DROP VIEW IF EXISTS v_mouvements_details CASCADE;
DROP VIEW IF EXISTS v_demandes_details CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_retour_stats() CASCADE;
DROP FUNCTION IF EXISTS get_panne_stats() CASCADE;
DROP FUNCTION IF EXISTS notify_bon_created() CASCADE;
DROP FUNCTION IF EXISTS notify_demande_validated() CASCADE;
DROP FUNCTION IF EXISTS notify_new_demande() CASCADE;
DROP FUNCTION IF EXISTS get_unread_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_message_as_read(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_automatic_message(VARCHAR, VARCHAR, TEXT, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS generate_numero_bon() CASCADE;
DROP FUNCTION IF EXISTS generate_numero_demande() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour générer un numéro de demande unique
CREATE OR REPLACE FUNCTION generate_numero_demande()
RETURNS TEXT AS $$
DECLARE
    nouveau_numero TEXT;
    compteur INTEGER;
BEGIN
    -- Format: DEM-YYYY-NNNN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_demande FROM 'DEM-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO compteur
    FROM demandes_materiaux
    WHERE numero_demande LIKE 'DEM-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%';
    
    nouveau_numero := 'DEM-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(compteur::TEXT, 4, '0');
    
    RETURN nouveau_numero;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de bon de livraison unique
CREATE OR REPLACE FUNCTION generate_numero_bon()
RETURNS TEXT AS $$
DECLARE
    nouveau_numero TEXT;
    compteur INTEGER;
BEGIN
    -- Format: BL-YYYY-NNNN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_bon FROM 'BL-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
    INTO compteur
    FROM bons_livraison
    WHERE numero_bon LIKE 'BL-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%';
    
    nouveau_numero := 'BL-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(compteur::TEXT, 4, '0');
    
    RETURN nouveau_numero;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABLE USERS (Utilisateurs)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('directeur', 'magazinier', 'chef_chantier')),
    nom_chantier VARCHAR(255), -- Uniquement pour les chefs de chantier
    is_active BOOLEAN DEFAULT false, -- Compte activé par le directeur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Trigger pour updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. TABLE DEPOTS (Dépôts)
-- =====================================================

CREATE TABLE depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    description TEXT,
    directeur_id UUID REFERENCES users(id),
    magazinier_id UUID REFERENCES users(id), -- Magazinier responsable du dépôt
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des dépôts
CREATE INDEX idx_depots_directeur ON depots(directeur_id);
CREATE INDEX idx_depots_magazinier ON depots(magazinier_id);
CREATE INDEX idx_depots_active ON depots(is_active);

-- Trigger pour updated_at sur les dépôts
CREATE TRIGGER update_depots_updated_at 
    BEFORE UPDATE ON depots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TABLE CATEGORIES (Catégories de matériaux)
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les catégories
CREATE INDEX idx_categories_nom ON categories(nom);
CREATE INDEX idx_categories_depot ON categories(depot_id);

-- =====================================================
-- 6. TABLE MATERIAUX (Matériaux de construction)
-- =====================================================

CREATE TABLE materiaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_produit VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(50) NOT NULL,
    stock_actuel INTEGER DEFAULT 0,
    stock_minimum INTEGER DEFAULT 0,
    fournisseur VARCHAR(255),
    categorie_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    image_url TEXT,
    image_public_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les matériaux
CREATE INDEX idx_materiaux_code_produit ON materiaux(code_produit);
CREATE INDEX idx_materiaux_nom ON materiaux(nom);
CREATE INDEX idx_materiaux_categorie ON materiaux(categorie_id);
CREATE INDEX idx_materiaux_depot ON materiaux(depot_id);
CREATE INDEX idx_materiaux_stock_faible ON materiaux(stock_actuel, stock_minimum);
CREATE INDEX idx_materiaux_fournisseur ON materiaux(fournisseur);

-- Trigger pour updated_at sur materiaux
CREATE TRIGGER update_materiaux_updated_at 
    BEFORE UPDATE ON materiaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. TABLE DEMANDES_MATERIAUX (Demandes de matériaux)
-- =====================================================

CREATE TABLE demandes_materiaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_demande VARCHAR(50) UNIQUE NOT NULL,
    demandeur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'en_preparation', 'livree')),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_livraison_souhaitee DATE,
    commentaire_demandeur TEXT,
    commentaire_magazinier TEXT,
    validee_par UUID REFERENCES users(id),
    date_validation TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour demandes_materiaux
CREATE INDEX idx_demandes_numero ON demandes_materiaux(numero_demande);
CREATE INDEX idx_demandes_demandeur ON demandes_materiaux(demandeur_id);
CREATE INDEX idx_demandes_depot ON demandes_materiaux(depot_id);
CREATE INDEX idx_demandes_statut ON demandes_materiaux(statut);
CREATE INDEX idx_demandes_date ON demandes_materiaux(date_demande);

-- Trigger pour updated_at
CREATE TRIGGER update_demandes_materiaux_updated_at 
    BEFORE UPDATE ON demandes_materiaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. TABLE DEMANDE_ITEMS (Détails des demandes)
-- =====================================================

CREATE TABLE demande_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demande_id UUID REFERENCES demandes_materiaux(id) ON DELETE CASCADE,
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite_demandee INTEGER NOT NULL CHECK (quantite_demandee > 0),
    quantite_accordee INTEGER DEFAULT 0 CHECK (quantite_accordee >= 0),
    quantite_livree INTEGER DEFAULT 0 CHECK (quantite_livree >= 0),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour demande_items
CREATE INDEX idx_demande_items_demande ON demande_items(demande_id);
CREATE INDEX idx_demande_items_materiau ON demande_items(materiau_id);

-- =====================================================
-- 9. TABLE BONS_LIVRAISON (Bons de livraison)
-- =====================================================

CREATE TABLE bons_livraison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_bon VARCHAR(50) UNIQUE NOT NULL,
    demande_id UUID REFERENCES demandes_materiaux(id),
    destinataire_id UUID REFERENCES users(id),
    destinataire_custom JSONB, -- Pour destinataires externes
    magazinier_id UUID REFERENCES users(id) NOT NULL,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    type_livraison VARCHAR(20) DEFAULT 'commande' CHECK (type_livraison IN ('commande', 'directe')),
    statut VARCHAR(20) DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation', 'prete', 'livree', 'annulee')),
    date_preparation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_livraison TIMESTAMP,
    commentaire TEXT,
    signature_destinataire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour bons_livraison
CREATE INDEX idx_bons_numero ON bons_livraison(numero_bon);
CREATE INDEX idx_bons_destinataire ON bons_livraison(destinataire_id);
CREATE INDEX idx_bons_magazinier ON bons_livraison(magazinier_id);
CREATE INDEX idx_bons_statut ON bons_livraison(statut);
CREATE INDEX idx_bons_type ON bons_livraison(type_livraison);
CREATE INDEX idx_bons_destinataire_custom ON bons_livraison USING GIN (destinataire_custom);

-- Trigger pour updated_at
CREATE TRIGGER update_bons_livraison_updated_at 
    BEFORE UPDATE ON bons_livraison 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. TABLE BON_ITEMS (Détails des bons de livraison)
-- =====================================================

CREATE TABLE bon_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bon_livraison_id UUID REFERENCES bons_livraison(id) ON DELETE CASCADE,
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour bon_items
CREATE INDEX idx_bon_items_bon ON bon_items(bon_livraison_id);
CREATE INDEX idx_bon_items_materiau ON bon_items(materiau_id);

-- =====================================================
-- 11. TABLE MOUVEMENTS_STOCK (Historique des mouvements)
-- =====================================================

CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    type_mouvement VARCHAR(20) NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'ajustement', 'inventaire')),
    quantite INTEGER NOT NULL,
    stock_avant INTEGER NOT NULL,
    stock_apres INTEGER NOT NULL,
    utilisateur_id UUID REFERENCES users(id),
    demande_id UUID REFERENCES demandes_materiaux(id),
    bon_livraison_id UUID REFERENCES bons_livraison(id),
    motif VARCHAR(100),
    description TEXT,
    fournisseur VARCHAR(255),
    numero_facture VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour mouvements_stock
CREATE INDEX idx_mouvements_materiau ON mouvements_stock(materiau_id);
CREATE INDEX idx_mouvements_type ON mouvements_stock(type_mouvement);
CREATE INDEX idx_mouvements_utilisateur ON mouvements_stock(utilisateur_id);
CREATE INDEX idx_mouvements_date ON mouvements_stock(created_at);
CREATE INDEX idx_mouvements_demande ON mouvements_stock(demande_id);
CREATE INDEX idx_mouvements_bon ON mouvements_stock(bon_livraison_id);

-- =====================================================
-- 12. TABLE MESSAGES (Messages en temps réel)
-- =====================================================

CREATE TABLE messages (
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

-- Index pour messages
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_to_role ON messages(to_role);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_priority ON messages(priority);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_related ON messages(related_type, related_id);

-- =====================================================
-- 13. TABLE MESSAGE_RECIPIENTS (Destinataires multiples)
-- =====================================================

CREATE TABLE message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(message_id, user_id)
);

-- Index pour message_recipients
CREATE INDEX idx_recipients_message ON message_recipients(message_id);
CREATE INDEX idx_recipients_user ON message_recipients(user_id);
CREATE INDEX idx_recipients_is_read ON message_recipients(is_read);

-- =====================================================
-- 14. TABLE MATERIAUX_EN_PANNE (Matériels défaillants)
-- =====================================================

CREATE TABLE materiaux_en_panne (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    provenance_chantier VARCHAR(255) NOT NULL,
    description_panne TEXT NOT NULL,
    gravite VARCHAR(20) DEFAULT 'moyenne' CHECK (gravite IN ('legere', 'moyenne', 'grave')),
    reparable BOOLEAN DEFAULT true,
    cout_reparation_estime DECIMAL(10,2) DEFAULT 0,
    statut_reparation VARCHAR(20) DEFAULT 'en_attente' CHECK (statut_reparation IN ('en_attente', 'en_cours', 'reparee', 'irreparable')),
    date_retour TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour materiaux_en_panne
CREATE INDEX idx_panne_materiau ON materiaux_en_panne(materiau_id);
CREATE INDEX idx_panne_chantier ON materiaux_en_panne(provenance_chantier);
CREATE INDEX idx_panne_statut ON materiaux_en_panne(statut_reparation);
CREATE INDEX idx_panne_gravite ON materiaux_en_panne(gravite);
CREATE INDEX idx_panne_date ON materiaux_en_panne(date_retour);
CREATE INDEX idx_panne_utilisateur ON materiaux_en_panne(utilisateur_id);

-- =====================================================
-- 15. TABLE MATERIAUX_RETOUR_UTILISE (Retours bon état)
-- =====================================================

CREATE TABLE materiaux_retour_utilise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    provenance_chantier VARCHAR(255) NOT NULL,
    etat VARCHAR(20) DEFAULT 'bon' CHECK (etat IN ('bon', 'usage', 'abime')),
    description_etat TEXT,
    nettoyage_requis BOOLEAN DEFAULT false,
    date_retour TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour materiaux_retour_utilise
CREATE INDEX idx_retour_materiau ON materiaux_retour_utilise(materiau_id);
CREATE INDEX idx_retour_chantier ON materiaux_retour_utilise(provenance_chantier);
CREATE INDEX idx_retour_etat ON materiaux_retour_utilise(etat);
CREATE INDEX idx_retour_date ON materiaux_retour_utilise(date_retour);
CREATE INDEX idx_retour_utilisateur ON materiaux_retour_utilise(utilisateur_id);

-- =====================================================
-- 16. FONCTIONS POUR MESSAGES
-- =====================================================

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
    v_message_id UUID;   -- <-- variable renommée
    r_user RECORD;
BEGIN
    -- Créer le message principal
    INSERT INTO messages (
        type, title, content, from_user_id, to_user_id, to_role,
        related_type, related_id, priority
    )
    VALUES (
        p_type, p_title, COALESCE(p_content, ''), p_from_user_id, p_to_user_id, p_to_role,
        p_related_type, p_related_id, p_priority
    )
    RETURNING id INTO v_message_id;   -- <-- utilise la variable renommée

    -- Si message adressé à un rôle, créer les entrées destinataires
    IF p_to_role IS NOT NULL THEN
        FOR r_user IN
            SELECT u.id
            FROM users AS u
            WHERE u.role = p_to_role
              AND u.is_active = true
              AND u.id <> COALESCE(p_from_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
        LOOP
            INSERT INTO message_recipients (message_id, user_id)
            VALUES (v_message_id, r_user.id)             -- <-- variable clairement distincte
            ON CONFLICT (message_id, user_id) DO NOTHING; -- idempotent
        END LOOP;
    END IF;

    RETURN v_message_id;
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
    
    RETURN COALESCE(count_direct, 0) + COALESCE(count_role, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 17. FONCTIONS POUR NOTIFICATIONS AUTOMATIQUES (CORRIGÉES)
-- =====================================================

-- Trigger pour créer une notification quand une demande est créée (CORRIGÉ)
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

-- Trigger pour créer une notification quand une demande est validée (CORRIGÉ)
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

-- Trigger pour créer une notification quand un bon de livraison est créé (CORRIGÉ)
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
-- 18. FONCTIONS POUR STATISTIQUES (CORRIGÉES)
-- =====================================================

-- Fonction pour obtenir les statistiques des matériaux en panne (CORRIGÉE)
CREATE OR REPLACE FUNCTION get_panne_stats()
RETURNS TABLE (
    total_pannes BIGINT,
    pannes_legeres BIGINT,
    pannes_moyennes BIGINT,
    pannes_graves BIGINT,
    reparables BIGINT,
    irreparables BIGINT,
    en_attente BIGINT,
    en_cours BIGINT,
    reparees BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_pannes,
        COUNT(CASE WHEN mp.gravite = 'legere' THEN 1 END) as pannes_legeres,
        COUNT(CASE WHEN mp.gravite = 'moyenne' THEN 1 END) as pannes_moyennes,
        COUNT(CASE WHEN mp.gravite = 'grave' THEN 1 END) as pannes_graves,
        COUNT(CASE WHEN mp.reparable = true THEN 1 END) as reparables,
        COUNT(CASE WHEN mp.reparable = false THEN 1 END) as irreparables,
        COUNT(CASE WHEN mp.statut_reparation = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN mp.statut_reparation = 'en_cours' THEN 1 END) as en_cours,
        COUNT(CASE WHEN mp.statut_reparation = 'reparee' THEN 1 END) as reparees
    FROM materiaux_en_panne mp;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des retours utilisés (CORRIGÉE)
CREATE OR REPLACE FUNCTION get_retour_stats()
RETURNS TABLE (
    total_retours BIGINT,
    etat_bon BIGINT,
    etat_usage BIGINT,
    etat_abime BIGINT,
    nettoyage_requis_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_retours,
        COUNT(CASE WHEN mr.etat = 'bon' THEN 1 END) as etat_bon,
        COUNT(CASE WHEN mr.etat = 'usage' THEN 1 END) as etat_usage,
        COUNT(CASE WHEN mr.etat = 'abime' THEN 1 END) as etat_abime,
        COUNT(CASE WHEN mr.nettoyage_requis = true THEN 1 END) as nettoyage_requis_count
    FROM materiaux_retour_utilise mr;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 19. TRIGGERS AUTOMATIQUES (CORRIGÉS)
-- =====================================================

-- Créer les triggers avec les fonctions corrigées
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
-- 20. VUES UTILES POUR LES REQUÊTES
-- =====================================================

-- Vue pour les demandes avec détails complets
CREATE OR REPLACE VIEW v_demandes_details AS
SELECT 
    dm.id,
    dm.numero_demande,
    dm.statut,
    dm.priorite,
    dm.date_demande,
    dm.date_livraison_souhaitee,
    dm.commentaire_demandeur,
    dm.commentaire_magazinier,
    dm.date_validation,
    dm.created_at,
    dm.updated_at,
    -- Informations demandeur
    u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
    u_demandeur.role as demandeur_role,
    u_demandeur.nom_chantier,
    u_demandeur.email as demandeur_email,
    u_demandeur.telephone as demandeur_telephone,
    u_demandeur.adresse as demandeur_adresse,
    -- Informations valideur
    u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
    -- Informations dépôt
    d.nom as depot_nom,
    d.adresse as depot_adresse,
    -- Statistiques
    COUNT(di.id) as nombre_items,
    SUM(di.quantite_demandee) as total_quantite_demandee,
    SUM(di.quantite_accordee) as total_quantite_accordee
FROM demandes_materiaux dm
LEFT JOIN users u_demandeur ON dm.demandeur_id = u_demandeur.id
LEFT JOIN users u_valideur ON dm.validee_par = u_valideur.id
LEFT JOIN depots d ON dm.depot_id = d.id
LEFT JOIN demande_items di ON dm.id = di.demande_id
GROUP BY dm.id, u_demandeur.id, u_valideur.id, d.id;

-- Vue pour les mouvements de stock avec détails
CREATE OR REPLACE VIEW v_mouvements_details AS
SELECT 
    ms.id,
    ms.type_mouvement,
    ms.quantite,
    ms.stock_avant,
    ms.stock_apres,
    ms.motif,
    ms.description,
    ms.fournisseur,
    ms.numero_facture,
    ms.created_at,
    -- Informations matériau
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    m.stock_actuel,
    -- Informations catégorie
    c.nom as categorie_nom,
    -- Informations utilisateur
    u.nom || ' ' || u.prenom as utilisateur_nom,
    u.role as utilisateur_role,
    -- Informations demande et bon
    dm.numero_demande,
    bl.numero_bon,
    -- Informations dépôt
    d.nom as depot_nom
FROM mouvements_stock ms
LEFT JOIN materiaux m ON ms.materiau_id = m.id
LEFT JOIN categories c ON m.categorie_id = c.id
LEFT JOIN users u ON ms.utilisateur_id = u.id
LEFT JOIN demandes_materiaux dm ON ms.demande_id = dm.id
LEFT JOIN bons_livraison bl ON ms.bon_livraison_id = bl.id
LEFT JOIN depots d ON m.depot_id = d.id;

-- Vue pour les bons de livraison avec détails
CREATE OR REPLACE VIEW v_bons_livraison_details AS
SELECT 
    bl.id,
    bl.numero_bon,
    bl.type_livraison,
    bl.statut,
    bl.date_preparation,
    bl.date_livraison,
    bl.commentaire,
    bl.signature_destinataire,
    bl.destinataire_custom,
    bl.created_at,
    bl.updated_at,
    -- Informations destinataire
    u_destinataire.nom || ' ' || u_destinataire.prenom as destinataire_nom,
    u_destinataire.role as destinataire_role,
    u_destinataire.nom_chantier,
    u_destinataire.email as destinataire_email,
    u_destinataire.telephone as destinataire_telephone,
    u_destinataire.adresse as destinataire_adresse,
    -- Informations magazinier
    u_magazinier.nom || ' ' || u_magazinier.prenom as magazinier_nom,
    -- Informations dépôt
    d.nom as depot_nom,
    d.adresse as depot_adresse,
    -- Informations demande
    dm.numero_demande,
    -- Statistiques
    COUNT(bi.id) as nombre_items,
    SUM(bi.quantite) as total_quantite
FROM bons_livraison bl
LEFT JOIN users u_destinataire ON bl.destinataire_id = u_destinataire.id
LEFT JOIN users u_magazinier ON bl.magazinier_id = u_magazinier.id
LEFT JOIN depots d ON bl.depot_id = d.id
LEFT JOIN demandes_materiaux dm ON bl.demande_id = dm.id
LEFT JOIN bon_items bi ON bl.id = bi.bon_livraison_id
GROUP BY bl.id, u_destinataire.id, u_magazinier.id, d.id, dm.id;

-- Vue pour les matériaux en panne avec détails complets
CREATE OR REPLACE VIEW v_materiaux_panne_details AS
SELECT 
    mp.id,
    mp.quantite,
    mp.provenance_chantier,
    mp.description_panne,
    mp.gravite,
    mp.reparable,
    mp.cout_reparation_estime,
    mp.statut_reparation,
    mp.date_retour,
    mp.created_at,
    -- Informations matériau
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    m.stock_actuel,
    m.fournisseur,
    -- Informations catégorie
    c.nom as categorie_nom,
    -- Informations utilisateur
    u.nom || ' ' || u.prenom as utilisateur_nom,
    u.role as utilisateur_role
FROM materiaux_en_panne mp
LEFT JOIN materiaux m ON mp.materiau_id = m.id
LEFT JOIN categories c ON m.categorie_id = c.id
LEFT JOIN users u ON mp.utilisateur_id = u.id;

-- Vue pour les retours utilisés avec détails complets
CREATE OR REPLACE VIEW v_materiaux_retour_details AS
SELECT 
    mr.id,
    mr.quantite,
    mr.provenance_chantier,
    mr.etat,
    mr.description_etat,
    mr.nettoyage_requis,
    mr.date_retour,
    mr.created_at,
    -- Informations matériau
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    m.stock_actuel,
    m.fournisseur,
    -- Informations catégorie
    c.nom as categorie_nom,
    -- Informations utilisateur
    u.nom || ' ' || u.prenom as utilisateur_nom,
    u.role as utilisateur_role
FROM materiaux_retour_utilise mr
LEFT JOIN materiaux m ON mr.materiau_id = m.id
LEFT JOIN categories c ON m.categorie_id = c.id
LEFT JOIN users u ON mr.utilisateur_id = u.id;

-- =====================================================
-- 21. INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Insertion des utilisateurs par défaut
-- Mot de passe pour tous: admin123 (hash bcrypt)
INSERT INTO users (
    email, 
    password_hash, 
    nom, 
    prenom, 
    telephone, 
    adresse, 
    role, 
    nom_chantier,
    is_active
) VALUES 
(
    'directeur@dantela.cm',
    '$2a$10$OBe8dRHReFTgbYrJQXAhQ.LIyFIbR.ynZwy8HAdUgSDNi03CSY7by', -- admin123
    'DANTELA',
    'Directeur',
    '+237669790437',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'directeur',
    NULL,
    true
),
(
    'soulemane@dantela.cm',
    '$2a$10$OBe8dRHReFTgbYrJQXAhQ.LIyFIbR.ynZwy8HAdUgSDNi03CSY7by', -- admin123
    'Djacko',
    'Soulemane',
    '+237652679166',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'magazinier',
    NULL,
    true
),
(
    'izmet@dantela.cm',
    '$2a$10$OBe8dRHReFTgbYrJQXAhQ.LIyFIbR.ynZwy8HAdUgSDNi03CSY7by', -- admin123
    'Dantela',
    'Izmet',
    '+237677123456',
    'Chantier ONANA, Yaoundé',
    'chef_chantier',
    'Chantier ONANA',
    true
);

-- Insertion d'un dépôt par défaut
INSERT INTO depots (
    nom,
    adresse,
    description,
    directeur_id,
    magazinier_id
) VALUES (
    'Dépôt Principal Yaoundé',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'Dépôt principal de matériaux de construction Dantela',
    (SELECT id FROM users WHERE email = 'directeur@dantela.cm'),
    (SELECT id FROM users WHERE email = 'soulemane@dantela.cm')
);

-- Insertion des catégories de matériaux
INSERT INTO categories (nom, description, depot_id) VALUES 
('Plomberie', 'Tuyaux, raccords, robinetterie et sanitaires', (SELECT id FROM depots LIMIT 1)),
('Électricité', 'Câbles, prises, interrupteurs et matériel électrique', (SELECT id FROM depots LIMIT 1)),
('Fer et Acier', 'Barres de fer, treillis soudés et profilés métalliques', (SELECT id FROM depots LIMIT 1)),
('Céramique', 'Carrelages, faïences et grès cérame', (SELECT id FROM depots LIMIT 1)),
('Brique et Blocs', 'Parpaings, briques et blocs béton', (SELECT id FROM depots LIMIT 1)),
('Bois', 'Planches, poutres et contreplaqués', (SELECT id FROM depots LIMIT 1)),
('Peinture', 'Peintures murales, vernis et enduits', (SELECT id FROM depots LIMIT 1)),
('Quincaillerie', 'Vis, clous, boulons et petite quincaillerie', (SELECT id FROM depots LIMIT 1)),
('Ciment et Béton', 'Ciments, mortiers et granulats', (SELECT id FROM depots LIMIT 1)),
('Étanchéité et Isolation', 'Membranes d''étanchéité et isolants', (SELECT id FROM depots LIMIT 1)),
('Menuiserie Aluminium', 'Profilés aluminium et accessoires', (SELECT id FROM depots LIMIT 1));

-- =====================================================
-- 22. INSERTION DES MATÉRIAUX
-- =====================================================

INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 

-- PLOMBERIE
('PLB-001', 'Tuyau PVC Ø110mm', 'Tuyau PVC évacuation eaux usées diamètre 110mm', 'ml', 200, 50, 'Plastiques du Cameroun', (SELECT id FROM categories WHERE nom = 'Plomberie'), (SELECT id FROM depots LIMIT 1)),
('PLB-002', 'Robinet mitigeur cuisine', 'Mitigeur évier cuisine avec bec orientable', 'unité', 25, 10, 'Sanitaires Plus', (SELECT id FROM categories WHERE nom = 'Plomberie'), (SELECT id FROM depots LIMIT 1)),
('PLB-003', 'Coude PVC 90° Ø110', 'Coude PVC 90 degrés pour évacuation', 'unité', 100, 30, 'Plastiques du Cameroun', (SELECT id FROM categories WHERE nom = 'Plomberie'), (SELECT id FROM depots LIMIT 1)),

-- ÉLECTRICITÉ
('ELC-001', 'Câble électrique 2.5mm²', 'Câble électrique souple 2.5mm² pour prises', 'rouleau 100m', 15, 5, 'Électro Cameroun', (SELECT id FROM categories WHERE nom = 'Électricité'), (SELECT id FROM depots LIMIT 1)),
('ELC-002', 'Interrupteur simple', 'Interrupteur va-et-vient blanc standard', 'unité', 80, 20, 'Électro Cameroun', (SELECT id FROM categories WHERE nom = 'Électricité'), (SELECT id FROM depots LIMIT 1)),
('ELC-003', 'Prise de courant 16A', 'Prise de courant 2P+T 16A avec terre', 'unité', 60, 15, 'Électro Cameroun', (SELECT id FROM categories WHERE nom = 'Électricité'), (SELECT id FROM depots LIMIT 1)),

-- FER ET ACIER
('FER-008', 'Fer à béton Ø8mm', 'Barre de fer haute adhérence 8mm pour armatures légères', 'barre 12m', 150, 50, 'ALUCAM', (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),
('FER-010', 'Fer à béton Ø10mm', 'Barre de fer haute adhérence 10mm pour armatures moyennes', 'barre 12m', 120, 40, 'ALUCAM', (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),
('FER-012', 'Fer à béton Ø12mm', 'Barre de fer haute adhérence 12mm pour armatures principales', 'barre 12m', 100, 30, 'ALUCAM', (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),
('FER-016', 'Fer à béton Ø16mm', 'Barre de fer haute adhérence 16mm pour gros œuvre', 'barre 12m', 80, 25, 'ALUCAM', (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),
('TRE-001', 'Treillis soudé ST25', 'Treillis soudé maille 150x150mm pour dalles', 'panneau 6x2.4m', 60, 20, 'ALUCAM', (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),

-- CÉRAMIQUE
('CER-001', 'Carrelage sol 60x60', 'Carrelage grès cérame rectifié 60x60cm', 'm²', 200, 50, 'Céramiques du Cameroun', (SELECT id FROM categories WHERE nom = 'Céramique'), (SELECT id FROM depots LIMIT 1)),
('CER-002', 'Faïence murale 25x40', 'Faïence blanche brillante pour salle de bain', 'm²', 150, 40, 'Céramiques du Cameroun', (SELECT id FROM categories WHERE nom = 'Céramique'), (SELECT id FROM depots LIMIT 1)),

-- BRIQUE ET BLOCS
('BLO-150', 'Parpaing 15x20x40', 'Bloc béton creux 15cm pour cloisons', 'unité', 800, 200, 'SOCAVER', (SELECT id FROM categories WHERE nom = 'Brique et Blocs'), (SELECT id FROM depots LIMIT 1)),
('BLO-200', 'Parpaing 20x20x40', 'Bloc béton creux 20cm pour murs porteurs', 'unité', 500, 100, 'SOCAVER', (SELECT id FROM categories WHERE nom = 'Brique et Blocs'), (SELECT id FROM depots LIMIT 1)),
('BLO-250', 'Parpaing 25x20x40', 'Bloc béton creux 25cm pour murs épais', 'unité', 300, 75, 'SOCAVER', (SELECT id FROM categories WHERE nom = 'Brique et Blocs'), (SELECT id FROM depots LIMIT 1)),
('BRI-006', 'Brique rouge 6 trous', 'Brique terre cuite standard pour maçonnerie', 'unité', 1000, 200, 'SOCAVER', (SELECT id FROM categories WHERE nom = 'Brique et Blocs'), (SELECT id FROM depots LIMIT 1)),
('BRI-012', 'Brique rouge 12 trous', 'Brique terre cuite isolante pour murs extérieurs', 'unité', 600, 150, 'SOCAVER', (SELECT id FROM categories WHERE nom = 'Brique et Blocs'), (SELECT id FROM depots LIMIT 1)),

-- BOIS
('BOI-001', 'Chevron 63x75mm', 'Chevron sapin traité pour charpente', 'ml', 200, 50, 'Scierie du Mbam', (SELECT id FROM categories WHERE nom = 'Bois'), (SELECT id FROM depots LIMIT 1)),
('BOI-002', 'Planche 27x200mm', 'Planche sapin rabotée pour coffrage', 'ml', 150, 40, 'Scierie du Mbam', (SELECT id FROM categories WHERE nom = 'Bois'), (SELECT id FROM depots LIMIT 1)),
('BOI-003', 'Contreplaqué 18mm', 'Panneau contreplaqué marine pour coffrage', 'm²', 80, 20, 'Scierie du Mbam', (SELECT id FROM categories WHERE nom = 'Bois'), (SELECT id FROM depots LIMIT 1)),

-- PEINTURE
('PEI-001', 'Peinture blanche mate', 'Peinture acrylique mate pour murs intérieurs', 'litre', 120, 30, 'Peintures du Cameroun', (SELECT id FROM categories WHERE nom = 'Peinture'), (SELECT id FROM depots LIMIT 1)),
('PEI-002', 'Peinture façade', 'Peinture acrylique pour façades extérieures', 'litre', 80, 20, 'Peintures du Cameroun', (SELECT id FROM categories WHERE nom = 'Peinture'), (SELECT id FROM depots LIMIT 1)),
('PEI-003', 'Vernis bois incolore', 'Vernis polyuréthane pour protection du bois', 'litre', 40, 10, 'Peintures du Cameroun', (SELECT id FROM categories WHERE nom = 'Peinture'), (SELECT id FROM depots LIMIT 1)),

-- QUINCAILLERIE
('QUI-001', 'Vis à bois 4x50mm', 'Vis à bois tête fraisée pour assemblage', 'paquet 100pcs', 50, 15, 'Quincaillerie Centrale', (SELECT id FROM categories WHERE nom = 'Quincaillerie'), (SELECT id FROM depots LIMIT 1)),
('QUI-002', 'Clous 70mm', 'Clous en acier pour charpente', 'kg', 80, 20, 'Quincaillerie Centrale', (SELECT id FROM categories WHERE nom = 'Quincaillerie'), (SELECT id FROM depots LIMIT 1)),
('QUI-003', 'Charnière 100mm', 'Charnière acier inoxydable pour porte', 'unité', 60, 15, 'Quincaillerie Centrale', (SELECT id FROM categories WHERE nom = 'Quincaillerie'), (SELECT id FROM depots LIMIT 1)),

-- CIMENT ET BÉTON
('CIM-001', 'Ciment Portland CEM I 42.5', 'Ciment haute résistance pour béton armé et structures importantes', 'sac 50kg', 150, 50, 'CIMENCAM', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('CIM-002', 'Ciment CEM II 32.5', 'Ciment pour maçonnerie générale et travaux courants', 'sac 50kg', 200, 75, 'CIMENCAM', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('CHA-001', 'Chaux hydraulique NHL 3.5', 'Chaux pour mortiers traditionnels et enduits', 'sac 25kg', 80, 20, 'CIMENCAM', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('SAB-001', 'Sable fin 0/2', 'Sable fin pour mortier, enduits et béton fin', 'm³', 50, 20, 'Carrière Nkolbisson', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('SAB-002', 'Sable moyen 0/4', 'Sable moyen pour béton et maçonnerie', 'm³', 40, 15, 'Carrière Nkolbisson', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('GRA-515', 'Gravier 5/15', 'Gravier concassé pour béton de structure', 'm³', 30, 15, 'Carrière Nkolbisson', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),
('GRA-1525', 'Gravier 15/25', 'Gros gravier pour béton de masse et fondations', 'm³', 25, 10, 'Carrière Nkolbisson', (SELECT id FROM categories WHERE nom = 'Ciment et Béton'), (SELECT id FROM depots LIMIT 1)),

-- ÉTANCHÉITÉ ET ISOLATION
('ETA-001', 'Membrane d''étanchéité', 'Membrane bitumineuse pour toiture terrasse', 'rouleau 10m²', 25, 8, 'Étanchéité Pro', (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation'), (SELECT id FROM depots LIMIT 1)),
('ISO-001', 'Laine de verre 100mm', 'Isolant thermique et phonique en laine de verre', 'm²', 200, 50, 'Isolation Cameroun', (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation'), (SELECT id FROM depots LIMIT 1)),
('ETA-002', 'Mastic d''étanchéité', 'Mastic polyuréthane pour joints d''étanchéité', 'cartouche 310ml', 40, 12, 'Étanchéité Pro', (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation'), (SELECT id FROM depots LIMIT 1)),

-- MENUISERIE ALUMINIUM
('ALU-001', 'Profilé alu fenêtre', 'Profilé aluminium pour châssis de fenêtre', 'barre 6m', 50, 15, 'Aluminium Cameroun', (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium'), (SELECT id FROM depots LIMIT 1)),
('ALU-002', 'Vitrage 4mm', 'Verre clair 4mm pour fenêtres', 'm²', 100, 25, 'Verrerie Moderne', (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium'), (SELECT id FROM depots LIMIT 1)),
('ALU-003', 'Joint d''étanchéité alu', 'Joint EPDM pour menuiserie aluminium', 'ml', 200, 50, 'Aluminium Cameroun', (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium'), (SELECT id FROM depots LIMIT 1));

-- =====================================================
-- 23. DONNÉES DE DÉMONSTRATION
-- =====================================================

-- Insérer quelques demandes de test
INSERT INTO demandes_materiaux (
    numero_demande, demandeur_id, depot_id, statut, priorite, 
    commentaire_demandeur, date_livraison_souhaitee
) VALUES 
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE email = 'izmet@dantela.cm'),
    (SELECT id FROM depots LIMIT 1),
    'en_attente',
    'normale',
    'Matériaux pour fondations du bâtiment A',
    CURRENT_DATE + INTERVAL '3 days'
),
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE email = 'directeur@dantela.cm'),
    (SELECT id FROM depots LIMIT 1),
    'approuvee',
    'haute',
    'Matériaux urgents pour réparation',
    CURRENT_DATE + INTERVAL '1 day'
);

-- Insérer des items pour les demandes de test
INSERT INTO demande_items (demande_id, materiau_id, quantite_demandee, quantite_accordee) 
SELECT 
    dm.id,
    m.id,
    CASE 
        WHEN m.unite LIKE '%sac%' THEN 10
        WHEN m.unite LIKE '%m³%' THEN 5
        WHEN m.unite LIKE '%barre%' THEN 20
        WHEN m.unite LIKE '%unité%' THEN 50
        ELSE 15
    END,
    CASE 
        WHEN dm.statut = 'approuvee' THEN 
            CASE 
                WHEN m.unite LIKE '%sac%' THEN 8
                WHEN m.unite LIKE '%m³%' THEN 4
                WHEN m.unite LIKE '%barre%' THEN 18
                WHEN m.unite LIKE '%unité%' THEN 45
                ELSE 12
            END
        ELSE 0
    END
FROM demandes_materiaux dm
CROSS JOIN (SELECT * FROM materiaux LIMIT 3) m;

-- Insérer quelques matériaux en panne de démonstration
INSERT INTO materiaux_en_panne (
    materiau_id, quantite, provenance_chantier, description_panne, 
    gravite, reparable, cout_reparation_estime, utilisateur_id
) VALUES 
(
    (SELECT id FROM materiaux WHERE code_produit = 'FER-008' LIMIT 1),
    5,
    'Chantier Bastos',
    'Barres de fer tordues lors du transport',
    'moyenne',
    true,
    25000.00,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
),
(
    (SELECT id FROM materiaux WHERE code_produit = 'BOI-001' LIMIT 1),
    10,
    'Chantier Mvog-Mbi',
    'Chevrons cassés par mauvaise manipulation',
    'grave',
    false,
    0.00,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
),
(
    (SELECT id FROM materiaux WHERE code_produit = 'ELC-002' LIMIT 1),
    3,
    'Chantier ONANA',
    'Interrupteurs défaillants après installation',
    'legere',
    true,
    5000.00,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
);

-- Insérer quelques retours utilisés de démonstration
INSERT INTO materiaux_retour_utilise (
    materiau_id, quantite, provenance_chantier, etat, 
    description_etat, nettoyage_requis, utilisateur_id
) VALUES 
(
    (SELECT id FROM materiaux WHERE code_produit = 'BOI-003' LIMIT 1),
    15,
    'Chantier Bastos',
    'bon',
    'Contreplaqué en excellent état, utilisé pour coffrage temporaire',
    true,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
),
(
    (SELECT id FROM materiaux WHERE code_produit = 'QUI-001' LIMIT 1),
    2,
    'Chantier Mvog-Mbi',
    'usage',
    'Vis partiellement utilisées, encore fonctionnelles',
    false,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
),
(
    (SELECT id FROM materiaux WHERE code_produit = 'PLB-001' LIMIT 1),
    20,
    'Chantier ONANA',
    'bon',
    'Tuyaux PVC récupérés en parfait état',
    true,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
);

-- =====================================================
-- 24. MESSAGES DE DÉMONSTRATION (SÉCURISÉS)
-- =====================================================

-- Insérer des messages de démonstration avec content sécurisé
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
),
(
    'notification',
    'Alerte Stock Faible',
    'Attention: Plusieurs matériaux ont un stock faible. Vérifiez les niveaux de stock et planifiez les réapprovisionnements.',
    (SELECT id FROM users WHERE role = 'directeur' LIMIT 1),
    'magazinier',
    'system',
    'stock_alert',
    'high'
);

-- Créer les entrées dans message_recipients pour les messages de rôle (SÉCURISÉ)
INSERT INTO message_recipients (message_id, user_id)
SELECT DISTINCT m.id, u.id
FROM messages m
CROSS JOIN users u
WHERE m.to_role IS NOT NULL 
AND u.role = m.to_role 
AND u.is_active = true
AND (m.from_user_id IS NULL OR m.from_user_id != u.id)
ON CONFLICT (message_id, user_id) DO NOTHING;

-- =====================================================
-- 25. RÉSUMÉ ET VÉRIFICATION FINALE
-- =====================================================

-- Affichage du résumé de création
SELECT '🎉 BASE DE DONNÉES DANTELA CRÉÉE AVEC SUCCÈS!' as message;

-- Vérification des tables créées
SELECT 
    '📊 TABLES CRÉÉES:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'depots', 'categories', 'materiaux', 
    'demandes_materiaux', 'demande_items', 
    'bons_livraison', 'bon_items', 'mouvements_stock',
    'messages', 'message_recipients',
    'materiaux_en_panne', 'materiaux_retour_utilise'
);

-- Vérification des fonctions créées
SELECT 
    '🔧 FONCTIONS CRÉÉES:' as info,
    COUNT(*) as nombre_fonctions
FROM pg_proc 
WHERE proname IN (
    'update_updated_at_column', 'generate_numero_demande', 'generate_numero_bon',
    'create_automatic_message', 'mark_message_as_read', 'get_unread_count',
    'notify_new_demande', 'notify_demande_validated', 'notify_bon_created',
    'get_panne_stats', 'get_retour_stats'
);

-- Vérification des vues créées
SELECT 
    '📈 VUES CRÉÉES:' as info,
    COUNT(*) as nombre_vues
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%';

-- Résumé des données insérées
SELECT '📦 DONNÉES INSÉRÉES:' as info;
SELECT 
    (SELECT COUNT(*) FROM users) as utilisateurs,
    (SELECT COUNT(*) FROM depots) as depots,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM materiaux) as materiaux,
    (SELECT COUNT(*) FROM demandes_materiaux) as demandes_test,
    (SELECT COUNT(*) FROM materiaux_en_panne) as materiaux_en_panne,
    (SELECT COUNT(*) FROM materiaux_retour_utilise) as retours_utilises,
    (SELECT COUNT(*) FROM messages) as messages_demo;

-- Affichage des comptes par défaut
SELECT '👥 COMPTES PAR DÉFAUT:' as info;
SELECT email, nom, prenom, role, is_active FROM users ORDER BY role;

-- Affichage des catégories et matériaux
SELECT '🏗️ MATÉRIAUX PAR CATÉGORIE:' as info;
SELECT 
    c.nom as categorie,
    COUNT(m.id) as nombre_materiaux,
    SUM(m.stock_actuel) as total_stock
FROM categories c
LEFT JOIN materiaux m ON c.id = m.categorie_id
GROUP BY c.id, c.nom
ORDER BY c.nom;

-- Test des fonctions statistiques
SELECT '📊 TEST FONCTIONS STATISTIQUES:' as info;
SELECT * FROM get_panne_stats();
SELECT * FROM get_retour_stats();

-- Affichage final
SELECT '🚀 SYSTÈME DANTELA PRÊT À UTILISER!' as message;
SELECT '📱 Connectez-vous avec: directeur@dantela.cm / admin123' as connexion;
SELECT '🏗️ Ou: soulemane@dantela.cm / admin123 (Magazinier)' as connexion_alt;
SELECT '👷 Ou: izmet@dantela.cm / admin123 (Chef de chantier)' as connexion_chef;

/*
  🎯 FONCTIONNALITÉS OPÉRATIONNELLES:
  
  ✅ Gestion des utilisateurs (3 rôles)
  ✅ Gestion des dépôts et matériaux
  ✅ Système de commandes complet
  ✅ Distribution directe
  ✅ Gestion état matériaux (panne/retour)
  ✅ Notifications temps réel
  ✅ Bons de livraison A4
  ✅ Historique des mouvements
  ✅ Rapports et statistiques
  ✅ Interface multilingue (FR/EN/TR)
  
  🚀 VOTRE LOGICIEL DANTELA EST PRÊT!
*/