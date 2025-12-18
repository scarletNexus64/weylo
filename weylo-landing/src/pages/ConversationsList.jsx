import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, Loader2, Lock, AlertCircle } from 'lucide-react'
import chatService from '../services/chatService'
import websocketService from '../services/websocketService'
import '../styles/ConversationsList.css'

export default function ConversationsList() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Initialiser WebSocket
    const token = localStorage.getItem('weylo_token')
    if (token && user.id) {
      const echo = websocketService.connect(token, user.id)
      if (echo) {
        setIsWebSocketConnected(true)
      }
    }

    loadConversations()

    return () => {
      websocketService.disconnect()
      setIsWebSocketConnected(false)
    }
  }, [isAuthenticated, user])

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

        let displayName = 'Anonyme'
        if (otherParticipant.username) {
          displayName = otherParticipant.username
        } else if (otherParticipant.first_name) {
          displayName = `${otherParticipant.first_name} ${otherParticipant.last_name || ''}`.trim()
        }

        return {
          id: conv.id,
          contact_name: displayName,
          contact_avatar: otherParticipant.initial || 'U',
          last_message: conv.last_message?.content || 'Aucun message',
          last_message_time: formatTime(conv.last_message_at || conv.created_at),
          unread_count: conv.unread_count || 0,
          is_online: otherParticipant.is_online || false,
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

  const openConversation = (conversationId) => {
    navigate(`/chat/${conversationId}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="conversations-page">
        <div className="auth-required">
          <div className="auth-required-content">
            <Lock className="auth-required-icon" />
            <h3>Authentification requise</h3>
            <p>Veuillez vous connecter pour accéder au chat</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="conversations-page">
      {/* Header */}
      <div className="conversations-header">
        <div className="conversations-title">
          <div className="header-icon">
            <MessageCircle size={28} />
          </div>
          <div>
            <h1>Messages</h1>
            <p>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        {isWebSocketConnected && (
          <div className="ws-status-badge">
            <div className="ws-dot" />
            <span>En ligne</span>
          </div>
        )}
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Chargement des conversations...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle className="error-icon" size={40} />
          <p className="error-text">{error}</p>
          <button onClick={loadConversations} className="btn-retry">
            Réessayer
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <MessageCircle size={64} strokeWidth={1.5} />
          </div>
          <h3>Aucune conversation</h3>
          <p>Vous n'avez pas encore de conversations actives</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => openConversation(conv.id)}
              className="conversation-card"
            >
              <div className="conversation-avatar-wrapper">
                <div className="conversation-avatar">
                  {conv.contact_avatar}
                </div>
                {conv.is_online && (
                  <div className="online-badge" />
                )}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3 className="conversation-name">{conv.contact_name}</h3>
                  <span className="conversation-time">{conv.last_message_time}</span>
                </div>
                <div className="conversation-footer">
                  <p className="conversation-preview">{conv.last_message}</p>
                  {conv.unread_count > 0 && (
                    <span className="unread-count">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
