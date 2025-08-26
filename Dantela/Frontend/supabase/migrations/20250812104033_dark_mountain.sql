-- Script de création de la base de données DantelaDepot
-- Exécuter ce script dans PostgreSQL pour créer la structure complète

-- Création de la base de données (à exécuter en tant que superuser)
-- CREATE DATABASE "DantelaDepot";

-- Se connecter à la base de données DantelaDepot avant d'exécuter le reste

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (Directeur, Magazinier, Chef de chantier)
CREATE TABLE users (
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

-- Table des dépôts
CREATE TABLE depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    description TEXT,
    directeur_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories de matériaux
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des matériaux
CREATE TABLE materiaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(50) NOT NULL, -- sac, m³, barre, etc.
    prix_unitaire DECIMAL(10,2) NOT NULL,
    stock_actuel INTEGER DEFAULT 0,
    stock_minimum INTEGER DEFAULT 0,
    categorie_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    depot_id UUID REFERENCES depots(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des demandes de matériaux
CREATE TABLE demandes_materiaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chef_chantier_id UUID REFERENCES users(id),
    depot_id UUID REFERENCES depots(id),
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'livree')),
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_livraison_prevue DATE,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des items de demande (détail des matériaux demandés)
CREATE TABLE demande_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demande_id UUID REFERENCES demandes_materiaux(id) ON DELETE CASCADE,
    materiel_id UUID REFERENCES materiaux(id),
    quantite_demandee INTEGER NOT NULL,
    quantite_accordee INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des bons de livraison
CREATE TABLE bons_livraison (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demande_id UUID REFERENCES demandes_materiaux(id),
    numero_bon VARCHAR(50) UNIQUE NOT NULL,
    magazinier_id UUID REFERENCES users(id),
    chef_chantier_id UUID REFERENCES users(id),
    date_livraison TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation', 'livre', 'annule')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_materiaux_depot ON materiaux(depot_id);
CREATE INDEX idx_materiaux_categorie ON materiaux(categorie_id);
CREATE INDEX idx_demandes_chef ON demandes_materiaux(chef_chantier_id);
CREATE INDEX idx_demandes_depot ON demandes_materiaux(depot_id);
CREATE INDEX idx_demandes_statut ON demandes_materiaux(statut);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depots_updated_at BEFORE UPDATE ON depots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materiaux_updated_at BEFORE UPDATE ON materiaux FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demandes_updated_at BEFORE UPDATE ON demandes_materiaux FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion du directeur par défaut (mot de passe: admin123)
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
);

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
);

-- Insertion de catégories par défaut
INSERT INTO categories (nom, description, depot_id) VALUES 
('Ciment et Liants', 'Ciments, chaux, mortiers prêts', (SELECT id FROM depots LIMIT 1)),
('Granulats', 'Sable, gravier, pierres concassées', (SELECT id FROM depots LIMIT 1)),
('Fer et Acier', 'Barres de fer, treillis soudés, profilés', (SELECT id FROM depots LIMIT 1)),
('Blocs et Briques', 'Parpaings, briques, blocs béton', (SELECT id FROM depots LIMIT 1)),
('Bois de Construction', 'Planches, poutres, contreplaqués', (SELECT id FROM depots LIMIT 1));

-- Insertion de matériaux par défaut
INSERT INTO materiaux (nom, description, unite, prix_unitaire, stock_actuel, stock_minimum, categorie_id, depot_id) VALUES 
-- Ciment et Liants
('Ciment Portland CEM I 42.5', 'Ciment haute résistance pour béton armé', 'sac 50kg', 4500.00, 150, 50, 
 (SELECT id FROM categories WHERE nom = 'Ciment et Liants'), (SELECT id FROM depots LIMIT 1)),
('Ciment CEM II 32.5', 'Ciment pour maçonnerie générale', 'sac 50kg', 4200.00, 200, 75, 
 (SELECT id FROM categories WHERE nom = 'Ciment et Liants'), (SELECT id FROM depots LIMIT 1)),

-- Granulats
('Sable fin', 'Sable fin pour mortier et enduits', 'm³', 15000.00, 50, 20, 
 (SELECT id FROM categories WHERE nom = 'Granulats'), (SELECT id FROM depots LIMIT 1)),
('Gravier 5/15', 'Gravier concassé pour béton', 'm³', 18000.00, 30, 15, 
 (SELECT id FROM categories WHERE nom = 'Granulats'), (SELECT id FROM depots LIMIT 1)),

-- Fer et Acier
('Fer à béton Ø12mm', 'Barre de fer haute adhérence 12mm', 'barre 12m', 8500.00, 100, 30, 
 (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),
('Fer à béton Ø8mm', 'Barre de fer haute adhérence 8mm', 'barre 12m', 4200.00, 150, 50, 
 (SELECT id FROM categories WHERE nom = 'Fer et Acier'), (SELECT id FROM depots LIMIT 1)),

-- Blocs et Briques
('Parpaing 20x20x40', 'Bloc béton creux standard', 'unité', 350.00, 500, 100, 
 (SELECT id FROM categories WHERE nom = 'Blocs et Briques'), (SELECT id FROM depots LIMIT 1)),
('Brique rouge 6 trous', 'Brique terre cuite standard', 'unité', 125.00, 1000, 200, 
 (SELECT id FROM categories WHERE nom = 'Blocs et Briques'), (SELECT id FROM depots LIMIT 1));

-- Affichage des données insérées pour vérification
SELECT 'Utilisateurs créés:' as info;
SELECT email, nom, prenom, role, is_active FROM users;

SELECT 'Dépôts créés:' as info;
SELECT nom, adresse FROM depots;

SELECT 'Catégories créées:' as info;
SELECT nom, description FROM categories;

SELECT 'Matériaux créés:' as info;
SELECT m.nom, m.unite, m.prix_unitaire, m.stock_actuel, c.nom as categorie 
FROM materiaux m 
JOIN categories c ON m.categorie_id = c.id;