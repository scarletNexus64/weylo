import { Gift as GiftIcon } from 'lucide-react'
import './GiftMessage.css'

export default function GiftMessage({ gift, isMine, senderName, time }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  return (
    <div className={`gift-message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
      <div
        className="gift-message-bubble"
        style={{
          background: `linear-gradient(135deg, ${gift.background_color}dd 0%, ${gift.background_color} 100%)`,
        }}
      >
        {/* Icon en haut */}
        <div className="gift-message-icon-container">
          <GiftIcon className="gift-message-icon-bg" size={32} />
          <span className="gift-message-emoji">{gift.icon}</span>
        </div>

        {/* Contenu */}
        <div className="gift-message-content">
          <p className="gift-message-label">
            {isMine ? 'Vous avez envoyé' : `${senderName} vous offre`}
          </p>
          <h3 className="gift-message-name">{gift.name}</h3>
          {gift.description && (
            <p className="gift-message-description">{gift.description}</p>
          )}
          <div className="gift-message-price">
            <span className="gift-price-amount">{formatPrice(gift.price)} FCFA</span>
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
