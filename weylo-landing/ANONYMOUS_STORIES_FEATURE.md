# Fonctionnalité d'Anonymat des Stories

## Vue d'ensemble

Cette fonctionnalité rend toutes les stories **anonymes par défaut**. Les utilisateurs doivent payer 450 FCFA pour révéler :
- L'identité de l'auteur d'une story
- La liste des personnes qui ont vu leur propre story

## Fonctionnement

### 1. Pour les viewers (ceux qui regardent les stories)

Lorsqu'un utilisateur regarde une story d'une autre personne :
- Le nom de l'auteur est masqué et remplacé par "Anonyme"
- L'avatar est remplacé par un avatar générique
- Un badge 🔒 indique que l'identité est masquée
- Un bouton "Révéler l'identité (450 FCFA)" permet de payer pour voir le vrai nom

### 2. Pour les auteurs (ceux qui postent des stories)

Lorsqu'un utilisateur poste une story :
- Il voit le nombre total de vues (count)
- Il ne voit **PAS** qui a vu sa story par défaut
- Un bouton "🔓 Voir qui a vu (450 FCFA)" lui permet de payer pour voir la liste complète des viewers

### 3. Système de paiement

- **Prix unique** : 450 FCFA (prix mensuel de l'abonnement premium)
- **Type d'abonnement** : Premium subscription de type "story"
- **Durée** : 1 mois
- **Méthodes de paiement** : CinetPay, LigosApp, Intouch

## Implémentation technique

### Backend

#### 1. Migration de base de données
```bash
php artisan migrate
```
- Ajoute le champ `story_id` à la table `premium_subscriptions`

#### 2. Modèle PremiumSubscription
- Nouveau type : `TYPE_STORY = 'story'`
- Nouvelles méthodes :
  - `hasActiveForStory($userId, $storyId)` : Vérifie si l'utilisateur a payé pour une story
  - `hasActiveForStoryViewers($userId, $storyId)` : Vérifie si l'utilisateur a payé pour voir les viewers

#### 3. StoryResource
Le resource masque automatiquement les informations :
```php
'user' => [
    'username' => $shouldRevealIdentity ? $this->user->username : 'Anonyme',
    'full_name' => $shouldRevealIdentity ? $this->user->full_name : 'Utilisateur Anonyme',
    'avatar_url' => $shouldRevealIdentity ? $this->user->avatar_url : 'https://ui-avatars.com/api/?name=Anonyme&background=667eea&color=fff',
],
'is_anonymous' => !$shouldRevealIdentity,
'can_reveal' => !$isOwner && !$hasSubscription,
```

#### 4. Nouveaux endpoints API

**S'abonner à une story**
```
POST /api/v1/premium/subscribe/story/{story}
```

**Vérifier le statut premium**
```
GET /api/v1/premium/check?type=story&id={storyId}
```

### Frontend

#### 1. Service Premium
Nouveau fichier : `src/services/premiumService.js`
- `subscribeToStory(storyId)` : Initie le paiement
- `checkPremium(type, id)` : Vérifie le statut
- `getPricing()` : Récupère les informations de prix

#### 2. StoryViewer.jsx
Modifications :
- Affiche "Anonyme" au lieu du vrai nom si `is_anonymous = true`
- Affiche un badge 🔒 pour les stories anonymes
- Bouton "Révéler l'identité (450 FCFA)" si `can_reveal = true`
- Bouton "🔓 Voir qui a vu (450 FCFA)" pour l'auteur si pas d'abonnement
- Modal de confirmation de paiement

#### 3. Styles CSS
Nouveaux styles ajoutés :
- `.story-anonymous-badge` : Badge pour indiquer l'anonymat
- `.story-reveal-btn` : Bouton pour révéler l'identité
- `.story-unlock-viewers-btn` : Bouton pour voir les viewers
- `.story-reveal-modal` : Modal de confirmation de paiement

## Flux utilisateur

### Scénario 1 : Voir l'identité d'une story

1. L'utilisateur voit une story avec "Anonyme" comme auteur
2. Il clique sur "Révéler l'identité (450 FCFA)"
3. Une modal de confirmation s'affiche
4. Il confirme le paiement
5. Il est redirigé vers la page de paiement (CinetPay/LigosApp)
6. Après paiement réussi, l'identité est révélée automatiquement
7. Il a accès à l'identité pour 1 mois

### Scénario 2 : Voir qui a vu ma story

1. L'auteur voit "5 vues" sur sa story
2. Il clique sur "🔓 Voir qui a vu (450 FCFA)"
3. Une modal de confirmation s'affiche
4. Il confirme le paiement
5. Il est redirigé vers la page de paiement
6. Après paiement, il peut voir la liste complète des viewers avec leurs noms et avatars
7. Il a accès à cette information pour 1 mois

## Points importants

### Sécurité
- Le propriétaire de la story voit toujours son propre nom
- Les informations de l'utilisateur sont masquées côté serveur (pas seulement côté client)
- Les abonnements sont vérifiés à chaque requête API

### Monétisation
- Chaque abonnement coûte 450 FCFA
- Les abonnements sont valables 1 mois
- Un utilisateur peut avoir plusieurs abonnements actifs pour différentes stories
- La plateforme reçoit 5% de commission sur les paiements de gifts (pas sur les subscriptions)

### Performance
- Les vérifications d'abonnement utilisent des requêtes optimisées
- Les données sont mises en cache côté client
- Les stories expirent automatiquement après 24h

## Tests recommandés

### Tests backend
```bash
# Créer une story
POST /api/v1/stories

# Voir la story (doit être anonyme)
GET /api/v1/stories/{id}

# S'abonner à la story
POST /api/v1/premium/subscribe/story/{id}

# Vérifier l'abonnement
GET /api/v1/premium/check?type=story&id={id}

# Voir la story après abonnement (doit montrer l'identité)
GET /api/v1/stories/{id}
```

### Tests frontend
1. Poster une story et vérifier qu'on voit son propre nom
2. Voir la story d'un autre utilisateur (doit être anonyme)
3. Cliquer sur "Révéler l'identité" et tester le flux de paiement
4. Vérifier que l'identité est révélée après paiement
5. Tester le bouton "Voir qui a vu" pour les auteurs

## Limitations connues

1. Les abonnements sont par story, pas par utilisateur
   - Si un utilisateur poste 10 stories, il faut payer 10 fois pour voir toutes les identités
   - Alternative future : abonnement par utilisateur (voir toutes ses stories pendant 1 mois)

2. Les stories expirent après 24h
   - L'abonnement reste valide 1 mois même si la story expire
   - Cela peut être ajusté pour expirer l'abonnement avec la story

3. Pas de remboursement
   - Si une story est supprimée par l'auteur, l'abonnement n'est pas remboursé

## Améliorations futures possibles

1. **Abonnement par utilisateur** : Payer pour voir toutes les stories d'un utilisateur
2. **Packs de révélations** : Acheter 10 révélations à prix réduit
3. **Preview gratuit** : Voir la première lettre du nom ou l'initiale
4. **Notifications** : Notifier l'auteur quand quelqu'un paie pour voir sa story
5. **Statistiques** : Voir combien de personnes ont payé pour révéler l'identité

## Support

Pour toute question ou problème :
- Backend : Vérifier les logs dans `storage/logs/laravel.log`
- Frontend : Vérifier la console du navigateur
- Paiements : Vérifier les webhooks dans la table `payments`
