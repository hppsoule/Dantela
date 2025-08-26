/*
  # Tables pour gestion état des matériaux

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

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès par rôle
*/

-- Extension pour générer des UUID
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

-- Index pour materiaux_retour_utilise
CREATE INDEX IF NOT EXISTS idx_retour_materiau ON materiaux_retour_utilise(materiau_id);
CREATE INDEX IF NOT EXISTS idx_retour_chantier ON materiaux_retour_utilise(provenance_chantier);
CREATE INDEX IF NOT EXISTS idx_retour_etat ON materiaux_retour_utilise(etat);
CREATE INDEX IF NOT EXISTS idx_retour_date ON materiaux_retour_utilise(date_retour);

-- =====================================================
-- 4. SÉCURITÉ RLS
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE materiaux_en_panne ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiaux_retour_utilise ENABLE ROW LEVEL SECURITY;

-- Politiques pour materiaux_en_panne
CREATE POLICY "Directeurs et magaziniers peuvent gérer pannes" ON materiaux_en_panne
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('directeur', 'magazinier')
            AND users.is_active = true
        )
    );

-- Politiques pour materiaux_retour_utilise
CREATE POLICY "Directeurs et magaziniers peuvent gérer retours" ON materiaux_retour_utilise
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('directeur', 'magazinier')
            AND users.is_active = true
        )
    );

-- =====================================================
-- 5. VUES UTILES
-- =====================================================

-- Vue pour les matériaux en panne avec détails
CREATE OR REPLACE VIEW v_materiaux_panne_details AS
SELECT 
    mp.*,
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    c.nom as categorie_nom,
    u.nom || ' ' || u.prenom as utilisateur_nom
FROM materiaux_en_panne mp
LEFT JOIN materiaux m ON mp.materiau_id = m.id
LEFT JOIN categories c ON m.categorie_id = c.id
LEFT JOIN users u ON mp.utilisateur_id = u.id;

-- Vue pour les retours utilisés avec détails
CREATE OR REPLACE VIEW v_materiaux_retour_details AS
SELECT 
    mr.*,
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    c.nom as categorie_nom,
    u.nom || ' ' || u.prenom as utilisateur_nom
FROM materiaux_retour_utilise mr
LEFT JOIN materiaux m ON mr.materiau_id = m.id
LEFT JOIN categories c ON m.categorie_id = c.id
LEFT JOIN users u ON mr.utilisateur_id = u.id;

-- =====================================================
-- 6. RÉSUMÉ
-- =====================================================

SELECT 'Tables de gestion état matériaux créées avec succès!' as message;

SELECT 
    'Tables créées:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('materiaux_en_panne', 'materiaux_retour_utilise');