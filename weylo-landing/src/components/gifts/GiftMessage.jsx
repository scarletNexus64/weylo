import { Gift as GiftIcon } from 'lucide-react'
import './GiftMessage.css'

export default function GiftMessage({ gift, isMine, senderName, time }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  // Vérifier que le cadeau existe (protection contre les données null)
  if (!gift || !gift.name) {
    console.warn('⚠️ Cadeau invalide ou supprimé')
    return null
  }

  // Fallback si le nom de l'expéditeur est null/undefined
  const displaySenderName = senderName || 'Anonyme'

  return (
    <div className={`gift-message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
      <div
        className="gift-message-bubble"
        style={{
          background: `linear-gradient(135deg, ${gift.background_color || '#9333ea'}dd 0%, ${gift.background_color || '#9333ea'} 100%)`,
        }}
      >
        {/* Icon en haut */}
        <div className="gift-message-icon-container">
          <GiftIcon className="gift-message-icon-bg" size={32} />
          <span className="gift-message-emoji">{gift.icon || '🎁'}</span>
        </div>

        {/* Contenu */}
        <div className="gift-message-content">
          <p className="gift-message-label">
            {isMine ? 'Vous avez envoyé' : `${displaySenderName} vous offre`}
          </p>
          <h3 className="gift-message-name">{gift.name}</h3>
          {gift.description && (
            <p className="gift-message-description">{gift.description}</p>
          )}
          <div className="gift-message-price">
            <span className="gift-price-amount">{formatPrice(gift.price || 0)} FCFA</span>
          </div>
        </div>

        {/* Badge corner */}
        <div className="gift-message-corner">
          <GiftIcon size={16} />
        </div>

        {/* Time */}
        <span className="gift-message-time">{time}</span>
      </div>
    </div>
  )
}
