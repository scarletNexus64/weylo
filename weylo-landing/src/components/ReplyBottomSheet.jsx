import { useState, useEffect } from 'react'
import { X, Loader2, Gift, Send, MessageCircle, Wallet, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import messagesService from '../services/messagesService'
import giftService from '../services/giftService'
import chatService from '../services/chatService'
import walletService from '../services/walletService'
import { useDialog } from '../contexts/DialogContext'
import './ReplyBottomSheet.css'

export default function ReplyBottomSheet({ isOpen, onClose, message, onReplySent }) {
  const navigate = useNavigate()
  const { success, error: showError, warning } = useDialog()

  const [replyType, setReplyType] = useState('text') // 'text' ou 'gift'
  const [replyContent, setReplyContent] = useState('')
  const [selectedGift, setSelectedGift] = useState(null)
  const [gifts, setGifts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loadingWallet, setLoadingWallet] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadGiftsAndCategories()
      loadWalletBalance()
      // Empêcher le scroll du body quand le bottomsheet est ouvert
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = '0'
    } else {
      // Réinitialiser quand on ferme
      resetForm()
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [isOpen])

  const loadGiftsAndCategories = async () => {
    try {
      setLoading(true)
      const [catalogResponse, categoriesResponse] = await Promise.all([
        giftService.getCatalog(),
        giftService.getCategories()
      ])
      setGifts(catalogResponse.gifts || [])
      setCategories(categoriesResponse.categories || [])
    } catch (err) {
      console.error('Error loading gifts:', err)
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
    if (!category) {
      setSelectedCategory(null)
      const response = await giftService.getCatalog()
      setGifts(response.gifts || [])
      return
    }

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
        console.error('Error loading category gifts:', error)
      }
    }
  }

  const resetForm = () => {
    setReplyType('text')
    setReplyContent('')
    setSelectedGift(null)
    setSelectedCategory(null)
  }

  const handleSendReply = async () => {
    if (!message) {
      showError('Message non disponible')
      return
    }

    try {
      setSending(true)

      if (replyType === 'text') {
        if (!replyContent.trim()) {
          warning('Veuillez saisir un message')
          return
        }

        // Démarrer une conversation à partir du message anonyme
        const conversationResponse = await messagesService.startConversationFromMessage(message.id)
        const conversation = conversationResponse.conversation

        // Envoyer le message dans la conversation
        await chatService.sendMessage(conversation.id, replyContent, 'text', message.id)

        success('Conversation démarrée avec succès!')
        onReplySent?.()
        onClose()

        // Rediriger vers la conversation
        navigate(`/chat/${conversation.id}`)

      } else if (replyType === 'gift') {
        if (!selectedGift) {
          warning('Veuillez sélectionner un cadeau')
          return
        }

        // Vérifier le solde
        if (walletBalance < selectedGift.price) {
          showError(
            `Prix du cadeau : ${selectedGift.formatted_price}\n` +
            `Votre solde : ${walletService.formatAmount(walletBalance)}\n\n` +
            `Veuillez recharger votre wallet.`,
            'Solde insuffisant !'
          )
          return
        }

        // Démarrer une conversation à partir du message anonyme
        const conversationResponse = await messagesService.startConversationFromMessage(message.id)
        const conversation = conversationResponse.conversation

        // Envoyer le cadeau dans la conversation (toujours anonyme en réponse)
        await giftService.sendInConversation(
          conversation.id,
          selectedGift.id,
          replyContent || null,
          true // Toujours anonyme en réponse à un message anonyme
        )

        // Recharger le solde du wallet
        await loadWalletBalance()

        success('Cadeau envoyé avec succès!')
        onReplySent?.()
        onClose()

        // Rediriger vers la conversation
        navigate(`/chat/${conversation.id}`)
      }
    } catch (err) {
      console.error('Error sending reply:', err)

      // Gérer les erreurs de solde insuffisant
      if (err.response?.status === 422 && err.response?.data?.message?.includes('Solde insuffisant')) {
        const requiredAmount = err.response?.data?.required_amount
        const currentBalance = err.response?.data?.current_balance

        showError(
          `Montant requis : ${walletService.formatAmount(requiredAmount || selectedGift?.price)}\n` +
          `Votre solde : ${walletService.formatAmount(currentBalance || walletBalance)}\n\n` +
          `Veuillez recharger votre wallet.`,
          'Solde insuffisant !'
        )

        await loadWalletBalance()
      } else {
        showError(err.response?.data?.message || 'Erreur lors de l\'envoi')
      }
    } finally {
      setSending(false)
    }
  }

  const handleBackToSelection = () => {
    setSelectedGift(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="reply-bottomsheet-overlay" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="reply-bottomsheet">
        {/* Handle */}
        <div className="reply-bottomsheet-handle" onClick={selectedGift ? handleBackToSelection : onClose}>
          <div className="handle-bar"></div>
        </div>

        {/* Header */}
        <div className="reply-bottomsheet-header">
          <div>
            <h2>
              {selectedGift
                ? 'Confirmer l\'envoi'
                : replyType === 'text'
                  ? 'Répondre au message'
                  : 'Choisir un cadeau'
              }
            </h2>
          </div>
          <button className="btn-close" onClick={selectedGift ? handleBackToSelection : onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Reply Type Selector - Seulement si pas de cadeau sélectionné */}
        {!selectedGift && (
          <div className="reply-type-tabs">
            <button
              className={`type-tab ${replyType === 'text' ? 'active' : ''}`}
              onClick={() => setReplyType('text')}
            >
              <MessageCircle size={18} />
              <span>Texte</span>
            </button>
            <button
              className={`type-tab ${replyType === 'gift' ? 'active' : ''}`}
              onClick={() => setReplyType('gift')}
            >
              <Gift size={18} />
              <span>Cadeau</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="reply-bottomsheet-body">
          {selectedGift ? (
            /* Confirmation d'envoi de cadeau */
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
                <label htmlFor="gift-message">Message avec le cadeau (optionnel)</label>
                <textarea
                  id="gift-message"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Ajoutez un message avec votre cadeau..."
                  maxLength={200}
                  rows={3}
                />
                <span className="character-count">{replyContent.length}/200</span>
              </div>

              <div className="info-card-small">
                <div className="info-icon-small">🎁</div>
                <p>Le cadeau sera envoyé de manière anonyme et démarrera une conversation.</p>
              </div>

              <button
                className="btn-send-reply"
                onClick={handleSendReply}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Envoyer le cadeau anonymement</span>
                  </>
                )}
              </button>
            </div>
          ) : replyType === 'text' ? (
            /* Réponse par texte */
            <div className="text-reply-section">
              <div className="reply-textarea-wrapper">
                <label htmlFor="reply-text">Votre message</label>
                <textarea
                  id="reply-text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  rows={6}
                  maxLength={5000}
                />
                <span className="character-count">{replyContent.length}/5000</span>
              </div>

              <div className="info-card-small">
                <div className="info-icon-small">💬</div>
                <p>Votre réponse créera une nouvelle conversation privée. Votre identité sera révélée.</p>
              </div>

              <button
                className="btn-send-reply"
                onClick={handleSendReply}
                disabled={sending || !replyContent.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} />
                    <span>Démarrer la conversation</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Sélection de cadeau */
            loading ? (
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
              <>
                {/* Categories Tabs - À l'intérieur du body scrollable */}
                {replyType === 'gift' && categories.length > 0 && (
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

                <div className="gifts-grid-bottomsheet">
                {gifts.map(gift => (
                  <button
                    key={gift.id}
                    className="gift-item"
                    onClick={() => setSelectedGift(gift)}
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
                    <div className={`gift-tier-badge tier-${gift.tier}`}>
                      {gift.tier}
                    </div>
                  </button>
                ))}
              </div>
              </>
            )
          )}
        </div>
      </div>
    </>
  )
}
