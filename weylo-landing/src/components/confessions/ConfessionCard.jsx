import { useState } from 'react'
import CommentSection from './CommentSection'
import PremiumBadge from '../shared/PremiumBadge'
import { useDialog } from '../../contexts/DialogContext'
import './ConfessionCard.css'

export default function ConfessionCard({ confession, onLike, onCommentAdded, onCommentDeleted, currentUser }) {
  const { success, error: showError } = useDialog()
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/confessions/${confession.id}`
    const shareText = `Découvre cette confession sur Weylo: "${confession.content.substring(0, 100)}${confession.content.length > 100 ? '...' : ''}"`

    // Utiliser l'API Web Share si disponible (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Confession Weylo',
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        // L'utilisateur a annulé le partage
        if (err.name !== 'AbortError') {
          console.error('Erreur lors du partage:', err)
          showError('Impossible de partager cette confession')
        }
      }
    } else {
      // Fallback: copier le lien dans le presse-papier
      try {
        // Vérifier si clipboard API est disponible
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl)
          success('Lien copié dans le presse-papier !')
        } else {
          // Fallback pour les navigateurs qui ne supportent pas clipboard API
          const textArea = document.createElement('textarea')
          textArea.value = shareUrl
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand('copy')
            success('Lien copié dans le presse-papier !')
          } catch (err) {
            showError('Impossible de copier le lien. Veuillez utiliser HTTPS.')
          }
          document.body.removeChild(textArea)
        }
      } catch (err) {
        console.error('Erreur lors de la copie:', err)
        showError('Impossible de copier le lien. Veuillez utiliser HTTPS.')
      }
    }
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

        <button
          className="btn-share-icon"
          onClick={handleShare}
          title="Partager cette confession"
          aria-label="Partager"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
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
