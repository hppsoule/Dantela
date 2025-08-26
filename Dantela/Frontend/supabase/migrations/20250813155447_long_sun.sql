/*
  # Mise à jour des unités de mesure des matériaux

  1. Modifications
    - Mise à jour des unités existantes avec des mesures plus variées
    - Ajout de nouveaux matériaux avec différentes unités
    - Correction des unités pour être plus réalistes

  2. Unités utilisées
    - sac (pour ciment, chaux)
    - m³ (pour sable, gravier)
    - ml (mètre linéaire pour bois)
    - m² (mètre carré pour panneaux)
    - unité (pour briques, parpaings)
    - barre (pour fer à béton)
    - panneau (pour treillis)
    - paquet (pour petits éléments)
    - kg (pour matériaux en vrac)
    - litre (pour liquides)
*/

-- Mise à jour des unités existantes pour être plus réalistes
UPDATE materiaux SET unite = 'sac 50kg' WHERE code_produit = 'CIM-001';
UPDATE materiaux SET unite = 'sac 50kg' WHERE code_produit = 'CIM-002';
UPDATE materiaux SET unite = 'sac 25kg' WHERE code_produit = 'CHA-001';

UPDATE materiaux SET unite = 'm³' WHERE code_produit IN ('SAB-001', 'SAB-002', 'GRA-515', 'GRA-1525');

UPDATE materiaux SET unite = 'barre 12m' WHERE code_produit IN ('FER-008', 'FER-010', 'FER-012', 'FER-016');
UPDATE materiaux SET unite = 'panneau 6x2.4m' WHERE code_produit = 'TRE-001';

UPDATE materiaux SET unite = 'unité' WHERE code_produit IN ('PAR-150', 'PAR-200', 'PAR-250', 'BRI-006', 'BRI-012');

UPDATE materiaux SET unite = 'ml' WHERE code_produit IN ('CHE-001', 'PLN-001');
UPDATE materiaux SET unite = 'm²' WHERE code_produit = 'CTR-018';

-- Ajout de nouveaux matériaux avec des unités variées
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 

-- Matériaux avec unité en paquet
(
    'VIS-001',
    'Vis à bois 4x50mm',
    'Vis à bois tête fraisée pour assemblage',
    'paquet 100pcs',
    50,
    15,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en kg
(
    'CLO-001',
    'Clous 70mm',
    'Clous en acier pour charpente',
    'kg',
    80,
    20,
    'Quincaillerie Centrale',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en litre
(
    'PEI-001',
    'Peinture blanche mate',
    'Peinture acrylique pour murs intérieurs',
    'litre',
    120,
    30,
    'Peintures du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en mètre (m)
(
    'TUY-001',
    'Tuyau PVC Ø110mm',
    'Tuyau PVC pour évacuation',
    'm',
    200,
    50,
    'Plastiques du Cameroun',
    (SELECT id FROM categories WHERE nom = 'Bois de Construction' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en rouleau
(
    'FIL-001',
    'Fil électrique 2.5mm²',
    'Câble électrique pour installation',
    'rouleau 100m',
    25,
    8,
    'Électro Cameroun',
    (SELECT id FROM categories WHERE nom = 'Fer et Acier' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en tube
(
    'COL-001',
    'Colle PVC',
    'Colle pour assemblage PVC',
    'tube 125ml',
    40,
    12,
    'Chimie du Bâtiment',
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
),

-- Matériaux avec unité en bidon
(
    'ETA-001',
    'Etancheite liquide',
    'Produit d''etancheite pour toiture',
    'bidon 20L',
    15,
    5,
    'Chimie du Bâtiment',
    (SELECT id FROM categories WHERE nom = 'Ciment et Liants' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
)

ON CONFLICT (code_produit) DO NOTHING;

-- Affichage des matériaux avec leurs nouvelles unités
SELECT 'Matériaux avec unités mises à jour:' as info;
SELECT 
    code_produit, 
    nom, 
    unite, 
    stock_actuel, 
    stock_minimum, 
    fournisseur,
    (SELECT nom FROM categories WHERE id = materiaux.categorie_id) as categorie
FROM materiaux 
ORDER BY unite, code_produit;

-- Résumé des différentes unités utilisées
SELECT 'Types d''unités utilisées:' as info;
SELECT 
    unite,
    COUNT(*) as nombre_materiaux,
    SUM(stock_actuel) as total_stock
FROM materiaux 
GROUP BY unite 
ORDER BY unite;