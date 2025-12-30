import { useState, useEffect } from 'react'
import { Eye, Lock, Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import messagesService from '../services/messagesService'
import chatService from '../services/chatService'
import { useNavigate } from 'react-router-dom'
import { useDialog } from '../contexts/DialogContext'
import './RevealIdentityButton.css'

// Liste des pays disponibles avec leurs codes, drapeaux et formats de numéro
const COUNTRIES = [
  { code: '+229', name: 'Bénin', flag: '🇧🇯', iso: 'bj', length: [8, 9], example: '97123456' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫', iso: 'bf', length: [8], example: '70123456' },
  { code: '+237', name: 'Cameroun', flag: '🇨🇲', iso: 'cm', length: [9], example: '651234567' },
  { code: '+242', name: 'Congo', flag: '🇨🇬', iso: 'cg', length: [9], example: '061234567' },
  { code: '+225', name: "Côte d'Ivoire", flag: '🇨🇮', iso: 'ci', length: [10], example: '0701234567' },
  { code: '+243', name: 'RD Congo', flag: '🇨🇩', iso: 'cd', length: [9], example: '991234567' },
  { code: '+241', name: 'Gabon', flag: '🇬🇦', iso: 'ga', length: [7, 8], example: '06123456' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'ke', length: [9, 10], example: '712345678' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', iso: 'rw', length: [9], example: '781234567' },
  { code: '+221', name: 'Sénégal', flag: '🇸🇳', iso: 'sn', length: [9], example: '771234567' },
  { code: '+255', name: 'Tanzanie', flag: '🇹🇿', iso: 'tz', length: [9], example: '712345678' },
  { code: '+260', name: 'Zambie', flag: '🇿🇲', iso: 'zm', length: [9], example: '971234567' }
]

export default function RevealIdentityButton({ message, conversationId, onReveal }) {
  const navigate = useNavigate()
  const { success, info } = useDialog()
  const [revealPrice, setRevealPrice] = useState(250)
  const [currency, setCurrency] = useState('XAF')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2]) // Cameroun par défaut
  const [phoneNumber, setPhoneNumber] = useState('')
  const operator = 'MTN_MOMO_CMR' // Opérateur fixe
  const [initiating, setInitiating] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [lygosIsSlow, setLygosIsSlow] = useState(false)

  // Déterminer si on est dans un contexte de conversation ou de message
  const isConversationContext = !!conversationId

  useEffect(() => {
    fetchRevealPrice()
  }, [])

  // Réinitialiser le numéro de téléphone et l'erreur lors du changement de pays
  useEffect(() => {
    setPhoneNumber('')
    setPaymentError(null)
  }, [selectedCountry.code])

  const fetchRevealPrice = async () => {
    try {
      const data = await messagesService.getRevealPrice()
      if (data.success && data.data) {
        setRevealPrice(data.data.price)
        setCurrency(data.data.currency || 'XAF')
      }
    } catch (error) {
      console.error('Error fetching reveal price:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevealClick = () => {
    setShowPaymentModal(true)
    setPaymentError(null)
    setLygosIsSlow(false)
  }

  const handleInitiatePayment = async (e) => {
    e.preventDefault()

    // Validation du numéro de téléphone
    const cleanedNumber = phoneNumber.replace(/\s+/g, '')
    if (!cleanedNumber) {
      setPaymentError('Veuillez entrer un numéro de téléphone')
      return
    }

    // Validation de la longueur selon le pays sélectionné
    const isValidLength = selectedCountry.length.includes(cleanedNumber.length)
    if (!isValidLength) {
      const lengthText = selectedCountry.length.length > 1
        ? `${selectedCountry.length[0]} ou ${selectedCountry.length[1]} chiffres`
        : `${selectedCountry.length[0]} chiffres`
      setPaymentError(`Pour ${selectedCountry.name}, le numéro doit contenir ${lengthText}. Exemple: ${selectedCountry.example}`)
      return
    }

    try {
      setInitiating(true)
      setPaymentError(null)

      // Construire le numéro complet: code pays + numéro (ex: 237651234567)
      // Le backend attend le format sans le signe +
      const fullPhoneNumber = selectedCountry.code.replace('+', '') + cleanedNumber

      // Utiliser le bon service selon le contexte
      const response = isConversationContext
        ? await chatService.initiateRevealPayment(conversationId, fullPhoneNumber, operator)
        : await messagesService.initiateRevealPayment(message.id, fullPhoneNumber, operator)

      if (response.success && response.data) {
        setPaymentData(response.data)

        // Commencer à vérifier le statut du paiement
        startPaymentStatusCheck()
      } else {
        setPaymentError("Erreur lors de l'initialisation du paiement")
      }
    } catch (error) {
      console.error('Error initiating payment:', error)

      // Gérer différents types d'erreurs
      let errorMessage = "Erreur lors de l'initialisation du paiement"

      if (error.response) {
        // Erreur HTTP du serveur
        const { status, data } = error.response

        if (status === 500) {
          errorMessage = "Erreur serveur. Le service de paiement est temporairement indisponible. Veuillez réessayer dans quelques instants."
        } else if (status === 403) {
          errorMessage = data?.message || "Vous n'êtes pas autorisé à révéler cette identité. Seul le destinataire du message peut révéler l'identité de l'expéditeur."
        } else if (status === 400) {
          errorMessage = data?.message || "Données invalides. Vérifiez votre numéro de téléphone."
        } else if (status === 404) {
          errorMessage = "Service de paiement non disponible."
        } else if (status === 422) {
          // Erreurs de validation
          errorMessage = data?.message || "Erreur de validation des données."
        } else {
          errorMessage = data?.message || `Erreur ${status}: ${error.response.statusText}`
        }
      } else if (error.request) {
        // Requête envoyée mais pas de réponse
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet."
      } else {
        // Erreur lors de la configuration de la requête
        errorMessage = error.message || "Une erreur inattendue s'est produite."
      }

      setPaymentError(errorMessage)
    } finally {
      setInitiating(false)
    }
  }

  const startPaymentStatusCheck = () => {
    setCheckingPayment(true)
    setLygosIsSlow(false) // Reset au début
    let failureCount = 0
    const maxFailures = 5 // Augmenté à 5 échecs consécutifs avant d'arrêter
    let checkCount = 0

    // Vérifier le statut toutes les 8 secondes (augmenté pour éviter la surcharge)
    const interval = setInterval(async () => {
      checkCount++

      try {
        console.log(`🔍 [REVEAL] Vérification #${checkCount} du statut du paiement...`)

        // Utiliser le bon service selon le contexte
        const response = isConversationContext
          ? await chatService.checkRevealPaymentStatus(conversationId)
          : await messagesService.checkRevealPaymentStatus(message.id)

        // Reset failure count on successful API call
        failureCount = 0

        // Log détaillé pour debug
        console.log('✅ [REVEAL] Statut du paiement:', {
          success: response.success,
          status: response.data?.status,
          lygos_status: response.data?.lygos_status,
          lygos_timeout: response.data?.lygos_timeout,
          full_response: response.data
        })

        if (response.success && response.data) {
          if (response.data.status === 'revealed') {
            // Paiement réussi, identité révélée
            clearInterval(interval)
            setCheckingPayment(false)
            setShowPaymentModal(false)

            // Mettre à jour le message dans la liste
            if (onReveal) {
              await onReveal()
            }

            success('Identité révélée avec succès !')
          } else if (response.data.status === 'failed') {
            // Paiement échoué
            clearInterval(interval)
            setCheckingPayment(false)
            setPaymentError('Le paiement a échoué. Veuillez réessayer.')
          } else if (response.data.status === 'processing') {
            // Si Lygos timeout est détecté, afficher un message informatif
            if (response.data.lygos_timeout) {
              console.log('⏱️ [REVEAL] Lygos est lent, vérification continue...')
              setLygosIsSlow(true)
            }
            // Continuer de vérifier
          }
        }
      } catch (error) {
        console.error(`❌ [REVEAL] Erreur lors de la vérification #${checkCount}:`, error)

        // Gérer les erreurs de timeout spécifiquement
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
          console.warn(`⏱️ [REVEAL] Timeout lors de la vérification #${checkCount}, réessai...`)
          // Ne pas incrémenter failureCount pour les timeouts, c'est normal si Lygos est lent
          return
        }

        // Gérer les erreurs HTTP spécifiques
        if (error.response) {
          const status = error.response.status
          const data = error.response.data

          // 400 = Paiement échoué (arrêter immédiatement)
          if (status === 400 && data?.data?.status === 'failed') {
            clearInterval(interval)
            setCheckingPayment(false)
            setPaymentError(data.message || 'Le paiement a échoué. Veuillez réessayer.')
            return
          }

          // 404 = Aucun paiement trouvé (arrêter immédiatement)
          if (status === 404) {
            clearInterval(interval)
            setCheckingPayment(false)
            setPaymentError('Aucun paiement en cours trouvé. Veuillez réinitier le paiement.')
            return
          }
        }

        // Pour les autres erreurs (réseau, etc.)
        failureCount++
        console.warn(`⚠️ [REVEAL] Échec ${failureCount}/${maxFailures}`)

        // Arrêter après plusieurs échecs consécutifs
        if (failureCount >= maxFailures) {
          console.error('❌ [REVEAL] Trop d\'échecs consécutifs, arrêt de la vérification')
          clearInterval(interval)
          setCheckingPayment(false)
          setPaymentError(
            'Impossible de vérifier le statut du paiement. Utilisez le bouton "Vérifier le statut" pour réessayer.'
          )
        }
      }
    }, 8000) // Augmenté à 8 secondes pour réduire la charge

    // Arrêter après 8 minutes (60 vérifications à 8s = 480s)
    setTimeout(() => {
      clearInterval(interval)
      if (checkingPayment) {
        setCheckingPayment(false)
        setPaymentError(
          'La vérification a pris trop de temps. Utilisez le bouton "Vérifier le statut" pour réessayer.'
        )
      }
    }, 480000)
  }

  const handleManualCheck = async () => {
    try {
      setCheckingPayment(true)
      setPaymentError(null) // Réinitialiser l'erreur

      // Utiliser le bon service selon le contexte
      const response = isConversationContext
        ? await chatService.checkRevealPaymentStatus(conversationId)
        : await messagesService.checkRevealPaymentStatus(message.id)

      if (response.success && response.data) {
        if (response.data.status === 'revealed') {
          setShowPaymentModal(false)

          if (onReveal) {
            await onReveal()
          }

          success('Identité révélée avec succès !')
        } else if (response.data.status === 'failed') {
          setPaymentError('Le paiement a échoué. Veuillez réessayer.')
        } else {
          info('Paiement en cours de traitement. Veuillez patienter...')
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)

      let errorMessage = 'Erreur lors de la vérification du paiement'

      if (error.response) {
        const { status, data } = error.response

        if (status === 500) {
          errorMessage = "Erreur serveur lors de la vérification. Veuillez réessayer."
        } else if (status === 403) {
          errorMessage = data?.message || "Vous n'êtes pas autorisé à révéler cette identité. Seul le destinataire du message peut révéler l'identité de l'expéditeur."
        } else if (status === 400) {
          errorMessage = data?.message || 'Le paiement a échoué. Veuillez réessayer.'
        } else if (status === 404) {
          errorMessage = 'Aucun paiement en cours trouvé pour ce message.'
        } else {
          errorMessage = data?.message || `Erreur ${status}: ${error.response.statusText}`
        }
      } else if (error.request) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet."
      } else {
        errorMessage = error.message || "Une erreur inattendue s'est produite."
      }

      setPaymentError(errorMessage)
    } finally {
      setCheckingPayment(false)
    }
  }

  // Ne pas afficher le bouton si l'identité est déjà révélée
  if (message.is_identity_revealed) {
    return null
  }

  return (
    <>
      <button className="btn-reveal" onClick={handleRevealClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={16} />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            <Eye size={16} />
            <span>Découvrir l&apos;identité</span>
          </>
        )}
      </button>

      {showPaymentModal && (
        <div className="reveal-modal-overlay" onClick={() => !initiating && !checkingPayment && setShowPaymentModal(false)}>
          <div className="reveal-modal reveal-payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reveal-modal-header">
              <Lock size={32} className="modal-icon" />
              <h3>Payer pour découvrir l&apos;identité</h3>
            </div>

            <div className="reveal-modal-content">
              {!paymentData ? (
                <>
                  <div className="payment-info-box">
                    <CreditCard size={24} />
                    <div>
                      <strong>Montant à payer</strong>
                      <p className="price-large">{revealPrice} {currency}</p>
                    </div>
                  </div>

                  <form onSubmit={handleInitiatePayment} className="payment-form">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">
                        Numéro de téléphone
                      </label>
                      <div className="phone-input-container">
                        <select
                          className="country-selector"
                          value={selectedCountry.code}
                          onChange={(e) => {
                            const country = COUNTRIES.find(c => c.code === e.target.value)
                            setSelectedCountry(country)
                          }}
                        >
                          {COUNTRIES.map((country) => (
                            <option key={country.iso} value={country.code}>
                              {country.flag} {country.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          className="phone-number-input"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder={selectedCountry.example}
                          required
                        />
                      </div>
                      <small className="input-help">
                        Format attendu pour {selectedCountry.name}: {selectedCountry.example} ({selectedCountry.length.length > 1 ? `${selectedCountry.length[0]} ou ${selectedCountry.length[1]}` : selectedCountry.length[0]} chiffres)
                      </small>
                    </div>

                    {paymentError && (
                      <div className="payment-error">
                        <XCircle size={18} />
                        {paymentError}
                      </div>
                    )}

                    <div className="reveal-benefits">
                      <h4>Vous découvrirez :</h4>
                      <ul>
                        <li>✓ Le nom complet de l&apos;expéditeur</li>
                        <li>✓ Son nom d&apos;utilisateur</li>
                      </ul>
                    </div>

                    <div className="reveal-modal-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowPaymentModal(false)}
                        disabled={initiating}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn-confirm"
                        disabled={initiating}
                      >
                        {initiating ? (
                          <>
                            <Loader2 className="spinner" size={16} />
                            Initialisation...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            Payer {revealPrice} {currency}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="payment-status-box">
                    {paymentData.payment_link && (
                      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <a
                          href={paymentData.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-confirm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            padding: '14px 28px',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          <CreditCard size={20} />
                          Cliquez ici pour payer
                        </a>
                      </div>
                    )}

                    {checkingPayment ? (
                      <>
                        <Loader2 className="spinner payment-spinner" size={48} />
                        <h4>Vérification du paiement en cours...</h4>
                        <p>
                          {lygosIsSlow
                            ? 'La connexion avec le service de paiement est lente, veuillez patienter...'
                            : 'Une fois le paiement effectué, cette fenêtre se fermera automatiquement'}
                        </p>
                        <div className="payment-details">
                          <p><strong>Référence:</strong> {paymentData.reference}</p>
                          <p><strong>Montant:</strong> {paymentData.amount} {paymentData.currency}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="payment-icon success" size={48} />
                        <h4>Paiement initié</h4>
                        <p>Référence: {paymentData.reference}</p>
                        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                          Cliquez sur le bouton ci-dessus pour effectuer le paiement
                        </p>
                      </>
                    )}
                  </div>

                  {paymentError && (
                    <div className="payment-error">
                      <XCircle size={18} />
                      {paymentError}
                    </div>
                  )}

                  <div className="reveal-modal-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setShowPaymentModal(false)
                        setPaymentData(null)
                        setPaymentError(null)
                      }}
                      disabled={checkingPayment}
                    >
                      Fermer
                    </button>
                    {paymentError ? (
                      <button
                        className="btn-confirm"
                        onClick={() => {
                          setShowPaymentModal(false)
                          setPaymentData(null)
                          setPaymentError(null)
                          handleRevealClick()
                        }}
                      >
                        Réessayer
                      </button>
                    ) : (
                      <button
                        className="btn-confirm"
                        onClick={handleManualCheck}
                        disabled={checkingPayment}
                      >
                        {checkingPayment ? (
                          <>
                            <Loader2 className="spinner" size={16} />
                            Vérification...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Vérifier le statut
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
