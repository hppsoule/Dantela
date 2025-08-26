# 🏗️ Base de Données Dantela Depot

## 📋 Installation PostgreSQL

### 1. Créer la base de données
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE "DantelaDepot";

# Se connecter à la nouvelle base
\c DantelaDepot

# Exécuter le script complet
\i dantela_complete_schema.sql
```

### 2. Ou via ligne de commande
```bash
# Créer la base
createdb -U postgres DantelaDepot

# Exécuter le script
psql -U postgres -d DantelaDepot -f dantela_complete_schema.sql
```

## 👥 Comptes par Défaut

| Email | Mot de passe | Rôle | Statut |
|-------|--------------|------|--------|
| `directeur@dantela.cm` | `admin123` | Directeur | ✅ Actif |
| `soulemane@dantela.cm` | `admin123` | Magazinier | ✅ Actif |
| `izmet@dantela.cm` | `admin123` | Chef de chantier | ✅ Actif |

## 🗄️ Structure de la Base

### 📊 Tables Principales (14 tables)

| Table | Description | Enregistrements |
|-------|-------------|-----------------|
| `users` | Utilisateurs (directeur, magazinier, chef_chantier) | 3 comptes |
| `depots` | Dépôts de matériaux | 1 dépôt principal |
| `categories` | Catégories de matériaux | 11 catégories |
| `materiaux` | Matériaux de construction | 30+ matériaux |
| `demandes_materiaux` | Demandes de matériaux | 2 demandes test |
| `demande_items` | Détails des demandes | Items de test |
| `bons_livraison` | Bons de livraison | Prêt pour génération |
| `bon_items` | Détails des bons | Items de livraison |
| `mouvements_stock` | Historique mouvements | Traçabilité complète |
| `messages` | Notifications temps réel | 3 messages test |
| `message_recipients` | Destinataires multiples | Gestion rôles |
| `materiaux_en_panne` | Matériels défaillants | 3 exemples |
| `materiaux_retour_utilise` | Retours bon état | 3 exemples |

### 🔧 Fonctions Utilitaires

| Fonction | Description |
|----------|-------------|
| `generate_numero_demande()` | Génère DEM-YYYY-NNNN |
| `generate_numero_bon()` | Génère BL-YYYY-NNNN |
| `create_automatic_message()` | Notifications automatiques |
| `mark_message_as_read()` | Marquer messages lus |
| `get_unread_count()` | Compter non lus |
| `get_panne_stats()` | Statistiques pannes |
| `get_retour_stats()` | Statistiques retours |

### 📈 Vues Optimisées

| Vue | Description |
|-----|-------------|
| `v_demandes_details` | Demandes avec jointures complètes |
| `v_mouvements_details` | Mouvements avec détails |
| `v_bons_livraison_details` | Bons avec informations complètes |
| `v_materiaux_panne_details` | Pannes avec détails |
| `v_materiaux_retour_details` | Retours avec détails |

## 🎯 Fonctionnalités Disponibles

### ✅ Gestion des Utilisateurs
- Inscription avec validation directeur
- 3 rôles : Directeur, Magazinier, Chef de chantier
- Authentification JWT sécurisée

### ✅ Gestion des Matériaux
- 11 catégories professionnelles
- 30+ matériaux avec codes produits
- Unités variées (sac, m³, ml, unité, barre, etc.)
- Upload d'images (Cloudinary)

### ✅ Système de Commandes
- Panier → Demande → Validation → Livraison
- Priorités : Basse, Normale, Haute, Urgente
- Commentaires demandeur/magazinier
- Quantités demandées/accordées

### ✅ Distribution Directe
- Sélection destinataire ou custom
- Destinataires externes (JSONB)
- Génération bon immédiate

### ✅ Gestion État Matériaux
- **En panne** : Gravité, réparable, coût
- **Retour utilisé** : État, nettoyage requis
- **Nouveau matériau** : Création à la volée
- **Réception** : Fournisseur classique

### ✅ Bons de Livraison
- Format A4 professionnel
- Impression directe
- Signatures multiples
- Numérotation automatique

### ✅ Notifications Temps Réel
- Nouvelle demande → Magaziniers
- Validation → Demandeur
- Bon prêt → Destinataire
- Alertes stock faible

### ✅ Historique et Traçabilité
- Tous les mouvements enregistrés
- Provenance chantier
- Utilisateur responsable
- Horodatage complet

## 🚀 Démarrage

1. **Exécuter le script** : `dantela_complete_schema.sql`
2. **Démarrer le backend** : `cd backend && npm run dev`
3. **Démarrer le frontend** : `npm run dev`
4. **Se connecter** : Avec un des comptes par défaut

## 📱 Interface Utilisateur

### 🎯 Directeur
- Vue d'ensemble globale
- Gestion utilisateurs
- Gestion dépôts
- Rapports et analyses

### 📦 Magazinier
- Gestion catalogue
- Validation commandes
- Distribution directe
- Mouvements stock
- Gestion état matériaux

### 🏗️ Chef de Chantier
- Catalogue matériaux
- Mes demandes
- Suivi livraisons
- Profil

Le système est **complet et opérationnel** ! 🎉