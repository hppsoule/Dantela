/*
  # Tables pour gestion état des matériaux - Compatible PostgreSQL Standard

  1. Nouvelles Tables
    - `materiaux_en_panne`
      - `id` (uuid, primary key)
      - `materiau_id` (uuid, foreign key)
      - `quantite` (integer)
      - `provenance_chantier` (text)
      - `description_panne` (text)
      - `gravite` (text) - legere, moyenne, grave
      - `reparable` (boolean)
      - `cout_reparation_estime` (decimal)
      - `statut_reparation` (text) - en_attente, en_cours, reparee, irreparable
      - `date_retour` (timestamp)
      - `utilisateur_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `materiaux_retour_utilise`
      - `id` (uuid, primary key)
      - `materiau_id` (uuid, foreign key)
      - `quantite` (integer)
      - `provenance_chantier` (text)
      - `etat` (text) - bon, usage, abime
      - `description_etat` (text)
      - `nettoyage_requis` (boolean)
      - `date_retour` (timestamp)
      - `utilisateur_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Index et Contraintes
    - Index sur materiau_id, provenance_chantier, statut
    - Contraintes de validation

  3. Compatible PostgreSQL Standard
    - Pas de référence à auth.uid()
    - Pas de RLS (Row Level Security)
    - Utilisation standard de PostgreSQL
*/

-- Extension pour générer des UUID (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE MATERIAUX_EN_PANNE
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

-- =====================================================
-- 2. TABLE MATERIAUX_RETOUR_UTILISE
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

-- =====================================================
-- 3. INDEX POUR PERFORMANCES
-- =====================================================

-- Index pour materiaux_en_panne
CREATE INDEX IF NOT EXISTS idx_panne_materiau ON materiaux_en_panne(materiau_id);
CREATE INDEX IF NOT EXISTS idx_panne_chantier ON materiaux_en_panne(provenance_chantier);
CREATE INDEX IF NOT EXISTS idx_panne_statut ON materiaux_en_panne(statut_reparation);
CREATE INDEX IF NOT EXISTS idx_panne_gravite ON materiaux_en_panne(gravite);
CREATE INDEX IF NOT EXISTS idx_panne_date ON materiaux_en_panne(date_retour);
CREATE INDEX IF NOT EXISTS idx_panne_utilisateur ON materiaux_en_panne(utilisateur_id);

-- Index pour materiaux_retour_utilise
CREATE INDEX IF NOT EXISTS idx_retour_materiau ON materiaux_retour_utilise(materiau_id);
CREATE INDEX IF NOT EXISTS idx_retour_chantier ON materiaux_retour_utilise(provenance_chantier);
CREATE INDEX IF NOT EXISTS idx_retour_etat ON materiaux_retour_utilise(etat);
CREATE INDEX IF NOT EXISTS idx_retour_date ON materiaux_retour_utilise(date_retour);
CREATE INDEX IF NOT EXISTS idx_retour_utilisateur ON materiaux_retour_utilise(utilisateur_id);

-- =====================================================
-- 4. VUES UTILES POUR REQUÊTES
-- =====================================================

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
-- 5. FONCTIONS UTILITAIRES
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
        COUNT(CASE WHEN gravite = 'legere' THEN 1 END) as pannes_legeres,
        COUNT(CASE WHEN gravite = 'moyenne' THEN 1 END) as pannes_moyennes,
        COUNT(CASE WHEN gravite = 'grave' THEN 1 END) as pannes_graves,
        COUNT(CASE WHEN reparable = true THEN 1 END) as reparables,
        COUNT(CASE WHEN reparable = false THEN 1 END) as irreparables,
        COUNT(CASE WHEN statut_reparation = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN statut_reparation = 'en_cours' THEN 1 END) as en_cours,
        COUNT(CASE WHEN statut_reparation = 'reparee' THEN 1 END) as reparees
    FROM materiaux_en_panne;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des retours utilisés
CREATE OR REPLACE FUNCTION get_retour_stats()
RETURNS TABLE (
    total_retours BIGINT,
    etat_bon BIGINT,
    etat_usage BIGINT,
    etat_abime BIGINT,
    nettoyage_requis BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_retours,
        COUNT(CASE WHEN etat = 'bon' THEN 1 END) as etat_bon,
        COUNT(CASE WHEN etat = 'usage' THEN 1 END) as etat_usage,
        COUNT(CASE WHEN etat = 'abime' THEN 1 END) as etat_abime,
        COUNT(CASE WHEN nettoyage_requis = true THEN 1 END) as nettoyage_requis
    FROM materiaux_retour_utilise;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DONNÉES DE DÉMONSTRATION
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
);

-- =====================================================
-- 7. RÉSUMÉ ET VÉRIFICATION
-- =====================================================

SELECT 'Tables de gestion état matériaux créées avec succès!' as message;

-- Vérifier les tables créées
SELECT 
    'Tables créées:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('materiaux_en_panne', 'materiaux_retour_utilise');

-- Afficher les données de démonstration
SELECT 'Matériaux en panne (démonstration):' as info;
SELECT 
    mp.provenance_chantier,
    m.nom as materiau,
    mp.quantite,
    mp.gravite,
    mp.reparable,
    mp.cout_reparation_estime
FROM materiaux_en_panne mp
LEFT JOIN materiaux m ON mp.materiau_id = m.id;

SELECT 'Retours utilisés (démonstration):' as info;
SELECT 
    mr.provenance_chantier,
    m.nom as materiau,
    mr.quantite,
    mr.etat,
    mr.nettoyage_requis
FROM materiaux_retour_utilise mr
LEFT JOIN materiaux m ON mr.materiau_id = m.id;

-- Statistiques
SELECT 'Statistiques pannes:' as info;
SELECT * FROM get_panne_stats();

SELECT 'Statistiques retours:' as info;
SELECT * FROM get_retour_stats();