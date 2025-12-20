import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Paperclip,
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react'
import chatService from '../services/chatService'
import websocketService from '../services/websocketService'
import '../styles/Chat.css'

export default function Chat() {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const messagesEndRef = useRef(null)

  // Vérifier si l'utilisateur peut voir toutes les identités (premium)
  const canViewAllIdentities = user?.is_premium || false

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Initialiser WebSocket avec token et userId
    const token = localStorage.getItem('weylo_token')
    if (token && user.id) {
      websocketService.connect(token, user.id)

      // Écouter les changements de connexion WebSocket
      const unsubscribe = websocketService.onConnectionChange((isConnected) => {
        console.log('🔔 [CHAT] État de connexion WebSocket changé:', isConnected)
        setIsWebSocketConnected(isConnected)
      })

      loadConversations()

      return () => {
        unsubscribe()
        websocketService.disconnect()
        setIsWebSocketConnected(false)
      }
    }

    loadConversations()
  }, [isAuthenticated, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages[selectedChat]])

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

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await chatService.getConversations()
      const transformedConversations = response.conversations.map(conv => {
        const otherParticipant = conv.other_participant

        if (!otherParticipant) {
          return null
        }

        // Afficher le vrai nom si premium ou si identité révélée
        let displayName = 'Anonyme'
        const canSeeIdentity = canViewAllIdentities || conv.identity_revealed || false
        if (canSeeIdentity) {
          if (otherParticipant.username) {
            displayName = otherParticipant.username
          } else if (otherParticipant.first_name) {
            displayName = `${otherParticipant.first_name} ${otherParticipant.last_name || ''}`.trim()
          }
        }

        return {
          id: conv.id,
          contact_name: displayName,
          contact_avatar: otherParticipant.initial || 'U',
          last_message: conv.last_message?.content || 'Aucun message',
          last_message_time: formatTime(conv.last_message_at || conv.created_at),
          unread_count: conv.unread_count || 0,
          streak_days: conv.streak?.count || 0,
          is_online: otherParticipant.is_online || false,
          other_user_id: otherParticipant.id,
          flame_level: mapFlameLevel(conv.streak?.flame_level),
          has_premium: conv.has_premium || false
        }
      }).filter(conv => conv !== null)

      setConversations(transformedConversations)
    } catch (error) {
      console.error('❌ Erreur chargement conversations:', error)
      setError('Impossible de charger les conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    try {
      const response = await chatService.getMessages(conversationId)
      const transformedMessages = response.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        is_mine: msg.is_mine,
        time: formatTime(msg.created_at),
        sender_id: msg.sender_id,
        type: msg.type
      }))

      setMessages(prev => ({
        ...prev,
        [conversationId]: transformedMessages
      }))

      await chatService.markAsRead(conversationId)

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      )

      websocketService.subscribeToConversationChannel(conversationId, {
        onChatMessageSent: (event) => {
          setMessages(prev => ({
            ...prev,
            [conversationId]: [
              ...(prev[conversationId] || []),
              {
                id: event.message.id,
                content: event.message.content,
                is_mine: event.message.is_mine,
                time: formatTime(event.message.created_at),
                sender_id: event.message.sender_id,
                type: event.message.type
              }
            ]
          }))

          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, last_message: event.message.content, last_message_time: 'À l\'instant' }
                : conv
            )
          )
        }
      })
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
    }
  }

  const selectChat = (conversation) => {
    setSelectedChat(conversation.id)
    setIsChatOpen(true)
    loadMessages(conversation.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return

    try {
      setSending(true)
      const response = await chatService.sendMessage(selectedChat, newMessage)

      setMessages(prev => ({
        ...prev,
        [selectedChat]: [
          ...(prev[selectedChat] || []),
          {
            id: response.message.id,
            content: response.message.content,
            is_mine: response.message.is_mine,
            time: formatTime(response.message.created_at),
            sender_id: response.message.sender_id,
            type: response.message.type
          }
        ]
      }))

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedChat
            ? { ...conv, last_message: newMessage, last_message_time: 'À l\'instant' }
            : conv
        )
      )

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

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <div className="auth-required-content">
          <Lock className="auth-required-icon" />
          <h3>Authentification requise</h3>
          <p>Veuillez vous connecter pour accéder au chat</p>
        </div>
      </div>
    )
  }

  const selectedConversation = conversations.find(c => c.id === selectedChat)

  return (
    <div className="chat-page">
      <div className="chat-container">

        {/* Conversations List */}
        <div className={`conversations-sidebar ${isChatOpen ? 'hidden' : ''}`}>
          {/* Header */}
          <div className="conversations-header">
            <div className="conversations-title">
              <h2>Messages</h2>
              {isWebSocketConnected && (
                <div className="ws-status" title="Connecté en temps réel" />
              )}
            </div>
            <button className="btn-new-conversation">
              <MessageCircle size={20} />
            </button>
          </div>

          {/* Conversations List */}
          <div className="conversations-list">
            {loading ? (
              <div className="loading-conversations">
                <Loader2 className="loading-spinner" />
                <p className="loading-text">Chargement...</p>
              </div>
            ) : error ? (
              <div className="error-conversations">
                <AlertCircle className="error-icon" />
                <p className="error-text">{error}</p>
                <button onClick={loadConversations} className="btn-retry">
                  Réessayer
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-conversations">
                <MessageCircle size={48} className="empty-icon" />
                <p className="empty-text">Aucune conversation</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => selectChat(conv)}
                  className={`conversation-item ${selectedChat === conv.id ? 'active' : ''}`}
                >
                  <div className="contact-avatar-wrapper">
                    <div className="contact-avatar">
                      {conv.contact_avatar}
                    </div>
                    {conv.is_online && (
                      <div className="online-indicator" />
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-info-header">
                      <h3 className="contact-name">
                        {conv.contact_name}
                        {conv.streak_days > 0 && (
                          <span className={`conversation-streak flame-${conv.flame_level}`}>
                            <span className="streak-flame">🔥</span>
                            <span className="streak-count">{conv.streak_days}</span>
                          </span>
                        )}
                      </h3>
                      <span className="message-time">{conv.last_message_time}</span>
                    </div>
                    <div className="conversation-info-footer">
                      <p className="last-message">
                        {conv.last_message}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!isChatOpen ? 'hidden' : ''}`}>
          {selectedChat && selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="btn-back-chat"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="chat-header-avatar">
                  {selectedConversation.contact_avatar}
                </div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">
                    {selectedConversation.contact_name}
                  </h3>
                  <p className={`chat-header-status ${selectedConversation.is_online ? 'online' : 'offline'}`}>
                    {selectedConversation.is_online ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
                {selectedConversation.streak_days > 0 && (
                  <div className={`chat-header-streak flame-${selectedConversation.flame_level}`}>
                    <span className="streak-flame">🔥</span>
                    <span className="streak-count">{selectedConversation.streak_days}</span>
                    <span className="streak-label">jours</span>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="messages-area">
                {messages[selectedChat]?.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${msg.is_mine ? 'mine' : 'theirs'}`}
                  >
                    <div className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}>
                      <p className="message-content">{msg.content}</p>
                      <p className={`message-timestamp ${msg.is_mine ? 'mine' : 'theirs'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="messages-end-ref" />
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <button className="btn-attach">
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Écris ton message..."
                    className="message-input"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="btn-send-message"
                  >
                    {sending ? <Loader2 size={20} className="loading-spinner" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <MessageCircle className="empty-chat-icon" />
              <h3>Sélectionne une conversation</h3>
              <p>Choisis un contact pour démarrer la discussion</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
