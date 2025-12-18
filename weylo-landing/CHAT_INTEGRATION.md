# Intégration du Chat en Temps Réel - Weylo

## Vue d'ensemble

L'intégration du chat dans l'application Weylo permet aux utilisateurs de:
- Voir toutes leurs conversations en temps réel
- Envoyer et recevoir des messages instantanément
- Voir le statut en ligne de leurs contacts
- Maintenir des "streaks" (flammes) avec leurs amis
- (À venir) Créer et gérer des groupes anonymes

## Architecture

### Services créés

1. **chatService.js** (`src/services/chatService.js`)
   - Gère toutes les requêtes API liées au chat
   - Endpoints: conversations, messages, envoi, lecture

2. **websocketService.js** (`src/services/websocketService.js`)
   - Gère la connexion WebSocket via Laravel Reverb
   - S'abonne aux channels pour recevoir les messages en temps réel
   - Gère le statut de présence (en ligne/hors ligne)

3. **Chat.jsx** (mis à jour) (`src/pages/Chat.jsx`)
   - Interface utilisateur complète
   - Intégration avec les services
   - Gestion des états et des erreurs

### Technologies utilisées

- **Laravel Echo**: Client WebSocket pour Laravel Reverb
- **Pusher.js**: Protocole de communication temps réel
- **React Hooks**: useState, useEffect, useRef pour la gestion d'état
- **Axios**: Client HTTP pour les appels API

## Configuration

### Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env`:

```env
# API Backend
VITE_API_URL=http://localhost:8001/api/v1

# Laravel Reverb WebSocket
# IMPORTANT: La clé doit correspondre à REVERB_APP_KEY du backend
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_APP_KEY=1425cdd3ef7425fa6746d2895a233e52
VITE_REVERB_SCHEME=http
```

> **⚠️ Important**: La `VITE_REVERB_APP_KEY` doit être identique à la `REVERB_APP_KEY` configurée dans le `.env` du backend Laravel.

Pour la production:
```env
VITE_REVERB_HOST=reverb.weylo.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

### Installation des dépendances

Les packages suivants ont été ajoutés:
```bash
npm install laravel-echo pusher-js
```

## Fonctionnalités implémentées

### 1. Liste des conversations
- ✅ Chargement des conversations depuis l'API
- ✅ Affichage du dernier message
- ✅ Compteur de messages non lus
- ✅ Indicateur de statut en ligne
- ✅ Système de streaks (flammes)

### 2. Chat en temps réel
- ✅ Chargement des messages d'une conversation
- ✅ Envoi de messages
- ✅ Réception en temps réel via WebSocket
- ✅ Scroll automatique vers le bas
- ✅ Marquage comme lu

### 3. WebSocket
- ✅ Connexion à Laravel Reverb
- ✅ Abonnement au channel utilisateur
- ✅ Abonnement aux channels de conversation
- ✅ Channel de présence (online/offline)
- ✅ Gestion de la déconnexion

### 4. Statut de présence
- ✅ Indicateur vert pour les utilisateurs en ligne
- ✅ Mise à jour en temps réel du statut
- ✅ Liste des utilisateurs actuellement en ligne

## Fonctionnalités à venir

### Groupes anonymes
- ⏳ Création de groupes
- ⏳ Invitation par lien
- ⏳ Messages anonymes dans les groupes
- ⏳ Révélation d'identité (premium)

> **Note**: Les groupes anonymes nécessitent des endpoints backend qui ne sont pas encore implémentés dans le backend actuel.

## Utilisation

### Démarrer le serveur de développement

**IMPORTANT**: Vous devez démarrer 3 services dans cet ordre:

1. **Backend Laravel** (port 8000)
   ```bash
   cd /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back
   php artisan serve
   ```

2. **Laravel Reverb** (port 8080) - **OBLIGATOIRE pour le temps réel**
   ```bash
   # Dans un nouveau terminal
   cd /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back
   php artisan reverb:start

   # Vous devriez voir:
   # INFO  Starting server on 0.0.0.0:8080 (localhost)
   ```

3. **Frontend React** (port 3000)
   ```bash
   # Dans un nouveau terminal
   cd /Users/macbookpro/Desktop/Developments/Personnals/msgLink/weylo/weylo-landing
   npm run dev
   ```

> **💡 Astuce**: Si Laravel Reverb n'est pas démarré, le chat fonctionnera toujours mais sans les mises à jour en temps réel. Vous devrez rafraîchir manuellement pour voir les nouveaux messages.

### Accéder au chat

1. Connectez-vous à l'application
2. Naviguez vers `http://localhost:3000/chat`
3. Vos conversations apparaîtront automatiquement
4. **Vérifiez l'indicateur vert** à côté de "Messages 💬"
   - 🟢 Point vert pulsant = WebSocket connecté, temps réel actif
   - Pas de point = Mode dégradé, pas de temps réel
5. Cliquez sur une conversation pour voir les messages
6. Tapez votre message et appuyez sur Entrée

### Indicateur de connexion temps réel

Un petit point vert pulsant apparaît à côté du titre "Messages 💬" quand:
- ✅ Laravel Reverb est démarré
- ✅ La connexion WebSocket est établie
- ✅ Les messages temps réel sont activés

Si le point n'apparaît pas:
1. Vérifiez que Laravel Reverb est démarré
2. Vérifiez la console pour les messages d'erreur
3. Vérifiez que la clé `VITE_REVERB_APP_KEY` correspond au backend

## Structure des données

### Conversation (Backend)
```json
{
  "id": 1,
  "participant_one_id": 1,
  "participant_two_id": 2,
  "participant_one": { "id": 1, "username": "user1", ... },
  "participant_two": { "id": 2, "username": "user2", ... },
  "last_message": { "content": "Hello!", ... },
  "last_message_at": "2025-12-17T10:30:00Z",
  "streak_count": 5,
  "flame_level": "yellow",
  "unread_messages_count": 2
}
```

### Message (Backend)
```json
{
  "id": 1,
  "conversation_id": 1,
  "sender_id": 1,
  "content": "Hello!",
  "type": "text",
  "is_read": false,
  "created_at": "2025-12-17T10:30:00Z"
}
```

### Événement WebSocket (ChatMessageSent)
```json
{
  "message": {
    "id": 1,
    "conversation_id": 1,
    "sender_id": 2,
    "content": "Hey!",
    "type": "text",
    "created_at": "2025-12-17T10:35:00Z"
  },
  "conversation": { ... }
}
```

## Debugging

### Vérifier la connexion WebSocket

Ouvrez la console du navigateur et recherchez:
```
🔌 [WEBSOCKET] Connexion à Laravel Reverb...
✅ [WEBSOCKET] Connecté à Laravel Reverb!
📡 [WEBSOCKET] Abonnement au channel: user.{userId}
📡 [WEBSOCKET] Abonnement au channel: presence.online
```

### Logs des messages

Lorsque vous envoyez un message:
```
📤 Envoi du message: Hello
✅ Message envoyé: { message: { ... } }
```

Lorsque vous recevez un message:
```
💬 Nouveau message dans la conversation: { message: { ... } }
```

### Erreurs courantes

#### 1. "Echo non initialisé"
- Vérifiez que le WebSocket est bien connecté
- Vérifiez que Laravel Reverb est en cours d'exécution
- Vérifiez les variables d'environnement

#### 2. "401 Unauthorized" sur WebSocket
- Vérifiez que le token d'authentification est valide
- Vérifiez que l'endpoint `/broadcasting/auth` est accessible
- Vérifiez les headers d'autorisation

#### 3. Messages non reçus en temps réel
- Vérifiez que vous êtes bien abonné au channel
- Vérifiez les logs du serveur Laravel Reverb
- Vérifiez que l'événement est bien diffusé côté backend

## Endpoints API utilisés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/chat/conversations` | Liste des conversations |
| POST | `/chat/conversations` | Créer une conversation |
| GET | `/chat/conversations/{id}/messages` | Messages d'une conversation |
| POST | `/chat/conversations/{id}/messages` | Envoyer un message |
| POST | `/chat/conversations/{id}/read` | Marquer comme lu |
| DELETE | `/chat/conversations/{id}` | Supprimer une conversation |

## Channels WebSocket

| Channel | Type | Description |
|---------|------|-------------|
| `user.{userId}` | Private | Messages anonymes et cadeaux |
| `conversation.{conversationId}` | Private | Messages de chat |
| `presence.online` | Presence | Statut en ligne des utilisateurs |

## Sécurité

- ✅ Authentification Bearer Token
- ✅ Channels privés avec autorisation
- ✅ Vérification des participants de conversation
- ✅ Encryption des messages côté backend (à vérifier)

## Performance

- Messages paginés (50 par page par défaut)
- Conversations paginées (50 par page par défaut)
- Abonnement WebSocket uniquement aux conversations actives
- Déconnexion automatique lors du démontage du composant

## Prochaines étapes

1. ✅ Intégrer le chat 1-on-1
2. ✅ Implémenter WebSocket temps réel
3. ⏳ Ajouter le support des groupes anonymes (backend requis)
4. ⏳ Ajouter le support des fichiers/images
5. ⏳ Ajouter les notifications push
6. ⏳ Optimiser la pagination et le chargement

## Support

Pour toute question ou problème:
1. Vérifiez les logs de la console navigateur
2. Vérifiez les logs du serveur Laravel
3. Vérifiez que toutes les dépendances sont installées
4. Vérifiez que les services backend sont en cours d'exécution

---

**Dernière mise à jour**: 17 décembre 2025
**Version**: 1.0.0
