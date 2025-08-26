/*
  # Création complète du système de matériaux

  1. Nouvelles Tables
    - `categories`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `description` (text)
      - `depot_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `materiaux`
      - `id` (uuid, primary key)
      - `code_produit` (text, unique)
      - `nom` (text)
      - `description` (text)
      - `unite` (text)
      - `stock_actuel` (integer)
      - `stock_minimum` (integer)
      - `fournisseur` (text)
      - `categorie_id` (uuid, foreign key)
      - `depot_id` (uuid, foreign key)
      - `image_url` (text)
      - `image_public_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Index et Contraintes
    - Index sur tous les champs de recherche
    - Contrainte unique sur code_produit
    - Triggers pour updated_at

  3. Données de démonstration
    - 5 catégories de matériaux
    - 20+ matériaux avec codes produits
*/

-- Extension pour générer des UUID (si pas déjà créée)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. CRÉATION DE LA TABLE CATEGORIES
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
-- 2. CRÉATION DE LA TABLE MATERIAUX
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
-- 3. INSERTION DES CATÉGORIES
-- =====================================================

INSERT INTO categories (nom, description, depot_id) VALUES 
('Ciment et Liants', 'Ciments, chaux, mortiers prêts à l''emploi', (SELECT id FROM depots LIMIT 1)),
('Granulats', 'Sable, gravier, pierres concassées pour béton et maçonnerie', (SELECT id FROM depots LIMIT 1)),
('Fer et Acier', 'Barres de fer, treillis soudés, profilés métalliques', (SELECT id FROM depots LIMIT 1)),
('Blocs et Briques', 'Parpaings, briques, blocs béton pour construction', (SELECT id FROM depots LIMIT 1)),
('Bois de Construction', 'Planches, poutres, contreplaqués, chevrons', (SELECT id FROM depots LIMIT 1))
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. INSERTION DES MATÉRIAUX
-- =====================================================

INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 

-- CIMENT ET LIANTS
(
    'CIM-001',
    'Ciment Portland CEM I 42.5',
    'Ciment haute résistance pour béton armé et structures importantes',
    'sac 50kg',
    150,
    50,
    'CIMENCAM',
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- GRANULATS
(
    'SAB-001',
    'Sable fin 0/2',
    'Sable fin pour mortier, enduits et béton fin',
    'm³',
    50,
    20,
    'Carrière Nkolbisson',
    (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
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

-- BLOCS ET BRIQUES
(
    'PAR-150',
    'Parpaing 15x20x40',
    'Bloc béton creux 15cm pour cloisons',
    'unité',
    800,
    200,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PAR-200',
    'Parpaing 20x20x40',
    'Bloc béton creux 20cm pour murs porteurs',
    'unité',
    500,
    100,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PAR-250',
    'Parpaing 25x20x40',
    'Bloc béton creux 25cm pour murs épais',
    'unité',
    300,
    75,
    'SOCAVER',
    (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
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
    (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- BOIS DE CONSTRUCTION
(
    'CHE-001',
    'Chevron 63x75mm',
    'Chevron sapin traité pour charpente',
    'ml',
    200,
    50,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois de Construction' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'PLN-001',
    'Planche 27x200mm',
    'Planche sapin rabotée pour coffrage',
    'ml',
    150,
    40,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois de Construction' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),
(
    'CTR-018',
    'Contreplaqué 18mm',
    'Panneau contreplaqué marine pour coffrage',
    'm²',
    80,
    20,
    'Scierie du Mbam',
    (SELECT id FROM categories WHERE nom = 'Bois de Construction' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
)

ON CONFLICT (code_produit) DO NOTHING;

-- =====================================================
-- 5. VÉRIFICATION DES DONNÉES CRÉÉES
-- =====================================================

-- Affichage des catégories créées
SELECT 'Catégories créées:' as info;
SELECT nom, description FROM categories ORDER BY nom;

-- Affichage des matériaux créés
SELECT 'Matériaux créés avec succès:' as info;
SELECT 
    code_produit, 
    nom, 
    unite, 
    stock_actuel, 
    stock_minimum, 
    fournisseur,
    (SELECT nom FROM categories WHERE id = materiaux.categorie_id) as categorie
FROM materiaux 
ORDER BY code_produit;

-- Résumé final
SELECT 
    'Résumé du système de matériaux:' as info,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM materiaux) as total_materiaux,
    (SELECT SUM(stock_actuel) FROM materiaux) as total_unites_stock,
    (SELECT COUNT(*) FROM materiaux WHERE stock_actuel <= stock_minimum) as materiaux_stock_faible,
    (SELECT COUNT(DISTINCT fournisseur) FROM materiaux) as nombre_fournisseurs;