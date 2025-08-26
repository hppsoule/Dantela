/*
  # Ajout des vraies catégories de construction

  1. Nouvelles catégories
    - Suppression des anciennes catégories de test
    - Ajout des 11 vraies catégories de matériaux de construction
    - Descriptions simples et professionnelles

  2. Catégories ajoutées
    - Plomberie
    - Électricité  
    - Fer et Acier
    - Céramique
    - Brique et Blocs
    - Bois
    - Peinture
    - Quincaillerie
    - Ciment et Béton
    - Étanchéité et Isolation
    - Menuiserie Aluminium
*/

-- Supprimer les anciennes catégories et matériaux
DELETE FROM materiaux;
DELETE FROM categories;

-- Insérer les nouvelles catégories
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
    'Matériaux d\'étanchéité et d\'isolation',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Menuiserie Aluminium',
    'Profilés et accessoires en aluminium',
    (SELECT id FROM depots LIMIT 1)
);

-- Affichage des catégories créées
SELECT 'Catégories créées avec succès:' as info;
SELECT nom, description FROM categories ORDER BY nom;

-- Résumé
SELECT 
    'Résumé:' as info,
    COUNT(*) as total_categories
FROM categories;