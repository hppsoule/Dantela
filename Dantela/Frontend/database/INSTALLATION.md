# 🚀 INSTALLATION BASE DE DONNÉES DANTELA

## 📋 Prérequis
- PostgreSQL 12+ installé
- Accès superuser (postgres)
- Connexion réseau locale

## ⚡ Installation Rapide

### 1️⃣ Créer la Base de Données
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE "DantelaDepot";

# Quitter psql
\q
```

### 2️⃣ Exécuter le Script Complet
```bash
# Exécuter le script de création
psql -U postgres -d DantelaDepot -f dantela_final_schema.sql
```

### 3️⃣ Vérification
```bash
# Se connecter à la base créée
psql -U postgres -d DantelaDepot

# Vérifier les tables
\dt

# Vérifier les données
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM materiaux;
SELECT COUNT(*) FROM categories;

# Quitter
\q
```

## 👥 Comptes de Test

| Email | Mot de passe | Rôle | Chantier |
|-------|--------------|------|----------|
| `directeur@dantela.cm` | `admin123` | Directeur | - |
| `soulemane@dantela.cm` | `admin123` | Magazinier | - |
| `izmet@dantela.cm` | `admin123` | Chef de chantier | Chantier ONANA |

## 📊 Données Créées

### 🗄️ Tables (13 tables)
- ✅ `users` - 3 utilisateurs
- ✅ `depots` - 1 dépôt principal
- ✅ `categories` - 11 catégories
- ✅ `materiaux` - 30+ matériaux
- ✅ `demandes_materiaux` - 2 demandes test
- ✅ `demande_items` - Items de test
- ✅ `bons_livraison` - Prêt pour génération
- ✅ `bon_items` - Items de livraison
- ✅ `mouvements_stock` - Historique
- ✅ `messages` - 3 notifications test
- ✅ `message_recipients` - Destinataires
- ✅ `materiaux_en_panne` - 3 exemples
- ✅ `materiaux_retour_utilise` - 3 exemples

### 🔧 Fonctions (9 fonctions)
- ✅ `generate_numero_demande()` - DEM-2025-NNNN
- ✅ `generate_numero_bon()` - BL-2025-NNNN
- ✅ `create_automatic_message()` - Notifications auto
- ✅ `mark_message_as_read()` - Marquer lu
- ✅ `get_unread_count()` - Compter non lus
- ✅ `notify_new_demande()` - Trigger nouvelle demande
- ✅ `notify_demande_validated()` - Trigger validation
- ✅ `notify_bon_created()` - Trigger bon créé
- ✅ `get_panne_stats()` - Stats pannes
- ✅ `get_retour_stats()` - Stats retours

### 📈 Vues (5 vues)
- ✅ `v_demandes_details` - Demandes complètes
- ✅ `v_mouvements_details` - Mouvements détaillés
- ✅ `v_bons_livraison_details` - Bons complets
- ✅ `v_materiaux_panne_details` - Pannes détaillées
- ✅ `v_materiaux_retour_details` - Retours détaillés

## 🎯 Fonctionnalités Opérationnelles

### ✅ Gestion Matériaux
- **Nouveau matériau** : Création si inexistant
- **Matériel en panne** : Retour chantier défaillant
- **Retour utilisé** : Retour chantier bon état
- **Réception normale** : Fournisseur classique

### ✅ Système Commandes
- **Panier** → **Demande** → **Validation** → **Livraison**
- **Priorités** : Basse, Normale, Haute, Urgente
- **Commentaires** : Demandeur et magazinier
- **Quantités** : Demandées et accordées

### ✅ Distribution Directe
- **Destinataires** : Utilisateurs ou custom
- **Destinataires custom** : Nom, chantier, adresse, téléphone
- **Bon immédiat** : Génération automatique

### ✅ Notifications Temps Réel
- **Nouvelle demande** → Magaziniers
- **Validation** → Demandeur
- **Bon prêt** → Destinataire
- **Son** : Notification audio

### ✅ Bons de Livraison
- **Format A4** : Professionnel selon Figma
- **Impression** : Directe navigateur
- **Signatures** : 3 zones (magazinier, destinataire, chef)
- **Numérotation** : Automatique BL-2025-NNNN

## 🔧 Configuration Backend

### Variables d'Environnement (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DantelaDepot
DB_USER=postgres
DB_PASSWORD=VotreMotDePasse
JWT_SECRET=votre_jwt_secret_tres_long_et_securise
JWT_EXPIRES_IN=8h
NODE_ENV=development
PORT=5000
```

### Démarrage
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
npm install
npm run dev
```

## 🎉 Résultat

Après installation, vous aurez :

- ✅ **Base de données complète** : 13 tables + fonctions
- ✅ **Données de test** : Prêt à utiliser
- ✅ **Comptes fonctionnels** : 3 rôles différents
- ✅ **Notifications** : Temps réel automatiques
- ✅ **Gestion matériaux** : 4 types d'entrée
- ✅ **Système production** : Stable et testé

**Votre logiciel Dantela est prêt ! 🚀**