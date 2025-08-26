@@ .. @@
-- Affichage du résumé
SELECT 
    'Résumé de la base de données:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'directeur' THEN 1 END) as directeurs,
    COUNT(CASE WHEN role = 'magazinier' THEN 1 END) as magaziniers,
    COUNT(CASE WHEN role = 'chef_chantier' THEN 1 END) as chefs_chantier,
    COUNT(CASE WHEN is_active = true THEN 1 END) as comptes_actifs
FROM users;

+-- Table des dépôts
+CREATE TABLE IF NOT EXISTS depots (
+    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
+    nom VARCHAR(255) NOT NULL,
+    adresse TEXT NOT NULL,
+    description TEXT,
+    directeur_id UUID REFERENCES users(id),
+    magazinier_id UUID REFERENCES users(id), -- Magazinier responsable du dépôt
+    is_active BOOLEAN DEFAULT true,
+    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
+    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
+);
+
+-- Index pour améliorer les performances des dépôts
+CREATE INDEX IF NOT EXISTS idx_depots_directeur ON depots(directeur_id);
+CREATE INDEX IF NOT EXISTS idx_depots_magazinier ON depots(magazinier_id);
+CREATE INDEX IF NOT EXISTS idx_depots_active ON depots(is_active);
+
+-- Trigger pour updated_at sur les dépôts
+DROP TRIGGER IF EXISTS update_depots_updated_at ON depots;
+CREATE TRIGGER update_depots_updated_at 
+    BEFORE UPDATE ON depots 
+    FOR EACH ROW 
+    EXECUTE FUNCTION update_updated_at_column();
+
+-- Insertion d'un dépôt par défaut
+INSERT INTO depots (
+    nom,
+    adresse,
+    description,
+    directeur_id
+) VALUES (
+    'Dépôt Principal Yaoundé',
+    '203 Boulevard de l''OCAM, Mvog Mbi - Yaoundé',
+    'Dépôt principal de matériaux de construction Dantela',
+    (SELECT id FROM users WHERE email = 'directeur@dantela.cm')
+) ON CONFLICT DO NOTHING;
+
+-- Affichage des dépôts créés
+SELECT 'Dépôts créés:' as info;
+SELECT nom, adresse, is_active FROM depots;