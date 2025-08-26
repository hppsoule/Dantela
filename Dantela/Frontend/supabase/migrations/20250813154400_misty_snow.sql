/*
  # Mise à jour de la table matériaux - Suppression du prix

  1. Modifications
    - Suppression de la colonne prix_unitaire de la table materiaux
    - Mise à jour des données existantes

  2. Raison
    - Les matériaux ne sont pas vendus mais distribués aux chefs de chantier
    - Pas besoin de gestion des prix dans le système
*/

-- Supprimer la colonne prix_unitaire si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materiaux' AND column_name = 'prix_unitaire'
  ) THEN
    ALTER TABLE materiaux DROP COLUMN prix_unitaire;
  END IF;
END $$;

-- Mise à jour des matériaux existants pour s'assurer qu'ils ont les bonnes données
UPDATE materiaux 
SET 
  description = COALESCE(description, 'Matériau de construction'),
  stock_actuel = COALESCE(stock_actuel, 0),
  stock_minimum = COALESCE(stock_minimum, 0)
WHERE description IS NULL OR stock_actuel IS NULL OR stock_minimum IS NULL;

-- Affichage des matériaux mis à jour
SELECT 'Matériaux mis à jour (sans prix):' as info;
SELECT code_produit, nom, unite, stock_actuel, stock_minimum, fournisseur FROM materiaux;