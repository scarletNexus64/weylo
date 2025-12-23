import { useState, useEffect } from 'react'
import { X, Loader2, Gift, Wallet, AlertCircle } from 'lucide-react'
import giftService from '../../services/giftService'
import walletService from '../../services/walletService'
import { useDialog } from '../../contexts/DialogContext'
import './GiftBottomSheet.css'

export default function GiftBottomSheet({ isOpen, onClose, recipientName, conversationId, onGiftSent }) {
  const { error } = useDialog()
  const [categories, setCategories] = useState([])
  const [gifts, setGifts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedGift, setSelectedGift] = useState(null)
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loadingWallet, setLoadingWallet] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      loadWalletBalance()
      // Empêcher le scroll du body quand le bottomsheet est ouvert
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await giftService.getCategories()
      setCategories(response.categories || [])

      // Charger tous les cadeaux par défaut
      const catalogResponse = await giftService.getCatalog()
      setGifts(catalogResponse.gifts || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWalletBalance = async () => {
    try {
      setLoadingWallet(true)
      const walletInfo = await walletService.getWalletInfo()
      setWalletBalance(walletInfo.wallet?.balance || 0)
    } catch (error) {
      console.error('Erreur chargement wallet:', error)
      setWalletBalance(0)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleCategoryClick = async (category) => {
    // Si category est null (bouton "Tous")
    if (!category) {
      setSelectedCategory(null)
      const response = await giftService.getCatalog()
      setGifts(response.gifts || [])
      return
    }

    // Si on clique sur la catégorie déjà sélectionnée
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null)
      const response = await giftService.getCatalog()
      setGifts(response.gifts || [])
    } else {
      setSelectedCategory(category)
      try {
        const response = await giftService.getGiftsByCategory(category.id)
        setGifts(response.gifts || [])
      } catch (error) {
        console.error('Erreur chargement cadeaux:', error)
      }
    }
  }

  const handleGiftSelect = (gift) => {
    setSelectedGift(gift)
  }

  const handleSendGift = async () => {
    if (!selectedGift) return

    // Vérifier le solde avant d'envoyer
    if (walletBalance < selectedGift.price) {
      error(
        `Prix du cadeau : ${selectedGift.formatted_price}\n` +
        `Votre solde : ${walletService.formatAmount(walletBalance)}\n\n` +
        `Veuillez recharger votre wallet.`,
        'Solde insuffisant !'
      )
      return
    }

    try {
      setSending(true)
      const response = await giftService.sendInConversation(
        conversationId,
        selectedGift.id,
        message.trim() || null,
        isAnonymous
      )

      // Recharger le solde du wallet
      await loadWalletBalance()

      // Afficher l'animation et fermer le bottomsheet
      onGiftSent(selectedGift, response)
      onClose()

      // Réinitialiser
      setSelectedGift(null)
      setMessage('')
      setIsAnonymous(false)
    } catch (error) {
      console.error('Erreur envoi cadeau:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi du cadeau. Veuillez réessayer.'

      // Si erreur de solde insuffisant du backend
      if (error.response?.status === 422 && errorMessage.includes('Solde insuffisant')) {
        const requiredAmount = error.response?.data?.required_amount
        const currentBalance = error.response?.data?.current_balance

        error(
          `Montant requis : ${walletService.formatAmount(requiredAmount || selectedGift.price)}\n` +
          `Votre solde : ${walletService.formatAmount(currentBalance || walletBalance)}\n\n` +
          `Veuillez recharger votre wallet.`,
          'Solde insuffisant !'
        )

        // Recharger le solde wallet au cas où il a changé
        await loadWalletBalance()
      } else {
        error(errorMessage)
      }
    } finally {
      setSending(false)
    }
  }

  const handleBackToGifts = () => {
    setSelectedGift(null)
    setMessage('')
    setIsAnonymous(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="gift-bottomsheet-overlay" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="gift-bottomsheet">
        {/* Handle */}
        <div className="gift-bottomsheet-handle" onClick={selectedGift ? handleBackToGifts : onClose}>
          <div className="handle-bar"></div>
        </div>

        {/* Header */}
        <div className="gift-bottomsheet-header">
          <div>
            <h2>{selectedGift ? 'Confirmer l\'envoi' : 'Envoyer un cadeau'}</h2>
            <p className="recipient-name">à {recipientName}</p>
          </div>
          <button className="btn-close" onClick={selectedGift ? handleBackToGifts : onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Categories Tabs */}
        {!loading && !selectedGift && categories.length > 0 && (
          <div className="gift-categories-scroll">
            <button
              className={`gift-category-tab ${!selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick(null)}
            >
              Tous
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`gift-category-tab ${selectedCategory?.id === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Gifts Grid OR Confirmation */}
        <div className="gift-bottomsheet-body">
          {selectedGift ? (
            /* Confirmation Screen */
            <div className="gift-confirmation">
              <div
                className="gift-confirmation-preview"
                style={{
                  background: `linear-gradient(135deg, ${selectedGift.background_color}dd 0%, ${selectedGift.background_color} 100%)`,
                }}
              >
                <div className="gift-preview-icon">{selectedGift.icon}</div>
                <h3>{selectedGift.name}</h3>
                <p className="gift-preview-price">{selectedGift.formatted_price}</p>
              </div>

              {/* Wallet Balance Info */}
              <div className={`gift-wallet-info ${walletBalance < selectedGift.price ? 'insufficient' : 'sufficient'}`}>
                <div className="wallet-info-header">
                  <Wallet size={18} />
                  <span>Solde du wallet</span>
                </div>
                <div className="wallet-balance">
                  {loadingWallet ? (
                    <Loader2 size={16} className="spinner" />
                  ) : (
                    <span className="balance-amount">{walletService.formatAmount(walletBalance)}</span>
                  )}
                </div>
                {!loadingWallet && walletBalance < selectedGift.price && (
                  <div className="wallet-warning">
                    <AlertCircle size={16} />
                    <span>Solde insuffisant. Veuillez recharger votre wallet.</span>
                  </div>
                )}
              </div>

              <div className="gift-message-section">
                <label htmlFor="gift-message">Message (optionnel)</label>
                <textarea
                  id="gift-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ajoutez un message avec votre cadeau..."
                  maxLength={200}
                  rows={3}
                />
                <span className="character-count">{message.length}/200</span>
              </div>

              <div className="gift-anonymous-toggle">
                <label htmlFor="gift-anonymous" className="toggle-label">
                  <input
                    type="checkbox"
                    id="gift-anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Envoyer anonymement</span>
                </label>
                <p className="toggle-description">Le destinataire ne verra pas votre nom</p>
              </div>

              <button
                className="btn-send-gift"
                onClick={handleSendGift}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Gift size={20} />
                    <span>Envoyer le cadeau</span>
                  </>
                )}
              </button>
            </div>
          ) : loading ? (
            <div className="gift-loading-state">
              <Loader2 className="spinner" size={40} />
              <p>Chargement des cadeaux...</p>
            </div>
          ) : gifts.length === 0 ? (
            <div className="gift-empty-state">
              <Gift size={56} strokeWidth={1.5} />
              <p>Aucun cadeau disponible</p>
            </div>
          ) : (
            <div className="gifts-grid-bottomsheet">
              {gifts.map(gift => (
                <button
                  key={gift.id}
                  className="gift-item"
                  onClick={() => handleGiftSelect(gift)}
                  disabled={sending}
                  style={{
                    background: `linear-gradient(135deg, ${gift.background_color}dd 0%, ${gift.background_color} 100%)`,
                  }}
                >
                  <div className="gift-item-icon">{gift.icon}</div>
                  <div className="gift-item-info">
                    <h3 className="gift-item-name">{gift.name}</h3>
                    <p className="gift-item-price">{gift.formatted_price}</p>
                  </div>
                  {/* Tier Badge */}
                  <div className={`gift-tier-badge tier-${gift.tier}`}>
                    {gift.tier}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
