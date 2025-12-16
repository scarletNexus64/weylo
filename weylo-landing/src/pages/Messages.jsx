import { useState, useEffect } from 'react'
import { Mail, Trash2, Send, Eye, Lock, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import messagesService from '../services/messagesService'
import '../styles/Messages.css'

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ received_count: 0, unread_count: 0, revealed_count: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [revealingId, setRevealingId] = useState(null)

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
    setSelectedMessage(message)
    setShowReplyModal(true)
  }

  const handleRevealInModal = async () => {
    if (!selectedMessage) return

    if (window.confirm('Voulez-vous révéler l\'identité de cet expéditeur pour 450 FCFA ?')) {
      try {
        setRevealingId(selectedMessage.id)
        const response = await messagesService.revealIdentity(selectedMessage.id)
        alert(response.message || 'Identité révélée avec succès !')
        // Recharger les messages pour obtenir les nouvelles données
        await fetchMessages()
        await fetchStats()
        // Mettre à jour le message sélectionné
        const updatedMessage = messages.find(m => m.id === selectedMessage.id)
        if (updatedMessage) {
          setSelectedMessage(updatedMessage)
        }
      } catch (err) {
        console.error('Error revealing identity:', err)
        const errorMsg = err.response?.data?.message || 'Erreur lors de la révélation'
        alert(errorMsg)
      } finally {
        setRevealingId(null)
      }
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return

    try {
      setSendingReply(true)

      if (selectedMessage.is_identity_revealed && selectedMessage.sender?.username) {
        await messagesService.sendMessage(selectedMessage.sender.username, replyContent)
        alert('Réponse envoyée avec succès !')
        setShowReplyModal(false)
        setReplyContent('')
        setSelectedMessage(null)
      } else {
        alert('Vous devez révéler l\'identité pour répondre directement.')
      }
    } catch (err) {
      console.error('Error sending reply:', err)
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi de la réponse')
    } finally {
      setSendingReply(false)
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
                    {message.is_identity_revealed && message.sender ? (
                      <>
                        <div className="sender-avatar revealed">
                          {message.sender.first_name ? message.sender.first_name[0] : 'U'}
                        </div>
                        <div className="sender-info">
                          <span className="sender-name">
                            {message.sender.first_name} {message.sender.last_name}
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

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Send size={20} />
                <h3>Répondre au message</h3>
              </div>
              <button className="btn-close" onClick={() => setShowReplyModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="original-message">
                <label>Message original</label>
                <div className="message-preview">
                  {selectedMessage.content}
                </div>
                <div className="sender-info-modal">
                  De : {selectedMessage.is_identity_revealed && selectedMessage.sender
                    ? `${selectedMessage.sender.first_name} ${selectedMessage.sender.last_name} (@${selectedMessage.sender.username})`
                    : 'Anonyme'}
                </div>
              </div>

              {!selectedMessage.is_identity_revealed ? (
                <div className="reveal-section">
                  <div className="reveal-info">
                    <Lock size={20} />
                    <div>
                      <h4>Identité masquée</h4>
                      <p>Pour répondre à ce message, vous devez d'abord révéler l'identité de l'expéditeur.</p>
                    </div>
                  </div>
                  <button
                    className="btn-reveal-modal"
                    onClick={handleRevealInModal}
                    disabled={revealingId === selectedMessage.id}
                  >
                    {revealingId === selectedMessage.id ? (
                      <>
                        <Loader2 className="spinner" size={18} />
                        <span>Révélation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Eye size={18} />
                        <span>Révéler l'identité (450 FCFA)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="form-group">
                  <label>Votre réponse</label>
                  <textarea
                    placeholder="Écrivez votre réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows="4"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedMessage.is_identity_revealed ? (
                <>
                  <button
                    className="btn-modal btn-cancel"
                    onClick={() => setShowReplyModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn-modal btn-submit"
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || sendingReply}
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="spinner" size={16} />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Envoyer
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  className="btn-modal btn-cancel"
                  onClick={() => setShowReplyModal(false)}
                  style={{ width: '100%' }}
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
