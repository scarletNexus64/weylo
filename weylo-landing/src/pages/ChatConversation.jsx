import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { ArrowLeft, Send, Loader2, MessageCircle, Gift } from 'lucide-react'
import chatService from '../services/chatService'
import websocketService from '../services/websocketService'
import GiftBottomSheet from '../components/gifts/GiftBottomSheet'
import GiftMessage from '../components/gifts/GiftMessage'
import GiftAnimation from '../components/gifts/GiftAnimation'
import PremiumBadge from '../components/shared/PremiumBadge'
import RevealIdentityButton from '../components/RevealIdentityButton'
import QuotedMessage from '../components/chat/QuotedMessage'
import '../styles/ChatConversation.css'

export default function ChatConversation() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error } = useDialog()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isGiftBottomSheetOpen, setIsGiftBottomSheetOpen] = useState(false)
  const [giftAnimation, setGiftAnimation] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user || !conversationId) {
      navigate('/chat')
      return
    }

    // Initialiser WebSocket si pas déjà fait
    const token = localStorage.getItem('weylo_token')
    if (token && user.id && !websocketService.echo) {
      console.log('🔌 [CHAT] Initialisation du WebSocket...')
      websocketService.connect(token, user.id)
    }

    loadConversationData()
    loadMessages()

    return () => {
      // Cleanup WebSocket subscription
      console.log('🚪 [CHAT] Nettoyage - Désabonnement du channel conversation:', conversationId)
      websocketService.leaveChannel(`conversation.${conversationId}`)
    }
  }, [conversationId, isAuthenticated, user])

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    // Scroll smooth pour les nouveaux messages qui arrivent
    if (messages.length > 0 && !loading) {
      scrollToBottom('smooth')
    }
  }, [messages.length])

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Mapper les flame_level du backend vers les classes CSS
  const mapFlameLevel = (backendLevel) => {
    const mapping = {
      'none': 'none',
      'yellow': 'low',      // 2-6 jours
      'orange': 'medium',   // 7-29 jours
      'purple': 'high'      // 30+ jours
    }
    return mapping[backendLevel] || 'none'
  }

  const loadConversationData = async () => {
    try {
      const response = await chatService.getConversations()
      const conv = response.conversations.find(c => c.id === parseInt(conversationId))

      if (!conv) {
        navigate('/chat')
        return
      }

      const otherParticipant = conv.other_participant

      // Vérifier si le participant existe (pas supprimé)
      if (!otherParticipant || !otherParticipant.id) {
        console.warn('⚠️ Participant supprimé dans la conversation:', conv.id)
        return // Ignorer cette conversation
      }

      // L'identité est révélée seulement si payée via wallet
      const canViewIdentity = conv.identity_revealed || false

      let displayName = 'Anonyme'
      if (canViewIdentity) {
        if (otherParticipant.first_name) {
          displayName = `${otherParticipant.first_name} ${otherParticipant.last_name || ''}`.trim()
        } else if (otherParticipant.username) {
          displayName = otherParticipant.username
        }
      }

      setConversation({
        id: conv.id,
        contact_name: displayName,
        contact_avatar: otherParticipant.initial || 'U',
        is_online: otherParticipant.is_online || false,
        is_premium: otherParticipant.is_premium || false,
        identity_revealed: conv.identity_revealed || false, // Synchronisé avec Messages
        anonymous_message_id: conv.anonymous_message_id || null, // ID du message anonyme d'origine
        can_initiate_reveal: conv.can_initiate_reveal || false, // Peut payer pour révéler l'identité
        streak_days: conv.streak?.count || 0,
        flame_level: mapFlameLevel(conv.streak?.flame_level),
      })
    } catch (error) {
      console.error('❌ Erreur chargement conversation:', error)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await chatService.getMessages(conversationId)
      const transformedMessages = response.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        is_mine: msg.is_mine,
        time: formatTime(msg.created_at),
        sender_id: msg.sender_id,
        type: msg.type,
        gift_data: msg.gift_data || null,
        anonymous_message: msg.anonymous_message || null
      }))

      setMessages(transformedMessages)

      // Marquer comme lu
      await chatService.markAsRead(conversationId)

      // S'abonner aux nouveaux messages via WebSocket (une seule fois)
      if (!websocketService.isWebSocketConnected()) {
        console.log('⏳ [CHAT] WebSocket pas encore connecté, attente...')
        // Attendre la connexion puis s'abonner
        const unsubscribe = websocketService.onConnectionChange((isConnected) => {
          if (isConnected) {
            console.log('🔔 [CHAT] WebSocket connecté, abonnement au channel de la conversation:', conversationId)
            subscribeToChannel()
            unsubscribe() // Se désabonner du listener après la première connexion
          }
        })
      } else {
        // Déjà connecté, s'abonner directement
        console.log('🔔 [CHAT] WebSocket déjà connecté, abonnement au channel de la conversation:', conversationId)
        subscribeToChannel()
      }

      function subscribeToChannel() {
        const channel = websocketService.subscribeToConversationChannel(conversationId, {
          onChatMessageSent: (event) => {
            console.log('📨 [CHAT] Événement reçu:', event)

            // Ignorer nos propres messages (déjà ajoutés via optimistic update)
            if (event.sender_id === user.id) {
              console.log('⏩ [CHAT] Message de nous-même ignoré (optimistic update déjà fait)')
              return
            }

            const newMsg = {
              id: event.id,
              content: event.content,
              is_mine: false, // Toujours false car on ignore nos propres messages
              time: formatTime(event.created_at),
              sender_id: event.sender_id,
              type: event.type,
              gift_data: event.gift_data || null,
              anonymous_message: event.anonymous_message || null
            }

            console.log('✅ [CHAT] Ajout du message à la liste:', newMsg)

            // Si c'est un cadeau, afficher l'animation pour le destinataire aussi
            if (event.type === 'gift' && event.gift_data) {
              console.log('🎁 [CHAT] Cadeau reçu, affichage de l\'animation')
              setGiftAnimation(event.gift_data)
            }

            setMessages(prev => {
              // Vérifier si le message existe déjà (éviter les doublons)
              const messageExists = prev.some(msg => msg.id === newMsg.id)
              if (messageExists) {
                console.log('⚠️ [CHAT] Message déjà présent, ignoré:', newMsg.id)
                return prev
              }

              console.log('📝 [CHAT] Messages avant:', prev.length)
              const updated = [...prev, newMsg]
              console.log('📝 [CHAT] Messages après:', updated.length)
              return updated
            })

            setTimeout(() => scrollToBottom(), 100)
          }
        })

        if (channel) {
          console.log('✅ [CHAT] Channel souscrit:', channel)
        } else {
          console.log('⚠️ [CHAT] WebSocket non disponible, le chat fonctionnera sans temps réel')
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
    } finally {
      setLoading(false)
      // Scroll vers le bas après que le loading soit terminé et que le DOM soit mis à jour
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 150)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await chatService.sendMessage(conversationId, newMessage)

      // Ajouter immédiatement le message envoyé (optimistic update)
      if (response.message) {
        const newMsg = {
          id: response.message.id,
          content: response.message.content,
          is_mine: true,
          time: formatTime(response.message.created_at),
          sender_id: response.message.sender_id,
          type: response.message.type,
          gift_data: response.message.gift_data || null,
          anonymous_message: response.message.anonymous_message || null
        }

        setMessages(prev => {
          // Vérifier si le message existe déjà (éviter les doublons)
          const messageExists = prev.some(msg => msg.id === newMsg.id)
          if (messageExists) {
            console.log('⚠️ [CHAT] Message déjà présent lors de l\'envoi, ignoré:', newMsg.id)
            return prev
          }
          return [...prev, newMsg]
        })
      }

      setNewMessage('')
      setTimeout(() => scrollToBottom(), 100)
    } catch (err) {
      console.error('❌ Erreur envoi message:', err)

      // Gérer spécifiquement l'erreur 429 (Too Many Requests)
      if (err.response?.status === 429) {
        error('Vous envoyez des messages trop rapidement. Veuillez patienter quelques secondes.')
      } else {
        error('Impossible d\'envoyer le message. Veuillez réessayer.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleGiftSent = async (gift, response) => {
    console.log('🎁 Cadeau envoyé:', gift, response)

    // Récupérer les données du cadeau depuis la réponse du backend
    const giftData = response?.transaction?.gift || gift

    // Afficher la super animation avec les vraies données
    setGiftAnimation(giftData)

    // Recharger les messages pour afficher le cadeau
    try {
      console.log('🔄 [GIFT] Rechargement des messages après envoi du cadeau...')
      await loadMessages()

      // Scroller vers le bas après un court délai pour s'assurer que le rendu est terminé
      setTimeout(() => {
        scrollToBottom()
      }, 300)
    } catch (error) {
      console.error('❌ [GIFT] Erreur lors du rechargement des messages:', error)
    }
  }

  const handleAnimationComplete = () => {
    setGiftAnimation(null)
  }

  const handleRevealIdentity = async () => {
    try {
      // Le paiement est géré par RevealIdentityButton
      // On recharge juste la conversation après succès
      await loadConversationData()

      console.log('✅ Identité révélée dans la conversation')
    } catch (error) {
      console.error('❌ Erreur révélation identité:', error)
      // L'erreur sera gérée par le composant RevealIdentityButton
      throw error
    }
  }

  if (!conversation && !loading) {
    return (
      <div className="chat-conversation-page">
        <div className="error-state">
          <MessageCircle size={64} />
          <p>Conversation introuvable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-conversation-page">
      {/* Header */}
      <div className="chat-conversation-header">
        <button
          onClick={() => navigate('/chat')}
          className="btn-back"
          aria-label="Retour aux conversations"
          type="button"
        >
          <span style={{ fontSize: '24px' }}>←</span>
        </button>
        {conversation && (
          <>
            <div className="conversation-avatar-header">
              {conversation.contact_avatar}
            </div>
            <div className="conversation-info-header">
              <h2>
                {conversation.contact_name}
                {conversation.is_premium && <PremiumBadge size="small" />}
              </h2>
              <p className={conversation.is_online ? 'status-online' : 'status-offline'}>
                {conversation.is_online ? '● En ligne' : '○ Hors ligne'}
              </p>
              {/* Bouton Révéler l'identité si l'utilisateur peut initier le paiement */}
              {conversation.can_initiate_reveal && (
                <div style={{ marginTop: '8px' }}>
                  <RevealIdentityButton
                    conversationId={conversation.id}
                    message={{
                      is_identity_revealed: conversation.identity_revealed
                    }}
                    onReveal={handleRevealIdentity}
                  />
                </div>
              )}
            </div>
            {conversation.streak_days > 0 && (
              <div className={`chat-header-streak flame-${conversation.flame_level}`}>
                <span className="streak-flame">🔥</span>
                <span className="streak-count">{conversation.streak_days}</span>
                <span className="streak-label">jours</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {loading ? (
          <div className="loading-messages">
            <Loader2 className="spinner" size={32} strokeWidth={2.5} />
            <p>Chargement des messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <MessageCircle size={48} strokeWidth={1.5} />
            <p>Aucun message pour le moment</p>
            <span>Envoyez le premier message !</span>
          </div>
        ) : (
          <>
            {messages.map(msg => {
              // Si c'est un message cadeau
              if (msg.type === 'gift' && msg.gift_data) {
                // Déterminer le nom de l'expéditeur (masquer si anonyme ou supprimé)
                let senderName = 'Anonyme'
                if (msg.is_mine) {
                  senderName = 'Vous'
                } else if (conversation?.contact_name && !msg.gift_data.is_anonymous) {
                  senderName = conversation.contact_name
                }

                return (
                  <GiftMessage
                    key={msg.id}
                    gift={msg.gift_data}
                    isMine={msg.is_mine}
                    senderName={senderName}
                    time={msg.time}
                  />
                )
              }

              // Message texte normal
              return (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.is_mine ? 'mine' : 'theirs'}`}
                >
                  <div className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}>
                    {/* Afficher le message cité si présent */}
                    {msg.anonymous_message && (
                      <QuotedMessage
                        quotedMessage={msg.anonymous_message}
                        isMine={msg.is_mine}
                      />
                    )}
                    <p className="message-text">{msg.content}</p>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <button
          className="btn-gift"
          onClick={() => setIsGiftBottomSheetOpen(true)}
          title="Envoyer un cadeau"
        >
          <Gift strokeWidth={2} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="btn-send"
          aria-label="Envoyer le message"
        >
          {sending ? (
            <Loader2 strokeWidth={2.5} className="spinner" />
          ) : (
            <Send strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Gift Bottom Sheet */}
      <GiftBottomSheet
        isOpen={isGiftBottomSheetOpen}
        onClose={() => setIsGiftBottomSheetOpen(false)}
        recipientName={conversation?.contact_name || 'Anonyme'}
        conversationId={conversationId}
        onGiftSent={handleGiftSent}
      />

      {/* Gift Animation Full Screen */}
      {giftAnimation && (
        <GiftAnimation
          gift={giftAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}
