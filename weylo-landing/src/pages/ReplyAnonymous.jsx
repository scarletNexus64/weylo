import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Gift, Image, Loader2, ArrowLeft, Lock, MessageCircle } from 'lucide-react'
import messagesService from '../services/messagesService'
import giftService from '../services/giftService'
import chatService from '../services/chatService'
import { useDialog } from '../contexts/DialogContext'
import '../styles/ReplyAnonymous.css'

export default function ReplyAnonymous() {
  const { messageId } = useParams()
  const navigate = useNavigate()
  const { success, error: showError, warning } = useDialog()

  const [originalMessage, setOriginalMessage] = useState(null)
  const [replyType, setReplyType] = useState('text') // 'text' ou 'gift'
  const [replyContent, setReplyContent] = useState('')
  const [selectedGift, setSelectedGift] = useState(null)
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Éviter les appels multiples si le message est déjà chargé
    if (originalMessage?.id === parseInt(messageId)) {
      return
    }

    console.log('🔄 [REPLY] useEffect - Chargement initial')
    console.log('🔄 [REPLY] messageId:', messageId)
    loadMessage()
    loadGifts()
  }, [messageId])

  const loadMessage = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 [REPLY] Chargement du message ID:', messageId)

      const data = await messagesService.getMessage(messageId)
      console.log('📨 [REPLY] Données du message reçues:', data)
      console.log('📨 [REPLY] Message:', data.message)
      console.log('📨 [REPLY] Sender:', data.message?.sender)
      console.log('📨 [REPLY] Sender username:', data.message?.sender?.username)

      // Petite pause pour éviter le flash de contenu
      await new Promise(resolve => setTimeout(resolve, 100))

      setOriginalMessage(data.message)
    } catch (err) {
      console.error('❌ [REPLY] Error loading message:', err)
      console.error('❌ [REPLY] Error response:', err.response)
      console.error('❌ [REPLY] Error data:', err.response?.data)
      setError('Impossible de charger le message')
    } finally {
      setLoading(false)
    }
  }

  const loadGifts = async () => {
    try {
      const data = await giftService.getCatalog()
      setGifts(data.gifts || [])
    } catch (err) {
      // Error silencieuse
    }
  }

  const handleSendReply = async () => {
    console.log('🚀 [REPLY] handleSendReply appelé')
    console.log('📋 [REPLY] originalMessage:', originalMessage)

    if (!originalMessage) {
      console.error('❌ [REPLY] Impossible de répondre - message manquant')
      showError('Impossible de répondre à ce message')
      return
    }

    try {
      setSending(true)

      if (replyType === 'text') {
        if (!replyContent.trim()) {
          warning('Veuillez saisir un message')
          return
        }

        console.log('💬 [REPLY] Démarrage d\'une conversation à partir du message ID:', originalMessage.id)

        // Démarrer une conversation à partir du message anonyme
        const conversationResponse = await messagesService.startConversationFromMessage(
          originalMessage.id
        )

        console.log('✅ [REPLY] Conversation créée/obtenue:', conversationResponse)

        const conversation = conversationResponse.conversation

        // Envoyer le message dans la conversation avec référence au message anonyme
        await chatService.sendMessage(conversation.id, replyContent, 'text', originalMessage.id)

        console.log('✅ [REPLY] Message envoyé dans la conversation avec référence au message anonyme')

        // alert('✅ Conversation initiée avec succès!')

        // Rediriger vers la conversation spécifique
        navigate(`/chat/${conversation.id}`)
      } else if (replyType === 'gift') {
        if (!selectedGift) {
          warning('Veuillez sélectionner un cadeau')
          return
        }

        console.log('🎁 [REPLY] Envoi d\'un cadeau en réponse au message ID:', originalMessage.id)

        // Démarrer une conversation à partir du message anonyme
        const conversationResponse = await messagesService.startConversationFromMessage(
          originalMessage.id
        )

        console.log('✅ [REPLY] Conversation créée/obtenue pour le cadeau:', conversationResponse)

        const conversation = conversationResponse.conversation

        // Envoyer le cadeau dans la conversation (toujours anonyme en réponse)
        await giftService.sendInConversation(
          conversation.id,
          selectedGift.id,
          replyContent || null,
          true // Toujours anonyme en réponse à un message anonyme
        )

        console.log('✅ [REPLY] Cadeau envoyé avec succès dans la conversation')

        success('Cadeau envoyé avec succès!')

        // Rediriger vers la conversation
        navigate(`/chat/${conversation.id}`)
      }
    } catch (err) {
      console.error('Error sending reply:', err)
      showError(err.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="reply-page">
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !originalMessage) {
    console.log('⚠️ [REPLY] Affichage de l\'erreur ou message manquant')
    console.log('⚠️ [REPLY] error:', error)
    console.log('⚠️ [REPLY] originalMessage:', originalMessage)

    return (
      <div className="reply-page">
        <div className="error-state">
          <p>{error || 'Message introuvable'}</p>
          <button onClick={() => navigate('/messages')} className="btn-back">
            Retour aux messages
          </button>
        </div>
      </div>
    )
  }

  console.log('✅ [REPLY] Rendu du formulaire de réponse')
  console.log('✅ [REPLY] originalMessage final:', originalMessage)

  return (
    <div className="reply-page">
      {/* Header */}
      <div className="reply-header">
        <button className="btn-back-header" onClick={() => navigate('/messages')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Répondre au message</h1>
          <p className="header-subtitle">Discutez ou envoyez un cadeau 💬🎁</p>
        </div>
      </div>

      {/* Original Message */}
      <div className="original-message-section">
        <div className="section-header">
          <Lock size={18} />
          <h3>Message original</h3>
        </div>
        <div className="original-message-card">
          <div className="message-sender-info">
            {originalMessage.sender ? (
              <>
                <div className="sender-avatar">
                  {originalMessage.sender.first_name?.[0] || 'U'}
                </div>
                <div>
                  <div className="sender-name">
                    {originalMessage.sender.first_name} {originalMessage.sender.last_name}
                  </div>
                  <div className="sender-username">@{originalMessage.sender.username}</div>
                </div>
              </>
            ) : (
              <>
                <div className="sender-avatar">
                  {originalMessage.sender_initial || '?'}
                </div>
                <div>
                  <div className="sender-name">Anonyme</div>
                  <div className="sender-username">Identité masquée</div>
                </div>
              </>
            )}
          </div>
          <div className="message-content">{originalMessage.content}</div>
          <div className="message-date">
            {new Date(originalMessage.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Reply Type Selector */}
      <div className="reply-type-section">
        <div className="type-tabs">
          <button
            className={`type-tab ${replyType === 'text' ? 'active' : ''}`}
            onClick={() => setReplyType('text')}
          >
            <Send size={18} />
            <span>Message texte</span>
          </button>
          <button
            className={`type-tab ${replyType === 'gift' ? 'active' : ''}`}
            onClick={() => setReplyType('gift')}
          >
            <Gift size={18} />
            <span>Cadeau</span>
          </button>
        </div>
      </div>

      {/* Reply Content */}
      {replyType === 'text' ? (
        <div className="reply-content-section">
          <div className="section-header">
            <MessageCircle size={18} />
            <h3>Votre message</h3>
          </div>
          <textarea
            placeholder="Écrivez votre message..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows="6"
            className="reply-textarea"
          />
          <div className="char-count">
            {replyContent.length} / 5000 caractères
          </div>
        </div>
      ) : (
        <div className="gifts-section">
          <div className="section-header">
            <Gift size={18} />
            <h3>Choisir un cadeau</h3>
          </div>

          <div className="gifts-grid">
            {gifts.map(gift => (
              <div
                key={gift.id}
                className={`gift-card ${selectedGift?.id === gift.id ? 'selected' : ''}`}
                onClick={() => setSelectedGift(gift)}
              >
                <div className="gift-icon">{gift.icon || '🎁'}</div>
                <div className="gift-name">{gift.name}</div>
                <div className="gift-price">{gift.price} FCFA</div>
                {selectedGift?.id === gift.id && (
                  <div className="gift-selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>
          {selectedGift && (
            <div className="gift-message-section">
              <label>Message avec le cadeau (optionnel)</label>
              <textarea
                placeholder="Ajoutez un message avec votre cadeau..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows="3"
                className="gift-message-textarea"
              />
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="info-card">
        <div className="info-icon">{replyType === 'text' ? '💬' : '🎁'}</div>
        <div className="info-content">
          {replyType === 'text' ? (
            <>
              <h4>Démarrer une conversation</h4>
              <p>
                Votre réponse créera une nouvelle conversation privée avec cette personne.
                Vous pourrez échanger librement et votre identité sera révélée.
              </p>
            </>
          ) : (
            <>
              <h4>Envoyer un cadeau anonyme</h4>
              <p>
                Le cadeau sera envoyé de manière anonyme et démarrera une conversation.
                Le destinataire pourra révéler votre identité en payant 450 FCFA.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="send-section">
        <button
          className="btn-send-reply"
          onClick={handleSendReply}
          disabled={
            sending ||
            (replyType === 'text' && !replyContent.trim()) ||
            (replyType === 'gift' && !selectedGift)
          }
        >
          {sending ? (
            <>
              <Loader2 className="spinner" size={20} />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              {replyType === 'text' ? <MessageCircle size={20} /> : <Send size={20} />}
              <span>
                {replyType === 'text' ? 'Démarrer la conversation' : 'Envoyer le cadeau anonymement'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
