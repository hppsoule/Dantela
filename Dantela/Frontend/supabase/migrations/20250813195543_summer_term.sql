/*
  # Mise à jour des catégories avec les vraies catégories de construction

  1. Modifications
    - Suppression des anciennes catégories de test
    - Ajout des vraies catégories de matériaux de construction
    - Mise à jour des matériaux existants avec les nouvelles catégories

  2. Nouvelles catégories
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

  3. Réorganisation
    - Attribution des matériaux existants aux bonnes catégories
    - Descriptions détaillées pour chaque catégorie
*/

-- Supprimer les anciennes catégories et leurs matériaux associés
DELETE FROM materiaux;
DELETE FROM categories;

-- Insérer les nouvelles catégories réelles
INSERT INTO categories (nom, description, depot_id) VALUES 
(
    'Plomberie',
    'Tuyaux, raccords, robinetterie, sanitaires et accessoires de plomberie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Électricité',
    'Câbles électriques, prises, interrupteurs, tableaux électriques et matériel électrique',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Fer et Acier',
    'Barres de fer, treillis soudés, profilés métalliques, armatures pour béton',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Céramique',
    'Carrelages, faïences, grès cérame, mosaïques et accessoires de pose',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Brique et Blocs',
    'Parpaings, briques, blocs béton, agglos pour construction et cloisons',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Bois',
    'Planches, poutres, contreplaqués, chevrons, bois de charpente et menuiserie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Peinture',
    'Peintures murales, vernis, lasures, enduits décoratifs et accessoires de peinture',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Quincaillerie',
    'Vis, clous, boulons, charnières, serrures et petite quincaillerie',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Ciment et Béton',
    'Ciments, mortiers, bétons prêts à l\'emploi, chaux et liants hydrauliques',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Étanchéité et Isolation',
    'Membranes d\'étanchéité, isolants thermiques et phoniques, produits d\'isolation',
    (SELECT id FROM depots LIMIT 1)
),
(
    'Menuiserie Aluminium',
    'Profilés aluminium, fenêtres, portes, vérandas et accessoires de menuiserie alu',
    (SELECT id FROM depots LIMIT 1)
);

-- Insérer des matériaux réalistes pour chaque catégorie

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
);

-- ÉLECTRICITÉ
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- FER ET ACIER
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- CÉRAMIQUE
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- BRIQUE ET BLOCS
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- BOIS
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- PEINTURE
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- QUINCAILLERIE
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- CIMENT ET BÉTON
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
);

-- ÉTANCHÉITÉ ET ISOLATION
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
(
    'ETA-001',
    'Membrane d\'étanchéité',
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
    'Mastic d\'étanchéité',
    'Mastic polyuréthane pour joints d\'étanchéité',
    'cartouche 310ml',
    40,
    12,
    'Étanchéité Pro',
    (SELECT id FROM categories WHERE nom = 'Étanchéité et Isolation' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
);

-- MENUISERIE ALUMINIUM
INSERT INTO materiaux (
    code_produit, nom, description, unite, stock_actuel, stock_minimum, 
    fournisseur, categorie_id, depot_id
) VALUES 
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
    'Joint d\'étanchéité alu',
    'Joint EPDM pour menuiserie aluminium',
    'ml',
    200,
    50,
    'Aluminium Cameroun',
    (SELECT id FROM categories WHERE nom = 'Menuiserie Aluminium' LIMIT 1),
    (SELECT id FROM depots LIMIT 1)
);

-- Affichage des nouvelles catégories créées
SELECT 'Nouvelles catégories créées:' as info;
SELECT nom, description FROM categories ORDER BY nom;

-- Affichage des matériaux créés par catégorie
SELECT 'Matériaux créés par catégorie:' as info;
SELECT 
    c.nom as categorie,
    COUNT(m.id) as nombre_materiaux,
    SUM(m.stock_actuel) as total_stock
FROM categories c
LEFT JOIN materiaux m ON c.id = m.categorie_id
GROUP BY c.id, c.nom
ORDER BY c.nom;

-- Résumé final
SELECT 
    'Résumé du nouveau système:' as info,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM materiaux) as total_materiaux,
    (SELECT SUM(stock_actuel) FROM materiaux) as total_unites_stock,
    (SELECT COUNT(*) FROM materiaux WHERE stock_actuel <= stock_minimum) as materiaux_stock_faible,
    (SELECT COUNT(DISTINCT fournisseur) FROM materiaux WHERE fournisseur IS NOT NULL) as nombre_fournisseurs;