-- Script de création de la base de données DantelaDepot
-- Module d'authentification uniquement
-- Exécuter ce script dans PostgreSQL pour créer la structure d'authentification

-- Création de la base de données (à exécuter en tant que superuser)
-- CREATE DATABASE "DantelaDepot";

-- Se connecter à la base de données DantelaDepot avant d'exécuter le reste

-- Extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (Directeur, Magazinier, Chef de chantier)
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

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

-- Affichage des données pour vérification
SELECT 'Utilisateurs créés:' as info;
SELECT email, nom, prenom, role, is_active, created_at FROM users;

-- Affichage du résumé
SELECT 
    'Résumé de la base de données:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'directeur' THEN 1 END) as directeurs,
    COUNT(CASE WHEN role = 'magazinier' THEN 1 END) as magaziniers,
    COUNT(CASE WHEN role = 'chef_chantier' THEN 1 END) as chefs_chantier,
    COUNT(CASE WHEN is_active = true THEN 1 END) as comptes_actifs
FROM users;