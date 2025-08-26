# Backend Dantela Depot - Module d'Authentification

API Node.js avec Express et PostgreSQL pour l'authentification par rôle.

## 🏗️ Architecture

```
backend/
├── config/
│   └── database.js          # Configuration PostgreSQL
├── controllers/
│   └── authController.js    # Contrôleurs d'authentification
├── middleware/
│   └── auth.js             # Middleware JWT et autorisation
├── models/
│   └── User.js             # Modèle utilisateur
├── routes/
│   └── auth.js             # Routes d'authentification
├── database/
│   └── auth_schema.sql     # Script de création de la base
├── .env                    # Variables d'environnement
├── server.js              # Serveur principal
└── package.json           # Dépendances
```

## 🚀 Installation et Configuration

### 1. Installation des dépendances
```bash
cd backend
npm install
```

### 2. Configuration de la base de données PostgreSQL

#### Créer la base de données
```sql
-- Se connecter à PostgreSQL en tant que superuser
psql -U postgres

-- Créer la base de données
CREATE DATABASE "DantelaDepot";

-- Se connecter à la base
\c DantelaDepot

-- Exécuter le script auth_schema.sql
\i database/auth_schema.sql
```

#### Ou via ligne de commande
```bash
# Créer la base
createdb -U postgres DantelaDepot

# Exécuter le script
psql -U postgres -d DantelaDepot -f database/auth_schema.sql
```

### 3. Configuration des variables d'environnement
Le fichier `.env` est déjà configuré avec vos paramètres :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DantelaDepot
DB_USER=postgres
DB_PASSWORD=Hawa3532
```

### 4. Démarrage du serveur
```bash
# Mode développement avec rechargement automatique
npm run dev

# Mode production
npm start
```

## 📊 Base de Données

### Table principale :
- **users** : Utilisateurs avec rôles (directeur, magazinier, chef_chantier)

### Compte directeur par défaut :
- **Email** : directeur@dantela.cm
- **Mot de passe** : admin123

## 🔐 Authentification

### Endpoints disponibles :

#### POST /api/auth/register
Inscription d'un nouvel utilisateur
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "nom": "Nom",
  "prenom": "Prénom",
  "telephone": "+237...",
  "adresse": "Adresse complète",
  "accountType": "magazinier|chef_chantier",
  "nomChantier": "Nom du chantier" // Si chef_chantier
}
```

#### POST /api/auth/login
Connexion d'un utilisateur
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/profile
Profil de l'utilisateur connecté (Token requis)

## 🛡️ Sécurité

- **JWT** : Authentification par token
- **bcrypt** : Hachage des mots de passe
- **CORS** : Protection contre les requêtes cross-origin
- **Validation** : Validation des données d'entrée

## 🔧 Développement

### Scripts disponibles :
- `npm run dev` : Démarrage en mode développement
- `npm start` : Démarrage en mode production

### Logs :
- Toutes les requêtes sont loggées
- Erreurs détaillées en mode développement
- Monitoring des connexions PostgreSQL

## 📝 Notes importantes

1. **Comptes inactifs** : Les nouveaux comptes sont inactifs par défaut
2. **Validation directeur** : Seul le directeur peut activer les comptes (à implémenter)
3. **Rôles** : Système de permissions basé sur les rôles
4. **Sécurité** : Tokens JWT avec expiration