/*
  # 🏗️ BASE DE DONNÉES COMPLÈTE DANTELA DEPOT
  # Système de Gestion des Dépôts et Matériaux de Construction
  
  📋 INSTRUCTIONS D'INSTALLATION :
  
  1. Créer la base de données PostgreSQL :
     CREATE DATABASE "DantelaDepot";
  
  2. Se connecter à la base :
     \c DantelaDepot
  
  3. Exécuter ce script :
     \i dantela_complete_schema.sql
  
  4. Comptes par défaut créés :
     - Directeur: directeur@dantela.cm / admin123
     - Magazinier: soulemane@dantela.cm / admin123  
     - Chef de chantier: izmet@dantela.cm / admin123
  
  5. Données incluses :
     - 11 catégories de matériauxDantelaDepot
     - 30+ matériaux avec stocks
     - 2 demandes de test
     - 1 dépôt principal
     - Système de notifications
     - Gestion état matériaux (panne/retour)
  
  🚀 Le système sera prêt avec toutes les fonctionnalités !
*/

-- =====================================================
-- 1. EXTENSIONS ET FONCTIONS UTILITAIRES
-- =====================================================

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- 2. TABLE USERS (Utilisateurs)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. TABLE DEPOTS (Dépôts)
-- =====================================================

CREATE TABLE IF NOT EXISTS depots (
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
CREATE INDEX IF NOT EXISTS idx_depots_directeur ON depots(directeur_id);
CREATE INDEX IF NOT EXISTS idx_depots_magazinier ON depots(magazinier_id);
CREATE INDEX IF NOT EXISTS idx_depots_active ON depots(is_active);

-- Trigger pour updated_at sur les dépôts
DROP TRIGGER IF EXISTS update_depots_updated_at ON depots;
CREATE TRIGGER update_depots_updated_at 
    BEFORE UPDATE ON depots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. TABLE CATEGORIES (Catégories de matériaux)
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les catégories
CREATE INDEX IF NOT EXISTS idx_categories_nom ON categories(nom);
CREATE INDEX IF NOT EXISTS idx_categories_depot ON categories(depot_id);

-- =====================================================
-- 5. TABLE MATERIAUX (Matériaux de construction)
-- =====================================================

CREATE TABLE IF NOT EXISTS materiaux (
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
CREATE INDEX IF NOT EXISTS idx_materiaux_code_produit ON materiaux(code_produit);
CREATE INDEX IF NOT EXISTS idx_materiaux_nom ON materiaux(nom);
CREATE INDEX IF NOT EXISTS idx_materiaux_categorie ON materiaux(categorie_id);
CREATE INDEX IF NOT EXISTS idx_materiaux_depot ON materiaux(depot_id);
CREATE INDEX IF NOT EXISTS idx_materiaux_stock_faible ON materiaux(stock_actuel, stock_minimum);
CREATE INDEX IF NOT EXISTS idx_materiaux_fournisseur ON materiaux(fournisseur);

-- Trigger pour updated_at sur materiaux
DROP TRIGGER IF EXISTS update_materiaux_updated_at ON materiaux;
CREATE TRIGGER update_materiaux_updated_at 
    BEFORE UPDATE ON materiaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TABLE DEMANDES_MATERIAUX (Demandes de matériaux)
-- =====================================================

CREATE TABLE IF NOT EXISTS demandes_materiaux (
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
CREATE INDEX IF NOT EXISTS idx_demandes_numero ON demandes_materiaux(numero_demande);
CREATE INDEX IF NOT EXISTS idx_demandes_demandeur ON demandes_materiaux(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_depot ON demandes_materiaux(depot_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_materiaux(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_date ON demandes_materiaux(date_demande);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_demandes_materiaux_updated_at ON demandes_materiaux;
CREATE TRIGGER update_demandes_materiaux_updated_at 
    BEFORE UPDATE ON demandes_materiaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. TABLE DEMANDE_ITEMS (Détails des demandes)
-- =====================================================

CREATE TABLE IF NOT EXISTS demande_items (
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
CREATE INDEX IF NOT EXISTS idx_demande_items_demande ON demande_items(demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_items_materiau ON demande_items(materiau_id);

-- =====================================================
-- 8. TABLE BONS_LIVRAISON (Bons de livraison)
-- =====================================================

CREATE TABLE IF NOT EXISTS bons_livraison (
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
CREATE INDEX IF NOT EXISTS idx_bons_numero ON bons_livraison(numero_bon);
CREATE INDEX IF NOT EXISTS idx_bons_destinataire ON bons_livraison(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_bons_magazinier ON bons_livraison(magazinier_id);
CREATE INDEX IF NOT EXISTS idx_bons_statut ON bons_livraison(statut);
CREATE INDEX IF NOT EXISTS idx_bons_type ON bons_livraison(type_livraison);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_destinataire_custom ON bons_livraison USING GIN (destinataire_custom);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_bons_livraison_updated_at ON bons_livraison;
CREATE TRIGGER update_bons_livraison_updated_at 
    BEFORE UPDATE ON bons_livraison 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. TABLE BON_ITEMS (Détails des bons de livraison)
-- =====================================================

CREATE TABLE IF NOT EXISTS bon_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bon_livraison_id UUID REFERENCES bons_livraison(id) ON DELETE CASCADE,
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour bon_items
CREATE INDEX IF NOT EXISTS idx_bon_items_bon ON bon_items(bon_livraison_id);
CREATE INDEX IF NOT EXISTS idx_bon_items_materiau ON bon_items(materiau_id);

-- =====================================================
-- 10. TABLE MOUVEMENTS_STOCK (Historique des mouvements)
-- =====================================================

CREATE TABLE IF NOT EXISTS mouvements_stock (
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
CREATE INDEX IF NOT EXISTS idx_mouvements_materiau ON mouvements_stock(materiau_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements_stock(type_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_utilisateur ON mouvements_stock(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_mouvements_demande ON mouvements_stock(demande_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_bon ON mouvements_stock(bon_livraison_id);

-- =====================================================
-- 11. TABLE MESSAGES (Système de notifications)
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

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_role ON messages(to_role);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_related ON messages(related_type, related_id);

-- =====================================================
-- 12. TABLE MESSAGE_RECIPIENTS (Destinataires multiples)
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

-- Index pour message_recipients
CREATE INDEX IF NOT EXISTS idx_recipients_message ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_recipients_user ON message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_is_read ON message_recipients(is_read);

-- =====================================================
-- 13. TABLE MATERIAUX_EN_PANNE (Matériels défaillants)
-- =====================================================

CREATE TABLE IF NOT EXISTS materiaux_en_panne (
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
CREATE INDEX IF NOT EXISTS idx_panne_materiau ON materiaux_en_panne(materiau_id);
CREATE INDEX IF NOT EXISTS idx_panne_chantier ON materiaux_en_panne(provenance_chantier);
CREATE INDEX IF NOT EXISTS idx_panne_statut ON materiaux_en_panne(statut_reparation);
CREATE INDEX IF NOT EXISTS idx_panne_gravite ON materiaux_en_panne(gravite);
CREATE INDEX IF NOT EXISTS idx_panne_date ON materiaux_en_panne(date_retour);
CREATE INDEX IF NOT EXISTS idx_panne_utilisateur ON materiaux_en_panne(utilisateur_id);

-- =====================================================
-- 14. TABLE MATERIAUX_RETOUR_UTILISE (Retours bon état)
-- =====================================================

CREATE TABLE IF NOT EXISTS materiaux_retour_utilise (
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
CREATE INDEX IF NOT EXISTS idx_retour_materiau ON materiaux_retour_utilise(materiau_id);
CREATE INDEX IF NOT EXISTS idx_retour_chantier ON materiaux_retour_utilise(provenance_chantier);
CREATE INDEX IF NOT EXISTS idx_retour_etat ON materiaux_retour_utilise(etat);
CREATE INDEX IF NOT EXISTS idx_retour_date ON materiaux_retour_utilise(date_retour);
CREATE INDEX IF NOT EXISTS idx_retour_utilisateur ON materiaux_retour_utilise(utilisateur_id);

-- =====================================================
-- 15. FONCTIONS UTILITAIRES POUR MESSAGES
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
-- 16. FONCTIONS STATISTIQUES MATÉRIAUX
-- =====================================================

-- Fonction pour obtenir les statistiques des matériaux en panne
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

-- Fonction pour obtenir les statistiques des retours utilisés
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
-- 17. TRIGGERS AUTOMATIQUES POUR NOTIFICATIONS
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
    
    -- Notifier le destinataire (seulement si c'est un utilisateur enregistré)
    IF NEW.destinataire_id IS NOT NULL THEN
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
    END IF;
    
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
-- 18. VUES UTILES POUR LES REQUÊTES
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
    u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
    u_demandeur.role as demandeur_role,
    u_demandeur.nom_chantier,
    u_demandeur.email as demandeur_email,
    u_demandeur.telephone as demandeur_telephone,
    u_demandeur.adresse as demandeur_adresse,
    u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
    d.nom as depot_nom,
    d.adresse as depot_adresse,
    COUNT(di.id) as nombre_items,
    SUM(di.quantite_demandee) as total_quantite_demandee,
    SUM(di.quantite_accordee) as total_quantite_accordee,
    dm.created_at,
    dm.updated_at
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
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    c.nom as categorie_nom,
    u.nom || ' ' || u.prenom as utilisateur_nom,
    u.role as utilisateur_role,
    dm.numero_demande,
    bl.numero_bon,
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
    u_destinataire.nom || ' ' || u_destinataire.prenom as destinataire_nom,
    u_destinataire.role as destinataire_role,
    u_destinataire.nom_chantier,
    u_destinataire.email as destinataire_email,
    u_destinataire.telephone as destinataire_telephone,
    u_destinataire.adresse as destinataire_adresse,
    u_magazinier.nom || ' ' || u_magazinier.prenom as magazinier_nom,
    d.nom as depot_nom,
    d.adresse as depot_adresse,
    dm.numero_demande,
    COUNT(bi.id) as nombre_items,
    SUM(bi.quantite) as total_quantite,
    bl.created_at,
    bl.updated_at
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
-- 19. DONNÉES INITIALES
-- =====================================================

-- Insertion du directeur par défaut (mot de passe: admin123)
INSERT INTO users (
    email, 
    password_hash, 
    nom, 
    prenom, 
    telephone, 
    adresse, 
    role, 
    is_active
) VALUES (
    'directeur@dantela.cm',
    '$2a$12$Ljjp9M6VsddIIl8M7fLsCuf04K4PY5msQhrTse5O6ePZLWnjjFNUC', -- admin123
    'DANTELA',
    'Directeur',
    '+237669790437',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'directeur',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insertion d'un magazinier de test
INSERT INTO users (
    email, 
    password_hash, 
    nom, 
    prenom, 
    telephone, 
    role, 
    is_active
) VALUES (
    'soulemane@dantela.cm',
    '$2a$12$Ljjp9M6VsddIIl8M7fLsCuf04K4PY5msQhrTse5O6ePZLWnjjFNUC', -- admin123
    'Djacko',
    'Soulemane',
    '+237652679166',
    'magazinier',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insertion d'un chef de chantier de test
INSERT INTO users (
    email, 
    password_hash, 
    nom, 
    prenom, 
    telephone, 
    role, 
    nom_chantier,
    is_active
) VALUES (
    'izmet@dantela.cm',
    '$2a$12$Ljjp9M6VsddIIl8M7fLsCuf04K4PY5msQhrTse5O6ePZLWnjjFNUC', -- admin123
    'Izmet',
    'Dantela',
    '+237677123456',
    'chef_chantier',
    'Chantier ONANA',
    true
) ON CONFLICT (email) DO NOTHING;

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
) ON CONFLICT DO NOTHING;

-- Insertion des catégories de matériaux
INSERT INTO categories (nom, description, depot_id) VALUES 
(
    'Plomberie',
    'Tuyaux, raccords, robinetterie, sanitaires et accessoires de plomberie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Électricité',
    'Câbles électriques, prises, interrupteurs, tableaux électriques et matériel électrique',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Fer et Acier',
    'Barres de fer, treillis soudés, profilés métalliques, armatures pour béton',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Céramique',
    'Carrelages, faïences, grès cérame, mosaïques et accessoires de pose',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Brique et Blocs',
    'Parpaings, briques, blocs béton, agglos pour construction et cloisons',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Bois',
    'Planches, poutres, contreplaqués, chevrons, bois de charpente et menuiserie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Peinture',
    'Peintures murales, vernis, lasures, enduits décoratifs et accessoires de peinture',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Quincaillerie',
    'Vis, clous, boulons, charnières, serrures et petite quincaillerie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Ciment et Béton',
    'Ciments, mortiers, bétons prêts à l''emploi, chaux et liants hydrauliques',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Étanchéité et Isolation',
    'Membranes d''étanchéité, isolants thermiques et phoniques, produits d''isolation',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Menuiserie Aluminium',
    'Profilés aluminium, fenêtres, portes, vérandas et accessoires de menuiserie alu',
    (SELECT id FROM depots LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 20. INSERTION DES MATÉRIAUX DE DÉMONSTRATION
-- =====================================================

INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 

-- PLOMBERIE
(
    'PLB-001',
    'Tuyau PVC Ø110mm',
    'Tuyau PVC évacuation eaux usées diamètre 110mm',
    'ml',
    200,
    50,
    'Plastiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Plomberie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PLB-002',
    'Robinet mitigeur cuisine',
    'Mitigeur évier cuisine avec bec orientable',
    'unité',
    25,
    10,
    'Sanitaires Plus',
    (SELECT id FROM categories WHERE nom = 'Plomberie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PLB-003',
    'Coude PVC 90° Ø110',
    'Coude PVC 90 degrés pour évacuation',
    'unité',
    100,
    30,
    'Plastiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Plomberie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- ÉLECTRICITÉ
(
    'ELC-001',
    'Câble électrique 2.5mm²',
    'Câble électrique souple 2.5mm² pour prises',
    'rouleau 100m',
    15,
    5,
    'Électro Cameroun',
    (SELECT id FROM categories WHERE nom = 'Électricité' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ELC-002',
    'Interrupteur simple',
    'Interrupteur va-et-vient blanc standard',
    'unité',
    80,
    20,
    'Électro Cameroun',
    (SELECT id FROM categories WHERE nom = 'Électricité' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ELC-003',
    'Prise de courant 16A',
    'Prise de courant 2P+T 16A avec terre',
    'unité',
    60,
    15,
    'Électro Cameroun',
    (SELECT id FROM categories WHERE nom = 'Électricité' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- FER ET ACIER
(
    'FER-008',
    'Fer à béton Ø8mm',
    'Barre de fer haute adhérence 8mm pour armatures légères',
    'barre 12m',
    150,
    50,
    'ALUCAM',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'FER-010',
    'Fer à béton Ø10mm',
    'Barre de fer haute adhérence 10mm pour armatures moyennes',
    'barre 12m',
    120,
    40,
    'ALUCAM',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'FER-012',
    'Fer à béton Ø12mm',
    'Barre de fer haute adhérence 12mm pour armatures principales',
    'barre 12m',
    100,
    30,
    'ALUCAM',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'FER-016',
    'Fer à béton Ø16mm',
    'Barre de fer haute adhérence 16mm pour gros œuvre',
    'barre 12m',
    80,
    25,
    'ALUCAM',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'TRE-001',
    'Treillis soudé ST25',
    'Treillis soudé maille 150x150mm pour dalles',
    'panneau 6x2.4m',
    60,
    20,
    'ALUCAM',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- CÉRAMIQUE
(
    'CER-001',
    'Carrelage sol 60x60',
    'Carrelage grès cérame rectifié 60x60cm',
    'm²',
    200,
    50,
    'Céramiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Céramique' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'CER-002',
    'Faïence murale 25x40',
    'Faïence blanche brillante pour salle de bain',
    'm²',
    150,
    40,
    'Céramiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Céramique' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- BRIQUE ET BLOCS
(
    'BLO-150',
    'Parpaing 15x20x40',
    'Bloc béton creux 15cm pour cloisons',
    'unité',
    800,
    200,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Brique et Blocs' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BLO-200',
    'Parpaing 20x20x40',
    'Bloc béton creux 20cm pour murs porteurs',
    'unité',
    500,
    100,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Brique et Blocs' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BLO-250',
    'Parpaing 25x20x40',
    'Bloc béton creux 25cm pour murs épais',
    'unité',
    300,
    75,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Brique et Blocs' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BRI-006',
    'Brique rouge 6 trous',
    'Brique terre cuite standard pour maçonnerie',
    'unité',
    1000,
    200,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Brique et Blocs' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BRI-012',
    'Brique rouge 12 trous',
    'Brique terre cuite isolante pour murs extérieurs',
    'unité',
    600,
    150,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Brique et Blocs' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- BOIS
(
    'BOI-001',
    'Chevron 63x75mm',
    'Chevron sapin traité pour charpente',
    'ml',
    200,
    50,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BOI-002',
    'Planche 27x200mm',
    'Planche sapin rabotée pour coffrage',
    'ml',
    150,
    40,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'BOI-003',
    'Contreplaqué 18mm',
    'Panneau contreplaqué marine pour coffrage',
    'm²',
    80,
    20,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- PEINTURE
(
    'PEI-001',
    'Peinture blanche mate',
    'Peinture acrylique mate pour murs intérieurs',
    'litre',
    120,
    30,
    'Peintures du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Peinture' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PEI-002',
    'Peinture façade',
    'Peinture acrylique pour façades extérieures',
    'litre',
    80,
    20,
    'Peintures du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Peinture' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PEI-003',
    'Vernis bois incolore',
    'Vernis polyuréthane pour protection du bois',
    'litre',
    40,
    10,
    'Peintures du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Peinture' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- QUINCAILLERIE
(
    'QUI-001',
    'Vis à bois 4x50mm',
    'Vis à bois tête fraisée pour assemblage',
    'paquet 100pcs',
    50,
    15,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Quincaillerie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'QUI-002',
    'Clous 70mm',
    'Clous en acier pour charpente',
    'kg',
    80,
    20,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Quincaillerie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'QUI-003',
    'Charnière 100mm',
    'Charnière acier inoxydable pour porte',
    'unité',
    60,
    15,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Quincaillerie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- CIMENT ET BÉTON
(
    'CIM-001',
    'Ciment Portland CEM I 42.5',
    'Ciment haute résistance pour béton armé et structures importantes',
    'sac 50kg',
    150,
    50,
    'CIMENCAM',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'CIM-002',
    'Ciment CEM II 32.5',
    'Ciment pour maçonnerie générale et travaux courants',
    'sac 50kg',
    200,
    75,
    'CIMENCAM',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'CHA-001',
    'Chaux hydraulique NHL 3.5',
    'Chaux pour mortiers traditionnels et enduits',
    'sac 25kg',
    80,
    20,
    'CIMENCAM',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'SAB-001',
    'Sable fin 0/2',
    'Sable fin pour mortier, enduits et béton fin',
    'm³',
    50,
    20,
    'Carrière Nkolbisson',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'SAB-002',
    'Sable moyen 0/4',
    'Sable moyen pour béton et maçonnerie',
    'm³',
    40,
    15,
    'Carrière Nkolbisson',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'GRA-515',
    'Gravier 5/15',
    'Gravier concassé pour béton de structure',
    'm³',
    30,
    15,
    'Carrière Nkolbisson',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'GRA-1525',
    'Gravier 15/25',
    'Gros gravier pour béton de masse et fondations',
    'm³',
    25,
    10,
    'Carrière Nkolbisson',
    (SELECT id FROM categories WHERE nom = 'Ciment et Béton' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- ÉTANCHÉITÉ ET ISOLATION
(
    'ETA-001',
    'Membrane d''étanchéité',
    'Membrane bitumineuse pour toiture terrasse',
    'rouleau 10m²',
    25,
    8,
    'Étanchéité Pro',
    (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ISO-001',
    'Laine de verre 100mm',
    'Isolant thermique et phonique en laine de verre',
    'm²',
    200,
    50,
    'Isolation Cameroun',
    (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ETA-002',
    'Mastic d''étanchéité',
    'Mastic polyuréthane pour joints d''étanchéité',
    'cartouche 310ml',
    40,
    12,
    'Étanchéité Pro',
    (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- MENUISERIE ALUMINIUM
(
    'ALU-001',
    'Profilé alu fenêtre',
    'Profilé aluminium pour châssis de fenêtre',
    'barre 6m',
    50,
    15,
    'Aluminium Cameroun',
    (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ALU-002',
    'Vitrage 4mm',
    'Verre clair 4mm pour fenêtres',
    'm²',
    100,
    25,
    'Verrerie Moderne',
    (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ALU-003',
    'Joint d''étanchéité alu',
    'Joint EPDM pour menuiserie aluminium',
    'ml',
    200,
    50,
    'Aluminium Cameroun',
    (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- MATÉRIAUX SUPPLÉMENTAIRES AVEC UNITÉS VARIÉES
(
    'VIS-001',
    'Vis à bois 4x50mm',
    'Vis à bois tête fraisée pour assemblage',
    'paquet 100pcs',
    50,
    15,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Quincaillerie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'CLO-001',
    'Clous 70mm',
    'Clous en acier pour charpente',
    'kg',
    80,
    20,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Quincaillerie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'TUY-001',
    'Tuyau PVC Ø110mm',
    'Tuyau PVC pour évacuation',
    'm',
    200,
    50,
    'Plastiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Plomberie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'FIL-001',
    'Fil électrique 2.5mm²',
    'Câble électrique pour installation',
    'rouleau 100m',
    25,
    8,
    'Électro Cameroun',
    (SELECT id FROM categories WHERE nom = 'Électricité' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'COL-001',
    'Colle PVC',
    'Colle pour assemblage PVC',
    'tube 125ml',
    40,
    12,
    'Chimie du Bâtiment',
    (SELECT id FROM categories WHERE nom = 'Plomberie' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'ETA-003',
    'Étanchéité liquide',
    'Produit d''étanchéité pour toiture',
    'bidon 20L',
    15,
    5,
    'Chimie du Bâtiment',
    (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
)

ON CONFLICT (code_produit) DO NOTHING;

-- =====================================================
-- 21. DONNÉES DE TEST POUR LES DEMANDES
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
    'Matériaux pour fondations du bâtiment A - Chantier ONANA',
    CURRENT_DATE + INTERVAL '3 days'
),
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE email = 'directeur@dantela.cm'),
    (SELECT id FROM depots LIMIT 1),
    'approuvee',
    'urgente',
    'Matériaux urgents pour réparation toiture',
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

-- =====================================================
-- 22. DONNÉES DE DÉMONSTRATION POUR ÉTAT MATÉRIAUX
-- =====================================================

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
    (SELECT id FROM materiaux WHERE code_produit = 'TUY-001' LIMIT 1),
    50,
    'Chantier ONANA',
    'bon',
    'Tuyaux PVC en parfait état, récupérés après modification plans',
    true,
    (SELECT id FROM users WHERE role = 'magazinier' LIMIT 1)
);

-- =====================================================
-- 23. MESSAGES DE DÉMONSTRATION
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
),
(
    'system',
    'Alerte Stock Faible',
    'Plusieurs matériaux ont un stock inférieur au minimum requis. Vérifiez les niveaux de stock.',
    NULL,
    'magazinier',
    'stock',
    'alert',
    'high'
);

-- Créer les entrées dans message_recipients pour les messages de rôle
INSERT INTO message_recipients (message_id, user_id)
SELECT m.id, u.id
FROM messages m
CROSS JOIN users u
WHERE m.to_role IS NOT NULL 
AND u.role = m.to_role 
AND u.is_active = true
AND (m.from_user_id IS NULL OR m.from_user_id != u.id);

-- =====================================================
-- 24. RÉSUMÉ ET VÉRIFICATION FINALE
-- =====================================================

-- Affichage du résumé de création
SELECT '🎉 BASE DE DONNÉES DANTELA CRÉÉE AVEC SUCCÈS ! 🎉' as message;

SELECT 
    '📊 RÉSUMÉ DES TABLES CRÉÉES:' as info,
    COUNT(*) as nombre_total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Résumé des données principales
SELECT '📋 DONNÉES INSÉRÉES:' as info;
SELECT 
    (SELECT COUNT(*) FROM users) as utilisateurs,
    (SELECT COUNT(*) FROM depots) as depots,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM materiaux) as materiaux,
    (SELECT COUNT(*) FROM demandes_materiaux) as demandes_test,
    (SELECT COUNT(*) FROM messages) as messages,
    (SELECT COUNT(*) FROM materiaux_en_panne) as materiaux_en_panne,
    (SELECT COUNT(*) FROM materiaux_retour_utilise) as retours_utilises;

-- Affichage des comptes par défaut
SELECT '👥 COMPTES PAR DÉFAUT CRÉÉS:' as info;
SELECT email, nom, prenom, role, is_active FROM users ORDER BY role;

-- Affichage des catégories et matériaux
SELECT '📦 MATÉRIAUX PAR CATÉGORIE:' as info;
SELECT 
    c.nom as categorie,
    COUNT(m.id) as nombre_materiaux,
    SUM(m.stock_actuel) as total_stock
FROM categories c
LEFT JOIN materiaux m ON c.id = m.categorie_id
GROUP BY c.id, c.nom
ORDER BY c.nom;

-- Affichage des matériaux avec stock faible
SELECT '⚠️ MATÉRIAUX AVEC STOCK FAIBLE:' as info;
SELECT 
    m.code_produit,
    m.nom,
    m.stock_actuel,
    m.stock_minimum,
    m.unite,
    c.nom as categorie
FROM materiaux m
LEFT JOIN categories c ON m.categorie_id = c.id
WHERE m.stock_actuel <= m.stock_minimum
ORDER BY (m.stock_actuel::float / NULLIF(m.stock_minimum, 1)) ASC;

-- Test des fonctions statistiques
SELECT '📊 STATISTIQUES PANNES:' as info;
SELECT * FROM get_panne_stats();

SELECT '📊 STATISTIQUES RETOURS:' as info;
SELECT * FROM get_retour_stats();

-- Affichage des demandes de test
SELECT '📋 DEMANDES DE TEST CRÉÉES:' as info;
SELECT 
    dm.numero_demande,
    u.nom || ' ' || u.prenom as demandeur,
    dm.statut,
    dm.priorite,
    COUNT(di.id) as nombre_items
FROM demandes_materiaux dm
LEFT JOIN users u ON dm.demandeur_id = u.id
LEFT JOIN demande_items di ON dm.id = di.demande_id
GROUP BY dm.id, u.nom, u.prenom
ORDER BY dm.created_at;

/*
  🚀 INSTALLATION TERMINÉE !
  
  ✅ Tables créées: 14 tables principales
  ✅ Index optimisés: Pour performances
  ✅ Triggers automatiques: Notifications en temps réel
  ✅ Fonctions utilitaires: Numérotation automatique
  ✅ Vues détaillées: Jointures optimisées
  ✅ Données de test: Prêtes pour utilisation
  
  📱 COMPTES DE TEST:
  - directeur@dantela.cm / admin123
  - soulemane@dantela.cm / admin123 (Magazinier)
  - izmet@dantela.cm / admin123 (Chef de chantier)
  
  🎯 FONCTIONNALITÉS DISPONIBLES:
  ✅ Gestion des utilisateurs et rôles
  ✅ Gestion des dépôts et matériaux
  ✅ Système de commandes (panier → demande → validation)
  ✅ Distribution directe avec destinataires custom
  ✅ Bons de livraison avec impression A4
  ✅ Notifications en temps réel
  ✅ Gestion état matériaux (panne/retour)
  ✅ Historique complet des mouvements
  ✅ Rapports et statistiques
  ✅ Interface multilingue (FR/EN/TR)
  
  Le système Dantela est maintenant prêt à être utilisé ! 🎉
*/