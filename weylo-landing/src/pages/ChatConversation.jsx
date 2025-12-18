import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Send, Image, Loader2, MessageCircle } from 'lucide-react'
import chatService from '../services/chatService'
import websocketService from '../services/websocketService'
import '../styles/ChatConversation.css'

export default function ChatConversation() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user || !conversationId) {
      navigate('/chat')
      return
    }

    loadConversationData()
    loadMessages()

    return () => {
      // Cleanup WebSocket subscription
      console.log('🚪 [CHAT] Nettoyage - Désabonnement du channel conversation:', conversationId)
      websocketService.leaveChannel(`private-conversation.${conversationId}`)
    }
  }, [conversationId, isAuthenticated, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const loadConversationData = async () => {
    try {
      const response = await chatService.getConversations()
      const conv = response.conversations.find(c => c.id === parseInt(conversationId))

      if (!conv) {
        navigate('/chat')
        return
      }

      const otherParticipant = conv.other_participant
      let displayName = 'Anonyme'
      if (otherParticipant.username) {
        displayName = otherParticipant.username
      } else if (otherParticipant.first_name) {
        displayName = `${otherParticipant.first_name} ${otherParticipant.last_name || ''}`.trim()
      }

      setConversation({
        id: conv.id,
        contact_name: displayName,
        contact_avatar: otherParticipant.initial || 'U',
        is_online: otherParticipant.is_online || false,
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
        type: msg.type
      }))

      setMessages(transformedMessages)

      // Marquer comme lu
      await chatService.markAsRead(conversationId)

      // S'abonner aux nouveaux messages via WebSocket (avec délai pour laisser le temps au WS de se connecter)
      const subscribeToWebSocket = () => {
        console.log('🔔 [CHAT] Tentative d\'abonnement au channel de la conversation:', conversationId)

        // Vérifier si le WebSocket est connecté
        if (!websocketService.isWebSocketConnected()) {
          console.log('⏳ [CHAT] WebSocket pas encore connecté, nouvelle tentative dans 1s...')
          setTimeout(subscribeToWebSocket, 1000)
          return
        }

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
              type: event.type
            }

            console.log('✅ [CHAT] Ajout du message à la liste:', newMsg)
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
            scrollToBottom()
          }
        })

        if (channel) {
          console.log('✅ [CHAT] Channel souscrit:', channel)
        } else {
          console.log('⚠️ [CHAT] WebSocket non disponible, le chat fonctionnera sans temps réel')
        }
      }

      // Démarrer l'abonnement
      subscribeToWebSocket()
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
    } finally {
      setLoading(false)
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
          type: response.message.type
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
    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
      alert('Impossible d\'envoyer le message. Veuillez réessayer.')
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
              <h2>{conversation.contact_name}</h2>
              <p className={conversation.is_online ? 'status-online' : 'status-offline'}>
                {conversation.is_online ? '● En ligne' : '○ Hors ligne'}
              </p>
            </div>
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
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-wrapper ${msg.is_mine ? 'mine' : 'theirs'}`}
              >
                <div className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}>
                  <p className="message-text">{msg.content}</p>
                  <span className="message-time">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <button
          className="btn-image-upload"
          disabled
          title="L'envoi d'images sera bientôt disponible"
        >
          <Image strokeWidth={2} />
          <span className="image-tooltip">
            Fonctionnalité bientôt disponible
          </span>
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
    </div>
  )
}
