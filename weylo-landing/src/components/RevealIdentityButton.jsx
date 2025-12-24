import { useState, useEffect } from 'react'
import { Eye, Lock, Loader2, CreditCard, Smartphone, CheckCircle, XCircle } from 'lucide-react'
import messagesService from '../services/messagesService'
import { useNavigate } from 'react-router-dom'
import { useDialog } from '../contexts/DialogContext'
import './RevealIdentityButton.css'

export default function RevealIdentityButton({ message, onReveal }) {
  const navigate = useNavigate()
  const { success, info } = useDialog()
  const [revealPrice, setRevealPrice] = useState(250)
  const [currency, setCurrency] = useState('XAF')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const operator = 'MTN_MOMO_CMR' // Opérateur fixe
  const [initiating, setInitiating] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  useEffect(() => {
    fetchRevealPrice()
  }, [])

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
  }

  const handleInitiatePayment = async (e) => {
    e.preventDefault()

    // Validation du numéro de téléphone
    if (!phoneNumber.match(/^237[0-9]{9}$/)) {
      setPaymentError('Le numéro doit être au format 237XXXXXXXXX')
      return
    }

    try {
      setInitiating(true)
      setPaymentError(null)

      const response = await messagesService.initiateRevealPayment(
        message.id,
        phoneNumber,
        operator
      )

      if (response.success && response.data) {
        setPaymentData(response.data)

        // Ouvrir le lien de paiement dans une nouvelle fenêtre
        if (response.data.payment_link) {
          const popup = window.open(response.data.payment_link, '_blank', 'noopener,noreferrer')

          // Vérifier si la popup a été bloquée
          if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            console.warn('⚠️ Popup bloquée par le navigateur')
            // La popup est bloquée, l'utilisateur devra cliquer manuellement sur le lien
            // On affiche quand même le message avec le lien cliquable
          }
        }

        // Commencer à vérifier le statut du paiement
        startPaymentStatusCheck()
      } else {
        setPaymentError("Erreur lors de l'initialisation du paiement")
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      setPaymentError(
        error.response?.data?.message ||
        "Erreur lors de l'initialisation du paiement"
      )
    } finally {
      setInitiating(false)
    }
  }

  const startPaymentStatusCheck = () => {
    setCheckingPayment(true)
    let failureCount = 0
    const maxFailures = 3 // Arrêter après 3 échecs consécutifs

    // Vérifier le statut toutes les 5 secondes (augmenté pour réduire la charge)
    const interval = setInterval(async () => {
      try {
        const response = await messagesService.checkRevealPaymentStatus(message.id)

        // Reset failure count on successful API call
        failureCount = 0

        // Log détaillé pour debug
        console.log('🔍 [REVEAL] Statut du paiement:', {
          success: response.success,
          status: response.data?.status,
          lygos_status: response.data?.lygos_status,
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
          }
          // Si status = 'processing', on continue de vérifier
        }
      } catch (error) {
        console.error('Error checking payment status:', error)

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

        // Pour les autres erreurs (timeout, réseau, etc.)
        failureCount++

        // Arrêter après plusieurs échecs consécutifs
        if (failureCount >= maxFailures) {
          console.error('Too many failures, stopping status check')
          clearInterval(interval)
          setCheckingPayment(false)
          setPaymentError(
            'Impossible de vérifier le statut du paiement. Utilisez le bouton "Vérifier le statut" pour réessayer.'
          )
        }
      }
    }, 5000) // Augmenté à 5 secondes

    // Arrêter après 5 minutes (60 vérifications)
    setTimeout(() => {
      clearInterval(interval)
      if (checkingPayment) {
        setCheckingPayment(false)
        setPaymentError(
          'La vérification a pris trop de temps. Utilisez le bouton "Vérifier le statut" pour réessayer.'
        )
      }
    }, 300000)
  }

  const handleManualCheck = async () => {
    try {
      setCheckingPayment(true)
      setPaymentError(null) // Réinitialiser l'erreur

      const response = await messagesService.checkRevealPaymentStatus(message.id)

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

      // Gérer les erreurs HTTP spécifiques
      if (error.response) {
        const status = error.response.status
        const data = error.response.data

        // 400 = Paiement échoué
        if (status === 400) {
          setPaymentError(data?.message || 'Le paiement a échoué. Veuillez réessayer.')
          return
        }

        // 404 = Aucun paiement trouvé
        if (status === 404) {
          setPaymentError('Aucun paiement en cours trouvé pour ce message.')
          return
        }
      }

      // Erreur générique
      setPaymentError(
        error.response?.data?.message ||
        'Erreur lors de la vérification du paiement'
      )
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
                        <span className="label-hint">(Format: 237XXXXXXXXX)</span>
                      </label>
                      <div className="phone-input-wrapper">
                        <Smartphone size={20} className="input-icon" />
                        <input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="237651234567"
                          className="form-input"
                          pattern="237[0-9]{9}"
                          required
                        />
                      </div>
                      <small className="input-help">
                        Le paiement sera débité de ce numéro
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
                    {checkingPayment ? (
                      <>
                        <Loader2 className="spinner payment-spinner" size={48} />
                        <h4>Paiement en cours...</h4>
                        <p>Veuillez compléter le paiement sur votre téléphone</p>
                        <div className="payment-details">
                          <p><strong>Référence:</strong> {paymentData.reference}</p>
                          <p><strong>Montant:</strong> {paymentData.amount} {paymentData.currency}</p>
                        </div>

                        {paymentData.payment_link && (
                          <div style={{ marginTop: '20px' }}>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                              Si la page de paiement ne s&apos;est pas ouverte:
                            </p>
                            <a
                              href={paymentData.payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-confirm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                textDecoration: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px'
                              }}
                            >
                              <CreditCard size={16} />
                              Cliquez ici pour payer
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="payment-icon success" size={48} />
                        <h4>Paiement initié</h4>
                        <p>Référence: {paymentData.reference}</p>
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
