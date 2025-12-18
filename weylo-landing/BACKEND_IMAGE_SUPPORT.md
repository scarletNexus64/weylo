# Support des Images dans le Chat - Backend

## 📋 Situation actuelle

D'après l'exploration du backend Weylo (`/Users/macbookpro/Desktop/Developments/Personnals/msgLink/MSG-Link-Back/app`), **l'API ne supporte PAS l'envoi d'images dans le chat**.

### API actuelle
- **Endpoint**: `POST /api/v1/chat/conversations/{conversation_id}/messages`
- **Format**: JSON uniquement
- **Paramètre**: `content` (string, max 1000 caractères)
- **Fichier**: `/app/Http/Controllers/Api/V1/ChatController.php:158`

### Fonctionnalités existantes avec images
- **Stories**: Supporte jpeg, png, gif, webp (max 50 MB)
- **Avatar utilisateur**: Supporte jpeg, png, jpg, gif (max 2 MB)

---

## ✅ Modifications nécessaires côté Backend

### 1. Migration de la base de données

Ajouter une colonne `image_path` à la table `chat_messages`:

```php
// database/migrations/xxxx_add_image_to_chat_messages.php
Schema::table('chat_messages', function (Blueprint $table) {
    $table->string('image_path')->nullable()->after('content');
    $table->string('type')->default('text')->after('image_path'); // 'text', 'image', 'mixed'
});
```

### 2. Mise à jour du Controller

Modifier `ChatController::sendMessage()` pour accepter les images:

```php
// app/Http/Controllers/Api/V1/ChatController.php

public function sendMessage(Request $request, $conversationId)
{
    $validated = $request->validate([
        'content' => 'nullable|string|max:1000',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10 MB max
    ]);

    // Vérifier qu'au moins content OU image est fourni
    if (!$request->has('content') && !$request->hasFile('image')) {
        return response()->json([
            'message' => 'Vous devez fournir un message texte ou une image'
        ], 422);
    }

    // Upload de l'image si présente
    $imagePath = null;
    $messageType = 'text';

    if ($request->hasFile('image')) {
        $image = $request->file('image');
        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
        $path = "chat/{$conversationId}";
        $imagePath = $image->storeAs($path, $filename, 'public');
        $messageType = $request->has('content') ? 'mixed' : 'image';
    }

    // Créer le message
    $message = ChatMessage::create([
        'conversation_id' => $conversationId,
        'sender_id' => auth()->id(),
        'content' => $request->content,
        'image_path' => $imagePath,
        'type' => $messageType,
    ]);

    // Broadcast via WebSocket
    broadcast(new ChatMessageSent($message))->toOthers();

    return response()->json([
        'message' => $message->load('sender'),
        'image_url' => $imagePath ? url("storage/{$imagePath}") : null,
    ], 201);
}
```

### 3. Mise à jour du Model

Ajouter les champs au model `ChatMessage`:

```php
// app/Models/ChatMessage.php

protected $fillable = [
    'conversation_id',
    'sender_id',
    'content',
    'image_path',
    'type',
    'is_read',
];

protected $appends = ['image_url'];

public function getImageUrlAttribute()
{
    return $this->image_path ? url("storage/{$this->image_path}") : null;
}
```

### 4. Mise à jour de la Validation

Créer une FormRequest dédiée:

```php
// app/Http/Requests/SendChatMessageRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendChatMessageRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'content' => 'nullable|string|max:1000',
            'image' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif,webp',
                'max:10240', // 10 MB
            ],
        ];
    }

    public function messages()
    {
        return [
            'image.image' => 'Le fichier doit être une image',
            'image.mimes' => 'L\'image doit être au format: jpeg, png, jpg, gif, webp',
            'image.max' => 'L\'image ne doit pas dépasser 10 MB',
        ];
    }

    protected function prepareForValidation()
    {
        // S'assurer qu'au moins content ou image est fourni
        if (!$this->has('content') && !$this->hasFile('image')) {
            $this->merge(['_has_content' => false]);
        }
    }
}
```

### 5. Route API

La route reste la même, mais accepte maintenant `multipart/form-data`:

```php
// routes/api.php
Route::post('/chat/conversations/{conversation}/messages', [ChatController::class, 'sendMessage'])
    ->middleware('auth:sanctum');
```

### 6. Storage Configuration

Assurer que le lien symbolique est créé:

```bash
php artisan storage:link
```

Ajouter au `.gitignore`:

```
storage/app/public/chat/*
!storage/app/public/chat/.gitkeep
```

---

## 🎨 Modifications Frontend (déjà implémenté)

### ChatConversation.jsx

Le bouton d'upload d'image est déjà présent mais **désactivé** avec un tooltip explicatif.

Une fois le backend mis à jour, il faudra :

1. **Activer le bouton d'upload**:
```jsx
const [selectedImage, setSelectedImage] = useState(null)
const fileInputRef = useRef(null)

const handleImageSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    // Vérifier la taille (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 10 MB')
      return
    }
    setSelectedImage(file)
  }
}
```

2. **Modifier la fonction sendMessage**:
```jsx
const sendMessage = async () => {
  if ((!newMessage.trim() && !selectedImage) || sending) return

  try {
    setSending(true)

    const formData = new FormData()
    if (newMessage.trim()) formData.append('content', newMessage)
    if (selectedImage) formData.append('image', selectedImage)

    const response = await chatService.sendMessageWithImage(conversationId, formData)

    // Reste du code...
    setSelectedImage(null)
  } catch (error) {
    console.error('❌ Erreur envoi message:', error)
  } finally {
    setSending(false)
  }
}
```

3. **Ajouter un aperçu de l'image sélectionnée**

4. **Afficher les images dans les messages**

---

## 📝 Service Frontend

Créer une nouvelle fonction dans `chatService.js`:

```javascript
// src/services/chatService.js

const sendMessageWithImage = async (conversationId, formData) => {
  const token = localStorage.getItem('weylo_token')
  const response = await fetch(
    `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type, le browser le fera automatiquement avec boundary
      },
      body: formData
    }
  )

  if (!response.ok) {
    throw new Error('Erreur lors de l\'envoi du message')
  }

  return await response.json()
}

export default {
  // ... autres méthodes
  sendMessageWithImage,
}
```

---

## 🚀 Ordre d'implémentation recommandé

1. ✅ Créer la migration et exécuter `php artisan migrate`
2. ✅ Mettre à jour le Model `ChatMessage`
3. ✅ Créer la FormRequest `SendChatMessageRequest`
4. ✅ Modifier le Controller `ChatController::sendMessage()`
5. ✅ Tester l'API avec Postman/Insomnia
6. ✅ Créer le lien symbolique `php artisan storage:link`
7. ✅ Mettre à jour le frontend (activer le bouton)
8. ✅ Tester l'envoi d'images depuis le frontend

---

## 🧪 Tests API avec Postman

### Requête avec image

```
POST http://localhost:8000/api/v1/chat/conversations/1/messages
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- content: "Regarde cette image !"
- image: [fichier image]
```

### Réponse attendue

```json
{
  "message": {
    "id": 123,
    "conversation_id": 1,
    "sender_id": 5,
    "content": "Regarde cette image !",
    "image_path": "chat/1/uuid.jpg",
    "type": "mixed",
    "created_at": "2025-01-17T10:30:00.000000Z",
    "sender": {
      "id": 5,
      "username": "john_doe"
    }
  },
  "image_url": "http://localhost:8000/storage/chat/1/uuid.jpg"
}
```

---

## 📌 Notes importantes

- Le champ `content` devient **nullable** (on peut envoyer juste une image)
- Maximum 10 MB par image (configurable)
- Les images sont stockées dans `storage/app/public/chat/{conversation_id}/`
- Le type de message peut être: `text`, `image`, ou `mixed`
- Penser à ajouter la suppression automatique des images si le message est supprimé

---

## 🔒 Sécurité

- ✅ Validation stricte des types MIME
- ✅ Limitation de la taille des fichiers
- ✅ Stockage dans un dossier sécurisé
- ⚠️ Ajouter un scan antivirus pour les images uploadées (recommandé)
- ⚠️ Générer des noms de fichiers uniques (UUID)
- ⚠️ Vérifier que l'utilisateur a accès à la conversation

---

**Date de création**: 17 janvier 2025
**Status**: En attente de développement backend
**Frontend**: Bouton désactivé avec tooltip explicatif
