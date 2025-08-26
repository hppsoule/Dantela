/*
  # Ajout colonne destinataire_custom à la table bons_livraison

  1. Modifications
    - Ajout de la colonne destinataire_custom (JSONB) pour stocker les infos des destinataires personnalisés
    - Cette colonne permet de gérer les distributions à des personnes non enregistrées dans le système

  2. Structure
    - destinataire_custom JSONB contient: {nom, adresse, telephone}
    - Utilisé quand destinataire_id est NULL (distribution à personne externe)
*/

-- Ajouter la colonne destinataire_custom si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bons_livraison' AND column_name = 'destinataire_custom'
  ) THEN
    ALTER TABLE bons_livraison ADD COLUMN destinataire_custom JSONB;
  END IF;
END $$;

-- Créer un index sur la colonne JSONB pour les performances
CREATE INDEX IF NOT EXISTS idx_bons_livraison_destinataire_custom ON bons_livraison USING GIN (destinataire_custom);

-- Vérification de la structure mise à jour
SELECT 'Colonne destinataire_custom ajoutée avec succès!' as message;

-- Afficher la structure de la table bons_livraison
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bons_livraison' 
ORDER BY ordinal_position;