/*
  # Système complet de gestion des commandes et du stock

  1. Nouvelles Tables
    - `demandes_materiaux` - Demandes de matériaux par les chefs de chantier/directeur
    - `demande_items` - Détails des matériaux demandés
    - `mouvements_stock` - Historique des mouvements de stock
    - `bons_livraison` - Bons de livraison générés
    - `bon_items` - Détails des matériaux dans chaque bon

  2. Fonctionnalités
    - Système de panier et commandes
    - Validation par le magazinier
    - Distribution directe par le magazinier
    - Gestion automatique des stocks
    - Génération de bons de livraison
    - Historique complet des mouvements

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès par rôle
*/

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE DEMANDES_MATERIAUX
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

-- =====================================================
-- 2. TABLE DEMANDE_ITEMS
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

-- =====================================================
-- 3. TABLE MOUVEMENTS_STOCK
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
    bon_livraison_id UUID,
    motif VARCHAR(100),
    description TEXT,
    fournisseur VARCHAR(255),
    numero_facture VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLE BONS_LIVRAISON
-- =====================================================

CREATE TABLE IF NOT EXISTS bons_livraison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_bon VARCHAR(50) UNIQUE NOT NULL,
    demande_id UUID REFERENCES demandes_materiaux(id),
    destinataire_id UUID REFERENCES users(id),
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

-- =====================================================
-- 5. TABLE BON_ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS bon_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bon_livraison_id UUID REFERENCES bons_livraison(id) ON DELETE CASCADE,
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. INDEX POUR PERFORMANCES
-- =====================================================

-- Index pour demandes_materiaux
CREATE INDEX IF NOT EXISTS idx_demandes_numero ON demandes_materiaux(numero_demande);
CREATE INDEX IF NOT EXISTS idx_demandes_demandeur ON demandes_materiaux(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_depot ON demandes_materiaux(depot_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_materiaux(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_date ON demandes_materiaux(date_demande);

-- Index pour demande_items
CREATE INDEX IF NOT EXISTS idx_demande_items_demande ON demande_items(demande_id);
CREATE INDEX IF NOT EXISTS idx_demande_items_materiau ON demande_items(materiau_id);

-- Index pour mouvements_stock
CREATE INDEX IF NOT EXISTS idx_mouvements_materiau ON mouvements_stock(materiau_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements_stock(type_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_utilisateur ON mouvements_stock(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(created_at);

-- Index pour bons_livraison
CREATE INDEX IF NOT EXISTS idx_bons_numero ON bons_livraison(numero_bon);
CREATE INDEX IF NOT EXISTS idx_bons_destinataire ON bons_livraison(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_bons_magazinier ON bons_livraison(magazinier_id);
CREATE INDEX IF NOT EXISTS idx_bons_statut ON bons_livraison(statut);

-- Index pour bon_items
CREATE INDEX IF NOT EXISTS idx_bon_items_bon ON bon_items(bon_livraison_id);
CREATE INDEX IF NOT EXISTS idx_bon_items_materiau ON bon_items(materiau_id);

-- =====================================================
-- 7. TRIGGERS POUR UPDATED_AT
-- =====================================================

-- Trigger pour demandes_materiaux
DROP TRIGGER IF EXISTS update_demandes_materiaux_updated_at ON demandes_materiaux;
CREATE TRIGGER update_demandes_materiaux_updated_at 
    BEFORE UPDATE ON demandes_materiaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour bons_livraison
DROP TRIGGER IF EXISTS update_bons_livraison_updated_at ON bons_livraison;
CREATE TRIGGER update_bons_livraison_updated_at 
    BEFORE UPDATE ON bons_livraison 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

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
-- 9. SÉCURITÉ RLS
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE demandes_materiaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE demande_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE bon_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour demandes_materiaux
CREATE POLICY "Directeurs peuvent tout voir" ON demandes_materiaux
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'directeur'
            AND users.is_active = true
        )
    );

CREATE POLICY "Magaziniers peuvent voir toutes les demandes" ON demandes_materiaux
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'magazinier'
            AND users.is_active = true
        )
    );

CREATE POLICY "Chefs de chantier peuvent voir leurs demandes" ON demandes_materiaux
    FOR ALL TO authenticated
    USING (
        demandeur_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'chef_chantier'
            AND users.is_active = true
        )
    );

-- Politiques pour demande_items
CREATE POLICY "Accès via demandes_materiaux" ON demande_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM demandes_materiaux dm
            WHERE dm.id = demande_items.demande_id
            AND (
                dm.demandeur_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('directeur', 'magazinier')
                    AND users.is_active = true
                )
            )
        )
    );

-- Politiques pour mouvements_stock
CREATE POLICY "Directeurs et magaziniers peuvent voir mouvements" ON mouvements_stock
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('directeur', 'magazinier')
            AND users.is_active = true
        )
    );

-- Politiques pour bons_livraison
CREATE POLICY "Directeurs peuvent voir tous les bons" ON bons_livraison
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'directeur'
            AND users.is_active = true
        )
    );

CREATE POLICY "Magaziniers peuvent voir tous les bons" ON bons_livraison
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'magazinier'
            AND users.is_active = true
        )
    );

CREATE POLICY "Destinataires peuvent voir leurs bons" ON bons_livraison
    FOR SELECT TO authenticated
    USING (
        destinataire_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'chef_chantier'
            AND users.is_active = true
        )
    );

-- Politiques pour bon_items
CREATE POLICY "Accès via bons_livraison" ON bon_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bons_livraison bl
            WHERE bl.id = bon_items.bon_livraison_id
            AND (
                bl.destinataire_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('directeur', 'magazinier')
                    AND users.is_active = true
                )
            )
        )
    );

-- =====================================================
-- 10. DONNÉES DE TEST
-- =====================================================

-- Insérer quelques demandes de test
INSERT INTO demandes_materiaux (
    numero_demande, demandeur_id, depot_id, statut, priorite, 
    commentaire_demandeur, date_livraison_souhaitee
) VALUES 
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE role = 'chef_chantier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1),
    'en_attente',
    'normale',
    'Matériaux pour fondations du bâtiment A',
    CURRENT_DATE + INTERVAL '3 days'
),
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE role = 'directeur' LIMIT 1),
    (SELECT id FROM depots LIMIT 1),
    'approuvee',
    'haute',
    'Matériaux urgents pour réparation',
    CURRENT_DATE + INTERVAL '1 day'
);

-- Insérer des items pour les demandes
INSERT INTO demande_items (demande_id, materiau_id, quantite_demandee, quantite_accordee) 
SELECT 
    dm.id,
    m.id,
    CASE 
        WHEN m.unite LIKE '%sac%' THEN 10
        WHEN m.unite LIKE '%m³%' THEN 5
        WHEN m.unite LIKE '%barre%' THEN 20
        ELSE 15
    END,
    CASE 
        WHEN dm.statut = 'approuvee' THEN 
            CASE 
                WHEN m.unite LIKE '%sac%' THEN 8
                WHEN m.unite LIKE '%m³%' THEN 4
                WHEN m.unite LIKE '%barre%' THEN 18
                ELSE 12
            END
        ELSE 0
    END
FROM demandes_materiaux dm
CROSS JOIN (SELECT * FROM materiaux LIMIT 3) m;

-- =====================================================
-- 11. VUES UTILES
-- =====================================================

-- Vue pour les demandes avec détails
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
    u_demandeur.nom || ' ' || u_demandeur.prenom as demandeur_nom,
    u_demandeur.role as demandeur_role,
    u_demandeur.nom_chantier,
    u_valideur.nom || ' ' || u_valideur.prenom as valideur_nom,
    dm.date_validation,
    d.nom as depot_nom,
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
    ms.created_at,
    m.nom as materiau_nom,
    m.code_produit,
    m.unite,
    u.nom || ' ' || u.prenom as utilisateur_nom,
    u.role as utilisateur_role,
    dm.numero_demande,
    bl.numero_bon
FROM mouvements_stock ms
LEFT JOIN materiaux m ON ms.materiau_id = m.id
LEFT JOIN users u ON ms.utilisateur_id = u.id
LEFT JOIN demandes_materiaux dm ON ms.demande_id = dm.id
LEFT JOIN bons_livraison bl ON ms.bon_livraison_id = bl.id;

-- =====================================================
-- 12. RÉSUMÉ
-- =====================================================

SELECT 'Système de gestion des commandes créé avec succès!' as message;

SELECT 
    'Tables créées:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('demandes_materiaux', 'demande_items', 'mouvements_stock', 'bons_livraison', 'bon_items');

SELECT 
    'Demandes de test créées:' as info,
    COUNT(*) as nombre_demandes
FROM demandes_materiaux;

SELECT 
    'Items de demande créés:' as info,
    COUNT(*) as nombre_items
FROM demande_items;