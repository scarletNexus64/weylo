# Guide des Logs - Debugging Frontend & Backend

## 📊 Vue d'ensemble

Des logs détaillés ont été ajoutés partout dans le frontend et le backend pour faciliter le debugging.

## 🌐 Frontend - Logs dans la console du navigateur

### Comment voir les logs frontend

1. **Ouvrir DevTools**:
   - Chrome/Edge: `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: `F12` ou `Ctrl+Shift+K`
   - Safari: `Cmd+Option+C`

2. **Aller dans l'onglet "Console"**

3. **Les logs seront affichés avec des emojis pour faciliter la lecture**

### Types de logs frontend

#### 🔧 API Client (`src/services/apiClient.js`)

**Au démarrage de l'app:**
```
🔧 [API_CLIENT] Configuration: { baseURL: "http://localhost:8000/api/v1", ... }
```

**Avant chaque requête:**
```
📤 [API_CLIENT] REQUEST:
  - method: POST
  - url: /auth/login
  - fullURL: http://localhost:8000/api/v1/auth/login
  - hasToken: false
  - headers: { ... }
  - data: { login: "test@test.com", password: "****" }
```

**Après chaque requête (succès):**
```
📥 [API_CLIENT] RESPONSE SUCCESS:
  - status: 200
  - statusText: OK
  - url: /auth/login
  - data: { user: {...}, token: "..." }
```

**Après chaque requête (erreur):**
```
❌ [API_CLIENT] RESPONSE ERROR:
  - status: 401
  - message: "Unauthorized"
  - data: { message: "Les identifiants fournis sont incorrects." }
```

#### 🔐 Authentication Context (`src/contexts/AuthContext.jsx`)

**Au chargement de l'app:**
```
🔐 [AUTH_CONTEXT] Initialisation de l'authentification...
💾 [AUTH_CONTEXT] localStorage check: { hasToken: true, token: "1|abc...", ... }
✅ [AUTH_CONTEXT] Token trouvé, vérification auprès du serveur...
✅ [AUTH_CONTEXT] Token valide! Utilisateur: { username: "john_doe", ... }
```

**Lors de la connexion:**
```
🔑 [AUTH_CONTEXT] Tentative de connexion... { username: "test@test.com" }
✅ [AUTH_CONTEXT] Connexion réussie! { user: {...}, token: "..." }
💾 [AUTH_CONTEXT] Token et utilisateur sauvegardés dans localStorage
```

**Lors de l'inscription:**
```
📝 [AUTH_CONTEXT] Tentative d'inscription... { first_name: "John", email: "..." }
✅ [AUTH_CONTEXT] Inscription réussie! { user: {...}, token: "..." }
💾 [AUTH_CONTEXT] Token et utilisateur sauvegardés dans localStorage
```

**Lors de la déconnexion:**
```
🚪 [AUTH_CONTEXT] Tentative de déconnexion...
✅ [AUTH_CONTEXT] Token révoqué côté serveur
🧹 [AUTH_CONTEXT] Nettoyage du localStorage...
✅ [AUTH_CONTEXT] Déconnexion terminée
```

#### 🎭 Auth Modal (`src/components/auth/AuthModal.jsx`)

**Soumission du formulaire de connexion:**
```
🔐 [AUTH_MODAL] Soumission formulaire de connexion
📋 [AUTH_MODAL] Données de connexion: { username: "test@test.com" }
⏳ [AUTH_MODAL] Appel de la fonction login...
✅ [AUTH_MODAL] Connexion réussie! Fermeture du modal...
```

**Soumission du formulaire d'inscription:**
```
📝 [AUTH_MODAL] Soumission formulaire d'inscription
📋 [AUTH_MODAL] Données d'inscription: { first_name: "John", email: "..." }
⏳ [AUTH_MODAL] Appel de la fonction register...
✅ [AUTH_MODAL] Inscription réussie! Fermeture du modal...
```

### Filtrer les logs frontend

Dans la console, vous pouvez filtrer par:
- `[API_CLIENT]` - Tous les logs de l'API client
- `[AUTH_CONTEXT]` - Tous les logs du contexte d'authentification
- `[AUTH_MODAL]` - Tous les logs du modal d'authentification
- `📤` - Toutes les requêtes sortantes
- `📥` - Toutes les réponses reçues
- `❌` - Toutes les erreurs

## 🔧 Backend - Logs Laravel

### Comment voir les logs backend

#### Option 1: Fichier de log
```bash
# Voir les logs en temps réel
tail -f /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back/storage/logs/laravel.log

# Voir les dernières lignes
tail -100 /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back/storage/logs/laravel.log

# Chercher des logs spécifiques
grep "AUTH_CONTROLLER" /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back/storage/logs/laravel.log
```

#### Option 2: Via artisan
```bash
cd /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back
php artisan log:clear  # Nettoyer les anciens logs
```

### Types de logs backend

#### 📨 Middleware de logging (`LogApiRequests`)

**Toutes les requêtes API sont loggées:**
```
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] ==================== NOUVELLE REQUÊTE ====================
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] Méthode: POST
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] URL: http://localhost:8000/api/v1/auth/login
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] Path: api/v1/auth/login
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] IP: 127.0.0.1
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] User Agent: Mozilla/5.0 ...
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] Headers: {
    "Authorization": "None",
    "Content-Type": "application/json",
    "Accept": "application/json"
}
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] Body: {
    "login": "test@test.com"
}
[2025-12-16 10:30:15] local.INFO: 📨 [API_REQUEST] User: Non authentifié
```

**Réponses:**
```
[2025-12-16 10:30:15] local.INFO: 📤 [API_RESPONSE] ==================== RÉPONSE ====================
[2025-12-16 10:30:15] local.INFO: 📤 [API_RESPONSE] Status: 200
[2025-12-16 10:30:15] local.INFO: 📤 [API_RESPONSE] Durée: 245.67ms
[2025-12-16 10:30:15] local.INFO: 📤 [API_RESPONSE] Contenu: {
    "message": "Connexion réussie",
    "user": {...},
    "token": "1|abc..."
}
[2025-12-16 10:30:15] local.INFO: 📤 [API_RESPONSE] ==================== FIN REQUÊTE ====================
```

#### 🔑 AuthController

**Inscription:**
```
[2025-12-16 10:30:15] local.INFO: 📝 [AUTH_CONTROLLER] Tentative d'inscription
[2025-12-16 10:30:15] local.INFO: 📋 [AUTH_CONTROLLER] Données reçues: {...}
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Validation réussie: {...}
[2025-12-16 10:30:15] local.INFO: 👤 [AUTH_CONTROLLER] Username généré: john_doe123
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Utilisateur créé avec succès. ID: 1
[2025-12-16 10:30:15] local.INFO: 🔑 [AUTH_CONTROLLER] Token créé: 1|abc...
```

**Connexion:**
```
[2025-12-16 10:30:15] local.INFO: 🔑 [AUTH_CONTROLLER] Tentative de connexion
[2025-12-16 10:30:15] local.INFO: 📋 [AUTH_CONTROLLER] Données reçues: {...}
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Validation réussie
[2025-12-16 10:30:15] local.INFO: 🔍 [AUTH_CONTROLLER] Recherche de l'utilisateur avec login: test@test.com
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Utilisateur trouvé: john_doe (ID: 1)
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Mot de passe correct
[2025-12-16 10:30:15] local.INFO: ⏰ [AUTH_CONTROLLER] Last seen mis à jour
[2025-12-16 10:30:15] local.INFO: 🔑 [AUTH_CONTROLLER] Token créé: 1|abc...
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Connexion réussie pour: john_doe
```

**Erreurs de connexion:**
```
[2025-12-16 10:30:15] local.WARNING: ❌ [AUTH_CONTROLLER] Utilisateur non trouvé pour: test@test.com
[2025-12-16 10:30:15] local.WARNING: ❌ [AUTH_CONTROLLER] Mot de passe incorrect pour: john_doe
[2025-12-16 10:30:15] local.WARNING: 🚫 [AUTH_CONTROLLER] Utilisateur banni: john_doe
```

**Déconnexion:**
```
[2025-12-16 10:30:15] local.INFO: 🚪 [AUTH_CONTROLLER] Tentative de déconnexion
[2025-12-16 10:30:15] local.INFO: 👤 [AUTH_CONTROLLER] Utilisateur: john_doe (ID: 1)
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Token révoqué avec succès
```

**Récupération du profil:**
```
[2025-12-16 10:30:15] local.INFO: 👤 [AUTH_CONTROLLER] Récupération du profil utilisateur
[2025-12-16 10:30:15] local.INFO: ✅ [AUTH_CONTROLLER] Utilisateur trouvé: john_doe (ID: 1)
[2025-12-16 10:30:15] local.INFO: ⏰ [AUTH_CONTROLLER] Last seen mis à jour
```

## 🔍 Debugging - Scénarios courants

### Scénario 1: Inscription ne fonctionne pas

**Frontend (Console du navigateur):**
1. Chercher `[AUTH_MODAL]` pour voir les données envoyées
2. Chercher `[API_CLIENT] REQUEST` pour voir la requête HTTP
3. Chercher `[API_CLIENT] RESPONSE ERROR` pour voir l'erreur

**Backend (Logs Laravel):**
1. Chercher `[API_REQUEST]` pour voir ce que le serveur a reçu
2. Chercher `[AUTH_CONTROLLER]` pour voir le traitement
3. Vérifier les erreurs de validation

### Scénario 2: Token non envoyé avec les requêtes

**Frontend (Console du navigateur):**
1. Vérifier `localStorage.getItem('weylo_token')` dans la console
2. Chercher `[API_CLIENT] REQUEST` et vérifier `hasToken: true/false`
3. Chercher `🔑 [API_CLIENT] Token ajouté` ou `⚠️ [API_CLIENT] Pas de token`

**Backend (Logs Laravel):**
1. Chercher `[API_REQUEST] Headers` et vérifier si `Authorization` est présent

### Scénario 3: CORS Error

**Frontend (Console du navigateur):**
1. Chercher les erreurs CORS dans la console (généralement en rouge)
2. Vérifier l'URL de l'API dans `[API_CLIENT] Configuration`

**Backend (Logs Laravel):**
1. Chercher `[API_REQUEST]` et vérifier les headers `Origin` et `Referer`

### Scénario 4: 401 Unauthorized

**Frontend (Console du navigateur):**
1. Chercher `[API_CLIENT] RESPONSE ERROR` avec `status: 401`
2. Vérifier si le token est présent: chercher `hasToken: true`
3. Vérifier si la déconnexion automatique s'est déclenchée: `[API_CLIENT] 401 détecté`

**Backend (Logs Laravel):**
1. Vérifier si le header `Authorization` est présent dans `[API_REQUEST] Headers`
2. Vérifier la validité du token dans la base de données

## 📝 Notes importantes

### Sécurité des logs

- ❌ Les **mots de passe** ne sont PAS loggés
- ❌ Les **PINs** ne sont PAS loggés
- ✅ Les **tokens** sont loggés partiellement (20 premiers caractères + "...")
- ✅ Les **emails** et **téléphones** sont loggés (utile pour debugging)

### Performance

Le middleware de logging ajoute ~1-5ms à chaque requête (temps négligeable).

### Désactiver les logs

**Frontend:**
Commenter les `console.log` dans les fichiers:
- `src/services/apiClient.js`
- `src/contexts/AuthContext.jsx`
- `src/components/auth/AuthModal.jsx`

**Backend:**
Retirer le middleware dans `bootstrap/app.php`:
```php
// Commenter ces lignes:
// $middleware->api(append: [
//     \App\Http\Middleware\LogApiRequests::class,
// ]);
```

Ou commenter les `\Log::info()` dans `AuthController.php`.

## 🎯 Bon à savoir

1. **Les logs sont chronologiques** - Suivez le flux de la requête
2. **Utilisez les emojis pour filtrer** - Cherchez par 🔑, 📤, 📥, ❌, etc.
3. **Comparez frontend et backend** - Ouvrez les deux en parallèle
4. **Les logs Laravel sont dans** `storage/logs/laravel.log`
5. **Les logs frontend sont dans** la console du navigateur (DevTools)

## 🛠️ Commandes utiles

```bash
# Backend - Voir les logs en temps réel
tail -f storage/logs/laravel.log

# Backend - Nettoyer les logs
php artisan log:clear

# Backend - Voir uniquement les logs d'authentification
grep "AUTH_CONTROLLER" storage/logs/laravel.log

# Backend - Voir uniquement les erreurs
grep "ERROR" storage/logs/laravel.log
```

Bonne chance pour le debugging! 🚀
