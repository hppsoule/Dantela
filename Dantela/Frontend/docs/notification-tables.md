# 📋 Structure des Tables de Notifications - Système Dantela

## 🗄️ Table `messages` - Messages Principaux

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('notification', 'comment', 'activity', 'system')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL pour message à tous d'un rôle
    to_role VARCHAR(20) CHECK (to_role IN ('directeur', 'magazinier', 'chef_chantier')), -- NULL pour utilisateur spécifique
    related_type VARCHAR(50), -- 'demande', 'bon_livraison', 'materiau', 'user', etc.
    related_id VARCHAR(100), -- ID de l'objet lié
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : soit to_user_id soit to_role doit être défini
    CONSTRAINT check_recipient CHECK (
        (to_user_id IS NOT NULL AND to_role IS NULL) OR 
        (to_user_id IS NULL AND to_role IS NOT NULL)
    )
);
```

### 📝 Description des Colonnes :

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `id` | UUID | Identifiant unique du message | `550e8400-e29b-41d4-a716-446655440000` |
| `type` | VARCHAR(50) | Type de message | `notification`, `comment`, `activity`, `system` |
| `title` | VARCHAR(255) | Titre du message | `"Nouvelle Demande de Matériaux"` |
| `content` | TEXT | Contenu détaillé | `"Demande DEM-2025-001 créée par Jean Dupont"` |
| `from_user_id` | UUID | Expéditeur (NULL pour système) | ID de l'utilisateur |
| `to_user_id` | UUID | Destinataire spécifique | ID de l'utilisateur |
| `to_role` | VARCHAR(20) | Rôle destinataire | `magazinier`, `chef_chantier`, `directeur` |
| `related_type` | VARCHAR(50) | Type d'objet lié | `demande`, `bon_livraison`, `materiau` |
| `related_id` | VARCHAR(100) | Référence de l'objet | `DEM-2025-001`, `BL-2025-001` |
| `priority` | VARCHAR(20) | Priorité du message | `low`, `medium`, `high`, `urgent` |
| `is_read` | BOOLEAN | Message lu ou non | `true`, `false` |
| `read_at` | TIMESTAMP | Date de lecture | `2025-01-13 14:30:00` |
| `created_at` | TIMESTAMP | Date de création | `2025-01-13 14:25:00` |

---

## 👥 Table `message_recipients` - Destinataires Multiples

```sql
CREATE TABLE message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(message_id, user_id)
);
```

### 📝 Description des Colonnes :

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `id` | UUID | Identifiant unique | `550e8400-e29b-41d4-a716-446655440001` |
| `message_id` | UUID | Référence au message | ID du message parent |
| `user_id` | UUID | Destinataire spécifique | ID de l'utilisateur |
| `is_read` | BOOLEAN | Lu par cet utilisateur | `true`, `false` |
| `read_at` | TIMESTAMP | Date de lecture | `2025-01-13 14:35:00` |
| `created_at` | TIMESTAMP | Date de création | `2025-01-13 14:25:00` |

---

## 🔄 Fonctions PostgreSQL Automatiques

### 📨 Fonction `create_automatic_message()` :
```sql
CREATE OR REPLACE FUNCTION create_automatic_message(
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_content TEXT,
    p_from_user_id UUID,
    p_to_user_id UUID DEFAULT NULL,
    p_to_role VARCHAR(20) DEFAULT NULL,
    p_related_type VARCHAR(50) DEFAULT NULL,
    p_related_id VARCHAR(100) DEFAULT NULL,
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID
```

### ⚡ Triggers Automatiques :
1. **`trigger_notify_new_demande`** : Quand une demande est créée
2. **`trigger_notify_demande_validated`** : Quand une demande est validée/rejetée
3. **`trigger_notify_bon_created`** : Quand un bon de livraison est créé

---

## 📊 Index pour Performances

```sql
-- Index pour messages
CREATE INDEX idx_messages_to_user ON messages(to_user_id);
CREATE INDEX idx_messages_to_role ON messages(to_role);
CREATE INDEX idx_messages_from_user ON messages(from_user_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_priority ON messages(priority);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_related ON messages(related_type, related_id);

-- Index pour message_recipients
CREATE INDEX idx_recipients_message ON message_recipients(message_id);
CREATE INDEX idx_recipients_user ON message_recipients(user_id);
CREATE INDEX idx_recipients_is_read ON message_recipients(is_read);
```

---

## 🎯 Exemples de Messages Types

### 📦 Nouvelle Demande :
```json
{
  "type": "notification",
  "title": "Nouvelle Demande de Matériaux",
  "content": "Demande DEM-2025-001 créée par Jean Dupont (Chantier: Bastos)",
  "from_user_id": "chef-id",
  "to_role": "magazinier",
  "related_type": "demande",
  "related_id": "DEM-2025-001",
  "priority": "medium"
}
```

### ✅ Demande Approuvée :
```json
{
  "type": "notification",
  "title": "Demande Approuvée",
  "content": "Votre demande DEM-2025-001 a été approuvée par Marie Martin. Commentaire: Quantités ajustées selon stock disponible.",
  "from_user_id": "magazinier-id",
  "to_user_id": "chef-id",
  "related_type": "demande",
  "related_id": "DEM-2025-001",
  "priority": "medium"
}
```

### ❌ Demande Rejetée :
```json
{
  "type": "notification",
  "title": "Demande Rejetée",
  "content": "Votre demande DEM-2025-001 a été rejetée par Marie Martin. Commentaire: Stock insuffisant pour le ciment.",
  "from_user_id": "magazinier-id",
  "to_user_id": "chef-id",
  "related_type": "demande",
  "related_id": "DEM-2025-001",
  "priority": "high"
}
```

### 📄 Bon de Livraison :
```json
{
  "type": "notification",
  "title": "Bon de Livraison Prêt",
  "content": "Bon de livraison BL-2025-001 préparé par Marie Martin. Prêt pour récupération.",
  "from_user_id": "magazinier-id",
  "to_user_id": "chef-id",
  "related_type": "bon_livraison",
  "related_id": "BL-2025-001",
  "priority": "medium"
}
```

### 💬 Commentaire :
```json
{
  "type": "comment",
  "title": "Commentaire sur DEM-2025-001",
  "content": "Pouvez-vous livrer en priorité le ciment ? Nous avons un retard sur le chantier.",
  "from_user_id": "chef-id",
  "to_user_id": "magazinier-id",
  "related_type": "demande",
  "related_id": "DEM-2025-001",
  "priority": "medium"
}
```

---

## 🔍 Requêtes Utiles

### 📊 Compter les messages non lus :
```sql
SELECT get_unread_count('user-id') as count;
```

### 📋 Récupérer messages d'un utilisateur :
```sql
SELECT * FROM messages 
WHERE to_user_id = 'user-id' OR 
      (to_role = 'user-role' AND EXISTS (
          SELECT 1 FROM message_recipients 
          WHERE message_id = messages.id AND user_id = 'user-id'
      ))
ORDER BY created_at DESC;
```

### ✅ Marquer comme lu :
```sql
SELECT mark_message_as_read('message-id', 'user-id');
```

---

## 🎯 Workflow Complet

### 1️⃣ **Chef Crée Commande :**
- ✅ Trigger `notify_new_demande()` s'exécute
- ✅ Message créé dans `messages` avec `to_role = 'magazinier'`
- ✅ Entrées créées dans `message_recipients` pour tous les magaziniers
- ✅ Frontend détecte nouveau message → Son + badge

### 2️⃣ **Magazinier Répond :**
- ✅ Trigger `notify_demande_validated()` s'exécute
- ✅ Message créé avec `to_user_id = chef-id`
- ✅ Contenu inclut la note du magazinier
- ✅ Frontend détecte réponse → Son + badge chez le chef

### 3️⃣ **Bon de Livraison :**
- ✅ Trigger `notify_bon_created()` s'exécute
- ✅ Message "Bon prêt" envoyé au destinataire
- ✅ Frontend détecte → Son + badge

Le système est maintenant **simple, cohérent et professionnel** ! 🚀