import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Trash2, Send, Eye, Lock, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import messagesService from '../services/messagesService'
import RevealIdentityButton from '../components/RevealIdentityButton'
import PremiumBadge from '../components/shared/PremiumBadge'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Messages.css'

export default function Messages() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ received_count: 0, unread_count: 0, revealed_count: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  // Vérifier si l'utilisateur peut voir toutes les identités (premium)
  const canViewAllIdentities = user?.is_premium || false

  useEffect(() => {
    fetchMessages()
    fetchStats()
  }, [currentPage])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await messagesService.getReceivedMessages(currentPage, 20)
      setMessages(data.messages)
      if (data.meta) {
        setCurrentPage(data.meta.current_page)
        setLastPage(data.meta.last_page)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await messagesService.getStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      try {
        setDeletingId(messageId)
        await messagesService.deleteMessage(messageId)
        // Retirer le message de la liste immédiatement
        setMessages(messages.filter(m => m.id !== messageId))
        fetchStats()
      } catch (err) {
        console.error('Error deleting message:', err)
        alert(err.response?.data?.message || 'Erreur lors de la suppression')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleReplyClick = (message) => {
    // Rediriger vers la page de réponse anonyme
    navigate(`/reply-anonymous/${message.id}`)
  }

  const handleRevealIdentity = async (messageId) => {
    try {
      const result = await messagesService.revealIdentity(messageId)
      // Mettre à jour le message dans la liste
      setMessages(messages.map(m =>
        m.id === messageId
          ? { ...m, is_identity_revealed: true, sender: result.sender }
          : m
      ))
      fetchStats()
    } catch (error) {
      // L'erreur sera gérée par le composant RevealIdentityButton
      throw error
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Aujourd\'hui'
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    return date.toLocaleDateString('fr-FR')
  }

  if (loading && messages.length === 0) {
    return (
      <div className="messages-page">
        <div className="messages-header">
          <div className="header-content">
            <div className="header-icon">
              <Mail size={28} />
            </div>
            <div>
              <h1>Mes Messages</h1>
              <p>Chargement de vos messages...</p>
            </div>
          </div>
        </div>
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="messages-page">
        <div className="messages-header">
          <div className="header-content">
            <div className="header-icon error">
              <AlertCircle size={28} />
            </div>
            <div>
              <h1>Mes Messages</h1>
              <p className="error-text">{error}</p>
            </div>
          </div>
        </div>
        <button onClick={fetchMessages} className="btn-retry">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="messages-page">
      {/* Header */}
      <div className="messages-header">
        <div className="header-content">
          <div className="header-icon">
            <Mail size={28} />
          </div>
          <div>
            <h1>Mes Messages</h1>
            <p>{stats.received_count || 0} message{stats.received_count > 1 ? 's' : ''} reçu{stats.received_count > 1 ? 's' : ''}</p>
          </div>
        </div>
        {stats.unread_count > 0 && (
          <div className="unread-badge-header">
            {stats.unread_count} non lu{stats.unread_count > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Mail size={64} strokeWidth={1.5} />
          </div>
          <h3>Aucun message</h3>
          <p>Vous n'avez pas encore reçu de messages anonymes</p>
        </div>
      ) : (
        <>
          <div className="messages-list">
            {messages.map(message => (
              <div
                key={message.id}
                className={`message-card ${message.is_read === false ? 'unread' : ''}`}
              >
                {/* Message Header */}
                <div className="message-header">
                  <div className="message-sender">
                    {(canViewAllIdentities || message.is_identity_revealed) && message.sender ? (
                      <>
                        <div className="sender-avatar revealed">
                          {message.sender.first_name ? message.sender.first_name[0] : 'U'}
                        </div>
                        <div className="sender-info">
                          <span className="sender-name">
                            {message.sender.first_name} {message.sender.last_name}
                            {message.sender.is_premium && <PremiumBadge size="small" />}
                          </span>
                          <span className="sender-username">@{message.sender.username}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="sender-avatar">
                          {message.sender_initial || '?'}
                        </div>
                        <div className="sender-info">
                          <span className="sender-name">Anonyme</span>
                          <span className="sender-username">Identité masquée</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="message-meta">
                    <span className="message-date">{formatDate(message.created_at)}</span>
                    {message.is_read === false && (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="message-content">
                  {message.content}
                </div>

                {/* Message Actions */}
                <div className="message-actions">
                  <button
                    className="btn-action btn-reply"
                    onClick={() => handleReplyClick(message)}
                  >
                    <Send size={16} />
                    <span>Répondre</span>
                  </button>

                  {!canViewAllIdentities && !message.is_identity_revealed && (
                    <RevealIdentityButton
                      message={message}
                      onReveal={() => handleRevealIdentity(message.id)}
                    />
                  )}

                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteMessage(message.id)}
                    disabled={deletingId === message.id}
                  >
                    {deletingId === message.id ? (
                      <Loader2 className="spinner" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="pagination">
              <button
                className="btn-page"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
                Précédent
              </button>
              <span className="page-info">
                Page {currentPage} sur {lastPage}
              </span>
              <button
                className="btn-page"
                onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                disabled={currentPage === lastPage}
              >
                Suivant
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}
