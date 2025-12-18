# Fonctionnalité de Réponse Anonyme avec Tag et Cadeaux

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de répondre anonymement aux messages reçus avec:
- ✅ Message texte anonyme avec référence au message original (tag)
- ✅ Envoi de cadeaux anonymes
- ✅ Interface dédiée complète
- ✅ Validation backend des réponses

## Modifications Backend

### 1. Migration de base de données

Fichier: `database/migrations/2025_12_17_001500_add_reply_to_to_anonymous_messages.php`

Ajout du champ `reply_to_message_id` à la table `anonymous_messages`:
- Type: `foreignId` (nullable)
- Relation: `anonymous_messages.id`
- Index: Oui (pour performance)
- Cascade delete: Oui

**Commande pour appliquer**:
```bash
cd /Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back
php artisan migrate
```

### 2. Modèle AnonymousMessage

Fichier: `app/Models/AnonymousMessage.php`

**Ajouts**:
- `reply_to_message_id` dans `$fillable`
- Relation `replyToMessage()` - Le message auquel on répond
- Relation `replies()` - Les réponses à ce message

### 3. Request Validation

Fichier: `app/Http/Requests/Message/SendMessageRequest.php`

**Règles de validation**:
```php
[
    'content' => ['required', 'string', 'max:5000'],
    'reply_to_message_id' => ['nullable', 'integer', 'exists:anonymous_messages,id'],
]
```

### 4. MessageController

Fichier: `app/Http/Controllers/Api/V1/MessageController.php`

**Vérifications ajoutées dans `send()`**:
1. Si `reply_to_message_id` est fourni, vérifier que:
   - Le message original existe
   - L'utilisateur actuel est le destinataire du message original
   - Le destinataire de la réponse devient l'expéditeur du message original
2. Enregistrer le `reply_to_message_id` lors de la création du message

## Modifications Frontend

### 1. Services

#### giftService.js
Nouveau service pour gérer les cadeaux:
- `getCatalog()` - Liste des cadeaux disponibles
- `sendGift(username, giftId, message)` - Envoyer un cadeau anonyme
- `getReceivedGifts()` - Cadeaux reçus
- `getSentGifts()` - Cadeaux envoyés
- `getStats()` - Statistiques

#### messagesService.js (modifié)
- `sendMessage()` accepte maintenant un 3ème paramètre: `replyToMessageId`

### 2. Nouvelle Page: ReplyAnonymous

Fichier: `src/pages/ReplyAnonymous.jsx`

**Fonctionnalités**:
- Affichage du message original
- Sélection du type de réponse: Texte ou Cadeau
- **Mode Texte**:
  - Zone de texte pour la réponse (max 5000 caractères)
  - Tag automatique du message original
- **Mode Cadeau**:
  - Grille de sélection de cadeaux
  - Message optionnel avec le cadeau
- Envoi anonyme avec confirmation

**Routes**:
- URL: `/reply-anonymous/:messageId`
- Protection: Route protégée (authentification requise)

### 3. Page Messages (modifiée)

Fichier: `src/pages/Messages.jsx`

**Changements**:
- Bouton "Répondre" redirige vers `/reply-anonymous/:messageId`
- Suppression du modal de réponse (remplacé par la page dédiée)
- Code simplifié et plus maintenable

### 4. Styles

Fichier: `src/styles/ReplyAnonymous.css`

Style complet responsive pour:
- Header avec bouton retour
- Carte du message original
- Tabs de sélection (Texte/Cadeau)
- Grille de cadeaux
- Zone de texte
- Bouton d'envoi

## Utilisation

### Pour l'utilisateur

1. **Recevoir un message anonyme**
   - Aller dans "Mes Messages" (`/messages`)
   - Voir les messages reçus

2. **Répondre anonymement**
   - Cliquer sur le bouton "Répondre" sur un message
   - Être redirigé vers la page de réponse

3. **Choisir le type de réponse**
   - **Message texte**: Écrire une réponse anonyme (avec tag du message original)
   - **Cadeau**: Sélectionner un cadeau et optionnellement ajouter un message

4. **Envoyer**
   - Cliquer sur "Envoyer anonymement"
   - Confirmation de l'envoi
   - Retour automatique à la page des messages

### Exemples d'utilisation

#### Exemple 1: Réponse textuelle

```
Message reçu: "Salut! J'adore ton profil 😊"
↓ Clic sur "Répondre"
↓ Page de réponse s'ouvre
↓ Sélectionner "Message texte"
↓ Écrire: "Merci beaucoup! C'est gentil 💕"
↓ Cliquer "Envoyer anonymement"
✓ Réponse envoyée avec tag du message original
```

#### Exemple 2: Cadeau

```
Message reçu: "Tu es incroyable!"
↓ Clic sur "Répondre"
↓ Page de réponse s'ouvre
↓ Sélectionner "Cadeau"
↓ Choisir "Bronze - 1,000 FCFA"
↓ Ajouter message: "Toi aussi! 🎁"
↓ Cliquer "Envoyer anonymement"
✓ Cadeau envoyé anonymement
```

## Sécurité et Validations

### Backend

1. **Validation de la réponse**:
   - Seul le destinataire d'un message peut y répondre
   - Le message original doit exister
   - Pas de réponse à ses propres messages

2. **Blocage**:
   - Impossible de répondre si l'utilisateur est bloqué
   - Impossible de répondre si le compte est banni

3. **Anonymat**:
   - L'identité de l'expéditeur reste masquée
   - Le destinataire peut révéler l'identité moyennant 450 FCFA

### Frontend

1. **Protection des routes**:
   - Route protégée (authentification requise)
   - Vérification de l'existence du message

2. **Validation**:
   - Message texte: minimum 1 caractère, maximum 5000
   - Cadeau: sélection obligatoire

3. **UX**:
   - Loading states
   - Error handling
   - Confirmation de succès

## API Endpoints Utilisés

### Messages

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/messages/{id}` | Récupérer un message |
| POST | `/messages/send/{username}` | Envoyer un message anonyme avec tag |

**Body de la requête** (POST):
```json
{
  "content": "Votre message",
  "reply_to_message_id": 123  // Optionnel
}
```

### Cadeaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/gifts` | Catalogue de cadeaux |
| POST | `/gifts/send` | Envoyer un cadeau anonyme |

**Body de la requête** (POST):
```json
{
  "recipient_username": "username",
  "gift_id": 1,
  "message": "Message optionnel"
}
```

## Structure de données

### Message avec réponse (tag)

```json
{
  "id": 123,
  "sender_id": 1,
  "recipient_id": 2,
  "content": "Merci pour ton message!",
  "reply_to_message_id": 100,  // Tag du message original
  "is_read": false,
  "is_identity_revealed": false,
  "created_at": "2025-12-17T10:30:00Z",
  "reply_to_message": {
    "id": 100,
    "content": "Salut! Comment vas-tu?",
    "sender_id": 2,
    "created_at": "2025-12-16T15:00:00Z"
  }
}
```

### Cadeau

```json
{
  "id": 1,
  "name": "Bronze",
  "price": 1000,
  "icon": "🥉",
  "description": "Cadeau bronze",
  "is_active": true
}
```

## Avantages de cette implémentation

1. **Anonymat préservé**: L'identité reste masquée par défaut
2. **Contexte conservé**: Le tag permet de comprendre à quoi on répond
3. **Flexibilité**: Choix entre message texte et cadeau
4. **UX optimale**: Interface dédiée claire et intuitive
5. **Sécurité**: Validations strictes côté backend
6. **Performance**: Indexes sur `reply_to_message_id` pour requêtes rapides
7. **Évolutivité**: Structure extensible pour futures fonctionnalités

## Notes importantes pour les images

⚠️ **Support des images**: Non implémenté dans cette version

Pour ajouter le support des images, il faudrait:
1. Ajouter une colonne `image_url` à `anonymous_messages`
2. Implémenter l'upload de fichiers côté backend
3. Ajouter un champ de sélection d'image dans `ReplyAnonymous.jsx`
4. Gérer le stockage des images (S3, local, etc.)

Cette fonctionnalité peut être ajoutée ultérieurement sans modifier l'architecture existante.

## Dépannage

### Erreur: "Vous ne pouvez répondre qu'aux messages que vous avez reçus"

**Cause**: Tentative de répondre à un message qu'on n'a pas reçu

**Solution**: Vérifier que l'utilisateur est bien le destinataire du message original

### Erreur: "Le message auquel vous répondez n'existe pas"

**Cause**: Le message original a été supprimé ou l'ID est invalide

**Solution**: Recharger la liste des messages et vérifier que le message existe

### Cadeau non envoyé

**Cause**: Solde insuffisant ou problème de paiement

**Solution**: Vérifier le solde du portefeuille et les logs de paiement

## Prochaines étapes suggérées

1. ✅ Tag des messages (implémenté)
2. ✅ Envoi de cadeaux (implémenté)
3. ⏳ Support des images
4. ⏳ Notifications push pour les réponses
5. ⏳ Thread de conversation (afficher toutes les réponses liées)
6. ⏳ Statistiques de réponses

---

**Date de création**: 17 décembre 2025
**Version**: 1.0.0
**Statut**: ✅ Production Ready
