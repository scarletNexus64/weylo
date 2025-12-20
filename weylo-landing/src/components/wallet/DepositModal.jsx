import React, { useState } from 'react'
import { X, Loader2, ArrowRight } from 'lucide-react'
import cinetpayService from '../../services/cinetpay.service'
import { useNavigate } from 'react-router-dom'

/**
 * Modal pour effectuer un dépôt via CinetPay
 * Réplique exacte du système Formaneo
 */
const DepositModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Montants rapides
  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000]

  const handleQuickAmount = (value) => {
    setAmount(value.toString())
    setError('')
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Garder uniquement les chiffres
    setAmount(value)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation du montant
    const numericAmount = parseInt(amount)
    const validation = cinetpayService.validateAmount(numericAmount)

    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setIsProcessing(true)

    try {
      console.log('💳 [DEPOSIT_MODAL] Initiation du dépôt...')

      // Formater le numéro de téléphone si fourni
      const formattedPhone = phoneNumber.trim()
        ? cinetpayService.formatPhoneNumber(phoneNumber)
        : null

      // Étape 1: Initier le paiement
      const response = await cinetpayService.initiateDeposit(numericAmount, formattedPhone)

      // Étape 2: Sauvegarder l'ID de transaction dans localStorage
      localStorage.setItem('deposit_transaction_id', response.transaction_id)

      console.log('✅ [DEPOSIT_MODAL] Transaction créée:', {
        transaction_id: response.transaction_id,
        has_payment_url: !!response.payment_url
      })

      // Étape 3: Ouvrir l'URL de paiement CinetPay
      await cinetpayService.openPaymentUrl(response.payment_url)

      // Étape 4: Rediriger vers la page de vérification après 1 seconde
      setTimeout(() => {
        navigate('/wallet/deposit/return')
        onClose() // Fermer la modal
      }, 1000)

    } catch (err) {
      console.error('❌ [DEPOSIT_MODAL] Erreur:', err)
      setError(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement')
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('')
      setPhoneNumber('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Recharger mon compte
          </h2>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Montants rapides
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickAmount(value)}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    amount === value.toString()
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isProcessing}
                >
                  {value.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant personnalisé (FCFA)
            </label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Ex: 5000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isProcessing}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Minimum: 100 FCFA
            </p>
          </div>

          {/* Phone number (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 699999999"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-2">
              Pour Mobile Money
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!amount || isProcessing}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Initialisation...</span>
              </>
            ) : (
              <>
                <span>Continuer</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Paiement sécurisé par <span className="font-semibold">CinetPay</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DepositModal
