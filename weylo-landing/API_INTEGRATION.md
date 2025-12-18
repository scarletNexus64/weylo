# Documentation d'intégration API - Weylo Frontend

## Vue d'ensemble

Cette documentation décrit l'intégration complète du frontend React avec l'API backend Laravel (Sanctum).

## Changements effectués

### 1. Configuration API (`src/services/apiClient.js`)

**Créé un client axios centralisé** avec:
- Base URL configurable via variable d'environnement `VITE_API_URL`
- Intercepteur de requête pour ajouter automatiquement le token Bearer
- Intercepteur de réponse pour gérer les erreurs (401, 403)
- Timeout de 30 secondes
- Headers par défaut (Content-Type, Accept)

**Fonctionnalités:**
- Ajoute automatiquement `Authorization: Bearer {token}` à toutes les requêtes
- Déconnexion automatique si le token est invalide (401)
- Nettoyage du localStorage en cas d'erreur d'authentification

### 2. Context d'authentification (`src/contexts/AuthContext.jsx`)

**Remplacé les données mockées par de vrais appels API:**

#### `login(credentials)`
- **Endpoint:** `POST /api/v1/auth/login`
- **Body:** `{ login: username/email/phone, password }`
- **Retour:** `{ user, token }`
- Stocke le token et l'utilisateur dans localStorage
- Gestion des erreurs avec messages appropriés

#### `register(data)`
- **Endpoint:** `POST /api/v1/auth/register`
- **Body:** `{ first_name, last_name, email, phone, password }`
- **Retour:** `{ user, token }`
- Stocke le token et l'utilisateur dans localStorage
- Gestion des erreurs de validation (email/phone déjà utilisé)

#### `logout()`
- **Endpoint:** `POST /api/v1/auth/logout`
- Révoque le token côté serveur
- Nettoie le localStorage

#### `refreshUser()`
- **Endpoint:** `GET /api/v1/auth/me`
- Rafraîchit les données de l'utilisateur
- Vérifie que le token est toujours valide

#### Vérification automatique au chargement
- Au montage du composant, vérifie si un token existe
- Si oui, appelle `/auth/me` pour valider le token
- Si invalide, nettoie le localStorage

### 3. Modal d'authentification (`src/components/auth/AuthModal.jsx`)

**Mise à jour du formulaire d'inscription:**
- Ajout du champ `last_name` (optionnel)
- Ajout du champ `email` (requis)
- Remplacement de `pin` par `password` (minimum 4 caractères)
- Adaptation aux exigences du backend

**Champs requis pour l'inscription:**
- ✅ Prénom (first_name)
- ✅ Email (email)
- ✅ Téléphone (phone)
- ✅ Mot de passe (password)
- ⚪ Nom (last_name) - optionnel

### 4. Page d'envoi de messages (`src/pages/SendMessagePage.jsx`)

**Migration vers apiClient:**
- Remplacé `axios` direct par `apiClient`
- Uniformisation de tous les appels API
- Suppression de la variable `API_URL` locale

**Endpoints utilisés:**
- `GET /api/v1/users/by-id/{userId}` - Vérifier l'existence d'un utilisateur
- `POST /api/v1/auth/register-and-send` - Inscription rapide avec envoi de message

### 5. Configuration environnement (`.env.example`)

Fichier créé pour documenter les variables d'environnement:

```env
VITE_API_URL=http://localhost:8001/api/v1
```

## Structure des tokens

### Stockage localStorage

Le frontend stocke deux éléments dans localStorage:

1. **`weylo_token`**: Token Bearer de Sanctum
   ```
   1|abcdefghijklmnopqrstuvwxyz1234567890
   ```

2. **`weylo_user`**: Objet utilisateur JSON
   ```json
   {
     "id": 1,
     "username": "john_doe",
     "first_name": "John",
     "last_name": "Doe",
     "email": "john@example.com",
     "phone": "+237612345678",
     "avatar": null,
     "bio": "Hey there! I'm using Weylo",
     "wallet_balance": 15000,
     "is_premium": false,
     "email_verified_at": null,
     "phone_verified_at": null,
     "is_banned": false,
     "created_at": "2025-01-15T10:30:00.000000Z"
   }
   ```

### Flux d'authentification

1. **Inscription/Connexion:**
   - Frontend → `POST /auth/register` ou `POST /auth/login`
   - Backend → Retourne `{ user, token, token_type: "Bearer" }`
   - Frontend → Stocke le token et l'utilisateur

2. **Requêtes authentifiées:**
   - Frontend → Ajoute automatiquement `Authorization: Bearer {token}`
   - Backend → Vérifie le token via middleware `auth:sanctum`
   - Backend → Retourne les données ou 401 si invalide

3. **Déconnexion:**
   - Frontend → `POST /auth/logout`
   - Backend → Révoque le token
   - Frontend → Nettoie localStorage

## Endpoints API disponibles

### Authentification (Public)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscription standard |
| POST | `/auth/login` | Connexion |
| POST | `/auth/forgot-password` | Mot de passe oublié |
| POST | `/auth/reset-password` | Réinitialiser mot de passe |
| POST | `/auth/register-and-send` | Inscription rapide + envoi message |

### Authentification (Protégé - avec token)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/logout` | Déconnexion |
| POST | `/auth/logout-all` | Déconnexion de tous les appareils |
| POST | `/auth/refresh` | Rafraîchir le token |
| GET | `/auth/me` | Obtenir utilisateur connecté |
| POST | `/auth/verify-email` | Vérifier email |
| POST | `/auth/verify-phone` | Vérifier téléphone |

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/users/{username}` | Profil public par username |
| GET | `/users/by-id/{id}` | Profil public par ID |
| GET | `/users` | Liste des utilisateurs (protégé) |
| PUT | `/users/profile` | Mettre à jour profil (protégé) |
| PUT | `/users/settings` | Mettre à jour paramètres (protégé) |
| POST | `/users/avatar` | Upload avatar (protégé) |

### Messages anonymes (Protégé)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/messages` | Messages reçus |
| GET | `/messages/sent` | Messages envoyés |
| GET | `/messages/{id}` | Détail d'un message |
| POST | `/messages/send/{username}` | Envoyer un message |
| POST | `/messages/{id}/reveal` | Révéler l'expéditeur |
| DELETE | `/messages/{id}` | Supprimer un message |

### Confessions (Public + Protégé)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/confessions` | Liste publique des confessions |
| GET | `/confessions/{id}` | Détail d'une confession |
| POST | `/confessions` | Créer une confession (protégé) |
| POST | `/confessions/{id}/like` | Liker (protégé) |
| DELETE | `/confessions/{id}/like` | Unliker (protégé) |

### Chat (Protégé)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/chat/conversations` | Liste des conversations |
| POST | `/chat/conversations` | Démarrer une conversation |
| GET | `/chat/conversations/{id}` | Détail conversation |
| GET | `/chat/conversations/{id}/messages` | Messages d'une conversation |
| POST | `/chat/conversations/{id}/messages` | Envoyer un message |
| POST | `/chat/conversations/{id}/read` | Marquer comme lu |

### Wallet (Protégé)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/wallet` | Balance du wallet |
| GET | `/wallet/transactions` | Historique des transactions |
| POST | `/wallet/withdraw` | Demander un retrait |
| GET | `/wallet/withdrawals` | Liste des retraits |

### Cadeaux (Protégé)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/gifts` | Catalogue des cadeaux |
| GET | `/gifts/received` | Cadeaux reçus |
| GET | `/gifts/sent` | Cadeaux envoyés |
| POST | `/gifts/send` | Envoyer un cadeau |

## Configuration du backend

Pour que l'intégration fonctionne, assurez-vous que le backend Laravel a:

### 1. CORS configuré (`config/cors.php`)

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### 2. Sanctum configuré (`config/sanctum.php`)

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,localhost:5173')),
```

### 3. Variables d'environnement (`.env`)

```env
APP_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173

SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000
```

## Utilisation

### 1. Configuration initiale

Créer un fichier `.env` à la racine du projet frontend:

```bash
cp .env.example .env
```

Modifier `VITE_API_URL` selon votre environnement:

```env
# Développement local
VITE_API_URL=http://localhost:8001/api/v1

# Production
VITE_API_URL=https://api.weylo.com/api/v1
```

### 2. Redémarrer le serveur de développement

```bash
npm run dev
```

Les variables d'environnement Vite ne sont chargées qu'au démarrage.

### 3. Tester l'authentification

1. Ouvrir l'application dans le navigateur
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire avec:
   - Prénom
   - Nom (optionnel)
   - Email
   - Téléphone
   - Mot de passe
4. Vérifier dans DevTools > Application > localStorage:
   - `weylo_token` devrait contenir le token
   - `weylo_user` devrait contenir les données utilisateur

### 4. Vérifier les requêtes

Ouvrir DevTools > Network et vérifier:
- Toutes les requêtes vers `/api/v1` ont le header `Authorization: Bearer {token}`
- Les réponses sont en format JSON
- Les codes de statut sont appropriés (200, 201, 401, etc.)

## Gestion des erreurs

### Frontend

L'apiClient gère automatiquement:
- **401 Unauthorized**: Déconnexion automatique, nettoyage du localStorage
- **403 Forbidden**: Message d'erreur (compte banni)
- **Timeout**: Après 30 secondes
- **Network Error**: Message d'erreur de connexion

### Messages d'erreur personnalisés

Les composants affichent des messages d'erreur appropriés:
- Identifiants incorrects
- Email/téléphone déjà utilisé
- Champs manquants
- Erreurs de validation

## Sécurité

### Bonnes pratiques implémentées

✅ Tokens stockés en localStorage (HTTPOnly non applicable en SPA)
✅ Déconnexion automatique si token invalide
✅ Timeout des requêtes (30s)
✅ Validation côté backend via Form Requests
✅ Middleware auth:sanctum pour routes protégées
✅ CORS configuré pour domaines autorisés seulement
✅ Mots de passe hashés avec bcrypt

### Recommandations supplémentaires

- [ ] Implémenter le refresh token automatique
- [ ] Ajouter rate limiting côté backend
- [ ] Implémenter la vérification email/phone
- [ ] Ajouter 2FA pour comptes sensibles
- [ ] Logger les tentatives de connexion échouées
- [ ] Implémenter CSRF protection pour formulaires sensibles

## Prochaines étapes

### Fonctionnalités à intégrer

1. **Messages anonymes**
   - Créer composant pour liste des messages
   - Implémenter pagination
   - Ajouter fonction révéler expéditeur

2. **Confessions**
   - Créer page feed des confessions
   - Implémenter likes/unlikes
   - Ajouter fonction créer confession

3. **Chat**
   - Implémenter WebSockets/Pusher pour temps réel
   - Créer interface de conversation
   - Ajouter notifications push

4. **Wallet**
   - Afficher balance dans le dashboard
   - Créer page historique transactions
   - Implémenter demande de retrait

5. **Profil utilisateur**
   - Créer page profil
   - Implémenter édition profil
   - Ajouter upload avatar

## Debugging

### Vérifier si le token est valide

```javascript
// Dans la console du navigateur
const token = localStorage.getItem('weylo_token')
console.log('Token:', token)

// Tester une requête authentifiée
fetch('http://localhost:8001/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
```

### Vérifier les intercepteurs

```javascript
// Dans apiClient.js, ajouter des logs
console.log('Request config:', config)
console.log('Token:', localStorage.getItem('weylo_token'))
```

### Problèmes courants

1. **CORS Error**: Vérifier config CORS backend
2. **401 sur toutes les requêtes**: Vérifier format du token
3. **Token null**: Vérifier que login/register sauvegarde bien le token
4. **Redirect infini**: Vérifier l'intercepteur de réponse 401

## Support

Pour toute question ou problème:
- Vérifier les logs du backend Laravel
- Inspecter les requêtes dans DevTools Network
- Vérifier le localStorage
- Consulter la documentation Laravel Sanctum

## Changelog

### 2025-12-16
- ✅ Création de `apiClient.js` avec intercepteurs
- ✅ Migration de AuthContext vers vraie API
- ✅ Mise à jour AuthModal avec bons champs
- ✅ Migration SendMessagePage vers apiClient
- ✅ Création de `.env.example`
- ✅ Documentation complète de l'intégration
