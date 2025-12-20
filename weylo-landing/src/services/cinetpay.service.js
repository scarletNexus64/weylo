import apiClient from './apiClient'

/**
 * Service CinetPay pour les dépôts de fonds
 * Réplique exacte du système Formaneo
 */
class CinetPayService {
  /**
   * Initier un dépôt via CinetPay
   * @param {number} amount - Montant à déposer
   * @param {string} phoneNumber - Numéro de téléphone (optionnel)
   * @returns {Promise<{transaction_id: string, payment_url: string, payment_token: string}>}
   */
  async initiateDeposit(amount, phoneNumber = null) {
    try {
      const payload = { amount: parseInt(amount) }

      if (phoneNumber && phoneNumber.trim()) {
        payload.phone_number = phoneNumber
      }

      console.log('💳 [CINETPAY] Initiation du dépôt:', payload)

      const response = await apiClient.post('/cinetpay/deposit/initiate', payload)

      console.log('✅ [CINETPAY] Dépôt initié avec succès:', {
        transaction_id: response.data.transaction_id,
        has_payment_url: !!response.data.payment_url
      })

      return response.data
    } catch (error) {
      console.error('❌ [CINETPAY] Erreur lors de l\'initiation du dépôt:', error)
      throw error
    }
  }

  /**
   * Vérifier le statut d'une transaction CinetPay
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<{success: boolean, status: string, message: string}>}
   */
  async checkTransactionStatus(transactionId) {
    try {
      console.log(`🔍 [CINETPAY] Vérification du statut de la transaction: ${transactionId}`)

      const response = await apiClient.post('/cinetpay/check-status', {
        transaction_id: transactionId
      })

      console.log('📊 [CINETPAY] Statut de la transaction:', response.data)

      return response.data
    } catch (error) {
      console.error('❌ [CINETPAY] Erreur lors de la vérification du statut:', error)

      // Retourner un status pending en cas d'erreur pour continuer le polling
      return {
        success: false,
        status: 'pending',
        message: 'Vérification en cours...'
      }
    }
  }

  /**
   * Ouvrir l'URL de paiement CinetPay
   * Tente d'ouvrir dans un nouvel onglet, sinon redirige
   * @param {string} paymentUrl - URL de paiement CinetPay
   */
  async openPaymentUrl(paymentUrl) {
    try {
      console.log('🌐 [CINETPAY] Ouverture de l\'URL de paiement...')

      // Tenter d'ouvrir dans un nouvel onglet
      const newTab = window.open(paymentUrl, '_blank')

      if (!newTab) {
        // Si le popup est bloqué, rediriger dans la fenêtre actuelle
        console.warn('⚠️ [CINETPAY] Popup bloqué, redirection directe...')
        window.location.href = paymentUrl
      } else {
        console.log('✅ [CINETPAY] Paiement ouvert dans un nouvel onglet')
      }
    } catch (error) {
      console.error('❌ [CINETPAY] Erreur lors de l\'ouverture de l\'URL:', error)
      // Fallback: redirection directe
      window.location.href = paymentUrl
    }
  }

  /**
   * Formater un numéro de téléphone pour CinetPay
   * @param {string} phone - Numéro de téléphone
   * @returns {string} - Numéro formaté avec +237
   */
  formatPhoneNumber(phone) {
    if (!phone) return '+237600000000'

    // Enlever tous les espaces et caractères spéciaux
    let cleaned = phone.replace(/\D/g, '')

    // Ajouter le préfixe 237 si absent
    if (!cleaned.startsWith('237')) {
      cleaned = '237' + cleaned
    }

    // Ajouter le +
    return '+' + cleaned
  }

  /**
   * Valider un montant pour CinetPay
   * @param {number} amount - Montant à valider
   * @returns {{valid: boolean, error?: string}}
   */
  validateAmount(amount) {
    const numAmount = parseInt(amount)

    if (isNaN(numAmount)) {
      return { valid: false, error: 'Montant invalide' }
    }

    if (numAmount < 100) {
      return { valid: false, error: 'Le montant minimum est de 100 FCFA' }
    }

    if (numAmount > 10000000) {
      return { valid: false, error: 'Le montant maximum est de 10,000,000 FCFA' }
    }

    return { valid: true }
  }
}

// Export singleton
const cinetpayService = new CinetPayService()
export default cinetpayService
