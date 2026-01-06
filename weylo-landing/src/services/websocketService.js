import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Configuration Laravel Reverb
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME

console.log('🌐 [WEBSOCKET] Configuration Reverb:', {
  host: REVERB_HOST,
  port: REVERB_PORT,
  key: REVERB_KEY,
  scheme: REVERB_SCHEME
})

// Configurer Pusher pour Laravel Reverb
window.Pusher = Pusher

class WebSocketService {
  constructor() {
    this.echo = null
    this.isConnected = false
    this.connectionListeners = []
  }

  /**
   * Initialiser la connexion WebSocket
   * @param {string} token - Token d'authentification
   * @param {number} userId - ID de l'utilisateur
   */
  connect(token, userId) {
    if (this.echo) {
      console.log('⚠️ [WEBSOCKET] Déjà connecté, déconnexion avant reconnexion...')
      this.disconnect()
    }

    console.log('🔌 [WEBSOCKET] Connexion à Laravel Reverb...', { userId })

    try {
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: REVERB_KEY,
        wsHost: REVERB_HOST,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        },
        // Désactiver l'autorisation pour éviter les erreurs 404 si le backend n'est pas prêt
        authorizer: (channel) => {
          return {
            authorize: (socketId, callback) => {
              // Si c'est un channel privé, on fait l'auth
              if (channel.name.startsWith('private-') || channel.name.startsWith('presence-')) {
                fetch(`${import.meta.env.VITE_API_URL}/broadcasting/auth`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name
                  })
                })
                .then(response => {
                  if (!response.ok) {
                    console.warn(`⚠️ [WEBSOCKET] Autorisation échouée pour ${channel.name} - continuons sans auth`)
                    // Continuer sans autorisation plutôt que de crasher
                    callback(null, { auth: '' })
                  }
                  return response.json()
                })
                .then(data => callback(null, data))
                .catch(error => {
                  console.warn('⚠️ [WEBSOCKET] Erreur d\'autorisation:', error)
                  // Continuer sans autorisation
                  callback(null, { auth: '' })
                })
              } else {
                // Channel public, pas d'auth nécessaire
                callback(null, { auth: '' })
              }
            }
          }
        }
      })

      // Vérifier la connexion
      this.echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ [WEBSOCKET] Connecté à Laravel Reverb!')
        this.isConnected = true
        this.notifyConnectionListeners(true)
      })

      this.echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('❌ [WEBSOCKET] Déconnecté de Laravel Reverb')
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      this.echo.connector.pusher.connection.bind('error', (error) => {
        console.error('❌ [WEBSOCKET] Erreur de connexion:', error)
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      this.echo.connector.pusher.connection.bind('unavailable', () => {
        console.warn('⚠️ [WEBSOCKET] WebSocket non disponible - fonctionnalité temps réel désactivée')
        console.warn('⚠️ [WEBSOCKET] Vérifiez que Laravel Reverb est démarré avec: php artisan reverb:start')
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      this.echo.connector.pusher.connection.bind('failed', () => {
        console.error('❌ [WEBSOCKET] Connexion échouée - impossible de se connecter à Reverb')
        console.error('❌ [WEBSOCKET] Le chat temps réel ne sera pas disponible')
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      return this.echo
    } catch (error) {
      console.error('❌ [WEBSOCKET] Erreur lors de l\'initialisation:', error)
      console.error('💡 [WEBSOCKET] Le chat fonctionnera sans mise à jour temps réel')
      // Ne pas throw l'erreur pour permettre à l'app de continuer
      return null
    }
  }

  /**
   * Ajouter un listener pour les changements de connexion
   * @param {function} callback - Fonction appelée quand la connexion change (true/false)
   */
  onConnectionChange(callback) {
    this.connectionListeners.push(callback)
    // Appeler immédiatement le callback avec l'état actuel
    callback(this.isConnected)

    // Retourner une fonction pour se désabonner
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notifier tous les listeners du changement de connexion
   * @param {boolean} isConnected - État de la connexion
   */
  notifyConnectionListeners(isConnected) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected)
      } catch (error) {
        console.error('❌ [WEBSOCKET] Erreur lors de la notification du listener:', error)
      }
    })
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnect() {
    if (this.echo) {
      console.log('🔌 [WEBSOCKET] Déconnexion...')
      this.echo.disconnect()
      this.echo = null
      this.isConnected = false
      this.notifyConnectionListeners(false)
    }
  }

  /**
   * S'abonner au channel privé de l'utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {object} callbacks - Callbacks pour les événements
   */
  subscribeToUserChannel(userId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ [WEBSOCKET] Echo non initialisé')
      return null
    }

    const channelName = `user.${userId}`
    console.log('📡 [WEBSOCKET] Abonnement au channel:', channelName)

    const channel = this.echo.private(channelName)

    // Message anonyme reçu
    if (callbacks.onMessageReceived) {
      channel.listen('MessageSent', (event) => {
        console.log('📨 [WEBSOCKET] Message anonyme reçu:', event)
        callbacks.onMessageReceived(event)
      })
    }

    // Cadeau reçu
    if (callbacks.onGiftReceived) {
      channel.listen('GiftSent', (event) => {
        console.log('🎁 [WEBSOCKET] Cadeau reçu:', event)
        callbacks.onGiftReceived(event)
      })
    }

    return channel
  }

  /**
   * S'abonner au channel d'une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {object} callbacks - Callbacks pour les événements
   */
  subscribeToConversationChannel(conversationId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ [WEBSOCKET] Echo non initialisé')
      return null
    }

    const channelName = `conversation.${conversationId}`
    console.log('📡 [WEBSOCKET] Abonnement au channel de conversation:', channelName)

    const channel = this.echo.private(channelName)

    // DEBUGGER : Écouter TOUS les événements du channel (via notification)
    channel.notification((notification) => {
      console.log('🔔 [WEBSOCKET DEBUG] Notification reçue:', notification)
    })

    // DEBUGGER : Bind directement sur pusher pour voir TOUS les events
    if (this.echo.connector && this.echo.connector.pusher) {
      const pusherChannel = this.echo.connector.pusher.channel(`private-${channelName}`)
      if (pusherChannel) {
        pusherChannel.bind_global((eventName, data) => {
          console.log(`🌍 [WEBSOCKET DEBUG] Événement global capturé sur ${channelName}:`, { eventName, data })
        })
      }
    }

    // Essayer plusieurs noms d'événements possibles
    if (callbacks.onChatMessageSent) {
      // Nom 1 : .message.sent
      channel.listen('.message.sent', (event) => {
        console.log('💬 [WEBSOCKET] Message reçu (.message.sent):', event)
        callbacks.onChatMessageSent(event)
      })

      // Nom 2 : ChatMessageSent (nom de classe Laravel)
      channel.listen('ChatMessageSent', (event) => {
        console.log('💬 [WEBSOCKET] Message reçu (ChatMessageSent):', event)
        callbacks.onChatMessageSent(event)
      })

      // Nom 3 : .ChatMessageSent
      channel.listen('.ChatMessageSent', (event) => {
        console.log('💬 [WEBSOCKET] Message reçu (.ChatMessageSent):', event)
        callbacks.onChatMessageSent(event)
      })

      // Nom 4 : MessageSent
      channel.listen('MessageSent', (event) => {
        console.log('💬 [WEBSOCKET] Message reçu (MessageSent):', event)
        callbacks.onChatMessageSent(event)
      })

      // Nom 5 : .MessageSent
      channel.listen('.MessageSent', (event) => {
        console.log('💬 [WEBSOCKET] Message reçu (.MessageSent):', event)
        callbacks.onChatMessageSent(event)
      })
    }

    // Log de la souscription réussie
    console.log('✅ [WEBSOCKET] Souscription au channel de conversation réussie:', channelName)
    console.log('🔍 [WEBSOCKET] En attente d\'événements sur:', channelName)

    return channel
  }

  /**
   * S'abonner au channel d'un groupe
   * @param {number} groupId - ID du groupe
   * @param {object} callbacks - Callbacks pour les événements
   */
  subscribeToGroupChannel(groupId, callbacks = {}) {
    if (!this.echo) {
      console.error('❌ [WEBSOCKET] Echo non initialisé')
      return null
    }

    const channelName = `group.${groupId}`
    console.log('📡 [WEBSOCKET] Abonnement au channel de groupe:', channelName)

    const channel = this.echo.private(channelName)

    // Message de groupe envoyé
    if (callbacks.onGroupMessageSent) {
      channel.listen('.message.sent', (event) => {
        console.log('💬 [WEBSOCKET] Message de groupe reçu (RAW):', event)
        console.log('💬 [WEBSOCKET] Type:', typeof event)
        console.log('💬 [WEBSOCKET] Keys:', Object.keys(event))
        callbacks.onGroupMessageSent(event)
      })
    }

    // Log de la souscription réussie
    console.log('✅ [WEBSOCKET] Souscription au channel de groupe réussie:', channelName)

    return channel
  }

  /**
   * S'abonner au channel de présence (qui est en ligne)
   * @param {object} callbacks - Callbacks pour les événements
   */
  subscribeToPresenceChannel(callbacks = {}) {
    if (!this.echo) {
      console.error('❌ [WEBSOCKET] Echo non initialisé')
      return null
    }

    const channelName = 'presence.online'
    console.log('📡 [WEBSOCKET] Abonnement au channel de présence:', channelName)

    const channel = this.echo.join(channelName)

    // Quelqu'un rejoint
    if (callbacks.onJoin) {
      channel.here((users) => {
        console.log('👥 [WEBSOCKET] Utilisateurs actuellement en ligne:', users)
        callbacks.onJoin(users)
      })

      channel.joining((user) => {
        console.log('👋 [WEBSOCKET] Utilisateur vient de se connecter:', user)
        if (callbacks.onUserJoin) {
          callbacks.onUserJoin(user)
        }
      })
    }

    // Quelqu'un part
    if (callbacks.onLeave) {
      channel.leaving((user) => {
        console.log('👋 [WEBSOCKET] Utilisateur vient de se déconnecter:', user)
        callbacks.onLeave(user)
      })
    }

    return channel
  }

  /**
   * Se désabonner d'un channel
   * @param {string} channelName - Nom du channel
   */
  leaveChannel(channelName) {
    if (this.echo) {
      console.log('🚪 [WEBSOCKET] Désabonnement du channel:', channelName)
      this.echo.leave(channelName)
    }
  }

  /**
   * Vérifier si le WebSocket est connecté
   */
  isWebSocketConnected() {
    return this.isConnected
  }
}

// Instance singleton
const websocketService = new WebSocketService()

export default websocketService
