import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react'
import useDepositStatus from '../hooks/useDepositStatus'
import walletService from '../services/walletService'
import { useAuth } from '../contexts/AuthContext'

/**
 * Page de retour après paiement CinetPay
 * Réplique exacte du système Formaneo (ActivationReturnPage)
 */
const PaymentReturnPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [walletInfo, setWalletInfo] = useState(null)
  const { refreshUser } = useAuth()

  // Récupérer l'ID de transaction depuis l'URL ou localStorage
  const transactionIdFromUrl = searchParams.get('transaction_id')
  const transactionIdFromStorage = localStorage.getItem('deposit_transaction_id')
  const transactionId = transactionIdFromUrl || transactionIdFromStorage

  // Utiliser le hook de polling (comme Formaneo)
  const depositStatus = useDepositStatus({
    transactionId,
    onSuccess: async () => {
      // Nettoyer le localStorage
      localStorage.removeItem('deposit_transaction_id')

      // Recharger les infos du wallet
      try {
        const info = await walletService.getWalletInfo()
        setWalletInfo(info)

        // 🔥 FIX: Rafraîchir le user context pour mettre à jour wallet_balance et is_premium
        await refreshUser()
      } catch (error) {
        console.error('Erreur lors du rechargement du wallet:', error)
      }

      // Rediriger vers le wallet après 3 secondes
      setTimeout(() => {
        navigate('/wallet')
      }, 3000)
    },
    onFailure: () => {
      // Nettoyer le localStorage
      localStorage.removeItem('deposit_transaction_id')
    }
  })

  useEffect(() => {
    // Rediriger si pas d'ID de transaction
    if (!transactionId) {
      console.warn('⚠️ Aucun ID de transaction trouvé, redirection...')
      navigate('/wallet')
      return
    }

    console.log('🔄 [PAYMENT_RETURN] Page de retour chargée', {
      transactionId,
      fromUrl: transactionIdFromUrl,
      fromStorage: transactionIdFromStorage
    })
  }, [transactionId, navigate, transactionIdFromUrl, transactionIdFromStorage])

  // UI de chargement
  if (depositStatus.isLoading && depositStatus.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <Loader2 size={64} className="animate-spin text-purple-600 mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vérification du paiement
          </h1>

          <p className="text-gray-600 mb-6">
            Nous vérifions votre paiement auprès de CinetPay...
          </p>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-700">
              <span className="font-semibold">Tentative {depositStatus.checkCount}</span> sur 200
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Cela peut prendre quelques instants
            </p>
          </div>

          {depositStatus.checkCount > 30 && (
            <p className="text-xs text-gray-500 mt-4">
              Si le paiement a été effectué, il sera crédité dans quelques minutes
            </p>
          )}
        </div>
      </div>
    )
  }

  // UI de succès
  if (depositStatus.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle size={64} className="text-green-500 mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Dépôt réussi !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre compte a été crédité avec succès.
          </p>

          {depositStatus.amount && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                <span className="font-semibold text-lg">
                  {depositStatus.amount.toLocaleString()} FCFA
                </span>
                <br />
                ajoutés à votre compte
              </p>
            </div>
          )}

          {walletInfo && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-700">
                Nouveau solde:{' '}
                <span className="font-bold text-lg">
                  {walletInfo.balance.toLocaleString()} FCFA
                </span>
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Redirection automatique vers votre wallet...
          </p>

          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Home size={20} />
            <span>Retour au wallet</span>
          </button>
        </div>
      </div>
    )
  }

  // UI d'échec
  if (depositStatus.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <XCircle size={64} className="text-red-500 mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ❌ Paiement échoué
          </h1>

          <p className="text-gray-600 mb-6">
            {depositStatus.error || 'Le paiement n\'a pas pu être complété.'}
          </p>

          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              Aucun montant n'a été débité de votre compte.
            </p>
          </div>

          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Home size={20} />
            <span>Retour au wallet</span>
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default PaymentReturnPage
