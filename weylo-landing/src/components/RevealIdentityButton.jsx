import { useState, useEffect } from 'react'
import { Eye, Lock, Loader2, CreditCard } from 'lucide-react'
import settingsService from '../services/settingsService'
import { useNavigate } from 'react-router-dom'
import './RevealIdentityButton.css'

export default function RevealIdentityButton({ message, onReveal }) {
  const navigate = useNavigate()
  const [revealPrice, setRevealPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    fetchRevealPrice()
  }, [])

  const fetchRevealPrice = async () => {
    try {
      const data = await settingsService.getRevealPrice()
      setRevealPrice(data.price)
    } catch (error) {
      console.error('Error fetching reveal price:', error)
      // Valeur par défaut si l'API échoue
      setRevealPrice(500)
    } finally {
      setLoading(false)
    }
  }

  const handleRevealClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmReveal = async () => {
    try {
      setRevealing(true)
      // Appeler l'API de révélation
      await onReveal()
      setShowConfirmModal(false)
      // Afficher un message de succès
      alert('✓ Identité révélée avec succès !')
    } catch (error) {
      console.error('Error revealing identity:', error)

      // Si l'erreur indique qu'un paiement est requis (solde insuffisant)
      if (error.response?.status === 402) {
        setShowConfirmModal(false)

        const errorData = error.response.data
        const currentBalance = errorData.current_balance || 0
        const requiredAmount = errorData.price || revealPrice

        // Afficher un message avec les détails
        const confirmRedirect = window.confirm(
          `Solde insuffisant!\n\n` +
          `Solde actuel: ${currentBalance} FCFA\n` +
          `Montant requis: ${requiredAmount} FCFA\n\n` +
          `Voulez-vous recharger votre compte ?`
        )

        if (confirmRedirect) {
          // Rediriger vers la page wallet pour recharger
          navigate('/wallet', {
            state: {
              action: 'deposit',
              message: `Vous avez besoin de ${requiredAmount - currentBalance} FCFA supplémentaires pour révéler cette identité.`
            }
          })
        }
      } else {
        alert(error.response?.data?.message || 'Erreur lors de la révélation de l\'identité')
      }
    } finally {
      setRevealing(false)
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
            <span>Découvrir l'identité</span>
          </>
        )}
      </button>

      {showConfirmModal && (
        <div className="reveal-modal-overlay" onClick={() => !revealing && setShowConfirmModal(false)}>
          <div className="reveal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reveal-modal-header">
              <Lock size={32} className="modal-icon" />
              <h3>Découvrir l'identité</h3>
            </div>

            <div className="reveal-modal-content">
              <p>Voulez-vous vraiment découvrir l'identité de cette personne ?</p>

              <div className="reveal-price-info">
                <CreditCard size={20} />
                <div>
                  <strong>{revealPrice || 500} FCFA</strong>
                  <p>seront déduits de votre solde</p>
                </div>
              </div>

              <div className="reveal-benefits">
                <h4>Vous découvrirez :</h4>
                <ul>
                  <li>✓ Le nom complet de l'expéditeur</li>
                  <li>✓ Son nom d'utilisateur</li>
                  <li>✓ Sa photo de profil</li>
                </ul>
              </div>
            </div>

            <div className="reveal-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={revealing}
              >
                Annuler
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmReveal}
                disabled={revealing}
              >
                {revealing ? (
                  <>
                    <Loader2 className="spinner" size={16} />
                    Révélation...
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    Confirmer ({revealPrice || 500} FCFA)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
