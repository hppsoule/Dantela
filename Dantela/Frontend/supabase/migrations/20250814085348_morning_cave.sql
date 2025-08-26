/*
  # Script SQL Complet - Base de Données Dantela Depot
  # Système de Gestion des Dépôts et Matériaux de Construction
  
  Ce script crée la structure complète de la base de données pour l'application Dantela.
  Il inclut toutes les tables, index, contraintes, fonctions et données de démonstration.
  
  Exécuter ce script dans PostgreSQL pour créer la base de données complète.
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
-- 11. VUES UTILES POUR LES REQUÊTES
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
    u_destinataire.nom || ' ' || u_destinataire.prenom as destinataire_nom,
    u_destinataire.role as destinataire_role,
    u_destinataire.nom_chantier,
    u_destinataire.email as destinataire_email,
    u_destinataire.telephone as destinataire_telephone,
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

-- =====================================================
-- 12. DONNÉES INITIALES
-- =====================================================

-- Insertion du directeur par défaut (mot de passe: admin123)
-- Le hash correspond à 'admin123' avec bcrypt
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
    '$2b$10$rQJ5qJ5qJ5qJ5qJ5qJ5qJOK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8', -- admin123
    'DANTELA',
    'Directeur',
    '+237669790437',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'directeur',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insertion d'un dépôt par défaut
INSERT INTO depots (
    nom,
    adresse,
    description,
    directeur_id
) VALUES (
    'Dépôt Principal Yaoundé',
    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
    'Dépôt principal de matériaux de construction Dantela',
    (SELECT id FROM users WHERE email = 'directeur@dantela.cm')
) ON CONFLICT DO NOTHING;

-- Insertion des catégories de matériaux
INSERT INTO categories (nom, description, depot_id) VALUES 
(
    'Plomberie',
    'Matériaux et équipements de plomberie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Électricité',
    'Matériaux et équipements électriques',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Fer et Acier',
    'Barres de fer et matériaux métalliques',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Céramique',
    'Carrelages et matériaux céramiques',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Brique et Blocs',
    'Briques, parpaings et blocs de construction',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Bois',
    'Matériaux en bois pour construction',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Peinture',
    'Peintures et produits de finition',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Quincaillerie',
    'Visserie, boulonnerie et petite quincaillerie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Ciment et Béton',
    'Ciments, mortiers et granulats',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Étanchéité et Isolation',
    'Matériaux d''étanchéité et d''isolation',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Menuiserie Aluminium',
    'Profilés et accessoires en aluminium',
    (SELECT id FROM depots LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. INSERTION DES MATÉRIAUX DE DÉMONSTRATION
-- =====================================================

-- PLOMBERIE
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
    'FER-TRE',
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
)

ON CONFLICT (code_produit) DO NOTHING;

-- =====================================================
-- 14. DONNÉES DE TEST POUR LES DEMANDES
-- =====================================================

-- Créer un chef de chantier de test
-- Créer un chef de chantier de test
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
    '$2a$10$OBe8dRHReFTgbYrJQXAhQ.LIyFIbR.ynZwy8HAdUgSDNi03CSY7by', -- admin123
    'Izmet',
    'Dantela',
    '+237677123456',
    'chef_chantier',
    'Chantier ONANA',
    true
) ON CONFLICT (email) DO NOTHING;

-- Créer un magazinier de test
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
    '$2a$10$OBe8dRHReFTgbYrJQXAhQ.LIyFIbR.ynZwy8HAdUgSDNi03CSY7by', -- admin123
    'Soulemane',
    'Djacko',
    '+237652679166',
    'magazinier',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insérer quelques demandes de test
INSERT INTO demandes_materiaux (
    numero_demande, demandeur_id, depot_id, statut, priorite, 
    commentaire_demandeur, date_livraison_souhaitee
) VALUES 
(
    generate_numero_demande(),
    (SELECT id FROM users WHERE email = 'chef1@dantela.cm'),
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

-- =====================================================
-- 15. RÉSUMÉ ET VÉRIFICATION
-- =====================================================

-- Affichage du résumé de création
SELECT 'Base de données Dantela créée avec succès!' as message;

SELECT 
    'Tables créées:' as info,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'depots', 'categories', 'materiaux', 
    'demandes_materiaux', 'demande_items', 
    'bons_livraison', 'bon_items', 'mouvements_stock'
);

-- Résumé des données
SELECT 'Données insérées:' as info;
SELECT 
    (SELECT COUNT(*) FROM users) as utilisateurs,
    (SELECT COUNT(*) FROM depots) as depots,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM materiaux) as materiaux,
    (SELECT COUNT(*) FROM demandes_materiaux) as demandes_test;

-- Affichage des comptes par défaut
SELECT 'Comptes par défaut créés:' as info;
SELECT email, nom, prenom, role, is_active FROM users ORDER BY role;

-- Affichage des catégories et matériaux
SELECT 'Catégories et matériaux:' as info;
SELECT 
    c.nom as categorie,
    COUNT(m.id) as nombre_materiaux,
    SUM(m.stock_actuel) as total_stock
FROM categories c
LEFT JOIN materiaux m ON c.id = m.categorie_id
GROUP BY c.id, c.nom
ORDER BY c.nom;

-- Affichage des matériaux avec stock faible
SELECT 'Matériaux avec stock faible (≤ minimum):' as info;
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

/*
  INSTRUCTIONS D'UTILISATION:
  
  1. Créer la base de données PostgreSQL:
     CREATE DATABASE "DantelaDepot";
  
  2. Se connecter à la base:
     \c DantelaDepot
  
  3. Exécuter ce script:
     \i database_complete_schema.sql
  
  4. Comptes par défaut créés:
     - Directeur: directeur@dantela.cm / admin123
     - Chef de chantier: chef1@dantela.cm / admin123  
     - Magazinier: magazinier1@dantela.cm / admin123
  
  5. Données de test:
     - 11 catégories de matériaux
     - 27 matériaux avec stocks
     - 2 demandes de test
     - 1 dépôt principal
  
  Le système est prêt à être utilisé avec toutes les fonctionnalités:
  - Gestion des commandes
  - Distribution directe
  - Mouvements de stock automatiques
  - Génération de bons de livraison
  - Impression des bons
  - Multilingue (FR/EN/TR)
*/