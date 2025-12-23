import { Reply } from 'lucide-react'
import './QuotedMessage.css'

/**
 * Composant pour afficher un message cité (comme WhatsApp)
 * @param {Object} quotedMessage - Le message anonyme auquel on répond
 * @param {boolean} isMine - Si le message actuel est le nôtre
 */
export default function QuotedMessage({ quotedMessage, isMine }) {
  if (!quotedMessage) return null

  // Formater la date du message cité
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Tronquer le contenu si trop long
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className={`quoted-message ${isMine ? 'mine' : 'theirs'}`}>
      <div className="quoted-message-indicator">
        <Reply size={14} strokeWidth={2.5} />
      </div>
      <div className="quoted-message-content">
        <div className="quoted-message-header">
          <span className="quoted-sender">Message anonyme original</span>
          <span className="quoted-date">{formatDate(quotedMessage.created_at)}</span>
        </div>
        <div className="quoted-message-text">
          {truncateContent(quotedMessage.content)}
        </div>
      </div>
    </div>
  )
}
