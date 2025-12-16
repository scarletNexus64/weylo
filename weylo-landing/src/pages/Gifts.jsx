import { useState } from 'react'
import '../styles/Gifts.css'

export default function Gifts() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [selectedGift, setSelectedGift] = useState(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [recipient, setRecipient] = useState('')

  const giftsData = [
    // Bronze Tier
    { id: 1, name: 'Rose', emoji: '🌹', price: 100, tier: 'bronze', value_fcfa: 50 },
    { id: 2, name: 'Café', emoji: '☕', price: 150, tier: 'bronze', value_fcfa: 75 },
    { id: 3, name: 'Coeur', emoji: '❤️', price: 200, tier: 'bronze', value_fcfa: 100 },

    // Silver Tier
    { id: 4, name: 'Champagne', emoji: '🍾', price: 500, tier: 'silver', value_fcfa: 250 },
    { id: 5, name: 'Couronne', emoji: '👑', price: 750, tier: 'silver', value_fcfa: 375 },
    { id: 6, name: 'Trophée', emoji: '🏆', price: 1000, tier: 'silver', value_fcfa: 500 },

    // Gold Tier
    { id: 7, name: 'Étoile', emoji: '⭐', price: 2000, tier: 'gold', value_fcfa: 1000 },
    { id: 8, name: 'Fusée', emoji: '🚀', price: 3000, tier: 'gold', value_fcfa: 1500 },
    { id: 9, name: 'Feu d\'artifice', emoji: '🎆', price: 5000, tier: 'gold', value_fcfa: 2500 },

    // Diamond Tier
    { id: 10, name: 'Diamant', emoji: '💎', price: 10000, tier: 'diamond', value_fcfa: 5000 },
    { id: 11, name: 'Couronne Royale', emoji: '👸', price: 15000, tier: 'diamond', value_fcfa: 7500 },
    { id: 12, name: 'Licorne', emoji: '🦄', price: 25000, tier: 'diamond', value_fcfa: 12500 }
  ]

  const receivedGifts = [
    { id: 1, gift_name: 'Rose', gift_emoji: '🌹', sender_name: 'Aminata K.', value_fcfa: 50, received_at: 'Il y a 2h' },
    { id: 2, gift_name: 'Champagne', gift_emoji: '🍾', sender_name: 'Ibrahim M.', value_fcfa: 250, received_at: 'Il y a 5h' },
    { id: 3, gift_name: 'Diamant', gift_emoji: '💎', sender_name: 'Anonyme', value_fcfa: 5000, received_at: 'Hier' },
    { id: 4, gift_name: 'Étoile', gift_emoji: '⭐', sender_name: 'Fatou D.', value_fcfa: 1000, received_at: 'Il y a 2 jours' }
  ]

  const totalEarned = receivedGifts.reduce((sum, gift) => sum + gift.value_fcfa, 0)

  const handleSendGift = () => {
    if (!recipient.trim()) {
      alert('Veuillez entrer un nom d\'utilisateur')
      return
    }
    alert(`Cadeau "${selectedGift.name}" envoyé à @${recipient} pour ${selectedGift.price} FCFA`)
    setShowSendModal(false)
    setRecipient('')
    setSelectedGift(null)
  }

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      diamond: '#B9F2FF'
    }
    return colors[tier] || '#9333ea'
  }

  const getTierLabel = (tier) => {
    const labels = {
      bronze: 'Bronze',
      silver: 'Argent',
      gold: 'Or',
      diamond: 'Diamant'
    }
    return labels[tier] || tier
  }

  return (
    <div className="gifts-page">
      <div className="page-header">
        <h1>Cadeaux 🎁</h1>
        <p>Envoie des cadeaux virtuels à tes amis ou gagne de l'argent avec ceux que tu reçois</p>
      </div>

      {/* Tabs */}
      <div className="gifts-tabs">
        <button
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          🎁 Catalogue
        </button>
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📦 Reçus ({receivedGifts.length})
        </button>
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="catalog-container">
          {/* Bronze Tier */}
          <div className="tier-section">
            <div className="tier-header" style={{ borderColor: getTierColor('bronze') }}>
              <h3>🥉 Bronze</h3>
              <p>Petits gestes sympathiques</p>
            </div>
            <div className="gifts-grid">
              {giftsData.filter(g => g.tier === 'bronze').map(gift => (
                <div key={gift.id} className="gift-card" onClick={() => { setSelectedGift(gift); setShowSendModal(true); }}>
                  <div className="gift-emoji">{gift.emoji}</div>
                  <h4>{gift.name}</h4>
                  <div className="gift-price">{gift.price} FCFA</div>
                  <div className="gift-value">Valeur: {gift.value_fcfa} FCFA</div>
                </div>
              ))}
            </div>
          </div>

          {/* Silver Tier */}
          <div className="tier-section">
            <div className="tier-header" style={{ borderColor: getTierColor('silver') }}>
              <h3>🥈 Argent</h3>
              <p>Montre ton appréciation</p>
            </div>
            <div className="gifts-grid">
              {giftsData.filter(g => g.tier === 'silver').map(gift => (
                <div key={gift.id} className="gift-card" onClick={() => { setSelectedGift(gift); setShowSendModal(true); }}>
                  <div className="gift-emoji">{gift.emoji}</div>
                  <h4>{gift.name}</h4>
                  <div className="gift-price">{gift.price} FCFA</div>
                  <div className="gift-value">Valeur: {gift.value_fcfa} FCFA</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Tier */}
          <div className="tier-section">
            <div className="tier-header" style={{ borderColor: getTierColor('gold') }}>
              <h3>🥇 Or</h3>
              <p>Cadeaux prestigieux</p>
            </div>
            <div className="gifts-grid">
              {giftsData.filter(g => g.tier === 'gold').map(gift => (
                <div key={gift.id} className="gift-card" onClick={() => { setSelectedGift(gift); setShowSendModal(true); }}>
                  <div className="gift-emoji">{gift.emoji}</div>
                  <h4>{gift.name}</h4>
                  <div className="gift-price">{gift.price} FCFA</div>
                  <div className="gift-value">Valeur: {gift.value_fcfa} FCFA</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diamond Tier */}
          <div className="tier-section">
            <div className="tier-header" style={{ borderColor: getTierColor('diamond') }}>
              <h3>💎 Diamant</h3>
              <p>Cadeaux exceptionnels et luxueux</p>
            </div>
            <div className="gifts-grid">
              {giftsData.filter(g => g.tier === 'diamond').map(gift => (
                <div key={gift.id} className="gift-card special" onClick={() => { setSelectedGift(gift); setShowSendModal(true); }}>
                  <div className="gift-emoji">{gift.emoji}</div>
                  <h4>{gift.name}</h4>
                  <div className="gift-price">{gift.price} FCFA</div>
                  <div className="gift-value">Valeur: {gift.value_fcfa} FCFA</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="info-card">
            <h3>💡 Comment ça marche ?</h3>
            <ul>
              <li>Achète des cadeaux virtuels avec ton portefeuille Weylo</li>
              <li>Envoie-les à tes amis ou à des personnes que tu apprécies</li>
              <li>Le destinataire reçoit 50% de la valeur en argent réel</li>
              <li>Les cadeaux peuvent être retirés via Mobile Money</li>
            </ul>
          </div>
        </div>
      )}

      {/* Received Tab */}
      {activeTab === 'received' && (
        <div className="received-container">
          {/* Earnings Summary */}
          <div className="earnings-card">
            <div className="earnings-icon">💰</div>
            <div className="earnings-info">
              <h3>Total gagné</h3>
              <div className="earnings-amount">{totalEarned.toLocaleString()} FCFA</div>
              <p>Disponible dans ton portefeuille</p>
            </div>
          </div>

          {/* Received Gifts List */}
          <div className="received-list">
            <h3>Cadeaux reçus</h3>
            {receivedGifts.map(gift => (
              <div key={gift.id} className="received-item">
                <div className="received-gift-icon">{gift.gift_emoji}</div>
                <div className="received-info">
                  <h4>{gift.gift_name}</h4>
                  <p>De: {gift.sender_name}</p>
                  <span className="received-time">{gift.received_at}</span>
                </div>
                <div className="received-value">+{gift.value_fcfa} FCFA</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Gift Modal */}
      {showSendModal && selectedGift && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="gift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Envoyer un cadeau</h3>
              <button className="btn-close" onClick={() => setShowSendModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="selected-gift-preview">
                <div className="preview-emoji">{selectedGift.emoji}</div>
                <h4>{selectedGift.name}</h4>
                <div className="preview-tier">{getTierLabel(selectedGift.tier)}</div>
              </div>

              <div className="modal-pricing">
                <div className="pricing-row">
                  <span>Prix du cadeau:</span>
                  <span className="price-value">{selectedGift.price} FCFA</span>
                </div>
                <div className="pricing-row highlight">
                  <span>Le destinataire recevra:</span>
                  <span className="price-value">{selectedGift.value_fcfa} FCFA</span>
                </div>
              </div>

              <div className="form-group">
                <label>Nom d'utilisateur du destinataire</label>
                <input
                  type="text"
                  placeholder="@utilisateur"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSendModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleSendGift}>
                Envoyer pour {selectedGift.price} FCFA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
