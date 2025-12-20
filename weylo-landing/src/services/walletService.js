import apiClient from './apiClient'

/**
 * Service pour gérer les opérations wallet
 */
const walletService = {
  /**
   * Récupérer les informations du wallet
   */
  async getWalletInfo() {
    try {
      const response = await apiClient.get('/wallet')
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getWalletInfo:', error)
      throw error
    }
  },

  /**
   * Récupérer les statistiques du wallet
   */
  async getStats() {
    try {
      const response = await apiClient.get('/wallet/stats')
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getStats:', error)
      throw error
    }
  },

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactions(filters = {}) {
    try {
      const response = await apiClient.get('/wallet/transactions', {
        params: {
          per_page: filters.perPage || 20,
          type: filters.type,
          from: filters.from,
          to: filters.to
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getTransactions:', error)
      throw error
    }
  },

  /**
   * Récupérer les méthodes de retrait disponibles
   */
  async getWithdrawalMethods() {
    try {
      const response = await apiClient.get('/wallet/withdrawal-methods')
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getWithdrawalMethods:', error)
      throw error
    }
  },

  /**
   * Initier un dépôt
   */
  async initiateDeposit(amount, provider = 'cinetpay') {
    try {
      const response = await apiClient.post('/wallet/deposit', {
        amount: parseInt(amount),
        provider
      })
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur initiateDeposit:', error)
      throw error
    }
  },

  /**
   * Vérifier le statut d'un dépôt
   */
  async checkDepositStatus(reference) {
    try {
      const response = await apiClient.get(`/wallet/deposit/status/${reference}`)
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur checkDepositStatus:', error)
      throw error
    }
  },

  /**
   * Initier un retrait via CinetPay (validation manuelle admin)
   */
  async initiateWithdrawal(amount, phoneNumber, operator = 'MTN') {
    try {
      console.log('💸 [WALLET_SERVICE] Initiation retrait CinetPay:', { amount, phoneNumber, operator })
      const response = await apiClient.post('/cinetpay/withdrawal/initiate', {
        amount: parseInt(amount),
        phone_number: phoneNumber,
        operator: operator.toUpperCase() // MTN, ORANGE, MOOV
      })
      console.log('✅ [WALLET_SERVICE] Retrait initié avec succès:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur initiateWithdrawal:', error)
      throw error
    }
  },

  /**
   * Vérifier le statut d'un retrait
   */
  async checkWithdrawalStatus(transactionId) {
    try {
      const response = await apiClient.post('/cinetpay/withdrawal/status', {
        transaction_id: transactionId
      })
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur checkWithdrawalStatus:', error)
      throw error
    }
  },

  /**
   * Récupérer la liste des demandes de retrait
   */
  async getWithdrawals(status = null) {
    try {
      const response = await apiClient.get('/wallet/withdrawals', {
        params: { status }
      })
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getWithdrawals:', error)
      throw error
    }
  },

  /**
   * Récupérer le détail d'une demande de retrait
   */
  async getWithdrawalDetails(withdrawalId) {
    try {
      const response = await apiClient.get(`/wallet/withdrawals/${withdrawalId}`)
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur getWithdrawalDetails:', error)
      throw error
    }
  },

  /**
   * Annuler une demande de retrait (si encore en attente)
   */
  async cancelWithdrawal(withdrawalId) {
    try {
      const response = await apiClient.delete(`/wallet/withdrawals/${withdrawalId}`)
      return response.data
    } catch (error) {
      console.error('❌ [WALLET_SERVICE] Erreur cancelWithdrawal:', error)
      throw error
    }
  },

  /**
   * Formater un montant en FCFA
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' FCFA'
  },

  /**
   * Formater un numéro de téléphone camerounais
   */
  formatPhoneNumber(phone) {
    // Enlever tous les espaces et caractères spéciaux
    let cleaned = phone.replace(/\D/g, '')

    // Ajouter le préfixe 237 si absent
    if (!cleaned.startsWith('237')) {
      cleaned = '237' + cleaned
    }

    return cleaned
  },

  /**
   * Valider un montant
   */
  validateAmount(amount, min = 100, max = 10000000) {
    const numAmount = parseInt(amount)

    if (isNaN(numAmount)) {
      return { valid: false, error: 'Montant invalide' }
    }

    if (numAmount < min) {
      return { valid: false, error: `Le montant minimum est de ${min} FCFA` }
    }

    if (numAmount > max) {
      return { valid: false, error: `Le montant maximum est de ${max} FCFA` }
    }

    if (numAmount % 5 !== 0) {
      return { valid: false, error: 'Le montant doit être un multiple de 5 FCFA' }
    }

    return { valid: true }
  }
}

export default walletService
