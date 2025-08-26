/*
  # Création des tables pour la gestion des matériaux

  1. Nouvelles Tables
    - `materiaux`
      - `id` (uuid, primary key)
      - `code_produit` (text, unique)
      - `nom` (text)
      - `description` (text)
      - `unite` (text)
      - `prix_unitaire` (decimal)
      - `stock_actuel` (integer)
      - `stock_minimum` (integer)
      - `fournisseur` (text)
      - `categorie_id` (uuid, foreign key)
      - `depot_id` (uuid, foreign key)
      - `image_url` (text)
      - `image_public_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modifications Tables Existantes
    - Ajout de colonnes manquantes dans `materiaux` si nécessaire

  3. Index et Contraintes
    - Index sur code_produit, nom, categorie_id, depot_id
    - Contrainte unique sur code_produit
*/

-- Vérifier et créer la table materiaux avec toutes les colonnes nécessaires
DO $$
BEGIN
  -- Ajouter les colonnes manquantes à la table materiaux si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'code_produit'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN code_produit VARCHAR(100) UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'fournisseur'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN fournisseur VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN image_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'image_public_id'
  ) THEN
    ALTER TABLE materiaux ADD COLUMN image_public_id TEXT;
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_materiaux_code_produit ON materiaux(code_produit);
CREATE INDEX IF NOT EXISTS idx_materiaux_nom ON materiaux(nom);
CREATE INDEX IF NOT EXISTS idx_materiaux_stock_faible ON materiaux(stock_actuel, stock_minimum);

-- Insérer des matériaux de démonstration avec codes produits
INSERT INTO materiaux (
  code_produit, nom, description, unite, prix_unitaire, stock_actuel, stock_minimum, 
  fournisseur, categorie_id, depot_id
) VALUES 
(
  'CIM-001',
  'Ciment Portland CEM I 42.5',
  'Ciment haute résistance pour béton armé',
  'sac 50kg',
  4500.00,
  150,
  50,
  'CIMENCAM',
  (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
),
(
  'FER-012',
  'Fer à béton Ø12mm',
  'Barre de fer haute adhérence 12mm',
  'barre 12m',
  8500.00,
  100,
  30,
  'ALUCAM',
  (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
),
(
  'SAB-001',
  'Sable fin',
  'Sable fin pour mortier et enduits',
  'm³',
  15000.00,
  50,
  20,
  'Carrière Nkolbisson',
  (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
),
(
  'PAR-200',
  'Parpaing 20x20x40',
  'Bloc béton creux standard',
  'unité',
  350.00,
  500,
  100,
  'SOCAVER',
  (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
),
(
  'GRA-515',
  'Gravier 5/15',
  'Gravier concassé pour béton',
  'm³',
  18000.00,
  30,
  15,
  'Carrière Nkolbisson',
  (SELECT id FROM categories WHERE nom = 'Granulats' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
),
(
  'BRI-006',
  'Brique rouge 6 trous',
  'Brique terre cuite standard',
  'unité',
  125.00,
  1000,
  200,
  'SOCAVER',
  (SELECT id FROM categories WHERE nom = 'Blocs et Briques' LIMIT 1),
  (SELECT id FROM depots LIMIT 1)
) ON CONFLICT (code_produit) DO NOTHING;

-- Affichage des matériaux créés
SELECT 'Matériaux avec codes produits créés:' as info;
SELECT code_produit, nom, unite, prix_unitaire, stock_actuel, fournisseur FROM materiaux;