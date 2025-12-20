import { useState } from 'react'
import CommentSection from './CommentSection'
import PremiumBadge from '../shared/PremiumBadge'
import './ConfessionCard.css'

export default function ConfessionCard({ confession, onLike, onCommentAdded, onCommentDeleted, currentUser }) {
  const [showComments, setShowComments] = useState(false)

  // Si l'utilisateur est premium, il peut voir l'identité de l'auteur
  const canViewIdentity = currentUser?.is_premium || confession.is_identity_revealed || false
  const authorName = canViewIdentity && confession.author
    ? `${confession.author.first_name || ''} ${confession.author.last_name || ''}`.trim() || confession.author.username || 'Anonyme'
    : 'Anonyme'

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'À l\'instant'
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} jour${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''}`

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="confession-card">
      <div className="confession-header">
        <div className="confession-author">
          <div className="author-avatar">
            {confession.author?.initial || '?'}
          </div>
          <div className="author-info">
            <span className="author-name">
              {authorName}
              {canViewIdentity && confession.author?.is_premium && <PremiumBadge size="small" />}
            </span>
            <span className="confession-time">{formatDate(confession.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="confession-content">
        {confession.content}
      </div>

      <div className="confession-actions">
        <button
          className={`btn-like ${confession.is_liked ? 'liked' : ''}`}
          onClick={() => onLike(confession.id)}
        >
          {confession.is_liked ? '❤️' : '🤍'} {confession.likes_count || 0}
        </button>

        <button
          className={`btn-comment ${showComments ? 'active' : ''}`}
          onClick={() => setShowComments(!showComments)}
        >
          💬 Commentaires {confession.comments_count > 0 && `(${confession.comments_count})`}
        </button>
      </div>

      {showComments && (
        <CommentSection
          confessionId={confession.id}
          currentUser={currentUser}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
        />
      )}
    </div>
  )
}
