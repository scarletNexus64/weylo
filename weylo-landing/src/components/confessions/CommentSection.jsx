import { useState, useEffect } from 'react'
import confessionsService from '../../services/confessionsService'
import { useDialog } from '../../contexts/DialogContext'
import './CommentSection.css'

export default function CommentSection({ confessionId, currentUser, onCommentAdded, onCommentDeleted }) {
  const { warning, error, confirm } = useDialog()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [confessionId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await confessionsService.getComments(confessionId)
      console.log('📝 Commentaires chargés:', data.comments)
      setComments(data.comments || [])
    } catch (err) {
      console.error('❌ Erreur lors du chargement des commentaires:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) {
      warning('Écris un commentaire')
      return
    }

    if (!currentUser) {
      warning('Tu dois être connecté pour commenter')
      return
    }

    try {
      setSubmitting(true)
      const data = await confessionsService.addComment(confessionId, newComment, isAnonymous)
      setComments([...comments, data.comment])
      setNewComment('')
      onCommentAdded(confessionId)
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du commentaire:', err)
      error('Impossible d\'ajouter le commentaire')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirm('Supprimer ce commentaire ?')
    if (!confirmed) return

    try {
      await confessionsService.deleteComment(confessionId, commentId)
      setComments(comments.filter(c => c.id !== commentId))
      if (onCommentDeleted) {
        onCommentDeleted(confessionId)
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err)
      error('Impossible de supprimer le commentaire')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'À l\'instant'
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="comment-section">
        <div className="comments-loading">Chargement des commentaires...</div>
      </div>
    )
  }

  return (
    <div className="comment-section">
      <div className="comments-header">
        <h4>Commentaires ({comments.length})</h4>
      </div>

      {comments.length === 0 ? (
        <div className="comments-empty">
          <p>Aucun commentaire pour le moment</p>
          <p className="subtitle">Sois le premier à commenter</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.author.initial}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.author.name}</span>
                  <span className="comment-time">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
                {comment.is_mine && (
                  <button
                    className="btn-delete-comment"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <div className="comment-input-container">
            <textarea
              placeholder="Ajoute un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="comment-form-footer">
            <label className="anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Commenter en anonyme</span>
            </label>

            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="btn-submit-comment"
            >
              {submitting ? 'Envoi...' : 'Commenter'}
            </button>
          </div>
        </form>
      )}

      {!currentUser && (
        <div className="comment-login-prompt">
          <p>Connecte-toi pour commenter</p>
        </div>
      )}
    </div>
  )
}
